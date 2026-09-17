
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  ArrowUpRight,
  CheckCircle2,
  Megaphone,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import Link from 'next/link';
import { Service, SiteConfig, CarouselItem, Survey, PopupMessage, NewsItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { PopupManager } from '@/components/popup-manager';
import { motion, AnimatePresence } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import * as Icons from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem as CarouselItemUI,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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
  const [news, setNews] = useState<NewsItem[]>([]);
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
          setNews(data.news || []);
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
    <div className={cn("flex min-h-screen flex-col bg-white", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={menuItems} />
      
      <PopupManager popups={popups} />

      <main className="flex-grow" id="main-content">
     
        {/* Hero & Search */}
        <section className="py-24 bg-slate-50 relative overflow-hidden">
           <div className="max-w-7xl mx-auto px-6 relative z-10">
             <div className="grid lg:grid-cols-12 gap-16 items-center">
               <motion.div initial={{opacity:0, x:-50}} animate={{opacity:1, x:0}} transition={{duration:0.8}} className="lg:col-span-7">
                 <h1 className="text-6xl md:text-8xl font-black text-[#008E91] tracking-tighter mb-8 leading-[0.9]">
                   {siteConfig?.heroTitle || (isAr ? "خدماتنا رقمية، أسرع، وأسهل" : "Digital Services")}
                 </h1>
                 <p className="text-2xl text-slate-500 font-bold mb-12 max-w-xl leading-relaxed">
                   {siteConfig?.heroSubtitle || (isAr ? "بوابة بلدية ظفار الموحدة لخدمة المواطن والمقيم وفق رؤية عُمان 2040." : "Unified Portal Serving Dhofar.")}
                 </p>
                 
                 <div className="space-y-8 max-w-2xl">
                   <div className="relative group scale-105">
                     <SearchIcon className={cn("absolute top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors", isAr ? "right-6" : "left-6")} size={24} />
                     <input 
                       type="text" 
                       placeholder={isAr ? "ابحث عن خدمة بلدية..." : "Search services..."} 
                       className={cn("w-full h-20 rounded-[2.5rem] border-2 font-black text-xl focus:border-primary px-16 shadow-2xl bg-white outline-none border-slate-100 transition-all focus:ring-8 focus:ring-primary/5")} 
                       value={searchQuery} 
                       onChange={(e) => setSearchQuery(e.target.value)} 
                     />
                   </div>

                   <div>
                     <div className="flex items-center justify-between mb-6">
                        <h3 className="text-[10px] font-black text-[#470D67] uppercase tracking-[0.2em] flex items-center gap-3">
                          <div className="size-2 bg-[#03CFCB] rounded-full animate-ping" />
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
                                    className="group flex items-center gap-5 p-4 bg-white border-2 border-transparent rounded-[1.5rem] shadow-lg hover:shadow-2xl hover:border-primary/20 transition-all"
                                  >
                                    <div className="size-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                                      <IconComp size={24} />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                      <p className="text-sm font-black text-slate-800 truncate group-hover:text-primary">
                                        {isAr ? s.title : (s.titleEn || s.title)}
                                      </p>
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isAr ? "وصول مباشر" : "Direct Access"}</p>
                                    </div>
                                    <ArrowUpRight size={18} className="text-slate-300 group-hover:text-primary transition-all" />
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
                 <div className="absolute -inset-24 dm-pattern-matrix-all opacity-15 pointer-events-none scale-110 group-hover:scale-125 transition-transform duration-1000" />
                 
                 <div className="border-none shadow-[0_30px_100px_rgba(0,0,0,0.1)] rounded-[4rem] bg-white relative overflow-hidden flex flex-col border-t-[14px] border-primary">
                   <div className="p-12 space-y-10 relative z-10">
                     <div className="flex items-center justify-between">
                       <div className="flex items-center gap-5">
                         <div className="p-5 rounded-3xl bg-primary text-white shadow-2xl">
                           <Fingerprint className="size-10" />
                         </div>
                         <div>
                           <h4 className="font-black text-2xl text-slate-800">{isAr ? "الهوية الرقمية (ثقة)" : "Neural ID (Theqa)"}</h4>
                           <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">{isAr ? "نظام المصادقة الوطنية الموحد" : "Unified National Auth"}</p>
                         </div>
                       </div>
                       <Badge className={cn("rounded-full border-none px-6 py-2 font-black text-[10px] transition-all", pkiStatus === 'connected' ? "bg-emerald-600 text-white shadow-lg" : "bg-amber-600 text-white shadow-lg")}>
                         {pkiStatus === 'connected' ? (isAr ? "نشط وآمن" : "Active & Secure") : (isAr ? "غير مفعل" : "Disconnected")}
                       </Badge>
                     </div>
                     
                     <div className="space-y-8">
                        <p className="text-lg text-slate-700 font-bold leading-relaxed text-center italic">
                          {isAr 
                            ? "نظام ثقة يمنحك وصولاً فورياً لكافة الخدمات الحكومية دون الحاجة لإدخال بياناتك يدوياً."
                            : "Theqa provides instant, secure access to all e-services without manual data entry."}
                        </p>
                        <Button 
                          className="w-full h-20 dm-gradient-primary rounded-[2rem] font-black shadow-2xl gap-5 text-xl transition-transform hover:scale-[1.02]"
                          onClick={() => setPkiStatus(pkiStatus === 'connected' ? 'disconnected' : 'connected')}
                        >
                          <Fingerprint size={28} />
                          {isAr ? "تسجيل دخول رقمي آمن" : "Secure Digital Sign-In"}
                        </Button>
                     </div>
                   </div>
                 </div>
               </motion.div>
             </div>
           </div>
        </section>

        {/* Dynamic Survey & News Matrix Section - 50/50 Grid */}
        <section className="py-24 bg-white relative overflow-hidden border-y border-slate-100">
           <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-stretch">
              {/* Left Column: Citizen Survey (50% width widget) */}
              <div className="flex flex-col justify-center h-full">
                {activeSurvey ? (
                  <div className="space-y-8 h-full flex flex-col justify-center">
                     <div className="space-y-4">
                       <Badge className="bg-[#470D67] text-white font-black px-8 py-2.5 rounded-2xl text-md shadow-xl">{isAr ? "صوتك يهمنا" : "Public Sentiment"}</Badge>
                       <h3 className="text-5xl font-black text-slate-900 leading-[1.1] tracking-tighter">
                         {isAr ? activeSurvey.titleAr : activeSurvey.titleEn}
                       </h3>
                     </div>

                     <div className="rounded-[4rem] border-none shadow-[0_30px_80px_rgba(0,0,0,0.05)] bg-slate-50 p-12 overflow-hidden relative group ring-1 ring-slate-100">
                        <div className="relative z-10 space-y-10">
                          {activeSurvey.questions.slice(0, 2).map((q, qIdx) => (
                            <div key={q.id} className="space-y-6">
                              <h5 className="text-xl font-black text-[#470D67] leading-tight">
                                {qIdx + 1}. {isAr ? q.questionAr : q.questionEn}
                              </h5>
                              <div className="grid grid-cols-1 gap-3">
                                {q.type === 'mcq' && q.options?.map((opt, i) => (
                                  <Button 
                                    key={i} 
                                    variant={surveyResponse[q.id] === opt.textEn ? "default" : "outline"}
                                    className={cn(
                                      "h-14 rounded-2xl justify-between px-6 font-bold border-2 transition-all text-md",
                                      surveyResponse[q.id] === opt.textEn ? "bg-primary text-white border-primary shadow-xl scale-[1.02]" : "bg-white hover:border-primary/30 shadow-sm"
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
                        </div>
                        <div className="absolute top-0 right-0 size-80 dm-pattern-matrix-all opacity-5 -rotate-45 translate-x-32 -translate-y-32 pointer-events-none" />
                     </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full bg-slate-50 rounded-[4rem] border-2 border-dashed border-slate-200 p-20 text-center">
                    <p className="text-slate-400 font-black text-xl italic">{isAr ? "لا توجد استطلاعات نشطة حالياً" : "No active surveys at this time"}</p>
                  </div>
                )}
              </div>

              {/* Right Column: News Matrix Carousel (50% width immersive widget) */}
              <div className="relative rounded-[4.5rem] overflow-hidden min-h-[650px] group shadow-[0_50px_100px_rgba(0,0,0,0.15)] border-t-[12px] border-primary">
                <Carousel className="w-full h-full" opts={{ loop: true }}>
                  <CarouselContent className="h-full -ml-0">
                    {(news.length > 0 ? news : [
                      { id: '1', titleAr: 'افتتاح مشاريع الطرق الجديدة', contentAr: 'بلدية ظفار تدشن حزمة من مشاريع رصف الطرق بالمحافظة.', imageUrl: 'https://oman-daily.com/wp-content/uploads/2023/12/Dhofar-Roads.jpg' },
                    ]).map((item) => (
                      <CarouselItemUI key={item.id} className="h-full pl-0 relative">
                        <div className="relative w-full h-[650px]">
                           <img 
                             src={item.imageUrl} 
                             alt={item.titleAr} 
                             className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                           />
                           <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />
                           <div className="absolute inset-0 dm-pattern-matrix-all opacity-20 pointer-events-none mix-blend-overlay" />
                           <div className="absolute inset-x-0 bottom-0 p-16 space-y-6">
                              <Badge className="bg-primary text-white font-black px-6 py-1.5 rounded-full uppercase text-[10px] tracking-[0.3em] shadow-2xl">
                                {isAr ? "مصفوفة الأخبار" : "MATRIX NEWS"}
                              </Badge>
                              <h4 className="text-5xl font-black text-white leading-[0.9] tracking-tighter drop-shadow-2xl">
                                {isAr ? item.titleAr : item.titleEn}
                              </h4>
                              <p className="text-white/70 font-bold text-xl max-w-lg line-clamp-3 leading-relaxed">
                                {isAr ? item.contentAr : item.contentEn}
                              </p>
                              <div className="pt-6">
                                <Button className="bg-white text-slate-900 font-black rounded-2xl px-10 h-14 shadow-2xl hover:bg-primary hover:text-white transition-all text-lg group/btn">
                                  {isAr ? "التفاصيل الكاملة" : "Full Story"}
                                  <ChevronRight size={20} className={cn("inline ml-2 transition-transform group-hover/btn:translate-x-2", isAr && "rotate-180")} />
                                </Button>
                              </div>
                           </div>
                        </div>
                      </CarouselItemUI>
                    ))}
                  </CarouselContent>
                  <div className="absolute top-1/2 -translate-y-1/2 inset-x-6 flex justify-between pointer-events-none">
                     <CarouselPrevious className="relative pointer-events-auto size-14 rounded-3xl bg-white/10 hover:bg-white/30 border-white/20 text-white backdrop-blur-xl shadow-2xl" />
                     <CarouselNext className="relative pointer-events-auto size-14 rounded-3xl bg-white/10 hover:bg-white/30 border-white/20 text-white backdrop-blur-xl shadow-2xl" />
                  </div>
                </Carousel>
              </div>
           </div>
        </section>

        {/* 100% Width Banner Section (Under News Matrix) */}
        {carouselItems.length > 0 && (
          <section className="py-12 bg-white">
            <div className="max-w-7xl mx-auto px-6">
               <div className="rounded-[4.5rem] overflow-hidden shadow-2xl relative h-[400px] group">
                  <Carousel className="w-full h-full" opts={{ loop: true }}>
                    <CarouselContent className="h-full -ml-0">
                      {carouselItems.map(banner => (
                        <CarouselItemUI key={banner.id} className="h-full pl-0 relative">
                           <img src={banner.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="" />
                           <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-20 text-center">
                              <div className="space-y-6">
                                <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter drop-shadow-xl">{isAr ? banner.titleAr : banner.titleEn}</h2>
                                <Button className="dm-gradient-primary rounded-full px-12 h-14 font-black shadow-2xl">{isAr ? 'اكتشف المزيد' : 'Explore Now'}</Button>
                              </div>
                           </div>
                        </CarouselItemUI>
                      ))}
                    </CarouselContent>
                  </Carousel>
               </div>
            </div>
          </section>
        )}

        {/* Stats Section */}
        <section className="py-24 bg-[#470D67] text-white relative overflow-hidden">
           <div className="max-w-7xl mx-auto px-6 relative z-10">
             <div className="grid grid-cols-2 md:grid-cols-4 gap-16 text-center">
                {[
                  { icon: <TrendingUp/>, val: 25000, labelAr: 'معاملة رقمية', labelEn: 'Digital Transactions' },
                  { icon: <ShieldCheck/>, val: 4200, labelAr: 'رخصة بناء', labelEn: 'Building Permits' },
                  { icon: <FileText/>, val: 8500, labelAr: 'عقد إيجار', labelEn: 'Lease Contracts' },
                  { icon: <Users/>, val: 12000, labelAr: 'مستفيد نشط', labelEn: 'Active Citizens' },
                ].map((stat, i) => (
                  <div key={i} className="space-y-4">
                     <div className="mx-auto text-[#03CFCB] mb-6 p-5 rounded-[2rem] bg-white/10 w-fit ring-1 ring-white/20 shadow-2xl animate-float">{React.cloneElement(stat.icon as any, {size: 40})}</div>
                     <h3 className="text-6xl font-black flex items-center justify-center gap-1 tracking-tighter">
                       <Link href="/identity">{stat.val.toLocaleString()}</Link>
                       <span className="text-[#03CFCB]">+</span>
                     </h3>
                     <p className="text-[11px] font-black opacity-60 tracking-[0.4em] uppercase">{isAr ? stat.labelAr : stat.labelEn}</p>
                  </div>
                ))}
             </div>
           </div>
           <div className="absolute inset-0 dm-pattern-wave-pro opacity-10 bg-repeat-x scale-150 translate-y-20 pointer-events-none" />
        </section>
      </main>

      <PortalFooter siteConfig={siteConfig} />
    </div>
  );
}
