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
  Filter,
  Loader2,
  LayoutGrid,
  Clock,
  BadgeCent,
  ListChecks,
  ShieldAlert,
  ArrowRight,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
    }).catch(() => setLoading(false));
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
                <Filter size={20} className="text-accent" /> {isAr ? 'التصفية الذكية' : 'Smart Filtering'}
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

          {/* Main Content - Services List (Accordion Style) */}
          <div className="lg:col-span-3 space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm flex flex-col md:flex-row gap-6 justify-between items-center border border-slate-100">
               <div>
                  <h1 className="text-3xl font-black text-primary tracking-tight">{isAr ? 'دليل الخدمات والإجراءات' : 'Service Catalog & Procedures'}</h1>
                  <p className="text-slate-400 font-bold mt-1">{isAr ? 'اضغط على الخدمة لاستعراض كافة التفاصيل والمتطلبات' : 'Click on a service to expand full details and requirements'}</p>
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

            <div className="bg-white rounded-[3rem] shadow-xl overflow-hidden border border-slate-100 p-4">
              <Accordion type="single" collapsible className="w-full">
                {filteredServices.length > 0 ? (
                  filteredServices.map((service) => {
                    // Logic to ensure requirements are always treated as a list
                    const rawReqs = (isAr ? service.reqsAr : (service.reqsEn || service.reqsAr)) || [];
                    const reqs = Array.isArray(rawReqs) ? rawReqs : (typeof rawReqs === 'string' ? [rawReqs] : []);
                    
                    const conditions = isAr ? service.conditionsAr : (service.conditionsEn || service.conditionsAr);
                    const fees = isAr ? service.fees : (service.feesEn || service.fees);
                    const duration = isAr ? service.durationAr : (service.durationEn || service.durationAr);
                    
                    return (
                      <AccordionItem key={service.id} value={service.id} className="border-slate-50 last:border-none">
                        <AccordionTrigger className="px-6 py-8 hover:no-underline group">
                          <div className="flex items-center gap-6 text-right">
                            <div className="size-14 rounded-2xl bg-primary/5 text-primary flex items-center justify-center group-data-[state=open]:bg-primary group-data-[state=open]:text-white transition-all shadow-sm">
                              <LayoutGrid size={28} />
                            </div>
                            <div className="text-right">
                              <h4 className="text-xl font-black text-slate-800 group-hover:text-primary transition-colors">
                                {isAr ? service.title : (service.titleEn || service.title)}
                              </h4>
                              <Badge variant="secondary" className="rounded-lg bg-slate-100 text-slate-500 font-black text-[10px] mt-2">
                                {isAr ? CAT_CONFIG[service.category as CategoryId]?.labelAr : CAT_CONFIG[service.category as CategoryId]?.labelEn}
                              </Badge>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-10 pb-10">
                          <div className="grid md:grid-cols-2 gap-10 pt-6 border-t border-slate-100">
                            <div className="space-y-8">
                              <div className="space-y-4">
                                <h5 className="flex items-center gap-3 text-primary font-black text-lg">
                                  <Info size={20} className="text-accent"/> {isAr ? 'عن الخدمة' : 'About Service'}
                                </h5>
                                <p className="text-slate-500 font-bold leading-loose">
                                  {isAr ? service.description : service.descriptionEn || service.description}
                                </p>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                 <div className="p-5 rounded-2xl bg-slate-50 space-y-2">
                                    <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest">
                                      <Clock size={14}/> {isAr ? 'المدة' : 'Duration'}
                                    </div>
                                    <p className="font-bold text-slate-700">{duration || (isAr ? 'فوري' : 'Instant')}</p>
                                 </div>
                                 <div className="p-5 rounded-2xl bg-emerald-50 space-y-2">
                                    <div className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-widest">
                                      <BadgeCent size={14}/> {isAr ? 'الرسوم' : 'Fees'}
                                    </div>
                                    <p className="font-black text-emerald-700 text-lg">{fees || (isAr ? '10 ر.ع' : '10 OMR')}</p>
                                 </div>
                              </div>
                            </div>

                            <div className="space-y-8">
                              <div className="space-y-4">
                                 <h5 className="flex items-center gap-3 text-primary font-black text-lg">
                                   <ListChecks size={20} className="text-accent"/> {isAr ? 'المستندات المطلوبة' : 'Required Documents'}
                                 </h5>
                                 {reqs.length > 0 ? (
                                   <ul className="space-y-3">
                                     {reqs.map((req, i) => (
                                       <li key={i} className="flex items-start gap-3 text-slate-600 font-bold text-sm">
                                          <div className="size-2 rounded-full bg-accent mt-2 shrink-0" />
                                          {req}
                                       </li>
                                     ))}
                                   </ul>
                                 ) : (
                                   <p className="text-slate-400 font-bold text-xs italic">{isAr ? 'لا توجد مستندات مطلوبة' : 'No documents required'}</p>
                                 )}
                              </div>

                              <div className="space-y-4">
                                 <h5 className="flex items-center gap-3 text-primary font-black text-lg">
                                   <ShieldAlert size={20} className="text-accent"/> {isAr ? 'الاشتراطات' : 'Conditions'}
                                 </h5>
                                 <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100 text-amber-800 text-sm font-bold leading-relaxed">
                                    {conditions || (isAr ? 'يجب أن يكون المتقدم مواطناً عمانياً أو مقيماً بصفة قانونية.' : 'Applicant must be an Omani citizen or legal resident.')}
                                 </div>
                              </div>

                              <Button asChild className="w-full h-16 dm-gradient-primary rounded-2xl font-black text-xl shadow-xl gap-4">
                                <Link href={`/services/${service.id}`}>
                                  {isAr ? 'بدء الخدمة الرقمية' : 'Start Digital Service'}
                                  <ArrowRight className={cn("size-6", isAr && "rotate-180")} />
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })
                ) : (
                  <div className="py-24 text-center space-y-4">
                     <div className="size-20 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-200"><Search size={40}/></div>
                     <p className="text-slate-400 font-black">{isAr ? 'لم يتم العثور على خدمات تطابق بحثك' : 'No services found matching your search'}</p>
                  </div>
                )}
              </Accordion>
            </div>
          </div>

        </div>
      </main>

      <PortalFooter siteConfig={siteConfig} />
    </div>
  );
}
