import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Register.css';

function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // State for password requirements (dynamically updated)
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  // State to control visibility of the requirements box
  const [showRequirementsBox, setShowRequirementsBox] = useState(false);

  const navigate = useNavigate();

  // Function to check password requirements
  const checkPasswordRequirements = (pwd) => {
    return {
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[!@#$%^&*()_+-=[\]{};':"\\|,.<>/?]/.test(pwd),
    };
  };

  // Handler for password focus (show box if requirements not met)
  const handlePasswordFocus = () => {
    const reqs = checkPasswordRequirements(password);
    const allMet = Object.values(reqs).every(Boolean);
    setShowRequirementsBox(!allMet);
  };

  // Handler for password change (update requirements and visibility dynamically)
  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    const reqs = checkPasswordRequirements(newPassword);
    setPasswordRequirements(reqs);

    // Show box only if not all requirements are met
    const allMet = Object.values(reqs).every(Boolean);
    setShowRequirementsBox(!allMet);

    // Clear mismatch error if passwords now match
    if (newPassword === confirmPassword) {
      setError('');
    }
  };

  // Handler for confirm password change (check match dynamically)
  const handleConfirmPasswordChange = (e) => {
    const newConfirm = e.target.value;
    setConfirmPassword(newConfirm);

    // Check match in real-time
    if (password && password !== newConfirm) {
      setError("Passwords don't match.");
    } else {
      setError('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    // Basic validations
    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }

    // Check password requirements
    const reqs = checkPasswordRequirements(password);
    if (!Object.values(reqs).every(Boolean)) {
      setError('Password does not meet all requirements.');
      setShowRequirementsBox(true); // Force-show the box to highlight failed requirements
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    if (email && !/^[\w-.]+@([\w-]+.)+[\w-]{2,4}$/.test(email.trim())) {
      setError('Invalid email address.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password, email: email.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || 'Registration successful.');
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setEmail('');
        setPasswordRequirements({
          length: false,
          uppercase: false,
          lowercase: false,
          number: false,
          special: false,
        });
        setShowRequirementsBox(false); // Hide box on success

        // Redirect to login page if backend sends redirectTo
        if (data.redirectTo) {
          setTimeout(() => {
            navigate(data.redirectTo);
          }, 1500); // Redirect after 1.5 seconds to show success message
        }
      } else {
        setError(data.message || 'Registration failed.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-background">
      <motion.div 
        className="register-card"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2>Register for an Account</h2>
        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="email">Email (Optional)</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className="input-group password-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={handlePasswordChange}
              onFocus={handlePasswordFocus} // Show box on focus if invalid
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
          <div className="input-group password-group">
            <label htmlFor="confirm-password">Confirm Password</label>
            <input
              id="confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              required
              autoComplete="off"
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            >
              {showConfirmPassword ? "🙈" : "👁️"}
            </button>
          </div>
          {error && <p className="error">{error}</p>}
          {success && <p className="success">{success}</p>}
          <button type="submit" className="btn" disabled={isLoading}>
            {isLoading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <div className="links">
          <Link to="/login">Already have an account? Login here</Link>
        </div>
      </motion.div>

      {/* Password Requirements Box (now a flex sibling to the card) */}
      {showRequirementsBox && (
        <motion.div 
          className="password-requirements-box"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
        >
          <h3>Password Requirements</h3>
          <ul className="password-requirements">
            <li className={passwordRequirements.length ? 'met' : 'not-met'}>
              {passwordRequirements.length ? '✅' : '❌'} At least 8 characters
            </li>
            <li className={passwordRequirements.uppercase ? 'met' : 'not-met'}>
              {passwordRequirements.uppercase ? '✅' : '❌'} At least one uppercase letter (A-Z)
            </li>
            <li className={passwordRequirements.lowercase ? 'met' : 'not-met'}>
              {passwordRequirements.lowercase ? '✅' : '❌'} At least one lowercase letter (a-z)
            </li>
            <li className={passwordRequirements.number ? 'met' : 'not-met'}>
              {passwordRequirements.number ? '✅' : '❌'} At least one number (0-9)
            </li>
            <li className={passwordRequirements.special ? 'met' : 'not-met'}>
              {passwordRequirements.special ? '✅' : '❌'} At least one special character (e.g., !@#$%^&*)
            </li>
          </ul>
        </motion.div>
      )}
    </div>
  );
}

export default Register;
