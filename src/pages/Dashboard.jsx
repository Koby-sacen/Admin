import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Users, Trash2, LayoutDashboard, LogOut } from 'lucide-react';
import '../App.css';

const Dashboard = () => {
  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-logo">
            <Trash2 size={24} /> AdminPanel
          </h1>
        </div>
        
        <nav className="sidebar-nav">
          <Link to="/" className="nav-item">
            <LayoutDashboard size={20} /> <span>Dashboard</span>
          </Link>
          <Link to="/users" className="nav-item">
            <Users size={20} /> <span>Manage Users</span>
          </Link>
          <Link to="/waste" className="nav-item">
            <Trash2 size={20} /> <span>Waste Collection</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <button onClick={() => window.location.reload()} className="logout-button">
            <LogOut size={20} /> <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div className="content-container">
          {/* This is where Home.jsx (with the charts) will render */}
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;