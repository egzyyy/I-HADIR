import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Calendar, ChevronDown, ChevronRight, Download, Filter, Users, Eye, Trash2, Info, Printer, Phone, Clock } from 'lucide-react';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { ExportButtons } from '../../Components/dashboard/ExportButtons';
import { DeleteConfirmationModal } from '../../Components/modals/DeleteConfirmationModal';


const FacilityReport = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedFacility, setSelectedFacility] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  // Mock data for the table
  const tableData: any[] = []; // Empty as per "No data available in table" in screenshot

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-full mx-auto"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#1c3068]">
          {selectedFacility ? `${selectedFacility} Report` : 'Facility Report'}
        </h2>
        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
           <span>Home</span>
           <ChevronRight size={14} />
           <span className="text-[#1c3068] font-medium">
             {selectedFacility ? `${selectedFacility} Report` : 'Facility Report'}
           </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-8">
           <h3 className="text-lg font-bold text-[#1c3068] mb-6">Report</h3>
           <div className="flex flex-col gap-6">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {/* Facility Type Selector */}
               <div className="space-y-2">
                 <label className="block text-sm font-bold text-[#1c3068]">
                   <span className="text-[#c53336] mr-1">*</span> Facility
                 </label>
                 <div className="relative">
                   <select 
                     value={selectedFacility}
                     onChange={(e) => setSelectedFacility(e.target.value)}
                     className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all appearance-none text-gray-700"
                   >
                     <option value="">Select Facility...</option>
                     <option value="Prayer">Prayer</option>
                     <option value="PSS">PSS</option>
                     <option value="ICT">ICT</option>
                   </select>
                   <ChevronDown size={16} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                 </div>
               </div>

               {/* Date Selector */}
               <div className="space-y-2">
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

               {/* Class Selector */}
               <div className="space-y-2">
                 <label className="block text-sm font-bold text-[#1c3068]">
                   <span className="text-[#c53336] mr-1">*</span> Class
                 </label>
                 <div className="relative">
                   <select 
                     value={selectedClass}
                     onChange={(e) => setSelectedClass(e.target.value)}
                     className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all appearance-none text-gray-700"
                   >
                     <option value="">Select..</option>
                     <option value="1 IBNU KHALDUN">1 IBNU KHALDUN</option>
                     <option value="1 IBNU SINA">1 IBNU SINA</option>
                     <option value="2 IBNU KHALDUN">2 IBNU KHALDUN</option>
                     <option value="2 IBNU SINA">2 IBNU SINA</option>
                   </select>
                   <ChevronDown size={16} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                 </div>
               </div>
             </div>

             <div className="flex justify-end pt-2">
               <button className="bg-[#1c3068] hover:bg-[#152450] text-white px-8 py-2.5 rounded-lg font-bold shadow-lg shadow-[#1c3068]/20 transition-all">
                 Submit
               </button>
             </div>
           </div>
        </div>
      </div>

      {selectedFacility && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Card 1: Present/Absent Split */}
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

            {/* Card 2: Total Present */}
            <div className="bg-[#1c3068] rounded-xl shadow-sm p-6 flex flex-col items-center justify-center text-white h-full min-h-[140px]">
               <p className="text-4xl font-bold mb-1">0</p>
               <p className="text-sm font-medium opacity-90">Total Present</p>
            </div>

            {/* Card 3: Total Absent */}
            <div className="bg-[#c53336] rounded-xl shadow-sm p-6 flex flex-col items-center justify-center text-white h-full min-h-[140px]">
               <p className="text-4xl font-bold mb-1">0</p>
               <p className="text-sm font-medium opacity-90">Total Absent</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
               <p className="text-gray-500 text-sm">
                 Student attendance list on
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
                      <th className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Name</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Class</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Date</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Attendance</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Time In</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Time Out</th>
                      <th className="px-4 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                     {tableData.length > 0 ? (
                       tableData.map((row, index) => (
                         <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                           {/* Data Row */}
                         </tr>
                       ))
                     ) : (
                       <tr>
                         <td colSpan={7} className="px-4 py-8 text-center text-gray-500 text-sm">
                           No data available in table
                         </td>
                       </tr>
                     )}
                  </tbody>
                  {/* Replicating the footer from image which shows input-like headers at bottom */}
                  <tfoot className="border-t border-gray-200">
                     <tr className="bg-white">
                        <th className="px-4 py-3 text-xs font-bold text-gray-800 border-r border-gray-100">Name</th>
                        <th className="px-4 py-3 text-xs font-bold text-gray-800 border-r border-gray-100">Class</th>
                        <th className="px-4 py-3 text-xs font-bold text-gray-800 border-r border-gray-100">Date</th>
                        <th className="px-4 py-3 text-xs font-bold text-gray-800 border-r border-gray-100">Attendance</th>
                        <th className="px-4 py-3 text-xs font-bold text-gray-800 border-r border-gray-100">Time In</th>
                        <th className="px-4 py-3 text-xs font-bold text-gray-800 border-r border-gray-100">Time Out</th>
                        <th className="px-4 py-3 text-xs font-bold text-gray-800">Reason</th>
                     </tr>
                  </tfoot>
                </table>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
                <p className="text-sm text-gray-500">Showing 0 to 0 of 0 entries</p>
                <div className="flex gap-1">
                  <button className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-500 hover:bg-gray-50" disabled>Previous</button>
                  <button className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-500 hover:bg-gray-50">Next</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};

