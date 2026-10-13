import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquareCode,
  Layers,
  Pause,
  Play,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';

export default function Header({ title, description, onOpenPresets, onOpenGuide }) {
  const navigate = useNavigate();
  const [botEnabled, setBotEnabled] = useState(true);
  const [integrationStatus, setIntegrationStatus] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [settingsRes, integRes] = await Promise.all([
        api.botSettings.get(),
        api.integrations.getStatus()
      ]);
      if (settingsRes.success && settingsRes.data) {
        setBotEnabled(settingsRes.data.enabled !== false);
      }
      if (integRes.success && integRes.data) {
        setIntegrationStatus(integRes.data);
      }
    } catch {
      // non-blocking
    }
  };

  const toggleBot = async () => {
    try {
      setUpdating(true);
      const nextState = !botEnabled;
      const res = await api.botSettings.update({ enabled: nextState });
      if (res.success) {
        setBotEnabled(nextState);
      }
    } catch (err) {
      alert('Error updating bot status: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const isKapsoConnected = integrationStatus?.kapso?.configured;
  const isGeminiLive = integrationStatus?.gemini?.configured;

  return (
    <header className="app-header">
      {/* Title & Info */}
      <div>
        <h1 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>
          {title}
        </h1>
        {description && (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '1px' }}>
            {description}
          </p>
        )}
      </div>

      {/* Action Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Kapso Live Status Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 10px',
          borderRadius: '6px',
          fontSize: '11.5px',
          fontWeight: '500',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          color: isKapsoConnected ? 'var(--emerald-500)' : 'var(--warning)'
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: isKapsoConnected ? 'var(--emerald-500)' : 'var(--warning)'
          }} />
          <span>{isKapsoConnected ? 'Kapso: Live Project' : 'Kapso: Sandbox'}</span>
        </div>

        {/* Gemini Status Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 10px',
          borderRadius: '6px',
          fontSize: '11.5px',
          fontWeight: '500',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          color: isGeminiLive ? 'var(--emerald-500)' : 'var(--text-muted)'
        }}>
          <span>Gemini 3.8 Flash</span>
        </div>

        {/* Bot Paused / Active switch */}
        <button
          onClick={toggleBot}
          disabled={updating}
          className={`btn btn-sm ${botEnabled ? 'btn-secondary' : 'btn-danger'}`}
          style={{ fontSize: '12px', padding: '5px 10px' }}
        >
          {botEnabled ? (
            <>
              <Pause size={12} color="var(--warning)" />
              <span>Pause Bot</span>
            </>
          ) : (
            <>
              <Play size={12} color="var(--success)" />
              <span>Resume Bot</span>
            </>
          )}
        </button>

        {/* Industry Presets */}
        <button
          onClick={onOpenPresets}
          className="btn btn-secondary btn-sm"
        >
          <Layers size={13} />
          <span>Presets</span>
        </button>

        {/* Simulator */}
        <button
          onClick={() => navigate('/simulator')}
          className="btn btn-primary btn-sm"
        >
          <MessageSquareCode size={13} />
          <span>Test Bot</span>
        </button>
      </div>
    </header>
  );
}
