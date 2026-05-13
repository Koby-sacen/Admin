import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts';
import { School, Trash2, Scale, Users, Zap, Recycle, BarChart3 } from 'lucide-react';
import '../App.css';

const COED = () => {
  const [binData, setBinData] = useState([]);
  const [userList, setUserList] = useState([]);
  const [stats, setStats] = useState({ totalItems: 0, totalWeight: 0, uniqueContributors: 0, avgRecyclability: 0 });

  // NEW STATES FOR UPDATED VISUALS
  const [energyData, setEnergyData] = useState([]);
  const [typeBreakdown, setTypeBreakdown] = useState({
    organic: 0, paper: 0, plastic: 0, toxic: 0, medical: 0, residual: 0
  });

  // Responsive State
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getBinColor = (binName) => {
    const name = binName.toLowerCase();
    if (name.includes('blue') || name.includes('recyclable') || name.includes('paper')) return '#06b6d4';
    if (name.includes('green') || name.includes('biodegradable') || name.includes('organic')) return '#10b981';
    if (name.includes('yellow') || name.includes('residual')) return '#f59e0b';
    if (name.includes('red') || name.includes('hazardous') || name.includes('toxic') || name.includes('special')) return '#ef4444';
    return '#6b7280';
  };

  useEffect(() => {
    const fetchCOEDData = async () => {
      // 1. Fetch Waste Collection filtered by College of Education
      const wasteRef = collection(db, 'waste_collection');
      const q = query(wasteRef, where('location.detectedCollege', '==', 'College of Education'));
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

        // ADVANCED DATA PARSING (Visual Enhancement)
        // Parse the wasteList array for specific material breakdown
        if (data.wasteList && Array.isArray(data.wasteList)) {
            data.wasteList.forEach(item => {
                const lower = item.toLowerCase();
                if (lower.includes('toxic')) breakdown.toxic++;
                else if (lower.includes('medical')) breakdown.medical++;
                else if (lower.includes('recyclable')) breakdown.plastic++;
                else if (lower.includes('residual')) breakdown.residual++;
            });
        }

        // Process Energy Level for the Radar Chart
        const eLevel = data.energyLevel?.toLowerCase() || 'low';
        if (energyLevels[eLevel] !== undefined) energyLevels[eLevel]++;

        // Recyclability tracking
        const rate = parseInt(data.recyclabilityRate) || 0;
        totalRecycleRate += rate;

        // Calculate Weight (Support for "grams" vs "kg" strings)
        const weightMatch = data.totalWeight?.match(/(\d+(\.\d+)?)/);
        const weightValue = weightMatch ? parseFloat(weightMatch[0]) : 0;
        if (data.totalWeight?.toLowerCase().includes('kg')) {
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
        { subject: 'High Energy', A: energyLevels.high },
        { subject: 'Med Energy', A: energyLevels.medium },
        { subject: 'Low Energy', A: energyLevels.low },
      ]);

      setTypeBreakdown(breakdown);

      setStats({
        totalItems: wasteSnapshot.size,
        totalWeight: (totalWeightGrams / 1000).toFixed(2),
        uniqueContributors: contributors.size,
        avgRecyclability: wasteSnapshot.size > 0 ? (totalRecycleRate / wasteSnapshot.size).toFixed(0) : 0
      });

      // Reversed to show the absolute latest at the top
      setUserList(records.slice(-5).reverse());
    };

    fetchCOEDData();
  }, []);

  const COLORS = ['#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc', '#10b981'];

  return (
    <div className="home-stats" style={{ padding: isMobile ? '15px' : '25px', backgroundColor: '#ecfeff', minHeight: '100vh' }}>
      <div className="header-flex" style={{ display: 'flex', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '10px' }}>
        <School size={isMobile ? 32 : 40} color="#06b6d4" />
        <div style={{ marginLeft: isMobile ? '0px' : '15px' }}>
          <h1 style={{ margin: 0, fontSize: isMobile ? '1.4rem' : '1.8rem', color: '#164e63' }}>College of Education</h1>
          <p style={{ margin: 0, color: '#0891b2', fontSize: isMobile ? '0.85rem' : '1rem' }}>Sustainability & Environmental Education Hub</p>
        </div>
      </div>

      {/* --- STAT CARDS --- */}
      <div className="stats-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '15px', 
        marginBottom: '30px' 
      }}>
        <div className="stat-card" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div className="card-icon"><Trash2 size={24} color="#06b6d4" /></div>
          <h3 style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '10px' }}>COED Total Scans</h3>
          <p className="stat-number" style={{ fontSize: '1.6rem', fontWeight: 'bold', margin: 0 }}>{stats.totalItems}</p>
        </div>
        <div className="stat-card weight-card" style={{ borderLeft: '4px solid #06b6d4', backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div className="card-icon"><Scale size={24} color="#06b6d4" /></div>
          <h3 style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '10px' }}>Total Weight Collected</h3>
          <p className="stat-number" style={{ fontSize: '1.6rem', fontWeight: 'bold', margin: 0 }}>{stats.totalWeight} <span className="unit" style={{ fontSize: '0.9rem' }}>kg</span></p>
        </div>
        <div className="stat-card" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div className="card-icon"><Recycle size={24} color="#10b981" /></div>
          <h3 style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '10px' }}>Avg. Recyclability</h3>
          <p className="stat-number" style={{ fontSize: '1.6rem', fontWeight: 'bold', margin: 0 }}>{stats.avgRecyclability}%</p>
        </div>
        <div className="stat-card user-card" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div className="card-icon"><Users size={24} color="#06b6d4" /></div>
          <h3 style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '10px' }}>Total Contributors</h3>
          <p className="stat-number" style={{ fontSize: '1.6rem', fontWeight: 'bold', margin: 0 }}>{stats.uniqueContributors}</p>
        </div>
      </div>

      <div className="charts-main-container" style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
        gap: '20px', 
        marginBottom: '20px' 
      }}>
        {/* --- PIE CHART: SEGREGATION IN COED --- */}
        <div className="chart-item" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '10px' }}>Waste Segregation Mix</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={binData}
                innerRadius={isMobile ? 50 : 70}
                outerRadius={isMobile ? 70 : 90}
                paddingAngle={5}
                dataKey="value"
                label={!isMobile}
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

        {/* --- RADAR CHART: ENERGY --- */}
        <div className="chart-item" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '10px' }}>Processing Requirements</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart cx="50%" cy="50%" outerRadius={isMobile ? "60%" : "80%"} data={energyData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <Radar name="Energy Level" dataKey="A" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.6} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr', 
        gap: '20px' 
      }}>
        {/* --- MATERIAL BAR CHART --- */}
        <div className="chart-item" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
            <BarChart3 size={20} color="#06b6d4" />
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Material Classification</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={[
                { name: 'Organic', val: typeBreakdown.organic },
                { name: 'Paper', val: typeBreakdown.paper },
                { name: 'Plastic', val: typeBreakdown.plastic },
                { name: 'Toxic', val: typeBreakdown.toxic },
                { name: 'Resid.', val: typeBreakdown.residual },
            ]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="val">
                { [0,1,2,3,4].map((i) => <Cell key={i} fill={['#10b981', '#06b6d4', '#f59e0b', '#ef4444', '#6b7280'][i]} />) }
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* --- USER ACTIVITY TABLE --- */}
        <div className="chart-item" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '10px' }}>Recent Submissions</h3>
          <div className="user-table-container" style={{ overflowX: 'auto' }}>
            <table className="user-table" style={{ width: '100%', minWidth: '300px', marginTop: '10px', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ color: '#64748b', borderBottom: '2px solid #f1f5f9', fontSize: '0.8rem' }}>
                  <th style={{ padding: '12px' }}>User</th>
                  <th>Category</th>
                  <th style={{ textAlign: 'center' }}>Impact</th>
                </tr>
              </thead>
              <tbody>
                {userList.length > 0 ? (
                  userList.map((user, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '0.85rem' }}>{user.userName}</div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{user.date}</div>
                      </td>
                      <td>
                        <span className="badge" style={{ 
                            backgroundColor: getBinColor(user.wasteType) + '15', 
                            color: getBinColor(user.wasteType), 
                            padding: '4px 10px', 
                            borderRadius: '20px', 
                            fontSize: '10px',
                            fontWeight: '600',
                            whiteSpace: 'nowrap'
                        }}>
                          {user.wasteType}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {user.energy === 'high' ? <Zap size={14} color="#ef4444" /> : <Zap size={14} color="#10b981" />}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>No records.</td>
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

export default COED;