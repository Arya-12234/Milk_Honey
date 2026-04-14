import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';

const STEPS = [
  { icon: '🌡️', title: 'Sensors collect data', desc: 'pH, moisture, humidity, temperature and pesticide levels tracked continuously.' },
  { icon: '📶', title: 'Wireless transmission', desc: 'Sensors send data wirelessly to the M&H base station in real time.' },
  { icon: '☁️', title: 'Cloud storage & AI', desc: 'Farming operations are automatically controlled using connected AI systems.' },
  { icon: '🖥️', title: 'Visual dashboard', desc: 'Farmers access live data through an interactive dashboard.' },
  { icon: '🔔', title: 'Alerts & recommendations', desc: 'Farmers receive timely alerts and tailored AI recommendations.' },
];

const SERVICES = [
  { icon: '📡', title: 'Real Time Monitoring', desc: 'Live sensor data for soil pH, humidity, temperature and pest activity across your entire farm.', link: '/dashboard/monitoring' },
  { icon: '⚡', title: 'Automated Actions', desc: 'Intelligent irrigation, pH adjustment and pesticide control that acts automatically on sensor thresholds.', link: '/dashboard/actions' },
  { icon: '📊', title: 'Data Logging & Analysis', desc: 'Continuous recording, trend analysis, custom reports and visual dashboards for every sensor.', link: '/dashboard/data' },
];

const WHY = [
  { icon: '📈', title: 'Increased Yields', desc: 'Data-driven decisions maximise crop production.' },
  { icon: '💚', title: 'Save Resources', desc: 'Precise automation eliminates over-watering and over-spraying.' },
  { icon: '🧠', title: 'Smart Decisions', desc: 'Real-time analytics surface the insights that matter most.' },
  { icon: '📱', title: 'Access Anywhere', desc: 'Monitor your farm from any device, anywhere in the world.' },
];

