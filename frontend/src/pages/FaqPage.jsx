import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  Globe,
  FileCode,
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  Eye,
  RotateCcw,
  BookOpen,
  Filter,
  Search,
  ExternalLink,
  Layers,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';

export default function FaqPage() {
  const [activeTab, setActiveTab] = useState('documents'); // 'documents' | 'faqs'
  const [documents, setDocuments] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  // Import Modals & Forms
  const [importType, setImportType] = useState('pdf'); // 'pdf' | 'text' | 'url'
  const [showImportModal, setShowImportModal] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // PDF Form
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfTitle, setPdfTitle] = useState('');
  const [pdfCategory, setPdfCategory] = useState('General');

  // Text Form
  const [pastedTitle, setPastedTitle] = useState('');
  const [pastedCategory, setPastedCategory] = useState('Services');
  const [pastedText, setPastedText] = useState('');

  // URL Form
  const [urlInput, setUrlInput] = useState('');
  const [urlTitle, setUrlTitle] = useState('');
  const [urlCategory, setUrlCategory] = useState('General');

  // Preview Document Modal
  const [previewDoc, setPreviewDoc] = useState(null);

  // FAQ Review & Approval Drawer
  const [reviewingDoc, setReviewingDoc] = useState(null);
  const [suggestedFaqs, setSuggestedFaqs] = useState([]);
  const [generatingFaqs, setGeneratingFaqs] = useState(false);
  const [selectedFaqIndices, setSelectedFaqIndices] = useState(new Set());
  const [approvingFaqs, setApprovingFaqs] = useState(false);

  // Manual FAQ Modal
  const [showManualFaqModal, setShowManualFaqModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [manualFaqForm, setManualFaqForm] = useState({ question: '', answer: '', category: 'General', enabled: true });
  const [faqSearch, setFaqSearch] = useState('');
  const [faqCatFilter, setFaqCatFilter] = useState('all');

  useEffect(() => {
    loadAll();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadDocuments(), loadFaqs()]);
    setLoading(false);
  };

  const loadDocuments = async () => {
    try {
      const res = await api.documents.list();
      if (res.success) setDocuments(res.data);
    } catch {
      // non-blocking
    }
  };

  const loadFaqs = async () => {
    try {
      const res = await api.faqs.list();
      if (res.success) setFaqs(res.data);
    } catch {
      // non-blocking
    }
  };

  // PDF Import Submission
  const handlePdfUpload = async (e) => {
    e.preventDefault();
    if (!pdfFile) {
      alert('Please select a PDF document.');
      return;
    }
    if (pdfFile.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit.');
      return;
    }

    try {
      setIsImporting(true);
      const formData = new FormData();
      formData.append('file', pdfFile);
      if (pdfTitle.trim()) formData.append('title', pdfTitle.trim());
      if (pdfCategory.trim()) formData.append('category', pdfCategory.trim());

      const res = await api.documents.uploadPdf(formData);
      if (res.success) {
        showToast('PDF document imported and text extracted successfully.');
        setShowImportModal(false);
        setPdfFile(null);
        setPdfTitle('');
        await loadDocuments();
        // Prompt user to review FAQs right away
        handleOpenFaqReview(res.data);
      }
    } catch (err) {
      alert('PDF Import error: ' + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  // Pasted Text Submission
  const handlePasteSubmit = async (e) => {
    e.preventDefault();
    if (!pastedTitle.trim() || !pastedText.trim() || pastedText.trim().length < 30) {
      alert('Please enter a title and at least 30 characters of text.');
      return;
    }

    try {
      setIsImporting(true);
      const res = await api.documents.pasteText({
        title: pastedTitle.trim(),
        category: pastedCategory.trim(),
        text: pastedText.trim()
      });
      if (res.success) {
        showToast('Business text knowledge saved successfully.');
        setShowImportModal(false);
        setPastedTitle('');
        setPastedText('');
        await loadDocuments();
        handleOpenFaqReview(res.data);
      }
    } catch (err) {
      alert('Text Import error: ' + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  // URL Import Submission
  const handleUrlSubmit = async (e) => {
    e.preventDefault();
    if (!urlInput.trim()) {
      alert('Please enter a valid website URL.');
      return;
    }

    try {
      setIsImporting(true);
      const res = await api.documents.importUrl({
        url: urlInput.trim(),
        title: urlTitle.trim() || undefined,
        category: urlCategory.trim()
      });
      if (res.success) {
        showToast('Website content fetched and processed successfully.');
        setShowImportModal(false);
        setUrlInput('');
        setUrlTitle('');
        await loadDocuments();
        handleOpenFaqReview(res.data);
      }
    } catch (err) {
      alert('URL Import error: ' + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  // Open FAQ Review & Trigger Gemini FAQ Generation
  const handleOpenFaqReview = async (doc) => {
    setReviewingDoc(doc);
    setGeneratingFaqs(true);
    try {
      const res = await api.documents.generateFaqs(doc._id);
      if (res.success) {
        const faqsGenerated = res.data || [];
        setSuggestedFaqs(faqsGenerated);
        // Default: select all
        setSelectedFaqIndices(new Set(faqsGenerated.map((_, idx) => idx)));
      }
    } catch (err) {
      alert('FAQ Generation Notice: ' + err.message);
    } finally {
      setGeneratingFaqs(false);
    }
  };

  const handleToggleFaqSelection = (index) => {
    const next = new Set(selectedFaqIndices);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setSelectedFaqIndices(next);
  };

  const handleUpdateSuggestedFaq = (index, field, value) => {
    const updated = [...suggestedFaqs];
    updated[index] = { ...updated[index], [field]: value };
    setSuggestedFaqs(updated);
  };

  const handleApproveSelectedFaqs = async () => {
    if (!reviewingDoc) return;
    const toApprove = suggestedFaqs.filter((_, idx) => selectedFaqIndices.has(idx));
    if (toApprove.length === 0) {
      alert('Please select at least one FAQ to approve.');
      return;
    }

    try {
      setApprovingFaqs(true);
      const res = await api.documents.approveFaqs(reviewingDoc._id, toApprove);
      if (res.success) {
        showToast(`Successfully published ${toApprove.length} knowledge FAQs into active AI grounding!`);
        setReviewingDoc(null);
        setSuggestedFaqs([]);
        await loadFaqs();
        await loadDocuments();
        setActiveTab('faqs');
      }
    } catch (err) {
      alert('Failed to approve FAQs: ' + err.message);
    } finally {
      setApprovingFaqs(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm('Delete this imported document and its associated suggested knowledge?')) return;
    try {
      const res = await api.documents.delete(docId);
      if (res.success) {
        showToast('Document removed.');
        await loadDocuments();
        await loadFaqs();
      }
    } catch (err) {
      alert('Failed to delete document: ' + err.message);
    }
  };

  // Manual FAQ handling
  const handleSaveManualFaq = async (e) => {
    e.preventDefault();
    try {
      if (editingFaq) {
        await api.faqs.update(editingFaq._id, manualFaqForm);
        showToast('Knowledge FAQ updated.');
      } else {
        await api.faqs.create(manualFaqForm);
        showToast('Knowledge FAQ added.');
      }
      setShowManualFaqModal(false);
      setEditingFaq(null);
      await loadFaqs();
    } catch (err) {
      alert('Failed to save FAQ: ' + err.message);
    }
  };

  const handleDeleteFaq = async (id) => {
    if (!window.confirm('Delete this FAQ fact?')) return;
    try {
      await api.faqs.delete(id);
      showToast('Knowledge fact deleted.');
      await loadFaqs();
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  };

  const openCreateManualFaq = () => {
    setEditingFaq(null);
    setManualFaqForm({ question: '', answer: '', category: 'General', enabled: true });
    setShowManualFaqModal(true);
  };

  const openEditManualFaq = (faq) => {
    setEditingFaq(faq);
    setManualFaqForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category || 'General',
      enabled: faq.enabled !== false
    });
    setShowManualFaqModal(true);
  };

  const filteredFaqs = faqs.filter(f => {
    const matchesSearch = faqSearch === '' ||
      f.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
      f.answer.toLowerCase().includes(faqSearch.toLowerCase());
    const matchesCat = faqCatFilter === 'all' || f.category === faqCatFilter;
    return matchesSearch && matchesCat;
  });

  const allCategories = ['all', ...new Set(faqs.map(f => f.category).filter(Boolean))];

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

      {/* Top Banner Grounding Explanation */}
      <div style={{
        padding: '16px 20px',
        borderRadius: '12px',
        background: 'rgba(16, 185, 129, 0.08)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--emerald-500)' }}>
            <Sparkles size={20} />
          </div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '14.5px', color: 'var(--text-primary)' }}>
              AI Knowledge Grounding Engine
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              Import business brochures, price lists, or URLs. Gemini extracts facts, generates FAQs, and grounds both WhatsApp & Simulator replies.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setShowImportModal(true)} className="btn btn-primary btn-sm">
            <Upload size={14} />
            <span>Import Document / Text</span>
          </button>
          <button onClick={openCreateManualFaq} className="btn btn-secondary btn-sm">
            <Plus size={14} />
            <span>Add Manual Fact</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '2px' }}>
        <button
          onClick={() => setActiveTab('documents')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'documents' ? '2px solid var(--emerald-500)' : '2px solid transparent',
            padding: '10px 18px',
            fontSize: '13.5px',
            fontWeight: '600',
            color: activeTab === 'documents' ? 'var(--emerald-500)' : 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Layers size={15} />
          <span>Imported Knowledge Sources ({documents.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('faqs')}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'faqs' ? '2px solid var(--emerald-500)' : '2px solid transparent',
            padding: '10px 18px',
            fontSize: '13.5px',
            fontWeight: '600',
            color: activeTab === 'faqs' ? 'var(--emerald-500)' : 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <BookOpen size={15} />
          <span>Active Grounding FAQs ({faqs.length})</span>
        </button>
      </div>

      {/* TAB 1: Documents & Ingestion */}
      {activeTab === 'documents' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '12px 18px', fontWeight: '600' }}>Document Title</th>
                  <th style={{ padding: '12px 18px', fontWeight: '600' }}>Source Type</th>
                  <th style={{ padding: '12px 18px', fontWeight: '600' }}>Extracted Size</th>
                  <th style={{ padding: '12px 18px', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '12px 18px', fontWeight: '600' }}>Import Date</th>
                  <th style={{ padding: '12px 18px', fontWeight: '600', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                      Loading documents...
                    </td>
                  </tr>
                ) : documents.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
                      <FileText size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px auto', opacity: 0.6 }} />
                      <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                        No business documents imported yet
                      </div>
                      <div style={{ fontSize: '12.5px', marginBottom: '16px' }}>
                        Upload your service catalog PDF, paste your company details, or import your website to train Gemini.
                      </div>
                      <button onClick={() => setShowImportModal(true)} className="btn btn-primary btn-sm">
                        <Upload size={14} />
                        <span>Import First Document</span>
                      </button>
                    </td>
                  </tr>
                ) : (
                  documents.map((doc) => {
                    let typeBadgeColor = 'var(--text-muted)';
                    let typeIcon = <FileText size={13} />;
                    if (doc.sourceType === 'pdf') {
                      typeBadgeColor = '#EF4444';
                      typeIcon = <FileCode size={13} />;
                    } else if (doc.sourceType === 'url') {
                      typeBadgeColor = 'var(--info)';
                      typeIcon = <Globe size={13} />;
                    } else {
                      typeBadgeColor = 'var(--whatsapp-teal)';
                    }

                    return (
                      <tr key={doc._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '12px 18px' }}>
                          <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{doc.title}</div>
                          {doc.category && (
                            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Category: {doc.category}</span>
                          )}
                        </td>

                        <td style={{ padding: '12px 18px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '600',
                            color: typeBadgeColor,
                            background: 'rgba(255,255,255,0.05)'
                          }}>
                            {typeIcon}
                            {doc.sourceType.toUpperCase()}
                          </span>
                        </td>

                        <td style={{ padding: '12px 18px', fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {doc.characterCount ? `${doc.characterCount.toLocaleString()} chars` : `${(doc.extractedText || '').length} chars`}
                        </td>

                        <td style={{ padding: '12px 18px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '600',
                            color: doc.status === 'completed' ? 'var(--emerald-500)' : 'var(--warning)',
                            background: doc.status === 'completed' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)'
                          }}>
                            {doc.status === 'completed' ? <Check size={11} /> : <AlertCircle size={11} />}
                            {doc.status || 'completed'}
                          </span>
                        </td>

                        <td style={{ padding: '12px 18px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </td>

                        <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              onClick={() => setPreviewDoc(doc)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '4px 8px', fontSize: '11.5px' }}
                              title="Preview Extracted Text"
                            >
                              <Eye size={13} />
                              <span>Preview</span>
                            </button>

                            <button
                              onClick={() => handleOpenFaqReview(doc)}
                              className="btn btn-primary btn-sm"
                              style={{ padding: '4px 10px', fontSize: '11.5px' }}
                              title="Generate & Review Suggested FAQs"
                            >
                              <Sparkles size={13} />
                              <span>Generate FAQs</span>
                            </button>

                            <button
                              onClick={() => handleDeleteDocument(doc._id)}
                              className="btn btn-ghost btn-sm"
                              style={{ padding: '4px 8px', color: '#EF4444' }}
                              title="Delete Document"
                            >
                              <Trash2 size={13} />
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
        </div>
      )}

      {/* TAB 2: Grounding FAQs */}
      {activeTab === 'faqs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Controls: Search & Category Filter */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', width: '280px' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search FAQ questions or answers..."
                  value={faqSearch}
                  onChange={e => setFaqSearch(e.target.value)}
                  className="form-control"
                  style={{ paddingLeft: '36px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-elevated)', padding: '3px', borderRadius: '8px' }}>
                {allCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFaqCatFilter(cat)}
                    className="btn btn-sm"
                    style={{
                      fontSize: '12px',
                      padding: '5px 10px',
                      background: faqCatFilter === cat ? 'var(--emerald-600)' : 'transparent',
                      color: faqCatFilter === cat ? '#FFFFFF' : 'var(--text-secondary)'
                    }}
                  >
                    {cat === 'all' ? 'All' : cat}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={openCreateManualFaq} className="btn btn-primary btn-sm">
              <Plus size={14} />
              <span>Add Knowledge Fact</span>
            </button>
          </div>

          {/* FAQs List Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredFaqs.length === 0 ? (
              <div className="panel" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                No active knowledge FAQs found in this category.
              </div>
            ) : (
              filteredFaqs.map(f => (
                <div key={f._id} className="panel" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: 'rgba(255,255,255,0.06)',
                        color: 'var(--emerald-500)',
                        fontSize: '11px',
                        fontWeight: '700'
                      }}>
                        {f.category || 'General'}
                      </span>

                      {f.documentTitle && (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Source: <strong style={{ color: 'var(--text-secondary)' }}>{f.documentTitle}</strong>
                        </span>
                      )}

                      {f.enabled === false && (
                        <span style={{ fontSize: '11px', color: 'var(--warning)', background: 'rgba(245, 158, 11, 0.12)', padding: '2px 6px', borderRadius: '4px' }}>
                          Disabled
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>
                      {f.question}
                    </div>

                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      {f.answer}
                    </div>

                    {f.sourceSnippet && (
                      <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic', borderLeft: '2px solid var(--border-subtle)', paddingLeft: '8px' }}>
                        Proof snippet: "{f.sourceSnippet}"
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => openEditManualFaq(f)} className="btn btn-secondary btn-sm" style={{ padding: '4px 8px' }}>
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => handleDeleteFaq(f._id)} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px', color: '#EF4444' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: Import Document / Text / URL */}
      {showImportModal && (
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
          <div className="panel" style={{ width: '560px', maxWidth: '100%', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
                Import Knowledge Source
              </h3>
              <button onClick={() => setShowImportModal(false)} className="btn btn-ghost btn-sm">
                <X size={16} />
              </button>
            </div>

            {/* Type selector tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', background: 'var(--bg-elevated)', padding: '4px', borderRadius: '8px' }}>
              <button
                type="button"
                onClick={() => setImportType('pdf')}
                className="btn btn-sm"
                style={{
                  flex: 1,
                  background: importType === 'pdf' ? 'var(--emerald-600)' : 'transparent',
                  color: importType === 'pdf' ? '#FFFFFF' : 'var(--text-secondary)'
                }}
              >
                <FileCode size={13} /> PDF Upload
              </button>
              <button
                type="button"
                onClick={() => setImportType('text')}
                className="btn btn-sm"
                style={{
                  flex: 1,
                  background: importType === 'text' ? 'var(--emerald-600)' : 'transparent',
                  color: importType === 'text' ? '#FFFFFF' : 'var(--text-secondary)'
                }}
              >
                <FileText size={13} /> Paste Text
              </button>
              <button
                type="button"
                onClick={() => setImportType('url')}
                className="btn btn-sm"
                style={{
                  flex: 1,
                  background: importType === 'url' ? 'var(--emerald-600)' : 'transparent',
                  color: importType === 'url' ? '#FFFFFF' : 'var(--text-secondary)'
                }}
              >
                <Globe size={13} /> Website URL
              </button>
            </div>

            {/* Form: PDF */}
            {importType === 'pdf' && (
              <form onSubmit={handlePdfUpload} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Document Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Services Catalog 2026 or Pricing Policy"
                    className="form-control"
                    value={pdfTitle}
                    onChange={e => setPdfTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Knowledge Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Services, Pricing, Company Policy"
                    className="form-control"
                    value={pdfCategory}
                    onChange={e => setPdfCategory(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Select PDF File (Max 10MB)</label>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    className="form-control"
                    onChange={e => {
                      if (e.target.files?.[0]) {
                        setPdfFile(e.target.files[0]);
                        if (!pdfTitle) setPdfTitle(e.target.files[0].name.replace('.pdf', ''));
                      }
                    }}
                    required
                  />
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Text is extracted server-side using secure parser. Macros are never executed.
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                  <button type="button" onClick={() => setShowImportModal(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={isImporting || !pdfFile} className="btn btn-primary">
                    {isImporting ? 'Extracting Text...' : 'Import & Extract'}
                  </button>
                </div>
              </form>
            )}

            {/* Form: Pasted Text */}
            {importType === 'text' && (
              <form onSubmit={handlePasteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Document Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Refund Policy or Office Hours"
                      className="form-control"
                      value={pastedTitle}
                      onChange={e => setPastedTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Category</label>
                    <input
                      type="text"
                      placeholder="e.g. Policies, Pricing"
                      className="form-control"
                      value={pastedCategory}
                      onChange={e => setPastedCategory(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Paste Business Text (Min 30 chars)</label>
                  <textarea
                    rows={8}
                    className="form-control"
                    placeholder="Paste business hours, pricing plans, terms of service, product specifications..."
                    value={pastedText}
                    onChange={e => setPastedText(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                  <button type="button" onClick={() => setShowImportModal(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={isImporting || pastedText.length < 30} className="btn btn-primary">
                    {isImporting ? 'Saving...' : 'Save Knowledge'}
                  </button>
                </div>
              </form>
            )}

            {/* Form: URL */}
            {importType === 'url' && (
              <form onSubmit={handleUrlSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Website URL</label>
                  <input
                    type="url"
                    placeholder="https://mybusiness.com/about or pricing"
                    className="form-control"
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Title (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Official Website Info"
                      className="form-control"
                      value={urlTitle}
                      onChange={e => setUrlTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Category</label>
                    <input
                      type="text"
                      placeholder="e.g. General"
                      className="form-control"
                      value={urlCategory}
                      onChange={e => setUrlCategory(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                  <button type="button" onClick={() => setShowImportModal(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={isImporting || !urlInput} className="btn btn-primary">
                    {isImporting ? 'Fetching...' : 'Fetch & Scrape'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: Extracted Text Preview */}
      {previewDoc && (
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
          <div className="panel" style={{ width: '640px', maxWidth: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {previewDoc.title}
                </h3>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Source: {previewDoc.sourceType} • {(previewDoc.extractedText || '').length} characters extracted
                </div>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="btn btn-ghost btn-sm">
                <X size={16} />
              </button>
            </div>

            <div style={{
              flex: 1,
              overflowY: 'auto',
              background: 'var(--bg-canvas)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '14px',
              fontSize: '12.5px',
              color: 'var(--text-secondary)',
              whiteSpace: 'pre-wrap',
              lineHeight: '1.6'
            }}>
              {previewDoc.extractedText || 'No text extracted.'}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
              <button onClick={() => setPreviewDoc(null)} className="btn btn-secondary">
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Suggested FAQs Review & Approval Drawer */}
      {reviewingDoc && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="panel" style={{ width: '740px', maxWidth: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} color="var(--emerald-500)" />
                  Review Suggested FAQs: {reviewingDoc.title}
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Gemini extracted the following Q&As from your document. Edit, select, and approve to activate them.
                </div>
              </div>
              <button onClick={() => setReviewingDoc(null)} className="btn btn-ghost btn-sm">
                <X size={16} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', paddingRight: '4px' }}>
              {generatingFaqs ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Sparkles size={24} color="var(--emerald-500)" style={{ margin: '0 auto 10px auto' }} />
                  <div>Gemini is reading document content and synthesizing customer FAQs...</div>
                </div>
              ) : suggestedFaqs.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No FAQs generated. Try typing a manual fact instead.
                </div>
              ) : (
                suggestedFaqs.map((faq, idx) => {
                  const isChecked = selectedFaqIndices.has(idx);
                  return (
                    <div
                      key={idx}
                      style={{
                        padding: '14px 16px',
                        borderRadius: '8px',
                        background: isChecked ? 'var(--bg-elevated)' : 'var(--bg-canvas)',
                        border: isChecked ? '1px solid var(--emerald-500)' : '1px solid var(--border-subtle)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleFaqSelection(idx)}
                            style={{ accentColor: 'var(--emerald-500)', width: '16px', height: '16px' }}
                          />
                          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--emerald-500)', textTransform: 'uppercase' }}>
                            FAQ #{idx + 1} ({faq.category || 'General'})
                          </span>
                        </div>

                        {faq.sourceSnippet && (
                          <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            Source quote verified
                          </span>
                        )}
                      </div>

                      <div>
                        <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Question</label>
                        <input
                          type="text"
                          className="form-control"
                          value={faq.question}
                          onChange={e => handleUpdateSuggestedFaq(idx, 'question', e.target.value)}
                          style={{ fontSize: '13px', fontWeight: '600' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Grounded Answer</label>
                        <textarea
                          rows={2}
                          className="form-control"
                          value={faq.answer}
                          onChange={e => handleUpdateSuggestedFaq(idx, 'answer', e.target.value)}
                          style={{ fontSize: '12.5px' }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {selectedFaqIndices.size} of {suggestedFaqs.length} FAQs selected for publication
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setReviewingDoc(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApproveSelectedFaqs}
                  disabled={approvingFaqs || selectedFaqIndices.size === 0}
                  className="btn btn-primary"
                >
                  {approvingFaqs ? 'Publishing...' : `Approve & Publish ${selectedFaqIndices.size} FAQs`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Manual FAQ Modal */}
      {showManualFaqModal && (
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
          <div className="panel" style={{ width: '480px', maxWidth: '100%', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {editingFaq ? 'Edit Knowledge Fact' : 'Add Knowledge Fact'}
              </h3>
              <button onClick={() => setShowManualFaqModal(false)} className="btn btn-ghost btn-sm">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveManualFaq} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Customer Question</label>
                <input
                  type="text"
                  placeholder="e.g. What are your opening hours on weekends?"
                  className="form-control"
                  value={manualFaqForm.question}
                  onChange={e => setManualFaqForm({ ...manualFaqForm, question: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Verified Answer</label>
                <textarea
                  rows={4}
                  placeholder="e.g. We are open from 10:00 AM to 6:00 PM on Saturdays and Sundays."
                  className="form-control"
                  value={manualFaqForm.answer}
                  onChange={e => setManualFaqForm({ ...manualFaqForm, answer: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Category</label>
                  <input
                    type="text"
                    placeholder="General, Support, Pricing"
                    className="form-control"
                    value={manualFaqForm.category}
                    onChange={e => setManualFaqForm({ ...manualFaqForm, category: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Status</label>
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      id="faqEnabled"
                      checked={manualFaqForm.enabled}
                      onChange={e => setManualFaqForm({ ...manualFaqForm, enabled: e.target.checked })}
                      style={{ accentColor: 'var(--emerald-500)', width: '16px', height: '16px' }}
                    />
                    <label htmlFor="faqEnabled" style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                      Enabled for AI grounding
                    </label>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowManualFaqModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Fact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
