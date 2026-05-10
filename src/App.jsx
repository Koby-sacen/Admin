import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ManageUsers from './pages/ManageUsers';
import ManageWaste from './pages/ManageWaste';
import Home from './pages/Home';
import Engineering from './colleges/Engineering';
import CAS from './Colleges/CAS';
import CIT from './Colleges/CIT';
import CONHS from './Colleges/CONHS';
import COED from './Colleges/COED';
import GRADUATES from './Colleges/GRADUATES';

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
          
          {/* ADDED ROUTE FOR COLLEGE OF ENGINEERING */}
          <Route path="colleges/engineering" element={<Engineering />} />
          <Route path="colleges/CAS" element={<CAS />} />
          <Route path="colleges/CIT" element={<CIT />} />
          <Route path="colleges/CONHS" element={<CONHS />} />
          <Route path="colleges/COED" element={<COED />} />
          <Route path="colleges/GRADUATES" element={<GRADUATES />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;