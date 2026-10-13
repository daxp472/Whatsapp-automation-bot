import express from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';
import { processInboundMessage } from '../services/message-processor.service.js';
import { sendKapsoWhatsAppMessage } from '../services/kapso.service.js';

const router = express.Router();
router.use(authMiddleware);

// List conversations
router.get('/', async (req, res) => {
  try {
    const { status, mode, search } = req.query;
    const db = getDb();
    const query = { workspaceId: req.workspaceId.toString() };

    if (status && status !== 'all') {
      query.status = status;
    }
    if (mode && mode !== 'all') {
      query.mode = mode;
    }

    const conversations = await db.collection('conversations')
      .find(query)
      .sort({ lastMessageAt: -1 })
      .toArray();

    // Populate contact and latest message preview
    const populated = await Promise.all(
      conversations.map(async (conv) => {
        let contact = null;
        if (conv.contactId && ObjectId.isValid(conv.contactId)) {
          contact = await db.collection('contacts').findOne({ _id: new ObjectId(conv.contactId) });
        }
        const lastMsg = await db.collection('messages')
          .find({ conversationId: conv._id.toString() })
          .sort({ createdAt: -1 })
          .limit(1)
          .toArray();

        return {
          ...conv,
          contact: contact || { displayName: 'Unknown', phoneNumber: 'N/A' },
          lastMessage: lastMsg[0] || null
        };
      })
    );

    // If search applied, filter by contact name or phone
    let results = populated;
    if (search) {
      const s = search.toLowerCase();
      results = populated.filter(c =>
        c.contact?.displayName?.toLowerCase().includes(s) ||
        c.contact?.phoneNumber?.includes(s)
      );
    }

    return res.json({ success: true, data: results });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// Single conversation
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    const conv = await db.collection('conversations').findOne({
      _id: new ObjectId(id),
      workspaceId: req.workspaceId.toString()
    });

    if (!conv) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Conversation not found' } });
    }

    let contact = null;
    if (conv.contactId && ObjectId.isValid(conv.contactId)) {
      contact = await db.collection('contacts').findOne({ _id: new ObjectId(conv.contactId) });
    }

    return res.json({ success: true, data: { ...conv, contact } });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// Message history
router.get('/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    // Reset unread count when messages are viewed
    await db.collection('conversations').updateOne(
      { _id: new ObjectId(id) },
      { $set: { unreadCount: 0 } }
    );

    const messages = await db.collection('messages')
      .find({
        conversationId: id,
        workspaceId: req.workspaceId.toString()
      })
      .sort({ createdAt: 1 })
      .toArray();

    return res.json({ success: true, data: messages });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// Update conversation (toggle mode: ai/human or status: open/resolved/needs_attention)
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { mode, status } = req.body;
    const db = getDb();

    const updateFields = { updatedAt: new Date() };
    if (mode) updateFields.mode = mode;
    if (status) updateFields.status = status;

    await db.collection('conversations').updateOne(
      { _id: new ObjectId(id), workspaceId: req.workspaceId.toString() },
      { $set: updateFields }
    );

    const updated = await db.collection('conversations').findOne({ _id: new ObjectId(id) });
    return res.json({ success: true, message: 'Conversation updated', data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// Manual reply from operator
router.post('/:id/reply', async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Message text required' } });
    }

    const db = getDb();
    const conv = await db.collection('conversations').findOne({
      _id: new ObjectId(id),
      workspaceId: req.workspaceId.toString()
    });

    if (!conv) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Conversation not found' } });
    }

    const contact = await db.collection('contacts').findOne({ _id: new ObjectId(conv.contactId) });

    const outboundDoc = {
      workspaceId: req.workspaceId.toString(),
      conversationId: id,
      contactId: conv.contactId,
      providerMessageId: `manual_${Date.now()}`,
      direction: 'outbound',
      source: conv.source || 'simulator',
      senderType: 'operator',
      messageType: 'text',
      text: text.trim(),
      status: conv.source === 'whatsapp' ? 'processing' : 'simulated',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const insert = await db.collection('messages').insertOne(outboundDoc);
    const savedMsg = { _id: insert.insertedId, ...outboundDoc };

    // If source is WhatsApp, send through Kapso
    if (conv.source === 'whatsapp' && contact?.phoneNumber) {
      const sendRes = await sendKapsoWhatsAppMessage({
        to: contact.phoneNumber,
        text: text.trim()
      });
      const st = sendRes.success ? 'sent' : 'failed';
      await db.collection('messages').updateOne(
        { _id: savedMsg._id },
        { $set: { status: st, failureReason: sendRes.failureReason || null } }
      );
      savedMsg.status = st;
    }

    await db.collection('conversations').updateOne(
      { _id: new ObjectId(id) },
      { $set: { lastMessageAt: new Date(), updatedAt: new Date() } }
    );

    return res.json({ success: true, message: 'Message sent', data: savedMsg });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// Simulator: Send inbound test message through the central pipeline
router.post('/simulate', async (req, res) => {
  try {
    const { phoneNumber, senderName } = req.body;
    const text = req.body.text || req.body.messageText;
    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Message text is required' }
      });
    }

    const result = await processInboundMessage({
      workspaceId: req.workspaceId.toString(),
      senderPhoneNumber: phoneNumber || '+15550198234',
      senderName: senderName || 'Simulator Tester',
      messageText: text.trim(),
      source: 'simulator'
    });

    return res.json({
      success: true,
      message: 'Simulated message processed via Gemini engine',
      data: result
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

export default router;
