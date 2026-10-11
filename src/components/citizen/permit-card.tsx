'use client';

import React from 'react';
import QRCode from 'react-qr-code';
import { FileBadge, FlaskConical, HardHat, House, Store } from 'lucide-react';
import { IssuedDocument } from '@/lib/citizen-account';
import { cn } from '@/lib/utils';

const ICON = { home: House, flask: FlaskConical, store: Store, 'hard-hat': HardHat, file: FileBadge } as const;
const TONE = {
  aqua: { band: 'bg-[#03CFCB]', text: 'text-[#470D67]', logo: '' },
  teal: { band: 'bg-[#005751]', text: 'text-white', logo: 'brightness-0 invert' },
  purple: { band: 'bg-[#470D67]', text: 'text-white', logo: 'brightness-0 invert' },
} as const;

/** A permit, licence or certificate as a wallet card: brand band, holder, dates and a QR code to verify it */
export function PermitCard({ doc, holder, isAr }: { doc: IssuedDocument; holder: string; isAr: boolean }) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const Icon = ICON[doc.icon], tone = TONE[doc.tone];
  const date = (iso?: string) => (iso ? new Date(iso).toLocaleDateString(isAr ? 'ar-OM' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : t('بلا انتهاء', 'No expiry'));
  const verifyUrl = `${typeof window === 'undefined' ? '' : window.location.origin}/track?ref=${encodeURIComponent(doc.id)}`;
  return (
    <article className="overflow-hidden rounded-[2rem] bg-white shadow-[0_18px_50px_rgba(71,13,103,0.12)] ring-1 ring-slate-100">
      <div className={cn('relative h-28 px-6 pt-5', tone.band)}>
        <div aria-hidden className="absolute inset-0 dm-pattern-wave-pro opacity-25" />
        <div className="relative flex items-start justify-between gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/dhofar-municipality-logo.png" alt={t('بلدية ظفار', 'Dhofar Municipality')} className={cn('h-10 w-auto', tone.logo)} />
          <p className={cn('text-sm font-black', tone.text)}>{isAr ? doc.categoryAr : doc.categoryEn}</p>
        </div>
      </div>
      <div className="relative px-6 pb-5">
        <span className="-mt-8 mb-3 flex size-16 items-center justify-center rounded-t-[1.6rem] rounded-b-xl bg-white text-slate-600 shadow-md ring-1 ring-slate-100"><Icon size={26} aria-hidden /></span>
        <h3 className="text-xl font-black text-[#470D67]">{isAr ? doc.ar : doc.en}</h3>
        <p className="font-medium text-slate-500">{holder}</p>
      </div>
      <div className="flex items-end gap-4 border-t-2 border-dashed border-slate-200 px-6 py-5">
        <dl className="grid flex-1 grid-cols-2 gap-3 text-sm">
          <div><dt className="font-bold text-slate-500">{t('تاريخ الإصدار', 'Issued')}</dt><dd className="font-bold text-slate-900">{date(doc.issued)}</dd></div>
          <div><dt className="font-bold text-slate-500">{t('صالح حتى', 'Valid until')}</dt><dd className="font-bold text-slate-900">{date(doc.validUntil)}</dd></div>
          <div className="col-span-2 text-xs font-bold text-slate-400" dir="ltr">{doc.id}</div>
        </dl>
        <div className="shrink-0 rounded-lg bg-white p-1" title={t('امسح للتحقق', 'Scan to verify')}>
          <QRCode value={verifyUrl} size={76} fgColor="#2a0640" aria-label={t('رمز التحقق من الوثيقة', 'Verification code')} />
        </div>
      </div>
    </article>
  );
}
