import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Info, Printer, Trash2, ChevronDown } from 'lucide-react';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { ExportButtons } from '../../Components/dashboard/ExportButtons';
import { UserInfoModal } from '../../Components/modals/UserInfoModal';
import { DeleteConfirmationModal } from '../../Components/modals/DeleteConfirmationModal';
import axios from 'axios';

axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

const UserListUnified = () => {
  const [activeTab, setActiveTab] = useState<'student' | 'teacher' | 'staff'>('staff');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 100;
  
  // Session States
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('all');

  // Real Data States
  const [allUsers, setAllUsers] = useState({ student: [], teacher: [], staff: [] });
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // 1. Initial Load: Fetch Sessions First
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const sessionRes = await axios.get('/api/sessions');
        if (sessionRes.data.success) {
          const fetchedSessions = sessionRes.data.data;
          setSessions(fetchedSessions);
          
          // Find the active session and set it as default
          const activeSession = fetchedSessions.find((s: any) => s.status === 'Active');
          if (activeSession) {
            setSelectedSessionId(activeSession.id.toString());
          }
        }
      } catch (error) {
        console.error("Failed to fetch sessions", error);
      }
    };
    fetchInitialData();
  }, []);

  // 2. Fetch Users whenever the selected Session changes
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`/api/users?session_id=${selectedSessionId}`);
        setAllUsers(response.data);
      } catch (error) {
        console.error("Failed to fetch users", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    // Only fetch if we have determined the session ID (either 'all' or a valid ID)
    if (selectedSessionId) {
      fetchUsers();
    }
  }, [selectedSessionId]);

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

  const handleConfirmDelete = async () => {
    if (!selectedUser) return;
    try {
      await axios.delete(`/api/users/${selectedUser.type}/${selectedUser.id}`);
      // Refresh users using the current session filter
      const response = await axios.get(`/api/users?session_id=${selectedSessionId}`);
      setAllUsers(response.data);
    } catch (error) {
      console.error("Failed to delete user", error);
      alert("Failed to delete user. Please try again.");
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
    }
  };

  const formatRoleLabel = (role: string, type: string) => {
    if (!role) return '-';
    if (type === 'staff') return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    if (type === 'student') return role.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    return role;
  };

  // --- EXPORT FUNCTIONS (Unchanged) --- //
  const handleExportCSV = () => { /* existing logic */ };
  const handleExportExcel = () => { /* existing logic */ };

  return (
    <>
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-full mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        
        {/* Header & Tabs */}
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
                  activeTab === tab ? 'bg-white text-[#1c3068] shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-col xl:flex-row justify-between items-center gap-4 mb-6">
            
            <ExportButtons onExportCSV={handleExportCSV} onExportExcel={handleExportExcel} />

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
               
               {/* SESSION FILTER DROPDOWN */}
               <div className="relative w-full sm:w-48">
                 <select 
                   value={selectedSessionId}
                   onChange={(e) => setSelectedSessionId(e.target.value)}
                   className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-50 outline-none bg-gray-50 focus:bg-white transition-all appearance-none cursor-pointer text-[#1c3068] font-semibold"
                 >
                   <option value="all">All Time History</option>
                   {sessions.map(session => (
                     <option key={session.id} value={session.id}>
                       Session {session.year} {session.status === 'Active' ? '(Active)' : ''}
                     </option>
                   ))}
                 </select>
                 <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
               </div>

               {/* SEARCH BAR */}
               <div className="relative w-full sm:w-64">
                 <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                 <input 
                   type="text" 
                   placeholder="Search names or phones..."
                   value={searchQuery}
                   onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                   className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-50 outline-none bg-gray-50 focus:bg-white transition-all"
                 />
               </div>
            </div>
          </div>

          {/* Table Code Remains Exactly the Same */}
          <div className="overflow-x-auto border border-gray-200 rounded-lg max-h-[600px] relative">
            <table className="w-full text-left border-collapse relative">
              <thead className="sticky top-0 z-10 shadow-sm">
                <tr className="bg-gray-50 border-b border-gray-200">
                   <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider w-12 text-center whitespace-nowrap bg-gray-50">#</th>
                   <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap bg-gray-50">Name</th>
                   <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider font-mono whitespace-nowrap bg-gray-50">IC Number</th>
                   <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap bg-gray-50">Phone No</th>
                   <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap bg-gray-50">Role/Class</th>
                   <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-center whitespace-nowrap bg-gray-50">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-500">Loading data...</td></tr>
                ) : currentData.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-500">No records found for this session.</td></tr>
                ) : (
                  currentData.map((item: any, index: number) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 text-sm text-gray-500 text-center">{startIndex + index + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium text-[#1c3068]">{item.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-mono">{item.ic_number}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-mono">{item.phone}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-medium">
                        {formatRoleLabel(item.role, item.type)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center items-center gap-2">
                          <button onClick={() => handleInfoClick(item)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100" title="View Info">
                             <Info size={16} />
                          </button>
                          <button onClick={() => handleDeleteClick(item)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm border border-red-100" title="Delete User">
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

          {/* Pagination Code Remains Exactly the Same */}
          {!isLoading && filteredData.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 text-sm text-gray-500 gap-4">
              <p>Showing {startIndex + 1} to {endIndex} of {filteredData.length} entries</p>
              <div className="flex gap-1">
                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-1 rounded border ${currentPage === page ? 'bg-[#c53336] text-white border-[#c53336]' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}>{page}</button>
                ))}
                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>

    <AnimatePresence>
      {isInfoModalOpen && <UserInfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} user={selectedUser} />}
      {isDeleteModalOpen && <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleConfirmDelete} userName={selectedUser?.name} />}
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