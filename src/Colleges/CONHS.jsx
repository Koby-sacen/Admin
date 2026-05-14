import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts';
import { HeartPulse, Trash2, Scale, Users, Zap, Recycle, BarChart3 } from 'lucide-react';
import '../App.css';

const CONHS = () => {
  const [binData, setBinData] = useState([]);
  const [userList, setUserList] = useState([]);
  const [stats, setStats] = useState({ totalItems: 0, totalWeight: 0, uniqueContributors: 0, avgRecyclability: 0 });

  const [energyData, setEnergyData] = useState([]);
  const [typeBreakdown, setTypeBreakdown] = useState({
    organic: 0, paper: 0, plastic: 0, toxic: 0, medical: 0, residual: 0
  });

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
    if (name.includes('yellow') || name.includes('residual')) return '#f59e0b';
    if (name.includes('red') || name.includes('hazardous') || name.includes('toxic') || name.includes('medical')) return '#f43f5e';
    return '#6b7280';
  };

  useEffect(() => {
    const fetchCONHSData = async () => {
      const wasteRef = collection(db, 'waste_collection');
      const q = query(wasteRef, where('location.detectedCollege', '==', 'College of Nursing & Health Sciences'));
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
        
        // --- WASTE CATEGORY PARSING ---
        const bin = data.binData || 'Unsorted';
        binCounts[bin] = (binCounts[bin] || 0) + 1;

        if (data.wasteList && Array.isArray(data.wasteList)) {
            data.wasteList.forEach(item => {
                const lower = item.toLowerCase();
                if (lower.includes('medical') || lower.includes('mask') || lower.includes('gloves') || lower.includes('syringe')) {
                    breakdown.medical++;
                } else if (lower.includes('toxic') || lower.includes('chemical')) {
                    breakdown.toxic++;
                } else if (lower.includes('plastic')) {
                    breakdown.plastic++;
                } else if (lower.includes('paper')) {
                    breakdown.paper++;
                } else if (lower.includes('organic')) {
                    breakdown.organic++;
                } else {
                    breakdown.residual++;
                }
            });
        }

        // --- ENHANCED WEIGHT CALCULATION LOGIC ---
        // This regex extracts numbers even from strings like "Total Weight: 1.5kg" or "500 grams"
        const weightRaw = String(data.totalWeight || '0').toLowerCase();
        const weightMatch = weightRaw.match(/(\d+(\.\d+)?)/);
        const weightValue = weightMatch ? parseFloat(weightMatch[0]) : 0;
        
        if (weightRaw.includes('kg') || weightRaw.includes('kilogram')) {
            totalWeightGrams += (weightValue * 1000);
        } else {
            // Assume grams if no unit or if "g/grams" is specified
            totalWeightGrams += weightValue;
        }

        const eLevel = data.energyLevel?.toLowerCase() || 'low';
        if (energyLevels[eLevel] !== undefined) energyLevels[eLevel]++;

        const rate = parseInt(data.recyclabilityRate) || 0;
        totalRecycleRate += rate;

        if (data.userId) contributors.add(data.userId);

        records.push({
          userName: data.userName || 'Anonymous',
          wasteType: data.binData || 'General',
          date: data.createdAt?.toDate().toLocaleDateString() || 'N/A',
          energy: data.energyLevel || 'low'
        });
      });

      // Update States
      setBinData(Object.keys(binCounts).map(name => ({ name, value: binCounts[name] })));
      setEnergyData([
        { subject: 'Bio-Hazard', A: energyLevels.high },
        { subject: 'Medium', A: energyLevels.medium },
        { subject: 'Sanitary', A: energyLevels.low },
      ]);
      setTypeBreakdown(breakdown);
      setStats({
        totalItems: wasteSnapshot.size,
        totalWeight: (totalWeightGrams / 1000).toFixed(2), // Always convert to kg for display
        uniqueContributors: contributors.size,
        avgRecyclability: wasteSnapshot.size > 0 ? (totalRecycleRate / wasteSnapshot.size).toFixed(0) : 0
      });
      setUserList(records.slice(-5).reverse());
    };

    fetchCONHSData();
  }, []);

  return (
    <div className="home-stats" style={{ padding: isMobile ? '15px' : '25px', backgroundColor: '#fff1f2', minHeight: '100vh' }}>
      <div className="header-flex" style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', marginBottom: '30px', flexDirection: isMobile ? 'column' : 'row' }}>
        <HeartPulse size={isMobile ? 32 : 40} color="#ff0c92" />
        <div style={{ marginLeft: isMobile ? '0' : '15px', marginTop: isMobile ? '10px' : '0' }}>
          <h1 style={{ margin: 0, fontSize: isMobile ? '1.4rem' : '1.8rem', color: '#881337' }}>College of Nursing & Health Sciences</h1>
          <p style={{ margin: 0, color: '#be123c', fontSize: isMobile ? '0.9rem' : '1rem' }}>Bio-Waste Management & Health Compliance</p>
        </div>
      </div>

      <div className="stats-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? 'repeat(auto-fit, minmax(140px, 1fr))' : 'repeat(4, 1fr)', 
        gap: '15px', 
        marginBottom: '30px' 
      }}>
        <div className="stat-card" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div className="card-icon"><Trash2 size={24} color="#f43f5e" /></div>
          <h3 style={{ color: '#9f1239', fontSize: '0.85rem', marginTop: '10px' }}>CONHS Waste Scans</h3>
          <p className="stat-number" style={{ fontSize: isMobile ? '1.3rem' : '1.6rem', fontWeight: 'bold', margin: 0 }}>{stats.totalItems}</p>
        </div>
        
        {/* FIXED WEIGHT CARD */}
        <div className="stat-card weight-card" style={{ borderLeft: '4px solid #ff0c92', backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div className="card-icon"><Scale size={24} color="#f43f5e" /></div>
          <h3 style={{ color: '#9f1239', fontSize: '0.85rem', marginTop: '10px' }}>Health Science Waste</h3>
          <p className="stat-number" style={{ fontSize: isMobile ? '1.3rem' : '1.6rem', fontWeight: 'bold', margin: 0 }}>
            {stats.totalWeight} <span className="unit" style={{ fontSize: '0.9rem' }}>kg</span>
          </p>
        </div>

        <div className="stat-card" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div className="card-icon"><Recycle size={24} color="#10b981" /></div>
          <h3 style={{ color: '#9f1239', fontSize: '0.85rem', marginTop: '10px' }}>Recyclability Rate</h3>
          <p className="stat-number" style={{ fontSize: isMobile ? '1.3rem' : '1.6rem', fontWeight: 'bold', margin: 0 }}>{stats.avgRecyclability}%</p>
        </div>
        <div className="stat-card user-card" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
          <div className="card-icon"><Users size={24} color="#f43f5e" /></div>
          <h3 style={{ color: '#9f1239', fontSize: '0.85rem', marginTop: '10px' }}>Active Students</h3>
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
          <h3 style={{ color: '#881337', fontSize: '1.1rem' }}>Segregation Mix</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={binData}
                innerRadius={isMobile ? 50 : 70}
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
          <h3 style={{ color: '#881337', fontSize: '1.1rem' }}>Waste Disposal Energy</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart cx="50%" cy="50%" outerRadius={isMobile ? "60%" : "80%"} data={energyData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: isMobile ? 10 : 12 }} />
              <Radar name="Scans" dataKey="A" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.6} />
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
            <BarChart3 size={20} color="#f43f5e" />
            <h3 style={{ margin: 0, color: '#881337', fontSize: '1.1rem' }}>Medical vs General Breakdown</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={[
                { name: 'Medical', val: typeBreakdown.medical },
                { name: 'Toxic', val: typeBreakdown.toxic },
                { name: 'Organic', val: typeBreakdown.organic },
                { name: 'Plastic', val: typeBreakdown.plastic },
                { name: 'Residual', val: typeBreakdown.residual },
            ]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: isMobile ? 10 : 12 }} />
              <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
              <Tooltip />
              <Bar dataKey="val">
                { [0,1,2,3,4].map((i) => (
                  <Cell key={i} fill={['#f43f5e', '#be123c', '#10b981', '#3b82f6', '#6b7280'][i]} />
                )) }
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-item" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px' }}>
          <h3 style={{ color: '#881337', fontSize: '1.1rem' }}>Recent CONHS Contributors</h3>
          <div className="user-table-container" style={{ overflowX: 'auto' }}>
            <table className="user-table" style={{ width: '100%', minWidth: '300px', marginTop: '10px', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ color: '#9f1239', borderBottom: '2px solid #fff1f2', fontSize: '0.9rem' }}>
                  <th style={{ padding: '12px' }}>Contributor</th>
                  <th>Classification</th>
                  <th>Risk</th>
                </tr>
              </thead>
              <tbody>
                {userList.length > 0 ? (
                  userList.map((user, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #fff5f7' }}>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: '600', color: '#881337', fontSize: '0.85rem' }}>{user.userName}</div>
                        <div style={{ fontSize: '0.7rem', color: '#fb7185' }}>{user.date}</div>
                      </td>
                      <td>
                        <span className="badge" style={{ 
                            backgroundColor: getBinColor(user.wasteType) + '15', 
                            color: getBinColor(user.wasteType), 
                            padding: '4px 10px', 
                            borderRadius: '20px', 
                            fontSize: '10px',
                            fontWeight: '600'
                        }}>
                          {user.wasteType}
                        </span>
                      </td>
                      <td>
                        {user.energy === 'high' ? <Zap size={14} color="#f43f5e" /> : <Zap size={14} color="#10b981" />}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '20px', color: '#be123c' }}>No waste records found.</td>
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

export default CONHS;