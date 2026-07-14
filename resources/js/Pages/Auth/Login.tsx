import React, { useState } from 'react';
import axios from 'axios';
import { Mail, Lock, ArrowLeft, LogIn, KeyRound, Shield, EyeOff, Eye, CheckCircle, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../assets/i_hadir_logo2.png';
import { useAuth, homeForRole } from '../../contexts/AuthContext';

// Set default axios configuration
axios.defaults.withCredentials = true;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

export default function Login() {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [view, setView] = useState<'login' | 'forgot-password'>('login');

  // --- LOGIN STATE ---
  const [data, setData] = useState({ ic_number: '', password: '' });
  const [errors, setErrors] = useState<any>({});
  const [processing, setProcessing] = useState(false);

  // --- PASSWORD RESET STATE ---
  const [resetData, setResetData] = useState({ ic_number: '', school_code: '', password: '' });
  const [resetProcessing, setResetProcessing] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // --- LOGIN HANDLER ---
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setErrors({});

    try {
      await axios.get('/sanctum/csrf-cookie');
      await axios.post('/login', data);
      // Load the freshly authenticated user so the dashboard knows the role
      // before we navigate (avoids a redirect bounce / wrong-menu flash).
      const me = await refresh();
      navigate(homeForRole(me?.role ?? null));
    } catch (error: any) {
      if (error.response && error.response.status === 422) {
        setErrors(error.response.data.errors);
      } else if (error.response && error.response.status === 419) {
        setErrors({ general: 'Session expired. Please refresh the page.' });
      } else {
        setErrors({ general: error.response?.data?.message || 'Invalid credentials or server error.' });
      }
    } finally {
      setProcessing(false);
    }
  };

  // --- RESET PASSWORD HANDLER ---
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetProcessing(true);
    setResetFeedback(null);

    // Basic Frontend Validation
    if (!resetData.ic_number || !resetData.school_code || resetData.password.length < 8) {
      setResetFeedback({ type: 'error', message: 'Please fill all fields. Password must be at least 8 characters.' });
      setResetProcessing(false);
      return;
    }

    try {
      const response = await axios.post('/password/reset-by-code', resetData);
      if (response.data.success) {
        setResetFeedback({ type: 'success', message: 'Password reset successfully! You can now log in.' });
        // Clear form
        setResetData({ ic_number: '', school_code: '', password: '' });
        // Auto redirect to login after 2 seconds
        setTimeout(() => setView('login'), 2500);
      }
    } catch (error: any) {
      setResetFeedback({ 
        type: 'error', 
        message: error.response?.data?.message || 'Failed to reset password. Please try again.' 
      });
    } finally {
      setResetProcessing(false);
    }
  };

  if (view === 'forgot-password') {
    return (
      <div className="min-h-screen w-full flex bg-[#fcfafa]">
        {/* Left Side - Form */}
        <div className="w-full lg:w-1/2 flex flex-col p-8 lg:p-12 xl:p-16 relative">
          {/* Logo - Clickable to go back */}
          <div className="flex items-center gap-2 cursor-pointer mb-8" onClick={() => { setView('login'); setResetFeedback(null); }}>
            <div className="flex-shrink-0 flex items-center">
              <img src={logo} alt="I-HADIR Logo" className="h-24 w-auto object-contain" />
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
                Verify your identity to create a new password and regain access to the system.
              </p>
            </div>

            {/* FEEDBACK MESSAGES */}
            {resetFeedback && (
              <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 text-sm font-medium ${
                resetFeedback.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-100'
              }`}>
                {resetFeedback.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                <p className="mt-0.5">{resetFeedback.message}</p>
              </div>
            )}

            <form className="space-y-6" onSubmit={handleReset}>
              
              {/* IC Number Field (Security measure) */}
              <div className="relative group">
                <label className="block text-sm font-semibold text-[#1c3068] mb-2">
                  Admin IC Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={resetData.ic_number}
                    onChange={(e) => setResetData({ ...resetData, ic_number: e.target.value })}
                    placeholder="Enter your IC number"
                    className="w-full px-4 py-3 bg-transparent border-b-2 border-gray-300 focus:border-[#1c3068] outline-none transition-all duration-300 text-[#1c3068] placeholder-gray-400"
                  />
                  <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-[#c53336] transition-all duration-300 group-focus-within:w-full"></div>
                </div>
              </div>

              {/* School Code Field */}
              <div className="relative group">
                <label className="block text-sm font-semibold text-[#1c3068] mb-2">
                  School Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={resetData.school_code}
                    onChange={(e) => setResetData({ ...resetData, school_code: e.target.value })}
                    placeholder="Enter your school code (e.g. MEA1023)"
                    className="w-full px-4 py-3 bg-transparent border-b-2 border-gray-300 focus:border-[#1c3068] outline-none transition-all duration-300 text-[#1c3068] placeholder-gray-400"
                  />
                  <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-[#c53336] transition-all duration-300 group-focus-within:w-full"></div>
                </div>
              </div>

              {/* New Password Field */}
              <div className="relative group">
                <label className="block text-sm font-semibold text-[#1c3068] mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={resetData.password}
                    onChange={(e) => setResetData({ ...resetData, password: e.target.value })}
                    placeholder="Create a secure password"
                    className="w-full px-4 py-3 bg-transparent border-b-2 border-gray-300 focus:border-[#1c3068] outline-none transition-all duration-300 text-[#1c3068] placeholder-gray-400 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#1c3068] transition-colors"
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

              {/* Action Buttons */}
              <div className="space-y-3 pt-4">
                <button
                  type="submit"
                  disabled={resetProcessing || resetFeedback?.type === 'success'}
                  className="w-full bg-[#1c3068] hover:bg-[#152450] text-white px-4 py-3 rounded-lg font-bold shadow-lg shadow-[#1c3068]/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <KeyRound size={18} />
                  {resetProcessing ? 'Resetting Password...' : 'Reset Password'}
                </button>

                <button
                  type="button"
                  onClick={() => { setView('login'); setResetFeedback(null); }}
                  className="w-full bg-white border-2 border-[#1c3068] text-[#1c3068] px-4 py-3 rounded-lg font-bold hover:bg-[#1c3068] hover:text-white transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
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
          <div className="flex-shrink-0 flex items-center">
             <img src={logo} alt="I-HADIR Logo" className="h-24 w-auto object-contain" />
          </div>
        </Link>

        {/* Back Button (Mobile only mostly) */}
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

          <form className="space-y-6" onSubmit={submit}>
            {errors.general && (
              <div className="bg-red-50 text-red-500 text-sm p-3 rounded-lg border border-red-100 flex items-center gap-2">
                <AlertCircle size={16} />
                {errors.general}
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-[#1c3068] mb-2">
                Admin Identification Number
              </label>
              <input
                type="text"
                value={data.ic_number}
                onChange={(e) => setData({ ...data, ic_number: e.target.value })}
                placeholder="Enter your admin identification number"
                className={`w-full px-4 py-3 rounded-lg bg-gray-50 border ${errors.ic_number ? 'border-red-500' : 'border-gray-200'} focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-[#1c3068]`}
              />
              {errors.ic_number && <p className="text-red-500 text-xs mt-1">{errors.ic_number}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#1c3068] mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={data.password}
                  onChange={(e) => setData({ ...data, password: e.target.value })}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 rounded-lg bg-gray-50 border ${errors.password ? 'border-red-500' : 'border-gray-200'} focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-[#1c3068]`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#1c3068] transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>
          
            {/* Login Button */}
            <button
              type="submit"
              disabled={processing}
              className="w-full bg-[#1c3068] hover:bg-[#152450] text-white py-3.5 rounded-lg font-bold shadow-lg shadow-[#1c3068]/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {processing ? 'Logging in...' : 'Log In'}
            </button>
          
            {/* Forgot Password */}
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
          <a href="#" className="hover:text-[#1c3068] transition-colors">Privacy Policy</a>
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
}