import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { 
  FileSpreadsheet, 
  FileText, 
  Search, 
  MapPin, 
  Scale, 
  User, 
  Calendar, 
  ChevronRight,
  Info
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../App.css';

export default function ManageWaste() {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchWasteLogs = async () => {
      try {
        const wasteRef = collection(db, 'waste_collection');
        const q = query(wasteRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const wasteData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setLogs(wasteData);
        setFilteredLogs(wasteData);
      } catch (error) {
        console.error("Error fetching waste logs: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchWasteLogs();
  }, []);

  // Search filter logic
  useEffect(() => {
    const results = logs.filter(log =>
      log.item?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.location?.detectedCollege?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredLogs(results);
  }, [searchTerm, logs]);

  const downloadCSV = () => {
    if (logs.length === 0) return;
    const headers = ["Date", "User", "Bin", "Item", "Weight", "College", "Address"];
    const rows = logs.map(log => [
      log.createdAt?.toDate ? log.createdAt.toDate().toLocaleString() : '',
      log.userName || '',
      log.binData || '',
      log.item || '',
      log.totalWeight || '',
      log.location?.detectedCollege || '',
      `"${log.location?.address || ''}"`
    ]);
    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `waste_report_${new Date().toLocaleDateString()}.csv`;
    link.click();
  };

  const downloadPDF = () => {
    const doc = new jsPDF('l', 'pt', 'a3');
    doc.text("Waste Collection Master Report", 40, 40);
    const tableColumn = ["Date", "User", "Bin", "Item", "Weight", "College", "Recycle %", "Address"];
    const tableRows = logs.map(log => [
      log.createdAt?.toDate ? log.createdAt.toDate().toLocaleString() : 'N/A',
      log.userName || 'Anonymous',
      log.binData || 'N/A',
      log.item || 'N/A',
      log.totalWeight || '0g',
      log.location?.detectedCollege || 'N/A',
      log.recyclabilityRate || 'N/A',
      log.location?.address || 'N/A'
    ]);
    autoTable(doc, {
      startY: 60,
      head: [tableColumn],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] }
    });
    doc.save(`Waste_Report_${new Date().toLocaleDateString()}.pdf`);
  };

  return (
    <div className="waste-management-wrapper">
      {/* Header Section */}
      <div className="waste-header">
        <div className="header-left">
          <h2 className="header-title">Collection Logs</h2>
          <p className="header-subtitle">Overview of all classified waste items</p>
        </div>
        
        <div className="header-actions">
          <div className="search-bar-container">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search items, users, or colleges..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="modern-search-input"
            />
          </div>
          <button onClick={downloadCSV} className="export-btn csv">
            <FileSpreadsheet size={18} /> CSV Download
          </button>
          <button onClick={downloadPDF} className="export-btn pdf">
            <FileText size={18} /> PDF Download
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="logs-container">
        {loading ? (
          <div className="modern-loader">
            <div className="pulse-circle"></div>
            <p>Gathering logs...</p>
          </div>
        ) : (
          <div className="modern-log-list">
            {filteredLogs.map((log) => (
              <div key={log.id} className="log-row">
                {/* Left: Date & Bin */}
                <div className="log-meta">
                  <div className="log-date-box">
                    <span className="month">{log.createdAt?.toDate().toLocaleDateString('en-US', {month: 'short'})}</span>
                    <span className="day">{log.createdAt?.toDate().getDate()}</span>
                  </div>
                  <div className={`bin-indicator ${log.binData?.toLowerCase().includes('blue') ? 'blue' : 'general'}`}></div>
                </div>

                {/* Center Left: Item Details */}
                <div className="log-main-info">
                  <h4 className="log-item-title">{log.item || 'Classified Item'}</h4>
                  <div className="log-sub-details">
                    <span><User size={14} /> {log.userName || 'Anonymous'}</span>
                    <span><Scale size={14} /> {log.totalWeight || 'N/A'}</span>
                    <span><MapPin size={14} /> {log.location?.detectedCollege || 'Campus'}</span>
                  </div>
                </div>

                {/* Center Right: College/Location Badge */}
                <div className="log-location-badge">
                   <p className="address-text">{log.location?.address?.substring(0, 45)}...</p>
                </div>

                {/* Right: Metrics & Arrow */}
                <div className="log-metrics">
                  <div className="metric-pill">
                     <span className="label">Recyclability</span>
                     <span className="value">{log.recyclabilityRate || '0%'}</span>
                  </div>
                  <ChevronRight size={20} className="row-arrow" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

