import React, { useEffect, useState } from 'react';
import { db } from '../firebase'; // Adjust path if needed
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../App.css';

export default function ManageWaste() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

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
      } catch (error) {
        console.error("Error fetching waste logs: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWasteLogs();
  }, []);

  // CSV Download Logic
  const downloadCSV = () => {
    if (logs.length === 0) return;

    const headers = [
      "ID", "Bin Data", "Created At", "Decomposition Period", "Energy Level", 
      "Energy Reason", "Image URI", "Item", "Address", "College", 
      "Latitude", "Longitude", "Recyclability Rate", "Steps", 
      "Suggestions", "Total Count", "Total Weight", "User ID", 
      "User Name", "Waste List"
    ];

    const rows = logs.map(log => [
      log.id,
      `"${log.binData || ''}"`,
      `"${log.createdAt?.toDate ? log.createdAt.toDate().toLocaleString() : ''}"`,
      `"${log.decompPeriod || ''}"`,
      `"${log.energyLevel || ''}"`,
      `"${log.energyReason || ''}"`,
      `"${log.imageUri || ''}"`,
      `"${log.item || ''}"`,
      `"${log.location?.address || ''}"`,
      `"${log.location?.detectedCollege || ''}"`,
      log.location?.latitude || '',
      log.location?.longitude || '',
      `"${log.recyclabilityRate || ''}"`,
      `"${log.stepData || ''}"`,
      `"${log.suggestions || ''}"`,
      `"${log.totalCount || ''}"`,
      `"${log.totalWeight || ''}"`,
      `"${log.userId || ''}"`,
      `"${log.userName || ''}"`,
      `"${Array.isArray(log.wasteList) ? log.wasteList.join('; ') : ''}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `waste_logs_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Download Logic (RE-FIXED & UPDATED WITH ALL FIELDS)
  const downloadPDF = () => {
    try {
      if (logs.length === 0) {
        alert("No data available to download.");
        return;
      }

      const doc = new jsPDF('l', 'pt', 'a3'); // Using A3 Landscape to fit the massive amount of data
      
      doc.setFontSize(20);
      doc.setTextColor(40);
      doc.text("Waste Collection Master Report", 40, 40);
      
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 40, 60);

      // Comprehensive Headers
      const tableColumn = [
        "Date", "User", "Bin", "Item", "Weight", "Qty", 
        "Decomp", "Energy", "Recycle %", "College", "Address", "Waste Details", "Suggestions"
      ];

      const tableRows = logs.map(log => [
        log.createdAt?.toDate ? log.createdAt.toDate().toLocaleString() : 'N/A',
        log.userName || 'Anonymous',
        log.binData || 'N/A',
        log.item || 'N/A',
        log.totalWeight || '0g',
        log.totalCount || '0',
        log.decompPeriod || 'N/A',
        `${log.energyLevel || ''}: ${log.energyReason || ''}`,
        log.recyclabilityRate || 'N/A',
        log.location?.detectedCollege || 'N/A',
        log.location?.address || 'N/A',
        Array.isArray(log.wasteList) ? log.wasteList.join('\n') : 'N/A',
        log.suggestions || 'N/A'
      ]);

      autoTable(doc, {
        startY: 80,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185], fontSize: 7 },
        styles: { fontSize: 6, cellPadding: 3, overflow: 'linebreak' },
        columnStyles: {
          3: { cellWidth: 100 }, // Item
          7: { cellWidth: 120 }, // Energy
          10: { cellWidth: 100 }, // Address
          11: { cellWidth: 150 }, // Waste List
          12: { cellWidth: 150 }, // Suggestions
        }
      });

      doc.save(`waste_full_report_${new Date().toLocaleDateString()}.pdf`);
    } catch (error) {
      console.error("PDF Generation Error:", error);
      alert("Failed to generate PDF. Check console for details.");
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate();
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="manage-waste-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 className="table-title" style={{ margin: 0 }}>Waste Collection Logs</h2>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={downloadCSV}
            style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Download CSV
          </button>
          
          <button 
            onClick={downloadPDF}
            style={{
              padding: '10px 20px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Download PDF
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="loading-state">Loading collection data...</div>
      ) : (
        <div className="waste-grid">
          {logs.map(log => (
            <div key={log.id} className="waste-card">
              <div className="waste-card-header">
                <span className="waste-date">{formatDate(log.createdAt)}</span>
                <span className={`bin-badge ${log.binData?.toLowerCase().replace(/\s+/g, '-')}`}>
                  {log.binData || 'General'}
                </span>
              </div>
              
              <h3 className="waste-item-name">{log.item || 'Unknown Item'}</h3>
              
              <div className="waste-stats">
                <div className="stat">
                  <label>Weight</label>
                  <p className="weight-value">{log.totalWeight || '0g'}</p>
                </div>
                <div className="stat">
                  <label>User</label>
                  <p className="user-value">{log.userName || 'Anonymous'}</p>
                </div>
              </div>

              <div className="waste-location">
                <p>📍 {log.location?.address || 'No address recorded'}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}