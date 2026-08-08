import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronDown, X, AlertTriangle, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import axios from 'axios';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { ExportButtons } from '../../Components/dashboard/ExportButtons';

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

type Entry = {
  id: number;
  name: string;
  class: string;
  user_type: string;
  type: string;
  reason: string;
  check_in: string;
  check_out: string | null;
  status: string;
};

type SortColumn = 'name' | 'class' | 'type' | 'status' | 'check_in' | 'check_out' | null;
type SortDirection = 'asc' | 'desc';

const ManualEntry = () => {
  const [entries, setEntries]     = useState<Entry[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData]   = useState({ classId: '', ic: '', user_type: 'student', reason: '' });
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState<number | null>(null);
  
  // Filters & Sorting
  const [search, setSearch]       = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Dropdown States
  const [classes, setClasses] = useState<{classroom_id: number, name: string}[]>([]);
  const [students, setStudents] = useState<{student_id: number, name: string, ic_number: string}[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // 1. Fetch Manual Logs for the selected date
  const fetchLogs = () => {
    setLoading(true);
    axios.get('/api/attendance/log', { params: { date: selectedDate } })
      .then(res => {
        const manual = (res.data.data ?? [])
          .filter((l: any) => l.scan_method === 'manual')
          .map((l: any) => ({
            id:        l.id,
            name:      l.name,
            class:     l.class,
            user_type: l.user_type,
            type:      'Attendance Log',
            reason:    l.reason ?? '-', 
            check_in:  l.check_in ?? '-',
            check_out: l.check_out ?? null,
            status:    l.status,
          }));
        setEntries(manual);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedDate]);

  // 2. Fetch Classes for Dropdown
  useEffect(() => {
    if (showModal && classes.length === 0) {
      axios.get('/api/reports/classes')
        .then(res => setClasses(res.data.data ?? []))
        .catch(() => {});
    }
  }, [showModal]);

  // 3. Fetch Students AND Today's Logs to filter out already checked-in students
  useEffect(() => {
    if (formData.classId) {
      setLoadingStudents(true);
      const today = new Date().toISOString().split('T')[0];

      Promise.all([
        axios.get(`/api/classes/${formData.classId}/students`),
        axios.get('/api/reports/attendance', { 
            params: { date: today, classroom_id: formData.classId, type: 'student' } 
        })
      ])
      .then(([classRes, reportRes]) => {
        const allEnrolled = classRes.data.enrolled ?? [];
        const reportData = reportRes.data.data ?? [];
        
        const checkedInIds = reportData
            .filter((r: any) => r.status === 'present' || r.status === 'late')
            .map((r: any) => r.student_id);

        const absentStudents = allEnrolled.filter((s: any) => !checkedInIds.includes(s.student_id));
        setStudents(absentStudents);
      })
      .catch(() => setStudents([]))
      .finally(() => setLoadingStudents(false));
    } else {
      setStudents([]);
    }
    setFormData(prev => ({ ...prev, ic: '' }));
  }, [formData.classId]);

  const handleAdd = async () => {
    if (!formData.ic || !formData.reason) {
      setError('Please select a student and provide a reason.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('/api/attendance/manual-check-in', {
        ic_number: formData.ic, 
        user_type: formData.user_type,
        reason:    formData.reason,
      });
      
      // If the selected date is today, refresh the table so it appears immediately
      const today = new Date().toISOString().split('T')[0];
      if (selectedDate === today) {
         fetchLogs();
      }
      
      setStudents(prev => prev.filter(s => s.ic_number !== formData.ic));
      setShowModal(false);
      setFormData({ classId: '', ic: '', user_type: 'student', reason: '' });
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async (id: number) => {
    setCheckingOut(id);
    try {
      const res = await axios.post(`/api/attendance/manual-check-out/${id}`);
      setEntries(prev => prev.map(e => e.id === id ? { ...e, check_out: res.data.check_out } : e));
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Check-out failed.');
    } finally {
      setCheckingOut(null);
    }
  };

  // --- Filtering & Sorting ---
  const filtered = entries.filter(e => e.name.toLowerCase().includes(search.toLowerCase()));

  const sortedData = [...filtered].sort((a, b) => {
    if (!sortColumn) return 0;
    const aVal = a[sortColumn] || '';
    const bVal = b[sortColumn] || '';
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const { currentPage, setCurrentPage, totalPages, startIndex, endIndex, currentData, totalItems } = usePagination(sortedData, 10);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) return <ArrowUpDown size={14} className="text-gray-300 ml-1 inline-block" />;
    return sortDirection === 'asc' ? (
      <ArrowUp size={14} className="text-[#2f4fa8] ml-1 inline-block" />
    ) : (
      <ArrowDown size={14} className="text-[#2f4fa8] ml-1 inline-block" />
    );
  };

  // --- EXPORT FUNCTIONS ---
  const handleCopy = async () => {
    if (sortedData.length === 0) return;
    const text = ['No\tName\tClass\tType\tStatus\tReason\tTime In\tTime Out', ...sortedData.map((e, i) => `${i + 1}\t${e.name}\t${e.class}\t${e.type}\t${e.status}\t${e.reason}\t${e.check_in}\t${e.check_out || '-'}`)].join('\n');
    navigator.clipboard.writeText(text).then(() => alert('Copied to clipboard!'));
  };

  const handleExportCSV = () => {
    if (sortedData.length === 0) return;
    const csv = ['No,Name,Class,Type,Status,Reason,Time In,Time Out', ...sortedData.map((e, i) => `${i + 1},"${e.name}","${e.class}","${e.type}","${e.status}","${e.reason}","${e.check_in}","${e.check_out || '-'}"`)].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `manual_entry_${selectedDate}.csv`;
    a.click();
  };

  const handleExportExcel = () => {
    if (sortedData.length === 0) return;
    const table = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"></head><body><table border="1"><thead><tr style="background-color:#2f4fa8;color:white;"><th>No</th><th>Name</th><th>Class</th><th>Type</th><th>Status</th><th>Reason</th><th>Time In</th><th>Time Out</th></tr></thead><tbody>${sortedData.map((e, i) => `<tr><td>${i + 1}</td><td>${e.name}</td><td>${e.class}</td><td>${e.type}</td><td>${e.status}</td><td>${e.reason}</td><td>${e.check_in}</td><td>${e.check_out || '-'}</td></tr>`).join('')}</tbody></table></body></html>`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([table], { type: 'application/vnd.ms-excel' }));
    a.download = `manual_entry_${selectedDate}.xls`;
    a.click();
  };

  const handleExportPDF = () => {
    if (sortedData.length === 0) return;
    const rows = sortedData.map((e, i) => `<tr><td style="text-align:center">${i + 1}</td><td style="font-weight:bold">${e.name}</td><td style="text-align:center">${e.class}</td><td style="text-align:center">${e.type}</td><td style="text-align:center;text-transform:capitalize">${e.status}</td><td style="text-align:center">${e.reason}</td><td style="text-align:center">${e.check_in}</td><td style="text-align:center">${e.check_out || '-'}</td></tr>`).join('');
    const html = `<!DOCTYPE html><html><head><title>Manual Entry Report</title><style>@page{margin:15mm;size:A4 landscape;}body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;font-size:11px;color:#333;margin:0;padding:0;}.header-container{text-align:center;margin-bottom:30px;padding-bottom:20px;border-bottom:3px solid #2f4fa8;}.logo{max-height:80px;margin-bottom:15px;width:auto;}.report-title{color:#2f4fa8;font-size:24px;font-weight:900;margin:0;text-transform:uppercase;letter-spacing:1.5px;}.report-meta{color:#6b7280;font-size:11px;margin-top:8px;font-weight:bold;text-transform:uppercase;}table{width:100%;border-collapse:collapse;font-size:11px;margin-top:10px;}th,td{padding:10px 8px;border-bottom:1px solid #e5e7eb;}th{background-color:#2f4fa8!important;color:white!important;font-weight:bold;text-align:center;-webkit-print-color-adjust:exact;print-color-adjust:exact;}th:nth-child(2){text-align:left;}tr:nth-child(even){background-color:#f9fafb!important;-webkit-print-color-adjust:exact;print-color-adjust:exact;}</style></head><body><div class="header-container"><img src="${logo}" class="logo" alt="School Logo" /><h1 class="report-title">Manual Entry Report</h1><p class="report-meta">Date: ${selectedDate} &nbsp;&bull;&nbsp; I-HADIR System</p></div><table><thead><tr><th style="width:5%">No</th><th style="width:25%">Name</th><th style="width:15%">Class</th><th style="width:10%">Type</th><th style="width:10%">Status</th><th style="width:15%">Reason</th><th style="width:10%">Time In</th><th style="width:10%">Time Out</th></tr></thead><tbody>${rows}</tbody></table><script>window.onload=function(){setTimeout(function(){window.print();},300);}</script></body></html>`;
    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); }
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-full mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#2f4fa8]">Manual Entry</h2>
        <button onClick={() => { setShowModal(true); setError(null); }} className="bg-[#2f4fa8] hover:bg-[#264190] text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2">
          <Plus size={18} /> Manual Check In
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/50">
          <p className="text-gray-500 text-sm font-semibold">Manual Attendance Logs</p>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
             <div className="relative w-full sm:w-auto">
               <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-[#2f4fa8] outline-none transition-all text-gray-600" />
             </div>
             <div className="relative w-full sm:w-56">
               <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
               <input type="text" placeholder="Search name..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} className="w-full pl-10 pr-4 py-2 bg-white focus:bg-white border border-gray-200 rounded-lg text-sm focus:border-[#2f4fa8] focus:ring-2 focus:ring-[#2f4fa8]/10 outline-none transition-all" />
             </div>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-4">
             <ExportButtons onCopy={handleCopy} onExportCSV={handleExportCSV} onExportExcel={handleExportExcel} onExportPDF={handleExportPDF} onPrint={handleExportPDF} />
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">#</th>
                  <th onClick={() => handleSort('name')} className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 group">Name <SortIcon column="name" /></th>
                  <th onClick={() => handleSort('class')} className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 group">Class <SortIcon column="class" /></th>
                  <th onClick={() => handleSort('type')} className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 group">Type <SortIcon column="type" /></th>
                  <th onClick={() => handleSort('status')} className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 group">Status <SortIcon column="status" /></th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Reason</th>
                  <th onClick={() => handleSort('check_in')} className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center cursor-pointer hover:bg-gray-100 group">Time In <SortIcon column="check_in" /></th>
                  <th onClick={() => handleSort('check_out')} className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center cursor-pointer hover:bg-gray-100 group">Time Out <SortIcon column="check_out" /></th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentData.map((entry, idx) => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 text-sm text-gray-500 text-center">{startIndex + idx + 1}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-800">{entry.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{entry.class}</td>
                    <td className="px-6 py-4 text-sm font-medium text-[#2f4fa8]">{entry.type}</td>
                    <td className="px-6 py-4 text-sm capitalize">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                         entry.status === 'present' ? 'bg-green-50 text-green-600 border-green-100' :
                         entry.status === 'late' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                         'bg-red-50 text-red-600 border-red-100'
                      }`}>
                         {entry.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{entry.reason || '-'}</td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-600 text-center">{entry.check_in}</td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-600 text-center">{entry.check_out || '-'}</td>
                    <td className="px-6 py-4 text-right">
                      {!entry.check_out ? (
                        <button
                          onClick={() => handleCheckOut(entry.id)}
                          disabled={checkingOut === entry.id}
                          className="bg-[#2f4fa8] text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-[#264190] transition-colors disabled:opacity-50"
                        >
                          {checkingOut === entry.id ? '...' : 'Check Out'}
                        </button>
                      ) : (
                        <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded border border-green-100">Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
                {currentData.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
                      No manual entries match your criteria.
                    </td>
                  </tr>
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

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white rounded-2xl shadow-xl w-full max-w-2xl relative z-10 overflow-hidden">
              <div className="bg-[#fcfafa] px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                <div><h3 className="text-xl font-bold text-[#2f4fa8]">Manual Check In</h3><p className="text-gray-500 text-sm">Please select a student and provide a reason</p></div>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
              </div>

              <div className="p-8 space-y-6">
                {error && (
                  <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <AlertTriangle size={16} className="text-red-500 shrink-0" /><p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Class Selection */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-sm font-bold text-[#2f4fa8]"><span className="text-[#c53336] mr-1">*</span> Class</label>
                    <div className="relative">
                      <select value={formData.classId} onChange={(e) => setFormData({ ...formData, classId: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#2f4fa8] focus:ring-2 focus:ring-[#2f4fa8]/10 outline-none transition-all appearance-none text-gray-700 cursor-pointer">
                        <option value="">Select a class...</option>
                        {classes.map(c => (<option key={c.classroom_id} value={c.classroom_id}>{c.name}</option>))}
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Student Selection */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-sm font-bold text-[#2f4fa8]"><span className="text-[#c53336] mr-1">*</span> Student Name</label>
                    <div className="relative">
                      <select value={formData.ic} onChange={(e) => setFormData({ ...formData, ic: e.target.value })} disabled={!formData.classId || loadingStudents || students.length === 0} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#2f4fa8] focus:ring-2 focus:ring-[#2f4fa8]/10 outline-none transition-all appearance-none text-gray-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                        <option value="">{loadingStudents ? 'Loading students...' : (formData.classId && students.length === 0 ? 'All students have checked in' : 'Select a student...')}</option>
                        {students.map(s => (<option key={s.student_id} value={s.ic_number}>{s.name}</option>))}
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* User Type (Locked) */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-sm font-bold text-[#2f4fa8]"><span className="text-[#c53336] mr-1">*</span> User Type</label>
                    <div className="relative">
                      <input type="text" value="Student" readOnly className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-gray-200 outline-none text-gray-500 cursor-not-allowed" />
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-sm font-bold text-[#2f4fa8]"><span className="text-[#c53336] mr-1">*</span> Reason</label>
                    <input type="text" value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} placeholder="e.g. Forgot ID Card, System Error, etc." className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#2f4fa8] focus:ring-2 focus:ring-[#2f4fa8]/10 outline-none transition-all text-gray-700" />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                  <button onClick={() => setShowModal(false)} className="px-6 py-2.5 rounded-lg font-bold text-gray-500 hover:bg-gray-100 transition-colors">Cancel</button>
                  <button onClick={handleAdd} disabled={loading || students.length === 0} className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white px-8 py-2.5 rounded-lg font-bold shadow-lg shadow-blue-500/20 transition-all transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50">{loading ? 'Saving...' : 'Save'}</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default function ManualEntryPage() {
  return (
    <DashboardLayout activePageId="manual-entry">
      <ManualEntry />
    </DashboardLayout>
  );
}