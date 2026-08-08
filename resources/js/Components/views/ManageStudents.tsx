import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, CheckCircle, AlertCircle, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';

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

export interface ManageStudentsProps {
    onBack: () => void;
    itemId: number;
    itemName: string;
    apiBase: string;
    moduleName: string;
}

// ─── Scrollable Class Tabs Sub-component ────────────────────────────────────────
const ScrollableClassTabs = ({ classes, activeClassId, onSelect }: { classes: Classroom[]; activeClassId: number | null; onSelect: (id: number) => void; }) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 0);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
    }, []);

    useEffect(() => {
        checkScroll();
        const el = scrollRef.current;
        if (!el) return;
        el.addEventListener('scroll', checkScroll, { passive: true });
        const resizeObserver = new ResizeObserver(checkScroll);
        resizeObserver.observe(el);
        return () => {
            el.removeEventListener('scroll', checkScroll);
            resizeObserver.disconnect();
        };
    }, [checkScroll, classes]);

    const scroll = (direction: 'left' | 'right') => {
        const el = scrollRef.current;
        if (!el) return;
        const scrollAmount = el.clientWidth * 0.6;
        el.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    };

    return (
        <div className="relative flex items-center gap-1">
            <button onClick={() => scroll('left')} className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${canScrollLeft ? 'bg-gray-100 hover:bg-gray-200 text-gray-600 cursor-pointer' : 'text-gray-200 cursor-default pointer-events-none'}`} aria-label="Scroll tabs left" tabIndex={-1}><ChevronLeft size={18} /></button>
            <div ref={scrollRef} className="flex overflow-x-auto space-x-2 scrollbar-hide flex-1 min-w-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {classes.map((cls) => (
                    <button key={cls.classroom_id} onClick={() => onSelect(cls.classroom_id)} className={`flex-shrink-0 px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeClassId === cls.classroom_id ? 'bg-[#2f4fa8] text-white shadow-md' : 'text-gray-500 hover:text-[#2f4fa8] hover:bg-gray-50'}`}>{cls.name}</button>
                ))}
            </div>
            <button onClick={() => scroll('right')} className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${canScrollRight ? 'bg-gray-100 hover:bg-gray-200 text-gray-600 cursor-pointer' : 'text-gray-200 cursor-default pointer-events-none'}`} aria-label="Scroll tabs right" tabIndex={-1}><ChevronRight size={18} /></button>
        </div>
    );
};

