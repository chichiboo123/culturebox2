import { useEffect, useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { API, type Box, type School, getSchoolName, getBoxTitle } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

  const tabs: { id: AdminTab; icon: string; label: string }[] = [
    { id: 'schools', icon: '🏫', label: '학교 관리' },
    { id: 'boxes', icon: '📦', label: '박스 관리' },
    { id: 'users', icon: '👤', label: '사용자 관리' },
    { id: 'messages', icon: '💬', label: '메시지 관리' },
  ];

  return (
    <div className="container mx-auto max-w-[1100px] px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">⚙️ 관리 패널</h1>
        <Button variant="ghost" onClick={adminLogout}>관리자 로그아웃</Button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className="hidden w-60 shrink-0 md:block">
          <div className="space-y-1">
            {tabs.map(tb => (
              <button
                key={tb.id}
                onClick={() => setTab(tb.id)}
                className={`flex w-full items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  tab === tb.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                }`}
              >
                {tb.icon} {tb.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {/* Mobile tabs */}
          <div className="mb-4 flex gap-2 overflow-x-auto md:hidden">
            {tabs.map(tb => (
              <button
                key={tb.id}
                onClick={() => setTab(tb.id)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm ${
                  tab === tb.id ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}
              >
                {tb.icon} {tb.label}
              </button>
            ))}
          </div>

          {tab === 'schools' && (
            <div className="rounded-xl border border-border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left">ID</th>
                      <th className="px-4 py-3 text-left">이름 (한)</th>
                      <th className="px-4 py-3 text-left">이름 (영)</th>
                      <th className="px-4 py-3 text-left">국가</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schools.map(s => (
                      <tr key={s.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 font-mono text-xs">{s.id}</td>
                        <td className="px-4 py-3">{s.name_ko}</td>
                        <td className="px-4 py-3">{s.name_en}</td>
                        <td className="px-4 py-3">{s.country}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'boxes' && (
            <div className="rounded-xl border border-border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-4 py-3 text-left">제목</th>
                      <th className="px-4 py-3 text-left">상태</th>
                      <th className="px-4 py-3 text-left">보낸 학교</th>
                      <th className="px-4 py-3 text-left">받는 학교</th>
                      <th className="px-4 py-3 text-left">작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {boxes.map(b => (
                      <tr key={b.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 font-medium">{getBoxTitle(b, lang)}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium text-white
                            ${b.status === 'draft' ? 'bg-gray-400' :
                              b.status === 'sent' ? 'bg-blue-500' :
                              b.status === 'arrived' ? 'bg-amber-600' :
                              'bg-emerald-500'}`}>
                            {t(`status.${b.status}`)}
                          </span>
                        </td>
                        <td className="px-4 py-3">{getSchoolName(schools.find(s => s.id === b.from_school_id), lang)}</td>
                        <td className="px-4 py-3">{getSchoolName(schools.find(s => s.id === b.to_school_id), lang)}</td>
                        <td className="px-4 py-3">
                          <Button variant="ghost" size="sm" className="text-destructive"
                            onClick={async () => { await API.deleteBox(b.id); setBoxes(boxes.filter(x => x.id !== b.id)); }}>
                            삭제
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'users' && (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">사용자 {users.length}명</p>
              <div className="mt-4 space-y-2">
                {users.map((u: any) => (
                  <div key={u.id || u.email} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <div className="font-medium">{u.name || u.email}</div>
                      <div className="text-xs text-muted-foreground">{u.role} · {u.school_id}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'messages' && (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">메시지 관리 기능은 각 박스의 소통 탭에서 가능합니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
