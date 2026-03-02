import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Edit, X, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import DashboardLayout from '../Layouts/DashboardLayout';
import axios from 'axios';

// Ensure Axios acts as an XHR request for Laravel
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

const SchoolProfile = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal States
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Feedback Modals
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorModalMsg, setErrorModalMsg] = useState<string | null>(null);

  // Form States
  const [editingSession, setEditingSession] = useState<any>(null);
  const [sessionToDelete, setSessionToDelete] = useState<any>(null);
  const [editStartDate, setEditStartDate] = useState('');
  const [newYear, setNewYear] = useState(new Date().getFullYear().toString());
  const [newStartDate, setNewStartDate] = useState('');

  // Fetch Data
  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/sessions');
      if (response.data.success) {
        setSessions(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch sessions", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Set up edit modal
  const handleEditClick = (session: any) => {
    setEditingSession(session);
    setEditStartDate(session.rawStartDate); // Use standard HTML date format
    setIsEditModalOpen(true);
  };

  // Set up delete modal
  const handleDeleteClick = (session: any) => {
    setSessionToDelete(session);
    setIsDeleteModalOpen(true);
  };

  // Submit New Session
  const handleCreateSession = async () => {
    if (!newYear || !newStartDate) {
      setErrorModalMsg("Please fill in both the Year and Start Date.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post('/api/sessions', {
        year: newYear,
        start_date: newStartDate
      });
      if (response.data.success) {
        setSuccessMessage(response.data.message);
        setShowSuccessModal(true);
        setIsSessionModalOpen(false);
        setNewStartDate(''); // Reset form
        fetchSessions(); // Refresh list
        
        // Slight delay, then reload to update the global Layout header session
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (error: any) {
      setErrorModalMsg(error.response?.data?.message || "Failed to create session.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Edited Session
  const handleSaveEdit = async () => {
    if (!editStartDate) {
      setErrorModalMsg("Start date cannot be empty.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.put(`/api/sessions/${editingSession.id}`, {
        start_date: editStartDate
      });
      if (response.data.success) {
        setSuccessMessage(response.data.message);
        setShowSuccessModal(true);
        setIsEditModalOpen(false);
        fetchSessions(); // Refresh list
      }
    } catch (error: any) {
      setErrorModalMsg(error.response?.data?.message || "Failed to update session.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!sessionToDelete) return;
    
    setIsSubmitting(true);
    try {
      const response = await axios.delete(`/api/sessions/${sessionToDelete.id}`);
      if (response.data.success) {
        setSuccessMessage(response.data.message);
        setShowSuccessModal(true);
        setIsDeleteModalOpen(false);
        fetchSessions(); // Refresh list

        // Reload to update global Layout header session
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (error: any) {
      setErrorModalMsg(error.response?.data?.message || "Failed to delete session.");
    } finally {
      setIsSubmitting(false);
    }
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
        <div className="p-0 overflow-x-auto">
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
               {isLoading ? (
                 <tr><td colSpan={4} className="text-center py-8 text-gray-500">Loading sessions...</td></tr>
               ) : sessions.length === 0 ? (
                 <tr><td colSpan={4} className="text-center py-8 text-gray-500">No sessions found. Create one above!</td></tr>
               ) : (
                 sessions.map((session) => (
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
                         <div className="flex justify-end gap-2">
                           <button 
                             onClick={() => handleEditClick(session)}
                             className="p-2 rounded-lg text-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                             title="Edit Start Date"
                           >
                             <Edit size={16} />
                           </button>
                           <button 
                             onClick={() => handleDeleteClick(session)}
                             className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                             title="Delete Session"
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
                          <span className="text-[#c53336] mr-1">*</span> Session Year
                        </label>
                        <input 
                          type="text" 
                          value={newYear}
                          onChange={(e) => setNewYear(e.target.value)}
                          placeholder="e.g. 2026"
                          className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-gray-700 font-medium"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-[#1c3068]">
                          <span className="text-[#c53336] mr-1">*</span> Start School Date
                        </label>
                        <input 
                          type="date" 
                          value={newStartDate}
                          onChange={(e) => setNewStartDate(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-gray-700"
                        />
                        <p className="text-xs text-gray-400">Note: New sessions are automatically set to Active.</p>
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
                         onClick={handleCreateSession}
                         disabled={isSubmitting}
                         className="bg-[#1c3068] hover:bg-[#152450] text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-[#1c3068]/20 transition-all disabled:opacity-70"
                       >
                         {isSubmitting ? 'Saving...' : 'Submit'}
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
                         disabled={isSubmitting}
                         className="bg-[#1c3068] hover:bg-[#152450] text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-[#1c3068]/20 transition-all disabled:opacity-70"
                       >
                         {isSubmitting ? 'Updating...' : 'Update'}
                       </button>
                    </div>
                 </form>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && sessionToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setIsDeleteModalOpen(false)}
          >
            <motion.div
               initial={{ scale: 0.95, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.95, opacity: 0, y: 20 }}
               className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden p-8 text-center"
               onClick={(e) => e.stopPropagation()}
            >
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={40} className="text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-[#1c3068] mb-2">Delete Session?</h3>
              <p className="text-gray-500 mb-8">
                Are you sure you want to delete the school session for <b>{sessionToDelete.year}</b>? This action cannot be undone.
              </p>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 py-3 rounded-xl font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmDelete}
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl font-bold bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 transition-all disabled:opacity-70"
                >
                  {isSubmitting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ERROR FEEDBACK MODAL */}
      <AnimatePresence>
        {errorModalMsg && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-8 text-center"
            >
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={40} className="text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Error</h3>
              <p className="text-gray-500 mb-8">{errorModalMsg}</p>
              <button 
                onClick={() => setErrorModalMsg(null)}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold shadow-lg transition-all transform hover:-translate-y-1"
              >
                Go Back
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SUCCESS FEEDBACK MODAL */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-8 text-center"
            >
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} className="text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-[#1c3068] mb-2">Success!</h3>
              <p className="text-gray-500 mb-8">{successMessage}</p>
              <button 
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-[#10b981] hover:bg-[#059669] text-white py-3 rounded-xl font-bold shadow-lg transition-all transform hover:-translate-y-1"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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