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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 text-center text-4xl">🔑</div>
          <DialogTitle className="text-center text-xl">{t('login.title')}</DialogTitle>
          <DialogDescription className="text-center">{t('login.subtitle')}</DialogDescription>
        </DialogHeader>

        {/* Role selector */}
        <div className="flex gap-2">
          <Button
            variant={role === 'student' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setRole('student')}
          >
            🎒 {t('login.student')}
          </Button>
          <Button
            variant={role === 'teacher' ? 'default' : 'outline'}
            className="flex-1"
            onClick={() => setRole('teacher')}
          >
            👩‍🏫 {t('login.teacher')}
          </Button>
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label>{t('login.name')}</Label>
          <Input
            value={name}
            onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })); }}
            placeholder={t('login.name')}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>

        {/* School */}
        <div className="space-y-2">
          <Label>{t('login.school')}</Label>
          <Select value={schoolId || schools[0]?.id} onValueChange={setSchoolId}>
            <SelectTrigger>
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
        <div className="space-y-2">
          <Label>{role === 'student' ? t('login.code') : t('login.teacher.code')}</Label>
          <Input
            value={code}
            onChange={e => { setCode(e.target.value); setErrors(p => ({ ...p, code: '' })); }}
            placeholder={role === 'student' ? t('login.code') : t('login.teacher.code')}
            className="font-mono tracking-widest"
            autoComplete="off"
          />
          {role === 'student' && <p className="text-xs text-muted-foreground">{t('login.code.hint')}</p>}
          {errors.code && <p className="text-xs text-destructive">{errors.code}</p>}
        </div>

        <Button onClick={handleLogin} className="w-full" size="lg">
          {t('login.btn')}
        </Button>

        <button
          onClick={() => { onOpenChange(false); onAdminClick(); }}
          className="text-center text-xs text-muted-foreground hover:text-foreground"
        >
          {t('login.admin.link')}
        </button>
      </DialogContent>
    </Dialog>
  );
}
