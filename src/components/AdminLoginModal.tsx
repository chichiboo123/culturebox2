import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock } from 'lucide-react';

const ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USERNAME as string | undefined;
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD as string | undefined;
const HAS_ADMIN_CREDENTIALS = Boolean(ADMIN_USERNAME && ADMIN_PASSWORD);

function checkAdmin(u: string, p: string): boolean {
  if (!HAS_ADMIN_CREDENTIALS) return false;
  return u.trim() === ADMIN_USERNAME && p === ADMIN_PASSWORD;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function AdminLoginModal({ open, onOpenChange, onSuccess }: Props) {
  const { setIsAdmin } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleLogin = () => {
    if (checkAdmin(username, password)) {
      setIsAdmin(true);
      onOpenChange(false);
      setUsername('');
      setPassword('');
      setError(false);
      onSuccess();
    } else {
      setError(true);
      setPassword('');
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
          <Label className="text-sm font-semibold">관리자 아이디</Label>
          <Input
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoComplete="off"
            className="rounded-2xl"
            onKeyDown={e => e.key === 'Enter' && document.getElementById('admin-pw')?.focus()}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">비밀번호</Label>
          <Input
            id="admin-pw"
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(false); }}
            autoComplete="off"
            className="rounded-2xl"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
          {!HAS_ADMIN_CREDENTIALS && (
            <p className="text-xs font-medium text-destructive">VITE_ADMIN_USERNAME / VITE_ADMIN_PASSWORD 환경변수가 설정되지 않았습니다.</p>
          )}
          {error && HAS_ADMIN_CREDENTIALS && <p className="text-xs font-medium text-destructive">아이디 또는 비밀번호가 올바르지 않습니다.</p>}
        </div>

        <Button
          onClick={handleLogin}
          disabled={!HAS_ADMIN_CREDENTIALS}
          className="w-full rounded-2xl gradient-primary text-primary-foreground shadow-md btn-bounce gap-1.5"
        >
          <Lock className="h-4 w-4" />
          관리자 로그인
        </Button>
      </DialogContent>
    </Dialog>
  );
}
