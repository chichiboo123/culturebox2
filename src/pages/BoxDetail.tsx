import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { API, type Box, type Item, type Message, getBoxTitle, getBoxDesc, getSchoolName, getItemTitle, getBoxGradient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import ItemDetailModal from '@/components/ItemDetailModal';
import { ArrowLeft, Send, Package, MessageCircle, Paperclip, X } from 'lucide-react';
import { toast } from 'sonner';

export default function BoxDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, lang, user, isAdmin, schools } = useApp();

  const [box, setBox] = useState<Box | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [tab, setTab] = useState<'items' | 'messages'>('items');

  // Unboxing state
  const [unboxStep, setUnboxStep] = useState(0);
  const [showContent, setShowContent] = useState(false);

  // Item detail modal
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  // Social compose
  const [socialName, setSocialName] = useState(user?.name || '');
  const [socialText, setSocialText] = useState('');
  const [socialMedia, setSocialMedia] = useState('');
  const [socialFile, setSocialFile] = useState<File | null>(null);
  const [socialFilePreview, setSocialFilePreview] = useState<string>('');
  const [postingMsg, setPostingMsg] = useState(false);

  useEffect(() => {
    if (!id) return;
    API.getBox(id).then(b => {
      setBox(b);
      if (b.status === 'opened' || b.status === 'draft') {
        setShowContent(true);
        setUnboxStep(4);
      }
    }).catch(console.error);
    API.getItems(id).then(setItems).catch(console.error);
    API.getMessages(id).then(setMessages).catch(console.error);
  }, [id]);

  useEffect(() => {
    if (!box || !user || isAdmin) return;

    const canView = user.school_id === box.from_school_id || user.school_id === box.to_school_id;
    if (!canView) {
      navigate('/explore', { replace: true });
    }
  }, [box, user, isAdmin, navigate]);

  if (!box) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center animate-pulse">
        <div className="mb-3 text-5xl">📦</div>
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    </div>
  );

  const fromSchool = schools.find(s => s.id === box.from_school_id);
  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/explore');
  };

  const handleRemoveTape = () => {
    if (unboxStep >= 1) return;
    setUnboxStep(1);
    setTimeout(() => setUnboxStep(2), 900);
  };

  const handleOpenBox = async () => {
    if (unboxStep >= 3) return;
    setUnboxStep(3);
    if (box.status === 'arrived' || box.status === 'sent') {
      await API.openBox(box.id);
      setBox({ ...box, status: 'opened' });
    }
    setTimeout(() => {
      setUnboxStep(4);
      setShowContent(true);
    }, 1200);
  };

  const handlePostMessage = async () => {
    if (!socialText.trim() || !socialName.trim()) return;
    setPostingMsg(true);
    try {
      // DataURL is too large for GET params — upload to Drive first
      let mediaUrl = socialMedia.trim() || undefined;
      if (socialFilePreview && socialFilePreview.startsWith('data:')) {
        const uploaded = await API.uploadFile(socialFilePreview, socialFile?.name || 'attachment');
        if (uploaded) mediaUrl = uploaded;
      } else if (socialFilePreview) {
        mediaUrl = socialFilePreview;
      }

      await API.addMessage({
        box_id: box.id,
        user_id: user?.id,
        user_name: socialName.trim(),
        user_school: user?.school_id,
        content: socialText.trim(),
        media_url: mediaUrl,
      });
      // Message is pending admin approval — do not add to local list
      toast.success('메시지가 전송되었어요! 관리자 검토 후 게시됩니다.');
      setSocialText('');
      setSocialMedia('');
      setSocialFile(null);
      setSocialFilePreview('');
    } catch (e) {
      console.error('Message post failed:', e);
      toast.error('메시지 전송에 실패했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setPostingMsg(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSocialFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setSocialFilePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setSocialFile(null);
    setSocialFilePreview('');
  };

  const renderItemIcon = (type: string) => {
    switch (type) {
      case 'text': return '📝';
      case 'image': return '🖼️';
      case 'video': return '🎬';
      case 'youtube': return '▶️';
      case 'link': return '🔗';
      case 'pdf': return '📄';
      default: return '📦';
    }
  };

  const statusConfig: Record<string, string> = {
    draft: 'bg-muted text-muted-foreground',
    packed: 'bg-amber-100 text-amber-700',
    sent: 'bg-blue-100 text-blue-700',
    arrived: 'bg-blue-100 text-blue-700',
    opened: 'bg-emerald-100 text-emerald-700',
  };

  // ========== Unboxing Experience ==========
  if (!showContent) {
    return (
      <div className="container mx-auto max-w-[1100px] px-4 py-12">
        <div className="mx-auto max-w-md text-center">
          <h2 className="mb-2 text-2xl font-bold animate-slide-up">{getBoxTitle(box, lang)}</h2>
          <p className="mb-10 text-sm text-muted-foreground animate-slide-up" style={{ animationDelay: '100ms' }}>
            {t('unbox.from')} <span className="font-semibold text-foreground">{getSchoolName(fromSchool, lang)}</span>
          </p>

          {/* Box visual */}
          <div className="relative mx-auto mb-10 h-52 w-52 animate-scale-in" style={{ animationDelay: '200ms' }}>
            <div
              className={`relative flex h-full w-full items-center justify-center rounded-[2rem] border-4 border-primary/20 shadow-xl transition-all duration-700 ${
                unboxStep >= 3 ? 'animate-lid-open' : ''
              }`}
              style={{ background: getBoxGradient(box.id) }}
            >
              <span className="text-7xl drop-shadow-lg">📦</span>

              {/* Tape */}
              {unboxStep <= 1 && (
                <button
                  type="button"
                  onClick={handleRemoveTape}
                  aria-label="박스 테이프 제거"
                  className={`absolute inset-x-0 top-1/2 flex -translate-y-1/2 cursor-pointer items-center justify-center rounded-sm bg-amber-200/95 py-2.5 text-[10px] font-extrabold tracking-[0.2em] text-amber-900 shadow-md transition-all hover:bg-amber-300 hover:shadow-lg ${
                    unboxStep === 1 ? 'animate-tape-peel' : ''
                  }`}
                >
                  ✦ CULTURE BOX ✦
                </button>
              )}

              {/* Heart decoration */}
              <div className="absolute -right-4 -top-4 text-3xl animate-float">❤️</div>
              <div className="absolute -left-2 -bottom-2 text-xl animate-float-delay-1">✨</div>
            </div>
          </div>

          <div className="space-y-3">
            {unboxStep === 0 && (
              <p className="text-sm font-medium text-muted-foreground animate-pulse">
                👆 {t('unbox.tap')}
              </p>
            )}
            {unboxStep === 1 && (
              <p className="text-sm text-muted-foreground">{t('unbox.removing.tape')}</p>
            )}
            {unboxStep === 2 && (
              <Button size="lg" onClick={handleOpenBox} className="rounded-2xl gradient-primary text-primary-foreground shadow-lg btn-bounce animate-pop-in">
                {t('unbox.open')}
              </Button>
            )}
            {unboxStep === 3 && (
              <p className="text-muted-foreground animate-pulse">{t('unbox.opening')}</p>
            )}
          </div>

          <button onClick={handleBack} className="mt-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            {t('common.back')}
          </button>
        </div>
      </div>
    );
  }

  // ========== Box Content View ==========
  return (
    <div className="container mx-auto max-w-[1100px] px-4 py-8 animate-slide-up">
      <button onClick={handleBack} className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        {t('common.back')}
      </button>

      {/* Header Card */}
      <div className="mb-8 overflow-hidden rounded-3xl border border-border shadow-sm">
        <div className="h-28 relative" style={{ background: getBoxGradient(box.id) }}>
          <div className="absolute right-6 top-4 text-5xl opacity-25">📦</div>
        </div>
        <div className="bg-card px-6 pb-6 pt-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold md:text-2xl">{getBoxTitle(box, lang)}</h1>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${statusConfig[box.status] || ''}`}>
                  {t(`status.${box.status}`)}
                </span>
              </div>
              {getBoxDesc(box, lang) && (
                <p className="mt-1.5 text-sm text-muted-foreground">{getBoxDesc(box, lang)}</p>
              )}
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <span>🏫 {getSchoolName(fromSchool, lang)}</span>
                <span>·</span>
                <span>{new Date(box.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2" role="tablist" aria-label="상세 콘텐츠 탭">
        <button
          id="box-tab-items"
          role="tab"
          aria-selected={tab === 'items'}
          aria-controls="box-panel-items"
          onClick={() => setTab('items')}
          className={`flex items-center gap-1.5 rounded-2xl px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
            tab === 'items'
              ? 'gradient-primary text-primary-foreground shadow-md'
              : 'bg-muted/60 text-muted-foreground hover:bg-muted'
          }`}
        >
          <Package className="h-4 w-4" />
          {t('tab.items')} ({items.length})
        </button>
        <button
          id="box-tab-messages"
          role="tab"
          aria-selected={tab === 'messages'}
          aria-controls="box-panel-messages"
          onClick={() => setTab('messages')}
          className={`flex items-center gap-1.5 rounded-2xl px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
            tab === 'messages'
              ? 'gradient-primary text-primary-foreground shadow-md'
              : 'bg-muted/60 text-muted-foreground hover:bg-muted'
          }`}
        >
          <MessageCircle className="h-4 w-4" />
          {t('nav.social')} ({messages.length})
        </button>
      </div>

      {/* Items tab */}
      {tab === 'items' && (
        <div id="box-panel-items" role="tabpanel" aria-labelledby="box-tab-items" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.length === 0 ? (
            <div className="col-span-full py-16 text-center animate-scale-in">
              <div className="mb-3 text-5xl">📭</div>
              <p className="text-muted-foreground">{t('common.empty')}</p>
            </div>
          ) : items.map((item, idx) => (
            <button
              type="button"
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="group w-full text-left cursor-pointer rounded-3xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/20 animate-item-reveal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              style={{ animationDelay: `${idx * 80}ms`, animationFillMode: 'backwards' }}
              aria-label={`${getItemTitle(item, lang)} 상세 보기`}
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="text-2xl transition-transform duration-300 group-hover:scale-110">{renderItemIcon(item.type)}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {item.type}
                </span>
              </div>
              <h3 className="mb-2 font-bold leading-snug">{getItemTitle(item, lang)}</h3>
              {item.type === 'text' && (
                <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{item.content}</p>
              )}
              {item.type === 'image' && item.file_url && (
                <img src={item.file_url} alt={item.title} className="mt-2 aspect-video w-full rounded-2xl object-cover" />
              )}
              {item.type === 'video' && (
                <div className="mt-2 flex items-center justify-center aspect-video w-full rounded-2xl bg-muted/60">
                  <span className="text-4xl opacity-60">▶️</span>
                </div>
              )}
              {item.type === 'youtube' && (() => {
                const src = item.content || item.file_url || '';
                const patterns = [
                  /(?:youtube\.com\/watch\?v=)([\w-]+)/,
                  /(?:youtube\.com\/embed\/)([\w-]+)/,
                  /(?:youtu\.be\/)([\w-]+)/,
                  /(?:youtube\.com\/shorts\/)([\w-]+)/,
                ];
                let vid: string | null = null;
                for (const p of patterns) { const m = src.match(p); if (m?.[1]) { vid = m[1]; break; } }
                if (!vid && /^[\w-]{11}$/.test(src.trim())) vid = src.trim();
                return vid ? (
                  <div className="mt-2 aspect-video w-full overflow-hidden rounded-2xl">
                    <iframe src={`https://www.youtube.com/embed/${vid}`} className="h-full w-full" allowFullScreen title={item.title} />
                  </div>
                ) : (
                  <div className="mt-2 flex items-center justify-center aspect-video w-full rounded-2xl bg-gradient-to-br from-red-50 to-red-100">
                    <span className="text-4xl">▶️</span>
                  </div>
                );
              })()}
              {item.type === 'link' && (
                <p className="mt-2 truncate text-sm text-primary">{item.content}</p>
              )}
              {item.type === 'pdf' && (
                <div className="mt-2 flex items-center gap-2.5 rounded-2xl bg-muted/60 p-3.5">
                  <span className="text-2xl">📄</span>
                  <span className="text-xs font-medium text-muted-foreground">PDF 문서 · 클릭하여 보기</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Messages tab */}
      {tab === 'messages' && (
        <div id="box-panel-messages" role="tabpanel" aria-labelledby="box-tab-messages">
          {/* Compose */}
          <div className="mb-8 rounded-3xl border border-border bg-card p-6 shadow-sm">
            <p className="mb-3 rounded-xl bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
              ℹ️ 게시한 메시지는 관리자 검토 후 공개됩니다.
            </p>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {socialName.charAt(0) || '?'}
              </div>
              <Input
                value={socialName}
                onChange={e => setSocialName(e.target.value)}
                placeholder={t('compose.name.placeholder')}
                className="h-8 w-32 rounded-xl border-0 bg-muted/60 text-sm font-medium"
              />
            </div>
            <Textarea
              value={socialText}
              onChange={e => setSocialText(e.target.value)}
              placeholder={t('social.compose.placeholder')}
              rows={3}
              className="mb-3 rounded-2xl border-border/60 resize-none"
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-1 items-center gap-2">
                <label className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl bg-muted/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                  <Paperclip className="h-4 w-4" />
                  <input type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
                </label>
                <span className="text-muted-foreground">🔗</span>
                <Input
                  value={socialMedia}
                  onChange={e => setSocialMedia(e.target.value)}
                  placeholder={t('social.attach.placeholder')}
                  className="h-8 rounded-xl border-0 bg-muted/60 text-sm"
                />
              </div>
              <Button
                size="sm"
                onClick={handlePostMessage}
                disabled={postingMsg}
                className="rounded-xl gradient-primary text-primary-foreground shadow-sm btn-bounce gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                {postingMsg ? '...' : t('social.post.btn')}
              </Button>
            </div>
            {socialFilePreview && (
              <div className="mt-3 relative inline-block">
                <img src={socialFilePreview} alt="preview" className="max-h-32 rounded-2xl object-cover" />
                <button
                  onClick={handleRemoveFile}
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            <p className="mt-2 text-[11px] text-muted-foreground/70">{t('social.name.label')}</p>
          </div>

          {/* Feed */}
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="py-16 text-center animate-scale-in">
                <div className="mb-3 text-5xl">💬</div>
                <p className="text-muted-foreground">{t('common.empty')}</p>
                <p className="mt-1 text-xs text-muted-foreground/70">{t('messages.empty.hint')}</p>
              </div>
            ) : messages.map((msg, i) => (
              <div key={msg.id} className="rounded-3xl border border-border bg-card p-5 animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="mb-3 flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {msg.user_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{msg.user_name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {new Date(msg.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                {msg.media_url && (
                  <img src={msg.media_url} alt="" className="mt-3 max-h-60 rounded-2xl object-cover" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Item Detail Modal */}
      <ItemDetailModal
        item={selectedItem}
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        lang={lang}
      />
    </div>
  );
}
