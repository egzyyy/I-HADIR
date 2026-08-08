import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Users, Filter } from 'lucide-react';
import axios from 'axios';
import { ExportButtons } from '../dashboard/ExportButtons';
import logo from '../../assets/i_hadir_logo2.png';

interface Attendee {
    id: number;
    name: string;
    ic_number: string;
    user_type: string;
    class_name: string;
    check_in_time: string;
    check_in_date: string;
}

export interface ViewEventAttendanceProps {
    onBack: () => void;
    itemId: number;
    itemName: string;
    apiBase: string;
    moduleName: string;
}

// ─── Export helpers ────────────────────────────────────────────────────────────
function buildTableText(items: Attendee[]): string {
    const header = ['No', 'Name', 'IC Number', 'Type', 'Class', 'Date', 'Time'].join('\t');
    const rows = items.map((a, i) =>
        [i + 1, a.name, a.ic_number, a.user_type.toUpperCase(), a.class_name, a.check_in_date, a.check_in_time].join('\t')
    );
    return [header, ...rows].join('\n');
}

function downloadFile(content: string, filename: string, mime: string) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function exportCSV(items: Attendee[], itemName: string) {
    const header = ['No', 'Name', 'IC Number', 'Type', 'Class', 'Date', 'Time'].join(',');
    const rows = items.map((a, i) =>
        [`${i + 1}`, `"${a.name}"`, `"${a.ic_number}"`, `"${a.user_type.toUpperCase()}"`, `"${a.class_name}"`, `"${a.check_in_date}"`, `"${a.check_in_time}"`].join(',')
    );
    downloadFile([header, ...rows].join('\n'), `${itemName.replace(/\s+/g, '_')}_attendance.csv`, 'text/csv');
}

function exportExcel(items: Attendee[], itemName: string) {
    downloadFile(buildTableText(items), `${itemName.replace(/\s+/g, '_')}_attendance.xls`, 'application/vnd.ms-excel');
}

