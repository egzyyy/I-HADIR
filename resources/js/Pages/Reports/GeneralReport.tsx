import axios from 'axios';
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Calendar, ChevronDown, ChevronRight, Users, Trash2, Phone, Clock, ArrowUpDown, ArrowUp, ArrowDown, MapPin, Building2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
import { printLogoHeader, printLogoCss } from '../../lib/branding';

axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

type SortDirection = 'asc' | 'desc';
type GeneralSortColumn = 'name' | 'date' | 'time_in' | 'time_out' | null;
type VisitorLocationFilter = 'entrance' | 'prayer' | 'ict' | 'pss';

const VISITOR_LOCATION_OPTIONS: { value: VisitorLocationFilter; label: string }[] = [
  { value: 'entrance', label: 'School Entrance' },
  { value: 'prayer', label: 'Surau (Prayer)' },
  { value: 'ict', label: 'ICT Lab' },
  { value: 'pss', label: 'PSS (Library)' },
];

// ─── Shared Sort Helpers ─────────────────────────────────────────────────────
function parseDateValue(d: string | null | undefined): number {
  if (!d || d === '-') return -1;
  const trimmed = d.trim();
  const dmy = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmy) return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1])).getTime();
  const parsed = Date.parse(trimmed);
  return isNaN(parsed) ? -1 : parsed;
}

function parseTimeValue(t: string | null | undefined): number {
  if (!t || t === '-') return -1;
  const match = t.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return -1;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = match[3] ? parseInt(match[3], 10) : 0;
  const period = match[4]?.toUpperCase();
  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 3600 + minutes * 60 + seconds;
}

function compareNullableNumbers(a: number, b: number, dir: SortDirection): number {
  if (a === -1 && b === -1) return 0;
  if (a === -1) return 1;
  if (b === -1) return -1;
  return dir === 'asc' ? a - b : b - a;
}

const SortIcon = ({ active, direction }: { active: boolean; direction: SortDirection }) => {
  if (!active) return <ArrowUpDown size={14} className="text-gray-300 ml-1 inline-block" />;
  return direction === 'asc'
    ? <ArrowUp size={14} className="text-[#2f4fa8] ml-1 inline-block" />
    : <ArrowDown size={14} className="text-[#2f4fa8] ml-1 inline-block" />;
};

// ─── Shared Export Helpers ───────────────────────────────────────────────────
function exportCSV(rows: any[], filename: string) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(','), ...rows.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = filename + '.csv';
  a.click();
}

