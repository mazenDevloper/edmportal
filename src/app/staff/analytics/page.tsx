'use client';

/*
 * Staff tool: the portal's usage counters. For a chosen period it lists how many times each thing was
 * used and by how many people (accessibility tools, each service, each page), and exports the table.
 * Read-only.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Accessibility, Download, FileText, Layers, Loader2, MousePointerClick, Send } from 'lucide-react';
import { useSettingsStore } from '@/lib/settings-store';
import { fetchBin, readAnalytics } from '@/lib/jsonbin';
import type { AnalyticsData } from '@/lib/analytics';
import { StaffShell, useStaffPortal } from '@/components/staff/staff-shell';
import { cn } from '@/lib/utils';

const GROUPS = [
  { id: 'a11y', ar: 'أدوات النفاذ الرقمي', en: 'Accessibility tools', icon: Accessibility },
  { id: 'service', ar: 'فتح صفحة الخدمة', en: 'Service page opened', icon: Layers },
  { id: 'apply', ar: 'بدء طلب الخدمة', en: 'Service application started', icon: Send },
  { id: 'page', ar: 'الصفحات', en: 'Pages', icon: FileText },
  { id: 'other', ar: 'أخرى', en: 'Other', icon: MousePointerClick },
] as const;
const PERIODS = [{ d: 1, ar: 'اليوم', en: 'Today' }, { d: 7, ar: '7 أيام', en: '7 days' }, { d: 30, ar: '30 يوماً', en: '30 days' }, { d: 90, ar: '90 يوماً', en: '90 days' }, { d: 365, ar: 'سنة', en: 'A year' }];

export default function AnalyticsPage() {
  const isAr = useSettingsStore(s => s.language) === 'ar';
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const { user, loading } = useStaffPortal({ requireAuth: true });
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState(false);
  const [days, setDays] = useState(30);

  useEffect(() => { document.title = `${t('مؤشرات الاستخدام', 'Usage indicators')} | ${t('بوابة الموظف', 'Staff portal')}`; }, [isAr]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!user) return;
    readAnalytics().then(setData).catch(() => setFailed(true));
    // Service names, so a service shows by its title instead of its id
    fetchBin().then(db => setNames(Object.fromEntries((db.services || []).map((s: { id: string; title?: string; titleEn?: string }) => [s.id, (isAr ? s.title : s.titleEn || s.title) || s.id])))).catch(() => {});
  }, [user, isAr]);

  const rows = useMemo(() => {
    if (!data) return [];
    const from = new Date(Date.now() - (days - 1) * 86400000).toISOString().slice(0, 10);
    const sum: Record<string, { n: number; u: number }> = {};
    for (const [day, c] of Object.entries(data.days)) {
      if (day < from) continue;
      for (const [k, n] of Object.entries(c.e || {})) (sum[k] ||= { n: 0, u: 0 }).n += n;
      for (const [k, n] of Object.entries(c.u || {})) (sum[k] ||= { n: 0, u: 0 }).u += n;
    }
    return Object.entries(sum).map(([key, v]) => {
      const i = key.indexOf(':'), g = i > 0 ? key.slice(0, i) : 'other', name = i > 0 ? key.slice(i + 1) : key;
      const group = GROUPS.some(x => x.id === g) ? g : 'other';
      return { key, group, name: group === 'service' || group === 'apply' ? names[name] || name : name, ...v };
    }).sort((a, b) => b.n - a.n);
  }, [data, days, names]);

  const exportCsv = () => {
    const head = [t('المجموعة', 'Group'), t('العنصر', 'Item'), t('عدد المرات', 'Times'), t('عدد الأشخاص (يومياً)', 'People (per day)')];
    const lines = rows.map(r => [GROUPS.find(g => g.id === r.group)?.[isAr ? 'ar' : 'en'] ?? r.group, r.name, r.n, r.u]);
    const csv = [head, ...lines].map(l => l.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `portal-usage-${days}d-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(a.href);
  };

  if (loading || !user) return <div className="h-screen flex items-center justify-center" role="status"><Loader2 className="animate-spin text-slate-400" /></div>;
  const num = (n: number) => n.toLocaleString(isAr ? 'ar-OM' : 'en-GB');

  return (
    <StaffShell user={user}>
      <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-900">{t('مؤشرات استخدام البوابة', 'Portal usage indicators')}</h1>
            <p className="mt-1 text-sm font-bold text-slate-500">{t('عدد مرات الاستخدام وعدد الأشخاص لكل أداة وخدمة وصفحة. لا تُسجَّل أي بيانات شخصية.', 'How many times, and by how many people, each tool, service and page was used. No personal data is recorded.')}</p>
          </div>
          <button type="button" onClick={exportCsv} disabled={!rows.length} className="h-11 rounded-full bg-[#470D67] px-5 text-sm font-black text-white disabled:opacity-40 flex items-center gap-2"><Download size={16} />{t('تصدير CSV', 'Export CSV')}</button>
        </div>
        <div role="radiogroup" aria-label={t('الفترة', 'Period')} className="flex flex-wrap gap-2">
          {PERIODS.map(p => (
            <button key={p.d} type="button" role="radio" aria-checked={days === p.d} onClick={() => setDays(p.d)} className={cn('h-10 rounded-full px-4 text-sm font-black', days === p.d ? 'bg-[#005751] text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50')}>{isAr ? p.ar : p.en}</button>
          ))}
        </div>

        {failed && <p role="alert" className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">{t('تعذّر تحميل المؤشرات. حاول مرة أخرى.', 'The indicators could not be loaded. Try again.')}</p>}
        {!data && !failed && <div className="flex justify-center p-10" role="status"><Loader2 className="animate-spin text-slate-400" /></div>}
        {data && !rows.length && <p className="rounded-2xl bg-white p-6 text-center text-sm font-bold text-slate-500 ring-1 ring-slate-200">{t('لا توجد بيانات استخدام في هذه الفترة بعد.', 'No usage has been recorded in this period yet.')}</p>}

        {GROUPS.map(g => {
          const list = rows.filter(r => r.group === g.id);
          if (!list.length) return null;
          const total = list.reduce((a, r) => a + r.n, 0);
          return (
            <section key={g.id} className="overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200">
              <h2 className="flex items-center gap-2 border-b border-slate-100 p-4 text-lg font-black text-slate-900"><g.icon size={20} className="text-[#005751]" aria-hidden />{isAr ? g.ar : g.en}<span className="ms-auto text-sm font-bold text-slate-500">{num(total)} {t('مرة', 'times')}</span></h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr><th scope="col" className="p-3 text-start font-black">{t('العنصر', 'Item')}</th><th scope="col" className="p-3 text-end font-black">{t('عدد المرات', 'Times')}</th><th scope="col" className="p-3 text-end font-black">{t('عدد الأشخاص', 'People')}</th></tr>
                  </thead>
                  <tbody>
                    {list.map(r => (
                      <tr key={r.key} className="border-t border-slate-100">
                        <th scope="row" className="p-3 text-start font-bold text-slate-800" dir="auto">{r.name}</th>
                        <td className="p-3 text-end font-black tabular-nums text-slate-900">{num(r.n)}</td>
                        <td className="p-3 text-end font-bold tabular-nums text-slate-600">{num(r.u)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
        <p className="text-xs font-bold text-slate-400">{t('«عدد الأشخاص» يُحسب مرة واحدة لكل متصفح في اليوم، ثم تُجمع الأيام؛ من يعود في يوم آخر يُحسب مرة أخرى.', '“People” counts each browser once a day and then adds the days up; someone who returns on another day is counted again.')}</p>
      </div>
    </StaffShell>
  );
}
