import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { Palette, Trash2, Scale, Users } from 'lucide-react';
import '../App.css';

const CAS = () => {
  const [binData, setBinData] = useState([]);
  const [userList, setUserList] = useState([]);
  const [stats, setStats] = useState({ totalItems: 0, totalWeight: 0, uniqueContributors: 0 });

  // Specific color mapping based on the name of the bin
  const getBinColor = (binName) => {
    const name = binName.toLowerCase();
    if (name.includes('blue') || name.includes('recyclable')) return '#3b82f6'; 
    if (name.includes('green') || name.includes('biodegradable')) return '#10b981'; 
    if (name.includes('yellow') || name.includes('residual')) return '#f59e0b'; 
    if (name.includes('red') || name.includes('hazardous')) return '#ef4444'; 
    return '#6b7280'; 
  };

  useEffect(() => {
    const fetchCASData = async () => {
      const wasteRef = collection(db, 'waste_collection');
      // FILTERING FOR COLLEGE OF ARTS AND SCIENCES
      const q = query(wasteRef, where('location.detectedCollege', '==', 'College of Arts and Sciences'));
      const wasteSnapshot = await getDocs(q);
      
      const binCounts = {};
      let totalWeightGrams = 0;
      const contributors = new Set();
      const records = [];

      wasteSnapshot.forEach((doc) => {
        const data = doc.data();
        const bin = data.binData || 'Unsorted';
        binCounts[bin] = (binCounts[bin] || 0) + 1;

        const weightMatch = data.totalWeight?.match(/(\d+(\.\d+)?)/);
        const weightValue = weightMatch ? parseFloat(weightMatch[0]) : 0;
        totalWeightGrams += weightValue;

        if (data.userId) contributors.add(data.userId);

        records.push({
          userName: data.userName || 'Anonymous',
          wasteType: data.wasteType || 'General',
          date: data.createdAt?.toDate().toLocaleDateString() || 'N/A'
        });
      });

      setBinData(Object.keys(binCounts).map(name => ({ 
        name, 
        value: binCounts[name] 
      })));

      setStats({
        totalItems: wasteSnapshot.size,
        totalWeight: (totalWeightGrams / 1000).toFixed(2),
        uniqueContributors: contributors.size
      });

      setUserList(records.slice(0, 5));
    };

    fetchCASData();
  }, []);

  return (
    <div className="home-stats">
      <div className="header-flex">
        {/* Changed Icon to Palette for Arts & Sciences */}
        <Palette size={32} color="#8b5cf6" /> 
        <h1 style={{ marginLeft: '10px' }}>College of Arts and Sciences Dashboard</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="card-icon"><Trash2 size={20} /></div>
          <h3>Total CAS Scans</h3>
          <p className="stat-number">{stats.totalItems}</p>
        </div>
        
        {/* CAS Theme: Purple/Indigo border */}
        <div className="stat-card weight-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <div className="card-icon"><Scale size={20} /></div>
          <h3>Total Weight</h3>
          <p className="stat-number">{stats.totalWeight} <span className="unit">kg</span></p>
        </div>

        <div className="stat-card user-card">
          <div className="card-icon"><Users size={20} /></div>
          <h3>Contributors</h3>
          <p className="stat-number">{stats.uniqueContributors}</p>
        </div>
      </div>

      <div className="charts-main-container">
        <div className="chart-item">
          <h3>Waste Segregation (CAS)</h3>
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
                  <Cell key={`cell-${index}`} fill={getBinColor(entry.name)} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-item">
          <h3>Recent Contributors</h3>
          <div className="user-table-container">
            <table className="user-table" style={{ width: '100%', marginTop: '20px', textAlign: 'left' }}>
              <thead>
                <tr style={{ color: '#666', borderBottom: '1px solid #eee' }}>
                  <th style={{ padding: '10px' }}>User</th>
                  <th>Waste Type</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {userList.map((user, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #fafafa' }}>
                    <td style={{ padding: '12px 10px' }}>{user.userName}</td>
                    <td>
                      <span className="badge" style={{ backgroundColor: '#f5f3ff', color: '#8b5cf6' }}>
                        {user.wasteType}
                      </span>
                    </td>
                    <td>{user.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CAS;