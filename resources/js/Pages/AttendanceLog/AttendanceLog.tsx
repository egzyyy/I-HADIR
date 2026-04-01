import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';
import axios from 'axios';
import DashboardLayout from '../../Layouts/DashboardLayout';

type LogEntry = {
  id: number;
  name: string;
  class: string;
  user_type: string;
  status: 'present' | 'late' | 'absent';
  date: string;
  check_in: string | null;
  check_out: string | null;
  scan_method: string;
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
  const [total, setTotal] = useState(0);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params: any = { user_type: filterType };
      if (filterDate)   params.date   = filterDate;
      if (filterStatus) params.status = filterStatus;

      const res = await axios.get('/api/attendance/log', { params });
      setLogs(res.data.data ?? []);
      setTotal(res.data.total ?? 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [filterDate, filterStatus, filterType]);

  const filtered = logs.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.class.toLowerCase().includes(search.toLowerCase())
  );

  const counts = {
    present: logs.filter(l => l.status === 'present').length,
    late:    logs.filter(l => l.status === 'late').length,
    absent:  logs.filter(l => l.status === 'absent').length,
  };

  const SCAN_METHOD_LABELS = {
    manual: 'Manual',
    qr: 'QR',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-full mx-auto space-y-6"
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
          onChange={e => setFilterDate(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-[#1c3068]"
        />

        {/* User type */}
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="w-[100px] px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-[#1c3068]"
        >
          <option value="student">Students</option>
          <option value="teacher">Teachers</option>
          <option value="staff">Staff</option>
        </select>

        {/* Status */}
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
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
            onChange={e => setSearch(e.target.value)}
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
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Class</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Check In</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Check Out</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-gray-400 text-sm">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-[#1c3068] border-t-transparent rounded-full animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-gray-400 text-sm">
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => {
                  const cfg  = statusConfig[log.status];
                  const Icon = cfg.icon;
                  return (
                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
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
                      <td className="px-6 py-4">
                        <span
                            className={`text-xs font-medium px-2 py-0.5 rounded ${
                              log.scan_method === 'manual'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {SCAN_METHOD_LABELS[log.scan_method] || log.scan_method}
                          </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
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
