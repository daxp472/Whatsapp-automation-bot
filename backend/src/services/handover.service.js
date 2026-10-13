import { ObjectId } from 'mongodb';
import { GoogleGenAI } from '@google/genai';
import { getDb } from '../config/db.js';
import { logger } from '../utils/logger.js';
import { withTimeout } from '../utils/timeout.js';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Human Handover Service
 * Generates an 11-point actionable context summary and suggested reply using Gemini 3.8 Flash.
 * Guarantees persistence in MongoDB even if AI service encounters an error.
 */

export async function createHandoverRecord({
  workspaceId,
  conversationId,
  contactId,
  handoverReason = 'Customer requested human agent',
  triggerMessageText = '',
  recentMessages = []
}) {
  const db = getDb();
  const wsIdStr = workspaceId.toString();
  const convIdStr = conversationId.toString();
  const contactIdStr = contactId.toString();

  // Check if an open/pending handover already exists for this conversation to prevent duplicate records
  const existingHandover = await db.collection('handovers').findOne({
    workspaceId: wsIdStr,
    conversationId: convIdStr,
    status: 'pending_review'
  });

  // Get contact details for lead categorization
  const contact = await db.collection('contacts').findOne({
    _id: ObjectId.isValid(contactIdStr) ? new ObjectId(contactIdStr) : contactIdStr
  });

  const leadCategory = contact?.lead?.category || 'Unqualified';

  // Generate structured summary with Gemini
  let aiSummary = await generateSummaryWithGemini({
    triggerMessageText,
    recentMessages,
    handoverReason,
    leadCategory,
    contactName: contact?.displayName || 'Customer'
  });

  // Fallback summary if Gemini fails
  if (!aiSummary) {
    aiSummary = buildFallbackSummary({
      triggerMessageText,
      recentMessages,
      handoverReason,
      leadCategory,
      contactName: contact?.displayName || 'Customer'
    });
  }

  const handoverDoc = {
    workspaceId: wsIdStr,
    conversationId: convIdStr,
    contactId: contactIdStr,
    status: 'pending_review',
    handoverReason,
    customerObjective: aiSummary.customerObjective,
    conversationSummary: aiSummary.conversationSummary,
    customerRequirements: aiSummary.customerRequirements,
    previousResponses: aiSummary.previousResponses,
    commitments: aiSummary.commitments,
    unresolvedQuestions: aiSummary.unresolvedQuestions,
    sentiment: aiSummary.sentiment,
    leadCategory: aiSummary.leadCategory || leadCategory,
    suggestedResponse: aiSummary.suggestedResponse,
    cautions: aiSummary.cautions,
    triggerMessage: triggerMessageText,
    isAiGenerated: aiSummary.isAiGenerated !== false,
    handoverAt: new Date(),
    reviewedAt: null,
    resolvedAt: null,
    aiResumedAt: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  let handoverId;
  if (existingHandover) {
    await db.collection('handovers').updateOne(
      { _id: existingHandover._id },
      { $set: { ...handoverDoc, updatedAt: new Date() } }
    );
    handoverId = existingHandover._id;
  } else {
    const res = await db.collection('handovers').insertOne(handoverDoc);
    handoverId = res.insertedId;
  }

  // Ensure conversation status is marked needs_attention & mode is human
  await db.collection('conversations').updateOne(
    { _id: ObjectId.isValid(convIdStr) ? new ObjectId(convIdStr) : convIdStr },
    { $set: { mode: 'human', status: 'needs_attention', updatedAt: new Date() } }
  );

  logger.info('[Handover] Handover summary created', {
    handoverId: handoverId.toString(),
    conversationId: convIdStr,
    reason: handoverReason
  });

  return { _id: handoverId, ...handoverDoc };
}

/**
 * Gemini Context Summarizer
 */
async function generateSummaryWithGemini({
  triggerMessageText,
  recentMessages = [],
  handoverReason,
  leadCategory,
  contactName
}) {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

  if (!apiKey || apiKey.trim().length < 5) return null;

  try {
    const timelineText = recentMessages
      .map(m => `[${m.direction === 'inbound' ? contactName : 'Bot'}]: ${m.text}`)
      .join('\n');

    const prompt = `You are a Customer Support Supervisor AI.
A customer conversation requires Human Handover.
Summarize the conversation and prepare a draft response for the human agent.
Your summary must take 15-30 seconds to review: concise, factual, and actionable.

CRITICAL RULES:
1. Do NOT fabricate promises, discounts, or commitments that were not made.
2. If budget, timeline, or requirements are unknown, state "Not specified".
3. Formulate a natural, polite suggestedResponse that addresses the customer's exact issue.
4. Sentiment must be an object with "label": "Positive" | "Neutral" | "Negative" and a brief "explanation".

Conversation Timeline:
${timelineText || `[${contactName}]: ${triggerMessageText}`}

Trigger Message:
"${triggerMessageText}"

Handover Reason:
"${handoverReason}"

Return ONLY a valid JSON object matching this schema (no markdown backticks):
{
  "customerObjective": "What the customer wants in 1 sentence",
  "conversationSummary": "2-3 sentences summarizing the conversation history",
  "customerRequirements": "Specific needs, preferences, budget, timeline, or 'Not specified'",
  "previousResponses": "What the bot has already explained to them",
  "commitments": "Any confirmed promises or 'No commitments made'",
  "unresolvedQuestions": "What still needs to be answered",
  "sentiment": {
    "label": "Positive" | "Neutral" | "Negative",
    "explanation": "1 short sentence why"
  },
  "leadCategory": "Hot" | "Warm" | "Cold" | "Unqualified",
  "suggestedResponse": "Professional draft reply for the human reviewer to approve",
  "cautions": "Missing details or things the reviewer must be careful about"
}`;

    const ai = new GoogleGenAI({ apiKey });
    const response = await withTimeout(
      ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          temperature: 0.2,
          maxOutputTokens: 600
        }
      }),
      8000,
      'Gemini Handover Summary'
    );

    const text = response.text ? response.text.trim() : '';
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    return {
      ...parsed,
      isAiGenerated: true
    };
  } catch (err) {
    logger.warn('[Handover] Gemini generation failed, using fallback summary', { error: err.message });
    return null;
  }
}

