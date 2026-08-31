import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';

// ─── ADDED 'vip' TO THE TYPE ──────────────────────────────────────────────────
type ParticipantKey = 'teacher' | 'student' | 'staff' | 'parent' | 'vip' | 'outsider';

const PARTICIPANT_LABELS: { key: ParticipantKey; label: string }[] = [
    { key: 'teacher', label: 'Teacher' },
    { key: 'student', label: 'Student' },
    { key: 'staff', label: 'School Staff' },
    { key: 'parent', label: 'Parent' },
    { key: 'vip', label: 'VIP' },
    { key: 'outsider', label: 'Outsider' },
];

export interface EventItem {
    id: number; name: string; date: string; time: string | null;
    spot: string; description: string | null; participantTypes: string[]; bannerUrl: string | null;
}

// ── Checkbox Component ────────────────────────────────────────────────────────
const Checkbox = ({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) => (
    <label className="flex items-center gap-3 cursor-pointer group" onClick={onChange}>
        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${checked ? 'border-role bg-role' : 'border-gray-300 group-hover:border-role'}`}>
            {checked && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
        </div>
        <span className="text-gray-600">{label}</span>
    </label>
);

// ── Event Form Component ──────────────────────────────────────────────────────
const EventForm = ({ name, setName, date, setDate, time, setTime, location, setLocation, description, setDescription,
    participants, toggleParticipant, imagePreview, onImageChange, onRemoveImage }: any) => (
    <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-bold text-gray-700"><span className="text-red-500 mr-1">*</span> Event Name e.g. "Sukaneka"</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Event Name"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-role focus:ring-2 focus:ring-role/10 outline-none transition-all placeholder:text-gray-400" />
            </div>
            <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700"><span className="text-red-500 mr-1">*</span> Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-role focus:ring-2 focus:ring-role/10 outline-none transition-all text-gray-700" />
            </div>
            <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700"><span className="text-red-500 mr-1">*</span> Time</label>
                <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-role focus:ring-2 focus:ring-role/10 outline-none transition-all text-gray-700" />
            </div>
            <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-700">Participant</label>
                <div className="space-y-2">
                    {PARTICIPANT_LABELS.map(p => <Checkbox key={p.key} checked={participants[p.key]} onChange={() => toggleParticipant(p.key)} label={p.label} />)}
                </div>
            </div>
            <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700"><span className="text-red-500 mr-1">*</span> Event Spot e.g. "Padang Besar"</label>
                <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Event Spot"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-role focus:ring-2 focus:ring-role/10 outline-none transition-all placeholder:text-gray-400" />
            </div>
            <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-bold text-gray-700">Event Details</label>
                <textarea rows={4} value={description} onChange={e => setDescription(e.target.value)} placeholder="Little explanation about this event."
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-role focus:ring-2 focus:ring-role/10 outline-none transition-all placeholder:text-gray-400 resize-none" />
            </div>
            <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-bold text-gray-700">Event Image / Banner / Poster</label>
                {imagePreview ? (
                    <div className="relative group">
                        <img src={imagePreview} alt="Event preview" className="w-full h-64 object-cover rounded-lg border-2 border-gray-200" />
                        <button type="button" onClick={onRemoveImage} className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"><X size={20} /></button>
                    </div>
                ) : (
                    <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <svg className="w-12 h-12 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                            <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                            <p className="text-xs text-gray-400">PNG, JPG, GIF up to 10MB</p>
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={onImageChange} />
                    </label>
                )}
            </div>
        </div>
    </>
);

// ── Edit Event Modal Main Component ───────────────────────────────────────────
export const EditEventModal = ({ isOpen, onClose, item, onSaved }: { isOpen: boolean; onClose: () => void; item: EventItem | null; onSaved: () => void }) => {
    const [name, setName] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');

    // ─── ADDED 'vip: false' HERE ────────────────────────────────────────────────
    const [participants, setParticipants] = useState<Record<ParticipantKey, boolean>>({ teacher: false, student: false, staff: false, parent: false, vip: false });

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [removeBanner, setRemoveBanner] = useState(false);

    // States for processing and feedback modals
    const [saving, setSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    useEffect(() => {
        if (item && isOpen) {
            setName(item.name);
            const [dd, mm, yyyy] = item.date.split('/');
            setDate(`${yyyy}-${mm}-${dd}`);
            setTime(item.time ?? '');
            setLocation(item.spot === '-' ? '' : item.spot);
            setDescription(item.description ?? '');
            setParticipants({ teacher: false, student: false, staff: false, parent: false, vip: false, ...Object.fromEntries((item.participantTypes ?? []).map(t => [t, true])) } as Record<ParticipantKey, boolean>);
            setImagePreview(item.bannerUrl);
            setImageFile(null);
            setRemoveBanner(false);
            setErrorMsg(null);
            setShowSuccessModal(false);
        }
    }, [item, isOpen]);

    if (!isOpen || !item) return null;

    const toggleParticipant = (k: ParticipantKey) => setParticipants(prev => ({ ...prev, [k]: !prev[k] }));

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0]; if (!f) return; setImageFile(f);
        const r = new FileReader(); r.onloadend = () => setImagePreview(r.result as string); r.readAsDataURL(f);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) { setErrorMsg('Event name is required.'); return; }
        if (!date) { setErrorMsg('Date is required.'); return; }

        const selectedTypes = (Object.keys(participants) as ParticipantKey[]).filter(k => participants[k]);
        if (selectedTypes.length === 0) { setErrorMsg('Select at least one participant type.'); return; }

        setSaving(true);
        setErrorMsg(null);
        try {
            const fd = new FormData();
            fd.append('name', name.trim());
            fd.append('event_date', date);
            if (time) fd.append('event_time', time);
            fd.append('location', location);
            fd.append('description', description);
            selectedTypes.forEach(t => fd.append('participant_types[]', t));
            if (imageFile) fd.append('banner', imageFile);
            if (removeBanner) fd.append('remove_banner', '1');
            fd.append('_method', 'PUT'); // Required for Laravel file uploads on PUT requests

            await axios.post(`/api/events/${item.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });

            // Trigger Success Modal
            setShowSuccessModal(true);
        } catch (err: any) {
            setErrorMsg(err.response?.data?.message || 'Failed to update the event. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleCloseSuccess = () => {
        setShowSuccessModal(false);
        onSaved(); // Tells parent to refresh the table
        onClose(); // Closes the modal
    };

    return (
        <>
            {/* MAIN EDIT FORM MODAL */}
            <AnimatePresence>
                {!showSuccessModal && !errorMsg && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden max-h-[90vh] overflow-y-auto">

                            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 top-0 z-10">
                                <div>
                                    <h3 className="text-xl font-bold text-role">Edit Event</h3>
                                    <p className="text-gray-500 text-sm mt-1">Please enter all information required.</p>
                                </div>
                                <button onClick={onClose} disabled={saving} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500 disabled:opacity-50">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-8">
                                <form onSubmit={handleSubmit} className="space-y-8">
                                    <EventForm
                                        name={name} setName={setName}
                                        date={date} setDate={setDate}
                                        time={time} setTime={setTime}
                                        location={location} setLocation={setLocation}
                                        description={description} setDescription={setDescription}
                                        participants={participants} toggleParticipant={toggleParticipant}
                                        imagePreview={imagePreview} onImageChange={handleImageChange}
                                        onRemoveImage={() => {
                                            setImageFile(null);
                                            setImagePreview(null);
                                            setRemoveBanner(true);
                                        }} />

                                    <div className="pt-8 flex justify-end gap-3 border-t border-gray-100">
                                        <button type="button" onClick={onClose} disabled={saving} className="px-6 py-2.5 rounded-lg border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all disabled:opacity-50">Cancel</button>
                                        <button type="submit" disabled={saving} className="bg-[#0ea5e9] hover:bg-[#0284c7] disabled:opacity-60 text-white px-8 py-2.5 rounded-lg font-bold shadow-lg shadow-blue-500/20 transition-all min-w-[120px]">
                                            {saving ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </form>
                            </div>

                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ERROR MODAL */}
            <AnimatePresence>
                {errorMsg && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setErrorMsg(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-8 text-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <AlertCircle size={40} className="text-red-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">Wait a moment</h3>
                            <p className="text-gray-500 mb-8">{errorMsg}</p>

                            <button
                                onClick={() => setErrorMsg(null)}
                                className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-red-500/20 transition-all transform hover:-translate-y-1 active:translate-y-0"
                            >
                                Go Back & Fix
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* SUCCESS MODAL */}
            <AnimatePresence>
                {showSuccessModal && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={handleCloseSuccess}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-8 text-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle size={40} className="text-green-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-role mb-2">Success!</h3>
                            <p className="text-gray-500 mb-8">
                                The event <span className="font-bold text-gray-700">{item.name}</span> has been successfully updated.
                            </p>
                            <button
                                onClick={handleCloseSuccess}
                                className="w-full bg-[#10b981] hover:bg-[#059669] text-white py-3 rounded-xl font-bold shadow-lg shadow-green-500/20 transition-all transform hover:-translate-y-1 active:translate-y-0"
                            >
                                Done
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};