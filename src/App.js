import './App.css';
import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';


// Import other page components
import Contact from './pages/Contact';
import Login from './auth/Login';
import Register from './auth/Register';
import Playground from './pages/Playground';
import ForgotPassword from './auth/ForgotPassword'; // Import ForgotPassword component
import Help from './pages/Help'; // Import Help component
import Settings from './pages/Settings'; // Import Settings component


/**
 * HomePage Component
 * This is the main landing page for logged-out users, defined directly within App.js.
 */
/**
 * HomePage Component
 * Updated with "Why do we need a SOC Analyst?" and "Why a SOC Simulator?" content.
 */
function HomePage() {
  return (
    <div className="home-page-container">
      {/* Hero Section */}
      <section className="home-hero-section">
        <h1 className="home-hero-title">Why SOC Analysts Are Crucial in Cybersecurity</h1>
        <p className="home-hero-subtitle">
          In today’s digital world, cyber threats are growing faster than ever. SOC Analysts are the backbone of defense, constantly monitoring, detecting, and responding to threats before they become full-scale attacks.
        </p>
        <Link to="/register" className="home-cta-button">Learn to Defend</Link>
      </section>

      {/* Why Do We Need SOC Analysts? */}
      <section className="home-info-section">
        <h2 className="home-section-title">Why Do We Need SOC Analysts?</h2>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '40px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '300px', maxWidth: '500px', textAlign: 'left' }}>
            <p className="home-card-text">
              Every organization is a potential target for hackers. SOC Analysts act as digital guardians, monitoring systems for unusual activity and stopping cyber threats before they cause real damage. 
              Without them, businesses risk losing sensitive data, money, and reputation.
            </p>
            <p className="home-card-text">
              A SOC Analyst isn’t just watching alerts—they’re interpreting data, understanding attack patterns, and taking immediate action to keep the network safe.
            </p>
          </div>
          <div style={{ flex: 1, minWidth: '300px', maxWidth: '500px' }}>
            <img src={"/images/soc_analyst_need.png"} alt="Why SOC Analysts" style={{ width: '100%', borderRadius: '8px' }} />
          </div>
        </div>
      </section>

      {/* Why SOC Simulator? */}
      <section className="home-info-section" style={{ backgroundColor: '#1a1a2e'}}>
        <h2 className="home-section-title">Why Train with a SOC Simulator?</h2>
        <div className="home-cards-grid">
          <div className="home-card">
            <h3 className="home-card-title">Real-World Experience</h3>
            <p className="home-card-text">
              Reading about attacks isn’t enough. A SOC Simulator immerses you in real-world cybersecurity scenarios, giving you practical skills that textbooks can’t teach.
            </p>
          </div>
          <div className="home-card">
            <h3 className="home-card-title">Learn How Analysts Really Work</h3>
            <p className="home-card-text">
              Understand the tools, workflows, and thinking process of a professional SOC Analyst. Learn how to respond under pressure just like in a real SOC.
            </p>
          </div>
          <div className="home-card">
            <h3 className="home-card-title">Prepare for Real Threats</h3>
            <p className="home-card-text">
              Gain hands-on experience with simulated cyberattacks, threat hunting, and alert triage so you’re ready for real-world challenges from day one.
            </p>
          </div>
        </div>
      </section>

      {/* What You'll Learn Section */}
      <section className="home-info-section">
        <h2 className="home-section-title">What You’ll Master in the Simulator</h2>
        <div className="home-cards-grid">
          <div className="home-card">
            <img src={"/images/alert_simulation.png"} alt="Alert Triage" style={{ width: '100%', borderRadius: '8px', marginBottom: '15px' }} />
            <h3 className="home-card-title">Threat Detection</h3>
            <p className="home-card-text">
              Learn to identify real attacks hidden in thousands of alerts and avoid wasting time on false positives.
            </p>
          </div>
          <div className="home-card">
            <img src={"/images/investigation.png"} alt="Investigation" style={{ width: '100%', borderRadius: '8px', marginBottom: '15px' }} />
            <h3 className="home-card-title">Incident Investigation</h3>
            <p className="home-card-text">
              Discover how to trace an attacker’s steps, analyze logs, and uncover the root cause of an alert.
            </p>
          </div>
          <div className="home-card">
            <img src={"/images/case_management.png"} alt="Case Management" style={{ width: '100%', borderRadius: '8px', marginBottom: '15px' }} />
            <h3 className="home-card-title">Real SOC Workflows</h3>
            <p className="home-card-text">
              Learn the tools and methods that professional SOC teams use daily to manage and resolve incidents effectively.
            </p>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="home-reviews-section">
        <h2 className="home-section-title">What Our Users Say</h2>
        <div className="home-reviews-grid">
          <div className="home-review-card">
            <p className="home-review-text">"This simulator is a game-changer! The realistic scenarios helped me land my first SOC analyst job."</p>
            <p className="home-reviewer-name">- Alex R., Aspiring SOC Analyst</p>
          </div>
          <div className="home-review-card">
            <p className="home-review-text">"Finally, a platform that bridges the gap between theory and practice. Highly recommend for anyone serious about cybersecurity."</p>
            <p className="home-reviewer-name">- Jamie L., Cybersecurity Student</p>
          </div>
          <div className="home-review-card">
            <p className="home-review-text">"The incident response modules are incredibly detailed. It's like being in a real SOC without the real-world pressure (yet!)."</p>
            <p className="home-reviewer-name">- Chris P., Junior SOC Analyst</p>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="home-call-to-action-section">
        <h2 className="home-section-title">Start Your SOC Journey Today</h2>
        <p className="home-hero-subtitle">
          The best way to learn cybersecurity is by doing. Train with our SOC simulator and build the skills employers are searching for.
        </p>
        <Link to="/register" className="home-cta-button">Register Now</Link>
      </section>
    </div>
  );
}


