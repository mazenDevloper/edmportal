
'use client';

import React from 'react';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { useSettingsStore } from '@/lib/settings-store';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Handshake } from 'lucide-react';

export default function SLAPage() {
  const { language } = useSettingsStore();
  const isAr = language === 'ar';

  return (
    <div className={cn("min-h-screen bg-slate-50", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={[]} />
      <main className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <Handshake className="mx-auto text-primary mb-6" size={64} />
          <h1 className="text-4xl font-black text-primary mb-4">{isAr ? 'اتفاقية مستوى الخدمة' : 'Service Level Agreement (SLA)'}</h1>
          <p className="text-slate-500 font-bold">{isAr ? 'التزامنا بجودة وسرعة تقديم الخدمات الإلكترونية' : 'Our commitment to the quality and speed of e-services'}</p>
        </div>
        <Card className="rounded-brand border-none shadow-xl overflow-hidden">
          <CardContent className="p-10 space-y-6 text-slate-700 leading-relaxed font-medium">
            <p>{isAr ? 'نلتزم بتوفير الخدمات بنسبة توفر 99.9% ومعالجة الطلبات خلال الفترات الزمنية المحددة لكل خدمة.' : 'We are committed to providing services with 99.9% availability and processing requests within the time periods specified for each service.'}</p>
          </CardContent>
        </Card>
      </main>
      <PortalFooter siteConfig={null} />
    </div>
  );
}
