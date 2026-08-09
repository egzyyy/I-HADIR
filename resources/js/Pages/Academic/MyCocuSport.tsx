import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit, ChevronDown, X, Search, Users, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { ExportButtons } from '../../Components/dashboard/ExportButtons';
import { formatStandardDate } from '@/utils/dateFormatters';
import { ManageStudents } from '../../Components/views/ManageStudents';
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

interface Teacher { teacher_id: number; name: string; }
interface ActivityItem {
    id: number;
    name: string;
    teacher_id: number | null;
    teacher: string;
    capacity: number | null;
    registeredDate: string;
    currentCapacity: number | null;
}

// ─── Shared Form & Modal ──────────────────────────────────────────────────────

const ActivityForm = ({ name, setName, capacity, setCapacity, teacherId, setTeacherId, teachers, error, typeLabel }: {
    name: string; setName: (v: string) => void; capacity: string; setCapacity: (v: string) => void;
    teacherId: string; setTeacherId: (v: string) => void; teachers: Teacher[]; error: string; typeLabel: string;
}) => (
    <>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700"><span className="text-red-500 mr-1">*</span> {typeLabel} Name</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={`e.g. 'St John'`}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-[#2f4fa8] focus:ring-2 focus:ring-[#2f4fa8]/10 outline-none transition-all placeholder:text-gray-400" />
            </div>
            <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700"><span className="text-red-500 mr-1">*</span> Capacity</label>
                <input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} placeholder="e.g. '30'" min={1}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-[#2f4fa8] focus:ring-2 focus:ring-[#2f4fa8]/10 outline-none transition-all placeholder:text-gray-400" />
            </div>
            <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-bold text-gray-700"><span className="text-red-500 mr-1">*</span> Assigned Teacher</label>
                <div className="relative">
                    <select value={teacherId} onChange={e => setTeacherId(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-[#2f4fa8] focus:ring-2 focus:ring-[#2f4fa8]/10 outline-none transition-all appearance-none text-gray-700 cursor-pointer">
                        <option value="">— No Teacher Assigned —</option>
                        {teachers.map(t => <option key={t.teacher_id} value={t.teacher_id}>{t.name.toUpperCase()}</option>)}
                        {teachers.length === 0 && <option value="" disabled>No teachers found</option>}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
            </div>
        </div>
    </>
);

const EditActivityModal = ({ isOpen, onClose, item, teachers, onSaved, apiBase, typeLabel }: {
    isOpen: boolean; onClose: () => void; item: ActivityItem | null; teachers: Teacher[]; onSaved: () => void; apiBase: string; typeLabel: string;
}) => {
    const [name, setName] = useState(''); const [capacity, setCapacity] = useState(''); const [teacherId, setTeacherId] = useState('');
    const [saving, setSaving] = useState(false); const [error, setError] = useState('');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    useEffect(() => {
        if (item) {
            setName(item.name);
            setCapacity(item.capacity ? String(item.capacity) : '');
            setTeacherId(item.teacher_id ? String(item.teacher_id) : '');
        }
        setError('');
    }, [item]);

    if (!isOpen || !item) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) { setError(`${typeLabel} name is required.`); return; }

        if (capacity && Number(capacity) < (item.currentCapacity || 0)) {
            setErrorMsg(`Cannot set capacity to ${capacity} because this ${typeLabel.toLowerCase()} currently has ${item.currentCapacity} enrolled students. Please remove students first.`);
            return;
        }

        setSaving(true);
        try {
            await axios.put(`${apiBase}/${item.id}`, { name: name.trim(), capacity: capacity ? Number(capacity) : null, teacher_id: teacherId || null });
            setSuccessMsg(`${typeLabel} updated successfully!`);
            setTimeout(() => {
                setSuccessMsg(null);
                onSaved();
            }, 1500);
        } catch (err: any) {
            setErrorMsg(err.response?.data?.message || 'Failed to update.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <AnimatePresence>
                {errorMsg && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-8 text-center">
                            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6"><AlertCircle size={40} className="text-red-500" /></div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">Error</h3>
                            <p className="text-gray-500 mb-8">{errorMsg}</p>
                            <button onClick={() => setErrorMsg(null)} className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold shadow-lg transition-all transform hover:-translate-y-1">Close</button>
                        </motion.div>
                    </div>
                )}
                {successMsg && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-8 text-center">
                            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle size={40} className="text-green-500" /></div>
                            <h3 className="text-2xl font-bold text-[#1c3068] mb-2">Success!</h3>
                            <p className="text-gray-500 mb-8">{successMsg}</p>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden">
                    <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <div><h3 className="text-xl font-bold text-[#2f4fa8]">Edit {typeLabel}</h3><p className="text-gray-500 text-sm mt-1">Update the details for this activity.</p></div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"><X size={24} /></button>
                    </div>
                    <div className="p-8"><form onSubmit={handleSubmit} className="space-y-8">
                        <ActivityForm name={name} setName={setName} capacity={capacity} setCapacity={setCapacity} teacherId={teacherId} setTeacherId={setTeacherId} teachers={teachers} error={error} typeLabel={typeLabel} />
                        <div className="pt-8 flex justify-end gap-3 border-t border-gray-100">
                            <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-lg border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all">Cancel</button>
                            <button type="submit" disabled={saving} className="bg-[#2f4fa8] hover:bg-[#264190] disabled:opacity-60 text-white px-8 py-2.5 rounded-lg font-bold shadow-lg shadow-[#2f4fa8]/20 transition-all min-w-[120px]">{saving ? 'Saving...' : 'Save Changes'}</button>
                        </div>
                    </form></div>
                </motion.div>
            </div>
        </>
    );
};

// ─── Export helpers ────────────────────────────────────────────────────────────

function buildTableText(items: ActivityItem[], typeLabel: string): string {
    const header = ['#', `${typeLabel} Name`, 'Capacity', 'Registered Date'].join('\t');
    const rows = items.map((c, i) =>
        [i + 1, c.name, `${c.currentCapacity}/${c.capacity ?? '-'}`, formatStandardDate(c.registeredDate)].join('\t')
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

function exportCSV(items: ActivityItem[], typeLabel: string) {
    const header = ['#', `${typeLabel} Name`, 'Capacity', 'Registered Date'].join(',');
    const rows = items.map((c, i) =>
        [`${i + 1}`, `"${c.name}"`, `"${c.currentCapacity}/${c.capacity ?? '-'}"`, `"${formatStandardDate(c.registeredDate)}"`].join(',')
    );
    downloadFile([header, ...rows].join('\n'), `my_${typeLabel.toLowerCase().replace(/\s/g, '_')}s.csv`, 'text/csv');
}

function exportExcel(items: ActivityItem[], typeLabel: string) {
    downloadFile(buildTableText(items, typeLabel), `my_${typeLabel.toLowerCase().replace(/\s/g, '_')}s.xls`, 'application/vnd.ms-excel');
}

function exportPDF(items: ActivityItem[], logoSrc: string | null, typeLabel: string) {
    const rows = items.map((c, i) => `
    <tr>
      <td style="text-align:center">${i + 1}</td>
      <td style="font-weight:bold">${c.name}</td>
      <td style="text-align:center">${c.currentCapacity}/${c.capacity ?? '-'}</td>
      <td style="text-align:center">${formatStandardDate(c.registeredDate)}</td>
    </tr>`).join('');

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>My ${typeLabel} List Report</title>
      <style>
        @page { margin: 15mm; size: A4 portrait; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 12px; color: #333; margin: 0; padding: 0; }
        .header-container { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #2f4fa8; }
        ${printLogoCss}
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
        ${printLogoHeader(logoSrc)}
        <h1 class="report-title">My ${typeLabel} List Report</h1>
        <p class="report-meta">Generated on: ${new Date().toLocaleString('en-MY')} &nbsp;&bull;&nbsp; I-HADIR System</p>
      </div>
      <table>
        <thead>
          <tr>
            <th style="text-align:center; width:10%">No</th>
            <th style="width:50%">${typeLabel} Name</th>
            <th style="text-align:center; width:20%">Capacity</th>
            <th style="text-align:center; width:20%">Registered</th>
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

function printTable(items: ActivityItem[], logoSrc: string | null, typeLabel: string) { exportPDF(items, logoSrc, typeLabel); }
function copyToClipboard(items: ActivityItem[], typeLabel: string) { navigator.clipboard.writeText(buildTableText(items, typeLabel)).then(() => alert('Table data copied to clipboard!')); }

// ─── Main List Component ──────────────────────────────────────────────────────

const MyCocuSportList = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'cocu' | 'sport'>('cocu');

    const [cocus, setCocus] = useState<ActivityItem[]>([]);
    const [sports, setSports] = useState<ActivityItem[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);

    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [showEditModal, setShowEditModal] = useState(false);
    const [selected, setSelected] = useState<ActivityItem | null>(null);
    const [view, setView] = useState<'list' | 'manage_students'>('list');

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [r1, r2, r3] = await Promise.all([
                axios.get('/api/co-curriculars'),
                axios.get('/api/sport-houses'),
                axios.get('/api/classes/teachers?include_assigned=1')
            ]);

            // Since the Auth context is missing the ID, we will filter by Name instead!
            // We use .toLowerCase() and .trim() to ensure "Ahmad bin Abdullah" perfectly matches "AHMAD BIN ABDULLAH"
            const myName = user?.name?.toLowerCase().trim();

            const myCocus = (r1.data.data || []).filter((c: any) =>
                c.teacher && c.teacher.toLowerCase().trim() === myName
            );

            const mySports = (r2.data.data || []).filter((s: any) =>
                s.teacher && s.teacher.toLowerCase().trim() === myName
            );

            setCocus(myCocus);
            setSports(mySports);
            setTeachers(r3.data.data || []);
        }
        catch (error) {
            console.error("API Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    };

    // Keep this the same so it waits for your Auth context to load
    useEffect(() => {
        if (user) {
            fetchAll();
        }
    }, [user]);

    // Filter based on active tab and search
    const currentItems = activeTab === 'cocu' ? cocus : sports;
    const filtered = currentItems.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const typeLabel = activeTab === 'cocu' ? 'Co-Curricular' : 'Sport House';
    const apiBase = activeTab === 'cocu' ? '/api/co-curriculars' : '/api/sport-houses';

    const { currentPage, setCurrentPage, totalPages, startIndex, endIndex, currentData, totalItems } = usePagination(filtered, 10);

    // Reset pagination when switching tabs
    useEffect(() => { setCurrentPage(1); setSearchTerm(''); }, [activeTab, setCurrentPage]);

    if (view === 'manage_students' && selected) {
        return (
            <ManageStudents
                onBack={() => { setView('list'); setSelected(null); fetchAll(); }}
                itemId={selected.id}
                itemName={selected.name}
                apiBase={apiBase}
                moduleName={typeLabel}
            />
        );
    }

    return (
        <>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-full mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-[#2f4fa8]">My Co-Curricular & Sports</h2>
                        <p className="text-gray-500 text-sm mt-1">Manage students and details for your assigned activities.</p>
                    </div>

                    <div className="bg-white p-1 rounded-lg border border-gray-200 shadow-sm flex">
                        {['cocu', 'sport'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === tab ? 'bg-[#2f4fa8] text-white shadow-md' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                {tab === 'cocu' ? 'Co-Curriculars' : 'Sports'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                            <ExportButtons
                                onCopy={() => copyToClipboard(filtered, typeLabel)}
                                onExportCSV={() => exportCSV(filtered, typeLabel)}
                                onExportExcel={() => exportExcel(filtered, typeLabel)}
                                onExportPDF={() => exportPDF(filtered, null, typeLabel)}
                                onPrint={() => printTable(filtered, null, typeLabel)}
                            />

                            <div className="flex items-center gap-2 w-full sm:w-auto relative">
                                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    placeholder={`Search ${typeLabel.toLowerCase()}s...`}
                                    className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#2f4fa8] focus:ring-2 focus:ring-[#2f4fa8]/10 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto border border-gray-200 rounded-lg">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider w-12 text-center">#</th>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">{typeLabel} Name</th>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-center">Capacity</th>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-center">Registered Date</th>
                                        <th className="px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading ? <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm"><div className="flex justify-center"><div className="w-6 h-6 border-2 border-[#2f4fa8] border-t-transparent rounded-full animate-spin" /></div></td></tr>
                                        : currentData.length === 0 ? <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">You have no assigned {typeLabel.toLowerCase()}s matching your search.</td></tr>
                                            : currentData.map((item, idx) => (
                                                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-4 py-4 text-sm text-gray-500 text-center">{startIndex + idx + 1}</td>
                                                    <td className="px-6 py-4 text-sm font-bold text-[#c53336]">{item.name}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-600 font-mono text-center">{item.currentCapacity}/{item.capacity ?? '-'}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-600 text-center">{formatStandardDate(item.registeredDate)}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex justify-center items-center gap-2">
                                                            <button
                                                                onClick={() => { setSelected(item); setView('manage_students'); }}
                                                                className="p-2 bg-blue-50 text-[#2f4fa8] rounded-lg hover:bg-[#2f4fa8] hover:text-white transition-all shadow-sm border border-blue-100"
                                                                title="Manage Students"
                                                            >
                                                                <Users size={16} />
                                                            </button>
                                                            <button onClick={() => { setSelected(item); setShowEditModal(true); }} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-[#10b981] hover:text-white transition-all shadow-sm border border-emerald-100" title="Edit details"><Edit size={16} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                </tbody>
                            </table>
                        </div>

                        {!loading && (
                            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 text-sm text-gray-500 gap-4">
                                <p>Showing {startIndex + (currentData.length > 0 ? 1 : 0)} to {endIndex} of {totalItems} entries</p>
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
                {showEditModal && <EditActivityModal apiBase={apiBase} typeLabel={typeLabel} isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelected(null); }} item={selected} teachers={teachers} onSaved={async () => { await fetchAll(); setShowEditModal(false); setSelected(null); }} />}
            </AnimatePresence>
        </>
    );
};

export default function MyCocuSportPage() {
    return <DashboardLayout activePageId="my-cocu-sport"><MyCocuSportList /></DashboardLayout>;
}