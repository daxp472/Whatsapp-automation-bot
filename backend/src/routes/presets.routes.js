import express from 'express';
import { getDb } from '../config/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();
router.use(authMiddleware);

export const PRESETS = [
  {
    id: 'ecommerce',
    title: 'E-Commerce / Direct-to-Consumer',
    icon: 'ShoppingBag',
    description: 'Handles order tracking, returns, shipping policies, discount queries, and product recommendations.',
    botSettings: {
      businessName: 'LuxeCart Retail',
      businessDescription: 'Trendy online fashion & lifestyle store offering express shipping and easy 7-day returns.',
      tone: 'Enthusiastic, helpful, and concise',
      systemInstructions: 'Help customers with orders, shipping estimates, sizing, and product returns. If they ask to cancel an in-transit order, escalate to a human.',
      fallbackReply: "I'm checking on that for you! If you have an order ID, please share it or reply 'agent' to speak with support.",
      handoffKeywords: ['agent', 'human', 'cancel order', 'refund', 'complaint'],
      maxReplyCharacters: 320
    },
    faqs: [
      {
        question: 'What are your delivery times and shipping costs?',
        answer: 'Standard delivery takes 3-5 business days ($4.99 or free on orders over $50). Express overnight shipping is available for $9.99.',
        category: 'Shipping'
      },
      {
        question: 'How do I return or exchange an item?',
        answer: 'We offer hassle-free 7-day returns on unworn items with tags attached. Reply "return" with your Order ID to initiate a prepaid return label.',
        category: 'Returns'
      },
      {
        question: 'Do you offer cash on delivery (COD)?',
        answer: 'Yes, Cash on Delivery is available for all domestic orders under $200 with a flat $2 handling fee.',
        category: 'Payment'
      },
      {
        question: 'How can I track my shipment?',
        answer: 'Once your order ships, an SMS and WhatsApp tracking link is automatically generated. You can also send your 6-digit Order ID here anytime!',
        category: 'Tracking'
      }
    ],
    templates: [
      {
        name: 'Order Lookup',
        category: 'Support',
        body: 'Please share your 6-digit Order ID and registered phone number so I can check your order status immediately! 📦'
      },
      {
        name: 'Discount Offer',
        category: 'Promotion',
        body: 'Enjoy 10% off your next purchase with code WELCOME10 at checkout! Let me know if you need styling recommendations.'
      }
    ]
  },
  {
    id: 'education',
    title: 'Coaching / EdTech Institute',
    icon: 'GraduationCap',
    description: 'Answers course curriculums, batch timings, demo classes, fee structures, and certification details.',
    botSettings: {
      businessName: 'Apex Coding Academy',
      businessDescription: 'Premier tech bootcamp providing Full-Stack Development and AI engineering programs with 1-on-1 mentorship.',
      tone: 'Inspiring, authoritative, and encouraging',
      systemInstructions: 'Provide clear curriculum details, batch timings, and demo booking steps. Encourage booking a free 30-min demo session.',
      fallbackReply: "That's a great question about our curriculum! Our academic counselor will reach out to you directly.",
      handoffKeywords: ['counselor', 'human', 'call me', 'talk to advisor'],
      maxReplyCharacters: 350
    },
    faqs: [
      {
        question: 'What courses do you offer and how long do they take?',
        answer: 'We offer Full-Stack Web Dev (16 weeks), AI & Machine Learning (12 weeks), and Data Engineering (14 weeks). All programs feature live weekend classes.',
        category: 'Courses'
      },
      {
        question: 'Can I attend a free demo class before enrolling?',
        answer: 'Yes! We host free interactive demo classes every Saturday at 11:00 AM IST. Reply "DEMO" to reserve your seat.',
        category: 'Admissions'
      },
      {
        question: 'Do you provide job placement support?',
        answer: 'Yes, students receive dedicated career support including resume reviews, mock interviews, and access to our 150+ hiring partner network.',
        category: 'Placement'
      },
      {
        question: 'What are the course fees and installment options?',
        answer: 'Programs start at $499, with zero-cost EMI options split across 3 to 6 months. Scholarships are available based on entrance quizzes.',
        category: 'Fees'
      }
    ],
    templates: [
      {
        name: 'Demo Class Invitation',
        category: 'Greeting',
        body: 'Welcome to Apex Academy! 🎓 Would you like to join our upcoming free live demo class this Saturday at 11 AM? Reply YES to confirm.'
      }
    ]
  },
  {
    id: 'healthcare',
    title: 'Clinic / Healthcare Practice',
    icon: 'Activity',
    description: 'Manages appointment bookings, doctor availability, clinic timings, and general consultation inquiries.',
    botSettings: {
      businessName: 'CareWell Polyclinic',
      businessDescription: 'Multi-specialty outpatient clinic offering General Medicine, Dental, Dermatology, and Diagnostic testing.',
      tone: 'Compassionate, clear, and reassuring',
      systemInstructions: 'Assist with doctor schedules, booking appointments, and diagnostic reports. In emergency situations, instruct the user to call emergency services (911/112) immediately.',
      fallbackReply: "For specific clinical diagnosis or emergency, please call our direct hotline at +1-800-CARE-NOW or visit our emergency ward.",
      handoffKeywords: ['doctor', 'emergency', 'talk to doctor', 'receptionist'],
      maxReplyCharacters: 350
    },
    faqs: [
      {
        question: 'What are the clinic visiting hours and doctor timings?',
        answer: 'Our OPD is open Monday to Saturday from 8:00 AM to 8:00 PM. Sunday consultations are open from 9:00 AM to 1:00 PM.',
        category: 'Timings'
      },
      {
        question: 'How do I book an appointment?',
        answer: 'Simply share the doctor specialty you need (Dental, General, Dermatology) and your preferred date/time, and we will confirm your slot.',
        category: 'Appointments'
      },
      {
        question: 'Do you accept health insurance?',
        answer: 'We accept cashless processing for major health insurance providers. Please bring your insurance card and government ID for instant verification.',
        category: 'Billing'
      }
    ],
    templates: [
      {
        name: 'Appointment Confirmed',
        category: 'Handoff',
        body: 'Your appointment request has been logged! Our front-desk coordinator is assigning a doctor slot and will ping you here within 10 minutes.'
      }
    ]
  },
  {
    id: 'restaurant',
    title: 'Restaurant / Cafe & Dining',
    icon: 'Utensils',
    description: 'Answers menu questions, table reservations, vegetarian/vegan options, and takeaway ordering.',
    botSettings: {
      businessName: 'Urban Basil Bistro',
      businessDescription: 'Artisanal Italian & Mediterranean bistro renowned for sourdough pizzas, handmade pastas, and craft coffee.',
      tone: 'Warm, delightful, and appetizing',
      systemInstructions: 'Share menu highlights, dietary options (vegan, gluten-free), and assist with table bookings for groups.',
      fallbackReply: "Our restaurant host will be delighted to answer that directly. Reply 'table' to book a reservation!",
      handoffKeywords: ['manager', 'table booking', 'reservation', 'human'],
      maxReplyCharacters: 300
    },
    faqs: [
      {
        question: 'What are your restaurant timings?',
        answer: 'Lunch: 12:00 PM - 3:30 PM | Dinner: 7:00 PM - 11:30 PM. We are open every day of the week.',
        category: 'Timings'
      },
      {
        question: 'Do you have vegan and gluten-free choices?',
        answer: 'Yes! Over 40% of our menu is vegetarian/vegan, and we offer organic gluten-free sourdough crusts for all our woodfired pizzas.',
        category: 'Menu'
      },
      {
        question: 'How can I reserve a table for tonight?',
        answer: 'Reply with your party size (e.g., 4 guests) and preferred time. Tables are held for 15 minutes past reservation time.',
        category: 'Reservation'
      }
    ],
    templates: [
      {
        name: 'Table Reservation Prompt',
        category: 'Greeting',
        body: 'Buon appetito! 🍕 How many guests are joining you, and for which date & time shall we reserve your table at Urban Basil?'
      }
    ]
  }
];

