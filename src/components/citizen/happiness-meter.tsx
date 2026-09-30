'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Frown, Loader2, Meh, Smile, X } from 'lucide-react';
import { fetchBin, updateBin } from '@/lib/jsonbin';
import { useSettingsStore } from '@/lib/settings-store';
import { HappinessResponse, HappinessScore, REASONS, happinessIndex } from '@/lib/happiness';
import { cn } from '@/lib/utils';

const HIDDEN_ON = /^\/(edmPortal|edmEmp|staff|pagebuild|servicebuild|surveybuild|identity\/board|virtual)(\/|$)/;
const VOTED_KEY = 'dm-happiness-voted';

const FACES: { score: HappinessScore; icon: React.ElementType; ar: string; en: string; tone: string }[] = [
  { score: 3, icon: Smile, ar: 'سعيد', en: 'Happy', tone: 'text-emerald-600 hover:bg-emerald-50 aria-[pressed=true]:bg-emerald-100 aria-[pressed=true]:ring-emerald-500' },
  { score: 2, icon: Meh, ar: 'محايد', en: 'Neutral', tone: 'text-amber-600 hover:bg-amber-50 aria-[pressed=true]:bg-amber-100 aria-[pressed=true]:ring-amber-500' },
  { score: 1, icon: Frown, ar: 'غير سعيد', en: 'Unhappy', tone: 'text-red-600 hover:bg-red-50 aria-[pressed=true]:bg-red-100 aria-[pressed=true]:ring-red-500' },
];

const votedPages = (): string[] => { try { return JSON.parse(sessionStorage.getItem(VOTED_KEY) || '[]'); } catch { return []; } };

