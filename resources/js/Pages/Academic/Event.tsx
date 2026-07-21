import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, X, Search, ScanLine, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { ExportButtons } from '../../Components/dashboard/ExportButtons';
import { DeleteConfirmationModal } from '../../Components/modals/DeleteConfirmationModal';
import { EditEventModal, EventItem } from '../../Components/modals/EditEventModal';

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
import logo from '../../assets/i_hadir_logo2.png';

axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

type ParticipantKey = 'teacher' | 'student' | 'staff' | 'parent';
const PARTICIPANT_LABELS: { key: ParticipantKey; label: string }[] = [
  { key: 'teacher', label: 'Teacher' }, { key: 'student', label: 'Student' },
  { key: 'staff', label: 'School Staff' }, { key: 'parent', label: 'Parent' },
];

// ── Checkbox ──────────────────────────────────────────────────────────────────
const Checkbox = ({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) => (
  <label className="flex items-center gap-3 cursor-pointer group" onClick={onChange}>
    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${checked ? 'border-[#1c3068] bg-[#1c3068]' : 'border-gray-300 group-hover:border-[#1c3068]'}`}>
      {checked && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
    </div>
    <span className="text-gray-600">{label}</span>
  </label>
);

// ── Shared Event Form ─────────────────────────────────────────────────────────
const EventForm = ({ name, setName, date, setDate, time, setTime, location, setLocation, description, setDescription,
  participants, toggleParticipant, imagePreview, onImageChange, onRemoveImage, error }: {
    name: string; setName: (v: string) => void; date: string; setDate: (v: string) => void;
    time: string; setTime: (v: string) => void; location: string; setLocation: (v: string) => void;
    description: string; setDescription: (v: string) => void;
    participants: Record<ParticipantKey, boolean>; toggleParticipant: (k: ParticipantKey) => void;
    imagePreview: string | null; onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemoveImage: () => void; error: string;
  }) => (
  <>
    {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
      <div className="space-y-2 md:col-span-2">
        <label className="block text-sm font-bold text-gray-700"><span className="text-red-500 mr-1">*</span> Event Name e.g. "Sukaneka"</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Event Name"
          className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-400" />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-bold text-gray-700"><span className="text-red-500 mr-1">*</span> Date</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-700" />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-bold text-gray-700"><span className="text-red-500 mr-1">*</span> Time</label>
        <input type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-700" />
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
          className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-400" />
      </div>
      <div className="space-y-2 md:col-span-2">
        <label className="block text-sm font-bold text-gray-700">Event Details</label>
        <textarea rows={4} value={description} onChange={e => setDescription(e.target.value)} placeholder="Little explanation about this event."
          className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-400 resize-none" />
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

// ── Add Modal ────────────────────────────────────────────────────────────────-
const AddEventModal = ({ onClose, onSaved }: { onClose: () => void; onSaved: (item: EventItem) => void }) => {
  const [name, setName] = useState(''); const [date, setDate] = useState(''); const [time, setTime] = useState('');
  const [location, setLocation] = useState(''); const [description, setDescription] = useState('');
  const [participants, setParticipants] = useState<Record<ParticipantKey, boolean>>({ teacher: false, student: false, staff: false, parent: false });
  const [imageFile, setImageFile] = useState<File | null>(null); const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false); const [error, setError] = useState('');

  const toggleParticipant = (k: ParticipantKey) => setParticipants(prev => ({ ...prev, [k]: !prev[k] }));
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return; setImageFile(f);
    const r = new FileReader(); r.onloadend = () => setImagePreview(r.result as string); r.readAsDataURL(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Event name is required.'); return; }
    if (!date) { setError('Date is required.'); return; }
    const selectedTypes = (Object.keys(participants) as ParticipantKey[]).filter(k => participants[k]);
    if (selectedTypes.length === 0) { setError('Select at least one participant type.'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', name.trim()); fd.append('event_date', date); if (time) fd.append('event_time', time);
      fd.append('location', location); fd.append('description', description);
      selectedTypes.forEach(t => fd.append('participant_types[]', t));
      if (imageFile) fd.append('banner', imageFile);
      const res = await axios.post('/api/events', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onSaved(res.data.data); onClose();
    } catch (err: any) { setError(err.response?.data?.message || 'Failed to save.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 sticky top-0 z-10">
          <div><h3 className="text-xl font-bold text-[#1c3068]">Add new event</h3><p className="text-gray-500 text-sm mt-1">Please enter all information required.</p></div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"><X size={24} /></button>
        </div>
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <EventForm name={name} setName={setName} date={date} setDate={setDate} time={time} setTime={setTime}
              location={location} setLocation={setLocation} description={description} setDescription={setDescription}
              participants={participants} toggleParticipant={toggleParticipant}
              imagePreview={imagePreview} onImageChange={handleImageChange} onRemoveImage={() => { setImageFile(null); setImagePreview(null); }} error={error} />
            <div className="pt-8 flex justify-end gap-3">
              <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-lg border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all">Cancel</button>
              <button type="submit" disabled={saving} className="bg-[#0ea5e9] hover:bg-[#0284c7] disabled:opacity-60 text-white px-8 py-2.5 rounded-lg font-bold shadow-lg shadow-blue-500/20 transition-all min-w-[120px]">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Export helpers ────────────────────────────────────────────────────────────
function buildTableText(items: EventItem[]): string {
  const header = ['#', 'Event Name', 'Date', 'Time', 'Event Spot', 'Participants'].join('\t');
  const rows = items.map((e, i) =>
    [i + 1, e.name, e.date, e.time ?? '-', e.spot, (e.participantTypes ?? []).join(', ')].join('\t')
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

function exportCSV(items: EventItem[]) {
  const header = ['#', 'Event Name', 'Date', 'Time', 'Event Spot', 'Participants'].join(',');
  const rows = items.map((e, i) =>
    [`${i + 1}`, `"${e.name}"`, `"${e.date}"`, `"${e.time ?? '-'}"`, `"${e.spot}"`, `"${(e.participantTypes ?? []).join(', ')}"`].join(',')
  );
  downloadFile([header, ...rows].join('\n'), 'events.csv', 'text/csv');
}

function exportExcel(items: EventItem[]) {
  downloadFile(buildTableText(items), 'events.xls', 'application/vnd.ms-excel');
}

// ─── STANDARDIZED PDF / PRINT FORMAT ──────────────────────────────────────────
function exportPDF(items: EventItem[], logoSrc: string) {
  const rows = items.map((e, i) => `
    <tr>
      <td style="text-align:center">${i + 1}</td>
      <td style="font-weight:bold">${e.name}</td>
      <td style="text-align:center">${e.date}</td>
      <td style="text-align:center">${e.time ?? '-'}</td>
      <td style="text-align:center">${e.spot}</td>
      <td style="text-align:center; text-transform:uppercase;">${(e.participantTypes ?? []).join(', ')}</td>
    </tr>`).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Event List Report</title>
      <style>
        @page { margin: 15mm; size: A4 landscape; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 12px; color: #333; margin: 0; padding: 0; }
        .header-container { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #1c3068; }
        .logo { max-height: 80px; margin-bottom: 15px; width: auto; }
        .report-title { color: #1c3068; font-size: 24px; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: 1.5px; }
        .report-meta { color: #6b7280; font-size: 11px; margin-top: 8px; font-weight: bold; text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 10px; }
        th, td { padding: 12px 10px; border-bottom: 1px solid #e5e7eb; }
        th { background-color: #1c3068 !important; color: white !important; font-weight: bold; text-align: left; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        th[style*="text-align:center"] { text-align: center; }
        tr:nth-child(even) { background-color: #f9fafb !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      </style>
    </head>
    <body>
      <div class="header-container">
        <img src="${logoSrc}" class="logo" alt="School Logo" />
        <h1 class="report-title">Event List Report</h1>
        <p class="report-meta">Generated on: ${new Date().toLocaleString('en-MY')} &nbsp;&bull;&nbsp; I-HADIR System</p>
      </div>
      <table>
        <thead>
          <tr>
            <th style="text-align:center; width:5%">No</th>
            <th style="width:25%">Event Name</th>
            <th style="text-align:center; width:15%">Date</th>
            <th style="text-align:center; width:10%">Time</th>
            <th style="text-align:center; width:20%">Event Spot</th>
            <th style="text-align:center; width:25%">Participants</th>
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

function printTable(items: EventItem[], logoSrc: string) { exportPDF(items, logoSrc); }
function copyToClipboard(items: EventItem[]) { navigator.clipboard.writeText(buildTableText(items)).then(() => alert('Table data copied to clipboard!')); }

// ── List ──────────────────────────────────────────────────────────────────────
const EventList = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selected, setSelected] = useState<EventItem | null>(null);

  // Full Screen Preview Modal State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');

  const fetchAll = async () => {
    setLoading(true);
    try { const res = await axios.get('/api/events'); setEvents(res.data.data); }
    catch { } finally { setLoading(false); }
  };
  useEffect(() => { fetchAll(); }, []);

  const filtered = events.filter(e =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.spot.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const { currentPage, setCurrentPage, totalPages, startIndex, endIndex, currentData, totalItems } = usePagination(filtered, 10);

  const handleConfirmDelete = async () => {
    if (!selected) return;
    try {
      await axios.delete(`/api/events/${selected.id}`);
      setEvents(prev => prev.filter(e => e.id !== selected.id));
      if (currentData.length === 1 && currentPage > 1) setCurrentPage(currentPage - 1);
    }
    catch { alert('Failed to delete.'); } finally { setShowDeleteModal(false); setSelected(null); }
  };

  const openPreview = (url: string) => {
    setPreviewImageUrl(url);
    setIsPreviewOpen(true);
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-full mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-[#1c3068]">Event List</h2>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#1c3068] text-white rounded-lg text-sm font-bold hover:bg-[#152450] transition-all shadow-md shadow-blue-900/20 transform hover:-translate-y-0.5"><Plus size={18} /> Add Event</button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
              <ExportButtons
                onCopy={() => copyToClipboard(filtered)}
                onExportCSV={() => exportCSV(filtered)}
                onExportExcel={() => exportExcel(filtered)}
                onExportPDF={() => exportPDF(filtered, logo)}
                onPrint={() => printTable(filtered, logo)}
              />
              <div className="flex items-center gap-2 w-full sm:w-auto relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  placeholder="Search events or locations..."
                  className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-50 outline-none transition-all"
                />
              </div>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead><tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider w-12 text-center">#</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider w-20 text-center">Banner</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Event Name</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Event Spot</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Participants</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-center">Action</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400 text-sm">Loading...</td></tr>
                    : currentData.length === 0 ? <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400 text-sm">No events found.</td></tr>
                      : currentData.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-4 text-sm text-gray-500 text-center">{startIndex + idx + 1}</td>

                          {/* Banner Thumbnail Column */}
                          <td className="px-2 py-3 text-center">
                            {item.bannerUrl ? (
                              <img
                                src={item.bannerUrl}
                                alt={item.name}
                                onClick={() => openPreview(item.bannerUrl!)}
                                className="w-12 h-10 object-cover rounded-md mx-auto cursor-pointer hover:opacity-80 transition-all border border-gray-200 shadow-sm hover:scale-105"
                                title="Click to view full screen"
                              />
                            ) : (
                              <div className="w-12 h-10 bg-gray-100 rounded-md mx-auto flex items-center justify-center text-gray-400 border border-gray-200" title="No Banner">
                                <ImageIcon size={16} />
                              </div>
                            )}
                          </td>

                          <td className="px-6 py-4 text-sm font-medium text-[#c53336]">{item.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{item.date}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{item.time ?? '-'}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{item.spot}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            <div className="flex flex-wrap gap-1">
                              {(item.participantTypes ?? []).map(t => (
                                <span key={t} className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 uppercase">{t}</span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center items-center gap-2">
                              <button onClick={() => navigate(`/academic/event/${item.id}/scan`)} className="p-2 bg-blue-50 text-[#1c3068] rounded-lg hover:bg-[#1c3068] hover:text-white transition-all shadow-sm border border-blue-100" title="Scan Attendance"><ScanLine size={16} /></button>
                              <button onClick={() => { setSelected(item); setShowEditModal(true); }} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-[#10b981] hover:text-white transition-all shadow-sm border border-emerald-100" title="Edit"><Edit size={16} /></button>
                              <button onClick={() => { setSelected(item); setShowDeleteModal(true); }} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-[#c53336] hover:text-white transition-all shadow-sm border border-red-100" title="Delete"><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>

            {/* --- PAGINATION & COUNT --- */}
            {!loading && (
              <div className="flex flex-col sm:flex-row justify-between items-center mt-6 text-sm text-gray-500 gap-4">
                <p>Showing {startIndex + (currentData.length > 0 ? 1 : 0)} to {endIndex} of {totalItems} entries</p>
                {totalPages > 1 && (
                  <Pagination className="mx-0 w-auto">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious onClick={() => setCurrentPage(currentPage - 1)} className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <PaginationItem key={page}>
                          <PaginationLink onClick={() => setCurrentPage(page)} isActive={currentPage === page} className="cursor-pointer">{page}</PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext onClick={() => setCurrentPage(currentPage + 1)} className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* FULL SCREEN IMAGE PREVIEW MODAL */}
      <AnimatePresence>
        {isPreviewOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setIsPreviewOpen(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-4xl w-full max-h-[90vh] flex items-center justify-center p-4"
              onClick={e => e.stopPropagation()}
            >
              <img
                src={previewImageUrl}
                alt="Full screen preview"
                className="max-h-[85vh] w-auto rounded-xl shadow-2xl object-contain bg-white/5 border border-white/10"
              />
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="absolute top-6 right-6 z-[110] flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-2xl ring-4 ring-black/10 transition-all hover:scale-110 active:scale-95 cursor-pointer"
                title="Close Preview"
              >
                <Plus className="h-6 w-6 rotate-45 text-black" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddModal && <AddEventModal onClose={() => setShowAddModal(false)} onSaved={item => { setEvents(prev => [item, ...prev]); setShowAddModal(false); }} />}
        {showEditModal && <EditEventModal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelected(null); }} item={selected} onSaved={async () => { await fetchAll(); setShowEditModal(false); setSelected(null); }} />}
        {showDeleteModal && <DeleteConfirmationModal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setSelected(null); }} onConfirm={handleConfirmDelete} itemName={selected?.name} title="Delete Event?" message={`Are you sure you want to delete ${selected?.name}?`} />}
      </AnimatePresence>
    </>
  );
};

export default function EventPage() {
  return <DashboardLayout activePageId="event"><EventList /></DashboardLayout>;
}