
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Globe, LayoutDashboard, Menu, Edit2, Megaphone, ArrowRight, Languages, Palette, Search } from 'lucide-react';
import { useSettingsStore } from '@/lib/settings-store';
import { MenuItem, CustomPage, Service } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { fetchBin } from '@/lib/jsonbin';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface PortalHeaderProps {
  menuItems: MenuItem[];
}

export function PortalHeader({ menuItems }: PortalHeaderProps) {
  const pathname = usePathname();
  const { language, setLanguage } = useSettingsStore();
  const isAr = language === 'ar';
  
  const [editLink, setEditLink] = useState<string | null>(null);

  useEffect(() => {
    const determineEditLink = async () => {
      try {
        if (pathname === '/') {
          setEditLink('/admin');
          return;
        }

        const data = await fetchBin();
        if (!data) return;

        if (pathname.startsWith('/p/')) {
          const slug = pathname.split('/').pop();
          const page = data.customPages?.find((p: CustomPage) => p.slug === slug);
          if (page) {
            setEditLink(`/pagebuild?id=${page.id}`);
            return;
          }
        }

        if (pathname.startsWith('/services/')) {
          const id = pathname.split('/').pop();
          const svc = data.services?.find((s: Service) => s.id === id);
          if (svc) {
            setEditLink(`/servicebuild?id=${svc.id}`);
            return;
          }
        }

        const standardSlugs = ['privacy', 'terms', 'payment', 'access-controls', 'faqs', 'sla', 'governor-portal', 'open-data', 'service-controls', 'sitemap', 'tajawoob'];
        const currentSlug = pathname.replace('/', '');
        if (standardSlugs.includes(currentSlug)) {
          const page = data.customPages?.find((p: CustomPage) => p.slug === currentSlug);
          if (page) {
            setEditLink(`/pagebuild?id=${page.id}`);
          } else {
            setEditLink(`/pagebuild?slug=${currentSlug}`);
          }
          return;
        }

        setEditLink(null);
      } catch (err) {
        console.error("Edit link determination failed:", err);
        setEditLink(null);
      }
    };

    determineEditLink();
  }, [pathname]);

  return (
    <header className="w-full">
      {/* Dynamic News Ticker */}
      <div className="bg-primary text-white py-3 overflow-hidden border-b border-white/10">
        <div className="flex items-center gap-4 px-6 animate-marquee whitespace-nowrap">
           <div className="flex items-center gap-3 font-black text-[10px] uppercase tracking-widest bg-accent text-slate-900 px-3 py-1 rounded-full shrink-0">
             <Megaphone size={12} />
             {isAr ? "آخر الأخبار" : "Breaking News"}
           </div>
           <p className="text-sm font-bold opacity-90">
             {isAr 
               ? "بدء العمل في مشروع رصف الطرق الداخلية بمنطقة المزيونة - بلدية ظفار تدعو المواطنين لتحديث بياناتهم عبر البوابة الموحدة - افتتاح مجمع الخدمات الرقمي الجديد بصلالة."
               : "New road paving projects launched in Al-Mazyuna - Dhofar Municipality invites citizens to update data via the unified portal - New digital service hub opened in Salalah."}
           </p>
        </div>
      </div>

      <nav className="bg-slate-900 text-white py-3 text-[10px] font-bold tracking-widest border-b border-white/5" aria-label={isAr ? "روابط سريعة" : "Quick Links"}>
        <div className="mx-auto max-w-7xl px-6 flex justify-between items-center">
          <span className="flex items-center gap-2 opacity-80">
            <Globe size={14} aria-hidden="true" className="text-accent" /> {isAr ? 'بوابة حكومة سلطنة عُمان الموحدة' : 'Oman Government Unified Portal'}
          </span>
          <div className="flex items-center gap-8">
            {editLink && (
              <Button variant="ghost" asChild className="text-[#04F0EB] hover:text-white h-auto py-0.5 px-3 font-black gap-2 animate-pulse bg-white/5 rounded-full">
                <Link href={editLink}>
                  <Edit2 size={12} aria-hidden="true" /> {isAr ? 'تعديل هذا القسم' : 'Edit This Component'}
                </Link>
              </Button>
            )}
            <Link href="/template" className="text-white hover:text-accent font-black transition-colors">
              {isAr ? 'المساحة الذكية' : 'Neural Workspace'}
            </Link>
            <Link href="/admin" className="text-[#04F0EB] hover:underline flex items-center gap-2 font-black">
              <LayoutDashboard size={14} aria-hidden="true" /> {isAr ? 'لوحة التحكم' : 'Command Center'}
            </Link>
          </div>
        </div>
      </nav>

      <nav className="bg-white border-b py-8 sticky top-0 z-[50] shadow-sm" aria-label={isAr ? "الملاحة الرئيسية" : "Primary Navigation"}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-5 group" aria-label={isAr ? 'الرئيسية بلدية ظفار' : 'Dhofar Municipality Home'}>
             <div className="relative group-hover:rotate-12 transition-transform duration-500">
               <Image src="https://apps.edm.gov.om/ords/r/dmpm/130/files/static/v15/cropped-DM-ICON.png" alt="" width={70} height={70} className="object-contain" />
             </div>
             <div className="flex flex-col">
               <span className="text-3xl font-black text-primary leading-none tracking-tighter">{isAr ? 'بلدية ظفار' : 'Dhofar Municipality'}</span>
               <span className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mt-1">{isAr ? 'بوابة الخدمات الرقمية الموحدة' : 'Unified Digital Matrix Portal'}</span>
             </div>
          </Link>
          
          <div className="hidden lg:flex items-center gap-8">
            <Link href="/" className={cn("text-md font-black hover:text-primary transition-all relative group", pathname === '/' ? "text-primary" : "text-slate-600")}>
              {isAr ? 'الرئيسية' : 'Home'}
              <div className={cn("absolute -bottom-2 left-0 h-1 bg-accent transition-all duration-300", pathname === '/' ? "w-full" : "w-0 group-hover:w-full")} />
            </Link>

            <Link href="/catalog" className={cn("text-md font-black hover:text-primary transition-all relative group flex items-center gap-2", pathname === '/catalog' ? "text-primary" : "text-slate-600")}>
              <Search size={16} className="text-accent" />
              {isAr ? 'دليل الخدمات' : 'Service Catalog'}
              <div className={cn("absolute -bottom-2 left-0 h-1 bg-accent transition-all duration-300", pathname === '/catalog' ? "w-full" : "w-0 group-hover:w-full")} />
            </Link>

            {menuItems.map(item => (
              <Link key={item.id} href={item.link} className={cn("text-md font-black hover:text-primary transition-all relative group", pathname === item.link ? "text-primary" : "text-slate-600")}>
                {isAr ? item.labelAr : item.labelEn}
                <div className={cn("absolute -bottom-2 left-0 h-1 bg-accent transition-all duration-300", pathname === item.link ? "w-full" : "w-0 group-hover:w-full")} />
              </Link>
            ))}
            
            <div className="flex items-center gap-4 ml-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setLanguage(isAr ? 'en' : 'ar')}
                className="rounded-full border-primary/20 font-black gap-2 h-10 px-5 hover:bg-primary/5 text-primary"
              >
                <Languages size={16} />
                {isAr ? 'English' : 'العربية'}
              </Button>

              <Button asChild variant="ghost" className="rounded-full font-black gap-2 h-10 px-5 hover:bg-accent/10 text-accent">
                <Link href="/identity">
                  <Palette size={16} />
                  {isAr ? 'دليل الهوية' : 'Identity'}
                </Link>
              </Button>

              <Button asChild className="dm-gradient-primary rounded-full px-8 font-black shadow-lg">
                <Link href="/services/svc_105">{isAr ? 'تواصل معنا' : 'Contact Support'}</Link>
              </Button>
            </div>
          </div>

          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="size-14 rounded-2xl bg-slate-50 border shadow-sm" aria-label={isAr ? "افتح القائمة" : "Open Menu"}><Menu size={28}/></Button>
              </SheetTrigger>
              <SheetContent side={isAr ? "right" : "left"} className="rounded-l-[3rem] border-none shadow-2xl">
                <SheetTitle className="text-primary font-black text-3xl mb-8">{isAr ? "قائمة البوابة" : "Global Menu"}</SheetTitle>
                <SheetDescription className="sr-only">
                  Mobile navigation menu for Dhofar Municipality portal.
                </SheetDescription>
                <nav className="flex flex-col gap-6">
                  <Link href="/" className="text-2xl font-black flex items-center justify-between group">
                    {isAr ? 'الرئيسية' : 'Home'}
                    <ArrowRight className="text-accent group-hover:translate-x-2 transition-transform" />
                  </Link>
                  <Link href="/catalog" className="text-2xl font-black flex items-center justify-between group">
                    {isAr ? 'دليل الخدمات' : 'Service Catalog'}
                    <Search className="text-accent group-hover:translate-x-2 transition-transform" />
                  </Link>
                  <Link href="/identity" className="text-2xl font-black flex items-center justify-between group">
                    {isAr ? 'دليل الهوية' : 'Identity Guide'}
                    <Palette className="text-accent group-hover:translate-x-2 transition-transform" />
                  </Link>
                  {menuItems.map(item => (
                    <Link key={item.id} href={item.link} className="text-2xl font-black flex items-center justify-between group">
                      {isAr ? item.labelAr : item.labelEn}
                      <ArrowRight className="text-accent group-hover:translate-x-2 transition-transform" />
                    </Link>
                  ))}
                  <div className="mt-12 p-8 bg-slate-50 rounded-[2rem] border-2 border-dashed">
                     <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">{isAr ? 'تحويل اللغة' : 'Switch Language'}</p>
                     <Button onClick={() => setLanguage(isAr ? 'en' : 'ar')} className="w-full h-14 rounded-2xl bg-white border shadow-sm font-black text-primary hover:bg-primary hover:text-white transition-all">
                       {isAr ? 'English (Neural)' : 'العربية (محسنة)'}
                     </Button>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </header>
  );
}