/**
 * Deterministic Fallback Summary when Gemini is unavailable
 */
function buildFallbackSummary({
  triggerMessageText,
  recentMessages = [],
  handoverReason,
  leadCategory,
  contactName
}) {
  const lastCustomerMsgs = recentMessages.filter(m => m.direction === 'inbound').map(m => m.text);
  const lastBotMsgs = recentMessages.filter(m => m.direction === 'outbound').map(m => m.text);

  return {
    customerObjective: `Customer requested assistance: "${triggerMessageText.slice(0, 80)}"`,
    conversationSummary: `Conversation contains ${recentMessages.length} message(s). Customer triggered human assistance.`,
    customerRequirements: triggerMessageText,
    previousResponses: lastBotMsgs.length ? lastBotMsgs[lastBotMsgs.length - 1] : 'Automated welcome message',
    commitments: 'No special commitments made.',
    unresolvedQuestions: triggerMessageText,
    sentiment: {
      label: triggerMessageText.toLowerCase().includes('complaint') ? 'Negative' : 'Neutral',
      explanation: 'Evaluated from trigger context.'
    },
    leadCategory: leadCategory || 'Warm',
    suggestedResponse: `Hello ${contactName}! This is our support team. I have taken over this chat and I'm reviewing your message: "${triggerMessageText.slice(0, 60)}". How can I assist you right now?`,
    cautions: 'Please review the customer inquiry carefully before confirming order or policy commitments.',
    isAiGenerated: false
  };
}
