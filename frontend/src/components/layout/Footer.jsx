import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <span className="footer-logo">M &amp; H Designs</span>
          <p>Handcrafted with love in Nairobi, Kenya.<br />Every piece tells a story.</p>
        </div>
        <div className="footer-links">
          <div className="footer-col">
            <h4>Shop</h4>
            <Link to="/collections">All Collections</Link>
            <Link to="/collections?cat=bridal">Bridal</Link>
            <Link to="/collections?cat=evening">Evening Wear</Link>
            <Link to="/collections?cat=everyday">Everyday</Link>
          </div>
          <div className="footer-col">
            <h4>Account</h4>
            <Link to="/login">Sign In</Link>
            <Link to="/register">Create Account</Link>
            <Link to="/orders">My Orders</Link>
            <Link to="/profile">Profile</Link>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <Link to="/about">About Us</Link>
            <Link to="/contact">Contact</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Milk &amp; Honey Designs. All rights reserved.</p>
        <p>Made with 💛 in Nairobi</p>
      </div>
    </footer>
  );
}
