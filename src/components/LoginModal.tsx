import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { ACCESS_CODES, generateId, getSchoolName } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdminClick: () => void;
  onSuccess?: () => void;
}

export default function LoginModal({ open, onOpenChange, onAdminClick, onSuccess }: LoginModalProps) {
  const { t, lang, setUser, schools } = useApp();
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [name, setName] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [code, setCode] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleLogin = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = t('login.name.error');
    
    const upperCode = code.trim().toUpperCase();
    const validCodes = role === 'student' ? ACCESS_CODES.student : ACCESS_CODES.teacher;
    if (!validCodes.includes(upperCode)) newErrors.code = t('login.code.error');

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const selectedSchool = schoolId || schools[0]?.id;
    setUser({
      id: generateId('usr'),
      name: name.trim(),
      school_id: selectedSchool,
      role,
      lang_pref: lang,
    });

    onOpenChange(false);
    setName('');
    setCode('');
    setErrors({});
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl border-border/60 p-8">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-3xl gradient-primary shadow-lg text-3xl">
            🔑
          </div>
          <DialogTitle className="text-center text-xl font-bold">{t('login.title')}</DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">{t('login.subtitle')}</DialogDescription>
        </DialogHeader>

        {/* Role selector */}
        <div className="flex gap-2 rounded-2xl bg-muted/50 p-1.5">
          <button
            onClick={() => setRole('student')}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${
              role === 'student'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            🎒 {t('login.student')}
          </button>
          <button
            onClick={() => setRole('teacher')}
            className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${
              role === 'teacher'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            👩‍🏫 {t('login.teacher')}
          </button>
        </div>

        {/* Name */}
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">{t('login.name')}</Label>
          <Input
            value={name}
            onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })); }}
            onKeyDown={e => e.key === 'Enter' && document.getElementById('login-code-input')?.focus()}
            placeholder={t('login.name')}
            className="rounded-2xl"
          />
          {errors.name && <p className="text-xs font-medium text-destructive">{errors.name}</p>}
        </div>

        {/* School */}
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">{t('login.school')}</Label>
          <Select value={schoolId || schools[0]?.id} onValueChange={setSchoolId}>
            <SelectTrigger className="rounded-2xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {schools.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  {getSchoolName(s, lang)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Code */}
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">{role === 'student' ? t('login.code') : t('login.teacher.code')}</Label>
          <Input
            id="login-code-input"
            value={code}
            onChange={e => { setCode(e.target.value); setErrors(p => ({ ...p, code: '' })); }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder={role === 'student' ? t('login.code') : t('login.teacher.code')}
            className="rounded-2xl font-mono tracking-widest"
            autoComplete="off"
          />
          {role === 'student' && <p className="text-xs text-muted-foreground">{t('login.code.hint')}</p>}
          {errors.code && <p className="text-xs font-medium text-destructive">{errors.code}</p>}
        </div>

        <Button onClick={handleLogin} size="lg" className="w-full rounded-2xl gradient-primary text-primary-foreground shadow-lg btn-bounce">
          {t('login.btn')}
        </Button>

        <button
          onClick={() => { onOpenChange(false); onAdminClick(); }}
          className="text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          {t('login.admin.link')}
        </button>
      </DialogContent>
    </Dialog>
  );
}
