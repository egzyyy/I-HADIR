import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, School, MessageSquare, Users, GraduationCap,
  CheckSquare, ClipboardList, Keyboard, BarChart3, FileText,
  HelpCircle, LogOut, Menu, Bell, ChevronDown, Calendar
} from 'lucide-react';
import logo from '../assets/i_hadir_logo2.png';

// Ensure Axios acts as an XHR request for Laravel
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// --- Menu Data Types ---
interface MenuItem {
  id: string;
  label: string;
  icon: any;
  subItems?: { id: string; label: string }[];
  badge?: string;
  action?: string;
}

interface MenuSection {
  category: string;
  items: MenuItem[];
}

// --- Menu Data Structure ---
const MENU_SECTIONS: MenuSection[] = [
  {
    category: "DASHBOARD",
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }
    ]
  },
  {
    category: "SCHOOL MANAGEMENT",
    items: [
      { id: 'school-profile', label: 'School Session', icon: School }
    ]
  },
  {
    category: "SMS API",
    items: [
      { id: 'set-sms-api', label: 'Set SMS API', icon: MessageSquare }
    ]
  },
  {
    category: "MAIN MENU",
    items: [
      { 
        id: 'users', 
        label: 'Users', 
        icon: Users,
        subItems: [
          { id: 'user-registration', label: 'User Registration' },
          { id: 'import-apdm', label: 'APDM' },
          { id: 'user-list', label: 'User List' }
        ]
      },
      {
        id: 'academic',
        label: 'Academic',
        icon: GraduationCap,
        subItems: [
          { id: 'class', label: 'Class' },
          { id: 'co-curricular', label: 'Co-Curricular' },
          { id: 'sport', label: 'Sport' },
          { id: 'event', label: 'Event' }
        ]
      }
    ]
  },
  {
    category: "CHECK IN",
    items: [
      { 
        id: 'attendance-log', 
        label: 'Attendance Log', 
        icon: CheckSquare,
        subItems: [
          { id: 'check-in', label: 'Check In' },
          { id: 'check-out', label: 'Check Out' },
          { id: 'time-setting', label: 'Time setting' }
        ]
      },
      { id: 'facility-check-in', label: 'Facility Check In', icon: ClipboardList },
      { id: 'manual-entry', label: 'Manual Entry', icon: Keyboard }
    ]
  },
  {
    category: "REPORT",
    items: [
      { id: 'attendance-reports', label: 'Attendance Reports', icon: BarChart3 },
      { id: 'general-report', label: 'General Report', icon: FileText },
    ]
  },
  {
    category: "SUPPORT",
    items: [
      { id: 'faqs', label: 'FAQs', icon: HelpCircle },
      { id: 'logout', label: 'Log Out', icon: LogOut, action: 'logout' }
    ]
  }
];

