
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import { useFirestore, useCollection, useDoc } from '@/firebase';
import { collection, doc, query, where, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { useSettingsStore } from '@/lib/settings-store';
import { 
  Search, 
  Clock, 
  Bolt, 
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
  ShieldCheck,
  FileText,
  Accessibility,
  Globe,
  Palette
} from 'lucide-react';
import Link from 'next/link';
import { Service, SiteConfig, NewsTicker } from '@/lib/types';
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

export default function DhofarPortal() {
  const firestore = useFirestore();
  const { language, setLanguage } = useSettingsStore();
  
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('الكل');
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
  const { data: services } = useCollection<Service>(servicesQuery);

  const filteredServices = useMemo(() => {
    return services?.filter(s => {
      const isAll = activeCategory === 'الكل' || activeCategory === 'All';
      const categoryMatch = isAll || s.category === activeCategory;
      const searchMatch = !searchQuery || 
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (s.titleEn && s.titleEn.toLowerCase().includes(searchQuery.toLowerCase()));
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
    <div className={cn("flex min-h-screen flex-col bg-white text-slate-900", isAr ? "font-arabic" : "font-sans")}>
      {/* Top GUP-DS Utility Bar */}
      <div className="bg-slate-900 text-white py-2 text-[10px] uppercase font-bold tracking-widest border-b border-white/5">
        <div className="mx-auto max-w-7xl px-6 flex justify-between items-center">
          <div className="flex gap-4">
             <span className="flex items-center gap-2 opacity-70"><Globe size={12} /> {isAr ? 'حكومة سلطنة عُمان' : 'Oman Government'}</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-accent hover:underline">{isAr ? 'لوحة التحكم' : 'Admin Panel'}</Link>
            <div className="h-3 w-px bg-white/20" />
            <button onClick={() => setLanguage(isAr ? 'en' : 'ar')} className="flex items-center gap-2 hover:text-accent transition-colors">
              <Languages size={12} />
              {isAr ? 'English' : 'العربية'}
            </button>
          </div>
        </div>
      </div>

      {/* Breaking News Ticker */}
      {tickerItems && tickerItems.length > 0 && (
        <div className="bg-primary text-white overflow-hidden relative h-10 flex items-center shadow-md z-40">
          <div className="absolute left-0 top-0 h-full bg-secondary px-6 flex items-center z-10 font-black text-xs uppercase gap-3">
            <Bolt className="h-4 w-4 fill-current animate-pulse" />
            {isAr ? 'عاجل' : 'Alert'}
          </div>
          <div className="flex-1 overflow-hidden whitespace-nowrap">
             <div className="animate-marquee inline-block pl-[100%] pr-4 py-2">
                {tickerItems.map((item) => (
                  <span key={item.id} className="mx-10 text-sm font-bold opacity-90">
                    {item.text}
                    <span className="mx-4 text-white/30">|</span>
                  </span>
                ))}
             </div>
          </div>
        </div>
      )}

      {/* Identity Wave Header */}
      <header className="relative bg-white border-b border-slate-100 py-6 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between relative z-10">
          <Link href="/" className="flex-shrink-0 flex items-center gap-4">
             <div className="relative h-16 w-16">
               <Image
                 src="https://apps.edm.gov.om/ords/r/dmpm/130/files/static/v15/cropped-DM-ICON.png"
                 alt="Dhofar Municipality Logo"
                 fill
                 className="object-contain"
                 priority
               />
             </div>
             <div className="flex flex-col">
               <span className="text-2xl font-black text-primary leading-none">{isAr ? 'بلدية ظفار' : 'Dhofar Municipality'}</span>
               <span className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em]">{isAr ? 'معاً لمستقبل أفضل' : 'Towards a better future'}</span>
             </div>
          </Link>
          
          <nav className="hidden lg:flex items-center gap-2">
            {[
              { id: 'home', ar: "الرئيسية", en: "Home" },
              { id: 'services', ar: "الخدمات", en: "Services" },
              { id: 'identity', ar: "الهوية الرقمية", en: "Digital Identity" }
            ].map(link => (
              <button 
                key={link.id}
                onClick={() => setActiveTab(link.id)}
                className={cn(
                  "px-6 py-2 rounded-md text-sm font-bold transition-all",
                  activeTab === link.id ? "bg-accent/10 text-primary border-b-2 border-primary" : "text-slate-500 hover:text-primary hover:bg-slate-50"
                )}
              >
                {isAr ? link.ar : link.en}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4">
             <Button variant="outline" className="rounded-full border-primary text-primary font-bold hidden sm:flex">
               {isAr ? "دخول المستفيد" : "Citizen Login"}
             </Button>
          </div>
        </div>
        
        {/* Wave Decorative Background */}
        <div className="absolute top-0 right-0 w-1/3 h-full dm-wave-pattern opacity-10 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-1/4 h-full dm-wave-pattern-muted opacity-20 pointer-events-none transform rotate-180" />
      </header>

      <main className="flex-grow pb-24">
        {activeTab === 'home' && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* GUP-DS Hero Section */}
            <section className="relative py-20 bg-slate-50 overflow-hidden">
               <div className="max-w-7xl mx-auto px-6 relative z-10">
                 <div className="max-w-3xl">
                   <h1 className="text-5xl md:text-7xl font-black text-primary tracking-tighter mb-6 leading-tight">
                     {isAr ? "التحول الرقمي لخدمات بلدية ظفار" : "Digital Transformation of Dhofar Municipality Services"}
                   </h1>
                   <p className="text-xl text-slate-500 font-bold mb-10 leading-relaxed">
                     {isAr ? "نقدم لك منصة متكاملة تهدف إلى تسهيل وصولك للخدمات البلدية بسرعة وكفاءة عالية، متوافقين مع رؤية عمان 2040." : "Providing an integrated platform for efficient access to municipal services, aligned with Oman Vision 2040."}
                   </p>
                   
                   <div className="relative max-w-xl group">
                     <SearchIcon className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={24} />
                     <input 
                       type="text" 
                       placeholder={isAr ? "ابحث عن خدمة بلدية..." : "Search for a service..."}
                       className="w-full h-16 rounded-xl border-2 border-slate-200 px-16 text-lg font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-lg"
                       value={searchQuery}
                       onChange={(e) => setSearchQuery(e.target.value)}
                     />
                   </div>
                 </div>
               </div>
               {/* Large Wave Ornament */}
               <div className="absolute -bottom-10 right-0 w-1/2 h-64 dm-wave-pattern opacity-5" />
            </section>

            {/* Quick Access Grid */}
            <div className="max-w-7xl mx-auto px-6 -mt-10 relative z-20">
               <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 {[
                   { label: isAr ? "تراخيص البناء" : "Permits", icon: <LayoutGrid />, color: "bg-accent", desc: isAr ? "إصدار وتجديد تراخيص البناء" : "Building permit services" },
                   { label: isAr ? "عقود الإيجار" : "Lease", icon: <FileText />, color: "bg-primary", desc: isAr ? "توثيق وتصديق العقود" : "Lease contract services" },
                   { label: isAr ? "الترخيص البلدي" : "License", icon: <ShieldCheck />, color: "bg-secondary", desc: isAr ? "تراخيص الأنشطة الصحية" : "Health and trade licenses" },
                   { label: isAr ? "تمديدات الخدمة" : "Utility", icon: <Target />, color: "bg-emerald-500", desc: isAr ? "تصاريح الحفر والخدمات" : "Excavation and utilities" },
                 ].map((item, i) => (
                   <div key={i} className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 group hover:-translate-y-2 transition-all cursor-pointer">
                     <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center text-white mb-6 shadow-lg transition-transform group-hover:rotate-6", item.color)}>
                        {item.icon}
                     </div>
                     <h3 className="text-lg font-black text-primary mb-2">{item.label}</h3>
                     <p className="text-xs text-slate-400 font-bold leading-tight">{item.desc}</p>
                   </div>
                 ))}
               </div>
            </div>

            {/* Services Section */}
            <section className="py-24 max-w-7xl mx-auto px-6">
              <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-16">
                <div>
                  <h2 className="text-4xl font-black text-primary tracking-tighter mb-4">{isAr ? "دليل الخدمات الإلكترونية" : "Services Catalog"}</h2>
                  <p className="text-slate-500 font-bold">{isAr ? "استعرض الفئات المختلفة للخدمات المتاحة" : "Browse through available municipal service categories"}</p>
                </div>
                <div className="flex gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
                  {['الكل', 'الرخص', 'المباني', 'الاستثمار'].map(cat => (
                    <button 
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={cn(
                        "px-6 py-2.5 rounded-lg text-xs font-black transition-all",
                        activeCategory === cat ? "bg-white text-primary shadow-sm" : "text-slate-500 hover:bg-white/50"
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
            </section>

            {/* AI Assistant Banner */}
            <section className="max-w-7xl mx-auto px-6 mb-24">
              <div className="bg-slate-900 rounded-[2.5rem] p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-12 group shadow-2xl">
                 <div className="relative z-10 flex items-center gap-10">
                    <div className="w-24 h-24 rounded-3xl bg-accent flex items-center justify-center shadow-2xl group-hover:rotate-12 transition-transform duration-700">
                       <Cpu size={48} className="text-white" />
                    </div>
                    <div className="max-w-md">
                      <h4 className="text-4xl font-black text-white tracking-tighter mb-4">{isAr ? "سهالة AI" : "Sahalah AI"}</h4>
                      <p className="text-slate-400 font-bold leading-relaxed">{isAr ? "مساعدك الرقمي الذكي لتسهيل إجراءات التراخيص وتتبع المعاملات عبر المحادثة المباشرة." : "Your intelligent assistant for digital service procedures and live transaction tracking."}</p>
                    </div>
                 </div>
                 <button className="relative z-10 px-10 py-5 dm-gradient-primary rounded-full font-black text-sm flex items-center gap-4 hover:scale-105 transition-all shadow-xl">
                    <Sparkles size={20} className="text-yellow-300" />
                    {isAr ? "ابدأ المحادثة الآن" : "Start Conversation"}
                 </button>
                 
                 {/* Decorative Background Elements */}
                 <div className="absolute top-0 right-0 w-1/2 h-full dm-wave-pattern opacity-5 pointer-events-none" />
                 <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-accent opacity-10 blur-[100px] pointer-events-none" />
              </div>
            </section>
          </div>
        )}

        {activeTab === 'identity' && (
          <div className="max-w-7xl mx-auto px-6 py-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-3 px-6 py-2 rounded-full bg-slate-50 border border-slate-200 mb-6">
                <Palette className="text-primary" size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Brand Identity Guidelines</span>
              </div>
              <h2 className="text-6xl font-black text-primary tracking-tighter">الهوية البصرية لبلدية ظفار</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
               <div className="space-y-8">
                 <div className="p-10 rounded-[2rem] bg-slate-50 border border-slate-100 dm-wave-pattern opacity-40 h-64" />
                 <h3 className="text-3xl font-black text-primary">أنماط الموجات (Wave Patterns)</h3>
                 <p className="text-lg text-slate-500 font-bold leading-relaxed">
                   تعتبر الموجات الزرقاء في الهوية البصرية رمزاً للانسيابية والاتصال الرقمي، مستلهمة من حركة أمواج بحر العرب في محافظة ظفار.
                 </p>
               </div>
               <div className="grid grid-cols-2 gap-8">
                  {[
                    { hex: "#03CFCB", name: "Turquoise", use: "Digital Interactions" },
                    { hex: "#470D67", name: "Deep Purple", use: "Formal Branding" },
                    { hex: "#008E91", name: "Teal Dark", use: "Primary Identity" },
                    { hex: "#F8FAFC", name: "Cloud White", use: "Clean Backgrounds" },
                  ].map(color => (
                    <div key={color.hex} className="p-6 rounded-2xl bg-white shadow-lg border border-slate-100 flex flex-col items-center">
                       <div className="w-full h-32 rounded-xl mb-4" style={{ backgroundColor: color.hex }} />
                       <span className="font-black text-primary">{color.name}</span>
                       <span className="text-[10px] text-slate-400 font-bold uppercase">{color.use}</span>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-slate-900 text-white py-20 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-20 relative z-10">
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="relative h-14 w-14 brightness-0 invert">
                <Image src="https://apps.edm.gov.om/ords/r/dmpm/130/files/static/v15/cropped-DM-ICON.png" alt="Logo" fill className="object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black leading-none">{isAr ? 'بلدية ظفار' : 'Dhofar Municipality'}</span>
                <span className="text-[10px] font-bold text-accent uppercase tracking-widest">{isAr ? 'سلطنة عُمان' : 'Sultanate of Oman'}</span>
              </div>
            </div>
            <p className="text-white/40 text-xs font-bold max-w-sm leading-relaxed">
              {isAr ? 'بلدية ظفار تسعى دائماً لتقديم خدماتها الرقمية بأعلى معايير الجودة والأمان لضمان راحة المواطن والمقيم.' : 'Dhofar Municipality strives to provide its digital services with the highest standards of quality and security.'}
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-16">
            <div className="space-y-4">
              <h5 className="font-black text-accent uppercase text-[10px] tracking-widest">{isAr ? 'روابط هامة' : 'Links'}</h5>
              <ul className="space-y-2 text-sm font-bold text-white/60">
                <li><Link href="#" className="hover:text-white transition-colors">{isAr ? 'عن البلدية' : 'About'}</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">{isAr ? 'دليل الخدمات' : 'Services'}</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">{isAr ? 'المشاركة الرقمية' : 'Participation'}</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h5 className="font-black text-accent uppercase text-[10px] tracking-widest">{isAr ? 'قانوني' : 'Legal'}</h5>
              <ul className="space-y-2 text-sm font-bold text-white/60">
                <li><Link href="#" className="hover:text-white transition-colors">{isAr ? 'الشروط والأحكام' : 'Terms'}</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">{isAr ? 'سياسة الخصوصية' : 'Privacy'}</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">{isAr ? 'خريطة الموقع' : 'Sitemap'}</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h5 className="font-black text-accent uppercase text-[10px] tracking-widest">{isAr ? 'تواصل معنا' : 'Contact'}</h5>
              <div className="flex flex-col gap-1">
                <span className="text-3xl font-black tracking-tighter">80071111</span>
                <span className="text-[10px] text-white/30 font-bold uppercase">{isAr ? 'مركز الاتصال الموحد' : 'Call Center'}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Wave Ornament Footer */}
        <div className="absolute bottom-0 left-0 w-full h-32 dm-wave-pattern opacity-10 pointer-events-none" />
      </footer>
    </div>
  );
}
