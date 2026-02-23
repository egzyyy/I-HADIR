import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Clock, Search, LogOut as LogOutIcon, ChevronDown, Trash2, X } from 'lucide-react';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { ExportButtons } from '../../Components/dashboard/ExportButtons';

const ManualEntry = () => {
  const [entries, setEntries] = useState([
    { id: 1, ic: '060101010101', type: 'Attendance Log', reason: 'Forgot Card', checkInTime: '29-01-2026 07:30 AM', checkOutTime: '' },
    { id: 2, ic: '060202020202', type: 'Attendance Log', reason: 'Late', checkInTime: '29-01-2026 08:00 AM', checkOutTime: '29-01-2026 02:00 PM' },
  ]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ ic: '', type: 'Attendance Log', reason: '' });

  const handleAdd = () => {
    if (!formData.ic || !formData.reason) return; // Basic validation
    
    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth()+1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}`;

    const newEntry = {
      id: Date.now(),
      ic: formData.ic,
      type: formData.type,
      reason: formData.reason,
      checkInTime: formattedDate,
      checkOutTime: ''
    };
    
    setEntries([newEntry, ...entries]);
    setShowModal(false);
    setFormData({ ic: '', type: 'Attendance Log', reason: '' });
  };

  const handleCheckOut = (id: number) => {
    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth()+1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}`;

    setEntries(entries.map(entry => {
      if (entry.id === id) {
        return { ...entry, checkOutTime: formattedDate };
      }
      return entry;
    }));
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
          onClick={() => setShowModal(true)}
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
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">IC Number</th>
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
                  <td className="px-6 py-4 font-mono text-sm text-gray-600">{entry.ic}</td>
                  <td className="px-6 py-4 text-sm font-medium text-[#1c3068]">{entry.type}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{entry.reason}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{entry.checkInTime}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {entry.checkOutTime || '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {!entry.checkOutTime ? (
                      <button 
                        onClick={() => handleCheckOut(entry.id)}
                        className="bg-[#1c3068] text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-[#152450] transition-colors"
                      >
                        Check Out
                      </button>
                    ) : (
                      <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded">Completed</span>
                    )}
                  </td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    No manual entries yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            ></motion.div>
            
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-[#1c3068]">
                      <span className="text-[#c53336] mr-1">*</span> Identification Number
                    </label>
                    <input 
                      type="text" 
                      value={formData.ic}
                      onChange={(e) => setFormData({...formData, ic: e.target.value})}
                      placeholder="e.g. 860102075555"
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-gray-700"
                    />
                    <p className="text-xs text-gray-400">Without "-" or space</p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-[#1c3068]">
                      <span className="text-[#c53336] mr-1">*</span> Type
                    </label>
                    <div className="relative">
                      <select 
                        value={formData.type}
                        onChange={(e) => setFormData({...formData, type: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all appearance-none text-gray-700"
                      >
                        <option>Attendance Log</option>
                        <option>Co-Curricular</option>
                        <option>Visitor</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-sm font-bold text-[#1c3068]">
                      <span className="text-[#c53336] mr-1">*</span> Reason
                    </label>
                    <input 
                      type="text" 
                      value={formData.reason}
                      onChange={(e) => setFormData({...formData, reason: e.target.value})}
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
                    className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white px-8 py-2.5 rounded-lg font-bold shadow-lg shadow-blue-500/20 transition-all transform hover:-translate-y-1 active:translate-y-0"
                  >
                    Save
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
