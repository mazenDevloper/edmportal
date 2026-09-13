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
  Star,
  ChevronRight,
  Volume2,
  Fingerprint,
  ShieldAlert,
  ArrowRightLeft,
  Sparkles,
  CheckCircle,
  HelpCircle,
  Plus,
  Minus,
  Info,
  ChevronLeft,
  Circle
} from 'lucide-react';
import * as Icons from 'lucide-react';
import Link from 'next/link';
import { Service, SiteConfig, CarouselItem, Course, Survey, PopupMessage } from '@/lib/types';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { textToSpeech } from '@/ai/flows/tts-flow';

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

  // Poll State
  const [currentPollQIdx, setCurrentPollQIdx] = useState(0);
  const [pollValue, setPollValue] = useState<string>("");
  const [pollAnswers, setPollAnswers] = useState<Record<string, string>>({});
  const [pollSubmitted, setPollFinished] = useState(false);

  const [services, setServices] = useState<Service[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [menuItems, setMenuItems] = useState([]);
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [popups, setPopups] = useState<PopupMessage[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchBin();
        if (data) {
          // Data Reconciliation: Gather all service IDs from both arrays
          const fetchedServices = data.services || [];
          const fetchedFlows = data.serviceFlows || [];
          const allServiceIds = Array.from(new Set([
            ...fetchedServices.map((s: any) => s.id),
            ...fetchedFlows.map((f: any) => f.serviceId || f.id)
          ])).filter(Boolean);

          const reconciled = allServiceIds.map(id => {
            const existing = fetchedServices.find((s: any) => s.id === id);
            if (existing) return existing;
            
            const flow = fetchedFlows.find((f: any) => (f.serviceId || f.id) === id);
            // Default fallbacks for common svc_ codes
            return {
              id,
              title: flow?.titleAr || (isAr ? 'خدمة بلدية' : 'Municipal Service'),
              titleEn: flow?.titleEn || 'Municipal Service',
              description: isAr ? 'هذه الخدمة متاحة للتقديم الرقمي عبر بوابة بلدية ظفار.' : 'This service is available for digital submission.',
              category: id.startsWith('svc_12') ? 'admin' : id.startsWith('svc_11') ? 'tech' : 'elec',
              iconName: 'FileText',
              isActive: true,
              reqsAr: [],
              reqsEn: [],
              fees: '10 OMR'
            } as Service;
          });

          setServices(reconciled);
          setCourses(data.courses || []);
          setSiteConfig(data.siteConfig || null);
          setMenuItems(data.menuItems || []);
          setCarouselItems(data.carouselItems || []);
          setSurveys(data.surveys || []);
          setPopups(data.popups || []);
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

  const catalogServices = useMemo(() => {
    return (services || []).filter(s => activeCategory === 'all' || s.category === activeCategory);
  }, [services, activeCategory]);

  const featuredServices = useMemo(() => (services || []).filter(s => s.isFeatured), [services]);
  const activePoll = useMemo(() => (surveys || []).find(s => s.isPublicPoll && s.isActive), [surveys]);

  const handleReadAloud = async (text: string) => {
    if (ttsLoading) return;
    setTtsLoading(true);
    try {
      const { audioDataUri } = await textToSpeech(text);
      const audio = new Audio(audioDataUri);
      audio.play();
    } catch (e) {
      console.error("TTS Error:", e);
    } finally {
      setTtsLoading(false);
    }
  };

  const currentQ = activePoll?.questions?.[currentPollQIdx];

  const handlePollNext = () => {
    if (!activePoll || !pollValue || !currentQ) return;
    const newAnswers = { ...pollAnswers, [currentQ.id]: pollValue };
    setPollAnswers(newAnswers);
    
    if (currentPollQIdx < (activePoll.questions?.length || 0) - 1) {
      setCurrentPollQIdx(currentPollQIdx + 1);
      setPollValue(newAnswers[activePoll.questions[currentPollQIdx + 1].id] || "");
    } else {
      setPollFinished(true);
    }
  };

  const handlePollBack = () => {
    if (currentPollQIdx > 0 && activePoll) {
      const prevIdx = currentPollQIdx - 1;
      setCurrentPollQIdx(prevIdx);
      setPollValue(pollAnswers[activePoll.questions[prevIdx].id] || "");
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" aria-label="Loading..." /></div>;

  return (
    <div className={cn("flex min-h-screen flex-col bg-white", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={menuItems} />
      
      <PopupManager popups={popups} />

      <main className="flex-grow" id="main-content">
        {activeTab === 'home' ? (
          <div className="space-y-0">
            {/* 1. Hero & Search */}
            <section className="py-20 bg-slate-50 relative overflow-hidden" aria-labelledby="hero-heading">
               <div className="max-w-7xl mx-auto px-6 relative z-10">
                 <div className="grid lg:grid-cols-12 gap-12 items-center">
                   <div className="lg:col-span-7">
                     <h1 id="hero-heading" className="text-5xl md:text-7xl font-black text-primary tracking-tighter mb-6">
                       {siteConfig?.heroTitle || (isAr ? "خدماتنا رقمية، أسرع، وأسهل" : "Digital Services")}
                     </h1>
                     <p className="text-xl text-slate-600 font-bold mb-10">
                       {siteConfig?.heroSubtitle || (isAr ? "بوابة بلدية ظفار الموحدة" : "Unified Portal")}
                     </p>
                     <div className="relative group max-w-xl">
                       <SearchIcon className={cn("absolute top-1/2 -translate-y-1/2 text-slate-400", isAr ? "right-6" : "left-6")} aria-hidden="true" />
                       <input 
                         type="text" 
                         placeholder={isAr ? "ابحث عن خدمة بلدية..." : "Search services..."} 
                         className={cn("w-full h-16 rounded-xl border-2 font-bold focus:border-primary px-16 shadow-lg bg-white outline-none border-slate-200")} 
                         value={searchQuery} 
                         onChange={(e) => setSearchQuery(e.target.value)} 
                         aria-label={isAr ? "البحث في الخدمات" : "Search services"}
                       />
                     </div>
                     <Button 
                       variant="ghost" 
                       className="mt-4 text-xs font-bold text-slate-500 gap-2 hover:bg-primary/5 hover:text-primary transition-colors"
                       onClick={() => handleReadAloud((siteConfig?.heroTitle || '') + ". " + (siteConfig?.heroSubtitle || ''))}
                       disabled={ttsLoading}
                       aria-label={isAr ? "استمع إلى الترحيب" : "Listen to Welcome"}
                     >
                       {ttsLoading ? <Loader2 className="animate-spin size-3" /> : <Volume2 size={14} />}
                       {isAr ? "استمع للترحيب" : "Listen to Welcome"}
                     </Button>
                   </div>

                   <div className="lg:col-span-5">
                     <Card className="border-none shadow-2xl rounded-brand bg-white relative overflow-hidden flex flex-col border-t-8 border-primary">
                       <CardHeader className="bg-slate-50 p-6 flex flex-row items-center justify-between border-b">
                         <div className="flex items-center gap-3">
                           <div className="p-2.5 rounded-xl bg-primary text-white shadow-lg">
                             <Fingerprint className="size-6" />
                           </div>
                           <div>
                             <CardTitle className="font-black text-sm text-primary">{isAr ? "مركز الهوية الرقمية (ثقة)" : "Digital Identity Hub (Theqa)"}</CardTitle>
                             <CardDescription className="text-[10px] font-bold text-slate-600">{isAr ? "نظام المصادقة الوطنية الموحد" : "Unified National Auth"}</CardDescription>
                           </div>
                         </div>
                         <Badge className={cn("rounded-full border-none px-3 py-1 font-black text-[10px] transition-colors", pkiStatus === 'connected' ? "bg-emerald-700 text-white" : "bg-amber-700 text-white")}>
                           {pkiStatus === 'connected' ? (isAr ? "نشط آمن" : "Active & Secure") : (isAr ? "غير متصل" : "Not Linked")}
                         </Badge>
                       </CardHeader>
                       
                       <CardContent className="p-8 space-y-6">
                         <div className="flex justify-center py-4 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100 relative group transition-all hover:bg-white hover:border-primary/20">
                            <div className="relative w-48 h-20">
                               <Image 
                                 src="https://gov.om/documents/20117/254616/FLIPPED-Theqa-HomePage.png/3a21164e-8832-38df-f66b-6780161591d2?t=1788817339796"
                                 alt="Theqa National Digital Identity Logo"
                                 fill
                                 className="object-contain"
                                 priority
                               />
                            </div>
                         </div>

                         <div className="space-y-4">
                            <p className="text-sm text-slate-700 font-bold leading-relaxed">
                              {isAr 
                                ? "أهلاً بك في بوابة بلدية ظفار المعتمدة. نظام ثقة يمنحك وصولاً آمناً وفورياً لجميع الخدمات الحكومية دون الحاجة لإدخال بياناتك يدوياً."
                                : "Welcome to the Dhofar Municipality Accredited Portal. Theqa provides secure, instant access to all services without manual data entry."}
                            </p>

                            {showThiqaDetails && (
                              <div className="space-y-4 pt-4 border-t animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="grid grid-cols-1 gap-3">
                                  {[
                                    { step: 1, icon: <Fingerprint size={16}/>, textAr: "تفعيل الهوية الرقمية عبر تطبيق ثقة بالهاتف.", textEn: "Activate digital ID via Theqa mobile app." },
                                    { step: 2, icon: <ShieldCheck size={16}/>, textAr: "المصادقة باستخدام شريحة الهاتف أو البطاقة الشخصية.", textEn: "Authenticate via SIM PKI or National ID." },
                                    { step: 3, icon: <ArrowRightLeft size={16}/>, textAr: "الدخول التلقائي والآمن للخدمات البلدية.", textEn: "Seamless entry to municipal e-services." }
                                  ].map((item) => (
                                    <div key={item.step} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                      <div className="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black shrink-0">{item.step}</div>
                                      <p className="text-[11px] font-bold text-slate-700">{isAr ? item.textAr : item.textEn}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="flex flex-col gap-3 pt-4">
                              <Button 
                                variant="outline" 
                                className="w-full h-12 rounded-xl font-black text-primary border-primary hover:bg-primary/5 gap-2"
                                onClick={() => setShowThiqaDetails(!showThiqaDetails)}
                              >
                                {showThiqaDetails ? <Minus size={16}/> : <Plus size={16}/>}
                                {isAr ? "معلومات إضافية عن ثقة" : "More about Theqa"}
                              </Button>
                              <Button 
                                className="w-full h-12 dm-gradient-primary rounded-xl font-black shadow-lg gap-2"
                                onClick={() => setPkiStatus(pkiStatus === 'connected' ? 'disconnected' : 'connected')}
                              >
                                <Fingerprint size={18} />
                                {isAr ? "تبديل حالة الدخول الرقمي (محاكاة)" : "Toggle Digital Entry (Sim)"}
                              </Button>
                            </div>
                         </div>
                       </CardContent>
                     </Card>
                   </div>
                 </div>
               </div>
               <div className="absolute top-0 right-0 w-1/2 h-full dm-wave-5 opacity-10 pointer-events-none" />
            </section>

            {/* 3. Search Results */}
            {searchQuery && (
              <section className="py-12 bg-white border-b animate-in fade-in slide-in-from-top-4 duration-500" aria-label={isAr ? "نتائج البحث" : "Search Results"}>
                <div className="max-w-7xl mx-auto px-6">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="h-8 w-1.5 bg-accent rounded-full" aria-hidden="true" />
                    <h2 className="text-2xl font-black text-primary">
                      {isAr ? `نتائج البحث عن "${searchQuery}"` : `Search results for "${searchQuery}"`}
                    </h2>
                  </div>
                  {filteredServices.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                      {filteredServices.map(s => <ServiceCardEnhanced key={s.id} service={s} isAr={isAr} />)}
                    </div>
                  ) : (
                    <div className="text-center py-12 border-2 border-dashed rounded-3xl">
                      <p className="text-slate-500 font-bold">{isAr ? "لم يتم العثور على خدمات" : "No services found"}</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* 4. Featured Services */}
            {featuredServices.length > 0 && (
              <section className="py-20 bg-white" aria-labelledby="featured-services-title">
                <div className="max-w-7xl mx-auto px-6">
                  <div className="flex items-center gap-3 mb-12">
                    <Star className="text-accent fill-accent" size={24} aria-hidden="true" />
                    <h2 id="featured-services-title" className="text-3xl font-black text-primary">{isAr ? "الخدمات الأكثر استخداماً" : "Most Used Services"}</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                    {featuredServices.map(s => <ServiceCardEnhanced key={s.id} service={s} isAr={isAr} />)}
                  </div>
                </div>
              </section>
            )}

            {/* 5. Public Poll / Survey Section */}
            {activePoll && activePoll.questions?.length > 0 && (
              <section className="py-20 bg-accent/5" aria-labelledby="public-poll-title">
                <div className="max-w-4xl mx-auto px-6 text-center">
                  {!pollSubmitted ? (
                    <>
                      <div className="mb-8">
                        <Badge className="bg-accent text-white mb-4">{isAr ? "صوتك يهمنا" : "Your Voice Matters"}</Badge>
                        <h2 id="public-poll-title" className="text-3xl font-black text-primary mb-4">{isAr ? activePoll.titleAr : activePoll.titleEn}</h2>
                        <p className="text-slate-600 font-bold">{isAr ? activePoll.descriptionAr : activePoll.descriptionEn}</p>
                      </div>
                      <Card className="rounded-brand border-none shadow-xl overflow-hidden">
                        <CardContent className="p-8">
                          {currentQ && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                              <div className="flex flex-col items-center gap-4">
                                <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black">
                                  {currentPollQIdx + 1}
                                </div>
                                <h3 className="text-2xl font-black flex items-center justify-center gap-3 text-primary">
                                  {currentQ.iconName && React.createElement((Icons as any)[currentQ.iconName] || Icons.Info, { className: "text-accent", "aria-hidden": "true" })}
                                  {isAr ? currentQ.questionAr : currentQ.questionEn}
                                </h3>
                              </div>
                              
                              <RadioGroup 
                                className="grid sm:grid-cols-2 gap-4" 
                                value={pollValue} 
                                onValueChange={setPollValue}
                                aria-label={isAr ? currentQ.questionAr : currentQ.questionEn}
                              >
                                {currentQ.options?.map((opt) => (
                                  <div key={opt.id} className="relative">
                                    <RadioGroupItem value={opt.id} id={opt.id} className="sr-only" />
                                    <Label 
                                      htmlFor={opt.id} 
                                      className={cn(
                                        "flex items-center gap-4 p-5 border-2 rounded-2xl cursor-pointer transition-all font-bold text-slate-700",
                                        pollValue === opt.id 
                                          ? "border-primary bg-primary/5 text-primary scale-[1.02] shadow-md" 
                                          : "border-slate-100 bg-white hover:border-primary/30"
                                      )}
                                    >
                                      <div className={cn(
                                        "size-5 rounded-full border-2 flex items-center justify-center transition-colors",
                                        pollValue === opt.id ? "border-primary" : "border-slate-300"
                                      )}>
                                        {pollValue === opt.id && <div className="size-2.5 rounded-full bg-primary" />}
                                      </div>
                                      {opt.icon && React.createElement((Icons as any)[opt.icon] || Icons.Circle, { size: 20, className: pollValue === opt.id ? "text-primary" : "text-slate-400", "aria-hidden": "true" })}
                                      <span className="text-lg">{isAr ? opt.textAr : opt.textEn}</span>
                                    </Label>
                                  </div>
                                ))}
                              </RadioGroup>
                              
                              <div className="flex justify-between items-center pt-8 border-t">
                                <Button 
                                  variant="ghost" 
                                  onClick={handlePollBack} 
                                  disabled={currentPollQIdx === 0}
                                  className="rounded-full font-black px-8 h-12 gap-2"
                                >
                                  {isAr ? <ChevronRight /> : <ChevronLeft />}
                                  {isAr ? "السابق" : "Back"}
                                </Button>
                                <Button 
                                  onClick={handlePollNext} 
                                  disabled={!pollValue}
                                  className="dm-gradient-primary rounded-full px-12 h-14 font-black shadow-lg gap-2"
                                >
                                  {currentPollQIdx === (activePoll.questions?.length || 0) - 1 ? (isAr ? "إرسال التصويت" : "Submit Poll") : (isAr ? "التالي" : "Next")}
                                  {currentPollQIdx !== (activePoll.questions?.length || 0) - 1 && (isAr ? <ChevronLeft /> : <ChevronRight />)}
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <Card className="rounded-brand border-none shadow-xl py-20 px-8 text-center animate-in zoom-in-95 duration-500">
                      <div className="size-24 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-8">
                        <CheckCircle size={48} />
                      </div>
                      <h2 className="text-4xl font-black text-primary mb-4">{isAr ? "شكراً لمشاركتك" : "Thank You!"}</h2>
                      <p className="text-xl text-slate-600 font-bold mb-10">{isAr ? "رأيك يساهم في تحسين جودة خدماتنا البلدية." : "Your feedback helps us improve our municipal services."}</p>
                      <Button variant="outline" onClick={() => setPollFinished(false)} className="rounded-full font-black px-10 border-primary text-primary">
                        {isAr ? "عودة" : "Go Back"}
                      </Button>
                    </Card>
                  )}
                </div>
              </section>
            )}

            {/* 6. Carousel Banner */}
            {carouselItems.length > 0 && (
              <section className="relative group overflow-hidden" aria-label={isAr ? "إعلانات البوابة" : "Portal Banners"}>
                <Carousel className="w-full" opts={{ loop: true }}>
                  <CarouselContent>
                    {carouselItems.map(item => (
                      <CarouselItemUI key={item.id}>
                        <div className="relative h-[500px] w-full flex items-center justify-center">
                          <Image 
                            src={item.imageUrl || "https://picsum.photos/seed/dhofar/1200/600"} 
                            alt="" 
                            fill 
                            className="object-cover brightness-[0.4]" 
                            data-ai-hint="scenic landscape"
                          />
                          <div className="relative z-10 text-center text-white px-6 max-w-4xl">
                            <h2 className="text-5xl md:text-7xl font-black mb-6 drop-shadow-2xl">{isAr ? item.titleAr : item.titleEn}</h2>
                            <p className="text-xl md:text-2xl font-bold opacity-90 mb-10">{isAr ? item.subtitleAr : item.subtitleEn}</p>
                            <Button className="dm-gradient-primary rounded-full px-12 h-14 text-lg font-black shadow-2xl">
                              {isAr ? 'استكشف الآن' : 'Explore Now'}
                            </Button>
                          </div>
                        </div>
                      </CarouselItemUI>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-8" aria-label={isAr ? "السابق" : "Previous slide"} />
                  <CarouselNext className="right-8" aria-label={isAr ? "التالي" : "Next slide"} />
                </Carousel>
              </section>
            )}

            {/* 7. Stats */}
            <section className="py-24 bg-primary text-white relative overflow-hidden" aria-label={isAr ? "إحصائيات المنصة" : "Platform Stats"}>
               <div className="max-w-7xl mx-auto px-6 relative z-10">
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
                    <div className="space-y-2">
                       <TrendingUp className="mx-auto text-accent mb-4" size={40} aria-hidden="true" />
                       <h3 className="text-5xl font-black">{siteConfig?.stats?.transactions || '0'}+</h3>
                       <p className="text-sm font-bold opacity-90 tracking-widest uppercase">{isAr ? 'معاملة رقمية' : 'Transactions'}</p>
                    </div>
                    <div className="space-y-2">
                       <ShieldCheck className="mx-auto text-accent mb-4" size={40} aria-hidden="true" />
                       <h3 className="text-5xl font-black">{siteConfig?.stats?.permits || '0'}+</h3>
                       <p className="text-sm font-bold opacity-90 tracking-widest uppercase">{isAr ? 'رخصة بناء' : 'Permits'}</p>
                    </div>
                    <div className="space-y-2">
                       <FileText className="mx-auto text-accent mb-4" size={40} aria-hidden="true" />
                       <h3 className="text-5xl font-black">{siteConfig?.stats?.permits || '0'}+</h3>
                       <p className="text-sm font-bold opacity-90 tracking-widest uppercase">{isAr ? 'عقد إيجار' : 'Leases'}</p>
                    </div>
                    <div className="space-y-2">
                       <Users className="mx-auto text-accent mb-4" size={40} aria-hidden="true" />
                       <h3 className="text-5xl font-black">{siteConfig?.stats?.tickets || '0'}+</h3>
                       <p className="text-sm font-bold opacity-90 tracking-widest uppercase">{isAr ? 'تذكرة دعم' : 'Tickets'}</p>
                    </div>
                 </div>
               </div>
               <div className="absolute inset-0 dm-wave-5 opacity-10" aria-hidden="true" />
            </section>

            {/* 8. Catalog */}
            <section className="py-24 bg-white" aria-labelledby="catalog-title">
              <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
                   <div>
                     <h2 id="catalog-title" className="text-4xl font-black text-primary mb-2">{isAr ? "دليل الخدمات الإلكترونية" : "Service Catalog"}</h2>
                     <p className="text-slate-600 font-bold">{isAr ? "استكشف كافة الخدمات البلدية المتاحة رقمياً" : "Explore all municipal services"}</p>
                   </div>
                   <nav className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto" aria-label={isAr ? "فئات الخدمات" : "Service Categories"}>
                     {['all', ...Object.keys(CAT_CONFIG)].map(cid => (
                       <Button 
                        key={cid} 
                        onClick={() => setActiveCategory(cid)} 
                        variant={activeCategory === cid ? 'default' : 'outline'} 
                        className={cn("rounded-full font-black px-8 h-12 transition-all", activeCategory === cid ? "dm-gradient-primary" : "text-primary border-primary")}
                      >
                         {cid === 'all' ? (isAr ? 'الكل' : 'All') : (isAr ? CAT_CONFIG[cid as CategoryId].labelAr : CAT_CONFIG[cid as CategoryId].labelEn)}
                       </Button>
                     ))}
                   </nav>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {catalogServices.map(s => <ServiceCardEnhanced key={s.id} service={s} isAr={isAr} />)}
                </div>
              </div>
            </section>

            {/* 9. Identity Showcase */}
            <section className="py-24 bg-white border-t" aria-label={isAr ? "دليل الهوية" : "Identity Guide"}>
              <div className="max-w-7xl mx-auto px-6 text-center">
                <Button onClick={() => setActiveTab('identity')} className="h-16 px-12 rounded-full font-black text-xl dm-gradient-primary shadow-xl">
                  {isAr ? "دليل الهوية البصرية والمكونات" : "Visual Identity & Components Guide"}
                </Button>
              </div>
            </section>
          </div>
        ) : <IdentityShowcase isAr={isAr} />}
      </main>

      <PortalFooter siteConfig={siteConfig} />
    </div>
  );
}
