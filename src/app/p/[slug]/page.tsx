
'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { fetchBin } from '@/lib/jsonbin';
import { CustomPage } from '@/lib/types';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { useSettingsStore } from '@/lib/settings-store';
import { cn } from '@/lib/utils';
import { Loader2, Info, FileText, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
    <div className={cn("min-h-screen bg-slate-50", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={[]} />
      
      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16 space-y-4">
          <h1 className="text-4xl md:text-6xl font-black text-primary tracking-tighter">
            {isAr ? page.titleAr : page.titleEn}
          </h1>
        </div>

        <div className="space-y-12">
          {page.components.map((comp) => (
            <div key={comp.id} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              
              {comp.type === 'heading' && (
                <div className="text-center mb-8">
                  {React.createElement(comp.content.level || 'h2', {
                    className: cn("font-black text-primary tracking-tighter", 
                      comp.content.level === 'h1' ? "text-5xl md:text-7xl" : 
                      comp.content.level === 'h2' ? "text-4xl md:text-5xl" : 
                      "text-2xl md:text-3xl"
                    )
                  }, isAr ? comp.content.textAr : comp.content.textEn)}
                </div>
              )}

              {comp.type === 'html' && (
                <div className="my-8" dangerouslySetInnerHTML={{ __html: comp.content.code }} />
              )}

              {comp.type === 'info' && (
                <Card className="rounded-brand border-none shadow-2xl bg-white max-w-4xl mx-auto overflow-hidden">
                  <CardContent className="p-12 md:p-16 text-center">
                    <div className="prose prose-xl mx-auto text-slate-700 font-medium leading-loose text-xl whitespace-pre-wrap">
                      {isAr ? comp.content.bodyAr : comp.content.bodyEn}
                    </div>
                  </CardContent>
                </Card>
              )}

              {comp.type === 'text' && (
                <div className="max-w-4xl mx-auto prose prose-xl text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                  {isAr ? comp.content.bodyAr : comp.content.bodyEn}
                </div>
              )}

              {comp.type === 'table' && (
                <Card className="max-w-4xl mx-auto rounded-brand border-none shadow-xl overflow-hidden bg-white">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="font-black text-primary p-6">{comp.content.headers[0]}</TableHead>
                        <TableHead className="font-black text-primary p-6">{comp.content.headers[1]}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {comp.content.rows.map((row: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell className="font-bold p-6">{row.c1}</TableCell>
                          <TableCell className="font-black text-emerald-600 p-6">{row.c2}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              )}

              {comp.type === 'accordion' && (
                <Card className="max-w-4xl mx-auto rounded-brand border-none shadow-xl bg-white p-8">
                  <Accordion type="single" collapsible className="w-full">
                    {comp.content.items?.map((item: any, idx: number) => (
                      <AccordionItem key={idx} value={`item-${idx}`} className="border-slate-100 last:border-0">
                        <AccordionTrigger className="text-xl font-black text-primary text-right">{isAr ? item.titleAr : item.titleEn}</AccordionTrigger>
                        <AccordionContent className="text-lg text-slate-500 font-medium leading-loose pt-4">
                          {isAr ? item.contentAr : item.contentEn}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </Card>
              )}

              {comp.type === 'stats' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto text-center bg-primary p-12 rounded-[3rem] text-white shadow-2xl">
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

              {comp.type === 'pdf' && (
                <div className="flex justify-center">
                  <a href={comp.content.url} target="_blank" className="inline-flex items-center gap-4 p-8 rounded-[2rem] bg-white shadow-xl hover:shadow-2xl transition-all group border-2 border-transparent hover:border-primary">
                    <div className="p-4 bg-red-50 text-red-600 rounded-2xl group-hover:bg-red-600 group-hover:text-white transition-colors"><FileText size={32} /></div>
                    <span className="text-2xl font-black text-slate-700">{isAr ? comp.content.labelAr : comp.content.labelEn}</span>
                    <ExternalLink size={24} className="text-slate-400" />
                  </a>
                </div>
              )}

              {comp.type === 'separator' && <Separator className="max-w-4xl mx-auto bg-slate-200 h-px my-8" />}
            </div>
          ))}
        </div>
      </main>

      <PortalFooter siteConfig={null} />
    </div>
  );
}
