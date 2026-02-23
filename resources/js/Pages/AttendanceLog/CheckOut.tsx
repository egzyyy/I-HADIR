import React from 'react';
import { motion } from 'motion/react';
import { QrCode } from 'lucide-react';
import DashboardLayout from '../../Layouts/DashboardLayout';

const AttendanceCheckOut = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-full mx-auto"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#1c3068]">Scan Out Attendance</h2>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
        <div className="p-8">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-800">QR Scanner</h3>
            <p className="text-gray-500 text-sm mt-1">Please show your QR Code.</p>
          </div>

          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl h-96 flex flex-col items-center justify-center text-gray-400">
             {/* Placeholder for QR Scanner Camera */}
             <div className="w-16 h-16 border-2 border-gray-300 rounded-lg flex items-center justify-center mb-4">
               <div className="w-10 h-10 border-2 border-gray-300 rounded-sm"></div>
             </div>
             <p>Camera View</p>
          </div>

          <div className="mt-6">
             <p className="text-gray-600 font-medium">Your Current Location is :</p>
             <p className="text-gray-400 text-sm mt-1">Fetching location...</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function CheckOutPage() {
  return (
    <DashboardLayout activePageId="check-out">
      <AttendanceCheckOut />
    </DashboardLayout>
  );
}
