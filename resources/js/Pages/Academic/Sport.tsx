import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, ChevronDown, X } from 'lucide-react';
import axios from 'axios';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { ExportButtons } from '../../Components/dashboard/ExportButtons';
import { DeleteConfirmationModal } from '../../Components/modals/DeleteConfirmationModal';

// IMPORT LOGO
import logo from '../../assets/i_hadir_logo2.png';

axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

interface Teacher { teacher_id: number; name: string; }
interface SportItem {
  id: number; name: string; teacher_id: number | null;
  teacher: string; capacity: number | null; registeredDate: string;
}

const SportForm = ({ name, setName, capacity, setCapacity, teacherId, setTeacherId, teachers, error }: {
  name: string; setName: (v: string) => void; capacity: string; setCapacity: (v: string) => void;
  teacherId: string; setTeacherId: (v: string) => void; teachers: Teacher[]; error: string;
}) => (
  <>
    {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
      <div className="space-y-2">
        <label className="block text-sm font-bold text-gray-700"><span className="text-red-500 mr-1">*</span> Sport House Name e.g. "Hang Jebat"</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Sport House Name"
          className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-400" />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-bold text-gray-700"><span className="text-red-500 mr-1">*</span> Capacity e.g. "30"</label>
        <input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} placeholder="Capacity" min={1}
          className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-400" />
      </div>
      <div className="space-y-2 md:col-span-2">
        <label className="block text-sm font-bold text-gray-700"><span className="text-red-500 mr-1">*</span> Sport Teacher</label>
        <div className="relative">
          <select value={teacherId} onChange={e => setTeacherId(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all appearance-none text-gray-700 cursor-pointer">
            <option value="">— No Teacher Assigned —</option>
            {teachers.map(t => <option key={t.teacher_id} value={t.teacher_id}>{t.name.toUpperCase()}</option>)}
          </select>
          <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>
    </div>
  </>
);

const AddSportModal = ({ onClose, teachers, onSaved }: { onClose: () => void; teachers: Teacher[]; onSaved: (item: SportItem) => void }) => {
  const [name, setName] = useState(''); const [capacity, setCapacity] = useState(''); const [teacherId, setTeacherId] = useState('');
  const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!name.trim()) { setError('Sport house name is required.'); return; } setSaving(true);
    try { const res = await axios.post('/api/sport-houses', { name: name.trim(), capacity: capacity ? Number(capacity) : null, teacher_id: teacherId || null }); onSaved(res.data.data); onClose(); }
    catch (err: any) { setError(err.response?.data?.message || 'Failed to save.'); } finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div><h3 className="text-xl font-bold text-[#1c3068]">Add new sport</h3><p className="text-gray-500 text-sm mt-1">Please enter all information required.</p></div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"><X size={24} /></button>
        </div>
        <div className="p-8"><form onSubmit={handleSubmit} className="space-y-8">
          <SportForm name={name} setName={setName} capacity={capacity} setCapacity={setCapacity} teacherId={teacherId} setTeacherId={setTeacherId} teachers={teachers} error={error} />
          <div className="pt-8 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-lg border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all">Cancel</button>
            <button type="submit" disabled={saving} className="bg-[#0ea5e9] hover:bg-[#0284c7] disabled:opacity-60 text-white px-8 py-2.5 rounded-lg font-bold shadow-lg shadow-blue-500/20 transition-all min-w-[120px]">{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form></div>
      </motion.div>
    </div>
  );
};

const EditSportModal = ({ isOpen, onClose, item, teachers, onSaved }: { isOpen: boolean; onClose: () => void; item: SportItem | null; teachers: Teacher[]; onSaved: () => void }) => {
  const [name, setName] = useState(''); const [capacity, setCapacity] = useState(''); const [teacherId, setTeacherId] = useState('');
  const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  useEffect(() => { if (item) { setName(item.name); setCapacity(item.capacity ? String(item.capacity) : ''); setTeacherId(item.teacher_id ? String(item.teacher_id) : ''); } setError(''); }, [item]);
  if (!isOpen || !item) return null;
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!name.trim()) { setError('Sport house name is required.'); return; } setSaving(true);
    try { await axios.put(`/api/sport-houses/${item.id}`, { name: name.trim(), capacity: capacity ? Number(capacity) : null, teacher_id: teacherId || null }); onSaved(); }
    catch (err: any) { setError(err.response?.data?.message || 'Failed to update.'); } finally { setSaving(false); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div><h3 className="text-xl font-bold text-[#1c3068]">Edit sport</h3><p className="text-gray-500 text-sm mt-1">Please enter all information required.</p></div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"><X size={24} /></button>
        </div>
        <div className="p-8"><form onSubmit={handleSubmit} className="space-y-8">
          <SportForm name={name} setName={setName} capacity={capacity} setCapacity={setCapacity} teacherId={teacherId} setTeacherId={setTeacherId} teachers={teachers} error={error} />
          <div className="pt-8 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-lg border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all">Cancel</button>
            <button type="submit" disabled={saving} className="bg-[#0ea5e9] hover:bg-[#0284c7] disabled:opacity-60 text-white px-8 py-2.5 rounded-lg font-bold shadow-lg shadow-blue-500/20 transition-all min-w-[120px]">{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form></div>
      </motion.div>
    </div>
  );
};

function dlFile(content: string, name: string, mime: string) {
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([content], { type: mime })), download: name });
  a.click();
}

