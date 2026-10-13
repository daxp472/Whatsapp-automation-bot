import React, { useState, useEffect } from 'react';
import { Cpu, Users, Clock, AlertTriangle, Save, CheckCircle2, Shield } from 'lucide-react';
import { api } from '../services/api';

export default function AutomationsPage() {
  const [settings, setSettings] = useState(null);
  const [handoffKeywordInput, setHandoffKeywordInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await api.botSettings.get();
      if (res.success && res.data) {
        setSettings(res.data);
        setHandoffKeywordInput(res.data.handoffKeywords?.join(', ') || 'human, agent, person, support');
      }
    } catch {
      // non-blocking
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      const parsedKeywords = handoffKeywordInput
        .split(',')
        .map(k => k.trim())
        .filter(Boolean);

      const res = await api.botSettings.update({
        ...settings,
        handoffKeywords: parsedKeywords
      });

      if (res.success) {
        setSavedMsg('Automation rules saved successfully!');
        setTimeout(() => setSavedMsg(''), 2500);
      }
    } catch (err) {
      alert('Error updating automations: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!settings) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading automation rules...</div>;
  }

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {savedMsg && (
        <div style={{ padding: '12px 18px', borderRadius: '10px', background: 'rgba(34, 197, 94, 0.15)', border: '1px solid var(--success)', color: 'var(--success)', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} />
          <span>{savedMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Rule 1: Master AI Toggle */}
        <div className="panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Master AI Automation State</h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Globally enable or pause all automatic Gemini WhatsApp replies
              </p>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={settings.enabled !== false}
                onChange={e => setSettings({ ...settings, enabled: e.target.checked })}
              />
              <span className="slider" />
            </label>
          </div>
        </div>

        {/* Rule 2: Human Takeover Trigger Keywords */}
        <div className="panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={16} color="var(--warning)" />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '700' }}>Human Handoff Trigger Keywords</h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                When an inbound message contains any of these words, the bot switches to human mode
              </p>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Comma-separated Keywords</label>
            <input
              type="text"
              value={handoffKeywordInput}
              onChange={e => setHandoffKeywordInput(e.target.value)}
              className="form-control"
              placeholder="human, agent, person, support, operator"
            />
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              Example: If a customer types "Can I speak to a human?", AI replies stop and the thread is flagged for attention.
            </span>
          </div>
        </div>

        {/* Rule 3: Operating Hours */}
        <div className="panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(45, 212, 191, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={16} color="var(--accent-teal)" />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '700' }}>Business Operating Hours</h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                Shared with Gemini when answering schedule or availability questions
              </p>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Working Schedule Description</label>
            <input
              type="text"
              value={settings.businessHours || ''}
              onChange={e => setSettings({ ...settings, businessHours: e.target.value })}
              className="form-control"
              placeholder="e.g. Mon - Fri: 9:00 AM - 6:00 PM EST, Sat: 10:00 AM - 2:00 PM"
            />
          </div>
        </div>

        {/* Rule 4: Unknown Question Fallback */}
        <div className="panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={16} color="var(--accent-violet)" />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '700' }}>Safe Fallback Response</h3>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                Returned when a customer asks something not supported in your knowledge base
              </p>
            </div>
          </div>

          <div className="form-group">
            <textarea
              value={settings.fallbackReply || ''}
              onChange={e => setSettings({ ...settings, fallbackReply: e.target.value })}
              className="form-control"
              rows={3}
            />
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn btn-primary btn-lg" style={{ alignSelf: 'flex-start' }}>
          <Save size={16} />
          <span>{saving ? 'Saving changes...' : 'Save Automation Rules'}</span>
        </button>
      </form>
    </div>
  );
}
