'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { fetchBin } from '@/lib/jsonbin';
import { CAT_CONFIG, CategoryId } from '@/lib/constants';
import { useSettingsStore } from '@/lib/settings-store';
import { 
  Bolt, 
  Globe, 
  LayoutDashboard, 
  Search as SearchIcon, 
  Languages, 
  Loader2, 
  TrendingUp, 
  ChevronRight, 
  Target,
  ChevronLeft,
  Users,
  FileText,
  ShieldCheck,
  LayoutGrid
} from 'lucide-react';
import Link from 'next/link';
import { Service, SiteConfig, NewsTicker, MenuItem, CarouselItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ServiceCardEnhanced } from '@/components/service-card-enhanced';
import { IdentityShowcase } from '@/components/identity-showcase';
import {
  Carousel,
  CarouselContent,
  CarouselItem as CarouselItemUI,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export default function DhofarPortal() {
  const { language, setLanguage } = useSettingsStore();
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  const [services, setServices] = useState<Service[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [tickerItems, setTickerItems] = useState<NewsTicker[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await fetchBin();
      if (data) {
        setServices(data.services || []);
        setSiteConfig(data.siteConfig || null);
        setTickerItems(data.newsItems || []);
        setMenuItems(data.menuItems || []);
        setCarouselItems(data.carouselItems || []);
      }
      setLoading(false);
    };
    load();
  }, []);

  const isAr = language === 'ar';

  const filteredServices = useMemo(() => {
    return services.filter(s => {
      const categoryMatch = activeCategory === 'all' || s.category === activeCategory;
      const title = (isAr ? s.title : (s.titleEn || s.title || '')).toLowerCase();
      const desc = (isAr ? s.description : (s.descriptionEn || s.description || '')).toLowerCase();
      const query = searchQuery.toLowerCase();
      return searchQuery ? (title.includes(query) || desc.includes(query)) : categoryMatch;
    });
  }, [services, activeCategory, searchQuery, isAr]);

  const featuredServices = useMemo(() => services.filter(s => s.isFeatured), [services]);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className={cn("flex min-h-screen flex-col bg-white", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Bar */}
      <div className="bg-slate-900 text-white py-2 text-[10px] font-bold tracking-widest border-b border-white/5">
        <div className="mx-auto max-w-7xl px-6 flex justify-between items-center">
          <span className="flex items-center gap-2 opacity-70"><Globe size={12} /> {isAr ? 'حكومة سلطنة عُمان' : 'Oman Government'}</span>
          <div className="flex items-center gap-6">
            <Link href="/template" className="text-accent hover:underline font-black">{isAr ? 'المساحة الذكية 3D' : 'Spatial Workspace'}</Link>
            <Link href="/admin" className="text-accent hover:underline flex items-center gap-2"><LayoutDashboard size={12} /> {isAr ? 'لوحة التحكم' : 'Admin Panel'}</Link>
            <button onClick={() => setLanguage(isAr ? 'en' : 'ar')} className="hover:text-accent">{isAr ? 'English' : 'العربية'}</button>
          </div>
        </div>
      </div>

      {/* Ticker */}
      {tickerItems.length > 0 && (
        <div className="bg-primary text-white h-12 flex items-center overflow-hidden relative shadow-md">
          <div className={cn("absolute bg-secondary px-6 h-full flex items-center z-10 font-black text-xs", isAr ? "right-0" : "left-0")}>
            <Bolt className="h-4 w-4 animate-pulse mr-2" /> {isAr ? 'أخبار عاجلة' : 'Breaking News'}
          </div>
          <div className="animate-marquee whitespace-nowrap pl-[100%]">
            {tickerItems.map(item => <span key={item.id} className="mx-8 font-bold text-sm">[{item.title}] {item.text} |</span>)}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b py-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between z-10 relative">
          <Link href="/" className="flex items-center gap-4">
             <Image src="https://apps.edm.gov.om/ords/r/dmpm/130/files/static/v15/cropped-DM-ICON.png" alt="Logo" width={60} height={60} className="object-contain" />
             <div className="flex flex-col">
               <span className="text-2xl font-black text-primary leading-none">{isAr ? 'بلدية ظفار' : 'Dhofar Municipality'}</span>
               <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">{isAr ? 'بوابة الخدمات الإلكترونية' : 'Electronic Services Portal'}</span>
             </div>
          </Link>
          <nav className="hidden lg:flex items-center gap-4">
            {menuItems.length > 0 ? menuItems.map(item => (
              <Link key={item.id} href={item.link} className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">
                {isAr ? item.labelAr : item.labelEn}
              </Link>
            )) : (
              <button onClick={() => setActiveTab('home')} className="text-sm font-bold text-primary border-b-2 border-primary pb-1">{isAr ? 'الرئيسية' : 'Home'}</button>
            )}
            <button onClick={() => setActiveTab('identity')} className="text-sm font-bold text-slate-600 hover:text-primary">{isAr ? 'دليل الهوية' : 'Identity Guide'}</button>
          </nav>
        </div>
        <div className="absolute top-0 right-0 w-1/2 h-full dm-wave-5 opacity-10 pointer-events-none" />
      </header>

      <main className="flex-grow">
        {activeTab === 'home' ? (
          <div>
            {/* Carousel */}
            {carouselItems.length > 0 && (
              <section className="relative">
                <Carousel className="w-full" opts={{ loop: true }}>
                  <CarouselContent>
                    {carouselItems.map(item => (
                      <CarouselItemUI key={item.id}>
                        <div className="relative h-[500px] w-full flex items-center justify-center overflow-hidden">
                          <Image src={item.imageUrl} alt={item.titleAr} fill className="object-cover brightness-50" />
                          <div className="relative z-10 text-center text-white px-6">
                            <h2 className="text-5xl md:text-7xl font-black mb-4 drop-shadow-lg">{isAr ? item.titleAr : item.titleEn}</h2>
                            <p className="text-xl md:text-2xl font-bold opacity-90 mb-8">{isAr ? item.subtitleAr : item.subtitleEn}</p>
                            {item.linkUrl && <Button className="dm-gradient-primary rounded-full px-10 h-14 text-lg font-black" asChild><Link href={item.linkUrl}>{isAr ? 'استكشف الآن' : 'Explore Now'}</Link></Button>}
                          </div>
                        </div>
                      </CarouselItemUI>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-4" />
                  <CarouselNext className="right-4" />
                </Carousel>
              </section>
            )}

            {/* Search */}
            <section className="py-20 bg-slate-50 relative overflow-hidden">
               <div className="max-w-7xl mx-auto px-6 relative z-10">
                 <div className="max-w-3xl">
                   <h1 className="text-5xl md:text-7xl font-black text-primary tracking-tighter mb-6">
                     {siteConfig?.heroTitle || (isAr ? "خدماتنا رقمية، أسرع، وأسهل" : "Digital Services")}
                   </h1>
                   <p className="text-xl text-slate-500 font-bold mb-10">
                     {siteConfig?.heroSubtitle || (isAr ? "بوابة بلدية ظفار الموحدة" : "Unified Portal")}
                   </p>
                   <div className="relative group max-w-xl">
                     <SearchIcon className={cn("absolute top-1/2 -translate-y-1/2 text-slate-400", isAr ? "right-6" : "left-6")} />
                     <input 
                       type="text" 
                       placeholder={isAr ? "ابحث عن خدمة بلدية..." : "Search services..."} 
                       className={cn("w-full h-16 rounded-xl border-2 font-bold focus:border-primary px-16 shadow-lg bg-white outline-none")} 
                       value={searchQuery} 
                       onChange={(e) => setSearchQuery(e.target.value)} 
                     />
                   </div>
                 </div>
               </div>
            </section>

            {/* Catalog */}
            <section className="py-16 bg-white">
              <div className="max-w-7xl mx-auto px-6">
                <div className="flex justify-between items-end mb-12">
                   <h2 className="text-3xl font-black text-primary">{isAr ? "دليل الخدمات الإلكترونية" : "Service Catalog"}</h2>
                   <div className="flex gap-2 overflow-x-auto pb-2">
                     {['all', ...Object.keys(CAT_CONFIG)].map(cid => (
                       <Button key={cid} onClick={() => setActiveCategory(cid)} variant={activeCategory === cid ? 'default' : 'outline'} className="rounded-full font-bold px-6">
                         {cid === 'all' ? (isAr ? 'الكل' : 'All') : (isAr ? CAT_CONFIG[cid as CategoryId].labelAr : CAT_CONFIG[cid as CategoryId].labelEn)}
                       </Button>
                     ))}
                   </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {filteredServices.map(s => <ServiceCardEnhanced key={s.id} service={s} isAr={isAr} />)}
                </div>
              </div>
            </section>
          </div>
        ) : <IdentityShowcase isAr={isAr} />}
      </main>

      <footer className="bg-slate-900 text-white py-16 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12 relative z-10">
          <div className="space-y-4">
             <div className="flex items-center gap-3">
               <Image src="https://apps.edm.gov.om/ords/r/dmpm/130/files/static/v15/cropped-DM-ICON.png" alt="Logo" width={40} height={40} className="brightness-0 invert" />
               <span className="text-xl font-black">{isAr ? 'بلدية ظفار' : 'Dhofar Municipality'}</span>
             </div>
             <p className="text-xs text-white/50">{isAr ? "منصة رقمية موحدة للخدمات البلدية" : "Unified Digital Municipal Services Platform"}</p>
          </div>
          <div className="flex flex-col gap-2">
            <h4 className="text-accent text-xs font-black uppercase mb-2">{isAr ? "تواصل معنا" : "Contact"}</h4>
            <span className="text-2xl font-black">{siteConfig?.contactPhone || '1771'}</span>
            <span className="text-white/60 font-bold">{siteConfig?.contactEmail || 'care@dm.gov.om'}</span>
          </div>
          <div className="flex justify-end">
             <Button variant="outline" className="rounded-full border-white/10 text-white hover:bg-white hover:text-slate-900 font-black h-12 px-8">
                {isAr ? "المساعدة والدعم" : "Help & Support"}
             </Button>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-24 dm-wave-5 opacity-10" />
      </footer>
    </div>
  );
}
