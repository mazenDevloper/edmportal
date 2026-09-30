'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Building2, Construction, ExternalLink, FileSignature, Globe, Loader2, ReceiptText, Store, Ticket, WifiOff } from 'lucide-react';
import { SiteConfig } from '@/lib/types';
import type { TransactionStats } from '@/lib/open-data/transactions-stats';
import { FIGURE_LABELS, ODM_SOURCES, officialFigures } from '@/lib/open-data/official-figures';
import { cn } from '@/lib/utils';

export const RENT_COLOR = '#00979B';
export const DIG_COLOR = '#7B3FA8';
export const LICENCE_COLOR = '#C2560C';
export const BUILDING_COLOR = '#2563EB';
/** One validated colour per open-data source (colour-blind safe as a set; always shown with a label) */
export const SOURCE_COLOR = { rent: RENT_COLOR, dig: DIG_COLOR, licences: LICENCE_COLOR, buildings: BUILDING_COLOR } as const;

/** Loads the open-data totals once per page view */
export function useTransactionStats(query = '') {
  const [data, setData] = useState<TransactionStats | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  useEffect(() => {
    let alive = true;
    setState(s => (s === 'ready' ? 'ready' : 'loading'));
    fetch(`/api/open-data/transactions${query}`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: TransactionStats) => { if (alive) { setData(d); setState('ready'); } })
      .catch(() => { if (alive) setState('error'); });
    return () => { alive = false; };
  }, [query]);
  return { data, state };
}

export const fmtNum = (n: number, isAr: boolean) => n.toLocaleString(isAr ? 'ar-OM' : 'en-US');

