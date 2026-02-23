import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ChevronRight, Home, Printer, QrCode, Search, UserPlus, Users, Calendar, Hash, ArrowRightLeft, X, ChevronDown } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface AddStudentToClassProps {
  onBack: () => void;
  classNameStr: string;
}

export const AddStudentToClass = ({ onBack, classNameStr }: AddStudentToClassProps) => {
  // State for Transfer Modal
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedStudentForTransfer, setSelectedStudentForTransfer] = useState<{ id: number, name: string } | null>(null);

  // Dummy data for the dropdown
  const studentOptions = [
    { id: 1, name: 'ALI BIN ABU' },
    { id: 2, name: 'SITI NURHALIZA' },
    { id: 3, name: 'AHMAD ALBAB' },
  ];

  // Dummy data for class transfer options
  const classTransferOptions = [
    { id: 1, name: '1 INOVATIF', teacher: 'ROHANA BINTI MOHD NOR' },
    { id: 2, name: '1 KREATIF', teacher: 'AHMAD ZAKI BIN DAUD' },
    { id: 3, name: '1 BESTARI', teacher: 'SITI AMINAH BINTI RAZAK' },
  ];

  // Dummy data for the table
  const studentsList = Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    name: [
      "AMMAR IQBAL BIN MOHD SUHARDI",
      "ADAM AONI BIN NOOR NIKMAN",
      "FAIQA NABILA BINTI ARMAN",
      "AHMAD ZAFRI BIN AHMAD FAIRUS",
      "MUHAMMAD AQIEF IZZUDDIN BIN MOHD ASRI",
      "NUR QHAIRUNISA UMAIRA BINTI MOHD SAAD",
      "MUHAMMAD SAFWAN BIN HAMDI",
      "MUHAMMAD FAREESH AMSYAR BIN MOHD",
      "MUHAMMAD AQIL NAUFAL BIN MOHD NAZRI",
      "NUR AFRINA DANIA BINTI FAKHRUD RUJHAN",
      "MUHAMMAD SHAHEER ZAFRIL BIN MOHD SUHAIRIE",
      "AHMAD SHUQAIRI BIN RUSDI",
      "ALISHA SABRINA BINTI NOOR AZAM",
      "IZZAH AZ ZAHRA BINTI AZAMUDDIN",
      "MOHAMAD HADIF BIN HARMADI"
    ][i] || `STUDENT ${i + 1}`,
    phone: ["012-3456789", "019-8765432", "011-2345678", "013-9876543"][i % 4],
    gender: i % 3 === 2 ? "Female" : "Male",
    registeredDate: ["11-01-2026", "12-01-2026", "13-01-2026", "14-01-2026"][i % 4]
  }));

  const handleOpenTransferModal = (student: { id: number, name: string }) => {
    setSelectedStudentForTransfer(student);
    setIsTransferModalOpen(true);
  };

  const handleCloseTransferModal = () => {
    setIsTransferModalOpen(false);
    setSelectedStudentForTransfer(null);
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
           <span className="text-[10px] text-gray-400 font-medium">Session 2026 • {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
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
                            <span className="text-lg font-bold text-[#1c3068]">{classNameStr}</span>
                        </div>
                        <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">Academic Year</span>
                            <span className="text-lg font-bold text-[#1c3068] flex items-center gap-2">
                                <Calendar size={18} className="text-[#c53336]" /> 2026
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Student Form Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-fit">
                <div className="border-b border-gray-100 px-6 py-4 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-gray-800 font-bold text-base flex items-center gap-2">
                        <UserPlus size={18} className="text-[#0ea5e9]" /> Enroll New Student
                    </h3>
                </div>
                <div className="p-6">
                    <p className="text-gray-500 text-sm mb-6">Search and select a student to enroll them into this class.</p>
                    
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
                                Student Name <span className="text-[#c53336]">*</span>
                            </label>
                            <div className="relative group">
                                <select className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-sm text-gray-700 appearance-none cursor-pointer group-hover:border-gray-400">
                                    <option value="">Select a student...</option>
                                    {studentOptions.map(student => (
                                        <option key={student.id} value={student.id}>{student.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
                                    <Search size={16} />
                                </div>
                            </div>
                        </div>

                        <button className="w-full bg-[#1c3068] hover:bg-[#152450] text-white py-3 rounded-lg font-bold shadow-lg shadow-blue-900/20 transition-all transform active:scale-[0.98] flex justify-center items-center gap-2">
                            <UserPlus size={18} />
                            <span>Enroll Student</span>
                        </button>
                    </div>
                </div>
            </div>
         </div>

         {/* Bottom Row: Student List */}
         <div className="w-full">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col w-full">
                <div className="border-b border-gray-100 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50">
                    <div>
                        <h3 className="text-gray-800 font-bold text-base flex items-center gap-2">
                            <Users size={18} className="text-[#1c3068]" /> Enrolled Students
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">Total {studentsList.length} students enrolled</p>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                        <span className="text-[10px] font-bold text-gray-400 px-2 uppercase">Show</span>
                        {[10, 20, 50].map((num) => (
                            <button key={num} className={`px-3 py-1 text-xs font-bold rounded ${num === 10 ? 'bg-[#1c3068] text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                                {num}
                            </button>
                        ))}
                    </div>
                </div>
        
                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <th className="py-4 px-6 w-16 text-center">No.</th>
                                <th className="py-4 px-6">Student Name</th>
                                <th className="py-4 px-6">Phone</th>
                                <th className="py-4 px-6">Gender</th>
                                <th className="py-4 px-6">Registered</th>
                                <th className="py-4 px-6 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {studentsList.map((student, index) => (
                                <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="py-4 px-6 text-sm text-gray-400 font-bold text-center">{index + 1}</td>
                                    <td className="py-4 px-6">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-[#1c3068] leading-tight">{student.name}</span>
                                            <span className="text-[10px] text-gray-400 font-bold mt-0.5">ID: {2026000 + student.id}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-sm text-gray-500 font-medium">{student.phone}</td>
                                    <td className="py-4 px-6">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                                            student.gender === 'Male' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-pink-50 text-pink-600 border-pink-100'
                                        }`}>
                                            {student.gender.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 text-sm text-gray-500 font-medium">{student.registeredDate}</td>
                                    <td className="py-4 px-6 text-center">
                                        <div className="flex justify-center items-center gap-2">
                                            <button className="p-2 bg-gray-50 text-gray-500 rounded-lg hover:bg-[#1c3068] hover:text-white transition-all shadow-sm border border-gray-200" title="Print Info">
                                                <Printer size={16} />
                                            </button>
                                            <button className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100" title="View QR Code">
                                                <QrCode size={16} />
                                            </button>
                                            <button 
                                              onClick={() => handleOpenTransferModal(student)}
                                              className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100" 
                                              title="Transfer Student"
                                            >
                                                <ArrowRightLeft size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center text-[11px] font-bold text-gray-400">
                    <span>Showing 1 to {studentsList.length} of {studentsList.length} entries</span>
                    <div className="flex gap-1">
                        <button className="px-3 py-1 rounded border border-gray-200 bg-white hover:bg-gray-100 transition-all uppercase">Prev</button>
                        <button className="px-3 py-1 rounded bg-[#1c3068] text-white shadow-md">1</button>
                        <button className="px-3 py-1 rounded border border-gray-200 bg-white hover:bg-gray-100 transition-all uppercase">Next</button>
                    </div>
                </div>
            </div>
         </div>
         
         <div className="text-center mt-12 mb-6">
            <p className="text-gray-400 text-xs font-medium">2026 © I - HADIR System V 1.0 • Built with precision</p>
         </div>
      </div>

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
                    {/* Header */}
                    <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <div>
                            <h3 className="text-xl font-bold text-[#1c3068]">Transfer Student</h3>
                            <p className="text-gray-500 text-sm mt-1">Please enter all information required.</p>
                        </div>
                        <button onClick={handleCloseTransferModal} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="p-8">
                        <div className="space-y-6">
                            <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 mb-2">
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Student Name</span>
                                    <span className="text-lg font-bold text-[#1c3068]">{selectedStudentForTransfer?.name}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700">
                                    <span className="text-[#c53336] mr-1">*</span> Destination Class
                                </label>
                                <div className="relative">
                                    <select className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all appearance-none text-gray-700 cursor-pointer">
                                        <option value="">Select a class to transfer to...</option>
                                        {classTransferOptions.map(cls => (
                                            <option key={cls.id} value={cls.id}>{cls.name} (Teacher: {cls.teacher})</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={16} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 flex justify-end gap-3">
                            <button 
                                onClick={handleCloseTransferModal}
                                className="px-6 py-2.5 rounded-lg border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleCloseTransferModal}
                                className="bg-[#1c3068] hover:bg-[#152450] text-white px-8 py-2.5 rounded-lg font-bold shadow-lg shadow-blue-900/20 transition-all transform hover:-translate-y-1 active:translate-y-0 min-w-[120px] flex items-center justify-center gap-2"
                            >
                                <ArrowRightLeft size={16} />
                                <span>Transfer</span>
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