const SportList = () => {
  const [items, setItems] = useState<SportItem[]>([]); const [teachers, setTeachers] = useState<Teacher[]>([]); const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false); const [showEditModal, setShowEditModal] = useState(false); const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selected, setSelected] = useState<SportItem | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try { const [r1, r2] = await Promise.all([axios.get('/api/sport-houses'), axios.get('/api/classes/teachers')]); setItems(r1.data.data); setTeachers(r2.data.data); }
    catch { } finally { setLoading(false); }
  };
  useEffect(() => { fetchAll(); }, []);

  const filtered = items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()) || i.teacher.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleConfirmDelete = async () => {
    if (!selected) return;
    try { await axios.delete(`/api/sport-houses/${selected.id}`); setItems(prev => prev.filter(i => i.id !== selected.id)); }
    catch { alert('Failed to delete.'); } finally { setShowDeleteModal(false); setSelected(null); }
  };

  // --- STANDARDIZED PDF / PRINT FORMAT ---
  const handleExportPDF = () => {
    if (filtered.length === 0) return;

    const rows = filtered.map((item: any, index: number) => `
      <tr>
        <td style="text-align:center">${index + 1}</td>
        <td style="font-weight:bold">${item.name}</td>
        <td>${item.teacher}</td>
        <td style="text-align:center">${item.capacity ?? '-'}</td>
        <td style="text-align:center">${item.registeredDate}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sport House List Report</title>
        <style>
          @page { margin: 15mm; size: A4 portrait; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 12px; color: #333; margin: 0; padding: 0; }
          
          /* Standard Header Styling */
          .header-container { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #1c3068; }
          .logo { max-height: 80px; margin-bottom: 15px; width: auto; }
          .report-title { color: #1c3068; font-size: 24px; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: 1.5px; }
          .report-meta { color: #6b7280; font-size: 11px; margin-top: 8px; font-weight: bold; text-transform: uppercase; }
          
          /* Table Styling */
          table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 10px; }
          th, td { padding: 12px 10px; border-bottom: 1px solid #e5e7eb; }
          
          /* Enforce colors in print */
          th { 
            background-color: #1c3068 !important; 
            color: white !important; 
            font-weight: bold; 
            text-align: left; 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
          }
          
          th[style*="text-align:center"] { text-align: center; }
          tr:nth-child(even) { 
            background-color: #f9fafb !important; 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
          }
        </style>
      </head>
      <body>
        <div class="header-container">
          <img src="${logo}" class="logo" alt="School Logo" />
          <h1 class="report-title">Sport House List Report</h1>
          <p class="report-meta">Generated on: ${new Date().toLocaleString('en-MY')} &nbsp;&bull;&nbsp; I-HADIR System</p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th style="text-align:center; width:10%">No</th>
              <th style="width:30%">Sport Name</th>
              <th style="width:30%">Sport Teacher</th>
              <th style="text-align:center; width:15%">Capacity</th>
              <th style="text-align:center; width:15%">Registered</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          }
        </script>
      </body>
      </html>
    `;

    const win = window.open('', '_blank');
    if (win) { 
      win.document.write(html); 
      win.document.close(); 
    }
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-full mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-[#1c3068]">Sport List</h2>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#1c3068] text-white rounded-lg text-sm font-bold hover:bg-[#152450] transition-all shadow-md shadow-blue-900/20 transform hover:-translate-y-0.5"><Plus size={18} /> Add Sport</button>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
              <ExportButtons
                onCopy={() => { const t = ['#\tSport Name\tSport Teacher\tCapacity\tRegistered Date', ...filtered.map((s,i)=>`${i+1}\t${s.name}\t${s.teacher}\t${s.capacity??'-'}\t${s.registeredDate}`)].join('\n'); navigator.clipboard.writeText(t).then(()=>alert('Copied!')); }}
                onExportCSV={() => dlFile(['#,Sport Name,Sport Teacher,Capacity,Registered Date',...filtered.map((s,i)=>`${i+1},"${s.name}","${s.teacher}",${s.capacity??''},"${s.registeredDate}"`)].join('\n'),'sport_houses.csv','text/csv')}
                onExportExcel={() => dlFile(['#\tSport Name\tSport Teacher\tCapacity\tRegistered Date',...filtered.map((s,i)=>`${i+1}\t${s.name}\t${s.teacher}\t${s.capacity??'-'}\t${s.registeredDate}`)].join('\n'),'sport_houses.xls','application/vnd.ms-excel')}
                
                // Connect PDF and Print buttons to the new function
                onExportPDF={handleExportPDF}
                onPrint={handleExportPDF}
              />
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-600">Search:</span>
                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" />
              </div>
            </div>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead><tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider w-12 text-center">#</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Sport Name</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Sport Teacher</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Capacity</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Registered Date</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-center">Action</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-sm">Loading...</td></tr>
                  : filtered.length === 0 ? <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-sm">No sport houses found.</td></tr>
                  : filtered.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-500 text-center">{idx + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium text-[#c53336]">{item.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 uppercase">{item.teacher}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.capacity ?? '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.registeredDate}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center items-center gap-2">
                          <button onClick={() => { setSelected(item); setShowEditModal(true); }} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-[#10b981] hover:text-white transition-all shadow-sm border border-emerald-100" title="Edit"><Edit size={16} /></button>
                          <button onClick={() => { setSelected(item); setShowDeleteModal(true); }} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-[#c53336] hover:text-white transition-all shadow-sm border border-red-100" title="Delete"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!loading && <div className="mt-4 text-sm text-gray-500">Showing {filtered.length} of {items.length} entries</div>}
          </div>
        </div>
      </motion.div>
      <AnimatePresence>
        {showAddModal && <AddSportModal onClose={() => setShowAddModal(false)} teachers={teachers} onSaved={item => { setItems(prev => [...prev, item].sort((a,b) => a.name.localeCompare(b.name))); setShowAddModal(false); }} />}
        {showEditModal && <EditSportModal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setSelected(null); }} item={selected} teachers={teachers} onSaved={async () => { await fetchAll(); setShowEditModal(false); setSelected(null); }} />}
        {showDeleteModal && <DeleteConfirmationModal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setSelected(null); }} onConfirm={handleConfirmDelete} itemName={selected?.name} title="Delete Sport House?" message={`Are you sure you want to delete ${selected?.name}?`} />}
      </AnimatePresence>
    </>
  );
};

export default function SportPage() {
  return <DashboardLayout activePageId="sport"><SportList /></DashboardLayout>;
}