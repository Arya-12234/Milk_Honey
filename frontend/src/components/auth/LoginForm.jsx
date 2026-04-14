import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAuthWebSocket } from '../../hooks/useWebSocket';
import './AuthForms.css';

export default function LoginForm() {
  const { login } = useAuth();
  const { connected, on } = useAuthWebSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [wsStatus, setWsStatus] = useState('');

  // Listen for WS token validation feedback
  useEffect(() => {
    const off = on('token_valid', () => setWsStatus('Session verified'));
    return off;
  }, [on]);

  const from = location.state?.from?.pathname || '/dashboard';

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setServerError('');
    try {
      await login(form.email, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      const data = err.response?.data;
      if (data?.non_field_errors) setServerError(data.non_field_errors[0]);
      else setServerError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form-wrap fade-up">
      {/* WS Indicator */}
      <div className={`ws-dot ${connected ? 'connected' : ''}`} title={connected ? 'Live' : 'Connecting...'} />

      <div className="auth-brand">
        <h1>M &amp; H</h1>
        <p>Designs</p>
      </div>

      <div className="auth-header">
        <h2>Welcome back</h2>
        <p>Sign in to your Milk &amp; Honey account</p>
      </div>

      {serverError && (
        <div className="alert alert-error">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-fields">
          <div className="field">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className={errors.email ? 'error' : ''}
              autoComplete="email"
            />
            {errors.email && <span className="field-hint error">⚠ {errors.email}</span>}
          </div>

          <div className="field">
            <div className="label-row">
              <label htmlFor="password">Password</label>
              <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className={errors.password ? 'error' : ''}
              autoComplete="current-password"
            />
            {errors.password && <span className="field-hint error">⚠ {errors.password}</span>}
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
          {loading ? <><span className="spinner" /> Signing in…</> : 'Sign In'}
        </button>
      </form>

      <div className="divider">or</div>

      <p className="auth-switch">
        Don't have an account? <Link to="/register">Create one →</Link>
      </p>
    </div>
  );
}
