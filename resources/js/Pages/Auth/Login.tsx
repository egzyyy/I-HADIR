import React, { useState } from 'react';
import { Mail, Lock, ArrowLeft, LogIn, KeyRound, Shield, EyeOff, Eye } from 'lucide-react';
import forgotPasswordHeader from '../assets/2af3b918b05695c088545926d4ebd660ecb51845.png';
import { Link, useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [view, setView] = useState<'login' | 'forgot-password'>('login');

  if (view === 'forgot-password') {
    return (
      <div className="min-h-screen w-full flex bg-[#fcfafa]">
        {/* Left Side - Form */}
        <div className="w-full lg:w-1/2 flex flex-col p-8 lg:p-12 xl:p-16 relative">
          {/* Logo - Clickable to go back */}
          <div className="flex items-center gap-2 cursor-pointer mb-8" onClick={() => setView('login')}>
            <div className="flex-shrink-0 flex flex-col items-center justify-center border-2 border-[#1c3068] px-3 py-1">
              <span className="text-[10px] tracking-[0.2em] font-semibold text-[#1c3068]/80">2026</span>
              <h1 className="text-xl font-black tracking-wider text-[#1c3068] leading-none">I-HADIR</h1>
              <span className="text-[8px] tracking-[0.4em] text-[#1c3068]/60 uppercase w-full text-center border-t border-[#1c3068]/20 mt-1 pt-0.5">System</span>
            </div>
          </div>

          {/* Form Container */}
          <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
            {/* Header with Icon */}
            <div className="mb-8 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#1c3068] to-[#2a4a8f] mb-6 shadow-lg">
                <KeyRound className="text-white" size={36} />
              </div>
              <h2 className="text-3xl font-bold text-[#1c3068] mb-3">Forgot Your Password?</h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                No worries! Enter your identification number and<br />
                create a new password to regain access.
              </p>
            </div>

            <form className="space-y-7">
              {/* ID Number Field */}
              <div className="relative group">
                <label className="block text-sm font-semibold text-[#1c3068] mb-3">
                  Identification Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter your IC number"
                    className="w-full px-0 pb-3 pt-1 bg-transparent border-b-2 border-gray-300 focus:border-[#1c3068] outline-none transition-all duration-300 text-[#1c3068] placeholder-gray-400"
                  />
                  <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-[#c53336] transition-all duration-300 group-focus-within:w-full"></div>
                </div>
              </div>

              {/* New Password Field */}
              <div className="relative group">
                <label className="block text-sm font-semibold text-[#1c3068] mb-3">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a secure password"
                    className="w-full px-0 pb-3 pt-1 bg-transparent border-b-2 border-gray-300 focus:border-[#1c3068] outline-none transition-all duration-300 text-[#1c3068] placeholder-gray-400 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1c3068] transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-[#c53336] transition-all duration-300 group-focus-within:w-full"></div>
                </div>
                <p className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                  <Shield size={12} />
                  Use at least 8 characters with a mix of letters and numbers
                </p>
              </div>

              {/* Security Notice */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                <Lock className="text-[#1c3068] flex-shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-xs text-[#1c3068] font-semibold mb-1">Security Notice</p>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    For your security, please ensure you're on a trusted device before resetting your password.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-4">
                <button
                  type="button"
                  className="w-full bg-[#1c3068] hover:bg-[#152450] text-white py-3.5 rounded-lg font-bold shadow-lg shadow-[#1c3068]/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <KeyRound size={18} />
                  Reset Password
                </button>

                <button
                  type="button"
                  onClick={() => setView('login')}
                  className="w-full bg-white border-2 border-[#1c3068] text-[#1c3068] py-3.5 rounded-lg font-bold hover:bg-[#1c3068] hover:text-white transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={18} />
                  Back to Login
                </button>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="mt-auto pt-8 flex justify-between items-center text-xs text-gray-400">
            <p>Copyright © 2026 I-HADIR System.</p>
            <a href="#" className="hover:text-[#1c3068] transition-colors">Privacy Policy</a>
          </div>
        </div>

        {/* Right Side - Visual/Branding */}
        <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#1c3068] via-[#1c3068] to-[#2a4a8f] p-12 xl:p-16 flex-col justify-center relative overflow-hidden">
          {/* Background Patterns */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#c53336] rounded-full blur-[120px] opacity-20"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#4a6ab3] rounded-full blur-[120px] opacity-30"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/10 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-white/5 rounded-full"></div>

          {/* Content */}
          <div className="relative z-10 text-center mb-12">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/10 backdrop-blur-sm mb-8 border border-white/20">
              <Shield className="text-white" size={48} />
            </div>
            <h2 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
              Secure Password<br />Recovery
            </h2>
            <p className="text-blue-100/80 max-w-md mx-auto text-lg leading-relaxed">
              We've got you covered. Reset your password securely and get back to managing your attendance system.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="relative z-10 grid grid-cols-1 gap-4 max-w-lg mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20 hover:bg-white/15 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#c53336] flex items-center justify-center flex-shrink-0">
                  <Lock className="text-white" size={24} />
                </div>
                <div className="text-left">
                  <h3 className="text-white font-bold mb-1">Encrypted & Secure</h3>
                  <p className="text-blue-100/70 text-sm">Your data is protected with industry-standard encryption</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20 hover:bg-white/15 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#c53336] flex items-center justify-center flex-shrink-0">
                  <KeyRound className="text-white" size={24} />
                </div>
                <div className="text-left">
                  <h3 className="text-white font-bold mb-1">Quick Recovery</h3>
                  <p className="text-blue-100/70 text-sm">Reset your password in just a few simple steps</p>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20 hover:bg-white/15 transition-all">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#c53336] flex items-center justify-center flex-shrink-0">
                  <Shield className="text-white" size={24} />
                </div>
                <div className="text-left">
                  <h3 className="text-white font-bold mb-1">Always Available</h3>
                  <p className="text-blue-100/70 text-sm">24/7 access to password recovery services</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex bg-[#fcfafa]">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col p-8 lg:p-12 xl:p-16 relative">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 cursor-pointer">
          <div className="flex-shrink-0 flex flex-col items-center justify-center border-2 border-[#1c3068] px-3 py-1">
             <span className="text-[10px] tracking-[0.2em] font-semibold text-[#1c3068]/80">2026</span>
             <h1 className="text-xl font-black tracking-wider text-[#1c3068] leading-none">I-HADIR</h1>
             <span className="text-[8px] tracking-[0.4em] text-[#1c3068]/60 uppercase w-full text-center border-t border-[#1c3068]/20 mt-1 pt-0.5">System</span>
          </div>
        </Link>

        {/* Back Button (Mobile only mostly, or good UX) */}
        <Link 
          to="/"
          className="lg:hidden absolute top-8 right-8 text-[#1c3068] hover:text-[#c53336]"
        >
          <ArrowLeft />
        </Link>

        {/* Form Container */}
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-[#1c3068] mb-3">Welcome Back</h2>
            <p className="text-gray-500 text-sm">
              Enter your identification number and password to access your account.
            </p>
          </div>

          <form className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-[#1c3068] mb-2">
                Identification Number
              </label>
              <input
                type="text"
                placeholder="Enter your ID number"
                className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-[#1c3068]"
              />
            </div>
          
            <div>
              <label className="block text-sm font-semibold text-[#1c3068] mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-[#1c3068]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#1c3068] transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          
            {/* Login Button comes first now */}
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="w-full bg-[#1c3068] hover:bg-[#152450] text-white py-3.5 rounded-lg font-bold shadow-lg shadow-[#1c3068]/20 transition-all transform active:scale-[0.98] inline-block text-center"
            >
              Log In
            </button>
          
            {/* Forgot Password moved below and aligned most right */}
            <div className="flex justify-end">
              <button 
                type="button"
                onClick={() => setView('forgot-password')} 
                className="text-sm font-semibold text-[#c53336] hover:text-[#a02224] transition-colors bg-transparent border-none cursor-pointer hover:underline"
              >
                Forgot Your Password?
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-8 flex justify-between items-center text-xs text-gray-400">
          <p>Copyright © 2026 I-HADIR System.</p>
          <a href="#" className="hover:text-[#1c3068]">Privacy Policy</a>
        </div>
      </div>

      {/* Right Side - Image/Visual */}
      <div className="hidden lg:flex w-1/2 bg-[#1c3068] p-12 xl:p-16 flex-col justify-center relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#c53336] rounded-full blur-[100px] opacity-20 -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#cec43a] rounded-full blur-[100px] opacity-10 -ml-20 -mb-20"></div>

        <div className="relative z-10 text-center mb-12">
          <h2 className="text-3xl xl:text-4xl font-bold text-white mb-4">
            Smart Attendance Management
          </h2>
          <p className="text-blue-100/80 max-w-md mx-auto">
            Effortlessly track attendance, manage permissions, and generate reports in one place.
          </p>
        </div>

        <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10 mx-auto max-w-lg transform hover:scale-105 transition-transform duration-700">
          <div className="absolute inset-0 bg-gradient-to-t from-[#1c3068]/80 to-transparent z-10"></div>
          <img 
            src="https://images.unsplash.com/photo-1764720573370-5008f1ccc9fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBzY2hvb2wlMjBlZHVjYXRpb24lMjBzdHVkZW50cyUyMGxlYXJuaW5nJTIwY2xhc3Nyb29tfGVufDF8fHx8MTc2OTYxNjYzOXww&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Students Learning" 
            className="w-full h-auto object-cover"
          />
          <div className="absolute bottom-6 left-6 z-20 text-left">
            <div className="bg-[#c53336] text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-2">
              LATEST SYSTEM
            </div>
            <p className="text-white font-medium text-lg">Seamless Digital Classroom</p>
          </div>
        </div>
      </div>
    </div>
  );
};