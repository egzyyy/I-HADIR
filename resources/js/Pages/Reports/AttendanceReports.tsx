import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar, ChevronDown, Download, Filter, Users, FileText, BarChart3, Eye } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { ExportButtons } from '../../Components/dashboard/ExportButtons';
import { CircularProgressBar } from '../../Components/dashboard/CircularProgressBar';
import { formatStandardDate } from '@/utils/dateFormatters';
import { useAuth } from '../../contexts/AuthContext';

// PAGINATION
import { usePagination } from '../../utils/usePagination';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../../Components/ui/pagination';

// IMPORT LOGO
import { printLogoHeader, printLogoCss } from '../../lib/branding';


axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// ─── Shared types ─────────────────────────────────────────────────────────────
type Classroom  = { classroom_id: number; name: string };
type ReportRow  = { student_id: number; name: string; class: string; date: string; status: string; check_in: string; check_out: string };
type Stats      = { present: number; late: number; absent: number; total: number };
type SummaryRow = { classroom_id: number; class_name: string; teacher: string; total_students: number; present: number; present_pct: number; absent: number; absent_pct: number };

// ─── Shared hooks / helpers ───────────────────────────────────────────────────
function useClasses() {
  const [classes, setClasses] = useState<Classroom[]>([]);
  useEffect(() => {
    axios.get('/api/reports/classes').then(r => setClasses(r.data.data ?? [])).catch(() => {});
  }, []);
  return classes;
}

const statusBadge = (status: string) => {
  if (status === 'present') return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">Present</span>;
  if (status === 'late')    return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">Late</span>;
  if (status === 'not_in')  return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-500">Not In</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">Absent</span>;
};

function exportCSV(rows: any[], filename: string) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv  = [keys.join(','), ...rows.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = filename + '.csv';
  a.click();
}

function exportCopy(rows: any[]) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const text = [keys.join('\t'), ...rows.map(r => keys.map(k => r[k] ?? '').join('\t'))].join('\n');
  navigator.clipboard.writeText(text).then(() => alert("Table copied to clipboard!")).catch(() => {});
}

