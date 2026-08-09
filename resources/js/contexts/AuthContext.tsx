import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { setCurrentSchoolLogo } from '../lib/branding';

// Ensure the session cookie is sent with every request (needed for /api/me)
axios.defaults.withCredentials = true;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

export type Role = 'Admin' | 'Teacher' | 'Security';

export interface AuthUser {
  name: string;
  email: string;
  position: string;
  role: Role;
  /** Admin-uploaded logo for this user's school; null means use the bundled default. */
  schoolLogo: string | null;
  schoolName: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  role: Role | null;
  loading: boolean;
  refresh: () => Promise<AuthUser | null>;
  clear: () => void;
}

const STORAGE_KEY = 'ihadir_auth_user';

const AuthContext = createContext<AuthContextValue>({
  user: null,
  role: null,
  loading: true,
  refresh: async () => null,
  clear: () => {},
});

export const useAuth = () => useContext(AuthContext);

// Where each role lands after login / when redirected from a forbidden page.
export const homeForRole = (_role: Role | null): string => '/dashboard';

function readCache(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const cached = raw ? (JSON.parse(raw) as AuthUser) : null;
    // Seed the print helpers too, so an export fired before /api/me resolves
    // still carries the right logo.
    setCurrentSchoolLogo(cached?.schoolLogo ?? null);
    return cached;
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Seed from cache so the correct menu shows instantly on a hard refresh.
  const [user, setUser] = useState<AuthUser | null>(() => readCache());
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const res = await axios.get('/api/me');
      if (res.data?.success) {
        const d = res.data.data;
        const next: AuthUser = {
          name: d.name,
          email: d.email,
          position: d.position,
          role: d.role,
          schoolLogo: d.school_logo ?? null,
          schoolName: d.school_name ?? null,
        };
        setUser(next);
        // Publish for the PDF/print helpers, which run outside the React tree.
        setCurrentSchoolLogo(next.schoolLogo);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      }
      return null;
    } catch (err: any) {
      // Only drop the session on an explicit 401 — keep the cache on transient errors.
      if (err?.response?.status === 401) {
        setUser(null);
        localStorage.removeItem(STORAGE_KEY);
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setUser(null);
    setCurrentSchoolLogo(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <AuthContext.Provider value={{ user, role: user?.role ?? null, loading, refresh, clear }}>
      {children}
    </AuthContext.Provider>
  );
};
