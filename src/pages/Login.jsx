import React, { useState } from 'react';
import '../App.css';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email === 'ADMIN' && password === 'ESRDC12345678') {
      // PERSISTENCE FIX: Save login status to browser storage
      localStorage.setItem('isLoggedIn', 'true');
      onLogin();
    } else {
      alert('Invalid Credentials');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Admin Portal</h2>
        <p className="login-subtitle">Waste Management System</p>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label className="input-label">Email/Username</label>
            <input 
              type="text" 
              className="form-input"
              placeholder="admin"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            />
          </div>
          <button type="submit" className="login-button">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;