import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Briefcase, Plus, ListChecks, Info, User, Users, Upload, FileText, X, Search,
    Check, Save, RotateCcw, Pencil, Trash2, Eye, Calendar, MapPin, Download,
    Loader2, AlertCircle, CheckCircle2,
} from 'lucide-react';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { useAuth } from '../../contexts/AuthContext';

axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = 'individual' | 'group';
type Status = 'draft' | 'submitted';

export interface Person { id: number; name: string; class?: string | null; }

export interface WorkOrder {
    id: number;
    description: string | null;
    date_from: string | null;
    date_to: string | null;
    location: string | null;
    category: Category;
    status: Status;
    document_name: string | null;
    has_document: boolean;
    submitted_at: string | null;
    updated_at: string | null;
    created_by: string | null;
    creator?: { id: number; ic_number: string | null; email: string | null; phone: string | null };
    is_owner: boolean;
    credited_days: number;
    teachers: Person[];
    students: Person[];
}

interface FormState {
    description: string;
    date_from: string;
    date_to: string;
    location: string;
    category: Category;
    teacherIds: number[];
    studentIds: number[];
}

const EMPTY_FORM: FormState = {
    description: '', date_from: '', date_to: '', location: '',
    category: 'individual', teacherIds: [], studentIds: [],
};

const ACCEPT = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.eml,.msg';
const ACCEPT_EXT = ACCEPT.split(',').map(e => e.slice(1));
const MAX_BYTES = 10 * 1024 * 1024;

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const fmtDate = (v: string | null) => {
    if (!v) return '-';
    const d = new Date(v);
    return isNaN(d.getTime()) ? v : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export const fmtDateTime = (v: string | null) => {
    if (!v) return '-';
    const d = new Date(v);
    return isNaN(d.getTime()) ? v : d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const fmtSize = (b: number) => (b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`);

const firstError = (err: any, fallback: string) => {
    const errors = err?.response?.data?.errors;
    if (errors) return Object.values(errors).flat()[0] as string;
    return err?.response?.data?.message || fallback;
};

const inputCls = 'w-full px-4 py-3 rounded-lg border border-gray-200 bg-white text-sm focus:border-role focus:ring-2 focus:ring-role/10 outline-none transition-all placeholder:text-gray-400';

// ─── Small UI pieces ──────────────────────────────────────────────────────────

const Card = ({ step, title, subtitle, children }: { step: number; title: string; subtitle: string; children: React.ReactNode }) => (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
        <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-lg bg-role/10 text-role text-sm font-bold flex items-center justify-center">{step}</span>
            <h2 className="text-lg font-bold text-role">{title}</h2>
        </div>
        <p className="text-sm text-gray-500 mt-1 mb-5">{subtitle}</p>
        {children}
    </section>
);

const Label = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
    <label className="block text-sm font-bold text-gray-700 mb-2">
        {children} {required && <span className="text-red-500">*</span>}
    </label>
);

const StatusBadge = ({ status }: { status: Status }) => (
    status === 'submitted'
        ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100"><CheckCircle2 size={12} /> Submitted</span>
        : <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100"><Pencil size={12} /> Draft</span>
);

const Toast = ({ toast, onClose }: { toast: { type: 'success' | 'error'; text: string } | null; onClose: () => void }) => (
    <AnimatePresence>
        {toast && (
            <motion.div
                initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                className={`fixed top-5 right-5 z-[120] max-w-sm flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-700'}`}
            >
                {toast.type === 'success' ? <CheckCircle2 size={18} className="shrink-0 mt-0.5" /> : <AlertCircle size={18} className="shrink-0 mt-0.5" />}
                <span className="flex-1">{toast.text}</span>
                <button onClick={onClose} className="opacity-60 hover:opacity-100"><X size={16} /></button>
            </motion.div>
        )}
    </AnimatePresence>
);

