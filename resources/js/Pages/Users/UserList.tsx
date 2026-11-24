import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, Info, Trash2, ChevronDown, QrCode, ArrowUpDown, ArrowUp, ArrowDown, Trophy } from 'lucide-react';
import DashboardLayout from '../../Layouts/DashboardLayout';
import { ExportButtons } from '../../Components/dashboard/ExportButtons';
import { UserInfoModal } from '../../Components/modals/UserInfoModal';
import { DeleteConfirmationModal } from '../../Components/modals/DeleteConfirmationModal';
import { EditUserModal } from '../../Components/modals/EditUserModal';
import { StudentQrModal } from '../../Components/modals/StudentQrModal';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

// IMPORT LOGO
import { printLogoHeader, printLogoCss } from '../../lib/branding';

axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

type SortColumn = 'name' | 'role' | 'sport_house' | 'co_curricular' | null;
type SortDirection = 'asc' | 'desc';

const formatRoleLabel = (role: string, type: string) => {
  if (!role) return '-';
  if (type === 'staff') {
    return role
      .split(',')
      .map(part => part.trim().split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '))
      .join(', ');
  }
  if (type === 'student') {
    return role.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }
  return role;
};

const UserListUnified = () => {
  const { role } = useAuth();
  const isTeacherView = role === 'Teacher';
  // Teachers only manage students, so they see the Student tab only.
  const visibleTabs = isTeacherView
    ? (['student'] as const)
    : (['student', 'teacher', 'staff'] as const);

  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'student' | 'teacher' | 'staff'>('student');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const itemsPerPage = 100;

  // Sort States
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

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
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrUser, setQrUser] = useState<any>(null);

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

    if (selectedSessionId) {
      fetchUsers();
    }
  }, [selectedSessionId]);

  // Distinct assigned classes for Admin's Student tab filter (Prasekolah first, then 1–6)
  const availableClasses = useMemo(() => {
    const students = allUsers.student || [];
    const uniqueClasses = Array.from(
      new Set(
        students
          .map((s: any) => formatRoleLabel(s.role, 'student'))
          .filter((cls: string) => cls && cls !== '-' && cls.toLowerCase() !== 'unassigned')
      )
    );

    return uniqueClasses.sort((a, b) => {
      const aIsPra = /pra/i.test(a);
      const bIsPra = /pra/i.test(b);
      if (aIsPra && !bIsPra) return -1;
      if (!aIsPra && bIsPra) return 1;
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [allUsers.student]);

  // Filter Data based on Active Tab, Class Filter, Assigned Status, and Search Query
  const activeData = allUsers[activeTab] || [];
  const filteredData = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return activeData.filter((user: any) => {
      if (activeTab === 'student') {
        const classLabel = formatRoleLabel(user.role, 'student');
        // Exclude students whose class is unassigned
        if (!classLabel || classLabel === '-' || classLabel.toLowerCase() === 'unassigned') {
          return false;
        }
        // Apply Admin class filter on Student tab
        if (!isTeacherView && selectedClass !== 'all' && classLabel !== selectedClass) {
          return false;
        }
      }

      return (
        user.name.toLowerCase().includes(q) ||
        user.phone.includes(searchQuery) ||
        (isTeacherView && (user.sport_house || '').toLowerCase().includes(q)) ||
        (isTeacherView && (user.co_curricular || '').toLowerCase().includes(q))
      );
    });
  }, [activeData, activeTab, searchQuery, isTeacherView, selectedClass]);

  // Sort Data
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;

    return [...filteredData].sort((a: any, b: any) => {
      let aVal = '';
      let bVal = '';

      if (sortColumn === 'name') {
        aVal = a.name || '';
        bVal = b.name || '';
      } else if (sortColumn === 'role') {
        aVal = formatRoleLabel(a.role, a.type);
        bVal = formatRoleLabel(b.role, b.type);
      } else if (sortColumn === 'sport_house') {
        aVal = a.sport_house || '-';
        bVal = b.sport_house || '-';
      } else if (sortColumn === 'co_curricular') {
        aVal = a.co_curricular || '-';
        bVal = b.co_curricular || '-';
      }

      if (sortColumn === 'sport_house' || sortColumn === 'co_curricular') {
        const aEmpty = !aVal || aVal === '-';
        const bEmpty = !bVal || bVal === '-';
        if (aEmpty && bEmpty) return 0;
        if (aEmpty) return 1;
        if (bEmpty) return -1;
      }

      const cmp = aVal.localeCompare(bVal, undefined, {
        numeric: true,
        sensitivity: 'base',
      });
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [filteredData, sortColumn, sortDirection]);

  const handleSort = (column: Exclude<SortColumn, null>) => {
    if (sortColumn === column) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const SortIcon = ({ column }: { column: Exclude<SortColumn, null> }) => {
    if (sortColumn !== column) {
      return <ArrowUpDown size={14} className="text-gray-300 ml-1 inline-block" />;
    }
    return sortDirection === 'asc'
      ? <ArrowUp size={14} className="text-role ml-1 inline-block" />
      : <ArrowDown size={14} className="text-role ml-1 inline-block" />;
  };

  // Pagination Logic
  const totalPages = Math.ceil(sortedData.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, sortedData.length);
  const currentData = sortedData.slice(startIndex, endIndex);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const handleInfoClick = (user: any) => {
    setSelectedUser(user);
    setIsInfoModalOpen(true);
  };

  const handleDeleteClick = (user: any) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleEditClick = (user: any) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = async () => {
    setIsEditModalOpen(false);
    setSelectedUser(null);
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/users?session_id=${selectedSessionId}`);
      setAllUsers(response.data);
    } catch (error) {
      console.error("Failed to fetch users after edit", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- EXPORT FUNCTIONS --- //

  // 1. Copy to Clipboard
  const handleCopy = async () => {
    if (sortedData.length === 0) {
      alert("No data to copy!");
      return;
    }

    const tableHtml = `
      <table border="1" style="border-collapse: collapse;">
        <thead>
          <tr>
            <th>No</th><th>Name</th><th>IC Number</th><th>Phone No</th><th>Role/Class</th>${isTeacherView ? '<th>Sport</th><th>Co-Curricular</th>' : ''}<th>Gender</th><th>Registered Date</th>
          </tr>
        </thead>
        <tbody>
          ${sortedData.map((item: any, index: number) => `
            <tr>
              <td>${index + 1}</td>
              <td>${item.name}</td>
              <td>${item.ic_number}</td>
              <td>${item.phone}</td>
              <td>${formatRoleLabel(item.role, item.type)}</td>
              ${isTeacherView ? `<td>${item.sport_house || '-'}</td><td>${item.co_curricular || '-'}</td>` : ''}
              <td>${item.gender || '-'}</td>
              <td>${item.registeredDate}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    const textFallback = sortedData.map((item: any, i: number) =>
      isTeacherView
        ? `${i + 1}\t${item.name}\t${item.ic_number}\t${item.phone}\t${formatRoleLabel(item.role, item.type)}\t${item.sport_house || '-'}\t${item.co_curricular || '-'}\t${item.gender || '-'}\t${item.registeredDate}`
        : `${i + 1}\t${item.name}\t${item.ic_number}\t${item.phone}\t${formatRoleLabel(item.role, item.type)}\t${item.gender || '-'}\t${item.registeredDate}`
    ).join('\n');

    try {
      const clipboardItem = new ClipboardItem({
        'text/html': new Blob([tableHtml], { type: 'text/html' }),
        'text/plain': new Blob([textFallback], { type: 'text/plain' })
      });

      await navigator.clipboard.write([clipboardItem]);
      alert("Table copied to clipboard! You can now paste it into Word, Excel, or Google Docs.");
    } catch (error) {
      console.error("Clipboard API failed, trying fallback:", error);
      navigator.clipboard.writeText(textFallback);
      alert("Text copied to clipboard!");
    }
  };

  // 2. Export to CSV
  const handleExportCSV = () => {
    if (sortedData.length === 0) return;

    const headers = isTeacherView
      ? ['No', 'Name', 'IC Number', 'Phone No', 'Class', 'Sport', 'Co-Curricular', 'Gender', 'Registered Date']
      : ['No', 'Name', 'IC Number', 'Phone No', 'Role/Class', 'Gender', 'Registered Date'];
    const csvRows = [headers.join(',')];

    sortedData.forEach((item: any, index: number) => {
      const row = isTeacherView
        ? [
          index + 1,
          `"${item.name}"`,
          `"=""${item.ic_number}"""`,
          `"=""${item.phone}"""`,
          `"${formatRoleLabel(item.role, item.type)}"`,
          `"${item.sport_house || '-'}"`,
          `"${item.co_curricular || '-'}"`,
          `"${item.gender || '-'}"`,
          `"${item.registeredDate}"`
        ]
        : [
          index + 1,
          `"${item.name}"`,
          `"=""${item.ic_number}"""`,
          `"=""${item.phone}"""`,
          `"${formatRoleLabel(item.role, item.type)}"`,
          `"${item.gender || '-'}"`,
          `"${item.registeredDate}"`
        ];
      csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${activeTab}_list_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 3. Export to Excel (.xls)
  const handleExportExcel = () => {
    if (sortedData.length === 0) return;

    const tableHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="UTF-8"></head>
      <body>
        <table border="1">
          <thead>
            <tr style="background-color: #2f4fa8; color: white;">
              <th>No</th>
              <th>Name</th>
              <th>IC Number</th>
              <th>Phone No</th>
              <th>${isTeacherView ? 'Class' : 'Role/Class'}</th>
              ${isTeacherView ? '<th>Sport</th><th>Co-Curricular</th>' : ''}
              <th>Gender</th>
              <th>Registered Date</th>
            </tr>
          </thead>
          <tbody>
            ${sortedData.map((item: any, index: number) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.name}</td>
                <td style="mso-number-format:'\\@';">${item.ic_number}</td>
                <td style="mso-number-format:'\\@';">${item.phone}</td>
                <td>${formatRoleLabel(item.role, item.type)}</td>
                ${isTeacherView ? `<td>${item.sport_house || '-'}</td><td>${item.co_curricular || '-'}</td>` : ''}
                <td>${item.gender || '-'}</td>
                <td>${item.registeredDate}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${activeTab}_list_${new Date().getTime()}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 4. Export to PDF / Print (Standardized Format)
  const handleExportPDF = () => {
    if (sortedData.length === 0) return;

    const titleMap = {
      'student': 'Student List Report',
      'teacher': 'Teacher List Report',
      'staff': 'Staff List Report'
    };

    const roleHeaderMap = {
      'student': 'Class',
      'teacher': 'Position',
      'staff': 'Role'
    };

    const title = titleMap[activeTab];
    const roleHeader = roleHeaderMap[activeTab];

    const rows = sortedData.map((item: any, index: number) => `
      <tr>
        <td style="text-align:center">${index + 1}</td>
        <td style="font-weight:bold">${item.name}</td>
        <td style="text-align:center; font-family:monospace">${item.ic_number}</td>
        <td style="text-align:center; font-family:monospace">${item.phone}</td>
        <td style="text-align:center">${formatRoleLabel(item.role, item.type)}</td>
        ${isTeacherView ? `<td style="text-align:center">${item.sport_house || '-'}</td><td style="text-align:center">${item.co_curricular || '-'}</td>` : ''}
        <td style="text-align:center">${item.gender || '-'}</td>
        <td style="text-align:center">${item.registeredDate}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          @page { margin: 15mm; size: A4 landscape; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 12px; color: #333; margin: 0; padding: 0; }
          .header-container { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #2f4fa8; }
          ${printLogoCss}
          .report-title { color: #2f4fa8; font-size: 24px; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: 1.5px; }
          .report-meta { color: #6b7280; font-size: 11px; margin-top: 8px; font-weight: bold; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 10px; }
          th, td { padding: 12px 10px; border-bottom: 1px solid #e5e7eb; }
          th {
            background-color: #2f4fa8 !important;
            color: white !important;
            font-weight: bold;
            text-align: center;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          th:nth-child(2) { text-align: left; }
          tr:nth-child(even) {
            background-color: #f9fafb !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        </style>
      </head>
      <body>
        <div class="header-container">
          ${printLogoHeader()}
          <h1 class="report-title">${title}</h1>
          <p class="report-meta">Generated on: ${new Date().toLocaleString('en-MY')} &nbsp;&bull;&nbsp; I-HADIR System</p>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width:4%">No</th>
              <th style="width:${isTeacherView ? '22%' : '30%'}">Name</th>
              <th style="width:13%">IC Number</th>
              <th style="width:12%">Phone No</th>
              <th style="width:11%">${roleHeader}</th>
              ${isTeacherView ? '<th style="width:11%">Sport</th><th style="width:13%">Co-Curricular</th>' : ''}
              <th style="width:7%">Gender</th>
              <th style="width:7%">Registered</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          }
        </script>
      </body>
      </html>
    `;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-full mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

          {/* Header & Tabs */}
          <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-role flex items-center gap-2">
                {isTeacherView ? 'My Class Student List' : 'User List'}
              </h2>
              <p className="text-gray-400 text-xs mt-1">List of registered users as of {today}</p>
            </div>

            {visibleTabs.length > 1 && (
              <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-100">
                {visibleTabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setCurrentPage(1);
                      setSearchQuery('');
                      setSelectedClass('all');
                      setSortColumn(null);
                    }}
                    className={`px-6 py-2 rounded-md text-sm font-bold transition-all capitalize ${activeTab === tab ? 'bg-white text-role shadow-sm' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-6">
            <div className="flex flex-col xl:flex-row justify-between items-center gap-4 mb-6">

              <ExportButtons
                onCopy={handleCopy}
                onExportCSV={handleExportCSV}
                onExportExcel={handleExportExcel}
                onExportPDF={handleExportPDF}
                onPrint={handleExportPDF}
              />

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">

                {/* SESSION FILTER DROPDOWN */}
                <div className="relative w-full sm:w-48">
                  <select
                    value={selectedSessionId}
                    onChange={(e) => {
                      setSelectedSessionId(e.target.value);
                      setSelectedClass('all');
                      setCurrentPage(1);
                    }}
                    className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-50 outline-none bg-gray-50 focus:bg-white transition-all appearance-none cursor-pointer text-role font-semibold"
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

                {/* CLASS FILTER DROPDOWN (Admin on Student tab) */}
                {!isTeacherView && activeTab === 'student' && (
                  <div className="relative w-full sm:w-48">
                    <select
                      value={selectedClass}
                      onChange={(e) => {
                        setSelectedClass(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full pl-4 pr-10 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-50 outline-none bg-gray-50 focus:bg-white transition-all appearance-none cursor-pointer text-role font-semibold"
                    >
                      <option value="all">All Classes</option>
                      {availableClasses.map((cls) => (
                        <option key={cls} value={cls}>
                          {cls}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                )}

                {/* SEARCH BAR */}
                <div className="relative w-full sm:w-64">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={isTeacherView ? "Search name, phone, sport, club..." : "Search names or phones..."}
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-50 outline-none bg-gray-50 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-lg max-h-[600px] relative">
              <table className="w-full text-left border-collapse relative">
                <thead className="sticky top-0 z-10 shadow-sm">
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider w-12 text-center whitespace-nowrap bg-gray-50">#</th>
                    <th
                      onClick={() => handleSort('name')}
                      className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap bg-gray-50 cursor-pointer hover:bg-gray-100 select-none transition-colors"
                    >
                      Name <SortIcon column="name" />
                    </th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider font-mono whitespace-nowrap bg-gray-50">IC Number</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap bg-gray-50">Phone No</th>
                    <th
                      onClick={() => handleSort('role')}
                      className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap bg-gray-50 cursor-pointer hover:bg-gray-100 select-none transition-colors"
                    >
                      {isTeacherView || activeTab === 'student' ? 'Class' : 'Role/Class'} <SortIcon column="role" />
                    </th>
                    {isTeacherView && (
                      <>
                        <th
                          onClick={() => handleSort('sport_house')}
                          className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap bg-gray-50 cursor-pointer hover:bg-gray-100 select-none transition-colors"
                        >
                          Sport <SortIcon column="sport_house" />
                        </th>
                        <th
                          onClick={() => handleSort('co_curricular')}
                          className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap bg-gray-50 cursor-pointer hover:bg-gray-100 select-none transition-colors"
                        >
                          Co-Curricular <SortIcon column="co_curricular" />
                        </th>
                      </>
                    )}
                    <th className="px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wider text-center whitespace-nowrap bg-gray-50">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isLoading ? (
                    <tr><td colSpan={isTeacherView ? 8 : 6} className="text-center py-8 text-gray-500">Loading data...</td></tr>
                  ) : currentData.length === 0 ? (
                    <tr>
                      <td colSpan={isTeacherView ? 8 : 6} className="text-center py-8 text-gray-500">
                        {isTeacherView ? 'No students found for your assigned class in this session.' : 'No records found for this session.'}
                      </td>
                    </tr>
                  ) : (
                    currentData.map((item: any, index: number) => (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 text-sm text-gray-500 text-center">{startIndex + index + 1}</td>
                        <td className="px-4 py-3 text-sm font-medium text-role">{item.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 font-mono">{item.ic_number}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 font-mono">{item.phone}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 font-medium">
                          {item.type !== 'student' && item.role && item.role.includes(',') ? (
                            <div className="flex flex-wrap gap-1.5">
                              {item.role.split(',').map((pos: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="inline-block px-2 py-0.5 text-sm font-semibold rounded-md bg-blue-50 text-role border border-blue-100"
                                >
                                  {formatRoleLabel(pos.trim(), item.type)}
                                </span>
                              ))}
                            </div>
                          ) : (
                            formatRoleLabel(item.role, item.type)
                          )}
                        </td>
                        {isTeacherView && (
                          <>
                            <td className="px-4 py-3 text-sm text-gray-600 font-medium whitespace-nowrap">
                              {item.sport_house || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 font-medium whitespace-nowrap">
                              {item.co_curricular || '-'}
                            </td>
                          </>
                        )}
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center items-center gap-2">
                            <button onClick={() => { setQrUser(item); setIsQrModalOpen(true); }} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm border border-indigo-100" title="View QR Code">
                              <QrCode size={16} />
                            </button>
                            {item.type === 'student' && (
                              <button
                                onClick={() =>
                                  navigate(
                                    `/users/students/${item.id}/activities${selectedSessionId && selectedSessionId !== 'all' ? `?session_id=${selectedSessionId}` : ''
                                    }`
                                  )
                                }
                                className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100"
                                title="Assign Sports & Co-Curricular"
                              >
                                <Trophy size={16} />
                              </button>
                            )}
                            <button onClick={() => handleInfoClick(item)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100" title="View Info">
                              <Info size={16} />
                            </button>
                            {!isTeacherView && (
                              <>
                                <button onClick={() => handleEditClick(item)} className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-500 hover:text-white transition-all shadow-sm border border-amber-100" title="Edit User">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                                </button>
                                <button onClick={() => handleDeleteClick(item)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm border border-red-100" title="Delete User">
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {!isLoading && sortedData.length > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center mt-6 text-sm text-gray-500 gap-4">
                <p>Showing {startIndex + 1} to {endIndex} of {sortedData.length} entries</p>
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
        {isEditModalOpen && <EditUserModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} user={selectedUser} onSuccess={handleEditSuccess} />}
        {isQrModalOpen && qrUser && (
          <StudentQrModal
            isOpen={isQrModalOpen}
            onClose={() => { setIsQrModalOpen(false); setQrUser(null); }}
            studentName={qrUser.name}
            icNumber={qrUser.ic_number}
            className={formatRoleLabel(qrUser.role, qrUser.type)}
            UserType={activeTab}
          />
        )}

        {isDeleteModalOpen && selectedUser && (
          <DeleteConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            itemName={selectedUser.name}
            itemType={selectedUser.type}
            onConfirm={async () => {
              await axios.delete(`/api/users/${selectedUser.type}/${selectedUser.id}`);
              const response = await axios.get(`/api/users?session_id=${selectedSessionId}`);
              setAllUsers(response.data);
            }}
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