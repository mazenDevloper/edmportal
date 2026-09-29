'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowRight, Fingerprint, Loader2, RotateCcw, Smartphone } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSettingsStore } from '@/lib/settings-store';
import { isOmanMobile, maskPhone, normalizeOmanMobile, useCitizenSession } from '@/lib/citizen-session';
import { cn } from '@/lib/utils';

/** Thiqa sign-in pop-up for beneficiaries. Mounted once in the root layout; opened with requireCitizen(). */
export function ThiqaDialogHost() {
  const router = useRouter();
  const isAr = useSettingsStore(s => s.language) === 'ar';
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const { promptOpen, afterSignIn, closePrompt, requestCode, verifyCode } = useCitizenSession();

  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [testCode, setTestCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!promptOpen) return;
    setStep('phone'); setCode(''); setError(null); setTestCode(null);
  }, [promptOpen]);
  useEffect(() => { if (step === 'code') codeRef.current?.focus(); }, [step]);

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!isOmanMobile(phone)) { setError(t('أدخل رقم هاتف عُماني صحيح من 8 أرقام يبدأ بـ 7 أو 9.', 'Enter a valid 8-digit Omani mobile number starting with 7 or 9.')); return; }
    setBusy(true); setError(null);
    await new Promise(r => setTimeout(r, 600));
    setTestCode(requestCode(phone));
    setBusy(false); setCode(''); setStep('code');
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;
    setBusy(true); setError(null);
    await new Promise(r => setTimeout(r, 400));
    const ok = verifyCode(code);
    setBusy(false);
    if (!ok) {
      setCode('');
      setError(useCitizenSession.getState().pendingCode
        ? t('الرمز غير صحيح. حاول مرة أخرى.', 'That code is not correct. Try again.')
        : t('انتهت صلاحية الرمز أو تجاوزت عدد المحاولات. اطلب رمزاً جديداً.', 'The code expired or had too many attempts. Request a new one.'));
      return;
    }
    const next = afterSignIn;
    closePrompt();
    if (next) router.push(next);
  };

  return (
    <Dialog open={promptOpen} onOpenChange={o => { if (!o) closePrompt(); }}>
      <DialogContent dir={isAr ? 'rtl' : 'ltr'} lang={isAr ? 'ar' : 'en'} className="max-w-md rounded-[2rem] p-0 overflow-hidden border-none">
        <div className="relative bg-gradient-to-br from-[#005751] to-[#008E91] text-white p-6">
          <div aria-hidden className="absolute inset-0 dm-pattern-wave-pro opacity-20" />
          <div className="relative flex items-center gap-3">
            <span className="size-12 rounded-2xl bg-white/15 flex items-center justify-center"><Fingerprint size={26} aria-hidden /></span>
            <div>
              <DialogTitle className="text-xl font-black">{t('تسجيل الدخول عبر ثقة', 'Sign in with Thiqa')}</DialogTitle>
              <DialogDescription className="text-white/80 text-sm font-bold">{t('سجّل دخولك لتقديم الطلبات ومتابعتها.', 'Sign in to submit and follow your requests.')}</DialogDescription>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {step === 'phone' ? (
            <form onSubmit={send} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="thiqa-phone" className="font-black text-slate-700">{t('رقم الهاتف المسجل في ثقة', 'Mobile number registered with Thiqa')}</Label>
                <div className="relative" dir="ltr">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">+968</span>
                  <Input id="thiqa-phone" type="tel" inputMode="numeric" autoComplete="tel-national" autoFocus value={phone}
                    onChange={e => setPhone(normalizeOmanMobile(e.target.value).slice(0, 8))}
                    aria-invalid={!!error} aria-describedby={error ? 'thiqa-error' : undefined}
                    className="h-13 py-3 pl-16 pr-10 rounded-xl font-mono text-lg tracking-widest" />
                  <Smartphone size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
                </div>
              </div>
              {error && <p id="thiqa-error" role="alert" className="flex gap-2 text-sm font-bold text-red-700"><AlertTriangle size={16} className="shrink-0 mt-0.5" aria-hidden />{error}</p>}
              <Button type="submit" disabled={busy || phone.length < 8} className="w-full h-12 rounded-xl font-black gap-2 bg-[#005751] hover:bg-[#005751]/90">
                {busy ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} className={cn(isAr && '-scale-x-100')} />}{t('إرسال رمز التحقق', 'Send verification code')}
              </Button>
            </form>
          ) : (
            <form onSubmit={verify} className="space-y-4" noValidate>
              <p className="text-sm font-bold text-slate-600">{t('أرسلنا رمزاً من 6 أرقام إلى', 'We sent a 6-digit code to')} <span dir="ltr" className="font-mono font-black text-slate-900">+968 {maskPhone(phone)}</span></p>
              {testCode && (
                <div role="note" className="flex gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900">
                  <AlertTriangle size={15} className="shrink-0" aria-hidden />
                  <span>{t('بيئة تجريبية (لا توجد رسائل نصية بعد): رمزك هو', 'Test environment (no SMS yet): your code is')} <span dir="ltr" className="font-mono font-black text-base tracking-widest">{testCode}</span></span>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="thiqa-code" className="font-black text-slate-700">{t('رمز التحقق', 'Verification code')}</Label>
                <Input id="thiqa-code" ref={codeRef} inputMode="numeric" autoComplete="one-time-code" dir="ltr" value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  aria-invalid={!!error} aria-describedby={error ? 'thiqa-error' : undefined}
                  className="h-14 rounded-xl text-center font-mono text-2xl tracking-[0.5em]" />
              </div>
              {error && <p id="thiqa-error" role="alert" className="flex gap-2 text-sm font-bold text-red-700"><AlertTriangle size={16} className="shrink-0 mt-0.5" aria-hidden />{error}</p>}
              <Button type="submit" disabled={busy || code.length !== 6} className="w-full h-12 rounded-xl font-black gap-2 bg-[#005751] hover:bg-[#005751]/90">
                {busy ? <Loader2 className="animate-spin" size={18} /> : <Fingerprint size={18} />}{t('تأكيد ودخول', 'Verify and sign in')}
              </Button>
              <div className="flex justify-between text-sm font-black">
                <button type="button" onClick={() => { setStep('phone'); setError(null); }} className="text-slate-500 hover:text-slate-800">{t('تغيير الرقم', 'Change number')}</button>
                <button type="button" onClick={() => send()} className="text-[#005751] hover:underline flex items-center gap-1"><RotateCcw size={14} aria-hidden />{t('إعادة إرسال الرمز', 'Resend code')}</button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
