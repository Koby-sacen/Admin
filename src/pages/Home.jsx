import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, LineChart, Line, Legend 
} from 'recharts';
// ADDED FOR DOWNLOADS
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileSpreadsheet, FileText } from 'lucide-react';
import '../App.css';

// IMPORTING YOUR APP DATA TO FILTER BY COLLEGE NAME
const collegeNames = [
  'College of Engineering',
  'College of Arts and Sciences',
  'College of Industrial Technology',
  'College of Nursing & Health Sciences',
  'College of Education'
];

const Home = () => {
  const [collegeData, setCollegeData] = useState([]);
  const [collegeWeightData, setCollegeWeightData] = useState([]); // New state for weights
  const [outsideCampusData, setOutsideCampusData] = useState([]); // NEW STATE FOR OTHERS
  const [binData, setBinData] = useState([]);
  const [activityData, setActivityData] = useState([]);
  const [stats, setStats] = useState({ totalItems: 0, totalUsers: 0, totalWeight: 0, totalVolume: 0 }); // Added totalVolume
  
  // NEW STATE FOR TIME FILTERING
  const [filterType, setFilterType] = useState('year'); 
  const [typeBreakdown, setTypeBreakdown] = useState({
    organic: 0, paper: 0, plastic: 0, inorganic: 0, toxic: 0
  });

  // NEW STATE TO HOLD RAW LOGS FOR DOWNLOAD
  const [rawLogs, setRawLogs] = useState([]);

  // RESPONSIVE STATE
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      // 1. Calculate Time Range
      const now = new Date();
      let startDate = new Date();
      let endDate = new Date(now.getTime() + 86400000); // Default end is tomorrow to catch all of today

      if (filterType === 'week') {
        startDate.setDate(now.getDate() - 7);
      } else if (filterType === 'month') {
        startDate.setMonth(now.getMonth() - 1);
      } else if (filterType === 'lastYear') {
        // Specifically sets the range to ONLY last year (Jan 1 to Dec 31 of previous year)
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
      } else {
        // This Year
        startDate = new Date(now.getFullYear(), 0, 1);
      }

      // 2. Fetch Waste Collection Data
      const wasteSnapshot = await getDocs(collection(db, 'waste_collection'));
      const collegeCounts = {};
      const collegeWeights = {}; // Tracker for weights per college
      const outsideCounts = {}; // Tracker for "Others"
      const binCounts = {};
      const timelineCounts = {};
      let totalWeightGrams = 0;
      let wasteCount = 0;
      let overallVolume = 0; // Cumulative volume tracker

      const tempRawLogs = []; // Temporary array to store filtered logs

      // Reset Breakdown (Now tracking weight/volume)
      const breakdown = { organic: 0, paper: 0, plastic: 0, inorganic: 0, toxic: 0 };

      wasteSnapshot.forEach((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt?.toDate();
        
        // Apply Time Filter (Checks if within the calculated start and end bounds)
        if (createdAt && createdAt >= startDate && createdAt <= endDate) {
          const college = data.location?.detectedCollege || 'Other';
          
          // --- UPDATED WEIGHT PARSING LOGIC TO HANDLE G AND KG ACCURATELY ---
          const weightRaw = String(data.totalWeight || '0').toLowerCase().replace(/,/g, '');
          // FIX: Improved Regex to find the LAST numeric sequence in the string (the total kilograms)
          const weightMatches = weightRaw.match(/(\d+(\.\d+)?)/g);
          let numericValue = weightMatches ? parseFloat(weightMatches[weightMatches.length - 1]) : 0;
          let weightInGrams = 0;

          if (weightRaw.includes('kg') || weightRaw.includes('kilogram')) {
            weightInGrams = numericValue * 1000; // Convert KG to G
          } else {
            weightInGrams = numericValue; // Assume grams otherwise
          }
          // -------------------------------------------------------

          // UPDATE: LOOP THROUGH EVERY ITEM IN wasteList INSTEAD OF JUST TAKING data.item
          if (data.wasteList && Array.isArray(data.wasteList)) {
            data.wasteList.forEach((wasteItemString) => {
               // Extract item-specific weight if available in string like "... (5g)"
               const itemWeightMatch = wasteItemString.match(/\((\d+(?:\.\d+)?)(g|kg|kilograms|grams)\)/i);
               let itemDisplayWeight = "N/A";
               if (itemWeightMatch) {
                 itemDisplayWeight = `${itemWeightMatch[1]} ${itemWeightMatch[2]}`;
               }

               // SAVE EVERY INDIVIDUAL ITEM FOR DOWNLOAD
               tempRawLogs.push({
                  date: createdAt.toLocaleString(),
                  user: data.userName || 'Anonymous',
                  item: wasteItemString,
                  weight: itemDisplayWeight !== "N/A" ? itemDisplayWeight : weightRaw, 
                  college: college,
                  bin: data.binData || 'Unsorted',
                  address: data.location?.address || 'N/A'
              });
            });
          } else {
            // Fallback if wasteList is missing
            tempRawLogs.push({
                date: createdAt.toLocaleString(),
                user: data.userName || 'Anonymous',
                item: data.item || 'N/A',
                weight: weightRaw,
                college: college,
                bin: data.binData || 'Unsorted',
                address: data.location?.address || 'N/A'
            });
          }

          // LOGIC UPDATE: CHECK IF COLLEGE IS IN THE OFFICIAL LIST
          if (collegeNames.includes(college)) {
            // Count items per college
            collegeCounts[college] = (collegeCounts[college] || 0) + 1;
            
            // Parse and accumulate weight per college
            collegeWeights[college] = (collegeWeights[college] || 0) + weightInGrams;
            totalWeightGrams += weightInGrams;
          } else {
            outsideCounts[college] = (outsideCounts[college] || 0) + 1;
            totalWeightGrams += weightInGrams;
          }

          const bin = data.binData || 'Unsorted';
          binCounts[bin] = (binCounts[bin] || 0) + 1;

          // SPECIFIC TYPE BREAKDOWN LOGIC - UPDATED TO EXTRACT VOLUME FROM directVolume STRING
          const volStr = data.directVolume || "";
          // Helper to extract number before "Liters" for each category
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

          // Accumulate the volume for this specific entry to the overall total
          overallVolume += (orgVol + papVol + plaVol + inoVol + toxVol);

          // Timeline Activity
          const date = createdAt.toLocaleDateString() || 'Unknown';
          timelineCounts[date] = (timelineCounts[date] || 0) + 1;
          
          wasteCount++;
        }
      });

      // 2. Fetch User Data
      const userSnapshot = await getDocs(collection(db, 'users'));
      
      setRawLogs(tempRawLogs); // Update state for downloads

      // Formatting for Charts (Colleges Only)
      setCollegeData(Object.keys(collegeCounts).map(name => ({ 
        name, 
        count: collegeCounts[name] 
      })));

      // Formatting for Outside Campus Chart
      setOutsideCampusData(Object.keys(outsideCounts).map(name => ({
        name,
        count: outsideCounts[name]
      })));

      // Formatting Weight per College (Converting to kg for the chart)
      setCollegeWeightData(Object.keys(collegeWeights).map(name => ({
        name,
        weight: parseFloat((collegeWeights[name] / 1000).toFixed(3))
      })));

      setBinData(Object.keys(binCounts).map(name => ({ 
        name, 
        value: binCounts[name] 
      })));

      setActivityData(Object.keys(timelineCounts).map(date => ({ 
        date, 
        scans: timelineCounts[date] 
      })));
      
      // Update the breakdown state (Labels still say kg in UI, but logic now maps to Liters from directVolume)
      const volumeBreakdown = {
        organic: breakdown.organic.toFixed(2),
        paper: breakdown.paper.toFixed(2),
        plastic: breakdown.plastic.toFixed(2),
        inorganic: breakdown.inorganic.toFixed(2),
        toxic: breakdown.toxic.toFixed(2)
      };

      setTypeBreakdown(volumeBreakdown);
      setStats({
        totalItems: wasteCount,
        totalUsers: userSnapshot.size,
        totalWeight: (totalWeightGrams / 1000).toFixed(3), // Increased precision to 3 decimals to catch grams better
        totalVolume: overallVolume.toFixed(2) // Save total volume
      });
    };

    fetchData();
  }, [filterType]); // RE-RUN WHEN FILTER CHANGES

  // --- DOWNLOAD HANDLERS ---
  const downloadCSV = () => {
    if (rawLogs.length === 0) return;
    const headers = ["Date", "User", "Item", "Weight", "College", "Bin", "Address"];
    const rows = rawLogs.map(log => [
        log.date, log.user, `"${log.item}"`, log.weight, log.college, log.bin, `"${log.address}"`
    ]);
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Environmental_Report_${filterType}.csv`;
    link.click();
  };

  const downloadPDF = () => {
    const doc = new jsPDF('l', 'pt', 'a4');
    doc.setFontSize(18);
    doc.text(`Environmental Analytics Report (${filterType.toUpperCase()})`, 40, 40);
    doc.setFontSize(11);
    doc.text(`Total Scans: ${stats.totalItems} | Total Weight: ${stats.totalWeight}kg | Total Volume: ${stats.totalVolume}L`, 40, 60);
    
    const tableColumn = ["Date", "User", "Item", "Weight", "College", "Bin", "Address"];
    const tableRows = rawLogs.map(log => [
        log.date, log.user, log.item, log.weight, log.college, log.bin, log.address
    ]);

    autoTable(doc, {
      startY: 80,
      head: [tableColumn],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] },
      styles: { fontSize: 8, cellPadding: 3 },
      columnStyles: { 2: { cellWidth: 150 } } // Give more room for the Item column
    });
    doc.save(`Environmental_Report_${filterType}.pdf`);
  };

  // --- ADDED PERMANENT COLOR MAPPING LOGIC ---
  const getCollegeColor = (name) => {
    if (name.includes('Arts and Sciences')) return '#ffff53'; // Yellow
    if (name.includes('Education')) return '#0000FF'; // Blue
    if (name.includes('Industrial Technology')) return '#008000'; // Green
    if (name.includes('Engineering')) return '#ff3030'; // Red
    if (name.includes('Nursing')) return '#ff50dc'; // Pink
    return '#6B7280'; // Default Gray
  };

  const COLORS = ['#ff0000', '#10B981', '#ffff29', '#ff1be4', '#00b3ff'];

  const cardStyle = {
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: isMobile ? '16px' : '24px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    border: '1px solid #f3f4f6'
  };

  return (
    <div className="home-stats" style={{ padding: isMobile ? '20px' : '40px', backgroundColor: '#f9fafb', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      
      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h1 style={{ fontSize: isMobile ? '1.5rem' : '2rem', color: '#111827', fontWeight: '800', marginBottom: '20px' }}>Environmental Analytics</h1>
        
        {/* --- TIME FILTER AND DOWNLOADS --- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
            <div className="filter-container" style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {['week', 'month', 'year', 'lastYear'].map((type) => (
                <button 
                key={type}
                onClick={() => setFilterType(type)}
                style={{
                    padding: isMobile ? '8px 16px' : '10px 24px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: filterType === type ? '#10B981' : '#fff',
                    color: filterType === type ? 'white' : '#6b7280',
                    boxShadow: filterType === type ? '0 10px 15px -3px rgba(16, 185, 129, 0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
                    cursor: 'pointer',
                    fontSize: isMobile ? '12px' : '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    textTransform: 'capitalize'
                }}
                >
                {type === 'lastYear' ? 'Last Year' : `This ${type}`}
                </button>
            ))}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={downloadCSV} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', border: '1px solid #d1d5db', backgroundColor: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                    <FileSpreadsheet size={16} color="#10B981" /> Export CSV
                </button>
                <button onClick={downloadPDF} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', border: '1px solid #d1d5db', backgroundColor: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                    <FileText size={16} color="#EF4444" /> Export PDF
                </button>
            </div>
        </div>
      </div>

      {/* --- STAT CARDS --- */}
      <div className="stats-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', // Updated to 4 columns to fit Volume
        gap: '24px', 
        marginBottom: '32px' 
      }}>
        <div style={cardStyle}>
          <h3 style={{ color: '#6b7280', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Scans</h3>
          <p style={{ fontSize: isMobile ? '2rem' : '2.5rem', fontWeight: 'bold', color: '#111827', margin: '10px 0 0' }}>{stats.totalItems}</p>
        </div>
        <div style={cardStyle}>
          <h3 style={{ color: '#6b7280', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Users</h3>
          <p style={{ fontSize: isMobile ? '2rem' : '2.5rem', fontWeight: 'bold', color: '#111827', margin: '10px 0 0' }}>{stats.totalUsers}</p>
        </div>
        <div style={cardStyle}>
          <h3 style={{ color: '#6b7280', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Weight</h3>
          <p style={{ fontSize: isMobile ? '2rem' : '2.5rem', fontWeight: 'bold', color: '#10B981', margin: '10px 0 0' }}>{stats.totalWeight} <span style={{ fontSize: '1rem', color: '#9ca3af' }}>kg</span></p>
        </div>
        <div style={cardStyle}>
          <h3 style={{ color: '#6b7280', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Volume</h3>
          <p style={{ fontSize: isMobile ? '2rem' : '2.5rem', fontWeight: 'bold', color: '#3B82F6', margin: '10px 0 0' }}>{stats.totalVolume} <span style={{ fontSize: '1rem', color: '#9ca3af' }}>L</span></p>
        </div>
      </div>

      {/* --- GREEN METRICS TYPE BREAKDOWN (Now displaying Volume in Liters) --- */}
      <div className="type-breakdown-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)', 
        gap: '20px', 
        marginBottom: '40px' 
      }}>
        {[
          { label: 'Organic', val: typeBreakdown.organic, color: '#10B981' },
          { label: 'Paper', val: typeBreakdown.paper, color: '#3B82F6' },
          { label: 'Plastic', val: typeBreakdown.plastic, color: '#F59E0B' },
          { label: 'Inorganic', val: typeBreakdown.inorganic, color: '#6B7280' },
          { label: 'Toxic', val: typeBreakdown.toxic, color: '#EF4444' }
        ].map((item, idx) => (
          <div key={item.label} style={{ 
            ...cardStyle, 
            textAlign: 'center', 
            borderTop: `4px solid ${item.color}`,
            gridColumn: (isMobile && idx === 4) ? 'span 2' : 'span 1' 
          }}>
            <h4 style={{ margin: '0', color: '#6b7280', fontSize: '0.9rem' }}>{item.label} Volume</h4>
            <p style={{ fontSize: isMobile ? '1.25rem' : '1.75rem', fontWeight: '800', color: '#111827', margin: '8px 0 0' }}>
                {item.val} <span style={{fontSize: '0.8rem', color: '#9ca3af'}}>L</span>
            </p>
          </div>
        ))}
      </div>

      <div className="charts-main-container" style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', 
        gap: '32px' 
      }}>
        {/* --- BAR CHART: COLLEGES (COUNTS) --- */}
        <div style={cardStyle}>
          <h3 style={{ marginBottom: '20px', color: '#374151' }}>Waste Count by College</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={collegeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={isMobile ? 20 : 40}>
                    {collegeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getCollegeColor(entry.name)} />
                    ))}
                </Bar>
                </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* --- BAR CHART: OUTSIDE CAMPUS --- */}
        <div style={cardStyle}>
          <h3 style={{ marginBottom: '20px', color: '#374151' }}>Inside SSU / Outside SSU Locations</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={outsideCampusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={isMobile ? 20 : 40}>
                    {outsideCampusData.map((entry, index) => (
                    <Cell key={`cell-outside-${index}`} fill={'#6B7280'} />
                    ))}
                </Bar>
                </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* --- PIE CHART: WASTE TYPES --- */}
        <div style={cardStyle}>
          <h3 style={{ marginBottom: '20px', color: '#374151' }}>Waste Segregation</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                <Pie
                    data={binData}
                    innerRadius={isMobile ? 50 : 70}
                    outerRadius={isMobile ? 80 : 100}
                    paddingAngle={8}
                    dataKey="value"
                >
                    {binData.map((entry, index) => (
                    <Cell key={`cell-pie-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                    ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* --- WEIGHT --- */}
        <div style={cardStyle}>
          <h3 style={{ marginBottom: '20px', color: '#374151' }}>Waste Weight by College (kg)</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={collegeWeightData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip formatter={(value) => [`${value} kg`, 'Weight']} cursor={{ fill: '#f9fafb' }} />
                <Bar dataKey="weight" radius={[6, 6, 0, 0]} barSize={isMobile ? 20 : 40}>
                    {collegeWeightData.map((entry, index) => (
                    <Cell key={`cell-weight-${index}`} fill={getCollegeColor(entry.name)} />
                    ))}
                </Bar>
                </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* --- LINE CHART: ACTIVITY OVER TIME --- */}
        <div style={{ ...cardStyle, gridColumn: isMobile ? 'span 1' : 'span 2' }}>
          <h3 style={{ marginBottom: '20px', color: '#374151' }}>Collection Activity Timeline</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                <Line 
                    type="monotone" 
                    dataKey="scans" 
                    stroke="#10B981" 
                    strokeWidth={4} 
                    dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }} 
                    activeDot={{ r: 6, strokeWidth: 0 }}
                />
                </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;