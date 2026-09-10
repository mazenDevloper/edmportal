
'use client';

import React from 'react';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { useSettingsStore } from '@/lib/settings-store';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Settings2 } from 'lucide-react';

export default function ServiceControlsPage() {
  const { language } = useSettingsStore();
  const isAr = language === 'ar';

  return (
    <div className={cn("min-h-screen bg-slate-50", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={[]} />
      <main className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <Settings2 className="mx-auto text-primary mb-6" size={64} />
          <h1 className="text-4xl font-black text-primary mb-4">{isAr ? 'ضوابط الخدمات' : 'Service Controls'}</h1>
          <p className="text-slate-500 font-bold">{isAr ? 'المعايير الفنية والإدارية للخدمات الرقمية' : 'Technical and administrative standards for digital services'}</p>
        </div>
        <Card className="rounded-brand border-none shadow-xl overflow-hidden">
          <CardContent className="p-10 space-y-6 text-slate-700 leading-relaxed font-medium">
            <p>{isAr ? 'تخضع كافة الخدمات الإلكترونية لضوابط الجودة والأداء لضمان أفضل تجربة للمستخدم.' : 'All electronic services are subject to quality and performance controls to ensure the best user experience.'}</p>
          </CardContent>
        </Card>
      </main>
      <PortalFooter siteConfig={null} />
    </div>
  );
}
