import React, { useState, useEffect } from 'react';
import { Copy, FileText, FileSpreadsheet, FileType, Printer, Users, ArrowLeft, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// Ensure Axios acts as an XHR request for Laravel
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Export Buttons Component updated to accept props
const ExportButtons = ({ onCopy, onCSV, onExcel }: { onCopy: () => void, onCSV: () => void, onExcel: () => void }) => (
  <div className="flex flex-wrap gap-2 mb-4">
    <button onClick={onCopy} className="flex items-center gap-2 px-3 py-1.5 bg-[#c7393b] text-white rounded text-xs font-bold hover:bg-[#a02224] transition-colors shadow-sm">
      <Copy size={14} /> Copy
    </button>
    <button onClick={onCSV} className="flex items-center gap-2 px-3 py-1.5 bg-[#1c3068] text-white rounded text-xs font-bold hover:bg-[#152450] transition-colors shadow-sm">
      <FileText size={14} /> CSV
    </button>
    <button onClick={onExcel} className="flex items-center gap-2 px-3 py-1.5 bg-[#1c3068] text-white rounded text-xs font-bold hover:bg-[#152450] transition-colors shadow-sm">
      <FileSpreadsheet size={14} /> Excel
    </button>
    <button className="flex items-center gap-2 px-3 py-1.5 bg-[#1c3068] text-white rounded text-xs font-bold hover:bg-[#152450] transition-colors shadow-sm opacity-50 cursor-not-allowed" title="Coming Soon">
      <FileType size={14} /> PDF
    </button>
    <button className="flex items-center gap-2 px-3 py-1.5 bg-white text-[#1c3068] rounded text-xs font-bold border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm opacity-50 cursor-not-allowed" title="Coming Soon">
      <Printer size={14} /> Print
    </button>
  </div>
);

// Search Bar removed from DataTable as requested
const DataTable = ({ title, data, columns, onCopy, onCSV, onExcel }: any) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col w-full min-w-0">
      {title && <h3 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">{title}</h3>}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <ExportButtons onCopy={onCopy} onCSV={onCSV} onExcel={onExcel} />
      </div>
      
      <div className="overflow-x-auto flex-1 w-full">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase text-xs tracking-wider">
              {columns.map((col: any, idx: number) => (
                <th key={idx} className="px-4 py-3 font-bold whitespace-nowrap text-[#1c3068]">{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? (
              data.map((row: any, idx: number) => (
                <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  {columns.map((col: any, colIdx: number) => (
                    <td key={colIdx} className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {col.accessor === 'attendance' ? (
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          row[col.accessor] === 'Present' ? 'bg-green-100 text-green-700' :
                          row[col.accessor] === 'Late' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {row[col.accessor]}
                        </span>
                      ) : (
                        row[col.accessor]
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-400 bg-gray-50/30 rounded-lg">
                  No attendance records found for this month.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const MonthTabs = ({ activeMonth, onMonthChange }: { activeMonth: number, onMonthChange: (m: number) => void }) => (
  <div className="flex gap-1 mb-4 overflow-x-auto pb-2 scrollbar-hide w-full">
    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((month) => (
      <button
        key={month}
        onClick={() => onMonthChange(month)}
        className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold transition-all flex-shrink-0 ${
          activeMonth === month 
            ? 'bg-[#1c3068] text-white shadow-md transform scale-110' 
            : 'bg-white text-gray-400 hover:bg-gray-100 border border-gray-100'
        }`}
      >
        {month}
      </button>
    ))}
  </div>
);

export default function ParentsReport() {
  const [studentIc, setStudentIc] = useState('');
  const [activeMonth, setActiveMonth] = useState(new Date().getMonth() + 1);
  const [activeYear, setActiveYear] = useState(new Date().getFullYear());
  
  // API State
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch report logic
  const fetchReport = async (icToFetch: string, monthToFetch: number) => {
    if (!icToFetch) return;
    
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await axios.post('/api/reports/parent-student', {
        ic_number: icToFetch,
        month: monthToFetch,
        year: activeYear
      });

      if (response.data.success) {
        setReportData(response.data);
      }
    } catch (error: any) {
      setReportData(null);
      setErrorMsg(error.response?.data?.message || "Failed to fetch attendance data.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReport(studentIc, activeMonth);
  };

  const handleMonthChange = (month: number) => {
    setActiveMonth(month);
    // Automatically re-fetch if they have already searched an IC successfully
    if (reportData?.student?.ic_number) {
      fetchReport(reportData.student.ic_number, month);
    }
  };

  // --- EXPORT FUNCTIONS --- //
  const handleCopy = async () => {
    if (!reportData || reportData.logs.length === 0) return alert("No data to copy!");

    const tableHtml = `
      <table border="1" style="border-collapse: collapse;">
        <thead>
          <tr><th>Date</th><th>Attendance</th><th>Time In</th><th>Time Out</th><th>Reason</th></tr>
        </thead>
        <tbody>
          ${reportData.logs.map((item: any) => `
            <tr><td>${item.date}</td><td>${item.attendance}</td><td>${item.timeIn}</td><td>${item.timeOut}</td><td>${item.reason}</td></tr>
          `).join('')}
        </tbody>
      </table>
    `;

    try {
      const blobHtml = new Blob([tableHtml], { type: 'text/html' });
      const textFallback = reportData.logs.map((item: any) => `${item.date}\t${item.attendance}\t${item.timeIn}\t${item.timeOut}\t${item.reason}`).join('\n');
      const blobText = new Blob([textFallback], { type: 'text/plain' });

      const clipboardItem = new ClipboardItem({
        'text/html': blobHtml,
        'text/plain': blobText
      });
      await navigator.clipboard.write([clipboardItem]);
      alert("Attendance records copied to clipboard!");
    } catch (error) {
      const textFallback = reportData.logs.map((item: any) => `${item.date}\t${item.attendance}\t${item.timeIn}\t${item.timeOut}\t${item.reason}`).join('\n');
      navigator.clipboard.writeText(textFallback);
      alert("Records copied to clipboard (Text Only)!");
    }
  };

  const handleCSV = () => {
    if (!reportData || reportData.logs.length === 0) return;

    const headers = ['Date', 'Attendance', 'Time In', 'Time Out', 'Reason'];
    const csvRows = [headers.join(',')];

    reportData.logs.forEach((item: any) => {
      const row = [ `"${item.date}"`, `"${item.attendance}"`, `"${item.timeIn}"`, `"${item.timeOut}"`, `"${item.reason}"` ];
      csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${reportData.student.name}_attendance_${activeMonth}_${activeYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExcel = () => {
    if (!reportData || reportData.logs.length === 0) return;

    const tableHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="UTF-8"></head>
      <body>
        <h2>Attendance Report: ${reportData.student.name} (${activeMonth}/${activeYear})</h2>
        <table border="1">
          <thead>
            <tr style="background-color: #1c3068; color: white;">
              <th>Date</th><th>Attendance</th><th>Time In</th><th>Time Out</th><th>Reason</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.logs.map((item: any) => `
              <tr><td>${item.date}</td><td>${item.attendance}</td><td>${item.timeIn}</td><td>${item.timeOut}</td><td>${item.reason}</td></tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${reportData.student.name}_attendance_${activeMonth}_${activeYear}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] pb-20 font-sans text-[#1c3068]">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link 
                to="/"
                className="p-2 hover:bg-gray-100 rounded-full text-[#1c3068] transition-colors inline-block"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-xl font-black text-[#1c3068] uppercase tracking-wide">Infographic Report for Parent</h1>
                <p className="text-xs text-gray-500 mt-1">Check your child's monthly school attendance</p>
              </div>
            </div>
            <div className="flex items-center text-xs text-gray-500 font-medium bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
               <span className="text-[#1c3068] font-bold">I-HADIR</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Search Section */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-[#1c3068] mb-6 border-b border-gray-100 pb-4">Check Student Record</h2>
          <form onSubmit={handleSearch} className="max-w-xl">
             <div className="space-y-2">
               <label className="block text-sm font-bold text-[#1c3068]">
                 <span className="text-[#c7393b] mr-1">*</span> Student IC Number
               </label>
               <div className="flex flex-col sm:flex-row gap-4">
                 <input 
                   type="text" 
                   value={studentIc}
                   onChange={(e) => setStudentIc(e.target.value.replace(/\D/g, ''))}
                   maxLength={12}
                   placeholder="e.g. 080101112233"
                   className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-[#1c3068] font-mono font-bold"
                 />
                 <button 
                   type="submit"
                   disabled={isLoading || studentIc.length < 12}
                   className="bg-[#1c3068] hover:bg-[#152450] text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-[#1c3068]/20 transition-all uppercase tracking-wider text-sm disabled:opacity-50"
                 >
                   {isLoading ? 'Checking...' : 'Check'}
                 </button>
               </div>
               <p className="text-xs text-gray-400 mt-1">Enter the 12-digit MyKad/MyKid number without dashes or spaces.</p>
             </div>
          </form>

          {/* ERROR ALERT */}
          {errorMsg && (
            <div className="mt-4 p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-sm">
              <AlertCircle size={18} className="flex-shrink-0" />
              <p>{errorMsg}</p>
            </div>
          )}
        </div>

        {/* Display Data if Found */}
        {reportData && (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              
              {/* Student Identity Header */}
              <div className="bg-[#1c3068] rounded-2xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-black">{reportData.student.name}</h3>
                  <p className="text-blue-200 font-mono mt-1">{reportData.student.ic_number}</p>
                </div>
                <div className="bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/20 text-center">
                  <p className="text-xs text-blue-200 font-bold uppercase tracking-wider">Selected Month</p>
                  <p className="text-xl font-bold">{new Date(activeYear, activeMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                </div>
              </div>

              {/* Stats Cards Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col h-32">
                  <div className="bg-white h-full flex">
                     <div className="flex-1 border-r border-gray-100 flex flex-col items-center justify-center p-4">
                       <Users size={24} className="text-[#1c3068] mb-2" />
                       <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider text-center">Monthly Record</span>
                     </div>
                     <div className="flex-[2] flex flex-col justify-center px-6 bg-gray-50">
                        <div className="flex justify-between items-center mb-2">
                           <span className="text-xs font-bold text-gray-500 uppercase">Present Rate</span>
                           <span className="text-sm font-black text-[#1c3068]">
                             {reportData.stats.present + reportData.stats.absent > 0 
                               ? Math.round((reportData.stats.present / (reportData.stats.present + reportData.stats.absent)) * 100) 
                               : 0}%
                           </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                           <div className="bg-[#1c3068] h-2 rounded-full" style={{ width: `${reportData.stats.present + reportData.stats.absent > 0 ? Math.round((reportData.stats.present / (reportData.stats.present + reportData.stats.absent)) * 100) : 0}%` }}></div>
                        </div>
                     </div>
                  </div>
                </div>

                {/* Card 2: Total Present */}
                <div className="bg-[#1c3068] rounded-2xl p-6 text-white shadow-lg shadow-[#1c3068]/20 flex flex-col items-center justify-center h-32 relative overflow-hidden group">
                   <div className="relative z-10 text-center">
                     <h3 className="text-4xl font-black mb-1">{reportData.stats.present}</h3>
                     <p className="text-xs font-bold opacity-90 uppercase tracking-wider">Days Present</p>
                   </div>
                </div>

                {/* Card 3: Total Absent */}
                <div className="bg-[#c7393b] rounded-2xl p-6 text-white shadow-lg shadow-[#c7393b]/20 flex flex-col items-center justify-center h-32 relative overflow-hidden group">
                   <div className="relative z-10 text-center">
                     <h3 className="text-4xl font-black mb-1">{reportData.stats.absent}</h3>
                     <p className="text-xs font-bold opacity-90 uppercase tracking-wider">Days Absent</p>
                   </div>
                </div>
              </div>

              {/* Monthly Log Table */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col min-w-0">
                <MonthTabs activeMonth={activeMonth} onMonthChange={handleMonthChange} />
                
                <div className="flex-1 w-full overflow-hidden min-h-[400px] mt-4">
                   <DataTable 
                    title={`Attendance Log: ${new Date(activeYear, activeMonth - 1).toLocaleString('default', { month: 'long' })}`}
                    data={reportData.logs}
                    onCopy={handleCopy}
                    onCSV={handleCSV}
                    onExcel={handleExcel}
                    columns={[
                      { header: 'Date', accessor: 'date' },
                      { header: 'Status', accessor: 'attendance' },
                      { header: 'Time In', accessor: 'timeIn' },
                      { header: 'Time Out', accessor: 'timeOut' },
                      { header: 'Reason / Notes', accessor: 'reason' },
                    ]}
                  />
                </div>
              </div>

            </motion.div>
          </AnimatePresence>
        )}

      </div>
    </div>
  );
}