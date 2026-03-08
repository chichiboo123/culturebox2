import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { type Item, getItemTitle } from '@/lib/api';
import type { Language } from '@/lib/i18n';

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
  // If it's already a Google Drive URL, extract file ID
  const driveMatch = fileUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch) {
    return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
  }
  // For any URL, use Google Docs viewer
  return `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
}

export default function ItemDetailModal({ item, open, onClose, lang }: Props) {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{renderItemIcon(item.type)}</span>
            {getItemTitle(item, lang)}
          </DialogTitle>
          <DialogDescription className="text-xs uppercase tracking-wider">
            {item.type}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {item.type === 'text' && (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {item.content}
            </p>
          )}

          {item.type === 'image' && item.file_url && (
            <img
              src={item.file_url}
              alt={getItemTitle(item, lang)}
              className="w-full rounded-lg object-contain max-h-[60vh]"
            />
          )}

          {item.type === 'video' && item.file_url && (
            <video
              src={item.file_url}
              controls
              className="w-full rounded-lg max-h-[60vh]"
            />
          )}

          {item.type === 'youtube' && item.content && (
            <div className="aspect-video overflow-hidden rounded-lg">
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
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              🔗 {item.content}
            </a>
          )}

          {item.type === 'pdf' && item.file_url && (
            <div className="space-y-3">
              <div className="aspect-[4/5] overflow-hidden rounded-lg border border-border">
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
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                📥 원본 파일 열기
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
