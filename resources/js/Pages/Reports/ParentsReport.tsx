import React, { useState } from 'react';
import { ArrowLeft, AlertCircle, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// Import Shared Components
import { ExportButtons } from '../../Components/dashboard/ExportButtons';
import { usePagination } from '../../utils/usePagination';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../../Components/ui/pagination';

// Import Logo
import { printLogoHeader, printLogoCss } from '../../lib/branding';

axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// --- Shared Export Helpers ---
function exportCSV(rows: any[], filename: string) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv  = [keys.join(','), ...rows.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = filename + '.csv';
  a.click();
}

function exportCopy(text: string) {
  navigator.clipboard.writeText(text).then(() => alert("Table copied to clipboard!")).catch(() => {});
}

function generateStandardPDF(title: string, theadHtml: string, tbodyHtml: string, logoSrc: string | null) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        @page { margin: 15mm; size: A4 landscape; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11px; color: #333; margin: 0; padding: 0; }
        .header-container { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #1c3068; }
        ${printLogoCss}
        .report-title { color: #1c3068; font-size: 24px; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: 1.5px; }
        .report-meta { color: #6b7280; font-size: 11px; margin-top: 8px; font-weight: bold; text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px; }
        th, td { padding: 10px 8px; border-bottom: 1px solid #e5e7eb; }
        th { background-color: #1c3068 !important; color: white !important; font-weight: bold; text-align: center; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        th:nth-child(2) { text-align: left; }
        tr:nth-child(even) { background-color: #f9fafb !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      </style>
    </head>
    <body>
      <div class="header-container">
        ${printLogoHeader(logoSrc)}
        <h1 class="report-title">${title}</h1>
        <p class="report-meta">Generated on: ${new Date().toLocaleString('en-MY')} &nbsp;&bull;&nbsp; I-HADIR System</p>
      </div>
      <table>
        <thead>${theadHtml}</thead>
        <tbody>${tbodyHtml}</tbody>
      </table>
      <script>window.onload = function() { setTimeout(function() { window.print(); }, 300); }</script>
    </body>
    </html>
  `;
  const win = window.open('', '_blank');
  if (win) { win.document.write(html); win.document.close(); }
}

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
  const navigate = useNavigate();
  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  const [studentIc, setStudentIc] = useState('');
  const [activeMonth, setActiveMonth] = useState(new Date().getMonth() + 1);
  const [activeYear, setActiveYear] = useState(new Date().getFullYear());
  
  // API State
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
    if (reportData?.student?.ic_number) {
      fetchReport(reportData.student.ic_number, month);
    }
  };

  // Pagination hook on retrieved logs
  const { currentPage, setCurrentPage, totalPages, startIndex, endIndex, currentData, totalItems } = usePagination(reportData?.logs || [], 10);

  // --- EXPORT TRIGGERS ---
  const handleCopy = () => {
    if (!reportData || reportData.logs.length === 0) return;
    const text = ['Date\tAttendance\tTime In\tTime Out\tReason', ...reportData.logs.map((r: any) => `${r.date}\t${r.attendance}\t${r.timeIn}\t${r.timeOut}\t${r.reason}`)].join('\n');
    exportCopy(text);
  };

  const handleExportPDF = () => {
    if (!reportData || reportData.logs.length === 0) return;
    const title = `${reportData.student.name} - Attendance Report (${activeMonth}/${activeYear})`;
    const thead = `<tr><th style="width:5%">No</th><th style="width:20%">Date</th><th style="width:20%">Attendance</th><th style="width:15%">Time In</th><th style="width:15%">Time Out</th><th style="width:25%">Reason</th></tr>`;
    const tbody = reportData.logs.map((r: any, i: number) => `<tr><td style="text-align:center">${i + 1}</td><td style="text-align:center">${r.date}</td><td style="text-align:center; text-transform:capitalize">${r.attendance}</td><td style="text-align:center">${r.timeIn}</td><td style="text-align:center">${r.timeOut}</td><td>${r.reason}</td></tr>`).join('');
    generateStandardPDF(title, thead, tbody, null);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] pb-20 font-sans text-[#1c3068]">
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button onClick={goBack} className="p-2 hover:bg-gray-100 rounded-full text-[#1c3068] transition-colors inline-block">
                <ArrowLeft size={20} />
              </button>
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
               <label className="block text-sm font-bold text-[#1c3068]"><span className="text-[#c7393b] mr-1">*</span> Student IC Number</label>
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
              
              {/* Header Info */}
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

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col h-32 md:col-span-2">
                  <div className="bg-white h-full flex">
                     <div className="flex-1 border-r border-gray-100 flex flex-col items-center justify-center p-4">
                       <Users size={24} className="text-[#1c3068] mb-2" />
                       <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider text-center">Monthly Record</span>
                     </div>
                     <div className="flex-[2] flex flex-col justify-center px-6 bg-gray-50">
                        <div className="flex justify-between items-center mb-2">
                           <span className="text-xs font-bold text-gray-500 uppercase">Present Rate</span>
                           <span className="text-sm font-black text-[#1c3068]">
                             {reportData.stats.present + reportData.stats.late + reportData.stats.absent > 0 
                               ? Math.round(((reportData.stats.present + reportData.stats.late) / (reportData.stats.present + reportData.stats.late + reportData.stats.absent)) * 100) 
                               : 0}%
                           </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                           <div className="bg-[#1c3068] h-2 rounded-full" style={{ width: `${reportData.stats.present + reportData.stats.late + reportData.stats.absent > 0 ? Math.round(((reportData.stats.present + reportData.stats.late) / (reportData.stats.present + reportData.stats.late + reportData.stats.absent)) * 100) : 0}%` }}></div>
                        </div>
                     </div>
                  </div>
                </div>

                <div className="bg-[#1c3068] rounded-2xl p-6 text-white shadow-lg flex flex-col items-center justify-center h-32">
                   <h3 className="text-4xl font-black mb-1">{reportData.stats.present + reportData.stats.late}</h3>
                   <p className="text-xs font-bold opacity-90 uppercase tracking-wider">Days Present</p>
                </div>

                <div className="bg-[#c7393b] rounded-2xl p-6 text-white shadow-lg flex flex-col items-center justify-center h-32">
                   <h3 className="text-4xl font-black mb-1">{reportData.stats.absent}</h3>
                   <p className="text-xs font-bold opacity-90 uppercase tracking-wider">Days Absent</p>
                </div>
              </div>

              {/* Monthly Log Table */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col min-w-0">
                <MonthTabs activeMonth={activeMonth} onMonthChange={handleMonthChange} />
                
                <div className="flex-1 w-full overflow-hidden mt-4">
                  <div className="mb-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                      Attendance Log: {new Date(activeYear, activeMonth - 1).toLocaleString('default', { month: 'long' })}
                    </h3>
                    <ExportButtons 
                       onCopy={handleCopy} 
                       onExportCSV={() => exportCSV(reportData.logs, 'parent_report')} 
                       onExportExcel={() => exportCSV(reportData.logs, 'parent_report')} 
                       onExportPDF={handleExportPDF} 
                       onPrint={handleExportPDF} 
                    />
                  </div>

                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Date</th>
                          <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Attendance</th>
                          <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Time In</th>
                          <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Time Out</th>
                          <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider">Reason / Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentData.length > 0 ? (
                          currentData.map((row: any, index: number) => (
                            <tr key={index} className="hover:bg-gray-50/50 transition-colors border-b border-gray-100 last:border-0">
                              <td className="px-6 py-4 text-sm font-semibold text-gray-800 border-r border-gray-100">{row.date}</td>
                              <td className="px-6 py-4 text-sm border-r border-gray-100">
                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                                  row.attendance === 'Present' ? 'bg-green-50 text-green-700 border-green-200' :
                                  row.attendance === 'Late' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                  'bg-red-50 text-red-700 border-red-200'
                                }`}>
                                  {row.attendance}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600 border-r border-gray-100 font-mono">{row.timeIn}</td>
                              <td className="px-6 py-4 text-sm text-gray-600 border-r border-gray-100 font-mono">{row.timeOut}</td>
                              <td className="px-6 py-4 text-sm text-gray-600">{row.reason}</td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500 text-sm">No attendance records found for this month.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalItems > 0 && (
                    <div className="flex flex-col sm:flex-row justify-between items-center mt-6 text-sm text-gray-500 gap-4">
                      <p>Showing {startIndex + 1} to {endIndex} of {totalItems} entries</p>
                      {totalPages > 1 && (
                        <Pagination className="mx-0 w-auto">
                          <PaginationContent>
                            <PaginationItem><PaginationPrevious onClick={() => setCurrentPage(currentPage - 1)} className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} /></PaginationItem>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                              <PaginationItem key={page}><PaginationLink onClick={() => setCurrentPage(page)} isActive={currentPage === page} className="cursor-pointer">{page}</PaginationLink></PaginationItem>
                            ))}
                            <PaginationItem><PaginationNext onClick={() => setCurrentPage(currentPage + 1)} className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'} /></PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      )}
                    </div>
                  )}

                </div>
              </div>

            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}