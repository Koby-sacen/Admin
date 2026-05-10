import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend 
} from 'recharts';
import { GraduationCap, Trash2, Scale, Users } from 'lucide-react';
import '../App.css';

const GRADUATES = () => {
  const [binData, setBinData] = useState([]);
  const [userList, setUserList] = useState([]);
  const [stats, setStats] = useState({ totalItems: 0, totalWeight: 0, uniqueContributors: 0 });

  useEffect(() => {
    const fetchGraduateData = async () => {
      // 1. Fetch Waste Collection filtered by SSU College of Graduate Studies
      const wasteRef = collection(db, 'waste_collection');
      const q = query(wasteRef, where('location.detectedCollege', '==', 'SSU College of Graduate Studies'));
      const wasteSnapshot = await getDocs(q);
      
      const binCounts = {};
      let totalWeightGrams = 0;
      const contributors = new Set();
      const records = [];

      wasteSnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Count Bin Types
        const bin = data.binData || 'Unsorted';
        binCounts[bin] = (binCounts[bin] || 0) + 1;

        // Calculate Weight
        const weightMatch = data.totalWeight?.match(/(\d+)/);
        const weightValue = weightMatch ? parseInt(weightMatch[0]) : 0;
        totalWeightGrams += weightValue;

        // Track Contributors
        if (data.userId) contributors.add(data.userId);

        records.push({
          userName: data.userName || 'Anonymous',
          wasteType: data.wasteType || 'General',
          date: data.createdAt?.toDate().toLocaleDateString() || 'N/A'
        });
      });

      // 2. Formatting Charts
      setBinData(Object.keys(binCounts).map(name => ({ 
        name, 
        value: binCounts[name] 
      })));

      setStats({
        totalItems: wasteSnapshot.size,
        totalWeight: (totalWeightGrams / 1000).toFixed(2),
        uniqueContributors: contributors.size
      });

      // Show top 5 recent posters
      setUserList(records.slice(0, 5));
    };

    fetchGraduateData();
  }, []);

  const COLORS = ['#eab308', '#facc15', '#fef08a', '#ca8a04'];

  return (
    <div className="home-stats">
      <div className="header-flex">
        <GraduationCap size={32} color="#eab308" />
        <h1 style={{ marginLeft: '10px' }}>College of Graduate Studies</h1>
      </div>

      {/* --- STAT CARDS --- */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="card-icon"><Trash2 size={20} color="#eab308" /></div>
          <h3>CGS Total Items</h3>
          <p className="stat-number">{stats.totalItems}</p>
        </div>
        <div className="stat-card weight-card" style={{ borderLeft: '4px solid #eab308' }}>
          <div className="card-icon"><Scale size={20} color="#eab308" /></div>
          <h3>CGS Weight (kg)</h3>
          <p className="stat-number">{stats.totalWeight} <span className="unit">kg</span></p>
        </div>
        <div className="stat-card user-card">
          <div className="card-icon"><Users size={20} color="#eab308" /></div>
          <h3>Grad Students</h3>
          <p className="stat-number">{stats.uniqueContributors}</p>
        </div>
      </div>

      <div className="charts-main-container">
        {/* --- PIE CHART: SEGREGATION IN CGS --- */}
        <div className="chart-item">
          <h3>Waste Segregation (CGS)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={binData}
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                label
              >
                {binData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* --- USER ACTIVITY TABLE --- */}
        <div className="chart-item">
          <h3>Recent Graduate Activity</h3>
          <div className="user-table-container">
            <table className="user-table" style={{ width: '100%', marginTop: '20px', textAlign: 'left' }}>
              <thead>
                <tr style={{ color: '#666', borderBottom: '1px solid #eee' }}>
                  <th style={{ padding: '10px' }}>Name</th>
                  <th>Classification</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {userList.length > 0 ? (
                  userList.map((user, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #fafafa' }}>
                      <td style={{ padding: '12px 10px' }}>{user.userName}</td>
                      <td>
                        <span className="badge" style={{ backgroundColor: '#fefce8', color: '#854d0e', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                          {user.wasteType}
                        </span>
                      </td>
                      <td>{user.date}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>No graduate study activity found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GRADUATES;