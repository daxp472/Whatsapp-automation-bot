import { ObjectId } from 'mongodb';
import { GoogleGenAI } from '@google/genai';
import { getDb } from '../config/db.js';
import { logger } from '../utils/logger.js';
import { withTimeout } from '../utils/timeout.js';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Lead Qualification Service
 * Classifies WhatsApp inbound messages into Hot, Warm, Cold, or Unqualified.
 * Follows strict grounding: never fabricates budget, timeline, or missing details.
 */

export async function qualifyLead({
  workspaceId,
  contactId,
  conversationId,
  messageId,
  latestMessageText,
  recentMessages = [],
  currentLead = null
}) {
  const db = getDb();
  const wsIdStr = workspaceId.toString();

  // If latest message is very short or just greeting, deterministic early return to avoid wasting Gemini quota
  const trimmed = latestMessageText.toLowerCase().trim();
  const greetings = ['hi', 'hello', 'hey', 'start', 'good morning', 'good afternoon', 'good evening', 'namaste'];
  const isOnlyGreeting = greetings.includes(trimmed);

  let leadData = null;

  if (isOnlyGreeting && (!currentLead || currentLead.category === 'Unqualified')) {
    leadData = {
      category: 'Unqualified',
      score: 5,
      purchaseIntent: 'None',
      requirements: 'Initial greeting without explicit requirement',
      productInterest: null,
      budget: null,
      timeline: null,
      reason: 'Customer initiated with a greeting only; no purchase intent or requirement expressed yet.'
    };
  } else {
    // Attempt Gemini structured lead analysis
    leadData = await evaluateWithGemini({
      latestMessageText,
      recentMessages,
      currentLead
    });

    // Fallback to deterministic scoring if Gemini fails
    if (!leadData) {
      leadData = evaluateWithRules({
        latestMessageText,
        recentMessages,
        currentLead
      });
    }
  }

  // Ensure strict scoring consistency
  leadData.score = calculateScore(leadData);
  leadData.category = determineCategory(leadData.score);
  leadData.lastQualifiedAt = new Date();

  // Check if contact has manual override
  const contact = await db.collection('contacts').findOne({
    _id: ObjectId.isValid(contactId) ? new ObjectId(contactId) : contactId
  });

  const hasManualOverride = contact?.lead?.isManualOverride === true;

  // If manual override is active, keep manual category/score on contact but record new AI assessment in history
  const updatedLeadDoc = hasManualOverride
    ? {
        ...leadData,
        category: contact.lead.category,
        score: contact.lead.score,
        isManualOverride: true,
        lastQualifiedAt: new Date()
      }
    : {
        ...leadData,
        isManualOverride: false
      };

  // Update contact
  await db.collection('contacts').updateOne(
    { _id: contact._id },
    {
      $set: {
        lead: updatedLeadDoc,
        updatedAt: new Date()
      }
    }
  );

  // Record qualification audit entry in leadHistory
  await db.collection('leadHistory').insertOne({
    workspaceId: wsIdStr,
    contactId: contact._id.toString(),
    conversationId: conversationId ? conversationId.toString() : null,
    messageId: messageId ? messageId.toString() : null,
    ...leadData,
    wasOverriddenByManual: hasManualOverride,
    createdAt: new Date()
  });

  logger.info('[LeadQualification] Lead evaluated', {
    contactId: contact._id.toString(),
    category: updatedLeadDoc.category,
    score: updatedLeadDoc.score
  });

  return updatedLeadDoc;
}

/**
 * Calculates score (0 - 100) based on verified factors:
 * - Purchase intent: High (40), Medium (25), Low (10), None (0)
 * - Specific requirement/product interest: 20
 * - Explicit budget stated: 20
 * - Explicit timeline stated: 20
 */
export function calculateScore({ purchaseIntent, requirements, productInterest, budget, timeline }) {
  let score = 0;

  switch (purchaseIntent) {
    case 'High': score += 40; break;
    case 'Medium': score += 25; break;
    case 'Low': score += 10; break;
    default: score += 0; break;
  }

  if (requirements && requirements.trim().length > 3 && requirements !== 'None' && requirements !== 'Initial greeting without explicit requirement') {
    score += 15;
  }
  if (productInterest && productInterest.trim().length > 2) {
    score += 5;
  }

  if (budget && budget.trim().length > 0 && budget !== 'Not stated') {
    score += 20;
  }

  if (timeline && timeline.trim().length > 0 && timeline !== 'Not stated') {
    score += 20;
  }

  return Math.min(100, Math.max(0, score));
}

export function determineCategory(score) {
  if (score >= 75) return 'Hot';
  if (score >= 45) return 'Warm';
  if (score >= 20) return 'Cold';
  return 'Unqualified';
}

/**
 * Gemini Extraction with strict JSON output
 */