export default function HomePage() {
  return (
    <div className="hp">
      <header className="hp-nav">
        <div className="hp-nav-inner">
          <span className="hp-logo">M &amp; H</span>
          <nav className="hp-nav-links">
            <a href="#about">About Us</a>
            <a href="#services">Services</a>
            <a href="#contact">Contact</a>
            <a href="#services">Area of Applications</a>
            <Link to="/enquiry">Enquiry</Link>
          </nav>
          <Link to="/login" className="hp-login-btn">Login</Link>
        </div>
      </header>

      <section className="hp-hero">
        <h1 className="hp-hero-title">MILK AND HONEY</h1>
        <p className="hp-hero-sub">Smart Farming</p>
        <p className="hp-hero-desc">Automate your farm management</p>
        <div className="hp-hero-badges">
          <span className="hp-badge">📡 Real Time Monitoring</span>
          <span className="hp-badge">⚡ Automated Actions</span>
          <span className="hp-badge">📊 Data Logging &amp; Analysis</span>
        </div>
        <div className="hp-hero-cta">
          <Link to="/register" className="hp-btn-primary">Get Started Free</Link>
          <Link to="/login" className="hp-btn-secondary">Sign In</Link>
        </div>
      </section>

      <section className="hp-section" id="about">
        <h2 className="hp-section-title">ABOUT M &amp; H</h2>
        <p className="hp-section-lead">M &amp; H is a tech-driven company on a mission to revolutionise the agricultural industry. We leverage AI, machine learning and IoT to deliver smarter farming solutions.</p>
        <div className="hp-about-grid">
          {[['Smart Agriculture','Innovative tools for precision farming, crop monitoring and yield optimisation.'],['Farm Monitoring Systems','Real-time monitoring of soil health through IoT sensors and AI analytics.'],['Precision Farming','Using technology to help farmers make better decisions and improve yields.'],['Sustainable Practices','Solutions designed to protect biodiversity and reduce chemical waste.']].map(([t,d])=>(
            <div key={t} className="hp-about-col"><h4>{t}</h4><p>{d}</p></div>
          ))}
        </div>
      </section>

      <div className="hp-section-alt">
        <div style={{maxWidth:1200,margin:'0 auto',padding:'0 24px'}}>
          <h2 className="hp-section-title">Steps To Our Process</h2>
          <div className="hp-steps">
            {STEPS.map((s,i)=>(
              <React.Fragment key={s.title}>
                <div className="hp-step"><div className="hp-step-icon">{s.icon}</div><h4>{s.title}</h4><p>{s.desc}</p></div>
                {i<STEPS.length-1&&<div className="hp-step-arrow">›</div>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <section className="hp-section" id="services">
        <div className="hp-services-header">
          <div><h2 className="hp-section-title" style={{textAlign:'left',marginBottom:4}}>Our Services</h2><p style={{fontSize:'0.88rem',color:'#555'}}>Our Mission Is To Make Your Business Better Through Technology</p></div>
          <Link to="/register" className="hp-btn-secondary" style={{flexShrink:0}}>Explore Our Services</Link>
        </div>
        <div className="hp-services-grid">
          {SERVICES.map(s=>(<div key={s.title} className="hp-service-card"><div className="hp-service-icon">{s.icon}</div><h3>{s.title}</h3><p>{s.desc}</p><Link to={s.link} className="hp-service-link">View More →</Link></div>))}
        </div>
      </section>

      <div className="hp-section-alt">
        <div className="hp-why-header">
          <div><h2 className="hp-section-title" style={{textAlign:'left'}}>Why Choose Us</h2><p style={{fontSize:'0.88rem',color:'#555',maxWidth:420}}>To revolutionise farming through smart, data-driven solutions that empower farmers to grow healthier, more productive crops.</p></div>
          <Link to="/register" className="hp-btn-primary">Join Now</Link>
        </div>
        <div className="hp-why-grid">
          {WHY.map(w=>(<div key={w.title} className="hp-why-card"><div className="hp-why-icon">{w.icon}</div><h4>{w.title}</h4><p>{w.desc}</p></div>))}
        </div>
      </div>

      <section className="hp-section" id="contact">
        <div className="hp-contact-grid">
          <div className="hp-contact-info">
            <h2 className="hp-section-title" style={{textAlign:'left'}}>Contact Info</h2>
            <p style={{color:'#555',marginBottom:16}}>Let's connect and grow smarter together!</p>
            <div className="hp-contact-details"><span>📞 +254 123456578</span><span>✉️ mh@gmail.com</span><span>📍 Nairobi, Kenya</span></div>
          </div>
          <form className="hp-contact-form" onSubmit={e=>e.preventDefault()}>
            <div className="hp-form-row"><input placeholder="Name"/><input type="email" placeholder="Email"/></div>
            <input placeholder="Subject"/>
            <textarea rows={4} placeholder="Your Message"/>
            <button type="submit" className="hp-btn-primary" style={{width:'auto',padding:'10px 28px'}}>Send Message</button>
          </form>
        </div>
      </section>

      <footer className="hp-footer">
        <div className="hp-footer-inner">
          <div className="hp-footer-brand"><div className="hp-footer-logo">M &amp; H</div><p>Smart Farming — Nairobi, Kenya</p><p style={{marginTop:4}}>mh@gmail.com · +254 123456578</p></div>
          <div className="hp-footer-col"><h5>Explore</h5><a href="#about">What we offer</a><a href="#services">Services</a><Link to="/enquiry">Enquiry</Link><a href="#contact">Contact</a></div>
          <div className="hp-footer-col"><h5>Newsletter</h5><p style={{fontSize:'0.75rem',color:'rgba(255,255,255,0.5)',marginBottom:8,lineHeight:1.5}}>Subscribe to our Newsletter &amp; Event updates</p><input placeholder="Email Address" className="hp-newsletter-input"/><button className="hp-newsletter-btn">Subscribe →</button></div>
        </div>
        <div className="hp-footer-bottom">Copyright 2024 M &amp; H. All Rights Reserved.</div>
      </footer>
    </div>
  );
}
