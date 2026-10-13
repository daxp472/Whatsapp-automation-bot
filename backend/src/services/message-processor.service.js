import { ObjectId } from 'mongodb';
import { getDb } from '../config/db.js';
import { logger } from '../utils/logger.js';
import { generateAiReply } from './gemini.service.js';
import { sendKapsoWhatsAppMessage } from './kapso.service.js';
import { getRelevantFaqs } from './faq.service.js';
import { checkAndDeductQuota } from './quota.service.js';
import { qualifyLead } from './lead-qualification.service.js';
import { createHandoverRecord } from './handover.service.js';

export async function processInboundMessage({
  workspaceId,
  senderPhoneNumber,
  senderName = 'WhatsApp Customer',
  messageText,
  source = 'simulator', // 'whatsapp' | 'simulator'
  providerMessageId = null,
  providerEventId = null
}) {
  const db = getDb();
  const wsIdStr = workspaceId.toString();

  // 1. Deduplication check
  if (providerMessageId) {
    const existing = await db.collection('messages').findOne({ providerMessageId });
    if (existing) {
      logger.warn('[MessageProcessor] Duplicate inbound message ignored', { providerMessageId });
      return { duplicate: true, messageId: existing._id };
    }
  }

  // 2. Find or create Contact
  const cleanPhone = senderPhoneNumber.replace(/[^\d+]/g, '');
  let contact = await db.collection('contacts').findOne({
    workspaceId: wsIdStr,
    phoneNumber: cleanPhone
  });

  if (!contact) {
    const contactDoc = {
      workspaceId: wsIdStr,
      phoneNumber: cleanPhone,
      displayName: senderName || cleanPhone,
      source,
      consentStatus: 'opted-in',
      lastMessageAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const res = await db.collection('contacts').insertOne(contactDoc);
    contact = { _id: res.insertedId, ...contactDoc };
  } else {
    await db.collection('contacts').updateOne(
      { _id: contact._id },
      { $set: { lastMessageAt: new Date(), displayName: senderName || contact.displayName, updatedAt: new Date() } }
    );
  }

  // 3. Find or create Conversation
  let conversation = await db.collection('conversations').findOne({
    workspaceId: wsIdStr,
    contactId: contact._id.toString()
  });

  if (!conversation) {
    const convDoc = {
      workspaceId: wsIdStr,
      contactId: contact._id.toString(),
      status: 'open',
      mode: 'ai', // 'ai' | 'human'
      source,
      lastMessageAt: new Date(),
      unreadCount: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const res = await db.collection('conversations').insertOne(convDoc);
    conversation = { _id: res.insertedId, ...convDoc };
  } else {
    await db.collection('conversations').updateOne(
      { _id: conversation._id },
      {
        $set: { lastMessageAt: new Date(), updatedAt: new Date() },
        $inc: { unreadCount: 1 }
      }
    );
  }

  // 4. Save Inbound Message
  const inboundMsgDoc = {
    workspaceId: wsIdStr,
    conversationId: conversation._id.toString(),
    contactId: contact._id.toString(),
    providerMessageId: providerMessageId || `${source}_in_${Date.now()}`,
    providerEventId,
    direction: 'inbound',
    source,
    senderType: 'customer',
    messageType: 'text',
    text: messageText,
    status: 'received',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  const inboundInsert = await db.collection('messages').insertOne(inboundMsgDoc);
  const inboundMessage = { _id: inboundInsert.insertedId, ...inboundMsgDoc };

  // Fetch recent messages for context
  const recentMessages = await db.collection('messages')
    .find({ conversationId: conversation._id.toString() })
    .sort({ createdAt: -1 })
    .limit(10)
    .toArray();
  recentMessages.reverse();

  // 5. Automatic Lead Qualification (Feature 1)
  try {
    qualifyLead({
      workspaceId: wsIdStr,
      contactId: contact._id.toString(),
      conversationId: conversation._id.toString(),
      messageId: inboundMessage._id.toString(),
      latestMessageText: messageText,
      recentMessages,
      currentLead: contact.lead
    }).catch(err => logger.warn('[LeadQualification] Background qualification notice', { error: err.message }));
  } catch (leadErr) {
    logger.warn('[LeadQualification] Error triggering lead qualification', { error: leadErr.message });
  }

  // 6. Fetch Bot Settings
  let botSettings = await db.collection('botSettings').findOne({ workspaceId: wsIdStr });
  if (!botSettings) {
    botSettings = {
      workspaceId: wsIdStr,
      enabled: true,
      businessName: 'My WhatsApp Business',
      businessDescription: 'Customer support and inquiries',
      tone: 'Friendly and professional',
      language: 'en',
      fallbackReply: "Sorry, I couldn't understand that. A team member will assist you shortly.",
      handoffKeywords: ['human', 'agent', 'support', 'person', 'operator', 'talk to human'],
      maxReplyCharacters: 350
    };
  }

  // 7. Check if Bot is Paused
  if (botSettings.enabled === false) {
    logger.info('[MessageProcessor] Bot is paused by admin. Skipping automatic AI reply.');
    await db.collection('conversations').updateOne(
      { _id: conversation._id },
      { $set: { status: 'needs_attention' } }
    );
    return {
      inboundMessage,
      conversation,
      contact,
      botAction: 'skipped_bot_paused'
    };
  }

  // 8. Check if Conversation is in Human Takeover mode
  if (conversation.mode === 'human') {
    logger.info('[MessageProcessor] Conversation is under Human Takeover. Skipping AI reply.');
    return {
      inboundMessage,
      conversation,
      contact,
      botAction: 'skipped_human_takeover'
    };
  }

  // 9. Check Human Handoff / Complaint Triggers (Feature 2)
  const normalizedText = messageText.toLowerCase().trim();
  const handoffKeywords = (botSettings.handoffKeywords || ['human', 'agent', 'person', 'support'])
    .map(k => k.toLowerCase().trim());
  const complaintKeywords = ['complaint', 'cheat', 'scam', 'fraud', 'terrible', 'worst', 'angry', 'lawyer', 'issue', 'bad service'];

  const isExplicitHandoff = handoffKeywords.some(keyword =>
    normalizedText.includes(keyword) || normalizedText === keyword
  );
  const isComplaint = complaintKeywords.some(keyword =>
    normalizedText.includes(keyword)
  );

  if (isExplicitHandoff || isComplaint) {
    const handoverReason = isComplaint
      ? 'Customer raised a complaint requiring human attention'
      : 'Customer explicitly requested a human agent';

    logger.info('[MessageProcessor] Handover trigger activated', { reason: handoverReason, text: messageText });

    // Switch conversation to human mode immediately
    await db.collection('conversations').updateOne(
      { _id: conversation._id },
      { $set: { mode: 'human', status: 'needs_attention', updatedAt: new Date() } }
    );
    conversation.mode = 'human';
    conversation.status = 'needs_attention';

    // Generate AI Context Summary & Suggested Reply (Feature 2)
    const handoverRecord = await createHandoverRecord({
      workspaceId: wsIdStr,
      conversationId: conversation._id.toString(),
      contactId: contact._id.toString(),
      handoverReason,
      triggerMessageText: messageText,
      recentMessages
    });

    const handoffText = "I've paused automated responses and notified our human support team. An agent is reviewing your chat and will respond shortly! 👤";
    const outboundMsg = await saveAndDispatchReply({
      db,
      wsIdStr,
      conversation,
      contact,
      source,
      cleanPhone,
      text: handoffText,
      senderType: 'system'
    });

    return {
      inboundMessage,
      outboundMessage: outboundMsg,
      conversation,
      contact,
      botAction: 'human_handoff_triggered',
      handover: handoverRecord
    };
  }

  // 10. Check Free Quota (100 free messages/mo)
  const quotaCheck = await checkAndDeductQuota(wsIdStr);
  if (!quotaCheck.allowed) {
    logger.warn('[MessageProcessor] Workspace free message quota exhausted.', { workspaceId: wsIdStr });
    const quotaExceededText = "This bot has reached its free monthly message quota (100 messages). Please contact the business administrator.";
    const outboundMsg = await saveAndDispatchReply({
      db,
      wsIdStr,
      conversation,
      contact,
      source,
      cleanPhone,
      text: quotaExceededText,
      senderType: 'system',
      status: 'quota_exhausted'
    });
    return {
      inboundMessage,
      outboundMessage: outboundMsg,
      conversation,
      contact,
      quotaExhausted: true
    };
  }

  // 11. Fetch Grounded FAQs and Knowledge Context
  const relevantFaqs = await getRelevantFaqs(wsIdStr, messageText, 8);

  // 12. Call Gemini Service
  const aiResult = await generateAiReply({
    businessName: botSettings.businessName,
    businessDescription: botSettings.businessDescription,
    tone: botSettings.tone,
    systemInstructions: botSettings.systemInstructions,
    faqs: relevantFaqs,
    recentMessages,
    customerMessage: messageText,
    maxCharacters: botSettings.maxReplyCharacters || 350
  });

  const replyText = aiResult.text || botSettings.fallbackReply;

  // 13. Save & Dispatch Outbound Message
  const outboundMessage = await saveAndDispatchReply({
    db,
    wsIdStr,
    conversation,
    contact,
    source,
    cleanPhone,
    text: replyText,
    senderType: 'ai'
  });

  return {
    inboundMessage,
    outboundMessage,
    conversation,
    contact,
    aiModel: aiResult.model,
    aiSource: aiResult.source,
    quota: quotaCheck
  };
}

async function saveAndDispatchReply({
  db,
  wsIdStr,
  conversation,
  contact,
  source,
  cleanPhone,
  text,
  senderType = 'ai',
  status = 'pending'
}) {
  const outboundDoc = {
    workspaceId: wsIdStr,
    conversationId: conversation._id.toString(),
    contactId: contact._id.toString(),
    providerMessageId: `${source}_out_${Date.now()}`,
    direction: 'outbound',
    source,
    senderType,
    messageType: 'text',
    text,
    status: source === 'simulator' ? 'simulated' : 'processing',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const insert = await db.collection('messages').insertOne(outboundDoc);
  const outboundMessage = { _id: insert.insertedId, ...outboundDoc };

  // Dispatch to Kapso if source is live WhatsApp
  if (source === 'whatsapp') {
    const dispatchRes = await sendKapsoWhatsAppMessage({
      to: cleanPhone,
      text
    });

    const updatedStatus = dispatchRes.success ? 'sent' : 'failed';
    await db.collection('messages').updateOne(
      { _id: outboundMessage._id },
      {
        $set: {
          status: updatedStatus,
          providerMessageId: dispatchRes.messageId || outboundMessage.providerMessageId,
          failureReason: dispatchRes.failureReason || null,
          updatedAt: new Date()
        }
      }
    );
    outboundMessage.status = updatedStatus;
  }

  // Update conversation's lastMessageAt
  await db.collection('conversations').updateOne(
    { _id: conversation._id },
    { $set: { lastMessageAt: new Date(), updatedAt: new Date() } }
  );

  return outboundMessage;
}
