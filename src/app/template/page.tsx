'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LayoutDashboard, Send, FileText, Palette } from 'lucide-react';
import Link from 'next/link';
import { useSettingsStore } from '@/lib/settings-store';
import { cn } from '@/lib/utils';
import { fetchBin } from '@/lib/jsonbin';
import { MenuItem, SiteConfig } from '@/lib/types';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const ImmersionCanvas = dynamic(
  () => import('@/components/immersion-canvas'),
  { ssr: false }
);

export default function StandardTemplatePage() {
  const { language } = useSettingsStore();
  const isAr = language === 'ar';
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);

  useEffect(() => {
    fetchBin().then(data => {
      if (data) {
        setMenuItems(data.menuItems || []);
        setSiteConfig(data.siteConfig || null);
      }
    });
  }, []);

  return (
    <div className={cn("min-h-screen bg-white", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      {/* Standard Header */}
      <PortalHeader menuItems={menuItems} />

      {/* Main Template Content */}
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <h1 className="text-5xl font-black mb-6">{isAr ? 'قالب الصفحة العام' : 'General Page Template'}</h1>
            <p className="text-xl text-white/60 font-bold max-w-2xl">
              {isAr ? 'هذا القالب يوفر الهيدر والفوتر والهوية البصرية الرسمية لبلدية ظفار، مما يسمح للمطورين ببناء صفحات فرعية بسهولة.' : 'This template provides the official header, footer, and branding of Dhofar Municipality, allowing developers to build sub-pages easily.'}
            </p>
          </div>
          <div className="absolute inset-0 dm-wave-5 opacity-10" />
        </section>

        {/* Content Showcase Area */}
        <section className="py-24 max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Template Column 1: Informational */}
            <div className="space-y-8">
              <Card className="rounded-brand shadow-sm border-t-4 border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="text-accent" />
                    {isAr ? 'تعليمات الاستخدام' : 'Usage Instructions'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-500 font-bold">
                    {isAr ? 'استخدم هذا القالب كأساس لأي صفحة عامة جديدة داخل البوابة.' : 'Use this template as a base for any new general page inside the portal.'}
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      {isAr ? 'استخدم PortalHeader و PortalFooter للمحافظة على الهوية' : 'Use PortalHeader and PortalFooter to maintain identity'}
                    </li>
                    <li className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      {isAr ? 'التزم بنظام الألوان HSL المعتمد في globals.css' : 'Stick to the approved HSL colors in globals.css'}
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* 3D Immersion Section */}
              <div className="rounded-[2rem] overflow-hidden h-[400px] relative border shadow-2xl group">
                <ImmersionCanvas />
                <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-white text-[10px] font-black uppercase tracking-widest">
                  {isAr ? 'المساعد الذكي (تجريبي)' : 'Smart Assistant (Beta)'}
                </div>
              </div>
            </div>

            {/* Template Column 2: Interactive Form Demo */}
            <div className="space-y-8">
              <Card className="rounded-brand shadow-xl">
                <CardHeader className="bg-slate-50 border-b">
                  <CardTitle className="text-xl font-black flex items-center gap-2">
                    <FileText className="text-primary" />
                    {isAr ? 'نموذج تفاعلي قياسي' : 'Standard Interactive Form'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-slate-400 tracking-widest">{isAr ? 'اسم الحقل' : 'Field Name'}</label>
                    <input className="w-full h-12 border-2 rounded-xl px-4 font-bold outline-none focus:border-primary transition-colors" placeholder={isAr ? 'أدخل القيمة...' : 'Enter value...'} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-slate-400 tracking-widest">{isAr ? 'وصف تفصيلي' : 'Detailed Description'}</label>
                    <textarea className="w-full h-32 border-2 rounded-xl p-4 font-bold outline-none focus:border-primary transition-colors" placeholder={isAr ? 'أدخل النص هنا...' : 'Enter text here...'} />
                  </div>
                  <Button className="w-full h-14 rounded-full dm-gradient-primary font-black text-lg gap-2">
                    <Send size={20} />
                    {isAr ? 'إرسال البيانات' : 'Submit Data'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      {/* Standard Footer */}
      <PortalFooter siteConfig={siteConfig} />
    </div>
  );
}
