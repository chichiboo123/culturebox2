import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { type Item, getItemTitle } from '@/lib/api';
import type { Language } from '@/lib/i18n';
import { ExternalLink } from 'lucide-react';

interface Props {
  item: Item | null;
  open: boolean;
  onClose: () => void;
  lang: Language;
}

function renderItemIcon(type: string) {
  switch (type) {
    case 'text': return '📝';
    case 'image': return '🖼️';
    case 'video': return '🎬';
    case 'youtube': return '▶️';
    case 'link': return '🔗';
    case 'pdf': return '📄';
    default: return '📦';
  }
}

function extractYouTubeId(url: string): string {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]+)/);
  return match?.[1] || url;
}

function getGoogleDrivePreviewUrl(fileUrl: string): string | null {
  const driveMatch = fileUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch) {
    return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
  }
  return `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
}

export default function ItemDetailModal({ item, open, onClose, lang }: Props) {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border-border/60 p-0">
        {/* Header */}
        <div className="sticky top-0 z-10 rounded-t-3xl border-b border-border bg-card/95 glass px-6 pt-6 pb-4">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-xl">
                {renderItemIcon(item.type)}
              </span>
              <div>
                <DialogTitle className="text-lg font-bold leading-snug">
                  {getItemTitle(item, lang)}
                </DialogTitle>
                <DialogDescription className="text-[11px] uppercase tracking-wider font-bold">
                  {item.type}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 pt-4">
          {item.type === 'text' && (
            <div className="rounded-2xl bg-muted/30 p-5">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {item.content}
              </p>
            </div>
          )}

          {item.type === 'image' && item.file_url && (
            <img
              src={item.file_url}
              alt={getItemTitle(item, lang)}
              className="w-full rounded-2xl object-contain max-h-[60vh]"
            />
          )}

          {item.type === 'video' && item.file_url && (
            <video
              src={item.file_url}
              controls
              className="w-full rounded-2xl max-h-[60vh]"
            />
          )}

          {item.type === 'youtube' && item.content && (
            <div className="aspect-video overflow-hidden rounded-2xl shadow-sm">
              <iframe
                src={`https://www.youtube.com/embed/${extractYouTubeId(item.content)}`}
                className="h-full w-full"
                allowFullScreen
                title={getItemTitle(item, lang)}
              />
            </div>
          )}

          {item.type === 'link' && (
            <a
              href={item.content}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 rounded-2xl bg-primary/5 border border-primary/15 p-4 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
            >
              <ExternalLink className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.content}</span>
            </a>
          )}

          {item.type === 'pdf' && item.file_url && (
            <div className="space-y-3">
              <div className="aspect-[4/5] overflow-hidden rounded-2xl border border-border shadow-sm">
                <iframe
                  src={getGoogleDrivePreviewUrl(item.file_url) || ''}
                  className="h-full w-full"
                  title={getItemTitle(item, lang)}
                  allow="autoplay"
                />
              </div>
              <a
                href={item.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-muted px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/80"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                원본 파일 열기
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
