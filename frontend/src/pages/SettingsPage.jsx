import React, { useState, useEffect } from 'react';
import { Save, CheckCircle2, Bot, Shield, Globe, Zap } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function SettingsPage() {
  const { workspace, quota } = useAuth();
  const [settings, setSettings] = useState(null);
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
      const res = await api.botSettings.update(settings);
      if (res.success) {
        setSavedMsg('Settings saved successfully!');
        setTimeout(() => setSavedMsg(''), 2500);
      }
    } catch (err) {
      alert('Error updating settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!settings) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading settings...</div>;
  }

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {savedMsg && (
        <div style={{ padding: '12px 18px', borderRadius: '10px', background: 'rgba(34, 197, 94, 0.15)', border: '1px solid var(--success)', color: 'var(--success)', fontSize: '13.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} />
          <span>{savedMsg}</span>
        </div>
      )}

      {/* Free Plan / Quota Info */}
      <div className="panel" style={{ background: 'rgba(45, 212, 191, 0.05)', border: '1px solid rgba(45, 212, 191, 0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Zap size={20} color="var(--accent-teal)" />
            <div>
              <div style={{ fontSize: '14.5px', fontWeight: '700' }}>Active Subscription: Free Testing Tier</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {quota?.remaining ?? 100} of {quota?.messageQuota ?? 100} free messages remaining this month
              </div>
            </div>
          </div>
          <span className="badge badge-teal">Test Mode Active</span>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Business Identity */}
        <div className="panel">
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '14px' }}>Bot & Business Persona</h3>

          <div className="form-group">
            <label className="form-label">Business Display Name</label>
            <input
              type="text"
              required
              value={settings.businessName || ''}
              onChange={e => setSettings({ ...settings, businessName: e.target.value })}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Business Description</label>
            <textarea
              rows={3}
              value={settings.businessDescription || ''}
              onChange={e => setSettings({ ...settings, businessDescription: e.target.value })}
              className="form-control"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Reply Tone</label>
              <select
                value={settings.tone || 'Friendly and professional'}
                onChange={e => setSettings({ ...settings, tone: e.target.value })}
                className="form-control"
              >
                <option value="Friendly and professional">Friendly and professional</option>
                <option value="Concise and direct">Concise and direct</option>
                <option value="Authoritative and expert">Authoritative and expert</option>
                <option value="Warm and empathetic">Warm and empathetic</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Max Reply Length (characters)</label>
              <input
                type="number"
                min={100}
                max={1000}
                value={settings.maxReplyCharacters || 350}
                onChange={e => setSettings({ ...settings, maxReplyCharacters: parseInt(e.target.value) })}
                className="form-control"
              />
            </div>
          </div>
        </div>

        {/* Custom System Prompt Instructions */}
        <div className="panel">
          <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '8px' }}>Custom Gemini System Instructions</h3>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '14px' }}>
            Additional guidance provided to Gemini on top of business profile and grounded FAQs.
          </p>

          <div className="form-group">
            <textarea
              rows={4}
              placeholder="e.g. Always greet politely. Provide clear call-to-actions. Never offer discounts unless explicitly listed in FAQs."
              value={settings.systemInstructions || ''}
              onChange={e => setSettings({ ...settings, systemInstructions: e.target.value })}
              className="form-control"
            />
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn btn-primary btn-lg" style={{ alignSelf: 'flex-start' }}>
          <Save size={16} />
          <span>{saving ? 'Saving changes...' : 'Save Settings'}</span>
        </button>
      </form>
    </div>
  );
}
