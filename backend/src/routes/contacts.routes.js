import express from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    const db = getDb();
    const query = { workspaceId: req.workspaceId.toString() };

    if (search) {
      const s = search.toString().trim();
      query.$or = [
        { displayName: { $regex: s, $options: 'i' } },
        { phoneNumber: { $regex: s, $options: 'i' } }
      ];
    }

    const contacts = await db.collection('contacts')
      .find(query)
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .toArray();

    // Attach conversation count for each contact
    const contactsWithStats = await Promise.all(
      contacts.map(async (c) => {
        const convCount = await db.collection('conversations').countDocuments({
          contactId: c._id.toString()
        });
        return { ...c, conversationCount: convCount };
      })
    );

    return res.json({ success: true, data: contactsWithStats });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    const contact = await db.collection('contacts').findOne({
      _id: new ObjectId(id),
      workspaceId: req.workspaceId.toString()
    });

    if (!contact) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Contact not found' } });
    }

    const conversations = await db.collection('conversations')
      .find({ contactId: id })
      .sort({ lastMessageAt: -1 })
      .toArray();

    return res.json({ success: true, data: { ...contact, conversations } });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

router.post('/', async (req, res) => {
  try {
    const { phoneNumber, displayName } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Phone number is required' }
      });
    }

    const db = getDb();
    const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
    const doc = {
      workspaceId: req.workspaceId.toString(),
      phoneNumber: cleanPhone,
      displayName: displayName?.trim() || cleanPhone,
      source: 'manual',
      consentStatus: 'opted-in',
      lastMessageAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const resInsert = await db.collection('contacts').insertOne(doc);
    return res.status(201).json({ success: true, data: { _id: resInsert.insertedId, ...doc } });
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

    await db.collection('contacts').updateOne(
      { _id: new ObjectId(id), workspaceId: req.workspaceId.toString() },
      { $set: updateData }
    );

    const updated = await db.collection('contacts').findOne({ _id: new ObjectId(id) });
    return res.json({ success: true, data: updated });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

export default router;
