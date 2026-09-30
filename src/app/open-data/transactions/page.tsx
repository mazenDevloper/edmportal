'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ExternalLink, Filter, Loader2, MapPin, RotateCcw, TrendingDown, TrendingUp, WifiOff } from 'lucide-react';
import { fetchBin } from '@/lib/jsonbin';
import { MenuItem, SiteConfig } from '@/lib/types';
import { useSettingsStore } from '@/lib/settings-store';
import { ODM_SOURCES } from '@/lib/open-data/official-figures';
import { Count, SOURCES, SourceKey, TransactionStats } from '@/lib/open-data/transactions-stats';
import { BUILDING_COLOR, DIG_COLOR, LICENCE_COLOR, RENT_COLOR, SOURCE_COLOR, TransactionFigures, fmtNum, useTransactionStats } from '@/components/open-data/transaction-figures';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

const TODAY = new Date(Date.now() + 4 * 3600e3).toISOString().slice(0, 10);
/** Last complete day: the default end of every period, so the figures are complete */
const YESTERDAY = new Date(Date.now() + 4 * 3600e3 - 86_400_000).toISOString().slice(0, 10);
const YEAR = YESTERDAY.slice(0, 4);

const PRESETS = [
  { id: 'q1', ar: `الربع الأول ${YEAR}`, en: `Q1 ${YEAR}`, from: `${YEAR}-01-01`, to: `${YEAR}-03-31` },
  { id: 'q2', ar: `الربع الثاني ${YEAR}`, en: `Q2 ${YEAR}`, from: `${YEAR}-04-01`, to: `${YEAR}-06-30` },
  { id: 'q3', ar: `الربع الثالث ${YEAR}`, en: `Q3 ${YEAR}`, from: `${YEAR}-07-01`, to: `${YEAR}-09-30` },
  { id: 'q4', ar: `الربع الرابع ${YEAR}`, en: `Q4 ${YEAR}`, from: `${YEAR}-10-01`, to: `${YEAR}-12-31` },
  { id: 'year', ar: `كامل عام ${YEAR}`, en: `All of ${YEAR}`, from: `${YEAR}-01-01`, to: `${YEAR}-12-31` },
  { id: 'all', ar: 'منذ 2020', en: 'Since 2020', from: '2020-01-01', to: YESTERDAY },
];

