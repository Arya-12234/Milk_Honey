import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAuthWebSocket } from '../../hooks/useWebSocket';
import './AuthForms.css';

const PASS_RULES = [
  { test: (p) => p.length >= 8,          label: '8+ characters' },
  { test: (p) => /[A-Z]/.test(p),        label: 'Uppercase letter' },
  { test: (p) => /[0-9]/.test(p),        label: 'Number' },
  { test: (p) => /[^A-Za-z0-9]/.test(p), label: 'Special character' },
];

export default function RegisterForm() {
  const { register } = useAuth();
  const { connected, on, checkEmail } = useAuthWebSocket();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', password: '', password_confirm: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [emailStatus, setEmailStatus] = useState(null); // null | 'checking' | 'available' | 'taken'
  const debounceRef = useRef(null);

  // Listen for WebSocket email check results
  useEffect(() => {
    const off = on('email_check_result', (data) => {
      setEmailStatus(data.exists ? 'taken' : 'available');
    });
    return off;
  }, [on]);

  // Debounced real-time email check via WebSocket
  const handleEmailChange = useCallback((value) => {
    setEmailStatus(null);
    clearTimeout(debounceRef.current);
    if (!value || !/\S+@\S+\.\S+/.test(value)) return;
    setEmailStatus('checking');
    debounceRef.current = setTimeout(() => {
      checkEmail(value);
    }, 500);
  }, [checkEmail]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    setServerError('');
    if (name === 'email') handleEmailChange(value);
  };

  const passStrength = PASS_RULES.filter((r) => r.test(form.password)).length;

  const validate = () => {
    const errs = {};
    if (!form.first_name.trim()) errs.first_name = 'First name is required';
    if (!form.last_name.trim()) errs.last_name = 'Last name is required';
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    else if (emailStatus === 'taken') errs.email = 'This email is already registered';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (!form.password_confirm) errs.password_confirm = 'Please confirm your password';
    else if (form.password !== form.password_confirm) errs.password_confirm = 'Passwords do not match';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setServerError('');
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        const fieldErrs = {};
        Object.keys(data).forEach((key) => {
          if (Array.isArray(data[key])) fieldErrs[key] = data[key][0];
        });
        if (Object.keys(fieldErrs).length) setErrors(fieldErrs);
        else setServerError(data.detail || 'Registration failed. Please try again.');
      } else {
        setServerError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const emailInputClass = () => {
    if (errors.email || emailStatus === 'taken') return 'error';
    if (emailStatus === 'available') return 'success';
    return '';
  };

  return (
    <div className="auth-form-wrap fade-up">
      <div className={`ws-dot ${connected ? 'connected' : ''}`} title={connected ? 'Live connection' : 'Connecting...'} />

      <div className="auth-brand">
        <h1>M &amp; H</h1>
        <p>Designs</p>
      </div>

      <div className="auth-header">
        <h2>Create your account</h2>
        <p>Join the Milk &amp; Honey community</p>
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
          <div className="field-row">
            <div className="field">
              <label htmlFor="first_name">First Name</label>
              <input id="first_name" name="first_name" type="text"
                value={form.first_name} onChange={handleChange}
                placeholder="Jane" className={errors.first_name ? 'error' : ''}
                autoComplete="given-name"
              />
              {errors.first_name && <span className="field-hint error">⚠ {errors.first_name}</span>}
            </div>
            <div className="field">
              <label htmlFor="last_name">Last Name</label>
              <input id="last_name" name="last_name" type="text"
                value={form.last_name} onChange={handleChange}
                placeholder="Doe" className={errors.last_name ? 'error' : ''}
                autoComplete="family-name"
              />
              {errors.last_name && <span className="field-hint error">⚠ {errors.last_name}</span>}
            </div>
          </div>

          <div className="field">
            <label htmlFor="email">Email Address</label>
            <div className="input-icon-wrap">
              <input id="email" name="email" type="email"
                value={form.email} onChange={handleChange}
                placeholder="you@example.com"
                className={emailInputClass()}
                autoComplete="email"
              />
              {/* Real-time email status icons */}
              {emailStatus === 'checking' && <span className="input-icon"><span className="spinner" style={{borderColor:'rgba(90,78,60,.3)',borderTopColor:'var(--warm-gray)'}}/></span>}
              {emailStatus === 'available' && <span className="input-icon success-icon">✓</span>}
              {emailStatus === 'taken'     && <span className="input-icon error-icon">✗</span>}
            </div>
            {errors.email && <span className="field-hint error">⚠ {errors.email}</span>}
            {!errors.email && emailStatus === 'available' && <span className="field-hint success">✓ Email is available</span>}
            {!errors.email && emailStatus === 'taken'     && <span className="field-hint error">✗ This email is already registered — <Link to="/login">sign in?</Link></span>}
          </div>

          <div className="field">
            <label htmlFor="phone">Phone <span className="optional">(optional)</span></label>
            <input id="phone" name="phone" type="tel"
              value={form.phone} onChange={handleChange}
              placeholder="+254 700 000 000"
              autoComplete="tel"
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password"
              value={form.password} onChange={handleChange}
              placeholder="••••••••"
              className={errors.password ? 'error' : form.password && passStrength >= 3 ? 'success' : ''}
              autoComplete="new-password"
            />
            {errors.password && <span className="field-hint error">⚠ {errors.password}</span>}
            {/* Strength bar */}
            {form.password && (
              <div className="pass-strength">
                <div className="strength-bar">
                  {[0,1,2,3].map((i) => (
                    <div key={i} className={`strength-seg ${passStrength > i ? `s${passStrength}` : ''}`} />
                  ))}
                </div>
                <div className="strength-rules">
                  {PASS_RULES.map((r) => (
                    <span key={r.label} className={r.test(form.password) ? 'rule-ok' : 'rule-no'}>
                      {r.test(form.password) ? '✓' : '○'} {r.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="field">
            <label htmlFor="password_confirm">Confirm Password</label>
            <input id="password_confirm" name="password_confirm" type="password"
              value={form.password_confirm} onChange={handleChange}
              placeholder="••••••••"
              className={
                errors.password_confirm ? 'error'
                : form.password_confirm && form.password === form.password_confirm ? 'success'
                : ''
              }
              autoComplete="new-password"
            />
            {errors.password_confirm && <span className="field-hint error">⚠ {errors.password_confirm}</span>}
            {!errors.password_confirm && form.password_confirm && form.password === form.password_confirm && (
              <span className="field-hint success">✓ Passwords match</span>
            )}
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-full" disabled={loading || emailStatus === 'taken'}>
          {loading ? <><span className="spinner" /> Creating account…</> : 'Create Account'}
        </button>

        <p className="terms-note">
          By creating an account you agree to our <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>.
        </p>
      </form>

      <div className="divider">or</div>

      <p className="auth-switch">
        Already have an account? <Link to="/login">Sign in →</Link>
      </p>
    </div>
  );
}
