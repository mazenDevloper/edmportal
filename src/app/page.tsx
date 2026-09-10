
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
  LayoutDashboard,
  Moon,
  Sun,
  ChevronDown
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

  const filteredServices = services?.filter(s => {
    const matchesCategory = activeCategory === 'الكل' || activeCategory === 'All' || s.category === activeCategory;
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
      data: { appliedFrom: 'Portal' }
    });

    toast({
      title: isAr ? "تم إرسال الطلب" : "Application Submitted",
      description: isAr ? `تم استلام طلبك لخدمة ${service.title}.` : `Your request for ${service.title} has been received.`,
    });
  };

  if (siteLoading || servicesLoading) {
    return <div className="p-20 text-center"><Skeleton className="h-20 w-full" /></div>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F8FAFC]">
      {/* Dynamic Pattern Header */}
      <header className="relative bg-[#008E91] text-white overflow-hidden pb-4">
        {/* Geometric Patterns in Background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -mr-20 -mt-20 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#94F7F2] rotate-45 -ml-32 -mb-32" />
          <svg className="absolute top-0 left-10 w-full h-full" viewBox="0 0 100 100">
             <path d="M0 50 Q 25 25 50 50 T 100 50" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </svg>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-8 relative z-10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-6">
            <Image
              src="https://edm.gov.om/wp-content/uploads/2026/09/headerlogo2.png"
              alt="Dhofar Municipality"
              width={250}
              height={80}
              className="brightness-0 invert object-contain"
            />
          </div>

          <nav className="flex items-center gap-2 text-sm font-bold flex-wrap justify-center">
            <Link href="#" className="hover:text-[#94F7F2] px-3">{isAr ? 'عن بلدية ظفار' : 'About'}</Link>
            <Link href="#" className="hover:text-[#94F7F2] px-3">{isAr ? 'دليل الخدمات' : 'Services Guide'}</Link>
            <Link href="#" className="bg-white/10 px-4 py-2 rounded-md hover:bg-white/20">{isAr ? 'البيانات المفتوحة' : 'Open Data'}</Link>
            <Button 
              variant="ghost" 
              className="text-white hover:bg-white/10"
              onClick={() => setLanguage(isAr ? 'en' : 'ar')}
            >
              <Globe className="h-4 w-4 mr-2" />
              {isAr ? 'English' : 'العربية'}
            </Button>
            <Link href="/admin" className="p-2 hover:bg-white/10 rounded-full">
              <LayoutDashboard className="h-5 w-5" />
            </Link>
          </nav>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-8 text-center relative z-10">
          <h1 className="text-4xl md:text-5xl font-black mb-4 drop-shadow-md text-white">
            {isAr ? 'بوابة بلدية ظفار الإلكترونية' : 'Dhofar Municipality Portal'}
          </h1>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
            {isAr ? 'نعمل من أجل مدينتنا، نخدمكم بكل سهولة وذكاء' : 'Working for our city, serving you with ease and intelligence'}
          </p>
          
          <div className="relative max-w-3xl mx-auto">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 h-6 w-6" />
            <Input 
              className="h-16 w-full rounded-full border-none bg-white/95 text-black pl-14 pr-8 text-xl shadow-2xl focus-visible:ring-4 focus-visible:ring-[#94F7F2]"
              placeholder={isAr ? 'ابحث عن خدمة... (مثال: اباحة بناء)' : 'Search for a service...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* Dynamic Service Section */}
      <main className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-8">
        {/* Category Tabs */}
        <div className="flex gap-4 overflow-x-auto pb-8 mb-8 border-b scrollbar-hide">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? 'default' : 'outline'}
              className={activeCategory === cat ? 'dm-gradient-primary font-bold px-8' : 'border-[#008E91] text-[#008E91] font-bold px-8'}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {filteredServices?.map((service) => {
            const Icon = ICON_MAP[service.iconName] || Info;
            return (
              <Card key={service.id} className="group border-none shadow-md hover:shadow-2xl transition-all hover:-translate-y-2 overflow-hidden bg-white">
                <div className="h-2 bg-[#008E91] group-hover:bg-[#470D67] transition-colors" />
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto mb-4 rounded-2xl bg-[#94F7F2]/10 p-5 group-hover:bg-[#008E91] transition-colors duration-500">
                    <Icon className="h-12 w-12 text-[#008E91] group-hover:text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-[#008E91] group-hover:text-[#470D67]">{service.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center px-6 pb-8">
                  <CardDescription className="text-slate-500 line-clamp-3 mb-6">
                    {service.description}
                  </CardDescription>
                  <Button 
                    className="w-full rounded-full border-2 border-[#008E91] text-[#008E91] hover:bg-[#008E91] hover:text-white transition-all font-black py-6"
                    variant="outline"
                    onClick={() => handleApply(service)}
                  >
                    {isAr ? 'ابدأ الخدمة' : 'Start Service'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
          
          {filteredServices?.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <Info className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-400 font-bold">{isAr ? 'لا يوجد نتائج مطابقة للبحث' : 'No matching services found'}</p>
            </div>
          )}
        </div>
      </main>

      <footer className="mt-auto bg-[#008E91] text-white py-12">
        <div className="mx-auto max-w-7xl px-8 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-right">
            <h4 className="text-2xl font-bold mb-2">{isAr ? 'بلدية ظفار' : 'Dhofar Municipality'}</h4>
            <p className="opacity-70 text-sm">© {new Date().getFullYear()} {isAr ? 'جميع الحقوق محفوظة' : 'All Rights Reserved'}</p>
          </div>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-[#94F7F2]">{isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}</Link>
            <Link href="#" className="hover:text-[#94F7F2]">{isAr ? 'خريطة الموقع' : 'Sitemap'}</Link>
            <Link href="#" className="hover:text-[#94F7F2]">{isAr ? 'تواصل معنا' : 'Contact Us'}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