const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function TransactionsDashboard() {
  const isAr = useSettingsStore(s => s.language) === 'ar';
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [tab, setTab] = useState('summary');

  useEffect(() => {
    // ?tab=analysis opens the analysis directly (used by the home page's "التحليل التفصيلي" link)
    if (new URLSearchParams(window.location.search).get('tab') === 'analysis') setTab('analysis');
    fetchBin().then(db => { setMenuItems(db.menuItems || []); setSiteConfig(db.siteConfig || null); }).catch(() => {});
  }, []);
  useEffect(() => { document.title = `${t('المعاملات المخزنة إلكترونياً', 'Transactions stored electronically')} | ${t('بلدية ظفار', 'Dhofar Municipality')}`; }, [isAr]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex flex-col bg-slate-100" dir={isAr ? 'rtl' : 'ltr'} lang={isAr ? 'ar' : 'en'}>
      <PortalHeader menuItems={menuItems} variant="compact" />
      <main id="main" className="flex-1">
        <div className="max-w-7xl mx-auto px-4 md:px-6 pt-10 text-center space-y-3">
          <p className="text-xs font-black tracking-widest text-[#008E91]">{t('بوابة البيانات المفتوحة · محافظة ظفار', 'Open data · Dhofar Governorate')}</p>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900">{t('المعاملات المخزنة إلكترونياً', 'Transactions stored electronically')}</h1>
          <p className="font-bold text-slate-500">{t('من 2020 حتى اليوم، مع تحليل تفاعلي حسب الفترة والولاية', 'Since 2020, with interactive analysis by period and wilayat')}</p>
          <ul className="flex flex-wrap justify-center gap-2 text-xs font-bold">
            {([['rent', t('عقود الإيجار', 'Rent contracts')], ['municipalLicences', t('تراخيص البلدية', 'Municipal licences')], ['buildingPermits', t('تراخيص البناء', 'Building permits')], ['dig', t('تراخيص الحفر', 'Excavation permits')]] as const).map(([k, label]) => (
              <li key={k}><a href={ODM_SOURCES[k]} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 ring-1 ring-slate-200 text-slate-700 hover:ring-[#008E91]">{label}<ExternalLink size={11} aria-hidden /><span className="sr-only">{t(' (يفتح في نافذة جديدة)', ' (opens in a new tab)')}</span></a></li>
            ))}
          </ul>
        </div>

        <Tabs value={tab} onValueChange={setTab} dir={isAr ? 'rtl' : 'ltr'} className="mt-6">
          <div className="flex justify-center px-4">
            <TabsList className="h-auto rounded-2xl bg-white ring-1 ring-slate-200 p-1.5 gap-1">
              <TabsTrigger value="summary" className="rounded-xl px-4 py-2.5 font-black data-[state=active]:bg-slate-900 data-[state=active]:text-white">{t('المؤشرات العامة', 'Headline figures')}</TabsTrigger>
              <TabsTrigger value="analysis" className="rounded-xl px-4 py-2.5 font-black data-[state=active]:bg-slate-900 data-[state=active]:text-white">{t('تحليل الفترات والولايات', 'By period & wilayat')}</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="summary"><TransactionFigures isAr={isAr} stats={siteConfig?.stats} compactHeader /></TabsContent>
          <TabsContent value="analysis"><Analysis isAr={isAr} /></TabsContent>
        </Tabs>
      </main>
      <PortalFooter siteConfig={siteConfig} />
    </div>
  );
}

function Analysis({ isAr }: { isAr: boolean }) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const [range, setRange] = useState({ from: PRESETS[0].from, to: PRESETS[0].to, preset: 'q1' as string | null });
  // Off by default: periods end yesterday (complete days). On: today's partial data is included too.
  const [includeToday, setIncludeToday] = useState(false);
  const bound = includeToday ? TODAY : YESTERDAY;
  const [draft, setDraft] = useState({ from: range.from, to: range.to });
  const [wilaya, setWilaya] = useState<string | null>(null);
  const query = useMemo(() => `?from=${range.from}&to=${range.to > bound ? bound : range.to}${wilaya ? `&wilaya=${encodeURIComponent(wilaya)}` : ''}${includeToday ? '&includeToday=1' : ''}`, [range, wilaya, includeToday, bound]);
  const { data, state } = useTransactionStats(query);

  const applyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (draft.from && draft.to && draft.from <= draft.to) setRange({ ...draft, preset: null });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-6">
      {/* Filters: one row above the charts */}
      <div className="rounded-3xl bg-white ring-1 ring-slate-200 p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t('الفترة', 'Period')}>
          <Filter size={16} className="text-slate-400" aria-hidden />
          {PRESETS.map(p => {
            const future = p.from > bound;
            return (
              <button key={p.id} type="button" disabled={future} aria-pressed={range.preset === p.id}
                onClick={() => { const to = p.to > bound ? bound : p.to; setRange({ from: p.from, to, preset: p.id }); setDraft({ from: p.from, to }); }}
                className={cn('h-9 px-3 rounded-lg text-xs font-black transition-colors disabled:opacity-35 disabled:cursor-not-allowed', range.preset === p.id ? 'bg-[#005751] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')}>
                {isAr ? p.ar : p.en}
              </button>
            );
          })}
          <form onSubmit={applyCustom} className="flex flex-wrap items-center gap-2 ms-auto text-xs font-bold">
            <label className="flex items-center gap-1">{t('من', 'From')}<input type="date" min="2020-01-01" max={bound} value={draft.from} onChange={e => setDraft(d => ({ ...d, from: e.target.value }))} className="h-9 rounded-lg border px-2" /></label>
            <label className="flex items-center gap-1">{t('إلى', 'To')}<input type="date" min="2020-01-01" max={bound} value={draft.to} onChange={e => setDraft(d => ({ ...d, to: e.target.value }))} className="h-9 rounded-lg border px-2" /></label>
            <button type="submit" disabled={!draft.from || !draft.to || draft.from > draft.to} className="h-9 px-3 rounded-lg bg-slate-900 text-white font-black disabled:opacity-40">{t('تطبيق', 'Apply')}</button>
          </form>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t pt-3 text-xs font-bold text-slate-600">
          <MapPin size={15} className="text-[#7B3FA8]" aria-hidden />
          <span>{t('الولاية:', 'Wilayat:')}</span>
          <span className="font-black text-slate-900">{wilaya || t('كافة الولايات', 'All wilayat')}</span>
          {wilaya && <button type="button" onClick={() => setWilaya(null)} className="inline-flex items-center gap-1 text-slate-500 underline"><RotateCcw size={12} aria-hidden />{t('إلغاء التصفية', 'Clear')}</button>}
          <label className="ms-auto inline-flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={includeToday} onChange={e => {
              const on = e.target.checked;
              setIncludeToday(on);
              // Presets that end "today/yesterday" follow the switch; a fixed past range is kept
              if (range.preset === 'all' || range.to >= YESTERDAY) setRange(r => ({ ...r, to: on ? TODAY : YESTERDAY }));
            }} className="size-4 accent-[#005751]" />
            {t('تضمين بيانات اليوم (غير مكتملة)', "Include today's data (incomplete)")}
          </label>
          <span className="text-slate-400">{t('من', 'From')} <span dir="ltr">{range.from}</span> {t('إلى', 'to')} <span dir="ltr">{range.to > bound ? bound : range.to}</span></span>
        </div>
      </div>

      {state === 'error' && !data ? (
        <p role="alert" className="flex items-center gap-2 rounded-2xl bg-amber-50 p-4 font-bold text-amber-900"><WifiOff size={18} aria-hidden />{t('تعذّر الاتصال بواجهات البيانات المفتوحة. حاول لاحقاً.', 'The open-data APIs are unreachable. Try again later.')}</p>
      ) : !data ? (
        <p role="status" className="flex items-center justify-center gap-2 py-16 font-bold text-slate-500"><Loader2 className="animate-spin" aria-hidden />{t('جارٍ جلب البيانات… قد يستغرق أول تحميل بضع ثوانٍ.', 'Loading data… the first load can take a few seconds.')}</p>
      ) : (
        <div className={cn('space-y-6 transition-opacity', state === 'loading' && 'opacity-60')} aria-busy={state === 'loading'}>
          <Kpis data={data} isAr={isAr} />
          <div className="grid gap-6 lg:grid-cols-2">
            {SOURCES.map(k => <MonthlyChart key={k} data={data} isAr={isAr} series={k} />)}
          </div>
          <WilayatTable data={data} isAr={isAr} selected={wilaya} onSelect={setWilaya} />
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <Breakdown title={t('التراخيص البلدية حسب النشاط', 'Municipal licences by activity')} items={data.licencesByActivity} color={LICENCE_COLOR} isAr={isAr} />
            <Breakdown title={t('تراخيص البناء حسب نوع المبنى', 'Building permits by building type')} items={data.buildingsByType} color={BUILDING_COLOR} isAr={isAr} />
            <Breakdown title={t('تراخيص البناء حسب نوع الترخيص', 'Building permits by permit type')} items={data.buildingsByService} color={BUILDING_COLOR} isAr={isAr} />
            <Breakdown title={t('عقود الإيجار حسب الاستخدام', 'Rent contracts by use')} items={data.rentByUse} color={RENT_COLOR} isAr={isAr} />
            <Breakdown title={t('عقود الإيجار حسب الحالة', 'Rent contracts by status')} items={data.rentByStatus} color={RENT_COLOR} isAr={isAr} />
            <Breakdown title={t('تراخيص الحفر حسب نوع المشروع', 'Excavation permits by project')} items={data.digByProject} color={DIG_COLOR} isAr={isAr} />
          </div>
          <p className="text-xs font-bold text-slate-500">
            {t('المصدر: واجهات البيانات المفتوحة لبلدية ظفار (ODM2040). عقود الإيجار حسب تاريخ بداية العقد، والتراخيص البلدية حسب تاريخ الإصدار، وتراخيص البناء والحفر حسب تاريخ الطلب. آخر تحديث: ', 'Source: Dhofar Municipality open-data APIs (ODM2040). Rent contracts by start date, municipal licences by issue date, building and excavation permits by application date. Updated: ')}
            {new Date(data.updatedAt).toLocaleString(isAr ? 'ar-OM' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        </div>
      )}
    </div>
  );
}

