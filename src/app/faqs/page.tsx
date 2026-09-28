'use client';

import React, { useMemo, useState } from 'react';
import * as Icons from 'lucide-react';
import { ChevronDown, HelpCircle, Search, X } from 'lucide-react';
import { ContactChips, InfoPageShell, useLang } from '@/components/legal/info-page';
import { CONTACT, FAQS, FAQ_CATEGORIES, FaqCategory, SITE_LAST_UPDATED } from '@/lib/footer-pages';
import { cn } from '@/lib/utils';

export default function FAQsPage() {
  const { isAr, t, tt } = useLang();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<FaqCategory | 'all'>('all');

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return FAQS.filter(f => (cat === 'all' || f.category === cat) &&
      (!s || [f.q.ar, f.q.en, f.a.ar, f.a.en].some(x => x.toLowerCase().includes(s))));
  }, [q, cat]);

  const count = (c: FaqCategory | 'all') => (c === 'all' ? FAQS.length : FAQS.filter(f => f.category === c).length);

  return (
    <InfoPageShell icon="HelpCircle" updated={SITE_LAST_UPDATED}
      title={{ ar: 'الأسئلة الشائعة', en: 'Frequently Asked Questions' }}
      intro={{ ar: 'إجابات سريعة عن أكثر الأسئلة تكراراً حول البوابة وخدماتها.', en: 'Quick answers to the most common questions about the portal and its services.' }}>
      <div className="space-y-6">
        <div className="bg-white rounded-3xl ring-1 ring-slate-200/70 shadow-sm p-5 space-y-4">
          <div className="relative">
            <Search size={18} className="absolute start-4 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
            <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder={tt('ابحث في الأسئلة…', 'Search questions…')} aria-label={tt('ابحث في الأسئلة', 'Search questions')}
              className="w-full h-13 py-3.5 rounded-2xl border-2 border-slate-200 ps-11 pe-11 text-lg font-bold focus:border-[#008E91] focus:outline-none" />
            {q && <button type="button" onClick={() => setQ('')} className="absolute end-3 top-1/2 -translate-y-1/2 size-8 rounded-lg hover:bg-slate-100 flex items-center justify-center" aria-label={tt('مسح البحث', 'Clear search')}><X size={16} /></button>}
          </div>
          <div role="tablist" aria-label={tt('تصنيف الأسئلة', 'Question category')} className="flex flex-wrap gap-2">
            {[{ id: 'all' as const, ar: 'الكل', en: 'All', icon: 'LayoutGrid' }, ...FAQ_CATEGORIES].map(c => {
              const I = (Icons as any)[c.icon] || HelpCircle;
              return (
                <button key={c.id} type="button" role="tab" aria-selected={cat === c.id} onClick={() => setCat(c.id)}
                  className={cn('flex items-center gap-2 h-10 px-4 rounded-full text-sm font-black transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#008E91]',
                    cat === c.id ? 'bg-[#005751] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>
                  <I size={15} aria-hidden />{isAr ? c.ar : c.en}
                  <span className={cn('text-[11px] px-1.5 rounded-full tabular-nums', cat === c.id ? 'bg-white/20' : 'bg-white')}>{count(c.id)}</span>
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-sm font-bold text-slate-500" aria-live="polite">{tt(`${list.length} سؤال`, `${list.length} questions`)}</p>

        <div className="space-y-3">
          {list.map((f, i) => (
            <details key={f.q.ar} className="group bg-white rounded-2xl ring-1 ring-slate-200/70 shadow-sm open:ring-[#008E91]/40 open:shadow-md transition-shadow" open={i === 0 && !q && cat === 'all'}>
              <summary className="flex items-center gap-4 p-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#008E91]">
                <span aria-hidden className="size-9 shrink-0 rounded-xl bg-[#03CFCB]/15 text-[#005751] flex items-center justify-center"><HelpCircle size={18} /></span>
                <span className="flex-1 text-[17px] font-black text-slate-900 leading-snug">{t(f.q)}</span>
                <ChevronDown size={20} className="shrink-0 text-slate-400 transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <div className="px-5 pb-5 ps-[4.25rem] text-[16px] leading-loose text-slate-700 font-medium">{t(f.a)}</div>
            </details>
          ))}
          {!list.length && <p className="p-10 text-center bg-white rounded-2xl font-bold text-slate-400">{tt('لا توجد أسئلة مطابقة لبحثك.', 'No questions match your search.')}</p>}
        </div>

        <section aria-labelledby="more-help" className="rounded-3xl bg-gradient-to-br from-[#470D67] to-[#2a0640] text-white p-6 md:p-8 space-y-4">
          <h2 id="more-help" className="text-xl font-black">{tt('لم تجد إجابة سؤالك؟', "Didn't find your answer?")}</h2>
          <p className="text-white/80 font-medium">{tt('فريق الدعم جاهز لمساعدتك عبر القنوات التالية:', 'Our support team is ready to help through:')}</p>
          <ContactChips items={[
            { kind: 'phone', value: CONTACT.callCenter, label: { ar: 'مركز الاتصال', en: 'Call centre' } },
            { kind: 'whatsapp', value: CONTACT.whatsapp, label: { ar: 'واتساب', en: 'WhatsApp' } },
            { kind: 'email', value: CONTACT.infoEmail, label: { ar: 'البريد الإلكتروني', en: 'Email' } },
          ]} />
        </section>
      </div>
    </InfoPageShell>
  );
}
