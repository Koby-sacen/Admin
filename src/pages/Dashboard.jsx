import React, { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../firebase'; 
import { signOut } from 'firebase/auth';
import { Users, Trash2, LayoutDashboard, LogOut } from 'lucide-react';
import '../App.css';

const Dashboard = ({ onLogout }) => { // 1. Receive onLogout prop
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);
      
      // 2. Sign out from Firebase
      await signOut(auth);
      
      // 3. Update the Parent State (App.js)
      if (onLogout) {
        onLogout();
      }

      // 4. Redirect
      navigate('/login', { replace: true }); 
    } catch (error) {
      console.error("Logout Error:", error);
      alert("Failed to log out. Please check your connection.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isActive = (path) => location.pathname === path ? 'nav-item active' : 'nav-item';

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Trash2 size={24} color="#4ade80" /> 
            <span className="logo-text">AdminPanel</span>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <Link to="/" className={isActive('/')}>
            <LayoutDashboard size={20} /> 
            <span>Dashboard</span>
          </Link>
          <Link to="/users" className={isActive('/users')}>
            <Users size={20} /> 
            <span>Manage Users</span>
          </Link>
          <Link to="/waste" className={isActive('/waste')}>
            <Trash2 size={20} /> 
            <span>Waste Collection</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <button 
            onClick={handleLogout} 
            className="logout-button"
            disabled={isLoggingOut}
          >
            <LogOut size={20} /> 
            <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-bar">
          <h2>{location.pathname === '/' ? 'Overview' : 'Management'}</h2>
        </header>
        <div className="content-container">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;