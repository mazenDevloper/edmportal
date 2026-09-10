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
  Cpu, 
  Sparkles,
  Search as SearchIcon,
  Languages,
  FileText,
  ShieldCheck,
  Globe,
  LayoutDashboard,
  Users,
  Search,
  Loader2,
  ArrowUpRight,
  TrendingUp,
  ChevronRight,
  Target
} from 'lucide-react';
import Link from 'next/link';
import { Service, SiteConfig, NewsTicker } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ServiceCardEnhanced } from '@/components/service-card-enhanced';
import { IdentityShowcase } from '@/components/identity-showcase';

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

  // Featured services section (marked by star in admin)
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="font-black text-primary animate-pulse">جاري تحضير البوابة الرقمية...</p>
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
          <Button className="dm-gradient-primary rounded-full px-8 font-black shadow-lg hidden sm:flex">
             {isAr ? "دخول المستفيد" : "Login"}
          </Button>
        </div>
        <div className="absolute top-0 right-0 w-1/2 h-full dm-wave-5 opacity-10 pointer-events-none" />
      </header>

      <main className="flex-grow">
        {activeTab === 'home' ? (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            
            {/* Hero & Search Section */}
            <section className="relative py-20 bg-slate-50 overflow-hidden">
               <div className="max-w-7xl mx-auto px-6 relative z-10">
                 <div className="max-w-3xl">
                   <h1 className="text-5xl md:text-7xl font-black text-primary tracking-tighter mb-6 leading-tight">
                     {siteConfig?.heroTitle || (isAr ? "خدماتنا رقمية، أسرع، وأسهل" : "Our services are digital, faster, and easier")}
                   </h1>
                   <p className="text-xl text-slate-500 font-bold mb-10 leading-relaxed max-w-2xl">
                     {siteConfig?.heroSubtitle || (isAr ? "كل الخدمات البلدية التي تحتاجها في مكان واحد وبأعلى معايير الجودة." : "All the municipal services you need in one place with the highest quality standards.")}
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

            {/* CRITICAL CHANGED FLOW: Search results strictly ABOVE featured/most-used services */}
            {searchQuery && (
              <section className="py-16 bg-accent/5 border-b">
                <div className="max-w-7xl mx-auto px-6">
                  <div className="flex items-center gap-4 mb-10">
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

            {/* Featured Services (The "Most Used" section now marked by star in Admin) */}
            {featuredServices.length > 0 && (
              <section className="py-16 bg-white border-b">
                <div className="max-w-7xl mx-auto px-6">
                  <div className="flex items-center gap-4 mb-10">
                     <div className="p-3 rounded-2xl bg-accent/10 text-accent"><TrendingUp size={24} /></div>
                     <h2 className="text-3xl font-black text-primary tracking-tighter">{isAr ? "الخدمات المميزة" : "Featured Services"}</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {featuredServices.map(s => <ServiceCardEnhanced key={s.id} service={s} isAr={isAr} />)}
                  </div>
                </div>
              </section>
            )}

            {/* Services Catalog */}
            <section className="py-16 bg-slate-50 relative overflow-hidden" id="catalog">
              <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-16">
                  <div>
                    <h2 className="text-4xl font-black text-primary tracking-tighter mb-4">
                      {isAr ? "دليل الخدمات الإلكترونية" : "Services Catalog"}
                    </h2>
                    <p className="text-slate-500 font-bold">{isAr ? `تصفح ${filteredServices.length} خدمة بلدية متاحة` : `Browse ${filteredServices.length} available services`}</p>
                  </div>
                  <div className="flex gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-inner overflow-x-auto max-w-full">
                    {categories.map(cat => (
                      <button 
                        key={cat.id} 
                        onClick={() => setActiveCategory(cat.id)} 
                        className={cn("px-6 py-2.5 rounded-lg text-xs font-black transition-all whitespace-nowrap", activeCategory === cat.id ? "bg-primary text-white shadow-lg scale-105" : "text-slate-500 hover:bg-slate-50")}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 min-h-[200px]">
                   {filteredServices.map(s => <ServiceCardEnhanced key={s.id} service={s} isAr={isAr} />)}
                   {filteredServices.length === 0 && (
                     <div className="col-span-full py-24 text-center border-2 border-dashed border-slate-200 rounded-[3rem] bg-white/50">
                       <Target size={48} className="mx-auto text-slate-300 mb-4" />
                       <p className="text-slate-400 font-black text-lg">{isAr ? "عذراً، لم نجد نتائج تتطابق مع هذا التصنيف" : "Sorry, no matches found for this category."}</p>
                     </div>
                   )}
                </div>
              </div>
              <div className="absolute top-0 left-0 w-full h-full dm-wave-5 opacity-[0.03] pointer-events-none" />
            </section>

            {/* Statistics */}
            <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
               <div className="max-w-7xl mx-auto px-6 relative z-10 text-center mb-16">
                  <h2 className="text-4xl font-black mb-4">{isAr ? "البوابة الرقمية بالأرقام" : "Digital Portal in Numbers"}</h2>
                  <p className="text-white/60 font-bold max-w-2xl mx-auto">{isAr ? "إحصائيات مباشرة تعكس حجم العمل المنجز عبر بوابتنا الرقمية المتكاملة." : "Real-time statistics reflecting the volume of work achieved through our integrated digital portal."}</p>
               </div>
               <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
                 {[
                   { label: isAr ? "إجمالي المعاملات" : "Total Transactions", count: siteConfig?.stats?.transactions || 0, color: "bg-accent", icon: <LayoutGrid /> },
                   { label: isAr ? "تراخيص البناء" : "Building Permits", count: siteConfig?.stats?.permits || 0, color: "bg-primary", icon: <FileText /> },
                   { label: isAr ? "عقود الإيجار" : "Lease Contracts", count: siteConfig?.stats?.contracts || 0, color: "bg-secondary", icon: <ShieldCheck /> },
                   { label: isAr ? "التذاكر الرقمية" : "Digital Tickets", count: siteConfig?.stats?.tickets || 0, color: "bg-emerald-500", icon: <Users /> },
                 ].map((item, i) => (
                   <div key={i} className="bg-white/5 backdrop-blur-sm p-8 rounded-[2.5rem] border border-white/10 group hover:bg-white/10 transition-all text-center">
                     <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg", item.color)}>
                        {item.icon}
                     </div>
                     <p className="text-3xl md:text-5xl font-black text-white mb-3 tracking-tighter">
                        {item.count.toLocaleString()}
                     </p>
                     <h3 className="text-xs text-white/50 font-black uppercase tracking-widest">{item.label}</h3>
                   </div>
                 ))}
               </div>
               <div className="absolute top-0 right-0 w-1/2 h-full dm-wave-5 opacity-[0.05] pointer-events-none" />
            </section>
          </div>
        ) : <IdentityShowcase isAr={isAr} />}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-20 px-6 relative overflow-hidden border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-20 relative z-10">
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="relative h-14 w-14 brightness-0 invert"><Image src="https://apps.edm.gov.om/ords/r/dmpm/130/files/static/v15/cropped-DM-ICON.png" alt="Logo" fill className="object-contain" /></div>
              <div className="flex flex-col">
                <span className="text-2xl font-black">{isAr ? 'بلدية ظفار' : 'Dhofar Municipality'}</span>
                <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{isAr ? 'سلطنة عمان' : 'Sultanate of Oman'}</span>
              </div>
            </div>
            <p className="text-sm text-white/50 font-bold leading-relaxed">{isAr ? "نهدف إلى تقديم تجربة رقمية فريدة تخدم المواطن والمقيم وتساهم في تحقيق رؤية عمان 2040." : "We aim to provide a unique digital experience that serves citizens and residents and contributes to achieving Oman Vision 2040."}</p>
          </div>
          
          <div className="flex flex-col gap-6 md:items-center">
             <div className="text-left rtl:text-right">
                <h4 className="font-black text-accent text-sm mb-4 uppercase tracking-widest">{isAr ? "تواصل معنا" : "Connect"}</h4>
                <div className="space-y-4">
                  <div className="flex flex-col">
                    <span className="text-3xl font-black tracking-tighter text-white">{siteConfig?.contactPhone || '1771'}</span>
                    <span className="text-[10px] text-white/30 font-bold uppercase">{isAr ? 'مركز الاتصال الموحد' : 'Unified Call Center'}</span>
                  </div>
                  <p className="text-white/60 font-bold">{siteConfig?.contactEmail || 'portal@dm.gov.om'}</p>
                </div>
             </div>
          </div>

          <div className="flex flex-col md:items-end justify-center">
             <Button variant="outline" className="rounded-full border-white/20 text-white hover:bg-white hover:text-slate-900 transition-all px-10 h-14 font-black">
                {isAr ? "الأسئلة الشائعة" : "FAQs"}
             </Button>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-32 dm-wave-5 opacity-10 pointer-events-none" />
      </footer>
    </div>
  );
}
