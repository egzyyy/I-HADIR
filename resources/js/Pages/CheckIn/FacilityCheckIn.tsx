import React, { useState } from 'react';
import { motion } from 'motion/react';
import { QrCode, Users, GraduationCap, Briefcase, User, MapPin, Clock, Calendar, Moon, Book, Monitor, ClipboardList, ChevronRight } from 'lucide-react';
import DashboardLayout from '../../Layouts/DashboardLayout';

const FacilityCheckIn = () => {
  const [selectedType, setSelectedType] = useState<'prayer' | 'pss' | 'ict' | 'activity' | null>(null);

  if (!selectedType) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-6xl mx-auto flex flex-col items-center justify-center min-h-[500px]"
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#1c3068] mb-3">Facility Check In</h2>
          <p className="text-gray-500">Please select the facility you want to check in to</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
          {/* Prayer Card */}
          <div 
            onClick={() => setSelectedType('prayer')}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer group flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Moon size={32} className="text-[#1c3068]" />
            </div>
            <h3 className="text-lg font-bold text-[#1c3068]">Prayer</h3>
          </div>

          {/* PSS Card */}
          <div 
            onClick={() => setSelectedType('pss')}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer group flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Book size={32} className="text-[#1c3068]" />
            </div>
            <h3 className="text-lg font-bold text-[#1c3068]">PSS</h3>
          </div>

          {/* ICT Card */}
          <div 
            onClick={() => setSelectedType('ict')}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer group flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Monitor size={32} className="text-[#1c3068]" />
            </div>
            <h3 className="text-lg font-bold text-[#1c3068]">ICT</h3>
          </div>

          {/* Activity Card */}
          <div 
            onClick={() => setSelectedType('activity')}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer group flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <ClipboardList size={32} className="text-[#1c3068]" />
            </div>
            <h3 className="text-lg font-bold text-[#1c3068]">Activity</h3>
          </div>
        </div>
      </motion.div>
    );
  }

  const getTitle = () => {
    switch(selectedType) {
      case 'prayer': return 'Prayer Log';
      case 'pss': return 'PSS Log';
      case 'ict': return 'ICT Log';
      case 'activity': return 'Activity Log';
      default: return 'Log';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-full mx-auto"
    >
      <div className="mb-6 flex items-center gap-4">
        <button 
          onClick={() => setSelectedType(null)}
          className="text-gray-500 hover:text-[#1c3068] transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <ChevronRight size={16} className="rotate-180" /> Back to Selection
        </button>
        <div className="h-4 w-px bg-gray-300"></div>
        <h2 className="text-2xl font-bold text-[#1c3068]">{getTitle()}</h2>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
        <div className="p-8">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-800">QR Scanner</h3>
            <p className="text-gray-500 text-sm mt-1">Please show your QR Code.</p>
          </div>

          <div className="bg-gray-50/50 border-0 rounded-xl h-[500px] flex flex-col items-center justify-center text-gray-400">
             {/* Placeholder for QR Scanner Camera */}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function FacilityCheckInPage() {
  return (
    <DashboardLayout activePageId="facility-check-in">
      <FacilityCheckIn />
    </DashboardLayout>
  );
}
