import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, CheckCircle, AlertTriangle, XCircle, Clock, Info, X } from 'lucide-react';
import axios from 'axios';
import DashboardLayout from '../../Layouts/DashboardLayout';

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

type LogEntry = {
  id: number | string;
  name: string;
  class: string;
  user_type: string;
  status: 'present' | 'late' | 'absent';
  date: string;
  check_in: string | null;
  check_out: string | null;
  scan_method: string;
  reason: string | null; // Added reason to type
  shift?: string | null;
};

const statusConfig = {
  present: { label: 'Present', color: 'text-green-700',  bg: 'bg-green-100',  icon: CheckCircle },
  late:    { label: 'Late',    color: 'text-yellow-700', bg: 'bg-yellow-100', icon: AlertTriangle },
  absent:  { label: 'Absent',  color: 'text-red-700',    bg: 'bg-red-100',    icon: XCircle },
};

const AttendanceLogPage = () => {
  const [logs, setLogs]         = useState<LogEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType]     = useState('student');
  const [filterDate, setFilterDate]     = useState(
    new Date().toISOString().split('T')[0]
  );
  
  // Modal State for Manual Reason
  const [selectedReason, setSelectedReason] = useState<{ name: string; reason: string } | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params: any = { user_type: filterType };
      if (filterDate) params.date = filterDate;
      // Status is deliberately NOT sent to the backend — the stat cards below
      // are derived from `logs`, and need the full day's records (all
      // statuses) to stay accurate regardless of which status the table is
      // currently filtered to. Status filtering happens client-side instead,
      // same as `search` already does.

      const res = await axios.get('/api/attendance/log', { params });
      setLogs(res.data.data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [filterDate, filterType]);

  const filtered = logs.filter(l =>
    (l.name.toLowerCase().includes(search.toLowerCase()) || l.class.toLowerCase().includes(search.toLowerCase())) &&
    (!filterStatus || l.status === filterStatus)
  );

  // Apply Pagination Hook
  const { 
    currentPage, 
    setCurrentPage, 
    totalPages, 
    startIndex, 
    endIndex, 
    currentData, 
    totalItems 
  } = usePagination(filtered, 10);

  const counts = {
    present: logs.filter(l => l.status === 'present').length,
    late:    logs.filter(l => l.status === 'late').length,
    absent:  logs.filter(l => l.status === 'absent').length,
  };

  const SCAN_METHOD_LABELS: Record<string, string> = {
    manual: 'Manual',
    qr: 'QR',
    '-': '-',
  };

  // Shift only applies to security staff — only worth a column when viewing Staff records
  const showShiftColumn = filterType === 'staff';
  const columnCount = showShiftColumn ? 8 : 7;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-full mx-auto space-y-6 relative"
    >
      <div>
        <h2 className="text-2xl font-bold text-[#1c3068]">Attendance Log</h2>
        <p className="text-gray-500 text-sm mt-1">View and filter all check-in / check-out records.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        {(['present', 'late', 'absent'] as const).map((s) => {
          const cfg  = statusConfig[s];
          const Icon = cfg.icon;
          return (
            <div key={s} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cfg.bg}`}>
                <Icon size={20} className={cfg.color} />
              </div>
              <div>
                <p className="text-2xl font-black text-[#1c3068]">{counts[s]}</p>
                <p className="text-xs text-gray-400 font-medium">{cfg.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        {/* Date */}
        <input
          type="date"
          value={filterDate}
          onChange={e => { setFilterDate(e.target.value); setCurrentPage(1); }}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-[#1c3068]"
        />

        {/* User type */}
        <select
          value={filterType}
          onChange={e => { setFilterType(e.target.value); setCurrentPage(1); }}
          className="w-[100px] px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-[#1c3068]"
        >
          <option value="student">Students</option>
          <option value="teacher">Teachers</option>
          <option value="staff">Staff</option>
        </select>

        {/* Status */}
        <select
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
          className="w-[100px] px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-[#1c3068]"
        >
          <option value="">All Status</option>
          <option value="present">Present</option>
          <option value="late">Late</option>
          <option value="absent">Absent</option>
        </select>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search name or class..."
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-[#1c3068]"
          />
        </div>

        <span className="text-xs text-gray-400 ml-auto">{filtered.length} records</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center w-12">#</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Class</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Check In</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Check Out</th>
                {showShiftColumn && (
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Shift</th>
                )}
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={columnCount} className="px-6 py-16 text-center text-gray-400 text-sm">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-[#1c3068] border-t-transparent rounded-full animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : currentData.length === 0 ? (
                <tr>
                  <td colSpan={columnCount} className="px-6 py-16 text-center text-gray-400 text-sm">
                    No attendance records found matching criteria.
                  </td>
                </tr>
              ) : (
                currentData.map((log, index) => {
                  const cfg  = statusConfig[log.status];
                  const Icon = cfg.icon;
                  return (
                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-4 text-sm text-gray-500 text-center">{startIndex + index + 1}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-800">{log.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{log.class}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                          <Icon size={12} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {log.check_in
                          ? <span className="flex items-center gap-1"><Clock size={12} className="text-gray-400" />{log.check_in}</span>
                          : <span className="text-gray-300">—</span>
                        }
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {log.check_out
                          ? <span className="flex items-center gap-1"><Clock size={12} className="text-gray-400" />{log.check_out}</span>
                          : <span className="text-gray-300">—</span>
                        }
                      </td>
                      {showShiftColumn && (
                        <td className="px-6 py-4 text-sm text-gray-600">{log.shift ?? '—'}</td>
                      )}
                      <td className="px-6 py-4 text-center">
                        {log.scan_method === 'manual' ? (
                          <button
                            onClick={() => setSelectedReason({ name: log.name, reason: log.reason || 'No reason provided' })}
                            className="text-[10px] font-bold px-2.5 py-1 rounded border uppercase tracking-wider bg-purple-50 text-purple-600 border-purple-100 hover:bg-purple-100 transition-colors flex items-center gap-1 mx-auto"
                            title="Click to view reason"
                          >
                            {SCAN_METHOD_LABELS[log.scan_method] || log.scan_method}
                            <Info size={12} />
                          </button>
                        ) : (
                          <span
                            className={`inline-block text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-wider ${
                              log.scan_method === 'qr' 
                                ? 'bg-blue-50 text-blue-600 border-blue-100' 
                                : 'bg-gray-50 text-gray-400 border-gray-200'
                            }`}
                          >
                            {SCAN_METHOD_LABELS[log.scan_method] || log.scan_method}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination block */}
        {!loading && totalItems > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center p-6 text-sm text-gray-500 gap-4 border-t border-gray-100">
            <p>Showing {startIndex + 1} to {endIndex} of {totalItems} entries</p>
            {totalPages > 1 && (
              <Pagination className="mx-0 w-auto">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(currentPage - 1)} 
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} 
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <PaginationItem key={page}>
                      <PaginationLink 
                        onClick={() => setCurrentPage(page)} 
                        isActive={currentPage === page} 
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(currentPage + 1)} 
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'} 
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        )}
      </div>

      {/* Reason Modal */}
      <AnimatePresence>
        {selectedReason && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 relative"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-[#1c3068]">Manual Entry Detail</h3>
                <button onClick={() => setSelectedReason(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1 tracking-wider">User / Student</p>
                  <p className="font-medium text-gray-800 bg-gray-50 border border-gray-100 p-3 rounded-lg">{selectedReason.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1 tracking-wider">Reason provided</p>
                  <p className="text-sm text-gray-700 bg-gray-50 border border-gray-100 p-3 rounded-lg leading-relaxed">
                    {selectedReason.reason}
                  </p>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button 
                  onClick={() => setSelectedReason(null)} 
                  className="bg-[#1c3068] text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-[#152450] transition-colors w-full"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default function AttendanceLogListPage() {
  return (
    <DashboardLayout activePageId="attendance-log-list">
      <AttendanceLogPage />
    </DashboardLayout>
  );
}