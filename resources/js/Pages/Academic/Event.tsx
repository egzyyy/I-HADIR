import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Edit, Trash2, Calendar, ChevronDown, X, Upload, ImageIcon, Eye, CheckSquare } from 'lucide-react';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { ExportButtons } from '../../Components/dashboard/ExportButtons';
import { DeleteConfirmationModal } from '../../Components/modals/DeleteConfirmationModal';

const AddEventModal = ({ onClose }: { onClose: () => void }) => {
  const [participants, setParticipants] = useState({
    teacher: false,
    student: false,
    schoolStaff: false,
    parent: false,
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleParticipantToggle = (type: keyof typeof participants) => {
    setParticipants(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden relative max-h-[90vh] overflow-y-auto"
      >
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="text-xl font-bold text-[#1c3068]">Add new event</h3>
            <p className="text-gray-500 text-sm mt-1">Please enter all information required.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
            <X size={24} />
          </button>
        </div>

        <div className="p-8">
          <form className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-bold text-gray-700">
                  <span className="text-red-500 mr-1">*</span> Event Name e.g. " Sukaneka "
                </label>
                <input 
                  type="text" 
                  placeholder="Event Name"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-400" 
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  <span className="text-red-500 mr-1">*</span> Date
                </label>
                <div className="relative">
                   <input 
                    type="date" 
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-700"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">dd-mm-yyyy</p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  <span className="text-red-500 mr-1">*</span> Time
                </label>
                <input 
                  type="time" 
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-700"
                />
                <p className="text-xs text-gray-400 mt-1">HH:mm</p>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-700">
                  Participant
                </label>
                <div className="space-y-2">
                  <label 
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => handleParticipantToggle('teacher')}
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                      participants.teacher 
                        ? 'border-[#1c3068] bg-[#1c3068]' 
                        : 'border-gray-300 group-hover:border-[#1c3068]'
                    }`}>
                      {participants.teacher && (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-gray-600">Teacher</span>
                  </label>
                  
                  <label 
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => handleParticipantToggle('student')}
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                      participants.student 
                        ? 'border-[#1c3068] bg-[#1c3068]' 
                        : 'border-gray-300 group-hover:border-[#1c3068]'
                    }`}>
                      {participants.student && (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-gray-600">Student</span>
                  </label>
                  
                  <label 
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => handleParticipantToggle('schoolStaff')}
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                      participants.schoolStaff 
                        ? 'border-[#1c3068] bg-[#1c3068]' 
                        : 'border-gray-300 group-hover:border-[#1c3068]'
                    }`}>
                      {participants.schoolStaff && (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-gray-600">School Staff</span>
                  </label>
                  
                  <label 
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => handleParticipantToggle('parent')}
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                      participants.parent 
                        ? 'border-[#1c3068] bg-[#1c3068]' 
                        : 'border-gray-300 group-hover:border-[#1c3068]'
                    }`}>
                      {participants.parent && (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-gray-600">Parent</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  <span className="text-red-500 mr-1">*</span> Event Spot e.g. " Padang Besar "
                </label>
                <input 
                  type="text" 
                  placeholder="Event Spot"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-400" 
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-bold text-gray-700">
                  Event Details
                </label>
                <textarea 
                  rows={4}
                  placeholder="Little explanation about this event."
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-400 resize-none" 
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-bold text-gray-700">
                  Event Image
                </label>
                <div className="space-y-4">
                  {imagePreview ? (
                    <div className="relative group">
                      <img 
                        src={imagePreview} 
                        alt="Event preview" 
                        className="w-full h-64 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-12 h-12 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-400">PNG, JPG, GIF up to 10MB</p>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                  )}
                </div>
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
                type="button"
                className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white px-8 py-2.5 rounded-lg font-bold shadow-lg shadow-blue-500/20 transition-all transform hover:-translate-y-1 active:translate-y-0 min-w-[120px]"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

const EventList = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const dummyData = [
    { id: 1, name: 'Hari Anugerah Kecemerlangan 2023', date: '06-02-2024', time: '02:00', spot: 'Dewan Nur Iman' },
    { id: 2, name: 'MAJLIS ASPIRIASI DAN ISPIRASI PRASEKOLAH', date: '29-10-2024', time: '08:00', spot: 'SK PULAU SERAI' },
    { id: 3, name: 'Mesyuarat JPN Pahang', date: '09-07-2024', time: '09:00', spot: 'JPN Pahang' },
  ];

  const handleEdit = (event: any) => {
    setSelectedEvent(event);
    setShowEditModal(true);
  };

  const handleDelete = (event: any) => {
    setSelectedEvent(event);
    setShowDeleteModal(true);
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-full mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-[#1c3068]">Event List</h2>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#1c3068] text-white rounded-lg text-sm font-bold hover:bg-[#152450] transition-all shadow-md shadow-blue-900/20 transform hover:-translate-y-0.5">
            <Plus size={18} /> Add Event
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6">
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                     <th className="px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider w-12 text-center">#</th>
                     <th className="px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Event Name</th>
                     <th className="px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Date</th>
                     <th className="px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Time</th>
                     {/* Added Event Spot Column */}
                     <th className="px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Event Spot</th>
                     <th className="px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dummyData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-500 text-center">{item.id}</td>
                      <td className="px-6 py-4 text-sm font-medium text-[#c53336]">{item.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.date}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.time}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.spot}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center items-center gap-2">
                          <button 
                            onClick={() => handleEdit(item)}
                            className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-[#10b981] hover:text-white transition-all shadow-sm border border-emerald-100" 
                            title="Edit"
                          >
                             <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(item)}
                            className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-[#c53336] hover:text-white transition-all shadow-sm border border-red-100" 
                            title="Delete"
                          >
                             <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showAddModal && <AddEventModal onClose={() => setShowAddModal(false)} />}
        {showEditModal && <EditEventModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} eventData={selectedEvent} />}
        {showDeleteModal && (
          <DeleteConfirmationModal 
            isOpen={showDeleteModal} 
            onClose={() => setShowDeleteModal(false)} 
            userName={selectedEvent?.name} 
            onConfirm={() => setShowDeleteModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

const EditEventModal = ({ isOpen, onClose, eventData }: any) => {
  const [participants, setParticipants] = useState({
    teacher: true,
    student: true,
    schoolStaff: false,
    parent: false,
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleParticipantToggle = (type: keyof typeof participants) => {
    setParticipants(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden relative max-h-[90vh] overflow-y-auto"
      >
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="text-xl font-bold text-[#1c3068]">Edit event</h3>
            <p className="text-gray-500 text-sm mt-1">Please enter all information required.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
            <X size={24} />
          </button>
        </div>

        <div className="p-8">
          <form className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-bold text-gray-700">
                  <span className="text-red-500 mr-1">*</span> Event Name e.g. " Sukaneka "
                </label>
                <input 
                  type="text" 
                  defaultValue={eventData?.name}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" 
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  <span className="text-red-500 mr-1">*</span> Date
                </label>
                <input 
                  type="date" 
                  defaultValue={eventData?.date ? eventData.date.split('-').reverse().join('-') : ''}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" 
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  <span className="text-red-500 mr-1">*</span> Time
                </label>
                <input 
                  type="time" 
                  defaultValue={eventData?.time}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" 
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-700">
                  Participant
                </label>
                <div className="space-y-2">
                  <label 
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => handleParticipantToggle('teacher')}
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                      participants.teacher 
                        ? 'border-[#1c3068] bg-[#1c3068]' 
                        : 'border-gray-300 group-hover:border-[#1c3068]'
                    }`}>
                      {participants.teacher && (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-gray-600">Teacher</span>
                  </label>
                  
                  <label 
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => handleParticipantToggle('student')}
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                      participants.student 
                        ? 'border-[#1c3068] bg-[#1c3068]' 
                        : 'border-gray-300 group-hover:border-[#1c3068]'
                    }`}>
                      {participants.student && (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-gray-600">Student</span>
                  </label>
                  
                  <label 
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => handleParticipantToggle('schoolStaff')}
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                      participants.schoolStaff 
                        ? 'border-[#1c3068] bg-[#1c3068]' 
                        : 'border-gray-300 group-hover:border-[#1c3068]'
                    }`}>
                      {participants.schoolStaff && (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-gray-600">School Staff</span>
                  </label>
                  
                  <label 
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => handleParticipantToggle('parent')}
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                      participants.parent 
                        ? 'border-[#1c3068] bg-[#1c3068]' 
                        : 'border-gray-300 group-hover:border-[#1c3068]'
                    }`}>
                      {participants.parent && (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-gray-600">Parent</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  <span className="text-red-500 mr-1">*</span> Event Spot e.g. " Padang Besar "
                </label>
                <input 
                  type="text" 
                  defaultValue={eventData?.spot}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" 
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-bold text-gray-700">Event Details</label>
                <textarea 
                  rows={4}
                  defaultValue="Event explanation here..."
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none" 
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-bold text-gray-700">
                  Event Image
                </label>
                <div className="space-y-4">
                  {imagePreview ? (
                    <div className="relative group">
                      <img 
                        src={imagePreview} 
                        alt="Event preview" 
                        className="w-full h-64 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-12 h-12 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-400">PNG, JPG, GIF up to 10MB</p>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-8 flex justify-end gap-3 border-t border-gray-100">
              <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-lg border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all">Cancel</button>
              <button type="button" className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white px-8 py-2.5 rounded-lg font-bold shadow-lg shadow-blue-500/20 transition-all transform hover:-translate-y-1">Save</button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default function EventPage() {
  return (
    <DashboardLayout activePageId="event">
      <EventList />
    </DashboardLayout>
  );
}
