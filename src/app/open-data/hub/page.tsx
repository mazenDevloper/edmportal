'use client';

/*
 * Open-data hub: every dataset the municipality publishes, with standard metadata (DCAT-AP),
 * a data dictionary, live preview, CSV/JSON downloads, an API builder, and feedback channels.
 */

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import * as Icons from 'lucide-react';
import { ArrowUpRight, Braces, Check, Copy, Database, Download, ExternalLink, FileSpreadsheet, Globe, Loader2, Search, Send, ShieldCheck, Smile, Sparkles, Star } from 'lucide-react';
import { fetchBin, updateBin } from '@/lib/jsonbin';
import { MenuItem, SiteConfig } from '@/lib/types';
import { useSettingsStore } from '@/lib/settings-store';
import { DATASETS, Dataset, DatasetId, LICENSE, PUBLISHER, THEMES, Theme, downloadUrl } from '@/lib/open-data/catalog';
import type { TransactionStats } from '@/lib/open-data/transactions-stats';
import { happinessIndex } from '@/lib/happiness';
import { SOURCE_COLOR, fmtNum } from '@/components/open-data/transaction-figures';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const glass = 'bg-white/70 backdrop-blur-xl ring-1 ring-white/80 shadow-[0_8px_32px_rgba(15,23,42,0.08)]';
const FREQ: Record<Dataset['frequency'], [string, string]> = { daily: ['يومي', 'Daily'], monthly: ['شهري', 'Monthly'], irregular: ['عند التحديث', 'As updated'] };

