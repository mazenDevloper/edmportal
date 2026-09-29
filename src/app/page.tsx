'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { fetchBin, updateBin } from '@/lib/jsonbin';
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
  Send
} from 'lucide-react';
import Link from 'next/link';
import { VrHeadsetIcon } from '@/components/vr-headset-icon';
import { Service, SiteConfig, CarouselItem, Survey, PopupMessage, NewsItem } from '@/lib/types';
import { isPublicService } from '@/lib/service-visibility';
import { cn } from '@/lib/utils';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { PopupManager } from '@/components/popup-manager';
import { motion, AnimatePresence } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import * as Icons from 'lucide-react';
import { ServiceIcon } from '@/components/service/service-icon';
import {
  Carousel,
  CarouselContent,
  CarouselItem as CarouselItemUI,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { maskPhone, useCitizen, useCitizenSession } from '@/lib/citizen-session';
import { BrandEmblem } from '@/components/brand-logo';
import { TrackLookup } from '@/components/citizen/track-lookup';
import { TransactionFigures } from '@/components/open-data/transaction-figures';


/** News photo with a branded fallback when there is no image or it fails to load */
function NewsImage({ src }: { src?: string }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-[#005751] via-[#008E91] to-[#470D67] relative">
        <div aria-hidden className="absolute inset-0 dm-pattern-landmark opacity-20" />
        <span className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30"><BrandEmblem height={120} onDark /></span>
      </div>
    );
  }
  return <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />;
}

