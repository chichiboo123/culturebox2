import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { API, type Item, getItemTitle, getItemContent } from '@/lib/api';
import type { Language } from '@/lib/i18n';
import { ExternalLink } from 'lucide-react';
import { extractYouTubeId, toGoogleDriveImageUrl, toGoogleDrivePdfEmbedUrl } from '@/lib/media';

interface Props {
  item: Item | null;
  open: boolean;
  onClose: () => void;
  lang: Language;
}

const langOptions: { code: Language; label: string }[] = [
  { code: 'ko', label: 'KOR' },
  { code: 'en', label: 'ENG' },
  { code: 'ja', label: 'JPN' },
];

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

export default function ItemDetailModal({ item, open, onClose, lang: defaultLang }: Props) {
  const [viewLang, setViewLang] = useState<Language>(defaultLang);
  const [dynamicTitle, setDynamicTitle] = useState<string>('');
  const [dynamicContent, setDynamicContent] = useState<string>('');

  if (!item) return null;

  const title = dynamicTitle || getItemTitle(item, viewLang);
  const localizedContent = dynamicContent || getItemContent(item, viewLang);
  const mediaSource = item.file_url || localizedContent || item.content || '';

  // For YouTube, try content first, then file_url
  const youtubeSource = item.file_url || localizedContent || item.content || '';
  const youtubeId = item.type === 'youtube' ? extractYouTubeId(youtubeSource) : null;

  const needsRuntimeTranslation = useMemo(() => {
    if (viewLang === 'ko') return false;
    if (viewLang === 'en') return !item.title_en || !item.content_en;
    if (viewLang === 'ja') return !item.title_ja || !item.content_ja;
    return false;
  }, [item, viewLang]);

  useEffect(() => {
    setDynamicTitle('');
    setDynamicContent('');
  }, [item?.id]);

  useEffect(() => {
    let cancelled = false;
    if (!open || !item || !needsRuntimeTranslation) return;
    const target = viewLang === 'ko' ? 'ko' : viewLang;

    (async () => {
      try {
        const [translatedTitle, translatedContent] = await Promise.all([
          API.translate(item.title || '', target),
          API.translate(item.content || '', target),
        ]);
        if (!cancelled) {
          setDynamicTitle(translatedTitle || '');
          setDynamicContent(translatedContent || '');
        }
      } catch (err) {
        console.warn('Runtime translation failed:', err);
      }
    })();

    return () => { cancelled = true; };
  }, [open, item, viewLang, needsRuntimeTranslation]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); setViewLang(defaultLang); } }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border-border/60 p-0">
        {/* Header */}
        <div className="sticky top-0 z-10 rounded-t-3xl border-b border-border bg-card/95 glass px-6 pt-6 pb-4">
          <DialogHeader>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-xl">
                  {renderItemIcon(item.type)}
                </span>
                <div>
                  <DialogTitle className="text-lg font-bold leading-snug">
                    {title}
                  </DialogTitle>
                  <DialogDescription className="text-[11px] uppercase tracking-wider font-bold">
                    {item.type}
                  </DialogDescription>
                </div>
              </div>
              {/* Language selector */}
              <div className="flex gap-1">
                {langOptions.map(lo => (
                  <button
                    key={lo.code}
                    onClick={() => setViewLang(lo.code)}
                    className={`rounded-xl px-3 py-1.5 text-[11px] font-bold transition-all ${
                      viewLang === lo.code
                        ? 'gradient-primary text-primary-foreground shadow-sm'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {lo.label}
                  </button>
                ))}
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 pt-4">
          {item.type === 'text' && (
            <div className="rounded-2xl bg-muted/30 p-5">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {localizedContent}
              </p>
            </div>
          )}

          {item.type === 'image' && mediaSource && (
            <img
              src={toGoogleDriveImageUrl(mediaSource)}
              alt={title}
              className="w-full rounded-2xl object-contain max-h-[60vh]"
            />
          )}

          {item.type === 'video' && mediaSource && (
            <video
              src={mediaSource}
              controls
              className="w-full rounded-2xl max-h-[60vh]"
            />
          )}

          {item.type === 'youtube' && (
            youtubeId ? (
              <div className="aspect-video overflow-hidden rounded-2xl shadow-sm">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&modestbranding=1`}
                  className="h-full w-full"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  title={title}
                />
              </div>
            ) : (
              <div className="rounded-2xl bg-muted/30 p-5 text-center">
                <p className="text-sm text-muted-foreground">유효한 YouTube URL을 확인해주세요</p>
                <p className="mt-1 text-xs text-muted-foreground/70 break-all">{youtubeSource}</p>
              </div>
            )
          )}

          {item.type === 'link' && (
            <a
              href={mediaSource}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 rounded-2xl bg-primary/5 border border-primary/15 p-4 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
            >
              <ExternalLink className="h-4 w-4 shrink-0" />
              <span className="truncate">{mediaSource}</span>
            </a>
          )}

          {item.type === 'pdf' && mediaSource && (
            <div className="space-y-3">
              <div className="aspect-[4/5] overflow-hidden rounded-2xl border border-border shadow-sm">
                <iframe
                  src={toGoogleDrivePdfEmbedUrl(mediaSource)}
                  className="h-full w-full"
                  title={title}
                  allow="autoplay"
                />
              </div>
              <a
                href={mediaSource}
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
