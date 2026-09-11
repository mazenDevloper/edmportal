
'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { fetchBin } from '@/lib/jsonbin';
import { CustomPage, BuilderComponent } from '@/lib/types';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { useSettingsStore } from '@/lib/settings-store';
import { cn } from '@/lib/utils';
import { Loader2, TrendingUp, ShieldCheck, FileText, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function DynamicCustomPage() {
  const { slug } = useParams();
  const { language } = useSettingsStore();
  const isAr = language === 'ar';
  const [page, setPage] = useState<CustomPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await fetchBin();
      if (data && data.customPages) {
        const found = data.customPages.find((p: CustomPage) => p.slug === slug);
        setPage(found || null);
      }
      setLoading(false);
    };
    load();
  }, [slug]);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  if (!page) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4">
      <h2 className="text-4xl font-black text-primary">404</h2>
      <p className="font-bold text-slate-500">{isAr ? 'الصفحة غير موجودة' : 'Page Not Found'}</p>
    </div>
  );

  return (
    <div className={cn("min-h-screen bg-white", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={[]} />
      
      <main>
        {page.components.map((comp) => (
          <section key={comp.id} className="py-20 first:pt-32 border-b last:border-b-0">
            <div className="max-w-7xl mx-auto px-6">
              {comp.type === 'hero' && (
                <div className="max-w-4xl">
                  <h1 className="text-5xl md:text-7xl font-black text-primary mb-8 tracking-tighter">
                    {isAr ? comp.content.titleAr : comp.content.titleEn}
                  </h1>
                  <p className="text-2xl text-slate-500 font-bold leading-relaxed">
                    {isAr ? comp.content.subtitleAr : comp.content.subtitleEn}
                  </p>
                </div>
              )}

              {comp.type === 'text' && (
                <div className="prose prose-xl max-w-4xl text-slate-700 font-medium leading-loose">
                  {isAr ? comp.content.bodyAr : comp.content.bodyEn}
                </div>
              )}

              {comp.type === 'stats' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center bg-slate-900 p-16 rounded-[3rem] text-white">
                   <div className="space-y-2">
                     <h3 className="text-5xl font-black text-accent">{comp.content.v1}</h3>
                     <p className="text-xs font-black uppercase tracking-widest opacity-60">{comp.content.t1}</p>
                   </div>
                   <div className="space-y-2">
                     <h3 className="text-5xl font-black text-accent">{comp.content.v2}</h3>
                     <p className="text-xs font-black uppercase tracking-widest opacity-60">{comp.content.t2}</p>
                   </div>
                </div>
              )}

              {comp.type === 'info' && (
                <Card className="rounded-brand border-none shadow-xl bg-slate-50">
                  <CardContent className="p-12 flex items-start gap-8">
                    <div className="p-4 bg-primary text-white rounded-2xl"><Info size={32} /></div>
                    <div>
                       <h3 className="text-2xl font-black text-primary mb-4">{isAr ? 'معلومات هامة' : 'Important Information'}</h3>
                       <p className="text-lg font-bold text-slate-600">{isAr ? comp.content.bodyAr : comp.content.bodyEn}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </section>
        ))}
      </main>

      <PortalFooter siteConfig={null} />
    </div>
  );
}
