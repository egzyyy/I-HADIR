import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Info, Printer, Trash2 } from 'lucide-react';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { ExportButtons } from '../../Components/dashboard/ExportButtons';
import { UserInfoModal } from '../../Components/modals/UserInfoModal';
import { DeleteConfirmationModal } from '../../Components/modals/DeleteConfirmationModal';
import axios from 'axios';

// Ensure Axios acts as an XHR request for Laravel
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

const UserListUnified = () => {
  const [activeTab, setActiveTab] = useState<'student' | 'teacher' | 'staff'>('staff');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 100;
  
  // Real Data States
  const [allUsers, setAllUsers] = useState({ student: [], teacher: [], staff: [] });
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Fetch data from Laravel
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('/api/users');
      setAllUsers(response.data);
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter Data based on Active Tab and Search Query
  const activeData = allUsers[activeTab] || [];
  const filteredData = activeData.filter((user: any) => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.phone.includes(searchQuery)
  );

  // Pagination Logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);
  const currentData = filteredData.slice(startIndex, endIndex);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const handleInfoClick = (user: any) => {
    setSelectedUser(user);
    setIsInfoModalOpen(true);
  };

  const handleDeleteClick = (user: any) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  // Real Delete Execution
  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    try {
      await axios.delete(`/api/users/${selectedUser.type}/${selectedUser.id}`);
      // Refresh the table data after deletion
      fetchUsers();
    } catch (error) {
      console.error("Failed to delete user", error);
      alert("Failed to delete user. Please try again.");
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
    }
  };

  // FORMATTING HELPER: Converts raw DB values to readable labels
  const formatRoleLabel = (role: string, type: string) => {
    if (!role) return '-';
    
    if (type === 'staff') {
      // Converts "cleaning_staff" -> "Cleaning Staff"
      return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
    
    if (type === 'student') {
      // Converts "1-kreatif" -> "1 Kreatif"
      return role.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
    
    // Returns Teachers or fallback exactly as is
    return role;
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
                onClick={() => { setActiveTab(tab); setCurrentPage(1); setSearchQuery(''); }}
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
                   placeholder="Search names or phones..."
                   value={searchQuery}
                   onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
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
                   <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap bg-gray-50">Role/Class</th>
                   <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-center whitespace-nowrap bg-gray-50">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-500">Loading data...</td></tr>
                ) : currentData.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-500">No records found.</td></tr>
                ) : (
                  currentData.map((item: any, index: number) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-500 text-center">{startIndex + index + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium text-[#1c3068]">{item.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-mono">{item.phone}</td>
                      {/* Applied formatting helper here */}
                      <td className="px-4 py-3 text-sm text-gray-600 font-medium">
                        {formatRoleLabel(item.role, item.type)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center items-center gap-2">
                          <button 
                            onClick={() => handleInfoClick(item)}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100" 
                            title="View Info"
                          >
                             <Info size={16} />
                          </button>
                          <button className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100" title="Print Details">
                            <Printer size={16} />
                          </button>
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
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!isLoading && filteredData.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 text-sm text-gray-500 gap-4">
              <p>Showing {startIndex + 1} to {endIndex} of {filteredData.length} entries</p>
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
          )}
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

export default function UserListPage() {
  return (
    <DashboardLayout activePageId="user-list">
      <UserListUnified />
    </DashboardLayout>
  );
}