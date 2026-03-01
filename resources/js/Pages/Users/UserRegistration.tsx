import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, GraduationCap, Book, ChevronRight, ChevronDown, CheckCircle } from 'lucide-react';
import DashboardLayout from '../../Layouts/DashboardLayout';

const UserRegistration = () => {
  const [selectedType, setSelectedType] = useState<'staff' | 'teacher' | 'student' | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setSelectedType(null);
    setCurrentStep(1);
  };

  // Define the options for the "Staff Type" or "Class" dropdown
  const getTypeOptions = () => {
    switch (selectedType) {
      case 'staff':
        return [
          { value: 'staff', label: 'Staff' },
          { value: 'cleaning_staff', label: 'Cleaning Staff' },
          { value: 'security_staff', label: 'Security Staff' },
          { value: 'temporary_staff', label: 'Temporary Staff' },
        ];
      case 'student':
        return [
          { value: '1-kreatif', label: '1 KREATIF, Classroom Teacher: ROHANA BINTI MOHD NOR' },
          { value: '1-progresif', label: '1 PROGRESIF, Classroom Teacher: MARIAM BINTI MUDA ' },
          { value: '2-inovatif', label: '2 INOVATIF, Classroom Teacher: ISA BINTI ASA' },
        ];
      default:
        return [];
    }
  };

  // If no type is selected, show the selection screen
  if (!selectedType) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-6xl mx-auto flex flex-col items-center justify-center min-h-[500px]"
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#1c3068] mb-3">User Registration</h2>
          <p className="text-gray-500">Please select the type of user you want to register</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          {/* Staff Card */}
          <div 
            onClick={() => setSelectedType('staff')}
            className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer group flex flex-col items-center text-center"
          >
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Users size={40} className="text-[#1c3068]" />
            </div>
            <h3 className="text-xl font-bold text-[#1c3068] mb-2">Staff</h3>
            <p className="text-sm text-gray-500">Register new support staff members</p>
          </div>

          {/* Teacher Card */}
          <div 
            onClick={() => setSelectedType('teacher')}
            className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer group flex flex-col items-center text-center"
          >
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <GraduationCap size={40} className="text-[#1c3068]" />
            </div>
            <h3 className="text-xl font-bold text-[#1c3068] mb-2">Teacher</h3>
            <p className="text-sm text-gray-500">Register new academic teachers</p>
          </div>

          {/* Student Card */}
          <div 
            onClick={() => setSelectedType('student')}
            className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer group flex flex-col items-center text-center"
          >
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Book size={40} className="text-[#1c3068]" />
            </div>
            <h3 className="text-xl font-bold text-[#1c3068] mb-2">Student</h3>
            <p className="text-sm text-gray-500">Register new students to classes</p>
          </div>
        </div>
      </motion.div>
    );
  }

  const title = selectedType.charAt(0).toUpperCase() + selectedType.slice(1) + " Registration";

  const shouldShowTypeDropdown = selectedType === 'staff' || selectedType === 'student';

  // Customize fields based on type if needed
  const getTypeLabel = () => {
    switch(selectedType) {
      case 'staff': return 'Staff Type';
      case 'student': return 'Class';
      default: return 'Type';
    }
  };

  const steps = selectedType === 'student' 
    ? [
        { id: 1, label: 'Personal info' },
        { id: 2, label: 'Profile picture' },
        { id: 3, label: 'Parent Info' },
        { id: 4, label: 'Emergency contact' }
      ]
    : [
        { id: 1, label: 'Personal info' },
        { id: 2, label: 'Profile picture' },
        { id: 3, label: 'Emergency contact' }
      ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto"
    >
      <div className="mb-6 flex items-center gap-4">
        <button 
          onClick={() => {
            setSelectedType(null);
            setCurrentStep(1);
          }}
          className="text-gray-500 hover:text-[#1c3068] transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <ChevronRight size={16} className="rotate-180" /> Back to Selection
        </button>
        <div className="h-4 w-px bg-gray-300"></div>
        <h2 className="text-2xl font-bold text-[#1c3068]">{title}</h2>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px] flex flex-col">
        <div className="p-8">
          <div className="mb-8">
            <h3 className="text-xl font-bold text-[#1c3068]">Registration Form</h3>
            <p className="text-gray-400 text-sm mt-1">Please fill in all the form</p>
          </div>

          {/* Stepper */}
          <div className="flex items-center justify-between max-w-3xl mx-auto mb-16 relative">
             <div className="absolute top-[20px] left-0 w-full h-[2px] bg-gray-100 -z-10"></div>
             <div 
               className="absolute top-[20px] left-0 h-[2px] bg-blue-500 -z-10 transition-all duration-500 ease-in-out"
               style={{ width: currentStep === 1 ? '0%' : ((currentStep - 1) / (steps.length - 1)) * 100 + '%' }}
             ></div>

             {steps.map((step) => (
               <div key={step.id} className="flex flex-col items-center group cursor-pointer" onClick={() => step.id < currentStep && setCurrentStep(step.id)}>
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg mb-3 transition-all duration-300 border-2 ${
                    currentStep >= step.id 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' 
                      : 'bg-white border-gray-200 text-gray-400'
                  }`}>
                    {step.id}
                  </div>
                  <span className={`text-sm font-medium tracking-wide ${currentStep >= step.id ? 'text-gray-800' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
               </div>
             ))}
          </div>

          {/* Forms */}
          <div className="max-w-6xl mx-auto flex-1">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">
                        Name : <span className="text-red-500">*</span>
                      </label>
                      <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">
                        Identification number : <span className="text-red-500">*</span>
                      </label>
                      <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                      <p className="text-xs text-gray-400 mt-1">e.g. "860102075555" (without "-" or space)</p>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">
                        Email Address :
                      </label>
                      <input type="email" className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">
                        Phone Number : <span className="text-red-500">*</span>
                      </label>
                      <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                      <p className="text-xs text-gray-400 mt-1">e.g. "0123456789" (without "-" or space)</p>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">
                        Gender : <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all appearance-none text-gray-700">
                          <option>Select Gender</option>
                          <option>Male</option>
                          <option>Female</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    {shouldShowTypeDropdown && (
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700">
                          {getTypeLabel()} : <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <select className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all appearance-none text-gray-700">
                            <option value="">Select {getTypeLabel()}</option>
                            {getTypeOptions().map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={16} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                    )}
                    {selectedType === 'teacher' && (
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700">
                          Teacher Position : <span className="text-red-500">*</span>
                        </label>
                        <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                      </div>
                    )}
                    {selectedType === 'student' && (
                      <div className="space-y-2 md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700">
                          Address : <span className="text-red-500">*</span>
                        </label>
                        <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {currentStep === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h4 className="text-lg font-bold text-gray-800 mb-2">Profile Picture</h4>
                  <p className="text-gray-500 text-sm mb-6">Max size is 3M</p>

                  <div className="w-full h-80 border border-gray-200 rounded-none flex items-center justify-center bg-white">
                    <div className="w-48 h-48 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                       <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-gray-400 translate-y-4">
                          <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                       </svg>
                    </div>
                  </div>
                </motion.div>
              )}

              {currentStep === 3 && selectedType === 'student' && (
                <motion.div 
                  key="step3-parent"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700">
                          Father's/Guardian's Name : <span className="text-red-500">*</span>
                        </label>
                        <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700">
                          Identification Number : <span className="text-red-500">*</span>
                        </label>
                        <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                        <p className="text-xs text-gray-400 mt-1">e.g. "860102075555" (without "-" or space)</p>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700">
                          Mother's Name : <span className="text-red-500">*</span>
                        </label>
                        <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700">
                          Identification Number : <span className="text-red-500">*</span>
                        </label>
                        <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                        <p className="text-xs text-gray-400 mt-1">e.g. "860102075555" (without "-" or space)</p>
                      </div>
                   </div>
                </motion.div>
              )}

              {((currentStep === 3 && selectedType !== 'student') || (currentStep === 4 && selectedType === 'student')) && (
                <motion.div 
                  key="step-emergency"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-8">
                     <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">
                        Emergency Contact Name : <span className="text-red-500">*</span>
                      </label>
                      <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">
                        Relation : <span className="text-red-500">*</span>
                      </label>
                      <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">
                        Emergency Phone Number : <span className="text-red-500">*</span>
                      </label>
                      <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                      <p className="text-xs text-gray-400 mt-1">e.g. "0123456789" (without "-" or space)</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex justify-end gap-3 mt-16">
               {currentStep > 1 && (
                 <button 
                   onClick={() => setCurrentStep(curr => curr - 1)} 
                   className="px-6 py-2 rounded border border-gray-200 text-gray-500 font-medium hover:bg-gray-50 transition-colors bg-white"
                 >
                   Previous
                 </button>
               )}
               {currentStep < steps.length ? (
                 <button 
                   onClick={() => setCurrentStep(curr => curr + 1)} 
                   className="px-8 py-2 rounded bg-[#2563EB] text-white font-medium hover:bg-blue-700 shadow-sm transition-all"
                 >
                   Next
                 </button>
               ) : (
                 <button 
                   onClick={() => setShowSuccessModal(true)}
                   className="px-8 py-2 rounded bg-[#2563EB] text-white font-medium hover:bg-blue-700 shadow-sm transition-all"
                 >
                   Submit
                 </button>
               )}
            </div>
          </div>
        </div>
      </div>
      
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
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
              <p className="text-gray-500 mb-8">
                New <span className="font-bold text-gray-700 capitalize">{selectedType}</span> has been successfully registered to the system.
              </p>
              
              {/* Updated Button Color to Green */}
              <button 
                onClick={handleCloseSuccessModal}
                className="w-full bg-[#10b981] hover:bg-[#059669] text-white py-3 rounded-xl font-bold shadow-lg shadow-green-500/20 transition-all transform hover:-translate-y-1 active:translate-y-0"
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

export default function UserRegistrationPage() {
  return (
    <DashboardLayout activePageId="user-registration">
      <UserRegistration />
    </DashboardLayout>
  );
}
