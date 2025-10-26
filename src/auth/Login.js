import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { z } from 'zod';
import './Login.css'; // Update this with professional styles (e.g., add gradients, shadows)

function Login({ setIsLoggedIn }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  

  // Client-side validation schema
  const loginSchema = z.object({
    username: z.string().min(3, 'Username must be at least 3 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      loginSchema.parse({ username, password }); // Validate inputs
    } catch (validationError) {
      if (validationError && validationError.errors && validationError.errors[0] && validationError.errors[0].message) {
        setError(validationError.errors[0].message);
      } else {
        setError('An unexpected validation error occurred.');
      }
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        const { token, user } = data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify({ user_id: user.user_id, username: user.username })); // Explicitly store user_id
        setIsLoggedIn(true);
        navigate('/playground');
      } else {
        setError(data.message || 'Login failed.');
      }
    } catch (err) {
      console.error('Error during login:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-background"> {/* Add gradient or image for professionalism */}
      <motion.div 
        className="login-card"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2>Secure Analyst Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input 
              id="username"
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
              aria-required="true"
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input 
              id="password"
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              aria-required="true"
            />
          </div>
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="links">
          <Link to="/register">Register</Link>
          <Link className="forgot" to="/forgot-password">Forgot Password?</Link>
        </div>
        
      </motion.div>
    </div>
  );
}

export default Login;
