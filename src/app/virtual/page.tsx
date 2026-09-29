'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { fetchBin } from '@/lib/jsonbin';
import { Service } from '@/lib/types';
import { useSettingsStore } from '@/lib/settings-store';
import { isPublicService } from '@/lib/service-visibility';
import { useAdminSession } from '@/lib/admin-session';

// three.js needs the browser
const ServiceSpace = dynamic(() => import('@/components/virtual/service-space').then(m => m.ServiceSpace), { ssr: false });

export default function VirtualServicesPage() {
  const router = useRouter();
  const isAr = useSettingsStore(s => s.language) === 'ar';
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const [services, setServices] = useState<Service[] | null>(null);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    document.title = `${t('فضاء الخدمات', 'Services space')} | ${t('بلدية ظفار', 'Dhofar Municipality')}`;
    fetchBin().then(db => {
      const all: Service[] = db.services || [];
      const pub = all.filter(isPublicService);
      // A signed-in admin previews every service when nothing is published yet, or with ?preview=all
      const admin = useAdminSession.getState().expiresAt > Date.now();
      const showAll = admin && (!pub.length || new URLSearchParams(window.location.search).get('preview') === 'all');
      setPreview(showAll);
      setServices(showAll ? all : pub);
    }).catch(() => setServices([]));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const exit = () => (window.history.length > 1 ? router.back() : router.push('/'));

  if (!services) return <div className="fixed inset-0 bg-[#020d1c] flex items-center justify-center" role="status" aria-label={t('جارٍ التحميل', 'Loading')}><Loader2 className="animate-spin text-white/60" size={36} /></div>;

  if (!services.length) return (
    <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_50%_40%,#0b4f86_0%,#020d1c_100%)] flex items-center justify-center p-6 text-center" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="space-y-4 text-white">
        <h1 className="text-2xl font-black">{t('لا توجد خدمات منشورة حالياً', 'No services are published yet')}</h1>
        <Link href="/" className="inline-block h-11 leading-[2.75rem] px-6 rounded-xl bg-white text-slate-900 font-black">{t('العودة للرئيسية', 'Back to home')}</Link>
      </div>
    </div>
  );

  return <ServiceSpace services={services} isAr={isAr} preview={preview} onExit={exit} />;
}
