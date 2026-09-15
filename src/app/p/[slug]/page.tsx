
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

        <div className="space-y-16">
          {page.components.map((comp, i) => (
            <motion.div 
              key={comp.id} 
              initial={{opacity:0, y:30}} 
              whileInView={{opacity:1, y:0}} 
              viewport={{once: true}}
              transition={{delay: i * 0.1}}
              className={cn("animate-in fade-in duration-700", `widget-${comp.id}`)}
            >
              {comp.customCss && (
                <style dangerouslySetInnerHTML={{ __html: comp.customCss.replace('.custom-widget', `.widget-${comp.id}`) }} />
              )}

              {comp.type === 'style' && (
                <style dangerouslySetInnerHTML={{ __html: comp.content.code }} />
              )}
              
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
                <div className="my-8 rounded-[2rem] overflow-hidden" dangerouslySetInnerHTML={{ __html: comp.content.code }} />
              )}

              {comp.type === 'info' && (
                <Card className="rounded-[3rem] border-none shadow-2xl bg-white max-w-5xl mx-auto overflow-hidden border-t-8 border-primary relative group">
                  <div className="absolute top-0 right-0 size-64 dm-wave-5 opacity-10 -rotate-45 translate-x-32 -translate-y-32" />
                  <CardContent className="p-12 md:p-20 text-center relative z-10">
                    <div className="prose prose-xl mx-auto text-slate-700 font-medium leading-loose text-2xl whitespace-pre-wrap">
                      {isAr ? comp.content.bodyAr : comp.content.bodyEn}
                    </div>
                  </CardContent>
                </Card>
              )}

              {comp.type === 'text' && (
                <div className="max-w-4xl mx-auto prose prose-xl text-slate-700 font-medium leading-relaxed whitespace-pre-wrap text-lg">
                  {isAr ? comp.content.bodyAr : comp.content.bodyEn}
                </div>
              )}

              {comp.type === 'table' && (
                <Card className="max-w-4xl mx-auto rounded-[2rem] border-none shadow-xl overflow-hidden bg-white">
                  <Table>
                    <TableHeader className="bg-slate-900 text-white">
                      <TableRow>
                        <TableHead className="font-black p-6 text-white">{comp.content.headers[0]}</TableHead>
                        <TableHead className="font-black p-6 text-center text-white">{comp.content.headers[1]}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {comp.content.rows?.map((row: any, idx: number) => (
                        <TableRow key={idx} className="hover:bg-slate-50 transition-colors">
                          <TableCell className="font-bold p-6">{row.c1}</TableCell>
                          <TableCell className="font-black text-emerald-600 p-6 text-center">{row.c2}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              )}

              {comp.type === 'accordion' && (
                <Card className="max-w-4xl mx-auto rounded-[2rem] border-none shadow-xl bg-white p-10">
                  <Accordion type="single" collapsible className="w-full">
                    {comp.content.items?.map((item: any, idx: number) => (
                      <AccordionItem key={idx} value={`item-${idx}`} className="border-slate-100 last:border-0 py-2">
                        <AccordionTrigger className="text-2xl font-black text-primary hover:text-accent transition-colors">
                          {isAr ? item.titleAr : item.titleEn}
                        </AccordionTrigger>
                        <AccordionContent className="text-xl text-slate-500 font-medium leading-loose pt-6">
                          {isAr ? item.contentAr : item.contentEn}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </Card>
              )}

              {comp.type === 'stats' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-10 max-w-6xl mx-auto text-center bg-slate-900 p-16 rounded-[4rem] text-white shadow-[0_50px_100px_rgba(0,0,0,0.2)] border-t-4 border-accent relative overflow-hidden">
                   <div className="absolute inset-0 dm-wave-5 opacity-5 pointer-events-none" />
                   <div className="space-y-4 relative z-10">
                     <h3 className="text-6xl font-black text-accent">{comp.content.v1}</h3>
                     <p className="text-xs font-black uppercase tracking-[0.3em] opacity-60">{comp.content.t1}</p>
                   </div>
                   <div className="space-y-4 relative z-10">
                     <h3 className="text-6xl font-black text-accent">{comp.content.v2}</h3>
                     <p className="text-xs font-black uppercase tracking-[0.3em] opacity-60">{comp.content.t2}</p>
                   </div>
                </div>
              )}

              {comp.type === 'pdf' && (
                <div className="flex justify-center">
                  <a href={comp.content.url} target="_blank" className="group flex items-center gap-8 p-10 rounded-[3rem] bg-white shadow-2xl hover:shadow-primary/10 transition-all border-4 border-transparent hover:border-primary">
                    <div className="p-6 bg-red-50 text-red-600 rounded-[2rem] group-hover:bg-red-600 group-hover:text-white transition-all shadow-lg"><FileText size={48} /></div>
                    <div>
                      <span className="text-3xl font-black text-slate-800 block mb-1">{isAr ? comp.content.labelAr : comp.content.labelEn}</span>
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">Official Document <ExternalLink size={12}/></span>
                    </div>
                  </a>
                </div>
              )}

              {comp.type === 'avatar' && (
                <div className="flex flex-col items-center gap-6 max-w-xs mx-auto">
                   <Avatar className="size-40 border-8 border-white shadow-2xl">
                     <AvatarImage src={comp.content.src} />
                     <AvatarFallback className="bg-primary text-white text-5xl font-black">{isAr ? comp.content.nameAr?.[0] : comp.content.nameEn?.[0]}</AvatarFallback>
                   </Avatar>
                   <div className="text-center">
                      <h4 className="text-2xl font-black text-primary">{isAr ? comp.content.nameAr : comp.content.nameEn}</h4>
                      <Badge variant="outline" className="mt-2 rounded-full border-accent text-accent font-black">Authorized Member</Badge>
                   </div>
                </div>
              )}

              {comp.type === 'badge' && (
                <div className="flex justify-center">
                  <Badge className="bg-accent text-slate-900 font-black px-6 py-2 rounded-xl text-lg">
                    {isAr ? comp.content.textAr : comp.content.textEn}
                  </Badge>
                </div>
              )}

              {comp.type === 'tabs' && (
                <Card className="max-w-6xl mx-auto rounded-[3rem] border-none shadow-2xl bg-white overflow-hidden">
                  <Tabs defaultValue="tab-0" className="w-full">
                    <TabsList className="w-full h-20 bg-slate-900 rounded-none p-0 flex">
                      {comp.content.items?.map((item: any, idx: number) => (
                        <TabsTrigger key={idx} value={`tab-${idx}`} className="flex-1 rounded-none text-white/50 data-[state=active]:bg-accent data-[state=active]:text-slate-900 font-black text-lg h-full border-x border-white/5">
                          {isAr ? item.titleAr : item.titleEn}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {comp.content.items?.map((item: any, idx: number) => (
                      <TabsContent key={idx} value={`tab-${idx}`} className="p-16 animate-in fade-in zoom-in-95 duration-500">
                        <div className="text-2xl text-slate-700 font-medium leading-loose text-center italic">
                           "{isAr ? item.contentAr : item.contentEn}"
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </Card>
              )}

              {comp.type === 'separator' && <Separator className="max-w-4xl mx-auto bg-slate-200 h-px my-12" />}
            </motion.div>
          ))}
        </div>
      </main>

      <PortalFooter siteConfig={null} />
    </div>
  );
}
