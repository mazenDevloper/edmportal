'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { fetchBin } from '@/lib/jsonbin';
import { CAT_CONFIG, CategoryId } from '@/lib/constants';
import { useSettingsStore } from '@/lib/settings-store';
import { 
  Globe, 
  LayoutDashboard, 
  Search as SearchIcon, 
  Loader2, 
  TrendingUp,
  Target,
  Users,
  FileText,
  ShieldCheck,
  Star,
  BookOpen,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { Service, SiteConfig, NewsTicker, MenuItem, CarouselItem, Course } from '@/lib/types';
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
    return services.filter(s => {
      const title = (isAr ? s.title : (s.titleEn || s.title || '')).toLowerCase();
      const desc = (isAr ? s.description : (s.descriptionEn || s.description || '')).toLowerCase();
      const query = searchQuery.toLowerCase();
      return title.includes(query) || desc.includes(query);
    });
  }, [services, searchQuery, isAr]);

  const catalogServices = useMemo(() => {
    return services.filter(s => {
      const categoryMatch = activeCategory === 'all' || s.category === activeCategory;
      return categoryMatch;
    });
  }, [services, activeCategory]);

  const featuredServices = useMemo(() => services.filter(s => s.isFeatured), [services]);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className={cn("flex min-h-screen flex-col bg-white", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Bar */}
      <div className="bg-slate-900 text-white py-2 text-[10px] font-bold tracking-widest border-b border-white/5">
        <div className="mx-auto max-w-7xl px-6 flex justify-between items-center">
          <span className="flex items-center gap-2 opacity-70"><Globe size={12} /> {isAr ? 'حكومة سلطنة عُمان' : 'Oman Government'}</span>
          <div className="flex items-center gap-6">
            <Link href="/template" className="text-accent hover:underline font-black">{isAr ? 'المساحة الذكية' : 'Spatial Workspace'}</Link>
            <Link href="/admin" className="text-accent hover:underline flex items-center gap-2"><LayoutDashboard size={12} /> {isAr ? 'لوحة التحكم' : 'Admin Panel'}</Link>
            <button onClick={() => setLanguage(isAr ? 'en' : 'ar')} className="hover:text-accent">{isAr ? 'English' : 'العربية'}</button>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white border-b py-6 sticky top-0 z-[50] shadow-sm">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4">
             <Image src="https://apps.edm.gov.om/ords/r/dmpm/130/files/static/v15/cropped-DM-ICON.png" alt="Logo" width={60} height={60} className="object-contain" />
             <div className="flex flex-col">
               <span className="text-2xl font-black text-primary leading-none">{isAr ? 'بلدية ظفار' : 'Dhofar Municipality'}</span>
               <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">{isAr ? 'بوابة الخدمات الإلكترونية' : 'Electronic Services Portal'}</span>
             </div>
          </Link>
          <nav className="hidden lg:flex items-center gap-6">
            <button onClick={() => { setActiveTab('home'); window.scrollTo(0,0); }} className={cn("text-sm font-bold transition-colors", activeTab === 'home' ? "text-primary border-b-2 border-primary pb-1" : "text-slate-600 hover:text-primary")}>
              {isAr ? 'الرئيسية' : 'Home'}
            </button>
            {menuItems.map(item => (
              <Link key={item.id} href={item.link} className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">
                {isAr ? item.labelAr : item.labelEn}
              </Link>
            ))}
            <button onClick={() => setActiveTab('identity')} className={cn("text-sm font-bold transition-colors", activeTab === 'identity' ? "text-primary border-b-2 border-primary pb-1" : "text-slate-600 hover:text-primary")}>
              {isAr ? 'دليل الهوية' : 'Identity Guide'}
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-grow">
        {activeTab === 'home' ? (
          <div className="space-y-0">
            {/* 1. Search Bar Section */}
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

            {/* 2. Live Search Results */}
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

            {/* 3. Featured Services */}
            {featuredServices.length > 0 && (
              <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                  <div className="flex items-center justify-between mb-12">
                    <div className="flex items-center gap-3">
                      <Star className="text-accent fill-accent" size={24} />
                      <h2 className="text-3xl font-black text-primary">{isAr ? "الخدمات الأكثر استخداماً" : "Most Used Services"}</h2>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                    {featuredServices.map(s => <ServiceCardEnhanced key={s.id} service={s} isAr={isAr} />)}
                  </div>
                </div>
              </section>
            )}

            {/* 4. Khareef Carousel */}
            {carouselItems.length > 0 && (
              <section className="relative group">
                <Carousel className="w-full" opts={{ loop: true }}>
                  <CarouselContent>
                    {carouselItems.map(item => (
                      <CarouselItemUI key={item.id}>
                        <div className="relative h-[600px] w-full flex items-center justify-center overflow-hidden">
                          <Image 
                            src={item.imageUrl || "https://picsum.photos/seed/dhofar/1200/600"} 
                            alt={item.titleAr} 
                            fill 
                            className="object-cover brightness-[0.4]" 
                          />
                          <div className="relative z-10 text-center text-white px-6 max-w-4xl">
                            <h2 className="text-6xl md:text-8xl font-black mb-6 drop-shadow-2xl">{isAr ? item.titleAr : item.titleEn}</h2>
                            <p className="text-2xl md:text-3xl font-bold opacity-90 mb-10">{isAr ? item.subtitleAr : item.subtitleEn}</p>
                            <Button className="dm-gradient-primary rounded-full px-12 h-16 text-xl font-black shadow-2xl">
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

            {/* 5. Statistics */}
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

            {/* 6. Training & Courses Section */}
            <section className="py-24 bg-slate-50">
              <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                   <div>
                     <h2 className="text-4xl font-black text-primary mb-2 flex items-center gap-3">
                       <BookOpen className="text-accent" /> {isAr ? "البرامج التدريبية المتاحة" : "Educational Programs"}
                     </h2>
                     <p className="text-slate-400 font-bold">{isAr ? "طور مهاراتك مع دورات بلدية ظفار المعتمدة" : "Develop your skills with certified Dhofar Municipality courses"}</p>
                   </div>
                   <Button variant="link" className="text-primary font-black flex items-center gap-2">
                     {isAr ? "عرض كافة الدورات" : "View All Programs"} <ChevronRight className={cn("size-4", isAr && "rotate-180")} />
                   </Button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {courses.map(course => (
                    <Card key={course.id} className="rounded-brand overflow-hidden group shadow-sm hover:shadow-xl transition-all border-none">
                      <div className="relative h-48 w-full">
                        <Image 
                          src={course.imageUrl || "https://picsum.photos/seed/edu/800/400"} 
                          alt={course.titleAr} 
                          fill 
                          className="object-cover group-hover:scale-105 transition-transform" 
                        />
                        <div className="absolute top-4 right-4">
                           <Badge className="bg-white/90 text-primary font-bold backdrop-blur-sm border-none">{course.durationAr}</Badge>
                        </div>
                      </div>
                      <CardContent className="p-6">
                        <h4 className="text-xl font-black text-primary mb-2">{isAr ? course.titleAr : course.titleEn}</h4>
                        <p className="text-sm text-slate-500 line-clamp-2 mb-6 font-medium leading-relaxed">
                          {isAr ? course.descriptionAr : course.descriptionEn}
                        </p>
                        <Button className="w-full bg-slate-900 rounded-full font-black group-hover:bg-primary transition-colors">
                          {isAr ? "سجل الآن" : "Enroll Now"}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </section>

            {/* 7. Catalog */}
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
          </div>
        ) : <IdentityShowcase isAr={isAr} />}
      </main>

      <footer className="bg-slate-950 text-white py-20 px-6 relative overflow-hidden border-t-8 border-accent">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-16 relative z-10">
          <div className="space-y-6">
             <div className="flex items-center gap-4">
               <Image src="https://apps.edm.gov.om/ords/r/dmpm/130/files/static/v15/cropped-DM-ICON.png" alt="Logo" width={60} height={60} className="brightness-0 invert" />
               <div className="flex flex-col">
                 <span className="text-2xl font-black">{isAr ? 'بلدية ظفار' : 'Dhofar Municipality'}</span>
                 <span className="text-[10px] text-accent font-black tracking-widest uppercase">{isAr ? 'حكومة سلطنة عمان' : 'OMAN GOVERNMENT'}</span>
               </div>
             </div>
             <p className="text-sm text-white/40 leading-relaxed font-medium">
               {isAr ? "نعمل بجد لتطوير محافظة ظفار وتقديم أفضل الخدمات الرقمية." : "We work diligently to develop Dhofar Governorate and provide the best digital services."}
             </p>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="text-accent text-xs font-black uppercase tracking-widest mb-2">{isAr ? "تواصل مباشر" : "Contact"}</h4>
            <div className="flex items-center gap-6">
              <span className="text-5xl font-black text-white">{siteConfig?.contactPhone || '1771'}</span>
              <div className="h-12 w-px bg-white/10" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white/50">{isAr ? "البريد الإلكتروني" : "Email"}</span>
                <span className="text-sm font-black">{siteConfig?.contactEmail || 'care@dm.gov.om'}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-6">
             <h4 className="text-accent text-xs font-black uppercase tracking-widest mb-2">{isAr ? "روابط سريعة" : "Quick Links"}</h4>
             <div className="grid grid-cols-2 gap-4">
                <Link href="/template" className="text-sm font-bold text-white/60 hover:text-white">{isAr ? 'المساحة الذكية' : 'Spatial Workspace'}</Link>
                <Link href="/admin" className="text-sm font-bold text-white/60 hover:text-white">{isAr ? 'لوحة التحكم' : 'Admin Panel'}</Link>
             </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-40 dm-wave-5 opacity-10 pointer-events-none" />
      </footer>
    </div>
  );
}
