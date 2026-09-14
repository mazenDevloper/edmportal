
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { fetchBin } from '@/lib/jsonbin';
import { CAT_CONFIG, CategoryId } from '@/lib/constants';
import { useSettingsStore } from '@/lib/settings-store';
import { 
  Search as SearchIcon, 
  Loader2, 
  TrendingUp,
  ShieldCheck,
  FileText,
  Users,
  Fingerprint,
  ArrowRight,
  Plus,
  Minus,
  ArrowUpRight,
  Megaphone
} from 'lucide-react';
import * as Icons from 'lucide-react';
import Link from 'next/link';
import { Service, SiteConfig, CarouselItem, Survey, PopupMessage } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ServiceCardEnhanced } from '@/components/service-card-enhanced';
import { IdentityShowcase } from '@/components/identity-showcase';
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
import { textToSpeech } from '@/ai/flows/tts-flow';
import CountUp from 'react-countup';
import { motion, AnimatePresence } from 'framer-motion';
import Tilt from 'react-parallax-tilt';

export default function DhofarPortal() {
  const { language } = useSettingsStore();
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [pkiStatus, setPkiStatus] = useState<'connected' | 'disconnected'>('connected');
  const [showThiqaDetails, setShowThiqaDetails] = useState(false);

  const [services, setServices] = useState<Service[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [menuItems, setMenuItems] = useState([]);
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [popups, setPopups] = useState<PopupMessage[]>([]);
  const [newsTicker, setNewsTicker] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchBin();
        if (data) {
          const fetchedServices = (data.services || []).filter(Boolean);
          const fetchedFlows = (data.serviceFlows || []).filter(Boolean);
          
          const allServiceIds = Array.from(new Set([
            ...fetchedServices.map((s: any) => s.id),
            ...fetchedFlows.map((f: any) => f.serviceId || f.id)
          ])).filter(Boolean);

          const reconciled = allServiceIds.map(id => {
            const existing = fetchedServices.find((s: any) => s.id === id);
            const flow = fetchedFlows.find((f: any) => (f.serviceId || f.id) === id);
            
            // DYNAMIC REQUIREMENT EXTRACTION
            const docs: string[] = [];
            if (flow) {
              flow.steps?.forEach((step: any) => {
                const title = (step.titleAr || '').toLowerCase();
                const isDocStep = title.includes('مستند') || title.includes('وثائق');
                step.fields?.forEach((f: any) => {
                  if (f.type === 'upload' || isDocStep) {
                    const label = isAr ? (f.labelAr || f.labelEn) : (f.labelEn || f.labelAr);
                    if (label) docs.push(label);
                  }
                });
              });
            }
            
            const staticReqs = isAr ? (existing?.reqsAr || []) : (existing?.reqsEn || []);
            const dynamicReqs = Array.from(new Set([...staticReqs, ...docs])).filter(Boolean);

            if (existing) {
              return { 
                ...existing, 
                [isAr ? 'reqsAr' : 'reqsEn']: dynamicReqs 
              };
            }
            
            return {
              id,
              title: flow?.titleAr || (isAr ? 'خدمة بلدية' : 'Municipal Service'),
              titleEn: flow?.titleEn || 'Municipal Service',
              description: isAr ? 'هذه الخدمة متاحة للتقديم الرقمي عبر بوابة بلدية ظفار.' : 'This service is available for digital submission.',
              category: 'elec',
              iconName: 'FileText',
              isActive: true,
              reqsAr: isAr ? dynamicReqs : [],
              reqsEn: isAr ? [] : dynamicReqs,
              fees: '10 OMR',
              isFeatured: false
            } as Service;
          });

          setServices(reconciled);
          setSiteConfig(data.siteConfig || null);
          setMenuItems(data.menuItems || []);
          setCarouselItems(data.carouselItems || []);
          setSurveys(data.surveys || []);
          setPopups(data.popups || []);
          setNewsTicker(data.newsTickerText || '');
        }
      } catch (err) {
        console.error("Home Load Error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAr]);

  const filteredServices = useMemo(() => {
    if (!searchQuery) return [];
    return (services || []).filter(s => {
      const title = (isAr ? s.title : (s.titleEn || s.title || '')).toLowerCase();
      const desc = (isAr ? s.description : (s.descriptionEn || s.description || '')).toLowerCase();
      const query = searchQuery.toLowerCase();
      return title.includes(query) || desc.includes(query);
    });
  }, [services, searchQuery, isAr]);

  const featuredServices = useMemo(() => (services || []).filter(s => s.isFeatured), [services]);

  const displayedQuickAccess = useMemo(() => {
    if (searchQuery) return filteredServices.slice(0, 6);
    return featuredServices.slice(0, 6);
  }, [searchQuery, filteredServices, featuredServices]);

  const catalogServices = useMemo(() => {
    return (services || []).filter(s => activeCategory === 'all' || s.category === activeCategory);
  }, [services, activeCategory]);

  if (loading) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-primary" size={40} /></div>;

  return (
    <div className={cn("flex min-h-screen flex-col bg-white", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={menuItems} />
      
      <PopupManager popups={popups} />

      <main className="flex-grow" id="main-content">
        {activeTab === 'home' ? (
          <div className="space-y-0">
            {/* 1. Hero & Search */}
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

                       <div className="animate-in fade-in slide-in-from-top-4 duration-700">
                         <div className="flex items-center justify-between mb-6">
                            <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-3">
                              <div className="size-2 bg-accent rounded-full animate-ping" />
                              {searchQuery ? (isAr ? "نتائج البحث الفورية" : "Neural Search Results") : (isAr ? "الخدمات الأكثر طلباً" : "Top Municipal Services")}
                              {searchQuery && <Badge variant="outline" className="bg-accent/10 border-accent/20 text-accent font-black">{filteredServices.length}</Badge>}
                            </h3>
                         </div>
                         
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <AnimatePresence mode="popLayout">
                              {displayedQuickAccess.map((s, idx) => {
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

                   <motion.div initial={{opacity:0, scale:0.8}} animate={{opacity:1, scale:1}} transition={{duration:1}} className="lg:col-span-5">
                     <Card className="border-none shadow-[0_30px_80px_rgba(0,0,0,0.15)] rounded-[3rem] bg-white relative overflow-hidden flex flex-col border-t-[12px] border-primary">
                       <CardHeader className="bg-slate-50 p-8 flex flex-row items-center justify-between border-b">
                         <div className="flex items-center gap-4">
                           <div className="p-3.5 rounded-2xl bg-primary text-white shadow-xl">
                             <Fingerprint className="size-8" />
                           </div>
                           <div>
                             <CardTitle className="font-black text-lg text-primary">{isAr ? "الهوية الرقمية (ثقة)" : "Neural ID (Theqa)"}</CardTitle>
                             <CardDescription className="text-xs font-bold text-slate-500">{isAr ? "نظام المصادقة الوطنية الموحد" : "Unified National Security"}</CardDescription>
                           </div>
                         </div>
                         <Badge className={cn("rounded-full border-none px-4 py-1.5 font-black text-[10px] transition-all", pkiStatus === 'connected' ? "bg-emerald-600 text-white" : "bg-amber-600 text-white")}>
                           {pkiStatus === 'connected' ? (isAr ? "نشط وآمن" : "Active & Secure") : (isAr ? "غير متصل" : "Not Linked")}
                         </Badge>
                       </CardHeader>
                       
                       <CardContent className="p-10 space-y-8">
                         <div className="flex justify-center py-8 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200 relative group transition-all hover:bg-white hover:border-accent/40">
                            <div className="relative w-64 h-24">
                               <Image 
                                 src="https://gov.om/documents/20117/254616/FLIPPED-Theqa-HomePage.png/3a21164e-8832-38df-f66b-6780161591d2?t=1788817339796"
                                 alt="Theqa National Digital Identity Logo"
                                 fill
                                 className="object-contain"
                                 priority
                               />
                            </div>
                         </div>

                         <div className="space-y-6">
                            <p className="text-md text-slate-700 font-bold leading-loose text-center">
                              {isAr 
                                ? "نظام ثقة يمنحك وصولاً فورياً لكافة الخدمات الحكومية دون الحاجة لإدخال بياناتك يدوياً، مع حماية فائقة لخصوصيتك."
                                : "Theqa provides instant, secure access to all e-services without manual data entry."}
                            </p>

                            <div className="flex flex-col gap-4">
                              <Button 
                                variant="outline" 
                                className="w-full h-14 rounded-2xl font-black text-primary border-primary hover:bg-primary/5 gap-3 transition-all"
                                onClick={() => setShowThiqaDetails(!showThiqaDetails)}
                              >
                                {showThiqaDetails ? <Minus size={20}/> : <Plus size={20}/>}
                                {isAr ? "كيفية التفعيل والاستخدام" : "How to Activate"}
                              </Button>
                              <Button 
                                className="w-full h-16 dm-gradient-primary rounded-2xl font-black shadow-2xl gap-4 text-lg"
                                onClick={() => setPkiStatus(pkiStatus === 'connected' ? 'disconnected' : 'connected')}
                              >
                                <Fingerprint size={24} />
                                {isAr ? "تسجيل دخول رقمي آمن" : "Secure Digital Sign-In"}
                              </Button>
                            </div>
                         </div>
                       </CardContent>
                     </Card>
                   </motion.div>
                 </div>
               </div>
               <div className="absolute top-0 right-0 w-1/2 h-full dm-wave-5 opacity-10 pointer-events-none" />
            </section>

            {/* 2. Stats Section with CountUp */}
            <section className="py-24 bg-primary text-white relative overflow-hidden">
               <div className="max-w-7xl mx-auto px-6 relative z-10">
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
                    {[
                      { icon: <TrendingUp/>, val: siteConfig?.stats?.transactions || 25000, labelAr: 'معاملة رقمية', labelEn: 'Digital Transactions' },
                      { icon: <ShieldCheck/>, val: siteConfig?.stats?.permits || 4200, labelAr: 'رخصة بناء', labelEn: 'Building Permits' },
                      { icon: <FileText/>, val: siteConfig?.stats?.contracts || 8500, labelAr: 'عقد إيجار', labelEn: 'Lease Contracts' },
                      { icon: <Users/>, val: siteConfig?.stats?.tickets || 12000, labelAr: 'مستفيد نشط', labelEn: 'Active Citizens' },
                    ].map((stat, i) => (
                      <div key={i} className="space-y-3">
                         <div className="mx-auto text-accent mb-4 p-4 rounded-3xl bg-white/10 w-fit shrink-0">{React.cloneElement(stat.icon as any, {size: 32})}</div>
                         <h3 className="text-5xl font-black flex items-center justify-center gap-1">
                           <CountUp end={stat.val} duration={3} enableScrollSpy scrollSpyOnce />
                           <span className="text-accent">+</span>
                         </h3>
                         <p className="text-[10px] font-black opacity-60 tracking-[0.2em] uppercase">{isAr ? stat.labelAr : stat.labelEn}</p>
                      </div>
                    ))}
                 </div>
               </div>
               <div className="absolute inset-0 dm-wave-5 opacity-5" />
            </section>

            {/* 3. Catalog Section */}
            <section className="py-24 bg-white">
              <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
                   <div className="space-y-4">
                     <Badge className="bg-accent/10 text-accent font-black border-none rounded-lg px-4 py-1.5">{isAr ? "بوابة الخدمات الشاملة" : "Global Service Hub"}</Badge>
                     <h2 className="text-5xl font-black text-primary tracking-tighter">{isAr ? "دليل الخدمات الإلكترونية" : "Service Catalog Matrix"}</h2>
                     <p className="text-slate-500 font-bold max-w-xl">{isAr ? "استكشف كافة الخدمات البلدية المتاحة رقمياً عبر نظامنا الموحد." : "Explore all municipal services available digitally."}</p>
                   </div>
                   <nav className="flex gap-2 overflow-x-auto pb-4 w-full md:w-auto no-scrollbar">
                     {['all', ...Object.keys(CAT_CONFIG)].map(cid => (
                       <Button 
                        key={cid} 
                        onClick={() => setActiveCategory(cid)} 
                        variant={activeCategory === cid ? 'default' : 'outline'} 
                        className={cn("rounded-full font-black px-10 h-14 transition-all whitespace-nowrap", activeCategory === cid ? "dm-gradient-primary shadow-xl" : "text-primary border-primary border-2 hover:bg-primary/5")}
                      >
                         {cid === 'all' ? (isAr ? 'كافة الخدمات' : 'All Services') : (isAr ? CAT_CONFIG[cid as CategoryId].labelAr : CAT_CONFIG[cid as CategoryId].labelEn)}
                       </Button>
                     ))}
                   </nav>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                  {catalogServices.map(s => <ServiceCardEnhanced key={s.id} service={s} isAr={isAr} />)}
                </div>
              </div>
            </section>

            {/* 4. Banner Carousel */}
            {carouselItems.length > 0 && (
              <section className="relative group overflow-hidden border-y-[20px] border-slate-50">
                <Carousel className="w-full" opts={{ loop: true }}>
                  <CarouselContent>
                    {carouselItems.map(item => (
                      <CarouselItemUI key={item.id}>
                        <div className="relative h-[650px] w-full flex items-center justify-center">
                          {item.imageUrl && (
                            <Image 
                              src={item.imageUrl || "https://picsum.photos/seed/dhofar/1200/600"} 
                              alt="" 
                              fill 
                              className="object-cover brightness-[0.3]" 
                              priority
                              unoptimized={item.imageUrl?.includes('brave.com') || item.imageUrl?.includes('omandaily')}
                            />
                          )}
                          <div className="relative z-10 text-center text-white px-6 max-w-5xl">
                            <motion.h2 initial={{y:30, opacity:0}} whileInView={{y:0, opacity:1}} className="text-6xl md:text-8xl font-black mb-8 drop-shadow-2xl tracking-tighter">{isAr ? item.titleAr : item.titleEn}</motion.h2>
                            <motion.p initial={{y:30, opacity:0}} whileInView={{y:0, opacity:1}} transition={{delay:0.2}} className="text-2xl md:text-3xl font-bold opacity-80 mb-12 leading-relaxed">{isAr ? item.subtitleAr : item.subtitleEn}</motion.p>
                            <Button className="dm-gradient-primary rounded-full px-16 h-16 text-xl font-black shadow-[0_20px_50px_rgba(3,207,203,0.3)]">
                              {isAr ? 'ابدأ الخدمة الآن' : 'Start Service Now'}
                            </Button>
                          </div>
                        </div>
                      </CarouselItemUI>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-12 size-12 bg-white/10 border-white/20 text-white hover:bg-accent hover:text-slate-900" />
                  <CarouselNext className="right-12 size-12 bg-white/10 border-white/20 text-white hover:bg-accent hover:text-slate-900" />
                </Carousel>
              </section>
            )}

            {/* 5. Community Feedback */}
            <section className="py-24 bg-slate-950 text-white relative overflow-hidden">
               <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-20 items-center">
                  <div className="space-y-8">
                     <Badge className="bg-accent text-slate-900 font-black px-6 py-2 rounded-xl text-md">{isAr ? "أخبار البلدية" : "Breaking News"}</Badge>
                     <h3 className="text-5xl font-black leading-tight">{isAr ? "مواكبة دائمة لمشاريع التطوير في محافظة ظفار" : "Continuous Development Projects in Dhofar."}</h3>
                     <div className="space-y-6">
                        {[
                          { date: '24 May', text: isAr ? 'افتتاح مشروع رصف الطرق في منطقة صحلنوت الشمالية.' : 'Opening of the paving project in Sahalnoot.' },
                          { date: '18 May', text: isAr ? 'بلدية ظفار تطلق حملة التفتيش الصحي السنوية لموسم الخريف.' : 'Health inspection campaign for Khareef season.' },
                        ].map((news, i) => (
                          <div key={i} className="flex gap-6 p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group">
                             <div className="text-accent font-black text-sm shrink-0 uppercase tracking-widest">{news.date}</div>
                             <p className="font-bold text-lg group-hover:text-accent transition-colors">{news.text}</p>
                          </div>
                        ))}
                     </div>
                  </div>

                  <Card className="rounded-[3rem] border-none shadow-2xl bg-white text-slate-900 p-10 overflow-hidden relative">
                    <div className="relative z-10 space-y-8">
                       <div className="flex items-center gap-4">
                          <div className="size-14 rounded-3xl bg-accent text-slate-900 flex items-center justify-center shadow-lg"><Megaphone size={28}/></div>
                          <div>
                             <h4 className="text-2xl font-black text-primary">{isAr ? "صوتك يهمنا" : "Voice of Citizen"}</h4>
                             <p className="text-sm font-bold text-slate-400">{isAr ? "ساهم في تحسين جودة خدماتنا" : "Help us improve quality"}</p>
                          </div>
                       </div>
                       <div className="space-y-6">
                          <h5 className="text-xl font-bold leading-relaxed">{isAr ? "ما هي أكثر قناة تفضلها للتواصل مع بلدية ظفار؟" : "What is your preferred contact channel?"}</h5>
                          <div className="grid grid-cols-1 gap-3">
                             {['تطبيق الهاتف', 'البوابة الإلكترونية', 'مركز الاتصال 1771', 'زيارة المبنى'].map((opt, i) => (
                               <Button key={i} variant="outline" className="h-14 rounded-2xl justify-between px-6 font-black border-2 hover:border-accent hover:bg-accent/5">
                                  {opt}
                                  <div className="size-5 rounded-full border-2 border-slate-200" />
                               </Button>
                             ))}
                          </div>
                          <Button className="w-full h-16 dm-gradient-primary rounded-2xl font-black text-lg shadow-xl">{isAr ? "إرسال التصويت" : "Submit Poll"}</Button>
                       </div>
                    </div>
                    <div className="absolute top-0 right-0 size-64 dm-wave-5 opacity-10 -rotate-45 translate-x-32 -translate-y-32" />
                  </Card>
               </div>
               <div className="absolute bottom-0 left-0 w-full h-1/2 dm-wave-5 opacity-5 pointer-events-none" />
            </section>
          </div>
        ) : <IdentityShowcase isAr={isAr} />}
      </main>

      <PortalFooter siteConfig={siteConfig} />
    </div>
  );
}