// ─── STANDARDIZED PDF / PRINT HELPER ─────────────────────────────────────────
function generateStandardPDF(title: string, theadHtml: string, tbodyHtml: string, logoSrc: string | null) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        @page { margin: 15mm; size: A4 landscape; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11px; color: #333; margin: 0; padding: 0; }
        
        /* Standard Header Styling */
        .header-container { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #2f4fa8; }
        ${printLogoCss}
        .report-title { color: #2f4fa8; font-size: 24px; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: 1.5px; }
        .report-meta { color: #6b7280; font-size: 11px; margin-top: 8px; font-weight: bold; text-transform: uppercase; }
        
        /* Table Styling */
        table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px; }
        th, td { padding: 10px 8px; border-bottom: 1px solid #e5e7eb; }
        
        /* Enforce colors in print */
        th { 
          background-color: #2f4fa8 !important; 
          color: white !important; 
          font-weight: bold; 
          text-align: center; 
          -webkit-print-color-adjust: exact; 
          print-color-adjust: exact; 
        }
        th:nth-child(2) { text-align: left; } /* Align Name to left */
        
        tr:nth-child(even) { 
          background-color: #f9fafb !important; 
          -webkit-print-color-adjust: exact; 
          print-color-adjust: exact; 
        }
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

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        }
      </script>
    </body>
    </html>
  `;

  const win = window.open('', '_blank');
  if (win) { 
    win.document.write(html); 
    win.document.close(); 
  }
}

// ─── 1. Daily Attendance Report ─────────────────────────────────────────────
const AttendanceReport = () => {
  const classes = useClasses();
  const [activeTab, setActiveTab]         = useState('student');
  const [selectedDate, setSelectedDate]   = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [rows, setRows]                   = useState<ReportRow[]>([]);
  const [stats, setStats]                 = useState<Stats | null>(null);
  const [search, setSearch]               = useState('');
  const [statusFilter, setStatusFilter]   = useState('all');
  const [loading, setLoading]             = useState(false);
  const [submitted, setSubmitted]         = useState(false);
  const { role } = useAuth();
  const canSeeStaffAndTeacher = role === 'Admin' || role === 'Security';

  // Clear data when tab changes
  useEffect(() => {
    setRows([]);
    setStats(null);
    setSubmitted(false);
  }, [activeTab]);

  const handleSubmit = async () => {
    if (!selectedDate) return;
    setLoading(true); setSubmitted(true);
    try {
      const params: any = { 
        date: selectedDate,
        type: activeTab // Passed to backend
      };
      if (activeTab === 'student' && selectedClass) params.classroom_id = selectedClass;
      
      const r = await axios.get('/api/reports/attendance', { params });
      setRows(r.data.data ?? []);
      setStats(r.data.stats ?? null);
    } catch { setRows([]); setStats(null); }
    finally { setLoading(false); }
  };

  const filtered = rows.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.class.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' ? true : r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const { currentPage, setCurrentPage, totalPages, startIndex, endIndex, currentData, totalItems } = usePagination(filtered, 20);

  const handleExportPDF = () => {
    if (filtered.length === 0) return;
    const isStudent = activeTab === 'student';
    const roleLabel = isStudent ? 'Class' : activeTab === 'teacher' ? 'Teacher Type' : 'Staff Type';
    const title = `${activeTab} Daily Attendance (${selectedDate})`;

    const theadHtml = `
      <tr>
        <th style="width:5%">No</th>
        <th style="width:25%">Name</th>
        <th style="width:15%">${roleLabel}</th>
        <th style="width:15%">Date</th>
        <th style="width:10%">Attendance</th>
        <th style="width:10%">Time In</th>
        <th style="width:10%">Time Out</th>
        <th style="width:10%">Reason</th>
      </tr>
    `;

    const tbodyHtml = filtered.map((row, i) => `
      <tr>
        <td style="text-align:center">${i + 1}</td>
        <td style="font-weight:bold">${row.name}</td>
        <td style="text-align:center">${row.class}</td>
        <td style="text-align:center">${formatStandardDate(row.date)}</td>
        <td style="text-align:center">${row.status.toUpperCase()}</td>
        <td style="text-align:center">${row.check_in}</td>
        <td style="text-align:center">${row.check_out}</td>
        <td style="text-align:center">-</td>
      </tr>
    `).join('');

    generateStandardPDF(title, theadHtml, tbodyHtml, null);
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-full mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
           <h2 className="text-2xl font-bold text-[#2f4fa8]">Daily Attendance</h2>
           <p className="text-gray-500 text-sm mt-1">View and manage attendance records and daily statistics.</p>
        </div>
        
        <div className="bg-white p-1 rounded-lg border border-gray-200 shadow-sm flex">
          {['Student', 'Teacher', 'Staff'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                activeTab === tab.toLowerCase() ? 'bg-[#2f4fa8] text-white shadow-md' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-8">
           <h3 className="text-lg font-bold text-[#2f4fa8] mb-6">Filter Settings</h3>
           <div className="flex flex-col md:flex-row justify-between items-end gap-6">
             <div className="flex flex-col md:flex-row gap-6 items-end flex-1 w-full">
                <div className="w-full md:w-64 space-y-2">
                  <label className="block text-sm font-bold text-[#2f4fa8]"><span className="text-[#c53336] mr-1">*</span> Date</label>
                  <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#2f4fa8] focus:ring-2 focus:ring-[#2f4fa8]/10 outline-none transition-all text-gray-700" />
                </div>
                {activeTab === 'student' && (
                  <div className="w-full md:w-64 space-y-2">
                    <label className="block text-sm font-bold text-[#2f4fa8]">Class Filter</label>
                    <div className="relative">
                      <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#2f4fa8] focus:ring-2 focus:ring-[#2f4fa8]/10 outline-none transition-all appearance-none text-gray-700 cursor-pointer">
                        {canSeeStaffAndTeacher ? (
                          <option value="">All Classes</option>
                        ) : (
                          <option value="">All Manageable Classes</option>
                        )}
                        {classes.map(c => <option key={c.classroom_id} value={c.classroom_id}>{c.name}</option>)}
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                )}
             </div>
             <div className="w-full md:w-auto">
               <button onClick={handleSubmit} disabled={loading || !selectedDate} className="w-full md:w-auto bg-[#2f4fa8] hover:bg-[#264190] text-white px-10 py-2.5 rounded-lg font-bold shadow-lg shadow-[#2f4fa8]/20 transition-all transform active:scale-95 disabled:opacity-50">
                 {loading ? 'Loading...' : 'Generate Report'}
               </button>
             </div>
           </div>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col p-6 items-center justify-center">
            <Users size={32} className="text-[#2f4fa8] mb-2" />
            <p className="text-3xl font-bold text-[#2f4fa8]">{stats.total}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Total Expected</p>
          </div>
          <div className="bg-[#2f4fa8] rounded-xl shadow-sm p-6 flex flex-col items-center justify-center text-white">
             <p className="text-4xl font-bold mb-1">{stats.present}</p>
             <p className="text-sm font-medium opacity-90">Total Present</p>
          </div>
          <div className="bg-yellow-500 rounded-xl shadow-sm p-6 flex flex-col items-center justify-center text-white">
             <p className="text-4xl font-bold mb-1">{stats.late}</p>
             <p className="text-sm font-medium opacity-90">Total Late</p>
          </div>
          <div className="bg-[#c53336] rounded-xl shadow-sm p-6 flex flex-col items-center justify-center text-white">
             <p className="text-4xl font-bold mb-1">{stats.absent}</p>
             <p className="text-sm font-medium opacity-90">Total Absent</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-100">
           <p className="text-[#2f4fa8] font-bold text-lg capitalize">{activeTab} Attendance List</p>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col xl:flex-row justify-between items-center gap-4 mb-6">
            <ExportButtons
              onCopy={() => exportCopy(filtered)}
              onExportCSV={() => exportCSV(filtered, 'attendance')}
              onExportExcel={() => exportCSV(filtered, 'attendance')}
              onExportPDF={handleExportPDF}
              onPrint={handleExportPDF}
            />
            
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
              {/* Status Filter */}
              <div className="relative w-full sm:w-40">
                 <select 
                   value={statusFilter}
                   onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                   className="w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-50 outline-none bg-gray-50 focus:bg-white transition-all appearance-none cursor-pointer text-[#2f4fa8] font-semibold"
                 >
                   <option value="all">All Status</option>
                   <option value="present">Present</option>
                   <option value="late">Late</option>
                   <option value="absent">Absent</option>
                 </select>
                 <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-56">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search name..."
                  value={search} 
                  onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} 
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 focus:bg-white border border-gray-200 rounded-lg text-sm focus:border-[#2f4fa8] focus:ring-2 focus:ring-[#2f4fa8]/10 outline-none transition-all" 
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider w-12 text-center">#</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Name</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">{activeTab === 'student' ? 'Class' : 'Role'}</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Date</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Attendance</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Time In</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Time Out</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-400 text-sm"><div className="flex justify-center"><div className="w-6 h-6 border-2 border-[#2f4fa8] border-t-transparent rounded-full animate-spin" /></div></td></tr>
                ) : !submitted ? (
                  <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500 text-sm">Select a date and click Generate Report.</td></tr>
                ) : currentData.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500 text-sm">No attendance records match your filters.</td></tr>
                ) : currentData.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3 text-sm text-gray-500 text-center">{startIndex + i + 1}</td>
                    <td className="px-6 py-3 text-sm font-semibold text-gray-800">{row.name}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{row.class}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{formatStandardDate(row.date)}</td>
                    <td className="px-6 py-3">{statusBadge(row.status)}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{row.check_in}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{row.check_out}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!loading && submitted && (
            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 text-sm text-gray-500 gap-4">
              <p>Showing {startIndex + (currentData.length > 0 ? 1 : 0)} to {endIndex} of {totalItems} entries</p>
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
  );
};

// ─── 2. Infographic Report ──────────────────────────────────────────────────
const InfographicReport = () => {
  const classes = useClasses();
  const [activeTab, setActiveTab]             = useState('student');
  const [activeStatusTab, setActiveStatusTab] = useState<'absent' | 'present' | 'late'>('absent');
  const [viewType, setViewType]               = useState<'date' | 'month'>('month');
  const [selectedMonth, setSelectedMonth]     = useState('');
  const [selectedDate, setSelectedDate]       = useState('');
  const [isMounted, setIsMounted]             = useState(false);
  const [chartData, setChartData]             = useState<any[]>([]);
  const [listRows, setListRows]               = useState<ReportRow[]>([]);
  const [stats, setStats]                     = useState<Stats | null>(null);
  const [search, setSearch]                   = useState('');
  const [loading, setLoading]                 = useState(false);
  const { role } = useAuth();
  const canSeeStaffAndTeacher = role === 'Admin' || role === 'Security';

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (viewType === 'month' && selectedMonth) {
        const r = await axios.get('/api/reports/monthly', { params: { month: selectedMonth, type: activeTab } });
        setChartData(r.data.chartData ?? []);
        setListRows(r.data.data ?? []);
        setStats(null);
      } else if (viewType === 'date' && selectedDate) {
        const r = await axios.get('/api/reports/attendance', { params: { date: selectedDate, type: activeTab } });
        setListRows(r.data.data ?? []);
        setStats(r.data.stats ?? null);
        setChartData([]);
      }
    } catch { setChartData([]); setListRows([]); setStats(null); }
    finally { setLoading(false); }
  };

  const filteredList = listRows.filter(r => {
    const matchStatus = viewType === 'date' ? r.status === activeStatusTab : true;
    return matchStatus && r.name?.toLowerCase().includes(search.toLowerCase());
  });

  const { currentPage, setCurrentPage, totalPages, startIndex, endIndex, currentData, totalItems } = usePagination(filteredList, 20);

  const totalPresent = stats ? stats.present : 0;
  const totalLate    = stats ? stats.late : 0;
  const totalAbsent  = stats ? stats.absent : 0;
  const total        = stats ? stats.total : 0;
  
  // PCT math includes LATE as technically "Present" for the volume ring, but UI shows them distinct
  const pct          = total > 0 ? Math.round(((totalPresent + totalLate) / total) * 1000) / 10 : 0;
  const absentPct    = total > 0 ? Math.round((totalAbsent / total) * 1000) / 10 : 0;

  const displayData = chartData.length > 0
    ? chartData.map(d => ({ name: String(d.day), present: d.present, absent: d.absent }))
    : [];

  const handleExportPDF = () => {
    if (filteredList.length === 0) return;
    const isStudent = activeTab === 'student';
    const roleLabel = isStudent ? 'Class' : activeTab === 'teacher' ? 'Teacher Type' : 'Staff Type';
    const title = `${activeTab} ${activeStatusTab} List (${viewType === 'month' ? selectedMonth : selectedDate})`;
    
    let theadHtml = `<tr><th style="width:5%">No</th><th style="width:25%">Name</th>`;
    if (isStudent) theadHtml += `<th style="width:15%">Class</th>`;
    theadHtml += `<th style="width:10%">Date</th><th style="width:10%">Attendance</th><th style="width:10%">Time In</th><th style="width:10%">Time Out</th>`;
    if (activeStatusTab === 'present' || activeStatusTab === 'late') {
      theadHtml += `<th style="width:10%">Reason</th><th style="width:10%">Location</th>`;
    }
    theadHtml += `</tr>`;

    const tbodyHtml = filteredList.map((row, i) => {
      let tr = `<tr><td style="text-align:center">${i + 1}</td><td style="font-weight:bold">${row.name}</td>`;
      if (isStudent) tr += `<td style="text-align:center">${row.class ?? '-'}</td>`;
      tr += `<td style="text-align:center">${formatStandardDate(row.date) ?? '-'}</td>`;
      tr += `<td style="text-align:center">${(row.status || '').toUpperCase()}</td>`;
      tr += `<td style="text-align:center">${row.check_in ?? '-'}</td>`;
      tr += `<td style="text-align:center">${row.check_out ?? '-'}</td>`;
      if (activeStatusTab === 'present' || activeStatusTab === 'late') {
        tr += `<td style="text-align:center">-</td><td style="text-align:center">-</td>`;
      }
      tr += `</tr>`;
      return tr;
    }).join('');

    generateStandardPDF(title, theadHtml, tbodyHtml, null);
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-full mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
           <h2 className="text-2xl font-bold text-[#2f4fa8]">Infographic Report</h2>
           <p className="text-gray-500 text-sm mt-1">View monthly attendance infographics and statistics.</p>
        </div>
        <div className="bg-white p-1 rounded-lg border border-gray-200 shadow-sm flex">
          {['Student', ...(canSeeStaffAndTeacher ? ['Teacher', 'Staff'] : [])].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                activeTab === tab.toLowerCase() ? 'bg-[#2f4fa8] text-white shadow-md' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-8">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
             <h3 className="text-lg font-bold text-[#2f4fa8]">Report</h3>
             <div className="bg-gray-50 p-1 rounded-lg border border-gray-200 flex">
               <button onClick={() => setViewType('date')} className={`px-5 py-2 rounded-md text-sm font-semibold transition-all ${viewType === 'date' ? 'bg-white text-[#2f4fa8] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>By Date</button>
               <button onClick={() => setViewType('month')} className={`px-5 py-2 rounded-md text-sm font-semibold transition-all ${viewType === 'month' ? 'bg-white text-[#2f4fa8] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>By Month</button>
             </div>
           </div>
           
           <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
             {viewType === 'month' ? (
               <div className="w-full md:w-64 space-y-2">
                 <label className="block text-sm font-bold text-[#2f4fa8]"><span className="text-[#c53336] mr-1">*</span> Month</label>
                 <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#2f4fa8] outline-none transition-all text-gray-700" />
               </div>
             ) : (
               <div className="w-full md:w-64 space-y-2">
                 <label className="block text-sm font-bold text-[#2f4fa8]"><span className="text-[#c53336] mr-1">*</span> Date</label>
                 <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#2f4fa8] outline-none transition-all text-gray-700" />
               </div>
             )}
             <div className="mt-4 md:mt-0 md:ml-auto self-end md:self-center pt-6">
               <button onClick={handleSubmit} disabled={loading || (viewType === 'month' ? !selectedMonth : !selectedDate)} className="bg-[#2f4fa8] hover:bg-[#264190] text-white px-8 py-2.5 rounded-lg font-bold shadow-lg shadow-[#2f4fa8]/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 min-w-[120px]">
                 {loading ? 'Loading...' : 'Generate'}
               </button>
             </div>
           </div>
        </div>
      </div>
      
      { viewType !== 'month' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col p-6 items-center justify-center">
            <Users size={32} className="text-[#2f4fa8] mb-2" />
            <p className="text-3xl font-bold text-[#2f4fa8]">{total}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Total Expected</p>
          </div>
          <div className="bg-[#2f4fa8] rounded-xl shadow-sm p-6 flex flex-col items-center justify-center text-white">
            <p className="text-4xl font-bold mb-1">{totalPresent}</p>
            <p className="text-sm font-medium opacity-90">Total Present</p>
          </div>
          <div className="bg-yellow-500 rounded-xl shadow-sm p-6 flex flex-col items-center justify-center text-white">
            <p className="text-4xl font-bold mb-1">{totalLate}</p>
            <p className="text-sm font-medium opacity-90">Total Late</p>
          </div>
          <div className="bg-[#c53336] rounded-xl shadow-sm p-6 flex flex-col items-center justify-center text-white">
            <p className="text-4xl font-bold mb-1">{totalAbsent}</p>
            <p className="text-sm font-medium opacity-90">Total Absent</p>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-100">
           <h3 className="text-lg font-bold text-[#2f4fa8]">{viewType === 'month' ? 'Daily Attendance Volume' : 'Attendance Summary'}</h3>
        </div>
        <div className="p-6 h-[400px] w-full min-w-0 relative">
          {isMounted && (
            <>
              {viewType === 'month' ? (
                <div className="w-full h-full" style={{ minHeight: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={displayData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Line type="monotone" dataKey="present" stroke="#2f4fa8" strokeWidth={3} dot={{ r: 4, fill: '#2f4fa8' }} name="Present & Late" />
                      <Line type="monotone" dataKey="absent" stroke="#c53336" strokeWidth={3} dot={{ r: 4, fill: '#c53336' }} name="Absent" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <CircularProgressBar percentage={pct} total={total} present={totalPresent + totalLate} absent={totalAbsent} />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
           <p className="text-[#2f4fa8] font-bold text-lg capitalize">List of {activeTab} {viewType === 'month' ? 'in Month' : 'on Date'}</p>
           {viewType === 'date' && (
             <div className="bg-gray-100 p-1 rounded-lg flex">
                {(['absent', 'present', 'late'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => { setActiveStatusTab(status); setCurrentPage(1); }}
                    className={`px-6 py-1.5 rounded-md text-xs font-bold transition-all capitalize ${
                      activeStatusTab === status ? 'bg-white text-[#2f4fa8] shadow-sm' : 'text-gray-500 hover:text-[#2f4fa8]'
                    }`}
                  >
                    {status}
                  </button>
                ))}
             </div>
           )}
        </div>
        
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <ExportButtons
              onCopy={() => exportCopy(filteredList)}
              onExportCSV={() => exportCSV(filteredList, 'infographic')}
              onExportExcel={() => exportCSV(filteredList, 'infographic')}
              onExportPDF={handleExportPDF}
              onPrint={handleExportPDF}
            />
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm text-gray-500">Search:</span>
              <input type="text" value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} className="w-full sm:w-48 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded text-sm focus:border-[#2f4fa8] focus:bg-white focus:ring-2 outline-none transition-all" />
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider w-12 text-center">#</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Name</th>
                  {activeTab === 'student' && (
                    <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Class</th>
                  )}
                  <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">{viewType === 'month' ? 'Present' : 'Date'}</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">{viewType === 'month' ? 'Late' : 'Attendance'}</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">{viewType === 'month' ? 'Absent' : 'Time In'}</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider">{viewType === 'month' ? 'Rate' : 'Time Out'}</th>
                </tr>
              </thead>
              <tbody>
                {currentData.length === 0 ? (
                  <tr>
                    <td colSpan={activeStatusTab === 'present' ? (activeTab === 'student' ? 8 : 7) : (activeTab === 'student' ? 6 : 5)} className="px-6 py-8 text-center text-gray-500 text-sm">
                      No data available in table
                    </td>
                  </tr>
                ) : currentData.map((row: any, i) => (
                  <tr key={i} className="hover:bg-gray-50 border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3 text-sm text-gray-500 text-center">{startIndex + i + 1}</td>
                    <td className="px-6 py-3 text-sm font-semibold text-gray-800">{row.name}</td>
                    {activeTab === 'student' && <td className="px-6 py-3 text-sm text-gray-600">{row.class ?? '-'}</td>}
                    <td className="px-6 py-3 text-sm text-gray-600">{viewType === 'month' ? row.present : (formatStandardDate(row.date) ?? '-')}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{viewType === 'month' ? row.late : (row.status ? statusBadge(row.status) : '-')}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{viewType === 'month' ? row.absent : (row.check_in ?? '-')}</td>
                    <td className="px-6 py-3 text-sm font-mono text-gray-600">{viewType === 'month' ? `${row.rate}%` : (row.check_out ?? '-')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!loading && (
            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 text-sm text-gray-500 gap-4">
              <p>Showing {startIndex + (currentData.length > 0 ? 1 : 0)} to {endIndex} of {totalItems} entries</p>
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
  );
};

// ─── 3. Summary Report (Classes only) ────────────────────────────────────────
const SummaryReport = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [tableData, setTableData]       = useState<SummaryRow[]>([]);
  const [stats, setStats]               = useState<{ present: number; absent: number; total: number } | null>(null);
  const [search, setSearch]             = useState('');
  const [loading, setLoading]           = useState(false);
  const [submitted, setSubmitted]       = useState(false);

  const handleSubmit = async () => {
    if (!selectedDate) return;
    setLoading(true); setSubmitted(true);
    try {
      const r = await axios.get('/api/reports/summary', { params: { date: selectedDate } });
      setTableData(r.data.data ?? []);
      setStats(r.data.stats ?? null);
    } catch { setTableData([]); setStats(null); }
    finally { setLoading(false); }
  };

  const filtered = tableData.filter(r =>
    r.class_name.toLowerCase().includes(search.toLowerCase()) ||
    r.teacher.toLowerCase().includes(search.toLowerCase())
  );

  const { currentPage, setCurrentPage, totalPages, startIndex, endIndex, currentData, totalItems } = usePagination(filtered, 20);

  const handleExportPDF = () => {
    if (filtered.length === 0) return;
    const title = `Summary Report (${selectedDate})`;

    const theadHtml = `
      <tr>
        <th style="width:5%">#</th>
        <th style="width:25%">Class Name</th>
        <th style="width:30%">Classroom Teacher</th>
        <th style="width:10%">Total Students</th>
        <th style="width:10%">Present</th>
        <th style="width:10%">Present %</th>
        <th style="width:10%">Absent</th>
        <th style="width:10%">Absent %</th>
      </tr>
    `;

    const tbodyHtml = filtered.map((row, i) => `
      <tr>
        <td style="text-align:center">${i + 1}</td>
        <td style="font-weight:bold; color:#c53336">${row.class_name}</td>
        <td>${row.teacher}</td>
        <td style="text-align:center">${row.total_students}</td>
        <td style="text-align:center">${row.present}</td>
        <td style="text-align:center">${row.present_pct.toFixed(2)}</td>
        <td style="text-align:center">${row.absent}</td>
        <td style="text-align:center">${row.absent_pct.toFixed(2)}</td>
      </tr>
    `).join('');

    generateStandardPDF(title, theadHtml, tbodyHtml, null);
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-full mx-auto">
      <div className="mb-6 flex justify-between items-center">
         <div>
            <h2 className="text-2xl font-bold text-[#2f4fa8]">Summary Report</h2>
            <p className="text-gray-500 text-sm mt-1">Review aggregated daily class attendance statistics.</p>
         </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-8">
           <h3 className="text-lg font-bold text-[#2f4fa8] mb-6">Report Date</h3>
           <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
             <div className="w-full md:w-64 space-y-2">
               <label className="block text-sm font-bold text-[#2f4fa8]"><span className="text-[#c53336] mr-1">*</span> Date</label>
               <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#2f4fa8] outline-none transition-all text-gray-700" />
             </div>
             <div className="mt-4 md:mt-0 md:ml-auto self-end md:self-center pt-6">
               <button onClick={handleSubmit} disabled={loading || !selectedDate} className="bg-[#2f4fa8] hover:bg-[#264190] text-white px-8 py-2.5 rounded-lg font-bold shadow-lg shadow-[#2f4fa8]/20 transition-all disabled:opacity-50 min-w-[120px]">
                 {loading ? 'Loading...' : 'Generate'}
               </button>
             </div>
           </div>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <div className="bg-[#2f4fa8] text-white p-4 flex items-center justify-center h-24"><Users size={40} /></div>
            <div className="flex border-t border-gray-100 divide-x divide-gray-100 bg-white">
               <div className="flex-1 p-4 text-center">
                 <p className="text-xl font-bold text-[#2f4fa8]">{stats?.present ?? 0}</p>
                 <p className="text-xs text-gray-500 uppercase tracking-wider">Present</p>
               </div>
               <div className="flex-1 p-4 text-center">
                 <p className="text-xl font-bold text-[#c53336]">{stats?.absent ?? 0}</p>
                 <p className="text-xs text-gray-500 uppercase tracking-wider">Absent</p>
               </div>
            </div>
          </div>
          <div className="bg-[#2f4fa8] rounded-xl shadow-sm p-6 flex flex-col items-center justify-center text-white h-full min-h-[140px]">
             <p className="text-4xl font-bold mb-1">{stats?.present ?? 0}</p>
             <p className="text-sm font-medium opacity-90">Total Present</p>
          </div>
          <div className="bg-[#c53336] rounded-xl shadow-sm p-6 flex flex-col items-center justify-center text-white h-full min-h-[140px]">
             <p className="text-4xl font-bold mb-1">{stats?.absent ?? 0}</p>
             <p className="text-sm font-medium opacity-90">Total Absent</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
           <p className="text-gray-500 text-sm">Classroom breakdown summary</p>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <ExportButtons
              onCopy={() => exportCopy(filtered)}
              onExportCSV={() => exportCSV(filtered, 'summary')}
              onExportExcel={() => exportCSV(filtered, 'summary')}
              onExportPDF={handleExportPDF}
              onPrint={handleExportPDF}
            />
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm text-gray-500">Search:</span>
              <input type="text" value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} className="w-full sm:w-48 px-3 py-1.5 bg-gray-50 border border-gray-200 focus:bg-white rounded text-sm focus:border-[#2f4fa8] outline-none transition-all" />
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider w-12 text-center">#</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Class Name</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Classroom Teacher</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Total Number of Students</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Present</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Present %</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Absent</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider">Absent %</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-400 text-sm"><div className="flex justify-center"><div className="w-6 h-6 border-2 border-[#2f4fa8] border-t-transparent rounded-full animate-spin" /></div></td></tr>
                ) : !submitted ? (
                  <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500 text-sm">Select a date and click Generate.</td></tr>
                ) : currentData.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500 text-sm">No data available.</td></tr>
                ) : currentData.map((row, i) => (
                  <tr key={row.classroom_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-100">{startIndex + i + 1}</td>
                    <td className="px-6 py-3 text-sm text-[#c53336] font-bold border-r border-gray-100">{row.class_name}</td>
                    <td className="px-6 py-3 text-sm text-gray-600 border-r border-gray-100 uppercase">{row.teacher}</td>
                    <td className="px-6 py-3 text-sm text-gray-600 border-r border-gray-100 font-mono text-center">{row.total_students}</td>
                    <td className="px-6 py-3 text-sm text-gray-600 border-r border-gray-100 font-mono text-center">{row.present}</td>
                    <td className="px-6 py-3 text-sm text-gray-600 border-r border-gray-100 font-mono text-center">{row.present_pct.toFixed(2)}</td>
                    <td className="px-6 py-3 text-sm text-gray-600 border-r border-gray-100 font-mono text-center">{row.absent}</td>
                    <td className="px-6 py-3 text-sm text-gray-600 font-mono text-center">{row.absent_pct.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!loading && submitted && (
            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 text-sm text-gray-500 gap-4">
              <p>Showing {startIndex + (currentData.length > 0 ? 1 : 0)} to {endIndex} of {totalItems} entries</p>
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
  );
};

// ─── Main Controller Component ───────────────────────────────────────────────
const CombinedAttendanceReports = () => {
  const [activeReport, setActiveReport] = useState('attendance');

  const renderReport = () => {
    switch (activeReport) {
      case 'attendance': return <AttendanceReport />;
      case 'infographic': return <InfographicReport />;
      case 'summary': return <SummaryReport />;
      default: return <AttendanceReport />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 overflow-x-auto">
        <div className="flex space-x-2 min-w-max">
          {[
            { id: 'attendance', label: 'Daily Attendance' },
            { id: 'infographic', label: 'Infographic Report' },
            { id: 'summary', label: 'Class Summary Report' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id)}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                activeReport === tab.id
                  ? 'bg-[#2f4fa8] text-white shadow-md'
                  : 'text-gray-500 hover:text-[#2f4fa8] hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <motion.div
        key={activeReport}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {renderReport()}
      </motion.div>
    </div>
  );
};

export default function AttendanceReportsPage() {
  return (
    <DashboardLayout activePageId="attendance-reports">
      <CombinedAttendanceReports />
    </DashboardLayout>
  );
}