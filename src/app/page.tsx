'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { fetchBin } from '@/lib/jsonbin';
import { CAT_CONFIG, CategoryId } from '@/lib/constants';
import { useSettingsStore } from '@/lib/settings-store';
import { 
  Globe, 
  Search as SearchIcon, 
  Loader2, 
  TrendingUp,
  ShieldCheck,
  FileText,
  Users,
  Star,
  BookOpen,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { Service, SiteConfig, NewsTicker, MenuItem, CarouselItem, Course } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ServiceCardEnhanced } from '@/components/service-card-enhanced';
import { IdentityShowcase } from '@/components/identity-showcase';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import {
  Carousel,
  CarouselContent,
  CarouselItem as CarouselItemUI,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function DhofarPortal() {
  const { language } = useSettingsStore();
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  const [services, setServices] = useState<Service[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await fetchBin();
      if (data) {
        setServices(data.services || []);
        setCourses(data.courses || []);
        setSiteConfig(data.siteConfig || null);
        setMenuItems(data.menuItems || []);
        setCarouselItems(data.carouselItems || []);
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
    return services.filter(s => {
      return activeCategory === 'all' || s.category === activeCategory;
    });
  }, [services, activeCategory]);

  const featuredServices = useMemo(() => services.filter(s => s.isFeatured), [services]);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className={cn("flex min-h-screen flex-col bg-white", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={menuItems} />

      <main className="flex-grow">
        {activeTab === 'home' ? (
          <div className="space-y-0">
            {/* 1. Search Bar Section (Hero) */}
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
               <div className="absolute top-0 right-0 w-1/2 h-full dm-wave-5 opacity-10 pointer-events-none" />
            </section>

            {/* 2. Live Search Results Grid */}
            {searchQuery && (
              <section className="py-12 bg-white border-b animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="max-w-7xl mx-auto px-6">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="h-8 w-1.5 bg-accent rounded-full" />
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

            {/* 3. Featured Services (الخدمات المميزة) */}
            {featuredServices.length > 0 && (
              <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                  <div className="flex items-center gap-3 mb-12">
                    <Star className="text-accent fill-accent" size={24} />
                    <h2 className="text-3xl font-black text-primary">{isAr ? "الخدمات الأكثر استخداماً" : "Most Used Services"}</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                    {featuredServices.map(s => <ServiceCardEnhanced key={s.id} service={s} isAr={isAr} />)}
                  </div>
                </div>
              </section>
            )}

            {/* 4. Khareef Carousel / News Banner with Background Cover */}
            {carouselItems.length > 0 && (
              <section className="relative group overflow-hidden">
                <Carousel className="w-full" opts={{ loop: true }}>
                  <CarouselContent>
                    {carouselItems.map(item => (
                      <CarouselItemUI key={item.id}>
                        <div className="relative h-[500px] w-full flex items-center justify-center">
                          <Image 
                            src={item.imageUrl || "https://picsum.photos/seed/dhofar/1200/600"} 
                            alt={item.titleAr} 
                            fill 
                            className="object-cover brightness-[0.4]" 
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
                  <CarouselPrevious className="left-8" />
                  <CarouselNext className="right-8" />
                </Carousel>
              </section>
            )}

            {/* 5. Statistics (الارقام) */}
            <section className="py-24 bg-primary text-white relative overflow-hidden">
               <div className="max-w-7xl mx-auto px-6 relative z-10">
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
                    <div className="space-y-2">
                       <TrendingUp className="mx-auto text-accent mb-4" size={40} />
                       <h3 className="text-5xl font-black">{siteConfig?.stats?.transactions || '0'}+</h3>
                       <p className="text-sm font-bold opacity-70 tracking-widest">{isAr ? 'معاملة رقمية' : 'Transactions'}</p>
                    </div>
                    <div className="space-y-2">
                       <ShieldCheck className="mx-auto text-accent mb-4" size={40} />
                       <h3 className="text-5xl font-black">{siteConfig?.stats?.permits || '0'}+</h3>
                       <p className="text-sm font-bold opacity-70 tracking-widest">{isAr ? 'رخصة بناء' : 'Permits'}</p>
                    </div>
                    <div className="space-y-2">
                       <FileText className="mx-auto text-accent mb-4" size={40} />
                       <h3 className="text-5xl font-black">{siteConfig?.stats?.contracts || '0'}+</h3>
                       <p className="text-sm font-bold opacity-70 tracking-widest">{isAr ? 'عقد إيجار' : 'Leases'}</p>
                    </div>
                    <div className="space-y-2">
                       <Users className="mx-auto text-accent mb-4" size={40} />
                       <h3 className="text-5xl font-black">{siteConfig?.stats?.tickets || '0'}+</h3>
                       <p className="text-sm font-bold opacity-70 tracking-widest">{isAr ? 'تذكرة دعم' : 'Tickets'}</p>
                    </div>
                 </div>
               </div>
               <div className="absolute inset-0 dm-wave-5 opacity-10" />
            </section>

            {/* 6. Services Catalog (دليل الخدمات) */}
            <section className="py-24 bg-white">
              <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
                   <div>
                     <h2 className="text-4xl font-black text-primary mb-2">{isAr ? "دليل الخدمات الإلكترونية" : "Service Catalog"}</h2>
                     <p className="text-slate-400 font-bold">{isAr ? "استكشف كافة الخدمات البلدية المتاحة رقمياً" : "Explore all municipal services"}</p>
                   </div>
                   <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto">
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
                   </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {catalogServices.map(s => <ServiceCardEnhanced key={s.id} service={s} isAr={isAr} />)}
                </div>
              </div>
            </section>

            {/* 7. Identity Components Showcase Access */}
            <section className="py-24 bg-slate-50">
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
