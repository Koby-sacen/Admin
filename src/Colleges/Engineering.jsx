import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts';
import { HardHat, Trash2, Scale, Users, Zap, Recycle, Activity, AlertTriangle } from 'lucide-react';
import '../App.css';

const Engineering = () => {
  const [binData, setBinData] = useState([]);
  const [userList, setUserList] = useState([]);
  const [stats, setStats] = useState({ totalItems: 0, totalWeight: 0, uniqueContributors: 0, avgRecyclability: 0 });
  
  // ADVANCED ANALYTICS STATES
  const [energyData, setEnergyData] = useState([]);
  const [typeBreakdown, setTypeBreakdown] = useState({
    organic: 0, paper: 0, plastic: 0, toxic: 0, medical: 0, residual: 0
  });

  // RESPONSIVE SCREEN STATE
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Unified color mapping logic
  const getBinColor = (binName) => {
    const name = binName.toLowerCase();
    if (name.includes('blue') || name.includes('recyclable') || name.includes('paper')) return '#3b82f6'; 
    if (name.includes('green') || name.includes('biodegradable') || name.includes('organic')) return '#10b981'; 
    if (name.includes('yellow') || name.includes('residual')) return '#f59e0b'; 
    if (name.includes('red') || name.includes('hazardous') || name.includes('toxic') || name.includes('special')) return '#ef4444'; 
    if (name.includes('medical')) return '#8b5cf6';
    return '#64748b'; 
  };

  useEffect(() => {
    const fetchEngineeringData = async () => {
      const wasteRef = collection(db, 'waste_collection');
      // FILTERING FOR COLLEGE OF ENGINEERING
      const q = query(wasteRef, where('location.detectedCollege', '==', 'College of Engineering'));
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
        const bin = data.binData || 'Unsorted';
        binCounts[bin] = (binCounts[bin] || 0) + 1;

        // 1. Waste List Breakdown (Detailed Material Analysis)
        if (data.wasteList && Array.isArray(data.wasteList)) {
            data.wasteList.forEach(item => {
                const lower = item.toLowerCase();
                if (lower.includes('toxic')) breakdown.toxic++;
                else if (lower.includes('medical')) breakdown.medical++;
                else if (lower.includes('recyclable') || lower.includes('plastic')) breakdown.plastic++;
                else if (lower.includes('paper')) breakdown.paper++;
                else if (lower.includes('organic')) breakdown.organic++;
                else breakdown.residual++;
            });
        }

        // 2. Energy Levels (Processing Load)
        const eLevel = data.energyLevel?.toLowerCase() || 'low';
        if (energyLevels[eLevel] !== undefined) energyLevels[eLevel]++;

        // 3. Recyclability & Weight Logic
        const rate = parseInt(data.recyclabilityRate) || 0;
        totalRecycleRate += rate;

        const weightRaw = String(data.totalWeight || '0').toLowerCase();
        const weightMatch = weightRaw.match(/(\d+(\.\d+)?)/);
        const weightValue = weightMatch ? parseFloat(weightMatch[0]) : 0;
        
        // UPDATED LOGIC: Handle kg, grams, and g units correctly
        if (weightRaw.includes('kg') || weightRaw.includes('kilogram')) {
            totalWeightGrams += (weightValue * 1000);
        } else if (weightRaw.includes('gram') || weightRaw.includes(' g')) {
            totalWeightGrams += weightValue;
        } else {
            // Defaulting to grams if no unit is specified to prevent massive weight spikes
            totalWeightGrams += weightValue;
        }

        if (data.userId) contributors.add(data.userId);

        records.push({
          userName: data.userName || 'Anonymous',
          wasteType: data.binData || 'General',
          date: data.createdAt?.toDate().toLocaleDateString() || 'N/A',
          item: data.item || 'Multiple Items',
          energy: data.energyLevel || 'low'
        });
      });

      setBinData(Object.keys(binCounts).map(name => ({ 
        name, 
        value: binCounts[name] 
      })));

      setEnergyData([
        { subject: 'High (Industrial)', A: energyLevels.high, fullMark: wasteSnapshot.size },
        { subject: 'Medium (Standard)', A: energyLevels.medium, fullMark: wasteSnapshot.size },
        { subject: 'Low (Manual)', A: energyLevels.low, fullMark: wasteSnapshot.size },
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

    fetchEngineeringData();
  }, []);

  return (
    <div className="home-stats" style={{ padding: isMobile ? '10px' : '20px', backgroundColor: '#faeeee', minHeight: '100vh' }}>
      <div className="header-flex" style={{ display: 'flex', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap' }}>
        <HardHat size={isMobile ? 32 : 40} color="#0284c7" /> 
        <div style={{ marginLeft: '15px' }}>
            <h1 style={{ margin: 0, fontSize: isMobile ? '1.4rem' : '1.8rem', color: '#0c4a6e' }}>Engineering Waste Command</h1>
            <p style={{ margin: 0, color: '#0369a1', fontSize: isMobile ? '0.8rem' : '1rem' }}>Precision Sustainability Analytics</p>
        </div>
      </div>

      <div className="stats-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', 
        gap: '15px', 
        marginBottom: '25px' 
      }}>
        <div className="stat-card" style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <div className="card-icon"><Trash2 size={24} color="#0284c7" /></div>
          <h3 style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '10px' }}>Total COE Scans</h3>
          <p className="stat-number" style={{ fontSize: isMobile ? '1.3rem' : '1.6rem', fontWeight: 'bold', margin: 0 }}>{stats.totalItems}</p>
        </div>
        
        <div className="stat-card weight-card" style={{ borderLeft: '4px solid #0284c7', padding: '20px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <div className="card-icon"><Scale size={24} color="#0284c7" /></div>
          <h3 style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '10px' }}>Total Weight</h3>
          <p className="stat-number" style={{ fontSize: isMobile ? '1.3rem' : '1.6rem', fontWeight: 'bold', margin: 0 }}>{stats.totalWeight} <span className="unit" style={{ fontSize: '0.8rem' }}>kg</span></p>
        </div>

        <div className="stat-card" style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <div className="card-icon"><Recycle size={24} color="#10b981" /></div>
          <h3 style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '10px' }}>Recyclability</h3>
          <p className="stat-number" style={{ fontSize: isMobile ? '1.3rem' : '1.6rem', fontWeight: 'bold', margin: 0 }}>{stats.avgRecyclability}%</p>
        </div>

        <div className="stat-card" style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <div className="card-icon"><Users size={24} color="#f59e0b" /></div>
          <h3 style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '10px' }}>Active Engineers</h3>
          <p className="stat-number" style={{ fontSize: isMobile ? '1.3rem' : '1.6rem', fontWeight: 'bold', margin: 0 }}>{stats.uniqueContributors}</p>
        </div>
      </div>

      <div className="charts-main-container" style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr', 
        gap: '20px', 
        marginBottom: '20px' 
      }}>
        <div className="chart-item" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px' }}>
          <h3 style={{ color: '#0c4a6e' }}>Waste Segregation (COE)</h3>
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
              <Legend verticalAlign={isMobile ? "bottom" : "middle"} align={isMobile ? "center" : "right"} layout={isMobile ? "horizontal" : "vertical"} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-item" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px' }}>
          <h3 style={{ color: '#0c4a6e' }}>Processing Energy Requirements</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart cx="50%" cy="50%" outerRadius={isMobile ? "60%" : "80%"} data={energyData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: isMobile ? 10 : 12 }} />
              <Radar name="Scans" dataKey="A" stroke="#0284c7" fill="#0284c7" fillOpacity={0.6} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
        gap: '20px' 
      }}>
        <div className="chart-item" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px' }}>
          <h3 style={{ color: '#0c4a6e' }}>Volume by Category</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={[
                { name: 'Toxic', val: typeBreakdown.toxic, fill: '#ef4444' },
                { name: 'Plastic', val: typeBreakdown.plastic, fill: '#3b82f6' },
                { name: 'Paper', val: typeBreakdown.paper, fill: '#60a5fa' },
                { name: 'Organic', val: typeBreakdown.organic, fill: '#10b981' },
                { name: 'Residual', val: typeBreakdown.residual, fill: '#f59e0b' },
            ]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: isMobile ? 10 : 12 }} />
              <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
              <Tooltip />
              <Bar dataKey="val" radius={[4, 4, 0, 0]} animationDuration={1500} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-item" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ color: '#0c4a6e' }}>Live Collection Log</h3>
            <Activity size={18} color="#0284c7" />
          </div>
          <div className="user-table-container" style={{ overflowX: 'auto' }}>
            <table className="user-table" style={{ width: '100%', marginTop: '10px', textAlign: 'left', borderCollapse: 'collapse', minWidth: isMobile ? '300px' : 'auto' }}>
              <thead>
                <tr style={{ color: '#64748b', borderBottom: '2px solid #f1f5f9', fontSize: '0.9rem' }}>
                  <th style={{ padding: '10px' }}>Engineer</th>
                  <th>Classification</th>
                  <th>Impact</th>
                </tr>
              </thead>
              <tbody>
                {userList.map((user, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f8fafc' }}>
                    <td style={{ padding: '12px 10px' }}>
                        <div style={{ fontWeight: '500', color: '#0f172a', fontSize: isMobile ? '0.8rem' : '0.9rem' }}>{user.userName}</div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{user.date}</div>
                    </td>
                    <td>
                      <span className="badge" style={{ 
                          backgroundColor: getBinColor(user.wasteType) + '15', 
                          color: getBinColor(user.wasteType),
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '0.7rem',
                          fontWeight: '600'
                        }}>
                        {user.wasteType}
                      </span>
                    </td>
                    <td>
                        {user.energy === 'high' ? <AlertTriangle size={14} color="#ef4444" /> : <Zap size={14} color="#10b981" />}
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

export default Engineering;