const SidebarItem = ({ icon: Icon, label, active = false, onClick, badge, collapsed, subItems, activePageId, onSubItemClick }: any) => {
  const isChildActive = subItems?.some((sub: any) => sub.id === activePageId);
  const [expanded, setExpanded] = useState(isChildActive || false);

  useEffect(() => {
    if (isChildActive) {
      setExpanded(true);
    }
  }, [isChildActive]);

  const handleMainClick = () => {
    if (subItems) {
      setExpanded(!expanded);
    } else {
      onClick();
    }
  };

  return (
    <div className="flex flex-col">
      <div 
        onClick={handleMainClick}
        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-all duration-200 group relative
          ${active || (isChildActive && !expanded)
            ? 'bg-[#c53336] text-white' 
            : 'text-gray-300 hover:bg-white/10 hover:text-white'
          }
          ${collapsed ? 'justify-center px-2' : ''}
        `}
      >
        <Icon size={20} strokeWidth={1.5} className={`flex-shrink-0 ${active || (isChildActive && !expanded) ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
        
        {!collapsed && (
          <div className="flex-1 flex justify-between items-center overflow-hidden">
            <span className="text-sm font-medium whitespace-nowrap">{label}</span>
            {badge && (
              <span className="bg-[#cec43a] text-[#1c3068] text-xs font-bold px-2 py-0.5 rounded-full">
                {badge}
              </span>
            )}
            {subItems && (
              <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
            )}
          </div>
        )}
      </div>

      <AnimatePresence initial={false}>
        {expanded && subItems && !collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-[#152450]/50 overflow-hidden"
          >
            {subItems.map((sub: any) => (
              <div
                key={sub.id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSubItemClick) {
                    onSubItemClick(sub.id);
                  }
                }}
                className={`pl-12 pr-4 py-2 text-xs font-medium cursor-pointer transition-colors block
                  ${activePageId === sub.id ? 'text-[#cec43a]' : 'text-gray-400 hover:text-white'}
                `}
              >
                {sub.label}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


export default function DashboardLayout({ children, activePageId = 'dashboard' }: { children: React.ReactNode, activePageId?: string }) {
  const [isSidebarOpen, setSidebarOpen] = React.useState(true);
  const [isAdminDropdownOpen, setAdminDropdownOpen] = React.useState(false);
  const [isNotificationOpen, setNotificationOpen] = React.useState(false);
  
  // Dynamic Session State
  const [activeSessionYear, setActiveSessionYear] = useState<string>('Loading...');

  React.useEffect(() => {
    // Fetch Active Session
    const fetchActiveSession = async () => {
      try {
        const response = await axios.get('/api/sessions/active');
        if (response.data.success) {
          setActiveSessionYear(response.data.data.year);
        } else {
          setActiveSessionYear('Not Set');
        }
      } catch (error) {
        console.error("Failed to fetch active session", error);
        setActiveSessionYear('Unknown');
      }
    };

    fetchActiveSession();

    // Click outside handler for dropdowns
    const handleClickOutside = (event: MouseEvent) => {
      const adminDropdown = document.querySelector('.admin-dropdown-container');
      const notificationDropdown = document.querySelector('.notification-dropdown-container');
      
      if (adminDropdown && !adminDropdown.contains(event.target as Node)) {
        setAdminDropdownOpen(false);
      }
      if (notificationDropdown && !notificationDropdown.contains(event.target as Node)) {
        setNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getCurrentPageLabel = () => {
    for (const section of MENU_SECTIONS) {
      for (const item of section.items) {
        if (item.id === activePageId) return item.label;
        if (item.subItems) {
          const subItem = item.subItems.find((sub) => sub.id === activePageId);
          if (subItem) return subItem.label;
        }
      }
    }
    return 'Dashboard';
  };

  const navigate = useNavigate();

  const handleMenuClick = (id: string, action?: string) => {
    if (action === 'logout') {
      axios.post('/logout').then(() => navigate('/login'));
      return;
    }
    
    const routes: Record<string, string> = {
      'dashboard': '/dashboard',
      'school-profile': '/school-session',
      'set-sms-api': '/set-sms-api',
      'user-registration': '/users/registration',
      'import-apdm': '/users/apdm',
      'user-list': '/users/list',
      'class': '/academic/class',
      'co-curricular': '/academic/co-curricular',
      'sport': '/academic/sport',
      'event': '/academic/event',
      'check-in': '/attendance-log/check-in',
      'check-out': '/attendance-log/check-out',
      'time-setting': '/attendance-log/time-setting',
      'facility-check-in': '/facility-check-in',
      'manual-entry': '/manual-entry',
      'attendance-reports': '/attendance-reports',
      'general-report': '/general-report',
      'faqs': '/faqs',
      'my-profile': '/admin-profile',
      'my-attendance': '/admin-attendance',
      'change-password': '/admin-password',
    };

    const route = routes[id];
    if (route) navigate(route);
  };

  return (
    <div className="min-h-screen bg-[#fcfafa] flex font-sans">
      <aside 
        className={`fixed inset-y-0 left-0 z-50 bg-[#1c3068] transition-all duration-300 ease-in-out flex flex-col ${isSidebarOpen ? 'w-72' : 'w-20'} lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="h-20 flex items-center justify-center border-b border-white/10 px-4 bg-[#152450]">
          {isSidebarOpen ? (
             <div className="flex items-center justify-center bg-white/90 px-3 py-2 rounded-lg m-2">
               <img src={logo} alt="I-HADIR Logo" className="h-12 w-auto object-contain" />
             </div>
          ) : (
             <div className="flex items-center justify-center bg-white/90 p-1.5 rounded-lg">
               <img src={logo} alt="Logo" className="h-10 w-auto object-contain" />
             </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {MENU_SECTIONS.map((section, idx) => (
            <div key={idx}>
              {isSidebarOpen && (
                <div className="px-6 mb-2 text-[10px] font-bold text-white/40 uppercase tracking-[0.15em]">{section.category}</div>
              )}
              {!isSidebarOpen && idx > 0 && <div className="h-px bg-white/10 mx-4 my-2"></div>}
              <div className="flex flex-col">
                {section.items.map((item) => (
                  <div key={item.id}>
                    <SidebarItem 
                      icon={item.icon}
                      label={item.label}
                      badge={item.badge}
                      active={activePageId === item.id}
                      activePageId={activePageId}
                      collapsed={!isSidebarOpen}
                      onClick={() => handleMenuClick(item.id, item.action)}
                      onSubItemClick={handleMenuClick}
                      subItems={item.subItems}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>

      <main className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${isSidebarOpen ? 'lg:ml-72' : 'lg:ml-20'}`}>
        <header className="h-20 bg-white shadow-sm sticky top-0 z-40 px-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg text-[#1c3068] transition-colors"
            >
              <Menu size={24} />
            </button>
            <div className="hidden md:flex items-center text-sm text-gray-500">
              <span className="hover:text-[#1c3068] cursor-pointer" onClick={() => navigate('/dashboard')}>Home</span>
              <span className="mx-2">/</span>
              <span className="font-semibold text-[#1c3068]">{getCurrentPageLabel()}</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-gray-500">Current School Session</p>
              <p className="text-sm font-bold text-[#1c3068]">Year {activeSessionYear}</p>
            </div>
            <div className="h-8 w-[1px] bg-gray-200 hidden sm:block"></div>
            
            <div className="relative notification-dropdown-container">
              <AnimatePresence>
                {isNotificationOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 origin-top-right"
                  >
                    <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                      <h3 className="text-sm font-bold text-[#1c3068] flex items-center gap-2">
                        Notifications <span className="bg-[#c53336] text-white text-[10px] px-1.5 py-0.5 rounded-full">3</span>
                      </h3>
                      <button className="text-xs text-gray-500 hover:text-[#1c3068] font-medium transition-colors">Mark all as read</button>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                      <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 flex gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <p className="text-sm font-bold text-[#1c3068]">System Maintenance</p>
                            <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">2h ago</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">Scheduled system maintenance will occur on Sunday at 2:00 AM. Please save your work.</p>
                        </div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                      </div>

                      <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50 flex gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <p className="text-sm font-bold text-[#1c3068]">New Registration</p>
                            <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">5h ago</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">5 new students have been registered for Class 1 Kreatif by Mrs. Rohana.</p>
                        </div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                      </div>

                      <div className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors flex gap-3">
                        <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <p className="text-sm font-bold text-[#1c3068]">Attendance Alert</p>
                            <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">1d ago</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">Low attendance recorded for Form 5 classes today. Only 85% present.</p>
                        </div>
                      </div>
                    </div>

                    <div className="px-4 py-3 border-t border-gray-100">
                      <button className="w-full text-center text-sm font-bold text-[#1c3068] hover:text-[#c53336] transition-colors flex items-center justify-center gap-1">
                        View All Notifications <span className="text-xs">›</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative admin-dropdown-container">
              <div 
                className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-1.5 rounded-xl transition-colors"
                onClick={() => setAdminDropdownOpen(!isAdminDropdownOpen)}
              >
                <div className="w-10 h-10 rounded-lg bg-[#1c3068] flex items-center justify-center text-white font-bold shadow-md shadow-blue-900/20">
                  A
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-bold text-[#1c3068] leading-tight">Admin</p>
                  <p className="text-[10px] text-gray-500 font-medium tracking-wide uppercase">Administrator</p>
                </div>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${isAdminDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
              
              <AnimatePresence>
                {isAdminDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 origin-top-right"
                  >
                    <div className="px-4 py-3 border-b border-gray-100 mb-1">
                      <p className="text-sm font-bold text-[#1c3068]">Administrator</p>
                      <p className="text-xs text-gray-500 truncate">admin@skpulauserai.edu.my</p>
                    </div>
                    
                    <button onClick={() => { navigate('/admin-profile'); setAdminDropdownOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-[#1c3068] transition-colors text-left">
                      <Users size={16} /> My Profile
                    </button>
                    
                    <button onClick={() => { navigate('/admin-password'); setAdminDropdownOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-[#1c3068] transition-colors text-left">
                      <Keyboard size={16} /> Change Password
                    </button>
                    
                    <div className="h-px bg-gray-100 my-1"></div>
                    
                    <button onClick={() => axios.post('/logout').then(() => navigate('/login'))} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#c53336] hover:bg-red-50 transition-colors text-left font-medium">
                      <LogOut size={16} /> Log Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <div className="p-6 lg:p-10 max-w-[1600px] mx-auto w-full flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}