export default function OpenDataHub() {
  const isAr = useSettingsStore(s => s.language) === 'ar';
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [stats, setStats] = useState<TransactionStats | null>(null);
  const [happy, setHappy] = useState<ReturnType<typeof happinessIndex> | null>(null);
  const [servicesCount, setServicesCount] = useState<number | null>(null);
  const [q, setQ] = useState('');
  const [theme, setTheme] = useState<Theme | 'all'>('all');
  const [open, setOpen] = useState<Dataset | null>(null);

  useEffect(() => {
    fetchBin().then(db => {
      setMenuItems(db.menuItems || []); setSiteConfig(db.siteConfig || null);
      setHappy(happinessIndex(db.happinessResponses || []));
      setServicesCount((db.services || []).filter((s: { isPublic?: boolean }) => s.isPublic === true).length);
    }).catch(() => {});
    fetch('/api/open-data/transactions').then(r => (r.ok ? r.json() : null)).then(setStats).catch(() => {});
  }, []);
  useEffect(() => { document.title = `${t('البيانات المفتوحة', 'Open data')} | ${t('بلدية ظفار', 'Dhofar Municipality')}`; }, [isAr]); // eslint-disable-line react-hooks/exhaustive-deps

  const count = (d: Dataset): number | null => d.series ? stats?.allTime[d.series] ?? null : d.id === 'services' ? servicesCount : d.id === 'sla' ? 32 : null;
  const totalRecords = stats ? (['rent', 'dig', 'licences', 'buildings'] as const).reduce((s, k) => s + (stats.allTime[k] || 0), 0) : null;
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return DATASETS.filter(d => (theme === 'all' || d.theme === theme) && (!needle || [d.title.ar, d.title.en, d.description.ar, d.description.en, ...d.keywords.flatMap(k => [k.ar, k.en])].some(v => v.toLowerCase().includes(needle))));
  }, [q, theme]);

  // schema.org DataCatalog, so search engines (e.g. Google Dataset Search) can index the datasets
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'DataCatalog', name: 'Dhofar Municipality open data', inLanguage: ['ar', 'en'],
    publisher: { '@type': 'GovernmentOrganization', name: PUBLISHER.name.en, url: PUBLISHER.url },
    dataset: DATASETS.map(d => ({
      '@type': 'Dataset', name: d.title.en, alternateName: d.title.ar, description: d.description.en, license: LICENSE.path,
      keywords: d.keywords.map(k => k.en), temporalCoverage: d.temporalStart ? `${d.temporalStart}/..` : undefined, spatialCoverage: 'Dhofar Governorate, Oman',
      distribution: (['csv', 'json'] as const).map(f => ({ '@type': 'DataDownload', encodingFormat: f === 'csv' ? 'text/csv' : 'application/json', contentUrl: downloadUrl(d.id, f) })),
    })),
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f7fb]" dir={isAr ? 'rtl' : 'ltr'} lang={isAr ? 'ar' : 'en'}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PortalHeader menuItems={menuItems} variant="compact" />

      <main id="main" className="flex-1 relative overflow-hidden">
        {/* Soft glowing background */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-0">
          <div className="absolute -top-40 -start-32 size-[34rem] rounded-full bg-[#03CFCB]/25 blur-3xl motion-safe:animate-[pulse_9s_ease-in-out_infinite]" />
          <div className="absolute top-40 -end-40 size-[30rem] rounded-full bg-[#7B3FA8]/20 blur-3xl motion-safe:animate-[pulse_11s_ease-in-out_infinite]" />
          <div className="absolute top-[60rem] start-1/3 size-[28rem] rounded-full bg-amber-300/20 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-14 space-y-10">
          {/* Hero */}
          <section className={cn('rounded-[2.5rem] p-6 md:p-10 space-y-6', glass)}>
            <div className="flex flex-wrap items-center gap-2 text-xs font-black">
              <span className="px-3 py-1 rounded-full bg-[#005751]/10 text-[#005751] flex items-center gap-1"><Sparkles size={12} aria-hidden />{t('رؤية عُمان 2040', 'Oman Vision 2040')}</span>
              <span className="px-3 py-1 rounded-full bg-[#7B3FA8]/10 text-[#7B3FA8]">{t('بيانات حية من أنظمة البلدية', 'Live from municipal systems')}</span>
            </div>
            <div className="max-w-3xl space-y-3">
              <h1 className="text-4xl md:text-6xl font-black leading-tight bg-gradient-to-l from-[#005751] via-[#008E91] to-[#7B3FA8] bg-clip-text text-transparent">{t('البيانات المفتوحة', 'Open data')}</h1>
              <p className="text-lg font-bold text-slate-600">{t('بيانات بلدية ظفار متاحة للجميع بصيغ مفتوحة ورخصة مفتوحة: للباحثين وروّاد الأعمال والإعلاميين والمطوّرين.', 'Dhofar Municipality data, open to everyone in open formats under an open licence: for researchers, entrepreneurs, journalists and developers.')}</p>
            </div>
            <div className="relative max-w-2xl">
              <Search size={20} className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
              <input value={q} onChange={e => setQ(e.target.value)} type="search" aria-label={t('ابحث في مجموعات البيانات', 'Search datasets')}
                placeholder={t('ابحث: إيجار، تراخيص، بناء، حفر…', 'Search: rent, licences, building, excavation…')}
                className="w-full h-14 ps-12 pe-4 rounded-2xl bg-white/90 ring-1 ring-slate-200 shadow-inner font-bold outline-none focus:ring-2 focus:ring-[#03CFCB]" />
            </div>
            <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Stat icon={Database} label={t('مجموعات بيانات', 'Datasets')} value={String(DATASETS.length)} />
              <Stat icon={FileSpreadsheet} label={t('سجلات منشورة', 'Published records')} value={totalRecords === null ? '…' : fmtNum(totalRecords, isAr)} />
              <Stat icon={Globe} label={t('زيارات موقع البلدية', 'Website visits')} value={stats?.website?.visits ? fmtNum(stats.website.visits, isAr) : '…'} />
              <Stat icon={Smile} label={t('مؤشر السعادة', 'Happiness index')} value={happy?.index != null ? `${happy.index}%` : '—'} />
            </dl>
          </section>

          {/* Standards */}
          <section aria-labelledby="standards-title" className="space-y-3">
            <h2 id="standards-title" className="text-sm font-black tracking-widest text-slate-500">{t('وفق المعايير الدولية', 'Built on international standards')}</h2>
            <ul className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                { icon: Star, ar: 'بيانات مفتوحة ★★★', en: '3★ open data', dAr: 'رخصة مفتوحة، صيغ قابلة للقراءة الآلية ومفتوحة (CSV وJSON).', dEn: 'Open licence, machine-readable open formats (CSV, JSON).' },
                { icon: Braces, ar: 'DCAT-AP', en: 'DCAT-AP', dAr: 'فهرس بيانات وصفية قياسي تقرؤه البوابات الوطنية والدولية.', dEn: 'Standard metadata catalogue readable by national and international portals.' },
                { icon: ShieldCheck, ar: 'أفضل ممارسات W3C', en: 'W3C best practices', dAr: 'بيانات وصفية ومصدر وقاموس بيانات ورخصة وقنوات للملاحظات.', dEn: 'Metadata, provenance, data dictionary, licence and feedback.' },
                { icon: Globe, ar: 'schema.org', en: 'schema.org', dAr: 'قابلة للاكتشاف في محركات البحث مثل Google Dataset Search.', dEn: 'Discoverable by search engines such as Google Dataset Search.' },
                { icon: Icons.Accessibility, ar: 'نفاذ رقمي', en: 'Accessible', dAr: 'جداول بديلة للرسوم، دعم لوحة المفاتيح وقارئات الشاشة.', dEn: 'Table alternatives, keyboard and screen-reader support.' },
              ].map(s => (
                <li key={s.en} className={cn('rounded-2xl p-4 space-y-1', glass)}>
                  <p className="flex items-center gap-2 font-black text-slate-900"><s.icon size={16} className="text-[#008E91]" aria-hidden />{isAr ? s.ar : s.en}</p>
                  <p className="text-xs font-bold text-slate-500 leading-relaxed">{isAr ? s.dAr : s.dEn}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* Datasets */}
          <section aria-labelledby="datasets-title" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="datasets-title" className="text-2xl font-black text-slate-900">{t('مجموعات البيانات', 'Datasets')} <span className="text-slate-400 text-base">({shown.length})</span></h2>
              <div role="group" aria-label={t('المجال', 'Theme')} className="flex flex-wrap gap-1.5">
                {(['all', ...Object.keys(THEMES)] as (Theme | 'all')[]).map(th => (
                  <button key={th} type="button" aria-pressed={theme === th} onClick={() => setTheme(th)}
                    className={cn('h-9 px-3 rounded-full text-xs font-black transition-colors', theme === th ? 'bg-slate-900 text-white' : 'bg-white/80 ring-1 ring-slate-200 text-slate-600 hover:ring-slate-400')}>
                    {th === 'all' ? t('الكل', 'All') : isAr ? THEMES[th].ar : THEMES[th].en}
                  </button>
                ))}
              </div>
            </div>
            <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {shown.map(d => <DatasetCard key={d.id} d={d} isAr={isAr} count={count(d)} stats={stats} onOpen={() => setOpen(d)} />)}
              {!shown.length && <li className="col-span-full py-12 text-center font-bold text-slate-400">{t('لا توجد نتائج', 'No results')}</li>}
            </ul>
          </section>

          {/* Happiness + visits */}
          <section className="grid gap-4 lg:grid-cols-2">
            <div className={cn('rounded-[2rem] p-6 flex items-center gap-6', glass)}>
              <Gauge value={happy?.index ?? null} />
              <div className="space-y-1">
                <h2 className="text-xl font-black text-slate-900">{t('مؤشر السعادة', 'Happiness index')}</h2>
                <p className="text-sm font-bold text-slate-500">{happy?.total ? t(`بناءً على ${fmtNum(happy.total, true)} تقييماً من زوّار البوابة`, `Based on ${fmtNum(happy.total, false)} ratings from portal visitors`) : t('لا توجد تقييمات بعد. قيّم تجربتك من زر الوجه المبتسم.', 'No ratings yet. Rate your visit with the smiley button.')}</p>
                {!!happy?.total && <p className="text-xs font-black text-slate-600">😊 {happy.happy} · 😐 {happy.neutral} · 🙁 {happy.unhappy}</p>}
              </div>
            </div>
            <div className={cn('rounded-[2rem] p-6 flex items-center gap-5', glass)}>
              <span className="size-16 rounded-2xl bg-gradient-to-br from-[#470D67] to-[#008E91] text-white flex items-center justify-center"><Globe size={30} aria-hidden /></span>
              <div>
                <h2 className="text-xl font-black text-slate-900">{t('عدد الزيارات لكل الزوار', 'Total visits')}</h2>
                <p className="text-3xl font-black text-slate-900 tabular-nums">{stats?.website?.visits ? fmtNum(stats.website.visits, isAr) : '…'}</p>
                <p className="text-xs font-bold text-slate-500">{t('يُقرأ من عدّاد موقع البلدية edm.gov.om كل 30 دقيقة', 'Read from the edm.gov.om visit counter every 30 minutes')}</p>
              </div>
            </div>
          </section>

          <DevelopersSection isAr={isAr} />
          <RequestData isAr={isAr} />
        </div>
      </main>

      <DatasetSheet d={open} isAr={isAr} stats={stats} count={open ? count(open) : null} onClose={() => setOpen(null)} />
      <PortalFooter siteConfig={siteConfig} />
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/80 ring-1 ring-white p-4 shadow-sm">
      <dt className="flex items-center gap-1.5 text-xs font-black text-slate-500"><Icon size={14} className="text-[#008E91]" aria-hidden />{label}</dt>
      <dd className="mt-1 text-2xl font-black text-slate-900 tabular-nums">{value}</dd>
    </div>
  );
}

