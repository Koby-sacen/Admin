import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts';
import { Palette, Trash2, Scale, Users, Zap, Recycle, Activity, AlertTriangle, Box } from 'lucide-react';
import '../App.css';

const CAS = () => {
  const [binData, setBinData] = useState([]);
  const [userList, setUserList] = useState([]);
  const [stats, setStats] = useState({ totalItems: 0, totalWeight: 0, uniqueContributors: 0, avgRecyclability: 0, totalVolume: 0 });
  
  // NEW STATES FOR ADVANCED VISUALS
  const [timelineData, setTimelineData] = useState([]);
  const [energyData, setEnergyData] = useState([]);
  const [typeBreakdown, setTypeBreakdown] = useState({
    organic: 0, paper: 0, plastic: 0, toxic: 0, medical: 0, residual: 0, inorganic: 0
  });

  // RESPONSIVE SCREEN STATE (Updated to match Engineering logic)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      const breakdown = { organic: 0, paper: 0, plastic: 0, toxic: 0, medical: 0, residual: 0, inorganic: 0 };
      
      let totalWeightGrams = 0;
      let totalRecycleRate = 0;
      let overallVolumeLiters = 0;
      const contributors = new Set();
      const records = [];

      wasteSnapshot.forEach((doc) => {
        const data = doc.data();
        const bin = data.binData || 'Unsorted';
        binCounts[bin] = (binCounts[bin] || 0) + 1;

        // --- CUBIC METER VOLUME EXTRACTION LOGIC (Synchronized with Engineering) ---
        const volStr = data.directVolume || "";
        const getVol = (cat) => {
          const regex = new RegExp(`${cat}:\\s*(\\d+(\\.\\d+)?)\\s*Liters`, "i");
          const match = volStr.match(regex);
          return match ? parseFloat(match[1]) : 0;
        };

        const orgVol = getVol('Organic');
        const papVol = getVol('Paper');
        const plaVol = getVol('Plastic');
        const inoVol = getVol('Inorganic');
        const toxVol = getVol('Toxic');

        breakdown.organic += orgVol;
        breakdown.paper += papVol;
        breakdown.plastic += plaVol;
        breakdown.inorganic += inoVol;
        breakdown.toxic += toxVol;
        overallVolumeLiters += (orgVol + papVol + plaVol + inoVol + toxVol);

        // PARSING ADVANCED DATA FIELDS
        // 1. Waste List Breakdown (Updated to match Engineering logic)
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

        // 2. Energy Levels
        const eLevel = data.energyLevel?.toLowerCase() || 'low';
        if (energyLevels[eLevel] !== undefined) energyLevels[eLevel]++;

        // 3. Recyclability
        const rate = parseInt(data.recyclabilityRate) || 0;
        totalRecycleRate += rate;

        const weightRaw = String(data.totalWeight || '0').toLowerCase();
        const weightMatch = weightRaw.match(/(\d+(\.\d+)?)/);
        const weightValue = weightMatch ? parseFloat(weightMatch[0]) : 0;
        
        // Updated Weight Logic: Robust unit detection
        if (weightRaw.includes('kg') || weightRaw.includes('kilogram')) {
            totalWeightGrams += (weightValue * 1000);
        } else if (weightRaw.includes('gram') || weightRaw.includes(' g')) {
            totalWeightGrams += weightValue;
        } else {
            // Defaulting to grams if unit is ambiguous to keep dashboard totals realistic
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
          item: data.item || 'Multiple Items',
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
        { subject: 'High (Industrial)', A: energyLevels.high, fullMark: wasteSnapshot.size },
        { subject: 'Medium (Standard)', A: energyLevels.medium, fullMark: wasteSnapshot.size },
        { subject: 'Low (Manual)', A: energyLevels.low, fullMark: wasteSnapshot.size },
      ]);

      // Convert breakdown Liter values to Cubic Meters (m3) for the display
      const m3Breakdown = {
        organic: (breakdown.organic / 1000).toFixed(4),
        paper: (breakdown.paper / 1000).toFixed(4),
        plastic: (breakdown.plastic / 1000).toFixed(4),
        inorganic: (breakdown.inorganic / 1000).toFixed(4),
        toxic: (breakdown.toxic / 1000).toFixed(4),
        medical: breakdown.medical,
        residual: breakdown.residual
      };

      setTypeBreakdown(m3Breakdown);

      setStats({
        totalItems: wasteSnapshot.size,
        totalWeight: (totalWeightGrams / 1000).toFixed(2),
        uniqueContributors: contributors.size,
        avgRecyclability: wasteSnapshot.size > 0 ? (totalRecycleRate / wasteSnapshot.size).toFixed(0) : 0,
        totalVolume: (overallVolumeLiters / 1000).toFixed(4)
      });

      setUserList(records.slice(-5).reverse());
    };

    fetchCASData();
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
    <div className="home-stats" style={{ padding: isMobile ? '10px' : '20px', backgroundColor: '#fefff5', minHeight: '100vh' }}>
      <div className="header-flex" style={{ display: 'flex', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap' }}>
        {/* Changed Icon to Palette for Arts & Sciences */}
        <Palette size={isMobile ? 32 : 40} color="#8b5cf6" /> 
        <div style={{ marginLeft: '15px' }}>
            <h1 style={{ margin: 0, fontSize: isMobile ? '1.4rem' : '1.8rem', color: '#4c1d95' }}>College of Arts and Sciences Dashboard</h1>
            <p style={{ margin: 0, color: '#7c3aed', fontSize: isMobile ? '0.8rem' : '1rem' }}>Sustainability Analytics</p>
        </div>
      </div>

      <div className="stats-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)', 
        gap: '15px', 
        marginBottom: '25px' 
      }}>
        <div className="stat-card" style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <div className="card-icon"><Trash2 size={24} color="#8b5cf6" /></div>
          <h3 style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '10px' }}>Total CAS Scans</h3>
          <p className="stat-number" style={{ fontSize: isMobile ? '1.3rem' : '1.6rem', fontWeight: 'bold', margin: 0 }}>{stats.totalItems}</p>
        </div>
        
        {/* CAS Theme: Purple/Indigo border */}
        <div className="stat-card weight-card" style={{ borderLeft: '4px solid #8b5cf6', padding: '20px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <div className="card-icon"><Scale size={24} color="#8b5cf6" /></div>
          <h3 style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '10px' }}>Total Weight</h3>
          <p className="stat-number" style={{ fontSize: isMobile ? '1.3rem' : '1.6rem', fontWeight: 'bold', margin: 0 }}>{stats.totalWeight} <span className="unit" style={{ fontSize: '0.8rem' }}>kg</span></p>
        </div>

        {/* Volume Stat added to maintain parity with Engineering logic */}
        <div className="stat-card" style={{ borderLeft: '4px solid #a855f7', padding: '20px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <div className="card-icon"><Box size={24} color="#a855f7" /></div>
          <h3 style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '10px' }}>Total Volume</h3>
          <p className="stat-number" style={{ fontSize: isMobile ? '1.3rem' : '1.6rem', fontWeight: 'bold', margin: 0 }}>{stats.totalVolume} <span className="unit" style={{ fontSize: '0.8rem' }}>m³</span></p>
        </div>

        <div className="stat-card" style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <div className="card-icon"><Recycle size={24} color="#10b981" /></div>
          <h3 style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '10px' }}>Recyclability</h3>
          <p className="stat-number" style={{ fontSize: isMobile ? '1.3rem' : '1.6rem', fontWeight: 'bold', margin: 0 }}>{stats.avgRecyclability}%</p>
        </div>

        <div className="stat-card" style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <div className="card-icon"><Users size={24} color="#f59e0b" /></div>
          <h3 style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '10px' }}>Active Users</h3>
          <p className="stat-number" style={{ fontSize: isMobile ? '1.3rem' : '1.6rem', fontWeight: 'bold', margin: 0 }}>{stats.uniqueContributors}</p>
        </div>
      </div>

      {/* --- CUBIC METER VOLUME BREAKDOWN CARDS (Referencing image_93f254.png) --- */}
      <div className="volume-breakdown-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(5, 1fr)', 
        gap: '15px', 
        marginBottom: '25px' 
      }}>
        <div style={{ ...cardStyle, borderTop: '4px solid #10b981' }}>
          <h4 style={{ color: '#64748b', fontSize: '1rem', margin: '0 0 10px 0' }}>Organic Volume</h4>
          <p style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', margin: '0' }}>{typeBreakdown.organic}</p>
          <span style={{ color: '#94a3b8', fontWeight: '600', marginTop: '10px' }}>m³</span>
        </div>
        <div style={{ ...cardStyle, borderTop: '4px solid #3b82f6' }}>
          <h4 style={{ color: '#64748b', fontSize: '1rem', margin: '0 0 10px 0' }}>Paper Volume</h4>
          <p style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', margin: '0' }}>{typeBreakdown.paper}</p>
          <span style={{ color: '#94a3b8', fontWeight: '600', marginTop: '10px' }}>m³</span>
        </div>
        <div style={{ ...cardStyle, borderTop: '4px solid #f59e0b' }}>
          <h4 style={{ color: '#64748b', fontSize: '1rem', margin: '0 0 10px 0' }}>Plastic Volume</h4>
          <p style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', margin: '0' }}>{typeBreakdown.plastic}</p>
          <span style={{ color: '#94a3b8', fontWeight: '600', marginTop: '10px' }}>m³</span>
        </div>
        <div style={{ ...cardStyle, borderTop: '4px solid #6b7280' }}>
          <h4 style={{ color: '#64748b', fontSize: '1rem', margin: '0 0 10px 0' }}>Inorganic Volume</h4>
          <p style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', margin: '0' }}>{typeBreakdown.inorganic}</p>
          <span style={{ color: '#94a3b8', fontWeight: '600', marginTop: '10px' }}>m³</span>
        </div>
        <div style={{ ...cardStyle, borderTop: '4px solid #ef4444' }}>
          <h4 style={{ color: '#64748b', fontSize: '1rem', margin: '0 0 10px 0' }}>Toxic Volume</h4>
          <p style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', margin: '0' }}>{typeBreakdown.toxic}</p>
          <span style={{ color: '#94a3b8', fontWeight: '600', marginTop: '10px' }}>m³</span>
        </div>
      </div>

      <div className="charts-main-container" style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr', 
        gap: '20px', 
        marginBottom: '20px' 
      }}>
        <div className="chart-item" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px' }}>
          <h3 style={{ color: '#4c1d95' }}>Waste Segregation (CAS)</h3>
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
          <h3 style={{ color: '#4c1d95' }}>Disposal Energy Metrics</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart cx="50%" cy="50%" outerRadius={isMobile ? "60%" : "80%"} data={energyData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: isMobile ? 10 : 12 }} />
              <Radar name="Items" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
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
          <h3 style={{ color: '#4c1d95' }}>Volume by Specific Category</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={[
                { name: 'Toxic', val: typeBreakdown.toxic, fill: '#ef4444' },
                { name: 'Medical', val: typeBreakdown.medical, fill: '#8b5cf6' },
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
            <h3 style={{ color: '#4c1d95' }}>Recent CAS Activity</h3>
            <Activity size={18} color="#8b5cf6" />
          </div>
          <div className="user-table-container" style={{ overflowX: 'auto' }}>
            <table className="user-table" style={{ width: '100%', marginTop: '10px', textAlign: 'left', borderCollapse: 'collapse', minWidth: isMobile ? '300px' : 'auto' }}>
              <thead>
                <tr style={{ color: '#6b7280', borderBottom: '2px solid #f1f5f9', fontSize: '0.9rem' }}>
                  <th style={{ padding: '10px' }}>User</th>
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

export default CAS;