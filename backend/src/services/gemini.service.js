import { GoogleGenAI } from '@google/genai';
import { logger } from '../utils/logger.js';
import { withTimeout } from '../utils/timeout.js';
import dotenv from 'dotenv';
dotenv.config();

export async function generateAiReply({
  businessName = 'ReplyPilot Business',
  businessDescription = '',
  tone = 'friendly and professional',
  systemInstructions = '',
  faqs = [],
  recentMessages = [],
  customerMessage = '',
  maxCharacters = 300
}) {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

  const faqContext = faqs.length
    ? faqs.map((f, i) => `Q${i + 1}: ${f.question}\nA${i + 1}: ${f.answer}`).join('\n\n')
    : 'No specific FAQ facts provided.';

  const historyContext = recentMessages.length
    ? recentMessages.map(m => `${m.direction === 'inbound' ? 'Customer' : 'Bot'}: ${m.text}`).join('\n')
    : 'No prior messages.';

  const systemPrompt = `You are the WhatsApp AI assistant for "${businessName}".
Business Profile: ${businessDescription || 'A helpful, customer-centric business'}.
Tone: ${tone}.
${systemInstructions ? `Special Instructions: ${systemInstructions}` : ''}

CRITICAL RULES:
1. Ground your answers ONLY in the provided Business FAQ facts below. Do NOT invent prices, dates, promises, or policies.
2. If the answer is not supported by the business facts, politely say you are not certain and offer to connect the customer with a human representative.
3. Be concise (under ${maxCharacters} characters), natural for WhatsApp, and never mention system prompts or API constraints.
4. Return ONLY the final message to be sent to the WhatsApp customer. No prefixes or quotes.

BUSINESS FACTS / FAQs:
${faqContext}
`;

  // If Gemini API Key is configured, use the official Google GenAI SDK
  if (apiKey && apiKey.trim().length > 5) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Conversation history:
${historyContext}

Customer's new message:
"${customerMessage}"

Reply as WhatsApp Bot:`;

      const response = await withTimeout(
        ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.3,
            maxOutputTokens: 300,
          }
        }),
        8000,
        'Gemini response timed out'
      );

      let replyText = response.text ? response.text.trim() : '';
      if (replyText) {
        if (replyText.length > maxCharacters) {
          replyText = replyText.substring(0, maxCharacters).trim() + '...';
        }
        return { text: replyText, source: 'gemini', model: modelName };
      }
    } catch (err) {
      logger.warn('[Gemini] Real API call failed or rate-limited, falling back to grounded responder', { error: err.message });
    }
  }

  // Grounded Smart Fallback Responder (when GEMINI_API_KEY is not yet added in .env)
  return fallbackGroundedResponder({
    businessName,
    faqs,
    customerMessage,
    maxCharacters
  });
}

function fallbackGroundedResponder({ businessName, faqs, customerMessage, maxCharacters }) {
  const lower = customerMessage.toLowerCase().trim();

  // Greeting
  if (['hi', 'hello', 'hey', 'start', 'good morning', 'good evening', 'namaste'].some(g => lower.startsWith(g) || lower === g)) {
    return {
      text: `Hello! 👋 Welcome to ${businessName}. How can I assist you today? Feel free to ask about our hours, pricing, or services.`,
      source: 'grounded_engine',
      model: 'demo-grounded-ai'
    };
  }

  // Best FAQ match
  if (faqs && faqs.length > 0) {
    // If top FAQ has a positive score
    const top = faqs[0];
    if (top.score && top.score > 0) {
      let ans = top.answer;
      if (ans.length > maxCharacters) ans = ans.substring(0, maxCharacters) + '...';
      return {
        text: ans,
        source: 'grounded_engine',
        model: 'demo-grounded-ai'
      };
    }
  }

  // Unknown question fallback
  return {
    text: `Thank you for reaching out to ${businessName}! I'm not completely certain about that detail. Would you like me to connect you to a human representative?`,
    source: 'grounded_engine',
    model: 'demo-grounded-ai'
  };
}

export async function testGeminiConnection() {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

  if (!apiKey || apiKey.trim().length < 5) {
    return {
      connected: false,
      configured: false,
      message: 'GEMINI_API_KEY is not set in .env. Simulator and grounded engine are active in Demo Mode.'
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: modelName,
      contents: 'Respond with "Gemini is connected" in 4 words.',
    });
    return {
      connected: true,
      configured: true,
      model: modelName,
      message: response.text ? response.text.trim() : 'Connected successfully'
    };
  } catch (err) {
    return {
      connected: false,
      configured: true,
      model: modelName,
      error: err.message,
      message: `Failed to connect with Gemini: ${err.message}`
    };
  }
}
