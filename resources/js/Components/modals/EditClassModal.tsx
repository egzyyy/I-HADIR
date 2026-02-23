import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronDown, ArrowLeft } from 'lucide-react';

interface EditClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: {
    id: number;
    className: string;
    teacher: string;
    totalStudents: number;
    registeredDate: string;
  } | null;
}

export const EditClassModal = ({ isOpen, onClose, classData }: EditClassModalProps) => {
  const [formData, setFormData] = useState({
    className: '',
    teacher: ''
  });

  useEffect(() => {
    if (classData) {
      setFormData({
        className: classData.className,
        teacher: classData.teacher
      });
    }
  }, [classData]);

  if (!isOpen || !classData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden relative"
      >
        {/* Header */}
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <div className="flex items-center gap-2 mb-2">
               
            </div>
            <h3 className="text-xl font-bold text-[#1c3068]">Edit class</h3>
            <p className="text-gray-500 text-sm mt-1">Please enter all information required.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          <form className="space-y-8">
            <div className="space-y-6">
               {/* Class Name */}
               <div className="space-y-2">
                 <label className="block text-sm font-bold text-gray-700">
                   <span className="text-[#c53336] mr-1">*</span> Class Name e.g. " 1 Merah "
                 </label>
                 <input 
                   type="text" 
                   value={formData.className}
                   onChange={(e) => setFormData({...formData, className: e.target.value})}
                   className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all placeholder:text-gray-400 font-medium text-[#1c3068]"
                 />
               </div>

               {/* Classroom Teacher */}
               <div className="space-y-2">
                 <label className="block text-sm font-bold text-gray-700"> Classroom Teacher (Current)<span className="text-[#c53336] mr-1">*</span></label>
                 <div className="relative">
                   <select 
                     value={formData.teacher}
                     onChange={(e) => setFormData({...formData, teacher: e.target.value})}
                     className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all appearance-none text-[#1c3068] font-medium cursor-pointer uppercase"
                   >
                     <option value={classData.teacher}>{classData.teacher}</option>
                     <option value="ROHANA BINTI MOHD NOR">ROHANA BINTI MOHD NOR</option>
                     <option value="MARIAM BINTI MUDA">MARIAM BINTI MUDA</option>
                     <option value="ISA BINTI ASA">ISA BINTI ASA</option>
                   </select>
                   <ChevronDown size={16} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                 </div>
               </div>
            </div>

            {/* Footer */}
            <div className="pt-8 flex justify-end gap-3 border-t border-gray-50 mt-8">
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
