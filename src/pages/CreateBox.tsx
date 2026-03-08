import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { API, generateId, getSchoolName, type Item } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight, Plus, X, Check, Send, Package, Upload } from 'lucide-react';

type LocalItem = Omit<Item, 'id' | 'box_id' | 'created_by' | 'created_at'>;

const itemTypes = [
  { type: 'text', icon: '📝', label: '텍스트' },
  { type: 'image', icon: '🖼️', label: '이미지/동영상' },
  { type: 'youtube', icon: '▶️', label: 'YouTube' },
  { type: 'link', icon: '🔗', label: '링크' },
  { type: 'pdf', icon: '📄', label: 'PDF' },
];

export default function CreateBox() {
  const { t, lang, user, schools } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Step 1
  const [boxName, setBoxName] = useState('');
  const [creators, setCreators] = useState('');
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
  const [itemFilePreview, setItemFilePreview] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 4
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sendError, setSendError] = useState('');

  const handleItemFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setItemFilePreview(dataUrl);
      setItemUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  };

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
    setItemFilePreview('');
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleSend = async () => {
    if (!boxName.trim()) return;
    setSending(true);
    setSendError('');
    setProgress(0);

    try {
      setProgress(5);
      console.log('Creating box...');
      const box = await API.createBox({
        title: boxName,
        description: `${creators ? `만든 사람들: ${creators}\n` : ''}${boxDesc}`,
        from_school_id: fromSchool,
        to_school_id: toSchool || schools.find(s => s.id !== fromSchool)?.id || fromSchool,
        created_by: user?.id || 'unknown',
      });
      console.log('Box created:', box.id);
      setProgress(15);

      for (let i = 0; i < items.length; i++) {
        const itemStart = 15 + Math.round((i / (items.length + 1)) * 65);
        const itemEnd = 15 + Math.round(((i + 1) / (items.length + 1)) * 65);
        setProgress(itemStart);

        const item = { ...items[i] };

        // If file_url is a DataURL, try upload but don't block on failure
        if (item.file_url && item.file_url.startsWith('data:')) {
          try {
            console.log(`Uploading file for item ${i}...`);
            const ext = item.type === 'pdf' ? '.pdf' : '.img';
            const driveUrl = await API.uploadFile(item.file_url, `${item.title || 'file'}${ext}`, (uploadPercent) => {
              const rangedProgress = itemStart + Math.round((uploadPercent / 100) * (itemEnd - itemStart));
              setProgress(rangedProgress);
            });
            if (driveUrl) {
              item.file_url = driveUrl;
            } else {
              console.warn('Upload returned empty URL, clearing file_url');
              item.file_url = undefined;
            }
          } catch (uploadErr) {
            console.warn('File upload failed, saving item without file:', uploadErr);
            item.file_url = undefined;
          }
        }

        setProgress(itemEnd);
        console.log(`Adding item ${i}: ${item.title}`);
        await API.addItem({ ...item, box_id: box.id });
      }

      setProgress(85);
      await API.sendBox(box.id);
      setProgress(100);

      setTimeout(() => navigate('/explore'), 1500);
    } catch (err: any) {
      console.error('Send error:', err);
      setSendError(err?.message || '발송 중 오류가 발생했습니다. 다시 시도해주세요.');
      setSending(false);
      setProgress(0);
    }
  };

  const steps = [
    { num: 1, label: t('create.step1'), icon: '📋' },
    { num: 2, label: t('create.step2'), icon: '🎁' },
    { num: 3, label: t('create.step3'), icon: '📦' },
    { num: 4, label: t('create.step4'), icon: '✈️' },
  ];

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-2 text-center text-2xl font-bold animate-slide-up">{t('create.title')}</h1>
      <p className="mb-8 text-center text-sm text-muted-foreground animate-slide-up" style={{ animationDelay: '50ms' }}>
        문화를 담아 세계로 보내보세요
      </p>

      {/* Stepper */}
      <div className="mb-10 flex items-center justify-center gap-0">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`flex h-10 w-10 items-center justify-center rounded-2xl text-lg transition-all duration-300 ${
                step >= s.num
                  ? 'gradient-primary text-primary-foreground shadow-md scale-100'
                  : 'bg-muted text-muted-foreground scale-90'
              }`}>
                {step > s.num ? <Check className="h-5 w-5" /> : s.icon}
              </div>
              <span className={`hidden text-[11px] font-medium md:block ${step >= s.num ? 'text-primary' : 'text-muted-foreground'}`}>
                {s.label}
              </span>
            </div>
            {i < 3 && (
              <div className={`mx-2 h-0.5 w-8 rounded-full transition-colors duration-300 ${step > s.num ? 'bg-primary' : 'bg-border'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="rounded-3xl border border-border bg-card p-7 shadow-sm animate-scale-in">
          <div className="space-y-5">
            <div>
              <Label className="text-sm font-semibold">{t('create.boxname')}</Label>
              <Input value={boxName} onChange={e => setBoxName(e.target.value)} placeholder={t('create.boxname.placeholder')} className="mt-1.5 rounded-2xl" />
            </div>
            <div>
              <Label className="text-sm font-semibold">👥 만든 사람들</Label>
              <Input value={creators} onChange={e => setCreators(e.target.value)} placeholder="예: 김철수, 이영희, 박민수" className="mt-1.5 rounded-2xl" />
            </div>
            <div>
              <Label className="text-sm font-semibold">{t('create.desc')}</Label>
              <Textarea value={boxDesc} onChange={e => setBoxDesc(e.target.value)} placeholder={t('create.desc.placeholder')} className="mt-1.5 rounded-2xl resize-none" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold">{t('create.from')}</Label>
                <Select value={fromSchool} onValueChange={setFromSchool}>
                  <SelectTrigger className="mt-1.5 rounded-2xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {schools.map(s => (
                      <SelectItem key={s.id} value={s.id}>{getSchoolName(s, lang)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm font-semibold">{t('create.to')}</Label>
                <Select value={toSchool} onValueChange={setToSchool}>
                  <SelectTrigger className="mt-1.5 rounded-2xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {schools.map(s => (
                      <SelectItem key={s.id} value={s.id}>{getSchoolName(s, lang)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={() => setStep(2)} className="rounded-2xl gradient-primary text-primary-foreground shadow-sm btn-bounce gap-1.5">
                {t('create.next')} <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Items */}
      {step === 2 && (
        <div className="rounded-3xl border border-border bg-card p-7 shadow-sm animate-scale-in">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-base font-bold">🎁 아이템 추가</h3>
            <div className="flex flex-wrap gap-1.5">
              {itemTypes.map(it => (
                <button
                  key={it.type}
                  onClick={() => { setItemType(it.type); setShowItemForm(true); setItemFilePreview(''); setItemUrl(''); }}
                  className="flex items-center gap-1 rounded-xl bg-muted/60 px-3 py-1.5 text-xs font-medium transition-all hover:bg-muted hover:shadow-sm btn-bounce"
                >
                  {it.icon} {it.label}
                </button>
              ))}
            </div>
          </div>

          {showItemForm && (
            <div className="mb-5 rounded-2xl border border-primary/20 bg-primary/5 p-5 animate-scale-in">
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-semibold">제목</Label>
                  <Input value={itemTitle} onChange={e => setItemTitle(e.target.value)} placeholder="아이템 제목" className="mt-1 rounded-xl" />
                </div>
                <div>
                  <Label className="text-sm font-semibold">내용</Label>
                  <Textarea value={itemContent} onChange={e => setItemContent(e.target.value)} placeholder="내용" className="mt-1 rounded-xl resize-none" rows={3} />
                </div>

                {/* Image/Video: file upload + URL */}
                {itemType === 'image' && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">파일 업로드 또는 URL</Label>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="h-3.5 w-3.5" /> 파일 선택
                      </Button>
                      <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleItemFileSelect} />
                      <Input value={itemFilePreview ? '' : itemUrl} onChange={e => { setItemUrl(e.target.value); setItemFilePreview(''); }} placeholder="또는 URL 입력" className="rounded-xl" disabled={!!itemFilePreview} />
                    </div>
                    {itemFilePreview && (
                      <div className="relative inline-block">
                        <img src={itemFilePreview} alt="preview" className="max-h-32 rounded-xl object-cover" />
                        <button onClick={() => { setItemFilePreview(''); setItemUrl(''); }} className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* PDF: file upload + URL */}
                {itemType === 'pdf' && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">파일 업로드 또는 URL</Label>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="h-3.5 w-3.5" /> 파일 선택
                      </Button>
                      <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleItemFileSelect} />
                      <Input value={itemFilePreview ? '' : itemUrl} onChange={e => { setItemUrl(e.target.value); setItemFilePreview(''); }} placeholder="또는 URL 입력" className="rounded-xl" disabled={!!itemFilePreview} />
                    </div>
                    {itemFilePreview && (
                      <div className="flex items-center gap-2 rounded-xl bg-muted p-3">
                        <span className="text-xl">📄</span>
                        <span className="text-sm font-medium">PDF 파일 선택됨</span>
                        <button onClick={() => { setItemFilePreview(''); setItemUrl(''); }} className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* YouTube / Link: URL only */}
                {(itemType === 'youtube' || itemType === 'link') && (
                  <div>
                    <Label className="text-sm font-semibold">URL</Label>
                    <Input value={itemUrl} onChange={e => setItemUrl(e.target.value)} placeholder="https://..." className="mt-1 rounded-xl" />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <Button variant="ghost" size="sm" onClick={() => { setShowItemForm(false); setItemFilePreview(''); }} className="rounded-xl">
                    <X className="mr-1 h-3.5 w-3.5" /> {t('common.cancel')}
                  </Button>
                  <Button size="sm" onClick={saveItem} className="rounded-xl gradient-primary text-primary-foreground shadow-sm">
                    <Check className="mr-1 h-3.5 w-3.5" /> 저장
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Items list */}
          {items.length > 0 ? (
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex items-center justify-between rounded-2xl border border-border bg-background p-3.5 transition-all hover:shadow-sm">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{itemTypes.find(t => t.type === item.type)?.icon || '📦'}</span>
                    <div>
                      <span className="text-sm font-medium">{item.title}</span>
                      <span className="ml-2 text-[10px] uppercase text-muted-foreground">{item.type}</span>
                    </div>
                  </div>
                  <button onClick={() => removeItem(i)} className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : !showItemForm && (
            <div className="py-10 text-center">
              <div className="mb-2 text-4xl">🎁</div>
              <p className="text-sm text-muted-foreground">아직 아이템이 없어요</p>
              <p className="text-xs text-muted-foreground/70">위 버튼을 눌러 추가해보세요</p>
            </div>
          )}

          <div className="mt-6 flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)} className="rounded-2xl gap-1.5 btn-bounce">
              <ArrowLeft className="h-4 w-4" /> {t('create.prev')}
            </Button>
            <Button onClick={() => setStep(3)} className="rounded-2xl gradient-primary text-primary-foreground shadow-sm btn-bounce gap-1.5">
              {t('create.next')} <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Pack */}
      {step === 3 && (
        <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-sm animate-scale-in">
          <div className="mx-auto mb-6 flex h-48 w-48 items-center justify-center rounded-[2rem] border-4 border-dashed border-primary/25 bg-primary/5">
            <div className="animate-wiggle">
              <span className="text-7xl">📦</span>
            </div>
          </div>
          <h3 className="mb-2 text-lg font-bold">포장 준비 완료!</h3>
          <p className="mb-6 text-sm text-muted-foreground">
            {items.length}개의 아이템이 담겨있어요
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => setStep(2)} className="rounded-2xl gap-1.5 btn-bounce">
              <ArrowLeft className="h-4 w-4" /> {t('create.prev')}
            </Button>
            <Button onClick={() => setStep(4)} className="rounded-2xl gradient-primary text-primary-foreground shadow-lg btn-bounce gap-1.5">
              <Package className="h-4 w-4" /> 포장 완료! <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Send */}
      {step === 4 && (
        <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-sm animate-scale-in">
          {sending ? (
            <div className="mx-auto max-w-xs">
            {/* Animated vehicles - one at a time, centered */}
              <div className="relative h-24 mb-4 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-5xl animate-vehicle-1">✈️</span>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-5xl animate-vehicle-2">🚢</span>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-5xl animate-vehicle-3">🚗</span>
                </div>
              </div>
              <h3 className="mb-3 text-lg font-bold">발송 중...</h3>
              <div className="mx-auto h-3 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full gradient-primary transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
              </div>
              <p className="mt-3 text-sm font-semibold text-primary">{progress}%</p>
              {progress === 100 && (
                <p className="mt-2 text-sm font-medium animate-pop-in" style={{ color: 'hsl(var(--primary))' }}>🎉 발송 완료!</p>
              )}
            </div>
          ) : (
            <>
              <div className="mb-6 text-7xl animate-float">✈️</div>
              <h3 className="mb-2 text-lg font-bold">발송할 준비가 됐어요!</h3>
              {sendError && (
                <p className="mb-3 text-sm text-destructive">{sendError}</p>
              )}
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  <strong>{boxName}</strong>을(를) 보낼까요?
                </p>
                <div className="flex justify-center gap-3">
                  <Button variant="outline" onClick={() => setStep(3)} className="rounded-2xl gap-1.5 btn-bounce">
                    <ArrowLeft className="h-4 w-4" /> {t('create.prev')}
                  </Button>
                  <Button size="lg" onClick={handleSend} className="rounded-2xl gradient-primary text-primary-foreground shadow-lg btn-bounce gap-2">
                    <Send className="h-4 w-4" /> 발송하기
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
