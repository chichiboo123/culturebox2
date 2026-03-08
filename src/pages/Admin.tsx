import { useEffect, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { API, type Box, type School, type Message, getSchoolName, getBoxTitle, generateId } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { LogOut, Trash2, School as SchoolIcon, Package, Users, MessageCircle, Plus, Pencil, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

type AdminTab = 'schools' | 'boxes' | 'users' | 'messages';

// ─── School Form (Create / Edit) ────────────────────────
function SchoolForm({ school, onSave, onClose }: { school?: School; onSave: (s: School) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    name_ko: school?.name_ko || '',
    name_en: school?.name_en || '',
    name_ja: school?.name_ja || '',
    country: school?.country || 'KR',
    logo_url: school?.logo_url || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name_ko && !form.name_en) { toast.error('학교 이름을 입력하세요'); return; }
    setSaving(true);
    try {
      let result: School;
      if (school) {
        result = await API.updateSchool({ id: school.id, ...form });
      } else {
        result = await API.createSchool({ ...form, id: generateId('sch') });
      }
      onSave(result);
      toast.success(school ? '학교가 수정되었습니다' : '학교가 추가되었습니다');
      onClose();
    } catch { toast.error('저장 실패'); }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold">학교 이름 (한국어) *</Label>
        <Input value={form.name_ko} onChange={e => setForm({ ...form, name_ko: e.target.value })} className="rounded-2xl" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold">School Name (English)</Label>
        <Input value={form.name_en} onChange={e => setForm({ ...form, name_en: e.target.value })} className="rounded-2xl" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold">学校名 (日本語)</Label>
        <Input value={form.name_ja} onChange={e => setForm({ ...form, name_ja: e.target.value })} className="rounded-2xl" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold">국가 코드</Label>
        <Input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} placeholder="KR, JP, US..." className="rounded-2xl" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold">로고 URL</Label>
        <Input value={form.logo_url} onChange={e => setForm({ ...form, logo_url: e.target.value })} className="rounded-2xl" />
      </div>
      <div className="flex gap-2 pt-2">
        <Button onClick={onClose} variant="outline" className="flex-1 rounded-2xl">취소</Button>
        <Button onClick={handleSave} disabled={saving} className="flex-1 rounded-2xl gradient-primary text-primary-foreground btn-bounce">
          {saving ? '저장 중...' : school ? '수정' : '추가'}
        </Button>
      </div>
    </div>
  );
}

