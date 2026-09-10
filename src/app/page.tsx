'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { fetchBin } from '@/lib/jsonbin';
import { CAT_CONFIG, CategoryId } from '@/lib/constants';
import { useSettingsStore } from '@/lib/settings-store';
import { 
  Bolt, 
  LayoutGrid, 
  FileText, 
  ShieldCheck, 
  Globe, 
  LayoutDashboard, 
  Search as SearchIcon, 
  Languages, 
  Loader2, 
  TrendingUp, 
  ChevronRight, 
  Target,
  ArrowUpRight,
  ChevronLeft,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { Service, SiteConfig, NewsTicker } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ServiceCardEnhanced } from '@/components/service-card-enhanced';
import { IdentityShowcase } from '@/components/identity-showcase';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function DhofarPortal() {
  const { language, setLanguage } = useSettingsStore();
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  const [services, setServices] = useState<Service[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [tickerItems, setTickerItems] = useState<NewsTicker[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await fetchBin();
      if (data) {
        setServices(data.services || []);
        setSiteConfig(data.siteConfig || null);
        setTickerItems(data.newsItems || []);
      }
      setLoading(false);
    };
    load();
  }, []);

  const isAr = language === 'ar';

  const filteredServices = useMemo(() => {
    return services.filter(s => {
      const categoryMatch = activeCategory === 'all' || s.category === activeCategory;
      const titleMatch = (isAr ? s.title : (s.titleEn || s.title || '')).toLowerCase().includes(searchQuery.toLowerCase());
      const descMatch = (isAr ? s.description : (s.descriptionEn || s.description || '')).toLowerCase().includes(searchQuery.toLowerCase());
      return searchQuery ? (titleMatch || descMatch) : categoryMatch;
    });
  }, [services, activeCategory, searchQuery, isAr]);

  const searchResults = useMemo(() => {
    if (!searchQuery) return [];
    return services.filter(s => {
      const titleMatch = (isAr ? s.title : (s.titleEn || s.title || '')).toLowerCase().includes(searchQuery.toLowerCase());
      const descMatch = (isAr ? s.description : (s.descriptionEn || s.description || '')).toLowerCase().includes(searchQuery.toLowerCase());
      return titleMatch || descMatch;
    });
  }, [services, searchQuery, isAr]);

  const featuredServices = useMemo(() => services.filter(s => s.isFeatured), [services]);

  const categories = useMemo(() => {
    return [
      { id: 'all', label: isAr ? 'الكل' : 'All' },
      ...Object.entries(CAT_CONFIG).map(([id, cfg]) => ({
        id,
        label: isAr ? cfg.labelAr : cfg.labelEn
      }))
    ];
  }, [isAr]);

  const khareefImage = PlaceHolderImages.find(img => img.id === 'khareef-promo');

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="font-black text-primary animate-pulse">جاري تحضير البوابة الرقمية لبلدية ظفار...</p>
      </div>
    );
  }

  return (
    <div className={cn("flex min-h-screen flex-col bg-white text-slate-900", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Gov Bar */}
      <div className="bg-slate-900 text-white py-2 text-[10px] uppercase font-bold tracking-widest border-b border-white/5">
        <div className="mx-auto max-w-7xl px-6 flex justify-between items-center">
          <div className="flex gap-4">
             <span className="flex items-center gap-2 opacity-70"><Globe size={12} /> {isAr ? 'حكومة سلطنة عُمان' : 'Oman Government'}</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/template" className="text-accent hover:underline flex items-center gap-1.5 font-black">
              {isAr ? 'المساحة الذكية 3D' : 'Spatial Workspace'}
            </Link>
            <div className="h-3 w-px bg-white/20" />
            <Link href="/admin" className="text-accent hover:underline flex items-center gap-2">
              <LayoutDashboard size={12} /> {isAr ? 'لوحة التحكم' : 'Admin Panel'}
            </Link>
            <div className="h-3 w-px bg-white/20" />
            <button onClick={() => setLanguage(isAr ? 'en' : 'ar')} className="flex items-center gap-2 hover:text-accent transition-colors">
              <Languages size={12} />
              {isAr ? 'English' : 'العربية'}
            </button>
          </div>
        </div>
      </div>

      {/* News Ticker */}
      {tickerItems.length > 0 && (
        <div className="bg-primary text-white overflow-hidden relative h-12 flex items-center shadow-md z-40">
          <div className={cn("absolute top-0 h-full bg-secondary px-6 flex items-center z-10 font-black text-xs uppercase gap-3", isAr ? "right-0" : "left-0")}>
            <Bolt className="h-4 w-4 fill-current animate-pulse" />
            {isAr ? 'أخبار عاجلة' : 'Breaking News'}
          </div>
          <div className="flex-1 overflow-hidden whitespace-nowrap">
             <div className="animate-marquee inline-block pl-[100%] pr-4 py-2">
                {tickerItems.map((item) => (
                  <span key={item.id} className="mx-10 text-sm font-bold opacity-90">
                    {item.title && <span className="text-accent ml-2 uppercase">[{item.title}]</span>}
                    {item.text}
                    <span className="mx-4 text-white/30">|</span>
                  </span>
                ))}
             </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="relative bg-white border-b border-slate-100 py-6 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between relative z-10">
          <Link href="/" className="flex-shrink-0 flex items-center gap-4 group">
             <div className="relative h-16 w-16 transition-transform group-hover:scale-110">
               <Image src="https://apps.edm.gov.om/ords/r/dmpm/130/files/static/v15/cropped-DM-ICON.png" alt="Logo" fill className="object-contain" priority />
             </div>
             <div className="flex flex-col">
               <span className="text-2xl font-black text-primary leading-none tracking-tighter">{isAr ? 'بلدية ظفار' : 'Dhofar Municipality'}</span>
               <span className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em]">{isAr ? 'بوابة الخدمات الإلكترونية' : 'Electronic Services Portal'}</span>
             </div>
          </Link>
          <nav className="hidden lg:flex items-center gap-2">
            {[{id:'home',a:"الرئيسية",e:"Home"},{id:'identity',a:"دليل الهوية",e:"Identity Guide"}].map(l => (
              <button key={l.id} onClick={() => setActiveTab(l.id)} className={cn("px-6 py-2 rounded-md text-sm font-bold transition-all", activeTab === l.id ? "bg-accent/10 text-primary border-b-2 border-primary shadow-sm" : "text-slate-500 hover:text-primary")}>
                {isAr ? l.a : l.e}
              </button>
            ))}
          </nav>
          <Button className="dm-gradient-primary rounded-full px-8 font-black shadow-lg hidden sm:flex" asChild>
             <Link href="/admin">{isAr ? "دخول المستفيد" : "Login"}</Link>
          </Button>
        </div>
        <div className="absolute top-0 right-0 w-1/2 h-full dm-wave-5 opacity-10 pointer-events-none" />
      </header>

      <main className="flex-grow">
        {activeTab === 'home' ? (
          <div className="animate-in fade-in duration-500">
            
            {/* 1. Search Bar Section */}
            <section className="relative py-20 bg-slate-50 overflow-hidden">
               <div className="max-w-7xl mx-auto px-6 relative z-10">
                 <div className="max-w-3xl">
                   <h1 className="text-5xl md:text-7xl font-black text-primary tracking-tighter mb-6 leading-tight">
                     {siteConfig?.heroTitle || (isAr ? "خدماتنا رقمية، أسرع، وأسهل" : "Our services are digital, faster, and easier")}
                   </h1>
                   <p className="text-xl text-slate-500 font-bold mb-10 leading-relaxed max-w-2xl">
                     {siteConfig?.heroSubtitle || (isAr ? "كل الخدمات البلدية التي تحتاجها في مكان واحد وبأعلى معايير الجودة المعتمدة." : "All the municipal services you need in one place with the highest quality standards.")}
                   </p>
                   <div className="relative max-w-xl group">
                     <SearchIcon className={cn("absolute top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors", isAr ? "right-6" : "left-6")} size={24} />
                     <input 
                       type="text" 
                       placeholder={isAr ? "ابحث عن خدمة بلدية (مثال: بناء، عقد، ترخيص)..." : "Search municipal services..."} 
                       className={cn("w-full h-16 rounded-xl border-2 border-slate-200 text-lg font-bold outline-none focus:border-primary transition-all shadow-lg bg-white", isAr ? "pr-16 pl-8" : "pl-16 pr-8")} 
                       value={searchQuery} 
                       onChange={(e) => setSearchQuery(e.target.value)} 
                     />
                   </div>
                 </div>
               </div>
               <div className="absolute -bottom-10 right-0 w-1/2 h-64 dm-wave-5 opacity-5" />
            </section>

            {/* 2. Live Search Results Section */}
            {searchQuery && (
              <section className="py-12 bg-accent/5 border-b">
                <div className="max-w-7xl mx-auto px-6">
                  <div className="flex items-center gap-4 mb-8">
                     <div className="p-3 rounded-2xl bg-primary/10 text-primary"><SearchIcon size={24} /></div>
                     <h2 className="text-3xl font-black text-primary tracking-tighter">
                       {isAr ? `نتائج البحث عن "${searchQuery}"` : `Search Results for "${searchQuery}"`}
                     </h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                     {searchResults.map(s => <ServiceCardEnhanced key={s.id} service={s} isAr={isAr} />)}
                     {searchResults.length === 0 && (
                       <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-dashed p-8">
                         <p className="text-slate-400 font-bold">{isAr ? "عذراً، لم نجد نتائج تطابق بحثك الحالي" : "No results matching your query"}</p>
                       </div>
                     )}
                  </div>
                </div>
              </section>
            )}

            {/* 3. Featured Services (Most Used Services) */}
            {featuredServices.length > 0 && (
              <section className="py-16 bg-white border-b">
                <div className="max-w-7xl mx-auto px-6">
                  <div className="flex items-center gap-4 mb-10">
                     <div className="p-3 rounded-2xl bg-accent/10 text-accent"><TrendingUp size={24} /></div>
                     <h2 className="text-3xl font-black text-primary tracking-tighter">
                       {isAr ? "الخدمات الأكثر استخداماً والمميزة" : "Featured & Most Used Services"}
                     </h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {featuredServices.map(s => <ServiceCardEnhanced key={s.id} service={s} isAr={isAr} />)}
                  </div>
                </div>
              </section>
            )}

            {/* 4. Interactive News Ticker / Khareef Banner with dynamic Cover */}
            <section className="relative py-28 bg-slate-900 overflow-hidden min-h-[480px] flex items-center">
              {khareefImage && (
                <div className="absolute inset-0 opacity-40">
                  <Image 
                    src={khareefImage.imageUrl} 
                    alt="Khareef Dhofar Promo" 
                    fill 
                    className="object-cover"
                    data-ai-hint={khareefImage.imageHint}
                  />
                </div>
              )}
              <div className="max-w-7xl mx-auto px-6 relative z-10 text-center w-full">
                <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tighter drop-shadow-lg">
                  {isAr ? "استمتع بخريف ظفار.. وخدماتك البلدية رقمية بالكامل" : "Enjoy Khareef Dhofar.. with all your services online"}
                </h2>
                <p className="text-xl md:text-2xl text-white/80 font-bold mb-8 max-w-3xl mx-auto drop-shadow-md">
                  {isAr ? "أنجز جميع معاملاتك الحكومية والتراخيص البلدية وعقود الإيجار الرقمية أينما كنت بسهولة وأمان." : "Complete your government transactions through the portal wherever you are"}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Button size="icon" variant="ghost" className="rounded-full bg-white/10 text-white hover:bg-white/20">
                    <ChevronLeft className={cn(isAr ? "rotate-180" : "")} />
                  </Button>
                  <Button className="bg-accent text-slate-900 rounded-full font-black px-8 py-6 h-auto text-base hover:bg-white">
                    {isAr ? "ابدأ إنجاز معاملاتك" : "Start Transacting"}
                  </Button>
                  <Button size="icon" variant="ghost" className="rounded-full bg-white/10 text-white hover:bg-white/20">
                    <ChevronRight className={cn(isAr ? "rotate-180" : "")} />
                  </Button>
                </div>
              </div>
            </section>

            {/* 5. Statistics & Portal Transaction Numbers Counters */}
            <section className="py-20 bg-slate-900 text-white relative overflow-hidden border-b border-white/5">
               <div className="max-w-7xl mx-auto px-6 relative z-10 text-center mb-12">
                  <h2 className="text-3xl font-black mb-3">{isAr ? "بوابتنا بالأرقام والإحصائيات" : "Portal Transaction Counters"}</h2>
                  <p className="text-white/60 font-medium max-w-xl mx-auto text-sm">{isAr ? "مؤشرات أداء ومعاملات بلدية ظفار الرقمية المنجزة بشكل مؤتمت بالكامل." : "Real-time statistics reflecting the volume of work achieved through our integrated digital portal."}</p>
               </div>
               <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
                 {[
                   { label: isAr ? "إجمالي المعاملات" : "Total Transactions", count: siteConfig?.stats?.transactions || 45890, color: "bg-accent", icon: <LayoutGrid size={20} /> },
                   { label: isAr ? "تراخيص البناء" : "Building Permits", count: siteConfig?.stats?.permits || 12450, color: "bg-primary", icon: <FileText size={20} /> },
                   { label: isAr ? "عقود الإيجار" : "Lease Contracts", count: siteConfig?.stats?.contracts || 8920, color: "bg-secondary", icon: <ShieldCheck size={20} /> },
                   { label: isAr ? "المستفيدين الفاعلين" : "Active Stakeholders", count: siteConfig?.stats?.tickets || 34100, color: "bg-emerald-500", icon: <Users size={20} /> },
                 ].map((item, i) => (
                   <div key={i} className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 text-center">
                     <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white mx-auto mb-4 shadow-md", item.color)}>
                        {item.icon}
                     </div>
                     <p className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">
                        {item.count.toLocaleString()}
                     </p>
                     <h3 className="text-[11px] text-white/50 font-black uppercase tracking-wider">{item.label}</h3>
                   </div>
                 ))}
               </div>
               <div className="absolute top-0 right-0 w-1/2 h-full dm-wave-5 opacity-[0.04] pointer-events-none" />
            </section>

            {/* 6. Comprehensive Full Services Catalog Guide Section */}
            <section className="py-16 bg-slate-50 relative overflow-hidden" id="catalog">
              <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="flex flex-col md:flex-row items-end justify-between gap-6 mb-12">
                  <div>
                    <h2 className="text-3xl font-black text-primary tracking-tight mb-2">
                      {isAr ? "دليل دليل الخدمات الإلكترونية" : "Municipal Digital Catalog"}
                    </h2>
                    <p className="text-slate-500 text-xs font-bold">{isAr ? `تصفح واستكشف ${filteredServices.length} خدمة بلدية معتمدة ومتكاملة` : `Browse ${filteredServices.length} available services`}</p>
                  </div>
                  <div className="flex gap-1.5 bg-white p-1 rounded-xl border shadow-inner overflow-x-auto max-w-full">
                    {categories.map(cat => (
                      <button 
                        key={cat.id} 
                        onClick={() => setActiveCategory(cat.id)} 
                        className={cn("px-5 py-2 rounded-lg text-[11px] font-black transition-all whitespace-nowrap", activeCategory === cat.id ? "bg-primary text-white shadow" : "text-slate-500 hover:bg-slate-50")}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 min-h-[220px]">
                   {filteredServices.map(s => <ServiceCardEnhanced key={s.id} service={s} isAr={isAr} />)}
                   {filteredServices.length === 0 && (
                     <div className="col-span-full py-20 text-center border-2 border-dashed rounded-2xl bg-white/60">
                       <Target size={40} className="mx-auto text-slate-300 mb-3" />
                       <p className="text-slate-400 font-bold text-sm">{isAr ? "عذراً، لا توجد معاملات متاحة حالياً تحت هذا التصنيف" : "Sorry, no matches found for this category."}</p>
                     </div>
                   )}
                </div>
              </div>
              <div className="absolute top-0 left-0 w-full h-full dm-wave-5 opacity-[0.02] pointer-events-none" />
            </section>

          </div>
        ) : <IdentityShowcase isAr={isAr} />}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16 px-6 relative overflow-hidden border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 brightness-0 invert"><Image src="https://apps.edm.gov.om/ords/r/dmpm/130/files/static/v15/cropped-DM-ICON.png" alt="Logo" fill className="object-contain" /></div>
              <div className="flex flex-col">
                <span className="text-xl font-black">{isAr ? 'بلدية ظفار' : 'Dhofar Municipality'}</span>
                <span className="text-[9px] text-white/40 font-bold uppercase tracking-wider">{isAr ? 'سلطنة عمان - رؤية ٢٠٤٠' : 'Sultanate of Oman'}</span>
              </div>
            </div>
            <p className="text-xs text-white/50 font-bold leading-relaxed">{isAr ? "منصة رقمية موحدة لتقديم أرقى مستويات الكفاءة والذكاء الاستباقي لخدمة المواطن والمقيم في سلطنة عمان." : "We aim to provide a unique digital experience that serves citizens and residents."}</p>
          </div>
          
          <div className="flex flex-col gap-4 md:items-center">
             <div className="text-left rtl:text-right">
                <h4 className="font-black text-accent text-xs mb-3 uppercase tracking-wider">{isAr ? "مركز الدعم البلدي الموحد" : "Connect Hub"}</h4>
                <div className="space-y-2">
                  <div className="flex flex-col">
                    <span className="text-2xl font-black tracking-tight text-white">{siteConfig?.contactPhone || '1771'}</span>
                    <span className="text-[9px] text-white/30 font-bold uppercase">{isAr ? 'رقم الاتصال السريع' : 'Unified Call Center'}</span>
                  </div>
                  <p className="text-white/60 font-bold text-xs">{siteConfig?.contactEmail || 'care@dm.gov.om'}</p>
                </div>
             </div>
          </div>

          <div className="flex flex-col md:items-end justify-center">
             <Button variant="outline" className="rounded-full border-white/10 text-white hover:bg-white hover:text-slate-900 transition-all px-8 h-12 font-black text-xs">
                {isAr ? "الأسئلة الشائعة والمساعدة" : "FAQs & Support"}
             </Button>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-24 dm-wave-5 opacity-10 pointer-events-none" />
      </footer>
    </div>
  );
}
