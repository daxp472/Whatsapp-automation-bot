# ReplyPilot — WhatsApp AI Automation Bot

> Enterprise-grade, human-in-the-loop WhatsApp business automation engine powered by **Google Gemini 3.8 Flash**, **Kapso WhatsApp API**, **MongoDB**, and an authentic **Obsidian & Emerald UI**.

---

## 🌟 Core Highlights

ReplyPilot enables modern businesses to automate customer conversations on WhatsApp with strict grounding, zero hallucinations, automated sales qualification, and intelligent human agent escalation.

### 1. 🎯 Automatic Lead Qualification (CRM & Sales Automation)
- **Real-Time Intent Detection:** Automatically analyzes customer messages to detect explicit requirements, product/service interest, budget figures (e.g., `₹5,000`), and purchase timeline (`this week`).
- **Scoring & Classification:** Classifies leads as **Hot** (70–100), **Warm** (40–69), **Cold** (15–39), or **Unqualified** (0–14) with concise rationale.
- **Anti-False-Positive Engine:** Casual greetings (*"Hi"*, *"Hello"*) are strictly classified as **Unqualified** (Score: 0).
- **Manual CRM Override:** Business operators can adjust scores, override categories, and lock changes (`manualOverride`) to prevent AI resets.
- **Audit History:** Full qualification trail persisted in MongoDB.

### 2. 🛡️ Human Handover with AI-Generated Context Summary
- **Intelligent Escalation Triggers:** Escalates when customers request a human agent (*"talk to agent"*), file complaints (*"billing issue"*), or ask unsupported questions.
- **Instant AI Pause:** Automated replies are immediately halted (`mode: 'human'`, `status: 'needs_attention'`).
- **11-Point Structured Context Blueprint:** Reviewed in 15–30 seconds:
  1. Customer Objective
  2. Conversation Timeline Summary
  3. Specific Requirements, Budget & Timeline
  4. Previous Bot Responses
  5. Confirmed Commitments (Strictly no fabricated promises)
  6. Unresolved Questions
  7. Sentiment & Explanation (Positive / Neutral / Negative)
  8. Lead Category Badge
  9. Handover Reason & Trigger Message
  10. Important Cautions (Amber warning block)
  11. Editable Suggested Response Draft
- **Reviewer Approval Workflow:** Suggested replies require explicit approval before being dispatched to WhatsApp via Kapso. Reviewers can resume AI bot automation at any time.

### 3. 📚 Knowledge Base Import & Grounding Engine
- **Multi-Source Ingestion:**
  - **PDF Document Upload:** Server-side parsing using `pdf-parse` (up to 10MB; macros and scripts stripped).
  - **Pasted Text:** Raw company documents, pricing tiers, and operating policies.
  - **Website URL Scraping:** Extracts clean text from public URLs.
- **Automated FAQ Synthesis:** Gemini 3.8 Flash extracts grounded customer FAQs with proof source snippets.
- **Review & Approval Drawer:** Business owners review, edit, and approve candidate FAQs into the active knowledge base.
- **Unified Knowledge Grounding:** Both live WhatsApp messages and the interactive Demo Simulator answer customer inquiries using verified facts.

---

## 🏗️ Architecture & Technology Stack

```
ReplyPilot System
├── Frontend: React 18, Vite, Lucide Icons, Custom Obsidian Emerald Theme (#090A0D, #10B981)
├── Backend: Node.js, Express, MongoDB Native Driver, Multer, PDF-Parse, Axios
├── AI Engine: Google Gemini 3.8 Flash (@google/genai SDK) with resilient timeout guards
├── Messaging: Kapso WhatsApp Cloud Integration (Sandbox & Production)
└── Database: MongoDB (Collections: users, workspaces, contacts, conversations, messages, handovers, documents, faqs, leadHistory)
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js (v18 or higher)
- MongoDB running locally (`mongodb://127.0.0.1:27017`) or MongoDB Atlas
- Google Gemini API Key
- Kapso WhatsApp API Key & Phone Number ID

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Fill in your GEMINI_API_KEY and KAPSO credentials in .env
npm run start
```
The backend API server will start on `http://localhost:4000`.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🔑 Environment Configuration (`backend/.env`)

```env
PORT=4000
PUBLIC_API_URL=http://localhost:4000
MONGODB_URI=mongodb://127.0.0.1:27017/replypilot
MONGODB_DB_NAME=replypilot
JWT_SECRET=your_jwt_secret_key

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.8-flash

# Kapso WhatsApp Integration
KAPSO_API_KEY=your_kapso_api_key
KAPSO_PHONE_NUMBER_ID=your_kapso_phone_number_id
KAPSO_WEBHOOK_SECRET=your_kapso_webhook_secret

DEMO_MODE=true
```

---

## 🧪 Testing & Verification

Run the end-to-end integration test suite verifying all 3 features:
```bash
cd backend
node test-features-e2e.js
```

Build the frontend client bundle:
```bash
cd frontend
npm run build
```

---

## 📄 License
MIT © ReplyPilot Team
