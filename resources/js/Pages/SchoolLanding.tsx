import React from 'react';
import { motion } from 'motion/react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, MapPin, LogIn, SearchX, Clock, ScanLine, BellRing, BarChart3,
  GraduationCap, Target, Eye, Trophy, BookOpen, Users, Heart, CalendarDays
} from 'lucide-react';
import { getSchool, School } from '../data/schools';
import { Navbar } from '../Components/landing/Navbar';
import { Hero } from '../Components/landing/Hero';
import { FAQ } from '../Components/landing/FAQ';
import { Contact } from '../Components/landing/Contact';
import { Footer } from '../Components/landing/Footer';

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
const SchoolHeroBanner = ({ school }: { school: School }) => {
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
      {/* Depth gradient over the brand colour */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.50) 100%)' }}
      />
      {/* Mesh-style accent glows */}
      <div
        className="absolute -top-40 -right-32 w-[40rem] h-[40rem] rounded-full blur-[120px] opacity-30"
        style={{ backgroundColor: school.accentColor }}
      />
      <div
        className="absolute -bottom-48 -left-40 w-[36rem] h-[36rem] rounded-full blur-[120px] opacity-20"
        style={{ backgroundColor: school.accentColor }}
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
          className="inline-flex items-center gap-2 text-white/60 hover:text-white text-xs font-medium uppercase tracking-[0.18em] mb-12 lg:mb-16 transition-colors"
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
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white/80 mb-6"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              Live on I-Hadir
            </motion.div>

            <motion.div
              variants={heroItem}
              className="flex items-center gap-2 text-white/60 text-xs font-medium uppercase tracking-[0.18em] mb-4"
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
              {school.tagline}
            </motion.p>

            <motion.div variants={heroItem} className="flex flex-wrap items-center gap-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 bg-white px-6 py-3 rounded-xl font-semibold text-sm shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5 hover:shadow-xl"
                style={{ color: school.themeColor }}
              >
                <LogIn size={17} /> Login to I-Hadir
              </Link>
              <a
                href="#events"
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white/90 border border-white/25 hover:bg-white/10 hover:border-white/40 transition-all"
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
            <div className="relative rounded-3xl border border-white/15 bg-white/10 backdrop-blur-xl p-7 sm:p-8 shadow-2xl shadow-black/30 overflow-hidden">
              {/* inner accent glow */}
              <div
                className="absolute -top-10 -right-10 w-36 h-36 rounded-full blur-2xl opacity-40"
                style={{ backgroundColor: school.accentColor }}
              />

              <div className="relative flex items-center gap-4 mb-7">
                <div
                  className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center font-black text-2xl shadow-lg ring-1 ring-white/40 flex-shrink-0"
                  style={{ color: school.themeColor }}
                >
                  {school.logo ? (
                    <img src={school.logo} alt={school.shortName} className="w-full h-full object-contain rounded-2xl" />
                  ) : (
                    school.monogram
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-white leading-tight truncate">{school.shortName}</p>
                  <p className="text-xs text-white/60 mt-0.5">Powered by I-Hadir</p>
                </div>
              </div>

              <div className="relative space-y-2.5">
                {features.map((f) => {
                  const Icon = f.icon;
                  return (
                    <div
                      key={f.label}
                      className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 px-4 py-3 transition-colors hover:bg-white/10"
                    >
                      <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                        <Icon size={17} className="text-white" />
                      </div>
                      <span className="text-sm font-medium text-white/85">{f.label}</span>
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

// Section 3 — About the school + key figures
const SchoolAbout = ({ school }: { school: School }) => {
  const stats = [
    { icon: CalendarDays, value: 'Est. 1985', label: 'Serving the community' },
    { icon: Users, value: '600+', label: 'Students enrolled' },
    { icon: GraduationCap, value: '40+', label: 'Dedicated educators' },
    { icon: Trophy, value: '20+', label: 'Co-curricular clubs' },
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
            <p className="text-gray-600 leading-relaxed mb-4">
              {school.name} is a national school in {school.location}, dedicated to
              nurturing well-rounded students through strong academics, character
              building, and an active school life.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Our community of teachers, parents, and staff work together every day to
              keep learning safe, disciplined, and caring — {school.tagline.toLowerCase()}
            </p>
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

// Section 4 — Vision & Mission
const SchoolVisionMission = ({ school }: { school: School }) => {
  const cards = [
    { icon: Eye, title: 'Our Vision', body: 'To develop disciplined, knowledgeable, and caring individuals who are present and ready to contribute to the nation.' },
    { icon: Target, title: 'Our Mission', body: 'To deliver quality education in a safe, supportive environment that encourages every student to attend, participate, and excel.' },
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

  // Only schools with a live portal render a page; others fall back gracefully.
  if (!school || !school.hasPortal) {
    return <SchoolUnavailable slug={slug} school={school} />;
  }

  return (
    // `--brand` exposes the school color to any descendant that wants it.
    <div
      className="min-h-screen bg-white font-sans text-gray-900"
      style={{ ['--brand' as any]: school.themeColor }}
    >
      <Navbar />
      <SchoolHeroBanner school={school} />
      <div id="events">
        <Hero />
      </div>
      <div id="about">
        <SchoolAbout school={school} />
      </div>
      <SchoolVisionMission school={school} />
      <SchoolLife school={school} />
      <FAQ />
      <div id="contact">
        <Contact />
      </div>
      <Footer />
    </div>
  );
}
