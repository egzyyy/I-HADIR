// Central registry of schools using the I-Hadir system.
//
// For now this is a static config (no backend). Each school's `slug` drives its
// URL (`/school/:slug`), and `themeColor` / `accentColor` drive its individual
// branding on the school landing page. Pulau Serai is the fully-real example;
// the rest are placeholders so the directory looks populated.

export interface School {
  slug: string;        // URL segment -> /school/:slug
  name: string;        // Full official name
  shortName: string;   // Compact name for badges/nav
  monogram: string;    // Initials shown in the logo badge (logo stand-in)
  themeColor: string;  // Primary brand color
  accentColor: string; // Secondary/accent brand color
  location: string;    // City, State
  tagline: string;     // One-line motto for the hero banner
  hasPortal: boolean;  // Whether this school has a live landing page yet
  logo?: string;       // Optional real logo asset/URL; falls back to monogram
}

export const schools: School[] = [
  {
    slug: 'pulau-serai',
    name: 'Sekolah Kebangsaan Pulau Serai',
    shortName: 'SK Pulau Serai',
    logo: '/storage/school-logo/sk-pulau-serai-logo.jpg',
    monogram: 'PS',
    themeColor: '#1c3068',
    accentColor: '#c53336',
    location: 'Dungun, Terengganu',
    tagline: 'Building a smart, present, and disciplined generation.',
    hasPortal: true,
  },
  {
    slug: 'seri-mawar',
    name: 'Sekolah Kebangsaan Seri Mawar',
    shortName: 'SK Seri Mawar',
    monogram: 'SM',
    themeColor: '#1f7a3d',
    accentColor: '#e0a92e',
    location: 'Shah Alam, Selangor',
    tagline: 'Nurturing excellence, one day at a time.',
    hasPortal: false,
  },
  {
    slug: 'bandar-baru',
    name: 'Sekolah Menengah Kebangsaan Bandar Baru',
    shortName: 'SMK Bandar Baru',
    monogram: 'BB',
    themeColor: '#5b2a86',
    accentColor: '#d65db1',
    location: 'Kuantan, Pahang',
    tagline: 'Discipline today, leaders tomorrow.',
    hasPortal: false,
  },
  {
    slug: 'taman-desa',
    name: 'Sekolah Kebangsaan Taman Desa',
    shortName: 'SK Taman Desa',
    monogram: 'TD',
    themeColor: '#0d7d8c',
    accentColor: '#f0803c',
    location: 'Johor Bahru, Johor',
    tagline: 'Every student present, every student counts.',
    hasPortal: false,
  },
  {
    slug: 'cempaka',
    name: 'Sekolah Menengah Kebangsaan Cempaka',
    shortName: 'SMK Cempaka',
    monogram: 'CK',
    themeColor: '#c0641f',
    accentColor: '#1c3068',
    location: 'Ipoh, Perak',
    tagline: 'Knowledge, integrity, and presence.',
    hasPortal: false,
  },
  {
    slug: 'bukit-indah',
    name: 'Sekolah Kebangsaan Bukit Indah',
    shortName: 'SK Bukit Indah',
    monogram: 'BI',
    themeColor: '#a02224',
    accentColor: '#cec43a',
    location: 'Kota Kinabalu, Sabah',
    tagline: 'A connected school for a brighter future.',
    hasPortal: false,
  },
];

export const getSchool = (slug?: string): School | undefined =>
  schools.find((s) => s.slug === slug);
