import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  AlertTriangle,
  Send,
  CheckCircle2,
  Play,
  RotateCcw,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  ShieldAlert,
  Flame,
  Search,
  ExternalLink,
  Info
} from 'lucide-react';
import { api } from '../services/api';

export default function HumanReviewPage() {
  const [handovers, setHandovers] = useState([]);
  const [stats, setStats] = useState({ pending: 0, resolved: 0, total: 0 });
  const [selectedHandover, setSelectedHandover] = useState(null);
  const [editedReply, setEditedReply] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending_review');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showOriginalChat, setShowOriginalChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    loadHandovers();
    loadStats();
    const interval = setInterval(() => {
      loadHandovers(false);
      loadStats();
    }, 12000);
    return () => clearInterval(interval);
  }, [filterStatus]);

  useEffect(() => {
    if (selectedHandover) {
      setEditedReply(selectedHandover.suggestedResponse || '');
      loadConversationMessages(selectedHandover.conversationId);
    }
  }, [selectedHandover?._id]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const loadStats = async () => {
    try {
      const res = await api.handovers.getStats();
      if (res.success) {
        setStats(res.data);
      }
    } catch {
      // non-blocking
    }
  };

  const loadHandovers = async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
      const res = await api.handovers.list({ status: filterStatus });
      if (res.success) {
        setHandovers(res.data);
        if (!selectedHandover && res.data.length > 0) {
          setSelectedHandover(res.data[0]);
        } else if (selectedHandover) {
          const updated = res.data.find(h => h._id === selectedHandover._id);
          if (updated) setSelectedHandover(updated);
        }
      }
    } catch {
      // non-blocking
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  const loadConversationMessages = async (convId) => {
    if (!convId) return;
    try {
      const res = await api.conversations.getMessages(convId);
      if (res.success) {
        setChatMessages(res.data || []);
      }
    } catch {
      // non-blocking
    }
  };

  const handleApproveReply = async () => {
    if (!selectedHandover || !editedReply.trim()) return;
    try {
      setActionLoading(true);
      const res = await api.handovers.approveReply(selectedHandover._id, editedReply);
      if (res.success) {
        showToast('Approved response dispatched to customer via WhatsApp.');
        await loadHandovers(false);
        await loadStats();
      }
    } catch (err) {
      alert('Failed to send reply: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedHandover) return;
    try {
      setActionLoading(true);
      const res = await api.handovers.resolve(selectedHandover._id, 'Resolved by agent');
      if (res.success) {
        showToast('Handover inquiry marked as resolved.');
        await loadHandovers(false);
        await loadStats();
      }
    } catch (err) {
      alert('Failed to mark resolved: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResumeAi = async () => {
    if (!selectedHandover) return;
    try {
      setActionLoading(true);
      const res = await api.handovers.resumeAi(selectedHandover._id);
      if (res.success) {
        showToast('AI Automation resumed for this conversation.');
        await loadHandovers(false);
        await loadStats();
      }
    } catch (err) {
      alert('Failed to resume AI: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetrySummary = async () => {
    if (!selectedHandover) return;
    try {
      setActionLoading(true);
      const res = await api.handovers.retrySummary(selectedHandover._id);
      if (res.success) {
        showToast('AI Summary re-generated with Gemini.');
        setSelectedHandover(res.data);
        setEditedReply(res.data.suggestedResponse || '');
        await loadHandovers(false);
      }
    } catch (err) {
      alert('Failed to re-evaluate summary: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getLeadCategoryBadge = (category) => {
    const cat = category || 'Unqualified';
    switch (cat.toLowerCase()) {
      case 'hot':
        return <span className="badge badge-hot"><Flame size={11} /> Hot</span>;
      case 'warm':
        return <span className="badge badge-warm">Warm</span>;
      case 'cold':
        return <span className="badge badge-cold">Cold</span>;
      default:
        return <span className="badge badge-muted">Unqualified</span>;
    }
  };

  const getSentimentBadge = (sentiment) => {
    const label = sentiment?.label || 'Neutral';
    let colorClass = 'var(--text-muted)';
    let bg = 'rgba(255, 255, 255, 0.05)';
    if (label.toLowerCase() === 'positive') {
      colorClass = 'var(--whatsapp-teal)';
      bg = 'rgba(0, 168, 132, 0.12)';
    } else if (label.toLowerCase() === 'negative') {
      colorClass = '#F87171';
      bg = 'rgba(239, 68, 68, 0.12)';
    }
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 8px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: '600',
        color: colorClass,
        background: bg
      }}>
        {label}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '24px',
          zIndex: 9999,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--emerald-500)',
          color: 'var(--text-primary)',
          padding: '12px 18px',
          borderRadius: '8px',
          fontSize: '13px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={16} color="var(--emerald-500)" />
          {toastMessage}
        </div>
      )}

      {/* Header & KPI Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <div className="panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)' }}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Awaiting Review</div>
            <div style={{ fontSize: '22px', fontWeight: '700', color: stats.pending > 0 ? 'var(--warning)' : 'var(--text-primary)' }}>
              {stats.pending || 0}
            </div>
          </div>
        </div>

        <div className="panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--emerald-500)' }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Resolved Inquiries</div>
            <div style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)' }}>
              {stats.resolved || 0}
            </div>
          </div>
        </div>

        <div className="panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--info)' }}>
            <Clock size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>AI Safety Mode</div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--emerald-500)' }}>
              Auto-Paused on Escalation
            </div>
          </div>
        </div>
      </div>

      {/* Main Review Section: Split List + Structured AI Context Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', minHeight: '620px' }}>
        {/* Left: Handover List */}
        <div className="panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-elevated)', padding: '3px', borderRadius: '8px' }}>
            <button
              onClick={() => setFilterStatus('pending_review')}
              className="btn btn-sm"
              style={{
                flex: 1,
                fontSize: '12px',
                padding: '6px',
                background: filterStatus === 'pending_review' ? 'var(--emerald-600)' : 'transparent',
                color: filterStatus === 'pending_review' ? '#FFFFFF' : 'var(--text-secondary)'
              }}
            >
              Pending ({stats.pending || 0})
            </button>
            <button
              onClick={() => setFilterStatus('resolved')}
              className="btn btn-sm"
              style={{
                flex: 1,
                fontSize: '12px',
                padding: '6px',
                background: filterStatus === 'resolved' ? 'var(--emerald-600)' : 'transparent',
                color: filterStatus === 'resolved' ? '#FFFFFF' : 'var(--text-secondary)'
              }}
            >
              Resolved ({stats.resolved || 0})
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {loading ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                Loading review queue...
              </div>
            ) : handovers.length === 0 ? (
              <div style={{ padding: '36px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                <CheckCircle2 size={32} color="var(--emerald-500)" style={{ margin: '0 auto 10px auto', opacity: 0.8 }} />
                No handovers in this filter.
              </div>
            ) : (
              handovers.map((h) => {
                const isSelected = selectedHandover?._id === h._id;
                const contact = h.contact || {};
                return (
                  <div
                    key={h._id}
                    onClick={() => setSelectedHandover(h)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      background: isSelected ? 'var(--bg-elevated)' : 'transparent',
                      border: isSelected ? '1px solid var(--emerald-500)' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                      <div style={{ fontWeight: '600', fontSize: '13.5px', color: 'var(--text-primary)' }}>
                        {contact.displayName || contact.phoneNumber || 'Customer'}
                      </div>
                      <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                        {new Date(h.handoverAt || h.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div style={{ fontSize: '11.5px', color: 'var(--warning)', marginBottom: '8px', fontWeight: '500' }}>
                      {h.handoverReason || 'Customer requested human agent'}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                      {getLeadCategoryBadge(h.leadCategory)}
                      {getSentimentBadge(h.sentiment)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Focused AI-Generated Summary & Action Review Panel */}
        {selectedHandover ? (
          <div className="panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {selectedHandover.contact?.displayName || 'Customer Contact'}
                  </h2>
                  <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--whatsapp-teal)' }}>
                    {selectedHandover.contact?.phoneNumber}
                  </span>
                  {getLeadCategoryBadge(selectedHandover.leadCategory)}
                  {getSentimentBadge(selectedHandover.sentiment)}
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                  Triggered at {new Date(selectedHandover.handoverAt || selectedHandover.createdAt).toLocaleString()} • Handover Reason: <span style={{ color: 'var(--warning)', fontWeight: '600' }}>{selectedHandover.handoverReason}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button onClick={handleRetrySummary} disabled={actionLoading} className="btn btn-secondary btn-sm" title="Re-evaluate Context Summary">
                  <RotateCcw size={14} />
                  <span>Re-evaluate</span>
                </button>
                {selectedHandover.status === 'pending_review' ? (
                  <button onClick={handleResolve} disabled={actionLoading} className="btn btn-secondary btn-sm">
                    <CheckCircle2 size={14} color="var(--emerald-500)" />
                    <span>Mark Resolved</span>
                  </button>
                ) : (
                  <button onClick={handleResumeAi} disabled={actionLoading} className="btn btn-primary btn-sm">
                    <Play size={14} />
                    <span>Resume AI Bot</span>
                  </button>
                )}
              </div>
            </div>

            {/* AI-Generated Context Summary (11-Point Structured Blueprint) */}
            <div style={{
              background: 'var(--bg-canvas)',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--whatsapp-teal)', fontWeight: '700', fontSize: '13px' }}>
                  <Sparkles size={16} />
                  <span>AI Conversation Context Summary (Review time: ~20 seconds)</span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Grounded strictly from customer chat
                </span>
              </div>

              {/* 1. Customer Objective */}
              <div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '3px' }}>
                  1. Customer Objective
                </div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {selectedHandover.customerObjective || selectedHandover.triggerMessage || 'Inquiring regarding service'}
                </div>
              </div>

              {/* 2. Conversation Summary */}
              <div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '3px' }}>
                  2. Conversation Timeline Summary
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {selectedHandover.conversationSummary || 'Customer started dialogue on WhatsApp.'}
                </div>
              </div>

              {/* Grid of Key Attributes: Requirements, Commitments, Unresolved Questions */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <div style={{ background: 'var(--bg-elevated)', padding: '10px 12px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    3. Requirements / Budget / Timeline
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-primary)', marginTop: '3px' }}>
                    {selectedHandover.customerRequirements || 'Not explicitly specified'}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-elevated)', padding: '10px 12px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    4. Agreed Commitments
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-primary)', marginTop: '3px' }}>
                    {selectedHandover.commitments || 'No commitments made'}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-elevated)', padding: '10px 12px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    5. Unresolved Questions
                  </div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-primary)', marginTop: '3px' }}>
                    {selectedHandover.unresolvedQuestions || selectedHandover.triggerMessage || 'Awaiting agent consultation'}
                  </div>
                </div>
              </div>

              {/* Important Cautions */}
              {selectedHandover.cautions && (
                <div style={{
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  borderRadius: '6px',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}>
                  <ShieldAlert size={16} color="var(--warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                    <span style={{ fontWeight: '600', color: 'var(--warning)' }}>Important Caution: </span>
                    {selectedHandover.cautions}
                  </div>
                </div>
              )}
            </div>

            {/* Editable Suggested Response (Human-in-the-Loop) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Send size={14} color="var(--whatsapp-teal)" />
                  <span>Suggested Response Draft (Editable & Requires Explicit Approval)</span>
                </label>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  Will be delivered to customer's WhatsApp via Kapso
                </span>
              </div>

              <textarea
                rows={4}
                className="form-control"
                value={editedReply}
                onChange={e => setEditedReply(e.target.value)}
                placeholder="Type or refine response to send to customer..."
                style={{ fontSize: '13.5px', lineHeight: '1.5' }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  ⚠️ Automated replies are currently <strong style={{ color: 'var(--warning)' }}>PAUSED</strong> for this contact.
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={handleApproveReply}
                    disabled={actionLoading || !editedReply.trim()}
                    className="btn btn-primary"
                    style={{ padding: '9px 20px', fontWeight: '600' }}
                  >
                    <Send size={15} />
                    <span>Approve & Send to WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Expandable Original Conversation Accordion */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
              <button
                onClick={() => setShowOriginalChat(!showOriginalChat)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  fontSize: '12.5px',
                  fontWeight: '500'
                }}
              >
                <MessageSquare size={14} />
                <span>Original Conversation History ({chatMessages.length} messages)</span>
                {showOriginalChat ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showOriginalChat && (
                <div style={{
                  marginTop: '12px',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  background: 'var(--bg-canvas)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  {chatMessages.length === 0 ? (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px' }}>
                      No prior messages found.
                    </div>
                  ) : (
                    chatMessages.map(m => {
                      const isInbound = m.direction === 'inbound';
                      return (
                        <div
                          key={m._id}
                          style={{
                            alignSelf: isInbound ? 'flex-start' : 'flex-end',
                            maxWidth: '80%',
                            background: isInbound ? 'var(--bg-elevated)' : 'rgba(0, 168, 132, 0.18)',
                            border: isInbound ? '1px solid var(--border-subtle)' : '1px solid rgba(0, 168, 132, 0.35)',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            fontSize: '12.5px',
                            color: 'var(--text-primary)'
                          }}
                        >
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '3px' }}>
                            {isInbound ? selectedHandover.contact?.displayName || 'Customer' : 'ReplyPilot AI'} • {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div>{m.text}</div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            Select a conversation from the left queue to review context summary.
          </div>
        )}
      </div>
    </div>
  );
}
