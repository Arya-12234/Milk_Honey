import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        minHeight: '60vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexDirection: 'column', gap: '1rem'
      }}>
        <div className="spinner" style={{ width: 28, height: 28, borderColor: 'rgba(44,36,23,.15)', borderTopColor: 'var(--gold)' }} />
        <p style={{ fontSize: '0.85rem', color: 'var(--warm-gray)' }}>Loading…</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
