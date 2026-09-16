
'use client';

import React from 'react';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { IdentityShowcase } from '@/components/identity-showcase';
import { useSettingsStore } from '@/lib/settings-store';
import { cn } from '@/lib/utils';
import { Palette, LayoutGrid, Box } from 'lucide-react';

export default function IdentityPage() {
  const { language } = useSettingsStore();
  const isAr = language === 'ar';

  return (
    <div className={cn("min-h-screen bg-[#F0F4F8]", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={[]} />
      
      <main className="py-16">
        <div className="max-w-7xl mx-auto px-6 mb-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-12 bg-white rounded-[3.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white/40 relative overflow-hidden">
            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent font-black text-[10px] uppercase tracking-widest">
                <Box size={14} /> {isAr ? 'نظام التصميم الموحد' : 'Unified Design System'}
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-primary tracking-tighter">
                {isAr ? 'دليل مكونات الهوية' : 'Identity Showcase'}
              </h1>
              <p className="text-lg font-bold text-slate-400 max-w-xl">
                {isAr ? 'استعراض شامل لكافة عناصر واجهة المستخدم والودجيت المستخدمة في بناء البوابة الرقمية لبلدية ظفار.' : 'A comprehensive showcase of all UI components and widgets used in building the Dhofar Municipality portal.'}
              </p>
            </div>
            <div className="relative z-10 size-32 rounded-[2.5rem] bg-primary text-white flex items-center justify-center shadow-2xl rotate-3">
              <Palette size={56} />
            </div>
            {/* Brand Pattern Decoration */}
            <div className="absolute top-0 right-0 w-full h-full dm-wave-5 opacity-5 pointer-events-none" />
          </div>
        </div>

        {/* The Component Gallery */}
        <IdentityShowcase isAr={isAr} />
      </main>

      <PortalFooter siteConfig={null} />
    </div>
  );
}
