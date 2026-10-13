const BASE_URL = '/api/v1';

function getToken() {
  return localStorage.getItem('replypilot_token');
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('replypilot_token', token);
  } else {
    localStorage.removeItem('replypilot_token');
  }
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data?.error?.message || data?.message || 'Request failed';
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  // Auth
  auth: {
    login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    signup: (userData) => request('/auth/signup', { method: 'POST', body: JSON.stringify(userData) }),
    forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
    resetPassword: (payload) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) }),
    getMe: () => request('/auth/me')
  },

  // Bot Settings
  botSettings: {
    get: () => request('/bot-settings'),
    update: (data) => request('/bot-settings', { method: 'PATCH', body: JSON.stringify(data) })
  },

  // FAQs
  faqs: {
    list: () => request('/faqs'),
    create: (data) => request('/faqs', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request('/faqs/' + id, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id) => request('/faqs/' + id, { method: 'DELETE' })
  },

  // Reply Templates
  templates: {
    list: () => request('/reply-templates'),
    create: (data) => request('/reply-templates', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request('/reply-templates/' + id, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id) => request('/reply-templates/' + id, { method: 'DELETE' })
  },

  // Contacts
  contacts: {
    list: (search = '') => request(`/contacts?search=${encodeURIComponent(search)}`),
    get: (id) => request(`/contacts/${id}`),
    create: (data) => request('/contacts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/contacts/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  // Conversations
  conversations: {
    list: ({ status = '', mode = '', search = '' } = {}) =>
      request(`/conversations?status=${status}&mode=${mode}&search=${encodeURIComponent(search)}`),
    get: (id) => request(`/conversations/${id}`),
    getMessages: (id) => request(`/conversations/${id}/messages`),
    update: (id, data) => request(`/conversations/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    reply: (id, text) => request(`/conversations/${id}/reply`, { method: 'POST', body: JSON.stringify({ text }) }),
    simulate: (data) => request('/conversations/simulate', { method: 'POST', body: JSON.stringify(data) })
  },

  // Analytics
  analytics: {
    getSummary: () => request('/analytics/summary')
  },

  // Integrations
  integrations: {
    getStatus: () => request('/integrations/status'),
    testGemini: () => request('/integrations/gemini/test', { method: 'POST' }),
    testKapso: () => request('/integrations/kapso/test', { method: 'POST' })
  },

  // Presets
  presets: {
    list: () => request('/presets/list'),
    apply: (presetId) => request('/presets/apply', { method: 'POST', body: JSON.stringify({ presetId }) })
  },

  // Leads (Feature 1)
  leads: {
    list: ({ category = '', search = '', limit = 50, page = 1 } = {}) =>
      request(`/leads?category=${category}&search=${encodeURIComponent(search)}&limit=${limit}&page=${page}`),
    getStats: () => request('/leads/stats'),
    get: (contactId) => request(`/leads/${contactId}`),
    update: (contactId, data) => request(`/leads/${contactId}`, { method: 'PATCH', body: JSON.stringify(data) }),
    reEvaluate: (contactId) => request(`/leads/${contactId}/re-evaluate`, { method: 'POST' })
  },

  // Handover (Feature 2)
  handovers: {
    list: ({ status = '', limit = 50, page = 1 } = {}) =>
      request(`/handovers?status=${status}&limit=${limit}&page=${page}`),
    getStats: () => request('/handovers/stats'),
    get: (id) => request(`/handovers/${id}`),
    approveReply: (id, text) => request(`/handovers/${id}/approve-reply`, { method: 'POST', body: JSON.stringify({ text }) }),
    resolve: (id, resolutionNotes = '') => request(`/handovers/${id}/resolve`, { method: 'POST', body: JSON.stringify({ resolutionNotes }) }),
    resumeAi: (id) => request(`/handovers/${id}/resume-ai`, { method: 'POST' }),
    retrySummary: (id) => request(`/handovers/${id}/retry-summary`, { method: 'POST' })
  },

  // Knowledge Base Documents (Feature 3)
  documents: {
    list: ({ status = '', limit = 50, page = 1 } = {}) =>
      request(`/documents?status=${status}&limit=${limit}&page=${page}`),
    uploadPdf: (formData) => request('/documents/upload-pdf', { method: 'POST', body: formData }),
    pasteText: (data) => request('/documents/paste-text', { method: 'POST', body: JSON.stringify(data) }),
    importUrl: (data) => request('/documents/import-url', { method: 'POST', body: JSON.stringify(data) }),
    get: (id) => request(`/documents/${id}`),
    generateFaqs: (id) => request(`/documents/${id}/generate-faqs`, { method: 'POST' }),
    approveFaqs: (id, faqs) => request(`/documents/${id}/approve-faqs`, { method: 'POST', body: JSON.stringify({ faqs }) }),
    delete: (id) => request(`/documents/${id}`, { method: 'DELETE' })
  }
};
