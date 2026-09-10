
'use client';

import React from 'react';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { useSettingsStore } from '@/lib/settings-store';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Database } from 'lucide-react';

export default function OpenDataPage() {
  const { language } = useSettingsStore();
  const isAr = language === 'ar';

  return (
    <div className={cn("min-h-screen bg-slate-50", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={[]} />
      <main className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <Database className="mx-auto text-primary mb-6" size={64} />
          <h1 className="text-4xl font-black text-primary mb-4">{isAr ? 'رخصة البيانات المفتوحة' : 'Open Data License'}</h1>
          <p className="text-slate-500 font-bold">{isAr ? 'نشارك البيانات لتعزيز الابتكار والشفافية' : 'Sharing data to promote innovation and transparency'}</p>
        </div>
        <Card className="rounded-brand border-none shadow-xl overflow-hidden">
          <CardContent className="p-10 space-y-8 text-slate-700 leading-relaxed font-medium">
            <p>{isAr ? 'تسمح هذه الرخصة باستخدام البيانات المفتوحة لبلدية ظفار لأغراض تجارية وغير تجارية بشرط الإشارة إلى المصدر.' : 'This license allows use of Dhofar Municipality open data for commercial and non-commercial purposes, provided the source is cited.'}</p>
          </CardContent>
        </Card>
      </main>
      <PortalFooter siteConfig={null} />
    </div>
  );
}
