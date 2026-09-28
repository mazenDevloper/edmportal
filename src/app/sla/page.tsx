'use client';

import React, { useMemo, useState } from 'react';
import { CheckCircle2, Clock, Headset, Search, X } from 'lucide-react';
import { InfoPageShell, LegalDocBody, useLang } from '@/components/legal/info-page';
import { SLA_DOC, SLA_SERVICES } from '@/lib/footer-pages';

export default function SLAPage() {
  const { isAr, tt } = useLang();
  const [q, setQ] = useState('');
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return SLA_SERVICES.filter(r => !s || r.nameAr.includes(q.trim()) || r.nameEn.toLowerCase().includes(s));
  }, [q]);
  const toc = [...SLA_DOC.sections.map(s => ({ id: s.id, title: s.title })), { id: 'services', title: { ar: 'قائمة الخدمات الإلكترونية', en: 'E-services list' } }];

  return (
    <InfoPageShell title={SLA_DOC.title} intro={SLA_DOC.intro} icon={SLA_DOC.icon} updated={SLA_DOC.updated} toc={toc}>
      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        {[
          { icon: CheckCircle2, v: '24/7', l: tt('توفر الخدمات', 'Service availability') },
          { icon: Clock, v: String(SLA_SERVICES.length), l: tt('خدمة بمدة إنجاز محددة', 'services with set times') },
          { icon: Headset, v: '1771', l: tt('مركز الاتصال', 'Call centre') },
        ].map(k => (
          <div key={k.l} className="flex items-center gap-3 p-4 rounded-2xl bg-white ring-1 ring-slate-200/70">
            <span className="size-11 rounded-xl bg-[#03CFCB]/15 text-[#005751] flex items-center justify-center"><k.icon size={20} aria-hidden /></span>
            <span><span className="block text-2xl font-black text-slate-900 tabular-nums" dir="ltr">{k.v}</span><span className="block text-xs font-bold text-slate-500">{k.l}</span></span>
          </div>
        ))}
      </div>

      <LegalDocBody doc={SLA_DOC} />

      <section id="services" aria-labelledby="services-h" className="scroll-mt-28 mt-6 bg-white rounded-3xl ring-1 ring-slate-200/70 shadow-sm p-6 md:p-8 space-y-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="services-h" className="text-xl md:text-2xl font-black text-slate-900">{tt('قائمة الخدمات الإلكترونية', 'E-services list')}</h2>
          <div className="relative">
            <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
            <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder={tt('ابحث عن خدمة…', 'Search services…')} aria-label={tt('بحث في الخدمات', 'Search services')}
              className="h-11 w-72 max-w-full rounded-xl border-2 border-slate-200 ps-9 pe-9 font-bold focus:border-[#008E91] focus:outline-none" />
            {q && <button type="button" onClick={() => setQ('')} className="absolute end-2 top-1/2 -translate-y-1/2 size-7 rounded-lg hover:bg-slate-100 flex items-center justify-center" aria-label={tt('مسح', 'Clear')}><X size={14} /></button>}
          </div>
        </div>
        <p className="text-sm font-bold text-slate-500" aria-live="polite">{tt(`${rows.length} خدمة`, `${rows.length} services`)} · {tt('جميع الخدمات متوفرة 24/7 مع دعم فني عبر القنوات الرقمية.', 'All services are available 24/7 with technical support through digital channels.')}</p>
        <div className="overflow-x-auto rounded-2xl ring-1 ring-slate-200">
          <table className="w-full text-sm">
            <caption className="sr-only">{tt('مدد إنجاز الخدمات الإلكترونية', 'E-service completion times')}</caption>
            <thead className="bg-[#005751] text-white">
              <tr>
                <th scope="col" className="p-3 text-start w-12">#</th>
                <th scope="col" className="p-3 text-start">{tt('اسم الخدمة', 'Service')}</th>
                <th scope="col" className="p-3 text-start whitespace-nowrap">{tt('مدة الإنجاز', 'Completion time')}</th>
                <th scope="col" className="p-3 text-start whitespace-nowrap">{tt('توفر الخدمة', 'Availability')}</th>
                <th scope="col" className="p-3 text-start whitespace-nowrap">{tt('آلية الدعم', 'Support')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r, i) => (
                <tr key={r.nameAr} className="odd:bg-white even:bg-slate-50/70 hover:bg-[#03CFCB]/5">
                  <td className="p-3 font-black text-slate-400 tabular-nums">{SLA_SERVICES.indexOf(r) + 1}</td>
                  <td className="p-3 font-bold text-slate-800">{isAr ? r.nameAr : r.nameEn}</td>
                  <td className="p-3 whitespace-nowrap"><span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#03CFCB]/15 text-[#005751] font-black text-xs"><Clock size={12} aria-hidden />{isAr ? r.durationAr : r.durationEn}</span></td>
                  <td className="p-3 whitespace-nowrap"><span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-black text-xs">{tt('متوفرة 24/7', 'Available 24/7')}</span></td>
                  <td className="p-3 text-slate-600 font-medium">{tt('دعم فني عبر القنوات الرقمية', 'Digital-channel support')}</td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={5} className="p-8 text-center font-bold text-slate-400">{tt('لا توجد خدمة مطابقة', 'No matching service')}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </InfoPageShell>
  );
}
