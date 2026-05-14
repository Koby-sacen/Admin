import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts';
import { GraduationCap, Trash2, Scale, Users, Zap, Recycle, BarChart3 } from 'lucide-react';
import '../App.css';

const GRADUATES = () => {
  const [binData, setBinData] = useState([]);
  const [userList, setUserList] = useState([]);
  const [stats, setStats] = useState({ totalItems: 0, totalWeight: 0, uniqueContributors: 0, avgRecyclability: 0 });

  // NEW STATES FOR ENHANCED ANALYTICS
  const [energyData, setEnergyData] = useState([]);
  const [typeBreakdown, setTypeBreakdown] = useState({
    organic: 0, paper: 0, plastic: 0, toxic: 0, medical: 0, residual: 0
  });

  // RESPONSIVE STATE
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getBinColor = (binName) => {
    const name = binName.toLowerCase();
    if (name.includes('blue') || name.includes('recyclable') || name.includes('paper')) return '#3b82f6';
    if (name.includes('green') || name.includes('biodegradable') || name.includes('organic')) return '#10b981';
    if (name.includes('yellow') || name.includes('residual')) return '#eab308';
    if (name.includes('red') || name.includes('hazardous') || name.includes('toxic')) return '#ef4444';
    return '#6b7280';
  };

  useEffect(() => {
    const fetchGraduateData = async () => {
      // 1. Fetch Waste Collection filtered by SSU College of Graduate Studies
      const wasteRef = collection(db, 'waste_collection');
      const q = query(wasteRef, where('location.detectedCollege', '==', 'SSU College of Graduate Studies'));
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
        if (data.wasteList && Array.isArray(data.wasteList)) {
            data.wasteList.forEach(item => {
                const lower = item.toLowerCase();
                if (lower.includes('paper')) breakdown.paper++;
                else if (lower.includes('plastic')) breakdown.plastic++;
                else if (lower.includes('organic')) breakdown.organic++;
                else if (lower.includes('toxic')) breakdown.toxic++;
                else breakdown.residual++;
            });
        }

        const eLevel = data.energyLevel?.toLowerCase() || 'low';
        if (energyLevels[eLevel] !== undefined) energyLevels[eLevel]++;

        const rate = parseInt(data.recyclabilityRate) || 0;
        totalRecycleRate += rate;

        // STANDARDIZED WEIGHT CALCULATION
        const weightRaw = String(data.totalWeight || '0').toLowerCase();
        const weightMatch = weightRaw.match(/(\d+(\.\d+)?)/);
        const weightValue = weightMatch ? parseFloat(weightMatch[0]) : 0;
        
        if (weightRaw.includes('kg')) {
            totalWeightGrams += (weightValue * 1000);
        } else {
            totalWeightGrams += weightValue;
        }

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
        { subject: 'High Impact', A: energyLevels.high },
        { subject: 'Medium Impact', A: energyLevels.medium },
        { subject: 'Low Impact', A: energyLevels.low },
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

    fetchGraduateData();
  }, []);

  return (
    <div className="home-stats" style={{ padding: isMobile ? '15px' : '25px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <div className="header-flex" style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: '30px', flexDirection: isMobile ? 'column' : 'row' }}>
        <GraduationCap size={isMobile ? 35 : 40} color="#eab308" />
        <div style={{ marginLeft: isMobile ? '0' : '15px', marginTop: isMobile ? '10px' : '0' }}>
          <h1 style={{ margin: 0, fontSize: isMobile ? '1.4rem' : '1.8rem', color: '#713f12' }}>College of Graduate Studies</h1>
          <p style={{ margin: 0, color: '#a16207', fontSize: isMobile ? '0.9rem' : '1rem' }}>Advanced Research & Sustainable Practices</p>
        </div>
      </div>

      {/* --- STAT CARDS --- */}
      <div className="stats-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? 'repeat(auto-fit, minmax(140px, 1fr))' : 'repeat(4, 1fr)', 
        gap: '15px', 
        marginBottom: '30px' 
      }}>
        <div className="stat-card" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div className="card-icon"><Trash2 size={24} color="#eab308" /></div>
          <h3 style={{ color: '#854d0e', fontSize: '0.85rem', margin: '10px 0' }}>CGS Total Items</h3>
          <p className="stat-number" style={{ fontSize: isMobile ? '1.3rem' : '1.6rem', fontWeight: 'bold', margin: 0 }}>{stats.totalItems}</p>
        </div>
        <div className="stat-card weight-card" style={{ borderLeft: '4px solid #eab308', backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div className="card-icon"><Scale size={24} color="#eab308" /></div>
          <h3 style={{ color: '#854d0e', fontSize: '0.85rem', margin: '10px 0' }}>CGS Weight (kg)</h3>
          <p className="stat-number" style={{ fontSize: isMobile ? '1.3rem' : '1.6rem', fontWeight: 'bold', margin: 0 }}>{stats.totalWeight} <span className="unit" style={{ fontSize: '0.9rem' }}>kg</span></p>
        </div>
        <div className="stat-card" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div className="card-icon"><Recycle size={24} color="#10b981" /></div>
          <h3 style={{ color: '#854d0e', fontSize: '0.85rem', margin: '10px 0' }}>Recyclability</h3>
          <p className="stat-number" style={{ fontSize: isMobile ? '1.3rem' : '1.6rem', fontWeight: 'bold', margin: 0 }}>{stats.avgRecyclability}%</p>
        </div>
        <div className="stat-card user-card" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div className="card-icon"><Users size={24} color="#eab308" /></div>
          <h3 style={{ color: '#854d0e', fontSize: '0.85rem', margin: '10px 0' }}>Grad Students</h3>
          <p className="stat-number" style={{ fontSize: isMobile ? '1.3rem' : '1.6rem', fontWeight: 'bold', margin: 0 }}>{stats.uniqueContributors}</p>
        </div>
      </div>

      <div className="charts-main-container" style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
        gap: '20px', 
        marginBottom: '20px' 
      }}>
        <div className="chart-item" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px' }}>
          <h3>Waste Segregation Mix</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={binData}
                innerRadius={isMobile ? 55 : 70}
                outerRadius={isMobile ? 80 : 90}
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

        <div className="chart-item" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px' }}>
          <h3>Environmental Load Profile</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart cx="50%" cy="50%" outerRadius={isMobile ? "65%" : "80%"} data={energyData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: isMobile ? 10 : 12 }} />
              <Radar name="Items" dataKey="A" stroke="#eab308" fill="#eab308" fillOpacity={0.6} />
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
        <div className="chart-item" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
            <BarChart3 size={20} color="#eab308" />
            <h3 style={{ margin: 0 }}>CGS Material Breakdown</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={[
                { name: 'Organic', val: typeBreakdown.organic },
                { name: 'Paper', val: typeBreakdown.paper },
                { name: 'Plastic', val: typeBreakdown.plastic },
                { name: 'Residual', val: typeBreakdown.residual },
            ]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: isMobile ? 10 : 12 }} />
              <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
              <Tooltip />
              <Bar dataKey="val">
                { [0,1,2,3].map((i) => (
                  <Cell key={i} fill={['#10b981', '#3b82f6', '#f59e0b', '#6b7280'][i]} />
                )) }
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-item" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px' }}>
          <h3>Recent Graduate Activity</h3>
          <div className="user-table-container" style={{ overflowX: 'auto' }}>
            <table className="user-table" style={{ width: '100%', minWidth: '300px', marginTop: '10px', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ color: '#854d0e', borderBottom: '2px solid #fefce8', fontSize: '0.9rem' }}>
                  <th style={{ padding: '12px' }}>Name</th>
                  <th>Classification</th>
                  <th>Impact</th>
                </tr>
              </thead>
              <tbody>
                {userList.length > 0 ? (
                  userList.map((user, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: '600', color: '#422006', fontSize: isMobile ? '0.85rem' : '1rem' }}>{user.userName}</div>
                        <div style={{ fontSize: '0.7rem', color: '#a16207' }}>{user.date}</div>
                      </td>
                      <td>
                        <span className="badge" style={{ 
                            backgroundColor: getBinColor(user.wasteType) + '15', 
                            color: getBinColor(user.wasteType), 
                            padding: '4px 10px', 
                            borderRadius: '20px', 
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
                    <td colSpan="3" style={{ textAlign: 'center', padding: '20px', color: '#a16207' }}>No records found.</td>
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