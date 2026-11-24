import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Trophy,
    Flag,
    Save,
    CheckCircle,
    AlertCircle,
    Search,
    UserRound,
    Check,
    Award,
    Users,
    Lock,
} from 'lucide-react';
import axios from 'axios';
import DashboardLayout from '../../Layouts/DashboardLayout';

axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

interface SportHouseOption {
    id: number;
    name: string;
    color?: string | null;
    teacher: string;
    capacity: number | null;
    current_enrolled: number;
}

interface CoCurricularOption {
    id: number;
    name: string;
    teacher: string;
    capacity: number | null;
    current_enrolled: number;
}

interface StudentSummary {
    student_id: number;
    name: string;
    ic_number: string;
    classroom: string;
    session_year?: string;
}

const isCoCurricularIneligible = (classroom?: string | null): boolean => {
    if (!classroom) return false;
    if (/pra/i.test(classroom)) return true;
    const match = classroom.match(/\d/);
    return Boolean(match && ['1', '2', '3'].includes(match[0]));
};

const AssignStudentActivitiesContent = () => {
    const { studentId } = useParams<{ studentId: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const sessionId = searchParams.get('session_id') || '';

    const [student, setStudent] = useState<StudentSummary | null>(null);
    const [sportHouses, setSportHouses] = useState<SportHouseOption[]>([]);
    const [coCurriculars, setCoCurriculars] = useState<CoCurricularOption[]>([]);

    const [initialSportHouseId, setInitialSportHouseId] = useState<number | null>(null);
    const [initialCoCurricularId, setInitialCoCurricularId] = useState<number | null>(null);

    const [selectedSportHouseId, setSelectedSportHouseId] = useState<number | null>(null);
    const [selectedCoCurricularId, setSelectedCoCurricularId] = useState<number | null>(null);

    const [coSearch, setCoSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const isCoCurricularDisabled = useMemo(
        () => isCoCurricularIneligible(student?.classroom),
        [student?.classroom]
    );

    useEffect(() => {
        if (!studentId) return;

        const fetchData = async () => {
            setIsLoading(true);
            setErrorMsg(null);
            try {
                const res = await axios.get(`/api/students/${studentId}/activities`, {
                    params: sessionId ? { session_id: sessionId } : {},
                });

                if (res.data.success) {
                    const loadedStudent: StudentSummary = res.data.student;
                    setStudent(loadedStudent);
                    setSportHouses(res.data.sport_houses || []);
                    setCoCurriculars(res.data.co_curriculars || []);

                    const assignedSport = res.data.assigned?.sport_house_id ?? null;
                    const assignedCo = isCoCurricularIneligible(loadedStudent?.classroom)
                        ? null
                        : (res.data.assigned?.co_curricular_id ?? null);

                    setInitialSportHouseId(assignedSport);
                    setInitialCoCurricularId(assignedCo);
                    setSelectedSportHouseId(assignedSport);
                    setSelectedCoCurricularId(assignedCo);
                }
            } catch (err: any) {
                console.error('Failed to load student activities:', err);
                setErrorMsg(
                    err.response?.data?.message ||
                    'Unable to load student activities. You may not have access to this student.'
                );
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [studentId, sessionId]);

    const filteredCoCurriculars = useMemo(() => {
        const q = coSearch.toLowerCase();
        return coCurriculars.filter(
            (c) => c.name.toLowerCase().includes(q) || c.teacher.toLowerCase().includes(q)
        );
    }, [coCurriculars, coSearch]);

    const handleSave = async () => {
        if (!studentId) return;
        setIsSaving(true);
        setErrorMsg(null);

        try {
            const res = await axios.post(`/api/students/${studentId}/activities`, {
                session_id: sessionId || null,
                sport_house_id: selectedSportHouseId,
                co_curricular_id: isCoCurricularDisabled ? null : selectedCoCurricularId,
            });

            if (res.data.success) {
                setShowSuccessModal(true);
            }
        } catch (err: any) {
            console.error('Failed to save assignments:', err);
            setErrorMsg(err.response?.data?.message || 'Failed to save assignments. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-5xl mx-auto space-y-6"
            >
                {/* Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div>
                            <h2 className="text-2xl font-bold text-role flex items-center gap-2">
                                <Trophy size={22} className="text-[#c53336]" /> Assign Sport House &amp; Co-Curricular
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Choose one sport house and one co-curricular club for this student. Click a selected card again to unassign.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-sm font-semibold text-gray-600 hover:text-role hover:border-role/40 transition-all shadow-sm"
                        >
                            <ArrowLeft size={16} /> Back
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={isLoading || isSaving || !student}
                            className="inline-flex items-center justify-center gap-2 bg-role hover:bg-role-dark text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-role/20 transition-all disabled:opacity-50"
                        >
                            <Save size={16} /> {isSaving ? 'Saving...' : 'Save Assignments'}
                        </button>
                    </div>
                </div>

                {/* Student Info Banner */}
                {student && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-role/10 text-role flex items-center justify-center flex-shrink-0">
                                <UserRound size={22} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-role">{student.name}</h3>
                                <p className="text-xs text-gray-500 font-mono mt-0.5">
                                    IC: {student.ic_number} &bull; Class:{' '}
                                    <span className="font-sans font-semibold text-gray-700">{student.classroom}</span>
                                </p>
                            </div>
                        </div>
                        {student.session_year && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-role border border-blue-100 w-max">
                                <Award size={14} /> Session {student.session_year}
                            </span>
                        )}
                    </div>
                )}

                {isLoading ? (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400 text-sm animate-pulse">
                        Loading sport houses and co-curricular clubs...
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* 1. SPORT HOUSE SECTION */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-role flex items-center gap-2">
                                        <Flag size={18} className="text-[#c53336]" /> Sport House
                                    </h3>
                                    <p className="text-xs text-gray-400 mt-0.5">Select 1 sport house for this session.</p>
                                </div>
                                {selectedSportHouseId && (
                                    <button
                                        type="button"
                                        onClick={() => setSelectedSportHouseId(null)}
                                        className="text-xs font-bold text-red-500 hover:underline"
                                    >
                                        Clear Selection
                                    </button>
                                )}
                            </div>

                            <div className="p-6">
                                {sportHouses.length === 0 ? (
                                    <p className="text-center py-6 text-sm text-gray-400">No active sport houses found.</p>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {sportHouses.map((house) => {
                                            const isSelected = selectedSportHouseId === house.id;
                                            const isFull =
                                                house.capacity !== null &&
                                                house.current_enrolled >= house.capacity &&
                                                initialSportHouseId !== house.id;

                                            return (
                                                <button
                                                    key={house.id}
                                                    type="button"
                                                    disabled={isFull}
                                                    onClick={() =>
                                                        setSelectedSportHouseId(isSelected ? null : house.id)
                                                    }
                                                    className={`text-left rounded-xl border p-4 transition-all flex flex-col justify-between gap-3 ${isFull
                                                        ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                                                        : isSelected
                                                            ? 'border-role bg-role/5 ring-2 ring-role/20 shadow-sm cursor-pointer'
                                                            : 'border-gray-200 bg-white hover:border-role/40 hover:bg-gray-50/50 cursor-pointer'
                                                        }`}
                                                >
                                                    <div className="flex items-start justify-between gap-2 w-full">
                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                            <h4 className="font-bold text-sm text-gray-800 truncate">{house.name}</h4>
                                                        </div>
                                                        <div
                                                            className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border ${isSelected
                                                                ? 'bg-role border-role text-white'
                                                                : 'border-gray-300 bg-white'
                                                                }`}
                                                        >
                                                            {isSelected && <Check size={12} />}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between text-xs text-gray-500 w-full pt-2 border-t border-gray-100">
                                                        <span className="truncate pr-2">Teacher in-charge: {house.teacher}</span>
                                                        <span
                                                            className={`inline-flex items-center gap-1 font-semibold flex-shrink-0 ${isFull ? 'text-red-500' : 'text-gray-600'
                                                                }`}
                                                        >
                                                            <Users size={12} />
                                                            {house.current_enrolled}
                                                            {house.capacity !== null ? `/${house.capacity}` : ''}
                                                            {isFull ? ' (Full)' : ''}
                                                        </span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. CO-CURRICULAR SECTION */}
                        <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${isCoCurricularDisabled ? 'opacity-75' : ''}`}>
                            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-bold text-role flex items-center gap-2">
                                        <Trophy size={18} className="text-[#c53336]" /> Co-Curricular
                                        {isCoCurricularDisabled && (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                <Lock size={11} /> Darjah 4–6 Only
                                            </span>
                                        )}
                                    </h3>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {isCoCurricularDisabled
                                            ? `Co-curricular enrollment is disabled for ${student?.classroom}.`
                                            : 'Select 1 co-curricular club for this session.'}
                                    </p>
                                </div>

                                {!isCoCurricularDisabled && (
                                    <div className="flex items-center gap-3">
                                        {selectedCoCurricularId && (
                                            <button
                                                type="button"
                                                onClick={() => setSelectedCoCurricularId(null)}
                                                className="text-xs font-bold text-red-500 hover:underline whitespace-nowrap"
                                            >
                                                Clear Selection
                                            </button>
                                        )}
                                        <div className="relative w-full sm:w-60">
                                            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                value={coSearch}
                                                onChange={(e) => setCoSearch(e.target.value)}
                                                placeholder="Search club or teacher..."
                                                className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-50 border border-gray-200 text-sm focus:border-role focus:bg-white outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 space-y-4">
                                {isCoCurricularDisabled && (
                                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-center gap-3">
                                        <AlertCircle size={18} className="flex-shrink-0 text-amber-600" />
                                        <span>
                                            Students in <strong>Prasekolah</strong> and <strong>Darjah 1–3</strong> are not eligible for Co-Curricular enrollment. Only <strong>Darjah 4, 5, and 6</strong> students can be assigned.
                                        </span>
                                    </div>
                                )}

                                {filteredCoCurriculars.length === 0 ? (
                                    <p className="text-center py-6 text-sm text-gray-400">No active co-curricular clubs found.</p>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {filteredCoCurriculars.map((club) => {
                                            const isSelected = !isCoCurricularDisabled && selectedCoCurricularId === club.id;
                                            const isFull =
                                                club.capacity !== null &&
                                                club.current_enrolled >= club.capacity &&
                                                initialCoCurricularId !== club.id;
                                            const isDisabled = isCoCurricularDisabled || isFull;

                                            return (
                                                <button
                                                    key={club.id}
                                                    type="button"
                                                    disabled={isDisabled}
                                                    onClick={() => {
                                                        if (isCoCurricularDisabled) return;
                                                        setSelectedCoCurricularId(isSelected ? null : club.id);
                                                    }}
                                                    className={`text-left rounded-xl border p-4 transition-all flex flex-col justify-between gap-3 ${isDisabled
                                                        ? 'border-gray-200 bg-gray-50 opacity-55 cursor-not-allowed'
                                                        : isSelected
                                                            ? 'border-role bg-role/5 ring-2 ring-role/20 shadow-sm cursor-pointer'
                                                            : 'border-gray-200 bg-white hover:border-role/40 hover:bg-gray-50/50 cursor-pointer'
                                                        }`}
                                                >
                                                    <div className="flex items-start justify-between gap-2 w-full">
                                                        <h4 className="font-bold text-sm text-gray-800">{club.name}</h4>
                                                        <div
                                                            className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border ${isSelected
                                                                ? 'bg-role border-role text-white'
                                                                : 'border-gray-300 bg-white'
                                                                }`}
                                                        >
                                                            {isSelected && <Check size={12} />}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between text-xs text-gray-500 w-full pt-2 border-t border-gray-100">
                                                        <span className="truncate pr-2">Teacher in-charge: {club.teacher}</span>
                                                        <span
                                                            className={`inline-flex items-center gap-1 font-semibold flex-shrink-0 ${isFull ? 'text-red-500' : 'text-gray-600'
                                                                }`}
                                                        >
                                                            <Users size={12} />
                                                            {club.current_enrolled}
                                                            {club.capacity !== null ? `/${club.capacity}` : ''}
                                                            {isFull ? ' (Full)' : ''}
                                                        </span>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>

            {/* Modals */}
            <AnimatePresence>
                {showSuccessModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 text-center"
                        >
                            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle size={40} className="text-green-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-role mb-2">Saved!</h3>
                            <p className="text-gray-500 mb-8">
                                Sport house{isCoCurricularDisabled ? '' : ' and co-curricular'} assignments for{' '}
                                <span className="font-bold text-gray-800">{student?.name}</span> have been updated.
                            </p>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowSuccessModal(false);
                                    navigate(-1);
                                }}
                                className="w-full bg-[#10b981] hover:bg-[#059669] text-white py-3 rounded-xl font-bold shadow-lg"
                            >
                                Back to Student List
                            </button>
                        </motion.div>
                    </div>
                )}

                {errorMsg && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 text-center"
                        >
                            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <AlertCircle size={40} className="text-red-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">Error</h3>
                            <p className="text-gray-500 mb-8">{errorMsg}</p>
                            <button
                                type="button"
                                onClick={() => setErrorMsg(null)}
                                className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold shadow-lg"
                            >
                                Close
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default function AssignStudentActivitiesPage() {
    return (
        <DashboardLayout activePageId="user-list">
            <AssignStudentActivitiesContent />
        </DashboardLayout>
    );
}