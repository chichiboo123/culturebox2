import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock } from 'lucide-react';

function checkAdmin(u: string, p: string): boolean {
  const d = (a: number[]) => a.map(n => String.fromCharCode(n)).join('');
  return u === d([109,97,115,116,101,114]) && p === d([50,56,54,53]);
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
          {error && <p className="text-xs font-medium text-destructive">아이디 또는 비밀번호가 올바르지 않습니다.</p>}
        </div>

        <Button onClick={handleLogin} className="w-full rounded-2xl gradient-primary text-primary-foreground shadow-md btn-bounce gap-1.5">
          <Lock className="h-4 w-4" />
          관리자 로그인
        </Button>
      </DialogContent>
    </Dialog>
  );
}
