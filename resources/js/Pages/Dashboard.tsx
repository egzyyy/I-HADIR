import React, { useState } from 'react';
import { 
  GraduationCap, 
  Users, 
  Calendar, 
  Home, 
  Search, 
} from 'lucide-react';
import { motion } from 'motion/react';
import DashboardLayout from '../Layouts/DashboardLayout';
import { ExportButtons } from '../Components/dashboard/ExportButtons';
import { StatCard } from '../Components/dashboard/StatCard';
import { useAuth } from '../contexts/AuthContext';
import { TeacherDashboard } from '../Components/dashboards/TeacherDashboard';
import { SecurityDashboard } from '../Components/dashboards/SecurityDashboard';

const DashboardHome = () => {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState<'student' | 'teacher' | 'staff' | 'late'>('student');

  // Show role-specific dashboards
  if (role === 'Teacher') {
    return <TeacherDashboard />;
  }

  if (role === 'Security') {
    return <SecurityDashboard />;
  }

  // Admin Dashboard (default)

  // Dummy Data for each tab
  const attendanceData = {
    student: [
      { id: 1, name: 'Abdul Wahid bin Ahmad', class: '1 KREATIF', date: '29-01-2026', timeIn: '07:25 AM', timeOut: '01:30 PM', reason: '-' },
      { id: 2, name: 'Siti Sarah binti Ali', class: '1 PROGRESIF', date: '29-01-2026', timeIn: '07:20 AM', timeOut: '01:30 PM', reason: '-' },
    ],
    teacher: [
      { id: 1, name: 'Nur Badriah binti Zahidin', role: 'Teacher', date: '29-01-2026', timeIn: '07:10 AM', timeOut: '04:30 PM', reason: '-' },
      { id: 2, name: 'Mohd Fauzi bin Kassim', role: 'Teacher', date: '29-01-2026', timeIn: '07:15 AM', timeOut: '04:30 PM', reason: '-' },
    ],
    staff: [
      { id: 1, name: 'Anuar bin Osman', role: 'Security Staff', date: '29-01-2026', timeIn: '06:00 AM', timeOut: '06:00 PM', reason: '-' },
      { id: 2, name: 'Izzati Hazirah', role: 'Cleaning Staff', date: '29-01-2026', timeIn: '07:45 AM', timeOut: '03:45 PM', reason: '-' },
    ],
    late: [
      { id: 1, name: 'Joshua Wong', role: 'Student', date: '29-01-2026', timeIn: '08:15 AM', timeOut: '', reason: 'Traffic Jam' },
      { id: 2, name: 'Azam bin Karim', role: 'Staff', date: '29-01-2026', timeIn: '08:30 AM', timeOut: '', reason: 'Personal Matter' },
    ]
  };

  const currentData = attendanceData[activeTab];

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
            <h2 className="text-3xl md:text-4xl font-bold mb-2">School Session : Year 2026</h2>
            <p className="text-blue-100 max-w-2xl">
              Overview of school attendance, statistics and daily reports.
            </p>
          </div>
          
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="absolute left-0 bottom-0 w-48 h-48 bg-[#c53336]/20 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none"></div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
        <StatCard icon={Users} label="Total Users" value="368" colorClass="bg-[#c53336]" delay={0.1} />
        <StatCard icon={GraduationCap} label="Total Teachers" value="26" colorClass="bg-[#1c3068]" delay={0.2} />
        <StatCard icon={Users} label="Total Staff" value="25" colorClass="bg-[#cec43a]" delay={0.3} />
        <StatCard icon={Users} label="Total Students" value="317" colorClass="bg-teal-500" delay={0.4} />
        <StatCard icon={Home} label="Total Classes" value="16" colorClass="bg-purple-500" delay={0.5} />
      </div>

      {/* Attendance Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="text-xl font-bold text-[#1c3068]">Attendance List</h3>
            <p className="text-gray-500 text-sm mt-1">Daily records for {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</p>
          </div>
          <div className="flex bg-gray-50 p-1 rounded-lg">
            {(['student', 'teacher', 'staff', 'late'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-md text-sm font-semibold transition-all capitalize ${
                  activeTab === tab
                    ? 'bg-white text-[#1c3068] shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <ExportButtons />
            <div className="relative w-full sm:w-64">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search records..." 
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:border-[#1c3068] focus:ring-1 focus:ring-[#1c3068] outline-none transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                  {activeTab === 'student' && (
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Class</th>
                  )}
                  {(activeTab === 'staff' || activeTab === 'late' || activeTab === 'teacher') && (
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                  )}
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Time In</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Time Out</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Reason</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {currentData.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-700">{row.name}</td>
                    {activeTab === 'student' && <td className="px-6 py-4 text-sm text-gray-600">{(row as any).class}</td>}
                    {(activeTab === 'staff' || activeTab === 'late' || activeTab === 'teacher') && (
                        <td className="px-6 py-4 text-sm text-gray-600">{(row as any).role}</td>
                    )}
                    <td className="px-6 py-4 text-sm text-gray-600">{row.date}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                        <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-bold">{row.timeIn}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{row.timeOut || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{row.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center mt-6 text-sm text-gray-500">
            <p>Showing {currentData.length} entries</p>
            <div className="flex gap-2">
              <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50" disabled>Previous</button>
              <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50" disabled>Next</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default function Dashboard() {
  return (
    <DashboardLayout activePageId="dashboard">
      <DashboardHome />
    </DashboardLayout>
  );
}
