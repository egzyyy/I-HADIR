import { useEffect, useState } from 'react';
import axios from 'axios';

interface Branding {
  systemLogo: string | null;
  schoolLogo: string | null;
  schoolName: string | null;
}

/**
 * Reads logos from the public /api/branding endpoint — for screens that render
 * before (or without) a session, such as the login page and the landing pages.
 * Pass a school slug to also resolve that school's logo.
 */
export function useBranding(slug?: string): Branding {
  const [branding, setBranding] = useState<Branding>({
    systemLogo: null,
    schoolLogo: null,
    schoolName: null,
  });

  useEffect(() => {
    let cancelled = false;

    axios
      .get('/api/branding', { params: slug ? { slug } : undefined })
      .then((res) => {
        if (cancelled || !res.data?.success) return;
        const d = res.data.data;
        setBranding({
          systemLogo: d.system_logo ?? null,
          schoolLogo: d.school_logo ?? null,
          schoolName: d.school_name ?? null,
        });
      })
      // Non-fatal: the components fall back to their bundled defaults.
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return branding;
}
