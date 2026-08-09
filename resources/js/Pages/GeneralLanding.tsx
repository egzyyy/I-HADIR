import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Menu, X, ArrowRight, ScanLine, BarChart3, ShieldCheck } from 'lucide-react';
import BrandLogos from '../Components/common/BrandLogos';
import { useBranding } from '../hooks/useBranding';
import { glassNav, glassPanel } from '../lib/glass';
import { AboutSystem } from '../Components/landing/AboutSystem';
import { HowItWorks } from '../Components/landing/HowItWorks';
import { WhoIsItFor } from '../Components/landing/WhoIsItFor';
import { Footer } from '../Components/landing/Footer';
import { SchoolDirectory } from '../Components/landing/SchoolDirectory';

// --- General system navbar (product-level, not school-specific) ---
const GeneralNavbar = () => {
  const [open, setOpen] = useState(false);
  // System-level page: the I-HADIR logo leads, Fakulti Komputeran stays fixed.
  const { systemLogo } = useBranding();

  const links = [
    { label: 'About', href: '#about' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Schools', href: '#schools' },
  ];

  return (
    <nav className={`sticky top-0 z-50 font-sans ${glassNav}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center">
            <BrandLogos src={systemLogo} fallback="none" size="h-16" alt="I-HADIR" />
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-[#1c3068] hover:text-[#c53336] font-bold text-sm tracking-wide transition-colors uppercase"
              >
                {l.label}
              </a>
            ))}
          </div>

          <button
            onClick={() => setOpen(!open)}
            className="lg:hidden text-[#1c3068] p-2"
          >
            {open ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {open && (
        <div className={`lg:hidden px-4 py-4 space-y-1 ${glassPanel}`}>
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block px-3 py-3 rounded-md font-bold text-[#1c3068] hover:text-[#c53336] hover:bg-[#fcfafa]"
            >
              {l.label}
            </a>
          ))}
          <Link
            to="/login"
            className="block text-center bg-[#c53336] text-white px-5 py-3 rounded font-bold uppercase tracking-wide mt-2"
          >
            Login
          </Link>
        </div>
      )}
    </nav>
  );
};

// --- General introduction / hero (what is I-Hadir) ---
const GeneralHero = () => {
  const features = [
    { icon: ScanLine, label: 'QR & biometric check-in' },
    { icon: BarChart3, label: 'Live attendance reports' },
    { icon: ShieldCheck, label: 'Visitor & staff management' },
  ];

  return (
    <section className="relative bg-[#fcfafa] pt-16 pb-24 overflow-hidden">
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-[#1c3068] rounded-full blur-3xl opacity-10" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-[#2f4fa8] rounded-full blur-3xl opacity-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-[#c53336]/10 text-[#c53336] px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#c53336]" />
              </span>
              Smart School Attendance System
            </div>

            <h1 className="text-4xl lg:text-6xl font-extrabold text-[#1c3068] leading-tight mb-6">
              One system for a <span className="text-[#cec43a]">present</span>,
              <br className="hidden sm:block" /> connected school.
            </h1>

            <p className="text-lg text-gray-600 mb-8 max-w-lg leading-relaxed">
              I-Hadir is a unified attendance and school-management platform that
              tracks students, teachers, and staff in real time — keeping parents
              informed and administrators in control.
            </p>

            <div className="flex flex-wrap gap-4">
              <a
                href="#schools"
                className="inline-flex items-center gap-2 bg-[#1c3068] hover:bg-[#152450] text-white px-7 py-3.5 rounded-lg font-bold shadow-lg shadow-[#1c3068]/20 transition-all"
              >
                Find your school <ArrowRight size={18} />
              </a>
              <a
                href="#about"
                className="inline-flex items-center gap-2 bg-white border-2 border-[#1c3068] text-[#1c3068] hover:bg-[#1c3068] hover:text-white px-7 py-3.5 rounded-lg font-bold transition-all"
              >
                Learn more
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="grid grid-cols-2 gap-4"
          >
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.label}
                  className="bg-white rounded-2xl p-6 shadow-lg border border-gray-50 flex flex-col gap-4 hover:shadow-2xl hover:-translate-y-1 transition-all"
                >
                  <div className="w-14 h-14 rounded-xl bg-[#1c3068] flex items-center justify-center">
                    <Icon size={26} className="text-white" />
                  </div>
                  <p className="font-bold text-[#1c3068] leading-snug">{f.label}</p>
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default function GeneralLanding() {
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <GeneralNavbar />
      <GeneralHero />
      <SchoolDirectory />
      <div id="about">
        <AboutSystem />
      </div>
      <div id="how-it-works">
        <HowItWorks />
      </div>
      <WhoIsItFor />
      <Footer />
    </div>
  );
}
