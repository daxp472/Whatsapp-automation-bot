import express from 'express';
import multer from 'multer';
import { ObjectId } from 'mongodb';
import { getDb } from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';
import { extractTextFromPdf, extractTextFromUrl, sanitizeExtractedText, generateFaqsFromText } from '../services/document-parser.service.js';

const router = express.Router();
router.use(authMiddleware);

// Multer memory storage configuration with 10MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF documents are allowed.'));
    }
  }
});

// List all documents
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const documents = await db.collection('documents')
      .find({ workspaceId: req.workspaceId.toString() })
      .sort({ createdAt: -1 })
      .toArray();

    return res.json({ success: true, data: documents });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// Get single document
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const doc = await db.collection('documents').findOne({
      _id: new ObjectId(id),
      workspaceId: req.workspaceId.toString()
    });

    if (!doc) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Document not found' } });
    }

    // Get any already-approved FAQs for this document
    const approvedFaqs = await db.collection('faqs')
      .find({ documentId: id })
      .toArray();

    return res.json({ success: true, data: { ...doc, approvedFaqs } });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// Upload PDF Document
router.post('/upload-pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'PDF file is required' } });
    }

    const title = req.body.title || req.file.originalname.replace(/\.pdf$/i, '');
    const db = getDb();
    const wsIdStr = req.workspaceId.toString();

    // 1. Initial pending record
    const docRecord = {
      workspaceId: wsIdStr,
      title: title.trim(),
      sourceType: 'pdf',
      originalFileName: req.file.originalname,
      fileSizeBytes: req.file.size,
      status: 'processing',
      extractedText: '',
      charCount: 0,
      suggestedFaqs: [],
      faqCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const insertRes = await db.collection('documents').insertOne(docRecord);
    const docId = insertRes.insertedId;

    try {
      // 2. Extract text from PDF buffer
      const extractedText = await extractTextFromPdf(req.file.buffer);

      // 3. Generate suggested FAQs using Gemini
      const suggestedFaqs = await generateFaqsFromText({
        text: extractedText,
        documentTitle: title,
        maxFaqs: 8
      });

      // 4. Update document record
      await db.collection('documents').updateOne(
        { _id: docId },
        {
          $set: {
            status: 'completed',
            extractedText,
            charCount: extractedText.length,
            suggestedFaqs,
            updatedAt: new Date()
          }
        }
      );

      const finalDoc = await db.collection('documents').findOne({ _id: docId });
      return res.status(201).json({
        success: true,
        message: 'PDF processed and suggested FAQs generated successfully!',
        data: finalDoc
      });
    } catch (parseErr) {
      await db.collection('documents').updateOne(
        { _id: docId },
        {
          $set: {
            status: 'failed',
            error: parseErr.message,
            updatedAt: new Date()
          }
        }
      );
      return res.status(422).json({
        success: false,
        error: { code: 'PARSE_ERROR', message: parseErr.message }
      });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// Paste Text Import
router.post('/paste-text', async (req, res) => {
  try {
    const { title, text } = req.body;
    if (!text || text.trim().length < 20) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Text content must be at least 20 characters.' }
      });
    }

    const cleanTitle = title?.trim() || `Business Info Note ${new Date().toLocaleDateString()}`;
    const sanitizedText = sanitizeExtractedText(text);
    const db = getDb();
    const wsIdStr = req.workspaceId.toString();

    // Generate suggested FAQs with Gemini
    const suggestedFaqs = await generateFaqsFromText({
      text: sanitizedText,
      documentTitle: cleanTitle,
      maxFaqs: 8
    });

    const docRecord = {
      workspaceId: wsIdStr,
      title: cleanTitle,
      sourceType: 'text',
      originalFileName: null,
      fileSizeBytes: Buffer.byteLength(sanitizedText, 'utf8'),
      status: 'completed',
      extractedText: sanitizedText,
      charCount: sanitizedText.length,
      suggestedFaqs,
      faqCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const insertRes = await db.collection('documents').insertOne(docRecord);
    return res.status(201).json({
      success: true,
      message: 'Business text saved and FAQs generated successfully!',
      data: { _id: insertRes.insertedId, ...docRecord }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// Website URL Import
router.post('/import-url', async (req, res) => {
  try {
    const { url, title } = req.body;
    if (!url || !url.startsWith('http')) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'A valid http/https URL is required.' }
      });
    }

    const db = getDb();
    const wsIdStr = req.workspaceId.toString();
    const cleanTitle = title?.trim() || new URL(url).hostname;

    const docRecord = {
      workspaceId: wsIdStr,
      title: cleanTitle,
      sourceType: 'url',
      sourceUrl: url,
      status: 'processing',
      extractedText: '',
      charCount: 0,
      suggestedFaqs: [],
      faqCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const insertRes = await db.collection('documents').insertOne(docRecord);
    const docId = insertRes.insertedId;

    try {
      const extractedText = await extractTextFromUrl(url);
      const suggestedFaqs = await generateFaqsFromText({
        text: extractedText,
        documentTitle: cleanTitle,
        maxFaqs: 8
      });

      await db.collection('documents').updateOne(
        { _id: docId },
        {
          $set: {
            status: 'completed',
            extractedText,
            charCount: extractedText.length,
            suggestedFaqs,
            updatedAt: new Date()
          }
        }
      );

      const finalDoc = await db.collection('documents').findOne({ _id: docId });
      return res.status(201).json({
        success: true,
        message: 'Website content imported and FAQs extracted successfully!',
        data: finalDoc
      });
    } catch (parseErr) {
      await db.collection('documents').updateOne(
        { _id: docId },
        {
          $set: {
            status: 'failed',
            error: parseErr.message,
            updatedAt: new Date()
          }
        }
      );
      return res.status(422).json({
        success: false,
        error: { code: 'URL_FETCH_ERROR', message: parseErr.message }
      });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// Regenerate suggested FAQs for existing document
router.post('/:id/generate-faqs', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    const doc = await db.collection('documents').findOne({
      _id: new ObjectId(id),
      workspaceId: req.workspaceId.toString()
    });

    if (!doc || !doc.extractedText) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Document or extracted text not found' } });
    }

    const suggestedFaqs = await generateFaqsFromText({
      text: doc.extractedText,
      documentTitle: doc.title,
      maxFaqs: 8
    });

    await db.collection('documents').updateOne(
      { _id: new ObjectId(id) },
      { $set: { suggestedFaqs, updatedAt: new Date() } }
    );

    return res.json({
      success: true,
      message: 'Suggested FAQs regenerated successfully',
      data: suggestedFaqs
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// Approve & publish suggested FAQs into knowledge base (faqs collection)
router.post('/:id/approve-faqs', async (req, res) => {
  try {
    const { id } = req.params;
    const faqsToApprove = req.body.faqsToApprove || req.body.faqs; // Array of { question, answer, category, sourceSnippet }

    if (!Array.isArray(faqsToApprove) || faqsToApprove.length === 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Select at least one FAQ to approve.' }
      });
    }

    const db = getDb();
    const doc = await db.collection('documents').findOne({
      _id: new ObjectId(id),
      workspaceId: req.workspaceId.toString()
    });

    if (!doc) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Document not found' } });
    }

    const faqDocs = faqsToApprove.map(f => ({
      workspaceId: req.workspaceId.toString(),
      documentId: id,
      question: f.question.trim(),
      answer: f.answer.trim(),
      category: f.category || 'General',
      sourceSnippet: f.sourceSnippet || null,
      sourceType: 'document',
      sourceDocumentTitle: doc.title,
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    await db.collection('faqs').insertMany(faqDocs);

    // Update approved count on document
    await db.collection('documents').updateOne(
      { _id: new ObjectId(id) },
      { $inc: { faqCount: faqDocs.length }, $set: { updatedAt: new Date() } }
    );

    return res.json({
      success: true,
      message: `${faqDocs.length} FAQ(s) approved and published to Knowledge Base!`,
      data: faqDocs
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// Delete document and cascade delete associated approved FAQs
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();

    // 1. Delete associated FAQs
    const faqDeleteRes = await db.collection('faqs').deleteMany({
      documentId: id,
      workspaceId: req.workspaceId.toString()
    });

    // 2. Delete document record
    const docDeleteRes = await db.collection('documents').deleteOne({
      _id: new ObjectId(id),
      workspaceId: req.workspaceId.toString()
    });

    if (docDeleteRes.deletedCount === 0) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Document not found' } });
    }

    return res.json({
      success: true,
      message: `Document removed and ${faqDeleteRes.deletedCount} associated knowledge entries deleted.`
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

export default router;
