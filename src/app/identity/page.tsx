
'use client';

import React from 'react';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { IdentityShowcase } from '@/components/identity-showcase';
import { useSettingsStore } from '@/lib/settings-store';
import { cn } from '@/lib/utils';
import { Palette } from 'lucide-react';

export default function IdentityPage() {
  const { language } = useSettingsStore();
  const isAr = language === 'ar';

  return (
    <div className={cn("min-h-screen bg-white", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={[]} />
      
      <main className="py-20 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6 mb-12">
          <div className="flex items-center gap-6 p-10 bg-primary text-white rounded-[3rem] shadow-2xl relative overflow-hidden">
            <div className="relative z-10 size-20 rounded-3xl bg-accent text-slate-900 flex items-center justify-center shadow-lg">
              <Palette size={40} />
            </div>
            <div className="relative z-10">
              <h1 className="text-5xl font-black tracking-tighter mb-2">
                {isAr ? 'دليل مكونات الهوية' : 'Identity Showcase'}
              </h1>
              <p className="text-xl font-bold opacity-70">
                {isAr ? 'نظام التصميم الموحد لبوابة بلدية ظفار الرقمية' : 'Unified Design System for Dhofar Municipality'}
              </p>
            </div>
            <div className="absolute top-0 right-0 w-full h-full dm-wave-5 opacity-10 pointer-events-none" />
          </div>
        </div>

        <IdentityShowcase isAr={isAr} />
      </main>

      <PortalFooter siteConfig={null} />
    </div>
  );
}