const ActivityReport = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');

  // Mock data for the table
  const students = [
    { name: 'NUR AISHAH BINTI AHMAD', class: '1 IBNU KHALDUN', date: '30-01-2026', timeIn: '07:30 AM', timeOut: '01:00 PM' },
    { name: 'MUHAMMAD AMIRUL BIN ROSLI', class: '1 IBNU SINA', date: '30-01-2026', timeIn: '07:35 AM', timeOut: '01:00 PM' },
    { name: 'SITI NURHALIZA BINTI OTHMAN', class: '2 IBNU KHALDUN', date: '30-01-2026', timeIn: '07:28 AM', timeOut: '01:00 PM' },
    { name: 'AHMAD FAIZAL BIN HUSSEIN', class: '2 IBNU SINA', date: '30-01-2026', timeIn: '07:40 AM', timeOut: '01:00 PM' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-full mx-auto"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#1c3068]">Activity Report</h2>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-8">
           <h3 className="text-lg font-bold text-[#1c3068] mb-6">Report</h3>
           
           <div className="flex flex-col gap-6">
             {/* Row 1: Input Filters */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {/* Event Selector */}
               <div className="space-y-2">
                 <label className="block text-sm font-bold text-[#1c3068]">
                   <span className="text-[#c53336] mr-1">*</span> Event Name
                 </label>
                 <div className="relative">
                   <select 
                     value={selectedEvent}
                     onChange={(e) => setSelectedEvent(e.target.value)}
                     className="w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 focus:border-[#1c3068] focus:ring-2 focus:ring-[#1c3068]/10 outline-none transition-all appearance-none text-gray-700 cursor-pointer"
                   >
                     <option value="">Select Event...</option>
                     <option value="Hari Anugerah Kecemerlangan 2023">Hari Anugerah Kecemerlangan 2023</option>
                     <option value="Sports Day 2026">Sports Day 2026</option>
                     <option value="Science Fair">Science Fair</option>
                   </select>
                   <ChevronDown size={16} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                 </div>
               </div>

               {/* Date Selector */}
               <div className="space-y-2">
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
             </div>

             {/* Row 2: Submit Button aligned most right */}
             <div className="flex justify-end pt-2">
               <button className="bg-[#1c3068] hover:bg-[#152450] text-white px-8 py-2.5 rounded-lg font-bold shadow-lg shadow-[#1c3068]/20 transition-all transform active:scale-95">
                 Submit
               </button>
             </div>
           </div>
        </div>
      </div>

      {selectedEvent && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
             <p className="text-[#1c3068] font-semibold text-lg">
               Student attendance list on
             </p>
          </div>
          
          <div className="p-6">
             <div className="overflow-x-auto border border-gray-200 rounded-lg">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-white border-b border-gray-200">
                      <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Name</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Class</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Date</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Time In</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider">Time Out</th>
                   </tr>
                 </thead>
                 <tbody>
                    {students.map((student, index) => (
                      <tr key={index} className="hover:bg-gray-50/50 transition-colors border-b border-gray-100 last:border-0">
                        <td className="px-6 py-4 text-sm font-semibold text-gray-800 border-r border-gray-100">{student.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 border-r border-gray-100">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                            {student.class}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 border-r border-gray-100">
                          <div className="flex items-center gap-2">
                             <Calendar size={14} className="text-[#c53336]" />
                             {student.date}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 border-r border-gray-100">
                          <span className="text-green-600 font-medium bg-green-50 px-2 py-1 rounded border border-green-100 inline-block text-xs">
                             {student.timeIn}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          <span className="text-red-500 font-medium bg-red-50 px-2 py-1 rounded border border-red-100 inline-block text-xs">
                             {student.timeOut}
                          </span>
                        </td>
                      </tr>
                    ))}
                 </tbody>
               </table>
             </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

const VisitorReport = () => {
  const [activeMonth, setActiveMonth] = useState(1);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<any>(null);

  // Visitors list in state to handle real-time deletion
  const [visitorList, setVisitorList] = useState([
    { id: 1, name: 'Anuar', phone: '0149697104', dept: 'Yakult', note: 'Kedai buku', time: '09:24:49am', date: '27-01-2026' },
    { id: 2, name: 'Anuar', phone: '0149697104', dept: 'Yakult', note: 'Kedai buku', time: '08:33:07am', date: '20-01-2026' },
    { id: 3, name: 'Azam', phone: '0183711749', dept: 'Driver', note: 'Htr brg pj', time: '10:07:47am', date: '29-01-2026' },
    { id: 4, name: 'Azam', phone: '0183711749', dept: 'Driver', note: 'Htr brg pj', time: '11:43:43am', date: '20-01-2026' },
    { id: 5, name: 'Azwan Abd Rahman', phone: '0199684079', dept: 'Dewan', note: 'Ambil bantuan', time: '09:16:42am', date: '19-01-2026' },
    { id: 6, name: 'FENE BINTI AWANG CHIK', phone: '+60134740996', dept: 'Pejabat', note: 'Ambil anak sakit', time: '08:37:57am', date: '20-01-2026' },
    { id: 7, name: 'Hidayah', phone: '0199191878', dept: 'Bantuan', note: 'Rk', time: '09:08:07am', date: '19-01-2026' },
    { id: 8, name: 'Izzati Hazirah', phone: '0148404955', dept: 'Dewan', note: 'Bantuan Tunas Makmur', time: '09:11:33am', date: '19-01-2026' },
    { id: 9, name: 'Joshua', phone: '0189000571', dept: 'guoh stationery', note: 'Kedai buku', time: '08:13:55am', date: '27-01-2026' },
    { id: 10, name: 'Khairul Abidin Bin Mohamad', phone: '0189045832', dept: 'Sbp Integrasi Tun Abdul Razak', note: 'Ambil anak sakit', time: '11:18:19am', date: '19-01-2026' },
  ]);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  const handleDeleteClick = (visitor: any) => {
    setSelectedVisitor(visitor);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    setVisitorList(prev => prev.filter(v => v.id !== selectedVisitor.id));
    setIsDeleteModalOpen(false);
    setSelectedVisitor(null);
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-full mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#1c3068]">Visitor List</h2>
          <p className="text-gray-500 text-sm mt-1">Click the <span className="text-[#c53336] font-medium">month</span> tab below to display the list.</p>
        </div>

        {/* Month Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 mb-6 overflow-x-auto">
          <div className="flex space-x-2 min-w-max">
            {months.map((month) => (
              <button
                key={month}
                onClick={() => setActiveMonth(month)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-all duration-200 
                  ${activeMonth === month ? 'bg-[#c53336] text-white shadow-md shadow-red-200 scale-105' : 'text-gray-500 hover:bg-gray-100 hover:text-[#1c3068]'}`}
              >
                {month}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
             <p className="text-[#1c3068] font-semibold text-lg">
               Visitor list on {monthNames[activeMonth - 1]}
             </p>
          </div>
          
          <div className="p-6">
             <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                <ExportButtons />
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <span className="text-sm text-gray-500">Search:</span>
                  <div className="relative w-full sm:w-64">
                    <input 
                      type="text" 
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded text-sm focus:border-[#1c3068] outline-none transition-all"
                      placeholder="Type to search..."
                    />
                  </div>
                </div>
             </div>

             <div className="overflow-x-auto border border-gray-200 rounded-lg">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-white border-b border-gray-200">
                      <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100 w-12 text-center">#</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Name / Phone</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Department</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Note</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider border-r border-gray-100">Date / Time</th>
                      <th className="px-6 py-3 text-xs font-bold text-gray-800 uppercase tracking-wider text-center">Action</th>
                   </tr>
                 </thead>
                 <tbody>
                    {visitorList.map((visitor) => (
                      <tr key={visitor.id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-100 last:border-0">
                        <td className="px-6 py-4 text-sm text-gray-500 text-center border-r border-gray-100 font-mono">{visitor.id}</td>
                        <td className="px-6 py-4 text-sm border-r border-gray-100">
                          <div className="flex flex-col">
                             <span className="font-bold text-[#1c3068] text-sm md:text-base">{visitor.name}</span>
                             <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                <Phone size={12} />
                                <span>{visitor.phone}</span>
                             </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm border-r border-gray-100">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                            {visitor.dept}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 border-r border-gray-100 max-w-xs truncate" title={visitor.note}>
                          {visitor.note}
                        </td>
                        <td className="px-6 py-4 text-sm border-r border-gray-100">
                          <div className="flex flex-col text-xs text-gray-500">
                             <span className="flex items-center gap-1">
                                <Calendar size={12} className="text-[#c53336]" /> {visitor.date}
                             </span>
                             <span className="flex items-center gap-1 mt-0.5">
                                <Clock size={12} className="text-[#1c3068]" /> {visitor.time}
                             </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center">
                            <button 
                              onClick={() => handleDeleteClick(visitor)}
                              className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-[#c53336] hover:text-white transition-all shadow-sm border border-red-100 hover:border-[#c53336]" 
                              title="Delete"
                            >
                               <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                 </tbody>
               </table>
             </div>
             
             {/* RESTORED Pagination Section */}
             <div className="mt-6 flex justify-end gap-2">
                <button className="px-3 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded border border-gray-200">Previous</button>
                <button className="px-3 py-1 text-xs text-white bg-[#F87171] rounded shadow-sm">1</button>
                <button className="px-3 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded border border-gray-200">2</button>
                <button className="px-3 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded border border-gray-200">3</button>
                <button className="px-3 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded border border-gray-200">Next</button>
             </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isDeleteModalOpen && (
          <DeleteConfirmationModal 
            isOpen={isDeleteModalOpen} 
            onClose={() => setIsDeleteModalOpen(false)} 
            onConfirm={handleConfirmDelete} 
            userName={selectedVisitor?.name} 
          />
        )}
      </AnimatePresence>
    </>
  );
};

const GeneralReport = () => {
  const [activeReport, setActiveReport] = useState('facility');

  const renderReport = () => {
    switch (activeReport) {
      case 'facility': return <FacilityReport />;
      case 'activity': return <ActivityReport />;
      case 'visitor': return <VisitorReport />;
      default: return <FacilityReport />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 overflow-x-auto">
        <div className="flex space-x-2 min-w-max">
          {[
            { id: 'facility', label: 'Facility Report' },
            { id: 'activity', label: 'Activity Report' },
            { id: 'visitor', label: 'Visitor Report' },
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

export default function GeneralReportPage() {
  return (
    <DashboardLayout activePageId="general-report">
      <GeneralReport />
    </DashboardLayout>
  );
}