router.get('/list', (req, res) => {
  return res.json({ success: true, data: PRESETS });
});

router.post('/apply', async (req, res) => {
  try {
    const { presetId } = req.body;
    const preset = PRESETS.find(p => p.id === presetId);
    if (!preset) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Preset not found' } });
    }

    const db = getDb();
    const wsIdStr = req.workspaceId.toString();

    // 1. Update botSettings
    await db.collection('botSettings').updateOne(
      { workspaceId: wsIdStr },
      {
        $set: {
          ...preset.botSettings,
          enabled: true,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    // 2. Remove existing FAQs and insert preset FAQs
    await db.collection('faqs').deleteMany({ workspaceId: wsIdStr });
    if (preset.faqs && preset.faqs.length) {
      const faqDocs = preset.faqs.map(f => ({
        workspaceId: wsIdStr,
        question: f.question,
        answer: f.answer,
        category: f.category,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      await db.collection('faqs').insertMany(faqDocs);
    }

    // 3. Remove existing templates and insert preset templates
    await db.collection('replyTemplates').deleteMany({ workspaceId: wsIdStr });
    if (preset.templates && preset.templates.length) {
      const templateDocs = preset.templates.map(t => ({
        workspaceId: wsIdStr,
        name: t.name,
        category: t.category,
        body: t.body,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      await db.collection('replyTemplates').insertMany(templateDocs);
    }

    return res.json({
      success: true,
      message: `Successfully applied preset "${preset.title}". Bot profile, FAQs, and templates have been loaded!`,
      data: preset
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

export default router;
