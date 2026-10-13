import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { testGeminiConnection } from '../services/gemini.service.js';
import { testKapsoConnection } from '../services/kapso.service.js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();
router.use(authMiddleware);

router.get('/status', async (req, res) => {
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 5);
  const kapsoApiKeyConfigured = Boolean(process.env.KAPSO_API_KEY && process.env.KAPSO_API_KEY.trim().length > 5);
  const kapsoPhoneConfigured = Boolean(process.env.KAPSO_PHONE_NUMBER_ID && process.env.KAPSO_PHONE_NUMBER_ID.trim().length > 3);
  const webhookSecretConfigured = Boolean(process.env.KAPSO_WEBHOOK_SECRET);

  const publicApiUrl = process.env.PUBLIC_API_URL || 'http://localhost:4000';
  const webhookUrl = `${publicApiUrl}/api/v1/webhooks/kapso`;

  return res.json({
    success: true,
    data: {
      gemini: {
        configured: geminiConfigured,
        model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
        mode: geminiConfigured ? 'live_api' : 'grounded_demo_engine'
      },
      kapso: {
        configured: kapsoApiKeyConfigured && kapsoPhoneConfigured,
        hasApiKey: kapsoApiKeyConfigured,
        hasPhoneNumberId: kapsoPhoneConfigured,
        hasWebhookSecret: webhookSecretConfigured,
        phoneNumberIdMasked: kapsoPhoneConfigured ? '••••' + process.env.KAPSO_PHONE_NUMBER_ID.slice(-4) : null,
        mode: (kapsoApiKeyConfigured && kapsoPhoneConfigured) ? 'connected' : 'sandbox_unconfigured'
      },
      mongodb: {
        status: 'connected',
        database: process.env.MONGODB_DB_NAME || 'replypilot'
      },
      webhook: {
        url: webhookUrl,
        verifyToken: process.env.KAPSO_WEBHOOK_SECRET || 'replypilot_webhook_secret_2026',
        instructions: 'Paste this URL and Token into your Kapso or WhatsApp Cloud Webhook dashboard settings.'
      }
    }
  });
});

router.post('/gemini/test', async (req, res) => {
  const result = await testGeminiConnection();
  return res.json({ success: result.connected, data: result });
});

router.post('/kapso/test', async (req, res) => {
  const result = await testKapsoConnection();
  return res.json({ success: result.connected, data: result });
});

export default router;
