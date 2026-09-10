'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import { useFirestore, useCollection, useDoc, useUser } from '@/firebase';
import { collection, doc, query, where, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useSettingsStore } from '@/lib/settings-store';
import { 
  Search, 
  Clock, 
  Bolt, 
  Globe, 
  ChevronDown, 
  LayoutGrid, 
  Cpu, 
  Sparkles,
  Search as SearchIcon,
  RotateCcw,
  CreditCard,
  XCircle,
  Languages,
  Flag,
  Target,
  Users,
  ArrowUpRight,
  Palette,
  Settings as SettingsIcon,
  MousePointer2,
  Type,
  CheckCircle2,
  ShieldCheck,
  Accessibility,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import { Service, SiteConfig, NewsTicker } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ServiceCardEnhanced } from '@/components/service-card-enhanced';

// Typing Animation Component
const TypingText = ({ isAr }: { isAr: boolean }) => {
  const phrases = isAr 
    ? ["معاً نحو المستقبل الرقمي", "خدمات ذكية بلمسة واحدة", "نبتكر من أجل سعادتكم", "رؤية طموحة لوطن مزدهر"]
    : ["Together towards a digital future", "Smart services at your fingertips", "Innovating for your happiness", "An ambitious vision for a prosperous nation"];
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);

  useEffect(() => {
    if (subIndex === phrases[index].length + 1 && !reverse) {
      setTimeout(() => setReverse(true), 2000);
      return;
    }
    if (subIndex === 0 && reverse) {
      setReverse(false);
      setIndex((prev) => (prev + 1) % phrases.length);
      return;
    }
    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (reverse ? -1 : 1));
    }, reverse ? 40 : 80);
    return () => clearTimeout(timeout);
  }, [subIndex, index, reverse, phrases]);

  return (
    <div className="h-16 flex items-center justify-center mb-10">
      <h2 className="text-3xl md:text-5xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent bg-[length:200%_auto] animate-gradient">
        {phrases[index].substring(0, subIndex)}
        <span className="animate-pulse ml-1 text-slate-300">|</span>
      </h2>
    </div>
  );
};

