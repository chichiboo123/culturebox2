import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Language } from '@/lib/i18n';
import { t as translate } from '@/lib/i18n';
import type { User, School } from '@/lib/api';
import { API } from '@/lib/api';

interface AppContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
  user: User | null;
  setUser: (user: User | null) => void;
  isAdmin: boolean;
  setIsAdmin: (v: boolean) => void;
  adminToken: string | null;
  setAdminToken: (token: string | null) => void;
  schools: School[];
  refreshSchools: () => void;
  theme: string;
  setTheme: (theme: string) => void;
  logout: () => void;
  adminLogout: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    return (localStorage.getItem('dcb_lang') as Language) || 'ko';
  });
  const [user, setUserState] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('dcb_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [adminToken, setAdminTokenState] = useState<string | null>(() => {
    return localStorage.getItem('dcb_admin_token');
  });
  const [isAdmin, setIsAdminState] = useState(() => {
    // Only trust presence of the actual token, not the session marker alone.
    // The marker can be stale if the token was cleared without removing the marker.
    return !!localStorage.getItem('dcb_admin_token');
  });
  const [schools, setSchools] = useState<School[]>([]);
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('dcb_theme') || 'default';
  });

  useEffect(() => {
    API.getSchools().then(setSchools).catch(console.error);
  }, []);

  // Validate stored admin token on startup; clear if expired server-side
  useEffect(() => {
    const token = localStorage.getItem('dcb_admin_token');
    if (!token) {
      // Clean up any stale session marker that might have been left behind
      if (localStorage.getItem('dcb_admin_session') === 'active') {
        setIsAdminState(false);
        localStorage.removeItem('dcb_admin_session');
      }
      return;
    }
    API.validateAdminSession(token).then(res => {
      if (!res?.ok) {
        setAdminTokenState(null);
        setIsAdminState(false);
        localStorage.removeItem('dcb_admin_token');
        localStorage.removeItem('dcb_admin_session');
      }
    }).catch(() => {
      // Network error: keep session state as-is to avoid false logouts
    });
  }, []);

  useEffect(() => {
    document.body.className = document.body.className.replace(/\btheme-\S+/g, '').trim();
    if (theme !== 'default') document.body.classList.add('theme-' + theme);
    localStorage.setItem('dcb_theme', theme);
  }, [theme]);

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    localStorage.setItem('dcb_lang', l);
  }, []);

  const setUser = useCallback((u: User | null) => {
    setUserState(u);
    if (u) localStorage.setItem('dcb_user', JSON.stringify(u));
    else localStorage.removeItem('dcb_user');
  }, []);

  const setAdminToken = useCallback((token: string | null) => {
    setAdminTokenState(token);
    if (token) {
      localStorage.setItem('dcb_admin_token', token);
      setIsAdminState(true);
      localStorage.setItem('dcb_admin_session', 'active');
    } else {
      localStorage.removeItem('dcb_admin_token');
      localStorage.removeItem('dcb_admin_session');
      setIsAdminState(false);
    }
  }, []);

  const setIsAdmin = useCallback((v: boolean) => {
    setIsAdminState(v);
    if (v) localStorage.setItem('dcb_admin_session', 'active');
    else {
      localStorage.removeItem('dcb_admin_session');
      setAdminTokenState(null);
      localStorage.removeItem('dcb_admin_token');
    }
  }, []);

  const setTheme = useCallback((t: string) => {
    setThemeState(t);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, [setUser]);

  const adminLogout = useCallback(() => {
    if (adminToken) {
      API.adminLogout(adminToken).catch(console.error);
    }
    setAdminToken(null);
    setIsAdmin(false);
  }, [adminToken, setAdminToken, setIsAdmin]);

  const refreshSchools = useCallback(() => {
    API.getSchools().then(setSchools).catch(console.error);
  }, []);

  const tFn = useCallback((key: string) => translate(key, lang), [lang]);

  return (
    <AppContext.Provider value={{
      lang, setLang, t: tFn,
      user, setUser,
      isAdmin, setIsAdmin,
      adminToken, setAdminToken,
      schools, refreshSchools, theme, setTheme,
      logout, adminLogout,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
