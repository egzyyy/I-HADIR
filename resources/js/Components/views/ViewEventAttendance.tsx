import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Users, Filter } from 'lucide-react';
import axios from 'axios';
import { ExportButtons } from '../dashboard/ExportButtons';
import { printLogoHeader, printLogoCss } from '../../lib/branding';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '../../Components/ui/hover-card';
import logo from '../../assets/i_hadir_logo2.png';

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

interface Attendee {
    id: number;
    name: string;
    ic_number: string;
    user_type: string;
    class_name: string;
    department: string;
    position: string;
    purpose: string;
    phone_number: string;
    email: string;
    check_in_time: string;
    check_in_date: string;
    children_details?: { name: string; ic: string; class: string }[];
}

export interface ViewEventAttendanceProps {
    onBack: () => void;
    itemId: number;
    itemName: string;
    apiBase: string;
    moduleName: string;
}

// ─── Generic Download Helper ───────────────────────────────────────────────────
function downloadFile(content: string, filename: string, mime: string) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

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

    // Extract unique classes dynamically
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

    // ─── PAGINATION (10 per page) ───────────────────────────────────────────────
    const {
        currentPage, setCurrentPage, totalPages, startIndex, endIndex, currentData, totalItems
    } = usePagination(filteredAttendees, 10);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [search, typeFilter, classFilter, setCurrentPage]);

    // ─── DYNAMIC COLUMNS LOGIC ──────────────────────────────────────────────────
    const columnsConfig = {
        all: ['No.', 'Name', 'Type', 'IC Number', 'Phone Number', 'Affiliation / Details', 'Check-In'],
        vip: ['No.', 'Name', 'Department', 'Position', 'Purpose', 'Phone', 'Email', 'Check-In'],
        parent: ['No.', 'Name', 'IC Number', 'Attending For', 'Phone', 'Email', 'Check-In'],
        student: ['No.', 'Name', 'IC Number', 'Class', 'Check-In'],
        teacher: ['No.', 'Name', 'IC Number', 'Phone Number', 'Check-In'],
        staff: ['No.', 'Name', 'IC Number', 'Phone Number', 'Check-In'],
        outsider: ['No.', 'Name', 'Phone Number', 'Email', 'Check-In'],
    };

    const activeColumns = columnsConfig[typeFilter as keyof typeof columnsConfig] || columnsConfig.all;

    const formatAttendingFor = (pos: string) => {
        if (!pos || pos === '-') return '-';
        return pos.replace(/Anak:\s*/i, '').replace(/Tiada rekod anak/i, 'No child record');
    };

    // Render HoverCard for Parent Affiliation
    const renderParentAffiliation = (a: Attendee) => {
        const defaultText = formatAttendingFor(a.position);
        const namesArray = defaultText.split(',').map(n => n.trim());

        if (!a.children_details || a.children_details.length === 0) {
            return (
                <div className="flex flex-col gap-1 items-center">
                    {namesArray.map((n, idx) => <span key={idx} className="whitespace-nowrap">{n}</span>)}
                </div>
            );
        }

        const filteredChildren = a.children_details.filter(child =>
            namesArray.includes(child.name.trim())
        );

        if (filteredChildren.length === 0) {
            return (
                <div className="flex flex-col gap-1 items-center">
                    {namesArray.map((n, idx) => <span key={idx} className="whitespace-nowrap">{n}</span>)}
                </div>
            );
        }

        return (
            <HoverCard openDelay={300} closeDelay={300}>
                <HoverCardTrigger className="cursor-help flex flex-col gap-1 items-center">
                    {namesArray.map((n, idx) => (
                        <span key={idx} className="underline decoration-dashed decoration-gray-400 underline-offset-4 text-[#1c3068] font-semibold whitespace-nowrap">
                            {n}
                        </span>
                    ))}
                </HoverCardTrigger>
                <HoverCardContent side="top" className="w-80 p-0 overflow-hidden shadow-xl border-gray-100 z-50">
                    <div className="bg-[#1c3068] px-4 py-2 text-white text-xs font-bold uppercase tracking-wider">
                        Children Details
                    </div>
                    <div className="divide-y divide-gray-50 bg-white">
                        {filteredChildren.map((child, idx) => (
                            <div key={idx} className="p-3 hover:bg-gray-50 transition-colors text-left">
                                <p className="text-sm font-bold text-gray-800">{child.name}</p>
                                <div className="flex justify-between items-center mt-1.5">
                                    <span className="text-xs font-mono text-gray-500">{child.ic}</span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-[#1c3068] rounded-md border border-blue-100 uppercase tracking-wider">
                                        {child.class}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </HoverCardContent>
            </HoverCard>
        );
    };

    const getRowData = (a: Attendee, index: number, format: 'ui' | 'csv' | 'html' | 'text') => {
        const row = [];
        const isHtml = format === 'html';

        // Helper to wrap data based on format
        const col = (val: string | React.ReactNode, align = 'center') => {
            if (format === 'ui') return val;
            if (isHtml) return `<td style="text-align:${align}">${val}</td>`;
            if (format === 'csv') return `"${String(val).replace(/"/g, '""')}"`;
            return String(val);
        };

        row.push(col(index + 1));
        row.push(col(a.name, 'left'));

        if (typeFilter === 'all') {
            const ic_number = a.ic_number ?? '-';
            const phone_number = a.phone_number ?? '-';

            let affiliationUi: React.ReactNode = '-';
            let affiliationText = '-';

            if (a.user_type === 'student') {
                affiliationUi = a.class_name;
                affiliationText = a.class_name;
            } else if (a.user_type === 'parent') {
                affiliationUi = renderParentAffiliation(a);
                affiliationText = formatAttendingFor(a.position);
            } else if (a.user_type === 'vip') {
                affiliationUi = a.department !== '-' ? a.department : a.position;
                affiliationText = a.department !== '-' ? a.department : a.position;
            } else if (a.user_type === 'outsider') {
                affiliationUi = 'Outsider / Public';
                affiliationText = 'Outsider / Public';
            }

            if (isHtml && a.user_type === 'parent') affiliationText = affiliationText.replace(/,\s*/g, '<br/>');

            row.push(
                col(a.user_type.toUpperCase()),
                col(ic_number),
                col(phone_number),
                format === 'ui' ? affiliationUi : col(affiliationText)
            );
        } else if (typeFilter === 'vip') {
            row.push(col(a.department), col(a.position), col(a.purpose ?? '-'), col(a.phone_number ?? '-'), col(a.email ?? '-'));
        } else if (typeFilter === 'parent') {
            const rawAffiliation = formatAttendingFor(a.position);
            const htmlAffiliation = rawAffiliation.replace(/,\s*/g, '<br/>');

            row.push(
                col(a.ic_number),
                format === 'ui' ? renderParentAffiliation(a) : col(isHtml ? htmlAffiliation : rawAffiliation),
                col(a.phone_number ?? '-'),
                col(a.email ?? '-')
            );
        } else if (typeFilter === 'student') {
            row.push(col(a.ic_number), col(a.class_name));
        } else if (typeFilter === 'teacher' || typeFilter === 'staff') {
            row.push(col(a.ic_number), col(a.phone_number ?? '-'));
        } else if (typeFilter === 'outsider') {
            row.push(col(a.phone_number ?? '-'), col(a.email ?? '-'));
        }

        const checkInText = `${a.check_in_time} (${a.check_in_date})`;
        if (format === 'ui') {
            row.push(
                <div className="flex flex-col items-center whitespace-nowrap">
                    <span className="font-bold text-gray-700">{a.check_in_time}</span>
                    <span className="text-[10px] text-gray-400 font-medium">{a.check_in_date}</span>
                </div>
            );
        } else if (isHtml) {
            row.push(`<td style="text-align:center">${a.check_in_time} <br/> <span style="color:#6b7280; font-size:10px;">${a.check_in_date}</span></td>`);
        } else {
            row.push(col(checkInText));
        }

        return row;
    };

    // ─── DYNAMIC EXPORT FUNCTIONS ────────────────────────────────────────────────
    const handleCopy = () => {
        if (!filteredAttendees.length) return;
        const text = [
            activeColumns.join('\t'),
            ...filteredAttendees.map((a, i) => getRowData(a, i, 'text').join('\t'))
        ].join('\n');
        navigator.clipboard.writeText(text).then(() => alert('Table data copied to clipboard!'));
    };

    const handleExportCSV = () => {
        if (!filteredAttendees.length) return;
        const csv = [
            activeColumns.map(h => `"${h}"`).join(','),
            ...filteredAttendees.map((a, i) => getRowData(a, i, 'csv').join(','))
        ].join('\n');
        downloadFile(csv, `${itemName.replace(/\s+/g, '_')}_attendance.csv`, 'text/csv');
    };

    const handleExportExcel = () => {
        if (!filteredAttendees.length) return;
        const text = [
            activeColumns.join('\t'),
            ...filteredAttendees.map((a, i) => getRowData(a, i, 'text').join('\t'))
        ].join('\n');
        downloadFile(text, `${itemName.replace(/\s+/g, '_')}_attendance.xls`, 'application/vnd.ms-excel');
    };

    const handleExportPDF = () => {
        if (!filteredAttendees.length) return;
        const theadHtml = `<tr>${activeColumns.map(col => `<th style="text-align:${col === 'Name' ? 'left' : 'center'}">${col}</th>`).join('')}</tr>`;
        const tbodyHtml = filteredAttendees.map((a, i) => `<tr>${getRowData(a, i, 'html').join('')}</tr>`).join('');

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${itemName} - Attendance Report</title>
          <style>
            @page { margin: 15mm; size: A4 landscape; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 11px; color: #333; margin: 0; padding: 0; }
            .header-container { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #2f4fa8; }
            ${printLogoCss}
            .report-title { color: #2f4fa8; font-size: 24px; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: 1.5px; }
            .report-meta { color: #6b7280; font-size: 11px; margin-top: 8px; font-weight: bold; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; margin-top: 10px; }
            th, td { padding: 10px 8px; border-bottom: 1px solid #e5e7eb; }
            th { background-color: #2f4fa8 !important; color: white !important; font-weight: bold; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            tr:nth-child(even) { background-color: #f9fafb !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          </style>
        </head>
        <body>
          <div class="header-container">
            ${printLogoHeader(logo)}
            <h1 class="report-title">${itemName} - Attendance Report</h1>
            <p class="report-meta">Filter: ${typeFilter.toUpperCase()} &nbsp;&bull;&nbsp; Generated: ${new Date().toLocaleString('en-MY')}</p>
          </div>
          <table>
            <thead>${theadHtml}</thead>
            <tbody>${tbodyHtml}</tbody>
          </table>
          <script>window.onload = function() { setTimeout(function() { window.print(); }, 300); }</script>
        </body>
        </html>`;

        const win = window.open('', '_blank');
        if (win) { win.document.write(html); win.document.close(); }
    };

    return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full min-w-0 flex flex-col space-y-6 overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-full text-[#1c3068] transition-colors shadow-sm flex-shrink-0">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-[#1c3068] uppercase tracking-wide">{moduleName} Attendance</h2>
                        <p className="text-sm text-gray-500 mt-1 font-bold text-[#c53336]">{itemName}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <ExportButtons
                        onCopy={handleCopy}
                        onExportCSV={handleExportCSV}
                        onExportExcel={handleExportExcel}
                        onExportPDF={handleExportPDF}
                        onPrint={handleExportPDF}
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden w-full min-w-0">
                <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/30">
                    <div className="flex items-center gap-3">
                        <Users size={24} className="text-[#1c3068]" />
                        <div>
                            <h3 className="text-lg font-bold text-[#1c3068]">Attendee List</h3>
                            <p className="text-xs text-gray-400 mt-1">Total {filteredAttendees.length} checked in</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                        <div className="relative w-full sm:w-40">
                            <Filter size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); if (e.target.value !== 'student') setClassFilter('all'); }} className="w-full pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-[#1c3068] outline-none transition-all cursor-pointer font-medium text-gray-600 appearance-none">
                                <option value="all">All Types</option>
                                <option value="student">Students</option>
                                <option value="teacher">Teachers</option>
                                <option value="staff">Staff</option>
                                <option value="parent">Parents</option>
                                <option value="vip">VIPs</option>
                                <option value="outsider">Outsiders</option>
                            </select>
                        </div>

                        {(typeFilter === 'all' || typeFilter === 'student') && availableClasses.length > 0 && (
                            <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="w-full sm:w-36 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-[#1c3068] outline-none transition-all cursor-pointer font-medium text-gray-600">
                                <option value="all">All Classes</option>
                                {availableClasses.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        )}

                        <div className="relative w-full sm:w-64">
                            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input type="text" placeholder="Search name or info..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-[#1c3068] outline-none transition-all" />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto relative w-full">
                    <table className="w-full text-left border-collapse relative min-w-max">
                        <thead className="sticky top-0 z-10 shadow-sm">
                            <tr className="bg-gray-50 border-b border-gray-200 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                {activeColumns.map((col, i) => (
                                    <th key={col} className={`py-4 px-6 ${i === 0 ? 'w-16 text-center' : i === 1 ? '' : 'text-center'}`}>
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={activeColumns.length} className="px-6 py-12 text-center text-gray-400 font-medium animate-pulse">Loading attendees...</td></tr>
                            ) : currentData.length === 0 ? (
                                <tr><td colSpan={activeColumns.length} className="px-6 py-12 text-center text-gray-400 font-medium">No attendees found.</td></tr>
                            ) : (
                                currentData.map((a, index) => {
                                    const rowData = getRowData(a, startIndex + index, 'ui');

                                    return (
                                        <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                                            {rowData.map((val, colIdx) => {
                                                const colName = activeColumns[colIdx];
                                                const isLongTextColumn = ['Name', 'Department', 'Purpose', 'Position', 'Affiliation / Details'].includes(colName);

                                                return (
                                                    <td
                                                        key={colIdx}
                                                        className={`px-6 py-4 text-sm align-top ${colIdx === 0 ? 'text-center text-gray-500' : colIdx === 1 ? 'font-bold text-[#1c3068]' : 'text-center text-gray-600'} ${isLongTextColumn ? 'max-w-[200px] sm:max-w-[250px] whitespace-normal break-words leading-relaxed' : 'whitespace-nowrap'}`}
                                                    >
                                                        {typeFilter === 'all' && colIdx === 2 && typeof val === 'string' ? (
                                                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${val === 'VIP' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                                                val === 'PARENT' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                                                                    val === 'TEACHER' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                                                        val === 'STAFF' ? 'bg-teal-50 text-teal-600 border-teal-200' :
                                                                            val === 'OUTSIDER' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                                                                                'bg-gray-100 text-gray-600 border-gray-200'
                                                                }`}>
                                                                {val === 'VIP' && '⭐ '} {val}
                                                            </span>
                                                        ) : (
                                                            val
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {!loading && (
                    <div className="p-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500 gap-4 bg-gray-50/30">
                        <p>Showing {startIndex + (currentData.length > 0 ? 1 : 0)} to {endIndex} of {totalItems} entries</p>

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
        </motion.div>
    );
};