// Searchable checkbox list used for both teachers and students.
const PickerList = ({
    title, hint, placeholder, people, selected, onToggle, showClass,
}: {
    title: string; hint: string; placeholder: string; people: Person[];
    selected: number[]; onToggle: (id: number) => void; showClass?: boolean;
}) => {
    const [q, setQ] = useState('');
    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return people;
        return people.filter(p => p.name.toLowerCase().includes(s) || (p.class ?? '').toLowerCase().includes(s));
    }, [q, people]);
    const selectedPeople = people.filter(p => selected.includes(p.id));

    return (
        <div className="border border-gray-100 rounded-xl p-4 flex flex-col min-w-0">
            <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-role">{title}</h3>
                <span className="px-2 py-0.5 rounded-full bg-role/10 text-role text-[11px] font-bold">{selected.length} selected</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 mb-3">{hint}</p>

            <div className="relative mb-2">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={q} onChange={e => setQ(e.target.value)} placeholder={placeholder} className={`${inputCls} pl-9 py-2.5`} />
            </div>

            <div className="h-56 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-50">
                {filtered.length === 0 && <p className="text-xs text-gray-400 p-4 text-center">No matches.</p>}
                {filtered.map(p => {
                    const on = selected.includes(p.id);
                    return (
                        <label key={p.id} className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${on ? 'bg-role/5' : 'hover:bg-gray-50'}`}>
                            <input type="checkbox" checked={on} onChange={() => onToggle(p.id)} className="w-4 h-4 accent-[rgb(var(--role-rgb))]" />
                            <span className="min-w-0">
                                <span className="block text-sm font-semibold text-gray-800 truncate">{p.name}</span>
                                {showClass && <span className="block text-[11px] text-gray-400">{p.class || 'No class'}</span>}
                            </span>
                        </label>
                    );
                })}
            </div>

            <p className="text-xs font-bold text-role mt-3 mb-1.5">Selected {title.split(' ')[0]}</p>
            {selectedPeople.length === 0 ? (
                <p className="text-xs text-gray-400">No additional participants selected.</p>
            ) : (
                <div className="flex flex-wrap gap-1.5">
                    {selectedPeople.map(p => (
                        <span key={p.id} className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-role/10 text-role text-xs font-semibold">
                            {p.name}
                            <button type="button" onClick={() => onToggle(p.id)} className="p-0.5 rounded-full hover:bg-role/20"><X size={12} /></button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};

// Read-only detail block, shared by the Review modal and the View modal.
export const Detail = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">{label}</p>
        <div className="text-sm text-gray-900 font-medium break-words">{children}</div>
    </div>
);

export const Summary = ({
    description, dateFrom, dateTo, location, category, teachers, students, docLabel, docHref, creator,
}: {
    description: string | null; dateFrom: string | null; dateTo: string | null; location: string | null;
    category: Category; teachers: Person[]; students: Person[]; docLabel: string | null; docHref?: string; creator: string;
}) => (
    <div className="space-y-5">
        <Detail label="Description"><p className="whitespace-pre-line">{description || '-'}</p></Detail>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Detail label="Date From">{fmtDate(dateFrom)}</Detail>
            <Detail label="Date To">{fmtDate(dateTo)}</Detail>
            <Detail label="Category"><span className="capitalize">{category}</span></Detail>
        </div>
        <Detail label="Place / Location">{location || '-'}</Detail>
        {category === 'group' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Detail label={`Teachers (${teachers.length + 1})`}>
                    <ul className="list-disc pl-5 space-y-0.5">
                        <li>{creator} <span className="text-gray-400 text-xs">(creator)</span></li>
                        {teachers.map(t => <li key={t.id}>{t.name}</li>)}
                    </ul>
                </Detail>
                <Detail label={`Students (${students.length})`}>
                    {students.length === 0 ? '-' : (
                        <ul className="list-disc pl-5 space-y-0.5">
                            {students.map(s => <li key={s.id}>{s.name}{s.class ? <span className="text-gray-400 text-xs"> · {s.class}</span> : null}</li>)}
                        </ul>
                    )}
                </Detail>
            </div>
        )}
        <Detail label="Supporting Document">
            {!docLabel ? '-' : docHref ? (
                <a href={docHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-role hover:underline">
                    <Download size={14} /> {docLabel}
                </a>
            ) : (
                <span className="inline-flex items-center gap-1.5"><FileText size={14} className="text-role" /> {docLabel}</span>
            )}
        </Detail>
    </div>
);

export const Modal = ({ title, onClose, children, footer }: { title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
        <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
        >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="font-bold text-lg text-gray-800">{title}</h3>
                <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"><X size={18} /></button>
            </div>
            <div className="px-6 py-5 overflow-y-auto">{children}</div>
            {footer && <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">{footer}</div>}
        </motion.div>
    </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const WorkOrderContent = () => {
    const { user } = useAuth();
    const myName = user?.name || 'You';

    const [tab, setTab] = useState<'new' | 'list'>('new');
    const [orders, setOrders] = useState<WorkOrder[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [teachers, setTeachers] = useState<Person[]>([]);
    const [students, setStudents] = useState<Person[]>([]);

    const [form, setForm] = useState<FormState>(EMPTY_FORM);
    const [file, setFile] = useState<File | null>(null);
    const [existingDoc, setExistingDoc] = useState<string | null>(null); // doc already stored on the draft
    const [removeDoc, setRemoveDoc] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [dirty, setDirty] = useState(false);
    const [lastSaved, setLastSaved] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState<null | 'draft' | 'submit'>(null);
    const [dragOver, setDragOver] = useState(false);

    const [reviewOpen, setReviewOpen] = useState(false);
    const [viewing, setViewing] = useState<WorkOrder | null>(null);
    const [deleting, setDeleting] = useState<WorkOrder | null>(null);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const flash = (type: 'success' | 'error', text: string) => {
        setToast({ type, text });
        window.setTimeout(() => setToast(t => (t?.text === text ? null : t)), 3500);
    };

    const loadOrders = () => {
        setLoadingOrders(true);
        axios.get('/api/work-orders')
            .then(res => setOrders(res.data.data))
            .catch(err => flash('error', firstError(err, 'Failed to load work orders.')))
            .finally(() => setLoadingOrders(false));
    };

    useEffect(() => {
        loadOrders();
        axios.get('/api/work-orders/participants')
            .then(res => { setTeachers(res.data.data.teachers); setStudents(res.data.data.students); })
            .catch(() => {});
    }, []);

    // Warn before leaving with unsaved changes.
    useEffect(() => {
        if (!dirty) return;
        const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
        window.addEventListener('beforeunload', h);
        return () => window.removeEventListener('beforeunload', h);
    }, [dirty]);

    const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm(f => ({ ...f, [key]: value }));
        setErrors(e => ({ ...e, [key]: '' }));
        setDirty(true);
    };

    const toggle = (key: 'teacherIds' | 'studentIds', id: number) =>
        update(key, form[key].includes(id) ? form[key].filter(x => x !== id) : [...form[key], id]);

    const pickFile = (f: File | undefined | null) => {
        if (!f) return;
        const ext = f.name.split('.').pop()?.toLowerCase() ?? '';
        if (!ACCEPT_EXT.includes(ext)) { setErrors(e => ({ ...e, document: 'Unsupported file type.' })); return; }
        if (f.size > MAX_BYTES) { setErrors(e => ({ ...e, document: 'File is larger than 10 MB.' })); return; }
        setFile(f);
        setErrors(e => ({ ...e, document: '' }));
        setDirty(true);
    };

    const clearDoc = () => {
        if (file) setFile(null);
        else if (existingDoc) { setRemoveDoc(true); setExistingDoc(null); }
        if (fileRef.current) fileRef.current.value = '';
        setDirty(true);
    };

    const resetForm = () => {
        setForm(EMPTY_FORM); setFile(null); setExistingDoc(null); setRemoveDoc(false);
        setEditingId(null); setErrors({}); setDirty(false); setLastSaved(null);
        if (fileRef.current) fileRef.current.value = '';
    };

    const loadIntoForm = (o: WorkOrder) => {
        setForm({
            description: o.description ?? '',
            date_from: o.date_from ?? '',
            date_to: o.date_to ?? '',
            location: o.location ?? '',
            category: o.category,
            teacherIds: o.teachers.map(t => t.id),
            studentIds: o.students.map(s => s.id),
        });
        setFile(null);
        setExistingDoc(o.has_document ? o.document_name : null);
        setRemoveDoc(false);
        setEditingId(o.id);
        setErrors({});
        setDirty(false);
        setLastSaved(o.updated_at);
        setTab('new');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Client-side checks that mirror the server's submit rules.
    const validateForSubmit = () => {
        const e: Record<string, string> = {};
        if (!form.description.trim()) e.description = 'Description is required.';
        if (!form.date_from) e.date_from = 'Date From is required.';
        if (!form.date_to) e.date_to = 'Date To is required.';
        if (form.date_from && form.date_to && form.date_to < form.date_from) e.date_to = '"Date To" must be on or after "Date From".';
        if (!form.location.trim()) e.location = 'Place / Location is required.';
        if (!file && !existingDoc) e.document = 'Please upload the instruction letter / email.';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const save = async (status: Status) => {
        if (status === 'draft' && form.date_from && form.date_to && form.date_to < form.date_from) {
            setErrors(e => ({ ...e, date_to: '"Date To" must be on or after "Date From".' }));
            return;
        }
        setSaving(status === 'draft' ? 'draft' : 'submit');

        const fd = new FormData();
        fd.append('status', status);
        fd.append('description', form.description);
        fd.append('date_from', form.date_from);
        fd.append('date_to', form.date_to);
        fd.append('location', form.location);
        fd.append('category', form.category);
        if (form.category === 'group') {
            form.teacherIds.forEach(id => fd.append('teacher_ids[]', String(id)));
            form.studentIds.forEach(id => fd.append('student_ids[]', String(id)));
        }
        if (file) fd.append('document', file);
        if (removeDoc) fd.append('remove_document', '1');

        try {
            const url = editingId ? `/api/work-orders/${editingId}` : '/api/work-orders';
            const res = await axios.post(url, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            const saved: WorkOrder = res.data.data;
            loadOrders();
            if (status === 'submitted') {
                setReviewOpen(false);
                resetForm();
                setTab('list');
                flash('success', 'Work order submitted successfully.');
            } else {
                setEditingId(saved.id);
                setExistingDoc(saved.has_document ? saved.document_name : null);
                setFile(null);
                setRemoveDoc(false);
                setDirty(false);
                setLastSaved(saved.updated_at);
                if (fileRef.current) fileRef.current.value = '';
                flash('success', 'Draft saved.');
            }
        } catch (err: any) {
            const serverErrors = err?.response?.data?.errors;
            if (serverErrors) {
                setErrors(Object.fromEntries(Object.entries(serverErrors).map(([k, v]) => [k, (v as string[])[0]])));
                setReviewOpen(false);
            }
            flash('error', firstError(err, 'Failed to save work order.'));
        } finally {
            setSaving(null);
        }
    };

    const confirmDelete = async () => {
        if (!deleting) return;
        try {
            await axios.delete(`/api/work-orders/${deleting.id}`);
            if (editingId === deleting.id) resetForm();
            flash('success', 'Draft deleted.');
            loadOrders();
        } catch (err) {
            flash('error', firstError(err, 'Failed to delete draft.'));
        } finally {
            setDeleting(null);
        }
    };

    const selectedTeachers = teachers.filter(t => form.teacherIds.includes(t.id));
    const selectedStudents = students.filter(s => form.studentIds.includes(s.id));
    const docName = file?.name ?? existingDoc;

    const saveStatusText = saving
        ? 'Saving…'
        : dirty
            ? (editingId ? 'Unsaved changes' : 'Not saved yet')
            : lastSaved ? `Draft saved · ${fmtDateTime(lastSaved)}` : 'Not saved yet';

    return (
        <div className="max-w-6xl mx-auto space-y-5 pb-10">
            <Toast toast={toast} onClose={() => setToast(null)} />

            {/* Hero */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-role to-role-dark text-white p-6 sm:p-8 shadow-lg">
                <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/5" />
                <div className="absolute right-24 -bottom-24 w-56 h-56 rounded-full bg-white/5" />
                <span className="relative inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-[11px] font-bold uppercase tracking-wider">
                    <Briefcase size={12} /> Work Order Module
                </span>
                <h1 className="relative text-2xl sm:text-3xl font-bold mt-3">Work Order Management</h1>
                <p className="relative text-white/80 text-sm mt-1">Create work orders, attach instruction letters, and manage group participation.</p>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setTab('new')}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${tab === 'new' ? 'bg-role/10 border-role/30 text-role' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                    {editingId ? <Pencil size={16} /> : <Plus size={16} />} {editingId ? 'Edit Draft' : 'New Work Order'}
                </button>
                <button
                    onClick={() => setTab('list')}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${tab === 'list' ? 'bg-role/10 border-role/30 text-role' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                    <ListChecks size={16} /> My Work Orders
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[11px]">{orders.length}</span>
                </button>
            </div>

            {tab === 'new' ? (
                <>
                    <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-role/5 border border-role/10 text-sm text-gray-600">
                        <Info size={16} className="text-role shrink-0 mt-0.5" />
                        <span><b className="text-gray-800">Save as Draft</b> at any time. You can reopen and edit a draft before submitting. Submitted work orders are view-only.</span>
                    </div>

                    {editingId && (
                        <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-800">
                            <span className="flex items-center gap-2"><Pencil size={16} /> Editing draft #{editingId}</span>
                            <button onClick={resetForm} className="font-bold hover:underline">Start a new one instead</button>
                        </div>
                    )}

                    {/* 1. Details */}
                    <Card step={1} title="New Work Order" subtitle="Complete the information based on your official instruction or assignment.">
                        <div className="space-y-5">
                            <div>
                                <Label required>Description</Label>
                                <textarea
                                    rows={3} value={form.description} onChange={e => update('description', e.target.value)}
                                    placeholder="e.g. Attend District Education Office briefing / accompany students for a competition"
                                    className={`${inputCls} resize-y ${errors.description ? 'border-red-300' : ''}`}
                                />
                                {errors.description
                                    ? <p className="text-xs text-red-500 mt-1">{errors.description}</p>
                                    : <p className="text-xs text-gray-400 mt-1">Describe the task or official duty stated in the instruction letter or email.</p>}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <Label required>Date From</Label>
                                    <input type="date" value={form.date_from} onChange={e => update('date_from', e.target.value)} className={`${inputCls} ${errors.date_from ? 'border-red-300' : ''}`} />
                                    {errors.date_from && <p className="text-xs text-red-500 mt-1">{errors.date_from}</p>}
                                </div>
                                <div>
                                    <Label required>Date To</Label>
                                    <input type="date" value={form.date_to} min={form.date_from || undefined} onChange={e => update('date_to', e.target.value)} className={`${inputCls} ${errors.date_to ? 'border-red-300' : ''}`} />
                                    {errors.date_to && <p className="text-xs text-red-500 mt-1">{errors.date_to}</p>}
                                </div>
                            </div>
                            <div>
                                <Label required>Place / Location</Label>
                                <input value={form.location} onChange={e => update('location', e.target.value)} placeholder="e.g. Dewan PPD Temerloh, Pahang" className={`${inputCls} ${errors.location ? 'border-red-300' : ''}`} />
                                {errors.location && <p className="text-xs text-red-500 mt-1">{errors.location}</p>}
                            </div>
                        </div>
                    </Card>

                    {/* 2. Category */}
                    <Card step={2} title="Work Order Category" subtitle="Choose whether this assignment is for you only or involves other participants.">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {([
                                { v: 'individual', title: 'Individual', desc: 'Official assignment involving you only', Icon: User },
                                { v: 'group', title: 'Group', desc: 'Assignment with other teachers and/or students', Icon: Users },
                            ] as const).map(({ v, title, desc, Icon }) => {
                                const on = form.category === v;
                                return (
                                    <button
                                        key={v} type="button" onClick={() => update('category', v)}
                                        className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${on ? 'border-role bg-role/5 ring-2 ring-role/10' : 'border-gray-200 hover:border-gray-300'}`}
                                    >
                                        <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${on ? 'border-role' : 'border-gray-300'}`}>
                                            {on && <span className="w-2.5 h-2.5 rounded-full bg-role" />}
                                        </span>
                                        <span className="w-10 h-10 rounded-lg bg-role/10 text-role flex items-center justify-center shrink-0"><Icon size={18} /></span>
                                        <span>
                                            <span className="block font-bold text-sm text-gray-800">{title}</span>
                                            <span className="block text-xs text-gray-500">{desc}</span>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </Card>

                    {/* 3. Participants (group only) */}
                    {form.category === 'group' && (
                        <Card step={3} title="Group Participants" subtitle="Select the teachers and students taking part in the assignment.">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-4">
                                <Check size={12} /> You ({myName}) are included automatically.
                            </span>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <PickerList
                                    title="Teachers involved" hint="Search and select one or more teachers."
                                    placeholder="Search teacher's name..." people={teachers}
                                    selected={form.teacherIds} onToggle={id => toggle('teacherIds', id)}
                                />
                                <PickerList
                                    title="Students involved" hint="Search students across school classes."
                                    placeholder="Search student's name or class..." people={students}
                                    selected={form.studentIds} onToggle={id => toggle('studentIds', id)} showClass
                                />
                            </div>
                        </Card>
                    )}

                    {/* 4. Document */}
                    <Card step={form.category === 'group' ? 4 : 3} title="Supporting Document" subtitle="Attach the official instruction letter or email as supporting evidence.">
                        <Label required>Upload Surat / Email Arahan</Label>
                        <input ref={fileRef} type="file" accept={ACCEPT} className="hidden" onChange={e => pickFile(e.target.files?.[0])} />
                        {docName ? (
                            <div className="flex items-center gap-3 p-4 rounded-xl border border-role/20 bg-role/5">
                                <span className="w-10 h-10 rounded-lg bg-white text-role flex items-center justify-center border border-role/10"><FileText size={18} /></span>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-gray-800 truncate">{docName}</p>
                                    <p className="text-xs text-gray-500">
                                        {file ? fmtSize(file.size) : (
                                            <a href={`/api/work-orders/${editingId}/document`} target="_blank" rel="noreferrer" className="text-role hover:underline">Saved with draft · view</a>
                                        )}
                                    </p>
                                </div>
                                <button type="button" onClick={() => fileRef.current?.click()} className="px-3 py-1.5 rounded-lg text-xs font-bold text-role hover:bg-role/10">Replace</button>
                                <button type="button" onClick={clearDoc} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500"><Trash2 size={16} /></button>
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileRef.current?.click()}
                                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={e => { e.preventDefault(); setDragOver(false); pickFile(e.dataTransfer.files?.[0]); }}
                                className={`w-full flex flex-col items-center justify-center gap-2 py-10 rounded-xl border-2 border-dashed transition-all ${dragOver ? 'border-role bg-role/5' : errors.document ? 'border-red-300 bg-red-50/30' : 'border-gray-200 bg-gray-50/50 hover:border-role/40'}`}
                            >
                                <span className="w-11 h-11 rounded-xl bg-role/10 text-role flex items-center justify-center"><Upload size={20} /></span>
                                <span className="text-sm font-bold text-role">Click to upload or drop a file here</span>
                                <span className="text-xs text-gray-400">Accepted: PDF, DOC, DOCX, JPG, PNG, EML, MSG · Maximum 10 MB</span>
                            </button>
                        )}
                        {errors.document && <p className="text-xs text-red-500 mt-2">{errors.document}</p>}
                    </Card>

                    {/* Action bar */}
                    <div className="sticky bottom-4 z-20 bg-white rounded-2xl border border-gray-100 shadow-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex-1">
                            <p className={`text-sm font-bold ${dirty ? 'text-amber-600' : 'text-role'}`}>{saveStatusText}</p>
                            <p className="text-xs text-gray-400">Save as Draft to keep your latest changes.</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={resetForm} disabled={!!saving}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                                <RotateCcw size={15} /> Clear Form
                            </button>
                            <button type="button" onClick={() => save('draft')} disabled={!!saving}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-role text-role text-sm font-bold hover:bg-role/5 disabled:opacity-50">
                                {saving === 'draft' ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save as Draft
                            </button>
                            <button type="button" onClick={() => validateForSubmit() && setReviewOpen(true)} disabled={!!saving}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-role text-white text-sm font-bold hover:bg-role-dark shadow-md disabled:opacity-50">
                                <Check size={15} /> Review & Submit
                            </button>
                        </div>
                    </div>
                </>
            ) : (
                /* ── My Work Orders ── */
                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                    <div className="px-5 sm:px-6 py-4 border-b border-gray-100">
                        <h2 className="text-lg font-bold text-role">My Work Orders</h2>
                        <p className="text-sm text-gray-500">Drafts you can continue editing, submitted work orders, and assignments you were added to.</p>
                    </div>
                    {loadingOrders ? (
                        <div className="flex items-center justify-center gap-2 py-16 text-gray-400 text-sm"><Loader2 size={18} className="animate-spin" /> Loading…</div>
                    ) : orders.length === 0 ? (
                        <div className="py-16 text-center">
                            <Briefcase size={32} className="mx-auto text-gray-300" />
                            <p className="text-sm text-gray-500 mt-3">No work orders yet.</p>
                            <button onClick={() => setTab('new')} className="mt-3 text-sm font-bold text-role hover:underline">Create your first work order</button>
                        </div>
                    ) : (
                        <ul className="divide-y divide-gray-50">
                            {orders.map(o => (
                                <li key={o.id} className="px-5 sm:px-6 py-4 flex flex-col md:flex-row md:items-center gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <StatusBadge status={o.status} />
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 capitalize">
                                                {o.category === 'group' ? <Users size={12} /> : <User size={12} />} {o.category}
                                            </span>
                                            {!o.is_owner && <span className="text-xs text-gray-500">Added by {o.created_by}</span>}
                                            <span className="text-[11px] text-gray-400">#{o.id}</span>
                                        </div>
                                        <p className="font-semibold text-gray-800 truncate">{o.description || <span className="italic text-gray-400">No description</span>}</p>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mt-1">
                                            <span className="inline-flex items-center gap-1"><Calendar size={12} /> {fmtDate(o.date_from)} – {fmtDate(o.date_to)}</span>
                                            {o.location && <span className="inline-flex items-center gap-1"><MapPin size={12} /> {o.location}</span>}
                                            {o.category === 'group' && <span className="inline-flex items-center gap-1"><Users size={12} /> {o.teachers.length + 1} teachers · {o.students.length} students</span>}
                                            {o.status === 'submitted' && <span className="inline-flex items-center gap-1 text-role font-semibold"><CheckCircle2 size={12} /> {o.credited_days} school day{o.credited_days === 1 ? '' : 's'} credited</span>}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <button onClick={() => setViewing(o)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"><Eye size={14} /> View</button>
                                        {o.is_owner && o.status === 'draft' && (
                                            <>
                                                <button onClick={() => loadIntoForm(o)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-role/10 text-xs font-bold text-role hover:bg-role/20"><Pencil size={14} /> Edit</button>
                                                <button onClick={() => setDeleting(o)} className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500"><Trash2 size={16} /></button>
                                            </>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            )}

            {/* Review modal */}
            {reviewOpen && (
                <Modal
                    title="Review Work Order" onClose={() => !saving && setReviewOpen(false)}
                    footer={<>
                        <button onClick={() => setReviewOpen(false)} disabled={!!saving} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50">Back to Edit</button>
                        <button onClick={() => save('submitted')} disabled={!!saving} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-role text-white text-sm font-bold hover:bg-role-dark disabled:opacity-50">
                            {saving === 'submit' ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Confirm & Submit
                        </button>
                    </>}
                >
                    <div className="flex items-start gap-2 px-3 py-2.5 mb-5 rounded-lg bg-amber-50 border border-amber-100 text-xs text-amber-800">
                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                        <span>Once submitted, this work order can no longer be edited. You{form.category === 'group' ? ' and every selected participant' : ''} will be credited as <b>present</b> for each school day from {fmtDate(form.date_from)} to {fmtDate(form.date_to)} (weekends and school-closed days are skipped).</span>
                    </div>
                    <Summary
                        description={form.description} dateFrom={form.date_from} dateTo={form.date_to} location={form.location}
                        category={form.category} teachers={selectedTeachers} students={selectedStudents}
                        docLabel={docName} creator={myName}
                    />
                </Modal>
            )}

            {/* View modal */}
            {viewing && (
                <Modal
                    title={`Work Order #${viewing.id}`} onClose={() => setViewing(null)}
                    footer={viewing.is_owner && viewing.status === 'draft' ? (
                        <button onClick={() => { loadIntoForm(viewing); setViewing(null); }} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-role text-white text-sm font-bold hover:bg-role-dark"><Pencil size={15} /> Edit Draft</button>
                    ) : undefined}
                >
                    <div className="flex flex-wrap items-center gap-2 mb-5">
                        <StatusBadge status={viewing.status} />
                        <span className="text-xs text-gray-500">
                            {viewing.status === 'submitted' ? `Submitted ${fmtDateTime(viewing.submitted_at)}` : `Last saved ${fmtDateTime(viewing.updated_at)}`}
                        </span>
                        {viewing.status === 'submitted' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-role/10 text-role">
                                <Calendar size={12} /> Attendance credited: {viewing.credited_days} school day{viewing.credited_days === 1 ? '' : 's'}
                            </span>
                        )}
                    </div>
                    <Summary
                        description={viewing.description} dateFrom={viewing.date_from} dateTo={viewing.date_to} location={viewing.location}
                        category={viewing.category} teachers={viewing.teachers} students={viewing.students}
                        docLabel={viewing.has_document ? viewing.document_name : null}
                        docHref={viewing.has_document ? `/api/work-orders/${viewing.id}/document` : undefined}
                        creator={viewing.created_by || myName}
                    />
                </Modal>
            )}

            {/* Delete confirm */}
            {deleting && (
                <Modal
                    title="Delete draft?" onClose={() => setDeleting(null)}
                    footer={<>
                        <button onClick={() => setDeleting(null)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
                        <button onClick={confirmDelete} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700"><Trash2 size={15} /> Delete</button>
                    </>}
                >
                    <p className="text-sm text-gray-600">This will permanently delete draft <b>#{deleting.id}</b> and its attached document.</p>
                </Modal>
            )}
        </div>
    );
};

export default function WorkOrderPage() {
    return <DashboardLayout activePageId="work-order"><WorkOrderContent /></DashboardLayout>;
}
