import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts';
import { Settings, Trash2, Scale, Users, Zap, Recycle, BarChart3 } from 'lucide-react';
import '../App.css';

const CIT = () => {
  const [binData, setBinData] = useState([]);
  const [userList, setUserList] = useState([]);
  const [stats, setStats] = useState({ totalItems: 0, totalWeight: 0, uniqueContributors: 0, avgRecyclability: 0 });
  
  // NEW STATES FOR UPDATED VISUALS
  const [energyData, setEnergyData] = useState([]);
  const [typeBreakdown, setTypeBreakdown] = useState({
    organic: 0, paper: 0, plastic: 0, toxic: 0, medical: 0, residual: 0
  });

  // Specific color mapping for CIT (Industrial Tech Theme)
  const getBinColor = (binName) => {
    const name = binName.toLowerCase();
    if (name.includes('blue') || name.includes('recyclable') || name.includes('paper')) return '#3b82f6';
    if (name.includes('green') || name.includes('biodegradable') || name.includes('organic')) return '#10b981';
    if (name.includes('yellow') || name.includes('residual')) return '#f59e0b';
    if (name.includes('red') || name.includes('hazardous') || name.includes('toxic') || name.includes('special')) return '#ef4444';
    return '#6b7280';
  };

  useEffect(() => {
    const fetchCITData = async () => {
      // 1. Fetch Waste Collection filtered by College of Industrial Technology
      const wasteRef = collection(db, 'waste_collection');
      const q = query(wasteRef, where('location.detectedCollege', '==', 'College of Industrial Technology'));
      const wasteSnapshot = await getDocs(q);
      
      const binCounts = {};
      const energyLevels = { high: 0, medium: 0, low: 0 };
      const breakdown = { organic: 0, paper: 0, plastic: 0, toxic: 0, medical: 0, residual: 0 };
      
      let totalWeightGrams = 0;
      let totalRecycleRate = 0;
      const contributors = new Set();
      const records = [];

      wasteSnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Count Bin Types
        const bin = data.binData || 'Unsorted';
        binCounts[bin] = (binCounts[bin] || 0) + 1;

        // ADVANCED DATA PARSING
        // Waste List Processing
        if (data.wasteList && Array.isArray(data.wasteList)) {
            data.wasteList.forEach(item => {
                const lower = item.toLowerCase();
                // UPDATED LOGIC TO MATCH DATA STRINGS
                if (lower.includes('[recyclable]')) {
                    if (lower.includes('paper') || lower.includes('cardboard') || lower.includes('cup')) {
                        breakdown.paper++;
                    } else if (lower.includes('bottle') || lower.includes('plastic')) {
                        breakdown.plastic++;
                    } else {
                        breakdown.plastic++; // Default recyclables to plastic if unspecified
                    }
                } 
                else if (lower.includes('[residual]')) {
                    breakdown.residual++;
                }
                else if (lower.includes('toxic')) breakdown.toxic++;
                else if (lower.includes('medical')) breakdown.medical++;
                else if (lower.includes('organic')) breakdown.organic++;
            });
        }

        // Energy level data
        const eLevel = data.energyLevel?.toLowerCase() || 'low';
        if (energyLevels[eLevel] !== undefined) energyLevels[eLevel]++;

        // Recyclability tracking
        const rate = parseInt(data.recyclabilityRate) || 0;
        totalRecycleRate += rate;

        // UPDATED WEIGHT LOGIC: Robust support for "grams" vs "kg"
        const weightRaw = String(data.totalWeight || '0').toLowerCase();
        const weightMatch = weightRaw.match(/(\d+(\.\d+)?)/);
        const weightValue = weightMatch ? parseFloat(weightMatch[0]) : 0;
        
        if (weightRaw.includes('kg') || weightRaw.includes('kilogram')) {
            totalWeightGrams += (weightValue * 1000);
        } else {
            totalWeightGrams += weightValue;
        }

        // Track Contributors
        if (data.userId) contributors.add(data.userId);

        records.push({
          userName: data.userName || 'Anonymous',
          wasteType: data.binData || 'General',
          date: data.createdAt?.toDate().toLocaleDateString() || 'N/A',
          energy: data.energyLevel || 'low'
        });
      });

      // 2. Formatting Charts
      setBinData(Object.keys(binCounts).map(name => ({ 
        name, 
        value: binCounts[name] 
      })));

      setEnergyData([
        { subject: 'High (Ind.)', A: energyLevels.high },
        { subject: 'Med (Std.)', A: energyLevels.medium },
        { subject: 'Low (Man.)', A: energyLevels.low },
      ]);

      setTypeBreakdown(breakdown);

      setStats({
        totalItems: wasteSnapshot.size,
        totalWeight: (totalWeightGrams / 1000).toFixed(2),
        uniqueContributors: contributors.size,
        avgRecyclability: wasteSnapshot.size > 0 ? (totalRecycleRate / wasteSnapshot.size).toFixed(0) : 0
      });

      // Show top 5 recent posters (reversed for latest)
      setUserList(records.slice(-5).reverse());
    };

    fetchCITData();
  }, []);

  return (
    <div className="home-stats" style={{ padding: '25px', backgroundColor: '#f0fdf4', minHeight: '100vh' }}>
      {/* Injecting Responsive Rules */}
      <style>{`
        .responsive-grid-4 { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
        .responsive-grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-bottom: 20px; }
        .responsive-bottom-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 20px; }
        @media (max-width: 1024px) {
          .responsive-bottom-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .header-flex { flex-direction: column; align-items: flex-start !important; }
          .header-flex div { marginLeft: 0 !important; margin-top: 10px; }
          .stat-number { font-size: 1.2rem !important; }
        }
      `}</style>

      <div className="header-flex" style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
        <Settings size={40} color="#10b981" />
        <div style={{ marginLeft: '15px' }}>
          <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#064e3b' }}>College of Industrial Technology</h1>
          <p style={{ margin: 0, color: '#059669' }}>Industrial Waste & Resource Management</p>
        </div>
      </div>

      {/* --- STAT CARDS --- */}
      <div className="responsive-grid-4">
        <div className="stat-card" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div className="card-icon"><Trash2 size={24} color="#10b981" /></div>
          <h3 style={{ color: '#6b7280', fontSize: '0.9rem' }}>Total CIT Scans</h3>
          <p className="stat-number" style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '5px 0' }}>{stats.totalItems}</p>
        </div>
        <div className="stat-card weight-card" style={{ borderLeft: '4px solid #10b981', backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div className="card-icon"><Scale size={24} color="#10b981" /></div>
          <h3 style={{ color: '#6b7280', fontSize: '0.9rem' }}>CIT Waste Weight</h3>
          <p className="stat-number" style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '5px 0' }}>{stats.totalWeight} <span className="unit" style={{ fontSize: '0.8rem' }}>kg</span></p>
        </div>
        <div className="stat-card" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div className="card-icon"><Recycle size={24} color="#3b82f6" /></div>
          <h3 style={{ color: '#6b7280', fontSize: '0.9rem' }}>Recyclability</h3>
          <p className="stat-number" style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '5px 0' }}>{stats.avgRecyclability}%</p>
        </div>
        <div className="stat-card user-card" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div className="card-icon"><Users size={24} color="#f59e0b" /></div>
          <h3 style={{ color: '#6b7280', fontSize: '0.9rem' }}>Total Users</h3>
          <p className="stat-number" style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '5px 0' }}>{stats.uniqueContributors}</p>
        </div>
      </div>

      <div className="responsive-grid-2">
        <div className="chart-item" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px' }}>
          <h3 style={{ color: '#064e3b', marginBottom: '15px' }}>Waste Segregation Mix</h3>
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

        <div className="chart-item" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px' }}>
          <h3 style={{ color: '#064e3b', marginBottom: '15px' }}>Processing Energy Requirements</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={energyData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{fontSize: 12}} />
              <Radar name="Items" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="responsive-bottom-grid">
        <div className="chart-item" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
            <BarChart3 size={20} color="#10b981" />
            <h3 style={{ margin: 0, color: '#064e3b' }}>CIT Material Breakdown</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={[
                { name: 'Organic', val: typeBreakdown.organic, color: '#10b981' },
                { name: 'Paper', val: typeBreakdown.paper, color: '#3b82f6' },
                { name: 'Plastic', val: typeBreakdown.plastic, color: '#f59e0b' },
                { name: 'Toxic', val: typeBreakdown.toxic, color: '#ef4444' },
                { name: 'Residual', val: typeBreakdown.residual, color: '#6b7280' },
            ]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{fontSize: 12}} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="val">
                { [0,1,2,3,4].map((i) => (
                  <Cell key={i} fill={['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#6b7280'][i]} />
                )) }
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-item" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px' }}>
          <h3 style={{ color: '#064e3b', marginBottom: '15px' }}>Recent Users in CIT</h3>
          <div className="user-table-container" style={{ overflowX: 'auto' }}>
            <table className="user-table" style={{ width: '100%', marginTop: '10px', textAlign: 'left', borderCollapse: 'collapse', minWidth: '300px' }}>
              <thead>
                <tr style={{ color: '#666', borderBottom: '2px solid #f3f4f6' }}>
                  <th style={{ padding: '10px' }}>User Name</th>
                  <th>Type</th>
                  <th>Impact</th>
                </tr>
              </thead>
              <tbody>
                {userList.length > 0 ? (
                  userList.map((user, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #fafafa' }}>
                      <td style={{ padding: '12px 10px' }}>
                        <div style={{ fontWeight: '500', color: '#111827' }}>{user.userName}</div>
                        <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{user.date}</div>
                      </td>
                      <td>
                        <span className="badge" style={{ 
                            backgroundColor: getBinColor(user.wasteType) + '15', 
                            color: getBinColor(user.wasteType), 
                            padding: '4px 8px', 
                            borderRadius: '12px', 
                            fontSize: '11px',
                            fontWeight: '600'
                        }}>
                            {user.wasteType}
                        </span>
                      </td>
                      <td>
                        {user.energy === 'high' ? <Zap size={14} color="#ef4444" /> : <Zap size={14} color="#10b981" />}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>No recent activity found.</td>
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

export default CIT;