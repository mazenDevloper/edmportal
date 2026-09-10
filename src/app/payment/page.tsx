
'use client';

import React from 'react';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { useSettingsStore } from '@/lib/settings-store';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';

export default function PaymentPage() {
  const { language } = useSettingsStore();
  const isAr = language === 'ar';

  return (
    <div className={cn("min-h-screen bg-slate-50", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={[]} />
      <main className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <CreditCard className="mx-auto text-primary mb-6" size={64} />
          <h1 className="text-4xl font-black text-primary mb-4">{isAr ? 'سياسة الدفع' : 'Payment Policy'}</h1>
          <p className="text-slate-500 font-bold">{isAr ? 'إرشادات وضوابط الدفع الإلكتروني للخدمات' : 'E-payment guidelines and controls for services'}</p>
        </div>
        <Card className="rounded-brand border-none shadow-xl overflow-hidden">
          <CardContent className="p-10 space-y-8 text-slate-700 leading-relaxed font-medium">
            <section>
              <h2 className="text-xl font-black text-primary mb-4">{isAr ? 'بوابات الدفع' : 'Payment Gateways'}</h2>
              <p>{isAr ? 'تعتمد بلدية ظفار بوابات دفع آمنة ومعتمدة من البنك المركزي العماني.' : 'Dhofar Municipality uses secure payment gateways approved by the Central Bank of Oman.'}</p>
            </section>
            <section>
              <h2 className="text-xl font-black text-primary mb-4">{isAr ? 'الاسترداد' : 'Refunds'}</h2>
              <p>{isAr ? 'تخضع عمليات الاسترداد للأنظمة المالية والضوابط المعتمدة في البلدية.' : 'Refund processes are subject to approved financial systems and controls in the municipality.'}</p>
            </section>
          </CardContent>
        </Card>
      </main>
      <PortalFooter siteConfig={null} />
    </div>
  );
}
