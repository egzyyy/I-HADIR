const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'resources', 'js', 'Pages', 'Dashboard.tsx');
const destPath = path.join(__dirname, 'resources', 'js', 'Layouts', 'DashboardLayout.tsx');

let content = fs.readFileSync(srcPath, 'utf8');

const importsRegex = /import React.*?;\nimport \{[\s\S]*?\} from 'lucide-react';\nimport \{ motion, AnimatePresence \} from 'motion\/react';\nimport \{ router(.*?)\} from '@inertiajs\/react';/s;
const importsMatch = content.match(importsRegex);

let newImports = importsMatch ? importsMatch[0] : '';
newImports = newImports.replace("import { router", "import { router, Link, usePage ");

const menuSectionsRegex = /\/\/ --- Menu Data Structure ---\nconst MENU_SECTIONS = \[[\s\S]*?\];\n/s;
const menuSectionsMatch = content.match(menuSectionsRegex);
const menuSections = menuSectionsMatch ? menuSectionsMatch[0] : '';

const sidebarStart = content.indexOf('const SidebarItem =');
const sidebarEnd = content.indexOf('const StatCard =');
const sidebarItem = content.substring(sidebarStart, sidebarEnd);

const layoutContent = `
export default function DashboardLayout({ children, activePageId = 'dashboard' }: { children: React.ReactNode, activePageId?: string }) {
  const [isSidebarOpen, setSidebarOpen] = React.useState(true);
  const [isAdminDropdownOpen, setAdminDropdownOpen] = React.useState(false);
  const [isNotificationOpen, setNotificationOpen] = React.useState(false);

  React.useEffect(() => {
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

  const handleMenuClick = (id: string, action?: string) => {
    if (action === 'logout') {
      router.post('/logout');
      return;
    }
    
    // Hardcoded paths for frontend developer simplicity as requested
    if (id === 'dashboard') router.visit('/dashboard');
    else if (id === 'my-profile') router.visit('/admin-profile');
    else if (id === 'my-attendance') router.visit('/admin-attendance');
    else if (id === 'change-password') router.visit('/admin-password');
  };

  return (
    <div className="min-h-screen bg-[#fcfafa] flex font-sans">
      <aside 
        className={\`fixed inset-y-0 left-0 z-50 bg-[#1c3068] transition-all duration-300 ease-in-out flex flex-col \${isSidebarOpen ? 'w-72' : 'w-20'} lg:translate-x-0 \${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}\`}
      >
        <div className="h-20 flex items-center justify-center border-b border-white/10 px-4 bg-[#152450]">
          {isSidebarOpen ? (
             <div className="flex flex-col items-center justify-center border-2 border-white px-3 py-1">
               <span className="text-[10px] tracking-[0.2em] font-semibold text-white/80">2026</span>
               <h1 className="text-xl font-black tracking-wider text-white leading-none">I-HADIR</h1>
             </div>
          ) : (
             <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-black text-[#1c3068]">I</div>
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

      <main className={\`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out \${isSidebarOpen ? 'lg:ml-72' : 'lg:ml-20'}\`}>
        <header className="h-20 bg-white shadow-sm sticky top-0 z-40 px-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg text-[#1c3068] transition-colors"
            >
              <Menu size={24} />
            </button>
            <div className="hidden md:flex items-center text-sm text-gray-500">
              <span className="hover:text-[#1c3068] cursor-pointer" onClick={() => router.visit('/dashboard')}>Home</span>
              <span className="mx-2">/</span>
              <span className="font-semibold text-[#1c3068]">{getCurrentPageLabel()}</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-gray-500">School Session</p>
              <p className="text-sm font-bold text-[#1c3068]">Year 2026</p>
            </div>
            <div className="h-8 w-[1px] bg-gray-200 hidden sm:block"></div>
            
            <div className="relative notification-dropdown-container">
              <button 
                onClick={() => setNotificationOpen(!isNotificationOpen)}
                className={\`relative p-2 transition-colors rounded-lg \${isNotificationOpen ? 'bg-gray-100 text-[#1c3068]' : 'text-gray-400 hover:text-[#1c3068] hover:bg-gray-50'}\`}
              >
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#c53336] rounded-full border border-white"></span>
              </button>

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
                <ChevronDown size={16} className={\`text-gray-400 transition-transform \${isAdminDropdownOpen ? 'rotate-180' : ''}\`} />
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
                    
                    <button onClick={() => { router.visit('/admin-profile'); setAdminDropdownOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-[#1c3068] transition-colors text-left">
                      <Users size={16} /> My Profile
                    </button>
                    
                    <button onClick={() => { router.visit('/admin-attendance'); setAdminDropdownOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-[#1c3068] transition-colors text-left">
                      <Calendar size={16} /> My Attendance
                    </button>
                    
                    <button onClick={() => { router.visit('/admin-password'); setAdminDropdownOpen(false); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-[#1c3068] transition-colors text-left">
                      <Keyboard size={16} /> Change Password
                    </button>
                    
                    <div className="h-px bg-gray-100 my-1"></div>
                    
                    <button onClick={() => router.post('/logout')} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#c53336] hover:bg-red-50 transition-colors text-left font-medium">
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
`;

const finalFileContent = newImports + '\n\n' + menuSections + '\n\n' + sidebarItem + '\n\n' + layoutContent;

fs.mkdirSync(path.dirname(destPath), { recursive: true });
fs.writeFileSync(destPath, finalFileContent);
console.log('Successfully extracted DashboardLayout.tsx');