/** Last 12 complete months as a tiny line (decorative; the number beside it carries the information) */
function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1), w = 120, h = 36;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - 3 - (v / max) * (h - 6)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} aria-hidden className="overflow-visible" style={{ transform: 'scaleX(var(--dir-flip, 1))' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function monthlySeries(stats: TransactionStats | null, series?: Dataset['series']) {
  if (!stats || !series) return [];
  const thisMonth = new Date().toISOString().slice(0, 7);
  return stats.byMonth.filter(m => m.month < thisMonth).slice(-12).map(m => m[series]);
}

function DatasetCard({ d, isAr, count, stats, onOpen }: { d: Dataset; isAr: boolean; count: number | null; stats: TransactionStats | null; onOpen: () => void }) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const Icon = (Icons as unknown as Record<string, React.ElementType>)[THEMES[d.theme].icon] || Database;
  const color = d.series ? SOURCE_COLOR[d.series] : '#475569';
  return (
    <li id={d.id} className={cn('group rounded-[2rem] p-5 flex flex-col gap-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.12)] scroll-mt-24', glass)}>
      <div className="flex items-start gap-3">
        <span className="size-12 shrink-0 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}><Icon size={22} aria-hidden /></span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black text-slate-400">{isAr ? THEMES[d.theme].ar : THEMES[d.theme].en}</p>
          <h3 className="font-black text-slate-900 leading-snug">{isAr ? d.title.ar : d.title.en}</h3>
        </div>
        <span className="flex text-amber-400" aria-label={t(`${d.stars} نجوم من 5 في مقياس البيانات المفتوحة`, `${d.stars} of 5 open-data stars`)}>
          {Array.from({ length: 5 }, (_, i) => <Star key={i} size={12} className={i < d.stars ? 'fill-amber-400' : 'text-slate-300'} aria-hidden />)}
        </span>
      </div>
      <p className="text-sm font-medium text-slate-600 leading-relaxed line-clamp-3">{isAr ? d.description.ar : d.description.en}</p>
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-2xl font-black text-slate-900 tabular-nums">{count === null ? '…' : fmtNum(count, isAr)}</p>
          <p className="text-[11px] font-bold text-slate-500">{t('سجل', 'records')} · {isAr ? FREQ[d.frequency][0] : FREQ[d.frequency][1]}</p>
        </div>
        <Sparkline values={monthlySeries(stats, d.series)} color={color} />
      </div>
      <div className="mt-auto flex flex-wrap gap-2">
        <button type="button" onClick={onOpen} className="h-10 px-4 rounded-xl bg-slate-900 text-white text-sm font-black flex items-center gap-1.5">{t('التفاصيل والواجهة البرمجية', 'Details & API')}</button>
        <a href={downloadUrl(d.id, 'csv')} className="h-10 px-3 rounded-xl bg-white ring-1 ring-slate-200 text-sm font-black text-slate-700 flex items-center gap-1.5 hover:ring-[#008E91]"><Download size={14} aria-hidden />CSV</a>
        <a href={downloadUrl(d.id, 'json')} target="_blank" rel="noopener noreferrer" className="h-10 px-3 rounded-xl bg-white ring-1 ring-slate-200 text-sm font-black text-slate-700 flex items-center gap-1.5 hover:ring-[#008E91]"><Braces size={14} aria-hidden />JSON</a>
      </div>
    </li>
  );
}

function CopyButton({ text, isAr }: { text: string; isAr: boolean }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); } catch { /* blocked */ } }}
      className="shrink-0 h-9 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-black flex items-center gap-1.5">
      {done ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}{done ? (isAr ? 'نُسخ' : 'Copied') : (isAr ? 'نسخ' : 'Copy')}
    </button>
  );
}

