'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Accessibility, AlignRight, Baseline, Brain, Check, Contrast, Eye, EyeOff, Focus, Glasses, ImageOff, Keyboard,
  Languages, Link2, Minus, MousePointer2, Pause, Play, Plus, RotateCcw, Rows3, ScanLine, Square, Type, Volume2, X, Zap,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { A11Y_DEFAULTS, A11yPrefs, ColorMode, TEXT_SCALES, useSettingsStore } from '@/lib/settings-store';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/* Effects: mirror preferences onto <html> and draw reading aids       */
/* ------------------------------------------------------------------ */

function useApplyPrefs(p: A11yPrefs) {
  useEffect(() => {
    const el = document.documentElement;
    const set = (k: string, v: string | null) => (v == null ? el.removeAttribute(`data-a11y-${k}`) : el.setAttribute(`data-a11y-${k}`, v));
    if (p.textScale > 0) {
      set('scale', String(p.textScale));
      el.style.setProperty('--a11y-scale', String(TEXT_SCALES[p.textScale] ?? 1));
    } else {
      set('scale', null);
      el.style.removeProperty('--a11y-scale');
    }
    set('lh', p.lineHeight > 0 ? String(p.lineHeight) : null);
    set('spacing', p.textSpacing > 0 ? String(p.textSpacing) : null);
    set('font', p.readableFont ? 'readable' : null);
    // Load the readable fonts only when someone asks for them
    if (p.readableFont && !document.getElementById('a11y-readable-font')) {
      const link = document.createElement('link');
      link.id = 'a11y-readable-font';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Noto+Sans+Arabic:wght@400;700&display=swap';
      document.head.appendChild(link);
    }
    set('color', p.colorMode !== 'default' ? p.colorMode : null);
    set('links', p.highlightLinks ? 'on' : null);
    set('focus', p.strongFocus ? 'on' : null);
    set('cursor', p.bigCursor ? 'big' : null);
    set('images', p.hideImages ? 'hidden' : null);
    set('align', p.alignStart ? 'start' : null);
    set('motion', p.reducedMotion ? 'reduce' : null);
  }, [p]);
}

