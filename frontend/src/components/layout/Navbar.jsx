import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [areasOpen, setAreasOpen] = useState(false);

  const handleLogout = async () => { await logout(); navigate('/'); };
  const isActive = (path) => location.pathname === path;

  return (
    <header className="navbar">
      <div className="navbar-inner container">
        <Link to="/" className="navbar-logo">
          <span className="logo-mh">M &amp; H</span>
          <span className="logo-tagline">Smart Farming</span>
        </Link>

        <nav className="navbar-links">
          <Link to="/" className={isActive('/') ? 'active' : ''}>Home</Link>
          <Link to="/about" className={isActive('/about') ? 'active' : ''}>About Us</Link>
          <Link to="/services" className={isActive('/services') ? 'active' : ''}>Services</Link>
          <Link to="/data" className={isActive('/data') ? 'active' : ''}>Contact</Link>

          {/* Area of Applications dropdown */}
          <div className="nav-dropdown" onMouseEnter={() => setAreasOpen(true)} onMouseLeave={() => setAreasOpen(false)}>
            <button className="nav-dropdown-trigger">
              Area of Applications ▾
            </button>
            {areasOpen && (
              <div className="nav-dropdown-menu">
                <Link to="/farm" onClick={() => setAreasOpen(false)}>Farm AI Dashboard</Link>
                <Link to="/actions" onClick={() => setAreasOpen(false)}>Automated Actions</Link>
                <Link to="/data" onClick={() => setAreasOpen(false)}>Data Logging &amp; Analysis</Link>
              </div>
            )}
          </div>

          <Link to="/enquiry" className={isActive('/enquiry') ? 'active' : ''}>Enquiry</Link>
        </nav>

        <div className="navbar-auth">
          {user ? (
            <div className="user-menu" onClick={() => setDropdownOpen(!dropdownOpen)}>
              <div className="user-avatar">
                {user.avatar_url
                  ? <img src={user.avatar_url} alt={user.first_name} />
                  : <span>{user.first_name?.[0]}{user.last_name?.[0]}</span>}
              </div>
              <span className="user-name">{user.first_name}</span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              {dropdownOpen && (
                <div className="user-dropdown">
                  <div className="dropdown-header">
                    <p className="dropdown-name">{user.first_name} {user.last_name}</p>
                    <p className="dropdown-email">{user.email}</p>
                  </div>
                  <div className="dropdown-divider" />
                  <Link to="/dashboard" onClick={() => setDropdownOpen(false)}>Dashboard</Link>
                  <Link to="/farm" onClick={() => setDropdownOpen(false)}>Farm AI</Link>
                  <Link to="/profile" onClick={() => setDropdownOpen(false)}>Profile</Link>
                  <div className="dropdown-divider" />
                  <button onClick={handleLogout}>Sign Out</button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
            </div>
          )}
        </div>

        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          <span /><span /><span />
        </button>
      </div>

      {menuOpen && (
        <div className="mobile-menu">
          <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
          <Link to="/about" onClick={() => setMenuOpen(false)}>About Us</Link>
          <Link to="/services" onClick={() => setMenuOpen(false)}>Services</Link>
          <Link to="/farm" onClick={() => setMenuOpen(false)}>Farm AI</Link>
          <Link to="/actions" onClick={() => setMenuOpen(false)}>Automated Actions</Link>
          <Link to="/data" onClick={() => setMenuOpen(false)}>Data Logging</Link>
          <Link to="/enquiry" onClick={() => setMenuOpen(false)}>Enquiry</Link>
          {user ? (
            <button onClick={() => { handleLogout(); setMenuOpen(false); }}>Sign Out</button>
          ) : (
            <Link to="/login" onClick={() => setMenuOpen(false)}>Login</Link>
          )}
        </div>
      )}
    </header>
  );
}
