import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { API, type Box, type Item, type Message, getBoxTitle, getBoxDesc, getSchoolName, getItemTitle, getBoxGradient } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function BoxDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, lang, user, schools } = useApp();

  const [box, setBox] = useState<Box | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [tab, setTab] = useState<'items' | 'messages'>('items');

  // Unboxing state
  const [unboxStep, setUnboxStep] = useState(0); // 0=tape, 1=ready, 2=opened
  const [showContent, setShowContent] = useState(false);

  // Social compose
  const [socialName, setSocialName] = useState(user?.name || '');
  const [socialText, setSocialText] = useState('');
  const [socialMedia, setSocialMedia] = useState('');

  useEffect(() => {
    if (!id) return;
    API.getBox(id).then(b => {
      setBox(b);
      if (b.status === 'opened' || b.status === 'draft') {
        setShowContent(true);
        setUnboxStep(2);
      }
    }).catch(console.error);
    API.getItems(id).then(setItems).catch(console.error);
    API.getMessages(id).then(setMessages).catch(console.error);
  }, [id]);

  if (!box) return <div className="py-20 text-center text-muted-foreground">Loading...</div>;

  const fromSchool = schools.find(s => s.id === box.from_school_id);

  const handleRemoveTape = () => {
    if (unboxStep >= 1) return;
    setUnboxStep(1);
  };

  const handleOpenBox = async () => {
    if (unboxStep >= 2) return;
    setUnboxStep(2);
    if (box.status === 'arrived' || box.status === 'sent') {
      await API.openBox(box.id);
      setBox({ ...box, status: 'opened' });
    }
    setTimeout(() => setShowContent(true), 1500);
  };

  const handlePostMessage = async () => {
    if (!socialText.trim() || !socialName.trim()) return;
    const msg = await API.addMessage({
      box_id: box.id,
      user_name: socialName.trim(),
      content: socialText.trim(),
      media_url: socialMedia.trim() || undefined,
    });
    setMessages([...messages, msg]);
    setSocialText('');
    setSocialMedia('');
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

  // Unboxing experience
  if (!showContent) {
    return (
      <div className="container mx-auto max-w-[1100px] px-4 py-8">
        <div className="mx-auto max-w-md text-center">
          <h2 className="mb-2 text-2xl font-bold">{getBoxTitle(box, lang)}</h2>
          <p className="mb-8 text-muted-foreground">
            {t('unbox.from')} <span className="font-semibold">{getSchoolName(fromSchool, lang)}</span>
          </p>

          {/* Box visual */}
          <div className="relative mx-auto mb-8 w-48 cursor-pointer">
            {/* Box body */}
            <div className={`relative flex h-48 w-48 items-center justify-center rounded-2xl border-4 border-primary/30 transition-all duration-700 ${
              unboxStep >= 2 ? 'scale-110 opacity-0' : ''
            }`} style={{ background: getBoxGradient(box.id) }}>
              <span className="text-6xl">📦</span>
              {/* Tape */}
              {unboxStep < 1 && (
                <div
                  onClick={handleRemoveTape}
                  className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 cursor-pointer items-center justify-center bg-amber-200/90 py-2 text-[10px] font-bold tracking-widest text-amber-800 transition-all hover:bg-amber-300"
                >
                  FRAGILE · DIGITAL CULTURE BOX
                </div>
              )}
              {/* Heart */}
              <div className="absolute -right-3 -top-3 text-2xl">❤️</div>
            </div>
          </div>

          {unboxStep === 0 && (
            <p className="text-sm text-muted-foreground">{t('unbox.tap')}</p>
          )}
          {unboxStep === 1 && (
            <Button size="lg" onClick={handleOpenBox}>
              {t('unbox.open')}
            </Button>
          )}
          {unboxStep >= 2 && !showContent && (
            <p className="text-muted-foreground animate-pulse">개봉 중...</p>
          )}

          <div className="mt-6">
            <button onClick={() => navigate('/explore')} className="text-sm text-muted-foreground hover:text-foreground">
              ← 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Box content view
  return (
    <div className="container mx-auto max-w-[1100px] px-4 py-8 animate-slide-up">
      <button onClick={() => navigate('/explore')} className="mb-4 text-sm text-muted-foreground hover:text-foreground">
        ← 돌아가기
      </button>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{getBoxTitle(box, lang)}</h1>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold text-white
              ${box.status === 'opened' ? 'bg-emerald-500' : box.status === 'arrived' ? 'bg-amber-600' : 'bg-blue-500'}`}>
              {t(`status.${box.status}`)}
            </span>
          </div>
          <p className="mt-1 text-muted-foreground">{getBoxDesc(box, lang)}</p>
          <div className="mt-2 text-xs text-muted-foreground">
            {t('unbox.from')} {getSchoolName(fromSchool, lang)} · {box.created_at}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex border-b border-border">
        <button
          onClick={() => setTab('items')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'items' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {t('tab.items')}
        </button>
        <button
          onClick={() => setTab('messages')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'messages' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {t('nav.social')}
        </button>
      </div>

      {/* Items tab */}
      {tab === 'items' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              {t('common.empty')}
            </div>
          ) : items.map(item => (
            <div key={item.id} className="rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xl">{renderItemIcon(item.type)}</span>
                <span className="text-xs font-medium uppercase text-muted-foreground">{item.type}</span>
              </div>
              <h3 className="mb-2 font-semibold">{getItemTitle(item, lang)}</h3>
              {item.type === 'text' && (
                <p className="line-clamp-3 text-sm text-muted-foreground">{item.content}</p>
              )}
              {(item.type === 'image' || item.type === 'video') && item.file_url && (
                <img src={item.file_url} alt={item.title} className="mt-2 aspect-video w-full rounded-lg object-cover" />
              )}
              {item.type === 'youtube' && item.content && (
                <div className="mt-2 aspect-video overflow-hidden rounded-lg">
                  <iframe
                    src={`https://www.youtube.com/embed/${extractYouTubeId(item.content)}`}
                    className="h-full w-full"
                    allowFullScreen
                  />
                </div>
              )}
              {item.type === 'link' && (
                <a href={item.content} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-primary hover:underline">
                  {item.content}
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Messages tab */}
      {tab === 'messages' && (
        <div>
          {/* Compose */}
          <div className="mb-6 rounded-xl border border-border bg-card p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground">{t('compose.name.label')}</span>
              <Input
                value={socialName}
                onChange={e => setSocialName(e.target.value)}
                placeholder={t('compose.name.placeholder')}
                className="h-8 w-32 text-sm"
              />
            </div>
            <Textarea
              value={socialText}
              onChange={e => setSocialText(e.target.value)}
              placeholder={t('social.compose.placeholder')}
              rows={3}
              className="mb-2"
            />
            <div className="mb-2 flex items-center gap-2">
              <span>🔗</span>
              <Input
                value={socialMedia}
                onChange={e => setSocialMedia(e.target.value)}
                placeholder={t('social.attach.placeholder')}
                className="h-8 text-sm"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground">{t('social.name.label')}</span>
              <Button size="sm" onClick={handlePostMessage}>
                {t('social.post.btn')}
              </Button>
            </div>
          </div>

          {/* Feed */}
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">{t('common.empty')}</div>
            ) : messages.map(msg => (
              <div key={msg.id} className="rounded-xl border border-border bg-card p-4">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm">
                    👤
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{msg.user_name}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {new Date(msg.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                {msg.media_url && (
                  <img src={msg.media_url} alt="" className="mt-3 max-h-60 rounded-lg object-cover" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function extractYouTubeId(url: string): string {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]+)/);
  return match?.[1] || url;
}
