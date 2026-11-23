import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, ArrowRight, MapPin, LogIn, SearchX, Clock, ScanLine, BellRing, BarChart3,
  GraduationCap, Target, Eye, Trophy, BookOpen, Users, Heart, CalendarDays, UserRound
} from 'lucide-react';
import { getSchool, School } from '../data/schools';
import { Navbar } from '../Components/landing/Navbar';
import { Hero } from '../Components/landing/Hero';
import { Footer } from '../Components/landing/Footer';

// --- Live data from GET /api/public/schools/{slug} ---
// 1. Update interfaces at the top of SchoolLanding.tsx:
interface OrgMember {
  id?: string;
  parent_id?: string | null;
  name: string;
  position: string;
  level?: number;
  photo?: string | null;
}

interface LiveProfile {
  tagline: string | null;
  established_year: string | null;
  about: string | null;
  vision: string | null;
  mission: string | null;
  organization_mode?: 'builder' | 'image';
  organization_image?: string | null;
  organization: OrgMember[];
}

interface LiveSchool {
  logo: string | null;   // admin-uploaded; null means use the static default
  profile: LiveProfile;
  stats: { students: number; teachers: number; co_curriculars: number };
}

// --- Subtle staggered entrance for the hero content ---
const heroContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const heroItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