// ─── Box Form (Create / Edit) ───────────────────────────
function BoxForm({ box, schools, onSave, onClose }: { box?: Box; schools: School[]; onSave: (b: Box) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    title: box?.title || '',
    title_en: box?.title_en || '',
    title_ja: box?.title_ja || '',
    description: box?.description || '',
    description_en: box?.description_en || '',
    description_ja: box?.description_ja || '',
    from_school_id: box?.from_school_id || (schools[0]?.id || ''),
    to_school_id: box?.to_school_id || (schools[0]?.id || ''),
    status: box?.status || 'draft' as Box['status'],
    cover_image_url: box?.cover_image_url || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.title) { toast.error('제목을 입력하세요'); return; }
    setSaving(true);
    try {
      let result: Box;
      if (box) {
        result = await API.updateBox({ id: box.id, ...form });
      } else {
        result = await API.createBox({ ...form, id: generateId('box'), created_by: 'admin' });
      }
      onSave(result);
      toast.success(box ? '박스가 수정되었습니다' : '박스가 추가되었습니다');
      onClose();
    } catch { toast.error('저장 실패'); }
    setSaving(false);
  };

  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">제목 (한) *</Label>
          <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="rounded-2xl" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">Title (EN)</Label>
          <Input value={form.title_en} onChange={e => setForm({ ...form, title_en: e.target.value })} className="rounded-2xl" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold">タイトル (JA)</Label>
        <Input value={form.title_ja} onChange={e => setForm({ ...form, title_ja: e.target.value })} className="rounded-2xl" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold">설명 (한)</Label>
        <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="rounded-2xl min-h-[60px]" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">Description (EN)</Label>
          <Textarea value={form.description_en} onChange={e => setForm({ ...form, description_en: e.target.value })} className="rounded-2xl min-h-[60px]" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">説明 (JA)</Label>
          <Textarea value={form.description_ja} onChange={e => setForm({ ...form, description_ja: e.target.value })} className="rounded-2xl min-h-[60px]" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">보내는 학교</Label>
          <Select value={form.from_school_id} onValueChange={v => setForm({ ...form, from_school_id: v })}>
            <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
            <SelectContent>{schools.map(s => <SelectItem key={s.id} value={s.id}>{s.name_ko || s.name_en}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">받는 학교</Label>
          <Select value={form.to_school_id} onValueChange={v => setForm({ ...form, to_school_id: v })}>
            <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
            <SelectContent>{schools.map(s => <SelectItem key={s.id} value={s.id}>{s.name_ko || s.name_en}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      {box && (
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">상태</Label>
          <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as Box['status'] })}>
            <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">작성 중</SelectItem>
              <SelectItem value="packed">포장 완료</SelectItem>
              <SelectItem value="sent">발송됨</SelectItem>
              <SelectItem value="arrived">도착</SelectItem>
              <SelectItem value="opened">개봉됨</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold">커버 이미지 URL</Label>
        <Input value={form.cover_image_url} onChange={e => setForm({ ...form, cover_image_url: e.target.value })} className="rounded-2xl" />
      </div>
      <div className="flex gap-2 pt-2">
        <Button onClick={onClose} variant="outline" className="flex-1 rounded-2xl">취소</Button>
        <Button onClick={handleSave} disabled={saving} className="flex-1 rounded-2xl gradient-primary text-primary-foreground btn-bounce">
          {saving ? '저장 중...' : box ? '수정' : '추가'}
        </Button>
      </div>
    </div>
  );
}

// ─── User Form (Create / Edit) ──────────────────────────
function UserForm({ user, schools, onSave, onClose }: { user?: any; schools: School[]; onSave: (u: any) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    school_id: user?.school_id || schools[0]?.id || '',
    role: user?.role || 'student',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name) { toast.error('이름을 입력하세요'); return; }
    setSaving(true);
    try {
      let result: any;
      if (user) {
        result = await API.updateUser({ id: user.id, ...form });
      } else {
        result = await API.createUser({ ...form, id: generateId('usr') });
      }
      onSave(result);
      toast.success(user ? '사용자가 수정되었습니다' : '사용자가 추가되었습니다');
      onClose();
    } catch { toast.error('저장 실패'); }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold">이름 *</Label>
        <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="rounded-2xl" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold">이메일 / 코드</Label>
        <Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="rounded-2xl" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold">소속 학교</Label>
        <Select value={form.school_id} onValueChange={v => setForm({ ...form, school_id: v })}>
          <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
          <SelectContent>{schools.map(s => <SelectItem key={s.id} value={s.id}>{s.name_ko || s.name_en}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold">역할</Label>
        <Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}>
          <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="student">학생</SelectItem>
            <SelectItem value="teacher">교사</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2 pt-2">
        <Button onClick={onClose} variant="outline" className="flex-1 rounded-2xl">취소</Button>
        <Button onClick={handleSave} disabled={saving} className="flex-1 rounded-2xl gradient-primary text-primary-foreground btn-bounce">
          {saving ? '저장 중...' : user ? '수정' : '추가'}
        </Button>
      </div>
    </div>
  );
}

// ─── Main Admin Page ────────────────────────────────────
export default function Admin() {
  const { t, lang, schools, adminLogout, refreshSchools } = useApp();
  const [tab, setTab] = useState<AdminTab>('schools');
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [messages, setMessages] = useState<{ msg: Message; boxTitle: string }[]>([]);
  const [loading, setLoading] = useState(false);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'school' | 'box' | 'user' | 'editBox'>('school');
  const [editingBox, setEditingBox] = useState<Box | undefined>();

  const loadData = async () => {
    setLoading(true);
    try {
      const [b, u] = await Promise.all([API.getBoxes(), API.getUsers()]);
      setBoxes(b);
      setUsers(u.filter((x: any) => x.id)); // filter empty rows

      // Load messages for all boxes
      const allMsgs: { msg: Message; boxTitle: string }[] = [];
      for (const box of b) {
        try {
          const msgs = await API.getMessages(box.id);
          msgs.forEach(m => allMsgs.push({ msg: m, boxTitle: getBoxTitle(box, lang) }));
        } catch { /* skip */ }
      }
      setMessages(allMsgs);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const openDialog = (type: 'school' | 'box' | 'user' | 'editBox', box?: Box) => {
    setDialogType(type);
    setEditingBox(box);
    setDialogOpen(true);
  };

  const handleDeleteSchool = async (id: string) => {
    if (!confirm('이 학교를 삭제하시겠습니까?')) return;
    try {
      await API.deleteSchool(id);
      if (refreshSchools) refreshSchools();
      toast.success('학교가 삭제되었습니다');
    } catch { toast.error('삭제 실패'); }
  };

  const handleDeleteBox = async (id: string) => {
    if (!confirm('이 박스를 삭제하시겠습니까?')) return;
    try {
      await API.deleteBox(id);
      setBoxes(prev => prev.filter(b => b.id !== id));
      toast.success('박스가 삭제되었습니다');
    } catch { toast.error('삭제 실패'); }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('이 사용자를 삭제하시겠습니까?')) return;
    try {
      await API.deleteUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      toast.success('사용자가 삭제되었습니다');
    } catch { toast.error('삭제 실패'); }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!confirm('이 메시지를 삭제하시겠습니까?')) return;
    try {
      await API.deleteMessage(id);
      setMessages(prev => prev.filter(m => m.msg.id !== id));
      toast.success('메시지가 삭제되었습니다');
    } catch { toast.error('삭제 실패'); }
  };

  const tabs: { id: AdminTab; icon: React.ReactNode; label: string }[] = [
    { id: 'schools', icon: <SchoolIcon className="h-4 w-4" />, label: '학교 관리' },
    { id: 'boxes', icon: <Package className="h-4 w-4" />, label: '박스 관리' },
    { id: 'users', icon: <Users className="h-4 w-4" />, label: '사용자 관리' },
    { id: 'messages', icon: <MessageCircle className="h-4 w-4" />, label: '메시지 관리' },
  ];

  const statusConfig: Record<string, string> = {
    draft: 'bg-muted text-muted-foreground',
    packed: 'bg-yellow-100 text-yellow-700',
    sent: 'bg-blue-100 text-blue-700',
    arrived: 'bg-orange-100 text-orange-700',
    opened: 'bg-emerald-100 text-emerald-700',
  };

  const dialogTitles: Record<string, string> = {
    school: '학교 추가',
    box: '박스 추가',
    user: '사용자 추가',
    editBox: '박스 수정',
  };

  return (
    <div className="container mx-auto max-w-[1100px] px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold animate-slide-up">⚙️ 관리 패널</h1>
          <p className="mt-1 text-sm text-muted-foreground animate-slide-up" style={{ animationDelay: '50ms' }}>시스템 관리 및 데이터 조회</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} disabled={loading} className="rounded-2xl gap-1.5 btn-bounce">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
          <Button variant="outline" onClick={adminLogout} className="rounded-2xl gap-1.5 btn-bounce">
            <LogOut className="h-4 w-4" />
            로그아웃
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className="hidden w-56 shrink-0 md:block">
          <div className="space-y-1.5 rounded-3xl border border-border bg-card p-3 shadow-sm">
            {tabs.map(tb => (
              <button
                key={tb.id}
                onClick={() => setTab(tb.id)}
                className={`flex w-full items-center gap-2.5 rounded-2xl px-4 py-3 text-sm font-medium transition-all ${
                  tab === tb.id
                    ? 'gradient-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {tb.icon}
                {tb.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Content */}
        <div className="min-w-0 flex-1 animate-scale-in">
          {/* Mobile tabs */}
          <div className="mb-5 flex gap-2 overflow-x-auto md:hidden">
            {tabs.map(tb => (
              <button
                key={tb.id}
                onClick={() => setTab(tb.id)}
                className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-2xl px-4 py-2 text-sm font-medium transition-all ${
                  tab === tb.id
                    ? 'gradient-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {tb.icon}
                {tb.label}
              </button>
            ))}
          </div>

          {/* ─── Schools ─── */}
          {tab === 'schools' && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">총 {schools.length}개 학교</span>
                <Button onClick={() => openDialog('school')} className="rounded-2xl gradient-primary text-primary-foreground btn-bounce gap-1.5" size="sm">
                  <Plus className="h-4 w-4" /> 학교 추가
                </Button>
              </div>
              <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">이름 (한)</th>
                        <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">이름 (영)</th>
                        <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">국가</th>
                        <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">작업</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schools.map(s => (
                        <tr key={s.id} className="border-b border-border/50 last:border-0 transition-colors hover:bg-muted/20">
                          <td className="px-5 py-3.5 font-medium">{s.name_ko}</td>
                          <td className="px-5 py-3.5">{s.name_en}</td>
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{s.country}</span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button onClick={() => handleDeleteSchool(s.id)} className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10">
                              <Trash2 className="h-3.5 w-3.5" /> 삭제
                            </button>
                          </td>
                        </tr>
                      ))}
                      {schools.length === 0 && (
                        <tr><td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">등록된 학교가 없습니다</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─── Boxes ─── */}
          {tab === 'boxes' && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">총 {boxes.length}개 박스</span>
                <Button onClick={() => openDialog('box')} className="rounded-2xl gradient-primary text-primary-foreground btn-bounce gap-1.5" size="sm">
                  <Plus className="h-4 w-4" /> 박스 추가
                </Button>
              </div>
              <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">제목</th>
                        <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">상태</th>
                        <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">보낸 → 받는</th>
                        <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">작업</th>
                      </tr>
                    </thead>
                    <tbody>
                      {boxes.map(b => (
                        <tr key={b.id} className="border-b border-border/50 last:border-0 transition-colors hover:bg-muted/20">
                          <td className="px-5 py-3.5 font-medium">{getBoxTitle(b, lang)}</td>
                          <td className="px-5 py-3.5">
                            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${statusConfig[b.status] || 'bg-muted'}`}>
                              {t(`status.${b.status}`)}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-muted-foreground text-xs">
                            {getSchoolName(schools.find(s => s.id === b.from_school_id), lang)} → {getSchoolName(schools.find(s => s.id === b.to_school_id), lang)}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => openDialog('editBox', b)} className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10">
                                <Pencil className="h-3.5 w-3.5" /> 수정
                              </button>
                              <button onClick={() => handleDeleteBox(b.id)} className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10">
                                <Trash2 className="h-3.5 w-3.5" /> 삭제
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {boxes.length === 0 && (
                        <tr><td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">등록된 박스가 없습니다</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ─── Users ─── */}
          {tab === 'users' && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">총 {users.length}명 사용자</span>
                <Button onClick={() => openDialog('user')} className="rounded-2xl gradient-primary text-primary-foreground btn-bounce gap-1.5" size="sm">
                  <Plus className="h-4 w-4" /> 사용자 추가
                </Button>
              </div>
              <div className="space-y-2">
                {users.map((u: any) => (
                  <div key={u.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 transition-all hover:shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-sm font-bold text-primary">
                        {(u.name || '?').charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium">{u.name}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="rounded-full bg-muted px-2 py-0.5 font-medium">{u.role}</span>
                          <span>{u.email}</span>
                          <span>{getSchoolName(schools.find(s => s.id === u.school_id), lang)}</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteUser(u.id)} className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10">
                      <Trash2 className="h-3.5 w-3.5" /> 삭제
                    </button>
                  </div>
                ))}
                {users.length === 0 && (
                  <div className="rounded-3xl border border-border bg-card p-8 text-center text-muted-foreground">등록된 사용자가 없습니다</div>
                )}
              </div>
            </div>
          )}

          {/* ─── Messages ─── */}
          {tab === 'messages' && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">총 {messages.length}개 메시지</span>
              </div>
              {messages.length === 0 ? (
                <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
                  <div className="mb-3 text-4xl">💬</div>
                  <p className="font-medium">메시지가 없습니다</p>
                  <p className="mt-1 text-sm text-muted-foreground">박스에서 소통이 시작되면 여기에 표시됩니다</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map(({ msg, boxTitle }) => (
                    <div key={msg.id} className="flex items-start justify-between rounded-2xl border border-border bg-card p-4 transition-all hover:shadow-sm">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{msg.user_name}</span>
                          <span className="text-xs text-muted-foreground">·</span>
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{boxTitle}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            msg.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                            msg.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>{msg.status}</span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{msg.content}</p>
                        {msg.media_url && <p className="text-xs text-primary mt-1 truncate">📎 {msg.media_url}</p>}
                      </div>
                      <button onClick={() => handleDeleteMessage(msg.id)} className="ml-3 shrink-0 inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10">
                        <Trash2 className="h-3.5 w-3.5" /> 삭제
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Dialog ─── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg rounded-3xl border-border/60 p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">{dialogTitles[dialogType]}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">스프레드시트에 자동 반영됩니다</DialogDescription>
          </DialogHeader>
          {dialogType === 'school' && <SchoolForm schools={schools} onSave={() => { if (refreshSchools) refreshSchools(); }} onClose={() => setDialogOpen(false)} />}
          {dialogType === 'box' && <BoxForm schools={schools} onSave={b => setBoxes(prev => [...prev, b])} onClose={() => setDialogOpen(false)} />}
          {dialogType === 'editBox' && <BoxForm box={editingBox} schools={schools} onSave={b => setBoxes(prev => prev.map(x => x.id === b.id ? b : x))} onClose={() => setDialogOpen(false)} />}
          {dialogType === 'user' && <UserForm schools={schools} onSave={u => setUsers(prev => [...prev, u])} onClose={() => setDialogOpen(false)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
