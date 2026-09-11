
'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { fetchBin } from '@/lib/jsonbin';
import { CustomPage, BuilderComponent } from '@/lib/types';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { useSettingsStore } from '@/lib/settings-store';
import { cn } from '@/lib/utils';
import { Loader2, TrendingUp, ShieldCheck, FileText, Info, ExternalLink } from 'lucide-react';
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
    <div className={cn("min-h-screen bg-white", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={[]} />
      
      <main>
        {page.components.map((comp) => (
          <section key={comp.id} className="py-16 border-b last:border-b-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="max-w-7xl mx-auto px-6">
              
              {comp.type === 'heading' && (
                <div className="mb-8">
                  {React.createElement(comp.content.level || 'h2', {
                    className: cn("font-black text-primary tracking-tighter", 
                      comp.content.level === 'h1' ? "text-5xl md:text-7xl" : 
                      comp.content.level === 'h2' ? "text-4xl md:text-5xl" : 
                      "text-2xl md:text-3xl"
                    )
                  }, isAr ? comp.content.textAr : comp.content.textEn)}
                </div>
              )}

              {comp.type === 'hero' && (
                <div className="max-w-4xl py-12">
                  <h1 className="text-5xl md:text-8xl font-black text-primary mb-8 tracking-tighter dm-gradient-primary bg-clip-text text-transparent">
                    {isAr ? comp.content.titleAr : comp.content.titleEn}
                  </h1>
                  <p className="text-2xl text-slate-500 font-bold leading-relaxed">
                    {isAr ? comp.content.subtitleAr : comp.content.subtitleEn}
                  </p>
                </div>
              )}

              {comp.type === 'table' && (
                <div className="border rounded-[2rem] overflow-hidden shadow-sm max-w-4xl mx-auto bg-white">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="font-black text-primary">{comp.content.headers[0]}</TableHead>
                        <TableHead className="font-black text-primary">{comp.content.headers[1]}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {comp.content.rows.map((row: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell className="font-bold">{row.c1}</TableCell>
                          <TableCell className="font-black text-emerald-600">{row.c2}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {comp.type === 'progress' && (
                <div className="max-w-4xl mx-auto space-y-4">
                  <div className="flex justify-between items-end">
                    <h4 className="text-xl font-black text-primary">{isAr ? comp.content.labelAr : comp.content.labelEn}</h4>
                    <span className="text-accent font-black">{comp.content.value}%</span>
                  </div>
                  <Progress value={comp.content.value} className="h-4 rounded-full" />
                </div>
              )}

              {comp.type === 'badge' && (
                <div className="flex justify-center">
                  <Badge variant={comp.content.variant} className="px-8 py-2 rounded-full font-black text-lg">
                    {isAr ? comp.content.textAr : comp.content.textEn}
                  </Badge>
                </div>
              )}

              {comp.type === 'avatar' && (
                <div className="flex justify-center">
                  <Avatar className="h-24 w-24 border-4 border-primary shadow-xl">
                    <AvatarImage src={comp.content.src} />
                    <AvatarFallback className="bg-primary text-white font-black text-2xl">{comp.content.fallback}</AvatarFallback>
                  </Avatar>
                </div>
              )}

              {comp.type === 'text' && (
                <div className="prose prose-xl max-w-4xl text-slate-700 font-medium leading-loose whitespace-pre-wrap">
                  {isAr ? comp.content.bodyAr : comp.content.bodyEn}
                </div>
              )}

              {comp.type === 'image' && (
                <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border-8 border-slate-50 aspect-video">
                  <Image src={comp.content.url} alt={isAr ? comp.content.altAr : comp.content.altEn} fill className="object-cover" />
                </div>
              )}

              {comp.type === 'video' && (
                <div className="max-w-4xl mx-auto aspect-video rounded-[2rem] overflow-hidden shadow-2xl bg-slate-900 flex items-center justify-center">
                   {comp.content.url ? (
                     <iframe src={comp.content.url.replace('watch?v=', 'embed/')} className="w-full h-full" allowFullScreen />
                   ) : (
                     <p className="text-white/40 font-bold">Video Widget</p>
                   )}
                </div>
              )}

              {comp.type === 'accordion' && (
                <Accordion type="single" collapsible className="w-full max-w-4xl mx-auto">
                  {comp.content.items?.map((item: any, idx: number) => (
                    <AccordionItem key={idx} value={`item-${idx}`} className="border-slate-100">
                      <AccordionTrigger className="text-xl font-black text-primary">{isAr ? item.titleAr : item.titleEn}</AccordionTrigger>
                      <AccordionContent className="text-lg text-slate-500 font-medium">{isAr ? item.contentAr : item.contentEn}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}

              {comp.type === 'pdf' && (
                <a href={comp.content.url} target="_blank" className="inline-flex items-center gap-4 p-6 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 hover:border-primary transition-colors group">
                  <div className="p-3 bg-red-50 text-red-600 rounded-xl group-hover:bg-red-600 group-hover:text-white transition-colors"><FileText size={24} /></div>
                  <span className="text-xl font-black text-slate-700">{isAr ? comp.content.labelAr : comp.content.labelEn}</span>
                  <ExternalLink size={18} className="text-slate-400" />
                </a>
              )}

              {comp.type === 'separator' && <Separator className="bg-slate-100 h-1" />}

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
