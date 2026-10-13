import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Bot,
  User,
  Send,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Phone,
  Clock,
  MoreVertical,
  Shield,
  MessageSquare
} from 'lucide-react';
import { api } from '../services/api';

export default function InboxPage() {
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [filterMode, setFilterMode] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConversations();
  }, [filterMode, filterStatus, search]);

  useEffect(() => {
    const paramId = searchParams.get('id');
    if (paramId && conversations.length > 0) {
      const target = conversations.find(c => c._id === paramId);
      if (target) selectConversation(target);
    }
  }, [conversations, searchParams]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const res = await api.conversations.list({
        mode: filterMode === 'all' ? '' : filterMode,
        status: filterStatus === 'all' ? '' : filterStatus,
        search
      });
      if (res.success) {
        setConversations(res.data);
        if (!selectedConv && res.data.length > 0) {
          selectConversation(res.data[0]);
        }
      }
    } catch {
      // non-blocking
    } finally {
      setLoading(false);
    }
  };

  const selectConversation = async (conv) => {
    setSelectedConv(conv);
    try {
      const res = await api.conversations.getMessages(conv._id);
      if (res.success) {
        setMessages(res.data);
      }
    } catch {
      // non-blocking
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedConv) return;
    setSending(true);
    try {
      const res = await api.conversations.reply(selectedConv._id, replyText);
      if (res.success) {
        setMessages(prev => [...prev, res.data]);
        setReplyText('');
      }
    } catch (err) {
      alert('Error sending message: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  const toggleMode = async () => {
    if (!selectedConv) return;
    const nextMode = selectedConv.mode === 'human' ? 'ai' : 'human';
    try {
      const res = await api.conversations.update(selectedConv._id, { mode: nextMode });
      if (res.success) {
        setSelectedConv(prev => ({ ...prev, mode: nextMode }));
        setConversations(prev => prev.map(c => c._id === selectedConv._id ? { ...c, mode: nextMode } : c));
      }
    } catch (err) {
      alert('Error updating conversation mode: ' + err.message);
    }
  };

  const toggleStatus = async () => {
    if (!selectedConv) return;
    const nextStatus = selectedConv.status === 'resolved' ? 'open' : 'resolved';
    try {
      const res = await api.conversations.update(selectedConv._id, { status: nextStatus });
      if (res.success) {
        setSelectedConv(prev => ({ ...prev, status: nextStatus }));
        setConversations(prev => prev.map(c => c._id === selectedConv._id ? { ...c, status: nextStatus } : c));
      }
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '320px 1fr 280px',
      gap: '16px',
      height: 'calc(100vh - 120px)',
      background: 'var(--bg-panel)',
      border: '1px solid var(--border-subtle)',
      borderRadius: '16px',
      overflow: 'hidden'
    }}>
      {/* Column 1: Conversations List */}
      <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-subtle)', background: 'var(--bg-sidebar)' }}>
        {/* Search */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search chat or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '34px', fontSize: '13px', height: '36px' }}
            />
          </div>

          {/* Quick Filters */}
          <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
            {['all', 'ai', 'human'].map(m => (
              <button
                key={m}
                onClick={() => setFilterMode(m)}
                className={`btn btn-sm ${filterMode === m ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '11px', padding: '4px 10px', textTransform: 'capitalize' }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Conversation List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {conversations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--text-muted)', fontSize: '13px' }}>
              No conversations found.
            </div>
          ) : (
            conversations.map(conv => {
              const isSelected = selectedConv?._id === conv._id;
              return (
                <div
                  key={conv._id}
                  onClick={() => selectConversation(conv)}
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid var(--border-subtle)',
                    background: isSelected ? 'var(--bg-elevated)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                    borderLeft: isSelected ? '3px solid var(--accent-violet)' : '3px solid transparent'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {conv.contact?.displayName || conv.contact?.phoneNumber || 'Unknown'}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '6px' }}>
                    {conv.lastMessage?.text || 'No message yet'}
                  </div>

                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span className={`badge ${conv.mode === 'human' ? 'badge-warning' : 'badge-teal'}`} style={{ fontSize: '10px' }}>
                      {conv.mode === 'human' ? 'Human Takeover' : 'AI Active'}
                    </span>
                    {conv.status === 'resolved' && (
                      <span className="badge badge-success" style={{ fontSize: '10px' }}>Resolved</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Column 2: Message Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-canvas)' }}>
        {selectedConv ? (
          <>
            {/* Timeline Header */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-panel)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-violet)', fontWeight: '700', fontSize: '13px' }}>
                  {selectedConv.contact?.displayName ? selectedConv.contact.displayName[0] : 'W'}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '700' }}>{selectedConv.contact?.displayName || 'Customer'}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{selectedConv.contact?.phoneNumber}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={toggleMode} className={`btn btn-sm ${selectedConv.mode === 'human' ? 'btn-danger' : 'btn-secondary'}`}>
                  {selectedConv.mode === 'human' ? 'Resume AI' : 'Take Over Chat'}
                </button>
              </div>
            </div>

            {/* Message Stream */}
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', background: '#080D1A' }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No messages recorded in this conversation timeline.
                </div>
              ) : (
                messages.map(msg => {
                  const isInbound = msg.direction === 'inbound';
                  return (
                    <div
                      key={msg._id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isInbound ? 'flex-start' : 'flex-end',
                        maxWidth: '80%',
                        alignSelf: isInbound ? 'flex-start' : 'flex-end'
                      }}
                    >
                      <div style={{
                        padding: '10px 14px',
                        borderRadius: isInbound ? '14px 14px 14px 2px' : '14px 14px 2px 14px',
                        background: isInbound ? '#18233B' : (msg.senderType === 'ai' ? '#4C1D95' : '#047857'),
                        color: '#F8FAFC',
                        fontSize: '13.5px',
                        lineHeight: '1.5',
                        border: '1px solid rgba(255,255,255,0.06)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                      }}>
                        {!isInbound && (
                          <div style={{ fontSize: '10.5px', color: msg.senderType === 'ai' ? '#C4B5FD' : '#A7F3D0', fontWeight: '600', marginBottom: '2px' }}>
                            {msg.senderType === 'ai' ? '⚡ Gemini Grounded AI' : '👤 Operator Reply'}
                          </div>
                        )}
                        <p style={{ margin: 0 }}>{msg.text}</p>
                      </div>

                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', gap: '6px' }}>
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>· {msg.status || 'sent'}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Composer */}
            <form onSubmit={handleSendReply} style={{ padding: '14px 20px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-panel)', display: 'flex', gap: '10px' }}>
              <input
                type="text"
                placeholder={selectedConv.mode === 'human' ? "Type manual operator reply..." : "Manual reply (bot is currently in AI mode)..."}
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                className="form-control"
                style={{ flex: 1, fontSize: '13px' }}
              />
              <button type="submit" disabled={sending || !replyText.trim()} className="btn btn-primary btn-sm">
                <Send size={15} />
                <span>Send</span>
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center', margin: 'auto', color: 'var(--text-muted)' }}>
            Select a conversation on the left to review messages
          </div>
        )}
      </div>

      {/* Column 3: Contact & Bot Control Details */}
      {selectedConv && (
        <div style={{ padding: '20px', background: 'var(--bg-sidebar)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>Contact Information</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Name</span>
                <span style={{ fontWeight: '600' }}>{selectedConv.contact?.displayName || 'Unknown'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>WhatsApp Number</span>
                <span style={{ fontFamily: 'monospace' }}>{selectedConv.contact?.phoneNumber}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Source</span>
                <span style={{ textTransform: 'capitalize' }}>{selectedConv.source || 'whatsapp'}</span>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>Conversation State</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={toggleMode}
                className={`btn btn-sm ${selectedConv.mode === 'human' ? 'btn-danger' : 'btn-secondary'}`}
                style={{ width: '100%' }}
              >
                {selectedConv.mode === 'human' ? 'Switch to AI Mode' : 'Switch to Human Mode'}
              </button>

              <button
                onClick={toggleStatus}
                className="btn btn-secondary btn-sm"
                style={{ width: '100%' }}
              >
                {selectedConv.status === 'resolved' ? 'Reopen Conversation' : 'Mark as Resolved'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
