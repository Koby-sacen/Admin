import React, { useEffect, useState } from 'react';
import { db } from '../firebase'; 
import { collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { User, Shield, Mail, Trash2, Eye, RefreshCw, X, AlertCircle } from 'lucide-react'; 
import '../App.css';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersList);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'users', id));
      setUsers(users.filter(user => user.id !== id));
      setShowDeleteConfirm(null);
    } catch (error) {
      alert("Error deleting user: " + error.message);
    }
  };

  const toggleRole = async (user) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, { role: newRole });
      setUsers(users.map(u => u.id === user.id ? { ...u, role: newRole } : u));
    } catch (error) {
      alert("Failed to update role");
    }
  };

  return (
    <div className="manage-users-wrapper">
      <div className="admin-header-main">
        <div>
          <h2 className="header-title">User Management</h2>
          <p className="header-subtitle">Manage system access levels and user accounts</p>
        </div>
        <button className="refresh-btn-modern" onClick={fetchUsers}>
          <RefreshCw size={18} className={loading ? 'spin' : ''} />
          Refresh
        </button>
      </div>
      
      <div className="table-container-modern">
        {loading ? (
          <div className="loading-overlay-modern">
             <div className="loader-ring"></div>
             <p>Syncing User Records...</p>
          </div>
        ) : (
          <table className="modern-table">
            <thead>
              <tr>
                <th>User Info</th>
                <th>Access Level</th>
                <th>Account ID</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="table-row-hover">
                  <td>
                    <div className="user-info-cell">
                      <div className="avatar-placeholder">
                        {/* Removed Image tag, using Icon only */}
                        <User size={20} />
                      </div>
                      <div className="user-text">
                        <span className="user-name">{user.displayName || user.name || 'Anonymous User'}</span>
                        <span className="user-email">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div 
                      className={`role-pill ${user.role === 'admin' ? 'role-admin' : 'role-user'}`}
                      onClick={() => toggleRole(user)}
                    >
                      <Shield size={14} />
                      {user.role || 'user'}
                    </div>
                  </td>
                  <td><code className="uid-label">{user.id.substring(0, 8)}...</code></td>
                  <td className="text-right">
                    <div className="action-group">
                      <button className="icon-btn view" onClick={() => setSelectedUser(user)} title="View Profile">
                        <Eye size={18} />
                      </button>
                      <button className="icon-btn delete" onClick={() => setShowDeleteConfirm(user.id)} title="Delete User">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* --- MODERN VIEW MODAL (NO IMAGES) --- */}
      {selectedUser && (
        <div className="modal-blur-overlay">
          <div className="modal-card-modern">
            <button className="modal-close-icon" onClick={() => setSelectedUser(null)}><X size={24} /></button>
            <div className="modal-header-profile">
                <div className="profile-banner"></div>
                {/* Replaced Profile Image with styled Icon circle */}
                <div className="profile-large-icon-circle">
                  <User size={48} />
                </div>
                <h3 className="modal-user-name">{selectedUser.displayName || selectedUser.name}</h3>
                <span className={`badge-large ${selectedUser.role}`}>{selectedUser.role || 'user'}</span>
            </div>
            
            <div className="modal-body-content">
               <div className="info-row">
                  <Mail size={18} />
                  <div><label>Email Address</label><p>{selectedUser.email}</p></div>
               </div>
               <div className="info-row">
                  <Shield size={18} />
                  <div><label>Firestore UID</label><p>{selectedUser.id}</p></div>
               </div>
               <div className="info-row">
                  <RefreshCw size={18} />
                  <div><label>Last Activity</label><p>{selectedUser.lastActive?.toDate().toLocaleString() || 'Never'}</p></div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* --- DANGER ZONE MODAL --- */}
      {showDeleteConfirm && (
        <div className="modal-blur-overlay danger">
          <div className="modal-card-small">
            <div className="danger-icon-circle"><AlertCircle size={32} /></div>
            <h3>Delete User?</h3>
            <p>This will permanently remove the account from the database.</p>
            <div className="danger-actions">
              <button className="btn-secondary" onClick={() => setShowDeleteConfirm(null)}>Keep User</button>
              <button className="btn-danger-main" onClick={() => handleDelete(showDeleteConfirm)}>Confirm Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}