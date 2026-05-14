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

  // Helper function to extract clean weight like "25g" or "190 grams"
  const extractWeight = (text) => {
    if (!text) return 'N/A';
    const match = text.match(/\[W\](.*?)\[\/W\]/);
    return match ? match[1] : text;
  };

  // Helper function to clean item names for downloads
  const cleanItemName = (text) => {
    if (!text) return 'Classified Item';
    return text.replace(/\[W\].*?\[\/W\]/g, '').replace(/[()=]/g, '').trim();
  };

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

  // Search filter logic - FIXED EXTRACTION & SEARCH
  useEffect(() => {
    const results = logs.filter(log => {
      // Clean string extraction for search consistency
      const item = (log.item || log.wasteList || "").toLowerCase();
      const user = (log.userName || "").toLowerCase();
      const college = (log.location?.detectedCollege || "").toLowerCase();
      const bin = (log.binData || "").toLowerCase();
      const term = searchTerm.toLowerCase();

      return item.includes(term) || 
             user.includes(term) || 
             college.includes(term) || 
             bin.includes(term);
    });
    setFilteredLogs(results);
  }, [searchTerm, logs]);

  const downloadCSV = () => {
    if (logs.length === 0) return;
    const headers = ["Date", "User", "Bin", "Item", "Weight", "College", "Address"];
    const rows = logs.map(log => [
      log.createdAt?.toDate ? log.createdAt.toDate().toLocaleString() : '',
      log.userName || '',
      log.binData || '',
      cleanItemName(log.item || log.wasteList?.split('\n')[0]),
      extractWeight(log.totalWeight || log.wasteList),
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
      cleanItemName(log.item || log.wasteList?.split('\n')[0]),
      extractWeight(log.totalWeight || log.wasteList),
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
                    <span className="month">{log.createdAt?.toDate ? log.createdAt.toDate().toLocaleDateString('en-US', {month: 'short'}) : 'N/A'}</span>
                    <span className="day">{log.createdAt?.toDate ? log.createdAt.toDate().getDate() : '--'}</span>
                  </div>
                  {/* Fixed Bin Indicator logic to match your App's extraction */}
                  <div className={`bin-indicator ${String(log.binData || '').toLowerCase().includes('blue') ? 'blue' : String(log.binData || '').toLowerCase().includes('yellow') ? 'yellow' : 'general'}`}></div>
                </div>

                {/* Center Left: Item Details */}
                <div className="log-main-info">
                  <h4 className="log-item-title">{(log.item || log.wasteList?.split('\n')[0] || 'Classified Item').replace(/\[W\].*?\[\/W\]/g, '').replace(/[()=]/g, '').trim()}</h4>
                  <div className="log-sub-details">
                    <span><User size={14} /> {log.userName || 'Anonymous'}</span>
                    <span><Scale size={14} /> {extractWeight(log.totalWeight || log.wasteList)}</span>
                    <span><MapPin size={14} /> {log.location?.detectedCollege || 'Campus'}</span>
                  </div>
                </div>

                {/* Center Right: College/Location Badge */}
                <div className="log-location-badge">
                    <p className="address-text">{(log.location?.address || "No address provided").substring(0, 45)}...</p>
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