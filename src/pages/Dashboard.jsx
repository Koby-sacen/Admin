import React, { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../firebase'; 
import { signOut } from 'firebase/auth';
import { Users, Trash2, LayoutDashboard, LogOut, GraduationCap } from 'lucide-react';
import '../App.css';

// Fixed paths to match lowercase convention used in App.js routing
const collegesList = [
  { name: 'College of Engineering', path: '/colleges/engineering' },
  { name: 'College of Arts and Sciences', path: '/colleges/cas' },
  { name: 'College of Industrial Technology', path: '/colleges/cit' },
  { name: 'College of Nursing & Health Sciences', path: '/colleges/conhs' },
  { name: 'College of Education', path: '/colleges/coed' },
  { name: 'SSU College of Graduate Studies', path: '/colleges/graduates' },
];

const Dashboard = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    try {
      setIsLoggingOut(true);
      await signOut(auth);
      if (onLogout) onLogout();
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
          <div className="nav-section-label">Main Menu</div>
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

          <div className="nav-section-label" style={{ marginTop: '20px', padding: '10px 15px', fontSize: '12px', color: '#888', textTransform: 'uppercase', fontWeight: 'bold' }}>
            Colleges & Departments
          </div>
          {collegesList.map((college, index) => (
            <Link 
              key={index} 
              to={college.path} 
              className={isActive(college.path)}
              style={{ fontSize: '13px' }}
            >
              <GraduationCap size={18} /> 
              <span>{college.name}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button 
            onClick={handleLogout} 
            className="logout-button"
            disabled={isLoggingOut}
          >
            <LogOut size={20} /> 
            <span>{isLoggingOut ? '...' : 'Logout'}</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-bar">
          <h2>
            {location.pathname === '/' ? 'Overview' : 
             location.pathname.includes('/colleges/') ? 'College Department' : 'Management'}
          </h2>
        </header>
        <div className="content-container">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;