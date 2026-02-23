import React, { useState } from 'react';
import { 
  User, 
  Phone, 
  Home, 
  Image as ImageIcon, 
  Settings, 
  Camera, 
  Save, 
  MapPin, 
  Mail,
  Check,
  Calendar,
  Shield,
  Briefcase,
  Globe
} from 'lucide-react';
import { motion } from 'motion/react';
import DashboardLayout from '@/Layouts/DashboardLayout';

export default function AdminProfile() {
  const [activeTab, setActiveTab] = useState<'profile' | 'e-contact' | 'address' | 'picture' | 'settings'>('profile');

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
                    <div className="w-full h-full rounded-full bg-[#f0f2f5] flex items-center justify-center overflow-hidden border border-gray-100">
                      {/* Placeholder for Profile Image */}
                      <span className="text-4xl font-black text-[#1c3068]">A</span>
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
                
                <h3 className="text-2xl font-bold text-[#1c3068]">Admin User</h3>
                <span className="bg-blue-50 text-[#1c3068] px-3 py-1 rounded-full text-xs font-bold mt-2 uppercase tracking-wide border border-blue-100">
                  Administrator
                </span>

                <div className="w-full mt-8 space-y-4">
                  <div className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-[#1c3068] shadow-sm">
                      <Mail size={18} />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs text-gray-500 font-bold uppercase">Email</p>
                      <p className="text-sm font-medium text-gray-900 truncate">admin@skpulauserai.edu.my</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-[#1c3068] shadow-sm">
                      <Phone size={18} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase">Phone</p>
                      <p className="text-sm font-medium text-gray-900">017-406 8317</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors border border-gray-100">
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-[#1c3068] shadow-sm">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-bold uppercase">ADDRESS</p>
                      <p className="text-sm font-medium text-gray-900">Kerteh, Terengganu</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 pt-6 w-full border-t border-gray-100">
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
                </div>
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
                      <p className="text-lg font-bold text-[#1c3068] pl-8">Admin User</p>
                    </div>

                    <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-3 mb-3">
                        <Briefcase className="text-[#c53336]" size={20} />
                        <span className="text-sm font-bold text-gray-500 uppercase">Role / Position</span>
                      </div>
                      <p className="text-lg font-bold text-[#1c3068] pl-8">Administrator</p>
                    </div>

                    <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-3 mb-3">
                        <Calendar className="text-[#c53336]" size={20} />
                        <span className="text-sm font-bold text-gray-500 uppercase">Join Date</span>
                      </div>
                      <p className="text-lg font-bold text-[#1c3068] pl-8">01 Jan 2026</p>
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
                      "Dedicated administrator focused on maintaining efficient school operations and ensuring a smooth experience for staff, teachers, and students using the I-HADIR system."
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
                         <input type="text" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-gray-700 font-medium" placeholder="e.g. Spouse, Parent" />
                      </div>
                      
                      <div className="space-y-2">
                         <label className="block text-sm font-bold text-[#1c3068]">Relationship</label>
                         <select className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-gray-700">
                           <option>Parent</option>
                           <option>Spouse</option>
                           <option>Sibling</option>
                           <option>Friend</option>
                           <option>Other</option>
                         </select>
                      </div>

                      <div className="space-y-2">
                         <label className="block text-sm font-bold text-[#1c3068]">Phone Number</label>
                         <input type="tel" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-gray-700 font-medium" placeholder="01X-XXXXXXX" />
                      </div>
                    </div>
                    
                    <div className="pt-6 flex justify-end">
                      <button type="button" className="flex items-center gap-2 bg-[#1c3068] hover:bg-[#152450] text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-[#1c3068]/20 transition-all transform hover:-translate-y-1">
                        <Save size={18} /> Save Changes
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
                      <input type="text" defaultValue="SMK Rantau Petronas" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-gray-700" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-[#1c3068]">City</label>
                        <input type="text" defaultValue="Kerteh" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-gray-700" />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-[#1c3068]">State</label>
                        <div className="relative">
                          <select className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-gray-700 appearance-none">
                            <option>Terengganu</option>
                            <option>Selangor</option>
                            <option>Kuala Lumpur</option>
                            <option>Johor</option>
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
                        <input type="text" defaultValue="10000" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-gray-700 font-mono" />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-[#1c3068]">Country</label>
                        <input type="text" defaultValue="Malaysia" disabled className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-gray-200 text-gray-500 cursor-not-allowed" />
                      </div>
                    </div>

                    <div className="pt-6 flex justify-end">
                      <button type="button" className="flex items-center gap-2 bg-[#1c3068] hover:bg-[#152450] text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-[#1c3068]/20 transition-all transform hover:-translate-y-1">
                        <Save size={18} /> Update Address
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

                   <div className="w-64 h-64 rounded-full bg-gray-50 flex flex-col items-center justify-center border-4 border-dashed border-gray-300 relative group cursor-pointer hover:border-[#c53336] hover:bg-red-50/10 transition-all duration-300">
                      <div className="flex flex-col items-center gap-4 text-gray-400 group-hover:text-[#c53336] transition-colors">
                        <div className="p-4 rounded-full bg-white shadow-sm group-hover:shadow-md transition-shadow">
                           <Camera size={48} strokeWidth={1.5} />
                        </div>
                        <span className="text-sm font-bold uppercase tracking-wider">Click to Upload</span>
                      </div>
                      <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                   </div>

                   <div className="mt-8 flex gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1"><Check size={14} className="text-green-500" /> JPG, PNG or GIF</span>
                      <span className="flex items-center gap-1"><Check size={14} className="text-green-500" /> Max 2MB</span>
                   </div>
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
                        <input type="text" defaultValue="Admin" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-gray-700" />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-[#1c3068]">Last Name</label>
                        <input type="text" defaultValue="User" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-gray-700" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-[#1c3068]">Identification No.</label>
                      <input type="text" defaultValue="admin12345" className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-gray-200 text-gray-500 cursor-not-allowed font-mono" disabled />
                      <p className="text-xs text-gray-400 flex items-center gap-1"><Shield size={10} /> Identification number cannot be changed</p>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-[#1c3068]">Email Address</label>
                      <input type="email" defaultValue="admin@skpulauserai.edu.my" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-gray-700" />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-[#1c3068]">Phone Number</label>
                      <input type="tel" defaultValue="017-406 8317" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-gray-700" />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-[#1c3068]">Bio</label>
                      <textarea 
                        rows={4} 
                        defaultValue="Dedicated administrator focused on maintaining efficient school operations and ensuring a smooth experience for staff, teachers, and students using the I-HADIR system."
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-gray-700 leading-relaxed resize-none"
                        placeholder="Tell us a little about yourself..."
                      ></textarea>
                      <p className="text-xs text-gray-400 text-right">0 / 500 characters</p>
                    </div>

                    <div className="pt-6 flex justify-end">
                      <button type="button" className="flex items-center gap-2 bg-[#1c3068] hover:bg-[#152450] text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-[#1c3068]/20 transition-all transform hover:-translate-y-1">
                        <Save size={18} /> Update Profile
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
      </motion.div>
    </DashboardLayout>
  );
}
