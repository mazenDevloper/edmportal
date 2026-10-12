'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Columns2, ExternalLink, Footprints, Languages, List, Loader2, Maximize, Minimize, Pause, Play, Rotate3d, Share, SquarePlus, X } from 'lucide-react';
import { useSettingsStore } from '@/lib/settings-store';
import { JOURNEY, JOURNEY_SOURCE } from '@/lib/digital-journey';
import { useTransactionStats, fmtNum } from '@/components/open-data/transaction-figures';
import { officialFigures } from '@/lib/open-data/official-figures';
import { VrHeadsetIcon } from '@/components/vr-headset-icon';
import type { CourtyardHandle, LiveFigure, LookSource } from '@/components/virtual/courtyard-journey';
import { cn } from '@/lib/utils';

// three.js needs the browser
const CourtyardJourney = dynamic(() => import('@/components/virtual/courtyard-journey').then(m => m.CourtyardJourney), { ssr: false });

const AUTO_MS = 9000;
// Keep the bars and the caption out from under a phone's notch and home indicator
const SAFE_TOP: React.CSSProperties = { paddingTop: 'max(1rem, env(safe-area-inset-top))', paddingLeft: 'max(1rem, env(safe-area-inset-left))', paddingRight: 'max(1rem, env(safe-area-inset-right))' };
const SAFE_SIDES: React.CSSProperties = { paddingLeft: 'max(1rem, env(safe-area-inset-left))', paddingRight: 'max(1rem, env(safe-area-inset-right))' };

/** On-screen stick for walking: drag the knob with a finger or the mouse; it reports x (right) and y (towards you), −1…1 */
function Joystick({ onMove, label }: { onMove: (x: number, y: number) => void; label: string }) {
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const move = useRef(onMove);
  move.current = onMove;
  useEffect(() => () => move.current(0, 0), []);
  const set = (e: React.PointerEvent<HTMLDivElement>) => {
    const b = e.currentTarget.getBoundingClientRect(), R = b.width / 2;
    let x = (e.clientX - b.left - R) / (R * 0.6), y = (e.clientY - b.top - R) / (R * 0.6);
    const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; }
    setKnob({ x, y }); move.current(x, y);
  };
  const end = () => { setKnob({ x: 0, y: 0 }); move.current(0, 0); };
  return (
    <div role="application" aria-label={label} title={label}
      onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); set(e); }}
      onPointerMove={e => { if (e.currentTarget.hasPointerCapture(e.pointerId)) set(e); }}
      onPointerUp={end} onPointerCancel={end}
      className="absolute z-10 end-[max(1rem,env(safe-area-inset-right),env(safe-area-inset-left))] bottom-[44%] landscape:end-28 landscape:bottom-4 size-28 touch-none rounded-full border border-white/30 bg-white/10 backdrop-blur shadow-[0_0_30px_rgba(111,211,207,0.25)] cursor-grab active:cursor-grabbing">
      <span aria-hidden className="absolute inset-3 rounded-full border border-dashed border-white/20" />
      <span aria-hidden className="absolute left-1/2 top-1/2 size-12 rounded-full bg-[#7FDAD6] shadow-[0_0_18px_rgba(127,218,214,0.7)]" style={{ marginLeft: -24, marginTop: -24, transform: `translate(${knob.x * 32}px, ${knob.y * 32}px)` }} />
    </div>
  );
}

