'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ScanSearch } from 'lucide-react';
import { fetchBin } from '@/lib/jsonbin';
import { MenuItem, SiteConfig } from '@/lib/types';
import { useSettingsStore } from '@/lib/settings-store';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { TrackLookup } from '@/components/citizen/track-lookup';

function TrackPage() {
  const isAr = useSettingsStore(s => s.language) === 'ar';
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const initialRef = useSearchParams().get('ref') || '';
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchBin().then(db => { setMenuItems(db.menuItems || []); setSiteConfig(db.siteConfig || null); }).catch(() => {});
  }, []);
  useEffect(() => { document.title = `${t('الاستعلام عن حالة معاملة', 'Track a request')} | ${t('بلدية ظفار', 'Dhofar Municipality')}`; }, [isAr]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex flex-col bg-slate-50" dir={isAr ? 'rtl' : 'ltr'} lang={isAr ? 'ar' : 'en'}>
      <PortalHeader menuItems={menuItems} variant="compact" />
      <main id="main" className="flex-1 w-full max-w-2xl mx-auto px-4 py-12 space-y-6">
        <div className="space-y-2">
          <span className="size-14 rounded-2xl bg-[#470D67] text-white flex items-center justify-center"><ScanSearch size={28} aria-hidden /></span>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900">{t('الاستعلام عن حالة معاملة', 'Track a request')}</h1>
          <p className="font-bold text-slate-500">{t('أدخل رقم المعاملة الذي وصلك عند تقديم الطلب.', 'Enter the transaction number you received when you applied.')}</p>
        </div>
        <div className="rounded-3xl bg-white ring-1 ring-slate-200 p-6">
          {mounted && <TrackLookup isAr={isAr} initialRef={initialRef} autoSubmit />}
        </div>
      </main>
      <PortalFooter siteConfig={siteConfig} />
    </div>
  );
}

export default function Page() {
  return <Suspense fallback={null}><TrackPage /></Suspense>;
}
