import { useEffect, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { API, type Box, getSchoolName } from '@/lib/api';
import BoxCard from '@/components/BoxCard';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

const FILTERS = ['all', 'sent', 'opened'] as const;

export default function Explore() {
  const { t, user, isAdmin, schools, lang } = useApp();
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    API.getBoxes({ status: filter === 'all' ? undefined : filter, search: search || undefined })
      .then(data => {
        let visible = filter === 'all' ? data.filter(b => b.status !== 'draft') : data;
        if (!isAdmin && user) {
          visible = visible.filter(b => b.from_school_id === user.school_id || b.to_school_id === user.school_id);
        }
        setBoxes(visible);
      })
      .catch(console.error);
  }, [filter, search, user, isAdmin]);

  const school = user ? schools.find(s => s.id === user.school_id) : undefined;

  return (
    <div className="container mx-auto max-w-[1100px] px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold animate-slide-up">📦 {t('nav.explore')}</h1>
        <p className="mt-1 text-sm text-muted-foreground animate-slide-up" style={{ animationDelay: '50ms' }}>
          {t('explore.subtitle')}
        </p>
      </div>

      {/* Search + School banner */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('explore.search')}
            className="rounded-2xl border-border/60 pl-9"
          />
        </div>

        {!isAdmin && user && school && (
          <div className="flex items-center gap-2 rounded-2xl bg-primary/5 border border-primary/10 px-4 py-2 text-sm">
            <span>🏫</span>
            <span className="font-semibold">{getSchoolName(school, lang)}</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-2xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
              filter === f
                ? 'gradient-primary text-primary-foreground shadow-md'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {t(`filter.${f}`)}
          </button>
        ))}
      </div>

      {/* Grid */}
      {boxes.length === 0 ? (
        <div className="py-24 text-center animate-scale-in">
          <div className="mb-4 text-6xl">📭</div>
          <p className="text-lg font-medium text-muted-foreground">{t('common.empty')}</p>
          <p className="mt-1 text-sm text-muted-foreground/70">{t('explore.empty.hint')}</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {boxes.map((box, i) => (
            <div key={box.id} className="animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
              <BoxCard box={box} schools={schools} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
