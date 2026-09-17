'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { fetchBin } from '@/lib/jsonbin';
import { useSettingsStore } from '@/lib/settings-store';
import { 
  Search as SearchIcon, 
  Loader2, 
  TrendingUp,
  ShieldCheck,
  FileText,
  Users,
  Fingerprint,
  Plus,
  Minus,
  ArrowUpRight,
  Megaphone,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { Service, SiteConfig, CarouselItem, Survey, PopupMessage } from '@/lib/types';
import { cn } from '@/lib/utils';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { PopupManager } from '@/components/popup-manager';
import {
  Carousel,
  CarouselContent,
  CarouselItem as CarouselItemUI,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import CountUp from 'react-countup';
import { motion, AnimatePresence } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import * as Icons from 'lucide-react';

export default function DhofarPortal() {
  const { language } = useSettingsStore();
  const isAr = language === 'ar';

  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [pkiStatus, setPkiStatus] = useState<'connected' | 'disconnected'>('connected');
  const [services, setServices] = useState<Service[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [menuItems, setMenuItems] = useState([]);
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
  const [popups, setPopups] = useState<PopupMessage[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [surveyResponse, setSurveyResponse] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchBin();
        if (data) {
          setServices(data.services || []);
          setSiteConfig(data.siteConfig || null);
          setMenuItems(data.menuItems || []);
          setCarouselItems(data.carouselItems || []);
          setPopups(data.popups || []);
          setSurveys(data.surveys || []);
        }
      } catch (err) {
        console.error("Home Load Error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const activeSurvey = useMemo(() => surveys.find(s => s.isActive), [surveys]);

  const featuredServices = useMemo(() => {
    const s = (services || []).filter(s => s.isFeatured).slice(0, 6);
    if (s.length > 0) return s;
    return (services || []).slice(0, 6);
  }, [services]);

  const filteredQuickAccess = useMemo(() => {
    if (!searchQuery) return featuredServices;
    return services.filter(s => 
      (isAr ? s.title : (s.titleEn || s.title)).toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 6);
  }, [services, searchQuery, isAr, featuredServices]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-primary" size={40} /></div>;

  return (
    <div className={cn("flex min-h-screen flex-col bg-white")}>
      <PortalHeader menuItems={menuItems} />
      
      <PopupManager popups={popups} />

      <main className="flex-grow" id="main-content">
        {/* Hero & Search */}
        <section className="py-24 bg-slate-50 relative overflow-hidden">
           <div className="max-w-7xl mx-auto px-6 relative z-10">
             <div className="grid lg:grid-cols-12 gap-16 items-center">
               <motion.div initial={{opacity:0, x:-50}} animate={{opacity:1, x:0}} transition={{duration:0.8}} className="lg:col-span-7">
                 <h1 className="text-6xl md:text-8xl font-black text-primary tracking-tighter mb-8 leading-[0.9]">
                   {siteConfig?.heroTitle || (isAr ? "خدماتنا رقمية، أسرع، وأسهل" : "Digital Services")}
                 </h1>
                 <p className="text-2xl text-slate-500 font-bold mb-12 max-w-xl leading-relaxed">
                   {siteConfig?.heroSubtitle || (isAr ? "بوابة بلدية ظفار الموحدة لخدمة المواطن والمقيم وفق رؤية عُمان 2040." : "Unified Portal Serving Dhofar.")}
                 </p>
                 
                 <div className="space-y-8 max-w-2xl">
                   <div className="relative group scale-105">
                     <SearchIcon className={cn("absolute top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-accent transition-colors", isAr ? "right-6" : "left-6")} size={24} />
                     <input 
                       type="text" 
                       placeholder={isAr ? "ابحث عن خدمة بلدية..." : "Search services..."} 
                       className={cn("w-full h-20 rounded-[2rem] border-2 font-black text-xl focus:border-accent px-16 shadow-2xl bg-white outline-none border-slate-100 transition-all focus:ring-8 focus:ring-accent/10")} 
                       value={searchQuery} 
                       onChange={(e) => setSearchQuery(e.target.value)} 
                     />
                   </div>

                   <div>
                     <div className="flex items-center justify-between mb-6">
                        <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-3">
                          <div className="size-2 bg-accent rounded-full animate-ping" />
                          {searchQuery ? (isAr ? "نتائج البحث" : "Search Results") : (isAr ? "الخدمات الأكثر طلباً" : "Top Municipal Services")}
                        </h3>
                     </div>
                     
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <AnimatePresence mode="popLayout">
                          {filteredQuickAccess.map((s, idx) => {
                            const IconComp = (Icons as any)[s.iconName] || Icons.FileText;
                            return (
                              <motion.div initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.9}} transition={{delay: idx * 0.05}} key={s.id}>
                                <Tilt tiltMaxAngleX={10} tiltMaxAngleY={10} scale={1.02}>
                                  <Link 
                                    href={`/services/${s.id}`}
                                    className="group flex items-center gap-5 p-4 bg-white border-2 border-transparent rounded-[1.5rem] shadow-lg hover:shadow-2xl hover:border-accent/30 transition-all"
                                  >
                                    <div className="size-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center shrink-0 group-hover:bg-accent group-hover:text-slate-900 transition-colors">
                                      <IconComp size={24} />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                      <p className="text-sm font-black text-slate-800 truncate group-hover:text-primary">
                                        {isAr ? s.title : (s.titleEn || s.title)}
                                      </p>
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isAr ? "وصول مباشر" : "Direct Access"}</p>
                                    </div>
                                    <ArrowUpRight size={18} className="text-slate-300 group-hover:text-accent transition-all" />
                                  </Link>
                                </Tilt>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                     </div>
                   </div>
                 </div>
               </motion.div>

               <motion.div initial={{opacity:0, scale:0.8}} animate={{opacity:1, scale:1}} transition={{duration:1}} className="lg:col-span-5 relative group">
                 <div className="absolute -inset-24 dm-pattern-matrix-all opacity-20 pointer-events-none scale-125 -z-10 group-hover:scale-150 transition-transform duration-1000" />
                 
                 <Card className="border-none shadow-[0_30px_80px_rgba(0,0,0,0.15)] rounded-[3rem] bg-white/90 backdrop-blur-sm relative overflow-hidden flex flex-col border-t-[12px] border-primary">
                   <CardContent className="p-10 space-y-8 relative z-10">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-4">
                         <div className="p-3.5 rounded-2xl bg-primary text-white shadow-xl">
                           <Fingerprint className="size-8" />
                         </div>
                         <div>
                           <h4 className="font-black text-lg text-primary">{isAr ? "الهوية الرقمية (ثقة)" : "Neural ID (Theqa)"}</h4>
                           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{isAr ? "نظام المصادقة الوطنية الموحد" : "Unified National Auth"}</p>
                         </div>
                       </div>
                       <Badge className={cn("rounded-full border-none px-4 py-1.5 font-black text-[9px] transition-all", pkiStatus === 'connected' ? "bg-emerald-600 text-white" : "bg-amber-600 text-white")}>
                         {pkiStatus === 'connected' ? (isAr ? "نشط وآمن" : "Active & Secure") : (isAr ? "غير مفعل" : "Disconnected")}
                       </Badge>
                     </div>
                     
                     <div className="space-y-6">
                        <p className="text-sm text-slate-700 font-bold leading-relaxed text-center">
                          {isAr 
                            ? "نظام ثقة يمنحك وصولاً فورياً لكافة الخدمات الحكومية دون الحاجة لإدخال بياناتك يدوياً."
                            : "Theqa provides instant, secure access to all e-services without manual data entry."}
                        </p>
                        <Button 
                          className="w-full h-16 dm-gradient-primary rounded-2xl font-black shadow-2xl gap-4 text-lg"
                          onClick={() => setPkiStatus(pkiStatus === 'connected' ? 'disconnected' : 'connected')}
                        >
                          <Fingerprint size={24} />
                          {isAr ? "تسجيل دخول رقمي آمن" : "Secure Digital Sign-In"}
                        </Button>
                     </div>
                   </CardContent>
                 </Card>
               </motion.div>
             </div>
           </div>
        </section>

        {/* Dynamic Survey Section */}
        {activeSurvey && (
          <section className="py-24 bg-white relative overflow-hidden">
             <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">
                <div className="space-y-8">
                   <Badge className="bg-primary text-white font-black px-6 py-2 rounded-xl text-md">{isAr ? "شاركنا رأيك" : "Citizen Opinion"}</Badge>
                   <h3 className="text-5xl font-black text-primary leading-tight">
                     {isAr ? activeSurvey.titleAr : activeSurvey.titleEn}
                   </h3>
                   <p className="text-xl text-slate-500 font-bold leading-relaxed">
                     {isAr ? "مشاركتك تساهم في صياغة مستقبل الخدمات الرقمية لبلدية ظفار." : "Your feedback shapes the future of Dhofar's digital services."}
                   </p>
                </div>

                <Card className="rounded-[3rem] border-none shadow-2xl bg-slate-50 p-10 overflow-hidden relative group">
                  <div className="relative z-10 space-y-8">
                    {activeSurvey.questions.map((q, qIdx) => (
                      <div key={q.id} className="space-y-6">
                        <h5 className="text-xl font-black text-primary leading-relaxed">
                          {qIdx + 1}. {isAr ? q.questionAr : q.questionEn}
                        </h5>
                        <div className="grid grid-cols-1 gap-3">
                          {q.type === 'mcq' && q.options?.map((opt, i) => (
                            <Button 
                              key={i} 
                              variant={surveyResponse[q.id] === opt.textEn ? "default" : "outline"}
                              className={cn(
                                "h-14 rounded-2xl justify-between px-6 font-black border-2 transition-all",
                                surveyResponse[q.id] === opt.textEn ? "bg-primary text-white border-primary" : "bg-white hover:border-accent hover:bg-accent/5"
                              )}
                              onClick={() => setSurveyResponse({...surveyResponse, [q.id]: opt.textEn})}
                            >
                              {isAr ? opt.textAr : opt.textEn}
                              {surveyResponse[q.id] === opt.textEn ? <CheckCircle2 size={20} /> : <div className="size-5 rounded-full border-2 border-slate-200" />}
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                    <Button className="w-full h-16 dm-gradient-primary rounded-2xl font-black text-lg shadow-xl uppercase tracking-widest">
                       {isAr ? "إرسال التصويت" : "Submit Poll"}
                    </Button>
                  </div>
                  <div className="absolute top-0 right-0 size-64 dm-wave opacity-5 -rotate-45 translate-x-32 -translate-y-32 pointer-events-none" />
                </Card>
             </div>
          </section>
        )}

        {/* Stats Section */}
        <section className="py-24 bg-primary text-white relative overflow-hidden">
           <div className="max-w-7xl mx-auto px-6 relative z-10">
             <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
                {[
                  { icon: <TrendingUp/>, val: 25000, labelAr: 'معاملة رقمية', labelEn: 'Digital Transactions' },
                  { icon: <ShieldCheck/>, val: 4200, labelAr: 'رخصة بناء', labelEn: 'Building Permits' },
                  { icon: <FileText/>, val: 8500, labelAr: 'عقد إيجار', labelEn: 'Lease Contracts' },
                  { icon: <Users/>, val: 12000, labelAr: 'مستفيد نشط', labelEn: 'Active Citizens' },
                ].map((stat, i) => (
                  <div key={i} className="space-y-3">
                     <div className="mx-auto text-accent mb-4 p-4 rounded-3xl bg-white/10 w-fit">{React.cloneElement(stat.icon as any, {size: 32})}</div>
                     <h3 className="text-5xl font-black flex items-center justify-center gap-1">
                       <CountUp end={stat.val} duration={3} enableScrollSpy scrollSpyOnce />
                       <span className="text-accent">+</span>
                     </h3>
                     <p className="text-[10px] font-black opacity-60 tracking-[0.2em] uppercase">{isAr ? stat.labelAr : stat.labelEn}</p>
                  </div>
                ))}
             </div>
           </div>
        </section>
      </main>

      <PortalFooter siteConfig={siteConfig} />
    </div>
  );
}