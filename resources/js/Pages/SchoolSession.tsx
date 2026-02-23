import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Edit, X } from 'lucide-react';
import DashboardLayout from '../Layouts/DashboardLayout';

const SchoolProfile = () => {
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<{ id: number; year: string; startDate: string; status: string } | null>(null);
  const [editStartDate, setEditStartDate] = useState('');

  // Mock data for session list
  const sessions = [
    { id: 1, year: '2026', startDate: '02-01-2026', status: 'Active' },
    { id: 2, year: '2025', startDate: '02-01-2025', status: 'Inactive' },
  ];

  const handleEditClick = (session: { id: number; year: string; startDate: string; status: string }) => {
    setEditingSession(session);
    // Convert dd-mm-yyyy to yyyy-mm-dd for the date input
    const parts = session.startDate.split('-');
    setEditStartDate(`${parts[2]}-${parts[1]}-${parts[0]}`);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    // Here you would typically update the session in your database
    console.log('Updating session:', editingSession?.id, 'with new date:', editStartDate);
    setIsEditModalOpen(false);
    setEditingSession(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-4xl mx-auto"
    >
      {/* School Session List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h3 className="text-lg font-bold text-[#1c3068]">School Sessions History</h3>
          <button
            onClick={() => setIsSessionModalOpen(true)}
            className="flex items-center gap-2 bg-[#1c3068] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#152450] transition-all shadow-lg shadow-[#1c3068]/20"
          >
            <Clock size={18} />
            Set School Session
          </button>
        </div>
        <div className="p-0">
           <table className="w-full text-left border-collapse">
             <thead>
               <tr className="border-b border-gray-100 bg-gray-50/30 text-xs text-gray-500 uppercase tracking-wider">
                 <th className="px-6 py-4 font-bold">Session Year</th>
                 <th className="px-6 py-4 font-bold">Start Date</th>
                 <th className="px-6 py-4 font-bold">Status</th>
                 <th className="px-6 py-4 font-bold text-right">Action</th>
               </tr>
             </thead>
             <tbody>
               {sessions.map(session => (
                 <tr key={session.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-[#1c3068]">{session.year}</td>
                    <td className="px-6 py-4 text-gray-600 font-mono text-sm">{session.startDate}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        session.status === 'Active' 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : 'bg-gray-50 text-gray-500 border-gray-200'
                      }`}>
                        {session.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button 
                         onClick={() => handleEditClick(session)}
                         className="p-2 rounded-lg text-gray-400 hover:text-[#1c3068] hover:bg-gray-100 transition-colors"
                       >
                         <Edit size={16} />
                       </button>
                    </td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
      </div>

      {/* Set Session Modal */}
      <AnimatePresence>
        {isSessionModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setIsSessionModalOpen(false)}
          >
            <motion.div
               initial={{ scale: 0.95, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.95, opacity: 0, y: 20 }}
               className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
               onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                 <div>
                   <h3 className="text-xl font-bold text-[#1c3068]">Set School Session</h3>
                   <p className="text-gray-500 text-xs mt-1">Configure the academic year duration</p>
                 </div>
                 <button 
                   onClick={() => setIsSessionModalOpen(false)} 
                   className="p-2 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                 >
                   <X size={20} />
                 </button>
              </div>
              
              <div className="p-6">
                 <form className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-[#1c3068]">
                          <span className="text-[#c53336] mr-1">*</span> Start School Date
                        </label>
                        <input 
                          type="date" 
                          className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-gray-700"
                        />
                        <p className="text-xs text-gray-400">Format: dd-mm-yyyy</p>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-[#1c3068]">
                          <span className="text-[#c53336] mr-1">*</span> Session
                        </label>
                        <input 
                          type="text" 
                          defaultValue="2026"
                          placeholder="e.g. 2026"
                          className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-gray-700 font-medium"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                       <button 
                         type="button" 
                         onClick={() => setIsSessionModalOpen(false)} 
                         className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                       >
                         Cancel
                       </button>
                       <button 
                         type="button"
                         className="bg-[#1c3068] hover:bg-[#152450] text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-[#1c3068]/20 transition-all"
                       >
                         Submit
                       </button>
                    </div>
                 </form>
              </div>
            </motion.div>
          </motion.div>
        )}
        
        {/* Edit Session Modal */}
        {isEditModalOpen && editingSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setIsEditModalOpen(false)}
          >
            <motion.div
               initial={{ scale: 0.95, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.95, opacity: 0, y: 20 }}
               className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
               onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                 <div>
                   <h3 className="text-xl font-bold text-[#1c3068]">Edit School Session</h3>
                   <p className="text-gray-500 text-xs mt-1">Update the start date for session year {editingSession.year}</p>
                 </div>
                 <button 
                   onClick={() => setIsEditModalOpen(false)} 
                   className="p-2 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                 >
                   <X size={20} />
                 </button>
              </div>
              
              <div className="p-6">
                 <form className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-[#1c3068]">
                          Session Year
                        </label>
                        <input 
                          type="text" 
                          value={editingSession.year}
                          disabled
                          className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-gray-200 text-gray-500 cursor-not-allowed"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-[#1c3068]">
                          <span className="text-[#c53336] mr-1">*</span> Start School Date
                        </label>
                        <input 
                          type="date" 
                          value={editStartDate}
                          onChange={(e) => setEditStartDate(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-gray-700"
                        />
                        <p className="text-xs text-gray-400">Format: dd-mm-yyyy</p>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-[#1c3068]">
                          Status
                        </label>
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
                            editingSession.status === 'Active' 
                              ? 'bg-green-50 text-green-700 border-green-200' 
                              : 'bg-gray-50 text-gray-500 border-gray-200'
                          }`}>
                            {editingSession.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                       <button 
                         type="button" 
                         onClick={() => setIsEditModalOpen(false)} 
                         className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                       >
                         Cancel
                       </button>
                       <button 
                         type="button"
                         onClick={handleSaveEdit}
                         className="bg-[#1c3068] hover:bg-[#152450] text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-[#1c3068]/20 transition-all"
                       >
                         Update
                       </button>
                    </div>
                 </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const SetSchoolSession = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-4xl mx-auto"
    >
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-2xl font-bold text-[#1c3068]">Set School Session</h2>
          <p className="text-gray-500 mt-2 text-sm leading-relaxed max-w-2xl">
            School session is a period of time which school use to measure the duration of the study.
            Data on the system will depend on the school session.
          </p>
        </div>

        <div className="p-8">
          <form className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-[#1c3068]">
                  <span className="text-[#c53336] mr-1">*</span> Start School Date
                </label>
                <div className="relative">
                  <input 
                    type="date" 
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-gray-700"
                  />
                </div>
                <p className="text-xs text-gray-400">Format: dd-mm-yyyy</p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-[#1c3068]">
                  <span className="text-[#c53336] mr-1">*</span> Session
                </label>
                <input 
                  type="text" 
                  defaultValue="2026"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-gray-700 font-medium"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button 
                type="button"
                className="bg-[#1c3068] hover:bg-[#152450] text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-[#1c3068]/20 transition-all transform hover:-translate-y-1 active:translate-y-0"
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      </div>
    </motion.div>
  );
};

export default function SchoolSessionPage() {
  return (
    <DashboardLayout activePageId="school-profile">
      <SchoolProfile />
    </DashboardLayout>
  );
}
