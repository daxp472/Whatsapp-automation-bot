import express from 'express';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { getDb } from '../config/db.js';
import { signToken } from '../utils/jwt.js';
import { authMiddleware } from '../middleware/auth.js';
import { getQuotaStatus, DEFAULT_FREE_QUOTA } from '../services/quota.service.js';

const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, businessName, businessType } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Email and password are required' }
      });
    }

    const db = getDb();
    const existing = await db.collection('users').findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: { code: 'USER_EXISTS', message: 'An account with this email already exists' }
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = new ObjectId();
    const workspaceId = new ObjectId();

    // 1. Create Workspace with 100 free messages
    const workspaceDoc = {
      _id: workspaceId,
      name: businessName || `${name || 'User'}'s Business`,
      ownerId: userId.toString(),
      businessDescription: businessType ? `${businessType} business` : 'Customer service and sales assistant',
      defaultLanguage: 'en',
      timezone: 'UTC',
      plan: {
        name: 'Free Trial',
        messageQuota: DEFAULT_FREE_QUOTA,
        messagesUsed: 0,
        resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await db.collection('workspaces').insertOne(workspaceDoc);

    // 2. Create User
    const userDoc = {
      _id: userId,
      name: name || 'Business Owner',
      email: email.toLowerCase().trim(),
      passwordHash,
      defaultWorkspaceId: workspaceId.toString(),
      createdAt: new Date()
    };
    await db.collection('users').insertOne(userDoc);

    // 3. Create Default Bot Settings
    await db.collection('botSettings').insertOne({
      workspaceId: workspaceId.toString(),
      enabled: true,
      businessName: businessName || `${name || 'User'}'s Business`,
      businessDescription: 'Providing automated, instant customer support on WhatsApp.',
      tone: 'Friendly and professional',
      language: 'en',
      systemInstructions: 'Be welcoming, concise, and accurate. Provide clear next steps.',
      fallbackReply: "Thank you for reaching out! A representative will connect with you shortly.",
      businessHours: 'Mon - Sat: 9:00 AM - 7:00 PM',
      handoffKeywords: ['human', 'agent', 'support', 'person', 'operator'],
      maxReplyCharacters: 350,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // 4. Create Initial Starter FAQs
    await db.collection('faqs').insertMany([
      {
        workspaceId: workspaceId.toString(),
        question: 'What are your working hours?',
        answer: 'We are open Monday to Saturday from 9:00 AM to 7:00 PM.',
        category: 'General',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        workspaceId: workspaceId.toString(),
        question: 'Where are you located?',
        answer: 'Our main office is located downtown, and our online services are accessible 24/7.',
        category: 'General',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        workspaceId: workspaceId.toString(),
        question: 'How do I speak with a human agent?',
        answer: 'Just reply with "human" or "agent", and our system will pause the bot and connect you to an agent.',
        category: 'Support',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // 5. Create Initial Reply Templates
    await db.collection('replyTemplates').insertMany([
      {
        workspaceId: workspaceId.toString(),
        name: 'Welcome Greeting',
        category: 'Greeting',
        body: 'Hello! 👋 Welcome to {{business_name}}. How can I assist you today?',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        workspaceId: workspaceId.toString(),
        name: 'Human Handoff',
        category: 'Handoff',
        body: "I've connected you to our support team. An agent will respond shortly! 👤",
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    const token = signToken({ userId: userId.toString(), workspaceId: workspaceId.toString() });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully with 100 free messages credit!',
      data: {
        token,
        user: { id: userId, name: userDoc.name, email: userDoc.email },
        workspace: workspaceDoc
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Email and password are required' }
      });
    }

    const db = getDb();
    const user = await db.collection('users').findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
      });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }
      });
    }

    const workspace = await db.collection('workspaces').findOne({
      _id: new ObjectId(user.defaultWorkspaceId)
    });

    const token = signToken({ userId: user._id.toString(), workspaceId: user.defaultWorkspaceId });

    return res.json({
      success: true,
      data: {
        token,
        user: { id: user._id, name: user.name, email: user.email },
        workspace
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message }
    });
  }
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Email is required' }
    });
  }

  // Simulated password reset workflow for the MVP
  return res.json({
    success: true,
    message: `Password reset instructions have been dispatched to ${email}. In demo mode, you can reset directly with your new password below.`,
    data: {
      resetToken: `reset_${Date.now()}`
    }
  });
});

router.post('/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Email and new password are required' }
    });
  }

  const db = getDb();
  const passwordHash = await bcrypt.hash(newPassword, 10);
  const result = await db.collection('users').updateOne(
    { email: email.toLowerCase().trim() },
    { $set: { passwordHash } }
  );

  if (result.matchedCount === 0) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'User not found' }
    });
  }

  return res.json({
    success: true,
    message: 'Password successfully updated. You may now log in.'
  });
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const workspace = await db.collection('workspaces').findOne({
      _id: new ObjectId(req.workspaceId)
    });
    const quota = await getQuotaStatus(req.workspaceId);

    return res.json({
      success: true,
      data: {
        user: { id: req.user._id, name: req.user.name, email: req.user.email },
        workspace,
        quota
      }
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message }
    });
  }
});

export default router;
