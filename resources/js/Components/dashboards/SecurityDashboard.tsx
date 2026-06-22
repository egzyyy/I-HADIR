import React from 'react';
import { motion } from 'motion/react';
import { Calendar, Shield, Users, AlertCircle, Clock } from 'lucide-react';

export const SecurityDashboard = () => {
  return (
    <>
      {/* Welcome Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[#1c3068] to-[#2a4595] rounded-3xl p-8 mb-10 text-white shadow-xl relative overflow-hidden"
      >
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium mb-3">
               <Calendar size={16} />
               <span>Thursday, 29th of January 2026</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">Security Dashboard</h2>
            <p className="text-blue-100 max-w-2xl">
              Monitor school entry/exit and manage visitor access.
            </p>
          </div>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="absolute left-0 bottom-0 w-48 h-48 bg-[#c53336]/20 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <Users className="text-green-600" size={24} />
            </div>
          </div>
          <h4 className="text-2xl font-bold text-gray-800 mb-1">342</h4>
          <p className="text-gray-500 text-sm">Total In School</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <Clock className="text-blue-600" size={24} />
            </div>
          </div>
          <h4 className="text-2xl font-bold text-gray-800 mb-1">8</h4>
          <p className="text-gray-500 text-sm">Late Arrivals</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
              <Shield className="text-purple-600" size={24} />
            </div>
          </div>
          <h4 className="text-2xl font-bold text-gray-800 mb-1">3</h4>
          <p className="text-gray-500 text-sm">Visitors Today</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
              <AlertCircle className="text-red-600" size={24} />
            </div>
          </div>
          <h4 className="text-2xl font-bold text-gray-800 mb-1">0</h4>
          <p className="text-gray-500 text-sm">Alerts</p>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="text-xl font-bold text-[#1c3068] mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {[
            { time: '07:45 AM', person: 'Ahmad bin Ali', type: 'Student', action: 'Entered', badge: 'text-green-700 bg-green-50' },
            { time: '07:50 AM', person: 'Siti Nur Aisyah', type: 'Teacher', action: 'Entered', badge: 'text-green-700 bg-green-50' },
            { time: '08:15 AM', person: 'Mohd Faiz', type: 'Student', action: 'Late Arrival', badge: 'text-orange-700 bg-orange-50' },
            { time: '09:00 AM', person: 'Mr. Rahman (Parent)', type: 'Visitor', action: 'Checked In', badge: 'text-blue-700 bg-blue-50' },
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="text-sm font-medium text-gray-600 w-20">{activity.time}</div>
                <div>
                  <p className="font-semibold text-gray-800">{activity.person}</p>
                  <p className="text-sm text-gray-500">{activity.type}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${activity.badge}`}>
                {activity.action}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-xl font-bold text-[#1c3068] mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors">
            <p className="font-semibold text-[#1c3068]">Check In Visitor</p>
            <p className="text-sm text-gray-600 mt-1">Register new visitor</p>
          </button>
          <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors">
            <p className="font-semibold text-green-700">Scan QR Code</p>
            <p className="text-sm text-gray-600 mt-1">Quick attendance check</p>
          </button>
          <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition-colors">
            <p className="font-semibold text-purple-700">View Reports</p>
            <p className="text-sm text-gray-600 mt-1">Daily entry/exit logs</p>
          </button>
        </div>
      </div>
    </>
  );
};
