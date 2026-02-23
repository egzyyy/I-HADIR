import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Edit, X } from 'lucide-react';
import DashboardLayout from '../../Layouts/DashboardLayout';

const AttendanceTimeSetting = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTimeRow, setSelectedTimeRow] = useState<any>(null);

  // Dummy Data for Time Settings
  const dummyData = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    title: i % 2 === 0 ? 'Normal Class' : 'Special Class',
    time: '07:30',
  }));

  const handleChangeTimeClick = (item: any) => {
    setSelectedTimeRow(item);
    setIsModalOpen(true);
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-full mx-auto"
      >
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#1c3068]">Time Setting</h2>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6">
             <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                     <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Title</th>
                     <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Time</th>
                     <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dummyData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-700">{item.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.time}</td>
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => handleChangeTimeClick(item)}
                          className="group relative px-5 py-2.5 bg-gradient-to-r from-[#1c3068] to-[#2a4a8f] text-white rounded-lg font-bold hover:shadow-lg hover:shadow-[#1c3068]/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 text-sm"
                        >
                          <Clock size={16} className="group-hover:rotate-12 transition-transform" />
                          Change Time
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isModalOpen && (
          <ChangeTimeModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            timeData={selectedTimeRow} 
          />
        )}
      </AnimatePresence>
    </>
  );
};

const ChangeTimeModal = ({ isOpen, onClose, timeData }: any) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden relative"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
          <h3 className="text-xl text-gray-700 font-medium">New time</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="block text-sm text-gray-600">Time</label>
            <input 
              type="text" 
              placeholder="HH:mm"
              defaultValue={timeData?.time}
              className="w-full px-4 py-3 rounded border border-gray-200 focus:border-[#0ea5e9] outline-none transition-all text-gray-700 placeholder:text-gray-300" 
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-white">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition-all text-sm"
          >
            Close
          </button>
          <button 
            type="button"
            className="bg-[#0ea5e9] hover:bg-[#0284c7] text-white px-6 py-2 rounded font-medium transition-all text-sm"
          >
            Save
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default function TimeSettingPage() {
  return (
    <DashboardLayout activePageId="time-setting">
      <AttendanceTimeSetting />
    </DashboardLayout>
  );
}
