import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ManageUsers from './pages/ManageUsers';
import ManageWaste from './pages/ManageWaste';
import Home from './pages/Home';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });

  const handleLogin = () => {
    localStorage.setItem('isAuthenticated', 'true');
    setIsAuthenticated(true);
  };

  // NEW: Logout handler to clear state and storage
  const handleLogoutState = () => {
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          !isAuthenticated ? <Login onLogin={handleLogin} /> : <Navigate to="/" />
        } />
        
        {/* Pass the logout handler to the Dashboard component */}
        <Route path="/" element={
          isAuthenticated ? <Dashboard onLogout={handleLogoutState} /> : <Navigate to="/login" />
        }>
          <Route index element={<Home />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="waste" element={<ManageWaste />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;