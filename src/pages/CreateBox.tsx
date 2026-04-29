import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { API, generateId, getSchoolName, type Item } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight, Plus, X, Check, Send, Package, Upload, Pencil, ChevronUp, ChevronDown } from 'lucide-react';

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
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [itemFormError, setItemFormError] = useState('');

  // Step 1 validation errors
  const [step1Errors, setStep1Errors] = useState<{ boxName?: string; toSchool?: string; sameSchool?: string }>({});

  // Step 4
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sendError, setSendError] = useState('');
  const [sendSuccess, setSendSuccess] = useState(false);


  useEffect(() => {
    if (!fromSchool && (user?.school_id || schools[0]?.id)) {
      setFromSchool(user?.school_id || schools[0]?.id || '');
    }
  }, [fromSchool, user?.school_id, schools]);

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
    if (!itemTitle.trim()) { setItemFormError('아이템 제목을 입력해주세요.'); return; }
    if (itemType === 'text' && !itemContent.trim()) { setItemFormError('텍스트 아이템은 내용을 입력해주세요.'); return; }
    if ((itemType === 'image' || itemType === 'pdf' || itemType === 'youtube' || itemType === 'link') && !itemUrl.trim()) {
      setItemFormError('이 유형은 파일 또는 URL이 필요합니다.');
      return;
    }
    const nextItem = {
      type: itemType as any,
      title: itemTitle,
      content: itemContent,
      file_url: itemUrl || undefined,
      order: items.length,
    };
    if (editingIndex !== null) {
      setItems(items.map((item, idx) => (idx === editingIndex ? { ...nextItem, order: idx } : item)));
    } else {
      setItems([...items, nextItem]);
    }
    setShowItemForm(false);
    setEditingIndex(null);
    setItemTitle('');
    setItemContent('');
    setItemUrl('');
    setItemFilePreview('');
    setItemFormError('');
  };

  const removeItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const editItem = (idx: number) => {
    const item = items[idx];
    if (!item) return;
    setEditingIndex(idx);
    setItemType(item.type);
    setItemTitle(item.title);
    setItemContent(item.content);
    setItemUrl(item.file_url || '');
    setItemFilePreview(item.file_url?.startsWith('data:') ? item.file_url : '');
    setShowItemForm(true);
  };

  const moveItem = (idx: number, dir: 'up' | 'down') => {
    const target = dir === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[idx], next[target]] = [next[target], next[idx]];
    setItems(next.map((item, order) => ({ ...item, order })));
  };

  const handleSend = async () => {
    if (!boxName.trim()) {
      setSendError('박스 이름이 비어 있어 발송할 수 없습니다. 1단계에서 이름을 입력해주세요.');
      return;
    }
    if (!fromSchool) {
      setSendError('보내는 학교 정보가 없어 발송할 수 없습니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    const resolvedTo = toSchool || schools.find(s => s.id !== fromSchool)?.id || '';
    if (!resolvedTo || resolvedTo === fromSchool) {
      setSendError('받는 학교를 올바르게 선택해주세요.');
      return;
    }
    setSending(true);
    setSendSuccess(false);
    setSendError('');
    setProgress(0);

    try {
      const safeTranslate = async (text: string, to: 'en' | 'ja') => {
        const source = text?.trim();
        if (!source) return '';
        try {
          return await API.translate(source, to);
        } catch (e) {
          console.warn(`Auto-translation failed (${to}), using original text`, e);
          return source;
        }
      };

      const boxDescription = `${creators ? `만든 사람들: ${creators}\n` : ''}${boxDesc}`;
      const [titleEn, titleJa, descEn, descJa] = await Promise.all([
        safeTranslate(boxName, 'en'),
        safeTranslate(boxName, 'ja'),
        safeTranslate(boxDescription, 'en'),
        safeTranslate(boxDescription, 'ja'),
      ]);

      setProgress(5);
      console.log('Creating box...');
      const box = await API.createBox({
        title: boxName,
        title_en: titleEn,
        title_ja: titleJa,
        description: boxDescription,
        description_en: descEn,
        description_ja: descJa,
        from_school_id: fromSchool,
        to_school_id: resolvedTo,
        created_by: user?.id || 'unknown',
      });
      console.log('Box created:', box.id);
      setProgress(15);

      const uploadedItems: LocalItem[] = [];
      for (let i = 0; i < items.length; i++) {
        const originalItem = items[i];
        const item = { ...originalItem };
        if (item.file_url && item.file_url.startsWith('data:')) {
          try {
            console.log(`Uploading file for item ${i}...`);
            const ext = item.type === 'pdf' ? '.pdf' : '.img';
            const driveUrl = await API.uploadFile(item.file_url, `${item.title || 'file'}${ext}`, (uploadPercent) => {
              const itemWeight = items.length > 0 ? 55 / items.length : 55;
              const base = 15 + i * itemWeight;
              const scaled = base + (uploadPercent / 100) * itemWeight;
              setProgress(Math.min(70, Math.round(scaled)));
            });
            if (!driveUrl) throw new Error('파일 업로드 URL을 가져오지 못했습니다.');
            item.file_url = driveUrl;
          } catch (uploadErr: any) {
            console.error('File upload failed:', uploadErr);
            throw new Error(`"${item.title}" 파일 업로드에 실패했습니다. 파일 크기를 줄이거나 다시 시도해주세요.`);
          }
        }
        uploadedItems.push(item);
      }

      setProgress(75);
      for (let i = 0; i < uploadedItems.length; i++) {
        const item = uploadedItems[i];
        console.log(`Adding item ${i}: ${item.title}`);
        const [itemTitleEn, itemTitleJa, itemContentEn, itemContentJa] = await Promise.all([
          safeTranslate(item.title || '', 'en'),
          safeTranslate(item.title || '', 'ja'),
          safeTranslate(item.content || '', 'en'),
          safeTranslate(item.content || '', 'ja'),
        ]);
        await API.addItem({
          ...item,
          box_id: box.id,
          title_en: itemTitleEn,
          title_ja: itemTitleJa,
          content_en: itemContentEn,
          content_ja: itemContentJa,
        });
        const itemWeight = uploadedItems.length > 0 ? 10 / uploadedItems.length : 10;
        setProgress(Math.min(85, Math.round(75 + itemWeight * (i + 1))));
      }

      await API.sendBox(box.id);
      setProgress(100);
      setSendSuccess(true);
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
        {t('create.tagline')}
      </p>

      {/* Stepper */}
      <ol className="mb-10 flex items-center justify-center gap-0" aria-label="박스 생성 단계">
        {steps.map((s, i) => (
          <li key={s.num} className="flex items-center" aria-current={step === s.num ? 'step' : undefined}>
            <div className="flex flex-col items-center gap-1.5">
              <div className={`flex h-10 w-10 items-center justify-center rounded-2xl text-lg transition-all duration-300 ${
                step >= s.num
                  ? 'gradient-primary text-primary-foreground shadow-md scale-100'
                  : 'bg-muted text-muted-foreground scale-90'
              }`}>
                {step > s.num ? <Check className="h-5 w-5" /> : s.icon}
              </div>
              <span className={`text-[10px] font-medium ${step >= s.num ? 'text-primary' : 'text-muted-foreground'}`}>
                {s.label}
              </span>
            </div>
            {i < 3 && (
              <div className={`mx-2 h-0.5 w-8 rounded-full transition-colors duration-300 ${step > s.num ? 'bg-primary' : 'bg-border'}`} />
            )}
          </li>
        ))}
      </ol>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="rounded-3xl border border-border bg-card p-7 shadow-sm animate-scale-in">
          <div className="space-y-5">
            <div>
              <Label htmlFor="create-box-name" className="text-sm font-semibold">{t('create.boxname')}</Label>
              <Input
                id="create-box-name"
                value={boxName}
                onChange={e => { setBoxName(e.target.value); setStep1Errors(p => ({ ...p, boxName: '' })); }}
                placeholder={t('create.boxname.placeholder')}
                className="mt-1.5 rounded-2xl"
              />
              {step1Errors.boxName && <p className="mt-1 text-xs font-medium text-destructive">{step1Errors.boxName}</p>}
            </div>
            <div>
              <Label htmlFor="create-creators" className="text-sm font-semibold">{t('create.people')}</Label>
              <Input id="create-creators" value={creators} onChange={e => setCreators(e.target.value)} placeholder={t('create.people.placeholder')} className="mt-1.5 rounded-2xl" />
            </div>
            <div>
              <Label htmlFor="create-desc" className="text-sm font-semibold">{t('create.desc')}</Label>
              <Textarea id="create-desc" value={boxDesc} onChange={e => setBoxDesc(e.target.value)} placeholder={t('create.desc.placeholder')} className="mt-1.5 rounded-2xl resize-none" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-semibold">{t('create.from')}</Label>
                <Select value={fromSchool} onValueChange={v => { setFromSchool(v); if (toSchool === v) setToSchool(''); }}>
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
                <Select value={toSchool} onValueChange={v => { setToSchool(v); setStep1Errors(p => ({ ...p, toSchool: '', sameSchool: '' })); }}>
                  <SelectTrigger className="mt-1.5 rounded-2xl"><SelectValue placeholder="학교 선택" /></SelectTrigger>
                  <SelectContent>
                    {schools.filter(s => s.id !== fromSchool).map(s => (
                      <SelectItem key={s.id} value={s.id}>{getSchoolName(s, lang)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {step1Errors.toSchool && <p className="mt-1 text-xs font-medium text-destructive">{step1Errors.toSchool}</p>}
                {step1Errors.sameSchool && <p className="mt-1 text-xs font-medium text-destructive">{step1Errors.sameSchool}</p>}
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button
                onClick={() => {
                  const errs: typeof step1Errors = {};
                  if (!boxName.trim()) errs.boxName = '박스 이름을 입력해주세요.';
                  const resolvedTo = toSchool || schools.find(s => s.id !== fromSchool)?.id || '';
                  if (!resolvedTo) errs.toSchool = '받는 학교를 선택해주세요.';
                  else if (resolvedTo === fromSchool) errs.sameSchool = '보내는 학교와 받는 학교가 달라야 해요.';
                  if (Object.keys(errs).length > 0) { setStep1Errors(errs); return; }
                  setStep1Errors({});
                  setStep(2);
                }}
                className="rounded-2xl gradient-primary text-primary-foreground shadow-sm btn-bounce gap-1.5"
              >
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
                  onClick={() => { setItemType(it.type); setShowItemForm(true); setItemFilePreview(''); setItemUrl(''); setEditingIndex(null); setItemTitle(''); setItemContent(''); setItemFormError(''); }}
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
                        {itemFilePreview.startsWith('data:video') ? (
                          <video src={itemFilePreview} className="max-h-32 rounded-xl" controls />
                        ) : (
                          <img src={itemFilePreview} alt="preview" className="max-h-32 rounded-xl object-cover" />
                        )}
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
                  <Button variant="ghost" size="sm" onClick={() => { setShowItemForm(false); setItemFilePreview(''); setEditingIndex(null); setItemFormError(''); }} className="rounded-xl">
                    <X className="mr-1 h-3.5 w-3.5" /> {t('common.cancel')}
                  </Button>
                  <Button size="sm" onClick={saveItem} className="rounded-xl gradient-primary text-primary-foreground shadow-sm">
                    <Check className="mr-1 h-3.5 w-3.5" /> {editingIndex !== null ? '수정 저장' : '저장'}
                  </Button>
                </div>
                {itemFormError && <p className="text-xs font-medium text-destructive">{itemFormError}</p>}
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
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveItem(i, 'up')}
                      disabled={i === 0}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
                      aria-label="위로 이동"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(i, 'down')}
                      disabled={i === items.length - 1}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted disabled:opacity-40"
                      aria-label="아래로 이동"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => editItem(i)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                      aria-label="아이템 수정"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      aria-label="아이템 삭제"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
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
                <div className="mt-3 animate-pop-in space-y-2">
                  <p className="text-sm font-medium" style={{ color: 'hsl(var(--primary))' }}>🎉 발송 완료!</p>
                  {sendSuccess && (
                    <Button size="sm" onClick={() => navigate('/explore')} className="rounded-xl gradient-primary text-primary-foreground">
                      박스 보관소로 이동
                    </Button>
                  )}
                </div>
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
                  <Button size="lg" onClick={handleSend} disabled={sending} className="rounded-2xl gradient-primary text-primary-foreground shadow-lg btn-bounce gap-2 disabled:opacity-60">
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
