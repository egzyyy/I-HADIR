import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, AlertCircle, CheckCircle } from 'lucide-react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

export default function PublicEventRegistration() {
    const { id } = useParams<{ id: string }>();
    const [eventName, setEventName] = useState('');

    const [userType, setUserType] = useState<'parent' | 'outsider'>('parent');
    const [name, setName] = useState('');
    const [icNumber, setIcNumber] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');

    const [parentSearched, setParentSearched] = useState(false);
    const [searchingParent, setSearchingParent] = useState(false);
    const [parentChildren, setParentChildren] = useState<{ id: number, name: string, class: string }[]>([]);
    const [selectedChildren, setSelectedChildren] = useState<Set<string>>(new Set());

    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Reset form when type changes
    useEffect(() => {
        setName(''); setIcNumber(''); setPhone(''); setEmail('');
        setErrorMsg(null); setSuccessMsg(null);
        setParentSearched(false); setParentChildren([]); setSelectedChildren(new Set());
    }, [userType]);

    useEffect(() => {
        // Fetch event name from backend
        const fetchEventName = async () => {
            try {
                const response = await axios.get(`/api/events/${id}`);
                setEventName(response.data.data.name);
            } catch (error) {
                console.error('Failed to fetch event name:', error);
            }
        };
        fetchEventName();
    }, [id]);

    const handleSearchParent = async () => {
        if (!icNumber.trim()) { setErrorMsg("Please enter your IC number."); return; }
        setSearchingParent(true);
        setErrorMsg(null);
        try {
            // Using the public unauthenticated endpoint
            const res = await axios.post(`/api/events/${id}/public-parent-check`, { ic_number: icNumber });
            setName(res.data.parent_name || '');
            setPhone(res.data.parent_phone || '');
            setParentChildren(res.data.children || []);
            setSelectedChildren(new Set(res.data.children.map((c: any) => c.name)));
            setParentSearched(true);
        } catch (err: any) {
            setErrorMsg(err.response?.data?.message || 'No children found. You can proceed to register manually.');
            setParentSearched(true);
        } finally {
            setSearchingParent(false);
        }
    };

    const toggleChild = (childName: string) => {
        setSelectedChildren(prev => {
            const next = new Set(prev);
            if (next.has(childName)) next.delete(childName);
            else next.add(childName);
            return next;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) { setErrorMsg('Name is required.'); return; }
        if (!phone.trim()) { setErrorMsg('Phone number is required.'); return; }

        if (userType === 'parent' && selectedChildren.size === 0 && parentChildren.length > 0) {
            setErrorMsg('Please select at least one child.'); return;
        }

        setSaving(true);
        setErrorMsg(null);
        try {
            await axios.post(`/api/events/${id}/public-registration`, {
                name: name.trim(),
                user_type: userType,
                ic_number: userType === 'parent' ? (icNumber.trim() || null) : null,
                phone: phone.trim(),
                email: email.trim() || null,
                children: userType === 'parent' ? Array.from(selectedChildren) : null,
            });
            setSuccessMsg('Registration successful! You may now close this page.');
        } catch (err: any) {
            setErrorMsg(err.response?.data?.message || 'Failed to register.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8f9fc] pb-20 font-sans text-[#1c3068]">

            {/* Header matching ParentsReport.tsx exactly */}
            <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div>
                                <h1 className="text-xl font-black text-[#1c3068] uppercase tracking-wide">Event Registration</h1>
                                <p className="text-xs text-gray-500 mt-1">Please register your attendance here.</p>
                            </div>
                        </div>
                        <div className="flex items-center text-xs text-gray-500 font-medium bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                            <span className="text-[#1c3068] font-bold">I-HADIR</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {eventName ? (
                    <h1 className="text-2xl font-bold text-gray-800">{eventName}</h1>
                ) : (
                    <h1 className="text-2xl font-bold text-gray-800">Event Registration</h1>
                )}

                {/* Modals */}
                <AnimatePresence>
                    {errorMsg && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-8 text-center">
                                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6"><AlertCircle size={40} className="text-red-500" /></div>
                                <h3 className="text-2xl font-bold text-gray-800 mb-2">Error</h3>
                                <p className="text-gray-500 mb-8">{errorMsg}</p>
                                <button onClick={() => setErrorMsg(null)} className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold shadow-lg transition-all">Close</button>
                            </motion.div>
                        </div>
                    )}
                    {successMsg && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-8 text-center">
                                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle size={40} className="text-green-500" /></div>
                                <h3 className="text-2xl font-bold text-gray-800 mb-2">Success</h3>
                                <p className="text-gray-500 mb-8">{successMsg}</p>
                                <button
                                    onClick={() => { setSuccessMsg(null); window.location.reload(); }}
                                    className="w-full bg-[#10b981] hover:bg-[#059669] text-white py-3 rounded-xl font-bold shadow-lg transition-all"
                                >
                                    Done
                                </button>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Form Card */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <div className="mb-6 border-b border-gray-100 pb-4">
                        <h2 className="text-lg font-bold text-[#1c3068]">Check In</h2>
                        <div className="flex mt-4 gap-2 bg-gray-50 p-1.5 rounded-lg w-max">
                            <button onClick={() => setUserType('parent')} className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${userType === 'parent' ? 'bg-white text-[#1c3068] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Parent</button>
                            <button onClick={() => setUserType('outsider')} className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${userType === 'outsider' ? 'bg-white text-[#1c3068] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Public / Outsider</button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">

                        {userType === 'parent' && (
                            <>
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-[#1c3068]"><span className="text-[#c7393b] mr-1">*</span> Parent IC Number</label>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <input type="text" value={icNumber} onChange={e => setIcNumber(e.target.value.replace(/\D/g, ''))} maxLength={12} placeholder="e.g. 801010112233" className="flex-1 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all font-mono" />
                                        <button type="button" onClick={handleSearchParent} disabled={searchingParent || icNumber.length < 12} className="bg-[#1c3068] hover:bg-[#152450] disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-[#1c3068]/20 transition-all uppercase tracking-wider text-sm w-full sm:w-auto">
                                            {searchingParent ? '...' : 'Search'}
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">Enter the 12-digit IC number without dashes or spaces.</p>
                                </div>

                                {parentSearched && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-bold text-[#1c3068]"><span className="text-[#c7393b] mr-1">*</span> Full Name</label>
                                            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Parent Name" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1c3068] outline-none transition-all" />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="block text-sm font-bold text-[#1c3068]"><span className="text-[#c7393b] mr-1">*</span> Phone Number</label>
                                                <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="01X-XXXXXXX" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1c3068] outline-none transition-all font-mono" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-sm font-bold text-[#1c3068]">Email <span className="text-gray-400 font-normal">(Optional)</span></label>
                                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="parent@email.com" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1c3068] outline-none transition-all" />
                                            </div>
                                        </div>

                                        {parentChildren.length > 0 && (
                                            <div className="space-y-3 pt-2">
                                                <label className="block text-sm font-bold text-[#1c3068]">Represent Child:</label>
                                                <div className="space-y-2 border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                                                    {parentChildren.map(child => (
                                                        <label key={child.id} className="flex items-center gap-4 cursor-pointer group hover:bg-white p-2 rounded-lg transition-colors">
                                                            <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-all ${selectedChildren.has(child.name) ? 'border-[#1c3068] bg-[#1c3068]' : 'border-gray-300 group-hover:border-[#1c3068]'}`}>
                                                                {selectedChildren.has(child.name) && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-bold text-[#c7393b]">{child.name}</span>
                                                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{child.class}</span>
                                                            </div>
                                                            <input type="checkbox" className="hidden" checked={selectedChildren.has(child.name)} onChange={() => toggleChild(child.name)} />
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="pt-6 border-t border-gray-100">
                                            <button type="submit" disabled={saving || !name} className="w-full bg-[#1c3068] hover:bg-[#152450] disabled:opacity-60 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-[#1c3068]/20 transition-all uppercase tracking-wider">
                                                {saving ? 'Registering...' : 'Register Attendance'}
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </>
                        )}

                        {userType === 'outsider' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-[#1c3068]"><span className="text-[#c7393b] mr-1">*</span> Full Name</label>
                                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Enter your full name" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all" />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-[#1c3068]"><span className="text-[#c7393b] mr-1">*</span> Phone Number</label>
                                    <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="01X-XXXXXXX" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all font-mono" />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-[#1c3068]">Email <span className="text-gray-400 font-normal">(Optional)</span></label>
                                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all" />
                                </div>

                                <div className="pt-6 border-t border-gray-100">
                                    <button type="submit" disabled={saving || !name || !phone} className="w-full bg-[#1c3068] hover:bg-[#152450] disabled:opacity-60 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-[#1c3068]/20 transition-all uppercase tracking-wider">
                                        {saving ? 'Registering...' : 'Register Attendance'}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}