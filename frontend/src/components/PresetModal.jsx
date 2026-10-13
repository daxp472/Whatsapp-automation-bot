import React, { useState, useEffect } from 'react';
import { Sparkles, Check, ShoppingBag, GraduationCap, Activity, Utensils, X, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

const ICONS = {
  ShoppingBag,
  GraduationCap,
  Activity,
  Utensils
};

export default function PresetModal({ isOpen, onClose, onApplied }) {
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadPresets();
    }
  }, [isOpen]);

  const loadPresets = async () => {
    try {
      setLoading(true);
      const res = await api.presets.list();
      if (res.success) {
        setPresets(res.data);
      }
    } catch {
      // non-blocking
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (presetId) => {
    try {
      setApplying(presetId);
      const res = await api.presets.apply(presetId);
      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          setSuccessMsg('');
          if (onApplied) onApplied();
          onClose();
        }, 1200);
      }
    } catch (err) {
      alert('Error applying preset: ' + err.message);
    } finally {
      setApplying(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={18} color="var(--accent-violet)" />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '700' }}>Industry Use Case Presets</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Load verified business profiles, grounded FAQs, and reply workflows in 1 click</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {successMsg && (
          <div style={{ margin: '16px 24px 0', padding: '12px', background: 'rgba(34, 197, 94, 0.15)', border: '1px solid var(--success)', borderRadius: '10px', color: 'var(--success)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Check size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Loading industry templates...</div>
          ) : (
            presets.map(preset => {
              const IconComp = ICONS[preset.icon] || Sparkles;
              return (
                <div
                  key={preset.id}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    transition: 'border-color 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'rgba(45, 212, 191, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <IconComp size={20} color="var(--accent-teal)" />
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '14.5px', color: 'var(--text-primary)' }}>
                        {preset.title}
                      </div>
                      <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: '1.4' }}>
                        {preset.description}
                      </div>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                        <span>• Business: <b>{preset.botSettings.businessName}</b></span>
                        <span>• {preset.faqs?.length || 0} Grounded FAQs</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleApply(preset.id)}
                    disabled={applying === preset.id}
                    className="btn btn-primary btn-sm"
                    style={{ flexShrink: 0 }}
                  >
                    {applying === preset.id ? 'Applying...' : 'Load Preset'}
                    <ArrowRight size={13} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
