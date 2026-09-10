
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import { useFirestore, useCollection, useDoc, useUser } from '@/firebase';
import { collection, doc, query, where, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
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
  ArrowRight,
  TrendingUp,
  Bolt
} from 'lucide-react';
import Link from 'next/link';
import { Service, SiteConfig, NewsTicker } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, any> = {
  Building2, FileText, MapPin, CreditCard, UserCircle, Phone, Info, Calendar, Gavel, Globe, TrendingUp
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

  const tickerQuery = useMemo(() => 
    query(collection(firestore, 'news_ticker'), where('isActive', '==', true), orderBy('createdAt', 'desc')), 
    [firestore]
  );
  const { data: tickerItems } = useCollection<NewsTicker>(tickerQuery);

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

  if (!isMounted) return null;

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC]">
      {/* Top Utility Bar */}
      <div className="bg-[#1f2024] text-white/70 py-2 text-xs">
        <div className="mx-auto max-w-7xl px-4 flex justify-between items-center">
          <div className="flex gap-4">
             <span>{new Date().toLocaleDateString(isAr ? 'ar-OM' : 'en-OM', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="#" className="hover:text-white transition-colors">{isAr ? 'تواصل معنا' : 'Contact Us'}</Link>
            <Link href="/admin" className="text-[#03CFCB] font-bold hover:underline">Admin</Link>
          </div>
        </div>
      </div>

      {/* Breaking News Ticker */}
      {tickerItems && tickerItems.length > 0 && (
        <div className="bg-[#008E91] text-white border-b border-white/10 overflow-hidden relative h-10 flex items-center">
          <div className="absolute left-0 top-0 h-full bg-[#470D67] px-4 flex items-center z-10 font-black text-sm uppercase gap-2">
            <Bolt className="h-4 w-4 fill-current" />
            {isAr ? 'أخبار عاجلة' : 'Breaking News'}
          </div>
          <div className="flex-1 overflow-hidden whitespace-nowrap">
             <div className="animate-marquee inline-block pl-[100%] pr-4 py-2 hover:pause">
                {tickerItems.map((item, idx) => (
                  <span key={item.id} className="mx-8 font-medium">
                    {item.text}
                    {idx < tickerItems.length - 1 && <span className="mx-4 text-white/30">|</span>}
                  </span>
                ))}
             </div>
          </div>
        </div>
      )}

      {/* Semantic Accessible Header */}
      <header className="bg-white text-slate-800 border-b shadow-sm sticky top-0 z-50" role="banner">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <Link href="/" aria-label={isAr ? "الرئيسية" : "Home"} className="flex-shrink-0">
            <Image
              src="https://edm.gov.om/wp-content/uploads/2026/09/headerlogo2.png"
              alt={isAr ? "شعار بلدية ظفار" : "Dhofar Municipality Logo"}
              width={260}
              height={85}
              className="object-contain"
              priority
            />
          </Link>

          <nav className="flex items-center gap-6" aria-label={isAr ? "القائمة الرئيسية" : "Main Menu"}>
            <ul className="flex items-center gap-6 text-sm font-bold list-none p-0 m-0">
              <li><Link href="#" className="text-slate-600 hover:text-[#008E91] transition-colors">{isAr ? 'عن البلدية' : 'About'}</Link></li>
              <li><Link href="#" className="text-slate-600 hover:text-[#008E91] transition-colors">{isAr ? 'دليل الخدمات' : 'Services Directory'}</Link></li>
              <li><Link href="#" className="text-slate-600 hover:text-[#008E91] transition-colors">{isAr ? 'البيانات المفتوحة' : 'Open Data'}</Link></li>
              <li>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-[#008E91] text-[#008E91] hover:bg-[#008E91] hover:text-white"
                  onClick={() => setLanguage(isAr ? 'en' : 'ar')}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  {isAr ? 'English' : 'العربية'}
                </Button>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main id="main-content" role="main">
        {/* Hero Section */}
        <section className="relative h-[450px] flex items-center justify-center overflow-hidden bg-[#008E91]">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute inset-0 bg-[url('https://edm.gov.om/wp-content/uploads/2021/03/pattern40.png')] repeat-x bottom-0 h-40" />
          </div>
          
          <div className="relative z-10 text-center text-white px-4 max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-black mb-6 drop-shadow-lg">
              {siteConfig?.heroTitle || (isAr ? 'بوابة الخدمات الإلكترونية الموحدة' : 'Unified Digital Services Portal')}
            </h1>
            <p className="text-lg md:text-xl opacity-90 mb-10">
              {siteConfig?.heroSubtitle || (isAr ? 'نخدمكم بذكاء وسهولة وفق أعلى معايير الجودة العمانية' : 'Serving you with smart solutions following Omani quality standards.')}
            </p>
            
            <div className="relative max-w-2xl mx-auto group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 h-6 w-6 group-focus-within:text-[#008E91]" />
              <Input 
                type="search"
                className="h-16 w-full rounded-full border-none bg-white text-black pl-14 pr-8 text-lg shadow-2xl focus-visible:ring-4 focus-visible:ring-[#94F7F2]"
                placeholder={isAr ? 'ابحث عن الخدمة...' : 'Search for a service...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Stats Counter Section */}
        <section className="bg-white py-12 border-b">
          <div className="mx-auto max-w-7xl px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: isAr ? 'المعاملات الإلكترونية' : 'E-Transactions', value: siteConfig?.stats?.transactions || 360806, color: 'text-[#008E91]' },
              { label: isAr ? 'عقود الإيجار' : 'Lease Contracts', value: siteConfig?.stats?.contracts || 117293, color: 'text-[#470D67]' },
              { label: isAr ? 'تراخيص البناء' : 'Building Permits', value: siteConfig?.stats?.permits || 12546, color: 'text-[#03CFCB]' },
              { label: isAr ? 'تذاكر إلكترونية' : 'E-Tickets', value: siteConfig?.stats?.tickets || 123416, color: 'text-[#FFD700]' },
            ].map((stat, i) => (
              <div key={i} className="text-center group">
                <p className={cn("text-3xl md:text-4xl font-black mb-2 transition-transform group-hover:scale-110", stat.color)}>
                  {stat.value.toLocaleString()}
                </p>
                <p className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-8">
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
                    className={cn(
                      "rounded-full px-8 py-6 font-bold transition-all",
                      isSelected 
                        ? 'gup-button-primary shadow-lg scale-105' 
                        : 'border-slate-200 text-slate-600 hover:border-[#008E91] hover:text-[#008E91]'
                    )}
                    onClick={() => setActiveCategory(cat)}
                  >
                    {cat}
                  </Button>
                );
              })}
            </div>
          </nav>

          {/* Services Grid */}
          <section>
            {servicesLoading ? (
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64 rounded-2xl" />)}
              </div>
            ) : (
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {filteredServices.map((service) => {
                  const IconComponent = ICON_MAP[service.iconName] || Info;
                  return (
                    <Card key={service.id} className="group relative border-none shadow-md hover:shadow-2xl transition-all duration-300 bg-white flex flex-col overflow-hidden rounded-2xl">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#008E91] to-[#03CFCB]" />
                      
                      <CardHeader className="text-center pt-8 pb-4">
                        <div className="mx-auto mb-4 rounded-full bg-[#94F7F2]/20 p-5 text-[#008E91] group-hover:bg-[#008E91] group-hover:text-white transition-all duration-500">
                          <IconComponent className="h-10 w-10" />
                        </div>
                        <CardTitle className="text-lg font-bold text-slate-800">{service.title}</CardTitle>
                        <CardDescription className="text-[#008E91] text-xs font-black uppercase">{service.category}</CardDescription>
                      </CardHeader>
                      
                      <CardContent className="text-center flex-grow px-6">
                        <p className="text-slate-600 text-sm leading-relaxed line-clamp-2">
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
                          <ArrowRight className={cn("h-4 w-4 transition-transform", isAr ? 'rotate-180 mr-2 group-hover:-translate-x-1' : 'ml-2 group-hover:translate-x-1')} />
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

            {filteredServices.length === 0 && !servicesLoading && (
              <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200" role="status">
                <Info className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 text-lg font-bold">
                  {isAr ? 'لا توجد نتائج مطابقة لبحثك' : 'No matching services found.'}
                </p>
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="bg-[#008E91] text-white pt-16 pb-8 border-t border-white/10" role="contentinfo">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-2">
              <h2 className="text-2xl font-black mb-4">{isAr ? 'بلدية ظفار' : 'Dhofar Municipality'}</h2>
              <p className="opacity-70 text-sm max-w-md leading-relaxed">
                {isAr 
                  ? 'نهدف إلى تقديم خدمات بلدية متميزة تسهم في تحسين جودة الحياة والحفاظ على البيئة الطبيعية الفريدة لمحافظة ظفار.' 
                  : 'We aim to provide exceptional municipal services that contribute to improving the quality of life and preserving the unique natural environment of Dhofar Governorate.'}
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-4">{isAr ? 'روابط سريعة' : 'Quick Links'}</h3>
              <ul className="space-y-2 text-sm opacity-80 list-none p-0">
                <li><Link href="#" className="hover:text-[#94F7F2]">{isAr ? 'الشروط والأحكام' : 'Terms & Conditions'}</Link></li>
                <li><Link href="#" className="hover:text-[#94F7F2]">{isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}</Link></li>
                <li><Link href="#" className="hover:text-[#94F7F2]">{isAr ? 'خريطة الموقع' : 'Sitemap'}</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">{isAr ? 'التطبيقات' : 'Applications'}</h3>
              <div className="flex gap-4">
                <div className="bg-white/10 p-2 rounded-lg hover:bg-white/20 transition-colors cursor-pointer">
                  <Image src="https://edm.gov.om/wp-content/uploads/2025/05/googleplay.svg" alt="Play Store" width={100} height={30} />
                </div>
                <div className="bg-white/10 p-2 rounded-lg hover:bg-white/20 transition-colors cursor-pointer">
                  <Image src="https://edm.gov.om/wp-content/uploads/2025/05/Download-on-the-App-Store-01-1.svg" alt="App Store" width={100} height={30} />
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-xs opacity-50">
            <p>© {new Date().getFullYear()} {isAr ? 'جميع الحقوق محفوظة - سلطنة عمان' : 'All Rights Reserved - Sultanate of Oman'}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
