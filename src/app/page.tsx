
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
  Minus
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
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [pkiStatus, setPkiStatus] = useState<'connected' | 'disconnected'>('connected');
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const [services, setServices] = useState<Service[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [menuItems, setMenuItems] = useState([]);
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [popups, setPopups] = useState<PopupMessage[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await fetchBin();
      if (data) {
        setServices(data.services || []);
        setCourses(data.courses || []);
        setSiteConfig(data.siteConfig || null);
        setMenuItems(data.menuItems || []);
        setCarouselItems(data.carouselItems || []);
        setSurveys(data.surveys || []);
        setPopups(data.popups || []);
      }
      setLoading(false);
    };
    load();
  }, []);

  const isAr = language === 'ar';

  const filteredServices = useMemo(() => {
    if (!searchQuery) return [];
    return services.filter(s => {
      const title = (isAr ? s.title : (s.titleEn || s.title || '')).toLowerCase();
      const desc = (isAr ? s.description : (s.descriptionEn || s.description || '')).toLowerCase();
      const query = searchQuery.toLowerCase();
      return title.includes(query) || desc.includes(query);
    });
  }, [services, searchQuery, isAr]);

  const catalogServices = useMemo(() => {
    return services.filter(s => activeCategory === 'all' || s.category === activeCategory);
  }, [services, activeCategory]);

  const featuredServices = useMemo(() => services.filter(s => s.isFeatured), [services]);
  const activePoll = useMemo(() => surveys.find(s => s.isPublicPoll && s.isActive), [surveys]);

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
                     <p className="text-xl text-slate-500 font-bold mb-10">
                       {siteConfig?.heroSubtitle || (isAr ? "بوابة بلدية ظفار الموحدة" : "Unified Portal")}
                     </p>
                     <div className="relative group max-w-xl">
                       <SearchIcon className={cn("absolute top-1/2 -translate-y-1/2 text-slate-400", isAr ? "right-6" : "left-6")} aria-hidden="true" />
                       <input 
                         type="text" 
                         placeholder={isAr ? "ابحث عن خدمة بلدية..." : "Search services..."} 
                         className={cn("w-full h-16 rounded-xl border-2 font-bold focus:border-primary px-16 shadow-lg bg-white outline-none")} 
                         value={searchQuery} 
                         onChange={(e) => setSearchQuery(e.target.value)} 
                         aria-label={isAr ? "البحث في الخدمات" : "Search services"}
                       />
                     </div>
                     <Button 
                       variant="ghost" 
                       className="mt-4 text-xs font-bold text-slate-400 gap-2 hover:bg-primary/5 hover:text-primary transition-colors"
                       onClick={() => handleReadAloud(siteConfig?.heroTitle + ". " + siteConfig?.heroSubtitle)}
                       disabled={ttsLoading}
                       aria-label={isAr ? "استمع إلى الترحيب" : "Listen to Welcome"}
                     >
                       {ttsLoading ? <Loader2 className="animate-spin size-3" /> : <Volume2 size={14} />}
                       {isAr ? "استمع للترحيب" : "Listen to Welcome"}
                     </Button>
                   </div>

                   {/* Quick Theqa Status indicator */}
                   <div className="lg:col-span-5">
                     <Card className="border-none shadow-2xl rounded-brand bg-white relative overflow-hidden p-6 border-t-4 border-accent">
                       <div className="flex items-center justify-between mb-4">
                         <div className="flex items-center gap-3">
                           <div className="p-2.5 rounded-xl bg-accent/10 text-primary">
                             <Fingerprint className="size-6 animate-pulse" />
                           </div>
                           <div>
                             <h2 className="font-black text-sm text-primary">{isAr ? "حالة التصديق الإلكتروني (ثقة)" : "PKI Authentication Status"}</h2>
                             <p className="text-[10px] text-slate-400 font-bold">{isAr ? "الهوية الرقمية الوطنية الموحدة" : "Unified National Digital ID"}</p>
                           </div>
                         </div>
                         <Badge className={cn("rounded-full border-none px-3 py-1 font-black text-xs", pkiStatus === 'connected' ? "bg-emerald-500 text-white" : "bg-amber-500 text-white")}>
                           {pkiStatus === 'connected' ? (isAr ? "نشط عبر ثقة" : "Active via Theqa") : (isAr ? "غير متصل" : "Not authenticated")}
                         </Badge>
                       </div>
                       <p className="text-xs text-slate-500 font-bold leading-relaxed mb-4">
                         {isAr ? "تم تسجيل دخولك تلقائياً وبأمان تام باستخدام نظام الهوية الرقمية العمانية الموحدة (ثقة). لا داعي لإدخال اسمك أو رقمك المدني يدوياً في المعاملات." : "You are automatically and securely authenticated via Oman Unified Identity System (Theqa). No need to enter personal details manually."}
                       </p>
                       <div className="flex gap-2">
                         <Button variant="outline" size="sm" onClick={() => setPkiStatus(pkiStatus === 'connected' ? 'disconnected' : 'connected')} className="text-[10px] font-black rounded-lg w-full">
                           {isAr ? "تبديل حالة الهوية ثقة (محاكاة)" : "Toggle Theqa Simulation"}
                         </Button>
                       </div>
                     </Card>
                   </div>
                 </div>
               </div>
               <div className="absolute top-0 right-0 w-1/2 h-full dm-wave-5 opacity-10 pointer-events-none" />
            </section>

            {/* 2. Official Theqa PKI Visual Integration Guide Section */}
            <section className="py-20 bg-white border-t border-b border-slate-100" aria-labelledby="theqa-guide-title">
              <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6 bg-slate-50 p-8 rounded-brand border">
                  <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-right">
                    <div className="relative w-32 h-16 shrink-0 bg-white p-2 rounded-xl border shadow-sm flex items-center justify-center">
                      <Image 
                        src="https://gov.om/documents/20117/254616/FLIPPED-Theqa-HomePage.png/3a21164e-8832-38df-f66b-6780161591d2?t=1788817339796"
                        alt=""
                        fill
                        className="object-contain p-2"
                        priority
                      />
                    </div>
                    <div>
                      <h2 id="theqa-guide-title" className="text-2xl font-black text-primary tracking-tight">
                        {isAr ? "بوابة معتمدة بالكامل عبر الهوية الرقمية (ثقة)" : "Fully Accredited via National Digital Identity (Theqa)"}
                      </h2>
                      <p className="text-slate-500 font-bold text-sm mt-1 max-w-2xl">
                        {isAr 
                          ? "تماشياً مع التوجه الاستراتيجي لسلطنة عمان في التحول الرقمي، تم ربط جميع الخدمات البلدية بـ (ثقة) لتقديم تجربة معاملات آمنة وفورية بدون أوراق."
                          : "In line with Oman's strategic vision for digital governance, all municipal actions are bound to Theqa for supreme safety."}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" className="rounded-full border-primary text-primary font-black px-6 shrink-0" asChild>
                    <Link href="/access-controls">{isAr ? "معرفة المزيد عن ثقة" : "Learn More About Theqa"}</Link>
                  </Button>
                </div>

                {/* 3-Column Steps requested by user matching the reference image layout precisely */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Step 1 */}
                  <Card className="rounded-brand border-2 border-slate-100 bg-white p-8 flex flex-col justify-between hover:border-primary/20 transition-all shadow-sm group">
                    <div className="space-y-6">
                      <div className="flex justify-between items-start">
                        <span className="size-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-primary text-sm" aria-hidden="true">1</span>
                        <Fingerprint className="text-slate-300 group-hover:text-accent transition-colors" size={24} aria-hidden="true" />
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-lg font-black text-primary leading-snug">
                          {isAr ? "ما هي الهوية الرقمية (ثقة)، وكيف تستفيد منها؟" : "What is the Digital Identity (Theqa)?"}
                        </h3>
                        {expandedStep === 1 && (
                          <p className="text-xs text-slate-500 font-bold leading-relaxed animate-in fade-in slide-in-from-top-1">
                            {isAr 
                              ? "هوية رقمية آمنة يمكنك الحصول عليها عبر تطبيق الهاتف للوصول للخدمات الحكومية وإنجاز المعاملات فورياً."
                              : "A secure digital token identity you obtain via your smartphone application to gain instant access to federal state tasks."}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="pt-6 mt-6 border-t">
                      <Button 
                        variant="ghost" 
                        onClick={() => setExpandedStep(expandedStep === 1 ? null : 1)}
                        className="w-full text-xs font-black text-primary rounded-xl bg-slate-50 hover:bg-primary hover:text-white transition-colors gap-2"
                        aria-expanded={expandedStep === 1}
                      >
                        {expandedStep === 1 ? <Minus size={14} /> : <Plus size={14} />}
                        {isAr ? "معرفة المزيد" : "Learn More"}
                      </Button>
                    </div>
                  </Card>

                  {/* Step 2 */}
                  <Card className="rounded-brand border-2 border-slate-100 bg-white p-8 flex flex-col justify-between hover:border-primary/20 transition-all shadow-sm group">
                    <div className="space-y-6">
                      <div className="flex justify-between items-start">
                        <span className="size-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-primary text-sm" aria-hidden="true">2</span>
                        <ShieldCheck className="text-slate-300 group-hover:text-accent transition-colors" size={24} aria-hidden="true" />
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-lg font-black text-primary leading-snug">
                          {isAr ? "كيف تحصل على خدمات الثقة الرقمية؟" : "How to acquire Theqa authentication?"}
                        </h3>
                        {expandedStep === 2 && (
                          <p className="text-xs text-slate-500 font-bold leading-relaxed animate-in fade-in slide-in-from-top-1">
                            {isAr 
                              ? "من خلال تفعيل شريحة الهاتف الداعمة للتصديق، أو قراءة البطاقة الشخصية/بطاقة الإقامة عبر تطبيق الهاتف (ثقة) بسهولة."
                              : "Through activating your PKI-enabled SIM card, or utilizing your National ID card sensor within the mobile application."}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="pt-6 mt-6 border-t">
                      <Button 
                        variant="ghost" 
                        onClick={() => setExpandedStep(expandedStep === 2 ? null : 2)}
                        className="w-full text-xs font-black text-primary rounded-xl bg-slate-50 hover:bg-primary hover:text-white transition-colors gap-2"
                        aria-expanded={expandedStep === 2}
                      >
                        {expandedStep === 2 ? <Minus size={14} /> : <Plus size={14} />}
                        {isAr ? "معرفة المزيد" : "Learn More"}
                      </Button>
                    </div>
                  </Card>

                  {/* Step 3 */}
                  <Card className="rounded-brand border-2 border-slate-100 bg-white p-8 flex flex-col justify-between hover:border-primary/20 transition-all shadow-sm group">
                    <div className="space-y-6">
                      <div className="flex justify-between items-start">
                        <span className="size-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-primary text-sm" aria-hidden="true">3</span>
                        <ArrowRightLeft className="text-slate-300 group-hover:text-accent transition-colors" size={24} aria-hidden="true" />
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-lg font-black text-primary leading-snug">
                          {isAr ? "كيف تبدأ باستخدام الخدمات في Dhofar Portal؟" : "How to initiate applications with us?"}
                        </h3>
                        {expandedStep === 3 && (
                          <p className="text-xs text-slate-500 font-bold leading-relaxed animate-in fade-in slide-in-from-top-1">
                            {isAr 
                              ? "سجّل الدخول التلقائي عن طريق تطبيق ثقة، ليقوم النظام بجلب معلومات السجل التجاري أو الملف السكني فوراً وتأكيد هويتك الحقيقية."
                              : "Log in seamlessly using the application, letting our ecosystem directly read real property or commercial file indices."}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="pt-6 mt-6 border-t">
                      <Button 
                        variant="ghost" 
                        onClick={() => setExpandedStep(expandedStep === 3 ? null : 3)}
                        className="w-full text-xs font-black text-primary rounded-xl bg-slate-50 hover:bg-primary hover:text-white transition-colors gap-2"
                        aria-expanded={expandedStep === 3}
                      >
                        {expandedStep === 3 ? <Minus size={14} /> : <Plus size={14} />}
                        {isAr ? "معرفة المزيد" : "Learn More"}
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>
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
                      <p className="text-slate-400 font-bold">{isAr ? "لم يتم العثور على خدمات" : "No services found"}</p>
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
            {activePoll && (
              <section className="py-20 bg-accent/5" aria-labelledby="public-poll-title">
                <div className="max-w-4xl mx-auto px-6 text-center">
                  <div className="mb-8">
                    <Badge className="bg-accent text-white mb-4">{isAr ? "صوتك يهمنا" : "Your Voice Matters"}</Badge>
                    <h2 id="public-poll-title" className="text-3xl font-black text-primary mb-4">{isAr ? activePoll.titleAr : activePoll.titleEn}</h2>
                    <p className="text-slate-500 font-bold">{isAr ? activePoll.descriptionAr : activePoll.descriptionEn}</p>
                  </div>
                  <Card className="rounded-brand border-none shadow-xl">
                    <CardContent className="p-8">
                      {activePoll.questions.map((q) => (
                        <div key={q.id} className="space-y-6">
                          <h3 className="text-xl font-black flex items-center justify-center gap-3">
                            {q.iconName && React.createElement((Icons as any)[q.iconName] || Icons.Info, { className: "text-accent", "aria-hidden": "true" })}
                            {isAr ? q.questionAr : q.questionEn}
                          </h3>
                          <RadioGroup className="grid sm:grid-cols-2 gap-4" aria-label={isAr ? q.questionAr : q.questionEn}>
                            {q.options?.map((opt) => (
                              <div key={opt.id} className="relative group">
                                <RadioGroupItem value={opt.id} id={opt.id} className="sr-only" />
                                <Label 
                                  htmlFor={opt.id} 
                                  className="flex items-center gap-4 p-4 border-2 rounded-2xl cursor-pointer hover:border-primary hover:bg-slate-50 transition-all font-bold text-slate-700 group-data-[state=checked]:border-primary group-data-[state=checked]:bg-primary/5"
                                >
                                  {opt.icon && React.createElement((Icons as any)[opt.icon] || Icons.Circle, { size: 18, className: "text-accent", "aria-hidden": "true" })}
                                  {isAr ? opt.textAr : opt.textEn}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                          <Button className="dm-gradient-primary rounded-full px-12 h-14 font-black mt-8 shadow-lg">
                            {isAr ? "إرسال التصويت" : "Submit Vote"}
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
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
                       <p className="text-sm font-bold opacity-70 tracking-widest uppercase">{isAr ? 'معاملة رقمية' : 'Transactions'}</p>
                    </div>
                    <div className="space-y-2">
                       <ShieldCheck className="mx-auto text-accent mb-4" size={40} aria-hidden="true" />
                       <h3 className="text-5xl font-black">{siteConfig?.stats?.permits || '0'}+</h3>
                       <p className="text-sm font-bold opacity-70 tracking-widest uppercase">{isAr ? 'رخصة بناء' : 'Permits'}</p>
                    </div>
                    <div className="space-y-2">
                       <FileText className="mx-auto text-accent mb-4" size={40} aria-hidden="true" />
                       <h3 className="text-5xl font-black">{siteConfig?.stats?.contracts || '0'}+</h3>
                       <p className="text-sm font-bold opacity-70 tracking-widest uppercase">{isAr ? 'عقد إيجار' : 'Leases'}</p>
                    </div>
                    <div className="space-y-2">
                       <Users className="mx-auto text-accent mb-4" size={40} aria-hidden="true" />
                       <h3 className="text-5xl font-black">{siteConfig?.stats?.tickets || '0'}+</h3>
                       <p className="text-sm font-bold opacity-70 tracking-widest uppercase">{isAr ? 'تذكرة دعم' : 'Tickets'}</p>
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
                     <p className="text-slate-400 font-bold">{isAr ? "استكشف كافة الخدمات البلدية المتاحة رقمياً" : "Explore all municipal services"}</p>
                   </div>
                   <nav className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto" aria-label={isAr ? "فئات الخدمات" : "Service Categories"}>
                     {['all', ...Object.keys(CAT_CONFIG)].map(cid => (
                       <Button 
                        key={cid} 
                        onClick={() => setActiveCategory(cid)} 
                        variant={activeCategory === cid ? 'default' : 'outline'} 
                        className={cn("rounded-full font-black px-8 h-12", activeCategory === cid && "dm-gradient-primary")}
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
