import { useEffect, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { API, type Box, type School, getSchoolName, getBoxTitle } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { LogOut, Trash2, School as SchoolIcon, Package, Users, MessageCircle } from 'lucide-react';

type AdminTab = 'schools' | 'boxes' | 'users' | 'messages';

export default function Admin() {
  const { t, lang, schools, adminLogout } = useApp();
  const [tab, setTab] = useState<AdminTab>('schools');
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    API.getBoxes().then(setBoxes).catch(console.error);
    API.getUsers().then(setUsers).catch(console.error);
  }, []);

  const tabs: { id: AdminTab; icon: React.ReactNode; label: string }[] = [
    { id: 'schools', icon: <SchoolIcon className="h-4 w-4" />, label: '학교 관리' },
    { id: 'boxes', icon: <Package className="h-4 w-4" />, label: '박스 관리' },
    { id: 'users', icon: <Users className="h-4 w-4" />, label: '사용자 관리' },
    { id: 'messages', icon: <MessageCircle className="h-4 w-4" />, label: '메시지 관리' },
  ];

  const statusConfig: Record<string, string> = {
    draft: 'bg-muted text-muted-foreground',
    sent: 'bg-blue-100 text-blue-700',
    arrived: 'bg-orange-100 text-orange-700',
    opened: 'bg-emerald-100 text-emerald-700',
  };

  return (
    <div className="container mx-auto max-w-[1100px] px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold animate-slide-up">⚙️ 관리 패널</h1>
          <p className="mt-1 text-sm text-muted-foreground animate-slide-up" style={{ animationDelay: '50ms' }}>시스템 관리 및 데이터 조회</p>
        </div>
        <Button variant="outline" onClick={adminLogout} className="rounded-2xl gap-1.5 btn-bounce">
          <LogOut className="h-4 w-4" />
          로그아웃
        </Button>
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

          {tab === 'schools' && (
            <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">ID</th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">이름 (한)</th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">이름 (영)</th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">국가</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schools.map(s => (
                      <tr key={s.id} className="border-b border-border/50 last:border-0 transition-colors hover:bg-muted/20">
                        <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">{s.id}</td>
                        <td className="px-5 py-3.5 font-medium">{s.name_ko}</td>
                        <td className="px-5 py-3.5">{s.name_en}</td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{s.country}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'boxes' && (
            <div className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">제목</th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">상태</th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">보낸 학교</th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">받는 학교</th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">작업</th>
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
                        <td className="px-5 py-3.5 text-muted-foreground">{getSchoolName(schools.find(s => s.id === b.from_school_id), lang)}</td>
                        <td className="px-5 py-3.5 text-muted-foreground">{getSchoolName(schools.find(s => s.id === b.to_school_id), lang)}</td>
                        <td className="px-5 py-3.5">
                          <button
                            onClick={async () => { await API.deleteBox(b.id); setBoxes(boxes.filter(x => x.id !== b.id)); }}
                            className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'users' && (
            <div>
              <div className="mb-4 flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">총 {users.length}명의 사용자</span>
              </div>
              <div className="space-y-2">
                {users.map((u: any) => (
                  <div key={u.id || u.email} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 transition-all hover:shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-sm font-bold text-primary">
                        {(u.name || u.email || '?').charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium">{u.name || u.email}</div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="rounded-full bg-muted px-2 py-0.5 font-medium">{u.role}</span>
                          <span>{u.school_id}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'messages' && (
            <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
              <div className="mb-3 text-4xl">💬</div>
              <p className="font-medium">메시지 관리</p>
              <p className="mt-1 text-sm text-muted-foreground">각 박스의 소통 탭에서 메시지를 관리할 수 있습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
