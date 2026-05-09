import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ManageUsers from './pages/ManageUsers';
import ManageWaste from './pages/ManageWaste';
import Home from './pages/Home';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          !isAuthenticated ? <Login onLogin={() => setIsAuthenticated(true)} /> : <Navigate to="/" />
        } />
        
        <Route path="/" element={
          isAuthenticated ? <Dashboard /> : <Navigate to="/login" />
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