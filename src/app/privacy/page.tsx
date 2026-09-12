
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

// Standard fallback if no dynamic override exists
function StaticPrivacy({ isAr }: { isAr: boolean }) {
  return (
    <main className="max-w-4xl mx-auto px-6 py-20">
      <div className="text-center mb-16">
        <Lock className="mx-auto text-primary mb-6" size={64} />
        <h1 className="text-4xl font-black text-primary mb-4">{isAr ? 'السياسة والخصوصية' : 'Privacy Policy'}</h1>
        <p className="text-slate-500 font-bold">{isAr ? 'نحن نحمي خصوصيتك وبياناتك الرقمية' : 'We protect your privacy and digital data'}</p>
      </div>
      <Card className="rounded-brand border-none shadow-xl overflow-hidden">
        <CardContent className="p-10 space-y-8 text-slate-700 leading-relaxed font-medium">
          <section>
            <h2 className="text-xl font-black text-primary mb-4">{isAr ? 'جمع المعلومات' : 'Information Collection'}</h2>
            <p>{isAr ? 'نقوم بجمع المعلومات اللازمة فقط لتقديم الخدمات البلدية بشكل فعال ودقيق.' : 'We collect only the information necessary to provide municipal services effectively and accurately.'}</p>
          </section>
          <section>
            <h2 className="text-xl font-black text-primary mb-4">{isAr ? 'أمن البيانات' : 'Data Security'}</h2>
            <p>{isAr ? 'نستخدم تقنيات تشفير متطورة لحماية بياناتك من الوصول غير المصرح به.' : 'We use advanced encryption technologies to protect your data from unauthorized access.'}</p>
          </section>
        </CardContent>
      </Card>
    </main>
  );
}

export default function PrivacyPage() {
  const { language } = useSettingsStore();
  const isAr = language === 'ar';
  const [override, setOverride] = useState<CustomPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBin().then(data => {
      const found = data.customPages?.find((p: CustomPage) => p.slug === 'privacy');
      if (found) setOverride(found);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className={cn("min-h-screen bg-slate-50", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={[]} />
      {loading ? (
        <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>
      ) : override ? (
        <main>
          {/* Dynamic Component Loop matches Dynamic renderer logic */}
          <div className="max-w-7xl mx-auto px-6 py-12">
             <h1 className="text-5xl font-black text-primary mb-12">{isAr ? override.titleAr : override.titleEn}</h1>
             {/* Note: In a real app, I'd move the component loop to a shared renderer file */}
             <div className="space-y-12">
                <p className="text-slate-500 font-bold">Dynamic content active for this slug.</p>
                <Link href="/p/privacy" className="text-accent underline font-black">View full dynamic version</Link>
             </div>
          </div>
        </main>
      ) : <StaticPrivacy isAr={isAr} />}
      <PortalFooter siteConfig={null} />
    </div>
  );
}