/** Floating happiness meter, beside the AI assistant */
export function HappinessMeter() {
  const pathname = usePathname() || '/';
  const isAr = useSettingsStore(s => s.language) === 'ar';
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState<HappinessScore | null>(null);
  const [reasons, setReasons] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [overall, setOverall] = useState<number | null>(null);
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setAlreadyVoted(votedPages().includes(pathname)); setScore(null); setReasons([]); setComment(''); setState('idle'); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); triggerRef.current?.focus(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (HIDDEN_ON.test(pathname)) return null;

  const submit = async () => {
    if (!score) return;
    setState('sending');
    try {
      const db = await fetchBin();
      const entry: HappinessResponse = {
        id: `hap_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        at: new Date().toISOString(), page: pathname, score, reasons,
        ...(comment.trim() ? { comment: comment.trim().slice(0, 300) } : {}), lang: isAr ? 'ar' : 'en',
      };
      const all: HappinessResponse[] = [...(db.happinessResponses || []), entry];
      await updateBin({ ...db, happinessResponses: all });
      setOverall(happinessIndex(all).index);
      try { sessionStorage.setItem(VOTED_KEY, JSON.stringify([...votedPages(), pathname])); } catch { /* storage blocked */ }
      setAlreadyVoted(true);
      setState('done');
    } catch {
      setState('error');
    }
  };

  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-controls="happiness-meter"
        aria-label={t('مؤشر السعادة: قيّم تجربتك', 'Happiness meter: rate your experience')}
        className="fixed bottom-5 end-[10rem] z-[9999] size-14 rounded-full bg-amber-400 text-slate-900 border-4 border-white shadow-[0_10px_30px_rgba(245,158,11,0.45)] flex items-center justify-center hover:scale-105 transition-transform focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#470D67] print:hidden">
        {open ? <X className="size-6" aria-hidden /> : <Smile className="size-7" aria-hidden />}
      </button>

      {open && (
        <section id="happiness-meter" role="dialog" aria-modal="false" aria-labelledby="happiness-title" dir={isAr ? 'rtl' : 'ltr'} lang={isAr ? 'ar' : 'en'}
          className="fixed z-[9999] bottom-24 end-3 sm:end-5 w-[min(380px,calc(100vw-24px))] rounded-3xl bg-white shadow-[0_30px_80px_rgba(0,0,0,0.3)] ring-1 ring-slate-100 overflow-hidden print:hidden">
          <header className="flex items-center gap-3 px-5 py-4 bg-gradient-to-l from-amber-300 to-amber-400 text-slate-900">
            <Smile size={22} aria-hidden />
            <h2 id="happiness-title" className="flex-1 font-black">{t('مؤشر السعادة', 'Happiness meter')}</h2>
            <button type="button" onClick={() => { setOpen(false); triggerRef.current?.focus(); }} className="size-9 rounded-xl hover:bg-black/10 flex items-center justify-center" aria-label={t('إغلاق', 'Close')}><X size={18} /></button>
          </header>

          <div className="p-5 space-y-4" aria-live="polite">
            {state === 'done' || (alreadyVoted && state === 'idle') ? (
              <div className="text-center space-y-2 py-2">
                <Smile size={40} className="mx-auto text-emerald-600" aria-hidden />
                <p className="font-black text-slate-900">{t('شكراً لمشاركتك!', 'Thank you for your feedback!')}</p>
                <p className="text-sm font-bold text-slate-500">{t('رأيك يساعدنا على تحسين خدماتنا.', 'It helps us improve our services.')}</p>
                {overall !== null && <p className="text-sm font-black text-slate-700">{t('مؤشر السعادة العام:', 'Overall happiness:')} <span className="text-emerald-700">{overall}%</span></p>}
              </div>
            ) : (
              <>
                <p className="font-black text-slate-800">{t('ما مدى رضاك عن تجربتك في هذه الصفحة؟', 'How happy are you with this page?')}</p>
                <div role="group" aria-label={t('التقييم', 'Rating')} className="grid grid-cols-3 gap-2">
                  {FACES.map(f => (
                    <button key={f.score} type="button" aria-pressed={score === f.score} onClick={() => { setScore(f.score); setReasons([]); }}
                      className={cn('flex flex-col items-center gap-1 rounded-2xl py-3 ring-1 ring-slate-200 transition-colors', f.tone)}>
                      <f.icon size={36} aria-hidden />
                      <span className="text-xs font-black text-slate-700">{isAr ? f.ar : f.en}</span>
                    </button>
                  ))}
                </div>
                {score && (
                  <>
                    <div role="group" aria-label={t('السبب (اختياري)', 'Why? (optional)')} className="flex flex-wrap gap-1.5">
                      {REASONS[score].map(r => (
                        <button key={r.id} type="button" aria-pressed={reasons.includes(r.id)} onClick={() => setReasons(rs => rs.includes(r.id) ? rs.filter(x => x !== r.id) : [...rs, r.id])}
                          className="px-3 py-1.5 rounded-full text-xs font-black ring-1 ring-slate-200 text-slate-600 aria-[pressed=true]:bg-slate-900 aria-[pressed=true]:text-white aria-[pressed=true]:ring-slate-900">
                          {isAr ? r.ar : r.en}
                        </button>
                      ))}
                    </div>
                    <label className="block space-y-1">
                      <span className="text-xs font-bold text-slate-500">{t('ملاحظة (اختياري)', 'Comment (optional)')}</span>
                      <textarea value={comment} onChange={e => setComment(e.target.value)} maxLength={300} rows={2}
                        className="w-full rounded-xl bg-slate-50 ring-1 ring-slate-200 p-2 text-sm outline-none focus:ring-2 focus:ring-amber-400" />
                    </label>
                    <p className="text-[11px] font-bold text-slate-400">{t('تقييمك مجهول الهوية، لا تكتب بيانات شخصية.', 'Your rating is anonymous; please don’t include personal details.')}</p>
                    {state === 'error' && <p role="alert" className="text-sm font-bold text-red-700">{t('تعذّر الإرسال، حاول مرة أخرى.', 'Could not send. Please try again.')}</p>}
                    <button type="button" onClick={submit} disabled={state === 'sending'} className="w-full h-11 rounded-xl bg-slate-900 text-white font-black flex items-center justify-center gap-2 disabled:opacity-50">
                      {state === 'sending' && <Loader2 size={16} className="animate-spin" aria-hidden />}{t('إرسال التقييم', 'Send rating')}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </section>
      )}
    </>
  );
}
