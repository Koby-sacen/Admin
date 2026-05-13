import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts';
import { Palette, Trash2, Scale, Users, Zap, Recycle, Activity } from 'lucide-react';
import '../App.css';

const CAS = () => {
  const [binData, setBinData] = useState([]);
  const [userList, setUserList] = useState([]);
  const [stats, setStats] = useState({ totalItems: 0, totalWeight: 0, uniqueContributors: 0, avgRecyclability: 0 });
  
  // NEW STATES FOR ADVANCED VISUALS
  const [timelineData, setTimelineData] = useState([]);
  const [energyData, setEnergyData] = useState([]);
  const [typeBreakdown, setTypeBreakdown] = useState({
    organic: 0, paper: 0, plastic: 0, toxic: 0, medical: 0, residual: 0
  });

  // Specific color mapping based on the name of the bin
  const getBinColor = (binName) => {
    const name = binName.toLowerCase();
    if (name.includes('blue') || name.includes('recyclable') || name.includes('paper')) return '#3b82f6'; 
    if (name.includes('green') || name.includes('biodegradable') || name.includes('organic')) return '#10b981'; 
    if (name.includes('yellow') || name.includes('residual')) return '#f59e0b'; 
    if (name.includes('red') || name.includes('hazardous') || name.includes('toxic') || name.includes('special')) return '#ef4444'; 
    if (name.includes('medical')) return '#8b5cf6';
    return '#6b7280'; 
  };

  useEffect(() => {
    const fetchCASData = async () => {
      const wasteRef = collection(db, 'waste_collection');
      // FILTERING FOR COLLEGE OF ARTS AND SCIENCES
      const q = query(wasteRef, where('location.detectedCollege', '==', 'College of Arts and Sciences'));
      const wasteSnapshot = await getDocs(q);
      
      const binCounts = {};
      const timelineCounts = {};
      const energyLevels = { high: 0, medium: 0, low: 0 };
      const breakdown = { organic: 0, paper: 0, plastic: 0, toxic: 0, medical: 0, residual: 0 };
      
      let totalWeightGrams = 0;
      let totalRecycleRate = 0;
      const contributors = new Set();
      const records = [];

      wasteSnapshot.forEach((doc) => {
        const data = doc.data();
        const bin = data.binData || 'Unsorted';
        binCounts[bin] = (binCounts[bin] || 0) + 1;

        // PARSING ADVANCED DATA FIELDS
        // 1. Waste List Breakdown
        if (data.wasteList && Array.isArray(data.wasteList)) {
            data.wasteList.forEach(item => {
                const lower = item.toLowerCase();
                if (lower.includes('toxic')) breakdown.toxic++;
                else if (lower.includes('medical')) breakdown.medical++;
                else if (lower.includes('recyclable')) breakdown.plastic++;
                else if (lower.includes('residual')) breakdown.residual++;
            });
        }

        // 2. Energy Levels
        const eLevel = data.energyLevel?.toLowerCase() || 'low';
        if (energyLevels[eLevel] !== undefined) energyLevels[eLevel]++;

        // 3. Recyclability
        const rate = parseInt(data.recyclabilityRate) || 0;
        totalRecycleRate += rate;

        const weightMatch = data.totalWeight?.match(/(\d+(\.\d+)?)/);
        const weightValue = weightMatch ? parseFloat(weightMatch[0]) : 0;
        // Check for kg vs grams
        if (data.totalWeight?.toLowerCase().includes('kg')) {
            totalWeightGrams += (weightValue * 1000);
        } else {
            totalWeightGrams += weightValue;
        }

        if (data.userId) contributors.add(data.userId);

        const dateObj = data.createdAt?.toDate();
        const dateStr = dateObj ? dateObj.toLocaleDateString() : 'N/A';
        
        // Timeline tracking
        if (dateStr !== 'N/A') {
            timelineCounts[dateStr] = (timelineCounts[dateStr] || 0) + 1;
        }

        records.push({
          userName: data.userName || 'Anonymous',
          wasteType: data.binData || 'General',
          date: dateStr,
          item: data.item || 'N/A',
          energy: data.energyLevel || 'low'
        });
      });

      setBinData(Object.keys(binCounts).map(name => ({ 
        name, 
        value: binCounts[name] 
      })));

      setTimelineData(Object.keys(timelineCounts).map(date => ({
        date,
        scans: timelineCounts[date]
      })));

      setEnergyData([
        { subject: 'High Energy', A: energyLevels.high, fullMark: wasteSnapshot.size },
        { subject: 'Med Energy', A: energyLevels.medium, fullMark: wasteSnapshot.size },
        { subject: 'Low Energy', A: energyLevels.low, fullMark: wasteSnapshot.size },
      ]);

      setTypeBreakdown(breakdown);

      setStats({
        totalItems: wasteSnapshot.size,
        totalWeight: (totalWeightGrams / 1000).toFixed(2),
        uniqueContributors: contributors.size,
        avgRecyclability: wasteSnapshot.size > 0 ? (totalRecycleRate / wasteSnapshot.size).toFixed(0) : 0
      });

      setUserList(records.slice(-5).reverse());
    };

    fetchCASData();
  }, []);

  return (
    <div className="home-stats" style={{ padding: '15px', backgroundColor: '#fefff5', minHeight: '100vh' }}>
      <div className="header-flex" style={{ display: 'flex', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '10px' }}>
        {/* Changed Icon to Palette for Arts & Sciences */}
        <Palette size={40} color="#8b5cf6" /> 
        <div style={{ flex: '1', minWidth: '250px' }}>
            <h1 style={{ margin: 0, fontSize: 'clamp(1.2rem, 5vw, 1.8rem)', color: '#4c1d95' }}>College of Arts and Sciences Dashboard</h1>
            <p style={{ margin: 0, color: '#7c3aed' }}>Creative Sustainability Analytics</p>
        </div>
      </div>

      <div className="stats-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '15px', 
        marginBottom: '25px' 
      }}>
        <div className="stat-card" style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <div className="card-icon"><Trash2 size={24} color="#8b5cf6" /></div>
          <h3 style={{ fontSize: '0.9rem', color: '#6b7280' }}>Total CAS Scans</h3>
          <p className="stat-number" style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '5px 0' }}>{stats.totalItems}</p>
        </div>
        
        {/* CAS Theme: Purple/Indigo border */}
        <div className="stat-card weight-card" style={{ borderLeft: '4px solid #8b5cf6', padding: '20px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <div className="card-icon"><Scale size={24} color="#8b5cf6" /></div>
          <h3 style={{ fontSize: '0.9rem', color: '#6b7280' }}>Total Weight</h3>
          <p className="stat-number" style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '5px 0' }}>{stats.totalWeight} <span className="unit" style={{ fontSize: '0.8rem' }}>kg</span></p>
        </div>

        <div className="stat-card user-card" style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <div className="card-icon"><Recycle size={24} color="#10b981" /></div>
          <h3 style={{ fontSize: '0.9rem', color: '#6b7280' }}>Recyclability</h3>
          <p className="stat-number" style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '5px 0' }}>{stats.avgRecyclability}%</p>
        </div>

        <div className="stat-card" style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <div className="card-icon"><Users size={24} color="#f59e0b" /></div>
          <h3 style={{ fontSize: '0.9rem', color: '#6b7280' }}>Contributors</h3>
          <p className="stat-number" style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '5px 0' }}>{stats.uniqueContributors}</p>
        </div>
      </div>

      <div className="charts-main-container" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '20px', 
        marginBottom: '20px' 
      }}>
        <div className="chart-item" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', minHeight: '350px' }}>
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

        <div className="chart-item" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', minHeight: '350px' }}>
          <h3>Disposal Energy Metrics</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={energyData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <Radar name="Items" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '20px' 
      }}>
        <div className="chart-item" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', minHeight: '300px' }}>
          <h3>Volume by Specific Category</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={[
                { name: 'Toxic', val: typeBreakdown.toxic, fill: '#ef4444' },
                { name: 'Medical', val: typeBreakdown.medical, fill: '#8b5cf6' },
                { name: 'Plastic', val: typeBreakdown.plastic, fill: '#3b82f6' },
                { name: 'Organic', val: typeBreakdown.organic, fill: '#10b981' },
                { name: 'Residual', val: typeBreakdown.residual, fill: '#f59e0b' },
            ]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" fontSize={12} tick={{fill: '#666'}} />
              <YAxis fontSize={12} tick={{fill: '#666'}} />
              <Tooltip />
              <Bar dataKey="val" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-item" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', overflowX: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Recent CAS Activity</h3>
            <Activity size={18} color="#8b5cf6" />
          </div>
          <div className="user-table-container" style={{ overflowX: 'auto' }}>
            <table className="user-table" style={{ width: '100%', marginTop: '10px', textAlign: 'left', borderCollapse: 'collapse', minWidth: '300px' }}>
              <thead>
                <tr style={{ color: '#666', borderBottom: '2px solid #f3f4f6' }}>
                  <th style={{ padding: '10px' }}>User</th>
                  <th>Classification</th>
                  <th>Impact</th>
                </tr>
              </thead>
              <tbody>
                {userList.map((user, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #fafafa' }}>
                    <td style={{ padding: '12px 10px' }}>
                        <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>{user.userName}</div>
                        <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{user.date}</div>
                    </td>
                    <td>
                      <span className="badge" style={{ 
                          backgroundColor: getBinColor(user.wasteType) + '15', 
                          color: getBinColor(user.wasteType),
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '0.7rem',
                          fontWeight: '600',
                          display: 'inline-block',
                          whiteSpace: 'nowrap'
                        }}>
                        {user.wasteType}
                      </span>
                    </td>
                    <td>
                        {user.energy === 'high' ? <Zap size={14} color="#ef4444" /> : <Zap size={14} color="#10b981" />}
                    </td>
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