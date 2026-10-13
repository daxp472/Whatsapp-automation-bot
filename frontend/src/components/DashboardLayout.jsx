import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import PresetModal from './PresetModal';
import SetupGuideModal from './SetupGuideModal';

const PAGE_METADATA = {
  '/dashboard': {
    title: 'Dashboard Overview',
    description: 'Monitor WhatsApp connection health, message activity, and bot status'
  },
  '/inbox': {
    title: 'WhatsApp Conversations Inbox',
    description: 'Review active chats, toggle human takeover, or reply manually'
  },
  '/simulator': {
    title: 'Demo WhatsApp Simulator',
    description: 'Simulate live inbound messages and test Gemini grounded responses safely'
  },
  '/contacts': {
    title: 'Customer Contacts',
    description: 'Manage WhatsApp phone numbers, profiles, and conversation history'
  },
  '/automations': {
    title: 'Automations & Rules',
    description: 'Define human handoff triggers, business hours, and greeting conditions'
  },
  '/faqs': {
    title: 'Knowledge Base & FAQs',
    description: 'Store verified facts used by Gemini to ground customer replies'
  },
  '/templates': {
    title: 'Bot Reply Templates',
    description: 'Maintain standardized snippets for greetings, handoff, and common answers'
  },
  '/analytics': {
    title: 'Performance & Analytics',
    description: 'Track inbound volume, AI automation rate, and message quota consumption'
  },
  '/integrations': {
    title: 'Integrations & Credentials',
    description: 'Check Kapso, Google Gemini, and database connection status'
  },
  '/settings': {
    title: 'Bot & Workspace Settings',
    description: 'Configure business persona, reply tone, language, and max reply length'
  }
};

export default function DashboardLayout() {
  const location = useLocation();
  const [showPresets, setShowPresets] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const meta = PAGE_METADATA[location.pathname] || {
    title: 'ReplyPilot Dashboard',
    description: 'WhatsApp Automation Platform'
  };

  const handlePresetApplied = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="app-layout">
      <Sidebar onOpenGuide={() => setShowGuide(true)} />

      <div className="app-main">
        <Header
          title={meta.title}
          description={meta.description}
          onOpenPresets={() => setShowPresets(true)}
          onOpenGuide={() => setShowGuide(true)}
        />

        <main className="app-content">
          <Outlet context={{ refreshTrigger, onOpenGuide: () => setShowGuide(true) }} />
        </main>
      </div>

      <PresetModal
        isOpen={showPresets}
        onClose={() => setShowPresets(false)}
        onApplied={handlePresetApplied}
      />

      <SetupGuideModal
        isOpen={showGuide}
        onClose={() => setShowGuide(false)}
      />
    </div>
  );
}
