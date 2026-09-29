'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Eye, EyeOff, Fingerprint, KeyRound, Languages, Loader2, LockKeyhole, Smartphone, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSettingsStore } from '@/lib/settings-store';
import { useAdminSession, verifyAdminCredentials, verifyAdminThiqa } from '@/lib/admin-session';
import { BrandLogo } from '@/components/brand-logo';
import { cn } from '@/lib/utils';

/** Sign-in shown in place of an admin panel (/edmPortal, /edmEmp) until the admin session is valid */
export function AdminLoginForm({ panelAr = 'لوحة التحكم', panelEn = 'Control panel' }: { panelAr?: string; panelEn?: string }) {
  const { language, setLanguage } = useSettingsStore();
  const isAr = language === 'ar';
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const { lockedUntil, signIn, recordFailure } = useAdminSession();

  const [method, setMethod] = useState<'credentials' | 'thiqa'>('credentials');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (lockedUntil <= now) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [lockedUntil, now]);

  const locked = mounted && lockedUntil > now;
  const lockSeconds = Math.ceil((lockedUntil - now) / 1000);
  const ready = method === 'credentials' ? !!username && !!password : phone.replace(/\D/g, '').length >= 8 && code.length >= 4;

  const attempt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locked || !ready) return;
    setBusy(true);
    setError(null);
    await new Promise(r => setTimeout(r, 500));
    const ok = method === 'credentials' ? await verifyAdminCredentials(username, password) : await verifyAdminThiqa(phone, code);
    setBusy(false);
    if (!ok) {
      recordFailure();
      setPassword('');
      setCode('');
      // One message for every failure — never reveal which part was wrong
      setError(t('بيانات الدخول غير صحيحة.', 'The sign-in details are incorrect.'));
      return;
    }
    signIn(method);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2" dir={isAr ? 'rtl' : 'ltr'} lang={isAr ? 'ar' : 'en'}>
      <aside className="relative hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-[#470D67] to-[#2a0640] text-white overflow-hidden">
        <div aria-hidden className="absolute inset-0 dm-pattern-landmark opacity-10" />
        <div className="relative flex items-center gap-3">
          <BrandLogo height={72} onDark alt={t('بلدية ظفار', 'Dhofar Municipality')} />
        </div>
        <div className="relative space-y-4">
          <h1 className="text-5xl font-black leading-tight">{t(panelAr, panelEn)}</h1>
          <p className="text-lg font-medium text-white/80 max-w-md">{t('إدارة الخدمات والصفحات والاستطلاعات والهوية والصلاحيات.', 'Manage services, pages, surveys, identity and permissions.')}</p>
        </div>
        <p className="relative text-xs font-bold text-white/60">{t('للمشرفين المخوّلين فقط. تُسجَّل محاولات الدخول.', 'Authorised administrators only. Sign-in attempts are recorded.')}</p>
      </aside>

      <main className="flex flex-col bg-slate-50">
        <div className="flex justify-between items-center p-4">
          <Link href="/" className="text-sm font-black text-slate-500 hover:text-slate-800">{t('← البوابة', '← Portal')}</Link>
          <Button variant="ghost" size="sm" onClick={() => setLanguage(isAr ? 'en' : 'ar')} className="font-black gap-1.5" lang={isAr ? 'en' : 'ar'}><Languages size={15} />{isAr ? 'English' : 'العربية'}</Button>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md space-y-6">
            <div className="space-y-1">
              <span className="size-12 rounded-2xl bg-[#470D67] text-white flex items-center justify-center mb-3"><LockKeyhole size={22} aria-hidden /></span>
              <h2 className="text-3xl font-black text-slate-900">{t('دخول المشرفين', 'Administrator sign-in')}</h2>
              <p className="text-sm font-bold text-slate-500">{t('اختر طريقة الدخول', 'Choose how to sign in')}</p>
            </div>

            <div role="tablist" aria-label={t('طريقة الدخول', 'Sign-in method')} className="grid grid-cols-2 gap-2 p-1.5 bg-white rounded-2xl shadow-sm ring-1 ring-slate-100">
              {([['credentials', KeyRound, t('اسم المستخدم', 'Username')], ['thiqa', Fingerprint, t('عبر ثقة', 'With Thiqa')]] as const).map(([m, Icon, label]) => (
                <button key={m} type="button" role="tab" aria-selected={method === m} aria-controls={`admin-panel-${m}`} onClick={() => { setMethod(m); setError(null); }}
                  className={cn('h-12 rounded-xl flex items-center justify-center gap-2 text-sm font-black transition-colors', method === m ? 'bg-[#470D67] text-white shadow' : 'text-slate-500 hover:bg-slate-50')}>
                  <Icon size={17} aria-hidden />{label}
                </button>
              ))}
            </div>

            <form onSubmit={attempt} className="bg-white rounded-3xl shadow-xl ring-1 ring-slate-100 p-6 space-y-5" noValidate>
              {method === 'credentials' ? (
                <div id="admin-panel-credentials" role="tabpanel" className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="adm-user" className="font-black text-slate-600">{t('اسم المستخدم', 'Username')}</Label>
                    <div className="relative">
                      <UserRound size={17} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
                      <Input id="adm-user" autoComplete="username" dir="ltr" value={username} onChange={e => setUsername(e.target.value)} className="h-12 ps-10 rounded-xl" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="adm-pass" className="font-black text-slate-600">{t('كلمة المرور', 'Password')}</Label>
                    <div className="relative">
                      <KeyRound size={17} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
                      <Input id="adm-pass" type={showPw ? 'text' : 'password'} autoComplete="current-password" dir="ltr" value={password} onChange={e => setPassword(e.target.value)} className="h-12 ps-10 pe-11 rounded-xl" />
                      <button type="button" onClick={() => setShowPw(v => !v)} aria-pressed={showPw} aria-label={showPw ? t('إخفاء كلمة المرور', 'Hide password') : t('إظهار كلمة المرور', 'Show password')}
                        className="absolute end-2 top-1/2 -translate-y-1/2 size-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500">{showPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                    </div>
                  </div>
                </div>
              ) : (
                <div id="admin-panel-thiqa" role="tabpanel" className="space-y-4">
                  <div role="note" className="flex gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-800">
                    <AlertTriangle size={15} className="shrink-0" aria-hidden />
                    {t('بيئة تجريبية: الربط الفعلي مع ثقة غير مفعّل بعد. أدخل رقم الهاتف والرمز المرسل إليه.', 'Test environment: the live Thiqa link is not enabled yet. Enter the phone number and the code sent to it.')}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="adm-phone" className="font-black text-slate-600">{t('رقم الهاتف', 'Phone number')}</Label>
                    <div className="relative">
                      <Smartphone size={17} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
                      <Input id="adm-phone" type="tel" inputMode="tel" autoComplete="tel" dir="ltr" value={phone} onChange={e => setPhone(e.target.value.replace(/[^\d+]/g, ''))} className="h-12 ps-10 rounded-xl font-mono text-lg" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="adm-code" className="font-black text-slate-600">{t('رمز التحقق', 'Verification code')}</Label>
                    <Input id="adm-code" inputMode="numeric" autoComplete="one-time-code" dir="ltr" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))} className="h-12 rounded-xl font-mono text-lg tracking-[0.4em] text-center" />
                  </div>
                </div>
              )}

              <div aria-live="assertive">
                {error && !locked && <p role="alert" className="flex gap-2 p-3 rounded-xl bg-red-50 text-sm font-bold text-red-700"><AlertTriangle size={16} className="shrink-0" aria-hidden />{error}</p>}
                {locked && <p role="alert" className="flex gap-2 p-3 rounded-xl bg-red-50 text-sm font-bold text-red-700"><AlertTriangle size={16} className="shrink-0" aria-hidden />{t(`محاولات كثيرة. حاول بعد ${lockSeconds} ثانية.`, `Too many attempts. Try again in ${lockSeconds}s.`)}</p>}
              </div>

              <Button type="submit" disabled={busy || locked || !ready} className="w-full h-13 py-3.5 rounded-2xl font-black text-lg gap-2 bg-[#470D67] hover:bg-[#470D67]/90 text-white">
                {busy ? <Loader2 className="animate-spin" size={18} /> : method === 'thiqa' ? <Fingerprint size={18} /> : <KeyRound size={18} />}
                {t('دخول', 'Sign in')}
              </Button>
            </form>

            <p className="text-center text-xs font-bold text-slate-400">
              {t('موظف في البلدية؟', 'Municipality employee?')} <Link href="/staff/login" className="text-[#005751] underline">{t('بوابة الموظف', 'Staff portal')}</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

