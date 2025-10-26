import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SettingsPage.css'; // Import the dedicated CSS for SettingsPage

function Settings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Fetch user data on component mount to pre-fill email if available
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.email) {
      setForm(prevForm => ({ ...prevForm, email: user.email }));
    }
  }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (form.newPassword !== form.confirmNewPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/change-password', 
        { currentPassword: form.currentPassword, newPassword: form.newPassword, confirmNewPassword: form.confirmNewPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(response.data.message);
      setForm(prevForm => ({ ...prevForm, currentPassword: '', newPassword: '', confirmNewPassword: '' }));
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    }
  };

  const handleEmailUpdate = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/update-email', 
        { email: form.email },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(response.data.message);
      const user = JSON.parse(localStorage.getItem('user'));
      if (user) {
        localStorage.setItem('user', JSON.stringify({ ...user, email: form.email, user_id: user.user_id }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred. Please try again.');
    }
  };

  const handleDeleteAccount = () => {
    setShowConfirmDialog(true);
  };

  const confirmDelete = async () => {
    setShowConfirmDialog(false);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete('http://localhost:5000/api/delete-account', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage(response.data.message || 'Account deleted successfully.');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete account. Please try again.');
    }
  };

  const cancelDelete = () => {
    setShowConfirmDialog(false);
  };

  return (
    <div className="settings-container">
      <aside className="sidebar">
        <h2>Account Settings</h2>
        <nav>
          <button className={activeTab==='profile'?'active':''} onClick={()=>setActiveTab('profile')}>Profile</button>
          <button className={activeTab==='security'?'active':''} onClick={()=>setActiveTab('security')}>Security</button>
          <button className={activeTab==='danger'?'active':''} onClick={()=>setActiveTab('danger')}>Danger Zone</button>
        </nav>
      </aside>

      <main className="settings-main">
        <h1>{activeTab[0].toUpperCase() + activeTab.slice(1)}</h1>
        {message && <div className="msg success">{message}</div>}
        {error && <div className="msg error">{error}</div>}

        {activeTab === 'profile' && (
          <section>
            <h2>Profile Information</h2>
            <form onSubmit={handleEmailUpdate}>
              <div className="form-group">
                <label>First Name</label>
                <input type="text" name="firstName" value={form.firstName} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input type="text" name="lastName" value={form.lastName} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} />
              </div>
              <button type="submit" className="btn">Update Profile</button>
            </form>
          </section>
        )}

        {activeTab === 'security' && (
          <section>
            <h2>Change Password</h2>
            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label>Current Password</label>
                <input type="password" name="currentPassword" value={form.currentPassword} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input type="password" name="newPassword" value={form.newPassword} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input type="password" name="confirmNewPassword" value={form.confirmNewPassword} onChange={handleChange} />
              </div>
              <button type="submit" className="btn">Change Password</button>
            </form>
          </section>
        )}

        {activeTab === 'danger' && (
          <section>
            <h2>Danger Zone</h2>
            <button type="button" className="btn btn-danger" onClick={handleDeleteAccount}>
              Delete Account
            </button>
          </section>
        )}
      </main>

      {showConfirmDialog && (
        <div className="confirm-dialog-overlay">
          <div className="confirm-dialog">
            <h3>Confirm Account Deletion</h3>
            <p>Are you absolutely sure you want to permanently delete your account? This action cannot be undone.</p>
            <div className="confirm-dialog-buttons">
              <button className="btn btn-danger" onClick={confirmDelete}>Delete My Account</button>
              <button className="btn btn-secondary" onClick={cancelDelete}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;