async function evaluateWithGemini({ latestMessageText, recentMessages = [], currentLead }) {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

  if (!apiKey || apiKey.trim().length < 5) return null;

  try {
    const historyText = recentMessages
      .map(m => `${m.direction === 'inbound' ? 'Customer' : 'Bot'}: ${m.text}`)
      .join('\n');

    const prompt = `You are a strict CRM Sales Lead Qualification specialist.
Analyze this WhatsApp conversation and extract lead qualification details.

CRITICAL RULES:
1. Extract budget ONLY if explicitly stated (e.g. "₹5,000", "$500"). If not mentioned, set budget to null. NEVER fabricate a budget.
2. Extract timeline ONLY if explicitly stated (e.g. "this week", "immediately", "tomorrow"). If not mentioned, set timeline to null. NEVER fabricate a timeline.
3. Classify purchaseIntent strictly as one of: "High", "Medium", "Low", "None".
4. High intent means: "I want to buy/enroll/order/purchase now/this week".
5. Medium intent means: "How much does it cost?", "Can you send quote/details?".
6. Low intent means: vague interest, general browsing.
7. None means: greetings ("hi", "hello"), complaints, unrelated topics.

Recent Conversation:
${historyText || 'No prior context.'}

Latest Customer Message:
"${latestMessageText}"

Respond ONLY with a JSON object in this exact schema, without markdown backticks or commentary:
{
  "purchaseIntent": "High" | "Medium" | "Low" | "None",
  "requirements": "brief description of what customer needs or null",
  "productInterest": "specific product/service named or null",
  "budget": "explicit budget string or null",
  "timeline": "explicit timeline string or null",
  "reason": "1-2 sentence explanation of classification"
}`;

    const ai = new GoogleGenAI({ apiKey });
    const response = await withTimeout(
      ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          temperature: 0.1,
          maxOutputTokens: 250
        }
      }),
      7000,
      'Lead qualification analysis timed out'
    );

    const text = response.text ? response.text.trim() : '';
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    return {
      purchaseIntent: parsed.purchaseIntent || 'None',
      requirements: parsed.requirements || null,
      productInterest: parsed.productInterest || null,
      budget: parsed.budget || null,
      timeline: parsed.timeline || null,
      reason: parsed.reason || 'Lead evaluated from conversation context.'
    };
  } catch (err) {
    logger.warn('[LeadQualification] Gemini analysis notice, falling back to rule evaluator', { error: err.message });
    return null;
  }
}

/**
 * Deterministic Rule-Based Evaluator Fallback
 */
function evaluateWithRules({ latestMessageText, recentMessages = [], currentLead }) {
  const text = latestMessageText;
  const lower = text.toLowerCase();

  // Check explicit budget (e.g., ₹5000, 5000 inr, $500, 500 usd, budget is ...)
  let budget = null;
  const budgetMatch = text.match(/(?:₹|\$|rs\.?|inr|usd|budget(?:\s+is)?)\s*[:=]?\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]+)?(?:\s*(?:k|lakh|thousand))?)/i);
  if (budgetMatch) {
    budget = budgetMatch[0].trim();
  }

  // Check explicit timeline
  let timeline = null;
  const timelineKeywords = ['this week', 'immediately', 'today', 'tomorrow', 'asap', 'next week', 'urgent', 'this month', 'by monday', 'by friday'];
  for (const tk of timelineKeywords) {
    if (lower.includes(tk)) {
      timeline = tk;
      break;
    }
  }

  // Check intent
  let purchaseIntent = 'None';
  let requirements = null;
  let reason = '';

  const highIntentWords = ['buy', 'purchase', 'join', 'enroll', 'book now', 'order', 'want to get', 'sign up'];
  const mediumIntentWords = ['price', 'pricing', 'cost', 'quotation', 'quote', 'how much', 'fees', 'curriculum', 'available', 'menu'];

  const hasHigh = highIntentWords.some(w => lower.includes(w));
  const hasMed = mediumIntentWords.some(w => lower.includes(w));

  if (hasHigh) {
    purchaseIntent = 'High';
    requirements = text;
    reason = timeline && budget
      ? 'Customer has a clear purchase requirement, stated budget, and defined timeline.'
      : 'Customer expressed direct purchase or booking intent.';
  } else if (hasMed) {
    purchaseIntent = 'Medium';
    requirements = text;
    reason = 'Customer inquired about pricing, fees, or service details.';
  } else if (lower.length > 20) {
    purchaseIntent = 'Low';
    requirements = text;
    reason = 'Customer engaged with specific questions or inquiry.';
  } else {
    purchaseIntent = 'None';
    reason = 'Customer provided basic greeting or insufficient business requirement details.';
  }

  return {
    purchaseIntent,
    requirements: requirements || currentLead?.requirements || null,
    productInterest: currentLead?.productInterest || null,
    budget: budget || currentLead?.budget || null,
    timeline: timeline || currentLead?.timeline || null,
    reason
  };
}
