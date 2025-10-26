import React from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar'; // Left-side Navbar
import MainAlerts from '../features/playground/MainAlerts';
import LogManagement from '../features/playground/LogManagement';
import InvestigationCases from '../features/playground/InvestigationCases';
import ClosedCases from '../features/playground/ClosedCases';
// import EmailSecurity from '../features/playground/EmailSecurity';
import ThreatIntel from '../features/playground/ThreatIntel';
import '../App.css'; // Import App.css for styling

/**
 * Playground Component
 * This component now conditionally renders either the introductory content (if not logged in)
 * or the full SOC dashboard with a sidebar navigation (if logged in).
 * @param {object} props - Component props.
 * @param {boolean} props.isLoggedIn - Indicates if the user is currently logged in.
 * @param {function} props.setIsLoggedIn - Function to update the login status in the parent App component.
 */
function Playground({ isLoggedIn, setIsLoggedIn }) {
  // Content for the introductory page (Master SOC Analysis)
  const introContent = (
    <main className="home-page-container">
      <section className="home-hero-section">
        <h1 className="home-hero-title">Master SOC Analysis: Real-World Training</h1>
        <p className="home-hero-subtitle">
          Bridge the gap between theory and practice. Learn how Security Operations Center (SOC) analysts
          investigate, analyze, and respond to cyber threats in a simulated environment.
        </p>
        {/* Link to Login page */}
        <Link to="/login" className="home-cta-button">Start Your Training</Link>
      </section>

      <section className="home-info-section">
        <h2 className="home-section-title">What You'll Learn</h2>
        <div className="home-cards-grid">
          <div className="home-card">
            <h3 className="home-card-title">Analyze Diverse Logs</h3>
            <p className="home-card-text">
              Dive deep into Windows Event Logs, SSH logs, Web Application logs, and phishing emails.
              Understand the nuances of different log types and extract critical information.
            </p>
          </div>
          <div className="home-card">
            <h3 className="home-card-title">Practice Incident Response</h3>
            <p className="home-card-text">
              Simulate real-world security incidents. Identify anomalies, correlate events,
              and develop effective response strategies just like a professional SOC analyst.
            </p>
          </div>
          <div className="home-card">
            <h3 className="home-card-title">Master Case Management</h3>
            <p className="home-card-text">
              Learn to open, manage, and close security cases. Document your findings,
              classify incidents as True Positive or False Positive, and track your progress.
            </p>
          </div>
          <div className="home-card">
            <h3 className="home-card-title">Utilize Threat Intelligence</h3>
            <p className="home-card-text">
              Integrate threat intelligence into your investigations. Learn to use tools
              for IP/domain reputation checks and file analysis to enrich your findings.
            </p>
          </div>
          <div className="home-card">
            <h3 className="home-card-title">Develop Critical Thinking</h3>
            <p className="home-card-text">
              Sharpen your analytical skills by answering targeted questions for each log.
              Understand the 'why' behind every alert and make informed decisions.
            </p>
          </div>
          <div className="home-card">
            <h3 className="home-card-title">Build Your Portfolio</h3>
            <p className="home-card-text">
              Gain practical experience that stands out. Each case you close adds to your
              hands-on expertise, preparing you for a successful career in cybersecurity.
            </p>
          </div>
        </div>
      </section>

      <section className="home-call-to-action-section">
        <h2 className="home-section-title">Ready to Become a Top-Tier SOC Analyst?</h2>
        <p className="home-hero-subtitle">
          Join Proving Grounds today and transform your cybersecurity knowledge into actionable skills.
        </p>
        {/* Link to Register page */}
        <Link to="/register" className="home-cta-button">Register Now</Link>
      </section>
    </main>
  );

  // Content for the authenticated SOC dashboard
  const dashboardContent = (
    <div className="playground-container">
      {/* Left-side Navbar */}
      <Navbar setIsLoggedIn={setIsLoggedIn} />

      {/* Main Content Area */}
      <main className="playground-content">
        <Routes>
          {/* Default sub-route for /playground, redirects to /playground/alerts/main */}
          <Route path="/" element={<Navigate to="alerts/main" replace />} />
          <Route path="alerts/main" element={<MainAlerts />} />
          <Route path="alerts/investigation" element={<InvestigationCases />} />
          <Route path="alerts/closed" element={<ClosedCases />} />
          <Route path="log-management" element={<LogManagement />} />
          {/* <Route path="email-security" element={<EmailSecurity />} /> */}
          <Route path="threat-intel" element={<ThreatIntel />} />
        </Routes>
      </main>
    </div>
  );

  return isLoggedIn ? dashboardContent : introContent;
}

export default Playground;
