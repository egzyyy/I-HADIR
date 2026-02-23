import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Edit, Trash2, Users, ChevronDown, X } from 'lucide-react';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { ExportButtons } from '../../Components/dashboard/ExportButtons';
import { DeleteConfirmationModal } from '../../Components/modals/DeleteConfirmationModal';

const AddCoCurricularModal = ({ onClose }: { onClose: () => void }) => {
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
            <h3 className="text-xl font-bold text-[#1c3068]">Add new Co-Curricular</h3>
            <p className="text-gray-500 text-sm mt-1">Please enter all information required.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
            <X size={24} />
          </button>
        </div>

        <div className="p-8">
          <form className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  <span className="text-red-500 mr-1">*</span> Club Name e.g. " St John "
                </label>
                <input 
                  type="text" 
                  placeholder="Club Name"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-400" 
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  <span className="text-red-500 mr-1">*</span> Capacity e.g. "30"
                </label>
                <input 
                  type="number" 
                  placeholder="Capacity"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-400" 
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-bold text-gray-700">
                  <span className="text-red-500 mr-1">*</span> Club Teacher
                </label>
                <div className="relative">
                  <select className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all appearance-none text-gray-700 cursor-pointer">
                    <option value="">Aishah Fatimah binti Abu Bakar</option>
                    <option value="1">Teacher 1</option>
                    <option value="2">Teacher 2</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
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

const CoCurricularList = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedClub, setSelectedClub] = useState<any>(null);

  const dummyData = Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    clubName: ['St John Ambulance', 'Red Crescent', 'Scouts', 'Girl Guides', 'Puteri Islam'][i],
    teacher: ['Aishah Fatimah binti Abu Bakar', 'Siti Aminah binti Yusuf', 'Ahmad Albab bin Labu', 'Nor Hayati binti Hussin', 'Rifhan binti Ahmad'][i],
    capacity: [30, 35, 40, 30, 35][i],
    registeredDate: ['22-03-2024', '15-02-2025', '22-02-2024', '01-01-2026', '10-01-2026'][i]
  }));

  const handleEdit = (club: any) => {
    setSelectedClub(club);
    setShowEditModal(true);
  };

  const handleDelete = (club: any) => {
    setSelectedClub(club);
    setShowDeleteModal(true);
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-full mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-[#1c3068]">Cocurricular List</h2>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#1c3068] text-white rounded-lg text-sm font-bold hover:bg-[#152450] transition-all shadow-md shadow-blue-900/20 transform hover:-translate-y-0.5">
            <Plus size={18} /> Add Co-Curricular
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6">
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                     <th className="px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider w-12 text-center">#</th>
                     <th className="px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Club Name</th>
                     <th className="px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Club Teacher</th>
                     <th className="px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Capacity</th>
                     <th className="px-6 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dummyData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-500 text-center">{item.id}</td>
                      <td className="px-4 py-3 text-sm font-medium text-[#c53336]">{item.clubName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.teacher}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.capacity}</td>
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
        {showAddModal && <AddCoCurricularModal onClose={() => setShowAddModal(false)} />}
        {showEditModal && <EditCoCurricularModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} cocurricularData={selectedClub} />}
        {showDeleteModal && (
          <DeleteConfirmationModal 
            isOpen={showDeleteModal} 
            onClose={() => setShowDeleteModal(false)} 
            userName={selectedClub?.clubName} 
            onConfirm={() => setShowDeleteModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

const EditCoCurricularModal = ({ isOpen, onClose, cocurricularData }: any) => {
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
            <h3 className="text-xl font-bold text-[#1c3068]">Edit cocurricular</h3>
            <p className="text-gray-500 text-sm mt-1">Please enter all information required.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
            <X size={24} />
          </button>
        </div>

        <div className="p-8">
          <form className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  <span className="text-red-500 mr-1">*</span> Club Name e.g. " 1 Merah "
                </label>
                <input 
                  type="text" 
                  defaultValue={cocurricularData?.clubName}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" 
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  <span className="text-red-500 mr-1">*</span> Capacity e.g. "30"
                </label>
                <input 
                  type="number" 
                  defaultValue={cocurricularData?.capacity}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" 
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-bold text-gray-700">
                  <span className="text-red-500 mr-1">*</span> Club Teacher (Current)
                </label>
                <div className="relative">
                  <select className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all appearance-none text-gray-700 cursor-pointer">
                    <option value="">{cocurricularData?.teacher}</option>
                    <option value="1">Teacher 1</option>
                    <option value="2">Teacher 2</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
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

export default function CoCurricularPage() {
  return (
    <DashboardLayout activePageId="co-curricular">
      <CoCurricularList />
    </DashboardLayout>
  );
}
