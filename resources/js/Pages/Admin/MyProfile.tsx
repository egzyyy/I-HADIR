import React, { useState, useEffect } from 'react';
import { 
  User, Phone, Home, Image as ImageIcon, Settings, Camera, Save, MapPin, 
  Mail, Check, Calendar, Shield, Briefcase, Globe, X, CheckCircle, AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from '../../Layouts/DashboardLayout';
import axios from 'axios';

// Ensure Axios acts as an XHR request for Laravel
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

export default function MyProfile() {
  const [activeTab, setActiveTab] = useState<'profile' | 'e-contact' | 'address' | 'picture' | 'settings'>('profile');
  const [adminData, setAdminData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Modal States
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errorModalMsg, setErrorModalMsg] = useState<string | null>(null);

  // File Upload State
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Controlled Form State
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_num: '',
    bio_desc: '',
    address: '',
    city: '',
    state: 'Terengganu',
    postcode: '',
    emergency_contact_name: '',
    emergency_relationship: 'Parent',
    emergency_phone_num: ''
  });

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const response = await axios.get('/api/profile');
        if (response.data.success) {
          const data = response.data.data;
          setAdminData(data);
          
          // Pre-fill the form with database data
          setFormData({
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            email: data.email || '',
            phone_num: data.phone_num || '',
            bio_desc: data.bio_desc || '',
            address: data.street_address || '',
            city: data.city || '',
            state: data.state || 'Terengganu',
            postcode: data.postcode || '',
            emergency_contact_name: data.emergency_contact_name || '',
            emergency_relationship: data.emergency_relationship || 'Parent',
            emergency_phone_num: data.emergency_phone_num || ''
          });

          // Set existing profile picture
          if (data.profile_pic_path) {
            setPreviewUrl(`/storage/${data.profile_pic_path}`);
          }
        }
      } catch (error) {
        console.error("Failed to fetch admin profile", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  // Handle Input Changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePic(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Handle Save (Used for all tabs)
  const handleSave = async () => {
    setIsSaving(true);
    
    // We MUST use FormData to send files
    const submitData = new FormData();
    
    // Append all text fields
    Object.keys(formData).forEach((key) => {
      const value = formData[key as keyof typeof formData];
      submitData.append(key, value || '');
    });

    // Append file if a new one was selected
    if (profilePic) {
      submitData.append('profile_pic', profilePic);
    }

    try {
      const response = await axios.post('/api/profile', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setAdminData(response.data.data); // Update UI with fresh saved data
        setProfilePic(null); // Clear pending file upload since it's now saved
        setShowSuccessModal(true); // Show custom success modal
      }
    } catch (error: any) {
      console.error("Failed to save profile", error);
      setErrorModalMsg(error.response?.data?.message || 'Failed to update profile. Please check your inputs.'); // Show custom error modal
    } finally {
      setIsSaving(false);
    }
  };

  // Tab Button Component
  const TabButton = ({ id, icon: Icon, label }: { id: typeof activeTab, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`relative flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all duration-300 ${
        activeTab === id 
          ? 'text-[#1c3068]' 
          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
      }`}
    >
      <Icon size={18} className={activeTab === id ? 'text-[#c53336]' : 'text-gray-400'} />
      {label}
      {activeTab === id && (
        <motion.div 
          layoutId="activeTab"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#c53336]"
        />
      )}
    </button>
  );

  if (isLoading) {
    return (
      <DashboardLayout activePageId="my-profile">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-[#1c3068] font-bold animate-pulse">Loading profile...</div>
        </div>
      </DashboardLayout>
    );
  }

  // Smart Fallbacks for Header Display
  const getFullName = () => {
    if (adminData?.first_name || adminData?.last_name) {
      return `${adminData.first_name || ''} ${adminData.last_name || ''}`.trim();
    }
    return adminData?.name || 'Admin User'; 
  };

  const fullName = getFullName();
  const initial = adminData?.first_name ? adminData.first_name.charAt(0).toUpperCase() : (adminData?.name ? adminData.name.charAt(0).toUpperCase() : 'A');
  const joinDate = adminData?.created_at ? new Date(adminData.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

  return (
    <DashboardLayout activePageId="my-profile">
      <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-full mx-auto"
    >
      {/* Header Section with Breadcrumbs */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-[#1c3068] tracking-tight">My Profile</h2>
          <p className="text-gray-500 text-sm mt-1">Manage your personal information and account settings.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 text-gray-500">
           <Home size={14} />
           <span>Dashboard</span>
           <span className="text-gray-300">/</span>
           <span className="text-[#c53336]">Profile</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* Left Column - Profile Card */}
        <div className="xl:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative group">
             {/* Decorative Background */}
             <div className="h-32 bg-gradient-to-r from-[#1c3068] to-[#2a4595] relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 pattern-dots"></div>
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
             </div>

             <div className="px-8 pb-8 flex flex-col items-center -mt-12 relative z-10">
                <div className="relative mb-4">
                  <div className="w-28 h-28 rounded-full bg-white p-1.5 shadow-xl">
                    <div className="w-full h-full rounded-full bg-[#f0f2f5] flex items-center justify-center overflow-hidden border border-gray-100 relative">
                      {previewUrl ? (
                        <img src={previewUrl} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-4xl font-black text-[#1c3068]">{initial}</span>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => setActiveTab('picture')}
                    className="absolute bottom-1 right-1 bg-[#c53336] text-white p-2 rounded-full shadow-lg border-2 border-white hover:bg-[#a02224] transition-colors cursor-pointer"
                    title="Change Profile Picture"
                  >
                    <Camera size={14} />
                  </button>
                </div>
                
                <h3 className="text-2xl font-bold text-[#1c3068]">{fullName}</h3>
                <span className="bg-blue-50 text-[#1c3068] px-3 py-1 rounded-full text-xs font-bold mt-2 uppercase tracking-wide border border-blue-100">
                  {adminData?.position || 'Administrator'}
                </span>

                <div className="w-full mt-8 space-y-4">
                  <div className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-[#1c3068] shadow-sm">
                      <Mail size={18} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs text-gray-500 font-bold uppercase">Email</p>
                      <p className="text-sm font-medium text-gray-900 truncate">{adminData?.email || '-'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-[#1c3068] shadow-sm">
                      <Phone size={18} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase">Phone</p>
                      <p className="text-sm font-medium text-gray-900">{adminData?.phone_num || '-'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-[#1c3068] shadow-sm">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase">ADDRESS</p>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {[adminData?.city, adminData?.state].filter(Boolean).join(', ') || '-'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* <div className="mt-8 pt-6 w-full border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-4 text-center">
                     <div>
                       <p className="text-2xl font-black text-[#1c3068]">245</p>
                       <p className="text-xs text-gray-400 font-bold uppercase">Days Present</p>
                     </div>
                     <div>
                       <p className="text-2xl font-black text-[#1c3068]">100%</p>
                       <p className="text-xs text-gray-400 font-bold uppercase">Attendance</p>
                     </div>
                  </div>
                </div> */}
             </div>
          </div>
        </div>

        {/* Right Column - Tabs & Content */}
        <div className="xl:col-span-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px] flex flex-col">
            {/* Tabs Header */}
            <div className="flex border-b border-gray-100 overflow-x-auto no-scrollbar">
              <TabButton id="profile" icon={User} label="Overview" />
              <TabButton id="e-contact" icon={Shield} label="Emergency" />
              <TabButton id="address" icon={Home} label="Address" />
              <TabButton id="picture" icon={ImageIcon} label="Picture" />
              <TabButton id="settings" icon={Settings} label="Settings" />
            </div>

            {/* Tab Content */}
            <div className="p-8 md:p-10 flex-1">
              
              {/* PROFILE TAB */}
              {activeTab === 'profile' && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-[#1c3068]">Personal Information</h3>
                    <button className="text-sm text-[#c53336] font-bold hover:underline" onClick={() => setActiveTab('settings')}>
                      Edit Info
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-3 mb-3">
                        <User className="text-[#c53336]" size={20} />
                        <span className="text-sm font-bold text-gray-500 uppercase">Full Name</span>
                      </div>
                      <p className="text-lg font-bold text-[#1c3068] pl-8">{fullName}</p>
                    </div>

                    <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-3 mb-3">
                        <Briefcase className="text-[#c53336]" size={20} />
                        <span className="text-sm font-bold text-gray-500 uppercase">Role / Position</span>
                      </div>
                      <p className="text-lg font-bold text-[#1c3068] pl-8">{adminData?.position || 'Administrator'}</p>
                    </div>

                    <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-3 mb-3">
                        <Calendar className="text-[#c53336]" size={20} />
                        <span className="text-sm font-bold text-gray-500 uppercase">Join Date</span>
                      </div>
                      <p className="text-lg font-bold text-[#1c3068] pl-8">{joinDate}</p>
                    </div>

                    <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-3 mb-3">
                        <Globe className="text-[#c53336]" size={20} />
                        <span className="text-sm font-bold text-gray-500 uppercase">Language</span>
                      </div>
                      <p className="text-lg font-bold text-[#1c3068] pl-8">English (US)</p>
                    </div>
                  </div>

                  <div className="mt-8">
                    <h3 className="text-xl font-bold text-[#1c3068] mb-6">Bio</h3>
                    <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 text-gray-600 leading-relaxed italic">
                      "{adminData?.bio_desc || 'No bio provided. Go to Settings to add one!'}"
                    </div>
                  </div>
                </motion.div>
              )}

              {/* E-CONTACT TAB */}
              {activeTab === 'e-contact' && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-[#1c3068]">Emergency Contact</h3>
                    <p className="text-gray-500 text-sm mt-1">Who should we contact in case of emergency?</p>
                  </div>

                  <form className="max-w-2xl space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2 col-span-2">
                         <label className="block text-sm font-bold text-[#1c3068]">Contact Name</label>
                         <input type="text" name="emergency_contact_name" value={formData.emergency_contact_name} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-gray-700 font-medium" placeholder="e.g. Spouse, Parent" />
                      </div>
                      
                      <div className="space-y-2">
                         <label className="block text-sm font-bold text-[#1c3068]">Relationship</label>
                         <select name="emergency_relationship" value={formData.emergency_relationship} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-gray-700">
                           <option value="Parent">Parent</option>
                           <option value="Spouse">Spouse</option>
                           <option value="Sibling">Sibling</option>
                           <option value="Friend">Friend</option>
                           <option value="Other">Other</option>
                         </select>
                      </div>

                      <div className="space-y-2">
                         <label className="block text-sm font-bold text-[#1c3068]">Phone Number</label>
                         <input type="tel" name="emergency_phone_num" value={formData.emergency_phone_num} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-gray-700 font-medium" placeholder="01X-XXXXXXX" />
                      </div>
                    </div>
                    
                    <div className="pt-6 flex justify-end">
                      <button type="button" onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 bg-[#1c3068] hover:bg-[#152450] text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-[#1c3068]/20 transition-all transform hover:-translate-y-1 disabled:opacity-70 disabled:hover:translate-y-0">
                        <Save size={18} /> {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* ADDRESS TAB */}
              {activeTab === 'address' && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-[#1c3068]">Residential Address</h3>
                    <p className="text-gray-500 text-sm mt-1">Your permanent residential address.</p>
                  </div>

                  <form className="space-y-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-[#1c3068]">Street Address</label>
                      <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="House number and street" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-gray-700" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-[#1c3068]">City</label>
                        <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-gray-700" />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-[#1c3068]">State</label>
                        <div className="relative">
                          <select name="state" value={formData.state} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-gray-700 appearance-none">
                            <option value="Terengganu">Terengganu</option>
                            <option value="Selangor">Selangor</option>
                            <option value="W.P Kuala Lumpur">W.P Kuala Lumpur</option>
                            <option value="W.P Putrajaya">W.P Putrajaya</option>
                            <option value="W.P Labuan">W.P Labuan</option>
                            <option value="Sarawak">Sarawak</option>
                            <option value="Sabah">Sabah</option>
                            <option value="Johor">Johor</option>
                            <option value="Pahang">Pahang</option>
                            <option value="Melaka">Melaka</option>
                            <option value="Kedah">Kedah</option>
                            <option value="Perak">Perak</option>
                            <option value="Penang">Penang</option>
                            <option value="Perlis">Perlis</option>
                            <option value="Negeri Sembilan">Negeri Sembilan</option>
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                             <MapPin size={16} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                        <label className="block text-sm font-bold text-[#1c3068]">Postcode</label>
                        <input type="text" name="postcode" value={formData.postcode} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-gray-700 font-mono" />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-[#1c3068]">Country</label>
                        <input type="text" value="Malaysia" disabled className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-gray-200 text-gray-500 cursor-not-allowed" />
                      </div>
                    </div>

                    <div className="pt-6 flex justify-end">
                      <button type="button" onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 bg-[#1c3068] hover:bg-[#152450] text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-[#1c3068]/20 transition-all transform hover:-translate-y-1 disabled:opacity-70 disabled:hover:translate-y-0">
                        <Save size={18} /> {isSaving ? 'Saving...' : 'Update Address'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* PROFILE PICTURE TAB */}
              {activeTab === 'picture' && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="h-full flex flex-col items-center justify-center py-8">
                   <div className="text-center mb-8">
                      <h3 className="text-xl font-bold text-[#1c3068]">Profile Picture</h3>
                      <p className="text-gray-500 text-sm mt-1">Upload a new photo to update your profile.</p>
                   </div>

                   <label className="w-64 h-64 rounded-full bg-gray-50 flex flex-col items-center justify-center border-4 border-dashed border-gray-300 relative group cursor-pointer hover:border-[#c53336] hover:bg-red-50/10 transition-all duration-300 overflow-hidden">
                      {previewUrl ? (
                        <div className="w-full h-full relative">
                          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                            <Camera size={32} className="mb-2" />
                            <span className="text-sm font-bold">Change Image</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-4 text-gray-400 group-hover:text-[#c53336] transition-colors">
                          <div className="p-4 rounded-full bg-white shadow-sm group-hover:shadow-md transition-shadow">
                             <Camera size={48} strokeWidth={1.5} />
                          </div>
                          <span className="text-sm font-bold uppercase tracking-wider">Click to Upload</span>
                        </div>
                      )}
                      
                      <input type="file" onChange={handleFileChange} className="hidden" accept="image/*" />
                   </label>

                   <div className="mt-8 flex gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1"><Check size={14} className="text-green-500" /> JPG, PNG or GIF</span>
                      <span className="flex items-center gap-1"><Check size={14} className="text-green-500" /> Max 2MB</span>
                   </div>

                   {/* Show Save Button when a new image is selected */}
                   {profilePic && (
                     <div className="mt-8">
                        <button type="button" onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 bg-[#c53336] hover:bg-[#a02224] text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-red-900/20 transition-all transform hover:-translate-y-1 disabled:opacity-70 disabled:hover:translate-y-0">
                          <Save size={18} /> {isSaving ? 'Uploading...' : 'Save Picture'}
                        </button>
                     </div>
                   )}
                </motion.div>
              )}

              {/* SETTINGS TAB */}
              {activeTab === 'settings' && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-[#1c3068]">Account Settings</h3>
                    <p className="text-gray-500 text-sm mt-1">Update your basic account details.</p>
                  </div>

                  <form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-[#1c3068]">First Name</label>
                        <input type="text" name="first_name" value={formData.first_name} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-gray-700" />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-[#1c3068]">Last Name</label>
                        <input type="text" name="last_name" value={formData.last_name} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-gray-700" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-[#1c3068]">Identification No.</label>
                      <input type="text" value={adminData?.ic_number || '-'} className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-gray-200 text-gray-500 cursor-not-allowed font-mono" disabled />
                      <p className="text-xs text-gray-400 flex items-center gap-1"><Shield size={10} /> Identification number cannot be changed</p>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-[#1c3068]">Email Address</label>
                      <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-gray-700" />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-[#1c3068]">Phone Number</label>
                      <input type="tel" name="phone_num" value={formData.phone_num} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-gray-700" />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-[#1c3068]">Bio</label>
                      <textarea 
                        rows={4} 
                        name="bio_desc"
                        value={formData.bio_desc}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-gray-700 leading-relaxed resize-none"
                        placeholder="Tell us a little about yourself..."
                      ></textarea>
                    </div>

                    <div className="pt-6 flex justify-end">
                      <button type="button" onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 bg-[#1c3068] hover:bg-[#152450] text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-[#1c3068]/20 transition-all transform hover:-translate-y-1 disabled:opacity-70 disabled:hover:translate-y-0">
                        <Save size={18} /> {isSaving ? 'Saving...' : 'Update Profile'}
                      </button>
                    </div>
                  </form>
                </motion.div>
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
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Update Failed</h3>
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
              <h3 className="text-2xl font-bold text-[#1c3068] mb-2">Success!</h3>
              <p className="text-gray-500 mb-8">Your profile has been successfully updated.</p>
              <button 
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-[#10b981] hover:bg-[#059669] text-white py-3 rounded-xl font-bold shadow-lg shadow-green-500/20 transition-all transform hover:-translate-y-1 active:translate-y-0"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      </motion.div>
    </DashboardLayout>
  );
}