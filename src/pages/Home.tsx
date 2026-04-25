import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { API, type Box } from '@/lib/api';
import BoxCard from '@/components/BoxCard';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Package, School, Layers } from 'lucide-react';

export default function Home({ onLoginClick }: { onLoginClick: () => void }) {
  const { t, user, isAdmin, schools } = useApp();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ schools: 0, boxes: 0, items: 0 });
  const [recentBoxes, setRecentBoxes] = useState<Box[]>([]);
  const [boxCounts, setBoxCounts] = useState<Record<string, { items: number; messages: number }>>({});

  useEffect(() => {
    API.getStats().then(setStats).catch(console.error);
    API.getBoxes().then(boxes => {
      setRecentBoxes(boxes.filter(b => b.status !== 'draft').slice(0, 3));
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (recentBoxes.length === 0) return;
    Promise.all(
      recentBoxes.map(async box => {
        const [items, messages] = await Promise.all([API.getItems(box.id), API.getMessages(box.id)]);
        return [box.id, { items: items.length, messages: messages.length }] as const;
      }),
    ).then(entries => setBoxCounts(Object.fromEntries(entries))).catch(console.error);
  }, [recentBoxes]);

  const isLoggedIn = !!(user || isAdmin);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden gradient-hero">
        {/* Decorative elements */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[8%] top-[12%] text-5xl animate-float opacity-60">🌍</div>
          <div className="absolute right-[12%] top-[18%] text-6xl animate-float-delay-1 opacity-50">📦</div>
          <div className="absolute left-[65%] top-[65%] text-4xl animate-float-delay-2 opacity-50">✨</div>
          <div className="absolute left-[20%] top-[70%] text-3xl animate-float-delay-1 opacity-40">🎨</div>
          <div className="absolute right-[25%] top-[75%] text-3xl animate-float opacity-30">🌸</div>
          {/* Soft gradient orbs */}
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -right-20 bottom-0 h-48 w-48 rounded-full bg-accent/8 blur-3xl" />
        </div>

        <div className="container relative mx-auto max-w-[1100px] px-4 py-20 md:py-28">
          <div className="mx-auto max-w-2xl text-center">
            {/* Badge */}
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-2 text-sm font-medium text-primary animate-pop-in">
              <Sparkles className="h-4 w-4" />
              {t('hero.badge')}
            </div>

            {/* Title */}
            <h1 className="mb-4 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl lg:text-6xl animate-slide-up"
              style={{ color: 'hsl(var(--color-hero-title))' }}
            >
              {t('landing.title')}
            </h1>

            {/* Subtitle */}
            <p className="mb-3 text-lg font-semibold md:text-xl animate-slide-up"
              style={{ color: 'hsl(var(--color-hero-subtitle))', animationDelay: '100ms' }}
            >
              {t('landing.subtitle')}
            </p>
            <p className="mx-auto mb-10 max-w-md whitespace-pre-line text-sm leading-relaxed text-muted-foreground animate-slide-up"
              style={{ animationDelay: '200ms' }}
            >
              {t('landing.desc')}
            </p>

            {/* CTA */}
            {!isLoggedIn ? (
              <div className="mx-auto max-w-sm rounded-3xl border border-border/60 bg-card/80 p-8 shadow-xl glass animate-scale-in"
                style={{ animationDelay: '300ms' }}
              >
                <div className="mb-3 text-4xl">🔑</div>
                <h3 className="mb-2 text-lg font-bold">{t('hero.login.title')}</h3>
                <p className="mb-5 text-sm text-muted-foreground">{t('hero.login.desc')}</p>
                <Button onClick={onLoginClick} size="lg" className="w-full rounded-2xl gradient-primary text-primary-foreground shadow-lg btn-bounce">
                  {t('hero.login.btn')}
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap justify-center gap-3 animate-scale-in" style={{ animationDelay: '300ms' }}>
                <Button size="lg" onClick={() => navigate('/explore')} className="rounded-2xl gradient-primary text-primary-foreground shadow-lg btn-bounce gap-2">
                  <Package className="h-4 w-4" />
                  {t('landing.cta.explore')}
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/create')} className="rounded-2xl border-2 shadow-sm btn-bounce gap-2">
                  <Sparkles className="h-4 w-4" />
                  {t('landing.cta.create')}
                </Button>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="mx-auto mt-16 flex max-w-lg justify-center gap-6 md:gap-12">
            {[
              { value: stats.schools, label: t('landing.stats.schools'), icon: School, color: 'text-secondary' },
              { value: stats.boxes, label: t('landing.stats.boxes'), icon: Package, color: 'text-primary' },
              { value: stats.items, label: t('landing.stats.items'), icon: Layers, color: 'text-accent' },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 animate-slide-up" style={{ animationDelay: `${400 + i * 100}ms` }}>
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-card shadow-sm ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div className="text-2xl font-extrabold text-foreground md:text-3xl">{s.value}</div>
                <div className="text-[11px] font-medium text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="container mx-auto max-w-[1100px] px-4">
          <div className="mb-3 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-3 py-1 text-xs font-bold text-secondary">
              📖 GUIDE
            </span>
          </div>
          <h2 className="mb-12 text-center text-2xl font-bold md:text-3xl">{t('how.title')}</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { num: 1, icon: '🔑', titleKey: 'how.login.title', descKey: 'how.login.desc' },
              { num: 2, icon: '📦', titleKey: 'how.step1.title', descKey: 'how.step1.desc' },
              { num: 3, icon: '🎁', titleKey: 'how.step2.title', descKey: 'how.step2.desc' },
              { num: 4, icon: '🎉', titleKey: 'how.step4.title', descKey: 'how.step4.desc' },
            ].map((step, i) => (
              <div
                key={step.num}
                className="group relative rounded-3xl border border-border bg-card p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/20 animate-slide-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                {/* Step number */}
                <div className="mx-auto mb-4 flex h-8 w-8 items-center justify-center rounded-full gradient-primary text-xs font-bold text-primary-foreground shadow-sm">
                  {step.num}
                </div>
                <div className="mb-3 text-4xl transition-transform duration-300 group-hover:scale-110">
                  {step.icon}
                </div>
                <h3 className="mb-2 text-sm font-bold">{t(step.titleKey)}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{t(step.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Boxes */}
      {recentBoxes.length > 0 && (
        <section className="pb-20">
          <div className="container mx-auto max-w-[1100px] px-4">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <span className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  🆕 NEW
                </span>
                <h2 className="mt-2 text-xl font-bold">{t('home.recent.boxes')}</h2>
              </div>
              <button onClick={() => navigate('/explore')} className="flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary/80 btn-bounce">
                {t('home.view.all')}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {recentBoxes.map((box, i) => (
                <div key={box.id} className="animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                  <BoxCard
                    box={box}
                    schools={schools}
                    itemCount={boxCounts[box.id]?.items}
                    msgCount={boxCounts[box.id]?.messages}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
