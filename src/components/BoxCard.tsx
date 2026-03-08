import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { type Box, type School, getBoxTitle, getSchoolName, getBoxGradient } from '@/lib/api';
import { Package, MessageCircle } from 'lucide-react';

interface Props {
  box: Box;
  schools: School[];
  itemCount?: number;
  msgCount?: number;
}

const statusConfig: Record<string, { bg: string; label: string }> = {
  draft: { bg: 'bg-muted text-muted-foreground', label: 'status.draft' },
  packed: { bg: 'bg-amber-100 text-amber-700', label: 'status.packed' },
  sent: { bg: 'bg-blue-100 text-blue-700', label: 'status.sent' },
  arrived: { bg: 'bg-orange-100 text-orange-700', label: 'status.arrived' },
  opened: { bg: 'bg-emerald-100 text-emerald-700', label: 'status.opened' },
};

export default function BoxCard({ box, schools, itemCount = 0, msgCount = 0 }: Props) {
  const { t, lang } = useApp();
  const navigate = useNavigate();
  const fromSchool = schools.find(s => s.id === box.from_school_id);
  const status = statusConfig[box.status] || statusConfig.draft;

  return (
    <div
      onClick={() => navigate(`/box/${box.id}`)}
      className="group cursor-pointer overflow-hidden rounded-3xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-primary/20"
    >
      {/* Cover */}
      <div
        className="relative flex h-36 items-end p-5"
        style={{ background: getBoxGradient(box.id) }}
      >
        {/* Floating box emoji */}
        <div className="absolute right-4 top-4 text-4xl opacity-30 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
          📦
        </div>
        {/* Status badge */}
        <span className={`absolute left-4 top-4 rounded-full px-3 py-1 text-[11px] font-bold ${status.bg}`}>
          {t(status.label)}
        </span>
        {/* Info */}
        <div className="relative z-10 text-white">
          <div className="mb-1 text-[11px] font-medium opacity-80">
            🏫 {getSchoolName(fromSchool, lang)}
          </div>
          <div className="text-base font-bold leading-snug drop-shadow-md">
            {getBoxTitle(box, lang)}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex items-center justify-between px-5 py-3.5">
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Package className="h-3.5 w-3.5" />
            {itemCount}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" />
            {msgCount}
          </span>
        </div>
        <span className="text-xs font-semibold text-primary opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0.5">
          열어보기 →
        </span>
      </div>
    </div>
  );
}
