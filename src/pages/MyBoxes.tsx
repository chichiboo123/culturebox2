import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { API, type Box } from '@/lib/api';
import BoxCard from '@/components/BoxCard';
import { Button } from '@/components/ui/button';

export default function MyBoxes() {
  const { t, user, schools } = useApp();
  const navigate = useNavigate();
  const [boxes, setBoxes] = useState<Box[]>([]);

  useEffect(() => {
    if (!user) return;
    API.getBoxes({ school_id: user.school_id }).then(data => {
      setBoxes(data.filter(b => b.created_by === user.id));
    }).catch(console.error);
  }, [user]);

  return (
    <div className="container mx-auto max-w-[1100px] px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('nav.myboxes')}</h1>
        <Button onClick={() => navigate('/create')}>{t('nav.create')}</Button>
      </div>

      {boxes.length === 0 ? (
        <div className="py-20 text-center">
          <div className="text-5xl">📭</div>
          <p className="mt-4 text-muted-foreground">{t('myboxes.empty')}</p>
          <Button className="mt-4" onClick={() => navigate('/create')}>
            {t('myboxes.empty.btn')}
          </Button>
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
