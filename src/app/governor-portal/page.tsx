
'use client';

import React from 'react';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { useSettingsStore } from '@/lib/settings-store';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Landmark } from 'lucide-react';

export default function GovernorPortalPage() {
  const { language } = useSettingsStore();
  const isAr = language === 'ar';

  return (
    <div className={cn("min-h-screen bg-slate-50", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={[]} />
      <main className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <Landmark className="mx-auto text-primary mb-6" size={64} />
          <h1 className="text-4xl font-black text-primary mb-4">{isAr ? 'بوابة محافظ ظفار' : 'Dhofar Governor Portal'}</h1>
          <p className="text-slate-500 font-bold">{isAr ? 'البوابة الرسمية لمكتب محافظ ظفار' : 'Official Portal of the Office of Dhofar Governor'}</p>
        </div>
        <Card className="rounded-brand border-none shadow-xl overflow-hidden">
          <CardContent className="p-10 text-center">
            <p className="mb-6 font-bold">{isAr ? 'سيتم تحويلك إلى البوابة الرسمية للمحافظ.' : 'You will be redirected to the official portal of the Governor.'}</p>
            <a href="https://www.dhofar.gov.om" className="text-accent font-black underline">{isAr ? 'اضغط هنا للزيارة' : 'Click here to visit'}</a>
          </CardContent>
        </Card>
      </main>
      <PortalFooter siteConfig={null} />
    </div>
  );
}
