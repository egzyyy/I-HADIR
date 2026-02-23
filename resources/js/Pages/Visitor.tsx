import React, { useState } from 'react';
import { ArrowLeft, UserPlus, LogIn, ChevronRight, ClipboardList } from 'lucide-react';
import bgImage from '../assets/3379b4a489c00147d1f88ca87c8a0a3a3769dc13.png';
import { Link } from 'react-router-dom';

export default function Visitor() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    department: '',
    notes: ''
  });

  const [recentVisitors] = useState([
    { name: 'Sarah Johnson', department: 'Engineering', date: '14 Feb 2026, 10:26 AM' },
    { name: 'Michael Chen', department: 'Marketing', date: '14 Feb 2026, 09:26 AM' },
    { name: 'Aisha Patel', department: 'Human Resources', date: '14 Feb 2026, 08:26 AM' },
    { name: 'Hamidah Binti Hassan', department: 'PPD Kemaman', date: '13 Feb 2026, 02:15 PM' },
    { name: 'Wan Azmi Bin Wan Ali', department: 'SM Badrul Alam Shah', date: '13 Feb 2026, 11:30 AM' }
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Logic to handle submission would go here
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen flex flex-col font-sans relative">
      {/* Background Image with Overlay */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      <div className="fixed inset-0 z-0 bg-[#1c3068]/80 backdrop-blur-[2px]" />

      {/* Header */}
      <div className="relative z-40 bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
               <Link 
                to="/"
                className="p-2 hover:bg-gray-100 rounded-full text-[#1c3068] transition-colors inline-block"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-xl font-black text-[#1c3068] uppercase tracking-wide">VISITOR CHECK-IN</h1>
                <p className="text-xs text-gray-500 mt-1">System Management</p>
              </div>
            </div>
            <div className="flex items-center text-xs text-gray-500 font-medium bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
               <span className="text-[#1c3068] font-bold">I-HADIR</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex-1 py-10 px-4 sm:px-6 lg:px-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-8">
          
          {/* Main Page Title */}
          <div className="flex items-center justify-center gap-3 text-white">
            <ClipboardList size={32} className="stroke-[2.5]" />
            <h2 className="text-3xl font-black tracking-tight">Visitor</h2>
          </div>

          {/* Registration Card */}
          <div className="bg-white rounded-xl shadow-xl overflow-hidden">
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <UserPlus className="text-[#1c3068]" size={24} />
                <h3 className="text-xl font-bold text-[#1c3068]">Register Visitor</h3>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-gray-700">Name <span className="text-[#c53336]">*</span></label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/20 outline-none transition-all"
                      placeholder="Full name"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-gray-700">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/20 outline-none transition-all"
                      placeholder="Phone number"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-gray-700">Department <span className="text-[#c53336]">*</span></label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/20 outline-none transition-all"
                    placeholder="e.g. Engineering"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-gray-700">Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    className="block w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/20 outline-none transition-all resize-none"
                    placeholder="Purpose of visit (optional)"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#1c3068] hover:bg-[#152450] text-white font-bold py-3.5 rounded-lg shadow-lg shadow-[#1c3068]/20 transition-all uppercase tracking-wide text-sm mt-2"
                >
                  Check In
                </button>
              </form>
            </div>
          </div>

          {/* Recent Visitors Card */}
          <div className="bg-white rounded-xl shadow-xl overflow-hidden">
            <div className="p-8">
              <h3 className="text-xl font-bold text-[#1c3068] mb-6">Recent Visitors</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="py-4 font-bold text-gray-500 w-[30%]">Name</th>
                      <th className="py-4 font-bold text-gray-500 w-[30%]">Department</th>
                      <th className="py-4 font-bold text-gray-500 text-right">Date & Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentVisitors.map((visitor, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 text-[#1c3068] font-bold">{visitor.name}</td>
                        <td className="py-4 text-gray-600">{visitor.department}</td>
                        <td className="py-4 text-gray-500 text-right font-medium">{visitor.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