const SOURCE_LABEL: Record<SourceKey, [string, string]> = {
  rent: ['عقود الإيجار', 'Rent contracts'],
  dig: ['تراخيص الحفر', 'Excavation permits'],
  licences: ['التراخيص البلدية', 'Municipal licences'],
  buildings: ['تراخيص البناء', 'Building permits'],
};

function Kpis({ data, isAr }: { data: TransactionStats; isAr: boolean }) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const m = data.monthOverMonth.month ? Number(data.monthOverMonth.month.slice(5)) - 1 : null;
  const monthName = m !== null ? (isAr ? MONTHS_AR[m] : MONTHS_EN[m]) : '';
  const growth = (v: number | null) => v === null ? null : (
    <span className={cn('inline-flex items-center gap-1 text-xs font-black', v >= 0 ? 'text-emerald-700' : 'text-red-700')}>
      {v >= 0 ? <TrendingUp size={14} aria-hidden /> : <TrendingDown size={14} aria-hidden />}{v > 0 ? '+' : ''}{v.toLocaleString(isAr ? 'ar-OM' : 'en-US')}%
      <span className="font-bold text-slate-400">{monthName && t(`(${monthName} مقارنة بالشهر السابق)`, `(${monthName} vs previous month)`)}</span>
    </span>
  );
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {SOURCES.map(k => (
        <div key={k} className="rounded-2xl bg-white ring-1 ring-slate-200 p-4 space-y-1">
          <p className="flex items-center gap-2 text-xs font-black text-slate-500"><span className="size-2.5 rounded-sm" style={{ background: SOURCE_COLOR[k] }} aria-hidden />{t(`${SOURCE_LABEL[k][0]} في الفترة`, `${SOURCE_LABEL[k][1]} in period`)}</p>
          <p className="text-3xl font-black text-slate-900 tabular-nums">{data.totals[k] === null ? '—' : fmtNum(data.totals[k]!, isAr)}</p>
          {growth(data.monthOverMonth[k])}
        </div>
      ))}
    </div>
  );
}

