import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ChevronDown, Eye, Printer, Trash2, Info, Users } from 'lucide-react';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { ExportButtons } from '../../Components/dashboard/ExportButtons';
import { UserInfoModal } from '../../Components/modals/UserInfoModal';
import { DeleteConfirmationModal } from '../../Components/modals/DeleteConfirmationModal';

// Updated User List to include Info, Print, and Delete icons
const UserListUnified = () => {
  const [activeTab, setActiveTab] = useState<'student' | 'teacher' | 'staff'>('staff');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;
  
  // Modal states
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Mock data generation logic...
  const dummyData = Array.from({ length: 150 }, (_, i) => ({
    id: i + 1,
    name: ['Abdul Wahid bin Ahmad', 'FAREZZATUN NAJIHAH BINTI DARUS', 'HALIMATUN HUSNA BINTI ABDUL WAHIDI'][i % 3] + (i > 2 ? ` ${i}` : ''),
    phone: ['01129421940', '011-29248790', '01181328075'][i % 3] || '012-3456789',
    gender: i % 2 === 0 ? 'Male' : 'Female',
    role: activeTab === 'staff' ? ['SecurityStaff', 'TemporaryStaff', 'CleaningStaff'][i % 3] : activeTab,
    registeredDate: ['31-03-2024', '15-02-2025', '22-02-2024'][i % 3] || '01-01-2026'
  }));

  const totalPages = Math.ceil(dummyData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, dummyData.length);
  const currentData = dummyData.slice(startIndex, endIndex);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const handleInfoClick = (user: any) => {
    setSelectedUser(user);
    setIsInfoModalOpen(true);
  };

  const handleDeleteClick = (user: any) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    // In a real app, you would delete the user here
    console.log('Deleting user:', selectedUser);
    setIsDeleteModalOpen(false);
    setSelectedUser(null);
  };

  return (
    <>
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-full mx-auto"
    >
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#1c3068] flex items-center gap-2">User List</h2>
            <p className="text-gray-400 text-xs mt-1">List of registered users as of {today}</p>
          </div>
          
          <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-100">
            {(['student', 'teacher', 'staff'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
                className={`px-6 py-2 rounded-md text-sm font-bold transition-all capitalize ${
                  activeTab === tab 
                    ? 'bg-white text-[#1c3068] shadow-sm' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
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
            <div className="flex items-center gap-2 w-full sm:w-auto">
               <div className="relative w-full">
                 <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                 <input 
                   type="text" 
                   placeholder="Search records..."
                   className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-50 outline-none bg-gray-50 focus:bg-white transition-all"
                 />
               </div>
            </div>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg max-h-[600px] relative">
            <table className="w-full text-left border-collapse relative">
              <thead className="sticky top-0 z-10 shadow-sm">
                <tr className="bg-gray-50 border-b border-gray-200">
                   <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider w-12 text-center whitespace-nowrap bg-gray-50">#</th>
                   <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap bg-gray-50">Name</th>
                   <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap bg-gray-50">Phone No</th>
                   <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-center whitespace-nowrap bg-gray-50">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-500 text-center">{item.id}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[#1c3068]">{item.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono">{item.phone}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center items-center gap-2">
                        {/* Info Action Button */}
                        <button 
                          onClick={() => handleInfoClick(item)}
                          className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100" 
                          title="View Info"
                        >
                           <Info size={16} />
                        </button>
                        {/* Print Action Button */}
                        <button className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100" title="Print Details">
                          <Printer size={16} />
                        </button>
                        {/* Delete Action Button */}
                        <button 
                          onClick={() => handleDeleteClick(item)}
                          className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm border border-red-100" 
                          title="Delete User"
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

          <div className="flex flex-col sm:flex-row justify-between items-center mt-6 text-sm text-gray-500 gap-4">
            <p>Showing {startIndex + 1} to {endIndex} of {dummyData.length} entries</p>
            <div className="flex gap-1">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded border ${
                    currentPage === page 
                      ? 'bg-[#c53336] text-white border-[#c53336]' 
                      : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>

    <AnimatePresence>
      {isInfoModalOpen && (
        <UserInfoModal 
          isOpen={isInfoModalOpen} 
          onClose={() => setIsInfoModalOpen(false)} 
          user={selectedUser} 
        />
      )}
      {isDeleteModalOpen && (
        <DeleteConfirmationModal 
          isOpen={isDeleteModalOpen} 
          onClose={() => setIsDeleteModalOpen(false)} 
          onConfirm={handleConfirmDelete}
          userName={selectedUser?.name}
        />
      )}
    </AnimatePresence>
    </>
  );
};

const UserListComponent = ({ type }: { type: 'staff' | 'teacher' | 'student' }) => {
  const title = type.charAt(0).toUpperCase() + type.slice(1) + " List";

  // Dummy Data for Table
  const dummyData = Array.from({ length: 17 }, (_, i) => ({
    id: i + 1,
    name: ['Abdul Wahid bin Ahmad', 'FAREZZATUN NAJIHAH BINTI DARUS', 'HALIMATUN HUSNA BINTI ABDUL WAHIDI'][i % 3] || 'User Name ' + (i+1),
    phone: ['01129421940', '011-29248790', '01181328075'][i % 3] || '012-3456789',
    gender: i % 2 === 0 ? 'Male' : 'Female',
    role: type === 'staff' ? ['SecurityStaff', 'TemporaryStaff', 'CleaningStaff'][i % 3] : type,
    registeredDate: ['31-03-2024', '26-01-2026', '15-05-2025'][i % 3] || '01-01-2026'
  }));

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-full mx-auto"
    >
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[#1c3068]">{title}</h2>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6">
          <p className="text-gray-500 text-sm mb-4">Click button above table to export to Copy, CSV, Excel, PDF & Print</p>
          
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
            <ExportButtons />

            <div className="flex items-center gap-2">
               <span className="text-sm font-semibold text-gray-600">Search:</span>
               <input 
                 type="text" 
                 className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
               />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                   <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider w-12">#</th>
                   <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Name</th>
                   <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Phone Number</th>
                   <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Gender</th>
                   <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Role</th>
                   <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider">Registered Date</th>
                   <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dummyData.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-500">{user.id}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[#c53336]">{user.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.phone}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.gender}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.role}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{user.registeredDate}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <button className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-[#2563eb] hover:text-white transition-all shadow-sm border border-blue-100 hover:border-[#2563eb]" title="View Details">
                          <Eye size={16} />
                        </button>
                        <button className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-[#4f46e5] hover:text-white transition-all shadow-sm border border-indigo-100 hover:border-[#4f46e5]" title="Print">
                          <Printer size={16} />
                        </button>
                        <button className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-[#c53336] hover:text-white transition-all shadow-sm border border-red-100 hover:border-[#c53336]" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-6 text-sm text-gray-500 gap-4">
            <p>Showing 1 to 17 of 25 entries</p>
            <div className="flex gap-1">
              <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 text-gray-600">Previous</button>
              <button className="px-3 py-1 bg-[#fca5a5] text-white rounded border border-[#fca5a5]">1</button>
              <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 text-gray-600">2</button>
              <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 text-gray-600">Next</button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function UserListPage() {
  return (
    <DashboardLayout activePageId="user-list">
      <UserListUnified />
    </DashboardLayout>
  );
}