/** Counts up once when visible (instant for reduced motion); the exact number is always in the DOM for screen readers */
export function CountUp({ value, isAr }: { value: number; isAr: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setShown(value); return; }
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const step = (now: number) => {
        const k = Math.min(1, (now - t0) / 1600);
        setShown(Math.round(value * (1 - Math.pow(1 - k, 4))));
        if (k < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, { threshold: 0.3 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [value]);
  return (
    <>
      <span ref={ref} aria-hidden className="tabular-nums">{fmtNum(shown, isAr)}</span>
      <span className="sr-only">{fmtNum(value, isAr)}</span>
    </>
  );
}

interface Card { id: string; label: string; value: number | null; icon: React.ElementType; source?: string; live?: boolean; tone: 'gradient' | 'dark' | 'teal'; accent?: string; note?: string }

function FigureCard({ c, isAr, state, big }: { c: Card; isAr: boolean; state: 'loading' | 'ready' | 'error'; big?: boolean }) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const pending = c.live && state === 'loading';
  const failed = c.live && (state === 'error' || c.value === null) && !pending;
  return (
    <div className={cn('relative overflow-hidden rounded-3xl p-6 flex flex-col items-center justify-center text-center text-white min-h-[150px]',
      c.tone === 'gradient' && 'bg-gradient-to-br from-[#470D67] via-[#6b2f8f] to-[#008E91]',
      c.tone === 'dark' && 'bg-slate-900 dm-card-skyline',
      c.tone === 'teal' && 'bg-[#005751]')}>
      <c.icon size={big ? 30 : 24} className="absolute top-4 end-4 opacity-25" aria-hidden />
      {c.live && !failed && !pending && (
        <span className="absolute top-3 start-3 flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-black text-emerald-300 ring-1 ring-emerald-400/30">
          <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden />{t('مباشر', 'Live')}
        </span>
      )}
      <p className={cn('font-black leading-none', big ? 'text-4xl md:text-5xl' : 'text-3xl md:text-4xl')} style={c.accent ? { color: c.accent } : undefined}>
        {pending ? <Loader2 className="animate-spin mx-auto opacity-70" size={32} aria-label={t('جارٍ الجلب', 'Loading')} />
          : failed ? '—'
          : <CountUp value={c.value!} isAr={isAr} />}
      </p>
      <p className={cn('mt-2 font-black opacity-90', big ? 'text-lg' : 'text-base')}>{c.label}</p>
      <p className="mt-1 text-[11px] font-bold text-white/60">
        {pending ? t('جارٍ الجلب من البيانات المفتوحة…', 'Fetching from open data…')
          : failed ? <span className="inline-flex items-center gap-1"><WifiOff size={11} aria-hidden />{t('تعذّر الاتصال بالمصدر حالياً', 'Source unavailable right now')}</span>
          : c.note}
      </p>
      {c.source && (
        <a href={c.source} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 rounded-lg bg-white/10 px-2 py-1 text-[11px] font-bold text-white/80 hover:bg-white/20 hover:text-white">
          {t('المصدر', 'Source')}<ExternalLink size={11} aria-hidden /><span className="sr-only">{t(' (يفتح في نافذة جديدة)', ' (opens in a new tab)')}</span>
        </a>
      )}
    </div>
  );
}

/** "أرقام المعاملات": official figures + live rent contracts and excavation permits */
export function TransactionFigures({ isAr, stats, compactHeader = false }: { isAr: boolean; stats?: SiteConfig['stats']; compactHeader?: boolean }) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const { data, state } = useTransactionStats();
  const f = officialFigures(stats);
  const asOf = isAr ? f.asOfAr : f.asOfEn;
  const since = t('من 2020 حتى اليوم', 'since 2020');

  const top: Card[] = [
    { id: 'visits', label: isAr ? FIGURE_LABELS.visits.ar : FIGURE_LABELS.visits.en, value: f.visits, icon: Globe, tone: 'gradient', note: asOf },
    { id: 'etrans', label: isAr ? FIGURE_LABELS.eTransactions.ar : FIGURE_LABELS.eTransactions.en, value: f.eTransactions, icon: ReceiptText, tone: 'dark', note: asOf },
    { id: 'rent', label: t('إجمالي عقود الإيجار', 'Rent contracts'), value: data?.allTime.rent ?? null, icon: FileSignature, tone: 'dark', live: true, accent: '#5fd3d6', source: ODM_SOURCES.rent, note: since },
  ];
  const bottom: Card[] = [
    { id: 'bookings', label: isAr ? FIGURE_LABELS.bookings.ar : FIGURE_LABELS.bookings.en, value: f.bookings, icon: Ticket, tone: 'teal', note: asOf },
    { id: 'baladi', label: t('التراخيص البلدية', 'Municipal licences'), value: data?.allTime.licences ?? null, icon: Store, tone: 'dark', live: true, accent: '#f5a46b', source: ODM_SOURCES.municipalLicences,
      note: data?.activeLicences != null ? t(`منها ${fmtNum(data.activeLicences, true)} سارية حالياً`, `${fmtNum(data.activeLicences, false)} currently valid`) : since },
    { id: 'build', label: t('تراخيص البناء', 'Building permits'), value: data?.allTime.buildings ?? null, icon: Building2, tone: 'dark', live: true, accent: '#8fb2ff', source: ODM_SOURCES.buildingPermits, note: since },
    { id: 'dig', label: t('تراخيص حفر / مسارات خدمات', 'Excavation / utility routes'), value: data?.allTime.dig ?? null, icon: Construction, tone: 'dark', live: true, accent: '#c9a3ea', source: ODM_SOURCES.dig, note: since },
  ];

  const updated = data ? new Date(data.updatedAt).toLocaleTimeString(isAr ? 'ar-OM' : 'en-GB', { hour: '2-digit', minute: '2-digit' }) : null;

  return (
    <section aria-labelledby="figures-title" className="bg-slate-100 py-14">
      <div className="max-w-7xl mx-auto px-6 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="figures-title" className={cn('font-black text-slate-900', compactHeader ? 'text-2xl' : 'text-2xl md:text-3xl')}>{t('أرقام المعاملات', 'Transactions in numbers')}</h2>
            <p className="text-sm font-bold text-slate-500">{t('المعاملات المخزنة إلكترونياً من 2020', 'Transactions stored electronically since 2020')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span role="status" className={cn('inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black ring-1',
              state === 'ready' ? 'bg-emerald-50 text-emerald-800 ring-emerald-200' : state === 'error' ? 'bg-amber-50 text-amber-900 ring-amber-200' : 'bg-white text-slate-600 ring-slate-200')}>
              {state === 'ready' ? <><span className="size-2 rounded-full bg-emerald-500" aria-hidden />{t('متصل بالبيانات المفتوحة', 'Connected to open data')}{updated && ` · ${t('آخر تحديث', 'updated')} ${updated}`}</>
                : state === 'error' ? <><WifiOff size={13} aria-hidden />{t('تعذّر الاتصال بالبيانات المفتوحة', 'Open data unavailable')}</>
                : <><Loader2 size={13} className="animate-spin" aria-hidden />{t('جارٍ الاتصال بالبيانات المفتوحة…', 'Connecting to open data…')}</>}
            </span>
            <Link href="/open-data/transactions?tab=analysis" className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-4 py-1.5 text-xs font-black text-white hover:bg-slate-800">
              {t('التحليل التفصيلي', 'Detailed analysis')}<ArrowUpRight size={14} className={cn(isAr && '-scale-x-100')} aria-hidden />
            </Link>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">{top.map(c => <FigureCard key={c.id} c={c} isAr={isAr} state={state} big />)}</div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{bottom.map(c => <FigureCard key={c.id} c={c} isAr={isAr} state={state} />)}</div>
      </div>
    </section>
  );
}
