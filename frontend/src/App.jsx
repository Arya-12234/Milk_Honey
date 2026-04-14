import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/layout/ProtectedRoute';

import HomePage              from './components/pages/HomePage';
import LoginPage             from './components/auth/LoginPage';
import RegisterPage          from './components/auth/RegisterPage';
import DashboardPage         from './components/dashboard/DashboardPage';
import RealTimeMonitoring    from './components/pages/RealTimeMonitoring';
import AutomatedActionsPage  from './components/pages/AutomatedActionsPage';
import DataLoggingPage       from './components/pages/DataLoggingPage';
import WeatherPage           from './components/pages/WeatherPage';
import CommunityPage         from './components/pages/CommunityPage';
import EnquiryPage           from './components/pages/EnquiryPage';
import MLDashboardPage       from './components/pages/MLDashboardPage';

import './index.css';
import './components/layout/DashboardLayout.css';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* PUBLIC — homepage is now the root */}
          <Route path="/"         element={<HomePage />} />
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/enquiry"  element={<EnquiryPage />} />

          {/* PROTECTED — dashboard and all sub-pages */}
          <Route path="/dashboard"            element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/dashboard/monitoring" element={<ProtectedRoute><RealTimeMonitoring /></ProtectedRoute>} />
          <Route path="/dashboard/data"       element={<ProtectedRoute><DataLoggingPage /></ProtectedRoute>} />
          <Route path="/dashboard/actions"    element={<ProtectedRoute><AutomatedActionsPage /></ProtectedRoute>} />
          <Route path="/dashboard/growth"     element={<ProtectedRoute><MLDashboardPage /></ProtectedRoute>} />
          <Route path="/dashboard/weather"    element={<ProtectedRoute><WeatherPage /></ProtectedRoute>} />
          <Route path="/dashboard/community"  element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
