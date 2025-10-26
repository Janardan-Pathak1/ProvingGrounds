import React, { useState } from 'react';
import './ThemeSwitcher.css';

const ThemeSwitcher = ({ onThemeChange }) => {
  const [selectedTheme, setSelectedTheme] = useState(localStorage.getItem('theme') || 'dark');

  const handleApply = () => {
    onThemeChange(selectedTheme);
  };

  return (
    <div className="theme-switcher">
      <h3>Select Theme</h3>
      <div className="theme-select-wrapper">
        <select value={selectedTheme} onChange={(e) => setSelectedTheme(e.target.value)}>
          <option value="dark">Dark</option>
          <option value="cyberpunk">Cyberpunk</option>
        </select>
        <button onClick={handleApply} className="btn">Apply</button>
      </div>
    </div>
  );
};

export default ThemeSwitcher;