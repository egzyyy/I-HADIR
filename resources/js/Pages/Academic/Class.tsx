import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Eye, Edit, Trash2, Users, ChevronDown, X } from 'lucide-react';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { ExportButtons } from '../../Components/dashboard/ExportButtons';
import { DeleteConfirmationModal } from '../../Components/modals/DeleteConfirmationModal';
import { EditClassModal } from '../../Components/modals/EditClassModal';
import { AddStudentToClass } from '../../Components/modals/AddStudentToClass';

const AddClassModal = ({ onClose }: { onClose: () => void }) => {
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
          <form className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  <span className="text-red-500 mr-1">*</span> Class Name e.g. " 1 Merah "
                </label>
                <input 
                  type="text" 
                  placeholder="Class Name"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-400" 
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">
                  <span className="text-red-500 mr-1">*</span> Classroom Teacher
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

const ClassList = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedClassForDelete, setSelectedClassForDelete] = useState<any>(null);
  const [view, setView] = useState<'list' | 'add_student'>('list');

  // Dummy Data for Table
  const dummyData = Array.from({ length: 16 }, (_, i) => ({
    id: i + 1,
    className: `${Math.floor(i/3) + 1} IBNU ${['KHALDUN', 'SINA', 'RUSHD'][i % 3]}`,
    teacher: ['NUR AIDA BINTI MD RAZALI', 'SHAHRIZAN BINTI CHE ON @ HARUN', 'RIFHAN BINTI AHMAD', 'NOR HAYATI BINTI HUSSIN', 'NADIA NASUHA BINTI MOHD SAIDI'][i % 5],
    totalStudents: [0, 0, 19, 21, 29, 28, 29, 32][i % 8],
    registeredDate: ['22-03-2024', '15-02-2025', '22-02-2024'][i % 3]
  }));

  const handleEditClick = (classData: any) => {
    setSelectedClass(classData);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (classData: any) => {
    setSelectedClassForDelete(classData);
    setIsDeleteModalOpen(true);
  };

  const handleAddStudentClick = (classData: any) => {
    setSelectedClass(classData);
    setView('add_student');
  };

  const handleConfirmDelete = () => {
    // Implement delete logic here
    console.log("Deleting class:", selectedClassForDelete);
    setIsDeleteModalOpen(false);
    setSelectedClassForDelete(null);
  };

  if (view === 'add_student') {
    return (
      <AddStudentToClass 
        onBack={() => setView('list')} 
        classNameStr={selectedClass?.className || 'Class'} 
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
            <p className="text-gray-500 text-sm mb-4">Click button above table to export to Copy, CSV, Excel, PDF & Print</p>
            
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
              <ExportButtons />

              <div className="flex items-center gap-2">
                 <span className="text-sm font-semibold text-gray-600">Search:</span>
                 <input 
                   type="text" 
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
                     <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Total Number of Students</th>
                     <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Registered Date</th>
                     <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dummyData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-500 text-center">{item.id}</td>
                      <td className="px-4 py-3 text-sm font-medium text-[#c53336]">{item.className}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 uppercase">{item.teacher}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.totalStudents}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.registeredDate}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center items-center gap-2">
                          <button 
                            onClick={() => handleAddStudentClick(item)}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-[#2563eb] hover:text-white transition-all shadow-sm border border-blue-100 hover:border-[#2563eb]" 
                            title="Add Student"
                          >
                            <Plus size={16} />
                          </button>
                          <button 
                            onClick={() => handleEditClick(item)}
                            className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-[#10b981] hover:text-white transition-all shadow-sm border border-emerald-100 hover:border-[#10b981]" 
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(item)}
                            className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-[#c53336] hover:text-white transition-all shadow-sm border border-red-100 hover:border-[#c53336]" 
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

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 text-sm text-gray-500 gap-4">
              <p>Showing 1 to 16 of 16 entries</p>
              <div className="flex gap-1">
                <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 text-gray-600">Previous</button>
                <button className="px-3 py-1 bg-[#fca5a5] text-white rounded border border-[#fca5a5]">1</button>
                <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 text-gray-600">Next</button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showAddModal && <AddClassModal onClose={() => setShowAddModal(false)} />}
        {isEditModalOpen && (
          <EditClassModal 
            isOpen={isEditModalOpen} 
            onClose={() => setIsEditModalOpen(false)} 
            classData={selectedClass} 
          />
        )}
        {isDeleteModalOpen && (
          <DeleteConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleConfirmDelete}
            itemName={selectedClassForDelete?.className}
            title="Delete Class?"
            message={`Are you sure you want to delete class ${selectedClassForDelete?.className}? This action cannot be undone.`}
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
