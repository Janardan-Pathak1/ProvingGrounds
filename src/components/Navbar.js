import React from 'react';
import { NavLink } from 'react-router-dom';
// Import icons from lucide-react
import { Bell, FileText, Briefcase, Mail, Shield, LogOut, Archive } from 'lucide-react'; // Added Archive
import '../App.css'; // Import App.css for styling

/**
 * Navbar Component (Left-side Navigation)
 * Provides navigation links to different sections of the SOC dashboard.
 * Highlights the active link and includes a logout button.
 * @param {object} props - Component props.
 * @param {function} props.setIsLoggedIn - Function to update the login status in the parent App component.
 */
function Navbar({ setIsLoggedIn }) {
  // Define navigation links with their paths, icons, and labels
  const navLinks = [
    { to: '/playground/alerts/main', icon: Bell, label: 'Main Channel Alerts' },
    { to: '/playground/alerts/investigation', icon: Briefcase, label: 'My Investigation Cases' },
    { to: '/playground/alerts/closed', icon: Archive, label: 'Closed Cases' },
    { to: '/playground/log-management', icon: FileText, label: 'Log Management' },
    // { to: '/playground/email-security', icon: Mail, label: 'Email Security' },
    { to: '/playground/threat-intel', icon: Shield, label: 'Threat Intel & File Scan' },
  ];

  /**
   * Handles the logout action.
   * Resets the global login state.
   * In a real application, this would also involve clearing authentication tokens/sessions.
   */
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    // No need to navigate here, App.js will handle redirection based on isLoggedIn state
  };

  return (
    <nav className="sidebar-navbar">
      <div className="sidebar-header">SOC Dashboard</div>
      <ul className="sidebar-nav-list">
        {navLinks.map((link) => (
          <li key={link.to} className="sidebar-nav-item">
            <NavLink
              to={link.to}
              // Apply different styles based on whether the link is active
              className={({ isActive }) =>
                `sidebar-nav-link ${isActive ? 'sidebar-nav-link-active' : ''}`
              }
            >
              {/* Render the icon component */}
              <link.icon className="sidebar-nav-icon" />
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>
      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="sidebar-logout-button"
      >
        <LogOut className="sidebar-logout-icon" />
        Logout
      </button>
    </nav>
  );
}

export default Navbar;
