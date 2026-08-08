import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Calendar, Users, GraduationCap, CheckCircle, QrCode, Keyboard, BarChart3 } from 'lucide-react';
import axios from 'axios';
import { MyQrModal } from '../modals/MyQrModal';

type RecentEntry = {
  name: string;
  status: string;
  time: string | null;
  timestamp: number | null;
};

type TeacherDashboardData = {
  total_students: number;
  present_today: number;
  classes_count: number;
  recent: RecentEntry[];
};

const STATUS_BADGE: Record<string, { label: string; badge: string }> = {
  present: { label: 'Entered', badge: 'text-green-700 bg-green-50' },
  late:    { label: 'Late Arrival', badge: 'text-orange-700 bg-orange-50' },
  absent:  { label: 'Marked Absent', badge: 'text-red-700 bg-red-50' },
};

const todayLabel = new Date().toLocaleDateString('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<TeacherDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrOpen, setQrOpen] = useState(false);

  useEffect(() => {
    axios.get('/api/attendance/teacher-dashboard')
      .then((res) => setData(res.data.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[#2f4fa8] to-[#2a4595] rounded-3xl p-8 mb-10 text-white shadow-xl relative overflow-hidden"
      >
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium mb-3">
               <Calendar size={16} />
               <span>{todayLabel}</span>
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
              <Users className="text-[#2f4fa8]" size={24} />
            </div>
          </div>
          <h4 className="text-2xl font-bold text-gray-800 mb-1">{loading ? '—' : data?.total_students ?? 0}</h4>
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
          <h4 className="text-2xl font-bold text-gray-800 mb-1">{loading ? '—' : data?.present_today ?? 0}</h4>
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
              <GraduationCap className="text-purple-600" size={24} />
            </div>
          </div>
          <h4 className="text-2xl font-bold text-gray-800 mb-1">{loading ? '—' : data?.classes_count ?? 0}</h4>
          <p className="text-gray-500 text-sm">My Classes</p>
        </motion.div>
      </div>

      {/* My Class — Recent Attendance */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="text-xl font-bold text-[#2f4fa8] mb-4">My Class — Recent Attendance</h3>
        <div className="space-y-3">
          {loading && (
            <p className="text-sm text-gray-400 text-center py-6">Loading...</p>
          )}
          {!loading && (data?.recent.length ?? 0) === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">
              {data?.classes_count === 0
                ? "You don't have a class assigned yet."
                : 'No attendance recorded for your class today.'}
            </p>
          )}
          {!loading && data?.recent.map((entry, index) => {
            const cfg = STATUS_BADGE[entry.status] ?? { label: entry.status, badge: 'text-gray-700 bg-gray-100' };
            return (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="text-sm font-medium text-gray-600 w-20">{entry.time}</div>
                  <p className="font-semibold text-gray-800">{entry.name}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${cfg.badge}`}>
                  {cfg.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-xl font-bold text-[#2f4fa8] mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/attendance-log/check-in')}
            className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors"
          >
            <p className="font-semibold text-[#2f4fa8]">Check In</p>
            <p className="text-sm text-gray-600 mt-1">Scan your own QR to check in</p>
          </button>
          <button
            onClick={() => navigate('/attendance-log/check-in?mode=check-out')}
            className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-left transition-colors"
          >
            <p className="font-semibold text-[#2f4fa8]">Check Out</p>
            <p className="text-sm text-gray-600 mt-1">Scan your own QR to check out</p>
          </button>
          <button
            onClick={() => navigate('/manual-entry')}
            className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-left transition-colors"
          >
            <p className="font-semibold text-green-700 flex items-center gap-2"><Keyboard size={16} /> Take Attendance</p>
            <p className="text-sm text-gray-600 mt-1">Mark students present/absent</p>
          </button>
          <button
            onClick={() => navigate('/attendance-reports')}
            className="p-4 bg-teal-50 hover:bg-teal-100 rounded-lg text-left transition-colors"
          >
            <p className="font-semibold text-teal-700 flex items-center gap-2"><BarChart3 size={16} /> View Reports</p>
            <p className="text-sm text-gray-600 mt-1">Check attendance reports</p>
          </button>
          <button
            onClick={() => setQrOpen(true)}
            className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition-colors"
          >
            <p className="font-semibold text-purple-700 flex items-center gap-2"><QrCode size={16} /> Generate My QR Code</p>
            <p className="text-sm text-gray-600 mt-1">For self check-in/out</p>
          </button>
        </div>
      </div>

      <MyQrModal isOpen={qrOpen} onClose={() => setQrOpen(false)} />
    </>
  );
};
