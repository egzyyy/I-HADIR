import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Search,
    CheckCircle,
    AlertCircle,
    Users,
    ChevronDown,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    FileDown,
    FileType,
    FileText,
    FileSpreadsheet,
} from 'lucide-react';
import axios from 'axios';
import { ExportButtons } from '../dashboard/ExportButtons';
import { printLogoHeader, printLogoCss } from '../../lib/branding';

// ─── Interfaces ─────────────────────────────────────────────────────────────────
interface Classroom { classroom_id: number; name: string; }

interface StudentItem {
    student_id: number;
    name: string;
    ic_number: string;
    gender: string;
    is_enrolled: boolean;
    is_disabled: boolean;
    current_club: string | null;
}

interface FullReportStudent {
    student_id: number;
    name: string;
    ic_number: string;
    gender: string | null;
    class_name: string;
}

export interface ManageStudentsProps {
    onBack: () => void;
    itemId: number;
    itemName: string;
    apiBase: string;
    moduleName: string;
    readOnly?: boolean;
}

const COCU_STANDARDS = ['Darjah 4', 'Darjah 5', 'Darjah 6'];
const SPORT_STANDARDS = ['Prasekolah', 'Darjah 1', 'Darjah 2', 'Darjah 3', 'Darjah 4', 'Darjah 5', 'Darjah 6'];

