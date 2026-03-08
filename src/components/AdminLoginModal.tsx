import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="mb-2 text-center text-4xl">⚙️</div>
          <DialogTitle className="text-center">관리자 로그인</DialogTitle>
          <DialogDescription className="text-center">시스템 관리자 전용</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label>관리자 아이디</Label>
          <Input value={username} onChange={e => setUsername(e.target.value)} autoComplete="off"
            onKeyDown={e => e.key === 'Enter' && document.getElementById('admin-pw')?.focus()} />
        </div>

        <div className="space-y-2">
          <Label>비밀번호</Label>
          <Input id="admin-pw" type="password" value={password} onChange={e => { setPassword(e.target.value); setError(false); }}
            autoComplete="off" onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          {error && <p className="text-xs text-destructive">아이디 또는 비밀번호가 올바르지 않습니다.</p>}
        </div>

        <Button onClick={handleLogin} className="w-full">🔐 관리자 로그인</Button>
      </DialogContent>
    </Dialog>
  );
}
