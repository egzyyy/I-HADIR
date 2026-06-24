import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar, ChevronDown, ChevronRight, Users, Trash2, Phone, Clock } from 'lucide-react';
import axios from 'axios';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { ExportButtons } from '../../Components/dashboard/ExportButtons';
import { DeleteConfirmationModal } from '../../Components/modals/DeleteConfirmationModal';
import { useAuth } from '../../contexts/AuthContext';

// IMPORT PAGINATION
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
import logo from '../../assets/i_hadir_logo2.png';

axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// ─── Shared Export Helpers ───────────────────────────────────────────────────
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

function generateStandardPDF(title: string, theadHtml: string, tbodyHtml: string, logoSrc: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        @page { margin: 15mm; size: A4 landscape; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11px; color: #333; margin: 0; padding: 0; }
        .header-container { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #1c3068; }
        .logo { max-height: 80px; margin-bottom: 15px; width: auto; }
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
        <img src="${logoSrc}" class="logo" alt="School Logo" />
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

// ─── 1. Facility / RMT Report ─────────────────────────────────────────────────
const FacilityReport = ({ fixedFacility }: { fixedFacility?: string }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedFacility, setSelectedFacility] = useState(fixedFacility ?? '');
  const [selectedClass, setSelectedClass] = useState('');
  
  const [classes, setClasses] = useState<{classroom_id: number, name: string}[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);
  const [stats, setStats] = useState({ present: 0, absent: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    axios.get('/api/reports/classes').then(res => setClasses(res.data.data ?? []));
    console.log(classes);
  }, []);

  const handleSubmit = async () => {
    if (!selectedFacility || !selectedDate) return;
    setLoading(true);
    setSubmitted(true);
    try {
      const res = await axios.get('/api/reports/facility', {
        params: { date: selectedDate, facility_type: selectedFacility, classroom_id: selectedClass }
      });
      setTableData(res.data.data ?? []);
      setStats(res.data.stats ?? { present: 0, absent: 0 });
    } catch (err) {
      setTableData([]);
      setStats({ present: 0, absent: 0 });
    } finally {
      setLoading(false);
    }
  };

  const filtered = tableData.filter(r => 
    (r.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (r.class || '').toLowerCase().includes(search.toLowerCase())
  );

  const { currentPage, setCurrentPage, totalPages, startIndex, endIndex, currentData, totalItems } = usePagination(filtered, 10);

  const handleCopy = () => {
    if (!filtered.length) return;
    const text = ['Name\tClass\tDate\tTime In\tTime Out\tStatus', ...filtered.map(r => `${r.name}\t${r.class}\t${r.date}\t${r.time_in}\t${r.time_out}\t${r.status}`)].join('\n');
    exportCopy(text);
  };

  const handleExportPDF = () => {
    if (!filtered.length) return;
    const title = `${selectedFacility === 'rmt' ? 'RMT' : selectedFacility} Report (${selectedDate})`;
    const thead = `<tr><th style="width:5%">No</th><th style="width:30%">Name</th><th style="width:20%">Class</th><th style="width:15%">Date</th><th style="width:10%">Time In</th><th style="width:10%">Time Out</th><th style="width:10%">Status</th></tr>`;
    const tbody = filtered.map((r, i) => `<tr><td style="text-align:center">${i + 1}</td><td style="font-weight:bold">${r.name}</td><td style="text-align:center">${r.class}</td><td style="text-align:center">${r.date}</td><td style="text-align:center">${r.time_in}</td><td style="text-align:center">${r.time_out}</td><td style="text-align:center; text-transform:capitalize">${r.status}</td></tr>`).join('');
    generateStandardPDF(title, thead, tbody, logo);
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-full mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#1c3068]">
          {selectedFacility ? `${selectedFacility === 'rmt' ? 'RMT' : selectedFacility} Report` : 'Facility Report'}
        </h2>
        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
           <span>Home</span><ChevronRight size={14} />
           <span className="text-[#1c3068] font-medium capitalize">
             {selectedFacility ? `${selectedFacility === 'rmt' ? 'RMT' : selectedFacility} Report` : 'Facility Report'}
           </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-8">
           <h3 className="text-lg font-bold text-[#1c3068] mb-6">Report Filter</h3>
           <div className="flex flex-col gap-6">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="space-y-2">
                 <label className="block text-sm font-bold text-[#1c3068]"><span className="text-[#c53336] mr-1">*</span> Facility</label>
                 <div className="relative">
                   {fixedFacility ? (
                     <input type="text" value={fixedFacility === 'rmt' ? 'RMT' : fixedFacility} readOnly className="w-full px-4 py-2.5 rounded-lg bg-gray-100 border border-gray-200 outline-none text-gray-500 cursor-not-allowed uppercase" />
                   ) : (
                     <>
                       <select value={selectedFacility} onChange={(e) => setSelectedFacility(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all appearance-none text-gray-700">
                         <option value="">Select Facility...</option>
                         <option value="prayer">Prayer</option>
                         <option value="pss">PSS</option>
                         <option value="ict">ICT</option>
                       </select>
                       <ChevronDown size={16} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                     </>
                   )}
                 </div>
               </div>

               <div className="space-y-2">
                 <label className="block text-sm font-bold text-[#1c3068]"><span className="text-[#c53336] mr-1">*</span> Date</label>
                 <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-gray-700" />
               </div>

               <div className="space-y-2">
                 <label className="block text-sm font-bold text-[#1c3068]">Class Filter (Optional)</label>
                 <div className="relative">
                   <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all appearance-none text-gray-700">
                     <option value="">All Scanned Users</option>
                     {classes.map(c => <option key={c.classroom_id} value={c.classroom_id}>{c.name}</option>)}
                   </select>
                   <ChevronDown size={16} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                 </div>
               </div>
             </div>

             <div className="flex justify-end pt-2">
               <button onClick={handleSubmit} disabled={loading || !selectedFacility || !selectedDate} className="bg-[#1c3068] hover:bg-[#152450] text-white px-8 py-2.5 rounded-lg font-bold shadow-lg shadow-[#1c3068]/20 transition-all disabled:opacity-50">
                 {loading ? 'Generating...' : 'Submit'}
               </button>
             </div>
           </div>
        </div>
      </div>

      {submitted && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
              <div className="bg-[#1c3068] text-white p-4 flex items-center justify-center h-24"><Users size={40} /></div>
              <div className="flex border-t border-gray-100 divide-x divide-gray-100 bg-white">
                 <div className="flex-1 p-4 text-center">
                   <p className="text-xl font-bold text-[#1c3068]">{stats.present}</p>
                   <p className="text-xs text-gray-500 uppercase tracking-wider">Present</p>
                 </div>
                 {selectedClass && (
                   <div className="flex-1 p-4 text-center">
                     <p className="text-xl font-bold text-[#c53336]">{stats.absent}</p>
                     <p className="text-xs text-gray-500 uppercase tracking-wider">Absent</p>
                   </div>
                 )}
              </div>
            </div>

            <div className="bg-[#1c3068] rounded-xl shadow-sm p-6 flex flex-col items-center justify-center text-white h-full min-h-[140px]">
               <p className="text-4xl font-bold mb-1">{stats.present}</p>
               <p className="text-sm font-medium opacity-90">Total Present</p>
            </div>

            {selectedClass && (
              <div className="bg-[#c53336] rounded-xl shadow-sm p-6 flex flex-col items-center justify-center text-white h-full min-h-[140px]">
                 <p className="text-4xl font-bold mb-1">{stats.absent}</p>
                 <p className="text-sm font-medium opacity-90">Total Absent</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
               <p className="text-gray-500 text-sm">Attendance list on {selectedDate}</p>
            </div>
            
            <div className="p-6">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                <ExportButtons 
                  onCopy={handleCopy} 
                  onExportCSV={() => exportCSV(filtered, 'facility_report')} 
                  onExportExcel={() => exportCSV(filtered, 'facility_report')} 
                  onExportPDF={handleExportPDF} 
                  onPrint={handleExportPDF} 
                />

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-sm text-gray-500">Search:</span>
                  <input type="text" value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} className="w-full sm:w-48 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded text-sm focus:border-[#1c3068] outline-none transition-all" />
                </div>
              </div>

              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center w-12">#</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Name</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Class/Role</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Date</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Status</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Time In</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider">Time Out</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentData.length > 0 ? (
                      currentData.map((row, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-4 text-sm text-gray-500 text-center">{startIndex + index + 1}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-800 border-r border-gray-100">{row.name}</td>
                          <td className="px-4 py-4 text-sm text-gray-600 border-r border-gray-100">{row.class}</td>
                          <td className="px-4 py-4 text-sm text-gray-600 border-r border-gray-100">
                            <span className="flex items-center gap-1"><Calendar size={14} className="text-[#c53336]" /> {row.date}</span>
                          </td>
                          <td className="px-4 py-4 text-sm border-r border-gray-100">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${row.status === 'present' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600 border-r border-gray-100">{row.time_in}</td>
                          <td className="px-4 py-4 text-sm text-gray-600">{row.time_out}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500 text-sm">No records found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

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
        </>
      )}
    </motion.div>
  );
};

// ─── 2. Activity / Event Report ───────────────────────────────────────────────
const ActivityReport = () => {
  const [events, setEvents] = useState<{id: number, name: string, date: string}[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [tableData, setTableData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    axios.get('/api/reports/events').then(res => setEvents(res.data.data ?? []));
  }, []);

  const handleSubmit = async () => {
    if (!selectedEventId) return;
    setLoading(true);
    try {
      const res = await axios.get('/api/reports/event-attendance', { params: { event_id: selectedEventId } });
      setTableData(res.data.data ?? []);
    } catch {
      setTableData([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = tableData.filter(r => (r.name || '').toLowerCase().includes(search.toLowerCase()));
  const { currentPage, setCurrentPage, totalPages, startIndex, endIndex, currentData, totalItems } = usePagination(filtered, 10);

  const selectedEventName = events.find(e => e.id === Number(selectedEventId))?.name || 'Selected Event';

  const handleCopy = () => {
    if (!filtered.length) return;
    const text = ['Name\tClass\tDate\tTime In\tTime Out', ...filtered.map(r => `${r.name}\t${r.class}\t${r.date}\t${r.time_in}\t${r.time_out}`)].join('\n');
    exportCopy(text);
  };

  const handleExportPDF = () => {
    if (!filtered.length) return;
    const title = `Event Report (${selectedEventName})`;
    const thead = `<tr><th style="width:5%">No</th><th style="width:30%">Name</th><th style="width:20%">Class</th><th style="width:15%">Date</th><th style="width:15%">Time In</th><th style="width:15%">Time Out</th></tr>`;
    const tbody = filtered.map((r, i) => `<tr><td style="text-align:center">${i + 1}</td><td style="font-weight:bold">${r.name}</td><td style="text-align:center">${r.class}</td><td style="text-align:center">${r.date}</td><td style="text-align:center">${r.time_in}</td><td style="text-align:center">${r.time_out}</td></tr>`).join('');
    generateStandardPDF(title, thead, tbody, logo);
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-full mx-auto">
      <div className="mb-6"><h2 className="text-2xl font-bold text-[#1c3068]">Activity / Event Report</h2></div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-8">
           <h3 className="text-lg font-bold text-[#1c3068] mb-6">Report Filter</h3>
           <div className="flex flex-col gap-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                 <label className="block text-sm font-bold text-[#1c3068]"><span className="text-[#c53336] mr-1">*</span> Event Name</label>
                 <div className="relative">
                   <select value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all appearance-none text-gray-700 cursor-pointer">
                     <option value="">Select Event...</option>
                     {events.map(e => <option key={e.id} value={e.id}>{e.name} ({e.date})</option>)}
                   </select>
                   <ChevronDown size={16} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                 </div>
               </div>
             </div>
             <div className="flex justify-end pt-2">
               <button onClick={handleSubmit} disabled={loading || !selectedEventId} className="bg-[#1c3068] hover:bg-[#152450] text-white px-8 py-2.5 rounded-lg font-bold shadow-lg shadow-[#1c3068]/20 transition-all disabled:opacity-50">
                 {loading ? 'Generating...' : 'Submit'}
               </button>
             </div>
           </div>
        </div>
      </div>

      {selectedEventId && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
             <p className="text-[#1c3068] font-semibold text-lg">Attendance list for {selectedEventName}</p>
          </div>
          
          <div className="p-6">
             <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
               <ExportButtons onCopy={handleCopy} onExportCSV={() => exportCSV(filtered, 'event')} onExportExcel={() => exportCSV(filtered, 'event')} onExportPDF={handleExportPDF} onPrint={handleExportPDF} />
               <div className="flex items-center gap-2 w-full sm:w-auto">
                 <span className="text-sm text-gray-500">Search:</span>
                 <input type="text" value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} className="w-full sm:w-48 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded text-sm focus:border-[#1c3068] outline-none" />
               </div>
             </div>

             <div className="overflow-x-auto border border-gray-200 rounded-lg">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center w-12">#</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Name</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Class</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Date</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Time In</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider">Time Out</th>
                   </tr>
                 </thead>
                 <tbody>
                    {currentData.length > 0 ? (
                      currentData.map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50/50 transition-colors border-b border-gray-100 last:border-0">
                          <td className="px-4 py-4 text-sm text-gray-500 text-center">{startIndex + index + 1}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-800 border-r border-gray-100">{row.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-600 border-r border-gray-100"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">{row.class}</span></td>
                          <td className="px-6 py-4 text-sm text-gray-600 border-r border-gray-100"><div className="flex items-center gap-2"><Calendar size={14} className="text-[#c53336]" />{row.date}</div></td>
                          <td className="px-6 py-4 text-sm text-gray-600 border-r border-gray-100"><span className="text-green-600 font-medium bg-green-50 px-2 py-1 rounded border border-green-100 inline-block text-xs">{row.time_in}</span></td>
                          <td className="px-6 py-4 text-sm text-gray-600"><span className="text-red-500 font-medium bg-red-50 px-2 py-1 rounded border border-red-100 inline-block text-xs">{row.time_out}</span></td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500 text-sm">No records available yet. Feature pending.</td></tr>
                    )}
                 </tbody>
               </table>
             </div>

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
      )}
    </motion.div>
  );
};

// ─── 3. Visitor Report ───────────────────────────────────────────────────────
const VisitorReport = () => {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  
  const [activeMonth, setActiveMonth] = useState(currentMonth);
  const [visitorList, setVisitorList] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<any>(null);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  useEffect(() => {
    axios.get('/api/reports/visitors', { params: { month: activeMonth, year: currentYear } })
      .then(res => setVisitorList(res.data.data ?? []))
      .catch(() => setVisitorList([]));
  }, [activeMonth, currentYear]);

  const filtered = visitorList.filter(v => 
    (v.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (v.dept || '').toLowerCase().includes(search.toLowerCase())
  );

  const { currentPage, setCurrentPage, totalPages, startIndex, endIndex, currentData, totalItems } = usePagination(filtered, 10);

  const handleDeleteClick = (visitor: any) => {
    setSelectedVisitor(visitor);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    // In a real scenario, you'd send a DELETE request here.
    setVisitorList(prev => prev.filter(v => v.id !== selectedVisitor.id));
    setIsDeleteModalOpen(false);
    setSelectedVisitor(null);
  };

  const handleCopy = () => {
    if (!filtered.length) return;
    const text = ['Name\tPhone\tDepartment\tNote\tDate\tTime', ...filtered.map(r => `${r.name}\t${r.phone}\t${r.dept}\t${r.note}\t${r.date}\t${r.time}`)].join('\n');
    exportCopy(text);
  };

  const handleExportPDF = () => {
    if (!filtered.length) return;
    const title = `Visitor Report (${monthNames[activeMonth - 1]} ${currentYear})`;
    const thead = `<tr><th style="width:5%">No</th><th style="width:25%">Name</th><th style="width:15%">Phone</th><th style="width:15%">Department</th><th style="width:20%">Note</th><th style="width:10%">Date</th><th style="width:10%">Time</th></tr>`;
    const tbody = filtered.map((r, i) => `<tr><td style="text-align:center">${i + 1}</td><td style="font-weight:bold">${r.name}</td><td style="text-align:center">${r.phone}</td><td style="text-align:center">${r.dept}</td><td>${r.note}</td><td style="text-align:center">${r.date}</td><td style="text-align:center">${r.time}</td></tr>`).join('');
    generateStandardPDF(title, thead, tbody, logo);
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-full mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#1c3068]">Visitor List</h2>
          <p className="text-gray-500 text-sm mt-1">Click the <span className="text-[#c53336] font-medium">month</span> tab below to display the list.</p>
        </div>

        {/* Month Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 mb-6 overflow-x-auto">
          <div className="flex space-x-2 min-w-max">
            {months.map((month) => (
              <button
                key={month}
                onClick={() => { setActiveMonth(month); setCurrentPage(1); }}
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-all duration-200 
                  ${activeMonth === month ? 'bg-[#c53336] text-white shadow-md shadow-red-200 scale-105' : 'text-gray-500 hover:bg-gray-100 hover:text-[#1c3068]'}`}
              >
                {month}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
             <p className="text-[#1c3068] font-semibold text-lg">
               Visitor list for {monthNames[activeMonth - 1]} {currentYear}
             </p>
          </div>
          
          <div className="p-6">
             <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                <ExportButtons onCopy={handleCopy} onExportCSV={() => exportCSV(filtered, 'visitor')} onExportExcel={() => exportCSV(filtered, 'visitor')} onExportPDF={handleExportPDF} onPrint={handleExportPDF} />
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-sm text-gray-500">Search:</span>
                  <div className="relative w-full sm:w-64">
                    <input 
                      type="text" 
                      value={search}
                      onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                      className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded text-sm focus:border-[#1c3068] outline-none transition-all"
                      placeholder="Type to search..."
                    />
                  </div>
                </div>
             </div>

             <div className="overflow-x-auto border border-gray-200 rounded-lg">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100 w-12 text-center">#</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Name / Phone</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Meeting With</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Note</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Date / Time</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider text-center">Action</th>
                   </tr>
                 </thead>
                 <tbody>
                   {currentData.length > 0 ? currentData.map((visitor, idx) => (
                     <tr key={visitor.id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-100 last:border-0">
                       <td className="px-4 py-4 text-sm text-gray-500 text-center border-r border-gray-100 font-mono">{startIndex + idx + 1}</td>
                       <td className="px-6 py-4 text-sm border-r border-gray-100">
                         <div className="flex flex-col">
                            <span className="font-bold text-[#1c3068] text-sm md:text-base">{visitor.name}</span>
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                               <Phone size={12} /><span>{visitor.phone}</span>
                            </div>
                         </div>
                       </td>
                       <td className="px-6 py-4 text-sm border-r border-gray-100">
                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                           {visitor.dept}
                         </span>
                       </td>
                       <td className="px-6 py-4 text-sm text-gray-600 border-r border-gray-100 max-w-xs truncate" title={visitor.note}>
                         {visitor.note}
                       </td>
                       <td className="px-6 py-4 text-sm border-r border-gray-100">
                         <div className="flex flex-col text-xs text-gray-500">
                            <span className="flex items-center gap-1"><Calendar size={12} className="text-[#c53336]" /> {visitor.date}</span>
                            <span className="flex items-center gap-1 mt-0.5"><Clock size={12} className="text-[#1c3068]" /> {visitor.time}</span>
                         </div>
                       </td>
                       <td className="px-6 py-4 text-center">
                         <div className="flex justify-center">
                           <button onClick={() => handleDeleteClick(visitor)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-[#c53336] hover:text-white transition-all shadow-sm border border-red-100 hover:border-[#c53336]" title="Delete">
                              <Trash2 size={16} />
                           </button>
                         </div>
                       </td>
                     </tr>
                   )) : (
                     <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500 text-sm">No visitor records found.</td></tr>
                   )}
                 </tbody>
               </table>
             </div>
             
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

      <AnimatePresence>
        {isDeleteModalOpen && (
          <DeleteConfirmationModal 
            isOpen={isDeleteModalOpen} 
            onClose={() => setIsDeleteModalOpen(false)} 
            onConfirm={handleConfirmDelete} 
            itemName={selectedVisitor?.name} 
            title="Remove Visitor?" 
            message="Are you sure you want to remove this visitor log?"
          />
        )}
      </AnimatePresence>
    </>
  );
};

// ─── Main Controller ──────────────────────────────────────────────────────────
const GeneralReport = () => {
  const { role } = useAuth();
  const canSeeVisitor = role === 'Admin' || role === 'Security';

  const [activeReport, setActiveReport] = useState('facility');

  const tabs = [
    { id: 'facility', label: 'Facility Report' },
    { id: 'activity', label: 'Activity Report' },
    { id: 'rmt', label: 'RMT Report' },
    ...(canSeeVisitor ? [{ id: 'visitor', label: 'Visitor Report' }] : []),
  ];

  const renderReport = () => {
    switch (activeReport) {
      case 'facility': return <FacilityReport />;
      case 'activity': return <ActivityReport />;
      case 'rmt': return <FacilityReport fixedFacility="rmt" />;
      case 'visitor': return canSeeVisitor ? <VisitorReport /> : <FacilityReport />;
      default: return <FacilityReport />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 overflow-x-auto">
        <div className="flex space-x-2 min-w-max">
          {tabs.map((tab) => (
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

export default function GeneralReportPage() {
  return (
    <DashboardLayout activePageId="general-report">
      <GeneralReport />
    </DashboardLayout>
  );
}