import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { API, type Box } from '@/lib/api';
import BoxCard from '@/components/BoxCard';
import { Button } from '@/components/ui/button';

export default function Home({ onLoginClick }: { onLoginClick: () => void }) {
  const { t, user, isAdmin, schools } = useApp();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ schools: 0, boxes: 0, items: 0 });
  const [recentBoxes, setRecentBoxes] = useState<Box[]>([]);

  useEffect(() => {
    API.getStats().then(setStats).catch(console.error);
    API.getBoxes().then(boxes => {
      setRecentBoxes(boxes.filter(b => b.status !== 'draft').slice(0, 3));
    }).catch(console.error);
  }, []);

  const isLoggedIn = !!(user || isAdmin);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden py-16 md:py-24" style={{ background: 'hsl(var(--color-hero-bg))' }}>
        {/* Decorations */}
        <div className="pointer-events-none absolute left-[10%] top-[15%] text-4xl animate-float">🌟</div>
        <div className="pointer-events-none absolute right-[15%] top-[20%] text-5xl animate-float-delay-1">📦</div>
        <div className="pointer-events-none absolute left-[70%] top-[60%] text-3xl animate-float-delay-2">🎨</div>

        <div className="container mx-auto max-w-[1100px] px-4 text-center">
          <div className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            {t('hero.badge')}
          </div>
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight md:text-6xl" style={{ color: 'hsl(var(--color-hero-title))' }}>
            {t('landing.title')}
          </h1>
          <p className="mb-2 text-lg font-semibold md:text-xl" style={{ color: 'hsl(var(--color-hero-subtitle))' }}>
            {t('landing.subtitle')}
          </p>
          <p className="mx-auto mb-8 max-w-lg whitespace-pre-line text-muted-foreground">
            {t('landing.desc')}
          </p>

          {!isLoggedIn ? (
            <div className="mx-auto max-w-sm rounded-2xl border border-border bg-card p-6 shadow-md animate-slide-up">
              <h3 className="mb-2 text-lg font-bold">{t('hero.login.title')}</h3>
              <p className="mb-4 text-sm text-muted-foreground">{t('hero.login.desc')}</p>
              <Button onClick={onLoginClick} size="lg" className="w-full">
                {t('hero.login.btn')}
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-3 animate-slide-up">
              <Button size="lg" onClick={() => navigate('/explore')}>
                {t('landing.cta.explore')}
              </Button>
              <Button size="lg" variant="secondary" onClick={() => navigate('/create')}>
                {t('landing.cta.create')}
              </Button>
            </div>
          )}

          {/* Stats */}
          <div className="mt-12 flex justify-center gap-8 md:gap-16">
            {[
              { value: stats.schools, label: t('landing.stats.schools') },
              { value: stats.boxes, label: t('landing.stats.boxes') },
              { value: stats.items, label: t('landing.stats.items') },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-extrabold text-primary md:text-4xl">{s.value}</div>
                <div className="text-xs text-muted-foreground md:text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16">
        <div className="container mx-auto max-w-[1100px] px-4">
          <h2 className="mb-10 text-center text-2xl font-bold md:text-3xl">{t('how.title')}</h2>
          <div className="grid gap-6 md:grid-cols-4">
            {[
              { num: 1, icon: '🔑', titleKey: 'how.login.title', descKey: 'how.login.desc' },
              { num: 2, icon: '📦', titleKey: 'how.step1.title', descKey: 'how.step1.desc' },
              { num: 3, icon: '🎁', titleKey: 'how.step2.title', descKey: 'how.step2.desc' },
              { num: 4, icon: '🎉', titleKey: 'how.step4.title', descKey: 'how.step4.desc' },
            ].map(step => (
              <div key={step.num} className="group rounded-2xl border border-border bg-card p-6 text-center transition-all hover:-translate-y-1 hover:shadow-md">
                <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {step.num}
                </div>
                <div className="mb-3 text-4xl">{step.icon}</div>
                <h3 className="mb-2 font-bold">{t(step.titleKey)}</h3>
                <p className="text-sm text-muted-foreground">{t(step.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Boxes */}
      {recentBoxes.length > 0 && (
        <section className="pb-16">
          <div className="container mx-auto max-w-[1100px] px-4">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold">최근 박스</h2>
              <button onClick={() => navigate('/explore')} className="text-sm font-medium text-primary hover:underline">
                전체 보기 →
              </button>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {recentBoxes.map(box => (
                <BoxCard key={box.id} box={box} schools={schools} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
