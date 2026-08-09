import fkLogo from '../assets/fk_logo.png';
import defaultSchoolLogo from '../assets/school_logo_default.png';

export { fkLogo, defaultSchoolLogo };

/**
 * The two brand logos always appear together: a dynamic logo on the left
 * (the school's own, or the I-HADIR system logo where no school is in scope)
 * and the UMPSA Fakulti Komputeran logo on the right, which never changes.
 */

/**
 * The logged-in user's school logo, published here by AuthContext.
 *
 * PDF/print exports build raw HTML strings from module-level helpers that sit
 * outside the React tree, so they can't read context. Keeping the current value
 * here lets `printLogoHeader()` stay argument-free at ~14 call sites.
 */
let currentSchoolLogo: string | null = null;

export const setCurrentSchoolLogo = (url: string | null): void => {
  currentSchoolLogo = url;
};

export const getCurrentSchoolLogo = (): string | null => currentSchoolLogo;

/** CSS for the print/PDF header. Injected alongside each export's own styles. */
export const printLogoCss = `
  .logo-row { display: flex; align-items: center; justify-content: center; gap: 24px; margin-bottom: 15px; }
  .logo-row img { max-height: 80px; width: auto; }
`;

/**
 * Header markup for print/PDF exports: the school logo beside the fixed
 * Fakulti Komputeran logo. Omit the argument to use the logged-in user's
 * school; falls back to the bundled default crest when nothing is set.
 */
export const printLogoHeader = (schoolLogo?: string | null): string => `
  <div class="logo-row">
    <img src="${schoolLogo || currentSchoolLogo || defaultSchoolLogo}" alt="School Logo" />
    <img src="${fkLogo}" alt="Fakulti Komputeran UMPSA" />
  </div>`;