/** Horizontal guide line or a dimming mask that follows the pointer / focused element */
function ReadingAids({ guide, mask }: { guide: boolean; mask: boolean }) {
  const [y, setY] = useState<number | null>(null);

  useEffect(() => {
    if (!guide && !mask) return;
    const onMove = (e: PointerEvent) => setY(e.clientY);
    // Keyboard users: follow the focused element
    const onFocus = (e: FocusEvent) => {
      const r = (e.target as HTMLElement)?.getBoundingClientRect?.();
      if (r) setY(r.top + r.height / 2);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('focusin', onFocus);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('focusin', onFocus); };
  }, [guide, mask]);

  if ((!guide && !mask) || y == null) return null;
  const band = 64;
  return (
    <div aria-hidden className="a11y-aid fixed inset-0 pointer-events-none z-[9998]">
      {mask && (
        <>
          <div className="absolute inset-x-0 top-0 bg-black/60" style={{ height: Math.max(0, y - band / 2) }} />
          <div className="absolute inset-x-0 bottom-0 bg-black/60" style={{ top: y + band / 2 }} />
        </>
      )}
      {guide && (
        <div className="absolute inset-x-0 h-3 -translate-y-1/2 bg-amber-400/40 border-y-2 border-amber-500" style={{ top: y }} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Text to speech                                                     */
/* ------------------------------------------------------------------ */

function useSpeech(isAr: boolean, rate: number) {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [state, setState] = useState<'idle' | 'speaking' | 'paused'>('idle');

  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setState('idle');
  }, [supported]);

  const speak = useCallback((text: string) => {
    if (!supported || !text.trim()) return;
    window.speechSynthesis.cancel();
    const lang = /[؀-ۿ]/.test(text) ? 'ar' : isAr ? 'ar' : 'en';
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.toLowerCase().startsWith(lang));
    // Chrome stops long utterances after ~15s, so speak sentence by sentence
    const chunks = text.replace(/\s+/g, ' ').match(/[^.!?؟។\n]{1,220}[.!?؟]?/g) || [text];
    chunks.forEach((chunk, i) => {
      const u = new SpeechSynthesisUtterance(chunk.trim());
      u.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
      if (voice) u.voice = voice;
      u.rate = rate;
      if (i === chunks.length - 1) u.onend = () => setState('idle');
      u.onerror = () => setState('idle');
      window.speechSynthesis.speak(u);
    });
    setState('speaking');
  }, [supported, isAr, rate]);

  const togglePause = useCallback(() => {
    if (!supported) return;
    if (state === 'speaking') { window.speechSynthesis.pause(); setState('paused'); }
    else if (state === 'paused') { window.speechSynthesis.resume(); setState('speaking'); }
  }, [supported, state]);

  useEffect(() => () => { if (supported) window.speechSynthesis.cancel(); }, [supported]);

  return { supported, state, speak, stop, togglePause };
}

function pageText() {
  const root = document.querySelector('main') || document.getElementById('main-content') || document.body;
  const clone = root.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('script, style, noscript, [aria-hidden="true"], .sr-only').forEach(n => n.remove());
  return clone.innerText || clone.textContent || '';
}

/* ------------------------------------------------------------------ */
/* Profiles                                                            */
/* ------------------------------------------------------------------ */

type Profile = { id: string; ar: string; en: string; descAr: string; descEn: string; icon: React.ElementType; prefs: Partial<A11yPrefs> };

const PROFILES: Profile[] = [
  { id: 'vision', ar: 'ضعف البصر', en: 'Low vision', descAr: 'نص أكبر، تركيز واضح، روابط مميزة', descEn: 'Larger text, clear focus, marked links', icon: Glasses,
    prefs: { textScale: 2, lineHeight: 1, strongFocus: true, highlightLinks: true, bigCursor: true } },
  { id: 'dyslexia', ar: 'عسر القراءة', en: 'Dyslexia', descAr: 'خط مقروء، تباعد، دليل قراءة', descEn: 'Readable font, spacing, reading guide', icon: Type,
    prefs: { readableFont: true, textSpacing: 1, lineHeight: 1, readingGuide: true, alignStart: true } },
  { id: 'focus', ar: 'التركيز (ADHD)', en: 'Focus (ADHD)', descAr: 'قناع قراءة وإيقاف الحركة', descEn: 'Reading mask, no motion', icon: Brain,
    prefs: { readingMask: true, reducedMotion: true, colorMode: 'low-saturation' } },
  { id: 'seizure', ar: 'آمن للصرع', en: 'Seizure safe', descAr: 'إيقاف الحركة وتخفيف الألوان', descEn: 'Stops motion, softens colours', icon: Zap,
    prefs: { reducedMotion: true, colorMode: 'low-saturation' } },
  { id: 'keyboard', ar: 'لوحة المفاتيح', en: 'Keyboard only', descAr: 'مؤشر تركيز قوي وروابط واضحة', descEn: 'Strong focus ring, clear links', icon: Keyboard,
    prefs: { strongFocus: true, highlightLinks: true } },
  { id: 'elderly', ar: 'كبار السن', en: 'Older adults', descAr: 'نص كبير ومؤشر كبير', descEn: 'Big text and cursor', icon: Eye,
    prefs: { textScale: 3, lineHeight: 1, bigCursor: true, reducedMotion: true } },
];

const COLOR_MODES: { id: ColorMode; ar: string; en: string; swatch: string }[] = [
  { id: 'default', ar: 'افتراضي', en: 'Default', swatch: 'linear-gradient(135deg,#03CFCB,#470D67)' },
  { id: 'high-contrast', ar: 'تباين عالٍ', en: 'High contrast', swatch: 'linear-gradient(135deg,#000 50%,#ffe600 50%)' },
  { id: 'dark', ar: 'داكن', en: 'Dark', swatch: 'linear-gradient(135deg,#0f172a,#334155)' },
  { id: 'grayscale', ar: 'رمادي', en: 'Grayscale', swatch: 'linear-gradient(135deg,#111,#ddd)' },
  { id: 'low-saturation', ar: 'ألوان هادئة', en: 'Low saturation', swatch: 'linear-gradient(135deg,#8fb8b7,#9b8aa5)' },
  { id: 'high-saturation', ar: 'ألوان قوية', en: 'High saturation', swatch: 'linear-gradient(135deg,#00fff8,#9d00ff)' },
];

const PREF_KEYS = Object.keys(A11Y_DEFAULTS).filter(k => k !== 'largePanel' && k !== 'speechRate') as (keyof A11yPrefs)[];

/* ------------------------------------------------------------------ */
/* UI                                                                  */
/* ------------------------------------------------------------------ */

function ToggleTile({ on, onClick, icon: Icon, label }: { on: boolean; onClick: () => void; icon: React.ElementType; label: string }) {
  return (
    <button
      type="button" role="switch" aria-checked={on} onClick={onClick} data-track={`a11y:${label}`}
      className={cn(
        'relative flex flex-col items-center justify-center gap-1.5 min-h-[76px] p-2 rounded-2xl border-2 text-[12px] font-black leading-tight text-center transition-colors',
        'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-amber-500',
        on ? 'bg-secondary text-white border-secondary' : 'bg-white text-slate-700 border-slate-200 hover:border-secondary/50',
      )}
    >
      {on && <Check size={13} className="absolute top-1.5 end-1.5" aria-hidden />}
      <Icon size={20} aria-hidden />
      {label}
    </button>
  );
}

function Stepper({ label, value, max, display, onChange, icon: Icon, isAr }: {
  label: string; value: number; max: number; display: string; onChange: (v: number) => void; icon: React.ElementType; isAr: boolean;
}) {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-2xl border-2 border-slate-200 bg-white">
      <Icon size={18} className="text-secondary shrink-0" aria-hidden />
      <span className="flex-1 text-[13px] font-black text-slate-700">{label}</span>
      <button type="button" onClick={() => onChange(Math.max(0, value - 1))} disabled={value === 0}
        aria-label={`${isAr ? 'تقليل' : 'Decrease'} ${label}`}
        className="size-8 rounded-xl bg-slate-100 flex items-center justify-center disabled:opacity-30 hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"><Minus size={15} /></button>
      <output aria-live="polite" className="w-12 text-center text-sm font-black tabular-nums text-slate-900">{display}</output>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value === max}
        aria-label={`${isAr ? 'زيادة' : 'Increase'} ${label}`}
        className="size-8 rounded-xl bg-slate-100 flex items-center justify-center disabled:opacity-30 hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"><Plus size={15} /></button>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">{children}</h3>;
}

