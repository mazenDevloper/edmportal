
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
            {isAr ? page.titleAr : page.titleEn}
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
                style={{ 
                  width: comp.gridSpan === 0 ? (comp.customWidth || '100%') : undefined,
                  height: comp.gridHeight === 'custom' ? (comp.customHeight || 'auto') : undefined
                }}
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
                  {comp.type === 'style' && <style dangerouslySetInnerHTML={{ __html: comp.content.code || comp.content }} />}
                  {comp.type === 'heading' && <h2 className={cn("font-black text-primary tracking-tighter text-center mb-8", comp.content.level === 'h1' ? "text-5xl md:text-7xl" : "text-4xl md:text-5xl")}>{isAr ? comp.content.textAr : comp.content.textEn}</h2>}
                  {comp.type === 'text' && <div className="max-w-4xl mx-auto prose prose-xl text-slate-700 font-medium leading-relaxed whitespace-pre-wrap text-lg py-4">{isAr ? comp.content.bodyAr : comp.content.bodyEn}</div>}
                  {comp.type === 'html' && <div className="rounded-[2rem] overflow-hidden" dangerouslySetInnerHTML={{ __html: comp.content.code || comp.content }} />}
                  {comp.type === 'info' && (
                    <Card className="rounded-[3rem] border-none shadow-2xl bg-white overflow-hidden border-t-8 border-primary relative">
                      <div className="absolute top-0 right-0 size-64 dm-wave-5 opacity-10 -rotate-45" />
                      <CardContent className="p-12 md:p-20 text-center relative z-10 text-2xl text-slate-700 italic">{isAr ? comp.content.bodyAr : comp.content.bodyEn}</CardContent>
                    </Card>
                  )}
                  {comp.type === 'stats' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 text-center bg-slate-900 p-16 rounded-[4rem] text-white shadow-2xl relative overflow-hidden border-t-4 border-accent">
                       <div className="space-y-4 relative z-10"><h3 className="text-6xl font-black text-accent">{comp.content.v1}</h3><p className="text-xs font-black opacity-60 uppercase">{comp.content.t1}</p></div>
                       <div className="space-y-4 relative z-10"><h3 className="text-6xl font-black text-accent">{comp.content.v2}</h3><p className="text-xs font-black opacity-60 uppercase">{comp.content.t2}</p></div>
                    </div>
                  )}
                  {comp.type === 'accordion' && (
                    <Card className="rounded-[2rem] border-none shadow-xl bg-white p-10">
                      <Accordion type="single" collapsible className="w-full">
                        {comp.content.items?.map((item: any, idx: number) => (
                          <AccordionItem key={idx} value={`item-${idx}`} className="border-slate-100 py-2">
                            <AccordionTrigger className="text-2xl font-black text-primary hover:text-accent transition-colors">{isAr ? item.titleAr : item.titleEn}</AccordionTrigger>
                            <AccordionContent className="text-xl text-slate-500 font-medium leading-loose pt-6">{isAr ? item.contentAr : item.contentEn}</AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </Card>
                  )}
                  {comp.type === 'tabs' && (
                    <Card className="rounded-[3rem] border-none shadow-2xl bg-white overflow-hidden">
                      <Tabs defaultValue="tab-0" className="w-full">
                        <TabsList className="w-full h-20 bg-slate-900 rounded-none p-0 flex">
                          {comp.content.items?.map((item: any, idx: number) => (
                            <TabsTrigger key={idx} value={`tab-${idx}`} className="flex-1 rounded-none text-white/50 data-[state=active]:bg-accent data-[state=active]:text-slate-900 font-black text-lg h-full border-x border-white/5">{isAr ? item.titleAr : item.titleEn}</TabsTrigger>
                          ))}
                        </TabsList>
                        {comp.content.items?.map((item: any, idx: number) => (
                          <TabsContent key={idx} value={`tab-${idx}`} className="p-16 animate-in fade-in text-center italic text-2xl text-slate-700">{isAr ? item.contentAr : item.contentEn}</TabsContent>
                        ))}
                      </Tabs>
                    </Card>
                  )}
                  {comp.type === 'avatar' && (
                    <div className="flex flex-col items-center gap-6 max-w-xs mx-auto">
                       <Avatar className="size-40 border-8 border-white shadow-2xl"><AvatarImage src={comp.content.src} /><AvatarFallback className="bg-primary text-white text-5xl font-black">{isAr ? comp.content.nameAr?.[0] : comp.content.nameEn?.[0]}</AvatarFallback></Avatar>
                       <div className="text-center"><h4 className="text-2xl font-black text-primary">{isAr ? comp.content.nameAr : comp.content.nameEn}</h4><Badge variant="outline" className="mt-2 border-accent text-accent font-black">Authorized Member</Badge></div>
                    </div>
                  )}
                  {comp.type === 'badge' && <div className="flex justify-center"><Badge className="bg-accent text-slate-900 font-black px-6 py-2 rounded-xl text-lg">{isAr ? comp.content.textAr : comp.content.textEn}</Badge></div>}
                  {comp.type === 'pdf' && <div className="flex justify-center"><a href={comp.content.url} target="_blank" className="flex items-center gap-8 p-10 rounded-[3rem] bg-white shadow-2xl border-4 border-transparent hover:border-primary transition-all"><FileText size={48} className="text-red-600" /><div><span className="text-3xl font-black text-slate-800 block">{isAr ? comp.content.labelAr : comp.content.labelEn}</span><span className="text-xs font-black text-slate-400 uppercase">Official Document <ExternalLink size={12} className="inline"/></span></div></a></div>}
                  {comp.type === 'table' && (
                    <Card className="rounded-[2rem] border-none shadow-xl overflow-hidden bg-white">
                      <Table>
                        <TableHeader className="bg-slate-900 text-white"><TableRow>{comp.content.headers?.map((h: string, idx: number) => (<TableHead key={idx} className="font-black p-6 text-white">{h}</TableHead>))}</TableRow></TableHeader>
                        <TableBody>{comp.content.rows?.map((row: any, idx: number) => (<TableRow key={idx} className="hover:bg-slate-50 transition-colors"><TableCell className="font-bold p-6">{row.c1}</TableCell><TableCell className="font-black text-emerald-600 p-6 text-center">{row.c2}</TableCell></TableRow>))}</TableBody>
                      </Table>
                    </Card>
                  )}
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
