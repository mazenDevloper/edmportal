
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
import { 
  Loader2, Info, FileText, ExternalLink, 
  CheckCircle2, PlayCircle, Award, 
  TrendingUp, Users, ShieldCheck, Mail
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';

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
        <div className="text-center mb-24 space-y-6">
          <motion.h1 initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="text-6xl md:text-8xl font-black text-primary tracking-tighter">
            {isAr ? page.titleAr : (page.titleEn || page.titleAr)}
          </motion.h1>
          <div className="h-2 w-32 bg-accent mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-12 gap-8 items-start">
          {page.components.map((comp, i) => {
            const hClass = comp.gridHeight === 'sm' ? 'min-h-[200px]' : 
                          comp.gridHeight === 'md' ? 'min-h-[400px]' : 
                          comp.gridHeight === 'lg' ? 'min-h-[600px]' : 
                          comp.gridHeight === 'full' ? 'min-h-screen' : '';
            
            return (
              <motion.div 
                key={comp.id} 
                initial={{opacity:0, y:30}} 
                whileInView={{opacity:1, y:0}} 
                viewport={{once: true}}
                transition={{delay: i * 0.05}}
                className={cn(
                  "animate-in fade-in duration-700", 
                  `widget-${comp.id}`,
                  hClass,
                  comp.gridSpan === 3 ? "col-span-12 md:col-span-3" :
                  comp.gridSpan === 4 ? "col-span-12 md:col-span-4" :
                  comp.gridSpan === 6 ? "col-span-12 md:col-span-6" :
                  comp.gridSpan === 9 ? "col-span-12 md:col-span-9" :
                  comp.gridSpan === 12 ? "col-span-12" : "col-span-12"
                )}
              >
                {comp.customCss && (
                  <style dangerouslySetInnerHTML={{ __html: comp.customCss.replace('.custom-widget', `.widget-${comp.id}`) }} />
                )}

                <div className="h-full">
                  {comp.type === 'heading' && <h2 className={cn("font-black text-primary tracking-tighter text-center mb-8", comp.content.level === 'h1' ? "text-5xl md:text-7xl" : "text-4xl md:text-5xl")}>{isAr ? comp.content.textAr : (comp.content.textEn || comp.content.textAr)}</h2>}
                  {comp.type === 'text' && <div className="max-w-4xl mx-auto prose prose-xl text-slate-700 font-medium leading-relaxed whitespace-pre-wrap text-lg py-4 text-center">{isAr ? comp.content.bodyAr : (comp.content.bodyEn || comp.content.bodyAr)}</div>}
                  {comp.type === 'html' && <div className="rounded-[2rem] overflow-hidden" dangerouslySetInnerHTML={{ __html: comp.content.code || comp.content }} />}
                  {comp.type === 'info' && (
                    <Card className="rounded-[3rem] border-none shadow-2xl bg-white overflow-hidden border-t-8 border-primary relative">
                      <div className="absolute top-0 right-0 size-64 dm-wave-5 opacity-10 -rotate-45" />
                      <CardContent className="p-12 md:p-20 text-center relative z-10 text-2xl text-slate-700 italic">{isAr ? comp.content.bodyAr : (comp.content.bodyEn || comp.content.bodyAr)}</CardContent>
                    </Card>
                  )}
                  {comp.type === 'stats' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-center bg-slate-900 p-16 rounded-[4rem] text-white shadow-2xl relative overflow-hidden border-t-4 border-accent">
                       <div className="space-y-4 relative z-10"><h3 className="text-6xl font-black text-accent">{comp.content.v1}</h3><p className="text-xs font-black opacity-60 uppercase">{isAr ? comp.content.t1Ar : (comp.content.t1En || comp.content.t1Ar)}</p></div>
                       <div className="space-y-4 relative z-10"><h3 className="text-6xl font-black text-accent">{comp.content.v2}</h3><p className="text-xs font-black opacity-60 uppercase">{isAr ? comp.content.t2Ar : (comp.content.t2En || comp.content.t2Ar)}</p></div>
                    </div>
                  )}
                  {comp.type === 'accordion' && (
                    <Card className="rounded-[2rem] border-none shadow-xl bg-white p-10">
                      <Accordion type="single" collapsible className="w-full">
                        {comp.content.items?.map((item: any, idx: number) => (
                          <AccordionItem key={idx} value={`item-${idx}`} className="border-slate-100 py-2">
                            <AccordionTrigger className="text-2xl font-black text-primary hover:text-accent transition-colors">{isAr ? item.titleAr : (item.titleEn || item.titleAr)}</AccordionTrigger>
                            <AccordionContent className="text-xl text-slate-500 font-medium leading-loose pt-6">{isAr ? item.contentAr : (item.contentEn || item.contentAr)}</AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </Card>
                  )}
                  {comp.type === 'avatar' && (
                    <div className="flex flex-col items-center gap-6 max-w-xs mx-auto">
                       <Avatar className="size-40 border-8 border-white shadow-2xl"><AvatarImage src={comp.content.src} /><AvatarFallback className="bg-primary text-white text-5xl font-black">{isAr ? comp.content.nameAr?.[0] : (comp.content.nameEn?.[0] || comp.content.nameAr?.[0])}</AvatarFallback></Avatar>
                       <div className="text-center"><h4 className="text-2xl font-black text-primary">{isAr ? comp.content.nameAr : (comp.content.nameEn || comp.content.nameAr)}</h4></div>
                    </div>
                  )}
                  {comp.type === 'pdf' && <div className="flex justify-center"><a href={comp.content.url} target="_blank" className="flex items-center gap-8 p-10 rounded-[3rem] bg-white shadow-2xl border-4 border-transparent hover:border-primary transition-all"><FileText size={48} className="text-red-600" /><div><span className="text-3xl font-black text-slate-800 block">{isAr ? comp.content.labelAr : (comp.content.labelEn || comp.content.labelAr)}</span></div></a></div>}
                  {comp.type === 'separator' && <Separator className="max-w-4xl mx-auto bg-slate-200 h-px my-12" />}
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>

      <PortalFooter siteConfig={null} />
    </div>
  );
}
