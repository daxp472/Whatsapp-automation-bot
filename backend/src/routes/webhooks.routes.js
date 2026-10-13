import express from 'express';
import { getDb } from '../config/db.js';
import { logger } from '../utils/logger.js';
import { verifyWebhookChallenge } from '../services/kapso.service.js';
import { processInboundMessage } from '../services/message-processor.service.js';

const router = express.Router();

// Webhook GET challenge verification (required by Meta/Kapso Webhook setup)
router.get('/kapso', (req, res) => {
  const challenge = verifyWebhookChallenge(req.query);
  if (challenge) {
    logger.info('[Webhook] Webhook challenge verified successfully');
    return res.status(200).send(challenge);
  }
  logger.warn('[Webhook] Verification token mismatch or missing mode');
  return res.status(403).send('Forbidden');
});

// Webhook POST incoming message/status receiver
router.post('/kapso', async (req, res) => {
  // Acknowledge quickly to avoid provider timeout retries
  res.status(200).json({ success: true, message: 'EVENT_RECEIVED' });

  try {
    const payload = req.body;
    const db = getDb();

    // Log webhook payload
    await db.collection('webhookEvents').insertOne({
      provider: 'kapso',
      payload,
      receivedAt: new Date(),
      status: 'received'
    });

    // Extract Meta/Kapso format
    // Standard format: payload.entry[0].changes[0].value.messages[0]
    const entry = payload?.entry?.[0];
    const change = entry?.changes?.[0]?.value;

    if (!change) {
      logger.info('[Webhook] Event received with no message changes');
      return;
    }

    // Status updates (delivered, read, failed)
    if (change.statuses && change.statuses.length > 0) {
      const statusEvent = change.statuses[0];
      const messageId = statusEvent.id;
      const status = statusEvent.status; // 'sent' | 'delivered' | 'read' | 'failed'

      logger.info('[Webhook] Status update received', { messageId, status });
      await db.collection('messages').updateOne(
        { providerMessageId: messageId },
        { $set: { status, updatedAt: new Date() } }
      );
      return;
    }

    // Inbound messages
    if (change.messages && change.messages.length > 0) {
      const msg = change.messages[0];
      const senderPhone = msg.from;
      const text = msg.text?.body || (msg.interactive?.button_reply?.title) || '';
      const providerMsgId = msg.id;
      const contactProfile = change.contacts?.[0]?.profile?.name || senderPhone;

      // Associate with workspace (for multi-tenant demo, match by phone ID or use first workspace)
      const workspace = await db.collection('workspaces').findOne({});
      if (!workspace) {
        logger.error('[Webhook] No active workspace configured in system.');
        return;
      }

      await processInboundMessage({
        workspaceId: workspace._id.toString(),
        senderPhoneNumber: senderPhone,
        senderName: contactProfile,
        messageText: text,
        source: 'whatsapp',
        providerMessageId: providerMsgId
      });
    }
  } catch (error) {
    logger.error('[Webhook] Error processing incoming Kapso event', { error: error.message });
  }
});

export default router;
