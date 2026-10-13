import React, { useState, useEffect } from 'react';
import {
  Key,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  MessageSquare,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';

export default function IntegrationsPage() {
  const [status, setStatus] = useState(null);
  const [testingGemini, setTestingGemini] = useState(false);
  const [testingKapso, setTestingKapso] = useState(false);
  const [geminiResult, setGeminiResult] = useState(null);
  const [kapsoResult, setKapsoResult] = useState(null);
  const [copiedKey, setCopiedKey] = useState('');

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const res = await api.integrations.getStatus();
      if (res.success) setStatus(res.data);
    } catch {
      // non-blocking
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  const handleTestGemini = async () => {
    setTestingGemini(true);
    setGeminiResult(null);
    try {
      const res = await api.integrations.testGemini();
      setGeminiResult(res.data);
    } catch (err) {
      setGeminiResult({ connected: false, message: err.message });
    } finally {
      setTestingGemini(false);
    }
  };

  const handleTestKapso = async () => {
    setTestingKapso(true);
    setKapsoResult(null);
    try {
      const res = await api.integrations.testKapso();
      setKapsoResult(res.data);
    } catch (err) {
      setKapsoResult({ connected: false, message: err.message });
    } finally {
      setTestingKapso(false);
    }
  };

  const isKapsoConnected = status?.kapso?.configured;
  const isGeminiConnected = status?.gemini?.configured;

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Banner */}
      <div style={{
        padding: '18px 22px',
        borderRadius: '10px',
        background: 'var(--bg-panel)',
        border: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div>
          <h2 style={{ fontSize: '17px', fontWeight: '700' }}>Active Integrations & Credentials</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Both Google Gemini 3.8 and Kapso WhatsApp Cloud are loaded from <code>backend/.env</code>.
          </p>
        </div>
        <button onClick={loadStatus} className="btn btn-secondary btn-sm">
          <RefreshCw size={13} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Grid: 2 Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px' }}>
        {/* Card 1: Google Gemini */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--emerald-500)' }}>
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: '14.5px', fontWeight: '700' }}>Google Gemini AI</h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Model: {status?.gemini?.model || 'gemini-3.8-flash'}</span>
                </div>
              </div>
              <span className={`badge ${isGeminiConnected ? 'badge-emerald' : 'badge-warning'}`}>
                {isGeminiConnected ? 'Active Key' : 'Demo Mode'}
              </span>
            </div>

            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '14px' }}>
              Connected via official Google GenAI SDK. Every question is answered strictly from your grounded business facts.
            </p>

            <div style={{ background: 'var(--bg-canvas)', padding: '10px 12px', borderRadius: '6px', fontSize: '11.5px', fontFamily: 'monospace', color: 'var(--text-muted)', marginBottom: '14px', border: '1px solid var(--border-subtle)' }}>
              GEMINI_MODEL=gemini-3.8-flash
            </div>

            {geminiResult && (
              <div style={{
                padding: '9px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                marginBottom: '14px',
                background: geminiResult.connected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: geminiResult.connected ? 'var(--emerald-500)' : 'var(--danger)',
                border: `1px solid ${geminiResult.connected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`
              }}>
                {geminiResult.message}
              </div>
            )}
          </div>

          <button
            onClick={handleTestGemini}
            disabled={testingGemini}
            className="btn btn-secondary btn-sm"
            style={{ width: '100%' }}
          >
            {testingGemini ? 'Testing Gemini API...' : 'Test Gemini Connection'}
          </button>
        </div>

        {/* Card 2: Kapso WhatsApp Cloud API */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--emerald-500)' }}>
                  <MessageSquare size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: '14.5px', fontWeight: '700' }}>Kapso WhatsApp Cloud</h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Project: bot · 2,000 msgs/mo</span>
                </div>
              </div>
              <span className={`badge ${isKapsoConnected ? 'badge-emerald' : 'badge-warning'}`}>
                {isKapsoConnected ? 'Connected' : 'Needs Key'}
              </span>
            </div>

            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: '14px' }}>
              Connected to project "bot" with phone number ID <code>597907523413541</code>. Outbound dispatch and status updates active.
            </p>

            <div style={{ background: 'var(--bg-canvas)', padding: '10px 12px', borderRadius: '6px', fontSize: '11.5px', fontFamily: 'monospace', color: 'var(--text-muted)', marginBottom: '14px', border: '1px solid var(--border-subtle)' }}>
              <div>KAPSO_PHONE_NUMBER_ID=597907523413541</div>
            </div>

            {kapsoResult && (
              <div style={{
                padding: '9px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                marginBottom: '14px',
                background: kapsoResult.connected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: kapsoResult.connected ? 'var(--emerald-500)' : 'var(--danger)',
                border: `1px solid ${kapsoResult.connected ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`
              }}>
                {kapsoResult.message}
              </div>
            )}
          </div>

          <button
            onClick={handleTestKapso}
            disabled={testingKapso}
            className="btn btn-secondary btn-sm"
            style={{ width: '100%' }}
          >
            {testingKapso ? 'Testing Kapso API...' : 'Test Kapso Connection'}
          </button>
        </div>
      </div>

      {/* Webhook Configuration Section */}
      <div className="panel" style={{ padding: '22px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '6px' }}>
          Kapso Inbound Webhook Settings
        </h3>
        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Configure this in your Kapso dashboard under Webhooks to receive live customer messages:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label className="form-label">Callback Webhook URL</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                readOnly
                value={status?.webhook?.url || 'http://localhost:4000/api/v1/webhooks/kapso'}
                className="form-control"
                style={{ fontFamily: 'monospace', fontSize: '12.5px' }}
              />
              <button
                onClick={() => copyToClipboard(status?.webhook?.url || 'http://localhost:4000/api/v1/webhooks/kapso', 'url')}
                className="btn btn-secondary btn-sm"
              >
                {copiedKey === 'url' ? <Check size={13} color="var(--emerald-500)" /> : <Copy size={13} />}
                <span>{copiedKey === 'url' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div>
            <label className="form-label">Webhook Verification Token</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                readOnly
                value={status?.webhook?.verifyToken || 'replypilot_webhook_secret_2026'}
                className="form-control"
                style={{ fontFamily: 'monospace', fontSize: '12.5px' }}
              />
              <button
                onClick={() => copyToClipboard(status?.webhook?.verifyToken || 'replypilot_webhook_secret_2026', 'token')}
                className="btn btn-secondary btn-sm"
              >
                {copiedKey === 'token' ? <Check size={13} color="var(--emerald-500)" /> : <Copy size={13} />}
                <span>{copiedKey === 'token' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
