'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { useFirestore, useCollection, useDoc, useUser } from '@/firebase';
import { collection, doc, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useSettingsStore } from '@/lib/settings-store';
import { 
  Search, 
  Building2, 
  FileText, 
  MapPin, 
  CreditCard, 
  UserCircle, 
  Phone, 
  Info,
  Calendar,
  Gavel,
  Globe,
  LayoutDashboard
} from 'lucide-react';
import Link from 'next/link';
import { Service, SiteConfig } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const ICON_MAP: Record<string, any> = {
  Building2, FileText, MapPin, CreditCard, UserCircle, Phone, Info, Calendar, Gavel, Globe
};

const CATEGORIES_AR = ['الكل', 'الرخص', 'المباني', 'الاستثمار', 'البيانات المفتوحة'];
const CATEGORIES_EN = ['All', 'Licenses', 'Buildings', 'Investment', 'Open Data'];

export default function DhofarPortal() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const { language, setLanguage } = useSettingsStore();
  const [activeCategory, setActiveCategory] = useState('الكل');
  const [searchQuery, setSearchQuery] = useState('');

  const isAr = language === 'ar';
  const categories = isAr ? CATEGORIES_AR : CATEGORIES_EN;

  const siteConfigRef = useMemo(() => doc(firestore, 'config', 'site'), [firestore]);
  const { data: siteConfig, loading: siteLoading } = useDoc<SiteConfig>(siteConfigRef);

  const servicesQuery = useMemo(() => 
    query(collection(firestore, 'services'), where('isActive', '==', true)), 
    [firestore]
  );
  const { data: services, loading: servicesLoading } = useCollection<Service>(servicesQuery);

  const filteredServices = useMemo(() => {
    return services?.filter(s => {
      const currentCategoryFilter = activeCategory === 'الكل' || activeCategory === 'All' || s.category === activeCategory;
      const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.description.toLowerCase().includes(searchQuery.toLowerCase());
      return currentCategoryFilter && matchesSearch;
    }) || [];
  }, [services, activeCategory, searchQuery]);

  const handleApply = (service: Service) => {
    if (!user) {
      toast({
        title: isAr ? "يجب تسجيل الدخول" : "Login Required",
        description: isAr ? "يرجى تسجيل الدخول للتقديم على الخدمات." : "Please sign in to apply for services.",
      });
      return;
    }

    addDoc(collection(firestore, 'applications'), {
      serviceId: service.id,
      userId: user.uid,
      status: 'pending',
      createdAt: serverTimestamp(),
      data: { appliedFrom: 'Portal Web WCAG' }
    });

    toast({
      title: isAr ? "تم إرسال الطلب بنجاح" : "Application Submitted",
      description: isAr ? `تم استلام طلبك لخدمة ${service.title}.` : `Your request for ${service.title} has been received.`,
    });
  };

  if (siteLoading || servicesLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-4" role="status" aria-live="polite">
        <Skeleton className="h-16 w-full rounded-md" />
        <Skeleton className="h-64 w-full rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
          <Skeleton className="h-48 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC]">
      {/* Semantic Accessible Header */}
      <header className="relative bg-[#008E91] text-white overflow-hidden pb-4" role="banner">
        {/* Background Geometric Grid Patterns for Quality aesthetics */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -mr-20 -mt-20 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#94F7F2] rotate-45 -ml-32 -mb-32" />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-8 relative z-10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-6">
            <Link href="/" aria-label={isAr ? "الصفحة الرئيسية لبلدية ظفار" : "Dhofar Municipality Home"}>
              <Image
                src="https://edm.gov.om/wp-content/uploads/2026/09/headerlogo2.png"
                alt={isAr ? "شعار بلدية ظفار الرسمي" : "Dhofar Municipality Official Logo"}
                width={260}
                height={85}
                className="brightness-0 invert object-contain"
                priority
              />
            </Link>
          </div>

          <nav className="flex items-center gap-2 text-sm font-bold flex-wrap justify-center" aria-label={isAr ? "القائمة الرئيسية" : "Main Navigation"}>
            <Link href="#" className="hover:text-[#94F7F2] px-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded">
              {isAr ? 'عن بلدية ظفار' : 'About Us'}
            </Link>
            <Link href="#" className="hover:text-[#94F7F2] px-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded">
              {isAr ? 'دليل الخدمات الموحد' : 'Services Directory'}
            </Link>
            <Link href="#" className="bg-white/10 px-4 py-2 rounded-md hover:bg-white/20 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              {isAr ? 'البيانات المفتوحة' : 'Open Data'}
            </Link>
            
            <Button 
              variant="ghost" 
              className="text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white"
              onClick={() => {
                const nextLang = isAr ? 'en' : 'ar';
                setLanguage(nextLang);
                setActiveCategory(nextLang === 'ar' ? 'الكل' : 'All');
              }}
              aria-label={isAr ? "Switch to English" : "تغيير اللغة إلى العربية"}
            >
              <Globe className="h-4 w-4 mr-2 ml-2" aria-hidden="true" />
              <span>{isAr ? 'English' : 'العربية'}</span>
            </Button>

            <Link 
              href="/admin" 
              className="p-2 hover:bg-white/10 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              aria-label={isAr ? "لوحة تحكم المشرف" : "Admin Panel Dashboard"}
            >
              <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
            </Link>
          </nav>
        </div>

        {/* Hero Section Container */}
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-8 text-center relative z-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 drop-shadow-md text-white">
            {siteConfig?.heroTitle || (isAr ? 'بوابة بلدية ظفار الإلكترونية الموحدة' : 'Dhofar Municipality Digital Portal')}
          </h1>
          <p className="text-base sm:text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            {siteConfig?.heroSubtitle || (isAr ? 'نعمل من أجل خدمتكم بكل سهولة وذكاء رقمي متكامل وفق المعايير العمانية' : 'Serving you with digital excellence and integrated ease.')}
          </p>
          
          {/* Accessible Search Form Container */}
          <div className="relative max-w-3xl mx-auto">
            <label htmlFor="service-search-input" className="sr-only">
              {isAr ? 'ابحث عن خدمة بلدية...' : 'Search for a municipal service...'}
            </label>
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 h-6 w-6 pointer-events-none" aria-hidden="true" />
            <Input 
              id="service-search-input"
              type="search"
              className="h-16 w-full rounded-full border-none bg-white/95 text-black pl-14 pr-8 text-lg sm:text-xl shadow-2xl focus-visible:ring-4 focus-visible:ring-[#94F7F2]"
              placeholder={isAr ? 'ابحث عن الخدمة المطلوبة... (مثال: إباحة بناء، شهادة صحية)' : 'Search for services... (e.g., Building permits)'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main id="main-content" className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-8 flex-grow" role="main">
        
        {/* Category Navigation Controls */}
        <section aria-label={isAr ? "تصنيفات الخدمات الرقمية" : "Service Categories"}>
          <div className="flex gap-3 overflow-x-auto pb-4 mb-8 border-b scrollbar-hide" role="tablist">
            {categories.map((cat) => {
              const isSelected = activeCategory === cat;
              return (
                <Button
                  key={cat}
                  role="tab"
                  aria-selected={isSelected}
                  variant={isSelected ? 'default' : 'outline'}
                  className={isSelected ? 'dm-gradient-primary font-bold px-6 shrink-0' : 'border-[#008E91] text-[#008E91] font-bold px-6 shrink-0'}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </Button>
              );
            })}
          </div>
        </section>

        {/* Dynamic Services Catalog Grid */}
        <section aria-label={isAr ? "قائمة الخدمات المتاحة" : "Available Services Catalog"}>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" aria-live="polite">
            {filteredServices.map((service) => {
              const IconComponent = ICON_MAP[service.iconName] || Info;
              return (
                <Card key={service.id} className="group border-none shadow-sm hover:shadow-lg transition-all overflow-hidden bg-white flex flex-col justify-between">
                  <div>
                    <div className="h-2 bg-[#008E91] group-hover:bg-[#470D67] transition-colors" aria-hidden="true" />
                    <CardHeader className="text-center pb-2">
                      <div className="mx-auto mb-3 rounded-2xl bg-[#94F7F2]/10 p-4 text-[#008E91] group-hover:bg-[#008E91] group-hover:text-white transition-all duration-300">
                        <IconComponent className="h-10 w-10" aria-hidden="true" />
                      </div>
                      <CardTitle className="text-lg font-bold text-[#008E91]">{service.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center px-4 pb-4">
                      <CardDescription className="text-slate-600 text-sm line-clamp-3">
                        {service.description}
                      </CardDescription>
                    </CardContent>
                  </div>
                  
                  <div className="p-4 pt-0">
                    <Button 
                      className="w-full rounded-full border-2 border-[#008E91] text-[#008E91] hover:bg-[#008E91] hover:text-white transition-all font-bold"
                      variant="outline"
                      onClick={() => handleApply(service)}
                      aria-label={`${isAr ? 'بدء تقديم خدمة' : 'Start service for'} ${service.title}`}
                    >
                      {isAr ? 'ابدأ الخدمة الرقمية' : 'Start Service'}
                    </Button>
                  </div>
                </Card>
              );
            })}
            
            {filteredServices.length === 0 && (
              <div className="col-span-full py-16 text-center bg-white rounded-xl shadow-inner border border-dashed border-slate-200">
                <Info className="h-12 w-12 text-slate-300 mx-auto mb-3" aria-hidden="true" />
                <p className="text-slate-500 font-bold">
                  {isAr ? 'عذراً، لم نعثر على نتائج تطابق معايير البحث الحالية.' : 'No matching municipal services found.'}
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Semantic Accessible Footer component */}
      <footer className="bg-[#008E91] text-white py-10" role="contentinfo">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-right">
            <p className="text-xl font-bold mb-1">{isAr ? 'بلدية ظفار' : 'Dhofar Municipality'}</p>
            <p className="opacity-80 text-xs">
              © {new Date().getFullYear()} {isAr ? 'سلطنة عمان - جميع الحقوق محفوظة للبوابة الموحدة للخدمات الحكومية' : 'Sultanate of Oman - All Rights Reserved.'}
            </p>
          </div>
          <div className="flex gap-6 text-sm flex-wrap justify-center">
            <Link href="#" className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              {isAr ? 'سياسة الخصوصية والأمن الرقمي' : 'Privacy & Security Policy'}
            </Link>
            <Link href="#" className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              {isAr ? 'شروط وأحكام الاستخدام المعياري' : 'Terms & Conditions'}
            </Link>
            <Link href="#" className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              { siteConfig?.contactPhone ? `${isAr ? 'الدعم:' : 'Support:'} ${siteConfig.contactPhone}` : (isAr ? 'تواصل معنا' : 'Contact Us') }
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
