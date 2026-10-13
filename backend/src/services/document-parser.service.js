import { createRequire } from 'module';
import axios from 'axios';
import { GoogleGenAI } from '@google/genai';
import { logger } from '../utils/logger.js';
import { withTimeout } from '../utils/timeout.js';
import dotenv from 'dotenv';
dotenv.config();

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

/**
 * Extract clean readable text from a PDF Buffer
 */
export async function extractTextFromPdf(buffer) {
  try {
    const data = await pdfParse(buffer);
    const text = data.text ? data.text.trim() : '';
    if (!text) {
      throw new Error('PDF file contains no readable text or is image-only.');
    }
    return sanitizeExtractedText(text);
  } catch (err) {
    logger.error('[DocParser] PDF parse error', { error: err.message });
    throw new Error(`Failed to extract text from PDF: ${err.message}`);
  }
}

/**
 * Extract clean text from a public Website URL
 */
export async function extractTextFromUrl(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ReplyPilotKnowledgeImporter/1.0'
      },
      timeout: 12000,
      maxContentLength: 10 * 1024 * 1024 // 10MB limit
    });

    const html = response.data;
    if (typeof html !== 'string') {
      throw new Error('Received non-HTML response from URL');
    }

    // Strip scripts, styles, comments, and HTML tags
    let cleanText = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText || cleanText.length < 50) {
      throw new Error('Could not extract meaningful text from website content.');
    }

    return sanitizeExtractedText(cleanText);
  } catch (err) {
    logger.error('[DocParser] URL extraction error', { error: err.message, url });
    throw new Error(`Failed to fetch website content: ${err.message}`);
  }
}

/**
 * Sanitizes extracted text and caps it to reasonable bounds for LLM context
 */
export function sanitizeExtractedText(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Generates suggested FAQs from extracted document text using Gemini 3.8
 */
export async function generateFaqsFromText({ text, documentTitle = 'Imported Document', maxFaqs = 6 }) {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

  if (!apiKey || apiKey.trim().length < 5) {
    // Deterministic fallback if API key not available
    return generateFallbackFaqs(text, documentTitle);
  }

  try {
    // Truncate to reasonable context window (e.g. ~12,000 chars)
    const contextChunk = text.slice(0, 12000);

    const prompt = `You are a Knowledge Base Specialist.
Read the following business text from "${documentTitle}" and extract up to ${maxFaqs} essential Frequently Asked Questions (FAQs) that customers would ask on WhatsApp.

RULES:
1. Ground answers strictly in the text. Do NOT invent prices, policies, or hours not mentioned.
2. Formulate clear, concise customer questions.
3. Formulate clear, accurate, conversational WhatsApp answers.
4. Assign an appropriate category: "General", "Pricing", "Services", "Policies", "Support", or "Hours".
5. Return ONLY a JSON array of objects without markdown backticks:
[
  {
    "question": "Clear customer question",
    "answer": "Accurate grounded answer",
    "category": "Category name",
    "sourceSnippet": "Short quote from the text that proves this fact"
  }
]

DOCUMENT CONTENT:
${contextChunk}`;

    const ai = new GoogleGenAI({ apiKey });
    const response = await withTimeout(
      ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          temperature: 0.2,
          maxOutputTokens: 1200
        }
      }),
      9000,
      'Gemini FAQ Generation'
    );

    const responseText = response.text ? response.text.trim() : '';
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const faqs = JSON.parse(cleanJson);

    if (Array.isArray(faqs) && faqs.length > 0) {
      return faqs;
    }
    return generateFallbackFaqs(text, documentTitle);
  } catch (err) {
    logger.warn('[DocParser] Gemini FAQ generation notice, using fallback', { error: err.message });
    return generateFallbackFaqs(text, documentTitle);
  }
}

/**
 * Fallback FAQ generation when LLM is offline or busy
 */
function generateFallbackFaqs(text, documentTitle) {
  const lines = text.split('\n').filter(l => l.trim().length > 30);
  const faqs = [];

  for (let i = 0; i < Math.min(lines.length, 4); i++) {
    const line = lines[i].trim();
    faqs.push({
      question: `What information is available regarding ${documentTitle} (Topic ${i + 1})?`,
      answer: line.slice(0, 280),
      category: 'General',
      sourceSnippet: line.slice(0, 100)
    });
  }

  if (faqs.length === 0) {
    faqs.push({
      question: `What are the details of ${documentTitle}?`,
      answer: text.slice(0, 250),
      category: 'General',
      sourceSnippet: text.slice(0, 80)
    });
  }

  return faqs;
}
