import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ChevronRight, Home, Printer, QrCode, Search, UserPlus, Users, Calendar, Hash, ArrowRightLeft, X, ChevronDown, Trash2 } from 'lucide-react';
import axios from 'axios';
import { StudentQrModal } from './StudentQrModal';

interface Student {
  enrollment_id: number;
  student_id: number;
  name: string;
  ic_number: string;
  gender: string;
  phone: string;
  enrolledAt: string;
}

interface AvailableStudent {
  student_id: number;
  name: string;
}

interface ClassroomInfo {
  id: number;
  name: string;
  sessionName: string;
  capacity: number | null;
}

interface OtherClass {
  id: number;
  name: string;
  teacher: string;
}

interface AddStudentToClassProps {
  onBack: () => void;
  classId: number;
  classNameStr: string;
}

export const AddStudentToClass = ({ onBack, classId, classNameStr }: AddStudentToClassProps) => {
  const [classroom, setClassroom]       = useState<ClassroomInfo | null>(null);
  const [enrolled, setEnrolled]         = useState<Student[]>([]);
  const [available, setAvailable]       = useState<AvailableStudent[]>([]);
  const [otherClasses, setOtherClasses] = useState<OtherClass[]>([]);
  const [loading, setLoading]           = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [enrolling, setEnrolling]       = useState(false);
  const [enrollError, setEnrollError]   = useState('');

  // QR modal state
  const [isQrModalOpen, setIsQrModalOpen]           = useState(false);
  const [qrStudent, setQrStudent]                   = useState<Student | null>(null);

  const handleOpenQr = (student: Student) => {
    setQrStudent(student);
    setIsQrModalOpen(true);
  };

  const handlePrintQr = (student: Student, className: string) => {
    import('qrcode').then((QRCode) => {
      const canvas = document.createElement('canvas');
      QRCode.toCanvas(canvas, student.ic_number, {
        width: 200,
        margin: 2,
        color: { dark: '#1c3068', light: '#ffffff' },
      }).then(() => {
        const dataUrl = canvas.toDataURL('image/png');
        const win = window.open('', '_blank');
        if (!win) return;
        win.document.write(`
          <html>
            <head>
              <title>QR Code - ${student.name}</title>
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { display: flex; justify-content: center; align-items: center; min-height: 100vh; font-family: Arial, sans-serif; background: white; }
                .card { text-align: center; border: 2px solid #1c3068; border-radius: 12px; padding: 24px 32px; width: 280px; }
                .school { font-size: 10px; font-weight: bold; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
                .qr { margin: 0 auto 16px; display: block; }
                .name { font-size: 14px; font-weight: 900; color: #1c3068; margin-bottom: 4px; }
                .ic { font-size: 11px; color: #6b7280; margin-bottom: 4px; }
                .class { font-size: 11px; font-weight: bold; color: #c53336; }
              </style>
            </head>
            <body>
              <div class="card">
                <div class="school">I-HADIR Attendance System</div>
                <img src="${dataUrl}" class="qr" width="200" height="200" />
                <div class="name">${student.name}</div>
                <div class="ic">IC: ${student.ic_number}</div>
                <div class="class">${className}</div>
              </div>
              <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }<\/script>
            </body>
          </html>
        `);
        win.document.close();
      });
    });
  };

  // Transfer modal state
  const [isTransferModalOpen, setIsTransferModalOpen]               = useState(false);
  const [selectedStudentForTransfer, setSelectedStudentForTransfer] = useState<Student | null>(null);
  const [targetClassId, setTargetClassId]                           = useState('');
  const [transferring, setTransferring]                             = useState(false);
  const [transferError, setTransferError]                           = useState('');

  // ── Fetch enrolled + available ─────────────────────────────────────────────
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/classes/${classId}/students`);
      setClassroom(res.data.classroom);
      setEnrolled(res.data.enrolled);
      setAvailable(res.data.available);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  // Fetch other classes for transfer dropdown
  const fetchOtherClasses = async () => {
    try {
      const res = await axios.get('/api/classes');
      setOtherClasses(
        res.data.data
          .filter((c: any) => c.id !== classId)
          .map((c: any) => ({ id: c.id, name: c.name, teacher: c.teacher }))
      );
    } catch {
      // silently fail
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchOtherClasses();
  }, [classId]);

  // ── Enroll ─────────────────────────────────────────────────────────────────
  const handleEnroll = async () => {
    if (!selectedStudentId) { setEnrollError('Please select a student.'); return; }
    setEnrollError('');
    setEnrolling(true);
    try {
      const res = await axios.post(`/api/classes/${classId}/students`, {
        student_id: Number(selectedStudentId),
      });
      setEnrolled((prev) => [...prev, res.data.data]);
      setAvailable((prev) => prev.filter((s) => s.student_id !== Number(selectedStudentId)));
      setSelectedStudentId('');
    } catch (err: any) {
      setEnrollError(err.response?.data?.message || 'Failed to enroll student.');
    } finally {
      setEnrolling(false);
    }
  };

  // ── Remove ─────────────────────────────────────────────────────────────────
  const handleRemove = async (student: Student) => {
    if (!confirm(`Remove ${student.name} from this class?`)) return;
    try {
      await axios.delete(`/api/classes/${classId}/students/${student.student_id}`);
      setEnrolled((prev) => prev.filter((s) => s.enrollment_id !== student.enrollment_id));
      setAvailable((prev) => [...prev, { student_id: student.student_id, name: student.name }]
        .sort((a, b) => a.name.localeCompare(b.name)));
    } catch {
      alert('Failed to remove student. Please try again.');
    }
  };

  // ── Transfer ───────────────────────────────────────────────────────────────
  const handleOpenTransfer = (student: Student) => {
    setSelectedStudentForTransfer(student);
    setTargetClassId('');
    setTransferError('');
    setIsTransferModalOpen(true);
  };

  const handleTransfer = async () => {
    if (!targetClassId) { setTransferError('Please select a destination class.'); return; }
    if (!selectedStudentForTransfer) return;
    setTransferring(true);
    setTransferError('');
    try {
      await axios.put(
        `/api/classes/${classId}/students/${selectedStudentForTransfer.student_id}/transfer`,
        { target_classroom_id: Number(targetClassId) }
      );
      setEnrolled((prev) => prev.filter((s) => s.enrollment_id !== selectedStudentForTransfer.enrollment_id));
      setIsTransferModalOpen(false);
      setSelectedStudentForTransfer(null);
    } catch (err: any) {
      setTransferError(err.response?.data?.message || 'Failed to transfer student.');
    } finally {
      setTransferring(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col h-full w-full bg-slate-50 min-h-screen font-sans relative"
    >
      {/* Top Header / Breadcrumb Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#1c3068]/5 rounded-lg">
            <Users size={20} className="text-[#1c3068]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#1c3068]">Class Management</h2>
            <p className="text-xs text-gray-500">Manage students for {classNameStr}</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 text-[11px] font-medium text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
            <span className="flex items-center gap-1 hover:text-[#1c3068] cursor-pointer transition-colors">
              <Home size={12} />
            </span>
            <ChevronRight size={10} className="text-gray-300" />
            <span className="hover:text-[#1c3068] cursor-pointer transition-colors" onClick={onBack}>Class List</span>
            <ChevronRight size={10} className="text-gray-300" />
            <span className="text-[#0ea5e9]">Add Student</span>
          </div>
          <span className="text-[10px] text-gray-400 font-medium">
            Session {classroom?.sessionName ?? '—'} • {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto w-full space-y-6">

        {/* Top Grid: Class Info & Add Student Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Class Info Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-fit">
            <div className="bg-gradient-to-r from-[#1c3068] to-[#2a4595] px-6 py-4 flex justify-between items-center">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <Hash size={18} className="text-blue-200" /> Class Details
              </h3>
              <button onClick={onBack} className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors" title="Back to Class List">
                <ArrowLeft size={18} />
              </button>
            </div>
            <div className="p-6">
              <div className="flex flex-col gap-4">
                <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Class Name</span>
                  <span className="text-lg font-bold text-[#1c3068]">{classroom?.name ?? classNameStr}</span>
                </div>
                <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Academic Year</span>
                  <span className="text-lg font-bold text-[#1c3068] flex items-center gap-2">
                    <Calendar size={18} className="text-[#c53336]" /> {classroom?.sessionName ?? '—'}
                  </span>
                </div>
                {classroom?.capacity && (
                  <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Capacity</span>
                    <span className="text-lg font-bold text-[#1c3068]">
                      {enrolled.length} / {classroom.capacity}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Enroll Student Form Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-fit">
            <div className="border-b border-gray-100 px-6 py-4 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-gray-800 font-bold text-base flex items-center gap-2">
                <UserPlus size={18} className="text-[#0ea5e9]" /> Enroll New Student
              </h3>
            </div>
            <div className="p-6">
              <p className="text-gray-500 text-sm mb-6">Search and select a student to enroll them into this class.</p>

              {enrollError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{enrollError}</div>
              )}

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
                    Student Name <span className="text-[#c53336]">*</span>
                  </label>
                  <div className="relative group">
                    <select
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-sm text-gray-700 appearance-none cursor-pointer"
                    >
                      <option value="">Select a student...</option>
                      {available.map((s) => (
                        <option key={s.student_id} value={s.student_id}>{s.name}</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <Search size={16} />
                    </div>
                  </div>
                  {available.length === 0 && !loading && (
                    <p className="text-xs text-gray-400 mt-1">All students are already enrolled in a class for this session.</p>
                  )}
                </div>

                <button
                  onClick={handleEnroll}
                  disabled={enrolling || !selectedStudentId}
                  className="w-full bg-[#1c3068] hover:bg-[#152450] disabled:opacity-60 text-white py-3 rounded-lg font-bold shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] flex justify-center items-center gap-2"
                >
                  <UserPlus size={18} />
                  <span>{enrolling ? 'Enrolling...' : 'Enroll Student'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Student List */}
        <div className="w-full">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col w-full">
            <div className="border-b border-gray-100 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50">
              <div>
                <h3 className="text-gray-800 font-bold text-base flex items-center gap-2">
                  <Users size={18} className="text-[#1c3068]" /> Enrolled Students
                </h3>
                <p className="text-xs text-gray-400 mt-1">Total {enrolled.length} students enrolled</p>
              </div>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <th className="py-4 px-6 w-16 text-center">No.</th>
                    <th className="py-4 px-6">Student Name</th>
                    <th className="py-4 px-6">IC Number</th>
                    <th className="py-4 px-6">Phone</th>
                    <th className="py-4 px-6">Gender</th>
                    <th className="py-4 px-6">Enrolled</th>
                    <th className="py-4 px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-gray-400 text-sm">Loading...</td>
                    </tr>
                  ) : enrolled.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-gray-400 text-sm">No students enrolled yet.</td>
                    </tr>
                  ) : (
                    enrolled.map((student, index) => (
                      <tr key={student.enrollment_id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-6 text-sm text-gray-400 font-bold text-center">{index + 1}</td>
                        <td className="py-4 px-6">
                          <span className="text-sm font-black text-[#1c3068] leading-tight">{student.name}</span>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-500 font-medium">{student.ic_number}</td>
                        <td className="py-4 px-6 text-sm text-gray-500 font-medium">{student.phone}</td>
                        <td className="py-4 px-6">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                            student.gender?.toLowerCase() === 'male'
                              ? 'bg-blue-50 text-blue-600 border-blue-100'
                              : 'bg-pink-50 text-pink-600 border-pink-100'
                          }`}>
                            {student.gender?.toUpperCase() ?? '-'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-500 font-medium">{student.enrolledAt}</td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex justify-center items-center gap-2">
                            <button
                              onClick={() => handlePrintQr(student, classroom?.name ?? classNameStr)}
                              className="p-2 bg-gray-50 text-gray-500 rounded-lg hover:bg-[#1c3068] hover:text-white transition-all shadow-sm border border-gray-200"
                              title="Print QR"
                            >
                              <Printer size={16} />
                            </button>
                            <button
                              onClick={() => handleOpenQr(student)}
                              className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100"
                              title="View QR Code"
                            >
                              <QrCode size={16} />
                            </button>
                            <button
                              onClick={() => handleOpenTransfer(student)}
                              className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100"
                              title="Transfer Student"
                            >
                              <ArrowRightLeft size={16} />
                            </button>
                            <button
                              onClick={() => handleRemove(student)}
                              className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-[#c53336] hover:text-white transition-all shadow-sm border border-red-100"
                              title="Remove from Class"
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

            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center text-[11px] font-bold text-gray-400">
              <span>Showing {enrolled.length} of {enrolled.length} entries</span>
            </div>
          </div>
        </div>

        <div className="text-center mt-12 mb-6">
          <p className="text-gray-400 text-xs font-medium">2026 © I - HADIR System V 1.0 • Built with precision</p>
        </div>
      </div>

      {/* QR Modal */}
      {isQrModalOpen && qrStudent && (
        <StudentQrModal
          isOpen={isQrModalOpen}
          onClose={() => { setIsQrModalOpen(false); setQrStudent(null); }}
          studentName={qrStudent.name}
          icNumber={qrStudent.ic_number}
          className={classroom?.name ?? classNameStr}
        />
      )}

      {/* Transfer Student Modal */}
      <AnimatePresence>
        {isTransferModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden relative"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h3 className="text-xl font-bold text-[#1c3068]">Transfer Student</h3>
                  <p className="text-gray-500 text-sm mt-1">Please enter all information required.</p>
                </div>
                <button onClick={() => setIsTransferModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                  <X size={24} />
                </button>
              </div>

              <div className="p-8">
                <div className="space-y-6">
                  <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Student Name</span>
                    <span className="text-lg font-bold text-[#1c3068]">{selectedStudentForTransfer?.name}</span>
                  </div>

                  {transferError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{transferError}</div>
                  )}

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700">
                      <span className="text-[#c53336] mr-1">*</span> Destination Class
                    </label>
                    <div className="relative">
                      <select
                        value={targetClassId}
                        onChange={(e) => setTargetClassId(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all appearance-none text-gray-700 cursor-pointer"
                      >
                        <option value="">Select a class to transfer to...</option>
                        {otherClasses.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name} {cls.teacher !== '-' ? `(Teacher: ${cls.teacher})` : ''}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="pt-8 flex justify-end gap-3">
                  <button
                    onClick={() => setIsTransferModalOpen(false)}
                    className="px-6 py-2.5 rounded-lg border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleTransfer}
                    disabled={transferring || !targetClassId}
                    className="bg-[#1c3068] hover:bg-[#152450] disabled:opacity-60 text-white px-8 py-2.5 rounded-lg font-bold shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2 min-w-[120px]"
                  >
                    <ArrowRightLeft size={16} />
                    <span>{transferring ? 'Transferring...' : 'Transfer'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