export default function DhofarPortal() {
  const { language } = useSettingsStore();
  const { toast } = useToast();
  const isAr = language === 'ar';

  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [submittingSurvey, setSubmittingSurvey] = useState(false);
  const citizen = useCitizen();
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
          // Services switched off in the control panel are hidden from the public
          setServices((data.services || []).filter(isPublicService));
          setSiteConfig(data.siteConfig || null);
          setMenuItems(data.menuItems || []);
          setCarouselItems(data.carouselItems || []);
          setNews(data.news || []);
          setPopups(data.popups || []);
          setSurveys(data.surveys || []);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const activeSurvey = useMemo(() => surveys.find(s => s.isActive), [surveys]);

  const featuredServices = useMemo(() => {
    const s = (services || []).filter(s => s.isFeatured).slice(0, 6);
    return s.length > 0 ? s : (services || []).slice(0, 6);
  }, [services]);

  const filteredQuickAccess = useMemo(() => {
    if (!searchQuery) return featuredServices;
    return services.filter(s => 
      (isAr ? s.title : (s.titleEn || s.title)).toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 6);
  }, [services, searchQuery, isAr, featuredServices]);

  const handleSurveySubmit = async () => {
    if (!activeSurvey) return;
    setSubmittingSurvey(true);
    try {
      // Simulate submission
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast({
        title: isAr ? "تم استلام رأيك بنجاح" : "Sentiment Received",
        description: isAr ? "شكراً لمساهمتك في تطوير خدمات بلدية ظفار." : "Thank you for helping us improve Dhofar Municipality services."
      });
      setSurveyResponse({});
    } finally {
      setSubmittingSurvey(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-primary" size={40} /></div>;

  return (
    <div className={cn("flex min-h-screen flex-col bg-white", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={menuItems} />
      <PopupManager popups={popups} />

      <main className="flex-grow" id="main-content">
        {/* Hero Section */}
        <section className="py-24 bg-slate-50 relative overflow-hidden">
           <div className="max-w-7xl mx-auto px-6 relative z-10">
             <div className="grid lg:grid-cols-12 gap-16 items-center">
               <motion.div initial={{opacity:0, x:-50}} animate={{opacity:1, x:0}} className="lg:col-span-7">
                 <h1 className="text-6xl md:text-8xl font-black text-primary tracking-tighter mb-8 leading-[0.9]">
                   {isAr ? (siteConfig?.heroTitle || "خدماتنا رقمية، أسرع، وأسهل") : (siteConfig?.meta?.titleEn || "Digital Services, Faster & Easier")}
                 </h1>
                 <p className="text-2xl text-slate-500 font-bold mb-12 max-w-xl leading-relaxed">
                   {isAr ? (siteConfig?.heroSubtitle || "بوابة بلدية ظفار الموحدة لخدمة المواطن والمقيم وفق رؤية عُمان 2040.") : (siteConfig?.meta?.descriptionEn || "Dhofar Municipality unified portal serving citizens and residents under Oman Vision 2040.")}
                 </p>
                 
                 <div className="space-y-8 max-w-2xl">
                   <div className="relative group">
                     <SearchIcon className={cn("absolute top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors", isAr ? "right-6" : "left-6")} size={24} />
                     <input 
                       type="text" 
                       placeholder={isAr ? "ابحث عن خدمة بلدية..." : "Search municipal services..."} 
                       className={cn("w-full h-20 rounded-[2.5rem] border-2 font-black text-xl focus:border-primary px-16 shadow-2xl bg-white outline-none border-slate-100 transition-all")} 
                       value={searchQuery} 
                       onChange={(e) => setSearchQuery(e.target.value)} 
                     />
                   </div>

                   <Link href="/virtual" className="inline-flex items-center gap-2 h-12 px-6 rounded-2xl bg-gradient-to-r from-[#0b4f86] to-[#020d1c] text-white font-black shadow-xl hover:shadow-[0_0_30px_rgba(3,207,203,0.4)] transition-shadow"><VrHeadsetIcon size={22} />{isAr ? 'العرض الافتراضي' : 'Virtual view'}</Link>

                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {filteredQuickAccess.map((s) => {
                        return (
                          <Link key={s.id} href={`/services/${s.id}`} className="group flex items-center gap-5 p-4 bg-white border-2 border-transparent rounded-[1.5rem] shadow-lg hover:border-primary/20 transition-all">
                            <div className="size-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                              <ServiceIcon service={s} size={24} />
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <p className="text-sm font-black text-slate-800 truncate">{isAr ? s.title : (s.titleEn || s.title)}</p>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{isAr ? "وصول مباشر" : "Direct Access"}</p>
                            </div>
                          </Link>
                        );
                      })}
                   </div>
                 </div>
               </motion.div>

               <motion.div initial={{opacity:0, scale:0.8}} animate={{opacity:1, scale:1}} className="lg:col-span-5 relative">
                 <div className="absolute -inset-20 dm-pattern-matrix-all opacity-10 pointer-events-none" />
                 <div className="border-none shadow-[0_30px_100px_rgba(0,0,0,0.1)] rounded-[4rem] bg-white relative overflow-hidden flex flex-col border-t-[14px] border-primary p-12 space-y-10">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-5">
                         <div className="p-5 rounded-3xl bg-primary text-white shadow-2xl"><Fingerprint size={40}/></div>
                         <div>
                           <h4 className="font-black text-2xl text-slate-800">{isAr ? "الهوية الرقمية (ثقة)" : "Neural ID (Thiqa)"}</h4>
                           <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{isAr ? "نظام المصادقة الوطنية" : "National Auth System"}</p>
                         </div>
                       </div>
                       <Badge className={cn("rounded-full border-none px-6 py-2 font-black text-[10px]", citizen ? "bg-emerald-600 text-white" : "bg-slate-500 text-white")}>
                         {citizen ? (isAr ? "مسجل الدخول" : "Signed in") : (isAr ? "غير مسجل" : "Signed out")}
                       </Badge>
                    </div>
                    {citizen ? (
                      <div className="flex items-center justify-between gap-3 p-5 rounded-[2rem] bg-emerald-50">
                        <p className="font-black text-emerald-800">{isAr ? "مسجل عبر ثقة" : "Signed in with Thiqa"} <span dir="ltr" className="font-mono">{maskPhone(citizen)}</span></p>
                        <Button variant="ghost" onClick={() => useCitizenSession.getState().signOut()} className="font-black text-slate-600">{isAr ? "خروج" : "Sign out"}</Button>
                      </div>
                    ) : (
                      <Button onClick={() => useCitizenSession.getState().openPrompt()} className="w-full h-20 dm-gradient-primary rounded-[2rem] font-black shadow-2xl gap-5 text-xl">
                        <Fingerprint size={28} /> {isAr ? "تسجيل الدخول عبر ثقة" : "Sign in with Thiqa"}
                      </Button>
                    )}
                    <div className="pt-8 border-t border-slate-100 space-y-3">
                      <h2 className="font-black text-xl text-slate-800">{isAr ? "الاستعلام عن حالة معاملة" : "Track a request"}</h2>
                      <TrackLookup isAr={isAr} compact />
                    </div>
                 </div>
               </motion.div>
             </div>
           </div>
        </section>

        {/* Transaction figures: live rent contracts and excavation permits from open data, plus official figures */}
        <TransactionFigures isAr={isAr} stats={siteConfig?.stats} />

        {/* 50/50 Survey & News Matrix */}
        <section className="py-24 bg-white border-y border-slate-100">
           <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-stretch">
              <div className="flex flex-col justify-center h-full space-y-8">
                {activeSurvey ? (
                  <>
                     <div className="space-y-4">
                       <Badge className="bg-secondary text-white font-black px-8 py-2.5 rounded-2xl text-md shadow-xl">{isAr ? "صوتك يهمنا" : "Public Sentiment"}</Badge>
                       <h3 className="text-5xl font-black text-slate-900 tracking-tighter">{isAr ? activeSurvey.titleAr : activeSurvey.titleEn}</h3>
                     </div>
                     <div className="rounded-[4rem] bg-slate-50 p-12 overflow-hidden relative group ring-1 ring-slate-100">
                        <div className="relative z-10 space-y-10">
                          {activeSurvey.questions.slice(0, 2).map((q, qIdx) => (
                            <div key={q.id} className="space-y-6">
                              <h5 className="text-xl font-black text-secondary">{qIdx + 1}. {isAr ? q.questionAr : q.questionEn}</h5>
                              <div className="grid grid-cols-1 gap-3">
                                {q.type === 'mcq' && q.options?.map((opt, i) => (
                                  <Button key={i} variant={surveyResponse[q.id] === (opt.textEn || opt.textAr) ? "default" : "outline"} className={cn("h-14 rounded-2xl justify-between px-6 font-bold border-2 transition-all", surveyResponse[q.id] === (opt.textEn || opt.textAr) ? "bg-primary text-white border-primary shadow-xl" : "bg-white hover:border-primary/30")} onClick={() => setSurveyResponse({...surveyResponse, [q.id]: opt.textEn || opt.textAr})}>
                                    {isAr ? opt.textAr : opt.textEn}
                                    {surveyResponse[q.id] === (opt.textEn || opt.textAr) ? <CheckCircle2 size={20} /> : <div className="size-5 rounded-full border-2 border-slate-200" />}
                                  </Button>
                                ))}
                                {q.type === 'text' && (
                                  <Textarea 
                                    placeholder={isAr ? "اكتب رأيك هنا..." : "Type your feedback here..."}
                                    className="bg-white rounded-2xl min-h-[120px] font-bold border-2 focus:border-primary p-4"
                                    value={surveyResponse[q.id] || ''}
                                    onChange={(e) => setSurveyResponse({...surveyResponse, [q.id]: e.target.value})}
                                  />
                                )}
                              </div>
                            </div>
                          ))}
                          <Button 
                            onClick={handleSurveySubmit} 
                            disabled={submittingSurvey || Object.keys(surveyResponse).length === 0} 
                            className="w-full h-16 dm-gradient-primary rounded-2xl font-black shadow-xl gap-3 text-lg mt-4"
                          >
                            {submittingSurvey ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                            {isAr ? "إرسال رأيي للمجلس" : "Submit My Sentiment"}
                          </Button>
                        </div>
                        <div className="absolute top-0 right-0 size-80 dm-pattern-matrix-all opacity-5 -rotate-45 pointer-events-none" />
                     </div>
                  </>
                ) : <div className="flex items-center justify-center h-full bg-slate-50 rounded-[4rem] border-2 border-dashed border-slate-200 p-20 text-center text-slate-400 font-black italic">{isAr ? "لا توجد استطلاعات نشطة حالياً" : "No active surveys"}</div>}
              </div>

              <div className="relative rounded-[4.5rem] overflow-hidden min-h-[650px] shadow-2xl border-t-[12px] border-primary group">
                <Carousel className="w-full h-full" opts={{ loop: true, direction: isAr ? 'rtl' : 'ltr' }}>
                  <CarouselContent className="h-full -ml-0">
                    {(news.length > 0 ? news : [{ id: '1', titleAr: 'بوابة بلدية ظفار الموحدة', titleEn: 'Unified Dhofar Municipality Portal', contentAr: 'نرحب بكم في النظام الرقمي المطور.', contentEn: 'Welcome to the enhanced digital system.', imageUrl: 'https://picsum.photos/seed/oman1/1200/800' }]).map((item) => (
                      <CarouselItemUI key={item.id} className="h-full pl-0 relative">
                        <div className="relative w-full h-[650px]">
                           <NewsImage src={item.imageUrl} />
                           {/* Darken only the lower part, behind the text, so the photo stays visible */}
                           <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent" />
                           <div className="absolute inset-x-0 bottom-0 p-8 md:p-12 space-y-4">
                              <Badge className="bg-primary text-white font-black px-6 py-1.5 rounded-full uppercase text-[10px] tracking-widest shadow-2xl">{isAr ? 'الأخبار' : 'News'}</Badge>
                              <h4 className="text-3xl md:text-4xl font-black text-white leading-tight drop-shadow-2xl">{isAr ? item.titleAr : (item.titleEn || item.titleAr)}</h4>
                              <p className="text-white/85 font-bold text-lg max-w-lg line-clamp-2 leading-relaxed">{isAr ? item.contentAr : (item.contentEn || item.contentAr)}</p>
                              <Button className="bg-white text-slate-900 font-black rounded-2xl px-10 h-14 shadow-2xl hover:bg-primary hover:text-white transition-all text-lg group/btn">
                                {isAr ? "التفاصيل" : "Details"} <ChevronRight size={20} className={cn("inline ml-2 transition-transform group-hover/btn:translate-x-2", isAr && "rotate-180")} />
                              </Button>
                           </div>
                        </div>
                      </CarouselItemUI>
                    ))}
                  </CarouselContent>
                </Carousel>
              </div>
           </div>
        </section>

        {/* 100% Width Banner Section */}
        {carouselItems.length > 0 && (
          <section className="py-12 bg-white">
            <div className="max-w-7xl mx-auto px-6">
               <div className="rounded-[4.5rem] overflow-hidden shadow-2xl relative h-[400px] group">
                  <Carousel className="w-full h-full" opts={{ loop: true, direction: isAr ? 'rtl' : 'ltr' }}>
                    <CarouselContent className="h-full -ml-0">
                      {carouselItems.map(banner => (
                        <CarouselItemUI key={banner.id} className="h-full pl-0 relative">
                           {banner.imageUrl ? (
                             <img src={banner.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="" />
                           ) : (
                             <div className="w-full h-full bg-slate-100" />
                           )}
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
      </main>
      <PortalFooter siteConfig={siteConfig} />
    </div>
  );
}
