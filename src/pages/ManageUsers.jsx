import React, { useEffect, useState } from 'react';
import { db } from '../firebase'; // Adjust this path to where your firebase init file is
import { collection, getDocs } from 'firebase/firestore';
import '../App.css';

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const usersList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersList);
      } catch (error) {
        console.error("Error fetching users: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="manage-users-container">
      <h2 className="table-title">User Management</h2>
      
      <div className="table-card">
        {loading ? (
          <div className="loading-state">Loading users...</div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td className="font-bold">{user.displayName || user.name || 'N/A'}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge ${user.role === 'admin' ? 'admin' : 'user'}`}>
                      {user.role || 'user'}
                    </span>
                  </td>
                  <td className="action-link">View Details</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}