import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { shopAPI } from '../../services/api';
import './DashboardPage.css';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    shopAPI.getDashboard()
      .then(({ data }) => setStats(data.stats))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="dashboard">
      {/* Hero greeting */}
      <div className="dash-hero">
        <div className="container">
          <div className="dash-hero-inner">
            <div>
              <p className="dash-greeting">Welcome back,</p>
              <h1>{user?.first_name} {user?.last_name}</h1>
              <p className="dash-email">{user?.email}</p>
            </div>
            <div className="dash-avatar-lg">
              {user?.avatar_url
                ? <img src={user.avatar_url} alt={user.first_name} />
                : <span>{user?.first_name?.[0]}{user?.last_name?.[0]}</span>
              }
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Stats */}
        <div className="dash-stats">
          {[
            { label: 'Total Orders', value: stats?.total_orders ?? '—', icon: '📦' },
            { label: 'Pending', value: stats?.pending_orders ?? '—', icon: '⏳' },
            { label: 'Delivered', value: stats?.delivered_orders ?? '—', icon: '✅' },
            { label: 'Member Since', value: user?.date_joined ? new Date(user.date_joined).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' }) : '—', icon: '🌿' },
          ].map((s) => (
            <div key={s.label} className="stat-card card">
              <span className="stat-icon">{s.icon}</span>
              <span className="stat-value">{loading ? '…' : s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="dash-section">
          <h2 className="dash-section-title">Quick Actions</h2>
          <div className="dash-actions">
            {[
              { label: 'Browse Collections', href: '/collections', icon: '🛍️' },
              { label: 'My Orders', href: '/orders', icon: '📋' },
              { label: 'Edit Profile', href: '/profile', icon: '✏️' },
              { label: 'Get Support', href: '/support', icon: '💬' },
            ].map((a) => (
              <button key={a.label} className="action-card card" onClick={() => navigate(a.href)}>
                <span className="action-icon">{a.icon}</span>
                <span className="action-label">{a.label}</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* Account info */}
        <div className="dash-section">
          <h2 className="dash-section-title">Account Details</h2>
          <div className="info-card card">
            <div className="info-row">
              <span className="info-key">Full Name</span>
              <span className="info-val">{user?.full_name}</span>
            </div>
            <div className="info-row">
              <span className="info-key">Email</span>
              <span className="info-val">{user?.email}</span>
            </div>
            {user?.phone && (
              <div className="info-row">
                <span className="info-key">Phone</span>
                <span className="info-val">{user?.phone}</span>
              </div>
            )}
            <div className="info-row">
              <span className="info-key">Member Since</span>
              <span className="info-val">
                {user?.date_joined && new Date(user.date_joined).toLocaleDateString('en-KE', { dateStyle: 'long' })}
              </span>
            </div>
          </div>
        </div>

        <button className="btn btn-outline" onClick={handleLogout} style={{ marginTop: '1rem', marginBottom: '3rem' }}>
          Sign Out
        </button>
      </div>
    </div>
  );
}
