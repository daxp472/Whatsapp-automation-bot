import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { connectDB, getDb } from './config/db.js';
import { logger } from './utils/logger.js';
import { DEFAULT_FREE_QUOTA } from './services/quota.service.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import botSettingsRoutes from './routes/bot-settings.routes.js';
import faqRoutes from './routes/faq.routes.js';
import replyTemplateRoutes from './routes/reply-templates.routes.js';
import contactRoutes from './routes/contacts.routes.js';
import conversationRoutes from './routes/conversations.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import integrationRoutes from './routes/integrations.routes.js';
import presetRoutes from './routes/presets.routes.js';
import webhookRoutes from './routes/webhooks.routes.js';
import leadsRoutes from './routes/leads.routes.js';
import handoversRoutes from './routes/handovers.routes.js';
import documentsRoutes from './routes/documents.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Request logging
app.use((req, res, next) => {
  if (!req.path.startsWith('/api/v1/health')) {
    logger.info(`${req.method} ${req.path}`);
  }
  next();
});

// Health check
app.get('/api/v1/health', (req, res) => {
  return res.json({
    status: 'ok',
    service: 'ReplyPilot WhatsApp Automation Backend',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/bot-settings', botSettingsRoutes);
app.use('/api/v1/faqs', faqRoutes);
app.use('/api/v1/reply-templates', replyTemplateRoutes);
app.use('/api/v1/contacts', contactRoutes);
app.use('/api/v1/conversations', conversationRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/integrations', integrationRoutes);
app.use('/api/v1/presets', presetRoutes);
app.use('/api/v1/webhooks', webhookRoutes);
app.use('/api/v1/leads', leadsRoutes);
app.use('/api/v1/handovers', handoversRoutes);
app.use('/api/v1/documents', documentsRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error('Unhandled server error', { error: err.message, stack: err.stack });
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected internal error occurred'
    }
  });
});

// Auto-seed starter account if database is empty
async function seedStarterData() {
  try {
    const db = getDb();
    const userCount = await db.collection('users').countDocuments();
    if (userCount === 0) {
      logger.info('[Seed] Seeding starter account demo@replypilot.com...');
      const userId = new ObjectId();
      const workspaceId = new ObjectId();
      const passwordHash = await bcrypt.hash('demo123456', 10);

      // Workspace with 100 free messages
      const workspaceDoc = {
        _id: workspaceId,
        name: 'Zenith Tech Solutions',
        ownerId: userId.toString(),
        businessDescription: 'Cloud consulting and software automation agency.',
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

      // User
      await db.collection('users').insertOne({
        _id: userId,
        name: 'Alex Demo',
        email: 'demo@replypilot.com',
        passwordHash,
        defaultWorkspaceId: workspaceId.toString(),
        createdAt: new Date()
      });

      // Bot Settings
      await db.collection('botSettings').insertOne({
        workspaceId: workspaceId.toString(),
        enabled: true,
        businessName: 'Zenith Tech Solutions',
        businessDescription: 'Providing AI and WhatsApp customer support automation.',
        tone: 'Friendly and professional',
        language: 'en',
        systemInstructions: 'Be concise, helpful, and encourage booking a discovery call.',
        fallbackReply: "Thanks for reaching out! A representative will connect with you shortly.",
        businessHours: 'Mon - Fri: 9:00 AM - 6:00 PM EST',
        handoffKeywords: ['human', 'agent', 'support', 'person', 'operator'],
        maxReplyCharacters: 350,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Starter FAQs
      await db.collection('faqs').insertMany([
        {
          workspaceId: workspaceId.toString(),
          question: 'What services does Zenith Tech provide?',
          answer: 'We provide Custom AI Automation, WhatsApp CRM integrations, and Cloud Architecture consulting.',
          category: 'Services',
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          workspaceId: workspaceId.toString(),
          question: 'What are your working hours?',
          answer: 'Our team is available Monday to Friday from 9:00 AM to 6:00 PM EST. Our automated assistant is available 24/7.',
          category: 'Hours',
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          workspaceId: workspaceId.toString(),
          question: 'How do I book a consultation call?',
          answer: 'You can book a free 20-minute discovery call directly at calendly.com/zenith-tech or leave your email here!',
          category: 'Consulting',
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);

      // Starter Reply Templates
      await db.collection('replyTemplates').insertMany([
        {
          workspaceId: workspaceId.toString(),
          name: 'Welcome Greeting',
          category: 'Greeting',
          body: 'Hello! 👋 Welcome to Zenith Tech. How can I help power your business today?',
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          workspaceId: workspaceId.toString(),
          name: 'Human Handoff',
          category: 'Handoff',
          body: "I've paused automated responses and alerted our senior technical engineer. Someone will be with you shortly! 👤",
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);

      logger.info('[Seed] Starter data ready! Login: demo@replypilot.com / demo123456');
    }
  } catch (err) {
    logger.warn('[Seed] Seed check completed with note:', { message: err.message });
  }
}

// Start Server
async function startServer() {
  try {
    await connectDB();
    await seedStarterData();

    app.listen(PORT, () => {
      logger.info(`[Server] ReplyPilot Backend listening on port ${PORT}`);
      logger.info(`[Server] Health Check available at http://localhost:${PORT}/api/v1/health`);
    });
  } catch (err) {
    logger.error('[Server] Critical failure starting server', { error: err.message });
    process.exit(1);
  }
}

startServer();
