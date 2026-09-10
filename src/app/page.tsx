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
  ArrowRight,
  TrendingUp,
  Bolt,
  ShieldCheck,
  Briefcase
} from 'lucide-react';
import Link from 'next/link';
import { Service, SiteConfig, NewsTicker } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, any> = {
  Building2, FileText, MapPin, CreditCard, UserCircle, Phone, Info, Calendar, Gavel, Globe, TrendingUp, ShieldCheck, Briefcase
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
      <div className="bg-[#1f2024] text-white/70 py-2 text-xs border-b border-white/5">
        <div className="mx-auto max-w-7xl px-4 flex justify-between items-center">
          <div className="flex gap-4">
             <span>{new Date().toLocaleDateString(isAr ? 'ar-OM' : 'en-OM', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="#" className="hover:text-white transition-colors">{isAr ? 'تواصل معنا' : 'Contact Us'}</Link>
            <div className="h-3 w-px bg-white/20 mx-1" />
            <Link href="/admin" className="text-accent font-bold hover:underline">لوحة التحكم</Link>
          </div>
        </div>
      </div>

      {/* Breaking News Ticker */}
      {tickerItems && tickerItems.length > 0 && (
        <div className="bg-primary text-white border-b border-white/10 overflow-hidden relative h-10 flex items-center">
          <div className="absolute left-0 top-0 h-full bg-secondary px-4 flex items-center z-10 font-black text-xs uppercase gap-2 shadow-xl">
            <Bolt className="h-4 w-4 fill-current" />
            {isAr ? 'أخبار عاجلة' : 'Breaking News'}
          </div>
          <div className="flex-1 overflow-hidden whitespace-nowrap">
             <div className="animate-marquee inline-block pl-[100%] pr-4 py-2 hover:pause">
                {tickerItems.map((item, idx) => (
                  <span key={item.id} className="mx-8 text-sm font-medium">
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
              width={240}
              height={78}
              className="object-contain"
              priority
            />
          </Link>

          <nav className="flex items-center gap-6" aria-label={isAr ? "القائمة الرئيسية" : "Main Menu"}>
            <ul className="flex items-center gap-6 text-sm font-bold list-none p-0 m-0">
              <li><Link href="#" className="text-slate-600 hover:text-primary transition-colors">{isAr ? 'عن البلدية' : 'About'}</Link></li>
              <li><Link href="#" className="text-slate-600 hover:text-primary transition-colors">{isAr ? 'دليل الخدمات' : 'Services Directory'}</Link></li>
              <li><Link href="#" className="text-slate-600 hover:text-primary transition-colors">{isAr ? 'البيانات المفتوحة' : 'Open Data'}</Link></li>
              <li>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-primary text-primary hover:bg-primary hover:text-white rounded-full px-5"
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
        {/* Hero Section with Brand Pattern */}
        <section className="relative min-h-[500px] flex items-center justify-center overflow-hidden bg-primary dm-geometric-overlay">
          <div className="absolute inset-0 opacity-10 dm-pattern-hero" />
          
          <div className="relative z-10 text-center text-white px-4 max-w-4xl py-20">
            <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
              {siteConfig?.heroTitle || (isAr ? 'بوابة الخدمات الإلكترونية الموحدة' : 'Unified Digital Services Portal')}
            </h1>
            <p className="text-lg md:text-xl opacity-80 mb-10 max-w-2xl mx-auto">
              {siteConfig?.heroSubtitle || (isAr ? 'نخدمكم بذكاء وسهولة وفق أعلى معايير الجودة العمانية' : 'Serving you with smart solutions following Omani quality standards.')}
            </p>
            
            <div className="relative max-w-2xl mx-auto group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 h-6 w-6 group-focus-within:text-primary" />
              <Input 
                type="search"
                className="h-16 w-full rounded-full border-none bg-white text-black pl-14 pr-8 text-lg shadow-2xl focus-visible:ring-4 focus-visible:ring-accent/30"
                placeholder={isAr ? 'ما الذي يمكننا مساعدتك فيه اليوم؟' : 'How can we help you today?'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Stats Counter Section with Brand Colors */}
        <section className="bg-white py-14 border-b relative z-20 -mt-10 mx-auto max-w-6xl rounded-brand shadow-xl">
          <div className="px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: isAr ? 'المعاملات الإلكترونية' : 'E-Transactions', value: siteConfig?.stats?.transactions || 360806, color: 'text-primary' },
              { label: isAr ? 'عقود الإيجار' : 'Lease Contracts', value: siteConfig?.stats?.contracts || 117293, color: 'text-secondary' },
              { label: isAr ? 'تراخيص البناء' : 'Building Permits', value: siteConfig?.stats?.permits || 12546, color: 'text-accent' },
              { label: isAr ? 'تذاكر إلكترونية' : 'E-Tickets', value: siteConfig?.stats?.tickets || 123416, color: 'text-[#C5A059]' },
            ].map((stat, i) => (
              <div key={i} className="text-center group border-r last:border-0 border-slate-100 px-4">
                <p className={cn("text-3xl md:text-4xl font-black mb-2 transition-transform group-hover:scale-110", stat.color)}>
                  {stat.value.toLocaleString()}
                </p>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-tighter">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-8">
          {/* Category Tabs */}
          <nav aria-label={isAr ? "تصنيفات الخدمات" : "Service Categories"} className="mb-12">
            <div className="flex gap-3 overflow-x-auto pb-6 scrollbar-hide justify-center" role="tablist">
              {CATEGORIES.map((cat) => {
                const isSelected = activeCategory === cat;
                return (
                  <Button
                    key={cat}
                    role="tab"
                    aria-selected={isSelected}
                    variant={isSelected ? 'default' : 'outline'}
                    className={cn(
                      "rounded-full px-10 py-7 font-black text-base transition-all",
                      isSelected 
                        ? 'dm-gradient-primary shadow-xl scale-105' 
                        : 'border-slate-200 text-slate-600 hover:border-primary hover:text-primary bg-white'
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
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-72 rounded-brand" />)}
              </div>
            ) : (
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {filteredServices.map((service) => {
                  const IconComponent = ICON_MAP[service.iconName] || Info;
                  return (
                    <Card key={service.id} className="group relative border-none shadow-lg hover:shadow-2xl transition-all duration-500 bg-white flex flex-col overflow-hidden rounded-brand h-full">
                      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary to-accent" />
                      
                      <CardHeader className="text-center pt-10 pb-4">
                        <div className="mx-auto mb-6 rounded-brand bg-accent/10 p-6 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner">
                          <IconComponent className="h-12 w-12" />
                        </div>
                        <CardTitle className="text-xl font-black text-slate-800 tracking-tight">{service.title}</CardTitle>
                        <CardDescription className="text-primary text-xs font-black uppercase mt-2">{service.category}</CardDescription>
                      </CardHeader>
                      
                      <CardContent className="text-center flex-grow px-8 pb-8">
                        <p className="text-slate-600 text-sm leading-relaxed line-clamp-3">
                          {service.description}
                        </p>
                      </CardContent>
                      
                      <div className="p-8 pt-0 mt-auto">
                        <Button 
                          className="w-full rounded-full py-6 border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all font-black group text-sm"
                          variant="outline"
                          onClick={() => handleApply(service)}
                        >
                          {isAr ? 'بدء الخدمة' : 'Start Service'}
                          <ArrowRight className={cn("h-4 w-4 transition-transform", isAr ? 'rotate-180 mr-3 group-hover:-translate-x-2' : 'ml-3 group-hover:translate-x-2')} />
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

            {filteredServices.length === 0 && !servicesLoading && (
              <div className="py-24 text-center bg-white rounded-brand border-2 border-dashed border-slate-200" role="status">
                <Info className="h-20 w-20 text-slate-200 mx-auto mb-6" />
                <p className="text-slate-400 text-xl font-bold">
                  {isAr ? 'عذراً، لم يتم العثور على خدمات في هذا التصنيف' : 'No matching services found in this category.'}
                </p>
              </div>
            )}
          </section>
        </div>

        {/* Informational Section with secondary gradient */}
        <section className="dm-gradient-secondary py-20 dm-geometric-overlay">
           <div className="mx-auto max-w-7xl px-4 flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="text-white max-w-xl">
                 <h2 className="text-3xl md:text-5xl font-black mb-6">{isAr ? 'نحو مجتمع ذكي ومستدام' : 'Towards a Smart & Sustainable Community'}</h2>
                 <p className="text-white/80 text-lg leading-relaxed mb-8">
                   {isAr 
                    ? 'نعمل في بلدية ظفار على تسخير أحدث التقنيات لتقديم خدماتنا بكل شفافية وكفاءة، مساهمين في تحقيق رؤية عمان 2040.' 
                    : 'We at Dhofar Municipality work to harness the latest technologies to provide our services with transparency and efficiency, contributing to achieving Oman Vision 2040.'}
                 </p>
                 <Button className="bg-white text-primary hover:bg-white/90 rounded-full px-8 py-6 font-black">
                   {isAr ? 'المزيد عن رؤيتنا' : 'Learn More About Our Vision'}
                 </Button>
              </div>
              <div className="relative w-full max-w-md aspect-square rounded-brand overflow-hidden shadow-2xl border-8 border-white/10">
                 <Image 
                  src="https://picsum.photos/seed/oman-vision/800/800" 
                  alt="Vision 2040" 
                  fill 
                  className="object-cover" 
                  data-ai-hint="oman architecture"
                 />
              </div>
           </div>
        </section>
      </main>

      <footer className="bg-[#1f2024] text-white pt-20 pb-8 border-t border-white/5" role="contentinfo">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="grid md:grid-cols-4 gap-16 mb-16">
            <div className="col-span-2">
              <Image
                src="https://edm.gov.om/wp-content/uploads/2026/09/headerlogo2.png"
                alt="Logo Footer"
                width={200}
                height={65}
                className="brightness-0 invert opacity-80 mb-8"
              />
              <p className="text-white/60 text-sm max-w-md leading-relaxed">
                {isAr 
                  ? 'نهدف إلى تقديم خدمات بلدية متميزة تسهم في تحسين جودة الحياة والحفاظ على البيئة الطبيعية الفريدة لمحافظة ظفار.' 
                  : 'We aim to provide exceptional municipal services that contribute to improving the quality of life and preserving the unique natural environment of Dhofar Governorate.'}
              </p>
            </div>
            <div>
              <h3 className="font-black text-lg mb-6">{isAr ? 'روابط هامة' : 'Important Links'}</h3>
              <ul className="space-y-4 text-sm text-white/50 list-none p-0">
                <li><Link href="#" className="hover:text-accent transition-colors">{isAr ? 'الشروط والأحكام' : 'Terms & Conditions'}</Link></li>
                <li><Link href="#" className="hover:text-accent transition-colors">{isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}</Link></li>
                <li><Link href="#" className="hover:text-accent transition-colors">{isAr ? 'خريطة الموقع' : 'Sitemap'}</Link></li>
                <li><Link href="#" className="hover:text-accent transition-colors">{isAr ? 'المشاركة الرقمية' : 'Digital Participation'}</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-black text-lg mb-6">{isAr ? 'حمل التطبيق' : 'Download Apps'}</h3>
              <div className="flex flex-col gap-4">
                <div className="bg-white/5 p-3 rounded-xl hover:bg-white/10 transition-colors cursor-pointer border border-white/10 flex items-center justify-center">
                  <Image src="https://edm.gov.om/wp-content/uploads/2025/05/googleplay.svg" alt="Play Store" width={120} height={35} />
                </div>
                <div className="bg-white/5 p-3 rounded-xl hover:bg-white/10 transition-colors cursor-pointer border border-white/10 flex items-center justify-center">
                  <Image src="https://edm.gov.om/wp-content/uploads/2025/05/Download-on-the-App-Store-01-1.svg" alt="App Store" width={120} height={35} />
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-white/5 pt-10 text-center text-xs text-white/30">
            <p>© {new Date().getFullYear()} {isAr ? 'بلدية ظفار - جميع الحقوق محفوظة - سلطنة عمان' : 'Dhofar Municipality - All Rights Reserved - Sultanate of Oman'}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}