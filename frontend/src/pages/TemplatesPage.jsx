import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, FileText, Check, X } from 'lucide-react';
import { api } from '../services/api';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTpl, setEditingTpl] = useState(null);
  const [formData, setFormData] = useState({ name: '', category: 'Greeting', body: '', enabled: true });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const res = await api.templates.list();
      if (res.success) setTemplates(res.data);
    } catch {
      // non-blocking
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingTpl(null);
    setFormData({ name: '', category: 'Greeting', body: '', enabled: true });
    setShowModal(true);
  };

  const openEditModal = (tpl) => {
    setEditingTpl(tpl);
    setFormData({ name: tpl.name, category: tpl.category || 'General', body: tpl.body, enabled: tpl.enabled !== false });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingTpl) {
        await api.templates.update(editingTpl._id, formData);
      } else {
        await api.templates.create(formData);
      }
      setShowModal(false);
      loadTemplates();
    } catch (err) {
      alert('Error saving template: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this template snippet?')) return;
    try {
      await api.templates.delete(id);
      loadTemplates();
    } catch (err) {
      alert('Error deleting template: ' + err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Standardized Reply Snippets</h2>
          <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Quick templates for greetings, handoffs, and instant answers</p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary btn-sm">
          <Plus size={15} />
          <span>New Template</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px' }}>
        {templates.map(tpl => (
          <div key={tpl._id} className="panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span className="badge badge-teal">{tpl.category}</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => openEditModal(tpl)} className="btn btn-ghost btn-sm" style={{ padding: '4px' }}>
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(tpl._id)} className="btn btn-ghost btn-sm" style={{ padding: '4px', color: 'var(--danger)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '8px' }}>{tpl.name}</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', background: 'var(--bg-elevated)', padding: '12px', borderRadius: '8px', lineHeight: '1.5' }}>
                {tpl.body}
              </p>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>{editingTpl ? 'Edit Template' : 'New Template'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave} style={{ padding: '24px' }}>
              <div className="form-group">
                <label className="form-label">Template Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="form-control"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="form-control"
                >
                  <option value="Greeting">Greeting</option>
                  <option value="Handoff">Handoff</option>
                  <option value="Fallback">Fallback</option>
                  <option value="Promotion">Promotion</option>
                  <option value="General">General</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Message Body</label>
                <textarea
                  required
                  rows={4}
                  value={formData.body}
                  onChange={e => setFormData({ ...formData, body: e.target.value })}
                  className="form-control"
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Save Template
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
