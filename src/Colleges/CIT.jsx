import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend, RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts';
import { Settings, Trash2, Scale, Users, Zap, Recycle, BarChart3, Box } from 'lucide-react';
import '../App.css';

const CIT = () => {
  const [binData, setBinData] = useState([]);
  const [userList, setUserList] = useState([]);
  const [stats, setStats] = useState({ 
    totalItems: 0, 
    totalWeight: 0, 
    uniqueContributors: 0, 
    avgRecyclability: 0,
    totalVolume: 0 
  });
  
  const [energyData, setEnergyData] = useState([]);
  const [typeBreakdown, setTypeBreakdown] = useState({
    organic: 0, paper: 0, plastic: 0, toxic: 0, inorganic: 0
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
    if (name.includes('red') || name.includes('hazardous') || name.includes('toxic')) return '#ef4444';
    return '#6b7280';
  };

  useEffect(() => {
    const fetchCITData = async () => {
      const wasteRef = collection(db, 'waste_collection');
      const q = query(wasteRef, where('location.detectedCollege', '==', 'College of Industrial Technology'));
      const wasteSnapshot = await getDocs(q);
      
      const binCounts = {};
      const energyLevels = { high: 0, medium: 0, low: 0 };
      const breakdown = { organic: 0, paper: 0, plastic: 0, toxic: 0, inorganic: 0 };
      
      let totalWeightGrams = 0;
      let totalRecycleRate = 0;
      let overallVolumeLiters = 0;
      const contributors = new Set();
      const records = [];

      wasteSnapshot.forEach((doc) => {
        const data = doc.data();
        const bin = data.binData || 'Unsorted';
        binCounts[bin] = (binCounts[bin] || 0) + 1;

        const volStr = data.directVolume || "";
        const getVol = (cat) => {
          const regex = new RegExp(`${cat}:\\s*(\\d+(\\.\\d+)?)\\s*Liters`, "i");
          const match = volStr.match(regex);
          return match ? parseFloat(match[1]) : 0;
        };

        const vOrg = getVol('Organic');
        const vPap = getVol('Paper');
        const vPla = getVol('Plastic');
        const vIno = getVol('Inorganic');
        const vTox = getVol('Toxic');

        breakdown.organic += vOrg;
        breakdown.paper += vPap;
        breakdown.plastic += vPla;
        breakdown.inorganic += vIno;
        breakdown.toxic += vTox;
        overallVolumeLiters += (vOrg + vPap + vPla + vIno + vTox);

        const eLevel = data.energyLevel?.toLowerCase() || 'low';
        if (energyLevels[eLevel] !== undefined) energyLevels[eLevel]++;

        totalRecycleRate += (parseInt(data.recyclabilityRate) || 0);

        const weightRaw = String(data.totalWeight || '0').toLowerCase();
        const weightMatch = weightRaw.match(/(\d+(\.\d+)?)/);
        const weightValue = weightMatch ? parseFloat(weightMatch[0]) : 0;
        totalWeightGrams += weightRaw.includes('kg') ? (weightValue * 1000) : weightValue;

        if (data.userId) contributors.add(data.userId);

        records.push({
          userName: data.userName || 'Anonymous',
          wasteType: data.binData || 'General',
          date: data.createdAt?.toDate().toLocaleDateString() || 'N/A',
          energy: data.energyLevel || 'low'
        });
      });

      setTypeBreakdown({
        organic: (breakdown.organic / 1000).toFixed(4),
        paper: (breakdown.paper / 1000).toFixed(4),
        plastic: (breakdown.plastic / 1000).toFixed(4),
        inorganic: (breakdown.inorganic / 1000).toFixed(4),
        toxic: (breakdown.toxic / 1000).toFixed(4),
      });

      setBinData(Object.keys(binCounts).map(name => ({ name, value: binCounts[name] })));
      setEnergyData([
        { subject: 'High (Ind.)', A: energyLevels.high },
        { subject: 'Med (Std.)', A: energyLevels.medium },
        { subject: 'Low (Man.)', A: energyLevels.low },
      ]);

      setStats({
        totalItems: wasteSnapshot.size,
        totalWeight: (totalWeightGrams / 1000).toFixed(2),
        uniqueContributors: contributors.size,
        avgRecyclability: wasteSnapshot.size > 0 ? (totalRecycleRate / wasteSnapshot.size).toFixed(0) : 0,
        totalVolume: (overallVolumeLiters / 1000).toFixed(4)
      });
      setUserList(records.slice(-5).reverse());
    };

    fetchCITData();
  }, []);

  const cardStyle = {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '24px',
    textAlign: 'center',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  };

  return (
    <div className="home-stats" style={{ padding: isMobile ? '10px' : '25px', backgroundColor: '#f0fdf4', minHeight: '100vh' }}>
      {/* HEADER SECTION */}
      <div className="header-flex" style={{ display: 'flex', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap' }}>
        <Settings size={isMobile ? 32 : 40} color="#10b981" />
        <div style={{ marginLeft: '15px' }}>
          <h1 style={{ margin: 0, fontSize: isMobile ? '1.4rem' : '1.8rem', color: '#064e3b' }}>College of Industrial Technology</h1>
          <p style={{ margin: 0, color: '#059669', fontSize: isMobile ? '0.8rem' : '1rem' }}>Industrial Waste & Resource Management</p>
        </div>
      </div>

      {/* PRIMARY STATS GRID (Aligned with Engineering) */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)', 
        gap: '15px', 
        marginBottom: '25px' 
      }}>
        <div style={{ ...cardStyle, padding: '20px' }}>
          <Trash2 size={24} color="#10b981" />
          <h3 style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '10px' }}>Total Scans</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{stats.totalItems}</p>
        </div>
        <div style={{ ...cardStyle, padding: '20px', borderLeft: '4px solid #10b981' }}>
          <Scale size={24} color="#10b981" />
          <h3 style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '10px' }}>Total Weight (kg)</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{stats.totalWeight}</p>
        </div>
        <div style={{ ...cardStyle, padding: '20px', borderLeft: '4px solid #059669' }}>
          <Box size={24} color="#059669" />
          <h3 style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '10px' }}>Total Volume (m³)</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{stats.totalVolume}</p>
        </div>
        <div style={{ ...cardStyle, padding: '20px' }}>
          <Recycle size={24} color="#3b82f6" />
          <h3 style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '10px' }}>Recyclability</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{stats.avgRecyclability}%</p>
        </div>
        <div style={{ ...cardStyle, padding: '20px' }}>
          <Users size={24} color="#f59e0b" />
          <h3 style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '10px' }}>Active Users</h3>
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{stats.uniqueContributors}</p>
        </div>
      </div>

      {/* VOLUME BREAKDOWN CARDS (Matched to Engineering precision) */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(5, 1fr)', 
        gap: '15px', 
        marginBottom: '25px' 
      }}>
        <div style={{ ...cardStyle, borderTop: '4px solid #10b981' }}>
          <h4 style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 10px 0' }}>Organic Vol.</h4>
          <p style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a', margin: '0' }}>{typeBreakdown.organic}</p>
          <span style={{ color: '#94a3b8', fontWeight: '600', fontSize: '0.75rem' }}>m³</span>
        </div>
        <div style={{ ...cardStyle, borderTop: '4px solid #3b82f6' }}>
          <h4 style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 10px 0' }}>Paper Vol.</h4>
          <p style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a', margin: '0' }}>{typeBreakdown.paper}</p>
          <span style={{ color: '#94a3b8', fontWeight: '600', fontSize: '0.75rem' }}>m³</span>
        </div>
        <div style={{ ...cardStyle, borderTop: '4px solid #f59e0b' }}>
          <h4 style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 10px 0' }}>Plastic Vol.</h4>
          <p style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a', margin: '0' }}>{typeBreakdown.plastic}</p>
          <span style={{ color: '#94a3b8', fontWeight: '600', fontSize: '0.75rem' }}>m³</span>
        </div>
        <div style={{ ...cardStyle, borderTop: '4px solid #6b7280' }}>
          <h4 style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 10px 0' }}>Inorganic Vol.</h4>
          <p style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a', margin: '0' }}>{typeBreakdown.inorganic}</p>
          <span style={{ color: '#94a3b8', fontWeight: '600', fontSize: '0.75rem' }}>m³</span>
        </div>
        <div style={{ ...cardStyle, borderTop: '4px solid #ef4444' }}>
          <h4 style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 10px 0' }}>Toxic Vol.</h4>
          <p style={{ fontSize: '1.8rem', fontWeight: '800', color: '#0f172a', margin: '0' }}>{typeBreakdown.toxic}</p>
          <span style={{ color: '#94a3b8', fontWeight: '600', fontSize: '0.75rem' }}>m³</span>
        </div>
      </div>

      {/* CHARTS CONTAINER */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : '1.2fr 1fr', 
        gap: '20px', 
        marginBottom: '20px' 
      }}>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h3 style={{ color: '#064e3b', marginBottom: '15px', fontSize: '1rem' }}>Waste Segregation Mix</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={binData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                {binData.map((entry, i) => <Cell key={i} fill={getBinColor(entry.name)} />)}
              </Pie>
              <Tooltip /><Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h3 style={{ color: '#064e3b', marginBottom: '15px', fontSize: '1rem' }}>Processing Energy Requirements</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={energyData}>
              <PolarGrid /><PolarAngleAxis dataKey="subject" tick={{fontSize: 12}} />
              <Radar name="Items" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* BOTTOM GRID: BAR CHART & TABLE */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
        gap: '20px' 
      }}>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
            <BarChart3 size={20} color="#10b981" /><h3 style={{ margin: 0, color: '#064e3b', fontSize: '1rem' }}>Material Breakdown (m³)</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={[
              { name: 'Organic', val: parseFloat(typeBreakdown.organic), fill: '#10b981' },
              { name: 'Paper', val: parseFloat(typeBreakdown.paper), fill: '#3b82f6' },
              { name: 'Plastic', val: parseFloat(typeBreakdown.plastic), fill: '#f59e0b' },
              { name: 'Inorganic', val: parseFloat(typeBreakdown.inorganic), fill: '#6b7280' },
              { name: 'Toxic', val: parseFloat(typeBreakdown.toxic), fill: '#ef4444' },
            ]}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{fontSize: 11}} /><YAxis /><Tooltip />
              <Bar dataKey="val" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <h3 style={{ color: '#064e3b', marginBottom: '15px', fontSize: '1rem' }}>Recent Users in CIT</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ color: '#64748b', borderBottom: '2px solid #f3f4f6', textAlign: 'left' }}>
                  <th style={{ padding: '10px' }}>User</th>
                  <th>Type</th>
                  <th style={{ textAlign: 'center' }}>Impact</th>
                </tr>
              </thead>
              <tbody>
                {userList.map((user, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f9fafb' }}>
                    <td style={{ padding: '12px 10px' }}>
                      <div style={{ fontWeight: '600' }}>{user.userName}</div>
                      <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{user.date}</div>
                    </td>
                    <td>
                      <span style={{ backgroundColor: getBinColor(user.wasteType) + '15', color: getBinColor(user.wasteType), padding: '4px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' }}>
                        {user.wasteType}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <Zap size={14} color={user.energy === 'high' ? "#ef4444" : "#10b981"} />
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

export default CIT;