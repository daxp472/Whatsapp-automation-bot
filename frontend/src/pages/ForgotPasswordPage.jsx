import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Mail, Lock, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendLink = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.auth.forgotPassword(email);
      if (res.success) {
        setMessage(res.message);
        setStep(2);
      }
    } catch (err) {
      setError(err.message || 'Error processing request');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.auth.resetPassword({ email, newPassword });
      if (res.success) {
        setMessage(res.message);
        setStep(3);
      }
    } catch (err) {
      setError(err.message || 'Error resetting password');
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
      <div className="panel" style={{ width: '100%', maxWidth: '440px', padding: '36px' }}>
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
          <h1 style={{ fontSize: '22px', fontWeight: '800' }}>Reset Password</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {step === 1 ? 'Enter your account email to receive reset instructions' : 'Set your new password'}
          </p>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', borderRadius: '10px', background: 'rgba(248, 113, 113, 0.12)', border: '1px solid var(--danger)', color: 'var(--danger)', fontSize: '13px', marginBottom: '18px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {message && step !== 3 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', borderRadius: '10px', background: 'rgba(45, 212, 191, 0.12)', border: '1px solid var(--accent-teal)', color: 'var(--accent-teal)', fontSize: '13px', marginBottom: '18px' }}>
            <CheckCircle2 size={16} />
            <span>{message}</span>
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleSendLink}>
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

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: '6px' }}>
              {loading ? 'Sending link...' : 'Send Reset Instructions'}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  required
                  minLength={6}
                  className="form-control"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  style={{ paddingLeft: '38px' }}
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: '6px' }}>
              {loading ? 'Updating password...' : 'Update Password'}
            </button>
          </form>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
              <CheckCircle2 size={24} color="var(--success)" />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>Password Updated!</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
              Your password has been changed successfully. You can now log in.
            </p>
            <Link to="/login" className="btn btn-primary" style={{ width: '100%' }}>
              Proceed to Sign In
            </Link>
          </div>
        )}

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <Link to="/login" style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={14} />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
