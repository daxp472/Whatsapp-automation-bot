import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, Lock, Mail, User, Building, ArrowRight, AlertCircle, Zap, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    businessName: '',
    businessType: 'E-Commerce / Retail'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'var(--bg-canvas)'
    }}>
      <div className="panel" style={{ width: '100%', maxWidth: '480px', padding: '36px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'var(--primary-gradient)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '14px',
            boxShadow: '0 4px 16px rgba(139, 92, 246, 0.4)'
          }}>
            <Bot size={24} color="#FFFFFF" />
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: '800' }}>Create Your Free Account</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Build your WhatsApp AI bot in minutes
          </p>
        </div>

        {/* Free 100 Messages Banner */}
        <div style={{
          padding: '12px 16px',
          borderRadius: '12px',
          background: 'rgba(45, 212, 191, 0.1)',
          border: '1px solid rgba(45, 212, 191, 0.3)',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Zap size={18} color="var(--accent-teal)" />
          <div style={{ fontSize: '12.5px', color: 'var(--accent-teal)', fontWeight: '600' }}>
            Includes 100 free testing messages / month!
          </div>
        </div>

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px',
            borderRadius: '10px',
            background: 'rgba(248, 113, 113, 0.12)',
            border: '1px solid var(--danger)',
            color: 'var(--danger)',
            fontSize: '13px',
            marginBottom: '18px'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Your Name</label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="Sarah Connor"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  style={{ paddingLeft: '36px' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Business Name</label>
              <div style={{ position: 'relative' }}>
                <Building size={15} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="Acme Stores"
                  value={formData.businessName}
                  onChange={e => setFormData({ ...formData, businessName: e.target.value })}
                  style={{ paddingLeft: '36px' }}
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Industry / Business Type</label>
            <select
              className="form-control"
              value={formData.businessType}
              onChange={e => setFormData({ ...formData, businessType: e.target.value })}
            >
              <option value="E-Commerce / Retail">E-Commerce / Retail</option>
              <option value="Coaching / Education">Coaching / Education</option>
              <option value="Clinic / Healthcare">Clinic / Healthcare</option>
              <option value="Restaurant / Cafe">Restaurant / Cafe</option>
              <option value="Consulting / Agency">Consulting / Agency</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Email address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input
                type="email"
                required
                className="form-control"
                placeholder="name@business.com"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                style={{ paddingLeft: '36px' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input
                type="password"
                required
                minLength={6}
                className="form-control"
                placeholder="••••••••"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                style={{ paddingLeft: '36px' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '6px' }}
          >
            {loading ? 'Setting up workspace...' : 'Create Account & Start Testing'}
            <ArrowRight size={15} />
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', marginTop: '20px' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent-teal)', fontWeight: '600' }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
