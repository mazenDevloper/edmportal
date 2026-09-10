
'use client';

import React from 'react';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { useSettingsStore } from '@/lib/settings-store';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Lock } from 'lucide-react';

export default function PrivacyPage() {
  const { language } = useSettingsStore();
  const isAr = language === 'ar';

  return (
    <div className={cn("min-h-screen bg-slate-50", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={[]} />
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
      <PortalFooter siteConfig={null} />
    </div>
  );
}
