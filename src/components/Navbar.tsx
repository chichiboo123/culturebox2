import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { availableLangs, type Language } from '@/lib/i18n';
import { getSchoolName } from '@/lib/api';
import { Menu, X, Globe, Palette, LogOut } from 'lucide-react';

const themes = [
  { id: 'default', label: 'theme.default', emoji: '🌻' },
  { id: 'blue', label: 'theme.blue', emoji: '🦋' },
  { id: 'green', label: 'theme.green', emoji: '🌿' },
  { id: 'pink', label: 'theme.pink', emoji: '🌸' },
];

export default function Navbar({ onLoginClick }: { onLoginClick: () => void }) {
  const { t, lang, setLang, user, isAdmin, theme, setTheme, logout, adminLogout, schools } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdown, setDropdown] = useState<'theme' | 'lang' | null>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropdown(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navItems = [
    { path: '/', label: t('nav.home'), emoji: '🏠' },
    { path: '/create', label: t('nav.create'), emoji: '✨' },
    { path: '/explore', label: t('nav.explore'), emoji: '📦' },
    { path: '/myboxes', label: t('nav.myboxes'), emoji: '💝' },
    ...(isAdmin ? [{ path: '/admin', label: t('nav.admin'), emoji: '⚙️' }] : []),
  ];

  const handleNav = (path: string) => {
    const protectedPaths = ['/explore', '/create', '/myboxes'];
    if (protectedPaths.includes(path) && !user && !isAdmin) {
      onLoginClick();
      return;
    }
    navigate(path);
    setMobileOpen(false);
  };

  const school = user ? schools.find(s => s.id === user.school_id) : null;

  return (
    <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 glass">
      <div className="mx-auto flex h-16 max-w-[1100px] items-center justify-between px-4">
        {/* Logo */}
        <button onClick={() => handleNav('/')} className="flex shrink-0 items-center gap-2.5 btn-bounce">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary text-lg shadow-sm">📦</span>
          <span className="whitespace-nowrap text-lg font-bold tracking-tight text-foreground">Culture Box</span>
        </button>

        {/* Desktop Nav */}
        <ul className="hidden items-center gap-1 md:flex">
          {navItems.map(item => (
            <li key={item.path}>
              <button
                onClick={() => handleNav(item.path)}
                className={`rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-200 ${
                  location.pathname === item.path
                    ? 'bg-primary/10 text-primary shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <span className="mr-1">{item.emoji}</span>
                {item.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="flex items-center gap-1.5" ref={dropRef}>
          {/* Theme picker */}
          <div className="relative">
            <button
              onClick={() => setDropdown(dropdown === 'theme' ? null : 'theme')}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title="테마"
            >
              <Palette className="h-4 w-4" />
            </button>
            {dropdown === 'theme' && (
              <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-border bg-card p-2 shadow-xl animate-slide-down">
                <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">테마 색상</div>
                {themes.map(th => (
                  <button
                    key={th.id}
                    onClick={() => { setTheme(th.id); setDropdown(null); }}
                    className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-all ${
                      theme === th.id ? 'bg-primary/10 font-semibold text-primary' : 'hover:bg-muted'
                    }`}
                  >
                    <span className="text-base">{th.emoji}</span>
                    {t(th.label)}
                    {theme === th.id && <span className="ml-auto text-xs">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Language */}
          <div className="relative">
            <button
              onClick={() => setDropdown(dropdown === 'lang' ? null : 'lang')}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Globe className="h-4 w-4" />
            </button>
            {dropdown === 'lang' && (
              <div className="absolute right-0 top-full mt-2 w-36 rounded-2xl border border-border bg-card p-1.5 shadow-xl animate-slide-down">
                {availableLangs.map(l => (
                  <button
                    key={l.code}
                    onClick={() => { setLang(l.code); setDropdown(null); }}
                    className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition-all ${
                      lang === l.code ? 'bg-primary/10 font-semibold text-primary' : 'hover:bg-muted'
                    }`}
                  >
                    {l.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User chip */}
          {user && !isAdmin && (
            <div className="hidden items-center gap-2 rounded-2xl bg-muted/70 px-3 py-1.5 md:flex max-w-[180px]">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                {user.name.charAt(0)}
              </div>
              <div className="min-w-0 text-xs leading-tight">
                <div className="truncate font-semibold">{user.name}</div>
                <div className="truncate text-muted-foreground">{getSchoolName(school, lang)}</div>
              </div>
            </div>
          )}

          {/* Admin chip */}
          {isAdmin && (
            <div className="hidden items-center gap-2 rounded-2xl bg-primary/10 px-3 py-1.5 md:flex">
              <span className="text-xs font-bold text-primary">⚙️ 관리자</span>
              <button onClick={() => { adminLogout(); navigate('/'); }} className="text-xs text-muted-foreground hover:text-foreground">
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Login / Logout */}
          {!user && !isAdmin && (
            <button onClick={onLoginClick} className="hidden rounded-2xl gradient-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-md btn-bounce md:block">
              {t('nav.login')}
            </button>
          )}
          {user && !isAdmin && (
            <button onClick={() => { logout(); navigate('/'); }} className="hidden items-center gap-1.5 rounded-2xl border border-border px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:flex">
              <LogOut className="h-3.5 w-3.5" />
              {t('nav.logout')}
            </button>
          )}

          {/* Mobile toggle */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-muted md:hidden">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-b border-border bg-card/95 p-4 glass md:hidden animate-slide-down">
          <div className="space-y-1">
            {navItems.map(item => (
              <button
                key={item.path}
                onClick={() => handleNav(item.path)}
                className={`flex w-full items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                  location.pathname === item.path ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                }`}
              >
                <span>{item.emoji}</span>
                {item.label}
              </button>
            ))}
          </div>
          {user && (
            <div className="mt-3 border-t border-border pt-3">
              <div className="flex items-center gap-3 px-4 py-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                  {user.name.charAt(0)}
                </div>
                <div className="text-sm">
                  <div className="font-semibold">{user.name}</div>
                  <div className="text-xs text-muted-foreground">{getSchoolName(school, lang)}</div>
                </div>
              </div>
              <button onClick={() => { logout(); navigate('/'); setMobileOpen(false); }} className="mt-2 flex w-full items-center gap-2 rounded-xl px-4 py-3 text-sm text-destructive hover:bg-destructive/10">
                <LogOut className="h-4 w-4" />
                {t('nav.logout')}
              </button>
            </div>
          )}
          {isAdmin && (
            <div className="mt-3 border-t border-border pt-3">
              <div className="flex items-center gap-3 px-4 py-2">
                <span className="text-sm font-bold text-primary">⚙️ 관리자</span>
              </div>
              <button onClick={() => { adminLogout(); navigate('/'); setMobileOpen(false); }} className="mt-1 flex w-full items-center gap-2 rounded-xl px-4 py-3 text-sm text-destructive hover:bg-destructive/10">
                <LogOut className="h-4 w-4" />
                {t('nav.logout')}
              </button>
            </div>
          )}
          {!user && !isAdmin && (
            <button onClick={() => { onLoginClick(); setMobileOpen(false); }} className="mt-3 w-full rounded-2xl gradient-primary py-3 text-sm font-semibold text-primary-foreground shadow-md">
              {t('nav.login')}
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
