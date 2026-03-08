import { useEffect, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { API, type Box, getSchoolName } from '@/lib/api';
import BoxCard from '@/components/BoxCard';
import { Input } from '@/components/ui/input';

const FILTERS = ['all', 'arrived', 'sent', 'opened'] as const;

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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t('nav.explore')}</h1>
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('explore.search')}
          className="w-48"
        />
      </div>

      {/* School banner */}
      {!isAdmin && user && school && (
        <div className="mb-6 rounded-xl bg-primary/5 p-3 text-center text-sm font-medium">
          🏫 <strong>{getSchoolName(school, lang)}</strong>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {t(`filter.${f}`)}
          </button>
        ))}
      </div>

      {/* Grid */}
      {boxes.length === 0 ? (
        <div className="py-20 text-center">
          <div className="text-5xl">📭</div>
          <p className="mt-4 text-muted-foreground">{t('common.empty')}</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {boxes.map(box => (
            <BoxCard key={box.id} box={box} schools={schools} />
          ))}
        </div>
      )}
    </div>
  );
}
