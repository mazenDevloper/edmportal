
'use client';

import React, { useState, useEffect } from 'react';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { useSettingsStore } from '@/lib/settings-store';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Lock, Loader2 } from 'lucide-react';
import { fetchBin } from '@/lib/jsonbin';
import { CustomPage } from '@/lib/types';
import dynamic from 'next/dynamic';

const DynamicRenderer = dynamic(() => import('@/app/p/[slug]/page'), {
  loading: () => <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>
});

export default function PrivacyPage() {
  const { language } = useSettingsStore();
  const isAr = language === 'ar';
  const [hasOverride, setHasOverride] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBin().then(data => {
      const found = data.customPages?.some((p: CustomPage) => p.slug === 'privacy');
      setHasOverride(found || false);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  if (hasOverride) {
    return <DynamicRenderer />;
  }

  return (
    <div className={cn("min-h-screen bg-slate-50", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={[]} />
      <main className="max-w-4xl mx-auto px-6 py-24">
        <div className="text-center mb-16 space-y-6">
          <div className="flex justify-center">
            <div className="size-24 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <Lock size={48} />
            </div>
          </div>
          <h1 className="text-5xl font-black text-primary tracking-tighter">{isAr ? 'السياسة والخصوصية' : 'Privacy Policy'}</h1>
          <p className="text-slate-500 font-bold text-xl">{isAr ? 'نحن نحمي خصوصيتك وبياناتك الرقمية' : 'We protect your privacy and digital data'}</p>
        </div>
        <Card className="rounded-brand border-none shadow-2xl bg-white overflow-hidden">
          <CardContent className="p-16 space-y-12">
            <section className="text-center">
              <h2 className="text-2xl font-black text-primary mb-4">{isAr ? 'جمع المعلومات' : 'Information Collection'}</h2>
              <p className="text-slate-700 leading-loose text-lg font-medium">
                {isAr ? 'نقوم بجمع المعلومات اللازمة فقط لتقديم الخدمات البلدية بشكل فعال ودقيق.' : 'We collect only the information necessary to provide municipal services effectively and accurately.'}
              </p>
            </section>
            <section className="text-center">
              <h2 className="text-2xl font-black text-primary mb-4">{isAr ? 'أمن البيانات' : 'Data Security'}</h2>
              <p className="text-slate-700 leading-loose text-lg font-medium">
                {isAr ? 'نستخدم تقنيات تشفير متطورة لحماية بياناتك من الوصول غير المصرح به.' : 'We use advanced encryption technologies to protect your data from unauthorized access.'}
              </p>
            </section>
          </CardContent>
        </Card>
      </main>
      <PortalFooter siteConfig={null} />
    </div>
  );
}
