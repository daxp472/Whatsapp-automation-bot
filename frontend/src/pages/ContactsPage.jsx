import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  User,
  Phone,
  MessageSquare,
  Calendar,
  X,
  Flame,
  Thermometer,
  RotateCcw,
  Edit3,
  Sliders,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Tag
} from 'lucide-react';
import { api } from '../services/api';

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [stats, setStats] = useState({ hot: 0, warm: 0, cold: 0, unqualified: 0, total: 0 });
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  // Add Contact Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [newName, setNewName] = useState('');

  // Lead Details & Edit Modal
  const [selectedContact, setSelectedContact] = useState(null);
  const [editFormData, setEditFormData] = useState({
    category: 'Warm',
    score: 50,
    purchaseIntent: 'Medium',
    budget: '',
    timeline: '',
    requirements: '',
    notes: '',
    manualOverride: true
  });
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    loadContacts();
    loadLeadStats();
  }, [search, categoryFilter]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const loadLeadStats = async () => {
    try {
      const res = await api.leads.getStats();
      if (res.success) {
        setStats(res.data);
      }
    } catch {
      // non-blocking
    }
  };

  const loadContacts = async () => {
    try {
      setLoading(true);
      const catParam = categoryFilter === 'all' ? '' : categoryFilter;
      const res = await api.leads.list({ category: catParam, search });
      if (res.success) {
        setContacts(res.data);
      }
    } catch {
      // non-blocking
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContact = async (e) => {
    e.preventDefault();
    if (!newPhone.trim()) return;
    try {
      const res = await api.contacts.create({ phoneNumber: newPhone, displayName: newName });
      if (res.success) {
        setShowAddModal(false);
        setNewPhone('');
        setNewName('');
        showToast('New customer contact created.');
        loadContacts();
        loadLeadStats();
      }
    } catch (err) {
      alert('Error creating contact: ' + err.message);
    }
  };

  const openLeadModal = (contact) => {
    setSelectedContact(contact);
    const lead = contact.lead || {};
    setEditFormData({
      category: lead.category || 'Unqualified',
      score: lead.score ?? 0,
      purchaseIntent: lead.purchaseIntent || 'Unknown',
      budget: lead.budget || '',
      timeline: lead.timeline || '',
      requirements: lead.requirements || '',
      notes: lead.notes || '',
      manualOverride: lead.manualOverride ?? true
    });
  };

  const handleSaveLead = async (e) => {
    e.preventDefault();
    if (!selectedContact) return;
    try {
      setSaveLoading(true);
      const res = await api.leads.update(selectedContact._id, editFormData);
      if (res.success) {
        showToast('Lead details and manual status updated in CRM.');
        setSelectedContact(null);
        loadContacts();
        loadLeadStats();
      }
    } catch (err) {
      alert('Failed to save lead: ' + err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleReEvaluate = async (contactId) => {
    try {
      showToast('Re-evaluating lead intent with Gemini 3.8...');
      const res = await api.leads.reEvaluate(contactId);
      if (res.success) {
        showToast(`Lead re-classified as ${res.data.lead?.category} (Score: ${res.data.lead?.score})`);
        loadContacts();
        loadLeadStats();
        if (selectedContact && selectedContact._id === contactId) {
          openLeadModal(res.data);
        }
      }
    } catch (err) {
      alert('Re-evaluation error: ' + err.message);
    }
  };

  const getCategoryBadge = (category) => {
    const cat = category || 'Unqualified';
    switch (cat.toLowerCase()) {
      case 'hot':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '11.5px',
            fontWeight: '700',
            color: '#F87171',
            background: 'rgba(239, 68, 68, 0.14)',
            border: '1px solid rgba(239, 68, 68, 0.3)'
          }}>
            <Flame size={12} /> Hot Lead
          </span>
        );
      case 'warm':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '11.5px',
            fontWeight: '700',
            color: 'var(--warning)',
            background: 'rgba(245, 158, 11, 0.14)',
            border: '1px solid rgba(245, 158, 11, 0.3)'
          }}>
            <Thermometer size={12} /> Warm Lead
          </span>
        );
      case 'cold':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '11.5px',
            fontWeight: '600',
            color: 'var(--info)',
            background: 'rgba(56, 189, 248, 0.14)',
            border: '1px solid rgba(56, 189, 248, 0.3)'
          }}>
            Cold Lead
          </span>
        );
      default:
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '11.5px',
            fontWeight: '500',
            color: 'var(--text-muted)',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)'
          }}>
            Unqualified
          </span>
        );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast */}
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

      {/* KPI Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
        <div
          onClick={() => setCategoryFilter('all')}
          className="panel"
          style={{
            padding: '14px 18px',
            cursor: 'pointer',
            border: categoryFilter === 'all' ? '1px solid var(--emerald-500)' : '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>All Contacts</div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>
            {stats.total || 0}
          </div>
        </div>

        <div
          onClick={() => setCategoryFilter('Hot')}
          className="panel"
          style={{
            padding: '14px 18px',
            cursor: 'pointer',
            border: categoryFilter === 'Hot' ? '1px solid #EF4444' : '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ fontSize: '11px', color: '#F87171', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Flame size={12} /> Hot Leads
          </div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#EF4444', marginTop: '2px' }}>
            {stats.hot || 0}
          </div>
        </div>

        <div
          onClick={() => setCategoryFilter('Warm')}
          className="panel"
          style={{
            padding: '14px 18px',
            cursor: 'pointer',
            border: categoryFilter === 'Warm' ? '1px solid var(--warning)' : '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--warning)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Thermometer size={12} /> Warm Leads
          </div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--warning)', marginTop: '2px' }}>
            {stats.warm || 0}
          </div>
        </div>

        <div
          onClick={() => setCategoryFilter('Cold')}
          className="panel"
          style={{
            padding: '14px 18px',
            cursor: 'pointer',
            border: categoryFilter === 'Cold' ? '1px solid var(--info)' : '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--info)', textTransform: 'uppercase' }}>Cold Leads</div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--info)', marginTop: '2px' }}>
            {stats.cold || 0}
          </div>
        </div>

        <div
          onClick={() => setCategoryFilter('Unqualified')}
          className="panel"
          style={{
            padding: '14px 18px',
            cursor: 'pointer',
            border: categoryFilter === 'Unqualified' ? '1px solid var(--text-secondary)' : '1px solid var(--border-subtle)'
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Unqualified</div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-muted)', marginTop: '2px' }}>
            {stats.unqualified || 0}
          </div>
        </div>
      </div>

      {/* Top Filter & Search Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search customer name or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '36px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-elevated)', padding: '3px', borderRadius: '8px' }}>
            {['all', 'Hot', 'Warm', 'Cold', 'Unqualified'].map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className="btn btn-sm"
                style={{
                  fontSize: '12px',
                  padding: '5px 10px',
                  background: categoryFilter === cat ? 'var(--emerald-600)' : 'transparent',
                  color: categoryFilter === cat ? '#FFFFFF' : 'var(--text-secondary)'
                }}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>
        </div>

        <button onClick={() => setShowAddModal(true)} className="btn btn-primary btn-sm">
          <Plus size={15} />
          <span>Add Contact</span>
        </button>
      </div>

      {/* Leads Table */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '12px 18px', fontWeight: '600' }}>Customer</th>
              <th style={{ padding: '12px 18px', fontWeight: '600' }}>WhatsApp Phone</th>
              <th style={{ padding: '12px 18px', fontWeight: '600' }}>Lead Status</th>
              <th style={{ padding: '12px 18px', fontWeight: '600' }}>Score (0-100)</th>
              <th style={{ padding: '12px 18px', fontWeight: '600' }}>Intent & Needs</th>
              <th style={{ padding: '12px 18px', fontWeight: '600' }}>Budget & Timeline</th>
              <th style={{ padding: '12px 18px', fontWeight: '600' }}>Last Qualified</th>
              <th style={{ padding: '12px 18px', fontWeight: '600', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Loading contacts and leads...
                </td>
              </tr>
            ) : contacts.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  No customer contacts match the current filter.
                </td>
              </tr>
            ) : (
              contacts.map(c => {
                const lead = c.lead || {};
                const score = lead.score ?? 0;
                let scoreColor = 'var(--text-muted)';
                if (score >= 70) scoreColor = '#EF4444';
                else if (score >= 40) scoreColor = 'var(--warning)';
                else if (score > 15) scoreColor = 'var(--info)';

                return (
                  <tr key={c._id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.15s ease' }}>
                    <td style={{ padding: '12px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: 'rgba(16, 185, 129, 0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--emerald-500)',
                          fontWeight: '600',
                          fontSize: '11px'
                        }}>
                          {c.displayName ? c.displayName[0].toUpperCase() : 'W'}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{c.displayName || 'Customer'}</div>
                          {lead.manualOverride && (
                            <span style={{ fontSize: '10px', color: 'var(--whatsapp-teal)' }}>Manual Edit Locked</span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '12px 18px', fontFamily: 'monospace', color: 'var(--whatsapp-teal)' }}>
                      {c.phoneNumber}
                    </td>

                    <td style={{ padding: '12px 18px' }}>
                      {getCategoryBadge(lead.category)}
                    </td>

                    <td style={{ padding: '12px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '45px', height: '6px', borderRadius: '3px', background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                          <div style={{ width: `${score}%`, height: '100%', background: scoreColor }} />
                        </div>
                        <span style={{ fontWeight: '700', fontSize: '12px', color: scoreColor }}>{score}</span>
                      </div>
                    </td>

                    <td style={{ padding: '12px 18px', maxWidth: '180px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {lead.purchaseIntent ? `Intent: ${lead.purchaseIntent}` : 'No intent detected'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {lead.requirements || 'No specific requirements'}
                      </div>
                    </td>

                    <td style={{ padding: '12px 18px' }}>
                      <div style={{ fontSize: '12px', color: lead.budget ? 'var(--emerald-500)' : 'var(--text-muted)' }}>
                        {lead.budget ? `Budget: ${lead.budget}` : 'Budget: Unspecified'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {lead.timeline ? `Timeline: ${lead.timeline}` : 'Timeline: Unspecified'}
                      </div>
                    </td>

                    <td style={{ padding: '12px 18px', fontSize: '11px', color: 'var(--text-muted)' }}>
                      {lead.lastQualifiedAt ? new Date(lead.lastQualifiedAt).toLocaleDateString() : 'Pending'}
                    </td>

                    <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          onClick={() => openLeadModal(c)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px', fontSize: '11.5px' }}
                          title="View & Edit Lead Details"
                        >
                          <Edit3 size={13} />
                          <span>Details</span>
                        </button>

                        <button
                          onClick={() => handleReEvaluate(c._id)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px', fontSize: '11.5px' }}
                          title="Re-evaluate with Gemini"
                        >
                          <RotateCcw size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Lead & Details Modal */}
      {selectedContact && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="panel" style={{ width: '560px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  Lead Profile: {selectedContact.displayName || 'Customer'}
                </h3>
                <div style={{ fontSize: '12px', fontFamily: 'monospace', color: 'var(--whatsapp-teal)' }}>
                  {selectedContact.phoneNumber}
                </div>
              </div>
              <button onClick={() => setSelectedContact(null)} className="btn btn-ghost btn-sm">
                <X size={16} />
              </button>
            </div>

            {/* AI Qualification Reason Box */}
            <div style={{ background: 'var(--bg-canvas)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '12px 14px', marginBottom: '18px' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>
                AI Qualification Rationale
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                {selectedContact.lead?.qualificationReason || 'No AI qualification reason logged yet.'}
              </div>
            </div>

            <form onSubmit={handleSaveLead} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Lead Category</label>
                  <select
                    className="form-control"
                    value={editFormData.category}
                    onChange={e => setEditFormData({ ...editFormData, category: e.target.value })}
                  >
                    <option value="Hot">Hot (Immediate purchase requirement)</option>
                    <option value="Warm">Warm (Interested, evaluating)</option>
                    <option value="Cold">Cold (Weak or early stage)</option>
                    <option value="Unqualified">Unqualified (No clear intent)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Lead Score: {editFormData.score}/100</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={editFormData.score}
                    onChange={e => setEditFormData({ ...editFormData, score: parseInt(e.target.value) })}
                    style={{ width: '100%', marginTop: '8px', accentColor: 'var(--emerald-500)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Purchase Intent</label>
                  <select
                    className="form-control"
                    value={editFormData.purchaseIntent}
                    onChange={e => setEditFormData({ ...editFormData, purchaseIntent: e.target.value })}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Explicit Budget</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. ₹5,000 or $1,000"
                    value={editFormData.budget}
                    onChange={e => setEditFormData({ ...editFormData, budget: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Purchase Timeline</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. This week, Next month"
                    value={editFormData.timeline}
                    onChange={e => setEditFormData({ ...editFormData, timeline: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Manual Override Lock</label>
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      id="manualOverride"
                      checked={editFormData.manualOverride}
                      onChange={e => setEditFormData({ ...editFormData, manualOverride: e.target.checked })}
                      style={{ accentColor: 'var(--emerald-500)', width: '16px', height: '16px' }}
                    />
                    <label htmlFor="manualOverride" style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                      Prevent AI from overriding manual edits
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Extracted Customer Requirements</label>
                <textarea
                  rows={2}
                  className="form-control"
                  placeholder="Specific requirements extracted from WhatsApp messages..."
                  value={editFormData.requirements}
                  onChange={e => setEditFormData({ ...editFormData, requirements: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>CRM Notes</label>
                <textarea
                  rows={2}
                  className="form-control"
                  placeholder="Sales notes, agent follow-up comments..."
                  value={editFormData.notes}
                  onChange={e => setEditFormData({ ...editFormData, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
                <button type="button" onClick={() => setSelectedContact(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={saveLoading} className="btn btn-primary">
                  {saveLoading ? 'Saving...' : 'Save Lead Updates'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="panel" style={{ width: '420px', maxWidth: '100%', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>Add New Contact</h3>
              <button onClick={() => setShowAddModal(false)} className="btn btn-ghost btn-sm">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateContact} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Full Name / Company</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  className="form-control"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>WhatsApp Phone Number (E.164)</label>
                <input
                  type="text"
                  placeholder="e.g. +919876543210"
                  className="form-control"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
