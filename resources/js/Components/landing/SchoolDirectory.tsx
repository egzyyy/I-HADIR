import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowUpRight, MapPin, School as SchoolIcon, Clock } from 'lucide-react';
import { schools, School } from '../../data/schools';

// Visual content of a single school card (shared by the active/inactive states).
const CardBody = ({ school }: { school: School }) => (
  <>
    <div className="flex items-start gap-4">
      {/* Logo badge (monogram stands in for the school crest) */}
      <div
        className="flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md"
        style={{ backgroundColor: school.themeColor }}
      >
        {school.logo ? (
          <img
            src={school.logo}
            alt={`${school.shortName} logo`}
            className="w-full h-full object-contain rounded-2xl"
          />
        ) : (
          school.monogram
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3
          className={`font-bold text-[#1c3068] leading-snug ${school.hasPortal ? 'group-hover:text-[#c53336] transition-colors' : ''
            }`}
        >
          {school.name}
        </h3>
        <p className="flex items-center gap-1 text-xs text-gray-500 mt-1.5">
          <MapPin size={12} />
          {school.location}
        </p>
      </div>

      {school.hasPortal && (
        <ArrowUpRight
          size={20}
          className="text-gray-300 group-hover:text-[#c53336] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all flex-shrink-0"
        />
      )}
    </div>

    {school.hasPortal ? (
      <div
        className="mt-5 pt-4 border-t border-gray-100 text-sm font-semibold flex items-center justify-between"
        style={{ color: school.themeColor }}
      >
        <span>Visit portal</span>
        <span className="text-xs font-medium text-gray-400 group-hover:text-gray-600 transition-colors">
          /school/{school.slug}
        </span>
      </div>
    ) : (
      <div className="mt-5 pt-4 border-t border-gray-100 text-sm font-semibold flex items-center gap-1.5 text-gray-400">
        <Clock size={14} />
        <span>Coming soon</span>
      </div>
    )}
  </>
);

const SchoolCard = ({ school, idx }: { school: School; idx: number }) => {
  const base =
    'block bg-white rounded-2xl p-6 border border-gray-100 transition-all duration-300 h-full';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: idx * 0.08 }}
    >
      {school.hasPortal ? (
        <Link
          to={`/school/${school.slug}`}
          className={`group ${base} shadow-sm hover:shadow-2xl hover:-translate-y-1`}
        >
          <CardBody school={school} />
        </Link>
      ) : (
        // No portal yet — show the card but make it non-interactive.
        <div className={`${base} shadow-sm opacity-70 cursor-not-allowed`} aria-disabled="true">
          <CardBody school={school} />
        </div>
      )}
    </motion.div>
  );
};

// Directory of schools currently using I-Hadir. A school is "live" only when
// the backend confirms its slug exists (`/api/public/schools`); the static
// registry keeps supplying branding (colors, taglines, monograms).
export const SchoolDirectory = () => {
  const [liveSlugs, setLiveSlugs] = useState<Set<string> | null>(null);

  useEffect(() => {
    axios
      .get('/api/public/schools')
      .then((res) =>
        setLiveSlugs(new Set((res.data.data || []).map((s: { slug: string }) => s.slug)))
      )
      .catch(() => setLiveSlugs(null)); // API unreachable — fall back to static flags
  }, []);

  // Backend confirmation wins; static hasPortal is only the pre-fetch/offline fallback.
  const directory = schools.map((school) => ({
    ...school,
    hasPortal: liveSlugs ? liveSlugs.has(school.slug) : school.hasPortal,
  }));

  return (
    <section id="schools" className="py-24 bg-[#fcfafa] relative overflow-hidden">
      <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 bg-[#1c3068] rounded-full blur-3xl opacity-[0.06]" />
      <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-96 h-96 bg-[#2f4fa8] rounded-full blur-3xl opacity-[0.06]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 bg-[#1c3068]/10 text-[#1c3068] px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
            <SchoolIcon size={16} />
            Schools Using I-Hadir
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-[#1c3068] mb-6">
            Find Your <span className="text-[#c53336]">School</span>
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            Select your school below to visit its dedicated portal — view events,
            attendance, and sign in to the system.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {directory.map((school, idx) => (
            <SchoolCard key={school.slug} school={school} idx={idx} />
          ))}
        </div>
      </div>
    </section>
  );
};
