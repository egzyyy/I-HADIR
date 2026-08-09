import React from 'react';
import { fkLogo, defaultSchoolLogo } from '../../lib/branding';

interface Props {
  /** Dynamic left logo — the school's own, or the I-HADIR system logo. */
  src?: string | null;
  /**
   * What to show when `src` is null.
   *  'school' — the bundled SK Pulau Serai crest (school-scoped pages).
   *  'none'   — nothing; the Fakulti Komputeran logo stands alone. Used on the
   *             general landing page until an admin uploads a system logo.
   */
  fallback?: 'school' | 'none';
  /** Tailwind height class applied to both logos. */
  size?: string;
  alt?: string;
  className?: string;
}

/**
 * Renders the school/system logo beside the fixed Fakulti Komputeran logo.
 * The right-hand logo is a bundled asset and is never configurable.
 */
const BrandLogos: React.FC<Props> = ({
  src,
  fallback = 'school',
  size = 'h-12',
  alt = 'School Logo',
  className = '',
}) => {
  const primary = src || (fallback === 'school' ? defaultSchoolLogo : null);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {primary && <img src={primary} alt={alt} className={`${size} w-auto object-contain`} />}
      <img
        src={fkLogo}
        alt="Fakulti Komputeran, Universiti Malaysia Pahang Al-Sultan Abdullah"
        className={`${size} w-auto object-contain`}
      />
    </div>
  );
};

export default BrandLogos;
