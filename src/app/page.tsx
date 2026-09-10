
'use client';

import React, { useMemo, useState, useEffect } from 'react';
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
  LayoutDashboard,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { Service, SiteConfig } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const ICON_MAP: Record<string, any> = {
  Building2, FileText, MapPin, CreditCard, UserCircle, Phone, Info, Calendar, Gavel, Globe
};

export default function DhofarPortal() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const { language, setLanguage } = useSettingsStore();
  const [activeCategory, setActiveCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isAr = language === 'ar';
  
  const CATEGORIES = isAr 
    ? ['الكل', 'الرخص', 'المباني', 'الاستثمار', 'البيانات المفتوحة'] 
    : ['All', 'Licenses', 'Buildings', 'Investment', 'Open Data'];

  useEffect(() => {
    setActiveCategory(isAr ? 'الكل' : 'All');
  }, [isAr]);

  const siteConfigRef = useMemo(() => doc(firestore, 'config', 'site'), [firestore]);
  const { data: siteConfig, loading: siteLoading } = useDoc<SiteConfig>(siteConfigRef);

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
        s.description.toLowerCase().includes(searchQuery.toLowerCase());
      return categoryMatch && searchMatch;
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
      data: { source: 'GUP-DS Portal' }
    });

    toast({
      title: isAr ? "تم إرسال الطلب" : "Application Sent",
      description: isAr ? `تم استلام طلب ${service.title} بنجاح.` : `Application for ${service.title} sent.`,
    });
  };

  if (!isMounted || siteLoading || servicesLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8" role="status" aria-busy="true">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-[400px] w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC]">
      {/* Semantic Accessible Header */}
      <header className="bg-[#008E91] text-white border-b border-white/10" role="banner">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <Link href="/" aria-label={isAr ? "الرئيسية" : "Home"} className="flex-shrink-0">
            <Image
              src="https://edm.gov.om/wp-content/uploads/2026/09/headerlogo2.png"
              alt={isAr ? "شعار بلدية ظفار" : "Dhofar Municipality Logo"}
              width={260}
              height={85}
              className="brightness-0 invert object-contain"
              priority
            />
          </Link>

          <nav className="flex items-center gap-6" aria-label={isAr ? "القائمة الرئيسية" : "Main Menu"}>
            <ul className="flex items-center gap-4 text-sm font-bold list-none p-0 m-0">
              <li><Link href="#" className="hover:text-[#94F7F2] transition-colors">{isAr ? 'عن البلدية' : 'About'}</Link></li>
              <li><Link href="#" className="hover:text-[#94F7F2] transition-colors">{isAr ? 'الخدمات' : 'Services'}</Link></li>
              <li>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-white hover:bg-white/10"
                  onClick={() => setLanguage(isAr ? 'en' : 'ar')}
                  aria-label={isAr ? "Switch to English" : "اللغة الإنجليزية"}
                >
                  <Globe className="h-4 w-4 mr-2" aria-hidden="true" />
                  {isAr ? 'English' : 'العربية'}
                </Button>
              </li>
              <li>
                <Link href="/admin" aria-label="Admin Dashboard">
                  <Button variant="outline" size="icon" className="rounded-full bg-white/10 border-white/20 hover:bg-white/20 text-white">
                    <LayoutDashboard className="h-5 w-5" />
                  </Button>
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* Hero Section - GUP-DS Style */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-8 text-center" aria-labelledby="hero-title">
          <h1 id="hero-title" className="text-4xl md:text-5xl font-black mb-6 tracking-tight">
            {siteConfig?.heroTitle || (isAr ? 'بوابة الخدمات الإلكترونية الموحدة' : 'Unified Digital Services Portal')}
          </h1>
          <p className="text-lg opacity-90 mb-10 max-w-2xl mx-auto">
            {siteConfig?.heroSubtitle || (isAr ? 'نخدمكم بذكاء وسهولة وفق أعلى معايير الجودة العمانية' : 'Serving you with smart solutions following Omani quality standards.')}
          </p>
          
          <div className="relative max-w-3xl mx-auto">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 h-6 w-6" aria-hidden="true" />
            <Input 
              type="search"
              className="h-16 w-full rounded-full border-none bg-white text-black pl-14 pr-8 text-lg shadow-xl focus-visible:ring-4 focus-visible:ring-[#94F7F2]"
              placeholder={isAr ? 'ابحث عن الخدمة...' : 'Search for a service...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label={isAr ? "بحث" : "Search"}
            />
          </div>
        </section>
      </header>

      <main id="main-content" className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-8 flex-grow" role="main">
        {/* Category Tabs */}
        <nav aria-label={isAr ? "تصنيفات الخدمات" : "Service Categories"} className="mb-10">
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide" role="tablist">
            {CATEGORIES.map((cat) => {
              const isSelected = activeCategory === cat;
              return (
                <Button
                  key={cat}
                  role="tab"
                  aria-selected={isSelected}
                  variant={isSelected ? 'default' : 'outline'}
                  className={`rounded-full px-8 py-6 font-bold transition-all ${
                    isSelected 
                      ? 'gup-button-primary shadow-lg scale-105' 
                      : 'border-[#008E91] text-[#008E91] hover:bg-[#008E91] hover:text-white'
                  }`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </Button>
              );
            })}
          </div>
        </nav>

        {/* Services Grid */}
        <section aria-label={isAr ? "الخدمات المتاحة" : "Available Services"}>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {filteredServices.map((service) => {
              const IconComponent = ICON_MAP[service.iconName] || Info;
              return (
                <Card key={service.id} className="group relative border-none shadow-md hover:shadow-2xl transition-all duration-300 bg-white flex flex-col">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#008E91] to-[#03CFCB] rounded-t-lg" />
                  
                  <CardHeader className="text-center pt-8 pb-4">
                    <div className="mx-auto mb-4 rounded-3xl bg-[#94F7F2]/20 p-5 text-[#008E91] group-hover:bg-[#008E91] group-hover:text-white transition-all duration-500">
                      <IconComponent className="h-10 w-10" />
                    </div>
                    <CardTitle className="text-xl font-bold text-slate-800">{service.title}</CardTitle>
                    <CardDescription className="text-slate-500 font-medium">{service.category}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="text-center flex-grow px-6">
                    <p className="text-slate-600 text-sm leading-relaxed line-clamp-3 mb-6">
                      {service.description}
                    </p>
                  </CardContent>
                  
                  <div className="p-6 pt-0 mt-auto">
                    <Button 
                      className="w-full rounded-xl border-2 border-[#008E91] text-[#008E91] hover:bg-[#008E91] hover:text-white transition-all font-bold group"
                      variant="outline"
                      onClick={() => handleApply(service)}
                    >
                      {isAr ? 'ابدأ الخدمة' : 'Start Service'}
                      <ArrowRight className={`h-4 w-4 ${isAr ? 'rotate-180 mr-2' : 'ml-2'} group-hover:translate-x-1 transition-transform`} />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>

          {filteredServices.length === 0 && (
            <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200" role="status">
              <Info className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg font-bold">
                {isAr ? 'لا توجد نتائج مطابقة لبحثك' : 'No matching services found.'}
              </p>
            </div>
          )}
        </section>
      </main>

      <footer className="bg-[#008E91] text-white py-12 border-t border-white/10" role="contentinfo">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-8">
            <div className="text-center md:text-right">
              <h2 className="text-2xl font-black mb-2">{isAr ? 'بلدية ظفار' : 'Dhofar Municipality'}</h2>
              <p className="opacity-70 text-sm">
                © {new Date().getFullYear()} {isAr ? 'جميع الحقوق محفوظة - سلطنة عمان' : 'All Rights Reserved - Sultanate of Oman'}
              </p>
            </div>
            <div className="flex gap-8 text-sm font-bold flex-wrap justify-center">
              <Link href="#" className="hover:text-[#94F7F2]">{isAr ? 'الخصوصية' : 'Privacy'}</Link>
              <Link href="#" className="hover:text-[#94F7F2]">{isAr ? 'الشروط' : 'Terms'}</Link>
              <Link href="#" className="hover:text-[#94F7F2]">{isAr ? 'تواصل معنا' : 'Contact'}</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
