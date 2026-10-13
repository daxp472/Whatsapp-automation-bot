import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, Lock, Mail, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to sign in. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    setEmail('demo@replypilot.com');
    setPassword('demo123456');
    setError('');
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
      <div className="panel" style={{ width: '100%', maxWidth: '440px', padding: '36px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
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
          <h1 style={{ fontSize: '22px', fontWeight: '800' }}>Welcome to ReplyPilot</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Sign in to manage your WhatsApp bot and messages
          </p>
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
          <div className="form-group">
            <label className="form-label">Email address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input
                type="email"
                required
                className="form-control"
                placeholder="name@business.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ paddingLeft: '38px' }}
              />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label className="form-label" style={{ margin: 0 }}>Password</label>
              <Link to="/forgot-password" style={{ fontSize: '12px', color: 'var(--accent-violet)' }}>
                Forgot password?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input
                type="password"
                required
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ paddingLeft: '38px' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '8px' }}
          >
            {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
            <ArrowRight size={15} />
          </button>
        </form>

        {/* Demo Fast Fill Button */}
        <div style={{ marginTop: '20px', paddingTop: '18px', borderTop: '1px solid var(--border-subtle)', textAlign: 'center' }}>
          <button
            onClick={handleDemoFill}
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', fontSize: '12.5px' }}
          >
            <Sparkles size={14} color="var(--accent-teal)" />
            <span>Fill Demo Credentials (demo@replypilot.com)</span>
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', marginTop: '20px' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: 'var(--accent-teal)', fontWeight: '600' }}>
            Sign up (100 Free Msgs)
          </Link>
        </p>
      </div>
    </div>
  );
}
