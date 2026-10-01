'use client';

/*
 * Visual explorer for the open data: the same figures shown four ways — a map of the wilayat,
 * 3D columns, a month-by-year heatmap and a treemap of categories — plus the table behind them.
 */

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowUpRight, Box, CalendarDays, Database, LayoutGrid, Loader2, Map as MapIcon, Table2, WifiOff } from 'lucide-react';
import { fetchBin } from '@/lib/jsonbin';
import { MenuItem, SiteConfig } from '@/lib/types';
import { useSettingsStore } from '@/lib/settings-store';
import { SOURCE_COLOR, fmtNum, useTransactionStats } from '@/components/open-data/transaction-figures';
import type { TransactionStats } from '@/lib/open-data/transactions-stats';
import { geoOf } from '@/lib/open-data/wilayat-geo';
import type { WilayaValue } from '@/components/open-data/wilayat-map';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { cn } from '@/lib/utils';

const WilayatMap = dynamic(() => import('@/components/open-data/wilayat-map').then(m => m.WilayatMap), { ssr: false, loading: () => <Placeholder /> });
const Wilayat3D = dynamic(() => import('@/components/open-data/wilayat-3d').then(m => m.Wilayat3D), { ssr: false, loading: () => <Placeholder /> });
const Placeholder = () => <div className="h-[30rem] rounded-3xl bg-slate-100 flex items-center justify-center"><Loader2 className="animate-spin text-slate-400" /></div>;

type Source = 'rent' | 'licences' | 'buildings' | 'dig';
type Measure = Source | 'all';
type View = 'map' | '3d' | 'heat' | 'tree';
const SOURCES: Source[] = ['rent', 'licences', 'buildings', 'dig'];
const LABEL: Record<Measure, [string, string]> = {
  all: ['كل المعاملات', 'All transactions'], rent: ['عقود الإيجار', 'Rent contracts'], licences: ['التراخيص البلدية', 'Municipal licences'],
  buildings: ['تراخيص البناء', 'Building permits'], dig: ['تراخيص الحفر', 'Excavation permits'],
};
const ALL_COLOR = '#005751';
const colorOf = (m: Measure) => (m === 'all' ? ALL_COLOR : SOURCE_COLOR[m]);
const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const YEAR_NOW = new Date(Date.now() + 4 * 3600e3).getFullYear();
const YEARS = Array.from({ length: YEAR_NOW - 2019 }, (_, i) => String(2020 + i));