// ─── Component ──────────────────────────────────────────────────────────────────
export const ManageStudents = ({ onBack, itemId, itemName, apiBase, moduleName }: ManageStudentsProps) => {
    const [classes, setClasses] = useState<Classroom[]>([]);
    const [activeClassId, setActiveClassId] = useState<number | null>(null);

    const [students, setStudents] = useState<StudentItem[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    // Capacity tracking
    const [maxCapacity, setMaxCapacity] = useState<number | null>(null);
    const [baseTotalEnrolled, setBaseTotalEnrolled] = useState<number>(0);
    const [baseLocalSelected, setBaseLocalSelected] = useState<number>(0);

    const [search, setSearch] = useState('');
    const [loadingClasses, setLoadingClasses] = useState(true);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [saving, setSaving] = useState(false);

    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null); // For animated modal

    useEffect(() => {
        const fetchClasses = async () => {
            setLoadingClasses(true);
            try {
                const res = await axios.get('/api/reports/classes');
                const classData = res.data.data || [];
                setClasses(classData);
                if (classData.length > 0) setActiveClassId(classData[0].classroom_id);
            } catch (err) {
                console.error('Failed to fetch classes', err);
            } finally {
                setLoadingClasses(false);
            }
        };
        fetchClasses();
    }, []);

    useEffect(() => {
        if (!activeClassId) return;

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
        if (isDisabled) return;

        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(studentId)) {
                next.delete(studentId); // Removing is always allowed
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

    const handleSelectAll = () => {
        const availableStudents = filteredStudents.filter(s => !s.is_disabled);
        const allSelected = availableStudents.every(s => selectedIds.has(s.student_id));

        if (allSelected) {
            setSelectedIds(prev => {
                const next = new Set(prev);
                availableStudents.forEach(s => next.delete(s.student_id));
                return next;
            });
        } else {
            // Test if adding all available exceeds capacity
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
        setSaving(true);
        setFeedback(null);
        try {
            await axios.post(`${apiBase}/${itemId}/students`, {
                classroom_id: activeClassId,
                student_ids: Array.from(selectedIds)
            });
            setFeedback({ type: 'success', message: 'Students successfully updated!' });

            // Sync base references to current state so capacity math stays correct without re-fetching
            setBaseTotalEnrolled(currentProjectedTotal);
            setBaseLocalSelected(selectedIds.size);

            setTimeout(() => setFeedback(null), 3000);
        } catch (err: any) {
            setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to update students.' });
        } finally {
            setSaving(false);
        }
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) || s.ic_number.includes(search)
    );

    const availableCount = filteredStudents.filter(s => !s.is_disabled).length;
    const isAllSelected = availableCount > 0 && filteredStudents.filter(s => !s.is_disabled).every(s => selectedIds.has(s.student_id));

    return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full min-w-0 flex flex-col space-y-6 overflow-hidden">

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
                    <button onClick={onBack} className="p-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-full text-[#2f4fa8] transition-colors shadow-sm flex-shrink-0">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-[#2f4fa8] uppercase tracking-wide">Manage {moduleName} Students</h2>
                        <p className="text-sm text-gray-500 mt-1 font-bold text-[#c53336]">{itemName}</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end pr-4 border-r border-gray-200 hidden sm:flex">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Capacity</span>
                        <span className={`text-xl font-black ${maxCapacity !== null && currentProjectedTotal >= maxCapacity ? 'text-red-500' : 'text-[#2f4fa8]'}`}>
                            {currentProjectedTotal} <span className="text-gray-300 text-base font-medium">/ {maxCapacity ?? '∞'}</span>
                        </span>
                    </div>
                    {saving && <span className="text-sm font-bold text-blue-500 animate-pulse">Saving changes...</span>}
                    <button onClick={handleSave} disabled={saving || loadingStudents} className="bg-[#2f4fa8] hover:bg-[#264190] text-white px-6 py-2.5 rounded-lg font-bold shadow-md transition-all disabled:opacity-50 whitespace-nowrap">
                        Save Changes
                    </button>
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

            {/* Class Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 w-full overflow-hidden">
                {loadingClasses ? (
                    <div className="p-4 text-center text-sm text-gray-500 font-medium">Loading classes...</div>
                ) : classes.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500 font-medium">No active classes found for this session.</div>
                ) : (
                    <ScrollableClassTabs classes={classes} activeClassId={activeClassId} onSelect={setActiveClassId} />
                )}
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden w-full min-w-0">
                <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <Users size={25} className="text-[#c53336]" />
                        <div>
                            <h3 className="text-lg font-bold text-[#2f4fa8]">Student Roster</h3>
                            <p className="text-xs text-gray-400 mt-1">Total {filteredStudents.length} students in class</p>
                        </div>
                    </div>
                    <div className="relative w-full sm:w-72">
                        <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input type="text" placeholder="Search by name or IC..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-[#2f4fa8] focus:bg-white outline-none transition-all" />
                    </div>
                </div>

                <div className="w-full">
                    <table className="w-full text-left border-collapse relative min-w-max">
                        <thead className="top-0 z-10 shadow-sm">
                            <tr className="bg-gray-50 border-b border-gray-200 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <th className="py-4 px-6 w-16 text-center">No.</th>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">IC Number</th>
                                <th className="px-6 py-4">Gender</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 w-16 bg-gray-50">
                                    <label className="flex items-center justify-center cursor-pointer">
                                        <input type="checkbox" className="hidden" checked={isAllSelected} onChange={handleSelectAll} disabled={availableCount === 0 || loadingStudents} />
                                        <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${availableCount === 0 ? 'bg-gray-200 border-gray-200 cursor-not-allowed' : isAllSelected ? 'bg-[#2f4fa8] border-[#2f4fa8]' : 'border-2 border-gray-300 hover:border-[#2f4fa8]'}`}>
                                            {isAllSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                        </div>
                                    </label>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 uppercase">
                            {loadingStudents ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-medium animate-pulse">Loading students...</td></tr>
                            ) : filteredStudents.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-medium">No students found in this class.</td></tr>
                            ) : (
                                filteredStudents.map((student, index) => {
                                    const isChecked = selectedIds.has(student.student_id);
                                    return (
                                        <tr key={student.student_id} className={`transition-colors ${student.is_disabled ? 'bg-gray-50/50' : 'hover:bg-blue-50/30'}`} onClick={() => handleToggle(student.student_id, student.is_disabled)}>
                                            <td className="px-6 py-4 text-sm text-center text-gray-500">{index + 1}</td>
                                            <td className={`px-6 py-4 text-sm font-bold ${student.is_disabled ? 'text-gray-400' : 'text-[#2f4fa8]'}`}>{student.name}</td>
                                            <td className={`px-6 py-4 text-sm font-mono ${student.is_disabled ? 'text-gray-400' : 'text-gray-600'}`}>{student.ic_number}</td>
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
                                            <td className="px-6 py-4 text-center">
                                                <label className={`flex items-center justify-center ${student.is_disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`} onClick={(e) => e.stopPropagation()}>
                                                    <input type="checkbox" className="hidden" checked={isChecked} onChange={() => handleToggle(student.student_id, student.is_disabled)} disabled={student.is_disabled} />
                                                    <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${student.is_disabled ? 'bg-gray-200 border-gray-200' : isChecked ? 'bg-[#2f4fa8] border-[#2f4fa8]' : 'border-2 border-gray-300'}`}>
                                                        {isChecked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                                    </div>
                                                </label>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div >
    );
};