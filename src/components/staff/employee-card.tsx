'use client';

import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import { Camera, Loader2, Mail, Phone, Building2, RotateCw, Trash2 } from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import { fileToDataUrl } from '@/lib/image-data-url';
import type { StaffUser } from '@/lib/types';
import { cn } from '@/lib/utils';

/**
 * The employee ID card as a widget (front: logos, photo, names and titles, ID number;
 * back: department, contacts and a QR of the employee number). The owner can change the photo.
 */
export function EmployeeCard({ user, isAr, onPhoto }: { user: StaffUser; isAr: boolean; onPhoto?: (url: string | undefined) => Promise<void> }) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const [back, setBack] = useState(false);
  const [busy, setBusy] = useState(false);
  const initials = (user.nameEn || user.nameAr).split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f || !onPhoto) return;
    setBusy(true);
    try { await onPhoto(await fileToDataUrl(f, 360, 0.8)); } finally { setBusy(false); }
  };

  const face = 'absolute inset-0 rounded-[1.75rem] bg-white shadow-xl ring-1 ring-slate-200 overflow-hidden [backface-visibility:hidden]';
  return (
    <div className="space-y-3">
      <div className="[perspective:1400px] mx-auto w-full max-w-[300px]">
        <div className={cn('relative aspect-[0.64] motion-safe:transition-transform motion-safe:duration-700 [transform-style:preserve-3d]', back && '[transform:rotateY(180deg)]')}>
          {/* Front */}
          <section className={face} aria-label={t('بطاقة الموظف', 'Employee card')} aria-hidden={back}>
            <div aria-hidden className="absolute -top-10 -end-16 size-64 rounded-full bg-[#03CFCB]/[0.06]" />
            <div aria-hidden className="absolute -bottom-20 -start-16 size-72 rounded-full bg-[#470D67]/[0.04]" />
            <div className="relative h-full flex flex-col items-center px-5 pt-5 pb-4 text-center">
              <div className="w-full flex items-center justify-between gap-2" dir="rtl">
                <BrandLogo height={40} />
                <span className="text-[11px] font-black text-slate-500 leading-tight">{t('محافظة', 'Dhofar')}<br />{t('ظفار', 'Governorate')}</span>
              </div>
              <div className="relative mt-4 w-[46%] aspect-[3/4] rounded-md overflow-hidden bg-slate-100 ring-1 ring-slate-200 group">
                {user.photoUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={user.photoUrl} alt={t(`صورة ${user.nameAr}`, `Photo of ${user.nameEn || user.nameAr}`)} className="w-full h-full object-cover" />
                  : <span className="w-full h-full flex items-center justify-center text-3xl font-black text-[#005751]/40" aria-hidden>{initials}</span>}
                {onPhoto && (
                  <label className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 focus-within:bg-black/40 cursor-pointer transition-colors">
                    <span className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 text-white text-[11px] font-black flex flex-col items-center gap-1">
                      {busy ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}{t('تغيير الصورة', 'Change photo')}
                    </span>
                    <input type="file" accept="image/*" onChange={pick} className="sr-only" aria-label={t('تغيير صورة البطاقة', 'Change card photo')} />
                  </label>
                )}
              </div>
              <div className="mt-4 space-y-0.5" dir="rtl">
                <p className="font-black text-slate-800 text-[15px] leading-snug">{user.nameAr}</p>
                {user.jobTitle && <p className="font-bold text-slate-600 text-[13px]">{user.jobTitle}</p>}
              </div>
              <div className="mt-2 space-y-0.5 font-serif" dir="ltr">
                {user.nameEn && <p className="text-slate-700 text-[13px] leading-snug">{user.nameEn}</p>}
                {user.jobTitleEn && <p className="text-slate-600 text-[12px]">{user.jobTitleEn}</p>}
              </div>
              <p className="mt-auto font-serif font-bold text-[#C8102E] text-2xl tracking-tight" dir="ltr">ID No.{user.employeeNumber}</p>
            </div>
          </section>

          {/* Back */}
          <section className={cn(face, '[transform:rotateY(180deg)] bg-gradient-to-br from-[#0f9e9b] to-[#005751] text-white ring-0')} aria-label={t('خلف البطاقة', 'Card back')} aria-hidden={!back}>
            <div className="h-full flex flex-col items-center justify-between p-6 text-center">
              <BrandLogo height={36} onDark />
              <div className="bg-white p-3 rounded-2xl"><QRCode value={`DM-EMP:${user.employeeNumber}`} size={116} fgColor="#005751" /></div>
              <ul className="w-full space-y-2 text-[12px] font-bold text-white/90 text-start">
                {user.department && <li className="flex items-center gap-2"><Building2 size={14} className="shrink-0" aria-hidden />{user.department}</li>}
                {user.email && <li className="flex items-center gap-2"><Mail size={14} className="shrink-0" aria-hidden /><span dir="ltr" className="truncate">{user.email}</span></li>}
                {user.phone && <li className="flex items-center gap-2"><Phone size={14} className="shrink-0" aria-hidden /><span dir="ltr">{user.phone}</span></li>}
              </ul>
              <p className="text-[10px] font-bold text-white/60">{t('بطاقة رقمية للاستخدام داخل بوابة الموظف', 'Digital card for use within the staff portal')}</p>
            </div>
          </section>
        </div>
      </div>
      <div className="flex justify-center gap-2">
        <button type="button" onClick={() => setBack(b => !b)} className="h-8 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-black text-slate-600 inline-flex items-center gap-1.5">
          <RotateCw size={13} aria-hidden />{back ? t('الوجه الأمامي', 'Front') : t('قلب البطاقة', 'Flip card')}
        </button>
        {onPhoto && user.photoUrl && !back && (
          <button type="button" onClick={() => onPhoto(undefined)} className="h-8 px-3 rounded-lg text-xs font-black text-red-500 hover:bg-red-50 inline-flex items-center gap-1.5"><Trash2 size={13} aria-hidden />{t('إزالة الصورة', 'Remove photo')}</button>
        )}
      </div>
    </div>
  );
}
