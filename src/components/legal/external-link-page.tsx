'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, ExternalLink, ShieldCheck } from 'lucide-react';
import { InfoPageShell, useLang } from '@/components/legal/info-page';
import { Bi, SITE_LAST_UPDATED } from '@/lib/footer-pages';

/** A footer entry that points to another government website: explains it, then links out */
export function ExternalLinkPage({ url, title, desc, icon, points }: { url: string; title: Bi; desc: Bi; icon: string; points: Bi[] }) {
  const { isAr, t, tt } = useLang();
  const Back = isAr ? ArrowRight : ArrowLeft;
  const host = url.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  return (
    <InfoPageShell title={title} intro={desc} icon={icon} updated={SITE_LAST_UPDATED}>
      <div className="max-w-3xl space-y-6">
        <div className="bg-white rounded-3xl ring-1 ring-slate-200/70 shadow-sm p-6 md:p-8 space-y-5">
          <h2 className="text-xl font-black text-slate-900">{tt('ماذا تجد في هذه المنصة؟', 'What you will find there')}</h2>
          <ul className="space-y-3">
            {points.map(p => (
              <li key={p.ar} className="flex gap-3 text-[17px] leading-loose text-slate-700 font-medium">
                <span aria-hidden className="mt-3 size-2 shrink-0 rounded-full bg-[#03CFCB]" />{t(p)}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-2xl bg-[#005751] text-white font-black hover:bg-[#005751]/90 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-amber-500">
              {tt('زيارة الموقع', 'Visit the website')}<ExternalLink size={17} aria-hidden />
              <span className="sr-only">{tt('(يفتح في نافذة جديدة)', '(opens in a new tab)')}</span>
            </a>
            <span className="font-mono text-sm font-bold text-slate-500" dir="ltr">{host}</span>
          </div>
        </div>
        <p role="note" className="flex gap-3 p-4 rounded-2xl bg-sky-50 border border-sky-200 text-sm font-bold text-sky-900">
          <ShieldCheck size={18} className="shrink-0 mt-0.5" aria-hidden />
          {tt('هذا رابط لموقع حكومي خارجي؛ تخضع خدماته وبياناته لسياسات الجهة المالكة له.', 'This is an external government website; its services and data are governed by the owning body\'s policies.')}
        </p>
        <Link href="/" className="inline-flex items-center gap-2 font-black text-[#005751] hover:underline underline-offset-4"><Back size={16} aria-hidden />{tt('العودة للرئيسية', 'Back to home')}</Link>
      </div>
    </InfoPageShell>
  );
}
