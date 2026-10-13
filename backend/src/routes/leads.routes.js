import express from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';
import { qualifyLead } from '../services/lead-qualification.service.js';

const router = express.Router();
router.use(authMiddleware);

// Get all leads with filtering and search
router.get('/', async (req, res) => {
  try {
    const { category, search, minScore, maxScore } = req.query;
    const db = getDb();
    const query = {
      workspaceId: req.workspaceId.toString(),
      lead: { $exists: true }
    };

    if (category && category !== 'all') {
      query['lead.category'] = category;
    }

    if (minScore || maxScore) {
      query['lead.score'] = {};
      if (minScore) query['lead.score'].$gte = parseInt(minScore);
      if (maxScore) query['lead.score'].$lte = parseInt(maxScore);
    }

    if (search) {
      const s = search.toString().trim();
      query.$or = [
        { displayName: { $regex: s, $options: 'i' } },
        { phoneNumber: { $regex: s, $options: 'i' } },
        { 'lead.requirements': { $regex: s, $options: 'i' } }
      ];
    }

    const contacts = await db.collection('contacts')
      .find(query)
      .sort({ 'lead.score': -1, lastMessageAt: -1 })
      .toArray();

    return res.json({ success: true, data: contacts });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// Get lead stats (KPI summary)
router.get('/stats', async (req, res) => {
  try {
    const db = getDb();
    const wsIdStr = req.workspaceId.toString();

    const [hot, warm, cold, unqualified, total] = await Promise.all([
      db.collection('contacts').countDocuments({ workspaceId: wsIdStr, 'lead.category': 'Hot' }),
      db.collection('contacts').countDocuments({ workspaceId: wsIdStr, 'lead.category': 'Warm' }),
      db.collection('contacts').countDocuments({ workspaceId: wsIdStr, 'lead.category': 'Cold' }),
      db.collection('contacts').countDocuments({ workspaceId: wsIdStr, 'lead.category': 'Unqualified' }),
      db.collection('contacts').countDocuments({ workspaceId: wsIdStr, 'lead': { $exists: true } })
    ]);

    return res.json({
      success: true,
      data: {
        hot,
        warm,
        cold,
        unqualified,
        total
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// Get single lead details with history
router.get('/:contactId', async (req, res) => {
  try {
    const { contactId } = req.params;
    const db = getDb();

    const contact = await db.collection('contacts').findOne({
      _id: new ObjectId(contactId),
      workspaceId: req.workspaceId.toString()
    });

    if (!contact) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Lead not found' } });
    }

    const history = await db.collection('leadHistory')
      .find({ contactId })
      .sort({ createdAt: -1 })
      .toArray();

    return res.json({ success: true, data: { ...contact, history } });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// Manual update of lead details
router.patch('/:contactId', async (req, res) => {
  try {
    const { contactId } = req.params;
    const { category, score, purchaseIntent, budget, timeline, requirements, notes, isManualOverride } = req.body;
    const db = getDb();

    const contact = await db.collection('contacts').findOne({
      _id: new ObjectId(contactId),
      workspaceId: req.workspaceId.toString()
    });

    if (!contact) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Contact not found' } });
    }

    const currentLead = contact.lead || {};
    const updatedLead = {
      ...currentLead,
      category: category || currentLead.category || 'Unqualified',
      score: score !== undefined ? parseInt(score) : (currentLead.score || 0),
      purchaseIntent: purchaseIntent || currentLead.purchaseIntent || 'None',
      budget: budget !== undefined ? budget : currentLead.budget,
      timeline: timeline !== undefined ? timeline : currentLead.timeline,
      requirements: requirements !== undefined ? requirements : currentLead.requirements,
      notes: notes !== undefined ? notes : currentLead.notes,
      isManualOverride: isManualOverride !== undefined ? isManualOverride : true,
      lastUpdatedManuallyAt: new Date()
    };

    await db.collection('contacts').updateOne(
      { _id: new ObjectId(contactId) },
      { $set: { lead: updatedLead, updatedAt: new Date() } }
    );

    // Record manual modification in history
    await db.collection('leadHistory').insertOne({
      workspaceId: req.workspaceId.toString(),
      contactId,
      ...updatedLead,
      action: 'manual_override',
      createdAt: new Date()
    });

    return res.json({ success: true, message: 'Lead updated successfully', data: updatedLead });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// Manually trigger re-evaluation of lead based on conversation history
router.post('/:contactId/re-evaluate', async (req, res) => {
  try {
    const { contactId } = req.params;
    const db = getDb();

    const contact = await db.collection('contacts').findOne({
      _id: new ObjectId(contactId),
      workspaceId: req.workspaceId.toString()
    });

    if (!contact) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Contact not found' } });
    }

    // Get recent messages for context
    const recentMessages = await db.collection('messages')
      .find({ contactId })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();
    recentMessages.reverse();

    const latestInbound = recentMessages.filter(m => m.direction === 'inbound').pop();
    const textToAnalyze = latestInbound ? latestInbound.text : 'Customer consultation';

    const qualified = await qualifyLead({
      workspaceId: req.workspaceId.toString(),
      contactId,
      conversationId: null,
      messageId: latestInbound?._id,
      latestMessageText: textToAnalyze,
      recentMessages,
      currentLead: contact.lead
    });

    return res.json({ success: true, message: 'Lead re-evaluated successfully', data: qualified });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

export default router;
