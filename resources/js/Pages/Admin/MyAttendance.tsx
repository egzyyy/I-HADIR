import React, { useEffect, useState } from 'react';
import { Home, Calendar, X } from 'lucide-react';
import { motion } from 'motion/react';
import axios from 'axios';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { ExportButtons } from '../../Components/dashboard/ExportButtons';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../assets/i_hadir_logo2.png';

type LogEntry = {
  id: number;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  scan_method: string;
  shift?: string | null;
};

const statusBadgeClass = (status: string) => {
  const map: Record<string, string> = {
    present: 'bg-green-50 text-green-600 border-green-100',
    late: 'bg-yellow-50 text-yellow-600 border-yellow-100',
    absent: 'bg-red-50 text-red-600 border-red-100',
  };
  return map[status] ?? 'bg-gray-50 text-gray-600 border-gray-100';
};

function MyAttendanceContent() {
  const { role } = useAuth();
  const showShiftColumn = role === 'Security';
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const fetchLogs = () => {
    setLoading(true);
    axios.get('/api/attendance/my-log', { params: { from: from || undefined, to: to || undefined } })
      .then((res) => { setLogs(res.data.data ?? []); setErrorMsg(null); })
      .catch((err) => { setLogs([]); setErrorMsg(err.response?.data?.message ?? 'Failed to load your attendance record.'); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLogs(); }, [from, to]);

  const clearFilters = () => { setFrom(''); setTo(''); };

  // ─── Export helpers (same conventions as ManualEntry.tsx) ─────────────────
  const handleCopy = () => {
    if (logs.length === 0) return;
    const text = ['No\tDate\tTime In\tTime Out\tStatus', ...logs.map((l, i) => `${i + 1}\t${l.date}\t${l.check_in ?? '-'}\t${l.check_out ?? '-'}\t${l.status}`)].join('\n');
    navigator.clipboard.writeText(text).then(() => alert('Copied to clipboard!'));
  };

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const csv = ['No,Date,Time In,Time Out,Status', ...logs.map((l, i) => `${i + 1},"${l.date}","${l.check_in ?? '-'}","${l.check_out ?? '-'}","${l.status}"`)].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `my_attendance_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleExportExcel = () => {
    if (logs.length === 0) return;
    const table = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"></head><body><table border="1"><thead><tr style="background-color:#2f4fa8;color:white;"><th>No</th><th>Date</th><th>Time In</th><th>Time Out</th><th>Status</th></tr></thead><tbody>${logs.map((l, i) => `<tr><td>${i + 1}</td><td>${l.date}</td><td>${l.check_in ?? '-'}</td><td>${l.check_out ?? '-'}</td><td>${l.status}</td></tr>`).join('')}</tbody></table></body></html>`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([table], { type: 'application/vnd.ms-excel' }));
    a.download = `my_attendance_${new Date().toISOString().split('T')[0]}.xls`;
    a.click();
  };

  const handleExportPDF = () => {
    if (logs.length === 0) return;
    const rows = logs.map((l, i) => `<tr><td style="text-align:center">${i + 1}</td><td style="text-align:center">${l.date}</td><td style="text-align:center">${l.check_in ?? '-'}</td><td style="text-align:center">${l.check_out ?? '-'}</td><td style="text-align:center;text-transform:capitalize">${l.status}</td></tr>`).join('');
    const html = `<!DOCTYPE html><html><head><title>My Attendance Report</title><style>@page{margin:15mm;size:A4 landscape;}body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;font-size:11px;color:#333;margin:0;padding:0;}.header-container{text-align:center;margin-bottom:30px;padding-bottom:20px;border-bottom:3px solid #2f4fa8;}.logo{max-height:80px;margin-bottom:15px;width:auto;}.report-title{color:#2f4fa8;font-size:24px;font-weight:900;margin:0;text-transform:uppercase;letter-spacing:1.5px;}.report-meta{color:#6b7280;font-size:11px;margin-top:8px;font-weight:bold;text-transform:uppercase;}table{width:100%;border-collapse:collapse;font-size:11px;margin-top:10px;}th,td{padding:10px 8px;border-bottom:1px solid #e5e7eb;}th{background-color:#2f4fa8!important;color:white!important;font-weight:bold;text-align:center;-webkit-print-color-adjust:exact;print-color-adjust:exact;}tr:nth-child(even){background-color:#f9fafb!important;-webkit-print-color-adjust:exact;print-color-adjust:exact;}</style></head><body><div class="header-container"><img src="${logo}" class="logo" alt="School Logo" /><h1 class="report-title">My Attendance Report</h1><p class="report-meta">${from || to ? `${from || '...'} to ${to || '...'}` : 'All Records'} &nbsp;&bull;&nbsp; I-HADIR System</p></div><table><thead><tr><th style="width:8%">No</th><th style="width:25%">Date</th><th style="width:22%">Time In</th><th style="width:22%">Time Out</th><th style="width:23%">Status</th></tr></thead><tbody>${rows}</tbody></table><script>window.onload=function(){setTimeout(function(){window.print();},300);}</script></body></html>`;
    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-full mx-auto">
      {/* Header Section */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-[#2f4fa8] tracking-tight">My Attendance</h2>
          <p className="text-gray-500 text-sm mt-1">View your personal attendance history and logs.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 text-gray-500">
           <Home size={14} />
           <span>Dashboard</span>
           <span className="text-gray-300">/</span>
           <span className="text-[#c53336]">My Attendance</span>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* Helper Text */}
        <div className="p-6 border-b border-gray-100 bg-[#f8f9fa]">
          <div className="flex items-center gap-3 text-sm text-gray-600 bg-blue-50 p-4 rounded-xl border border-blue-100">
            <div className="w-5 h-5 rounded-full bg-[#2f4fa8] text-white flex items-center justify-center flex-shrink-0 font-bold text-xs">i</div>
            <p>Click the buttons below to export your attendance data to Copy, CSV, Excel, PDF, or Print format.</p>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          {/* Action Bar */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <ExportButtons onCopy={handleCopy} onExportCSV={handleExportCSV} onExportExcel={handleExportExcel} onExportPDF={handleExportPDF} onPrint={handleExportPDF} />

            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="pl-8 pr-3 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#2f4fa8] outline-none transition-all text-sm font-medium text-gray-600" />
              </div>
              <span className="text-gray-400 text-sm">to</span>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="pl-8 pr-3 py-2 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#2f4fa8] outline-none transition-all text-sm font-medium text-gray-600" />
              </div>
              {(from || to) && (
                <button onClick={clearFilters} className="p-2 text-gray-400 hover:text-red-500 transition-colors" title="Clear filters">
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {errorMsg && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">{errorMsg}</div>
          )}

          {/* Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8f9fa] border-b border-gray-200">
                  <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">#</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Time In</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Time Out</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Status</th>
                  {showShiftColumn && (
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Shift</th>
                  )}
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={showShiftColumn ? 7 : 6} className="px-6 py-16 text-center text-gray-400 bg-white">Loading your attendance record...</td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={showShiftColumn ? 7 : 6} className="px-6 py-16 text-center text-gray-400 bg-white">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
                          <Calendar size={24} className="text-gray-300" />
                        </div>
                        <p className="font-medium text-gray-500">No attendance records found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  logs.map((l, idx) => (
                    <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 text-sm text-gray-500 text-center">{idx + 1}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-800">{l.date}</td>
                      <td className="px-6 py-4 text-sm font-mono text-gray-600 text-center">{l.check_in ?? '-'}</td>
                      <td className="px-6 py-4 text-sm font-mono text-gray-600 text-center">{l.check_out ?? '-'}</td>
                      <td className="px-6 py-4 text-sm text-center capitalize">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusBadgeClass(l.status)}`}>{l.status}</span>
                      </td>
                      {showShiftColumn && (
                        <td className="px-6 py-4 text-sm text-gray-500 text-center">{l.shift ?? '—'}</td>
                      )}
                      <td className="px-6 py-4 text-sm text-gray-500 text-center capitalize">{l.scan_method}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer count */}
          <div className="flex justify-between items-center text-sm text-gray-500 pt-2">
            <p>Showing {logs.length} {logs.length === 1 ? 'entry' : 'entries'}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function MyAttendance() {
  return (
    <DashboardLayout activePageId="my-attendance">
      <MyAttendanceContent />
    </DashboardLayout>
  );
}
