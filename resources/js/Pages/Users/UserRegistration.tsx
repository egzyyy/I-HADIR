import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, GraduationCap, Book, ChevronRight, ChevronDown, CheckCircle, Upload, X, AlertCircle } from 'lucide-react';
import DashboardLayout from '../../Layouts/DashboardLayout';
import axios from 'axios';

// Ensure Axios acts as an XHR request for Laravel
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

interface ClassroomOption {
  id: number;
  name: string;
  teacher: string;
  totalStudents?: number;
  capacity?: number | null;
  isActive?: boolean;
}

const UserRegistration = () => {
  const [selectedType, setSelectedType] = useState<'staff' | 'teacher' | 'student' | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorModalMsg, setErrorModalMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [classroomOptions, setClassroomOptions] = useState<ClassroomOption[]>([]);
  const [isClassroomsLoading, setIsClassroomsLoading] = useState(false);
  const [classroomsError, setClassroomsError] = useState<string | null>(null);

  const [data, setData] = useState({
    name: '',
    icNumber: '',
    email: '',
    phone: '',
    gender: '',
    specificType: '',
    position: '',
    streetAddress: '',
    city: '',
    state: '',
    postcode: '',
    country: 'Malaysia',
    password: '',
    fatherName: '',
    fatherIc: '',
    motherName: '',
    motherIc: '',
    emergencyName: '',
    emergencyRelation: '',
    emergencyPhone: '',
    type: '',
    profilePic: null as File | null,
  });
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (selectedType) {
      setData(prev => ({ ...prev, type: selectedType }));
    }
  }, [selectedType]);

  useEffect(() => {
    if (selectedType !== 'student') {
      return;
    }

    let isMounted = true;

    const fetchClassrooms = async () => {
      setIsClassroomsLoading(true);
      setClassroomsError(null);

      try {
        let activeSessionId = '';

        try {
          const sessionRes = await axios.get('/api/sessions');
          const activeSession = sessionRes.data.data?.find((session: any) => session.status === 'Active');
          activeSessionId = activeSession?.id ? String(activeSession.id) : '';
        } catch {
          activeSessionId = '';
        }

        const classesUrl = activeSessionId ? `/api/classes?session_id=${activeSessionId}` : '/api/classes';
        const classRes = await axios.get(classesUrl);
        const classes = (classRes.data.data || []) as ClassroomOption[];
        const activeClasses = classes.filter((classroom) => classroom.isActive !== false);

        if (isMounted) {
          setClassroomOptions(activeClasses);
        }
      } catch (error) {
        console.error('Failed to fetch classrooms', error);
        if (isMounted) {
          setClassroomOptions([]);
          setClassroomsError('Unable to load classrooms');
        }
      } finally {
        if (isMounted) {
          setIsClassroomsLoading(false);
        }
      }
    };

    fetchClassrooms();

    return () => {
      isMounted = false;
    };
  }, [selectedType]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Restrict specific fields to NUMBERS ONLY
    const numberOnlyFields = ['icNumber', 'phone', 'emergencyPhone', 'fatherIc', 'motherIc', 'postcode'];
    if (numberOnlyFields.includes(name)) {
      const onlyNums = value.replace(/\D/g, '');
      setData(prev => ({ ...prev, [name]: onlyNums }));
      return;
    }

    setData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setData(prev => ({ ...prev, profilePic: file }));
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveFile = () => {
    setData(prev => ({ ...prev, profilePic: null }));
    setPreviewUrl(null);
  };

  const handleSubmit = async () => {
    // Check if password is required (for teacher and Security Staff)
    const isSecurityStaff = selectedType === 'staff' && data.specificType === 'Security Staff';
    const isTeacher = selectedType === 'teacher';
    const requiresPassword = isSecurityStaff || isTeacher;

    // 1. Check Required Fields
    const baseRequired = ['name', 'icNumber', 'phone', 'gender', 'streetAddress', 'city', 'state', 'postcode', 'emergencyName', 'emergencyRelation', 'emergencyPhone'];
    let requiredFields = [...baseRequired];
    
    if (selectedType === 'student') {
      requiredFields.push('specificType', 'fatherName', 'fatherIc', 'motherName', 'motherIc');
    } else if (selectedType === 'teacher') {
      requiredFields.push('position', 'email', 'password');
    } else if (selectedType === 'staff') {
      requiredFields.push('specificType');
      if (isSecurityStaff) {
        requiredFields.push('email', 'password');
      }
    }

    for (const field of requiredFields) {
      if (!data[field as keyof typeof data]) {
        setErrorModalMsg("Please ensure all required fields (*) are filled out completely.");
        return; 
      }
    }

    // 2. Validate Specific Formats
    if (data.icNumber.length !== 12) {
      setErrorModalMsg("The primary Identification Number must be exactly 12 digits.");
      return;
    }
    if (data.phone.length < 10 || data.phone.length > 11) {
      setErrorModalMsg("The primary Phone Number must be 10 or 11 digits.");
      return;
    }
    if (data.emergencyPhone.length < 10 || data.emergencyPhone.length > 11) {
      setErrorModalMsg("The Emergency Phone Number must be 10 or 11 digits.");
      return;
    }
    if (selectedType === 'student') {
      if (data.fatherIc.length !== 12 || data.motherIc.length !== 12) {
        setErrorModalMsg("Parent Identification Numbers must be exactly 12 digits.");
        return;
      }
    }
    if (requiresPassword && data.password.length < 8) {
      setErrorModalMsg("Password must be at least 8 characters.");
      return;
    }

    setIsProcessing(true);
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      const value = data[key as keyof typeof data];
      if (value !== null && value !== '') {
        formData.append(key, value as string | Blob);
      }
    });

    try {
      const response = await axios.post('/users/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.success) {
        setShowSuccessModal(true);
      }
    } catch (error: any) {
      console.error('Registration failed:', error.response?.data || error);
      const serverMsg = error.response?.data?.message || "An unexpected error occurred. Please try again.";
      setErrorModalMsg(serverMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setData({
      name: '', icNumber: '', email: '', phone: '', gender: '', specificType: '', position: '',
      streetAddress: '', city: '', state: '', postcode: '', country: 'Malaysia', password: '',
      fatherName: '', fatherIc: '', motherName: '', motherIc: '', emergencyName: '', emergencyRelation: '', emergencyPhone: '', type: '', profilePic: null
    });
    setPreviewUrl(null);
    setSelectedType(null);
    setCurrentStep(1);
  };

  const formatClassroomLabel = (classroom: ClassroomOption) => {
    const teacherName = classroom.teacher && classroom.teacher !== '-' ? classroom.teacher : 'Unassigned';
    const enrollmentCount = typeof classroom.totalStudents === 'number'
      ? ` (${classroom.totalStudents}${classroom.capacity ? `/${classroom.capacity}` : ''} enrolled)`
      : '';

    return `${classroom.name}, Classroom Teacher: ${teacherName}${enrollmentCount}`;
  };

  const getTypeOptions = () => {
    switch (selectedType) {
      case 'staff':
        return [
          { value: 'Security Staff', label: 'Security Staff' },
          { value: 'Store Staff', label: 'Store Staff' },
          { value: 'Cleaning Staff', label: 'Cleaning Staff' },
          { value: 'Temporary Staff', label: 'Temporary Staff' },
          { value: 'Admin Clerk', label: 'Admin Clerk' },
        ];
      case 'student':
        return classroomOptions.map((classroom) => ({
          value: classroom.name,
          label: formatClassroomLabel(classroom),
        }));
      default:
        return [];
    }
  };

  if (!selectedType) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-6xl mx-auto flex flex-col items-center justify-center min-h-[500px]"
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#2f4fa8] mb-3">User Registration</h2>
          <p className="text-gray-500">Please select the type of user you want to register</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          <div onClick={() => setSelectedType('staff')} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer group flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Users size={40} className="text-[#2f4fa8]" />
            </div>
            <h3 className="text-xl font-bold text-[#2f4fa8] mb-2">Staff</h3>
            <p className="text-sm text-gray-500">Register new support staff members</p>
          </div>

          <div onClick={() => setSelectedType('teacher')} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer group flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <GraduationCap size={40} className="text-[#2f4fa8]" />
            </div>
            <h3 className="text-xl font-bold text-[#2f4fa8] mb-2">Teacher</h3>
            <p className="text-sm text-gray-500">Register new academic teachers</p>
          </div>

          <div onClick={() => setSelectedType('student')} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer group flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Book size={40} className="text-[#2f4fa8]" />
            </div>
            <h3 className="text-xl font-bold text-[#2f4fa8] mb-2">Student</h3>
            <p className="text-sm text-gray-500">Register new students to classes</p>
          </div>
        </div>
      </motion.div>
    );
  }

  const title = selectedType.charAt(0).toUpperCase() + selectedType.slice(1) + " Registration";
  const shouldShowTypeDropdown = selectedType === 'staff' || selectedType === 'student';
  const typeOptions = getTypeOptions();

  const getTypeLabel = () => {
    switch(selectedType) {
      case 'staff': return 'Position';
      case 'student': return 'Class';
      default: return 'Type';
    }
  };

  const getTypePlaceholder = () => {
    if (selectedType === 'student') {
      if (isClassroomsLoading) return 'Loading classrooms...';
      if (classroomsError) return classroomsError;
      if (typeOptions.length === 0) return 'No classrooms found';
    }

    return `Select ${getTypeLabel()}`;
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
          className="text-gray-500 hover:text-[#2f4fa8] transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <ChevronRight size={16} className="rotate-180" /> Back to Selection
        </button>
        <div className="h-4 w-px bg-gray-300"></div>
        <h2 className="text-2xl font-bold text-[#2f4fa8]">{title}</h2>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px] flex flex-col">
        <div className="p-8">
          <div className="mb-8">
            <h3 className="text-xl font-bold text-[#2f4fa8]">Registration Form</h3>
            <p className="text-gray-400 text-sm mt-1">Please fill in all the form</p>
          </div>

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
                      <label className="block text-sm font-bold text-gray-700">Name : <span className="text-red-500">*</span></label>
                      <input type="text" name="name" value={data.name} onChange={handleInputChange} className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">Identification number (IC) : <span className="text-red-500">*</span></label>
                      <input type="text" name="icNumber" value={data.icNumber} onChange={handleInputChange} maxLength={12} placeholder="e.g. 860102075555" className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                      <p className="text-xs text-gray-400 mt-1">12 digits without "-" or space</p>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">
                        Email Address : 
                        {(selectedType === 'teacher' || (selectedType === 'staff' && data.specificType === 'Security Staff')) && (
                          <span className="text-red-500"> *</span>
                        )}
                      </label>
                      <input type="email" name="email" value={data.email} onChange={handleInputChange} className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                      {(selectedType === 'teacher' || (selectedType === 'staff' && data.specificType === 'Security Staff')) && (
                        <p className="text-xs text-gray-400 mt-1">Required for login access</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">Phone Number : <span className="text-red-500">*</span></label>
                      <input type="text" name="phone" value={data.phone} onChange={handleInputChange} maxLength={11} placeholder="e.g. 0123456789" className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">Gender : <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <select name="gender" value={data.gender} onChange={handleInputChange} className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all appearance-none text-gray-700 cursor-pointer">
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    
                    {shouldShowTypeDropdown && (
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700">{getTypeLabel()} : <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <select name="specificType" value={data.specificType} onChange={handleInputChange} className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all appearance-none text-gray-700 cursor-pointer">
                            <option value="">{getTypePlaceholder()}</option>
                            {typeOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                          <ChevronDown size={16} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                    )}

                    {selectedType === 'teacher' && (
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700">Teacher Position : <span className="text-red-500">*</span></label>
                        <input type="text" name="position" value={data.position} onChange={handleInputChange} className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                      </div>
                    )}
                    
                    {/* SEPARATED ADDRESS FIELDS */}
                    <div className="space-y-2 md:col-span-2">
                      <label className="block text-sm font-bold text-gray-700">Street Address : <span className="text-red-500">*</span></label>
                      <input type="text" name="streetAddress" value={data.streetAddress} onChange={handleInputChange} placeholder="e.g. No. 123, Jalan ABC" className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">City : <span className="text-red-500">*</span></label>
                      <input type="text" name="city" value={data.city} onChange={handleInputChange} placeholder="e.g. Kuala Lumpur" className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">State : <span className="text-red-500">*</span></label>
                      <input type="text" name="state" value={data.state} onChange={handleInputChange} placeholder="e.g. Selangor" className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">Postcode : <span className="text-red-500">*</span></label>
                      <input type="text" name="postcode" value={data.postcode} onChange={handleInputChange} maxLength={5} placeholder="e.g. 50000" className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">Country :</label>
                      <input type="text" name="country" value={data.country} onChange={handleInputChange} className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                    </div>

                    {/* PASSWORD FIELD - Only for Teacher and Security Staff */}
                    {(selectedType === 'teacher' || (selectedType === 'staff' && data.specificType === 'Security Staff')) && (
                      <div className="space-y-2 md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700">Password : <span className="text-red-500">*</span></label>
                        <input type="password" name="password" value={data.password} onChange={handleInputChange} placeholder="Minimum 8 characters" className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                        <p className="text-xs text-gray-400 mt-1">This password will be used to log in to the system</p>
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

                  <div className="w-full h-80 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors relative group">
                    {previewUrl ? (
                      <div className="relative w-full h-full flex items-center justify-center p-4">
                        <img src={previewUrl} alt="Preview" className="max-h-full max-w-full object-contain rounded-lg shadow-sm" />
                        <button onClick={handleRemoveFile} className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"><X size={20} /></button>
                      </div>
                    ) : (
                      <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                           <Upload size={32} className="text-blue-600" />
                        </div>
                        <p className="text-gray-600 font-medium">Click to upload image</p>
                        <p className="text-xs text-gray-400 mt-2">SVG, PNG, JPG or GIF</p>
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                      </label>
                    )}
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
                        <label className="block text-sm font-bold text-gray-700">Father's/Guardian's Name : <span className="text-red-500">*</span></label>
                        <input type="text" name="fatherName" value={data.fatherName} onChange={handleInputChange} className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700">Identification Number (IC) : <span className="text-red-500">*</span></label>
                        <input type="text" name="fatherIc" value={data.fatherIc} onChange={handleInputChange} maxLength={12} className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700">Mother's Name : <span className="text-red-500">*</span></label>
                        <input type="text" name="motherName" value={data.motherName} onChange={handleInputChange} className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-gray-700">Identification Number : <span className="text-red-500">*</span></label>
                        <input type="text" name="motherIc" value={data.motherIc} onChange={handleInputChange} maxLength={12} className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
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
                      <label className="block text-sm font-bold text-gray-700">Emergency Contact Name : <span className="text-red-500">*</span></label>
                      <input type="text" name="emergencyName" value={data.emergencyName} onChange={handleInputChange} className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">Relation : <span className="text-red-500">*</span></label>
                      <input type="text" name="emergencyRelation" value={data.emergencyRelation} onChange={handleInputChange} className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">Emergency Phone Number : <span className="text-red-500">*</span></label>
                      <input type="text" name="emergencyPhone" value={data.emergencyPhone} onChange={handleInputChange} maxLength={11} className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-end gap-3 mt-16">
               {currentStep > 1 && (
                 <button onClick={() => setCurrentStep(curr => curr - 1)} disabled={isProcessing} className="px-6 py-2 rounded border border-gray-200 text-gray-500 font-medium hover:bg-gray-50 transition-colors bg-white disabled:opacity-50">
                   Previous
                 </button>
               )}
               {currentStep < steps.length ? (
                 <button onClick={() => setCurrentStep(curr => curr + 1)} className="px-8 py-2 rounded bg-[#2563EB] text-white font-medium hover:bg-blue-700 shadow-sm transition-all">
                   Next
                 </button>
               ) : (
                 <button onClick={handleSubmit} disabled={isProcessing} className="px-8 py-2 rounded bg-[#2563EB] text-white font-medium hover:bg-blue-700 shadow-sm transition-all disabled:opacity-50">
                   {isProcessing ? 'Submitting...' : 'Submit'}
                 </button>
               )}
            </div>
          </div>
        </div>
      </div>
      
      {/* ERROR MODAL */}
      <AnimatePresence>
        {errorModalMsg && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-8 text-center"
            >
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={40} className="text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Wait a moment</h3>
              <p className="text-gray-500 mb-8">{errorModalMsg}</p>
              
              <button 
                onClick={() => setErrorModalMsg(null)}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-red-500/20 transition-all transform hover:-translate-y-1 active:translate-y-0"
              >
                Go Back & Fix
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SUCCESS MODAL */}
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
              <h3 className="text-2xl font-bold text-[#2f4fa8] mb-2">Success!</h3>
              <p className="text-gray-500 mb-8">
                New <span className="font-bold text-gray-700 capitalize">{selectedType}</span> has been successfully registered.
              </p>
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