// Vision Card Component
const DynamicVisionCard = ({ isAr }: { isAr: boolean }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const slides = [
    { title: isAr ? "رؤية عمان 2040" : "Oman Vision 2040", tag: isAr ? "الوطن" : "Nation", icon: <Flag size={40} />, color: "bg-[#4c1d95]", shadow: "shadow-[#4c1d95]/40" },
    { title: isAr ? "رؤية محافظة ظفار" : "Dhofar Vision", tag: isAr ? "المنطقة" : "Region", icon: <Target size={40} />, color: "bg-[#10b981]", shadow: "shadow-[#10b981]/40" },
    { title: isAr ? "المشاركة الرقمية" : "Digital Participation", tag: isAr ? "المجتمع" : "Community", icon: <Users size={40} />, color: "bg-primary", shadow: "shadow-primary/40", showAvatars: true },
  ];

  useEffect(() => {
    const interval = setInterval(() => { setActiveSlide((prev) => (prev + 1) % slides.length); }, 4000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const slide = slides[activeSlide];

  return (
    <div className="lg:col-span-4 h-full">
      <div className={cn(
        "h-full min-h-[320px] p-10 rounded-[3rem] flex flex-col justify-between cursor-pointer shadow-2xl relative overflow-hidden group transition-all duration-1000 hover:scale-[1.02]",
        slide.color,
        slide.shadow
      )}>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-md">
              {React.cloneElement(slide.icon as React.ReactElement, { className: "text-white" })}
            </div>
            <span className="text-sm font-black text-white/80 uppercase tracking-widest">{slide.tag}</span>
          </div>
          <h4 className="text-3xl font-black leading-tight text-white tracking-tighter">{slide.title}</h4>
        </div>
        <div className="flex items-center justify-between relative z-10">
          <div className="flex gap-2">
            {slides.map((_, i) => (
              <button key={i} className={cn("h-2 rounded-full transition-all duration-500", activeSlide === i ? 'w-8 bg-white' : 'w-2 bg-white/30')} />
            ))}
          </div>
          <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm group-hover:bg-white/40 transition-colors">
            <ArrowUpRight size={28} className="text-white transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
          </div>
        </div>
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
      </div>
    </div>
  );
};

export default function DhofarPortal() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const { language, setLanguage } = useSettingsStore();
  
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('الكل');
  const [isServicesExpanded, setIsServicesExpanded] = useState(false);
  const [trxId, setTrxId] = useState('');
  const [isTrxLoading, setIsTrxLoading] = useState(false);
  const [trxResult, setTrxResult] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isAr = language === 'ar';

  const siteConfigRef = useMemo(() => doc(firestore, 'config', 'site'), [firestore]);
  const { data: siteConfig } = useDoc<SiteConfig>(siteConfigRef);

  const tickerQuery = useMemo(() => 
    query(collection(firestore, 'news_ticker'), where('isActive', '==', true), orderBy('createdAt', 'desc')), 
    [firestore]
  );
  const { data: tickerItems } = useCollection<NewsTicker>(tickerQuery);

  const servicesQuery = useMemo(() => 
    query(collection(firestore, 'services'), where('isActive', '==', true)), 
    [firestore]
  );
  const { data: services, loading: servicesLoading } = useCollection<Service>(servicesQuery);

  const filteredServices = useMemo(() => {
    return services?.filter(s => {
      const isAll = activeCategory === 'الكل' || activeCategory === 'All';
      const categoryMatch = isAll || s.category === activeCategory;
      const searchMatch = !searchQuery || 
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (s.titleEn && s.titleEn.toLowerCase().includes(searchQuery.toLowerCase())) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase());
      return categoryMatch && searchMatch;
    }) || [];
  }, [services, activeCategory, searchQuery]);

  const handleTrackTrx = () => {
    if (!trxId) return;
    setIsTrxLoading(true);
    setTimeout(() => {
      setIsTrxLoading(false);
      setTrxResult({ status: 'pending', amount: '45.000' });
    }, 1500);
  };

  if (!isMounted) return null;

  return (
    <div className={cn("flex min-h-screen flex-col bg-[#eeeeee] text-slate-900", isAr ? "font-arabic" : "font-body")}>
      {/* Top Utility Bar */}
      <div className="bg-slate-900 text-white/70 py-2 text-xs border-b border-white/5">
        <div className="mx-auto max-w-7xl px-6 flex justify-between items-center">
          <div className="flex gap-4">
             <span>{new Date().toLocaleDateString(isAr ? 'ar-OM' : 'en-OM', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-accent font-black hover:underline">{isAr ? 'لوحة التحكم' : 'Admin Panel'}</Link>
            <div className="h-3 w-px bg-white/20" />
            <button onClick={() => setLanguage(isAr ? 'en' : 'ar')} className="flex items-center gap-2 hover:text-white transition-colors">
              <Languages size={14} />
              {isAr ? 'English' : 'العربية'}
            </button>
          </div>
        </div>
      </div>

      {/* Breaking News Ticker */}
      {tickerItems && tickerItems.length > 0 && (
        <div className="bg-primary text-white border-b border-white/10 overflow-hidden relative h-10 flex items-center shadow-md z-40">
          <div className="absolute left-0 top-0 h-full bg-secondary px-6 flex items-center z-10 font-black text-xs uppercase gap-3 shadow-2xl">
            <Bolt className="h-4 w-4 fill-current animate-pulse" />
            {isAr ? 'عاجل' : 'Alert'}
          </div>
          <div className="flex-1 overflow-hidden whitespace-nowrap">
             <div className="animate-marquee inline-block pl-[100%] pr-4 py-2">
                {tickerItems.map((item, idx) => (
                  <span key={item.id} className="mx-10 text-sm font-bold opacity-90">
                    {item.text}
                    {idx < tickerItems.length - 1 && <span className="mx-4 text-white/30">|</span>}
                  </span>
                ))}
             </div>
          </div>
        </div>
      )}

      {/* Main Navigation Tab System */}
      <nav className="sticky top-0 z-50 px-6 py-4 bg-[#eeeeee]/80 backdrop-blur-xl border-b border-white/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          <Link href="/" className="flex-shrink-0">
             <div className="relative h-12 w-48">
               <Image
                 src="https://edm.gov.om/wp-content/uploads/2026/09/headerlogo2.png"
                 alt="Logo"
                 fill
                 className="object-contain"
                 priority
               />
             </div>
          </Link>
          
          <div className="flex items-center bg-[#eeeeee] p-1.5 rounded-[1.5rem] neu-in shadow-sm">
            {[
              { id: 'home', ar: "الرئيسية", en: "Home", color: "text-primary" },
              { id: 'identity', ar: "الهوية الرقمية", en: "Digital Identity", color: "text-secondary" },
              { id: 'ux', ar: "مختبر التطوير", en: "UX Lab", color: "text-accent" }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-6 py-2.5 rounded-2xl text-xs font-black transition-all duration-300",
                  activeTab === tab.id ? "bg-white shadow-lg scale-105 " + tab.color : "text-slate-400 hover:text-slate-600"
                )}
              >
                {isAr ? tab.ar : tab.en}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
             <div className="w-10 h-10 rounded-full neu-out flex items-center justify-center text-primary cursor-pointer hover:scale-110 transition-transform">
                <SearchIcon size={20} />
             </div>
             <Button className="rounded-full px-6 dm-gradient-primary font-black shadow-xl">
               {isAr ? "دخول المستفيد" : "Citizen Login"}
             </Button>
          </div>
        </div>
      </nav>

      <main className="flex-grow pt-16 pb-24 px-6 max-w-7xl mx-auto w-full">
        {activeTab === 'home' && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <TypingText isAr={isAr} />

            {/* Hero Interaction Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-16">
              <div className="lg:col-span-3 p-10 rounded-[3.5rem] bg-[#eeeeee] neu-out flex items-center justify-around flex-wrap gap-8">
                {[
                  { label: isAr ? "إضافة مفوض" : "Add Delegate", icon: <Users />, color: "text-primary" },
                  { label: isAr ? "تراخيص البناء" : "Permits", icon: <LayoutGrid />, color: "text-secondary" },
                  { label: isAr ? "عقود الإيجار" : "Lease", icon: <FileText />, color: "text-accent" },
                  { label: isAr ? "بلاغات صحية" : "Health", icon: <ShieldCheck />, color: "text-emerald-500" },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-4 group cursor-pointer w-24">
                    <div className="w-20 h-20 rounded-[2rem] flex items-center justify-center transition-all duration-500 neu-out group-hover:bg-white group-hover:-translate-y-2">
                       {React.cloneElement(item.icon as React.ReactElement, { size: 36, className: item.color })}
                    </div>
                    <span className="text-[10px] font-black text-center text-slate-800 leading-tight uppercase tracking-widest">{item.label}</span>
                  </div>
                ))}
              </div>

              {/* Inquiry Card */}
              <div className={cn(
                "lg:col-span-1 p-10 rounded-[3.5rem] bg-slate-900 shadow-2xl flex flex-col justify-center relative overflow-hidden transition-all duration-500 border border-white/5",
                trxResult ? "ring-4 ring-secondary/40" : ""
              )}>
                {!trxResult ? (
                  <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-3 text-white">
                      <Clock className="text-accent" size={24} />
                      <h3 className="text-xl font-black uppercase tracking-tighter">{isAr ? "تتبع المعاملة" : "Track ID"}</h3>
                    </div>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="TRX-99..." 
                        value={trxId}
                        onChange={(e) => setTrxId(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-black w-full text-xs outline-none focus:border-accent transition-colors shadow-inner"
                      />
                      {trxId && <button onClick={() => setTrxId('')} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"><RotateCcw size={16} /></button>}
                    </div>
                    <button 
                      onClick={handleTrackTrx}
                      className="w-full dm-gradient-brand text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.03] transition-all shadow-2xl"
                    >
                      {isTrxLoading ? <RotateCcw size={16} className="animate-spin" /> : <SearchIcon size={16} />}
                      {isAr ? "استعلام لحظي" : "Check Now"}
                    </button>
                  </div>
                ) : (
                  <div className="relative z-10 animate-in slide-in-from-bottom-4 duration-500 space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="bg-secondary text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase animate-pulse">{isAr ? "بانتظار الدفع" : "Payment Due"}</span>
                      <button onClick={() => setTrxResult(null)} className="text-slate-500 hover:text-white"><XCircle size={24} /></button>
                    </div>
                    <div className="bg-white/5 rounded-[2rem] p-6 text-center border border-white/5 shadow-inner">
                      <p className="text-white font-black text-2xl tracking-tighter">#{trxId}</p>
                    </div>
                    <div className="flex justify-between items-center bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5">
                      <span className="text-emerald-500 font-black text-xs uppercase">{isAr ? "المبلغ" : "Due"}</span>
                      <span className="text-white font-black text-2xl tracking-tighter">45.000 <span className="text-xs text-slate-500">OMR</span></span>
                    </div>
                    <button className="w-full py-5 rounded-2xl bg-white text-slate-900 font-black text-sm flex items-center justify-center gap-3 hover:bg-emerald-400 transition-all shadow-2xl">
                      <CreditCard size={18} /> {isAr ? "ادفع الآن" : "Pay Securely"}
                    </button>
                  </div>
                )}
                <div className="absolute -right-20 -top-20 w-80 h-80 bg-accent opacity-10 blur-[100px]" />
              </div>
            </div>

            {/* Services Expansion Button */}
            <div className="flex justify-center relative -mt-24 mb-16 z-30">
              <button 
                onClick={() => setIsServicesExpanded(!isServicesExpanded)}
                className="px-12 py-8 rounded-[3rem] bg-[#eeeeee] neu-out flex items-center gap-6 transition-all hover:bg-white hover:scale-105 group"
              >
                <LayoutGrid size={32} className="text-primary transition-transform group-hover:rotate-90 duration-500" />
                <span className="text-2xl font-black tracking-tighter text-primary">
                  {isAr ? `تصفح كل الخدمات (${services?.length || 0})` : `Explore All Services (${services?.length || 0})`}
                </span>
                <ChevronDown size={28} className={cn("text-secondary transition-transform duration-500", isServicesExpanded ? "rotate-180" : "animate-bounce")} />
              </button>
            </div>

            {/* Dynamic Services Grid */}
            <div className={cn(
              "overflow-hidden transition-all duration-700 ease-in-out",
              isServicesExpanded ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0"
            )}>
              <div className="p-12 rounded-[4rem] bg-[#eeeeee] neu-out mb-20 border border-white/20">
                <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
                   <div className="flex-1 flex items-center gap-4 px-8 py-5 rounded-[2rem] w-full bg-white shadow-inner">
                      <SearchIcon size={24} className="text-slate-300" />
                      <input 
                        type="text" 
                        placeholder={isAr ? "ابحث عن خدمة بلدية..." : "Search services..."}
                        className="bg-transparent border-none focus:ring-0 text-slate-800 font-bold w-full outline-none text-lg"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                   </div>
                   <div className="flex gap-3 flex-wrap justify-center">
                     {['الكل', 'الرخص', 'المباني', 'الاستثمار'].map(cat => (
                        <button 
                          key={cat}
                          onClick={() => setActiveCategory(cat)}
                          className={cn(
                            "px-6 py-4 rounded-2xl text-xs font-black transition-all duration-300 shadow-sm",
                            activeCategory === cat ? "dm-gradient-brand text-white shadow-xl scale-110" : "bg-white/60 text-slate-500 hover:bg-white"
                          )}
                        >
                          {cat}
                        </button>
                     ))}
                   </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                   {filteredServices.map(s => (
                     <ServiceCardEnhanced key={s.id} service={s} isAr={isAr} />
                   ))}
                </div>
              </div>
            </div>

            {/* Vision & AI Sahalah Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
               <div className="lg:col-span-8">
                 <div className="h-full p-12 rounded-[3.5rem] bg-white neu-soft flex flex-col md:flex-row items-center justify-between gap-10 group hover:shadow-2xl transition-all border border-primary/5">
                    <div className="flex items-center gap-8">
                      <div className="w-24 h-24 rounded-[2.5rem] bg-secondary flex items-center justify-center shadow-2xl group-hover:rotate-12 transition-transform duration-700">
                         <Cpu size={48} className="text-white" />
                      </div>
                      <div>
                        <h4 className="text-4xl font-black text-primary tracking-tighter uppercase">{isAr ? "سهالة AI" : "Sahalah AI"}</h4>
                        <p className="text-sm font-bold text-slate-500 mt-2 max-w-xs">{isAr ? "مساعدك الذكي لتجديد التراخيص والعقود عبر المحادثة الفورية" : "Your intelligent municipal assistant for instant document renewals."}</p>
                      </div>
                    </div>
                    <button className="px-10 py-6 dm-gradient-brand text-white rounded-3xl font-black text-sm hover:scale-105 transition-all shadow-2xl flex items-center gap-4 group">
                      <Sparkles size={20} className="text-yellow-400 group-hover:animate-spin" />
                      {isAr ? "بدء المحادثة" : "Start Chat"}
                    </button>
                 </div>
               </div>
               <DynamicVisionCard isAr={isAr} />
            </div>
          </div>
        )}

        {activeTab === 'identity' && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 py-10 space-y-16">
            <div className="text-center">
              <div className="inline-flex items-center gap-3 px-8 py-3 rounded-full bg-white neu-out mb-8">
                <Palette className="text-primary" size={24} />
                <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Visual Identity Standards</span>
              </div>
              <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-6">
                {isAr ? "دليل الهوية البصرية لبلدية ظفار" : "Dhofar Municipality Identity Guide"}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[
                { hex: "#008E91", name: "Deep Teal", role: "Primary Brand Color" },
                { hex: "#03CFCB", name: "Turquoise", role: "Digital Interaction" },
                { hex: "#470D67", name: "Dark Purple", role: "Authority Accent" },
              ].map(color => (
                <div key={color.hex} className="p-8 rounded-[3rem] bg-[#eeeeee] neu-out group hover:bg-white transition-all">
                  <div className="w-full h-40 rounded-[2rem] shadow-2xl mb-8" style={{ backgroundColor: color.hex }} />
                  <div className="text-center">
                    <p className="font-black text-xl mb-1">{color.name}</p>
                    <p className="text-sm font-bold text-primary mb-3">{color.hex}</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{color.role}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-12 rounded-[4rem] bg-slate-900 shadow-2xl relative overflow-hidden">
               <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-16">
                  <div className="space-y-8">
                    <div className="flex items-center gap-4 text-accent">
                      <Type size={32} />
                      <h3 className="text-2xl font-black">Typography: Changa</h3>
                    </div>
                    <div className="p-10 rounded-[3rem] bg-white/5 border border-white/10">
                      <p className="text-6xl font-black text-white mb-6">بلدية ظفار</p>
                      <p className="text-2xl font-bold text-slate-400">Digital Modernity Meets Tradition</p>
                    </div>
                  </div>
                  <div className="space-y-8">
                    <div className="flex items-center gap-4 text-secondary">
                      <MousePointer2 size={32} />
                      <h3 className="text-2xl font-black">Design Style: Soft UI</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="h-32 rounded-[2rem] bg-[#eeeeee] neu-out flex items-center justify-center"><div className="w-12 h-12 rounded-xl neu-out" /></div>
                      <div className="h-32 rounded-[2rem] bg-[#eeeeee] neu-in flex items-center justify-center"><div className="w-12 h-12 rounded-xl neu-in" /></div>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'ux' && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 py-10 space-y-16">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-3 px-8 py-3 rounded-full bg-white neu-out mb-8">
                <SettingsIcon className="text-secondary animate-spin-slow" size={24} />
                <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Innovation & UX Lab</span>
              </div>
              <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-6">{isAr ? "مختبر تجربة المستخدم" : "UX & Experience Lab"}</h2>
              <p className="text-slate-500 font-bold">{isAr ? "استعرض أحدث التقنيات التفاعلية المطبقة لضمان سهولة وشمولية الوصول للخدمات." : "Showcasing interactive technologies ensuring inclusive and easy service access."}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
               <div className="p-10 rounded-[3.5rem] bg-[#eeeeee] neu-out space-y-8">
                 <div className="flex items-center gap-4">
                   <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-md text-primary"><Accessibility size={28} /></div>
                   <h3 className="text-2xl font-black">{isAr ? "شمولية الوصول" : "Accessibility Lab"}</h3>
                 </div>
                 <div className="space-y-6">
                    <div className="p-6 rounded-[2rem] bg-white shadow-inner">
                       <p className="text-sm font-bold text-slate-600 leading-relaxed">
                         {isAr ? "نطبق معايير WCAG 2.2 لضمان وصول جميع فئات المجتمع للخدمات الرقمية بسهولة، بما في ذلك كبار السن وذوي الإعاقة." : "Implementing WCAG 2.2 standards to ensure digital services are accessible to all, including seniors and people with disabilities."}
                       </p>
                    </div>
                    <div className="flex gap-4">
                       <button className="flex-1 py-4 rounded-2xl neu-out font-black text-[10px] uppercase text-slate-600 hover:bg-white">{isAr ? "تباين عالي" : "High Contrast"}</button>
                       <button className="flex-1 py-4 rounded-2xl neu-out font-black text-[10px] uppercase text-slate-600 hover:bg-white">{isAr ? "تكبير الخط" : "Scale Font"}</button>
                    </div>
                 </div>
               </div>

               <div className="p-10 rounded-[3.5rem] bg-[#eeeeee] neu-out space-y-8">
                 <div className="flex items-center gap-4">
                   <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-md text-secondary"><MousePointer2 size={28} /></div>
                   <h3 className="text-2xl font-black">{isAr ? "تفاعليات البروز" : "Elevation Lab"}</h3>
                 </div>
                 <div className="grid grid-cols-2 gap-8">
                    <div className="p-8 rounded-[2rem] bg-[#eeeeee] neu-out flex flex-col items-center gap-4">
                       <div className="w-12 h-12 rounded-xl neu-out bg-white" />
                       <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Surface Elevation</span>
                    </div>
                    <div className="p-8 rounded-[2rem] bg-[#eeeeee] neu-in flex flex-col items-center gap-4">
                       <div className="w-12 h-12 rounded-xl neu-in" />
                       <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Inner Recess</span>
                    </div>
                 </div>
               </div>
            </div>
          </div>
        )}
      </main>

      <footer className="py-16 px-6 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex flex-col gap-6">
            <div className="relative h-12 w-48 brightness-0 invert opacity-80">
              <Image src="https://edm.gov.om/wp-content/uploads/2026/09/headerlogo2.png" alt="Logo" fill className="object-contain" />
            </div>
            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] max-w-sm">
              {isAr ? "© 2026 بلدية ظفار - سلطنة عمان - منصة ذكية متكاملة" : "© 2026 Dhofar Municipality - Sultanate of Oman"}
            </p>
          </div>
          
          <div className="flex gap-12 text-[10px] font-black uppercase tracking-widest text-white/50">
            <Link href="#" className="hover:text-accent transition-colors">{isAr ? "الخصوصية" : "Privacy"}</Link>
            <Link href="#" className="hover:text-accent transition-colors">{isAr ? "الشروط" : "Terms"}</Link>
            <Link href="#" className="hover:text-accent transition-colors">{isAr ? "خريطة الموقع" : "Sitemap"}</Link>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span className="text-[9px] font-black text-white/30 uppercase">{isAr ? "مركز الاتصال" : "Call Center"}</span>
            <span className="text-3xl font-black text-white tracking-tighter">80071111</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