/** One series per chart: the sources differ by orders of magnitude, so they never share an axis */
function MonthlyChart({ data, isAr, series }: { data: TransactionStats; isAr: boolean; series: SourceKey }) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const color = SOURCE_COLOR[series];
  const title = t(`${SOURCE_LABEL[series][0]} شهرياً`, `${SOURCE_LABEL[series][1]} per month`);
  const label = (m: string) => { const i = Number(m.slice(5)) - 1; return `${isAr ? MONTHS_AR[i] : MONTHS_EN[i]} ${m.slice(2, 4)}`; };
  const rows = data.byMonth.map(m => ({ month: m.month, name: label(m.month), value: m[series] }));
  return (
    <figure className="rounded-3xl bg-white ring-1 ring-slate-200 p-5">
      <figcaption className="font-black text-slate-900 mb-3">{title}</figcaption>
      {rows.length === 0 ? <p className="py-16 text-center font-bold text-slate-400">{t('لا توجد بيانات في هذه الفترة', 'No data in this period')}</p> : (
        <div className="h-60" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap={2}>
              <CartesianGrid vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} interval="preserveStartEnd" reversed={isAr} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} width={48} orientation={isAr ? 'right' : 'left'} tickFormatter={v => Number(v).toLocaleString(isAr ? 'ar-OM' : 'en-US')} />
              <Tooltip cursor={{ fill: 'rgba(15,23,42,0.05)' }} formatter={(v: number) => [fmtNum(v, isAr), title]} labelStyle={{ fontWeight: 800 }} contentStyle={{ borderRadius: 12, direction: isAr ? 'rtl' : 'ltr' }} />
              <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {rows.length > 0 && (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer font-bold text-slate-500">{t('عرض كجدول', 'Show as table')}</summary>
          <table className="mt-2 w-full text-start">
            <thead><tr className="text-slate-500"><th scope="col" className="py-1 text-start">{t('الشهر', 'Month')}</th><th scope="col" className="py-1 text-start">{t('العدد', 'Count')}</th></tr></thead>
            <tbody>{rows.map(r => <tr key={r.month} className="border-t"><td className="py-1">{r.name}</td><td className="py-1 font-black tabular-nums">{fmtNum(r.value, isAr)}</td></tr>)}</tbody>
          </table>
        </details>
      )}
    </figure>
  );
}

