import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Camera, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onSuccess: () => void;
}

export const EditUserModal = ({ isOpen, onClose, user, onSuccess }: EditUserModalProps) => {

  console.log(user);

  const [formData, setFormData] = useState<any>({
    gender: '',
    email: '',
    phone: '',
    streetAddress: '',
    emergencyName: '',
    emergencyRelation: '',
    emergencyPhone: '',
    fatherPhone: '',
    motherPhone: '',
    position: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  

  // Initialize form data when user prop changes
  useEffect(() => {
    if (user && user.raw_data) {
      const raw = user.raw_data;
      setFormData({
        gender: raw.gender || '',
        email: raw.email || '',
        phone: raw.phone_num || raw.phone_number || '',
        streetAddress: raw.street_address || '',
        emergencyName: raw.emergency_contact_name || '',
        emergencyRelation: raw.emergency_relationship || '',
        emergencyPhone: raw.emergency_phone_num || '',
        
        // Student Specific
        fatherPhone: raw.father_phone_num || '',
        motherPhone: raw.mother_phone_num || '',
        
        // Teacher/Staff Specific
        position: user.role || raw.position || '',
        
        // Password fields (always empty for security)
        newPassword: '',
        confirmPassword: '',
      });

      if (raw.profile_pic_path) {
        setPreviewUrl(`/storage/${raw.profile_pic_path}`);
      } else {
        setPreviewUrl(null);
      }
      setProfilePic(null);
      setErrorMsg(null);
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Restrict specific fields to numbers only
    const numberOnlyFields = ['phone', 'emergencyPhone', 'fatherPhone', 'motherPhone'];
    if (numberOnlyFields.includes(name)) {
      const onlyNums = value.replace(/\D/g, '');
      setFormData((prev: any) => ({ ...prev, [name]: onlyNums }));
      return;
    }

    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePic(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    // Check if this user requires a password (teacher or Security Staff)
    const requiresPassword = user.type === 'teacher' || (user.type === 'staff' && formData.position === 'Security Staff');
    
    // Check if user currently has a password in database
    const hasExistingPassword = user.has_password === true;


    // If user requires password but doesn't have one, they MUST set a new password
    if (requiresPassword && !hasExistingPassword && !formData.newPassword) {
      setErrorMsg("This user requires a password to log in. Please set a password before saving.");
      setIsSubmitting(false);
      return;
    }

    // Validate password fields if provided
    if (formData.newPassword || formData.confirmPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        setErrorMsg("Passwords do not match. Please ensure both password fields are identical.");
        setIsSubmitting(false);
        return;
      }
      
      if (formData.newPassword.length < 8) {
        setErrorMsg("Password must be at least 8 characters long.");
        setIsSubmitting(false);
        return;
      }
    }

    const submitData = new FormData();
    submitData.append('_method', 'PUT'); // Laravel requires this for multipart/form-data PUT requests
    submitData.append('type', user.type);
    
    // Append standard fields
    Object.keys(formData).forEach(key => {
      // Skip confirmPassword from being sent to backend
      if (key === 'confirmPassword') return;
      
      if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
        submitData.append(key, formData[key]);
      }
    });

    if (profilePic) {
      submitData.append('profilePic', profilePic);
    }

    try {
      const response = await axios.post(`/api/users/${user.id}`, submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setShowSuccessModal(true);
      }
    } catch (error: any) {
      console.error("Update failed:", error);
      setErrorMsg(error.response?.data?.message || "Failed to update user. Please check your inputs.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    onSuccess(); // Tell the parent component to refresh the data and close the Edit modal
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden relative flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 sticky top-0 z-20">
            <div>
              <h2 className="text-xl font-bold text-[#1c3068]">Edit {user.type.charAt(0).toUpperCase() + user.type.slice(1)}</h2>
              <p className="text-sm text-gray-500 font-medium">{user.name} ({user.ic_number})</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto">
            {errorMsg && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 text-sm">
                <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                <p>{errorMsg}</p>
              </div>
            )}

            <form id="editUserForm" onSubmit={handleSubmit} className="space-y-8">
              
              {/* Picture Upload */}
              <div className="flex flex-col items-center justify-center">
                <label className="w-32 h-32 rounded-full bg-gray-50 border-4 border-dashed border-gray-300 relative group cursor-pointer hover:border-blue-400 overflow-hidden transition-all">
                    {previewUrl ? (
                      <>
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                          <Camera size={24} className="mb-1" />
                          <span className="text-xs font-bold">Change</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400 group-hover:text-blue-500 transition-colors">
                        <Camera size={32} />
                        <span className="text-xs font-bold mt-2">Upload</span>
                      </div>
                    )}
                    <input type="file" onChange={handleFileChange} className="hidden" accept="image/*" />
                </label>
              </div>

              {/* General Info (Applies to all) */}
              <div>
                <h3 className="text-sm font-bold text-[#1c3068] uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">General Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600">Gender</label>
                    <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:border-blue-500 focus:bg-white outline-none text-sm transition-all">
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600">Phone Number</label>
                    <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} maxLength={11} className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:border-blue-500 focus:bg-white outline-none text-sm transition-all font-mono" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600">Email Address</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:border-blue-500 focus:bg-white outline-none text-sm transition-all" />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-bold text-gray-600">Address</label>
                    <input type="text" name="streetAddress" value={formData.streetAddress} onChange={handleInputChange} className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:border-blue-500 focus:bg-white outline-none text-sm transition-all" />
                  </div>

                  {/* Role/Position (Only for Teacher and Staff) */}
                  {user.type === 'teacher' && (
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-bold text-gray-600">Teacher Position</label>
                      <input type="text" name="position" value={formData.position} onChange={handleInputChange} className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:border-blue-500 focus:bg-white outline-none text-sm transition-all" placeholder="e.g. Guru Biasa, PK HEM" />
                      <p className="text-[10px] text-gray-400 mt-1">Updates their role for the currently active session.</p>
                    </div>
                  )}

                  {user.type === 'staff' && (
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-bold text-gray-600">Staff Position</label>
                      <select name="position" value={formData.position} onChange={handleInputChange} className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:border-blue-500 focus:bg-white outline-none text-sm transition-all">
                        <option value="Store Staff">Store Staff</option>
                        <option value="Cleaning Staff">Cleaning Staff</option>
                        <option value="Security Staff">Security Staff</option>
                        <option value="Temporary Staff">Temporary Staff</option>
                      </select>
                      <p className="text-[10px] text-gray-400 mt-1">Updates their role for the currently active session.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Password Section (For Teachers and Security Staff) */}
              {(user.type === 'teacher' || (user.type === 'staff' && formData.position === 'Security Staff')) && (
                <div>
                  <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">Login Password</h3>
                  {(() => {
                    const hasExistingPassword = user.has_password === true;
                    return (
                      <>
                        {hasExistingPassword ? (
                          <p className="text-xs text-gray-500 mb-4">Leave empty to keep the current password. Only fill if you want to change it.</p>
                        ) : (
                          <p className="text-xs text-red-600 mb-4 font-semibold">⚠️ This user does not have a password set. You must set a password to allow login access.</p>
                        )}
                      </>
                    );
                  })()}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">
                        New Password
                        {(() => {
                          const hasExistingPassword = user.has_password === true;
                          return !hasExistingPassword ? <span className="text-red-500"> *</span> : null;
                        })()}
                      </label>
                      <input 
                        type="password" 
                        name="newPassword" 
                        value={formData.newPassword} 
                        onChange={handleInputChange} 
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:border-blue-500 focus:bg-white outline-none text-sm transition-all" 
                        placeholder="Minimum 8 characters"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">
                        Confirm New Password
                        {(() => {
                          const hasExistingPassword = user.raw_data?.password !== null && user.raw_data?.password !== undefined && user.raw_data?.password !== '';
                          return !hasExistingPassword ? <span className="text-red-500"> *</span> : null;
                        })()}
                      </label>
                      <input 
                        type="password" 
                        name="confirmPassword" 
                        value={formData.confirmPassword} 
                        onChange={handleInputChange} 
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:border-blue-500 focus:bg-white outline-none text-sm transition-all" 
                        placeholder="Re-type password"
                      />
                    </div>
                  </div>
                  {user.type === 'staff' && formData.position === 'Security Staff' && (
                    <p className="text-[10px] text-amber-600 mt-2 flex items-start gap-1">
                      <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
                      <span>Security Staff requires a password to log in. If this user doesn't have one yet, please set it now.</span>
                    </p>
                  )}
                </div>
              )}

              {/* Parent Info (Only for Students) */}
              {user.type === 'student' && (
                <div>
                  <h3 className="text-sm font-bold text-[#1c3068] uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">Parent Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">Father's Phone No</label>
                      <input type="text" name="fatherPhone" value={formData.fatherPhone} onChange={handleInputChange} maxLength={11} className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:border-blue-500 focus:bg-white outline-none text-sm transition-all font-mono" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-600">Mother's Phone No</label>
                      <input type="text" name="motherPhone" value={formData.motherPhone} onChange={handleInputChange} maxLength={11} className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:border-blue-500 focus:bg-white outline-none text-sm transition-all font-mono" />
                    </div>
                  </div>
                </div>
              )}

              {/* Emergency Contact (Applies to all) */}
              <div>
                <h3 className="text-sm font-bold text-red-600 uppercase tracking-wider mb-4 pb-2 border-b border-gray-100">Emergency Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600">Contact Name</label>
                    <input type="text" name="emergencyName" value={formData.emergencyName} onChange={handleInputChange} className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:border-blue-500 focus:bg-white outline-none text-sm transition-all" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600">Relation</label>
                    <input type="text" name="emergencyRelation" value={formData.emergencyRelation} onChange={handleInputChange} className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:border-blue-500 focus:bg-white outline-none text-sm transition-all" />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-bold text-gray-600">Emergency Phone No</label>
                    <input type="text" name="emergencyPhone" value={formData.emergencyPhone} onChange={handleInputChange} maxLength={11} className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:border-blue-500 focus:bg-white outline-none text-sm transition-all font-mono" />
                  </div>
                </div>
              </div>

            </form>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 mt-auto sticky bottom-0 z-20">
            <button 
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 transition-colors text-sm"
            >
              Cancel
            </button>
            <button 
              type="submit"
              form="editUserForm"
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-[#1c3068] hover:bg-[#152450] text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-[#1c3068]/20 transition-all disabled:opacity-70 text-sm"
            >
              <Save size={16} /> {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </motion.div>
      </div>
    
    {/* ERROR MODAL */}
      <AnimatePresence>
        {errorMsg && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
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
              <p className="text-gray-500 mb-8">{errorMsg}</p>
              
              <button 
                onClick={() => setErrorMsg(null)}
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
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
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
                <span className="font-bold text-gray-700 capitalize">{user.type}</span> details have been successfully updated.
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
    </>
    
    

    
  );
};