import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { availableLangs, type Language } from '@/lib/i18n';
import { getSchoolName } from '@/lib/api';
import { Menu, X } from 'lucide-react';

const themes = [
  { id: 'default', color: '#D97706' },
  { id: 'blue', color: '#60A5FA' },
  { id: 'green', color: '#34D399' },
  { id: 'pink', color: '#F472B6' },
];

export default function Navbar({ onLoginClick }: { onLoginClick: () => void }) {
  const { t, lang, setLang, user, isAdmin, theme, setTheme, logout, adminLogout, schools } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const navItems = [
    { path: '/', label: t('nav.home') },
    { path: '/create', label: t('nav.create') },
    { path: '/explore', label: t('nav.explore') },
    { path: '/myboxes', label: t('nav.myboxes') },
    ...(isAdmin ? [{ path: '/admin', label: t('nav.admin') }] : []),
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
    <nav className="sticky top-0 z-50 h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-full max-w-[1100px] items-center justify-between px-4">
        {/* Logo */}
        <button onClick={() => handleNav('/')} className="flex items-center gap-2 text-lg font-bold text-foreground">
          <span className="text-2xl">📦</span>
          <span>Culture Box</span>
        </button>

        {/* Desktop Nav */}
        <ul className="hidden items-center gap-1 md:flex">
          {navItems.map(item => (
            <li key={item.path}>
              <button
                onClick={() => handleNav(item.path)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Theme picker */}
          <div className="relative">
            <button onClick={() => { setThemeOpen(!themeOpen); setLangOpen(false); }} className="rounded-full p-2 hover:bg-muted" title="테마">
              🎨
            </button>
            {themeOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border bg-card p-2 shadow-lg animate-scale-in">
                <div className="px-3 py-1 text-xs font-semibold text-muted-foreground">테마 색상</div>
                {themes.map(th => (
                  <button
                    key={th.id}
                    onClick={() => { setTheme(th.id); setThemeOpen(false); }}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                      theme === th.id ? 'bg-primary/10 font-medium' : 'hover:bg-muted'
                    }`}
                  >
                    <span className="h-3 w-3 rounded-full" style={{ background: th.color }} />
                    {t(`theme.${th.id}`)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Language */}
          <div className="relative">
            <button onClick={() => { setLangOpen(!langOpen); setThemeOpen(false); }} className="rounded-full px-3 py-1.5 text-xs font-bold hover:bg-muted">
              {lang.toUpperCase()}
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-2 w-32 rounded-xl border border-border bg-card p-1 shadow-lg animate-scale-in">
                {availableLangs.map(l => (
                  <button
                    key={l.code}
                    onClick={() => { setLang(l.code); setLangOpen(false); }}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                      lang === l.code ? 'bg-primary/10 font-medium' : 'hover:bg-muted'
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
            <div className="hidden items-center gap-2 rounded-full bg-muted px-3 py-1.5 md:flex">
              <span className="text-sm">👤</span>
              <div className="text-xs">
                <div className="font-semibold">{user.name}</div>
                <div className="text-muted-foreground">{getSchoolName(school, lang)}</div>
              </div>
            </div>
          )}

          {/* Admin chip */}
          {isAdmin && (
            <div className="hidden items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 md:flex">
              <span className="text-xs font-semibold">⚙️ 관리자</span>
              <button onClick={() => { adminLogout(); navigate('/'); }} className="text-xs text-muted-foreground hover:text-foreground">
                {t('nav.logout')}
              </button>
            </div>
          )}

          {/* Login/Logout */}
          {!user && !isAdmin && (
            <button onClick={onLoginClick} className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              {t('nav.login')}
            </button>
          )}
          {user && !isAdmin && (
            <button onClick={() => { logout(); navigate('/'); }} className="hidden rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted md:block">
              {t('nav.logout')}
            </button>
          )}

          {/* Mobile toggle */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="rounded-lg p-2 hover:bg-muted md:hidden">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-b border-border bg-card p-4 md:hidden animate-slide-up">
          {navItems.map(item => (
            <button
              key={item.path}
              onClick={() => handleNav(item.path)}
              className={`block w-full rounded-lg px-4 py-3 text-left text-sm font-medium ${
                location.pathname === item.path ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
              }`}
            >
              {item.label}
            </button>
          ))}
          {user && (
            <button onClick={() => { logout(); navigate('/'); setMobileOpen(false); }} className="mt-2 block w-full rounded-lg px-4 py-3 text-left text-sm text-destructive hover:bg-muted">
              {t('nav.logout')}
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