/** Wilayat comparison for the period; a row selects that wilayat as the filter */
function WilayatTable({ data, isAr, selected, onSelect }: { data: TransactionStats; isAr: boolean; selected: string | null; onSelect: (w: string | null) => void }) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const max = Object.fromEntries(SOURCES.map(k => [k, Math.max(1, ...data.byWilaya.map(w => w[k]))])) as Record<SourceKey, number>;
  return (
    <section aria-labelledby="wilayat-title" className="rounded-3xl bg-white ring-1 ring-slate-200 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h2 id="wilayat-title" className="font-black text-slate-900">{t('توزيع المعاملات حسب ولايات ظفار', 'Transactions by wilayat')}</h2>
        <p className="text-xs font-bold text-slate-400">{t('اختر ولاية لتصفية باقي الأرقام', 'Pick a wilayat to filter the other figures')}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="text-xs text-slate-500">
              <th scope="col" className="py-2 text-start">{t('الولاية', 'Wilayat')}</th>
              {SOURCES.map(k => (
                <th key={k} scope="col" className="py-2 text-start"><span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: SOURCE_COLOR[k] }} aria-hidden />{isAr ? SOURCE_LABEL[k][0] : SOURCE_LABEL[k][1]}</span></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.byWilaya.map(w => (
              <tr key={w.wilaya} className={cn('border-t', selected === w.wilaya && 'bg-[#7B3FA8]/5')}>
                <th scope="row" className="py-2 pe-3 text-start">
                  <button type="button" aria-pressed={selected === w.wilaya} onClick={() => onSelect(selected === w.wilaya ? null : w.wilaya)} className="font-black text-slate-800 hover:text-[#7B3FA8] underline-offset-4 hover:underline">{w.wilaya}</button>
                </th>
                {SOURCES.map(k => (
                  <td key={k} className="py-2 pe-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 flex-1 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${(w[k] / max[k]) * 100}%`, background: SOURCE_COLOR[k] }} /></div>
                      <span className="w-16 text-end font-black tabular-nums text-slate-700">{fmtNum(w[k], isAr)}</span>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
            {!data.byWilaya.length && <tr><td colSpan={5} className="py-8 text-center font-bold text-slate-400">{t('لا توجد بيانات في هذه الفترة', 'No data in this period')}</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Breakdown({ title, items, color, isAr }: { title: string; items: Count[]; color: string; isAr: boolean }) {
  const total = items.reduce((s, i) => s + i.n, 0);
  const max = Math.max(1, ...items.map(i => i.n));
  return (
    <section className="rounded-3xl bg-white ring-1 ring-slate-200 p-5">
      <h3 className="font-black text-slate-900 mb-3">{title}</h3>
      {items.length === 0 ? <p className="py-6 text-center text-sm font-bold text-slate-400">—</p> : (
        <ul className="space-y-2">
          {items.slice(0, 6).map(i => (
            <li key={i.key} className="text-sm">
              <div className="flex justify-between font-bold text-slate-700"><span>{i.key}</span><span className="tabular-nums">{fmtNum(i.n, isAr)} <span className="text-slate-400">({Math.round((i.n / total) * 100)}%)</span></span></div>
              <div className="mt-1 h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${(i.n / max) * 100}%`, background: color }} /></div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