function exportCopy(text: string) {
  navigator.clipboard.writeText(text).then(() => alert("Table copied to clipboard!")).catch(() => { });
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
        .header-container { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #2f4fa8; }
        ${printLogoCss}
        .report-title { color: #2f4fa8; font-size: 24px; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: 1.5px; }
        .report-meta { color: #6b7280; font-size: 11px; margin-top: 8px; font-weight: bold; text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px; }
        th, td { padding: 10px 8px; border-bottom: 1px solid #e5e7eb; }
        th { background-color: #2f4fa8 !important; color: white !important; font-weight: bold; text-align: center; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
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

function formatDateDMY(dateStr?: string | null): string {
  if (!dateStr || dateStr === '-') return '-';
  const parts = dateStr.trim().split(/[-/]/);
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr.replace(/-/g, '/');
}

// ─── 1. Facility / RMT Report ─────────────────────────────────────────────────
const FacilityReport = ({ fixedFacility }: { fixedFacility?: string }) => {
  const isRmt = fixedFacility === 'rmt';

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedFacility, setSelectedFacility] = useState(fixedFacility ?? '');
  const [selectedUserType, setSelectedUserType] = useState<string>(isRmt ? 'student' : 'all');
  const [selectedClass, setSelectedClass] = useState('');

  const [classes, setClasses] = useState<{ classroom_id: number; name: string }[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);
  const [stats, setStats] = useState({ present: 0, absent: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [sortColumn, setSortColumn] = useState<GeneralSortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const showClassFilter = isRmt || selectedUserType === 'student';
  const roleColumnLabel =
    selectedUserType === 'teacher' || selectedUserType === 'staff'
      ? 'Position'
      : selectedUserType === 'student' || isRmt
        ? 'Class'
        : 'Class/Role';

  useEffect(() => {
    axios.get('/api/reports/classes').then(res => setClasses(res.data.data ?? []));
  }, []);

  const handleUserTypeChange = (value: string) => {
    setSelectedUserType(value);
    if (value !== 'student') {
      setSelectedClass('');
    }
    setTableData([]);
    setStats({ present: 0, absent: 0 });
    setSubmitted(false);
  };

  const handleSubmit = async () => {
    if (!selectedFacility || !selectedDate) return;
    setLoading(true);
    setSubmitted(true);
    try {
      const res = await axios.get('/api/reports/facility', {
        params: {
          date: selectedDate,
          facility_type: selectedFacility,
          user_type: isRmt ? 'student' : selectedUserType,
          classroom_id: showClassFilter ? selectedClass : '',
        },
      });
      setTableData(res.data.data ?? []);
      setStats(res.data.stats ?? { present: 0, absent: 0 });
      setCurrentPage(1);
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

  const sorted = useMemo(() => {
    if (!sortColumn) return filtered;
    return [...filtered].sort((a, b) => {
      if (sortColumn === 'name') {
        const cmp = (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
        return sortDirection === 'asc' ? cmp : -cmp;
      }
      if (sortColumn === 'date') {
        return compareNullableNumbers(parseDateValue(a.date), parseDateValue(b.date), sortDirection);
      }
      if (sortColumn === 'time_in') {
        return compareNullableNumbers(parseTimeValue(a.time_in), parseTimeValue(b.time_in), sortDirection);
      }
      if (sortColumn === 'time_out') {
        return compareNullableNumbers(parseTimeValue(a.time_out), parseTimeValue(b.time_out), sortDirection);
      }
      return 0;
    });
  }, [filtered, sortColumn, sortDirection]);

  const { currentPage, setCurrentPage, totalPages, startIndex, endIndex, currentData, totalItems } = usePagination(sorted, 10);

  const handleSort = (column: Exclude<GeneralSortColumn, null>) => {
    if (sortColumn === column) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const formattedSelectedDate = formatDateDMY(selectedDate);

  const exportRows = sorted.map(r => ({
    Name: r.name,
    [roleColumnLabel]: r.class,
    Date: formatDateDMY(r.date),
    Status: r.status,
    'Time In': r.time_in,
    'Time Out': r.time_out,
  }));

  const handleCopy = () => {
    if (!sorted.length) return;
    const text = [
      `Name\t${roleColumnLabel}\tDate\tTime In\tTime Out\tStatus`,
      ...sorted.map(r => `${r.name}\t${r.class}\t${formatDateDMY(r.date)}\t${r.time_in}\t${r.time_out}\t${r.status}`),
    ].join('\n');
    exportCopy(text);
  };

  const handleExportPDF = () => {
    if (!sorted.length) return;
    const facilityLabel = selectedFacility === 'rmt' ? 'RMT' : selectedFacility.toUpperCase();
    const title = `${facilityLabel} Report (${formattedSelectedDate})`;
    const thead = `<tr><th style="width:5%">No</th><th style="width:30%">Name</th><th style="width:20%">${roleColumnLabel}</th><th style="width:15%">Date</th><th style="width:10%">Time In</th><th style="width:10%">Time Out</th><th style="width:10%">Status</th></tr>`;
    const tbody = sorted
      .map(
        (r, i) =>
          `<tr><td style="text-align:center">${i + 1}</td><td style="font-weight:bold">${r.name}</td><td style="text-align:center">${r.class}</td><td style="text-align:center">${formatDateDMY(r.date)}</td><td style="text-align:center">${r.time_in}</td><td style="text-align:center">${r.time_out}</td><td style="text-align:center; text-transform:capitalize">${r.status}</td></tr>`
      )
      .join('');
    generateStandardPDF(title, thead, tbody, null);
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-full mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#2f4fa8]">
          {selectedFacility ? `${selectedFacility === 'rmt' ? 'RMT' : selectedFacility.toUpperCase()} Report` : 'Facility Report'}
        </h2>
        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
          <span>Home</span><ChevronRight size={14} />
          <span className="text-[#2f4fa8] font-medium capitalize">
            {selectedFacility ? `${selectedFacility === 'rmt' ? 'RMT' : selectedFacility.toUpperCase()} Report` : 'Facility Report'}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-8">
          <h3 className="text-lg font-bold text-[#2f4fa8] mb-6">Report Filter</h3>
          <div className="flex flex-col gap-6">
            <div className={`grid grid-cols-1 gap-6 ${!isRmt && showClassFilter ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-[#2f4fa8]"><span className="text-[#c53336] mr-1">*</span> Facility</label>
                <div className="relative">
                  {fixedFacility ? (
                    <input type="text" value={fixedFacility === 'rmt' ? 'RMT' : fixedFacility} readOnly className="w-full px-4 py-2.5 rounded-lg bg-gray-100 border border-gray-200 outline-none text-gray-500 cursor-not-allowed uppercase" />
                  ) : (
                    <>
                      <select value={selectedFacility} onChange={(e) => setSelectedFacility(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#2f4fa8] focus:ring-2 focus:ring-[#2f4fa8]/10 outline-none transition-all appearance-none text-gray-700 cursor-pointer">
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
                <label className="block text-sm font-bold text-[#2f4fa8]"><span className="text-[#c53336] mr-1">*</span> Date</label>
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#2f4fa8] focus:ring-2 focus:ring-[#2f4fa8]/10 outline-none transition-all text-gray-700" />
              </div>

              {!isRmt && (
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-[#2f4fa8]">User Type</label>
                  <div className="relative">
                    <select
                      value={selectedUserType}
                      onChange={(e) => handleUserTypeChange(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#2f4fa8] focus:ring-2 focus:ring-[#2f4fa8]/10 outline-none transition-all appearance-none text-gray-700 cursor-pointer"
                    >
                      <option value="all">All Users</option>
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="staff">Staff</option>
                      <option value="visitor">Visitor</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              )}

              {showClassFilter && (
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-[#2f4fa8]">Class Filter (Optional)</label>
                  <div className="relative">
                    <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#2f4fa8] focus:ring-2 focus:ring-[#2f4fa8]/10 outline-none transition-all appearance-none text-gray-700 cursor-pointer">
                      <option value="">All Scanned Students</option>
                      {classes.map(c => <option key={c.classroom_id} value={c.classroom_id}>{c.name}</option>)}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={handleSubmit} disabled={loading || !selectedFacility || !selectedDate} className="bg-[#2f4fa8] hover:bg-[#264190] text-white px-8 py-2.5 rounded-lg font-bold shadow-lg shadow-[#2f4fa8]/20 transition-all disabled:opacity-50">
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
              <div className="bg-role text-white p-4 flex items-center justify-center h-24"><Users size={40} /></div>
              <div className="flex border-t border-gray-100 divide-x divide-gray-100 bg-white">
                <div className="flex-1 p-4 text-center">
                  <p className="text-xl font-bold text-[#2f4fa8]">{stats.present}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Present</p>
                </div>
                {showClassFilter && selectedClass && (
                  <div className="flex-1 p-4 text-center">
                    <p className="text-xl font-bold text-[#c53336]">{stats.absent}</p>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Absent</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#2f4fa8] rounded-xl shadow-sm p-6 flex flex-col items-center justify-center text-white h-full min-h-[140px]">
              <p className="text-4xl font-bold mb-1">{stats.present}</p>
              <p className="text-sm font-medium opacity-90">Total Present</p>
            </div>

            {showClassFilter && selectedClass && (
              <div className="bg-[#c53336] rounded-xl shadow-sm p-6 flex flex-col items-center justify-center text-white h-full min-h-[140px]">
                <p className="text-4xl font-bold mb-1">{stats.absent}</p>
                <p className="text-sm font-medium opacity-90">Total Absent</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <p className="text-gray-500 text-sm">Attendance list on {formattedSelectedDate}</p>
            </div>

            <div className="p-6">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                <ExportButtons
                  onCopy={handleCopy}
                  onExportCSV={() => exportCSV(exportRows, 'facility_report')}
                  onExportExcel={() => exportCSV(exportRows, 'facility_report')}
                  onExportPDF={handleExportPDF}
                  onPrint={handleExportPDF}
                />

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-sm text-gray-500">Search:</span>
                  <input type="text" value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} className="w-full sm:w-48 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded text-sm focus:border-role outline-none transition-all" />
                </div>
              </div>

              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center w-12">#</th>
                      <th onClick={() => handleSort('name')} className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100 cursor-pointer hover:bg-gray-100 select-none">
                        Name <SortIcon active={sortColumn === 'name'} direction={sortDirection} />
                      </th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">
                        {roleColumnLabel}
                      </th>
                      <th onClick={() => handleSort('date')} className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100 cursor-pointer hover:bg-gray-100 select-none">
                        Date <SortIcon active={sortColumn === 'date'} direction={sortDirection} />
                      </th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Status</th>
                      <th onClick={() => handleSort('time_in')} className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100 cursor-pointer hover:bg-gray-100 select-none">
                        Time In <SortIcon active={sortColumn === 'time_in'} direction={sortDirection} />
                      </th>
                      <th onClick={() => handleSort('time_out')} className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none">
                        Time Out <SortIcon active={sortColumn === 'time_out'} direction={sortDirection} />
                      </th>
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
                            <span className="flex items-center gap-1"><Calendar size={14} className="text-[#c53336]" /> {formatDateDMY(row.date)}</span>
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
  const [events, setEvents] = useState<{ id: number, name: string, date: string }[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [tableData, setTableData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [sortColumn, setSortColumn] = useState<GeneralSortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

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

  const sorted = useMemo(() => {
    if (!sortColumn) return filtered;
    return [...filtered].sort((a, b) => {
      if (sortColumn === 'name') {
        const cmp = (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
        return sortDirection === 'asc' ? cmp : -cmp;
      }
      if (sortColumn === 'date') {
        return compareNullableNumbers(parseDateValue(a.date), parseDateValue(b.date), sortDirection);
      }
      if (sortColumn === 'time_in') {
        return compareNullableNumbers(parseTimeValue(a.time_in), parseTimeValue(b.time_in), sortDirection);
      }
      if (sortColumn === 'time_out') {
        return compareNullableNumbers(parseTimeValue(a.time_out), parseTimeValue(b.time_out), sortDirection);
      }
      return 0;
    });
  }, [filtered, sortColumn, sortDirection]);

  const { currentPage, setCurrentPage, totalPages, startIndex, endIndex, currentData, totalItems } = usePagination(sorted, 10);

  const handleSort = (column: Exclude<GeneralSortColumn, null>) => {
    if (sortColumn === column) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const selectedEventName = events.find(e => e.id === Number(selectedEventId))?.name || 'Selected Event';

  const handleCopy = () => {
    if (!sorted.length) return;
    const text = ['Name\tClass\tDate\tTime In\tTime Out', ...sorted.map(r => `${r.name}\t${r.class}\t${r.date}\t${r.time_in}\t${r.time_out}`)].join('\n');
    exportCopy(text);
  };

  const handleExportPDF = () => {
    if (!sorted.length) return;
    const title = `Event Report (${selectedEventName})`;
    const thead = `<tr><th style="width:5%">No</th><th style="width:30%">Name</th><th style="width:20%">Class</th><th style="width:15%">Date</th><th style="width:15%">Time In</th><th style="width:15%">Time Out</th></tr>`;
    const tbody = sorted.map((r, i) => `<tr><td style="text-align:center">${i + 1}</td><td style="font-weight:bold">${r.name}</td><td style="text-align:center">${r.class}</td><td style="text-align:center">${r.date}</td><td style="text-align:center">${r.time_in}</td><td style="text-align:center">${r.time_out}</td></tr>`).join('');
    generateStandardPDF(title, thead, tbody, null);
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-full mx-auto">
      <div className="mb-6"><h2 className="text-2xl font-bold text-role">Activity / Event Report</h2></div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-8">
          <h3 className="text-lg font-bold text-[#2f4fa8] mb-6">Report Filter</h3>
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-[#2f4fa8]"><span className="text-[#c53336] mr-1">*</span> Event Name</label>
                <div className="relative">
                  <select value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#2f4fa8] focus:ring-2 focus:ring-[#2f4fa8]/10 outline-none transition-all appearance-none text-gray-700 cursor-pointer">
                    <option value="">Select Event...</option>
                    {events.map(e => <option key={e.id} value={e.id}>{e.name} ({e.date})</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={handleSubmit} disabled={loading || !selectedEventId} className="bg-[#2f4fa8] hover:bg-[#264190] text-white px-8 py-2.5 rounded-lg font-bold shadow-lg shadow-[#2f4fa8]/20 transition-all disabled:opacity-50">
                {loading ? 'Generating...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {selectedEventId && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <p className="text-[#2f4fa8] font-semibold text-lg">Attendance list for {selectedEventName}</p>
          </div>

          <div className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
              <ExportButtons onCopy={handleCopy} onExportCSV={() => exportCSV(sorted, 'event')} onExportExcel={() => exportCSV(sorted, 'event')} onExportPDF={handleExportPDF} onPrint={handleExportPDF} />
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-sm text-gray-500">Search:</span>
                <input type="text" value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} className="w-full sm:w-48 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded text-sm focus:border-[#2f4fa8] outline-none" />
              </div>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center w-12">#</th>
                    <th onClick={() => handleSort('name')} className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100 cursor-pointer hover:bg-gray-100 select-none">
                      Name <SortIcon active={sortColumn === 'name'} direction={sortDirection} />
                    </th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Class</th>
                    <th onClick={() => handleSort('date')} className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100 cursor-pointer hover:bg-gray-100 select-none">
                      Date <SortIcon active={sortColumn === 'date'} direction={sortDirection} />
                    </th>
                    <th onClick={() => handleSort('time_in')} className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100 cursor-pointer hover:bg-gray-100 select-none">
                      Time In <SortIcon active={sortColumn === 'time_in'} direction={sortDirection} />
                    </th>
                    <th onClick={() => handleSort('time_out')} className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none">
                      Time Out <SortIcon active={sortColumn === 'time_out'} direction={sortDirection} />
                    </th>
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
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500 text-sm">No attendance recorded for this event yet.</td></tr>
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

  const [locationFilter, setLocationFilter] = useState<VisitorLocationFilter>('entrance');
  const [activeMonth, setActiveMonth] = useState(currentMonth);
  const [visitorList, setVisitorList] = useState<any[]>([]);
  const [chartData, setChartData] = useState<{ day: number; visits: number }[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [search, setSearch] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<any>(null);
  const [sortColumn, setSortColumn] = useState<'name' | 'check_in' | 'check_out' | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  const isFacilityView = locationFilter !== 'entrance';
  const activeLocationLabel =
    VISITOR_LOCATION_OPTIONS.find((opt) => opt.value === locationFilter)?.label || 'School Entrance';

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    axios
      .get('/api/reports/visitors', {
        params: { month: activeMonth, year: currentYear, location: locationFilter },
      })
      .then((res) => {
        setVisitorList(res.data.data ?? []);
        setChartData(res.data.chartData ?? []);
      })
      .catch((err) => {
        console.error('Visitor report error:', err.response?.data || err);
        setVisitorList([]);
        setChartData([]);
      });
  }, [activeMonth, currentYear, locationFilter]);

  const filtered = visitorList.filter((v) => {
    const q = search.toLowerCase();
    return (
      (v.name || '').toLowerCase().includes(q) ||
      (v.ic_number || '').toLowerCase().includes(q) ||
      (v.category || '').toLowerCase().includes(q) ||
      (!isFacilityView && (v.dept || '').toLowerCase().includes(q)) ||
      (!isFacilityView && (v.purpose || '').toLowerCase().includes(q))
    );
  });

  const sorted = useMemo(() => {
    if (!sortColumn) return filtered;
    return [...filtered].sort((a, b) => {
      if (sortColumn === 'name') {
        const cmp = (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
        return sortDirection === 'asc' ? cmp : -cmp;
      }
      if (sortColumn === 'check_in') {
        const dateCmp = compareNullableNumbers(parseDateValue(a.date_in), parseDateValue(b.date_in), sortDirection);
        if (dateCmp !== 0) return dateCmp;
        return compareNullableNumbers(parseTimeValue(a.time_in), parseTimeValue(b.time_in), sortDirection);
      }
      if (sortColumn === 'check_out') {
        const dateCmp = compareNullableNumbers(parseDateValue(a.date_out), parseDateValue(b.date_out), sortDirection);
        if (dateCmp !== 0) return dateCmp;
        return compareNullableNumbers(parseTimeValue(a.time_out), parseTimeValue(b.time_out), sortDirection);
      }
      return 0;
    });
  }, [filtered, sortColumn, sortDirection]);

  const { currentPage, setCurrentPage, totalPages, startIndex, endIndex, currentData, totalItems } = usePagination(sorted, 10);

  const handleSort = (column: 'name' | 'check_in' | 'check_out') => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const handleDeleteClick = (visitor: any) => {
    setSelectedVisitor(visitor);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    setVisitorList((prev) => prev.filter((v) => v.id !== selectedVisitor.id));
    setIsDeleteModalOpen(false);
    setSelectedVisitor(null);
  };

  const displayChartData = chartData.map((d) => ({
    name: String(d.day),
    visits: d.visits,
  }));

  const exportRows = sorted.map((r) =>
    isFacilityView
      ? {
        Name: r.name,
        'IC Number': r.ic_number,
        Phone: r.phone,
        Department: r.category,
        Note: r.note,
        'Date Check In': r.date_in,
        'Time Check In': r.time_in,
        'Date Check Out': r.date_out,
        'Time Check Out': r.time_out,
      }
      : {
        Name: r.name,
        'IC Number': r.ic_number,
        Phone: r.phone,
        Department: r.category,
        'Meeting With': r.dept,
        Purpose: r.purpose,
        Note: r.note,
        'Date Check In': r.date_in,
        'Time Check In': r.time_in,
        'Date Check Out': r.date_out,
        'Time Check Out': r.time_out,
      }
  );

  const handleCopy = () => {
    if (!sorted.length) return;
    const text = isFacilityView
      ? [
        'Name\tIC Number\tPhone\tDepartment\tNote\tCheck In\tCheck Out',
        ...sorted.map((r) => `${r.name}\t${r.ic_number}\t${r.phone}\t${r.category}\t${r.note}\t${r.date_in} ${r.time_in}\t${r.date_out === '-' ? '-' : `${r.date_out} ${r.time_out}`}`),
      ].join('\n')
      : [
        'Name\tIC Number\tPhone\tDepartment\tMeeting With\tPurpose\tNote\tCheck In\tCheck Out',
        ...sorted.map((r) => `${r.name}\t${r.ic_number}\t${r.phone}\t${r.category}\t${r.dept}\t${r.purpose}\t${r.note}\t${r.date_in} ${r.time_in}\t${r.date_out === '-' ? '-' : `${r.date_out} ${r.time_out}`}`),
      ].join('\n');
    exportCopy(text);
  };

  const handleExportPDF = () => {
    if (!sorted.length) return;
    const title = `Visitor Report — ${activeLocationLabel} (${monthNames[activeMonth - 1]} ${currentYear})`;
    const thead = isFacilityView
      ? `<tr><th style="width:5%">No</th><th style="width:24%">Name / Phone / Department</th><th style="width:14%">IC Number</th><th style="width:25%">Note</th><th style="width:16%">Date / Time In</th><th style="width:16%">Date / Time Out</th></tr>`
      : `<tr><th style="width:4%">No</th><th style="width:20%">Name / Phone / Department</th><th style="width:12%">IC Number</th><th style="width:13%">Meeting With</th><th style="width:13%">Purpose</th><th style="width:14%">Note</th><th style="width:12%">Date / Time In</th><th style="width:12%">Date / Time Out</th></tr>`;
    const tbody = sorted
      .map((r, i) => {
        const visitorInfoCell = `<td style="font-weight:bold">${r.name}<br/><span style="font-weight:normal; color:#6b7280; font-size:10px;">${r.phone} &bull; ${r.category || '-'}</span></td>`;
        const checkOutCell = r.date_out === '-' ? 'In Premise' : `${r.date_out}<br/>${r.time_out}`;
        return isFacilityView
          ? `<tr><td style="text-align:center">${i + 1}</td>${visitorInfoCell}<td style="text-align:center; font-family:monospace">${r.ic_number}</td><td>${r.note}</td><td style="text-align:center">${r.date_in}<br/>${r.time_in}</td><td style="text-align:center">${checkOutCell}</td></tr>`
          : `<tr><td style="text-align:center">${i + 1}</td>${visitorInfoCell}<td style="text-align:center; font-family:monospace">${r.ic_number}</td><td style="text-align:center">${r.dept}</td><td style="text-align:center">${r.purpose || '-'}</td><td>${r.note}</td><td style="text-align:center">${r.date_in}<br/>${r.time_in}</td><td style="text-align:center">${checkOutCell}</td></tr>`;
      })
      .join('');
    generateStandardPDF(title, thead, tbody, null);
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-full mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#2f4fa8]">Visitor List — {activeLocationLabel}</h2>
            <p className="text-gray-500 text-sm mt-1">
              Click the <span className="text-[#c53336] font-medium">month</span> tab or choose a location below to display the list.
            </p>
          </div>

          {/* LOCATION FILTER DROPDOWN */}
          <div className="relative w-full sm:w-52">
            <MapPin size={15} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#2f4fa8] pointer-events-none" />
            <select
              value={locationFilter}
              onChange={(e) => {
                setLocationFilter(e.target.value as VisitorLocationFilter);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-10 py-2.5 border border-blue-200 rounded-xl text-sm focus:border-[#2f4fa8] focus:ring-2 focus:ring-[#2f4fa8]/10 outline-none bg-white transition-all appearance-none cursor-pointer text-[#2f4fa8] font-bold shadow-sm"
            >
              {VISITOR_LOCATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Month Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 mb-6 overflow-x-auto">
          <div className="flex space-x-2 min-w-max">
            {months.map((month) => (
              <button
                key={month}
                onClick={() => {
                  setActiveMonth(month);
                  setCurrentPage(1);
                }}
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-all duration-200 
                  ${activeMonth === month ? 'bg-[#c53336] text-white shadow-md shadow-red-200 scale-105' : 'text-gray-500 hover:bg-gray-100 hover:text-role'}`}
              >
                {month}
              </button>
            ))}
          </div>
        </div>

        {/* Daily Visitor Volume Graph */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-[#2f4fa8]">
              Daily Visitor Volume ({monthNames[activeMonth - 1]} {currentYear})
            </h3>
            <span className="text-xs font-bold bg-blue-50 text-[#2f4fa8] px-3 py-1 rounded-full border border-blue-100 w-max">
              Total Visits: {visitorList.length}
            </span>
          </div>
          <div className="p-6 h-[360px] w-full min-w-0 relative">
            {isMounted && (
              <div className="w-full h-full" style={{ minHeight: '280px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={displayChartData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                    />
                    <Tooltip
                      labelFormatter={(day) => `${day} ${monthNames[activeMonth - 1]} ${currentYear}`}
                      contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="visits"
                      stroke="#2f4fa8"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#2f4fa8' }}
                      activeDot={{ r: 6 }}
                      name="Total Visitor Visits"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Visitor Table Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <p className="text-[#2f4fa8] font-semibold text-lg">
              Visitor list ({activeLocationLabel}) for {monthNames[activeMonth - 1]} {currentYear}
            </p>
          </div>

          <div className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
              <ExportButtons
                onCopy={handleCopy}
                onExportCSV={() => exportCSV(exportRows, `visitor_${locationFilter}`)}
                onExportExcel={() => exportCSV(exportRows, `visitor_${locationFilter}`)}
                onExportPDF={handleExportPDF}
                onPrint={handleExportPDF}
              />
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-sm text-gray-500">Search:</span>
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded text-sm focus:border-[#2f4fa8] outline-none transition-all"
                    placeholder="Search name or IC..."
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100 w-12 text-center">#</th>
                    <th onClick={() => handleSort('name')} className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100 cursor-pointer hover:bg-gray-100 select-none">
                      Name / Phone / Department <SortIcon active={sortColumn === 'name'} direction={sortDirection} />
                    </th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100 text-center">
                      IC Number
                    </th>
                    {!isFacilityView && (
                      <>
                        <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100 text-center">Meeting With</th>
                        <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100 text-center">Purpose</th>
                      </>
                    )}
                    <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Note</th>
                    <th onClick={() => handleSort('check_in')} className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100 cursor-pointer hover:bg-gray-100 select-none">
                      Date / Time Check In <SortIcon active={sortColumn === 'check_in'} direction={sortDirection} />
                    </th>
                    <th onClick={() => handleSort('check_out')} className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100 cursor-pointer hover:bg-gray-100 select-none">
                      Date / Time Check Out <SortIcon active={sortColumn === 'check_out'} direction={sortDirection} />
                    </th>
                    <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentData.length > 0 ? (
                    currentData.map((visitor, idx) => (
                      <tr key={visitor.id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-100 last:border-0">
                        <td className="px-4 py-4 text-sm text-gray-500 text-center border-r border-gray-100 font-mono">{startIndex + idx + 1}</td>
                        <td className="px-6 py-4 text-sm border-r border-gray-100">
                          <div className="flex flex-col">
                            <span className="font-bold text-[#2f4fa8] text-sm md:text-base">{visitor.name}</span>
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                              <Phone size={12} />
                              <span>{visitor.phone}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                              <Building2 size={12} className="text-[#2f4fa8]" />
                              <span>{visitor.category || '-'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-mono text-gray-700 border-r border-gray-100 whitespace-nowrap">
                          {visitor.ic_number || '-'}
                        </td>
                        {!isFacilityView && (
                          <>
                            <td className="px-6 py-4 text-sm border-r border-gray-100 text-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 text-center">
                                {visitor.dept}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700 border-r border-gray-100 whitespace-nowrap text-center">
                              {visitor.purpose || '-'}
                            </td>
                          </>
                        )}
                        <td className="px-6 py-4 text-sm text-gray-600 border-r border-gray-100 max-w-xs truncate" title={visitor.note}>
                          {visitor.note}
                        </td>
                        <td className="px-6 py-4 text-sm border-r border-gray-100 whitespace-nowrap">
                          <div className="flex flex-col text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar size={12} className="text-[#c53336]" /> {visitor.date_in}
                            </span>
                            <span className="flex items-center gap-1 mt-0.5">
                              <Clock size={12} className="text-[#2f4fa8]" /> {visitor.time_in}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm border-r border-gray-100 whitespace-nowrap">
                          {visitor.date_out && visitor.date_out !== '-' ? (
                            <div className="flex flex-col text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar size={12} className="text-[#c53336]" /> {visitor.date_out}
                              </span>
                              <span className="flex items-center gap-1 mt-0.5">
                                <Clock size={12} className="text-[#2f4fa8]" /> {visitor.time_out}
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-green-50 text-green-700 border border-green-200">
                              In Premise
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center">
                            <button
                              onClick={() => handleDeleteClick(visitor)}
                              className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-[#c53336] hover:text-white transition-all shadow-sm border border-red-100 hover:border-[#c53336]"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={isFacilityView ? 7 : 9} className="px-4 py-8 text-center text-gray-500 text-sm">
                        No visitor records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalItems > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center mt-6 text-sm text-gray-500 gap-4">
                <p>
                  Showing {startIndex + 1} to {endIndex} of {totalItems} entries
                </p>
                {totalPages > 1 && (
                  <Pagination className="mx-0 w-auto">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage(currentPage - 1)}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
    // { id: 'activity', label: 'Activity Report' },
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
              className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeReport === tab.id
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

export default function GeneralReportPage() {
  return (
    <DashboardLayout activePageId="general-report">
      <GeneralReport />
    </DashboardLayout>
  );
}