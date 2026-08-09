import React, { useState } from 'react';
import { Menu, X, ChevronDown, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import BrandLogos from '../common/BrandLogos';
import { useBranding } from '../../hooks/useBranding';
import { glassNav, glassPanel, glassDropdown } from '../../lib/glass';

// --- Nav data types (supports one optional level of nested submenus) ---
interface SubLink { label: string; href: string; }
interface DropdownEntry { label: string; href?: string; subItems?: SubLink[]; }
interface NavItem {
  name: string;
  icon?: React.ReactNode;
  href?: string;
  hasDropdown?: boolean;
  dropdownItems?: DropdownEntry[];
}

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

  // School context travels with the kiosk links so /scan can send visitors back
  // to the school page they came from: the route param covers /school/:slug,
  // the ?school= query param covers being on /scan itself.
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const school = slug ?? searchParams.get('school');
  const schoolSuffix = school ? `&school=${school}` : '';
  const homeHref = school ? `/school/${school}` : '/';
  const { schoolLogo, systemLogo } = useBranding(school ?? undefined);

  const navItems: NavItem[] = [
    { name: 'HOME', icon: <Home size={16} />, href: homeHref },
    // Public kiosk scanner — no login needed (see Pages/PublicScan.tsx).
    {
      name: 'ATTENDANCE',
      hasDropdown: true,
      dropdownItems: [
        { label: 'Student Check In', href: `/scan?mode=check-in&type=student${schoolSuffix}` },
        { label: 'Student Check Out', href: `/scan?mode=check-out&type=student${schoolSuffix}` },
        { label: 'Security Staff Check In', href: `/scan?mode=check-in&type=staff${schoolSuffix}` },
        { label: 'Security Staff Check Out', href: `/scan?mode=check-out&type=staff${schoolSuffix}` }
      ]
    },
    {
      name: 'FACILITY',
      hasDropdown: true,
      dropdownItems: [
        { label: 'PRAYER', subItems: [
          { label: 'Check In', href: `/scan?facility=prayer&mode=check-in${schoolSuffix}` },
          { label: 'Check Out', href: `/scan?facility=prayer&mode=check-out${schoolSuffix}` },
        ] },
        { label: 'PSS', subItems: [
          { label: 'Check In', href: `/scan?facility=pss&mode=check-in${schoolSuffix}` },
          { label: 'Check Out', href: `/scan?facility=pss&mode=check-out${schoolSuffix}` },
        ] },
        { label: 'ICT', subItems: [
          { label: 'Check In', href: `/scan?facility=ict&mode=check-in${schoolSuffix}` },
          { label: 'Check Out', href: `/scan?facility=ict&mode=check-out${schoolSuffix}` },
        ] },
      ]
    },
    { name: 'PARENTS', href: '/parents-report' },
    { name: 'VISITOR', href: '/visitor' },
  ];

  const handleMouseEnter = (name: string) => {
    if (window.innerWidth >= 768) {
      setActiveDropdown(name);
    }
  };

  const handleMouseLeave = () => {
    if (window.innerWidth >= 768) {
      setActiveDropdown(null);
      setActiveSubmenu(null);
    }
  };

  const toggleDropdown = (name: string) => {
    if (activeDropdown === name) {
      setActiveDropdown(null);
    } else {
      setActiveDropdown(name);
    }
  };

  return (
    <nav className={`sticky top-0 z-50 font-sans ${glassNav}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24">
          
          {/* Logo Section */}
          <div className="flex-shrink-0 flex items-center cursor-pointer py-2">
             <BrandLogos src={school ? schoolLogo : systemLogo} fallback={school ? 'school' : 'none'} size="h-24" />
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <div 
                key={item.name} 
                className="relative group px-2"
                onMouseEnter={() => item.hasDropdown && handleMouseEnter(item.name)}
                onMouseLeave={handleMouseLeave}
              >
                {item.href?.startsWith('/') ? (
                  <Link
                    to={item.href}
                    className="flex items-center gap-1 text-[color:var(--brand,#1c3068)] hover:text-[color:var(--accent,#c53336)] font-bold text-xs tracking-wide transition-colors py-8 uppercase"
                  >
                    {item.icon && <span className="mr-1">{item.icon}</span>}
                    {item.name}
                  </Link>
                ) : (
                  <a
                    href={item.href || '#'}
                    className="flex items-center gap-1 text-[color:var(--brand,#1c3068)] hover:text-[color:var(--accent,#c53336)] font-bold text-xs tracking-wide transition-colors py-8 uppercase"
                    onClick={(e) => {
                      if (item.hasDropdown) {
                        e.preventDefault();
                      }
                    }}
                  >
                    {item.icon && <span className="mr-1">{item.icon}</span>}
                    {item.name}
                    {item.hasDropdown && <ChevronDown size={12} className="mt-0.5" />}
                  </a>
                )}
                
                {/* Dropdown Menu */}
                {item.hasDropdown && (
                  <AnimatePresence>
                    {activeDropdown === item.name && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className={`absolute top-full left-0 w-56 shadow-xl rounded-b-lg border-t-2 border-[color:var(--accent,#c53336)] py-2 ${glassDropdown}`}
                      >
                        {item.dropdownItems?.map((dropdownItem, index) => (
                          dropdownItem.subItems ? (
                            <div
                              key={index}
                              className="relative"
                              onMouseEnter={() => setActiveSubmenu(dropdownItem.label)}
                              onMouseLeave={() => setActiveSubmenu(null)}
                            >
                              <div className="flex items-center justify-between px-4 py-2 text-sm font-bold uppercase tracking-wide text-[color:var(--brand,#1c3068)] hover:bg-[#fcfafa] hover:text-[color:var(--accent,#c53336)] cursor-default">
                                {dropdownItem.label}
                                <ChevronDown size={12} className="-rotate-90" />
                              </div>
                              <AnimatePresence>
                                {activeSubmenu === dropdownItem.label && (
                                  <motion.div
                                    initial={{ opacity: 0, x: 8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 8 }}
                                    transition={{ duration: 0.15 }}
                                    className={`absolute top-0 left-full w-44 shadow-xl rounded-lg border-t-2 border-[color:var(--accent,#c53336)] py-2 ${glassDropdown}`}
                                  >
                                    {dropdownItem.subItems.map((sub, i) => (
                                      <Link
                                        key={i}
                                        to={sub.href}
                                        onClick={handleMouseLeave}
                                        className="block px-4 py-2 text-sm text-[color:var(--brand,#1c3068)] hover:bg-[#fcfafa] hover:text-[color:var(--accent,#c53336)]"
                                      >
                                        {sub.label}
                                      </Link>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          ) : (
                            <Link
                              key={index}
                              to={dropdownItem.href!}
                              onClick={handleMouseLeave}
                              className="block px-4 py-2 text-sm text-[color:var(--brand,#1c3068)] hover:bg-[#fcfafa] hover:text-[color:var(--accent,#c53336)]"
                            >
                              {dropdownItem.label}
                            </Link>
                          )
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            ))}
            
            <div className="pl-4">
              <Link 
                to={school ? `/login?school=${school}` : "/login"}
                className="bg-[color:var(--accent,#c53336)] hover:brightness-95 text-white px-6 py-2.5 rounded shadow-sm font-bold text-sm transition-colors uppercase tracking-wide inline-block"
              >
                Login
              </Link>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-[color:var(--brand,#1c3068)] hover:text-[color:var(--accent,#c53336)] focus:outline-none p-2"
            >
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className={`lg:hidden overflow-hidden ${glassPanel}`}
        >
          <div className="px-4 pt-2 pb-6 space-y-1">
            {navItems.map((item) => (
              <div key={item.name}>
                {item.href?.startsWith('/') ? (
                  <Link
                    to={item.href}
                    onClick={() => setIsOpen(false)}
                    className="w-full flex items-center justify-between px-3 py-3 rounded-md text-base font-bold text-[color:var(--brand,#1c3068)] hover:text-[color:var(--accent,#c53336)] hover:bg-[#fcfafa]"
                  >
                    <div className="flex items-center gap-2">
                       {item.icon}
                       {item.name}
                    </div>
                  </Link>
                ) : (
                  <button
                    onClick={() => {
                        if (item.hasDropdown) toggleDropdown(item.name);
                        else setIsOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-3 rounded-md text-base font-bold text-[color:var(--brand,#1c3068)] hover:text-[color:var(--accent,#c53336)] hover:bg-[#fcfafa]"
                  >
                    <div className="flex items-center gap-2">
                      {item.icon}
                      {item.name}
                    </div>
                    {item.hasDropdown && (
                      <ChevronDown 
                        size={16} 
                        className={`transform transition-transform ${activeDropdown === item.name ? 'rotate-180' : ''}`} 
                      />
                    )}
                  </button>
                )}
                
                {/* Mobile Dropdown */}
                {item.hasDropdown && activeDropdown === item.name && (
                  <div className="pl-4 bg-[#fcfafa] space-y-1 py-2 rounded-md mt-1">
                    {item.dropdownItems?.map((dropdownItem, index) => (
                      dropdownItem.subItems ? (
                        <div key={index}>
                          <button
                            onClick={() => setActiveSubmenu(activeSubmenu === dropdownItem.label ? null : dropdownItem.label)}
                            className="w-full flex items-center justify-between px-3 py-2 text-sm font-bold uppercase tracking-wide text-[color:var(--brand,#1c3068)] hover:text-[color:var(--accent,#c53336)]"
                          >
                            {dropdownItem.label}
                            <ChevronDown
                              size={14}
                              className={`transform transition-transform ${activeSubmenu === dropdownItem.label ? 'rotate-180' : ''}`}
                            />
                          </button>
                          {activeSubmenu === dropdownItem.label && (
                            <div className="pl-5 space-y-1 pb-1">
                              {dropdownItem.subItems.map((sub, i) => (
                                <Link
                                  key={i}
                                  to={sub.href}
                                  onClick={() => setIsOpen(false)}
                                  className="block px-3 py-2 text-sm text-[color:var(--brand,#1c3068)] hover:text-[color:var(--accent,#c53336)]"
                                >
                                  {sub.label}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <Link
                          key={index}
                          to={dropdownItem.href!}
                          onClick={() => setIsOpen(false)}
                          className="block px-3 py-2 text-sm text-[color:var(--brand,#1c3068)] hover:text-[color:var(--accent,#c53336)]"
                        >
                          {dropdownItem.label}
                        </Link>
                      )
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="pt-4 px-3">
              <Link 
                to={school ? `/login?school=${school}` : "/login"}
                className="w-full bg-[color:var(--accent,#c53336)] text-white px-5 py-3 rounded font-bold shadow-md uppercase tracking-wide inline-block text-center"
              >
                Login
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </nav>
  );
};
