import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { API } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function AdminLoginModal({ open, onOpenChange, onSuccess }: Props) {
  const { setIsAdmin, setAdminToken } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      setError('아이디와 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await API.adminLogin(username.trim(), password);
      if (!result?.ok || !result?.admin_token) throw new Error('인증 실패');

      setAdminToken(result.admin_token);
      setIsAdmin(true);

      onOpenChange(false);
      setUsername('');
      setPassword('');
      onSuccess();
    } catch {
      setError('관리자 인증에 실패했습니다. 아이디와 비밀번호를 확인해주세요.');
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm rounded-3xl border-border/60 p-8">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-2xl">
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
          <DialogTitle className="text-center text-lg font-bold">관리자 로그인</DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">시스템 관리자 전용</DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="admin-id" className="text-sm font-semibold">관리자 아이디</Label>
          <Input
            id="admin-id"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoComplete="username"
            className="rounded-2xl"
            onKeyDown={e => e.key === 'Enter' && document.getElementById('admin-pw')?.focus()}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="admin-pw" className="text-sm font-semibold">비밀번호</Label>
          <Input
            id="admin-pw"
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            autoComplete="current-password"
            className="rounded-2xl"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
          {!!error && <p className="text-xs font-medium text-destructive">{error}</p>}
        </div>

        <Button
          onClick={handleLogin}
          disabled={loading}
          className="w-full rounded-2xl gradient-primary text-primary-foreground shadow-md btn-bounce gap-1.5"
        >
          <Lock className="h-4 w-4" />
          {loading ? '인증 중...' : '관리자 로그인'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
