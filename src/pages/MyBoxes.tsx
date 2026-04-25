import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { API, type Box } from '@/lib/api';
import BoxCard from '@/components/BoxCard';
import { Button } from '@/components/ui/button';
import { Plus, Package } from 'lucide-react';

export default function MyBoxes() {
  const { t, user, schools } = useApp();
  const navigate = useNavigate();
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [boxCounts, setBoxCounts] = useState<Record<string, { items: number; messages: number }>>({});

  useEffect(() => {
    if (!user) return;
    API.getBoxes({ school_id: user.school_id }).then(data => {
      setBoxes(data.filter(b => b.created_by === user.id));
    }).catch(console.error);
  }, [user]);

  useEffect(() => {
    if (boxes.length === 0) {
      setBoxCounts({});
      return;
    }
    Promise.all(
      boxes.map(async box => {
        const [items, messages] = await Promise.all([API.getItems(box.id), API.getMessages(box.id)]);
        return [box.id, { items: items.length, messages: messages.length }] as const;
      }),
    ).then(entries => setBoxCounts(Object.fromEntries(entries))).catch(console.error);
  }, [boxes]);

  return (
    <div className="container mx-auto max-w-[1100px] px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold animate-slide-up">💝 {t('nav.myboxes')}</h1>
          <p className="mt-1 text-sm text-muted-foreground animate-slide-up" style={{ animationDelay: '50ms' }}>
            {t('myboxes.subtitle')}
          </p>
        </div>
        <Button onClick={() => navigate('/create')} className="rounded-2xl gradient-primary text-primary-foreground shadow-sm btn-bounce gap-1.5">
          <Plus className="h-4 w-4" />
          {t('nav.create')}
        </Button>
      </div>

      {boxes.length === 0 ? (
        <div className="py-24 text-center animate-scale-in">
          <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-[2rem] bg-muted/60">
            <Package className="h-12 w-12 text-muted-foreground/40" />
          </div>
          <p className="text-lg font-medium text-muted-foreground">{t('myboxes.empty')}</p>
          <p className="mt-1 text-sm text-muted-foreground/70">첫 번째 문화 박스를 만들어보세요!</p>
          <Button className="mt-6 rounded-2xl gradient-primary text-primary-foreground shadow-md btn-bounce gap-1.5" onClick={() => navigate('/create')}>
            <Plus className="h-4 w-4" />
            {t('myboxes.empty.btn')}
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {boxes.map((box, i) => (
            <div key={box.id} className="animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
              <BoxCard
                box={box}
                schools={schools}
                itemCount={boxCounts[box.id]?.items}
                msgCount={boxCounts[box.id]?.messages}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