/** White → colour ramp (one hue, light to dark) */
function tint(hex: string, t: number) {
  const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255];
  return `rgb(${c.map(v => Math.round(255 + (v - 255) * t)).join(',')})`;
}
/** Whether dark ink reads better than white on tint(hex, t) */
function lightTint(hex: string, t: number) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map(v => { const x = (255 + (v - 255) * t) / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.3;
}

export default function OpenDataVisual() {
  const isAr = useSettingsStore(s => s.language) === 'ar';
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [view, setView] = useState<View>('map');
  const [measure, setMeasure] = useState<Measure>('all');
  const [year, setYear] = useState<string>('all');
  const [compress, setCompress] = useState(false);

  useEffect(() => { fetchBin().then(db => { setMenuItems(db.menuItems || []); setSiteConfig(db.siteConfig || null); }).catch(() => {}); }, []);
  useEffect(() => { document.title = `${t('المستكشف المرئي للبيانات المفتوحة', 'Open data visual explorer')} | ${t('بلدية ظفار', 'Dhofar Municipality')}`; }, [isAr]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { const h = window.location.hash.slice(1) as View; if (['map', '3d', 'heat', 'tree'].includes(h)) setView(h); }, []);

  const query = year === 'all' ? '' : `?from=${year}-01-01&to=${year}-12-31`;
  const { data, state } = useTransactionStats(query);
  // The heatmap always needs every year
  const { data: full } = useTransactionStats('');

  const label = (m: Measure) => (isAr ? LABEL[m][0] : LABEL[m][1]);
  const color = colorOf(measure);
  const valueOf = (r: TransactionStats['byWilaya'][number]) => (measure === 'all' ? SOURCES.reduce((s, k) => s + r[k], 0) : r[measure]);

  const rows: WilayaValue[] = useMemo(() => (data?.byWilaya || []).map(r => ({
    wilaya: r.wilaya, value: valueOf(r), lines: SOURCES.map(k => ({ label: label(k), value: r[k] })),
  })), [data, measure, isAr]); // eslint-disable-line react-hooks/exhaustive-deps
  const mapped = rows.filter(r => geoOf(r.wilaya));
  const unmapped = rows.filter(r => !geoOf(r.wilaya) && r.value > 0);
  const total = rows.reduce((s, r) => s + r.value, 0);
  const top = [...mapped].sort((a, b) => b.value - a.value)[0];
  const period = year === 'all' ? t('منذ 2020 حتى أمس', 'since 2020, to yesterday') : year;

  const VIEWS: { id: View; icon: React.ElementType; ar: string; en: string }[] = [
    { id: 'map', icon: MapIcon, ar: 'خريطة', en: 'Map' },
    { id: '3d', icon: Box, ar: 'ثلاثي الأبعاد', en: '3D' },
    { id: 'heat', icon: CalendarDays, ar: 'خريطة حرارية زمنية', en: 'Time heatmap' },
    { id: 'tree', icon: LayoutGrid, ar: 'خريطة شجرية', en: 'Treemap' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f7fb]" dir={isAr ? 'rtl' : 'ltr'} lang={isAr ? 'ar' : 'en'}>
      <PortalHeader menuItems={menuItems} variant="compact" />
      <main id="main" className="flex-1">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-5">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-black tracking-widest text-[#008E91] flex items-center gap-1.5"><Database size={14} aria-hidden />{t('البيانات المفتوحة', 'OPEN DATA')}</p>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900">{t('المستكشف المرئي', 'Visual explorer')}</h1>
              <p className="text-sm font-bold text-slate-500 max-w-2xl">{t('الأرقام نفسها بأربع طرق عرض: خريطة للولايات، ومجسم ثلاثي الأبعاد، وخريطة حرارية عبر الشهور، وخريطة شجرية للفئات.', 'The same figures four ways: a map of the wilayat, 3D columns, a heatmap over months and a treemap of categories.')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/open-data/transactions?tab=analysis" className="h-10 px-4 rounded-xl bg-white ring-1 ring-slate-200 text-sm font-black text-slate-700 inline-flex items-center gap-1.5 hover:ring-[#008E91]/50">{t('التحليل التفصيلي', 'Detailed analysis')}<ArrowUpRight size={14} className={cn(isAr && '-scale-x-100')} aria-hidden /></Link>
              <Link href="/open-data/hub" className="h-10 px-4 rounded-xl bg-slate-900 text-white text-sm font-black inline-flex items-center gap-1.5">{t('مجموعات البيانات', 'Datasets')}</Link>
            </div>
          </header>

          {/* One row of filters above the charts */}
          <div className="rounded-3xl bg-white ring-1 ring-slate-200 p-3 flex flex-wrap items-center gap-3">
            <div role="tablist" aria-label={t('طريقة العرض', 'View')} className="flex flex-wrap gap-1 bg-slate-100 rounded-2xl p-1">
              {VIEWS.map(v => (
                <button key={v.id} type="button" role="tab" aria-selected={view === v.id} onClick={() => { setView(v.id); history.replaceState(null, '', `#${v.id}`); }}
                  className={cn('h-10 px-4 rounded-xl text-sm font-black flex items-center gap-2 transition-colors', view === v.id ? 'bg-white shadow text-[#005751]' : 'text-slate-600 hover:text-slate-900')}>
                  <v.icon size={16} aria-hidden />{isAr ? v.ar : v.en}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-xs font-black text-slate-500">{t('المؤشر', 'Measure')}
              <select value={measure} onChange={e => setMeasure(e.target.value as Measure)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-800">
                {(['all', ...SOURCES] as Measure[]).map(m => <option key={m} value={m}>{label(m)}</option>)}
              </select>
            </label>
            {view !== 'heat' && (
              <label className="flex items-center gap-2 text-xs font-black text-slate-500">{t('السنة', 'Year')}
                <select value={year} onChange={e => setYear(e.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-black text-slate-800">
                  <option value="all">{t('كل السنوات', 'All years')}</option>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </label>
            )}
            {view === '3d' && (
              <label className="flex items-center gap-2 text-xs font-black text-slate-600 cursor-pointer">
                <input type="checkbox" checked={compress} onChange={e => setCompress(e.target.checked)} className="size-4 accent-[#005751]" />
                {t('تقريب الأعمدة الصغيرة (مقياس الجذر)', 'Lift small columns (square-root scale)')}
              </label>
            )}
            <span role="status" className="ms-auto text-xs font-bold text-slate-500 flex items-center gap-1.5">
              {state === 'loading' && <><Loader2 size={13} className="animate-spin" />{t('جارٍ التحميل…', 'Loading…')}</>}
              {state === 'error' && <><WifiOff size={13} />{t('تعذّر الاتصال بالبيانات المفتوحة', 'Open data unavailable')}</>}
              {state === 'ready' && data?.asOf && <>{t('حتى', 'To')} {new Date(data.asOf).toLocaleDateString(isAr ? 'ar-OM' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</>}
            </span>
          </div>

          <section aria-labelledby="view-title" className="rounded-3xl bg-white ring-1 ring-slate-200 p-4 md:p-5 space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="view-title" className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span className="size-3 rounded-full" style={{ background: color }} aria-hidden />
                {view === 'heat' ? t(`${label(measure)} شهرياً`, `${label(measure)} by month`) : view === 'tree' ? t('توزيع الفئات', 'Categories') : t(`${label(measure)} حسب الولاية`, `${label(measure)} by wilayat`)}
                <span className="text-sm font-bold text-slate-400">· {view === 'heat' ? t('2020 حتى الآن', '2020 to date') : period}</span>
              </h2>
              {(view === 'map' || view === '3d') && top && (
                <p className="text-sm font-bold text-slate-500">{t('الإجمالي', 'Total')} <span className="font-black text-slate-900">{fmtNum(total, isAr)}</span> · {t('الأعلى', 'Highest')}: <span className="font-black text-slate-900">{isAr ? top.wilaya : geoOf(top.wilaya)?.en}</span> ({Math.round((top.value / Math.max(1, total)) * 100)}%)</p>
              )}
            </div>

            {view === 'map' && <>
              <WilayatMap rows={mapped} color={color} isAr={isAr} unit={t('معاملة', 'transactions')} />
              <p className="text-xs font-bold text-slate-500">{t('مساحة الدائرة تتناسب مع العدد. الدوائر عند مركز كل ولاية وليست حدوداً إدارية. اضغط الدائرة للتفاصيل، واستخدم أزرار + و − للتكبير.', 'Circle area is proportional to the count. Circles sit at each wilayat’s main town, not on boundaries. Click a circle for details; use + and − to zoom.')}</p>
            </>}
            {view === '3d' && <>
              <Wilayat3D rows={mapped} color={color} isAr={isAr} unit={t('معاملة', 'transactions')} compress={compress} />
              <p className="text-xs font-bold text-slate-500">{compress ? t('الارتفاع بمقياس الجذر التربيعي لإظهار الولايات الصغيرة؛ الأرقام فوق الأعمدة هي القيم الفعلية.', 'Heights use a square-root scale so small wilayat show; the numbers above the columns are the real values.') : t('ارتفاع العمود يتناسب مع العدد. المواقع تقريبية عند مركز كل ولاية.', 'Column height is proportional to the count. Positions are approximate, at each wilayat’s main town.')}</p>
            </>}
            {view === 'heat' && <Heatmap stats={full} measure={measure} color={color} isAr={isAr} />}
            {view === 'tree' && <Treemaps stats={data} measure={measure} isAr={isAr} />}

            {(view === 'map' || view === '3d') && unmapped.length > 0 && (
              <p className="text-xs font-bold text-slate-500">{t('غير ظاهرة على الخريطة: ', 'Not on the map: ')}{unmapped.map(r => `${r.wilaya} (${fmtNum(r.value, isAr)})`).join(isAr ? '، ' : ', ')}</p>
            )}
          </section>

          {/* The table behind the views */}
          <details className="rounded-3xl bg-white ring-1 ring-slate-200 p-4 md:p-5 group" open={false}>
            <summary className="cursor-pointer font-black text-slate-800 flex items-center gap-2"><Table2 size={17} className="text-[#008E91]" aria-hidden />{t('عرض البيانات كجدول', 'View the data as a table')} <span className="text-xs font-bold text-slate-400">({period})</span></summary>
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm">
                <caption className="sr-only">{t('المعاملات حسب الولاية والمصدر', 'Transactions by wilayat and source')}</caption>
                <thead><tr className="text-xs font-black text-slate-500 border-b">
                  <th scope="col" className="p-2 text-start">{t('الولاية', 'Wilayat')}</th>
                  {SOURCES.map(k => <th key={k} scope="col" className="p-2 text-end"><span className="inline-block size-2 rounded-full me-1.5" style={{ background: SOURCE_COLOR[k] }} aria-hidden />{label(k)}</th>)}
                  <th scope="col" className="p-2 text-end">{t('الإجمالي', 'Total')}</th>
                </tr></thead>
                <tbody>
                  {(data?.byWilaya || []).map(r => (
                    <tr key={r.wilaya} className="border-b border-slate-100">
                      <th scope="row" className="p-2 text-start font-black text-slate-800">{isAr ? r.wilaya : geoOf(r.wilaya)?.en || r.wilaya}</th>
                      {SOURCES.map(k => <td key={k} className="p-2 text-end font-bold text-slate-700 tabular-nums">{fmtNum(r[k], isAr)}</td>)}
                      <td className="p-2 text-end font-black text-slate-900 tabular-nums">{fmtNum(SOURCES.reduce((s, k) => s + r[k], 0), isAr)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      </main>
      <PortalFooter siteConfig={siteConfig} />
    </div>
  );
}

/** Month × year grid, one hue from light to dark. A real table, so it reads without the colours. */
function Heatmap({ stats, measure, color, isAr }: { stats: TransactionStats | null; measure: Measure; color: string; isAr: boolean }) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const [tip, setTip] = useState<string | null>(null);
  if (!stats) return <Placeholder />;
  const cell = new Map<string, number>();
  for (const m of stats.byMonth) cell.set(m.month, measure === 'all' ? SOURCES.reduce((s, k) => s + m[k], 0) : m[measure]);
  const max = Math.max(1, ...cell.values());
  const months = isAr ? MONTHS_AR : MONTHS_EN;
  const last = stats.asOf.slice(0, 7);
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-separate border-spacing-[2px] text-xs">
          <caption className="sr-only">{t('عدد المعاملات لكل شهر', 'Transactions per month')}</caption>
          <thead><tr>
            <th scope="col" className="w-14 p-1 text-start font-black text-slate-500">{t('السنة', 'Year')}</th>
            {months.map(m => <th key={m} scope="col" className="p-1 font-bold text-slate-500">{m}</th>)}
            <th scope="col" className="p-1 text-end font-black text-slate-500">{t('المجموع', 'Total')}</th>
          </tr></thead>
          <tbody>
            {YEARS.map(y => {
              let sum = 0;
              return (
                <tr key={y}>
                  <th scope="row" className="p-1 text-start font-black text-slate-700">{y}</th>
                  {months.map((m, i) => {
                    const key = `${y}-${String(i + 1).padStart(2, '0')}`;
                    const future = key > last;
                    const v = cell.get(key) ?? 0; sum += v;
                    const k = v / max, shade = 0.08 + 0.92 * Math.pow(k, 0.75);
                    const text = `${m} ${y}: ${fmtNum(v, isAr)}`;
                    return (
                      <td key={key} tabIndex={future ? -1 : 0} onMouseEnter={() => setTip(text)} onFocus={() => setTip(text)} onMouseLeave={() => setTip(null)} onBlur={() => setTip(null)}
                        className={cn('h-10 rounded-md text-center font-bold tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-slate-900', future ? 'bg-slate-50 text-slate-300' : lightTint(color, shade) ? 'text-slate-900' : 'text-white')}
                        style={future ? undefined : { background: tint(color, shade) }}>
                        {future ? '·' : v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
                      </td>
                    );
                  })}
                  <td className="p-1 text-end font-black text-slate-900 tabular-nums">{fmtNum(sum, isAr)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-slate-500">
        <div className="flex items-center gap-2" dir="ltr">
          <span>0</span>
          <span className="h-3 w-40 rounded-full" style={{ background: `linear-gradient(to right, ${tint(color, 0.08)}, ${color})` }} aria-hidden />
          <span>{fmtNum(max, isAr)}</span>
        </div>
        <p role="status" className="font-black text-slate-800 min-h-[1rem]">{tip || t('مرّر على شهر لعرض رقمه كاملاً', 'Hover a month for its full figure')}</p>
      </div>
      {measure !== 'rent' && measure !== 'buildings' && measure !== 'dig' && (
        <p className="text-xs font-bold text-slate-500">{t('ملاحظة: بيانات التراخيص البلدية في المصدر تنتهي عند يونيو 2026.', 'Note: the municipal licences feed currently ends in June 2026 at the source.')}</p>
      )}
    </div>
  );
}

interface Rect { x: number; y: number; w: number; h: number; key: string; n: number }
/** Slice-and-dice treemap that alternates direction, largest first (areas proportional to values) */
function layout(items: { key: string; n: number }[], x: number, y: number, w: number, h: number): Rect[] {
  if (!items.length) return [];
  if (items.length === 1) return [{ x, y, w, h, ...items[0] }];
  const total = items.reduce((s, i) => s + i.n, 0);
  // Split into two groups of roughly equal weight, then recurse along the longer side
  let acc = 0, cut = 0;
  for (let i = 0; i < items.length - 1; i++) { acc += items[i].n; cut = i + 1; if (acc >= total / 2) break; }
  const a = items.slice(0, cut), b = items.slice(cut), share = a.reduce((s, i) => s + i.n, 0) / total;
  return w >= h
    ? [...layout(a, x, y, w * share, h), ...layout(b, x + w * share, y, w * (1 - share), h)]
    : [...layout(a, x, y, w, h * share), ...layout(b, x, y + h * share, w, h * (1 - share))];
}

function Treemaps({ stats, measure, isAr }: { stats: TransactionStats | null; measure: Measure; isAr: boolean }) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  if (!stats) return <Placeholder />;
  const all: { id: Source; title: string; items: { key: string; n: number }[] }[] = [
    { id: 'licences', title: t('التراخيص البلدية حسب النشاط', 'Municipal licences by activity'), items: stats.licencesByActivity },
    { id: 'rent', title: t('عقود الإيجار حسب الاستخدام', 'Rent contracts by use'), items: stats.rentByUse },
    { id: 'buildings', title: t('تراخيص البناء حسب نوع المبنى', 'Building permits by building type'), items: stats.buildingsByType },
    { id: 'dig', title: t('تراخيص الحفر حسب المشروع', 'Excavation permits by project'), items: stats.digByProject },
  ];
  const shown = all.filter(x => (measure === 'all' || x.id === measure) && x.items.length);
  if (!shown.length) return <p className="py-10 text-center font-bold text-slate-400">{t('لا توجد بيانات لهذه الفترة', 'No data for this period')}</p>;
  return (
    <div className={cn('grid gap-4', shown.length > 1 && 'lg:grid-cols-2')}>
      {shown.map(set => {
        const items = [...set.items].filter(i => i.n > 0).sort((a, b) => b.n - a.n);
        const sum = items.reduce((s, i) => s + i.n, 0);
        const rects = layout(items, 0, 0, 100, 100);
        return (
          <figure key={set.id} className="space-y-2">
            <figcaption className="text-sm font-black text-slate-800 flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ background: SOURCE_COLOR[set.id] }} aria-hidden />{set.title}</figcaption>
            <div dir="ltr" className={cn('relative w-full rounded-2xl overflow-hidden', shown.length > 1 ? 'h-72' : 'h-[26rem]')}>
              {rects.map((r, i) => {
                const share = r.n / sum;
                const big = r.w > 16 && r.h > 16;
                return (
                  <div key={r.key} title={`${r.key}: ${fmtNum(r.n, isAr)} (${Math.round(share * 100)}%)`}
                    className="absolute p-[1px]" style={{ left: `${r.x}%`, top: `${r.y}%`, width: `${r.w}%`, height: `${r.h}%` }}>
                    <div dir={isAr ? 'rtl' : 'ltr'} className="w-full h-full rounded-lg p-2 overflow-hidden flex flex-col justify-between" style={{ background: tint(SOURCE_COLOR[set.id], 0.5 - 0.36 * (i / Math.max(1, rects.length - 1))) }}>
                      {r.w > 9 && r.h > 12 && <span className={cn('font-black text-slate-900 leading-tight', big ? 'text-sm line-clamp-3' : 'text-[11px] line-clamp-2')}>{r.key}</span>}
                      {r.w > 9 && r.h > 22 && <span className="font-bold text-slate-800 text-xs tabular-nums">{fmtNum(r.n, isAr)} · {Math.round(share * 100)}%</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            <details className="text-xs">
              <summary className="cursor-pointer font-bold text-slate-500">{t('القيم كقائمة', 'Values as a list')}</summary>
              <ol className="mt-2 space-y-1">
                {items.map(i => <li key={i.key} className="flex justify-between gap-4 font-bold text-slate-700"><span>{i.key}</span><span className="tabular-nums">{fmtNum(i.n, isAr)}</span></li>)}
              </ol>
            </details>
          </figure>
        );
      })}
      <p className="lg:col-span-2 text-xs font-bold text-slate-500">{t('مساحة كل مستطيل تتناسب مع العدد، وتُعرض أعلى الفئات في كل مجموعة بيانات.', 'Each rectangle’s area is proportional to its count; the top categories of each dataset are shown.')}</p>
    </div>
  );
}
