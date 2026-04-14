import React from 'react';
import RegisterForm from '../components/auth/RegisterForm';
import './AuthPage.css';

export default function RegisterPage() {
  return (
    <div className="auth-page">
      <div className="auth-page-left">
        <div className="auth-page-overlay">
          <div className="auth-left-content">
            <h2>"Beauty woven<br />into every thread."</h2>
            <p>Join a community that values artisanship, sustainability, and timeless elegance.</p>
            <div className="auth-left-stats">
              <div className="stat">
                <span className="stat-num">2,400+</span>
                <span className="stat-label">Happy clients</span>
              </div>
              <div className="stat">
                <span className="stat-num">180+</span>
                <span className="stat-label">Unique designs</span>
              </div>
              <div className="stat">
                <span className="stat-num">5★</span>
                <span className="stat-label">Average rating</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="auth-page-right">
        <RegisterForm />
      </div>
    </div>
  );
}
