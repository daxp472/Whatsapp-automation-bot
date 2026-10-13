import express from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const templates = await db.collection('replyTemplates')
      .find({ workspaceId: req.workspaceId.toString() })
      .sort({ createdAt: -1 })
      .toArray();
    return res.json({ success: true, data: templates });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, category = 'General', body, enabled = true } = req.body;
    if (!name || !body) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Template name and body are required' }
      });
    }

    const db = getDb();
    const doc = {
      workspaceId: req.workspaceId.toString(),
      name: name.trim(),
      category: category.trim(),
      body: body.trim(),
      enabled: Boolean(enabled),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('replyTemplates').insertOne(doc);
    return res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: { _id: result.insertedId, ...doc }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    const updateData = { ...req.body, updatedAt: new Date() };
    delete updateData._id;
    delete updateData.workspaceId;

    await db.collection('replyTemplates').updateOne(
      { _id: new ObjectId(id), workspaceId: req.workspaceId.toString() },
      { $set: updateData }
    );

    const updated = await db.collection('replyTemplates').findOne({ _id: new ObjectId(id) });
    return res.json({ success: true, message: 'Template updated successfully', data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    await db.collection('replyTemplates').deleteOne({
      _id: new ObjectId(id),
      workspaceId: req.workspaceId.toString()
    });
    return res.json({ success: true, message: 'Template deleted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

export default router;
