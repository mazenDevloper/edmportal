'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, Fingerprint, IdCard, KeyRound, Languages, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSettingsStore } from '@/lib/settings-store';
import { fetchBin, updateBin } from '@/lib/jsonbin';
import { hashPassword, passwordProblems } from '@/lib/staff-password';
import { StaffUser } from '@/lib/types';
import { useStaffSession, verifyCredentials, verifyThiqa } from '@/lib/staff-session';
import { cn } from '@/lib/utils';

function StaffLogin() {
  const router = useRouter();
  const next = useSearchParams().get('next');
  const { language, setLanguage } = useSettingsStore();
  const isAr = language === 'ar';
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const { userId, expiresAt, lockedUntil, signIn, recordFailure } = useStaffSession();

  const [method, setMethod] = useState<'credentials' | 'thiqa'>('credentials');
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [password, setPassword] = useState('');
  // First sign-in after a reset: the temporary password must be replaced before entering
  const [mustChange, setMustChange] = useState<StaffUser | null>(null);
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [thiqaCivil, setThiqaCivil] = useState('');
  const [staff, setStaff] = useState<StaffUser[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());

  const target = next && next.startsWith('/staff') ? next : '/staff';

  useEffect(() => { fetchBin().then(db => setStaff(db.staffUsers || [])); }, []);
  useEffect(() => { if (userId && Date.now() < expiresAt) router.replace(target); }, [userId, expiresAt, router, target]);
  useEffect(() => {
    if (lockedUntil <= now) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [lockedUntil, now]);

  const locked = lockedUntil > now;
  const lockSeconds = Math.ceil((lockedUntil - now) / 1000);

  const attempt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locked || !staff) return;
    setBusy(true);
    setError(null);
    // Small delay so the result isn't instant (limits casual guessing)
    await new Promise(r => setTimeout(r, 500));
    const user = method === 'credentials' ? await verifyCredentials(staff, employeeNumber, password) : verifyThiqa(staff, thiqaCivil);
    setBusy(false);
    if (!user) {
      recordFailure();
      // Same message for every failure: never reveal which number was wrong
      setError(method === 'credentials'
        ? t('البيانات غير صحيحة أو الحساب غير مفعّل.', 'The details are incorrect or the account is inactive.')
        : t('لم يتم العثور على حساب موظف مرتبط بهذه الهوية في ثقة.', 'No employee account is linked to this Thiqa identity.'));
      return;
    }
    if (method === 'credentials' && user.mustChangePassword) { setPassword(''); setMustChange(user); return; }
    signIn(user.id, method);
    router.replace(target);
  };

  const pwProblems = passwordProblems(newPw, isAr);
  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mustChange || pwProblems.length || newPw !== confirmPw) return;
    setBusy(true);
    setError(null);
    try {
      const passwordHash = await hashPassword(newPw);
      const db = await fetchBin();
      await updateBin({
        ...db,
        staffUsers: (db.staffUsers || []).map((u: StaffUser) => u.id === mustChange.id
          ? { ...u, passwordHash, mustChangePassword: false, passwordUpdatedAt: new Date().toISOString() } : u),
      });
      signIn(mustChange.id, 'credentials');
      router.replace(target);
    } catch {
      setError(t('تعذّر حفظ كلمة المرور. حاول مرة أخرى.', 'Could not save the password. Try again.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2" dir={isAr ? 'rtl' : 'ltr'} lang={isAr ? 'ar' : 'en'}>
      <aside className="relative hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-[#0f9e9b] to-[#005751] text-white overflow-hidden">
        <div aria-hidden className="absolute inset-0 dm-pattern-landmark opacity-10" />
        <div className="relative flex items-center gap-3">
          <span className="size-14 rounded-2xl bg-white flex items-center justify-center"><Image src="https://imagetourl.cloud/a90z81isxaf9.png" alt="" width={44} height={30} className="object-contain" unoptimized /></span>
          <span className="text-2xl font-black">{t('بلدية ظفار', 'Dhofar Municipality')}</span>
        </div>
        <div className="relative space-y-4">
          <h1 className="text-5xl font-black leading-tight">{t('بوابة الموظف الداخلية', 'Internal staff portal')}</h1>
          <p className="text-lg font-medium text-white/80 max-w-md">{t('خدماتك حسب صلاحياتك، ومنصات العمل اليومية في مكان واحد.', 'Your services by permission, and your daily work platforms, in one place.')}</p>
        </div>
        <p className="relative text-xs font-bold text-white/60">{t('للاستخدام الرسمي من موظفي البلدية فقط.', 'For authorised municipality staff only.')}</p>
      </aside>

      <main className="flex flex-col bg-slate-50">
        <div className="flex justify-end p-4">
          <Button variant="ghost" size="sm" onClick={() => setLanguage(isAr ? 'en' : 'ar')} className="font-black gap-1.5" lang={isAr ? 'en' : 'ar'}><Languages size={15} />{isAr ? 'English' : 'العربية'}</Button>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md space-y-6">
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-secondary">{t('تسجيل الدخول', 'Sign in')}</h2>
              <p className="text-sm font-bold text-slate-500">{t('اختر طريقة الدخول', 'Choose how to sign in')}</p>
            </div>

            {mustChange ? (
              <form onSubmit={changePassword} className="bg-white rounded-3xl shadow-xl ring-1 ring-slate-100 p-6 space-y-5" noValidate aria-labelledby="change-pw-title">
                <div className="space-y-1">
                  <h3 id="change-pw-title" className="text-xl font-black text-slate-900">{t('عيّن كلمة مرور جديدة', 'Set a new password')}</h3>
                  <p className="text-sm font-bold text-slate-500">{t(`مرحباً ${mustChange.nameAr}. كلمة المرور الحالية مؤقتة، اختر كلمة مرور خاصة بك للمتابعة.`, `Welcome ${mustChange.nameEn || mustChange.nameAr}. Your current password is temporary; choose your own to continue.`)}</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="new-pw" className="font-black text-slate-600">{t('كلمة المرور الجديدة', 'New password')}</Label>
                  <Input id="new-pw" type="password" autoComplete="new-password" dir="ltr" autoFocus value={newPw} onChange={e => setNewPw(e.target.value)} aria-describedby="new-pw-rules" className="h-12 rounded-xl" />
                  <ul id="new-pw-rules" className="text-[11px] font-bold space-y-0.5">
                    {passwordProblems('', isAr).map(rule => {
                      const ok = !pwProblems.includes(rule);
                      return <li key={rule} className={ok ? 'text-emerald-700' : 'text-slate-400'}>{ok ? '✓' : '•'} {rule}</li>;
                    })}
                  </ul>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm-pw" className="font-black text-slate-600">{t('تأكيد كلمة المرور', 'Confirm password')}</Label>
                  <Input id="confirm-pw" type="password" autoComplete="new-password" dir="ltr" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} aria-invalid={!!confirmPw && confirmPw !== newPw} className="h-12 rounded-xl" />
                  {!!confirmPw && confirmPw !== newPw && <p className="text-xs font-bold text-red-700">{t('كلمتا المرور غير متطابقتين.', 'The passwords do not match.')}</p>}
                </div>
                {error && <p role="alert" className="flex gap-2 p-3 rounded-xl bg-red-50 text-sm font-bold text-red-700"><AlertTriangle size={16} className="shrink-0" />{error}</p>}
                <Button type="submit" disabled={busy || pwProblems.length > 0 || newPw !== confirmPw} className="w-full h-12 rounded-2xl font-black gap-2 dm-gradient-primary text-slate-900">
                  {busy ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}{t('حفظ والدخول', 'Save and sign in')}
                </Button>
              </form>
            ) : (<>
            <div role="tablist" aria-label={t('طريقة الدخول', 'Sign-in method')} className="grid grid-cols-2 gap-2 p-1.5 bg-white rounded-2xl shadow-sm ring-1 ring-slate-100">
              {([['credentials', KeyRound, t('الرقم الوظيفي وكلمة المرور', 'Employee no. + password')], ['thiqa', Fingerprint, t('الدخول عبر ثقة', 'Sign in with Thiqa')]] as const).map(([m, Icon, label]) => (
                <button key={m} type="button" role="tab" aria-selected={method === m} aria-controls={`panel-${m}`} onClick={() => { setMethod(m); setError(null); }}
                  className={cn('h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-black transition-colors', method === m ? 'bg-secondary text-white shadow' : 'text-slate-500 hover:bg-slate-50')}>
                  <Icon size={17} />{label}
                </button>
              ))}
            </div>

            <form onSubmit={attempt} className="bg-white rounded-3xl shadow-xl ring-1 ring-slate-100 p-6 space-y-5" noValidate>
              {method === 'credentials' ? (
                <div id="panel-credentials" role="tabpanel" className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="emp" className="font-black text-slate-600">{t('الرقم الوظيفي', 'Employee number')}</Label>
                    <div className="relative">
                      <IdCard size={17} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
                      <Input id="emp" inputMode="numeric" autoComplete="username" dir="ltr" required value={employeeNumber} onChange={e => setEmployeeNumber(e.target.value.replace(/\D/g, ''))} className="h-12 ps-10 rounded-xl font-mono text-lg" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="staff-pw" className="font-black text-slate-600">{t('كلمة المرور', 'Password')}</Label>
                    <div className="relative">
                      <KeyRound size={17} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
                      <Input id="staff-pw" type="password" autoComplete="current-password" dir="ltr" required value={password} onChange={e => setPassword(e.target.value)} className="h-12 ps-10 rounded-xl" />
                    </div>
                    <p className="text-[11px] font-bold text-slate-400">{t('نسيت كلمة المرور؟ تواصل مع مسؤول النظام لإعادة تعيينها.', 'Forgot your password? Ask the system administrator to reset it.')}</p>
                  </div>
                </div>
              ) : (
                <div id="panel-thiqa" role="tabpanel" className="space-y-4">
                  <div role="note" className="flex gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-800">
                    <AlertTriangle size={15} className="shrink-0" />
                    {t('بيئة تجريبية: الربط الفعلي مع ثقة غير مفعّل بعد. أدخل الرقم المدني الذي سيعيده ثقة بعد التحقق من هويتك.', 'Test environment: the live Thiqa link is not enabled yet. Enter the civil number Thiqa would return after verifying you.')}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="thiqa-civil" className="font-black text-slate-600">{t('الرقم المدني (من ثقة)', 'Civil number (from Thiqa)')}</Label>
                    <Input id="thiqa-civil" inputMode="numeric" dir="ltr" value={thiqaCivil} onChange={e => setThiqaCivil(e.target.value.replace(/\D/g, ''))} className="h-12 rounded-xl font-mono text-lg" />
                  </div>
                </div>
              )}

              <div aria-live="assertive" className="min-h-0">
                {error && <p role="alert" className="flex gap-2 p-3 rounded-xl bg-red-50 text-sm font-bold text-red-700"><AlertTriangle size={16} className="shrink-0" />{error}</p>}
                {locked && <p role="alert" className="flex gap-2 p-3 rounded-xl bg-red-50 text-sm font-bold text-red-700"><AlertTriangle size={16} className="shrink-0" />{t(`محاولات كثيرة. حاول بعد ${lockSeconds} ثانية.`, `Too many attempts. Try again in ${lockSeconds}s.`)}</p>}
              </div>

              <Button type="submit" disabled={busy || locked || !staff || (method === 'credentials' ? !employeeNumber || !password : !thiqaCivil)}
                className={cn('w-full h-13 py-3.5 rounded-2xl font-black text-lg gap-2', method === 'thiqa' ? 'bg-secondary hover:bg-secondary/90 text-white' : 'dm-gradient-primary text-slate-900')}>
                {busy || !staff ? <Loader2 className="animate-spin" size={18} /> : method === 'thiqa' ? <Fingerprint size={18} /> : <KeyRound size={18} />}
                {method === 'thiqa' ? t('المتابعة عبر ثقة', 'Continue with Thiqa') : t('دخول', 'Sign in')}
              </Button>
            </form>
            </>)}

            <p className="text-center text-xs font-bold text-slate-400">
              {t('لست موظفاً؟', 'Not staff?')} <Link href="/" className="text-secondary underline">{t('بوابة الخدمات للمواطنين', 'Citizen services portal')}</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function StaffLoginPage() {
  return <Suspense fallback={null}><StaffLogin /></Suspense>;
}
