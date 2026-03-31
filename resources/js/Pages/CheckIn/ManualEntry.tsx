import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, ChevronDown, X, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import DashboardLayout from '../../Layouts/DashboardLayout';

type Entry = {
  id: number;
  name: string;
  class: string;
  user_type: string;
  type: string;
  reason: string;
  check_in: string;
  check_out: string | null;
};

const ManualEntry = () => {
  const [entries, setEntries]     = useState<Entry[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData]   = useState({ ic: '', user_type: 'student', type: 'Attendance Log', reason: '' });
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [checkingOut, setCheckingOut] = useState<number | null>(null);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    axios.get('/api/attendance/log', { params: { date: today } })
      .then(res => {
        const manual = (res.data.data ?? [])
          .filter((l: any) => l.scan_method === 'manual')
          .map((l: any) => ({
            id:        l.id,
            name:      l.name,
            class:     l.class,
            user_type: l.user_type,
            type:      'Attendance Log',
            reason:    '',
            check_in:  l.check_in ?? '-',
            check_out: l.check_out ?? null,
          }));
        setEntries(manual);
      })
      .catch(() => {});
  }, []);

  const handleAdd = async () => {
    if (!formData.ic || !formData.reason) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post('/api/attendance/manual-check-in', {
        ic_number: formData.ic,
        user_type: formData.user_type,
        reason:    formData.reason,
      });
      const d = res.data;
      setEntries(prev => [{
        id:        d.id,
        name:      d.name,
        class:     d.class,
        user_type: d.user_type,
        type:      formData.type,
        reason:    formData.reason,
        check_in:  d.check_in,
        check_out: null,
      }, ...prev]);
      setShowModal(false);
      setFormData({ ic: '', user_type: 'student', type: 'Attendance Log', reason: '' });
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async (id: number) => {
    setCheckingOut(id);
    try {
      const res = await axios.post(`/api/attendance/manual-check-out/${id}`);
      setEntries(prev => prev.map(e => e.id === id ? { ...e, check_out: res.data.check_out } : e));
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Check-out failed.');
    } finally {
      setCheckingOut(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-full mx-auto"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-[#1c3068]">Manual Entry</h2>
        <button
          onClick={() => { setShowModal(true); setError(null); }}
          className="bg-[#1c3068] hover:bg-[#152450] text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2"
        >
          <Plus size={18} />
          Manual Check In
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Class</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Check In Time</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Check Out Time</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-semibold text-gray-800">{entry.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{entry.class}</td>
                  <td className="px-6 py-4 text-sm font-medium text-[#1c3068]">{entry.type}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{entry.reason || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{entry.check_in}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{entry.check_out || '-'}</td>
                  <td className="px-6 py-4 text-right">
                    {!entry.check_out ? (
                      <button
                        onClick={() => handleCheckOut(entry.id)}
                        disabled={checkingOut === entry.id}
                        className="bg-[#1c3068] text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-[#152450] transition-colors disabled:opacity-50"
                      >
                        {checkingOut === entry.id ? '...' : 'Check Out'}
                      </button>
                    ) : (
                      <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded">Completed</span>
                    )}
                  </td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    No manual entries today
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl relative z-10 overflow-hidden"
            >
              <div className="bg-[#fcfafa] px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-[#1c3068]">Manual Check In</h3>
                  <p className="text-gray-500 text-sm">Please enter user details</p>
                </div>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                {error && (
                  <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <AlertTriangle size={16} className="text-red-500 shrink-0" />
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-[#1c3068]">
                      <span className="text-[#c53336] mr-1">*</span> Identification Number
                    </label>
                    <input
                      type="text"
                      value={formData.ic}
                      onChange={(e) => setFormData({ ...formData, ic: e.target.value })}
                      placeholder="e.g. 860102075555"
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-gray-700"
                    />
                    <p className="text-xs text-gray-400">Without "-" or space</p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-[#1c3068]">
                      <span className="text-[#c53336] mr-1">*</span> User Type
                    </label>
                    <div className="relative">
                      <select
                        value={formData.user_type}
                        onChange={(e) => setFormData({ ...formData, user_type: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all appearance-none text-gray-700"
                      >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="staff">Staff</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-[#1c3068]">Type</label>
                    <div className="relative">
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all appearance-none text-gray-700"
                      >
                        <option>Attendance Log</option>
                        <option>Co-Curricular</option>
                        <option>Visitor</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-[#1c3068]">
                      <span className="text-[#c53336] mr-1">*</span> Reason
                    </label>
                    <input
                      type="text"
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      placeholder="Enter reason for manual entry"
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-gray-700"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2.5 rounded-lg font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAdd}
                    disabled={loading}
                    className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white px-8 py-2.5 rounded-lg font-bold shadow-lg shadow-blue-500/20 transition-all transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save'}
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

export default function ManualEntryPage() {
  return (
    <DashboardLayout activePageId="manual-entry">
      <ManualEntry />
    </DashboardLayout>
  );
}