// ─── STANDARDIZED PDF / PRINT FORMAT ──────────────────────────────────────────
function exportPDF(items: Attendee[], logoSrc: string, itemName: string) {
    const rows = items.map((a, i) => `
    <tr>
      <td style="text-align:center">${i + 1}</td>
      <td style="font-weight:bold">${a.name}</td>
      <td style="text-align:center">${a.ic_number}</td>
      <td style="text-align:center; text-transform:uppercase;">${a.user_type}</td>
      <td style="text-align:center">${a.class_name}</td>
      <td style="text-align:center">${a.check_in_date} <br/> <span style="color:#6b7280; font-size:10px;">${a.check_in_time}</span></td>
    </tr>`).join('');

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${itemName} - Attendance Report</title>
      <style>
        @page { margin: 15mm; size: A4 portrait; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 12px; color: #333; margin: 0; padding: 0; }
        .header-container { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #2f4fa8; }
        .logo { max-height: 80px; margin-bottom: 15px; width: auto; }
        .report-title { color: #2f4fa8; font-size: 24px; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: 1.5px; }
        .report-meta { color: #6b7280; font-size: 11px; margin-top: 8px; font-weight: bold; text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 10px; }
        th, td { padding: 12px 10px; border-bottom: 1px solid #e5e7eb; }
        th { background-color: #2f4fa8 !important; color: white !important; font-weight: bold; text-align: left; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        th[style*="text-align:center"] { text-align: center; }
        tr:nth-child(even) { background-color: #f9fafb !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      </style>
    </head>
    <body>
      <div class="header-container">
        <img src="${logoSrc}" class="logo" alt="School Logo" />
        <h1 class="report-title">${itemName} - Attendance Report</h1>
        <p class="report-meta">Generated on: ${new Date().toLocaleString('en-MY')} &nbsp;&bull;&nbsp; I-HADIR System</p>
      </div>
      <table>
        <thead>
          <tr>
            <th style="text-align:center; width:5%">No</th>
            <th style="width:30%">Name</th>
            <th style="text-align:center; width:15%">IC Number</th>
            <th style="text-align:center; width:15%">Type</th>
            <th style="text-align:center; width:15%">Class</th>
            <th style="text-align:center; width:20%">Check-in Time</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <script>window.onload = function() { setTimeout(function() { window.print(); }, 300); }</script>
    </body>
    </html>`;

    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); }
}

function printTable(items: Attendee[], logoSrc: string, itemName: string) { exportPDF(items, logoSrc, itemName); }
function copyToClipboard(items: Attendee[]) { navigator.clipboard.writeText(buildTableText(items)).then(() => alert('Table data copied to clipboard!')); }

// ─── Main Component ────────────────────────────────────────────────────────────
export const ViewEventAttendance = ({ onBack, itemId, itemName, moduleName }: ViewEventAttendanceProps) => {
    const [attendees, setAttendees] = useState<Attendee[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [classFilter, setClassFilter] = useState('all');

    useEffect(() => {
        const fetchAttendees = async () => {
            setLoading(true);
            try {
                const res = await axios.get(`/api/events/${itemId}/attendees`);
                setAttendees(res.data.data || []);
            } catch (err) {
                console.error('Failed to fetch attendees', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAttendees();
    }, [itemId]);

    // Extract unique classes dynamically from student attendees for the filter dropdown
    const availableClasses = useMemo(() => {
        const classes = new Set<string>();
        attendees.forEach(a => {
            if (a.user_type === 'student' && a.class_name !== '-') classes.add(a.class_name);
        });
        return Array.from(classes).sort();
    }, [attendees]);

    // Apply Filters
    const filteredAttendees = attendees.filter(a => {
        const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.ic_number.includes(search);
        const matchesType = typeFilter === 'all' || a.user_type === typeFilter;
        const matchesClass = classFilter === 'all' || a.class_name === classFilter;
        return matchesSearch && matchesType && matchesClass;
    });

    return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full min-w-0 flex flex-col space-y-6 overflow-hidden">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-full text-[#2f4fa8] transition-colors shadow-sm flex-shrink-0">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-[#2f4fa8] uppercase tracking-wide">{moduleName} Attendance</h2>
                        <p className="text-sm text-gray-500 mt-1 font-bold text-[#c53336]">{itemName}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <ExportButtons
                        onCopy={() => copyToClipboard(filteredAttendees)}
                        onExportCSV={() => exportCSV(filteredAttendees, itemName)}
                        onExportExcel={() => exportExcel(filteredAttendees, itemName)}
                        onExportPDF={() => exportPDF(filteredAttendees, logo, itemName)}
                        onPrint={() => printTable(filteredAttendees, logo, itemName)}
                    />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden w-full min-w-0">

                {/* Filters Bar */}
                <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/30">
                    <div className="flex items-center gap-3">
                        <Users size={24} className="text-[#2f4fa8]" />
                        <div>
                            <h3 className="text-lg font-bold text-[#2f4fa8]">Attendee List</h3>
                            <p className="text-xs text-gray-400 mt-1">Total {filteredAttendees.length} checked in</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                        <div className="relative w-full sm:w-40">
                            <Filter size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); if (e.target.value !== 'student') setClassFilter('all'); }} className="w-full pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-[#2f4fa8] outline-none transition-all cursor-pointer font-medium text-gray-600 appearance-none">
                                <option value="all">All Types</option>
                                <option value="student">Students</option>
                                <option value="teacher">Teachers</option>
                                <option value="staff">Staff</option>
                                <option value="parent">Parents</option>
                                <option value="vip">VIPs</option>
                            </select>
                        </div>

                        {/* Only show Class filter if 'All' or 'Student' is selected */}
                        {(typeFilter === 'all' || typeFilter === 'student') && availableClasses.length > 0 && (
                            <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="w-full sm:w-36 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-[#2f4fa8] outline-none transition-all cursor-pointer font-medium text-gray-600">
                                <option value="all">All Classes</option>
                                {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        )}

                        <div className="relative w-full sm:w-64">
                            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input type="text" placeholder="Search name or IC..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-[#2f4fa8] outline-none transition-all" />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto relative w-full">
                    <table className="w-full text-left border-collapse relative min-w-max">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr className="bg-gray-50 border-b border-gray-200 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <th className="py-4 px-6 w-16 text-center">No.</th>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">IC Number</th>
                                <th className="px-6 py-4 text-center">Type</th>
                                <th className="px-6 py-4 text-center">Class</th>
                                <th className="px-6 py-4 text-center">Check-In Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-medium animate-pulse">Loading attendees...</td></tr>
                            ) : filteredAttendees.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-medium">No attendees found.</td></tr>
                            ) : (
                                filteredAttendees.map((a, index) => (
                                    <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-center text-gray-500">{index + 1}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-[#2f4fa8]">{a.name}</td>
                                        <td className="px-6 py-4 text-sm font-mono text-gray-500">{a.ic_number}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${a.user_type === 'vip' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                                    a.user_type === 'parent' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                                                        a.user_type === 'teacher' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                                            a.user_type === 'staff' ? 'bg-teal-50 text-teal-600 border-teal-200' :
                                                                'bg-gray-100 text-gray-600 border-gray-200'
                                                }`}>
                                                {a.user_type === 'vip' && '⭐ '} {a.user_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-center text-gray-500">{a.class_name}</td>
                                        <td className="px-6 py-4 text-sm text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="font-bold text-gray-700">{a.check_in_time}</span>
                                                <span className="text-[10px] text-gray-400 font-medium">{a.check_in_date}</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
};