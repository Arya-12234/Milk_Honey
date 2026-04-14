import React from 'react';
import LoginForm from '../components/auth/LoginForm';
import './AuthPage.css';

export default function LoginPage() {
  return (
    <div className="auth-page">
      <div className="auth-page-left">
        <div className="auth-page-overlay">
          <div className="auth-left-content">
            <h2>"Crafted with love,<br />worn with grace."</h2>
            <p>Every piece tells a story. Discover handcrafted designs born from the heart of Nairobi.</p>
            <div className="auth-left-badges">
              <span className="badge badge-gold">Handcrafted</span>
              <span className="badge badge-gold">Ethically Made</span>
              <span className="badge badge-gold">Nairobi, Kenya</span>
            </div>
          </div>
        </div>
      </div>
      <div className="auth-page-right">
        <LoginForm />
      </div>
    </div>
  );
}
