import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import {
    Briefcase, Info, User, Users, Search, Calendar, MapPin, Loader2, AlertCircle,
    CheckCircle2, GraduationCap, Clock, ChevronLeft, ChevronRight, RotateCcw, Mail, Phone, IdCard,
} from 'lucide-react';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { WorkOrder, Summary, Modal, Detail, fmtDate, fmtDateTime } from './WorkOrder';

axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Timing = 'upcoming' | 'ongoing' | 'completed';

const todayStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const timingOf = (o: WorkOrder, today: string): Timing => {
    if (o.date_from && o.date_from > today) return 'upcoming';
    if (o.date_to && o.date_to < today) return 'completed';
    return 'ongoing';
};

const dayCount = (from: string | null, to: string | null) => {
    if (!from || !to) return 0;
    return Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000) + 1;
};

const TIMING_STYLE: Record<Timing, string> = {
    upcoming:  'bg-sky-50 text-sky-700 border-sky-100',
    ongoing:   'bg-amber-50 text-amber-700 border-amber-100',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
};

const TimingBadge = ({ timing }: { timing: Timing }) => (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border capitalize ${TIMING_STYLE[timing]}`}>{timing}</span>
);

const CategoryBadge = ({ category }: { category: WorkOrder['category'] }) => (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 capitalize">
        {category === 'group' ? <Users size={12} /> : <User size={12} />} {category}
    </span>
);

const StatCard = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 flex items-center gap-4">
        <span className="w-11 h-11 rounded-xl bg-role/10 text-role flex items-center justify-center shrink-0"><Icon size={20} /></span>
        <div className="min-w-0">
            <p className="text-2xl font-bold text-gray-800 leading-tight">{value}</p>
            <p className="text-xs text-gray-500 truncate">{label}</p>
        </div>
    </div>
);

const selectCls = 'px-3 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:border-role focus:ring-2 focus:ring-role/10 outline-none';
const PER_PAGE = 10;

// ─── Page ─────────────────────────────────────────────────────────────────────

const AdminWorkOrderContent = () => {
    const [orders, setOrders] = useState<WorkOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [q, setQ] = useState('');
    const [category, setCategory] = useState<'' | WorkOrder['category']>('');
    const [timing, setTiming] = useState<'' | Timing>('');
    const [month, setMonth] = useState('');
    const [page, setPage] = useState(1);
    const [viewing, setViewing] = useState<WorkOrder | null>(null);

    const today = todayStr();

    useEffect(() => {
        axios.get('/api/admin/work-orders')
            .then(res => setOrders(res.data.data))
            .catch(err => setError(err?.response?.data?.message || 'Could not load work orders.'))
            .finally(() => setLoading(false));
    }, []);

    const stats = useMemo(() => {
        const teachers = new Set<number>();
        const students = new Set<number>();
        orders.forEach(o => {
            if (o.creator) teachers.add(o.creator.id);
            o.teachers.forEach(t => teachers.add(t.id));
            o.students.forEach(s => students.add(s.id));
        });
        return {
            total: orders.length,
            ongoing: orders.filter(o => timingOf(o, today) === 'ongoing').length,
            teachers: teachers.size,
            students: students.size,
        };
    }, [orders, today]);

    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        return orders.filter(o => {
            if (category && o.category !== category) return false;
            if (timing && timingOf(o, today) !== timing) return false;
            // A month matches when the work order overlaps any day of it.
            if (month && !((o.date_from ?? '') <= `${month}-31` && (o.date_to ?? '') >= `${month}-01`)) return false;
            if (!s) return true;
            return [o.created_by, o.description, o.location, `#${o.id}`, o.creator?.ic_number,
                ...o.teachers.map(t => t.name), ...o.students.map(st => st.name)]
                .some(v => (v ?? '').toLowerCase().includes(s));
        });
    }, [orders, q, category, timing, month, today]);

    useEffect(() => setPage(1), [q, category, timing, month]);

    const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const rows = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const hasFilter = !!(q || category || timing || month);

    return (
        <div className="space-y-6">
            {/* Hero */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-role to-role-dark text-white p-6 sm:p-8 shadow-lg">
                <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/5" />
                <div className="absolute right-24 -bottom-24 w-56 h-56 rounded-full bg-white/5" />
                <span className="relative inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-[11px] font-bold uppercase tracking-wider">
                    <Briefcase size={12} /> Work Order Module
                </span>
                <h1 className="relative text-2xl sm:text-3xl font-bold mt-3">Teacher Work Orders</h1>
                <p className="relative text-white/80 text-sm mt-1">Work orders submitted by teachers, with their participants and instruction letters.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard icon={Briefcase} label="Submitted work orders" value={stats.total} />
                <StatCard icon={Clock} label="Ongoing today" value={stats.ongoing} />
                <StatCard icon={Users} label="Teachers involved" value={stats.teachers} />
                <StatCard icon={GraduationCap} label="Students involved" value={stats.students} />
            </div>

            {/* List */}
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="px-5 sm:px-6 py-4 border-b border-gray-100 space-y-3">
                    <div>
                        <h2 className="text-lg font-bold text-role">Submitted Work Orders</h2>
                        <p className="text-sm text-gray-500">Drafts are not shown. Press <b>Info</b> to see the full details.</p>
                    </div>
                    <div className="flex flex-col lg:flex-row gap-2">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                value={q} onChange={e => setQ(e.target.value)}
                                placeholder="Search teacher, IC, description, location, participant…"
                                className={`${selectCls} w-full pl-9`}
                            />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex gap-2">
                            <select value={category} onChange={e => setCategory(e.target.value as any)} className={`${selectCls} pr-9`}>
                                <option value="">All categories</option>
                                <option value="individual">Individual</option>
                                <option value="group">Group</option>
                            </select>
                            <select value={timing} onChange={e => setTiming(e.target.value as any)} className={`${selectCls} pr-9`}>
                                <option value="">All periods</option>
                                <option value="upcoming">Upcoming</option>
                                <option value="ongoing">Ongoing</option>
                                <option value="completed">Completed</option>
                            </select>
                            <input type="month" value={month} onChange={e => setMonth(e.target.value)} className={selectCls} title="Month" />
                            {hasFilter && (
                                <button
                                    onClick={() => { setQ(''); setCategory(''); setTiming(''); setMonth(''); }}
                                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50"
                                >
                                    <RotateCcw size={14} /> Reset
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center gap-2 py-16 text-gray-400 text-sm"><Loader2 size={18} className="animate-spin" /> Loading…</div>
                ) : error ? (
                    <div className="flex items-center justify-center gap-2 py-16 text-red-500 text-sm"><AlertCircle size={18} /> {error}</div>
                ) : filtered.length === 0 ? (
                    <div className="py-16 text-center">
                        <Briefcase size={32} className="mx-auto text-gray-300" />
                        <p className="text-sm text-gray-500 mt-3">{orders.length === 0 ? 'No teacher has submitted a work order yet.' : 'No work orders match your filters.'}</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                        <th className="px-5 py-3 w-12">No.</th>
                                        <th className="px-3 py-3">Teacher</th>
                                        <th className="px-3 py-3">Work Order</th>
                                        <th className="px-3 py-3">Date</th>
                                        <th className="px-3 py-3">Category</th>
                                        <th className="px-3 py-3">Status</th>
                                        <th className="px-5 py-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {rows.map((o, i) => (
                                        <tr key={o.id} className="hover:bg-gray-50/60 align-top">
                                            <td className="px-5 py-4 text-gray-400">{(page - 1) * PER_PAGE + i + 1}</td>
                                            <td className="px-3 py-4">
                                                <p className="font-semibold text-gray-800">{o.created_by || '-'}</p>
                                                <p className="text-xs text-gray-400">{o.creator?.ic_number || '-'}</p>
                                            </td>
                                            <td className="px-3 py-4 max-w-xs">
                                                <p className="font-semibold text-gray-800 line-clamp-2">{o.description || '-'}</p>
                                                <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                                    <span>#{o.id}</span>
                                                    {o.location && <><span>·</span><MapPin size={11} /><span className="truncate">{o.location}</span></>}
                                                </p>
                                            </td>
                                            <td className="px-3 py-4 whitespace-nowrap">
                                                <p className="text-gray-700">{fmtDate(o.date_from)} – {fmtDate(o.date_to)}</p>
                                                <p className="text-xs text-gray-400">{dayCount(o.date_from, o.date_to)} day(s)</p>
                                            </td>
                                            <td className="px-3 py-4">
                                                <CategoryBadge category={o.category} />
                                                {o.category === 'group' && (
                                                    <p className="text-xs text-gray-400 mt-1">{o.teachers.length + 1} teachers · {o.students.length} students</p>
                                                )}
                                            </td>
                                            <td className="px-3 py-4"><TimingBadge timing={timingOf(o, today)} /></td>
                                            <td className="px-5 py-4 text-right">
                                                <button
                                                    onClick={() => setViewing(o)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-role/10 text-xs font-bold text-role hover:bg-role/20"
                                                >
                                                    <Info size={14} /> Info
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile cards */}
                        <ul className="md:hidden divide-y divide-gray-50">
                            {rows.map(o => (
                                <li key={o.id} className="px-5 py-4 space-y-2">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-gray-800">{o.created_by || '-'}</p>
                                            <p className="text-xs text-gray-400">#{o.id} · {o.creator?.ic_number || '-'}</p>
                                        </div>
                                        <button
                                            onClick={() => setViewing(o)}
                                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-role/10 text-xs font-bold text-role shrink-0"
                                        >
                                            <Info size={14} /> Info
                                        </button>
                                    </div>
                                    <p className="text-sm text-gray-700 line-clamp-2">{o.description || '-'}</p>
                                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                        <TimingBadge timing={timingOf(o, today)} />
                                        <CategoryBadge category={o.category} />
                                        <span className="inline-flex items-center gap-1"><Calendar size={12} /> {fmtDate(o.date_from)} – {fmtDate(o.date_to)}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        {/* Pagination */}
                        <div className="px-5 sm:px-6 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                            <span>Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}</span>
                            <div className="flex items-center gap-1">
                                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"><ChevronLeft size={14} /></button>
                                <span className="px-2 font-semibold text-gray-700">{page} / {pages}</span>
                                <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"><ChevronRight size={14} /></button>
                            </div>
                        </div>
                    </>
                )}
            </section>

            {/* Info modal */}
            {viewing && (
                <Modal
                    title={`Work Order #${viewing.id}`}
                    onClose={() => setViewing(null)}
                    footer={<button onClick={() => setViewing(null)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50">Close</button>}
                >
                    <div className="flex flex-wrap items-center gap-2 mb-5">
                        <TimingBadge timing={timingOf(viewing, today)} />
                        <span className="text-xs text-gray-500">Submitted {fmtDateTime(viewing.submitted_at)}</span>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-role">
                            <CheckCircle2 size={12} /> Attendance credited: {viewing.credited_days} school day{viewing.credited_days === 1 ? '' : 's'}
                        </span>
                    </div>

                    <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 mb-5">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-3">Submitted By</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Detail label="Teacher"><span className="inline-flex items-center gap-1.5"><User size={14} className="text-role" /> {viewing.created_by || '-'}</span></Detail>
                            <Detail label="IC Number"><span className="inline-flex items-center gap-1.5"><IdCard size={14} className="text-role" /> {viewing.creator?.ic_number || '-'}</span></Detail>
                            <Detail label="Email"><span className="inline-flex items-center gap-1.5 break-all"><Mail size={14} className="text-role shrink-0" /> {viewing.creator?.email || '-'}</span></Detail>
                            <Detail label="Phone"><span className="inline-flex items-center gap-1.5"><Phone size={14} className="text-role" /> {viewing.creator?.phone || '-'}</span></Detail>
                        </div>
                    </div>

                    <Summary
                        description={viewing.description} dateFrom={viewing.date_from} dateTo={viewing.date_to} location={viewing.location}
                        category={viewing.category} teachers={viewing.teachers} students={viewing.students}
                        docLabel={viewing.has_document ? viewing.document_name : null}
                        docHref={viewing.has_document ? `/api/work-orders/${viewing.id}/document` : undefined}
                        creator={viewing.created_by || '-'}
                    />
                </Modal>
            )}
        </div>
    );
};

export default function AdminWorkOrderPage() {
    return <DashboardLayout activePageId="work-orders"><AdminWorkOrderContent /></DashboardLayout>;
}
