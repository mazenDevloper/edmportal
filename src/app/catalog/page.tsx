'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { fetchBin } from '@/lib/jsonbin';
import { Service, SiteConfig } from '@/lib/types';
import { CAT_CONFIG, CategoryId } from '@/lib/constants';
import { useSettingsStore } from '@/lib/settings-store';
import { cn } from '@/lib/utils';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { 
  Search, 
  ChevronRight, 
  ChevronLeft, 
  ArrowLeft, 
  ArrowRight,
  Filter,
  User,
  Building2,
  Loader2,
  LayoutGrid
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

export default function ServiceCatalogPage() {
  const { language } = useSettingsStore();
  const isAr = language === 'ar';
  
  const [services, setServices] = useState<Service[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [userType, setUserType] = useState('all');

  useEffect(() => {
    fetchBin().then(data => {
      if (data) {
        setServices(data.services || []);
        setSiteConfig(data.siteConfig || null);
      }
      setLoading(false);
    });
  }, []);

  const filteredServices = useMemo(() => {
    return services.filter(s => {
      const matchesCat = activeCategory === 'all' || s.category === activeCategory;
      const matchesSearch = (isAr ? s.title : s.titleEn || s.title).toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [services, activeCategory, searchQuery, isAr]);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>;

  return (
    <div className={cn("min-h-screen bg-slate-50", isAr ? "font-arabic" : "font-sans")} dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={[]} />
      
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-4 gap-10">
          
          {/* Sidebar - Filtration */}
          <aside className="lg:col-span-1 space-y-8">
            <div className="space-y-6">
              <h3 className="text-xl font-black text-primary flex items-center gap-2 border-b pb-4">
                <Filter size={20} className="text-accent" /> {isAr ? 'التصفية' : 'Filtration'}
              </h3>
              
              <div className="space-y-4">
                <label className="text-xs font-black uppercase text-slate-400 tracking-widest">{isAr ? 'المستفيد' : 'User Type'}</label>
                <Select value={userType} onValueChange={setUserType}>
                  <SelectTrigger className="h-12 rounded-xl bg-white border-none shadow-sm font-bold">
                    <SelectValue placeholder={isAr ? 'اختر...' : 'Select...'} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                    <SelectItem value="all" className="font-bold">{isAr ? 'الكل' : 'All'}</SelectItem>
                    <SelectItem value="individual" className="font-bold">{isAr ? 'فرد' : 'Individual'}</SelectItem>
                    <SelectItem value="business" className="font-bold">{isAr ? 'مؤسسة / شركة' : 'Business'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4 pt-4">
                <label className="text-xs font-black uppercase text-slate-400 tracking-widest">{isAr ? 'الفئات' : 'Categories'}</label>
                <nav className="flex flex-col gap-1">
                  <button 
                    onClick={() => setActiveCategory('all')}
                    className={cn(
                      "flex items-center justify-between px-5 py-4 rounded-xl font-black text-sm transition-all",
                      activeCategory === 'all' ? "bg-primary text-white shadow-lg translate-x-1" : "text-slate-600 hover:bg-white hover:text-primary"
                    )}
                  >
                    <span>{isAr ? 'كافة الخدمات' : 'All Services'}</span>
                    <Badge variant="outline" className={cn("text-[10px] rounded-md", activeCategory === 'all' ? "border-white/20 text-white" : "text-slate-400")}>{services.length}</Badge>
                  </button>
                  {Object.entries(CAT_CONFIG).map(([id, conf]) => {
                    const count = services.filter(s => s.category === id).length;
                    return (
                      <button 
                        key={id}
                        onClick={() => setActiveCategory(id)}
                        className={cn(
                          "flex items-center justify-between px-5 py-4 rounded-xl font-black text-sm transition-all",
                          activeCategory === id ? "bg-primary text-white shadow-lg translate-x-1" : "text-slate-600 hover:bg-white hover:text-primary"
                        )}
                      >
                        <span>{isAr ? conf.labelAr : conf.labelEn}</span>
                        <Badge variant="outline" className={cn("text-[10px] rounded-md", activeCategory === id ? "border-white/20 text-white" : "text-slate-400")}>{count}</Badge>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </aside>

          {/* Main Content - Services List */}
          <div className="lg:col-span-3 space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm flex flex-col md:flex-row gap-6 justify-between items-center border border-slate-100">
               <div>
                  <h1 className="text-3xl font-black text-primary tracking-tight">{isAr ? 'دليل الخدمات والإجراءات' : 'Service Catalog & Procedures'}</h1>
                  <p className="text-slate-400 font-bold mt-1">{isAr ? 'استكشف كافة الخدمات البلدية المتاحة رقمياً' : 'Explore all digital municipal services'}</p>
               </div>
               <div className="relative w-full md:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <Input 
                    placeholder={isAr ? 'ابحث عن خدمة...' : 'Search services...'} 
                    className="pl-12 h-14 rounded-2xl bg-slate-50 border-none font-bold"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
               </div>
            </div>

            <div className="bg-white rounded-[3rem] shadow-xl overflow-hidden border border-slate-100">
               <div className="p-10 space-y-1">
                  {filteredServices.length > 0 ? (
                    filteredServices.map((service, idx) => (
                      <Link 
                        key={service.id} 
                        href={`/services/${service.id}`}
                        className="group flex items-center justify-between p-6 rounded-2xl hover:bg-slate-50 transition-all border-b last:border-none border-slate-50"
                      >
                        <div className="flex items-center gap-6">
                           <div className="size-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center group-hover:bg-accent group-hover:text-slate-900 transition-colors">
                              <LayoutGrid size={24} />
                           </div>
                           <div>
                              <h4 className="text-lg font-black text-slate-800 group-hover:text-primary transition-colors border-b-2 border-transparent group-hover:border-primary/20 pb-0.5 inline-block">
                                {isAr ? service.title : (service.titleEn || service.title)}
                              </h4>
                              <p className="text-xs text-slate-400 font-bold mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {isAr ? 'مدة الإنجاز: فورية' : 'Completion: Instant'}
                              </p>
                           </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <Badge variant="secondary" className="rounded-lg bg-slate-100 text-slate-500 font-black text-[10px] py-1 px-3">
                              {isAr ? CAT_CONFIG[service.category as CategoryId]?.labelAr : CAT_CONFIG[service.category as CategoryId]?.labelEn}
                           </Badge>
                           {isAr ? <ChevronLeft className="text-slate-300 group-hover:text-primary group-hover:-translate-x-2 transition-all" /> : <ChevronRight className="text-slate-300 group-hover:text-primary group-hover:translate-x-2 transition-all" />}
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="py-24 text-center space-y-4">
                       <div className="size-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-200"><Search size={40}/></div>
                       <p className="text-slate-400 font-black">{isAr ? 'لم يتم العثور على خدمات تطابق بحثك' : 'No services found matching your search'}</p>
                    </div>
                  )}
               </div>
            </div>
          </div>

        </div>
      </main>

      <PortalFooter siteConfig={siteConfig} />
    </div>
  );
}
