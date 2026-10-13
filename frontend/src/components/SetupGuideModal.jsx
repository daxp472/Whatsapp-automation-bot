import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Key,
  MessageSquareCode,
  Zap,
  Globe,
  Copy,
  Check,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

export default function SetupGuideModal({ isOpen, onClose }) {
  const [activeStep, setActiveStep] = useState(1);
  const [copied, setCopied] = useState('');

  const copyText = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '680px' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: '700' }}>WhatsApp Bot Setup & Testing Guide</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Complete guide to test locally and connect live Kapso WhatsApp credentials</p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Step Navigation */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}>
          {[
            { id: 1, title: '1. Free Test Plan' },
            { id: 2, title: '2. Simulator Testing' },
            { id: 3, title: '3. .env Credentials' },
            { id: 4, title: '4. Kapso Webhook' }
          ].map(s => (
            <button
              key={s.id}
              onClick={() => setActiveStep(s.id)}
              style={{
                flex: 1,
                padding: '12px 8px',
                fontSize: '12.5px',
                fontWeight: activeStep === s.id ? '600' : '500',
                color: activeStep === s.id ? 'var(--accent-violet)' : 'var(--text-secondary)',
                borderBottom: activeStep === s.id ? '2px solid var(--accent-violet)' : '2px solid transparent',
                background: 'transparent',
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                cursor: 'pointer'
              }}
            >
              {s.title}
            </button>
          ))}
        </div>

        {/* Content body */}
        <div style={{ padding: '24px', minHeight: '340px' }}>
          {activeStep === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Zap size={22} color="var(--warning)" />
                <h3 style={{ fontSize: '15px', fontWeight: '700' }}>100 Messages Free Testing Quota</h3>
              </div>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                Every workspace created in ReplyPilot automatically receives <b>100 free messages per month</b> for testing.
              </p>
              <div style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
                  What consumes testing messages?
                </div>
                <ul style={{ paddingLeft: '18px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                  <li>Inbound messages processed through the <b>Demo Simulator</b></li>
                  <li>Live inbound messages received via the <b>Kapso Webhook</b></li>
                  <li>Automatic resets occur every 30 days automatically in your database.</li>
                </ul>
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                When the limit is reached, automated AI replies safely stop to avoid unexpected usage until renewed or upgraded.
              </p>
            </div>
          )}

          {activeStep === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <MessageSquareCode size={22} color="var(--accent-teal)" />
                <h3 style={{ fontSize: '15px', fontWeight: '700' }}>Testing with the Built-In Simulator</h3>
              </div>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                You don't need active WhatsApp credentials to test your bot! The simulator runs the exact same processing pipeline as the live webhook.
              </p>
              <div style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
                  Recommended test flows:
                </div>
                <ol style={{ paddingLeft: '18px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                  <li><b>Greeting test:</b> Type "Hi" or "Hello" → verifies greeting response.</li>
                  <li><b>Grounded FAQ test:</b> Ask a question from your Knowledge Base (e.g., "What are your hours?") → verifies Gemini grounded retrieval.</li>
                  <li><b>Human handoff test:</b> Type "I want to speak with a human" → verifies bot switches to human mode & stops auto-replies.</li>
                  <li><b>Pause test:</b> Click "Pause AI" in top header → verifies bot ignores automated replies until resumed.</li>
                </ol>
              </div>
            </div>
          )}

          {activeStep === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Key size={22} color="var(--accent-violet)" />
                <h3 style={{ fontSize: '15px', fontWeight: '700' }}>Required Credentials for backend/.env</h3>
              </div>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                When you have your real credentials, place them inside <code>backend/.env</code>:
              </p>

              <div style={{ background: '#070B14', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-subtle)', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#E2E8F0', lineHeight: '1.7' }}>
                <div># 1. Google Gemini API Key</div>
                <div style={{ color: 'var(--accent-violet)' }}>GEMINI_API_KEY=AIzaSy...</div>
                <div style={{ color: 'var(--text-muted)' }}>GEMINI_MODEL=gemini-2.5-flash</div>
                <br />
                <div># 2. Kapso WhatsApp API Credentials</div>
                <div style={{ color: 'var(--accent-teal)' }}>KAPSO_API_KEY=kapso_live_...</div>
                <div style={{ color: 'var(--accent-teal)' }}>KAPSO_PHONE_NUMBER_ID=1092837465...</div>
                <div style={{ color: 'var(--accent-teal)' }}>KAPSO_WEBHOOK_SECRET=your_custom_secret_token</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                <ShieldAlert size={16} color="var(--accent-teal)" />
                <span>All credentials stay server-side. They are never exposed to the frontend browser!</span>
              </div>
            </div>
          )}

          {activeStep === 4 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Globe size={22} color="var(--accent-teal)" />
                <h3 style={{ fontSize: '15px', fontWeight: '700' }}>Kapso Webhook Configuration</h3>
              </div>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                To receive live WhatsApp messages, configure your webhook endpoint in your Kapso or Meta WhatsApp Cloud App dashboard:
              </p>

              <div style={{ background: 'var(--bg-elevated)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Callback Webhook URL:</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      readOnly
                      value="http://your-server-or-tunnel-url/api/v1/webhooks/kapso"
                      className="form-control"
                      style={{ fontSize: '12px', fontFamily: 'monospace' }}
                    />
                    <button
                      onClick={() => copyText('http://your-server-or-tunnel-url/api/v1/webhooks/kapso', 'url')}
                      className="btn btn-secondary btn-sm"
                    >
                      {copied === 'url' ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Verify Token:</div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      readOnly
                      value="replypilot_webhook_secret_2026"
                      className="form-control"
                      style={{ fontSize: '12px', fontFamily: 'monospace' }}
                    />
                    <button
                      onClick={() => copyText('replypilot_webhook_secret_2026', 'token')}
                      className="btn btn-secondary btn-sm"
                    >
                      {copied === 'token' ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  For local testing with live WhatsApp, expose port 4000 using <code>ngrok http 4000</code> or Cloudflare Tunnel and paste the HTTPS URL above!
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
          <button
            onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
            disabled={activeStep === 1}
            className="btn btn-secondary btn-sm"
          >
            Previous
          </button>
          {activeStep < 4 ? (
            <button
              onClick={() => setActiveStep(prev => Math.min(4, prev + 1))}
              className="btn btn-primary btn-sm"
            >
              Next Step
              <ChevronRight size={14} />
            </button>
          ) : (
            <button onClick={onClose} className="btn btn-primary btn-sm">
              Done & Start Testing
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
