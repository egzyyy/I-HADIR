import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Users,
  Calendar,
  Home,
  Search,
} from 'lucide-react';
import { motion } from 'motion/react';
import axios from 'axios';
import DashboardLayout from '../Layouts/DashboardLayout';
import { ExportButtons } from '../Components/dashboard/ExportButtons';
import { StatCard } from '../Components/dashboard/StatCard';
import { useAuth } from '../contexts/AuthContext';
import { TeacherDashboard } from '../Components/dashboards/TeacherDashboard';
import { SecurityDashboard } from '../Components/dashboards/SecurityDashboard';

type Tab = 'student' | 'teacher' | 'staff' | 'late';

// Shape of GET /api/attendance/log rows (class carries position for teacher/staff).
interface LogRow {
  id: number | string;
  user_type: string;
  user_id: string;
  name: string;
  class: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  scan_method: string;
  reason: string | null;
}

interface Summary {
  total_users: number;
  total_teachers: number;
  total_staff: number;
  total_students: number;
  total_classes: number;
}

const PAGE_SIZE = 10;

// "07:25:00" → "07:25 AM"
const fmtTime = (t: string | null) => {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(hour12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${suffix}`;
};

const statusBadgeClass = (status: string) => {
  const map: Record<string, string> = {
    present: 'bg-green-50 text-green-700',
    late: 'bg-yellow-50 text-yellow-700',
    absent: 'bg-red-50 text-red-700',
    incomplete: 'bg-orange-50 text-orange-700',
  };
  return map[status] ?? 'bg-gray-50 text-gray-600';
};

const DashboardHome = () => {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('student');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [logsByType, setLogsByType] = useState<Record<'student' | 'teacher' | 'staff', LogRow[]>>({
    student: [],
    teacher: [],
    staff: [],
  });
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sessionYear, setSessionYear] = useState<string>('');

  const isAdmin = role !== 'Teacher' && role !== 'Security';

  useEffect(() => {
    if (!isAdmin) return;

    axios.get('/api/school/dashboard-summary')
      .then((res) => setSummary(res.data.data))
      .catch((err) => console.error('Failed to fetch dashboard summary', err));

    axios.get('/api/sessions/active')
      .then((res) => { if (res.data.success) setSessionYear(res.data.data.year); })
      .catch(() => {});

    // One call per user type; the "late" tab is a client-side merge of all three.
    Promise.all(
      (['student', 'teacher', 'staff'] as const).map((type) =>
        axios.get('/api/attendance/log', { params: { user_type: type } })
          .then((res) => [type, res.data.data ?? []] as const)
          .catch(() => [type, []] as const)
      )
    )
      .then((entries) => {
        setLogsByType({ student: [], teacher: [], staff: [], ...Object.fromEntries(entries) });
      })
      .finally(() => setLoadingLogs(false));
  }, [isAdmin]);

  // Show role-specific dashboards
  if (role === 'Teacher') {
    return <TeacherDashboard />;
  }

  if (role === 'Security') {
    return <SecurityDashboard />;
  }

  // Admin Dashboard (default)

  const lateRows: LogRow[] = (['student', 'teacher', 'staff'] as const)
    .flatMap((type) =>
      logsByType[type]
        .filter((r) => r.status === 'late')
        // For the mixed "late" tab, the second column shows the person's type.
        .map((r) => ({ ...r, class: type.charAt(0).toUpperCase() + type.slice(1) }))
    );

  const tabRows: LogRow[] = activeTab === 'late' ? lateRows : logsByType[activeTab];

  const filteredRows = search.trim()
    ? tabRows.filter((r) => r.name.toLowerCase().includes(search.trim().toLowerCase()))
    : tabRows;

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const changeTab = (tab: Tab) => { setActiveTab(tab); setPage(1); };

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  // ─── Export helpers (same conventions as MyAttendance.tsx) ────────────────
  const secondCol = activeTab === 'student' ? 'Class' : 'Role';
  const exportRows = filteredRows.map((r, i) => [
    i + 1, r.name, r.class, r.date, fmtTime(r.check_in) ?? '-', fmtTime(r.check_out) ?? '-', r.status, r.reason ?? '-',
  ]);
  const exportHeader = ['No', 'Name', secondCol, 'Date', 'Time In', 'Time Out', 'Status', 'Reason'];

  const handleCopy = () => {
    if (exportRows.length === 0) return;
    const text = [exportHeader.join('\t'), ...exportRows.map((r) => r.join('\t'))].join('\n');
    navigator.clipboard.writeText(text).then(() => alert('Copied to clipboard!'));
  };

  const handleExportCSV = () => {
    if (exportRows.length === 0) return;
    const csv = [exportHeader.join(','), ...exportRows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `attendance_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleExportExcel = () => {
    if (exportRows.length === 0) return;
    const table = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"></head><body><table border="1"><thead><tr style="background-color:#2f4fa8;color:white;">${exportHeader.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${exportRows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></body></html>`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([table], { type: 'application/vnd.ms-excel' }));
    a.download = `attendance_${activeTab}_${new Date().toISOString().split('T')[0]}.xls`;
    a.click();
  };

  const handleExportPDF = () => {
    if (exportRows.length === 0) return;
    const rows = exportRows.map((r) => `<tr>${r.map((c) => `<td style="text-align:center">${c}</td>`).join('')}</tr>`).join('');
    const html = `<!DOCTYPE html><html><head><title>Attendance Report — ${activeTab}</title><style>@page{margin:15mm;size:A4 landscape;}body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;font-size:11px;color:#333;}h1{color:#2f4fa8;font-size:20px;text-transform:uppercase;text-align:center;}p.meta{text-align:center;color:#6b7280;font-size:11px;font-weight:bold;text-transform:uppercase;}table{width:100%;border-collapse:collapse;font-size:11px;margin-top:10px;}th,td{padding:8px;border-bottom:1px solid #e5e7eb;}th{background-color:#2f4fa8!important;color:white!important;text-align:center;-webkit-print-color-adjust:exact;print-color-adjust:exact;}tr:nth-child(even){background-color:#f9fafb!important;-webkit-print-color-adjust:exact;print-color-adjust:exact;}</style></head><body><h1>Attendance Report — ${activeTab}</h1><p class="meta">${today} &nbsp;&bull;&nbsp; I-HADIR System</p><table><thead><tr>${exportHeader.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table><script>window.onload=function(){setTimeout(function(){window.print();},300);}</script></body></html>`;
    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); }
  };

  return (
    <>
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-role to-[#2a4595] rounded-3xl p-8 mb-10 text-white shadow-xl relative overflow-hidden"
      >
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium mb-3">
               <Calendar size={16} />
               <span>{today}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">
              School Session{sessionYear ? ` : Year ${sessionYear}` : ''}
            </h2>
            <p className="text-blue-100 max-w-2xl">
              Overview of school attendance, statistics and daily reports.
            </p>
          </div>

        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="absolute left-0 bottom-0 w-48 h-48 bg-[#c53336]/20 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
        <StatCard icon={Users} label="Total Users" value={summary ? String(summary.total_users) : '—'} colorClass="bg-[#c53336]" delay={0.1} />
        <StatCard icon={GraduationCap} label="Total Teachers" value={summary ? String(summary.total_teachers) : '—'} colorClass="bg-role" delay={0.2} />
        <StatCard icon={Users} label="Total Staff" value={summary ? String(summary.total_staff) : '—'} colorClass="bg-[#cec43a]" delay={0.3} />
        <StatCard icon={Users} label="Total Students" value={summary ? String(summary.total_students) : '—'} colorClass="bg-teal-500" delay={0.4} />
        <StatCard icon={Home} label="Total Classes" value={summary ? String(summary.total_classes) : '—'} colorClass="bg-purple-500" delay={0.5} />
      </div>

      {/* Attendance Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="text-xl font-bold text-role">Attendance List</h3>
            <p className="text-gray-500 text-sm mt-1">Today's records for {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</p>
          </div>
          <div className="flex bg-gray-50 p-1 rounded-lg">
            {(['student', 'teacher', 'staff', 'late'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => changeTab(tab)}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all capitalize ${
                  activeTab === tab
                    ? 'bg-white text-role shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <ExportButtons onCopy={handleCopy} onExportCSV={handleExportCSV} onExportExcel={handleExportExcel} onExportPDF={handleExportPDF} onPrint={handleExportPDF} />
            <div className="relative w-full sm:w-64">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search records..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:border-role focus:ring-1 focus:ring-role outline-none transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {activeTab === 'student' ? 'Class' : activeTab === 'late' ? 'Type' : 'Role'}
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Time In</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Time Out</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Reason</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {loadingLogs ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-400 animate-pulse">
                      Loading today's attendance...
                    </td>
                  </tr>
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-400">
                      {search.trim() ? 'No records match your search.' : 'No records for today yet.'}
                    </td>
                  </tr>
                ) : (
                  pageRows.map((row) => (
                    <tr key={`${row.user_type}-${row.user_id}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-700">{row.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{row.class}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{row.date}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {row.check_in ? (
                          <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-bold">{fmtTime(row.check_in)}</span>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{fmtTime(row.check_out) ?? '-'}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-bold capitalize ${statusBadgeClass(row.status)}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{row.reason || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center mt-6 text-sm text-gray-500">
            <p>
              Showing {pageRows.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–
              {(safePage - 1) * PAGE_SIZE + pageRows.length} of {filteredRows.length} entries
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                disabled={safePage <= 1}
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                disabled={safePage >= totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default function Dashboard() {
  return (
    <DashboardLayout activePageId="dashboard">
      <DashboardHome />
    </DashboardLayout>
  );
}
