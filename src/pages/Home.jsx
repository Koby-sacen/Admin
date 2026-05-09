import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import '../App.css';

const Home = () => {
  const [chartData, setChartData] = useState([]);
  const [stats, setStats] = useState({ totalItems: 0, totalUsers: 0 });

  useEffect(() => {
    const fetchData = async () => {
      const querySnapshot = await getDocs(collection(db, 'waste_collection'));
      const collegeCounts = {};
      let itemsCount = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const college = data.location?.detectedCollege || 'Other';
        collegeCounts[college] = (collegeCounts[college] || 0) + 1;
        itemsCount++;
      });

      const formattedData = Object.keys(collegeCounts).map(name => ({
        name,
        count: collegeCounts[name]
      }));

      setChartData(formattedData);
      setStats(prev => ({ ...prev, totalItems: itemsCount }));
    };

    fetchData();
  }, []);

  const COLORS = ['#0a88fe', '#f91ac5', '#8c2121', '#2fff05', '#44c0fa'];

  return (
    <div className="home-stats">
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Collected</h3>
          <p className="stat-number">{stats.totalItems}</p>
        </div>
        <div className="stat-card">
          <h3>Colleges</h3>
          <p className="stat-number">{chartData.length}</p>
        </div>
      </div>

      <div className="chart-container">
        <h3>Waste Collection by College</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip cursor={{fill: '#f3f4f6'}} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Home;