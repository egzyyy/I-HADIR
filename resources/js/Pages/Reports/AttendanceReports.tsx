import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Calendar, ChevronDown, Download, Filter, Users, FileText, BarChart3, Eye } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { ExportButtons } from '../../Components/dashboard/ExportButtons';
import { CircularProgressBar } from '../../Components/dashboard/CircularProgressBar';

const AttendanceReport = () => {
  const [activeTab, setActiveTab] = useState('student');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-full mx-auto"
    >
      {/* Header section code remains same as your provide code */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
           <h2 className="text-2xl font-bold text-[#1c3068]">Attendance Report</h2>
           <p className="text-gray-500 text-sm mt-1">
             View and manage attendance records and daily statistics.
           </p>
        </div>
        
        <div className="bg-white p-1 rounded-lg border border-gray-200 shadow-sm flex">
          {['Student', 'Teacher', 'Staff'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                activeTab === tab.toLowerCase()
                  ? 'bg-[#1c3068] text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Updated Filter Row with justify-between */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-8">
           <h3 className="text-lg font-bold text-[#1c3068] mb-6">Report</h3>
           
           {/* Adding justify-between pushes the button container to the far right */}
           <div className="flex flex-col md:flex-row justify-between items-end gap-6">
             
             {/* Left side: Grouped Filters */}
             <div className="flex flex-col md:flex-row gap-6 items-end flex-1">
                {/* Date Input */}
                <div className="w-full md:w-64 space-y-2">
                  <label className="block text-sm font-bold text-[#1c3068]">
                    <span className="text-[#c53336] mr-1">*</span> Date
                  </label>
                  <input 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-gray-700"
                  />
                  <p className="text-[10px] text-gray-400 font-medium">dd-mm-yyyy</p>
                </div>

                {/* Class Select */}
                {activeTab === 'student' && (
                  <div className="w-full md:w-64 space-y-2">
                    <label className="block text-sm font-bold text-[#1c3068]">
                      <span className="text-[#c53336] mr-1">*</span> Class
                    </label>
                    <div className="relative">
                      <select 
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all appearance-none text-gray-700 cursor-pointer"
                      >
                        <option value="">Select...</option>
                        <option value="1-amanah">1 Amanah</option>
                        <option value="1-bestari">1 Bestari</option>
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                    {/* Spacer to match dd-mm-yyyy text height */}
                    <p className="text-[10px] text-transparent select-none">placeholder</p>
                  </div>
                )}
             </div>

             {/* Right side: Submit Button aligned to far right */}
             <div className="w-full md:w-auto pb-6">
               <button className="bg-[#1c3068] hover:bg-[#152450] text-white px-10 py-2.5 rounded-lg font-bold shadow-lg shadow-[#1c3068]/20 transition-all transform active:scale-95 min-w-[120px]">
                 Submit
               </button>
             </div>
           </div>
        </div>
      </div>

      {activeTab === 'student' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Card 1: Present/Absent Split */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <div className="bg-[#1c3068] p-4 flex items-center justify-center h-24">
               <Users size={40} className="text-white" />
            </div>
            <div className="flex border-t border-gray-100 divide-x divide-gray-100">
               <div className="flex-1 p-4 text-center">
                 <p className="text-xl font-bold text-[#1c3068]">0</p>
                 <p className="text-xs text-gray-500 uppercase tracking-wider">Present</p>
               </div>
               <div className="flex-1 p-4 text-center">
                 <p className="text-xl font-bold text-[#c53336]">0</p>
                 <p className="text-xs text-gray-500 uppercase tracking-wider">Absent</p>
               </div>
            </div>
          </div>

          {/* Card 2: Total Present */}
          <div className="bg-[#1c3068] rounded-xl shadow-sm p-6 flex flex-col items-center justify-center text-white">
             <p className="text-4xl font-bold mb-1">0</p>
             <p className="text-sm font-medium opacity-90">Total Present</p>
          </div>

          {/* Card 3: Total Absent */}
          <div className="bg-[#c53336] rounded-xl shadow-sm p-6 flex flex-col items-center justify-center text-white">
             <p className="text-4xl font-bold mb-1">0</p>
             <p className="text-sm font-medium opacity-90">Total Absent</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
           <p className="text-gray-500 text-sm">
             {activeTab === 'student' ? 'Student' : activeTab === 'teacher' ? 'Teacher' : 'Staff'} attendance list on
           </p>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <ExportButtons />

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm text-gray-500">Search:</span>
              <input 
                type="text" 
                className="w-full sm:w-48 px-3 py-1.5 bg-white border border-gray-200 rounded text-sm focus:border-[#1c3068] outline-none transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-200">
                  <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Name</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">
                    {activeTab === 'student' ? 'Class' : activeTab === 'teacher' ? 'Teacher Type' : 'Staff Type'}
                  </th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Date</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Attendance</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Time In</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Time Out</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider">Reason</th>
                </tr>
              </thead>
              <tbody>
                 <tr>
                   <td colSpan={7} className="px-6 py-8 text-center text-gray-500 text-sm">
                     No data available in table
                   </td>
                 </tr>
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
            <p className="text-sm text-gray-500">Showing 0 to 0 of 0 entries</p>
            <div className="flex gap-1">
              <button className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-500 hover:bg-gray-50" disabled>Previous</button>
              <button className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-500 hover:bg-gray-50" disabled>Next</button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const AbsentReport = () => {
  const [activeTab, setActiveTab] = useState('student');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-full mx-auto"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
           <h2 className="text-2xl font-bold text-[#1c3068]">Absent Report</h2>
           <p className="text-gray-500 text-sm mt-1">
             View and manage daily absenteeism records and statistics.
           </p>
        </div>
        
        <div className="bg-white p-1 rounded-lg border border-gray-200 shadow-sm flex">
          {['Student', 'Teacher', 'Staff'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                activeTab === tab.toLowerCase()
                  ? 'bg-[#1c3068] text-white shadow-md'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-8">
           <h3 className="text-lg font-bold text-[#1c3068] mb-6">Report</h3>
           
           {/* Parent container with justify-between pushes the button to the far right */}
           <div className="flex flex-col md:flex-row justify-between items-end gap-6">
             
             {/* Left side: Date and Class aligned in a row */}
             <div className="flex flex-col md:flex-row gap-6 items-end flex-1">
               {/* Date Selector */}
               <div className="w-full md:w-64 space-y-2">
                 <label className="block text-sm font-bold text-[#1c3068]">
                   <span className="text-[#c53336] mr-1">*</span> Date
                 </label>
                 <input 
                   type="date" 
                   value={selectedDate}
                   onChange={(e) => setSelectedDate(e.target.value)}
                   className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-gray-700"
                 />
                 <p className="text-[10px] text-gray-400 font-medium">dd-mm-yyyy</p>
               </div>

               {/* Class Selector - Now sitting on the same row */}
               {activeTab === 'student' && (
                 <div className="w-full md:w-64 space-y-2">
                   <label className="block text-sm font-bold text-[#1c3068]">
                     <span className="text-[#c53336] mr-1">*</span> Class
                   </label>
                   <div className="relative">
                     <select 
                       value={selectedClass}
                       onChange={(e) => setSelectedClass(e.target.value)}
                       className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all appearance-none text-gray-700 cursor-pointer"
                     >
                       <option value="">Select...</option>
                       <option value="1-amanah">1 Amanah</option>
                       <option value="1-bestari">1 Bestari</option>
                     </select>
                     <ChevronDown size={16} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                   </div>
                   {/* Transparent spacer to align with the Date helper text */}
                   <p className="text-[10px] text-transparent select-none">spacer</p>
                 </div>
               )}
             </div>

             {/* Right side: Submit Button aligned most right */}
             <div className="w-full md:w-auto pb-6">
               <button className="bg-[#1c3068] hover:bg-[#152450] text-white px-10 py-2.5 rounded-lg font-bold shadow-lg shadow-[#1c3068]/20 transition-all transform active:scale-95 min-w-[120px]">
                 Submit
               </button>
             </div>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
           <p className="text-gray-500 text-sm capitalize">
             {activeTab} absenteeism list
           </p>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <ExportButtons />
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm text-gray-500">Search:</span>
              <input 
                type="text" 
                className="w-full sm:w-48 px-3 py-1.5 bg-white border border-gray-200 rounded text-sm focus:border-[#1c3068] outline-none transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-200">
                  <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Name</th>
                  {activeTab === 'student' && (
                    <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Class</th>
                  )}
                  <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Date</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Attendance</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Time In</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider">Time Out</th>
                </tr>
              </thead>
              <tbody>
                 <tr>
                   <td colSpan={activeTab === 'student' ? 6 : 5} className="px-6 py-8 text-center text-gray-500 text-sm">
                     No data available in table
                   </td>
                 </tr>
              </tbody>
            </table>
          </div>

          {/* Restored Pagination */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
            <p className="text-sm text-gray-500">Showing 0 to 0 of 0 entries</p>
            <div className="flex gap-1">
              <button className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-500 hover:bg-gray-50" disabled>Previous</button>
              <button className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-500 hover:bg-gray-50" disabled>Next</button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const PresentReport = () => {
  const [activeTab, setActiveTab] = useState('student');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-full mx-auto"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
           <h2 className="text-2xl font-bold text-[#1c3068]">Present Report</h2>
           <p className="text-gray-500 text-sm mt-1">
             View and manage daily presence records and statistics.
           </p>
        </div>
        
        <div className="bg-white p-1 rounded-lg border border-gray-200 shadow-sm flex">
          {['Student', 'Teacher', 'Staff'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                activeTab === tab.toLowerCase()
                  ? 'bg-white text-[#1c3068] shadow-sm ring-1 ring-gray-200'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-8">
           <h3 className="text-lg font-bold text-[#1c3068] mb-6">Report</h3>
           <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
             <div className="w-full md:w-64 space-y-2">
               <label className="block text-sm font-bold text-[#1c3068]">
                 <span className="text-[#c53336] mr-1">*</span> Date
               </label>
               <input 
                 type="date" 
                 value={selectedDate}
                 onChange={(e) => setSelectedDate(e.target.value)}
                 className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-gray-700"
               />
               <p className="text-xs text-gray-400">dd-mm-yyyy</p>
             </div>

             {activeTab === 'student' && (
               <div className="w-full md:w-64 space-y-2">
                 <label className="block text-sm font-bold text-[#1c3068]">
                   <span className="text-[#c53336] mr-1">*</span> Class
                 </label>
                 <div className="relative">
                   <select 
                     value={selectedClass}
                     onChange={(e) => setSelectedClass(e.target.value)}
                     className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all appearance-none text-gray-700"
                   >
                     <option value="">Select...</option>
                     <option value="1-amanah">1 Amanah</option>
                     <option value="1-bestari">1 Bestari</option>
                   </select>
                   <ChevronDown size={16} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                 </div>
               </div>
             )}

             <div className="mt-4 md:mt-0 md:ml-auto self-end md:self-center pt-6">
               <button className="bg-[#1c3068] hover:bg-[#152450] text-white px-8 py-2.5 rounded-lg font-bold shadow-lg shadow-[#1c3068]/20 transition-all">
                 Submit
               </button>
             </div>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
           <p className="text-gray-500 text-sm">
             {activeTab === 'student' ? 'Student' : activeTab === 'teacher' ? 'Teacher' : 'Staff'} presence list on
           </p>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <ExportButtons />

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm text-gray-500">Search:</span>
              <input 
                type="text" 
                className="w-full sm:w-48 px-3 py-1.5 bg-white border border-gray-200 rounded text-sm focus:border-[#1c3068] outline-none transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-200">
                  <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Name</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">
                    {activeTab === 'student' ? 'Class' : activeTab === 'teacher' ? 'Teacher Type' : 'Staff Type'}
                  </th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Date</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Status</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider">Reason</th>
                </tr>
              </thead>
              <tbody>
                 <tr>
                   <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">
                     No data available in table
                   </td>
                 </tr>
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
            <p className="text-sm text-gray-500">Showing 0 to 0 of 0 entries</p>
            <div className="flex gap-1">
              <button className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-500 hover:bg-gray-50" disabled>Previous</button>
              <button className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-500 hover:bg-gray-50" disabled>Next</button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const InfographicReport = () => {
  const [activeTab, setActiveTab] = useState('student');
  const [activeStatusTab, setActiveStatusTab] = useState<'absent' | 'present'>('absent');
  const [viewType, setViewType] = useState<'date' | 'month'>('month');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const data = [
    { name: '1', present: 280, absent: 20 },
    { name: '2', present: 275, absent: 25 },
    { name: '3', present: 290, absent: 10 },
    { name: '4', present: 260, absent: 40 },
    { name: '5', present: 270, absent: 30 },
    { name: '6', present: 0, absent: 0 },
    { name: '7', present: 0, absent: 0 },
    { name: '8', present: 285, absent: 15 },
    { name: '9', present: 288, absent: 12 },
    { name: '10', present: 272, absent: 28 },
    { name: '11', present: 278, absent: 22 },
    { name: '12', present: 265, absent: 35 },
    { name: '13', present: 0, absent: 0 },
    { name: '14', present: 0, absent: 0 },
    { name: '15', present: 292, absent: 8 },
    { name: '16', present: 295, absent: 5 },
    { name: '17', present: 289, absent: 11 },
    { name: '18', present: 280, absent: 20 },
    { name: '19', present: 268, absent: 32 },
    { name: '20', present: 0, absent: 0 },
    { name: '21', present: 0, absent: 0 },
    { name: '22', present: 287, absent: 13 },
    { name: '23', present: 291, absent: 9 },
    { name: '24', present: 285, absent: 15 },
    { name: '25', present: 279, absent: 21 },
    { name: '26', present: 273, absent: 27 },
    { name: '27', present: 0, absent: 0 },
    { name: '28', present: 0, absent: 0 },
    { name: '29', present: 293, absent: 7 },
    { name: '30', present: 296, absent: 4 },
  ];

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-full mx-auto"
    >
      {/* Top Header Row with Consistent Main Tab Style */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
           <h2 className="text-2xl font-bold text-[#1c3068]">Infographic Report</h2>
           <p className="text-gray-500 text-sm mt-1">View monthly attendance infographics and statistics.</p>
        </div>
        
        {/* DESIGN UPDATED: Matching Attendance Report Tab Design */}
        <div className="bg-white p-1 rounded-lg border border-gray-200 shadow-sm flex">
          {['Student', 'Teacher', 'Staff'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase())}
              className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${
                activeTab === tab.toLowerCase()
                  ? 'bg-[#1c3068] text-white shadow-md' // Dark blue background for active
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Report Filter Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-8">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
             <h3 className="text-lg font-bold text-[#1c3068]">Report</h3>
             
             {/* View Type Toggle */}
             <div className="bg-white p-1 rounded-lg border border-gray-200 shadow-sm flex">
               <button
                 onClick={() => setViewType('date')}
                 className={`px-5 py-2 rounded-md text-sm font-semibold transition-all ${
                   viewType === 'date'
                     ? 'bg-[#1c3068] text-white shadow-md'
                     : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                 }`}
               >
                 By Date
               </button>
               <button
                 onClick={() => setViewType('month')}
                 className={`px-5 py-2 rounded-md text-sm font-semibold transition-all ${
                   viewType === 'month'
                     ? 'bg-[#1c3068] text-white shadow-md'
                     : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                 }`}
               >
                 By Month
               </button>
             </div>
           </div>
           
           <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
             {viewType === 'month' ? (
               <div className="w-full md:w-64 space-y-2">
                 <label className="block text-sm font-bold text-[#1c3068]"><span className="text-[#c53336] mr-1">*</span> Month</label>
                 <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#1c3068] outline-none transition-all text-gray-700" />
               </div>
             ) : (
               <div className="w-full md:w-64 space-y-2">
                 <label className="block text-sm font-bold text-[#1c3068]"><span className="text-[#c53336] mr-1">*</span> Date</label>
                 <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#1c3068] outline-none transition-all text-gray-700" />
               </div>
             )}
             <div className="mt-4 md:mt-0 md:ml-auto self-end md:self-center pt-6">
               <button className="bg-[#1c3068] hover:bg-[#152450] text-white px-8 py-2.5 rounded-lg font-bold shadow-lg shadow-[#1c3068]/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0">Submit</button>
             </div>
           </div>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="bg-[#1c3068] p-4 flex items-center justify-center h-24">
             <Users size={40} className="text-white" />
          </div>
          <div className="flex border-t border-gray-100 divide-x divide-gray-100">
             <div className="flex-1 p-4 text-center">
               <p className="text-xl font-bold text-[#1c3068]">0</p>
               <p className="text-xs text-gray-500 uppercase tracking-wider">Present</p>
             </div>
             <div className="flex-1 p-4 text-center">
               <p className="text-xl font-bold text-[#c53336]">0</p>
               <p className="text-xs text-gray-500 uppercase tracking-wider">Absent</p>
             </div>
          </div>
        </div>
        <div className="bg-[#1c3068] rounded-xl shadow-sm p-6 flex flex-col items-center justify-center text-white">
           <p className="text-4xl font-bold mb-1">0.00 %</p>
           <p className="text-sm font-medium opacity-90">Total Present</p>
        </div>
        <div className="bg-[#c53336] rounded-xl shadow-sm p-6 flex flex-col items-center justify-center text-white">
           <p className="text-4xl font-bold mb-1">0.00 %</p>
           <p className="text-sm font-medium opacity-90">Total Absent</p>
        </div>
      </div>

      {/* Daily Attendance Volume Chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-100">
           <h3 className="text-lg font-bold text-[#1c3068]">
             {viewType === 'month' ? 'Daily Attendance Volume' : 'Attendance Summary'}
           </h3>
           <p className="text-gray-500 text-sm mt-1">
             {viewType === 'month' 
               ? 'Daily count of present (Blue) vs absent (Red).' 
               : 'Attendance breakdown for the selected date.'}
           </p>
        </div>
        <div className="p-6 h-[400px] w-full min-w-0 relative">
          {isMounted && (
            <>
              {viewType === 'month' ? (
                <div className="w-full h-full" style={{ minHeight: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Line type="monotone" dataKey="present" stroke="#1c3068" strokeWidth={3} dot={{ r: 4, fill: '#1c3068' }} name="Present" />
                      <Line type="monotone" dataKey="absent" stroke="#c53336" strokeWidth={3} dot={{ r: 4, fill: '#c53336' }} name="Absent" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <CircularProgressBar percentage={75.5} total={300} present={227} absent={73} />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* List Table with Sub-Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
           <p className="text-[#1c3068] font-bold text-lg capitalize">
             List of {activeTab} {viewType === 'month' ? 'in Month' : 'on Date'}
           </p>
           
           {/* Sub-tabs for Absent/Present */}
           <div className="bg-gray-100 p-1 rounded-lg flex">
              {(['absent', 'present'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setActiveStatusTab(status)}
                  className={`px-6 py-1.5 rounded-md text-xs font-bold transition-all capitalize ${
                    activeStatusTab === status
                      ? 'bg-white text-[#1c3068] shadow-sm'
                      : 'text-gray-500 hover:text-[#1c3068]'
                  }`}
                >
                  {status}
                </button>
              ))}
           </div>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <ExportButtons />
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm text-gray-500">Search:</span>
              <input type="text" className="w-full sm:w-48 px-3 py-1.5 bg-white border border-gray-200 rounded text-sm focus:border-[#1c3068] outline-none" />
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Name</th>
                  {activeTab === 'student' && (
                    <th className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Class</th>
                  )}
                  <th className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Date</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Attendance</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Time In</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Time Out</th>
                  
                  {activeStatusTab === 'present' && (
                    <>
                      <th className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Reason</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider">Location</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                 <tr>
                   <td 
                    colSpan={activeStatusTab === 'present' ? (activeTab === 'student' ? 8 : 7) : (activeTab === 'student' ? 6 : 5)} 
                    className="px-6 py-8 text-center text-gray-500 text-sm"
                   >
                     No data available in table
                   </td>
                 </tr>
              </tbody>
            </table>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
            <p className="text-sm text-gray-500">Showing 0 to 0 of 0 entries</p>
            <div className="flex gap-1">
              <button className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-500 hover:bg-gray-50" disabled>Previous</button>
              <button className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-500 hover:bg-gray-50" disabled>Next</button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const SummaryReport = () => {
  const [selectedDate, setSelectedDate] = useState('');

  // Mock data for the table
  const tableData = [
    { id: 1, className: '1 IBNU KHALDUN', teacher: 'NUR AIDA BINTI MD RAZALI', totalStudents: 0, present: 0, presentPercent: 0, absent: 0, absentPercent: 0 },
    { id: 2, className: '1 IBNU SINA', teacher: 'SHAHFIZAN BINTI CHE ON @ HARUN', totalStudents: 0, present: 0, presentPercent: 0, absent: 0, absentPercent: 0 },
    { id: 3, className: '2 IBNU KHALDUN', teacher: 'RIFHAN BINTI AHMAD', totalStudents: 19, present: 0, presentPercent: 0, absent: 0, absentPercent: 0 },
    { id: 4, className: '2 IBNU SINA', teacher: 'NOR HAYATI BINTI HUSSIN', totalStudents: 21, present: 0, presentPercent: 0, absent: 0, absentPercent: 0 },
    { id: 5, className: '3 IBNU KHALDUN', teacher: 'NADIA NASUHA BINTI MOHD SAIDI', totalStudents: 29, present: 0, presentPercent: 0, absent: 0, absentPercent: 0 },
    { id: 6, className: '3 IBNU SINA', teacher: 'ASLINA BINTI HAMZAH', totalStudents: 28, present: 0, presentPercent: 0, absent: 0, absentPercent: 0 },
    { id: 7, className: '4 IBNU KHALDUN', teacher: 'ROSWANITA BINTI ABDUL WAHAB', totalStudents: 29, present: 0, presentPercent: 0, absent: 0, absentPercent: 0 },
    { id: 8, className: '4 IBNU SINA', teacher: 'NOORHAYATI BINTI DOLLAH', totalStudents: 32, present: 0, presentPercent: 0, absent: 0, absentPercent: 0 },
    { id: 9, className: '5 IBNU KHALDUN', teacher: 'Aishah Fatimah binti Abu Bakar', totalStudents: 20, present: 0, presentPercent: 0, absent: 0, absentPercent: 0 },
    { id: 10, className: '5 IBNU SINA', teacher: 'RABITAH BINTI ABDULLAH', totalStudents: 22, present: 0, presentPercent: 0, absent: 0, absentPercent: 0 },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-full mx-auto"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#1c3068]">Summary Report</h2>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-8">
           <h3 className="text-lg font-bold text-[#1c3068] mb-6">Report</h3>
           <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
             <div className="w-full md:w-64 space-y-2">
               <label className="block text-sm font-bold text-[#1c3068]">
                 <span className="text-[#c53336] mr-1">*</span> Date
               </label>
               <input 
                 type="date" 
                 value={selectedDate}
                 onChange={(e) => setSelectedDate(e.target.value)}
                 className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-gray-700"
               />
               <p className="text-xs text-gray-400">dd-mm-yyyy</p>
             </div>

             <div className="mt-4 md:mt-0 md:ml-auto self-end md:self-center pt-6">
               <button className="bg-[#1c3068] hover:bg-[#152450] text-white px-8 py-2.5 rounded-lg font-bold shadow-lg shadow-[#1c3068]/20 transition-all">
                 Submit
               </button>
             </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="bg-[#1c3068] text-white p-4 flex items-center justify-center h-24">
             <Users size={40} />
          </div>
          <div className="flex border-t border-gray-100 divide-x divide-gray-100 bg-white">
             <div className="flex-1 p-4 text-center">
               <p className="text-xl font-bold text-[#1c3068]">0</p>
               <p className="text-xs text-gray-500 uppercase tracking-wider">Present</p>
             </div>
             <div className="flex-1 p-4 text-center">
               <p className="text-xl font-bold text-[#c53336]">0</p>
               <p className="text-xs text-gray-500 uppercase tracking-wider">Absent</p>
             </div>
          </div>
        </div>

        <div className="bg-[#1c3068] rounded-xl shadow-sm p-6 flex flex-col items-center justify-center text-white h-full min-h-[140px]">
           <p className="text-4xl font-bold mb-1">0</p>
           <p className="text-sm font-medium opacity-90">Total Present</p>
        </div>

        <div className="bg-[#c53336] rounded-xl shadow-sm p-6 flex flex-col items-center justify-center text-white h-full min-h-[140px]">
           <p className="text-4xl font-bold mb-1">0</p>
           <p className="text-sm font-medium opacity-90">Total Absent</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
           <p className="text-gray-500 text-sm">
             Click button above table to export to Copy, CSV, Excel, PDF & Print
           </p>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <ExportButtons />

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-sm text-gray-500">Search:</span>
              <input 
                type="text" 
                className="w-full sm:w-48 px-3 py-1.5 bg-white border border-gray-200 rounded text-sm focus:border-[#1c3068] outline-none transition-all"
              />
            </div>
          </div>
          
          <div className="mb-4">
             <p className="text-sm font-bold text-gray-800">Date : </p>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-gray-200">
                  <th className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">#</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Class Name</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Classroom Teacher</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Total Number of Students</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Present</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Present %</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Absent</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider">Absent %</th>
                </tr>
              </thead>
              <tbody>
                 {tableData.map((row) => (
                   <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                     <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-100">{row.id}</td>
                     <td className="px-4 py-3 text-sm text-[#c53336] font-medium border-r border-gray-100">{row.className}</td>
                     <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-100 uppercase">{row.teacher}</td>
                     <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-100">{row.totalStudents}</td>
                     <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-100">{row.present}</td>
                     <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-100">{row.presentPercent.toFixed(2)}</td>
                     <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-100">{row.absent}</td>
                     <td className="px-4 py-3 text-sm text-gray-600">{row.absentPercent.toFixed(2)}</td>
                   </tr>
                 ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
            <p className="text-sm text-gray-500">Showing 1 to {tableData.length} of {tableData.length} entries</p>
            <div className="flex gap-1">
              <button className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-500 hover:bg-gray-50" disabled>Previous</button>
              <button className="bg-[#c53336] text-white px-3 py-1 border border-[#c53336] rounded text-sm hover:bg-[#a02224]">1</button>
              <button className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-500 hover:bg-gray-50">Next</button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const CombinedAttendanceReports = () => {
  const [activeReport, setActiveReport] = useState('attendance');

  const renderReport = () => {
    switch (activeReport) {
      case 'attendance': return <AttendanceReport />;
      case 'absent': return <AbsentReport />;
      case 'infographic': return <InfographicReport />;
      case 'summary': return <SummaryReport />;
      default: return <AttendanceReport />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 overflow-x-auto">
        <div className="flex space-x-2 min-w-max">
          {[
            { id: 'attendance', label: 'Attendance Report' },
            { id: 'absent', label: 'Absent Report' },
            { id: 'infographic', label: 'Infographic Report' },
            { id: 'summary', label: 'Summary Report' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id)}
              className={`px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                activeReport === tab.id
                  ? 'bg-[#1c3068] text-white shadow-md'
                  : 'text-gray-500 hover:text-[#1c3068] hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <motion.div
        key={activeReport}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {renderReport()}
      </motion.div>
    </div>
  );
};

export default function AttendanceReportsPage() {
  return (
    <DashboardLayout activePageId="attendance-reports">
      <CombinedAttendanceReports />
    </DashboardLayout>
  );
}
