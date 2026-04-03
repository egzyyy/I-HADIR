import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, ChevronDown, X } from 'lucide-react';
import axios from 'axios';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { ExportButtons } from '../../Components/dashboard/ExportButtons';
import { DeleteConfirmationModal } from '../../Components/modals/DeleteConfirmationModal';
import { EditClassModal } from '../../Components/modals/EditClassModal';
import { AddStudentToClass } from '../../Components/modals/AddStudentToClass';

// IMPORT THE LOGO
import logo from '../../assets/i_hadir_logo2.png';

// Ensure Axios acts as an XHR request for Laravel
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClassItem {
  id: number;
  name: string;
  teacher_id: number | null;
  teacher: string;
  totalStudents: number;
  capacity: number | null;
  createdAt: string;
  sessionId: number | null;
  sessionName: string;
  isActive: boolean;
}

interface Teacher {
  teacher_id: number;
  name: string;
}

// ─── Add Class Modal ───────────────────────────────────────────────────────────

const AddClassModal = ({
  onClose,
  teachers,
  onSaved,
}: {
  onClose: () => void;
  teachers: Teacher[];
  onSaved: (newClass: ClassItem) => void;
}) => {
  const [name, setName]           = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [capacity, setCapacity]   = useState('');
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Class name is required.'); return; }
    setSaving(true);
    try {
      const res = await axios.post('/api/classes', {
        name:       name.trim(),
        teacher_id: teacherId || null,
        capacity:   capacity ? Number(capacity) : null,
      });
      onSaved(res.data.data);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save class.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden relative"
      >
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="text-xl font-bold text-[#1c3068]">Add new class</h3>
            <p className="text-gray-500 text-sm mt-1">Please enter all information required.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
            <X size={24} />
          </button>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">

              {/* Class Name */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  <span className="text-red-500 mr-1">*</span> Class Name e.g. "1 Merah"
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Class Name"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-400"
                />
              </div>

              {/* Classroom Teacher */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  <span className="text-red-500 mr-1">*</span> Classroom Teacher
                </label>
                <div className="relative">
                  <select
                    value={teacherId}
                    onChange={(e) => setTeacherId(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all appearance-none text-gray-700 cursor-pointer"
                  >
                    <option value="">— No Teacher Assigned —</option>
                    {teachers.map((t) => (
                      <option key={t.teacher_id} value={t.teacher_id}>
                        {t.name.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Capacity */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  <span className="text-red-500 mr-1">*</span> Capacity e.g. "30"
                </label>
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="Capacity"
                  min={1}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-400"
                />
              </div>

            </div>

            <div className="pt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-lg border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-[#0ea5e9] hover:bg-[#0284c7] disabled:opacity-60 text-white px-8 py-2.5 rounded-lg font-bold shadow-lg shadow-blue-500/20 transition-all transform hover:-translate-y-1 active:translate-y-0 min-w-[120px]"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Export helpers ────────────────────────────────────────────────────────────

function buildTableText(classes: ClassItem[]): string {
  const header = ['#', 'Class Name', 'Classroom Teacher', 'Total Students', 'Capacity', 'Session', 'Registered Date'].join('\t');
  const rows = classes.map((c, i) =>
    [i + 1, c.name, c.teacher, c.totalStudents, c.capacity ?? '-', c.sessionName, c.createdAt].join('\t')
  );
  return [header, ...rows].join('\n');
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportCSV(classes: ClassItem[]) {
  const header = ['#', 'Class Name', 'Classroom Teacher', 'Total Students', 'Capacity', 'Session', 'Registered Date'].join(',');
  const rows   = classes.map((c, i) =>
    [`${i + 1}`, `"${c.name}"`, `"${c.teacher}"`, `${c.totalStudents}`, `${c.capacity ?? ''}`, `"${c.sessionName}"`, `"${c.createdAt}"`].join(',')
  );
  downloadFile([header, ...rows].join('\n'), 'classes.csv', 'text/csv');
}

function exportExcel(classes: ClassItem[]) {
  downloadFile(buildTableText(classes), 'classes.xls', 'application/vnd.ms-excel');
}

// ─── STANDARDIZED PDF / PRINT FORMAT ──────────────────────────────────────────

function exportPDF(classes: ClassItem[], logoSrc: string) {
  const rows = classes.map((c, i) => `
    <tr>
      <td style="text-align:center">${i + 1}</td>
      <td style="font-weight:bold">${c.name}</td>
      <td>${c.teacher}</td>
      <td style="text-align:center">${c.totalStudents}</td>
      <td style="text-align:center">${c.capacity ?? '-'}</td>
      <td style="text-align:center">${c.sessionName}</td>
      <td style="text-align:center">${c.createdAt}</td>
    </tr>`).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Class List Report</title>
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
        <img src="${logoSrc}" class="logo" alt="School Logo" />
        <h1 class="report-title">Class List Report</h1>
        <p class="report-meta">Generated on: ${new Date().toLocaleString('en-MY')} &nbsp;&bull;&nbsp; I-HADIR System</p>
      </div>
      
      <table>
        <thead>
          <tr>
            <th style="text-align:center; width:5%">No</th>
            <th style="width:20%">Class Name</th>
            <th style="width:30%">Classroom Teacher</th>
            <th style="text-align:center; width:15%">Total Students</th>
            <th style="text-align:center; width:10%">Capacity</th>
            <th style="text-align:center; width:10%">Session</th>
            <th style="text-align:center; width:10%">Registered</th>
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
    </html>`;

  const win = window.open('', '_blank');
  if (win) { 
    win.document.write(html); 
    win.document.close(); 
  }
}

function printTable(classes: ClassItem[], logoSrc: string) { 
  exportPDF(classes, logoSrc); 
}

function copyToClipboard(classes: ClassItem[]) {
  navigator.clipboard.writeText(buildTableText(classes)).then(() => {
    alert('Table data copied to clipboard!');
  });
}

// ─── Main Component ────────────────────────────────────────────────────────────

const ClassList = () => {
  const [classes, setClasses]                 = useState<ClassItem[]>([]);
  const [teachers, setTeachers]               = useState<Teacher[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [loading, setLoading]                 = useState(true);
  const [searchTerm, setSearchTerm]           = useState('');

  const [showAddModal, setShowAddModal]           = useState(false);
  const [selectedClass, setSelectedClass]         = useState<ClassItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen]     = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId]               = useState<number | null>(null);
  const [view, setView]                           = useState<'list' | 'add_student'>('list');

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = async (sessionId?: string | null) => {
    setLoading(true);
    try {
      const sid = sessionId ?? activeSessionId ?? '';
      const [classRes, teacherRes] = await Promise.all([
        axios.get(`/api/classes?session_id=${sid}`),
        axios.get(`/api/classes/teachers?session_id=${sid}`),
      ]);
      setClasses(classRes.data.data);
      setTeachers(teacherRes.data.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const sessionRes = await axios.get('/api/sessions/active');
        const sid = sessionRes.data.data?.school_session_id ?? '';
        setActiveSessionId(sid);
        await fetchData(sid);
      } catch {
        await fetchData('');
      }
    };
    init();
  }, []);

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = classes.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.teacher.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSaved = (newClass: ClassItem) => {
    setClasses((prev) => [...prev, newClass].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const handleUpdated = async () => {
    await fetchData();
    setIsEditModalOpen(false);
    setSelectedClass(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      await axios.delete(`/api/classes/${deletingId}`);
      setClasses((prev) => prev.filter((c) => c.id !== deletingId));
    } catch {
      alert('Failed to delete class. Please try again.');
    } finally {
      setIsDeleteModalOpen(false);
      setDeletingId(null);
      setSelectedClass(null);
    }
  };

  // ── Add-student view ───────────────────────────────────────────────────────
  if (view === 'add_student' && selectedClass) {
    return (
      <AddStudentToClass
        onBack={() => setView('list')}
        classId={selectedClass.id}
        classNameStr={selectedClass.name}
      />
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-full mx-auto"
      >
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-[#1c3068]">Class List</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1c3068] text-white rounded-lg text-sm font-bold hover:bg-[#152450] transition-all shadow-md shadow-blue-900/20 transform hover:-translate-y-0.5"
          >
            <Plus size={18} /> Add Class
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6">
            <p className="text-gray-500 text-sm mb-4">Click button above table to export to Copy, CSV, Excel, PDF &amp; Print</p>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
              <ExportButtons
                onCopy={() => copyToClipboard(filtered)}
                onExportCSV={() => exportCSV(filtered)}
                onExportExcel={() => exportExcel(filtered)}
                
                // PASS THE LOGO URL TO THE PDF/PRINT FUNCTIONS HERE
                onExportPDF={() => exportPDF(filtered, logo)}
                onPrint={() => printTable(filtered, logo)}
              />
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-600">Search:</span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider w-12 text-center">#</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Class Name</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Classroom Teacher</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-center">Total Number of Students</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-center">Capacity</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-center">Session</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-center">Registered Date</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-gray-400 text-sm">Loading...</td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-gray-400 text-sm">No classes found.</td>
                    </tr>
                  ) : (
                    filtered.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-500 text-center">{idx + 1}</td>
                        <td className="px-4 py-3 text-sm font-bold text-[#c53336]">{item.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 font-semibold">{item.teacher}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-center font-mono">{item.totalStudents}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-center font-mono">{item.capacity ?? '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-center">{item.sessionName}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 text-center">{item.createdAt}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center items-center gap-2">
                            <button
                              onClick={() => { setSelectedClass(item); setView('add_student'); }}
                              className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-[#2563eb] hover:text-white transition-all shadow-sm border border-blue-100 hover:border-[#2563eb]"
                              title="Add Student"
                            >
                              <Plus size={16} />
                            </button>
                            <button
                              onClick={() => { setSelectedClass(item); setIsEditModalOpen(true); }}
                              className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-[#10b981] hover:text-white transition-all shadow-sm border border-emerald-100 hover:border-[#10b981]"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => { setSelectedClass(item); setDeletingId(item.id); setIsDeleteModalOpen(true); }}
                              className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-[#c53336] hover:text-white transition-all shadow-sm border border-red-100 hover:border-[#c53336]"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Count */}
            {!loading && (
              <div className="flex flex-col sm:flex-row justify-between items-center mt-6 text-sm text-gray-500 gap-4">
                <p>Showing {filtered.length} of {classes.length} entries</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showAddModal && (
          <AddClassModal
            onClose={() => setShowAddModal(false)}
            teachers={teachers}
            onSaved={handleSaved}
          />
        )}
        {isEditModalOpen && selectedClass && (
          <EditClassModal
            isOpen={isEditModalOpen}
            onClose={() => { setIsEditModalOpen(false); setSelectedClass(null); }}
            classData={selectedClass}
            teachers={teachers}
            onSaved={handleUpdated}
          />
        )}
        {isDeleteModalOpen && (
          <DeleteConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => { setIsDeleteModalOpen(false); setDeletingId(null); setSelectedClass(null); }}
            onConfirm={handleConfirmDelete}
            itemName={selectedClass?.name}
            title="Delete Class?"
            message={`Are you sure you want to delete class ${selectedClass?.name}? This action cannot be undone.`}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default function ClassPage() {
  return (
    <DashboardLayout activePageId="class">
      <ClassList />
    </DashboardLayout>
  );
}