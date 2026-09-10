
'use client';

import React from 'react';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { useSettingsStore } from '@/lib/settings-store';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';

export default function FAQsPage() {
  const { language } = useSettingsStore();
  const isAr = language === 'ar';

  return (
    <div className={cn("min-h-screen bg-slate-50", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={[]} />
      <main className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <HelpCircle className="mx-auto text-primary mb-6" size={64} />
          <h1 className="text-4xl font-black text-primary mb-4">{isAr ? 'الأسئلة الشائعة' : 'FAQs'}</h1>
          <p className="text-slate-500 font-bold">{isAr ? 'إجابات على استفساراتكم حول الخدمات البلدية' : 'Answers to your inquiries about municipal services'}</p>
        </div>
        <Card className="rounded-brand border-none shadow-xl overflow-hidden">
          <CardContent className="p-10">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="font-black text-lg">{isAr ? 'كيف يمكنني تجديد عقد الإيجار؟' : 'How can I renew a lease?'}</AccordionTrigger>
                <AccordionContent className="font-bold text-slate-500">{isAr ? 'يمكنك التجديد عبر خدمة عقود الإيجار الرقمية في دليل الخدمات.' : 'You can renew via the digital lease service in the service catalog.'}</AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </main>
      <PortalFooter siteConfig={null} />
    </div>
  );
}