function DatasetSheet({ d, isAr, stats, count, onClose }: { d: Dataset | null; isAr: boolean; stats: TransactionStats | null; count: number | null; onClose: () => void }) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const [preview, setPreview] = useState<{ rows: Record<string, string>[]; total: number } | null>(null);
  const [previewState, setPreviewState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [wilaya, setWilaya] = useState('');
  const [format, setFormat] = useState<'json' | 'csv'>('json');

  useEffect(() => {
    if (!d) return;
    setPreview(null); setPreviewState('loading'); setFrom(''); setTo(''); setWilaya('');
    fetch(downloadUrl(d.id, 'json', { limit: '10' })).then(r => (r.ok ? r.json() : Promise.reject())).then(j => { setPreview(j); setPreviewState('ready'); }).catch(() => setPreviewState('error'));
  }, [d]);

  if (!d) return null;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const apiUrl = origin + downloadUrl(d.id, format, d.series ? { from: from || undefined, to: to || undefined, wilaya: wilaya || undefined } : {});

  return (
    <Sheet open={!!d} onOpenChange={o => !o && onClose()}>
      <SheetContent side={isAr ? 'left' : 'right'} dir={isAr ? 'rtl' : 'ltr'} className="w-full sm:max-w-2xl overflow-y-auto bg-[#f7f9fc] p-0">
        <div className="p-6 space-y-6">
          <div className="space-y-2 pe-8">
            <p className="text-xs font-black text-[#008E91]">{isAr ? THEMES[d.theme].ar : THEMES[d.theme].en}</p>
            <SheetTitle className="text-2xl font-black text-slate-900">{isAr ? d.title.ar : d.title.en}</SheetTitle>
            <p className="font-medium text-slate-600">{isAr ? d.description.ar : d.description.en}</p>
          </div>

          <section aria-labelledby="meta-title" className="rounded-2xl bg-white ring-1 ring-slate-200 p-4">
            <h3 id="meta-title" className="font-black text-slate-900 mb-3">{t('البيانات الوصفية', 'Metadata')}</h3>
            <dl className="grid sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {[
                [t('الناشر', 'Publisher'), isAr ? PUBLISHER.name.ar : PUBLISHER.name.en],
                [t('المعرّف', 'Identifier'), `dhofar-${d.id}`],
                [t('عدد السجلات', 'Records'), count === null ? '—' : fmtNum(count, isAr)],
                [t('تكرار التحديث', 'Update frequency'), isAr ? FREQ[d.frequency][0] : FREQ[d.frequency][1]],
                [t('التغطية الزمنية', 'Temporal coverage'), d.temporalStart ? t(`من ${d.temporalStart} حتى اليوم`, `${d.temporalStart} to today`) : '—'],
                [t('التغطية المكانية', 'Spatial coverage'), t('محافظة ظفار', 'Dhofar Governorate')],
                [t('آخر تحديث', 'Last updated'), stats ? new Date(stats.updatedAt).toLocaleString(isAr ? 'ar-OM' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '—'],
                [t('الصيغ', 'Formats'), 'CSV · JSON · API'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b border-slate-100 py-1.5"><dt className="font-bold text-slate-500">{k}</dt><dd className="font-black text-slate-800 text-end">{v}</dd></div>
              ))}
            </dl>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
              <Link href={LICENSE.path} className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 flex items-center gap-1"><ShieldCheck size={13} aria-hidden />{isAr ? LICENSE.name.ar : LICENSE.name.en}</Link>
              {d.source && <a href={d.source} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 flex items-center gap-1">{t('المصدر الأصلي (ODM2040)', 'Original source (ODM2040)')}<ExternalLink size={12} aria-hidden /></a>}
              {d.series && <Link href="/open-data/transactions?tab=analysis" className="px-3 py-1.5 rounded-lg bg-[#7B3FA8]/10 text-[#7B3FA8] flex items-center gap-1">{t('التحليل التفاعلي', 'Interactive analysis')}<ArrowUpRight size={12} className={cn(isAr && '-scale-x-100')} aria-hidden /></Link>}
            </div>
          </section>

          <section aria-labelledby="dict-title" className="rounded-2xl bg-white ring-1 ring-slate-200 p-4">
            <h3 id="dict-title" className="font-black text-slate-900 mb-3">{t('قاموس البيانات', 'Data dictionary')}</h3>
            <table className="w-full text-sm">
              <thead><tr className="text-xs text-slate-500"><th scope="col" className="text-start py-1">{t('الحقل', 'Field')}</th><th scope="col" className="text-start py-1">{t('النوع', 'Type')}</th><th scope="col" className="text-start py-1">{t('الوصف', 'Description')}</th></tr></thead>
              <tbody>{d.fields.map(f => <tr key={f.name} className="border-t"><td className="py-1.5 font-mono text-xs" dir="ltr">{f.name}</td><td className="py-1.5 text-xs font-bold text-slate-500">{f.type}</td><td className="py-1.5 font-bold text-slate-700">{isAr ? f.label.ar : f.label.en}</td></tr>)}</tbody>
            </table>
          </section>

          <section aria-labelledby="preview-title" className="rounded-2xl bg-white ring-1 ring-slate-200 p-4">
            <h3 id="preview-title" className="font-black text-slate-900 mb-3">{t('معاينة (أحدث 10 سجلات)', 'Preview (latest 10 records)')}</h3>
            {previewState === 'loading' ? <p role="status" className="flex items-center gap-2 text-sm font-bold text-slate-400"><Loader2 size={14} className="animate-spin" aria-hidden />{t('جارٍ التحميل…', 'Loading…')}</p>
              : previewState === 'error' || !preview ? <p className="text-sm font-bold text-amber-800">{t('المصدر غير متاح مؤقتاً، حاول بعد قليل.', 'The source is temporarily unavailable; try again shortly.')}</p>
              : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[480px] text-xs">
                    <thead><tr className="text-slate-500">{d.fields.map(f => <th key={f.name} scope="col" className="text-start py-1 pe-3">{isAr ? f.label.ar : f.label.en}</th>)}</tr></thead>
                    <tbody>{preview.rows.map((r, i) => <tr key={i} className="border-t">{d.fields.map(f => <td key={f.name} className="py-1.5 pe-3 font-bold text-slate-700">{r[f.name]}</td>)}</tr>)}</tbody>
                  </table>
                </div>
              )}
          </section>

          <section aria-labelledby="api-title" className="rounded-2xl bg-slate-900 text-white p-4 space-y-3">
            <h3 id="api-title" className="font-black flex items-center gap-2"><Braces size={16} className="text-[#03CFCB]" aria-hidden />{t('منشئ طلب الواجهة البرمجية', 'API request builder')}</h3>
            {d.series && (
              <div className="grid sm:grid-cols-3 gap-2 text-xs font-bold">
                <label className="space-y-1"><span className="text-white/60">{t('من تاريخ', 'From')}</span><input type="date" value={from} min="2020-01-01" onChange={e => setFrom(e.target.value)} className="w-full h-9 rounded-lg bg-white/10 px-2 text-white" /></label>
                <label className="space-y-1"><span className="text-white/60">{t('إلى تاريخ', 'To')}</span><input type="date" value={to} min="2020-01-01" onChange={e => setTo(e.target.value)} className="w-full h-9 rounded-lg bg-white/10 px-2 text-white" /></label>
                <label className="space-y-1"><span className="text-white/60">{t('الولاية', 'Wilayat')}</span>
                  <select value={wilaya} onChange={e => setWilaya(e.target.value)} className="w-full h-9 rounded-lg bg-white/10 px-2 text-white">
                    <option value="" className="text-slate-900">{t('كل الولايات', 'All')}</option>
                    {(stats?.wilayat || []).map(w => <option key={w} value={w} className="text-slate-900">{w}</option>)}
                  </select>
                </label>
              </div>
            )}
            <div role="group" aria-label={t('الصيغة', 'Format')} className="flex gap-1.5">
              {(['json', 'csv'] as const).map(f => <button key={f} type="button" aria-pressed={format === f} onClick={() => setFormat(f)} className={cn('h-8 px-3 rounded-lg text-xs font-black', format === f ? 'bg-[#03CFCB] text-slate-900' : 'bg-white/10')}>{f.toUpperCase()}</button>)}
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-black/40 p-2">
              <code dir="ltr" className="flex-1 min-w-0 text-[11px] text-[#7ff5f2] break-all">GET {apiUrl}</code>
              <CopyButton text={apiUrl} isAr={isAr} />
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={apiUrl} target="_blank" rel="noopener noreferrer" className="h-9 px-4 rounded-lg bg-white text-slate-900 text-xs font-black flex items-center gap-1.5">{t('تنفيذ الطلب', 'Run request')}<ExternalLink size={12} aria-hidden /></a>
              <span className="text-[11px] font-bold text-white/50 self-center">{t('بدون مفتاح · CORS مفتوح · رخصة مفتوحة', 'No key · open CORS · open licence')}</span>
            </div>
          </section>

          <p className="text-xs font-bold text-slate-500">
            {t('طريقة الاستشهاد: ', 'Cite as: ')}
            <span dir="ltr">Dhofar Municipality ({new Date().getFullYear()}). {d.title.en} [dataset]. {origin}/open-data/hub#{d.id}</span>
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Semi-circle gauge (0–100); the number is also written out */
function Gauge({ value }: { value: number | null }) {
  const v = value ?? 0, r = 48, c = Math.PI * r;
  const color = v >= 75 ? '#059669' : v >= 50 ? '#d97706' : '#dc2626';
  return (
    <div className="relative w-32 shrink-0" aria-hidden>
      <svg viewBox="0 0 120 70" className="w-full">
        <path d="M12 62 A48 48 0 0 1 108 62" fill="none" stroke="#e2e8f0" strokeWidth={12} strokeLinecap="round" />
        {value !== null && <path d="M12 62 A48 48 0 0 1 108 62" fill="none" stroke={color} strokeWidth={12} strokeLinecap="round" strokeDasharray={`${(v / 100) * c} ${c}`} />}
      </svg>
      <span className="absolute inset-x-0 bottom-0 text-center text-2xl font-black text-slate-900">{value === null ? '—' : `${value}%`}</span>
    </div>
  );
}

function DevelopersSection({ isAr }: { isAr: boolean }) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  // Filled in after mount so the server and browser render the same HTML
  const [origin, setOrigin] = useState('');
  useEffect(() => { setOrigin(window.location.origin); }, []);
  const endpoints = [
    { path: '/api/open-data/catalog', ar: 'فهرس البيانات بصيغة DCAT-AP (JSON-LD)', en: 'Catalogue as DCAT-AP (JSON-LD)' },
    { path: '/api/open-data/download?dataset=rent&format=csv&from=2026-01-01&to=2026-03-31', ar: 'تنزيل مجموعة بيانات (CSV أو JSON) مع تصفية بالتاريخ والولاية', en: 'Download a dataset (CSV or JSON), filtered by date and wilayat' },
    { path: '/api/open-data/transactions?from=2026-01-01&to=2026-03-31&wilaya=صلالة', ar: 'إحصاءات مجمّعة: المجاميع، حسب الشهر والولاية', en: 'Aggregated statistics: totals, by month and wilayat' },
  ];
  return (
    <section aria-labelledby="dev-title" className="rounded-[2rem] bg-slate-900 text-white p-6 md:p-8 space-y-4">
      <h2 id="dev-title" className="text-2xl font-black flex items-center gap-2"><Braces className="text-[#03CFCB]" aria-hidden />{t('للمطوّرين', 'For developers')}</h2>
      <p className="font-bold text-white/70">{t('واجهات برمجية مفتوحة بدون مفتاح، تُحدَّث كل 30 دقيقة من أنظمة البلدية.', 'Open APIs, no key needed, refreshed every 30 minutes from municipal systems.')}</p>
      <ul className="space-y-2">
        {endpoints.map(e => (
          <li key={e.path} className="rounded-xl bg-white/5 ring-1 ring-white/10 p-3 space-y-2">
            <p className="text-sm font-bold text-white/80">{isAr ? e.ar : e.en}</p>
            <div className="flex items-center gap-2"><code dir="ltr" className="flex-1 min-w-0 text-[11px] text-[#7ff5f2] break-all">GET {origin}{e.path}</code><CopyButton text={origin + e.path} isAr={isAr} /></div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** "Request unpublished data" — stored for the open-data team to review */
function RequestData({ isAr }: { isAr: boolean }) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const [what, setWhat] = useState('');
  const [purpose, setPurpose] = useState('research');
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const PURPOSES = [['research', 'بحث ودراسات', 'Research'], ['business', 'أعمال واستثمار', 'Business'], ['media', 'إعلام', 'Media'], ['dev', 'تطوير تطبيقات', 'App development'], ['other', 'أخرى', 'Other']];
  const valid = what.trim().length >= 10 && (!email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setState('sending');
    try {
      const db = await fetchBin();
      const req = { id: `dr_${Date.now().toString(36)}`, at: new Date().toISOString(), what: what.trim().slice(0, 1000), purpose, ...(email.trim() ? { email: email.trim().slice(0, 120) } : {}), status: 'new' };
      await updateBin({ ...db, dataRequests: [...(db.dataRequests || []), req] });
      setState('done');
    } catch { setState('error'); }
  };

  return (
    <section aria-labelledby="req-title" className={cn('rounded-[2rem] p-6 md:p-8 grid gap-6 lg:grid-cols-[1fr_1.2fr]', glass)}>
      <div className="space-y-2">
        <h2 id="req-title" className="text-2xl font-black text-slate-900">{t('اطلب بيانات غير منشورة', 'Request unpublished data')}</h2>
        <p className="font-bold text-slate-600">{t('لم تجد ما تحتاجه؟ صف البيانات المطلوبة، وستدرسها البلدية وتنشرها وفق الضوابط.', "Can't find what you need? Describe the data and the municipality will review and publish it under its rules.")}</p>
        <Link href={LICENSE.path} className="inline-flex items-center gap-1 text-sm font-black text-[#005751] hover:underline"><ShieldCheck size={14} aria-hidden />{isAr ? LICENSE.name.ar : LICENSE.name.en}</Link>
      </div>
      {state === 'done' ? (
        <p role="status" className="self-center rounded-2xl bg-emerald-50 p-5 font-black text-emerald-800">{t('تم استلام طلبك. شكراً لك!', 'Your request was received. Thank you!')}</p>
      ) : (
        <form onSubmit={submit} className="space-y-3" noValidate>
          <label className="block space-y-1">
            <span className="text-sm font-black text-slate-700">{t('البيانات المطلوبة *', 'Data you need *')}</span>
            <textarea value={what} onChange={e => setWhat(e.target.value)} rows={3} maxLength={1000} required aria-invalid={what.length > 0 && what.trim().length < 10}
              placeholder={t('مثال: أعداد المحلات المرخصة حسب النشاط لكل ولاية شهرياً', 'e.g. licensed shops by activity per wilayat, monthly')}
              className="w-full rounded-xl bg-white ring-1 ring-slate-200 p-3 text-sm font-medium outline-none focus:ring-2 focus:ring-[#03CFCB]" />
          </label>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block space-y-1">
              <span className="text-sm font-black text-slate-700">{t('الغرض', 'Purpose')}</span>
              <select value={purpose} onChange={e => setPurpose(e.target.value)} className="w-full h-11 rounded-xl bg-white ring-1 ring-slate-200 px-3 text-sm font-bold">
                {PURPOSES.map(([id, ar, en]) => <option key={id} value={id}>{isAr ? ar : en}</option>)}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-black text-slate-700">{t('البريد للرد (اختياري)', 'Email for a reply (optional)')}</span>
              <input type="email" dir="ltr" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" className="w-full h-11 rounded-xl bg-white ring-1 ring-slate-200 px-3 text-sm" />
            </label>
          </div>
          {state === 'error' && <p role="alert" className="text-sm font-bold text-red-700">{t('تعذّر الإرسال، حاول مرة أخرى.', 'Could not send. Please try again.')}</p>}
          <button type="submit" disabled={!valid || state === 'sending'} className="h-11 px-6 rounded-xl bg-[#005751] text-white font-black flex items-center gap-2 disabled:opacity-40">
            {state === 'sending' ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Send size={16} className={cn(isAr && '-scale-x-100')} aria-hidden />}{t('إرسال الطلب', 'Send request')}
          </button>
        </form>
      )}
    </section>
  );
}