// ─── Component ──────────────────────────────────────────────────────────────────
export const ManageStudents = ({
    onBack,
    itemId,
    itemName,
    apiBase,
    moduleName,
    readOnly = false,
}: ManageStudentsProps) => {
    const isCoCurricular =
        apiBase.includes('co-curricular') || moduleName.toLowerCase().includes('co-curricular');

    const allowedStandards = isCoCurricular ? COCU_STANDARDS : SPORT_STANDARDS;

    const [classes, setClasses] = useState<Classroom[]>([]);

    // Two-tier selection state
    const [activeStandard, setActiveStandard] = useState<string>('');
    const [activeClassId, setActiveClassId] = useState<number | null>(null);

    const [students, setStudents] = useState<StudentItem[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    // Capacity tracking
    const [maxCapacity, setMaxCapacity] = useState<number | null>(null);
    const [baseTotalEnrolled, setBaseTotalEnrolled] = useState<number>(0);
    const [baseLocalSelected, setBaseLocalSelected] = useState<number>(0);

    // Search & Sort state
    const [search, setSearch] = useState('');
    const [nameSortDirection, setNameSortDirection] = useState<'asc' | 'desc' | null>(null);

    // Full Report Dropdown state
    const [reportMenuOpen, setReportMenuOpen] = useState(false);
    const [generatingReport, setGeneratingReport] = useState(false);
    const reportMenuRef = useRef<HTMLDivElement | null>(null);

    const [loadingClasses, setLoadingClasses] = useState(true);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [saving, setSaving] = useState(false);

    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Close Generate Report dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (reportMenuRef.current && !reportMenuRef.current.contains(e.target as Node)) {
                setReportMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 1. Fetch Classes on Mount
    useEffect(() => {
        const fetchClasses = async () => {
            setLoadingClasses(true);
            try {
                const res = await axios.get('/api/reports/classes', { params: { all_classes: true } });
                const classData = res.data.data || [];
                setClasses(classData);
            } catch (err) {
                console.error('Failed to fetch classes', err);
            } finally {
                setLoadingClasses(false);
            }
        };
        fetchClasses();
    }, []);

    // 2. Group Classes into allowed standards (Prasekolah + Darjah 1-6 for Sport; Darjah 4-6 for Co-Curricular)
    const groupedClasses = useMemo(() => {
        const groups: Record<string, Classroom[]> = {};
        allowedStandards.forEach(std => {
            groups[std] = [];
        });

        classes.forEach(c => {
            let level = 'Lain-lain';
            if (/pra/i.test(c.name)) {
                level = 'Prasekolah';
            } else {
                const match = c.name.match(/\d/);
                if (match) level = `Darjah ${match[0]}`;
            }

            if (groups[level]) {
                groups[level].push(c);
            }
        });

        return groups;
    }, [classes, allowedStandards]);

    // 3. Set Initial Defaults when classes load (prefer first standard that has classes)
    useEffect(() => {
        if (loadingClasses || activeStandard) return;

        const firstPopulated = allowedStandards.find(std => groupedClasses[std]?.length > 0);
        const initialStd = firstPopulated || allowedStandards[0];

        if (initialStd) {
            setActiveStandard(initialStd);
            setActiveClassId(groupedClasses[initialStd]?.[0]?.classroom_id ?? null);
        }
    }, [loadingClasses, groupedClasses, allowedStandards, activeStandard]);

    // Handle Standard Tab Click
    const handleStandardChange = (standard: string) => {
        setActiveStandard(standard);
        const stdClasses = groupedClasses[standard] || [];
        setActiveClassId(stdClasses.length > 0 ? stdClasses[0].classroom_id : null);
    };

    // 4. Fetch Students when Active Class changes
    useEffect(() => {
        if (!activeClassId) {
            setStudents([]);
            setSelectedIds(new Set());
            setBaseLocalSelected(0);
            return;
        }

        const fetchStudents = async () => {
            setLoadingStudents(true);
            try {
                const res = await axios.get(`${apiBase}/${itemId}/students`, { params: { classroom_id: activeClassId } });
                const fetchedStudents: StudentItem[] = res.data.data || [];

                setMaxCapacity(res.data.capacity);
                setBaseTotalEnrolled(res.data.current_enrolled);

                setStudents(fetchedStudents);

                const initialSelected = new Set<number>();
                fetchedStudents.forEach(s => { if (s.is_enrolled) initialSelected.add(s.student_id); });
                setSelectedIds(initialSelected);
                setBaseLocalSelected(initialSelected.size);
            } catch (err) {
                console.error('Failed to fetch students', err);
                setStudents([]);
            } finally {
                setLoadingStudents(false);
            }
        };

        fetchStudents();
        setSearch('');
        setFeedback(null);
    }, [activeClassId, itemId, apiBase]);

    const currentProjectedTotal = baseTotalEnrolled - baseLocalSelected + selectedIds.size;

    const handleToggle = (studentId: number, isDisabled: boolean) => {
        if (readOnly || isDisabled) return;

        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(studentId)) {
                next.delete(studentId);
            } else {
                if (maxCapacity !== null && currentProjectedTotal >= maxCapacity) {
                    setErrorMsg(`Capacity limit reached! Maximum ${maxCapacity} students allowed.`);
                    return prev;
                }
                next.add(studentId);
            }
            return next;
        });
    };

    const visibleStudents = useMemo(
        () => (readOnly ? students.filter(s => s.is_enrolled) : students),
        [students, readOnly]
    );

    const filteredStudents = useMemo(
        () =>
            visibleStudents.filter(
                s => s.name.toLowerCase().includes(search.toLowerCase()) || s.ic_number.includes(search)
            ),
        [visibleStudents, search]
    );

    const sortedStudents = useMemo(() => {
        if (!nameSortDirection) return filteredStudents;
        return [...filteredStudents].sort((a, b) => {
            const cmp = (a.name || '').localeCompare(b.name || '', undefined, {
                numeric: true,
                sensitivity: 'base',
            });
            return nameSortDirection === 'asc' ? cmp : -cmp;
        });
    }, [filteredStudents, nameSortDirection]);

    const handleSortName = () => {
        setNameSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    };

    const handleSelectAll = () => {
        if (readOnly) return;

        const availableStudents = filteredStudents.filter(s => !s.is_disabled);
        const allSelected = availableStudents.every(s => selectedIds.has(s.student_id));

        if (allSelected) {
            setSelectedIds(prev => {
                const next = new Set(prev);
                availableStudents.forEach(s => next.delete(s.student_id));
                return next;
            });
        } else {
            const next = new Set(selectedIds);
            availableStudents.forEach(s => next.add(s.student_id));
            const newProjectedTotal = baseTotalEnrolled - baseLocalSelected + next.size;

            if (maxCapacity !== null && newProjectedTotal > maxCapacity) {
                setErrorMsg(`Selecting all students exceeds the maximum club capacity of ${maxCapacity}.`);
                return;
            }
            setSelectedIds(next);
        }
    };

    const handleSave = async () => {
        if (readOnly || !activeClassId) return;

        setSaving(true);
        setFeedback(null);
        try {
            await axios.post(`${apiBase}/${itemId}/students`, {
                classroom_id: activeClassId,
                student_ids: Array.from(selectedIds)
            });
            setFeedback({ type: 'success', message: 'Students successfully updated!' });

            setBaseTotalEnrolled(currentProjectedTotal);
            setBaseLocalSelected(selectedIds.size);

            setTimeout(() => setFeedback(null), 3000);
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to update students.' });
        } finally {
            setSaving(false);
        }
    };

    const activeClassName =
        classes.find(c => c.classroom_id === activeClassId)?.name || activeStandard || 'Class';

    const getStatusLabel = (student: StudentItem) => {
        if (student.is_disabled) return `Already in ${student.current_club}`;
        return selectedIds.has(student.student_id) ? 'Enrolled' : 'Available';
    };

    const safeFileBase = `${itemName}_${activeClassName}_students`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');

    const safeFullFileBase = `${itemName}_full_${moduleName}_report`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');

    // ─── Full Co-Curricular / Sport House Report Export (All Classes) ───────────
    const handleGenerateFullReport = async (format: 'pdf' | 'csv' | 'excel') => {
        setReportMenuOpen(false);
        setGeneratingReport(true);
        try {
            const res = await axios.get(`${apiBase}/${itemId}/students`, {
                params: { all_enrolled: true },
            });
            const allStudents: FullReportStudent[] = res.data.data || [];

            if (allStudents.length === 0) {
                setErrorMsg(`No enrolled students found in ${itemName} to generate a report.`);
                return;
            }

            if (format === 'csv') {
                const headers = ['No', 'Name', 'IC Number', 'Class', 'Gender', 'Status'];
                const csvRows = [headers.join(',')];
                allStudents.forEach((s, i) => {
                    csvRows.push([
                        i + 1,
                        `"${s.name}"`,
                        `"=""${s.ic_number}"""`,
                        `"${s.class_name || '-'}"`,
                        `"${s.gender?.toUpperCase() ?? '-'}"`,
                        '"Enrolled"',
                    ].join(','));
                });
                const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.setAttribute('download', `${safeFullFileBase}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else if (format === 'excel') {
                const tableHtml = `
                    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
                    <head><meta charset="UTF-8"></head>
                    <body>
                        <table border="1">
                            <thead>
                                <tr style="background-color: #2f4fa8; color: white;">
                                    <th>No</th>
                                    <th>Name</th>
                                    <th>IC Number</th>
                                    <th>Class</th>
                                    <th>Gender</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${allStudents.map((s, i) => `
                                    <tr>
                                        <td>${i + 1}</td>
                                        <td>${s.name}</td>
                                        <td style="mso-number-format:'\\@';">${s.ic_number}</td>
                                        <td>${s.class_name || '-'}</td>
                                        <td>${s.gender?.toUpperCase() ?? '-'}</td>
                                        <td>Enrolled</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </body>
                    </html>
                `;
                const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.setAttribute('download', `${safeFullFileBase}.xls`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else if (format === 'pdf') {
                const title = `${moduleName} Full Student Report — ${itemName}`;
                const rows = allStudents.map((s, i) => `
                    <tr>
                        <td style="text-align:center">${i + 1}</td>
                        <td style="font-weight:bold">${s.name}</td>
                        <td style="text-align:center; font-family:monospace">${s.ic_number}</td>
                        <td style="text-align:center">${s.class_name || '-'}</td>
                        <td style="text-align:center">${s.gender?.toUpperCase() ?? '-'}</td>
                        <td style="text-align:center">Enrolled</td>
                    </tr>
                `).join('');

                const html = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>${title}</title>
                        <style>
                            @page { margin: 15mm; size: A4 portrait; }
                            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 12px; color: #333; margin: 0; padding: 0; }
                            .header-container { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #2f4fa8; }
                            ${printLogoCss}
                            .report-title { color: #2f4fa8; font-size: 20px; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
                            .report-meta { color: #6b7280; font-size: 11px; margin-top: 8px; font-weight: bold; text-transform: uppercase; }
                            table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 10px; }
                            th, td { padding: 10px 8px; border-bottom: 1px solid #e5e7eb; }
                            th { background-color: #2f4fa8 !important; color: white !important; font-weight: bold; text-align: center; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                            th:nth-child(2) { text-align: left; }
                            tr:nth-child(even) { background-color: #f9fafb !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        </style>
                    </head>
                    <body>
                        <div class="header-container">
                            ${printLogoHeader(null)}
                            <h1 class="report-title">${title}</h1>
                            <p class="report-meta">Total Enrolled: ${allStudents.length} &nbsp;&bull;&nbsp; Generated on: ${new Date().toLocaleString('en-MY')} &nbsp;&bull;&nbsp; I-HADIR System</p>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th style="width:6%">No</th>
                                    <th style="width:36%">Name</th>
                                    <th style="width:18%">IC Number</th>
                                    <th style="width:14%">Class</th>
                                    <th style="width:12%">Gender</th>
                                    <th style="width:14%">Status</th>
                                </tr>
                            </thead>
                            <tbody>${rows}</tbody>
                        </table>
                        <script>window.onload = function() { setTimeout(function() { window.print(); }, 300); }</script>
                    </body>
                    </html>
                `;

                const win = window.open('', '_blank');
                if (win) {
                    win.document.write(html);
                    win.document.close();
                }
            }
        } catch (err: any) {
            console.error('Failed to generate full report:', err);
            setErrorMsg(err.response?.data?.message || 'Failed to generate full report.');
        } finally {
            setGeneratingReport(false);
        }
    };

    // ─── Class-Level Export Functions ───────────────────────────────────────────
    const handleCopy = async () => {
        if (sortedStudents.length === 0) {
            alert('No data to copy!');
            return;
        }

        const tableHtml = `
            <table border="1" style="border-collapse: collapse;">
                <thead>
                    <tr>
                        <th>No</th><th>Name</th><th>IC Number</th><th>Class</th><th>Gender</th><th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${sortedStudents.map((s, i) => `
                        <tr>
                            <td>${i + 1}</td>
                            <td>${s.name}</td>
                            <td>${s.ic_number}</td>
                            <td>${activeClassName}</td>
                            <td>${s.gender?.toUpperCase() ?? '-'}</td>
                            <td>${getStatusLabel(s)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        const textFallback = [
            'No\tName\tIC Number\tClass\tGender\tStatus',
            ...sortedStudents.map((s, i) =>
                `${i + 1}\t${s.name}\t${s.ic_number}\t${activeClassName}\t${s.gender?.toUpperCase() ?? '-'}\t${getStatusLabel(s)}`
            ),
        ].join('\n');

        try {
            const clipboardItem = new ClipboardItem({
                'text/html': new Blob([tableHtml], { type: 'text/html' }),
                'text/plain': new Blob([textFallback], { type: 'text/plain' }),
            });
            await navigator.clipboard.write([clipboardItem]);
            alert('Table copied to clipboard!');
        } catch {
            navigator.clipboard.writeText(textFallback).then(() => alert('Table copied to clipboard!'));
        }
    };

    const handleExportCSV = () => {
        if (sortedStudents.length === 0) return;

        const headers = ['No', 'Name', 'IC Number', 'Class', 'Gender', 'Status'];
        const csvRows = [headers.join(',')];

        sortedStudents.forEach((s, i) => {
            const row = [
                i + 1,
                `"${s.name}"`,
                `"=""${s.ic_number}"""`,
                `"${activeClassName}"`,
                `"${s.gender?.toUpperCase() ?? '-'}"`,
                `"${getStatusLabel(s)}"`,
            ];
            csvRows.push(row.join(','));
        });

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `${safeFileBase}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportExcel = () => {
        if (sortedStudents.length === 0) return;

        const tableHtml = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head><meta charset="UTF-8"></head>
            <body>
                <table border="1">
                    <thead>
                        <tr style="background-color: #2f4fa8; color: white;">
                            <th>No</th>
                            <th>Name</th>
                            <th>IC Number</th>
                            <th>Class</th>
                            <th>Gender</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sortedStudents.map((s, i) => `
                            <tr>
                                <td>${i + 1}</td>
                                <td>${s.name}</td>
                                <td style="mso-number-format:'\\@';">${s.ic_number}</td>
                                <td>${activeClassName}</td>
                                <td>${s.gender?.toUpperCase() ?? '-'}</td>
                                <td>${getStatusLabel(s)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `;

        const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `${safeFileBase}.xls`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportPDF = () => {
        if (sortedStudents.length === 0) return;

        const title = `${moduleName} Student List — ${itemName} (${activeClassName})`;
        const rows = sortedStudents.map((s, i) => `
            <tr>
                <td style="text-align:center">${i + 1}</td>
                <td style="font-weight:bold">${s.name}</td>
                <td style="text-align:center; font-family:monospace">${s.ic_number}</td>
                <td style="text-align:center">${activeClassName}</td>
                <td style="text-align:center">${s.gender?.toUpperCase() ?? '-'}</td>
                <td style="text-align:center">${getStatusLabel(s)}</td>
            </tr>
        `).join('');

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${title}</title>
                <style>
                    @page { margin: 15mm; size: A4 portrait; }
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 12px; color: #333; margin: 0; padding: 0; }
                    .header-container { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #2f4fa8; }
                    ${printLogoCss}
                    .report-title { color: #2f4fa8; font-size: 20px; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
                    .report-meta { color: #6b7280; font-size: 11px; margin-top: 8px; font-weight: bold; text-transform: uppercase; }
                    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 10px; }
                    th, td { padding: 10px 8px; border-bottom: 1px solid #e5e7eb; }
                    th { background-color: #2f4fa8 !important; color: white !important; font-weight: bold; text-align: center; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    th:nth-child(2) { text-align: left; }
                    tr:nth-child(even) { background-color: #f9fafb !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                </style>
            </head>
            <body>
                <div class="header-container">
                    ${printLogoHeader(null)}
                    <h1 class="report-title">${title}</h1>
                    <p class="report-meta">Generated on: ${new Date().toLocaleString('en-MY')} &nbsp;&bull;&nbsp; I-HADIR System</p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th style="width:6%">No</th>
                            <th style="width:36%">Name</th>
                            <th style="width:18%">IC Number</th>
                            <th style="width:14%">Class</th>
                            <th style="width:12%">Gender</th>
                            <th style="width:14%">Status</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
                <script>window.onload = function() { setTimeout(function() { window.print(); }, 300); }</script>
            </body>
            </html>
        `;

        const win = window.open('', '_blank');
        if (win) {
            win.document.write(html);
            win.document.close();
        }
    };

    const availableCount = filteredStudents.filter(s => !s.is_disabled).length;
    const isAllSelected = availableCount > 0 && filteredStudents.filter(s => !s.is_disabled).every(s => selectedIds.has(s.student_id));
    const currentStandardClasses = groupedClasses[activeStandard] || [];

    return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full min-w-0 flex flex-col space-y-6">

            {/* ERROR MODAL */}
            <AnimatePresence>
                {errorMsg && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-8 text-center"
                        >
                            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <AlertCircle size={40} className="text-red-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">Error</h3>
                            <p className="text-gray-500 mb-8">{errorMsg}</p>
                            <button onClick={() => setErrorMsg(null)} className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold shadow-lg transition-all transform hover:-translate-y-1">
                                Close
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-full text-[#1c3068] transition-colors shadow-sm flex-shrink-0">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-[#1c3068] uppercase tracking-wide">
                            {readOnly ? `List ${moduleName} Students` : `Manage ${moduleName} Students`}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1 font-bold text-[#c53336]">{itemName}</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className={`flex flex-col items-end ${!readOnly ? 'pr-4 border-r border-gray-200' : ''} hidden sm:flex`}>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {readOnly ? 'Total Enrolled' : 'Total Capacity'}
                        </span>
                        <span className={`text-xl font-black ${maxCapacity !== null && currentProjectedTotal >= maxCapacity ? 'text-red-500' : 'text-[#1c3068]'}`}>
                            {currentProjectedTotal} <span className="text-gray-300 text-base font-medium">/ {maxCapacity ?? '∞'}</span>
                        </span>
                    </div>
                    {!readOnly && (
                        <>
                            {saving && <span className="text-sm font-bold text-blue-500 animate-pulse">Saving changes...</span>}
                            <button onClick={handleSave} disabled={saving || loadingStudents || !activeClassId} className="bg-[#1c3068] hover:bg-[#152450] text-white px-6 py-2.5 rounded-lg font-bold shadow-md transition-all disabled:opacity-50 whitespace-nowrap">
                                Save Changes
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Feedback Banner */}
            <AnimatePresence>
                {feedback && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className={`p-4 rounded-xl flex items-center gap-3 text-sm font-bold border shadow-sm ${feedback.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        {feedback.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                        {feedback.message}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Two-Tier Class Selection + Generate Full Report Dropdown */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 w-full flex flex-col md:flex-row gap-6 items-start md:items-center">
                {loadingClasses ? (
                    <div className="text-sm text-gray-500 font-medium">Loading classes...</div>
                ) : (
                    <>
                        {/* Tier 1: Standard Tabs */}
                        <div className="flex flex-wrap gap-2">
                            {allowedStandards.map((std) => (
                                <button
                                    key={std}
                                    onClick={() => handleStandardChange(std)}
                                    className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeStandard === std
                                        ? 'bg-[#1c3068] text-white shadow-md'
                                        : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-[#1c3068]'
                                        }`}
                                >
                                    {std}
                                </button>
                            ))}
                        </div>

                        <div className="hidden md:block w-px h-10 bg-gray-200"></div>

                        {/* Tier 2: Class Dropdown */}
                        <div className="w-full md:w-64 space-y-1.5 flex-shrink-0">
                            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select Class</label>
                            <div className="relative">
                                <select
                                    value={activeClassId || ''}
                                    onChange={(e) => setActiveClassId(e.target.value ? Number(e.target.value) : null)}
                                    disabled={currentStandardClasses.length === 0}
                                    className="w-full px-4 py-2.5 rounded-lg bg-white border border-gray-200 focus:border-[#1c3068] outline-none transition-all appearance-none text-gray-700 font-bold cursor-pointer shadow-sm disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                                >
                                    {currentStandardClasses.length === 0 ? (
                                        <option value="">No classes in {activeStandard}</option>
                                    ) : (
                                        currentStandardClasses.map(c => (
                                            <option key={c.classroom_id} value={c.classroom_id}>{c.name}</option>
                                        ))
                                    )}
                                </select>
                                <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Generate Full Report Dropdown (All Classes) */}
                        <div ref={reportMenuRef} className="relative w-full md:w-auto md:ml-auto flex-shrink-0">
                            <button
                                type="button"
                                onClick={() => setReportMenuOpen(prev => !prev)}
                                disabled={generatingReport}
                                className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#1c3068] hover:bg-[#152450] text-white text-sm font-bold shadow-md transition-all disabled:opacity-60 whitespace-nowrap"
                            >
                                <FileDown size={16} />
                                {generatingReport ? 'Generating...' : 'Generate Report'}
                                <ChevronDown size={15} className={`transition-transform ${reportMenuOpen ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {reportMenuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 6, scale: 0.97 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 6, scale: 0.97 }}
                                        transition={{ duration: 0.15 }}
                                        className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-30"
                                    >
                                        <div className="px-3.5 py-2 border-b border-gray-100">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                Full {moduleName} Roster
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleGenerateFullReport('pdf')}
                                            className="w-full px-3.5 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:text-[#1c3068] flex items-center gap-2.5 transition-colors"
                                        >
                                            <FileType size={16} className="text-[#c53336]" /> Export as PDF
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleGenerateFullReport('csv')}
                                            className="w-full px-3.5 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:text-[#1c3068] flex items-center gap-2.5 transition-colors"
                                        >
                                            <FileText size={16} className="text-[#1c3068]" /> Export as CSV
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleGenerateFullReport('excel')}
                                            className="w-full px-3.5 py-2.5 text-left text-sm font-semibold text-gray-700 hover:bg-blue-50 hover:text-[#1c3068] flex items-center gap-2.5 transition-colors"
                                        >
                                            <FileSpreadsheet size={16} className="text-emerald-600" /> Export as Excel
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </>
                )}
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden w-full min-w-0">
                <div className="p-6 border-b border-gray-100 space-y-5">
                    <div className="flex items-center gap-3">
                        <Users size={25} className="text-[#c53336]" />
                        <div>
                            <h3 className="text-lg font-bold text-[#1c3068]">Student Roster</h3>
                            <p className="text-xs text-gray-400 mt-1">
                                {readOnly
                                    ? `Total ${sortedStudents.length} enrolled students in this class`
                                    : `Total ${sortedStudents.length} students in class`}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        <ExportButtons
                            onCopy={handleCopy}
                            onExportCSV={handleExportCSV}
                            onExportExcel={handleExportExcel}
                            onExportPDF={handleExportPDF}
                            onPrint={handleExportPDF}
                        />

                        <div className="relative w-full lg:w-72">
                            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name or IC..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-[#1c3068] focus:bg-white outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div className="w-full overflow-x-auto">
                    <table className="w-full text-left border-collapse relative min-w-max">
                        <thead className="top-0 z-10 shadow-sm">
                            <tr className="bg-gray-50 border-b border-gray-200 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <th className="py-4 px-6 w-16 text-center">No.</th>
                                <th
                                    onClick={handleSortName}
                                    className="px-6 py-4 cursor-pointer hover:bg-gray-100 select-none transition-colors"
                                >
                                    Name
                                    {nameSortDirection === null ? (
                                        <ArrowUpDown size={13} className="text-gray-300 ml-1 inline-block" />
                                    ) : nameSortDirection === 'asc' ? (
                                        <ArrowUp size={13} className="text-[#1c3068] ml-1 inline-block" />
                                    ) : (
                                        <ArrowDown size={13} className="text-[#1c3068] ml-1 inline-block" />
                                    )}
                                </th>
                                <th className="px-6 py-4">IC Number</th>
                                <th className="px-6 py-4">Gender</th>
                                <th className="px-6 py-4">Status</th>
                                {!readOnly && (
                                    <th className="px-6 py-4 w-16 bg-gray-50">
                                        <label className="flex items-center justify-center cursor-pointer">
                                            <input type="checkbox" className="hidden" checked={isAllSelected} onChange={handleSelectAll} disabled={availableCount === 0 || loadingStudents} />
                                            <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${availableCount === 0 ? 'bg-gray-200 border-gray-200 cursor-not-allowed' : isAllSelected ? 'bg-[#1c3068] border-[#1c3068]' : 'border-2 border-gray-300 hover:border-[#1c3068]'}`}>
                                                {isAllSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                            </div>
                                        </label>
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loadingStudents ? (
                                <tr><td colSpan={readOnly ? 5 : 6} className="px-6 py-12 text-center text-gray-400 font-medium animate-pulse">Loading students...</td></tr>
                            ) : !activeClassId ? (
                                <tr><td colSpan={readOnly ? 5 : 6} className="px-6 py-12 text-center text-gray-400 font-medium">No classes available for {activeStandard}.</td></tr>
                            ) : sortedStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={readOnly ? 5 : 6} className="px-6 py-12 text-center text-gray-400 font-medium">
                                        {readOnly ? 'No enrolled students found in this class.' : 'No students found in this class.'}
                                    </td>
                                </tr>
                            ) : (
                                sortedStudents.map((student, index) => {
                                    const isChecked = selectedIds.has(student.student_id);
                                    return (
                                        <tr
                                            key={student.student_id}
                                            className={`transition-colors ${!readOnly && student.is_disabled ? 'bg-gray-50/50' : !readOnly ? 'hover:bg-blue-50/30 cursor-pointer' : 'hover:bg-gray-50/50'}`}
                                            onClick={() => handleToggle(student.student_id, student.is_disabled)}
                                        >
                                            <td className="px-6 py-4 text-sm text-center text-gray-500">{index + 1}</td>
                                            <td className={`px-6 py-4 text-sm font-bold ${!readOnly && student.is_disabled ? 'text-gray-400' : 'text-[#1c3068]'}`}>{student.name}</td>
                                            <td className={`px-6 py-4 text-sm font-mono ${!readOnly && student.is_disabled ? 'text-gray-400' : 'text-gray-600'}`}>{student.ic_number}</td>
                                            <td className="py-4 px-6"><span className={`px-2 py-0.5 rounded text-[10px] font-black border ${student.gender?.toLowerCase() === 'male' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-pink-50 text-pink-600 border-pink-100'}`}>{student.gender?.toUpperCase() ?? '-'}</span></td>
                                            <td className="px-6 py-4">
                                                {student.is_disabled ? (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-gray-100 text-gray-500 uppercase tracking-wider border border-gray-200">Already in {student.current_club}</span>
                                                ) : isChecked ? (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-green-50 text-green-700 uppercase tracking-wider border border-green-200">Enrolled</span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-gray-50 text-gray-400 uppercase tracking-wider border border-gray-200">Available</span>
                                                )}
                                            </td>
                                            {!readOnly && (
                                                <td className="px-6 py-4 text-center">
                                                    <label className={`flex items-center justify-center ${student.is_disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`} onClick={(e) => e.stopPropagation()}>
                                                        <input type="checkbox" className="hidden" checked={isChecked} onChange={() => handleToggle(student.student_id, student.is_disabled)} disabled={student.is_disabled} />
                                                        <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${student.is_disabled ? 'bg-gray-200 border-gray-200' : isChecked ? 'bg-[#1c3068] border-[#1c3068]' : 'border-2 border-gray-300'}`}>
                                                            {isChecked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                                        </div>
                                                    </label>
                                                </td>
                                            )}
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