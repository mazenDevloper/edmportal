
'use client';

import React from 'react';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { useSettingsStore } from '@/lib/settings-store';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';

export default function TermsPage() {
  const { language } = useSettingsStore();
  const isAr = language === 'ar';

  return (
    <div className={cn("min-h-screen bg-slate-50", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={[]} />
      <main className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <ShieldAlert className="mx-auto text-primary mb-6" size={64} />
          <h1 className="text-4xl font-black text-primary mb-4">{isAr ? 'الشروط والأحكام' : 'Terms & Conditions'}</h1>
          <p className="text-slate-500 font-bold">{isAr ? 'تنظم هذه الشروط استخدام الخدمات الإلكترونية لبلدية ظفار' : 'These terms govern the use of Dhofar Municipality electronic services'}</p>
        </div>
        <Card className="rounded-brand border-none shadow-xl overflow-hidden">
          <CardContent className="p-10 space-y-8 text-slate-700 leading-relaxed font-medium">
            <section>
              <h2 className="text-xl font-black text-primary mb-4">{isAr ? '1. مقدمة' : '1. Introduction'}</h2>
              <p>{isAr ? 'باستخدامك لهذه البوابة، فإنك توافق على الالتزام الكامل بهذه الشروط والأحكام المعمول بها في سلطنة عمان.' : 'By using this portal, you agree to fully comply with these terms and conditions applicable in the Sultanate of Oman.'}</p>
            </section>
            <section>
              <h2 className="text-xl font-black text-primary mb-4">{isAr ? '2. الخصوصية' : '2. Privacy'}</h2>
              <p>{isAr ? 'نحن نلتزم بحماية بياناتك الشخصية وفقاً للقوانين والأنظمة الوطنية لحماية البيانات.' : 'We are committed to protecting your personal data in accordance with national data protection laws and regulations.'}</p>
            </section>
            <section>
              <h2 className="text-xl font-black text-primary mb-4">{isAr ? '3. الالتزامات' : '3. Obligations'}</h2>
              <p>{isAr ? 'يجب على المستخدم تقديم بيانات صحيحة ودقيقة عند استخدام الخدمات الرقمية.' : 'Users must provide correct and accurate data when using digital services.'}</p>
            </section>
          </CardContent>
        </Card>
      </main>
      <PortalFooter siteConfig={null} />
    </div>
  );
}
