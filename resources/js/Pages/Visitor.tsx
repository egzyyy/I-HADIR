import React, { useState, useEffect } from 'react';
import { ArrowLeft, UserPlus, ClipboardList, ChevronDown, LogOut, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';
import bgImage from '../assets/3379b4a489c00147d1f88ca87c8a0a3a3769dc13.png';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

// Ensure Axios acts as an XHR request for Laravel
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

export default function Visitor() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    plateNumber: '',
    category: '',
    personToMeet: '',
    passBadgeNo: '',
    purpose: '',
    notes: ''
  });

  const [recentVisitors, setRecentVisitors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal States
  const [showCheckInSuccess, setShowCheckInSuccess] = useState(false);
  const [showCheckOutSuccess, setShowCheckOutSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [checkOutConfirm, setCheckOutConfirm] = useState<{ isOpen: boolean; id: number | null; name: string }>({
    isOpen: false,
    id: null,
    name: ''
  });

  // 1. Fetch visitors from Database
  const fetchVisitors = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/visitors');
      if (response.data.success) {
        setRecentVisitors(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch visitors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Run once when page loads
  useEffect(() => {
    fetchVisitors();
  }, []);

  // 2. Handle Check In (Save to Database)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await axios.post('/api/visitors', formData);
      if (response.data.success) {
        setShowCheckInSuccess(true);
        
        // Clear the form
        setFormData({
          name: '', phone: '', plateNumber: '', category: '', personToMeet: '', passBadgeNo: '', purpose: '', notes: ''
        });

        // Refresh the table immediately
        fetchVisitors();
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      setErrorMsg(error.response?.data?.message || "Failed to check in visitor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Trigger Check Out Confirmation
  const triggerCheckOut = (id: number, name: string) => {
    setCheckOutConfirm({ isOpen: true, id, name });
  };

  // 4. Proceed with Check Out
  const proceedCheckOut = async () => {
    if (!checkOutConfirm.id) return;
    setIsSubmitting(true);

    try {
      const response = await axios.put(`/api/visitors/${checkOutConfirm.id}/checkout`);
      if (response.data.success) {
        setCheckOutConfirm({ isOpen: false, id: null, name: '' });
        setShowCheckOutSuccess(true);
        fetchVisitors();
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setCheckOutConfirm({ isOpen: false, id: null, name: '' });
      setErrorMsg("Failed to check out visitor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen flex flex-col font-sans relative">
      {/* Background Image with Overlay */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      <div className="fixed inset-0 z-0 bg-[#1c3068]/80 backdrop-blur-[2px]" />

      {/* Header */}
      <div className="relative z-40 bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
               <Link 
                to="/"
                className="p-2 hover:bg-gray-100 rounded-full text-[#1c3068] transition-colors inline-block"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-xl font-black text-[#1c3068] uppercase tracking-wide">VISITOR CHECK-IN</h1>
                <p className="text-xs text-gray-500 mt-1">System Management</p>
              </div>
            </div>
            <div className="flex items-center text-xs text-gray-500 font-medium bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
               <span className="text-[#1c3068] font-bold">I-HADIR</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex-1 py-10 px-4 sm:px-6 lg:px-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-8">
          
          {/* Main Page Title */}
          <div className="flex items-center justify-center gap-3 text-white">
            <ClipboardList size={32} className="stroke-[2.5]" />
            <h2 className="text-3xl font-black tracking-tight">Visitor Logbook</h2>
          </div>

          {/* Registration Card */}
          <div className="bg-white rounded-xl shadow-xl overflow-hidden">
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <UserPlus className="text-[#1c3068]" size={24} />
                <h3 className="text-xl font-bold text-[#1c3068]">Register Visitor</h3>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* ROW 1: Name | Phone */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-gray-700">Name <span className="text-[#c53336]">*</span></label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/20 outline-none transition-all placeholder-gray-400"
                      placeholder="Full name"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-gray-700">Phone <span className="text-[#c53336]">*</span></label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/20 outline-none transition-all placeholder-gray-400"
                      placeholder="0123456789"
                      required
                    />
                  </div>

                  {/* ROW 2: Visitor Category | Person to Meet */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-gray-700">Visitor Category <span className="text-[#c53336]">*</span></label>
                    <div className="relative">
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/20 outline-none transition-all appearance-none cursor-pointer bg-white placeholder-gray-400"
                        required
                      >
                        <option value="" disabled>Select Category</option>
                        <option value="Parent/Guardian">Parent / Guardian</option>
                        <option value="Official">Official (PPD/JPN/KPM)</option>
                        <option value="Contractor">Contractor / Maintenance</option>
                        <option value="Vendor">Vendor / Delivery</option>
                        <option value="Public">Public / Others</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-gray-700">Person to Meet <span className="text-[#c53336]">*</span></label>
                    <input
                      type="text"
                      name="personToMeet"
                      value={formData.personToMeet}
                      onChange={handleChange}
                      className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/20 outline-none transition-all placeholder-gray-400"
                      placeholder="Cikgu Ahmad"
                      required
                    />
                  </div>

                  {/* ROW 3: Pass Badge No | Plate Number */}
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-gray-700">Pass Badge No</label>
                    <input
                      type="text"
                      name="passBadgeNo"
                      value={formData.passBadgeNo}
                      onChange={handleChange}
                      className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/20 outline-none transition-all uppercase placeholder-gray-400"
                      placeholder="10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-gray-700">Plate Number</label>
                    <input
                      type="text"
                      name="plateNumber"
                      value={formData.plateNumber}
                      onChange={handleChange}
                      className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/20 outline-none transition-all uppercase placeholder-gray-400"
                      placeholder="VBC1234"
                    />
                  </div>

                  {/* ROW 4: Purpose of Visit */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700">Purpose of Visit <span className="text-[#c53336]">*</span></label>
                    <div className="relative">
                      <select
                        name="purpose"
                        value={formData.purpose}
                        onChange={handleChange}
                        className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/20 outline-none transition-all appearance-none cursor-pointer bg-white"
                        required
                      >
                        <option value="" disabled>Select Purpose</option>
                        <option value="Meeting / Discussion">Meeting / Discussion</option>
                        <option value="Pickup Student">Pickup Student</option>
                        <option value="Delivery / Supply">Delivery / Supply</option>
                        <option value="Maintenance / Repair">Maintenance / Repair</option>
                        <option value="Other">Other Purpose</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* ROW 5: Additional Notes */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700">Additional Notes</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={2}
                      className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/20 outline-none transition-all resize-none placeholder-gray-400"
                      placeholder="Any additional information..."
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#1c3068] hover:bg-[#152450] text-white font-bold py-3.5 rounded-lg shadow-lg shadow-[#1c3068]/20 transition-all uppercase tracking-wide text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Checking in...' : 'Check In Visitor'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Recent Visitors Card */}
          <div className="bg-white rounded-xl shadow-xl overflow-hidden mb-12">
            <div className="p-8">
              <h3 className="text-xl font-bold text-[#1c3068] mb-6 flex items-center justify-between">
                <span>Recent Visitors In Premise</span>
                <span className="text-sm font-medium bg-green-100 text-green-700 px-3 py-1 rounded-full">
                  {recentVisitors.length} Active
                </span>
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/50">
                      <th className="py-3 px-4 font-bold text-gray-600">Name</th>
                      <th className="py-3 px-4 font-bold text-gray-600">Pass No</th>
                      <th className="py-3 px-4 font-bold text-gray-600">Plate Number</th>
                      <th className="py-3 px-4 font-bold text-gray-600">Time In</th>
                      <th className="py-3 px-4 font-bold text-gray-600 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-500">Loading active visitors...</td>
                      </tr>
                    ) : recentVisitors.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-500">No active visitors currently in premise.</td>
                      </tr>
                    ) : (
                      recentVisitors.map((visitor) => (
                        <tr key={visitor.id} className="hover:bg-blue-50/50 transition-colors group">
                          <td className="py-3 px-4 text-[#1c3068] font-bold">{visitor.name}</td>
                          <td className="py-3 px-4">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${
                              visitor.passNo === '-' ? 'bg-gray-100 text-gray-600 border-gray-200' : 'bg-amber-100 text-amber-800 border-amber-200'
                            }`}>
                              {visitor.passNo}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-600 uppercase font-mono">{visitor.plateNumber}</td>
                          <td className="py-3 px-4 text-gray-500 font-medium">{visitor.date}</td>
                          <td className="py-3 px-4 text-right">
                            <button 
                              onClick={() => triggerCheckOut(visitor.id, visitor.name)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-500 hover:text-white transition-all text-xs font-bold shadow-sm"
                            >
                              <LogOut size={14} />
                              Check Out
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* --- MODALS --- */}
      <AnimatePresence>
        
        {/* CHECK-IN SUCCESS MODAL */}
        {showCheckInSuccess && (
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
              <h3 className="text-2xl font-bold text-[#1c3068] mb-2">Check-In Successful!</h3>
              <p className="text-gray-500 mb-8">
                The visitor has been successfully registered into the system.
              </p>
              <button 
                onClick={() => setShowCheckInSuccess(false)}
                className="w-full bg-[#10b981] hover:bg-[#059669] text-white py-3 rounded-xl font-bold shadow-lg transition-all transform hover:-translate-y-1"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}

        {/* CHECK-OUT CONFIRMATION MODAL */}
        {checkOutConfirm.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-8 text-center"
            >
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <HelpCircle size={40} className="text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold text-[#1c3068] mb-2">Confirm Check-Out</h3>
              <p className="text-gray-500 mb-8">
                Are you sure you want to check out <br/><span className="font-bold text-gray-800">{checkOutConfirm.name}</span>?
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setCheckOutConfirm({ isOpen: false, id: null, name: '' })}
                  className="flex-1 py-3 rounded-xl font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={proceedCheckOut}
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl font-bold bg-[#1c3068] hover:bg-[#152450] text-white shadow-lg transition-all disabled:opacity-70"
                >
                  {isSubmitting ? 'Checking out...' : 'Check Out'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* CHECK-OUT SUCCESS MODAL */}
        {showCheckOutSuccess && (
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
              <h3 className="text-2xl font-bold text-[#1c3068] mb-2">Check-Out Complete!</h3>
              <p className="text-gray-500 mb-8">
                The visitor has been successfully checked out and removed from the active list.
              </p>
              <button 
                onClick={() => setShowCheckOutSuccess(false)}
                className="w-full bg-[#10b981] hover:bg-[#059669] text-white py-3 rounded-xl font-bold shadow-lg transition-all transform hover:-translate-y-1"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}

        {/* ERROR MODAL */}
        {errorMsg && (
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
              <p className="text-gray-500 mb-8">{errorMsg}</p>
              <button 
                onClick={() => setErrorMsg(null)}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold shadow-lg transition-all transform hover:-translate-y-1"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}

      </AnimatePresence>
    </div>
  );
}