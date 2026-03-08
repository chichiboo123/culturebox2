import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { type Box, type School, getBoxTitle, getSchoolName, getBoxGradient } from '@/lib/api';

interface Props {
  box: Box;
  schools: School[];
  itemCount?: number;
  msgCount?: number;
}

export default function BoxCard({ box, schools, itemCount = 0, msgCount = 0 }: Props) {
  const { t, lang } = useApp();
  const navigate = useNavigate();
  const fromSchool = schools.find(s => s.id === box.from_school_id);

  return (
    <div
      onClick={() => navigate(`/box/${box.id}`)}
      className="group cursor-pointer overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      {/* Cover */}
      <div
        className="relative flex h-40 items-end p-4"
        style={{ background: getBoxGradient(box.id) }}
      >
        <span className="absolute right-3 top-3 text-4xl opacity-40">📦</span>
        <span className={`absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-semibold text-white
          ${box.status === 'draft' ? 'bg-gray-400' :
            box.status === 'packed' ? 'bg-amber-500' :
            box.status === 'sent' ? 'bg-blue-500' :
            box.status === 'arrived' ? 'bg-amber-600' :
            'bg-emerald-500'}`}
        >
          {t(`status.${box.status}`)}
        </span>
        <div className="relative z-10 text-white">
          <div className="text-xs opacity-80">
            {t('unbox.from')} {getSchoolName(fromSchool, lang)}
          </div>
          <div className="text-lg font-bold leading-tight drop-shadow">
            {getBoxTitle(box, lang)}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex items-center justify-between p-4">
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span>📦 {itemCount} {t('item.add')}</span>
          <span>💬 {msgCount}</span>
        </div>
        <span className="text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
          {t('unbox.tap')} ›
        </span>
      </div>
    </div>
  );
}
