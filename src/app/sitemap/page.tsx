
'use client';

import React from 'react';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { useSettingsStore } from '@/lib/settings-store';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Map } from 'lucide-react';
import Link from 'next/link';

export default function SitemapPage() {
  const { language } = useSettingsStore();
  const isAr = language === 'ar';

  const links = [
    { title: isAr ? 'الرئيسية' : 'Home', path: '/' },
    { title: isAr ? 'لوحة التحكم' : 'Admin', path: '/admin' },
    { title: isAr ? 'المساحة الذكية' : 'Smart Workspace', path: '/template' },
    { title: isAr ? 'الشروط والأحكام' : 'Terms', path: '/terms' },
    { title: isAr ? 'الخصوصية' : 'Privacy', path: '/privacy' },
  ];

  return (
    <div className={cn("min-h-screen bg-slate-50", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={[]} />
      <main className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <Map className="mx-auto text-primary mb-6" size={64} />
          <h1 className="text-4xl font-black text-primary mb-4">{isAr ? 'خريطة الموقع' : 'Sitemap'}</h1>
          <p className="text-slate-500 font-bold">{isAr ? 'هيكل وبنية صفحات البوابة الإلكترونية' : 'Electronic portal page structure'}</p>
        </div>
        <Card className="rounded-brand border-none shadow-xl overflow-hidden">
          <CardContent className="p-10 grid grid-cols-1 md:grid-cols-2 gap-4 font-bold">
            {links.map(link => (
              <Link key={link.path} href={link.path} className="p-4 border rounded-xl hover:bg-slate-50 transition-colors">
                {link.title}
              </Link>
            ))}
          </CardContent>
        </Card>
      </main>
      <PortalFooter siteConfig={null} />
    </div>
  );
}
