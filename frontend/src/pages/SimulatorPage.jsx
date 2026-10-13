import React, { useState, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  ShieldAlert,
  Zap,
  CheckCircle2,
  RefreshCw,
  Phone,
  MessageSquare
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function SimulatorPage() {
  const { workspace, quota, refreshUser } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 1,
      direction: 'outbound',
      senderType: 'system',
      text: `Hello! 👋 Simulator active for "${workspace?.name || 'Your Business'}". Send a test question below to test grounded AI responses.`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('+15550198234');
  const [contactName, setContactName] = useState('Alex Test Customer');

  const samplePrompts = [
    'What are your opening hours?',
    'What services do you provide?',
    'How do I book a consultation call?',
    'I want to speak with a human agent',
    'Where is your office located?'
  ];

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg = {
      id: Date.now(),
      direction: 'inbound',
      senderType: 'customer',
      text: text.trim()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.conversations.simulate({
        phoneNumber: phone,
        senderName: contactName,
        text: text.trim()
      });

      if (res.success && res.data) {
        const outbound = res.data.outboundMessage;
        if (outbound) {
          setMessages(prev => [
            ...prev,
            {
              id: Date.now() + 1,
              direction: 'outbound',
              senderType: outbound.senderType || 'ai',
              text: outbound.text,
              aiModel: res.data.aiModel,
              aiSource: res.data.aiSource
            }
          ]);
        }
        await refreshUser();
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          direction: 'outbound',
          senderType: 'system',
          text: `⚠️ Simulation error: ${err.message}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* WhatsApp Phone Mockup Container */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '640px' }}>
        {/* Simulator Warning Banner */}
        <div style={{
          padding: '8px 16px',
          background: 'rgba(245, 158, 11, 0.15)',
          borderBottom: '1px solid rgba(245, 158, 11, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: 'var(--warning)',
          fontWeight: '600'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldAlert size={15} />
            <span>SIMULATED DEMO — Messages are NOT sent to real WhatsApp</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Uses central backend pipeline</span>
        </div>

        {/* WhatsApp Header Mockup */}
        <div style={{
          padding: '12px 18px',
          background: '#1F2C34',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'var(--accent-teal)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              color: '#0B141B'
            }}>
              <Bot size={20} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#E9EDEF' }}>
                {workspace?.name || 'ReplyPilot Bot'}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--accent-teal)' }}>
                Online · WhatsApp Business
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '12px', background: 'rgba(45, 212, 191, 0.15)', color: 'var(--accent-teal)' }}>
              100 Free Msgs Quota Active
            </span>
          </div>
        </div>

        {/* Chat Feed */}
        <div style={{
          flex: 1,
          padding: '20px',
          overflowY: 'auto',
          background: '#0B141A',
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '16px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {messages.map(m => {
            const isInbound = m.direction === 'inbound';
            return (
              <div
                key={m.id}
                style={{
                  alignSelf: isInbound ? 'flex-end' : 'flex-start',
                  maxWidth: '75%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isInbound ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{
                  padding: '9px 13px',
                  borderRadius: isInbound ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  background: isInbound ? '#005C4B' : '#202C33',
                  color: '#E9EDEF',
                  fontSize: '13.5px',
                  lineHeight: '1.45',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.3)'
                }}>
                  {!isInbound && m.senderType === 'ai' && (
                    <div style={{ fontSize: '10.5px', color: 'var(--accent-teal)', fontWeight: '600', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Sparkles size={11} />
                      <span>Gemini Grounded Response</span>
                    </div>
                  )}
                  <p style={{ margin: 0 }}>{m.text}</p>
                </div>
              </div>
            );
          })}

          {loading && (
            <div style={{ alignSelf: 'flex-start', background: '#202C33', padding: '8px 14px', borderRadius: '12px', color: 'var(--text-muted)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RefreshCw size={13} className="spin" />
              <span>Gemini is reading business FAQs...</span>
            </div>
          )}
        </div>

        {/* Input Composer */}
        <div style={{ padding: '12px 16px', background: '#202C33', borderTop: '1px solid var(--border-subtle)' }}>
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            style={{ display: 'flex', gap: '10px' }}
          >
            <input
              type="text"
              placeholder="Type simulated WhatsApp message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              className="form-control"
              style={{ background: '#2A3942', border: 'none', color: '#E9EDEF', fontSize: '13.5px' }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn btn-primary btn-sm"
              style={{ padding: '0 16px' }}
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      </div>

      {/* Simulator Control Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Sample Prompts */}
        <div className="panel">
          <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>
            Quick Test Prompts
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {samplePrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSend(p)}
                disabled={loading}
                className="btn btn-secondary btn-sm"
                style={{ textAlign: 'left', justifyContent: 'flex-start', fontSize: '12px', padding: '8px 12px' }}
              >
                <span>{p}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tester Profile Configuration */}
        <div className="panel">
          <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>
            Simulated Sender Profile
          </h3>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '11.5px' }}>Sender Name</label>
            <input
              type="text"
              className="form-control"
              value={contactName}
              onChange={e => setContactName(e.target.value)}
              style={{ fontSize: '12.5px' }}
            />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '11.5px' }}>WhatsApp Phone Number</label>
            <input
              type="text"
              className="form-control"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              style={{ fontSize: '12.5px' }}
            />
          </div>
        </div>

        {/* Quota Details Card */}
        <div className="panel" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Zap size={16} color="var(--warning)" />
            <span style={{ fontSize: '13px', fontWeight: '700' }}>Testing Credit Status</span>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Each simulator run exercises the real MongoDB and Gemini engine and uses 1 free test credit.
          </p>
          <div style={{ marginTop: '10px', fontSize: '12px', fontWeight: '600', color: 'var(--accent-teal)' }}>
            {quota?.remaining ?? 100} / {quota?.messageQuota ?? 100} messages remaining
          </div>
        </div>
      </div>
    </div>
  );
}
