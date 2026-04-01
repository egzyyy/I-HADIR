import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Calendar, ChevronDown, Download, Filter, Users, FileText, BarChart3, Eye } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { ExportButtons } from '../../Components/dashboard/ExportButtons';
import { CircularProgressBar } from '../../Components/dashboard/CircularProgressBar';

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
  navigator.clipboard.writeText(text).catch(() => {});
}

function exportPrint(ref: React.RefObject<HTMLTableElement | null>) {
  if (!ref.current) return;
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(`<html><head><title>Report</title><style>table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:6px 10px;font-size:12px}th{background:#1c3068;color:#fff}</style></head><body>${ref.current.outerHTML}</body></html>`);
  w.document.close();
  w.print();
}

const AttendanceReport = () => {
  const classes = useClasses();
  const [activeTab, setActiveTab]         = useState('student');
  const [selectedDate, setSelectedDate]   = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [rows, setRows]                   = useState<ReportRow[]>([]);
  const [stats, setStats]                 = useState<Stats | null>(null);
  const [search, setSearch]               = useState('');
  const [loading, setLoading]             = useState(false);
  const [submitted, setSubmitted]         = useState(false);
  const tableRef = useRef<HTMLTableElement>(null);

  const handleSubmit = async () => {
    if (!selectedDate) return;
    setLoading(true); setSubmitted(true);
    try {
      const params: any = { date: selectedDate };
      if (selectedClass) params.classroom_id = selectedClass;
      const r = await axios.get('/api/reports/attendance', { params });
      setRows(r.data.data ?? []);
      setStats(r.data.stats ?? null);
    } catch { setRows([]); setStats(null); }
    finally { setLoading(false); }
  };

  const filtered = rows.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.class.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-full mx-auto"
    >
      {/* Header section code remains same as your provide code */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
           <h2 className="text-2xl font-bold text-[#1c3068]">Attendance Report</h2>
           <p className="text-gray-500 text-sm mt-1">
             View and manage attendance records and daily statistics.
           </p>
        </div>
        
        <div className="bg-white p-1 rounded-lg border border-gray-200 shadow-sm flex">
          {['Student', 'Teacher', 'Staff'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                activeTab === tab.toLowerCase()
                  ? 'bg-[#1c3068] text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Updated Filter Row with justify-between */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-8">
           <h3 className="text-lg font-bold text-[#1c3068] mb-6">Report</h3>
           
           {/* Adding justify-between pushes the button container to the far right */}
           <div className="flex flex-col md:flex-row justify-between items-end gap-6">
             
             {/* Left side: Grouped Filters */}
             <div className="flex flex-col md:flex-row gap-6 items-end flex-1">
                {/* Date Input */}
                <div className="w-full md:w-64 space-y-2">
                  <label className="block text-sm font-bold text-[#1c3068]">
                    <span className="text-[#c53336] mr-1">*</span> Date
                  </label>
                  <input 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-gray-700"
                  />
                  <p className="text-[10px] text-gray-400 font-medium">dd-mm-yyyy</p>
                </div>

                {/* Class Select */}
                {activeTab === 'student' && (
                  <div className="w-full md:w-64 space-y-2">
                    <label className="block text-sm font-bold text-[#1c3068]">
                      <span className="text-[#c53336] mr-1">*</span> Class
                    </label>
                    <div className="relative">
                      <select 
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all appearance-none text-gray-700 cursor-pointer"
                      >
                        <option value="">Select...</option>
                        {classes.map(c => (
                          <option key={c.classroom_id} value={c.classroom_id}>{c.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                    {/* Spacer to match dd-mm-yyyy text height */}
                    <p className="text-[10px] text-transparent select-none">placeholder</p>
                  </div>
                )}
             </div>

             {/* Right side: Submit Button aligned to far right */}
             <div className="w-full md:w-auto pb-6">
               <button onClick={handleSubmit} disabled={loading || !selectedDate} className="bg-[#1c3068] hover:bg-[#152450] text-white px-10 py-2.5 rounded-lg font-bold shadow-lg shadow-[#1c3068]/20 transition-all transform active:scale-95 min-w-[120px] disabled:opacity-50">
                 {loading ? 'Loading...' : 'Submit'}
               </button>
             </div>
           </div>
        </div>
      </div>

      {activeTab === 'student' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Card 1: Present/Absent Split */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <div className="bg-[#1c3068] p-4 flex items-center justify-center h-24">
               <Users size={40} className="text-white" />
            </div>
            <div className="flex border-t border-gray-100 divide-x divide-gray-100">
               <div className="flex-1 p-4 text-center">
                 <p className="text-xl font-bold text-[#1c3068]">{stats ? stats.present + stats.late : 0}</p>
                 <p className="text-xs text-gray-500 uppercase tracking-wider">Present</p>
               </div>
               <div className="flex-1 p-4 text-center">
                 <p className="text-xl font-bold text-[#c53336]">{stats?.absent ?? 0}</p>
                 <p className="text-xs text-gray-500 uppercase tracking-wider">Absent</p>
               </div>
            </div>
          </div>

          {/* Card 2: Total Present */}
          <div className="bg-[#1c3068] rounded-xl shadow-sm p-6 flex flex-col items-center justify-center text-white">
             <p className="text-4xl font-bold mb-1">{stats ? stats.present + stats.late : 0}</p>
             <p className="text-sm font-medium opacity-90">Total Present</p>
          </div>

          {/* Card 3: Total Absent */}
          <div className="bg-[#c53336] rounded-xl shadow-sm p-6 flex flex-col items-center justify-center text-white">
             <p className="text-4xl font-bold mb-1">{stats?.absent ?? 0}</p>
             <p className="text-sm font-medium opacity-90">Total Absent</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
           <p className="text-gray-500 text-sm">
             {activeTab === 'student' ? 'Student' : activeTab === 'teacher' ? 'Teacher' : 'Staff'} attendance list on
           </p>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <ExportButtons
              onCopy={() => exportCopy(filtered)}
              onExportCSV={() => exportCSV(filtered, 'attendance')}
              onExportExcel={() => exportCSV(filtered, 'attendance')}
              onPrint={() => exportPrint(tableRef)}
              onExportPDF={() => exportPrint(tableRef)}
            />

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm text-gray-500">Search:</span>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full sm:w-48 px-3 py-1.5 bg-white border border-gray-200 rounded text-sm focus:border-[#1c3068] outline-none transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table ref={tableRef} className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-200">
                  <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Name</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">
                    {activeTab === 'student' ? 'Class' : activeTab === 'teacher' ? 'Teacher Type' : 'Staff Type'}
                  </th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Date</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Attendance</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Time In</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Time Out</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider">Reason</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-400 text-sm">
                    <div className="flex justify-center"><div className="w-6 h-6 border-2 border-[#1c3068] border-t-transparent rounded-full animate-spin" /></div>
                  </td></tr>
                ) : !submitted ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500 text-sm">Select a date and click Submit.</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500 text-sm">No data available in table</td></tr>
                ) : filtered.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 border-b border-gray-100 last:border-0">
                    <td className="px-6 py-3 text-sm font-semibold text-gray-800">{row.name}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{row.class}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{row.date}</td>
                    <td className="px-6 py-3">{statusBadge(row.status)}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{row.check_in}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{row.check_out}</td>
                    <td className="px-6 py-3 text-sm text-gray-400">-</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
            <p className="text-sm text-gray-500">Showing {filtered.length} to {filtered.length} of {rows.length} entries</p>
            <div className="flex gap-1">
              <button className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-500 hover:bg-gray-50" disabled>Previous</button>
              <button className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-500 hover:bg-gray-50" disabled>Next</button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const AbsentReport = () => {
  const classes = useClasses();
  const [activeTab, setActiveTab]         = useState('student');
  const [selectedDate, setSelectedDate]   = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [rows, setRows]                   = useState<ReportRow[]>([]);
  const [stats, setStats]                 = useState<Stats | null>(null);
  const [search, setSearch]               = useState('');
  const [loading, setLoading]             = useState(false);
  const [submitted, setSubmitted]         = useState(false);
  const tableRef = useRef<HTMLTableElement>(null);

  const handleSubmit = async () => {
    if (!selectedDate) return;
    setLoading(true); setSubmitted(true);
    try {
      const params: any = { date: selectedDate };
      if (selectedClass) params.classroom_id = selectedClass;
      const r = await axios.get('/api/reports/attendance', { params });
      setRows((r.data.data ?? []).filter((row: ReportRow) => row.status === 'absent'));
      setStats(r.data.stats ?? null);
    } catch { setRows([]); setStats(null); }
    finally { setLoading(false); }
  };

  const filtered = rows.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.class.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-full mx-auto"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
           <h2 className="text-2xl font-bold text-[#1c3068]">Absent Report</h2>
           <p className="text-gray-500 text-sm mt-1">
             View and manage daily absenteeism records and statistics.
           </p>
        </div>
        
        <div className="bg-white p-1 rounded-lg border border-gray-200 shadow-sm flex">
          {['Student', 'Teacher', 'Staff'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                activeTab === tab.toLowerCase()
                  ? 'bg-[#1c3068] text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-8">
           <h3 className="text-lg font-bold text-[#1c3068] mb-6">Report</h3>
           
           {/* Parent container with justify-between pushes the button to the far right */}
           <div className="flex flex-col md:flex-row justify-between items-end gap-6">
             
             {/* Left side: Date and Class aligned in a row */}
             <div className="flex flex-col md:flex-row gap-6 items-end flex-1">
               {/* Date Selector */}
               <div className="w-full md:w-64 space-y-2">
                 <label className="block text-sm font-bold text-[#1c3068]">
                   <span className="text-[#c53336] mr-1">*</span> Date
                 </label>
                 <input 
                   type="date" 
                   value={selectedDate}
                   onChange={(e) => setSelectedDate(e.target.value)}
                   className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-gray-700"
                 />
                 <p className="text-[10px] text-gray-400 font-medium">dd-mm-yyyy</p>
               </div>

               {/* Class Selector - Now sitting on the same row */}
               {activeTab === 'student' && (
                 <div className="w-full md:w-64 space-y-2">
                   <label className="block text-sm font-bold text-[#1c3068]">
                     <span className="text-[#c53336] mr-1">*</span> Class
                   </label>
                   <div className="relative">
                     <select 
                       value={selectedClass}
                       onChange={(e) => setSelectedClass(e.target.value)}
                       className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all appearance-none text-gray-700 cursor-pointer"
                     >
                       <option value="">Select...</option>
                       {classes.map(c => (
                         <option key={c.classroom_id} value={c.classroom_id}>{c.name}</option>
                       ))}
                     </select>
                     <ChevronDown size={16} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                   </div>
                   {/* Transparent spacer to align with the Date helper text */}
                   <p className="text-[10px] text-transparent select-none">spacer</p>
                 </div>
               )}
             </div>

             {/* Right side: Submit Button aligned most right */}
             <div className="w-full md:w-auto pb-6">
               <button onClick={handleSubmit} disabled={loading || !selectedDate} className="bg-[#1c3068] hover:bg-[#152450] text-white px-10 py-2.5 rounded-lg font-bold shadow-lg shadow-[#1c3068]/20 transition-all transform active:scale-95 min-w-[120px] disabled:opacity-50">
                 {loading ? 'Loading...' : 'Submit'}
               </button>
             </div>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
           <p className="text-gray-500 text-sm capitalize">
             {activeTab} absenteeism list
           </p>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <ExportButtons
              onCopy={() => exportCopy(filtered)}
              onExportCSV={() => exportCSV(filtered, 'absent')}
              onExportExcel={() => exportCSV(filtered, 'absent')}
              onPrint={() => exportPrint(tableRef)}
              onExportPDF={() => exportPrint(tableRef)}
            />
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm text-gray-500">Search:</span>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full sm:w-48 px-3 py-1.5 bg-white border border-gray-200 rounded text-sm focus:border-[#1c3068] outline-none transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table ref={tableRef} className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-200">
                  <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Name</th>
                  {activeTab === 'student' && (
                    <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Class</th>
                  )}
                  <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Date</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Attendance</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Time In</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider">Time Out</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={activeTab === 'student' ? 6 : 5} className="px-6 py-8 text-center text-gray-400 text-sm">
                    <div className="flex justify-center"><div className="w-6 h-6 border-2 border-[#1c3068] border-t-transparent rounded-full animate-spin" /></div>
                  </td></tr>
                ) : !submitted ? (
                  <tr><td colSpan={activeTab === 'student' ? 6 : 5} className="px-6 py-8 text-center text-gray-500 text-sm">Select a date and click Submit.</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={activeTab === 'student' ? 6 : 5} className="px-6 py-8 text-center text-gray-500 text-sm">No data available in table</td></tr>
                ) : filtered.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 border-b border-gray-100 last:border-0">
                    <td className="px-6 py-3 text-sm font-semibold text-gray-800">{row.name}</td>
                    {activeTab === 'student' && <td className="px-6 py-3 text-sm text-gray-600">{row.class}</td>}
                    <td className="px-6 py-3 text-sm text-gray-600">{row.date}</td>
                    <td className="px-6 py-3">{statusBadge(row.status)}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{row.check_in}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{row.check_out}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Restored Pagination */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
            <p className="text-sm text-gray-500">Showing {filtered.length} to {filtered.length} of {rows.length} entries</p>
            <div className="flex gap-1">
              <button className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-500 hover:bg-gray-50" disabled>Previous</button>
              <button className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-500 hover:bg-gray-50" disabled>Next</button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const PresentReport = () => {
  const classes = useClasses();
  const [activeTab, setActiveTab]         = useState('student');
  const [selectedDate, setSelectedDate]   = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [rows, setRows]                   = useState<ReportRow[]>([]);
  const [search, setSearch]               = useState('');
  const [loading, setLoading]             = useState(false);
  const [submitted, setSubmitted]         = useState(false);
  const tableRef = useRef<HTMLTableElement>(null);

  const handleSubmit = async () => {
    if (!selectedDate) return;
    setLoading(true); setSubmitted(true);
    try {
      const params: any = { date: selectedDate };
      if (selectedClass) params.classroom_id = selectedClass;
      const r = await axios.get('/api/reports/attendance', { params });
      setRows((r.data.data ?? []).filter((row: ReportRow) => row.status === 'present' || row.status === 'late'));
    } catch { setRows([]); }
    finally { setLoading(false); }
  };

  const filtered = rows.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.class.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-full mx-auto"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
           <h2 className="text-2xl font-bold text-[#1c3068]">Present Report</h2>
           <p className="text-gray-500 text-sm mt-1">
             View and manage daily presence records and statistics.
           </p>
        </div>
        
        <div className="bg-white p-1 rounded-lg border border-gray-200 shadow-sm flex">
          {['Student', 'Teacher', 'Staff'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                activeTab === tab.toLowerCase()
                  ? 'bg-white text-[#1c3068] shadow-sm ring-1 ring-gray-200'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-8">
           <h3 className="text-lg font-bold text-[#1c3068] mb-6">Report</h3>
           <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
             <div className="w-full md:w-64 space-y-2">
               <label className="block text-sm font-bold text-[#1c3068]">
                 <span className="text-[#c53336] mr-1">*</span> Date
               </label>
               <input 
                 type="date" 
                 value={selectedDate}
                 onChange={(e) => setSelectedDate(e.target.value)}
                 className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-gray-700"
               />
               <p className="text-xs text-gray-400">dd-mm-yyyy</p>
             </div>

             {activeTab === 'student' && (
               <div className="w-full md:w-64 space-y-2">
                 <label className="block text-sm font-bold text-[#1c3068]">
                   <span className="text-[#c53336] mr-1">*</span> Class
                 </label>
                 <div className="relative">
                   <select 
                     value={selectedClass}
                     onChange={(e) => setSelectedClass(e.target.value)}
                     className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all appearance-none text-gray-700"
                   >
                     <option value="">Select...</option>
                     {classes.map(c => (
                       <option key={c.classroom_id} value={c.classroom_id}>{c.name}</option>
                     ))}
                   </select>
                   <ChevronDown size={16} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                 </div>
               </div>
             )}

             <div className="mt-4 md:mt-0 md:ml-auto self-end md:self-center pt-6">
               <button onClick={handleSubmit} disabled={loading || !selectedDate} className="bg-[#1c3068] hover:bg-[#152450] text-white px-8 py-2.5 rounded-lg font-bold shadow-lg shadow-[#1c3068]/20 transition-all disabled:opacity-50">
                 {loading ? 'Loading...' : 'Submit'}
               </button>
             </div>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
           <p className="text-gray-500 text-sm">
             {activeTab === 'student' ? 'Student' : activeTab === 'teacher' ? 'Teacher' : 'Staff'} presence list on
           </p>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <ExportButtons
              onCopy={() => exportCopy(filtered)}
              onExportCSV={() => exportCSV(filtered, 'present')}
              onExportExcel={() => exportCSV(filtered, 'present')}
              onPrint={() => exportPrint(tableRef)}
              onExportPDF={() => exportPrint(tableRef)}
            />

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm text-gray-500">Search:</span>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full sm:w-48 px-3 py-1.5 bg-white border border-gray-200 rounded text-sm focus:border-[#1c3068] outline-none transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table ref={tableRef} className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-200">
                  <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Name</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">
                    {activeTab === 'student' ? 'Class' : activeTab === 'teacher' ? 'Teacher Type' : 'Staff Type'}
                  </th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Date</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Status</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider">Reason</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400 text-sm">
                    <div className="flex justify-center"><div className="w-6 h-6 border-2 border-[#1c3068] border-t-transparent rounded-full animate-spin" /></div>
                  </td></tr>
                ) : !submitted ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">Select a date and click Submit.</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">No data available in table</td></tr>
                ) : filtered.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 border-b border-gray-100 last:border-0">
                    <td className="px-6 py-3 text-sm font-semibold text-gray-800">{row.name}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{row.class}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{row.date}</td>
                    <td className="px-6 py-3">{statusBadge(row.status)}</td>
                    <td className="px-6 py-3 text-sm text-gray-400">-</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
            <p className="text-sm text-gray-500">Showing {filtered.length} to {filtered.length} of {rows.length} entries</p>
            <div className="flex gap-1">
              <button className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-500 hover:bg-gray-50" disabled>Previous</button>
              <button className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-500 hover:bg-gray-50" disabled>Next</button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const InfographicReport = () => {
  const classes = useClasses();
  const [activeTab, setActiveTab]             = useState('student');
  const [activeStatusTab, setActiveStatusTab] = useState<'absent' | 'present'>('absent');
  const [viewType, setViewType]               = useState<'date' | 'month'>('month');
  const [selectedMonth, setSelectedMonth]     = useState('');
  const [selectedDate, setSelectedDate]       = useState('');
  const [isMounted, setIsMounted]             = useState(false);
  const [chartData, setChartData]             = useState<any[]>([]);
  const [listRows, setListRows]               = useState<ReportRow[]>([]);
  const [stats, setStats]                     = useState<Stats | null>(null);
  const [search, setSearch]                   = useState('');
  const [loading, setLoading]                 = useState(false);
  const tableRef = useRef<HTMLTableElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (viewType === 'month' && selectedMonth) {
        const r = await axios.get('/api/reports/monthly', { params: { month: selectedMonth } });
        setChartData(r.data.chartData ?? []);
        setListRows(r.data.data ?? []);
        setStats(null);
      } else if (viewType === 'date' && selectedDate) {
        const r = await axios.get('/api/reports/attendance', { params: { date: selectedDate } });
        setListRows(r.data.data ?? []);
        setStats(r.data.stats ?? null);
        setChartData([]);
      }
    } catch { setChartData([]); setListRows([]); setStats(null); }
    finally { setLoading(false); }
  };

  const filteredList = listRows.filter(r => {
    const matchStatus = viewType === 'date'
      ? (activeStatusTab === 'present' ? ['present','late'].includes(r.status) : r.status === 'absent')
      : true;
    return matchStatus && r.name?.toLowerCase().includes(search.toLowerCase());
  });

  const totalPresent = stats ? stats.present + stats.late : 0;
  const totalAbsent  = stats ? stats.absent : 0;
  const total        = stats ? stats.total : 0;
  const pct          = total > 0 ? Math.round((totalPresent / total) * 1000) / 10 : 0;
  const absentPct    = total > 0 ? Math.round((totalAbsent / total) * 1000) / 10 : 0;

  const displayData = chartData.length > 0
    ? chartData.map(d => ({ name: String(d.day), present: d.present, absent: d.absent }))
    : [];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-full mx-auto"
    >
      {/* Top Header Row with Consistent Main Tab Style */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
           <h2 className="text-2xl font-bold text-[#1c3068]">Infographic Report</h2>
           <p className="text-gray-500 text-sm mt-1">View monthly attendance infographics and statistics.</p>
        </div>
        
        {/* DESIGN UPDATED: Matching Attendance Report Tab Design */}
        <div className="bg-white p-1 rounded-lg border border-gray-200 shadow-sm flex">
          {['Student', 'Teacher', 'Staff'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                activeTab === tab.toLowerCase()
                  ? 'bg-[#1c3068] text-white shadow-md' // Dark blue background for active
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Report Filter Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-8">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
             <h3 className="text-lg font-bold text-[#1c3068]">Report</h3>
             
             {/* View Type Toggle */}
             <div className="bg-white p-1 rounded-lg border border-gray-200 shadow-sm flex">
               <button
                 onClick={() => setViewType('date')}
                 className={`px-5 py-2 rounded-md text-sm font-semibold transition-all ${
                   viewType === 'date'
                     ? 'bg-[#1c3068] text-white shadow-md'
                     : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                 }`}
               >
                 By Date
               </button>
               <button
                 onClick={() => setViewType('month')}
                 className={`px-5 py-2 rounded-md text-sm font-semibold transition-all ${
                   viewType === 'month'
                     ? 'bg-[#1c3068] text-white shadow-md'
                     : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                 }`}
               >
                 By Month
               </button>
             </div>
           </div>
           
           <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
             {viewType === 'month' ? (
               <div className="w-full md:w-64 space-y-2">
                 <label className="block text-sm font-bold text-[#1c3068]"><span className="text-[#c53336] mr-1">*</span> Month</label>
                 <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#1c3068] outline-none transition-all text-gray-700" />
               </div>
             ) : (
               <div className="w-full md:w-64 space-y-2">
                 <label className="block text-sm font-bold text-[#1c3068]"><span className="text-[#c53336] mr-1">*</span> Date</label>
                 <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#1c3068] outline-none transition-all text-gray-700" />
               </div>
             )}
             <div className="mt-4 md:mt-0 md:ml-auto self-end md:self-center pt-6">
               <button onClick={handleSubmit} disabled={loading || (viewType === 'month' ? !selectedMonth : !selectedDate)} className="bg-[#1c3068] hover:bg-[#152450] text-white px-8 py-2.5 rounded-lg font-bold shadow-lg shadow-[#1c3068]/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50">
                 {loading ? 'Loading...' : 'Submit'}
               </button>
             </div>
           </div>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="bg-[#1c3068] p-4 flex items-center justify-center h-24">
             <Users size={40} className="text-white" />
          </div>
          <div className="flex border-t border-gray-100 divide-x divide-gray-100">
             <div className="flex-1 p-4 text-center">
               <p className="text-xl font-bold text-[#1c3068]">{totalPresent}</p>
               <p className="text-xs text-gray-500 uppercase tracking-wider">Present</p>
             </div>
             <div className="flex-1 p-4 text-center">
               <p className="text-xl font-bold text-[#c53336]">{totalAbsent}</p>
               <p className="text-xs text-gray-500 uppercase tracking-wider">Absent</p>
             </div>
          </div>
        </div>
        <div className="bg-[#1c3068] rounded-xl shadow-sm p-6 flex flex-col items-center justify-center text-white">
           <p className="text-4xl font-bold mb-1">{pct.toFixed(2)} %</p>
           <p className="text-sm font-medium opacity-90">Total Present</p>
        </div>
        <div className="bg-[#c53336] rounded-xl shadow-sm p-6 flex flex-col items-center justify-center text-white">
           <p className="text-4xl font-bold mb-1">{absentPct.toFixed(2)} %</p>
           <p className="text-sm font-medium opacity-90">Total Absent</p>
        </div>
      </div>

      {/* Daily Attendance Volume Chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-100">
           <h3 className="text-lg font-bold text-[#1c3068]">
             {viewType === 'month' ? 'Daily Attendance Volume' : 'Attendance Summary'}
           </h3>
           <p className="text-gray-500 text-sm mt-1">
             {viewType === 'month' 
               ? 'Daily count of present (Blue) vs absent (Red).' 
               : 'Attendance breakdown for the selected date.'}
           </p>
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
                      <Line type="monotone" dataKey="present" stroke="#1c3068" strokeWidth={3} dot={{ r: 4, fill: '#1c3068' }} name="Present" />
                      <Line type="monotone" dataKey="absent" stroke="#c53336" strokeWidth={3} dot={{ r: 4, fill: '#c53336' }} name="Absent" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <CircularProgressBar percentage={pct} total={total} present={totalPresent} absent={totalAbsent} />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* List Table with Sub-Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
           <p className="text-[#1c3068] font-bold text-lg capitalize">
             List of {activeTab} {viewType === 'month' ? 'in Month' : 'on Date'}
           </p>
           
           {/* Sub-tabs for Absent/Present */}
           <div className="bg-gray-100 p-1 rounded-lg flex">
              {(['absent', 'present'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setActiveStatusTab(status)}
                  className={`px-6 py-1.5 rounded-md text-xs font-bold transition-all capitalize ${
                    activeStatusTab === status
                      ? 'bg-white text-[#1c3068] shadow-sm'
                      : 'text-gray-500 hover:text-[#1c3068]'
                  }`}
                >
                  {status}
                </button>
              ))}
           </div>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <ExportButtons
              onCopy={() => exportCopy(filteredList)}
              onExportCSV={() => exportCSV(filteredList, 'infographic')}
              onExportExcel={() => exportCSV(filteredList, 'infographic')}
              onPrint={() => exportPrint(tableRef)}
              onExportPDF={() => exportPrint(tableRef)}
            />
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm text-gray-500">Search:</span>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} className="w-full sm:w-48 px-3 py-1.5 bg-white border border-gray-200 rounded text-sm focus:border-[#1c3068] outline-none" />
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table ref={tableRef} className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Name</th>
                  {activeTab === 'student' && (
                    <th className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Class</th>
                  )}
                  <th className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Date</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Attendance</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Time In</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Time Out</th>
                  
                  {activeStatusTab === 'present' && (
                    <>
                      <th className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Reason</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider">Location</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredList.length === 0 ? (
                  <tr>
                    <td
                      colSpan={activeStatusTab === 'present' ? (activeTab === 'student' ? 8 : 7) : (activeTab === 'student' ? 6 : 5)}
                      className="px-6 py-8 text-center text-gray-500 text-sm"
                    >
                      No data available in table
                    </td>
                  </tr>
                ) : filteredList.map((row: any, i) => (
                  <tr key={i} className="hover:bg-gray-50 border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800">{row.name}</td>
                    {activeTab === 'student' && <td className="px-4 py-3 text-sm text-gray-600">{row.class ?? '-'}</td>}
                    <td className="px-4 py-3 text-sm text-gray-600">{row.date ?? '-'}</td>
                    <td className="px-4 py-3">{row.status ? statusBadge(row.status) : '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{row.check_in ?? '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{row.check_out ?? '-'}</td>
                    {activeStatusTab === 'present' && (
                      <>
                        <td className="px-4 py-3 text-sm text-gray-400">-</td>
                        <td className="px-4 py-3 text-sm text-gray-400">-</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
            <p className="text-sm text-gray-500">Showing {filteredList.length} to {filteredList.length} of {listRows.length} entries</p>
            <div className="flex gap-1">
              <button className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-500 hover:bg-gray-50" disabled>Previous</button>
              <button className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-500 hover:bg-gray-50" disabled>Next</button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const SummaryReport = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [tableData, setTableData]       = useState<SummaryRow[]>([]);
  const [stats, setStats]               = useState<{ present: number; absent: number; total: number } | null>(null);
  const [search, setSearch]             = useState('');
  const [loading, setLoading]           = useState(false);
  const [submitted, setSubmitted]       = useState(false);
  const tableRef = useRef<HTMLTableElement>(null);

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

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-full mx-auto"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#1c3068]">Summary Report</h2>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-8">
           <h3 className="text-lg font-bold text-[#1c3068] mb-6">Report</h3>
           <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
             <div className="w-full md:w-64 space-y-2">
               <label className="block text-sm font-bold text-[#1c3068]">
                 <span className="text-[#c53336] mr-1">*</span> Date
               </label>
               <input 
                 type="date" 
                 value={selectedDate}
                 onChange={(e) => setSelectedDate(e.target.value)}
                 className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-gray-700"
               />
               <p className="text-xs text-gray-400">dd-mm-yyyy</p>
             </div>

             <div className="mt-4 md:mt-0 md:ml-auto self-end md:self-center pt-6">
               <button onClick={handleSubmit} disabled={loading || !selectedDate} className="bg-[#1c3068] hover:bg-[#152450] text-white px-8 py-2.5 rounded-lg font-bold shadow-lg shadow-[#1c3068]/20 transition-all disabled:opacity-50">
                 {loading ? 'Loading...' : 'Submit'}
               </button>
             </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="bg-[#1c3068] text-white p-4 flex items-center justify-center h-24">
             <Users size={40} />
          </div>
          <div className="flex border-t border-gray-100 divide-x divide-gray-100 bg-white">
             <div className="flex-1 p-4 text-center">
               <p className="text-xl font-bold text-[#1c3068]">{stats?.present ?? 0}</p>
               <p className="text-xs text-gray-500 uppercase tracking-wider">Present</p>
             </div>
             <div className="flex-1 p-4 text-center">
               <p className="text-xl font-bold text-[#c53336]">{stats?.absent ?? 0}</p>
               <p className="text-xs text-gray-500 uppercase tracking-wider">Absent</p>
             </div>
          </div>
        </div>

        <div className="bg-[#1c3068] rounded-xl shadow-sm p-6 flex flex-col items-center justify-center text-white h-full min-h-[140px]">
           <p className="text-4xl font-bold mb-1">{stats?.present ?? 0}</p>
           <p className="text-sm font-medium opacity-90">Total Present</p>
        </div>

        <div className="bg-[#c53336] rounded-xl shadow-sm p-6 flex flex-col items-center justify-center text-white h-full min-h-[140px]">
           <p className="text-4xl font-bold mb-1">{stats?.absent ?? 0}</p>
           <p className="text-sm font-medium opacity-90">Total Absent</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
           <p className="text-gray-500 text-sm">
             Click button above table to export to Copy, CSV, Excel, PDF & Print
           </p>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <ExportButtons
              onCopy={() => exportCopy(filtered)}
              onExportCSV={() => exportCSV(filtered, 'summary')}
              onExportExcel={() => exportCSV(filtered, 'summary')}
              onPrint={() => exportPrint(tableRef)}
              onExportPDF={() => exportPrint(tableRef)}
            />

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm text-gray-500">Search:</span>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full sm:w-48 px-3 py-1.5 bg-white border border-gray-200 rounded text-sm focus:border-[#1c3068] outline-none transition-all"
              />
            </div>
          </div>
          
          <div className="mb-4">
             <p className="text-sm font-bold text-gray-800">Date : {selectedDate}</p>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table ref={tableRef} className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-200">
                  <th className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">#</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Class Name</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Classroom Teacher</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Total Number of Students</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Present</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Present %</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Absent</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider">Absent %</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-400 text-sm">
                    <div className="flex justify-center"><div className="w-6 h-6 border-2 border-[#1c3068] border-t-transparent rounded-full animate-spin" /></div>
                  </td></tr>
                ) : !submitted ? (
                  <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-500 text-sm">Select a date and click Submit.</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-8 text-center text-gray-500 text-sm">No data available.</td></tr>
                ) : filtered.map((row, i) => (
                  <tr key={row.classroom_id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-100">{i + 1}</td>
                    <td className="px-4 py-3 text-sm text-[#c53336] font-medium border-r border-gray-100">{row.class_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-100 uppercase">{row.teacher}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-100">{row.total_students}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-100">{row.present}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-100">{row.present_pct.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-100">{row.absent}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{row.absent_pct.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
            <p className="text-sm text-gray-500">Showing 1 to {filtered.length} of {filtered.length} entries</p>
            <div className="flex gap-1">
              <button className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-500 hover:bg-gray-50" disabled>Previous</button>
              <button className="bg-[#c53336] text-white px-3 py-1 border border-[#c53336] rounded text-sm hover:bg-[#a02224]">1</button>
              <button className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-500 hover:bg-gray-50">Next</button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const CombinedAttendanceReports = () => {
  const [activeReport, setActiveReport] = useState('attendance');

  const renderReport = () => {
    switch (activeReport) {
      case 'attendance': return <AttendanceReport />;
      case 'absent': return <AbsentReport />;
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
            { id: 'attendance', label: 'Attendance Report' },
            { id: 'absent', label: 'Absent Report' },
            { id: 'infographic', label: 'Infographic Report' },
            { id: 'summary', label: 'Summary Report' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id)}
              className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                activeReport === tab.id
                  ? 'bg-[#1c3068] text-white shadow-md'
                  : 'text-gray-500 hover:text-[#1c3068] hover:bg-gray-50'
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
