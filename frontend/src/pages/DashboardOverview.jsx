import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  MessageSquare,
  Bot,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Zap,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function DashboardOverview() {
  const { workspace } = useAuth();
  const { onOpenGuide } = useOutletContext() || {};
  const [data, setData] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [integrationStatus, setIntegrationStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, convRes, integRes] = await Promise.all([
        api.analytics.getSummary(),
        api.conversations.list(),
        api.integrations.getStatus()
      ]);

      if (analyticsRes.success) setData(analyticsRes.data);
      if (convRes.success) setConversations(convRes.data.slice(0, 5));
      if (integRes.success) setIntegrationStatus(integRes.data);
    } catch {
      // non-blocking
    } finally {
      setLoading(false);
    }
  };

  const quota = data?.quota || { messageQuota: 100, messagesUsed: 0, remaining: 100 };
  const stats = data?.stats || {
    totalInbound: 0,
    totalOutbound: 0,
    aiReplies: 0,
    humanReplies: 0,
    contactsCount: 0,
    replyRate: 100
  };

  const isConnected = integrationStatus?.kapso?.configured;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 60%, rgba(45, 212, 191, 0.05) 100%)',
        border: '1px solid rgba(139, 92, 246, 0.25)',
        borderRadius: '16px',
        padding: '24px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-teal">Live Bot Ready</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Workspace: {workspace?.name}</span>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.3px' }}>
            Welcome back to ReplyPilot WhatsApp Control!
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Your bot is actively answering incoming WhatsApp queries grounded in verified knowledge base facts.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onOpenGuide} className="btn btn-secondary btn-sm">
            Setup Checklist
          </button>
          <Link to="/simulator" className="btn btn-primary btn-sm">
            Launch Simulator
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Free 100 Messages Quota Progress Bar Card */}
      <div className="panel" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={18} color="var(--warning)" />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700' }}>Free Testing Tier Message Quota</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>100 free testing messages allocated per month for sandbox and simulator</div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent-teal)' }}>
              {quota.remaining} Left
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '6px' }}>
              / {quota.messageQuota} Total
            </span>
          </div>
        </div>

        {/* Bar */}
        <div style={{ width: '100%', height: '8px', background: 'var(--bg-canvas)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{
            width: `${Math.min(100, (quota.messagesUsed / quota.messageQuota) * 100)}%`,
            height: '100%',
            background: 'var(--primary-gradient)',
            transition: 'width 0.4s ease'
          }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
          <span>{quota.messagesUsed} messages consumed this cycle</span>
          <span>Next reset on: {quota.resetDate ? new Date(quota.resetDate).toLocaleDateString() : 'Next Month'}</span>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px' }}>
        {[
          {
            label: 'Total Inbound Messages',
            val: stats.totalInbound,
            icon: MessageSquare,
            sub: 'From customers',
            color: 'var(--accent-teal)'
          },
          {
            label: 'AI Grounded Replies',
            val: stats.aiReplies,
            icon: Bot,
            sub: `${stats.replyRate}% automation rate`,
            color: 'var(--accent-violet)'
          },
          {
            label: 'Human Takeovers',
            val: stats.humanReplies,
            icon: Users,
            sub: 'Operator escalated',
            color: 'var(--warning)'
          },
          {
            label: 'Captured Contacts',
            val: stats.contactsCount,
            icon: Users,
            sub: 'WhatsApp profiles',
            color: 'var(--info)'
          }
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span style={{ fontSize: '12.5px', fontWeight: '500', color: 'var(--text-secondary)' }}>{kpi.label}</span>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={16} color={kpi.color} />
                </div>
              </div>
              <div style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-0.5px' }}>{kpi.val}</div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>{kpi.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Grid: WhatsApp Health + Recent Conversations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '20px' }}>
        {/* WhatsApp & Gemini Integration Card */}
        <div className="panel">
          <div className="panel-header">
            <h3 style={{ fontSize: '15px', fontWeight: '700' }}>WhatsApp & AI Health</h3>
            <span className={`badge ${isConnected ? 'badge-teal' : 'badge-warning'}`}>
              {isConnected ? 'Kapso Live' : 'Sandbox Demo'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600' }}>Kapso WhatsApp Cloud</span>
                <span style={{ fontSize: '12px', color: isConnected ? 'var(--accent-teal)' : 'var(--warning)' }}>
                  {isConnected ? 'Configured' : 'Needs .env keys'}
                </span>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                {isConnected ? 'Live inbound webhook and outbound messaging enabled.' : 'Operating in local sandbox mode. Add KAPSO_API_KEY to test real WhatsApp phone.'}
              </p>
            </div>

            <div style={{ padding: '12px', background: 'var(--bg-elevated)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600' }}>Google Gemini AI</span>
                <span style={{ fontSize: '12px', color: 'var(--accent-teal)' }}>
                  {integrationStatus?.gemini?.configured ? 'Live API (gemini-2.5-flash)' : 'Demo Grounded Engine'}
                </span>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Responses are strictly grounded in your FAQs.
              </p>
            </div>

            <Link to="/integrations" className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: '6px' }}>
              <span>View Webhook URL & Keys</span>
              <ExternalLink size={13} />
            </Link>
          </div>
        </div>

        {/* Recent Conversations */}
        <div className="panel">
          <div className="panel-header">
            <h3 style={{ fontSize: '15px', fontWeight: '700' }}>Recent Conversations</h3>
            <Link to="/inbox" style={{ fontSize: '12.5px', color: 'var(--accent-violet)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Open Inbox <ArrowRight size={13} />
            </Link>
          </div>

          {conversations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <MessageSquare size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
              <p style={{ fontSize: '14px' }}>No messages received yet.</p>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>Try sending a test message in the simulator!</p>
              <Link to="/simulator" className="btn btn-primary btn-sm" style={{ marginTop: '14px' }}>
                Open Simulator
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {conversations.map(conv => (
                <Link
                  key={conv._id}
                  to={`/inbox?id=${conv._id}`}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                    <div style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '50%',
                      background: 'rgba(139, 92, 246, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: 'var(--accent-violet)',
                      flexShrink: 0
                    }}>
                      {conv.contact?.displayName ? conv.contact.displayName[0].toUpperCase() : 'W'}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {conv.contact?.displayName || conv.contact?.phoneNumber}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {conv.lastMessage?.text || 'No message text'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <span className={`badge ${conv.mode === 'human' ? 'badge-warning' : 'badge-teal'}`}>
                      {conv.mode === 'human' ? 'Human Takeover' : 'AI Active'}
                    </span>
                    <ChevronRight size={15} color="var(--text-muted)" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
