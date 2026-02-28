import React, { useState } from 'react';
import { Menu, X, ChevronDown, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import logo from '../../assets/i_hadir_logo2.png';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const navItems = [
    { name: 'HOME', icon: <Home size={16} />, href: '#' },
    { 
      name: 'ATTENDANCE', 
      hasDropdown: true,
      dropdownItems: [
        { label: 'Check In', href: '#attendance-checkin' },
        { label: 'Check Out', href: '#attendance-checkout' },
        { label: 'Security Staff Check In', href: '#security-checkin' },
        { label: 'Security Staff Check Out', href: '#security-checkout' }
      ]
    },
    { 
      name: 'PRAYER', 
      hasDropdown: true, 
      dropdownItems: [
        { label: 'Check In', href: '#prayer-checkin' },
        { label: 'Check Out', href: '#prayer-checkout' }
      ]
    },
    { 
      name: 'PSS', 
      hasDropdown: true,
      dropdownItems: [
        { label: 'Check In', href: '#pss-checkin' },
        { label: 'Check Out', href: '#pss-checkout' }
      ]
    },
    { 
      name: 'ICT', 
      hasDropdown: true,
      dropdownItems: [
        { label: 'Check In', href: '#ict-checkin' },
        { label: 'Check Out', href: '#ict-checkout' }
      ]
    },
    { 
      name: 'ACTIVITY', 
      hasDropdown: true,
      dropdownItems: [
        { label: 'Check Out', href: '#activity-checkout' }
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
    <nav className="sticky top-0 z-50 bg-[#fcfafa] shadow-sm border-b border-gray-100 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24">
          
          {/* Logo Section */}
          <div className="flex-shrink-0 flex items-center cursor-pointer py-2">
             <img src={logo} alt="I-HADIR Logo" className="h-24 w-auto object-contain" />
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
                    className="flex items-center gap-1 text-[#1c3068] hover:text-[#c53336] font-bold text-xs tracking-wide transition-colors py-8 uppercase"
                  >
                    {item.icon && <span className="mr-1">{item.icon}</span>}
                    {item.name}
                  </Link>
                ) : (
                  <a
                    href={item.href || '#'}
                    className="flex items-center gap-1 text-[#1c3068] hover:text-[#c53336] font-bold text-xs tracking-wide transition-colors py-8 uppercase"
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
                        className="absolute top-full left-0 w-56 bg-white shadow-xl rounded-b-lg border-t-2 border-[#c53336] py-2"
                      >
                        {item.dropdownItems?.map((dropdownItem, index) => (
                          <a 
                            key={index}
                            href={dropdownItem.href} 
                            className="block px-4 py-2 text-sm text-[#1c3068] hover:bg-[#fcfafa] hover:text-[#c53336]"
                          >
                            {dropdownItem.label}
                          </a>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            ))}
            
            <div className="pl-4">
              <Link 
                to="/login"
                className="bg-[#c53336] hover:bg-[#a02224] text-white px-6 py-2.5 rounded shadow-sm font-bold text-sm transition-colors uppercase tracking-wide inline-block"
              >
                Login
              </Link>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-[#1c3068] hover:text-[#c53336] focus:outline-none p-2"
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
          className="lg:hidden bg-white border-t border-gray-100 overflow-hidden"
        >
          <div className="px-4 pt-2 pb-6 space-y-1">
            {navItems.map((item) => (
              <div key={item.name}>
                {item.href?.startsWith('/') ? (
                  <Link
                    to={item.href}
                    onClick={() => setIsOpen(false)}
                    className="w-full flex items-center justify-between px-3 py-3 rounded-md text-base font-bold text-[#1c3068] hover:text-[#c53336] hover:bg-[#fcfafa]"
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
                    className="w-full flex items-center justify-between px-3 py-3 rounded-md text-base font-bold text-[#1c3068] hover:text-[#c53336] hover:bg-[#fcfafa]"
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
                  <div className="pl-8 bg-[#fcfafa] space-y-1 py-2 rounded-md mt-1">
                    {item.dropdownItems?.map((dropdownItem, index) => (
                      <a 
                        key={index}
                        href={dropdownItem.href} 
                        className="block px-3 py-2 text-sm text-[#1c3068] hover:text-[#c53336]"
                      >
                        {dropdownItem.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="pt-4 px-3">
              <Link 
                to="/login"
                className="w-full bg-[#c53336] text-white px-5 py-3 rounded font-bold shadow-md uppercase tracking-wide inline-block text-center"
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
