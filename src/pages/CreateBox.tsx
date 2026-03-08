import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { API, generateId, getSchoolName, type Item } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

type LocalItem = Omit<Item, 'id' | 'box_id' | 'created_by' | 'created_at'>;

export default function CreateBox() {
  const { t, lang, user, schools } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Step 1
  const [boxName, setBoxName] = useState('');
  const [boxDesc, setBoxDesc] = useState('');
  const [fromSchool, setFromSchool] = useState(user?.school_id || schools[0]?.id || '');
  const [toSchool, setToSchool] = useState('');

  // Step 2
  const [items, setItems] = useState<LocalItem[]>([]);
  const [showItemForm, setShowItemForm] = useState(false);
  const [itemType, setItemType] = useState<string>('text');
  const [itemTitle, setItemTitle] = useState('');
  const [itemContent, setItemContent] = useState('');
  const [itemUrl, setItemUrl] = useState('');

  // Step 4
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);

  const saveItem = () => {
    if (!itemTitle.trim()) return;
    setItems([...items, {
      type: itemType as any,
      title: itemTitle,
      content: itemContent,
      file_url: itemUrl || undefined,
      order: items.length,
    }]);
    setShowItemForm(false);
    setItemTitle('');
    setItemContent('');
    setItemUrl('');
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleSend = async () => {
    if (!boxName.trim()) return;
    setSending(true);

    // Create box
    const box = await API.createBox({
      title: boxName,
      description: boxDesc,
      from_school_id: fromSchool,
      to_school_id: toSchool || schools.find(s => s.id !== fromSchool)?.id || fromSchool,
      created_by: user?.id || 'unknown',
    });

    // Add items
    for (let i = 0; i < items.length; i++) {
      setProgress(Math.round(((i + 1) / (items.length + 1)) * 80));
      await API.addItem({ ...items[i], box_id: box.id });
    }

    // Send
    setProgress(90);
    await API.sendBox(box.id);
    setProgress(100);

    setTimeout(() => {
      navigate('/explore');
    }, 1000);
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-8 text-center text-2xl font-bold">{t('create.title')}</h1>

      {/* Stepper */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${
              step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              {s}
            </div>
            <span className="hidden text-xs md:inline">
              {t(`create.step${s}`)}
            </span>
            {s < 4 && <div className={`h-px w-8 ${step > s ? 'bg-primary' : 'bg-border'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="rounded-2xl border border-border bg-card p-6 animate-scale-in">
          <div className="space-y-4">
            <div>
              <Label>{t('create.boxname')}</Label>
              <Input value={boxName} onChange={e => setBoxName(e.target.value)} placeholder={t('create.boxname.placeholder')} />
            </div>
            <div>
              <Label>{t('create.desc')}</Label>
              <Textarea value={boxDesc} onChange={e => setBoxDesc(e.target.value)} placeholder={t('create.desc.placeholder')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('create.from')}</Label>
                <Select value={fromSchool} onValueChange={setFromSchool}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {schools.map(s => (
                      <SelectItem key={s.id} value={s.id}>{getSchoolName(s, lang)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t('create.to')}</Label>
                <Select value={toSchool} onValueChange={setToSchool}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {schools.map(s => (
                      <SelectItem key={s.id} value={s.id}>{getSchoolName(s, lang)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setStep(2)}>{t('create.next')}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Items */}
      {step === 2 && (
        <div className="rounded-2xl border border-border bg-card p-6 animate-scale-in">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold">🎁 아이템 추가</h3>
            <div className="flex flex-wrap gap-2">
              {['text', 'media', 'youtube', 'link', 'pdf'].map(type => (
                <Button key={type} variant="secondary" size="sm"
                  onClick={() => { setItemType(type === 'media' ? 'image' : type); setShowItemForm(true); }}>
                  {type === 'text' ? '📝' : type === 'media' ? '🖼️' : type === 'youtube' ? '▶️' : type === 'link' ? '🔗' : '📄'} {type}
                </Button>
              ))}
            </div>
          </div>

          {showItemForm && (
            <div className="mb-4 rounded-xl border border-border p-4" style={{ background: 'hsl(var(--color-surface-warm))' }}>
              <div className="space-y-3">
                <div>
                  <Label>제목</Label>
                  <Input value={itemTitle} onChange={e => setItemTitle(e.target.value)} placeholder="아이템 제목" />
                </div>
                <div>
                  <Label>내용</Label>
                  <Textarea value={itemContent} onChange={e => setItemContent(e.target.value)} placeholder="내용" />
                </div>
                {(itemType === 'image' || itemType === 'youtube' || itemType === 'link' || itemType === 'pdf') && (
                  <div>
                    <Label>URL</Label>
                    <Input value={itemUrl} onChange={e => setItemUrl(e.target.value)} placeholder="https://..." />
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowItemForm(false)}>{t('common.cancel')}</Button>
                  <Button size="sm" onClick={saveItem}>✅ 저장</Button>
                </div>
              </div>
            </div>
          )}

          {/* Items list */}
          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-border bg-background p-3">
                <div className="flex items-center gap-2">
                  <span>{item.type === 'text' ? '📝' : item.type === 'image' ? '🖼️' : '📦'}</span>
                  <span className="text-sm font-medium">{item.title}</span>
                </div>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => removeItem(i)}>×</Button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-between">
            <Button variant="secondary" onClick={() => setStep(1)}>{t('create.prev')}</Button>
            <Button onClick={() => setStep(3)}>{t('create.next')}</Button>
          </div>
        </div>
      )}

      {/* Step 3: Pack */}
      {step === 3 && (
        <div className="rounded-2xl border border-border bg-card p-6 text-center animate-scale-in">
          <div className="mx-auto mb-6 flex h-48 w-48 items-center justify-center rounded-2xl border-4 border-dashed border-primary/30 bg-primary/5">
            <span className="text-6xl">📦</span>
          </div>
          <Button onClick={() => setStep(4)}>📦 포장하기!</Button>
          <div className="mt-4 flex justify-between">
            <Button variant="secondary" onClick={() => setStep(2)}>{t('create.prev')}</Button>
            <Button onClick={() => setStep(4)}>{t('create.next')}</Button>
          </div>
        </div>
      )}

      {/* Step 4: Send */}
      {step === 4 && (
        <div className="rounded-2xl border border-border bg-card p-6 text-center animate-scale-in">
          <div className="mb-6 text-6xl">📦</div>
          {sending && (
            <div className="mb-4">
              <div className="mx-auto h-2 w-64 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{progress}%</p>
            </div>
          )}
          {!sending && (
            <Button size="lg" onClick={handleSend}>✈️ 발송하기</Button>
          )}
          {!sending && (
            <div className="mt-4">
              <Button variant="ghost" onClick={() => setStep(3)}>{t('create.prev')}</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
