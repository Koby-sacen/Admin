import React, { useState } from 'react';
import { auth } from '../firebase'; // Ensure your firebase.js exports 'auth'
import { signInWithEmailAndPassword } from 'firebase/auth';
import '../App.css';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // REAL FIREBASE SIGN IN
      await signInWithEmailAndPassword(auth, email, password);
      
      // PERSISTENCE: Firebase handles this automatically, but we notify the parent
      localStorage.setItem('isLoggedIn', 'true');
      onLogin();
    } catch (error) {
      console.error("Login Error:", error.code);
      alert('Invalid Credentials: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Admin Portal</h2>
        <p className="login-subtitle">Waste Management System</p>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label className="input-label">Email</label>
            <input 
              type="email" 
              className="form-input"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label className="input-label">Password</label>
            <input 
              type="password" 
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;