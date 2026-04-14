import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAuthWebSocket } from '../../hooks/useWebSocket';
import './Auth.css';

export default function RegisterPage() {
  const { register } = useAuth();
  const { connected, on, checkEmail } = useAuthWebSocket();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '', password_confirm: '' });
  const [emailStatus, setEmailStatus] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    const off = on('email_check_result', d => setEmailStatus(d.exists ? 'taken' : 'available'));
    return off;
  }, [on]);

  const handleEmailChange = useCallback((val) => {
    setEmailStatus(null);
    clearTimeout(debounceRef.current);
    if (!val || !/\S+@\S+\.\S+/.test(val)) return;
    setEmailStatus('checking');
    debounceRef.current = setTimeout(() => checkEmail(val), 500);
  }, [checkEmail]);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (k === 'email') handleEmailChange(v);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.password_confirm) { setError('All fields are required.'); return; }
    if (form.password !== form.password_confirm) { setError('Passwords do not match.'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (emailStatus === 'taken') { setError('This email is already registered.'); return; }
    setLoading(true); setError('');
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      if (data?.email) setError(data.email[0]);
      else setError('Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  const emailBorderColor = emailStatus === 'available' ? 'var(--success)' :
    emailStatus === 'taken' ? 'var(--danger)' : '';

  return (
    <div className="auth-page register-page">
      {/* Teal top */}
      <div className="auth-teal-top register-top">
        <h1 className="auth-brand-big">M &amp; H</h1>
      </div>

      {/* Form */}
      <div className="auth-form-section">
        <Link to="/login" className="back-to-login">← Back to login</Link>
        <h2 className="register-title">Sign Up</h2>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="auth-field-gap">
            <div className="mint-input" style={emailBorderColor ? { borderColor: emailBorderColor } : {}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,12 2,6"/></svg>
              <input type="email" placeholder="Email" value={form.email}
                onChange={e => set('email', e.target.value)} autoComplete="email" />
              {emailStatus === 'checking' && <span className="spinner" style={{ borderTopColor: 'var(--teal)' }} />}
              {emailStatus === 'available' && <span style={{ color: 'var(--success)', fontSize: '16px' }}>✓</span>}
              {emailStatus === 'taken' && <span style={{ color: 'var(--danger)', fontSize: '16px' }}>✗</span>}
            </div>
            {emailStatus === 'taken' && <p className="field-hint-err">Email already registered — <Link to="/login">sign in?</Link></p>}
          </div>

          <div className="auth-field-gap">
            <div className="mint-input">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <input type="password" placeholder="Password" value={form.password}
                onChange={e => set('password', e.target.value)} autoComplete="new-password" />
            </div>
          </div>

          <div className="auth-field-gap">
            <div className="mint-input" style={form.password_confirm && form.password === form.password_confirm ? { borderColor: 'var(--success)' } : {}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <input type="password" placeholder="Confirm Password" value={form.password_confirm}
                onChange={e => set('password_confirm', e.target.value)} autoComplete="new-password" />
            </div>
          </div>

          <div style={{ marginTop: 8, marginBottom: 4, fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: connected ? 'var(--success)' : '#ccc', display: 'inline-block' }} />
            {connected ? 'Real-time validation active' : 'Connecting…'}
          </div>

          <div style={{ marginTop: 16 }}>
            <button type="submit" className="btn-teal" disabled={loading || emailStatus === 'taken'}>
              {loading ? <><span className="spinner" /> Creating account…</> : 'SIGN UP'}
            </button>
          </div>
        </form>

        <p className="auth-switch-text" style={{ marginTop: 16 }}>
          Already have an account? <Link to="/login" className="auth-switch-link">Login</Link>
        </p>
      </div>
    </div>
  );
}