/**
 * App Component
 * The main component that sets up routing and manages global application state like login status.
 */
function App() {
  // State to manage the visibility of the account dropdown menu
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // State to track user's login status across the application
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  // State to manage the current theme
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  // Ref for the dropdown menu to detect clicks outside
  const dropdownRef = useRef(null);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Effect to apply the theme to the body
  useEffect(() => {
    document.body.className = ''; // Clear existing theme classes
    document.body.classList.add(`${theme}-theme`);
  }, [theme]);

  // Effect to update isLoggedIn state if localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      setIsLoggedIn(!!localStorage.getItem('token'));
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Effect to handle clicks outside the dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }

    // Add event listener when dropdown is open
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      // Clean up the event listener when dropdown is closed
      document.removeEventListener('mousedown', handleClickOutside);
    }

    // Cleanup function to remove event listener on component unmount
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]); // Re-run effect when isDropdownOpen changes

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
  };

  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <div className="navbar-left">
            <span className="project-name">Proving Grounds</span>
          </div>
          <div className="navbar-center">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/contacts" className="nav-link">Contacts</Link>
            <Link to="/playground" className="nav-link">Playground</Link>
            <Link to="/help" className="nav-link">Help</Link>
          </div>
          <div className="navbar-right">
            <div className="dropdown" ref={dropdownRef}> {/* Attach ref to the dropdown container */}
              <button className="dropdown-button profile-button" onClick={toggleDropdown}>
                👤
              </button>
              {isDropdownOpen && (
                <div className="dropdown-menu">
                  {!isLoggedIn ? (
                    <>
                      <Link to="/login" className="dropdown-item">Login</Link>
                      <Link to="/register" className="dropdown-item">Register</Link>
                    </>
                  ) : (
                    <>
                      <Link to="/settings" className="dropdown-item">Settings</Link>
                      <Link to="/" className="dropdown-item" onClick={handleLogout}>Logout</Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </nav>

        <Routes>
          <Route 
            path="/" 
            element={<HomePage />}
          />
          <Route path="/contacts" element={<Contact />} />
          <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} /> {/* New route for ForgotPassword */}
          <Route path="/help" element={<Help />} /> {/* Route for Help page */}
          <Route path="/settings" element={<Settings onThemeChange={handleThemeChange} />} /> {/* Route for Settings page */}
          
          <Route path="/playground/*" element={<Playground isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
