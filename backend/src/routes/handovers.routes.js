import express from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';
import { sendKapsoWhatsAppMessage } from '../services/kapso.service.js';
import { createHandoverRecord } from '../services/handover.service.js';

const router = express.Router();
router.use(authMiddleware);

// List handovers
router.get('/', async (req, res) => {
  try {
    const { status = 'all' } = req.query;
    const db = getDb();
    const query = { workspaceId: req.workspaceId.toString() };

    if (status !== 'all') {
      query.status = status;
    }

    const handovers = await db.collection('handovers')
      .find(query)
      .sort({ handoverAt: -1 })
      .toArray();

    // Populate contacts
    const populated = await Promise.all(
      handovers.map(async (h) => {
        let contact = null;
        if (h.contactId && ObjectId.isValid(h.contactId)) {
          contact = await db.collection('contacts').findOne({ _id: new ObjectId(h.contactId) });
        }
        return {
          ...h,
          contact: contact || { displayName: 'Customer', phoneNumber: 'N/A' }
        };
      })
    );

    return res.json({ success: true, data: populated });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// Stats summary
router.get('/stats', async (req, res) => {
  try {
    const db = getDb();
    const wsIdStr = req.workspaceId.toString();

    const [pending, reviewed, resolved, total] = await Promise.all([
      db.collection('handovers').countDocuments({ workspaceId: wsIdStr, status: 'pending_review' }),
      db.collection('handovers').countDocuments({ workspaceId: wsIdStr, status: 'reviewed' }),
      db.collection('handovers').countDocuments({ workspaceId: wsIdStr, status: 'resolved' }),
      db.collection('handovers').countDocuments({ workspaceId: wsIdStr })
    ]);

    return res.json({
      success: true,
      data: { pending, reviewed, resolved, total }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// Single handover detail with conversation timeline
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const handover = await db.collection('handovers').findOne({
      _id: new ObjectId(id),
      workspaceId: req.workspaceId.toString()
    });

    if (!handover) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Handover record not found' } });
    }

    let contact = null;
    if (handover.contactId && ObjectId.isValid(handover.contactId)) {
      contact = await db.collection('contacts').findOne({ _id: new ObjectId(handover.contactId) });
    }

    const messages = await db.collection('messages')
      .find({ conversationId: handover.conversationId })
      .sort({ createdAt: 1 })
      .toArray();

    return res.json({
      success: true,
      data: {
        ...handover,
        contact,
        messages
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// Approve & dispatch suggested reply
router.post('/:id/approve-reply', async (req, res) => {
  try {
    const { id } = req.params;
    const replyText = req.body.replyText || req.body.text;

    if (!replyText || !replyText.trim()) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Reply text cannot be empty' } });
    }

    const db = getDb();
    const handover = await db.collection('handovers').findOne({
      _id: new ObjectId(id),
      workspaceId: req.workspaceId.toString()
    });

    if (!handover) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Handover record not found' } });
    }

    const contact = await db.collection('contacts').findOne({
      _id: new ObjectId(handover.contactId)
    });

    const conversation = await db.collection('conversations').findOne({
      _id: new ObjectId(handover.conversationId)
    });

    const source = conversation?.source || 'simulator';

    // Save outbound operator message
    const outboundMsgDoc = {
      workspaceId: req.workspaceId.toString(),
      conversationId: handover.conversationId,
      contactId: handover.contactId,
      providerMessageId: `operator_review_${Date.now()}`,
      direction: 'outbound',
      source,
      senderType: 'operator',
      messageType: 'text',
      text: replyText.trim(),
      status: source === 'whatsapp' ? 'processing' : 'simulated',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const insert = await db.collection('messages').insertOne(outboundMsgDoc);
    const savedMsg = { _id: insert.insertedId, ...outboundMsgDoc };

    // If source is WhatsApp, send via Kapso
    if (source === 'whatsapp' && contact?.phoneNumber) {
      const sendRes = await sendKapsoWhatsAppMessage({
        to: contact.phoneNumber,
        text: replyText.trim()
      });
      const st = sendRes.success ? 'sent' : 'failed';
      await db.collection('messages').updateOne(
        { _id: savedMsg._id },
        { $set: { status: st, failureReason: sendRes.failureReason || null } }
      );
      savedMsg.status = st;
    }

    // Update handover: mark reviewed, record approvedResponse & timestamp
    await db.collection('handovers').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: 'reviewed',
          approvedResponse: replyText.trim(),
          reviewedAt: new Date(),
          reviewerId: req.user._id.toString(),
          updatedAt: new Date()
        }
      }
    );

    // Update conversation lastMessageAt (AI remains paused!)
    await db.collection('conversations').updateOne(
      { _id: new ObjectId(handover.conversationId) },
      { $set: { lastMessageAt: new Date(), status: 'needs_attention', updatedAt: new Date() } }
    );

    return res.json({
      success: true,
      message: 'Approved reply sent to customer! AI remains paused until manually resumed.',
      data: { message: savedMsg, handoverStatus: 'reviewed' }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// Mark resolved
router.post('/:id/resolve', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const handover = await db.collection('handovers').findOne({
      _id: new ObjectId(id),
      workspaceId: req.workspaceId.toString()
    });

    if (!handover) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Handover not found' } });
    }

    await db.collection('handovers').updateOne(
      { _id: new ObjectId(id) },
      { $set: { status: 'resolved', resolvedAt: new Date(), updatedAt: new Date() } }
    );

    await db.collection('conversations').updateOne(
      { _id: new ObjectId(handover.conversationId) },
      { $set: { status: 'resolved', updatedAt: new Date() } }
    );

    return res.json({ success: true, message: 'Handover and conversation marked as resolved.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// Resume AI
router.post('/:id/resume-ai', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const handover = await db.collection('handovers').findOne({
      _id: new ObjectId(id),
      workspaceId: req.workspaceId.toString()
    });

    if (!handover) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Handover not found' } });
    }

    // Switch conversation mode back to AI
    await db.collection('conversations').updateOne(
      { _id: new ObjectId(handover.conversationId) },
      { $set: { mode: 'ai', status: 'open', updatedAt: new Date() } }
    );

    await db.collection('handovers').updateOne(
      { _id: new ObjectId(id) },
      { $set: { aiResumedAt: new Date(), updatedAt: new Date() } }
    );

    return res.json({ success: true, message: 'AI automation resumed for this conversation.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// Retry / Regenerate AI summary
router.post('/:id/retry-summary', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const handover = await db.collection('handovers').findOne({
      _id: new ObjectId(id),
      workspaceId: req.workspaceId.toString()
    });

    if (!handover) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Handover not found' } });
    }

    const messages = await db.collection('messages')
      .find({ conversationId: handover.conversationId })
      .sort({ createdAt: 1 })
      .toArray();

    const updated = await createHandoverRecord({
      workspaceId: req.workspaceId,
      conversationId: handover.conversationId,
      contactId: handover.contactId,
      handoverReason: handover.handoverReason,
      triggerMessageText: handover.triggerMessage || 'Assistance requested',
      recentMessages: messages
    });

    return res.json({ success: true, message: 'Summary regenerated', data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

export default router;
