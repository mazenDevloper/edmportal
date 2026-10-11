'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, ExternalLink, Languages, List, Loader2, Pause, Play, X } from 'lucide-react';
import { useSettingsStore } from '@/lib/settings-store';
import { JOURNEY, JOURNEY_SOURCE } from '@/lib/digital-journey';
import { useTransactionStats, fmtNum } from '@/components/open-data/transaction-figures';
import { officialFigures } from '@/lib/open-data/official-figures';
import { VrHeadsetIcon } from '@/components/vr-headset-icon';
import type { CourtyardHandle, LiveFigure } from '@/components/virtual/courtyard-journey';
import { cn } from '@/lib/utils';

// three.js needs the browser
const CourtyardJourney = dynamic(() => import('@/components/virtual/courtyard-journey').then(m => m.CourtyardJourney), { ssr: false });

const AUTO_MS = 9000;
// Station order in the scene: intro, the journey stages, then the live numbers board
const STATIONS = JOURNEY.length + 2;

export default function DigitalJourneyPage() {
  const router = useRouter();
  const { language, setLanguage } = useSettingsStore();
  const isAr = language === 'ar';
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const [index, setIndex] = useState(0);
  const [auto, setAuto] = useState(false);
  const [ready, setReady] = useState(false);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [vrSupported, setVrSupported] = useState(false);
  const [inVR, setInVR] = useState(false);
  const [showList, setShowList] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const scene = useRef<CourtyardHandle>(null);
  const chips = useRef<HTMLOListElement>(null);
  const { data } = useTransactionStats();

  useEffect(() => {
    document.title = `${t('رحلة التحول الرقمي', 'Digital transformation journey')} | ${t('بلدية ظفار', 'Dhofar Municipality')}`;
    try { const c = document.createElement('canvas'); setWebgl(!!(c.getContext('webgl2') || c.getContext('webgl'))); } catch { setWebgl(false); }
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const xr = (navigator as Navigator & { xr?: { isSessionSupported: (m: string) => Promise<boolean> } }).xr;
    xr?.isSessionSupported('immersive-vr').then(setVrSupported).catch(() => setVrSupported(false));
  }, [isAr]); // eslint-disable-line react-hooks/exhaustive-deps

  const next = useCallback(() => setIndex(i => (i + 1) % STATIONS), []);
  const prev = useCallback(() => setIndex(i => (i - 1 + STATIONS) % STATIONS), []);

  // Keep the current station's chip in view
  useEffect(() => { chips.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' }); }, [index, ready]);

  // Guided tour
  useEffect(() => {
    if (!auto) return;
    const id = setTimeout(next, AUTO_MS);
    return () => clearTimeout(id);
  }, [auto, index, next]);

  // Keyboard: arrows follow the reading direction, Space plays/pauses, Esc exits
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input, textarea, select')) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); isAr ? next() : prev(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); isAr ? prev() : next(); }
      if (e.key === ' ') { e.preventDefault(); setAuto(a => !a); }
      if (e.key === 'Escape' && !showList) exit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  // Live figures, the same as the home page cards (e-transactions = sum of the transaction cards)
  const figures: LiveFigure[] | null = useMemo(() => {
    if (!data) return null;
    const f = officialFigures(undefined);
    const bookings = data.website?.bookings ?? f.bookings;
    const a = data.allTime;
    const parts = [bookings, a.rent, a.licences, a.buildings, a.dig];
    const sum = parts.every(v => typeof v === 'number') ? (parts as number[]).reduce((x, y) => x + y, 0) : null;
    return [
      { labelAr: 'المعاملات الإلكترونية', labelEn: 'E-transactions', value: sum, color: '#5ff5f2' },
      { labelAr: 'عقود الإيجار', labelEn: 'Rent contracts', value: a.rent, color: '#7dd3fc' },
      { labelAr: 'التراخيص البلدية', labelEn: 'Municipal licences', value: a.licences, color: '#fdba74' },
      { labelAr: 'تراخيص البناء', labelEn: 'Building permits', value: a.buildings, color: '#a5b4fc' },
      { labelAr: 'تراخيص الحفر', labelEn: 'Excavation permits', value: a.dig, color: '#d8b4fe' },
      { labelAr: 'زيارات البوابة', labelEn: 'Portal visits', value: data.website?.visits ?? f.visits, color: '#f9a8d4' },
    ];
  }, [data]);
  const asOf = data?.asOf ? new Date(data.asOf).toLocaleDateString(isAr ? 'ar-OM' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : undefined;

  function exit() { if (window.history.length > 1) router.back(); else router.push('/'); }

  const stage = index >= 1 && index <= JOURNEY.length ? JOURNEY[index - 1] : null;
  const isLive = index === STATIONS - 1;

  const enterVR = async () => {
    try { setAuto(false); await scene.current?.enterVR(); } catch { /* the headset refused the session */ }
  };

  const StageText = () => (
    <ol className="space-y-5">
      {JOURNEY.map((s, i) => (
        <li key={s.id}>
          <button type="button" onClick={() => { setIndex(i + 1); setShowList(false); }} className="text-start w-full rounded-2xl p-4 bg-white/5 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#03CFCB]">
            <span className="block text-2xl font-black" style={{ color: s.color }}>{s.year}</span>
            <span className="block font-black text-white">{isAr ? s.titleAr : s.titleEn}</span>
            <span className="block text-sm text-white/75 mt-1">{isAr ? s.summaryAr : s.summaryEn}</span>
            {isAr && <ul className="mt-2 list-disc ps-5 text-sm text-white/80 space-y-0.5">{s.items.map(it => <li key={it}>{it}</li>)}</ul>}
            {s.visits && s.transactions && <span className="block mt-2 text-xs font-bold text-white/60">{fmtNum(s.visits, isAr)} {t('زيارة', 'visits')} · {fmtNum(s.transactions, isAr)} {t('معاملة', 'transactions')}{s.statsNoteAr && isAr ? ` (${s.statsNoteAr})` : ''}</span>}
          </button>
        </li>
      ))}
    </ol>
  );

  return (
    <div className="fixed inset-0 bg-[#05060f] text-white overflow-hidden select-none" dir={isAr ? 'rtl' : 'ltr'} lang={isAr ? 'ar' : 'en'}>
      <h1 className="sr-only">{t('رحلة التحول الرقمي لبلدية ظفار — ساحة مبنى البلدية الجديد', 'Dhofar Municipality digital transformation journey — the new building courtyard')}</h1>

      {webgl && <CourtyardJourney ref={scene} stages={JOURNEY} index={index} isAr={isAr} figures={figures} asOfLabel={asOf} reducedMotion={reducedMotion}
        onReady={() => setReady(true)} onNext={next} onVRChange={setInVR} />}

      {webgl === false && (
        <div className="absolute inset-0 overflow-y-auto p-6 pt-24 max-w-3xl mx-auto">
          <p className="mb-4 font-bold text-amber-300">{t('متصفحك لا يدعم العرض ثلاثي الأبعاد، وهذه الرحلة بصيغة نصية.', 'Your browser does not support 3D, so here is the journey as text.')}</p>
          <StageText />
        </div>
      )}

      {webgl && !ready && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#05060f]" role="status">
          <Loader2 className="animate-spin text-[#03CFCB]" size={40} />
          <p className="font-bold text-white/70">{t('نجهّز ساحة المبنى الجديد…', 'Preparing the courtyard…')}</p>
        </div>
      )}

      {/* Top bar */}
      <header className="absolute top-0 inset-x-0 p-4 flex items-center gap-2 bg-gradient-to-b from-black/60 to-transparent">
        <button type="button" onClick={exit} className="size-11 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur flex items-center justify-center" aria-label={t('خروج', 'Exit')}><X size={20} /></button>
        <div className="leading-tight">
          <p className="font-black flex items-center gap-2"><VrHeadsetIcon size={20} />{t('رحلة التحول الرقمي', 'Digital transformation journey')}</p>
          <p className="text-[11px] font-bold text-white/60">{t('ساحة مبنى بلدية ظفار الجديد · ليلاً', 'New Dhofar Municipality building courtyard · at night')}</p>
        </div>
        <div className="ms-auto flex items-center gap-2">
          <button type="button" onClick={() => setLanguage(isAr ? 'en' : 'ar')} className="h-11 px-3 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur text-sm font-black flex items-center gap-1.5" lang={isAr ? 'en' : 'ar'}>
            <Languages size={16} />{isAr ? 'EN' : 'ع'}
          </button>
          <button type="button" onClick={() => setShowList(true)} className="h-11 px-3 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur text-sm font-black flex items-center gap-1.5" aria-haspopup="dialog">
            <List size={16} /><span className="hidden sm:inline">{t('المحطات', 'Stations')}</span>
          </button>
          {vrSupported && (
            <button type="button" onClick={enterVR} disabled={inVR} className="h-11 px-4 rounded-2xl bg-gradient-to-r from-[#03CFCB] to-[#7B3FA8] text-sm font-black flex items-center gap-2 shadow-[0_0_24px_rgba(3,207,203,0.5)]">
              <VrHeadsetIcon size={18} />{t('دخول بنظارة VR', 'Enter VR')}
            </button>
          )}
        </div>
      </header>

      {/* Station caption and controls */}
      {webgl && ready && (
        <div className="absolute bottom-0 inset-x-0 p-4 pb-24 sm:pb-6 bg-gradient-to-t from-black/75 via-black/40 to-transparent">
          <div className="max-w-3xl mx-auto space-y-4">
            <div aria-live="polite" className="min-h-[4.5rem]">
              {index === 0 && <>
                <p className="text-2xl md:text-3xl font-black">{t('مرحباً بك في ساحة المبنى الجديد', 'Welcome to the new building courtyard')}</p>
                <p className="text-sm md:text-base font-bold text-white/75">{t('رحلة بلدية ظفار الرقمية من 2020 إلى رؤية 2040، وتنتهي بأرقام المعاملات مباشرة من البيانات المفتوحة. اسحب للتلفت حولك.', 'The municipality’s digital journey from 2020 to the 2040 vision, ending with live transaction numbers. Drag to look around.')}</p>
              </>}
              {stage && <>
                <p className="text-sm font-black" style={{ color: stage.color }}>{stage.year}</p>
                <p className="text-2xl md:text-3xl font-black">{isAr ? stage.titleAr : stage.titleEn}</p>
                <p className="text-sm md:text-base font-bold text-white/75">{isAr ? stage.summaryAr : stage.summaryEn}</p>
              </>}
              {isLive && <>
                <p className="text-2xl md:text-3xl font-black">{t('أرقام المعاملات الإلكترونية', 'E-transactions in numbers')}</p>
                <p className="text-sm md:text-base font-bold text-white/75">
                  {figures ? t(`مباشر من البيانات المفتوحة${asOf ? ` · حتى ${asOf}` : ''}: ${fmtNum(figures[0].value ?? 0, true)} معاملة إلكترونية.`, `Live from open data${asOf ? ` · to ${asOf}` : ''}: ${fmtNum(figures[0].value ?? 0, false)} e-transactions.`) : t('جارٍ الاتصال بالبيانات المفتوحة…', 'Connecting to open data…')}
                </p>
              </>}
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={prev} className="size-12 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur flex items-center justify-center" aria-label={t('المحطة السابقة', 'Previous station')}>
                {isAr ? <ChevronRight size={22} /> : <ChevronLeft size={22} />}
              </button>
              <button type="button" onClick={() => setAuto(a => !a)} aria-pressed={auto}
                className={cn('h-12 px-5 rounded-2xl font-black flex items-center gap-2 backdrop-blur', auto ? 'bg-[#03CFCB] text-slate-900' : 'bg-white/10 hover:bg-white/20')}>
                {auto ? <Pause size={18} /> : <Play size={18} className={cn(isAr && '-scale-x-100')} />}{auto ? t('إيقاف الجولة', 'Pause tour') : t('جولة تلقائية', 'Guided tour')}
              </button>
              <button type="button" onClick={next} className="size-12 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur flex items-center justify-center" aria-label={t('المحطة التالية', 'Next station')}>
                {isAr ? <ChevronLeft size={22} /> : <ChevronRight size={22} />}
              </button>
            </div>
            {/* Jump straight to a year */}
            <ol ref={chips} className="flex items-stretch gap-2 overflow-x-auto sm:flex-wrap sm:overflow-visible -mx-4 px-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label={t('المحطات', 'Stations')}>
              {Array.from({ length: STATIONS }, (_, i) => {
                const s = i >= 1 && i <= JOURNEY.length ? JOURNEY[i - 1] : null;
                const year = s ? s.year : i === 0 ? t('البداية', 'Start') : t('مباشر', 'Live');
                const title = s ? (isAr ? s.titleAr : s.titleEn) : i === 0 ? t('ساحة المبنى', 'The courtyard') : t('أرقام المعاملات', 'Transaction numbers');
                return (
                  <li key={i} className="shrink-0">
                    <button type="button" onClick={() => { setAuto(false); setIndex(i); }} aria-current={i === index ? 'step' : undefined} data-active={i === index}
                      className={cn('h-full max-w-[9.5rem] rounded-xl px-3 py-1.5 text-start backdrop-blur transition-colors', i === index ? 'bg-white/25 ring-1 ring-white/60' : 'bg-white/10 hover:bg-white/20')}>
                      <span className="block text-sm font-black leading-tight" style={{ color: s?.color ?? '#5ff5f2' }}>{year}</span>
                      <span className="block truncate text-[11px] font-bold text-white/85">{title}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <p className="text-[11px] font-bold text-white/45">
              {t('المحتوى: ', 'Content: ')}<a href={JOURNEY_SOURCE} target="_blank" rel="noopener noreferrer" className="underline hover:text-white/70 inline-flex items-center gap-1">{t('إنفوجرافيك رحلة التحول الرقمي', 'Digital transformation infographic')}<ExternalLink size={10} /></a>
              {' · '}{t('الأرقام: البيانات المفتوحة لبلدية ظفار', 'Figures: Dhofar Municipality open data')}
              {inVR && ` · ${t('في النظارة: اضغط الزناد للمحطة التالية', 'In the headset: press the trigger for the next station')}`}
            </p>
          </div>
        </div>
      )}

      {showList && (
        <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm overflow-y-auto" role="dialog" aria-modal aria-label={t('محطات الرحلة', 'Journey stations')}>
          <div className="max-w-3xl mx-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black">{t('محطات الرحلة', 'Journey stations')}</h2>
              <button type="button" onClick={() => setShowList(false)} className="size-11 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center" aria-label={t('إغلاق', 'Close')} autoFocus><X size={20} /></button>
            </div>
            <StageText />
            <button type="button" onClick={() => { setIndex(STATIONS - 1); setShowList(false); }} className="w-full rounded-2xl p-4 bg-[#03CFCB]/15 hover:bg-[#03CFCB]/25 text-start font-black">
              {t('أرقام المعاملات الإلكترونية (مباشر)', 'E-transactions in numbers (live)')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