// --- Branded hero banner showing the individual school's identity ---
const SchoolHeroBanner = ({ school, tagline, logo }: { school: School; tagline?: string | null; logo?: string | null }) => {
  const features = [
    { icon: ScanLine, label: 'QR & biometric check-in' },
    { icon: BellRing, label: 'Instant parent SMS alerts' },
    { icon: BarChart3, label: 'Live attendance reports' },
  ];

  return (
    <section
      id="top"
      className="relative overflow-hidden text-white"
      style={{ backgroundColor: school.themeColor }}
    >
      {/* Depth gradient over the brand colour — kept light so the brand blue stays
          bright; heavier values muddy the hero without adding real depth. */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.22) 100%)' }}
      />
      {/* Faded fine grid for a modern technical texture */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '52px 52px',
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 30%, black, transparent)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 30%, black, transparent)',
        }}
      />
      <div className="absolute top-0 inset-x-0 h-px bg-white/15" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-12 pb-20 lg:pt-16 lg:pb-28">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-white/75 hover:text-white text-xs font-medium uppercase tracking-[0.18em] mb-12 lg:mb-16 transition-colors"
        >
          <ArrowLeft size={14} /> All schools
        </Link>

        <div className="grid lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          {/* LEFT — identity & calls to action */}
          <motion.div
            variants={heroContainer}
            initial="hidden"
            animate="show"
            className="lg:col-span-7"
          >
            <motion.div
              variants={heroItem}
              className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-black/20 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white/90 mb-6"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              Live on I-Hadir
            </motion.div>

            <motion.div
              variants={heroItem}
              className="flex items-center gap-2 text-white/75 text-xs font-medium uppercase tracking-[0.18em] mb-4"
            >
              <MapPin size={13} /> {school.location}
            </motion.div>

            <motion.h1
              variants={heroItem}
              className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.04] mb-5"
            >
              {school.name}
            </motion.h1>

            <motion.p
              variants={heroItem}
              className="text-base lg:text-lg text-white/70 max-w-lg leading-relaxed mb-9"
            >
              {tagline || school.tagline}
            </motion.p>

            <motion.div variants={heroItem} className="flex flex-wrap items-center gap-3">
              <Link
                to={`/login?school=${school.slug}`}
                className="inline-flex items-center gap-2 bg-white px-6 py-3 rounded-xl font-semibold text-sm shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5 hover:shadow-xl"
                style={{ color: school.themeColor }}
              >
                <LogIn size={17} /> Login to I-Hadir
              </Link>
              <a
                href="#events"
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white border border-white/45 bg-black/15 hover:bg-black/30 hover:border-white/70 transition-all"
              >
                View events
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </a>
            </motion.div>
          </motion.div>

          {/* RIGHT — glassmorphism identity / feature card */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5"
          >
            <div className="relative rounded-3xl border border-white/25 bg-black/20 backdrop-blur-xl p-7 sm:p-8 shadow-2xl shadow-black/40 overflow-hidden">
              <div className="relative flex items-center gap-4 mb-7">
                <div
                  className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center font-black text-2xl shadow-lg ring-1 ring-white/40 flex-shrink-0"
                  style={{ color: school.themeColor }}
                >
                  {(logo || school.logo) ? (
                    <img src={logo || `/${school.logo}`} alt={school.shortName} className="w-full h-full object-contain rounded-2xl" />
                  ) : (
                    school.monogram
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-white leading-tight truncate">{school.shortName}</p>
                  <p className="text-xs text-white/75 mt-0.5">Powered by I-Hadir</p>
                </div>
              </div>

              <div className="relative space-y-2.5">
                {features.map((f) => {
                  const Icon = f.icon;
                  return (
                    <div
                      key={f.label}
                      className="flex items-center gap-3 rounded-xl bg-black/15 border border-white/20 px-4 py-3 transition-colors hover:bg-black/30 hover:border-white/35"
                    >
                      <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
                        <Icon size={17} className="text-white" />
                      </div>
                      <span className="text-sm font-medium text-white">{f.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-0 inset-x-0 h-px bg-white/10" />
    </section>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// School-specific sections (about the school itself, not the I-Hadir product).
// NOTE: figures/copy are sensible placeholders — wire to real school data later.
// ─────────────────────────────────────────────────────────────────────────────

const sectionReveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
};

// Section 3 — About the school + key figures (live counts + admin-managed copy)
const SchoolAbout = ({ school, live }: { school: School; live: LiveSchool | null }) => {
  const fmt = (n: number | undefined) => (n === undefined ? '—' : n.toLocaleString());

  const established = live?.profile.established_year
    ? `Est. ${live.profile.established_year}`
    : 'Est. 1985';

  // Admin-written about copy wins; blank lines split it into paragraphs.
  const aboutParagraphs = live?.profile.about
    ? live.profile.about.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
    : null;

  const stats = [
    { icon: CalendarDays, value: established, label: 'Serving the community' },
    { icon: Users, value: fmt(live?.stats.students), label: 'Students enrolled' },
    { icon: GraduationCap, value: fmt(live?.stats.teachers), label: 'Dedicated educators' },
    { icon: Trophy, value: fmt(live?.stats.co_curriculars), label: 'Co-curricular clubs' },
  ];

  return (
    <section className="bg-white py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
          <motion.div {...sectionReveal}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-4" style={{ color: school.accentColor }}>
              About the school
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight leading-tight mb-6" style={{ color: school.themeColor }}>
              A place where every student is seen, supported, and present.
            </h2>
            {aboutParagraphs ? (
              aboutParagraphs.map((p, i) => (
                <p
                  key={i}
                  className={`text-gray-600 leading-relaxed ${i < aboutParagraphs.length - 1 ? 'mb-4' : ''}`}
                >
                  {p}
                </p>
              ))
            ) : (
              <>
                <p className="text-gray-600 leading-relaxed mb-4">
                  {school.name} is a national school in {school.location}, dedicated to
                  nurturing well-rounded students through strong academics, character
                  building, and an active school life.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  Our community of teachers, parents, and staff work together every day to
                  keep learning safe, disciplined, and caring — {school.tagline.toLowerCase()}
                </p>
              </>
            )}
          </motion.div>

          <motion.div
            {...sectionReveal}
            transition={{ ...sectionReveal.transition, delay: 0.1 }}
            className="grid grid-cols-2 gap-4"
          >
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="rounded-2xl border border-gray-100 bg-[#fcfafa] p-6 transition-shadow hover:shadow-md">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${school.themeColor}14`, color: school.themeColor }}
                  >
                    <Icon size={20} />
                  </div>
                  <p className="text-2xl font-bold" style={{ color: school.themeColor }}>{s.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{s.label}</p>
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// Section 4 — Vision & Mission (admin-managed copy with static fallback)
const SchoolVisionMission = ({
  school,
  vision,
  mission,
}: {
  school: School;
  vision?: string | null;
  mission?: string | null;
}) => {
  const cards = [
    { icon: Eye, title: 'Our Vision', body: vision || 'To develop disciplined, knowledgeable, and caring individuals who are present and ready to contribute to the nation.' },
    { icon: Target, title: 'Our Mission', body: mission || 'To deliver quality education in a safe, supportive environment that encourages every student to attend, participate, and excel.' },
  ];

  return (
    <section className="py-20 lg:py-28" style={{ backgroundColor: `${school.themeColor}08` }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div {...sectionReveal} className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-4" style={{ color: school.accentColor }}>
            Our aspiration
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight" style={{ color: school.themeColor }}>
            Vision &amp; Mission
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {cards.map((c, i) => {
            const Icon = c.icon;
            return (
              <motion.div
                key={c.title}
                {...sectionReveal}
                transition={{ ...sectionReveal.transition, delay: i * 0.1 }}
                className="rounded-3xl bg-white border border-gray-100 shadow-sm p-8 lg:p-10"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: `${school.themeColor}14`, color: school.themeColor }}
                >
                  <Icon size={22} />
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: school.themeColor }}>{c.title}</h3>
                <p className="text-gray-600 leading-relaxed">{c.body}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// 2. Replace SchoolOrganization in SchoolLanding.tsx:
const SchoolOrganization = ({
  school,
  profile,
}: {
  school: School;
  profile?: LiveProfile | null;
}) => {
  const orgImage = profile?.organization_image ?? null;
  const members = profile?.organization ?? [];

  if (!orgImage && members.length === 0) return null;

  const hasTreeStructure = members.some((m) => m.id);

  const MemberCard = ({ member, large = false }: { member: OrgMember; large?: boolean }) => (
    <div
      className={`rounded-2xl bg-white border border-gray-100 shadow-sm text-center transition-shadow hover:shadow-md ${
        large ? 'p-6 w-56' : 'p-5 w-48'
      }`}
    >
      <div
        className={`mx-auto rounded-full flex items-center justify-center mb-3 overflow-hidden ${
          large ? 'w-18 h-18' : 'w-14 h-14'
        }`}
        style={{ backgroundColor: `${school.themeColor}14`, color: school.themeColor }}
      >
        {member.photo ? (
          <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
        ) : (
          <UserRound size={large ? 30 : 24} />
        )}
      </div>
      <p className={`font-bold leading-snug ${large ? 'text-base' : 'text-sm'}`} style={{ color: school.themeColor }}>
        {member.name}
      </p>
      {member.position && (
        <p className={`text-gray-500 mt-1 ${large ? 'text-xs' : 'text-[11px]'}`}>{member.position}</p>
      )}
    </div>
  );

  const renderTree = (node: OrgMember, depth = 0) => {
    const children = members.filter((m) => m.parent_id === node.id);
    return (
      <div key={node.id} className="flex flex-col items-center">
        <MemberCard member={node} large={depth === 0} />
        {children.length > 0 && (
          <div className="flex flex-col items-center">
            <div className="w-0.5 h-6 bg-gray-300" />
            <div className="flex items-start justify-center">
              {children.map((child, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === children.length - 1;
                const isOnly = children.length === 1;
                return (
                  <div key={child.id} className="relative flex flex-col items-center px-3 pt-6">
                    {!isOnly && (
                      <>
                        {!isFirst && <div className="absolute top-0 left-0 right-1/2 h-0.5 bg-gray-300" />}
                        {!isLast && <div className="absolute top-0 left-1/2 right-0 h-0.5 bg-gray-300" />}
                      </>
                    )}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-gray-300" />
                    {renderTree(child, depth + 1)}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const rootNodes = hasTreeStructure
    ? members.filter((m) => !m.parent_id || !members.some((p) => p.id === m.parent_id))
    : [];

  return (
    <section className="py-20 lg:py-28" style={{ backgroundColor: `${school.themeColor}08` }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div {...sectionReveal} className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-4" style={{ color: school.accentColor }}>
            Who leads us
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight" style={{ color: school.themeColor }}>
            School Organization
          </h2>
        </motion.div>

        {orgImage ? (
          <motion.div {...sectionReveal} className="flex justify-center">
            <a
              href={orgImage}
              target="_blank"
              rel="noreferrer"
              className="block max-w-5xl w-full rounded-3xl overflow-hidden bg-white border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow"
            >
              <img
                src={orgImage}
                alt={`${school.name} Organization Chart`}
                className="w-full h-auto object-contain rounded-2xl"
              />
            </a>
          </motion.div>
        ) : (
          <div className="overflow-x-auto pb-4">
            <div className="inline-flex min-w-full justify-center gap-8">
              {rootNodes.map((root) => renderTree(root, 0))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

// Section 5 — School life / what defines the school
const SchoolLife = ({ school }: { school: School }) => {
  const pillars = [
    { icon: GraduationCap, title: 'Academic Excellence', body: 'A structured curriculum that helps every child build confidence and reach their potential.' },
    { icon: Trophy, title: 'Co-Curricular & Sports', body: 'Clubs, uniformed bodies, and sport houses that grow teamwork, talent, and leadership.' },
    { icon: Heart, title: 'Character & Discipline', body: 'Values-driven guidance that shapes respectful, responsible, and present students.' },
    { icon: BookOpen, title: 'A Caring Community', body: 'Teachers, parents, and staff working closely to support each student along the way.' },
  ];

  return (
    <section className="bg-white py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div {...sectionReveal} className="max-w-2xl mb-14">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-4" style={{ color: school.accentColor }}>
            School life
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold tracking-tight leading-tight" style={{ color: school.themeColor }}>
            More than a school — a place to grow.
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.title}
                {...sectionReveal}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ ...sectionReveal.transition, duration: 0.5, delay: i * 0.08 }}
                className="group rounded-2xl border border-gray-100 p-7 transition-all hover:shadow-md hover:-translate-y-1"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${school.themeColor}14`, color: school.themeColor }}
                >
                  <Icon size={22} />
                </div>
                <h3 className="font-bold mb-2" style={{ color: school.themeColor }}>{p.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{p.body}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// --- Fallback for unknown slugs OR schools without a live portal yet ---
const SchoolUnavailable = ({ slug, school }: { slug?: string; school?: School }) => (
  <div className="min-h-screen bg-[#fcfafa] flex items-center justify-center px-4 font-sans">
    <div className="text-center max-w-md">
      <div className="w-20 h-20 mx-auto rounded-2xl bg-[#1c3068]/10 flex items-center justify-center mb-6">
        {school ? <Clock size={40} className="text-[#1c3068]" /> : <SearchX size={40} className="text-[#1c3068]" />}
      </div>
      {school ? (
        <>
          <h1 className="text-3xl font-black text-[#1c3068] mb-3">Portal coming soon</h1>
          <p className="text-gray-600 mb-8">
            <span className="font-semibold text-[#1c3068]">{school.name}</span> is on
            I-Hadir, but its public landing page isn&apos;t live yet. Check back soon.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-black text-[#1c3068] mb-3">School not found</h1>
          <p className="text-gray-600 mb-8">
            We couldn&apos;t find a school for{' '}
            <span className="font-mono font-semibold text-[#c53336]">/school/{slug}</span>.
            It may have moved or isn&apos;t using I-Hadir yet.
          </p>
        </>
      )}
      <Link
        to="/"
        className="inline-flex items-center gap-2 bg-[#1c3068] hover:bg-[#152450] text-white px-7 py-3.5 rounded-lg font-bold shadow-lg transition-colors"
      >
        <ArrowLeft size={18} /> Back to all schools
      </Link>
    </div>
  </div>
);

export default function SchoolLanding() {
  const { slug } = useParams<{ slug: string }>();
  const school = getSchool(slug);

  // One fetch for everything admin-managed on this page: live stats + profile copy.
  const [live, setLive] = useState<LiveSchool | null>(null);

  useEffect(() => {
    if (!school?.hasPortal) return;
    axios
      .get(`/api/public/schools/${school.slug}`)
      .then((res) => setLive(res.data.data ?? null))
      .catch(() => setLive(null)); // static fallback copy renders when unreachable
  }, [school?.slug, school?.hasPortal]);

  // Only schools with a live portal render a page; others fall back gracefully.
  if (!school || !school.hasPortal) {
    return <SchoolUnavailable slug={slug} school={school} />;
  }

  return (
    // `--brand`/`--accent` expose the school colors to any descendant that wants
    // them — Navbar, Contact and Footer all read these vars, so the shared
    // chrome follows the school palette instead of the hardcoded fallbacks.
    <div
      className="min-h-screen bg-white font-sans text-gray-900"
      style={{ ['--brand' as any]: school.themeColor, ['--accent' as any]: school.accentColor }}
    >
      <Navbar />
      <SchoolHeroBanner school={school} tagline={live?.profile.tagline} logo={live?.logo} />
      <div id="events">
        <Hero slug={school.slug} />
      </div>
      <div id="about">
        <SchoolAbout school={school} live={live} />
      </div>
      <SchoolVisionMission
        school={school}
        vision={live?.profile.vision}
        mission={live?.profile.mission}
      />
      <SchoolOrganization school={school} profile={live?.profile} />
      <SchoolLife school={school} />
      <Footer />
    </div>
  );
}
