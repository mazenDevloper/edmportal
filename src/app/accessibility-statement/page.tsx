
'use client';

import React from 'react';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { useSettingsStore } from '@/lib/settings-store';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Accessibility } from 'lucide-react';

export default function AccessibilityStatementPage() {
  const { language } = useSettingsStore();
  const isAr = language === 'ar';

  return (
    <div className={cn("min-h-screen bg-slate-50", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={[]} />
      <main className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <Accessibility className="mx-auto text-primary mb-6" size={64} />
          <h1 className="text-4xl font-black text-primary mb-4">{isAr ? 'بيان النفاذ الرقمي' : 'Accessibility Statement'}</h1>
          <p className="text-slate-500 font-bold">{isAr ? 'نسعى لتوفير تجربة استخدام شاملة للجميع' : 'Striving to provide an inclusive usage experience for all'}</p>
        </div>
        <Card className="rounded-brand border-none shadow-xl overflow-hidden">
          <CardContent className="p-10 space-y-6 text-slate-700 leading-relaxed font-medium">
            <p>{isAr ? 'نلتزم بمعايير WCAG 2.2 لضمان وصول كافة المواطنين للخدمات بغض النظر عن القدرات البدنية.' : 'We adhere to WCAG 2.2 standards to ensure all citizens have access to services regardless of physical abilities.'}</p>
          </CardContent>
        </Card>
      </main>
      <PortalFooter siteConfig={null} />
    </div>
  );
}
