import React, { useState } from 'react';
import { Home, Lock, Save, Eye, EyeOff, Key } from 'lucide-react';
import { motion } from 'motion/react';
import DashboardLayout from '@/Layouts/DashboardLayout';

export default function AdminPassword() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <DashboardLayout activePageId="change-password">
      <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-full mx-auto"
    >
      {/* Header Section */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-[#1c3068] tracking-tight">Password Setting</h2>
          <p className="text-gray-500 text-sm mt-1">Update your account security credentials.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 text-gray-500">
           <Home size={14} />
           <span>Dashboard</span>
           <span className="text-gray-300">/</span>
           <span className="text-[#c53336]">Password Setting</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Info Card */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-[#1c3068] rounded-2xl p-8 text-white relative overflow-hidden shadow-lg shadow-[#1c3068]/20">
              <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 p-20 bg-[#c53336]/20 rounded-full blur-2xl -ml-10 -mb-10"></div>
              
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6 backdrop-blur-sm">
                   <Lock className="text-white" size={24} />
                </div>
                <h3 className="text-xl font-bold mb-2">Secure Your Account</h3>
                <p className="text-blue-100 text-sm leading-relaxed mb-6">
                  To ensure your account remains safe, please choose a strong password that you haven't used before.
                </p>
                <div className="space-y-3">
                   <div className="flex items-center gap-3 text-sm text-blue-100">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#c53336]"></div>
                      <span>Min. 8 characters long</span>
                   </div>
                   <div className="flex items-center gap-3 text-sm text-blue-100">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#c53336]"></div>
                      <span>One uppercase letter</span>
                   </div>
                   <div className="flex items-center gap-3 text-sm text-blue-100">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#c53336]"></div>
                      <span>One number or symbol</span>
                   </div>
                </div>
              </div>
           </div>
        </div>

        {/* Right Column - Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-50 rounded-lg text-[#1c3068]">
                   <Key size={20} />
                </div>
                <div>
                   <h3 className="text-lg font-bold text-[#1c3068]">Change Password</h3>
                   <p className="text-gray-500 text-xs">Please fill in your new password below</p>
                </div>
              </div>

              <form className="space-y-6 max-w-xl">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-[#1c3068]">New Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      className="w-full pl-4 pr-12 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-gray-700 font-medium"
                      placeholder="Enter new password"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1c3068] transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-[#1c3068]">Confirm Password</label>
                  <div className="relative">
                    <input 
                      type={showConfirmPassword ? "text" : "password"} 
                      className="w-full pl-4 pr-12 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-gray-700 font-medium"
                      placeholder="Confirm new password"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1c3068] transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <button type="button" className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                  <button type="button" className="flex items-center gap-2 bg-[#1c3068] hover:bg-[#152450] text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-[#1c3068]/20 transition-all transform hover:-translate-y-1">
                    <Save size={18} /> Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      </motion.div>
    </DashboardLayout>
  );
}
