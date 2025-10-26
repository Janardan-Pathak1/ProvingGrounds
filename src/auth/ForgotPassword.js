import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ForgotPassword.css';

function ForgotPassword() {
  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const navigate = useNavigate();

  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const response = await axios.post('http://localhost:5000/api/check-username', { username });
      if (response.status === 200) {
        setShowPasswordFields(true); // Username found, show password fields
        setMessage('Username found. Please enter your new password.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword !== confirmNewPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/forgot-password', {
        username,
        newPassword,
        confirmNewPassword,
      });
      setMessage(response.data.message);
      setTimeout(() => {
        navigate('/login'); // Redirect to login after successful reset
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    }
  };

  return (
    <div className="forgot-password-background">
      <div className="forgot-password-card">
        <h2>Forgot Password</h2>
        {!showPasswordFields ? (
          <form onSubmit={handleUsernameSubmit} className="auth-form">
            <div className="input-group">
              <label htmlFor="username">Username:</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn">
              Check Username
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordReset} className="auth-form">
            <div className="input-group">
              <label htmlFor="newPassword">New Password:</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="confirmNewPassword">Confirm New Password:</label>
              <input
                type="password"
                id="confirmNewPassword"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn">
              Reset Password
            </button>
          </form>
        )}
        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}
        <p className="links">
          <Link to="/login">Remember your password? Login</Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
