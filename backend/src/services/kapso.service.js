import axios from 'axios';
import { WhatsAppClient } from '@kapso/whatsapp-cloud-api';
import { logger } from '../utils/logger.js';
import dotenv from 'dotenv';
dotenv.config();

const KAPSO_PLATFORM_URL = 'https://app.kapso.ai/api/v1';
const KAPSO_PROXY_URL = 'https://api.kapso.ai/meta/whatsapp';

export async function sendKapsoWhatsAppMessage({ to, text }) {
  const apiKey = process.env.KAPSO_API_KEY;
  const phoneNumberId = process.env.KAPSO_PHONE_NUMBER_ID || '597907523413541';

  if (!apiKey) {
    logger.warn('[Kapso] Credentials not configured in .env. Outbound message skipped in demo mode.');
    return {
      success: false,
      simulated: true,
      messageId: `mock_kapso_${Date.now()}`,
      status: 'simulated_no_credentials',
      reason: 'KAPSO_API_KEY not set in backend .env'
    };
  }

  const cleanPhone = to.replace(/[^\d+]/g, '');

  // 1. Attempt send via official @kapso/whatsapp-cloud-api client
  try {
    const client = new WhatsAppClient({
      baseUrl: KAPSO_PROXY_URL,
      kapsoApiKey: apiKey
    });

    const res = await client.messages.sendText({
      phoneNumberId,
      to: cleanPhone,
      body: text
    });

    const messageId = res?.messages?.[0]?.id || `kapso_${Date.now()}`;
    logger.info('[Kapso SDK] WhatsApp message sent successfully', { messageId, to: cleanPhone });
    return {
      success: true,
      messageId,
      status: 'sent',
      data: res
    };
  } catch (sdkError) {
    logger.warn('[Kapso SDK] Direct SDK send notice, trying direct proxy dispatch', { error: sdkError.message });

    // 2. Direct HTTP proxy dispatch fallback
    try {
      const response = await axios.post(
        `${KAPSO_PROXY_URL}/v21.0/${phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanPhone,
          type: 'text',
          text: { preview_url: false, body: text }
        },
        {
          headers: {
            'X-API-Key': apiKey,
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      const messageId = response.data?.messages?.[0]?.id || `kapso_${Date.now()}`;
      return {
        success: true,
        messageId,
        status: 'sent',
        data: response.data
      };
    } catch (httpError) {
      const errorDetail = httpError.response?.data?.error?.message || httpError.response?.data?.error || httpError.message;
      logger.error('[Kapso] Dispatch error', { error: errorDetail, to: cleanPhone });
      return {
        success: false,
        error: errorDetail,
        status: 'failed',
        failureReason: errorDetail
      };
    }
  }
}

export async function testKapsoConnection() {
  const apiKey = process.env.KAPSO_API_KEY;

  if (!apiKey) {
    return {
      connected: false,
      configured: false,
      message: 'KAPSO_API_KEY is not configured in .env'
    };
  }

  try {
    // Query project details from Kapso Platform API
    const [projectRes, configRes] = await Promise.allSettled([
      axios.get(`${KAPSO_PLATFORM_URL}/projects`, {
        headers: { 'X-API-Key': apiKey },
        timeout: 8000
      }),
      axios.get(`${KAPSO_PLATFORM_URL}/whatsapp_configs`, {
        headers: { 'X-API-Key': apiKey },
        timeout: 8000
      })
    ]);

    if (projectRes.status === 'fulfilled' && projectRes.value.status === 200) {
      const project = projectRes.value.data?.data;
      const configs = configRes.status === 'fulfilled' ? configRes.value.data?.data : [];
      const primaryConfig = configs?.[0];

      return {
        connected: true,
        configured: true,
        projectName: project?.name || 'WhatsApp Project',
        plan: project?.current_plan?.display_tier || 'Free',
        monthlyQuota: project?.current_plan?.messages_per_month || 2000,
        phoneNumberId: primaryConfig?.phone_number_id || process.env.KAPSO_PHONE_NUMBER_ID || '597907523413541',
        displayName: primaryConfig?.display_name || 'Sandbox WhatsApp',
        status: 'active',
        message: `Connected to Kapso project "${project?.name}". Plan: ${project?.current_plan?.display_tier} (${project?.current_plan?.messages_per_month} msgs/mo)`
      };
    }

    throw new Error('Could not authenticate with Kapso projects endpoint');
  } catch (err) {
    const errorMsg = err.response?.data?.error || err.message;
    return {
      connected: false,
      configured: true,
      error: errorMsg,
      message: `Failed to connect with Kapso: ${errorMsg}`
    };
  }
}

export function verifyWebhookChallenge(query) {
  const mode = query['hub.mode'];
  const token = query['hub.verify_token'];
  const challenge = query['hub.challenge'];
  const secret = process.env.KAPSO_WEBHOOK_SECRET;

  if (mode === 'subscribe' && (!secret || token === secret)) {
    return challenge;
  }
  return null;
}
