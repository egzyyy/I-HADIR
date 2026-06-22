import React from 'react';
import { motion } from 'motion/react';
import { Calendar, Users, Book, CheckCircle } from 'lucide-react';

export const TeacherDashboard = () => {
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
            <h2 className="text-3xl md:text-4xl font-bold mb-2">Teacher Dashboard</h2>
            <p className="text-blue-100 max-w-2xl">
              Welcome back! Manage your classes and track student attendance.
            </p>
          </div>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="absolute left-0 bottom-0 w-48 h-48 bg-[#c53336]/20 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <Users className="text-[#1c3068]" size={24} />
            </div>
          </div>
          <h4 className="text-2xl font-bold text-gray-800 mb-1">24</h4>
          <p className="text-gray-500 text-sm">Students in Your Class</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
          <h4 className="text-2xl font-bold text-gray-800 mb-1">22</h4>
          <p className="text-gray-500 text-sm">Present Today</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
              <Book className="text-purple-600" size={24} />
            </div>
          </div>
          <h4 className="text-2xl font-bold text-gray-800 mb-1">5</h4>
          <p className="text-gray-500 text-sm">Classes Today</p>
        </motion.div>
      </div>

      {/* Today's Schedule */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="text-xl font-bold text-[#1c3068] mb-4">Today's Schedule</h3>
        <div className="space-y-3">
          {[
            { time: '08:00 - 09:00', subject: 'Mathematics', class: '5 PROGRESIF' },
            { time: '09:00 - 10:00', subject: 'Science', class: '5 PROGRESIF' },
            { time: '10:30 - 11:30', subject: 'English', class: '5 KREATIF' },
            { time: '11:30 - 12:30', subject: 'Mathematics', class: '5 INOVATIF' },
          ].map((schedule, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold text-gray-800">{schedule.subject}</p>
                <p className="text-sm text-gray-500">{schedule.class}</p>
              </div>
              <div className="text-sm font-medium text-gray-600">{schedule.time}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-xl font-bold text-[#1c3068] mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors">
            <p className="font-semibold text-[#1c3068]">Take Attendance</p>
            <p className="text-sm text-gray-600 mt-1">Mark students present/absent</p>
          </button>
          <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors">
            <p className="font-semibold text-green-700">View Reports</p>
            <p className="text-sm text-gray-600 mt-1">Check attendance reports</p>
          </button>
        </div>
      </div>
    </>
  );
};
