import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, LineChart, Line, Legend 
} from 'recharts';
import '../App.css';

const Home = () => {
  const [collegeData, setCollegeData] = useState([]);
  const [collegeWeightData, setCollegeWeightData] = useState([]); // New state for weights
  const [binData, setBinData] = useState([]);
  const [activityData, setActivityData] = useState([]);
  const [stats, setStats] = useState({ totalItems: 0, totalUsers: 0, totalWeight: 0 });

  useEffect(() => {
    const fetchData = async () => {
      // 1. Fetch Waste Collection Data
      const wasteSnapshot = await getDocs(collection(db, 'waste_collection'));
      const collegeCounts = {};
      const collegeWeights = {}; // Tracker for weights per college
      const binCounts = {};
      const timelineCounts = {};
      let totalWeightGrams = 0;
      let wasteCount = 0;

      wasteSnapshot.forEach((doc) => {
        const data = doc.data();
        const college = data.location?.detectedCollege || 'Other';
        
        // Count items per college
        collegeCounts[college] = (collegeCounts[college] || 0) + 1;

        // Parse and accumulate weight per college
        const weightMatch = data.totalWeight?.match(/(\d+)/);
        const weightValue = weightMatch ? parseInt(weightMatch[0]) : 0;
        collegeWeights[college] = (collegeWeights[college] || 0) + weightValue;
        
        // Total global weight
        totalWeightGrams += weightValue;

        // Bin Type Breakdown
        const bin = data.binData || 'Unsorted';
        binCounts[bin] = (binCounts[bin] || 0) + 1;

        // Timeline Activity
        const date = data.createdAt?.toDate().toLocaleDateString() || 'Unknown';
        timelineCounts[date] = (timelineCounts[date] || 0) + 1;
        
        wasteCount++;
      });

      // 2. Fetch User Data
      const userSnapshot = await getDocs(collection(db, 'users'));
      
      // Formatting for Charts
      setCollegeData(Object.keys(collegeCounts).map(name => ({ 
        name, 
        count: collegeCounts[name] 
      })));

      // Formatting Weight per College (Converting to kg for the chart)
      setCollegeWeightData(Object.keys(collegeWeights).map(name => ({
        name,
        weight: parseFloat((collegeWeights[name] / 1000).toFixed(2))
      })));

      setBinData(Object.keys(binCounts).map(name => ({ 
        name, 
        value: binCounts[name] 
      })));

      setActivityData(Object.keys(timelineCounts).map(date => ({ 
        date, 
        scans: timelineCounts[date] 
      })));
      
      setStats({
        totalItems: wasteCount,
        totalUsers: userSnapshot.size,
        totalWeight: (totalWeightGrams / 1000).toFixed(2) 
      });
    };

    fetchData();
  }, []);

  const COLORS = ['#0a88fe', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="home-stats">
      {/* --- STAT CARDS --- */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Scans</h3>
          <p className="stat-number">{stats.totalItems}</p>
        </div>
        <div className="stat-card user-card">
          <h3>Active Users</h3>
          <p className="stat-number">{stats.totalUsers}</p>
        </div>
        <div className="stat-card weight-card">
          <h3>Weight Collected</h3>
          <p className="stat-number">{stats.totalWeight} <span className="unit">kg</span></p>
        </div>
      </div>

      <div className="charts-main-container">
        {/* --- BAR CHART: COLLEGES (COUNTS) --- */}
        <div className="chart-item">
          <h3>Waste Count by College</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={collegeData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip cursor={{ fill: '#f3f4f6' }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {collegeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* --- PIE CHART: WASTE TYPES --- */}
        <div className="chart-item">
          <h3>Waste Segregation</h3>
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
                  <Cell key={`cell-pie-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* --- WEIGHT --- */}
        <div className="chart-item">
          <h3>Waste Weight by College (kg)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={collegeWeightData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `${value} kg`} cursor={{ fill: '#f3f4f6' }} />
              <Bar dataKey="weight" radius={[4, 4, 0, 0]}>
                {collegeWeightData.map((entry, index) => (
                  <Cell key={`cell-weight-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* --- LINE CHART: ACTIVITY OVER TIME --- */}
        <div className="chart-item">
          <h3>Collection Activity Timeline</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="scans" stroke="#8884d8" strokeWidth={3} dot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Home;