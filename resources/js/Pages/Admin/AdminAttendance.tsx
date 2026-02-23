import React from 'react';
import { 
  Home, 
  Calendar, 
  Search, 
  Copy, 
  FileText, 
  FileSpreadsheet, 
  FileType, 
  Printer, 
  ChevronLeft, 
  ChevronRight,
  ArrowUpDown
} from 'lucide-react';
import { motion } from 'motion/react';
import DashboardLayout from '@/Layouts/DashboardLayout';

const ExportButton = ({ icon: Icon, label, color = "bg-[#1c3068]", textColor = "text-white" }: any) => (
  <button className={`flex items-center gap-2 px-4 py-2.5 ${color} ${textColor} rounded-xl hover:opacity-90 transition-all font-bold text-sm shadow-sm shadow-gray-200 transform active:scale-95`}>
    <Icon size={16} strokeWidth={2} /> 
    <span>{label}</span>
  </button>
);

export default function AdminAttendance() {
  return (
    <DashboardLayout activePageId="my-attendance">
      <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-full mx-auto"
    >
      {/* Header Section */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-[#1c3068] tracking-tight">My Attendance</h2>
          <p className="text-gray-500 text-sm mt-1">View your personal attendance history and logs.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 text-gray-500">
           <Home size={14} />
           <span>Dashboard</span>
           <span className="text-gray-300">/</span>
           <span className="text-[#c53336]">My Attendance</span>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Helper Text */}
        <div className="p-6 border-b border-gray-100 bg-[#f8f9fa]">
          <div className="flex items-center gap-3 text-sm text-gray-600 bg-blue-50 p-4 rounded-xl border border-blue-100">
            <div className="w-5 h-5 rounded-full bg-[#1c3068] text-white flex items-center justify-center flex-shrink-0 font-bold text-xs">i</div>
            <p>Click the buttons below to export your attendance data to Copy, CSV, Excel, PDF, or Print format.</p>
          </div>
        </div>

        <div className="p-6 md:p-8 space-y-6">
          {/* Action Bar */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <ExportButton icon={Copy} label="Copy" color="bg-[#c53336]" />
              <ExportButton icon={FileText} label="CSV" />
              <ExportButton icon={FileSpreadsheet} label="Excel" />
              <ExportButton icon={FileType} label="PDF" />
              <ExportButton icon={Printer} label="Print" color="bg-white" textColor="text-[#1c3068] border border-gray-200" />
            </div>

            <div className="w-full md:w-auto">
              <div className="relative group">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-[#1c3068] transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search records..." 
                  className="w-full md:w-64 pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all text-sm font-medium"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8f9fa] border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group select-none">
                    <div className="flex items-center justify-between">
                      <span>Date</span>
                      <ArrowUpDown size={14} className="text-gray-300 group-hover:text-gray-500" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group select-none">
                    <div className="flex items-center justify-between">
                      <span>Time In</span>
                      <ArrowUpDown size={14} className="text-gray-300 group-hover:text-gray-500" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group select-none">
                    <div className="flex items-center justify-between">
                      <span>Time Out</span>
                      <ArrowUpDown size={14} className="text-gray-300 group-hover:text-gray-500" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group select-none">
                    <div className="flex items-center justify-between">
                      <span>Temperature</span>
                      <ArrowUpDown size={14} className="text-gray-300 group-hover:text-gray-500" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {/* Empty State Row */}
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-gray-400 bg-white">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
                        <Calendar size={24} className="text-gray-300" />
                      </div>
                      <p className="font-medium text-gray-500">No data available in table</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500 pt-2">
            <p>Showing 0 to 0 of 0 entries</p>
            <div className="flex items-center gap-2">
              <button 
                disabled 
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-[#1c3068] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-1"
              >
                Previous
              </button>
              <button 
                disabled 
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-[#1c3068] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-1"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
      </motion.div>
    </DashboardLayout>
  );
}