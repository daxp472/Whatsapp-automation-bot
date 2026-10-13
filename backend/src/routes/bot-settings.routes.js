import express from 'express';
import { getDb } from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    let settings = await db.collection('botSettings').findOne({
      workspaceId: req.workspaceId.toString()
    });

    if (!settings) {
      settings = {
        workspaceId: req.workspaceId.toString(),
        enabled: true,
        businessName: 'My WhatsApp Business',
        businessDescription: 'Fast, automated customer replies.',
        tone: 'Friendly and professional',
        language: 'en',
        systemInstructions: 'Be welcoming, concise, and accurate.',
        fallbackReply: "I'm not completely certain about that. A team member will assist you shortly.",
        businessHours: 'Mon - Fri: 9:00 AM - 6:00 PM',
        handoffKeywords: ['human', 'agent', 'support', 'person', 'operator'],
        maxReplyCharacters: 350,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await db.collection('botSettings').insertOne(settings);
    }

    return res.json({ success: true, data: settings });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

router.patch('/', async (req, res) => {
  try {
    const db = getDb();
    const updateData = { ...req.body, updatedAt: new Date() };
    delete updateData._id;
    delete updateData.workspaceId;

    await db.collection('botSettings').updateOne(
      { workspaceId: req.workspaceId.toString() },
      { $set: updateData },
      { upsert: true }
    );

    const updated = await db.collection('botSettings').findOne({
      workspaceId: req.workspaceId.toString()
    });

    return res.json({
      success: true,
      message: 'Bot settings updated successfully',
      data: updated
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

export default router;