export function AccessibilityToolbar() {
  const store = useSettingsStore();
  const { language, setLanguage, setA11y, resetA11y } = store;
  const isAr = language === 'ar';
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const prefs = Object.fromEntries(Object.keys(A11Y_DEFAULTS).map(k => [k, store[k as keyof A11yPrefs]])) as unknown as A11yPrefs;
  const prefsKey = JSON.stringify(prefs);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stablePrefs = React.useMemo(() => prefs, [prefsKey]);
  useApplyPrefs(stablePrefs);

  const speech = useSpeech(isAr, prefs.speechRate);

  useEffect(() => { setMounted(true); }, []);

  // Alt+A opens the panel from anywhere; Escape stops reading
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'a' || e.key === 'A' || e.code === 'KeyA')) { e.preventDefault(); setOpen(o => !o); }
      if (e.key === 'Escape' && speech.state !== 'idle') speech.stop();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [speech]);

  if (!mounted) return null;

  const activeCount = PREF_KEYS.filter(k => prefs[k] !== A11Y_DEFAULTS[k]).length;
  const toggle = (k: keyof A11yPrefs) => setA11y({ [k]: !prefs[k] } as Partial<A11yPrefs>);
  const activeProfile = PROFILES.find(p => Object.entries(p.prefs).every(([k, v]) => prefs[k as keyof A11yPrefs] === v));
  const applyProfile = (p: Profile) => {
    if (activeProfile?.id === p.id) { resetA11y(); return; }
    resetA11y();
    setA11y(p.prefs);
  };

  const readSelection = () => {
    const sel = window.getSelection()?.toString() || '';
    speech.speak(sel || pageText());
  };

  return (
    <>
      <ReadingAids guide={prefs.readingGuide} mask={prefs.readingMask} />
      <div className="fixed end-5 bottom-5 z-[9999] print:hidden" dir={isAr ? 'rtl' : 'ltr'}>
        {speech.state !== 'idle' && (
          <div role="status" className="absolute bottom-full end-0 mb-3 flex items-center gap-1 p-1.5 rounded-2xl bg-slate-900 text-white shadow-2xl">
            <Volume2 size={16} className="mx-2 text-accent" aria-hidden />
            <button type="button" onClick={speech.togglePause} className="size-9 rounded-xl hover:bg-white/15 flex items-center justify-center" aria-label={speech.state === 'paused' ? t('استئناف', 'Resume') : t('إيقاف مؤقت', 'Pause')}>
              {speech.state === 'paused' ? <Play size={16} /> : <Pause size={16} />}
            </button>
            <button type="button" onClick={speech.stop} className="size-9 rounded-xl hover:bg-white/15 flex items-center justify-center" aria-label={t('إيقاف القراءة', 'Stop reading')}><Square size={15} /></button>
          </div>
        )}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              ref={triggerRef} type="button" data-track="a11y:open"
              aria-label={t('أدوات النفاذ الرقمي (Alt+A)', 'Accessibility tools (Alt+A)')}
              aria-keyshortcuts="Alt+A"
              className="relative size-14 rounded-full bg-secondary text-white border-4 border-white shadow-[0_10px_30px_rgba(0,87,81,0.45)] flex items-center justify-center hover:scale-105 transition-transform focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
            >
              <Accessibility className="size-7" aria-hidden />
              {activeCount > 0 && (
                <span className="absolute -top-1 -end-1 min-w-5 h-5 px-1 rounded-full bg-amber-400 text-slate-900 text-[11px] font-black flex items-center justify-center" aria-hidden>{activeCount}</span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent
            side="top" align="end" sideOffset={12} collisionPadding={12}
            dir={isAr ? 'rtl' : 'ltr'} lang={isAr ? 'ar' : 'en'}
            aria-label={t('أدوات النفاذ الرقمي', 'Accessibility tools')}
            className="w-[min(420px,calc(100vw-24px))] p-0 rounded-3xl border-none overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.25)] bg-slate-50"
          >
            <div className="flex items-center gap-3 px-5 py-4 bg-slate-900 text-white">
              <span className="size-10 rounded-xl bg-accent text-slate-900 flex items-center justify-center"><Accessibility size={22} aria-hidden /></span>
              <div className="flex-1 min-w-0">
                <h2 className="font-black leading-tight truncate">{t('أدوات النفاذ الرقمي', 'Accessibility tools')}</h2>
                <p className="text-[11px] font-bold text-white/60">{activeCount ? t(`${activeCount} إعدادات مفعّلة`, `${activeCount} settings on`) : t('WCAG 2.2 · اختصار Alt+A', 'WCAG 2.2 · shortcut Alt+A')}</p>
              </div>
              <button type="button" onClick={resetA11y} disabled={!activeCount} className="h-9 px-3 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 flex items-center gap-1.5 text-xs font-black">
                <RotateCcw size={14} aria-hidden />{t('إعادة ضبط', 'Reset')}
              </button>
              <button type="button" onClick={() => setOpen(false)} className="size-9 rounded-xl hover:bg-white/15 flex items-center justify-center" aria-label={t('إغلاق', 'Close')}><X size={18} /></button>
            </div>

            <div className="max-h-[min(70vh,640px)] overflow-y-auto p-4 space-y-5">
              <section>
                <SectionTitle>{t('ملفات جاهزة', 'Profiles')}</SectionTitle>
                <div className="grid grid-cols-2 gap-2">
                  {PROFILES.map(p => {
                    const on = activeProfile?.id === p.id;
                    return (
                      <button key={p.id} type="button" aria-pressed={on} onClick={() => applyProfile(p)}
                        className={cn('flex items-start gap-2.5 p-2.5 rounded-2xl border-2 text-start transition-colors focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-amber-500',
                          on ? 'bg-secondary/10 border-secondary' : 'bg-white border-slate-200 hover:border-secondary/50')}>
                        <span className={cn('size-8 rounded-lg flex items-center justify-center shrink-0', on ? 'bg-secondary text-white' : 'bg-slate-100 text-secondary')}><p.icon size={16} aria-hidden /></span>
                        <span className="min-w-0">
                          <span className="block text-[13px] font-black text-slate-800">{isAr ? p.ar : p.en}</span>
                          <span className="block text-[10.5px] font-bold text-slate-500 leading-snug">{isAr ? p.descAr : p.descEn}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="space-y-2">
                <SectionTitle>{t('النص', 'Text')}</SectionTitle>
                <Stepper isAr={isAr} icon={Type} label={t('حجم النص', 'Text size')} value={prefs.textScale} max={TEXT_SCALES.length - 1}
                  display={`${Math.round((TEXT_SCALES[prefs.textScale] ?? 1) * 100)}%`} onChange={v => setA11y({ textScale: v })} />
                <Stepper isAr={isAr} icon={Rows3} label={t('ارتفاع السطر', 'Line height')} value={prefs.lineHeight} max={2}
                  display={[t('عادي', 'Normal'), '1.8', '2.2'][prefs.lineHeight]} onChange={v => setA11y({ lineHeight: v })} />
                <Stepper isAr={isAr} icon={Baseline} label={t('تباعد الحروف والكلمات', 'Letter & word spacing')} value={prefs.textSpacing} max={2}
                  display={[t('عادي', 'Normal'), t('واسع', 'Wide'), t('أوسع', 'Wider')][prefs.textSpacing]} onChange={v => setA11y({ textSpacing: v })} />
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <ToggleTile on={prefs.readableFont} onClick={() => toggle('readableFont')} icon={Type} label={t('خط مقروء', 'Readable font')} />
                  <ToggleTile on={prefs.alignStart} onClick={() => toggle('alignStart')} icon={AlignRight} label={t('محاذاة البداية', 'Align to start')} />
                  <ToggleTile on={prefs.highlightLinks} onClick={() => toggle('highlightLinks')} icon={Link2} label={t('تمييز الروابط', 'Highlight links')} />
                </div>
              </section>

              <section>
                <SectionTitle>{t('الألوان والتباين', 'Colour & contrast')}</SectionTitle>
                <div role="radiogroup" aria-label={t('وضع الألوان', 'Colour mode')} className="grid grid-cols-3 gap-2">
                  {COLOR_MODES.map(m => {
                    const on = prefs.colorMode === m.id;
                    return (
                      <button key={m.id} type="button" role="radio" aria-checked={on} onClick={() => setA11y({ colorMode: m.id })}
                        className={cn('flex flex-col items-center gap-1.5 p-2 rounded-2xl border-2 text-[11.5px] font-black transition-colors focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-amber-500',
                          on ? 'border-secondary bg-secondary/10 text-secondary' : 'border-slate-200 bg-white text-slate-700 hover:border-secondary/50')}>
                        <span className="size-7 rounded-full ring-2 ring-white shadow" style={{ background: m.swatch }} aria-hidden />
                        {isAr ? m.ar : m.en}
                      </button>
                    );
                  })}
                </div>
              </section>

              <section>
                <SectionTitle>{t('التنقل والتركيز', 'Navigation & focus')}</SectionTitle>
                <div className="grid grid-cols-3 gap-2">
                  <ToggleTile on={prefs.readingGuide} onClick={() => toggle('readingGuide')} icon={ScanLine} label={t('دليل القراءة', 'Reading guide')} />
                  <ToggleTile on={prefs.readingMask} onClick={() => toggle('readingMask')} icon={Focus} label={t('قناع القراءة', 'Reading mask')} />
                  <ToggleTile on={prefs.bigCursor} onClick={() => toggle('bigCursor')} icon={MousePointer2} label={t('مؤشر كبير', 'Big cursor')} />
                  <ToggleTile on={prefs.strongFocus} onClick={() => toggle('strongFocus')} icon={Keyboard} label={t('إبراز التركيز', 'Strong focus')} />
                  <ToggleTile on={prefs.hideImages} onClick={() => toggle('hideImages')} icon={ImageOff} label={t('إخفاء الصور', 'Hide images')} />
                  <ToggleTile on={prefs.reducedMotion} onClick={() => toggle('reducedMotion')} icon={prefs.reducedMotion ? EyeOff : Zap} label={t('إيقاف الحركة', 'Stop animations')} />
                </div>
              </section>

              <section className="space-y-2">
                <SectionTitle>{t('القراءة الصوتية', 'Read aloud')}</SectionTitle>
                {speech.supported ? (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => speech.speak(pageText())} className="h-11 rounded-2xl bg-secondary text-white font-black text-[13px] flex items-center justify-center gap-2 hover:bg-secondary/90 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-amber-500">
                        <Volume2 size={16} aria-hidden />{t('اقرأ الصفحة', 'Read page')}
                      </button>
                      <button type="button" onMouseDown={e => e.preventDefault()} onClick={readSelection} className="h-11 rounded-2xl border-2 border-secondary text-secondary font-black text-[13px] flex items-center justify-center gap-2 hover:bg-secondary/5 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-amber-500">
                        <Volume2 size={16} aria-hidden />{t('اقرأ النص المحدد', 'Read selection')}
                      </button>
                    </div>
                    <label className="flex items-center gap-3 p-2.5 rounded-2xl border-2 border-slate-200 bg-white text-[13px] font-black text-slate-700">
                      {t('السرعة', 'Speed')}
                      <input type="range" min={0.6} max={1.6} step={0.1} value={prefs.speechRate}
                        onChange={e => setA11y({ speechRate: Number(e.target.value) })} className="flex-1 accent-[#005751]" />
                      <span className="w-10 text-center tabular-nums">{prefs.speechRate.toFixed(1)}×</span>
                    </label>
                  </>
                ) : (
                  <p className="text-xs font-bold text-slate-500">{t('المتصفح لا يدعم القراءة الصوتية.', 'This browser does not support speech.')}</p>
                )}
              </section>

              <section>
                <SectionTitle>{t('اللغة', 'Language')}</SectionTitle>
                <button type="button" onClick={() => setLanguage(isAr ? 'en' : 'ar')} lang={isAr ? 'en' : 'ar'}
                  className="w-full h-11 rounded-2xl border-2 border-slate-200 bg-white font-black text-[13px] flex items-center justify-center gap-2 hover:border-secondary/50 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-amber-500">
                  <Languages size={16} className="text-secondary" aria-hidden />{isAr ? 'Switch to English' : 'التحويل إلى العربية'}
                </button>
              </section>
            </div>

            <p className="px-5 py-3 border-t bg-white text-[10.5px] font-bold text-slate-400">
              {t('تُحفظ تفضيلاتك على هذا الجهاز وتُطبّق على جميع صفحات البوابة.', 'Your preferences are saved on this device and apply across the portal.')}
            </p>
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
}