/** A keyboard shortcut shown as a key cap; pressing the button does the same thing */
function KeyHint({ k, label, onClick, on }: { k: string; label: string; onClick?: () => void; on?: boolean }) {
  const cls = cn('pointer-events-auto h-8 rounded-lg ps-1 pe-2 flex items-center gap-1.5 text-[11px] font-bold backdrop-blur', on ? 'bg-[#7FDAD6] text-slate-900' : 'bg-white/10 text-white/85', onClick && !on && 'hover:bg-white/20');
  const body = <><kbd dir="ltr" className={cn('min-w-6 h-6 px-1.5 rounded-md border font-mono text-[11px] flex items-center justify-center', on ? 'border-slate-900/30 bg-white/40' : 'border-white/25 bg-white/15')}>{k}</kbd>{label}</>;
  return onClick ? <button type="button" onClick={onClick} aria-pressed={on} className={cls}>{body}</button> : <span className={cls}>{body}</span>;
}
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
  // View modes: walking with the keyboard, turning with the head, side-by-side for a phone headset
  const [walk, setWalk] = useState(false);
  const [look, setLook] = useState(false);
  const [sbs, setSbs] = useState(false);
  const [lookBy, setLookBy] = useState<LookSource | null>(null);
  // Full screen: the browser's own where it has one; on an iPhone the page must be opened from the home screen instead
  const [full, setFull] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [fullHelp, setFullHelp] = useState(false);
  const toggleFull = () => {
    try {
      if (document.fullscreenElement) { void document.exitFullscreen?.()?.catch(() => {}); return; }
      if (document.fullscreenEnabled && document.documentElement.requestFullscreen) { void document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(() => setFullHelp(true)); return; }
    } catch { /* fall through to the instructions */ }
    setFullHelp(true);
  };
  const toggleWalk = () => { const v = !walk; setWalk(v); setAuto(false); void scene.current?.setMode({ walk: v }); };
  const toggleLook = () => { const v = !look; setLook(v); setAuto(false); setLookBy(null); void scene.current?.setMode({ look: v }).then(r => setLookBy(v ? r ?? null : null)); };
  const toggleSbs = () => {
    const v = !sbs; setSbs(v); setAuto(false);
    // Side-by-side is for a headset, so the head turns the view and the page goes full screen
    try {
      if (v) { setLook(true); void document.documentElement.requestFullscreen?.()?.catch(() => {}); } else if (document.fullscreenElement) void document.exitFullscreen?.()?.catch(() => {});
    } catch { /* full screen is not available here; the split view still works */ }
    void scene.current?.setMode(v ? { stereo: true, look: true } : { stereo: false }).then(r => { if (v) setLookBy(r ?? null); });
  };
  const scene = useRef<CourtyardHandle>(null);
  const chips = useRef<HTMLOListElement>(null);
  const caption = useRef<HTMLDivElement>(null);
  const [inset, setInset] = useState<number | undefined>(undefined);
  const { data } = useTransactionStats();

  useEffect(() => {
    document.title = `${t('رحلة التحول الرقمي', 'Digital transformation journey')} | ${t('بلدية ظفار', 'Dhofar Municipality')}`;
    try { const c = document.createElement('canvas'); setWebgl(!!(c.getContext('webgl2') || c.getContext('webgl'))); } catch { setWebgl(false); }
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const xr = (navigator as Navigator & { xr?: { isSessionSupported: (m: string) => Promise<boolean> } }).xr;
    xr?.isSessionSupported('immersive-vr').then(setVrSupported).catch(() => setVrSupported(false));
  }, [isAr]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onFs = () => setFull(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    setStandalone(window.matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches || !!(navigator as Navigator & { standalone?: boolean }).standalone);
    // While this page is open it is the thing "Add to Home Screen" installs, and it may draw under the notch
    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]'), oldHref = link?.getAttribute('href');
    link?.setAttribute('href', '/journey.webmanifest');
    const vp = document.querySelector<HTMLMetaElement>('meta[name="viewport"]'), oldVp = vp?.getAttribute('content');
    if (vp && oldVp && !oldVp.includes('viewport-fit')) vp.setAttribute('content', `${oldVp}, viewport-fit=cover`);
    return () => {
      document.removeEventListener('fullscreenchange', onFs);
      if (link && oldHref) link.setAttribute('href', oldHref);
      if (vp && oldVp) vp.setAttribute('content', oldVp);
    };
  }, []);

  const next = useCallback(() => setIndex(i => (i + 1) % STATIONS), []);
  const prev = useCallback(() => setIndex(i => (i - 1 + STATIONS) % STATIONS), []);

  // Keep the current station's chip in view
  useEffect(() => { chips.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' }); }, [index, ready]);

  // How much of the foot of the screen the caption and buttons cover; the scene keeps its hub screen above that
  useEffect(() => {
    const el = caption.current;
    if (!el) { setInset(sbs ? 0 : undefined); return; }
    const measure = () => setInset(Math.max(0, window.innerHeight - el.getBoundingClientRect().top));
    measure();
    const ro = new ResizeObserver(measure); ro.observe(el); window.addEventListener('resize', measure);
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
  }, [ready, sbs, webgl]);

  // Guided tour
  useEffect(() => {
    if (!auto) return;
    const id = setTimeout(next, AUTO_MS);
    return () => clearTimeout(id);
  }, [auto, index, next]);

  // Keyboard: arrows follow the reading direction, Space plays/pauses, Esc exits; M walk, H head look, V side by side,
  // L the list, Home/End the first and last station, digits jump to a station
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input, textarea, select')) return;
      // While walking, the arrow keys move the visitor instead of changing station
      if (walk && e.key.startsWith('Arrow')) { e.preventDefault(); return; }
      if (e.key === 'ArrowLeft') { e.preventDefault(); isAr ? next() : prev(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); isAr ? prev() : next(); }
      if (e.key === ' ') { e.preventDefault(); setAuto(a => !a); }
      if (e.ctrlKey || e.metaKey || e.altKey || !ready) return;
      if (e.code === 'KeyM') toggleWalk();
      if (e.code === 'KeyH') toggleLook();
      if (e.code === 'KeyV') toggleSbs();
      if (e.code === 'KeyL') setShowList(v => !v);
      if (e.code === 'KeyF') toggleFull();
      if (e.key === 'Home') { setAuto(false); setIndex(0); }
      if (e.key === 'End') { setAuto(false); setIndex(STATIONS - 1); }
      // 0 is the start, 1–9 the stations in order
      if (/^Digit\d$/.test(e.code)) { setAuto(false); setIndex(Math.min(Number(e.code.slice(5)), STATIONS - 1)); }
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
        onReady={() => setReady(true)} onNext={next} onVRChange={setInVR} onSelect={i => { setAuto(false); setIndex(i); }} bottomInset={inset} />}

      {webgl && ready && walk && <Joystick label={t('عصا التحكم: اسحب للمشي', 'Joystick: drag to walk')} onMove={(x, y) => scene.current?.move(x, y)} />}

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
      <header className="absolute top-0 inset-x-0 p-4 flex items-center gap-2 bg-gradient-to-b from-black/60 to-transparent" style={SAFE_TOP}>
        <button type="button" onClick={exit} className="size-11 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur flex items-center justify-center" aria-label={t('خروج', 'Exit')}><X size={20} /></button>
        <div className="leading-tight">
          <p className="font-black flex items-center gap-2"><VrHeadsetIcon size={20} />{t('رحلة التحول الرقمي', 'Digital transformation journey')}</p>
          <p className="text-[11px] font-bold text-white/60">{look && lookBy && !walk ? (lookBy === 'sensor' ? t('حرّك جهازك للنظر حولك', 'Move your device to look around') : lookBy === 'insecure' ? t('حساس الحركة يحتاج فتح الصفحة عبر HTTPS · حرّك المؤشر للنظر الآن', 'The motion sensor needs HTTPS · move the pointer to look for now') : t('لا يوجد حساس حركة في هذا الجهاز · حرّك المؤشر للنظر', 'This device has no motion sensor · move the pointer to look')) : walk ? t('امشِ بعصا التحكم أو W A S D · اضغط على الأرض للمشي إليها · العجلة للتقدم · اسحب للنظر', 'Walk with the stick or W A S D · press the ground to walk there · wheel to step · drag to look') : t('مبنى بلدية ظفار الجديد · صلالة المستقبل ليلاً', 'New Dhofar Municipality building · future Salalah at night')}</p>
        </div>
        <div className="ms-auto flex items-center gap-2">
          <button type="button" onClick={() => setLanguage(isAr ? 'en' : 'ar')} className="h-11 px-3 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur text-sm font-black flex items-center gap-1.5" lang={isAr ? 'en' : 'ar'}>
            <Languages size={16} />{isAr ? 'EN' : 'ع'}
          </button>
          {webgl && ready && <>
            <button type="button" onClick={toggleWalk} aria-pressed={walk} title={t('وضع المشي: عصا التحكم، لوحة المفاتيح أو الفأرة', 'Walk mode: joystick, keyboard or mouse')} className={cn('h-11 px-3 rounded-2xl backdrop-blur text-sm font-black flex items-center gap-1.5', walk ? 'bg-[#7FDAD6] text-slate-900' : 'bg-white/10 hover:bg-white/20')}>
              <Footprints size={16} /><span className="hidden md:inline">{t('مشي', 'Walk')}</span>
            </button>
            <button type="button" onClick={toggleLook} aria-pressed={look} title={t('تحريك الرأس', 'Turn with your head')} className={cn('h-11 px-3 rounded-2xl backdrop-blur text-sm font-black flex items-center gap-1.5', look ? 'bg-[#7FDAD6] text-slate-900' : 'bg-white/10 hover:bg-white/20')}>
              <Rotate3d size={16} /><span className="hidden md:inline">{t('تحريك الرأس', 'Head look')}</span>
            </button>
            <button type="button" onClick={toggleSbs} aria-pressed={sbs} title={t('جنباً إلى جنب لنظارة الهاتف', 'Side by side for a phone headset')} className={cn('h-11 px-3 rounded-2xl backdrop-blur text-sm font-black flex items-center gap-1.5', sbs ? 'bg-[#7FDAD6] text-slate-900' : 'bg-white/10 hover:bg-white/20')}>
              <Columns2 size={16} /><span className="hidden md:inline">SBS</span>
            </button>
          </>}
          {!standalone && (
            <button type="button" onClick={toggleFull} aria-pressed={full} title={t('ملء الشاشة', 'Full screen')} aria-label={t('ملء الشاشة', 'Full screen')} className={cn('size-11 rounded-2xl backdrop-blur flex items-center justify-center', full ? 'bg-[#7FDAD6] text-slate-900' : 'bg-white/10 hover:bg-white/20')}>
              {full ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          )}
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
      {webgl && ready && !sbs && (
        <div className="pointer-events-none absolute bottom-0 inset-x-0 p-4 pb-24 sm:pb-6 bg-gradient-to-t from-black/75 via-black/40 to-transparent" style={SAFE_SIDES}>
          <div ref={caption} className="max-w-3xl mx-auto space-y-4">
            <div aria-live="polite" className={cn("min-h-[4.5rem]", walk && "hidden")}>
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
            <div className="pointer-events-auto flex w-fit max-w-full flex-wrap items-center gap-3">
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
            {/* Keyboard shortcuts, as key caps that can also be pressed */}
            <div className="hidden md:flex [@media(pointer:coarse)]:!hidden flex-wrap items-center gap-1.5" aria-label={t('اختصارات لوحة المفاتيح', 'Keyboard shortcuts')}>
              {walk ? <>
                <KeyHint k="W A S D" label={t('مشي', 'Walk')} />
                <KeyHint k="Q E" label={t('دوران', 'Turn')} />
                <KeyHint k="Shift" label={t('جري', 'Run')} />
                <KeyHint k="M" label={t('إنهاء المشي', 'Stop walking')} onClick={toggleWalk} on />
              </> : <>
                <KeyHint k="← →" label={t('المحطات', 'Stations')} />
                <KeyHint k="Space" label={t('جولة', 'Tour')} onClick={() => setAuto(a => !a)} on={auto} />
                <KeyHint k="M" label={t('مشي', 'Walk')} onClick={toggleWalk} />
              </>}
              <KeyHint k="H" label={t('الرأس', 'Head')} onClick={toggleLook} on={look} />
              <KeyHint k="V" label="SBS" onClick={toggleSbs} />
              <KeyHint k="L" label={t('القائمة', 'List')} onClick={() => setShowList(true)} />
              {!standalone && <KeyHint k="F" label={t('ملء الشاشة', 'Full screen')} onClick={toggleFull} on={full} />}
              <KeyHint k="0–9" label={t('محطة', 'Station')} />
              <KeyHint k="Home" label={t('البداية', 'Start')} onClick={() => { setAuto(false); setIndex(0); }} />
            </div>
            {/* Jump straight to a year */}
            <ol ref={chips} className={cn("pointer-events-auto items-stretch gap-2 overflow-x-auto sm:flex-wrap sm:overflow-visible -mx-4 px-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", walk ? "hidden" : "flex")} aria-label={t('المحطات', 'Stations')}>
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
            <p className={cn("pointer-events-auto w-fit text-[11px] font-bold text-white/45", walk && "hidden")}>
              {t('المحتوى: ', 'Content: ')}<a href={JOURNEY_SOURCE} target="_blank" rel="noopener noreferrer" className="underline hover:text-white/70 inline-flex items-center gap-1">{t('إنفوجرافيك رحلة التحول الرقمي', 'Digital transformation infographic')}<ExternalLink size={10} /></a>
              {' · '}{t('الأرقام: البيانات المفتوحة لبلدية ظفار', 'Figures: Dhofar Municipality open data')}
              {inVR && ` · ${t('في النظارة: اضغط الزناد للمحطة التالية', 'In the headset: press the trigger for the next station')}`}
            </p>
          </div>
        </div>
      )}

      {fullHelp && (
        <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-sm overflow-y-auto flex items-center justify-center p-5" role="dialog" aria-modal aria-label={t('التشغيل بملء الشاشة', 'Running full screen')}>
          <div className="w-full max-w-md rounded-3xl bg-[#0b1326] border border-white/15 p-6 space-y-4 select-text">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xl font-black">{t('التشغيل بملء الشاشة على الهاتف', 'Full screen on a phone')}</h2>
              <button type="button" onClick={() => setFullHelp(false)} className="size-10 shrink-0 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center" aria-label={t('إغلاق', 'Close')} autoFocus><X size={18} /></button>
            </div>
            <p className="text-sm font-bold text-white/75">{t('متصفح iPhone لا يسمح للصفحة بإخفاء شريط العنوان والتبويبات. أضف الرحلة إلى الشاشة الرئيسية وافتحها من أيقونتها، فتعمل بملء الشاشة كتطبيق:', 'Safari on iPhone does not let a page hide its address bar and tabs. Add the journey to the home screen and open it from its icon; it then runs full screen like an app:')}</p>
            <ol className="space-y-3 text-sm font-bold">
              <li className="flex items-center gap-3"><span className="size-9 shrink-0 rounded-xl bg-white/10 flex items-center justify-center"><Share size={18} /></span>{t('١. اضغط زر المشاركة في المتصفح', '1. Press the browser’s Share button')}</li>
              <li className="flex items-center gap-3"><span className="size-9 shrink-0 rounded-xl bg-white/10 flex items-center justify-center"><SquarePlus size={18} /></span>{t('٢. اختر «إضافة إلى الشاشة الرئيسية»', '2. Choose “Add to Home Screen”')}</li>
              <li className="flex items-center gap-3"><span className="size-9 shrink-0 rounded-xl bg-white/10 flex items-center justify-center"><VrHeadsetIcon size={18} /></span>{t('٣. افتح «رحلة التحول» من الأيقونة الجديدة وأدر الهاتف بالعرض', '3. Open “رحلة التحول” from the new icon and turn the phone sideways')}</li>
            </ol>
            <p className="text-xs font-bold text-white/55">{t('على أندرويد وعلى الحاسوب يكفي زر ملء الشاشة، أو المفتاح F.', 'On Android and on a computer the full-screen button, or the F key, is enough.')}</p>
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
