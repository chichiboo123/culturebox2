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
  const [isAdmin, setIsAdminState] = useState(() => {
    return localStorage.getItem('dcb_admin_session') === 'active';
  });
  const [schools, setSchools] = useState<School[]>([]);
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('dcb_theme') || 'default';
  });

  // Load schools
  useEffect(() => {
    API.getSchools().then(setSchools).catch(console.error);
  }, []);

  // Apply theme class
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

  const setIsAdmin = useCallback((v: boolean) => {
    setIsAdminState(v);
    if (v) localStorage.setItem('dcb_admin_session', 'active');
    else localStorage.removeItem('dcb_admin_session');
  }, []);

  const setTheme = useCallback((t: string) => {
    setThemeState(t);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, [setUser]);

  const adminLogout = useCallback(() => {
    setIsAdmin(false);
  }, [setIsAdmin]);

  const refreshSchools = useCallback(() => {
    API.getSchools().then(setSchools).catch(console.error);
  }, []);

  const tFn = useCallback((key: string) => translate(key, lang), [lang]);

  return (
    <AppContext.Provider value={{
      lang, setLang, t: tFn,
      user, setUser,
      isAdmin, setIsAdmin,
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
