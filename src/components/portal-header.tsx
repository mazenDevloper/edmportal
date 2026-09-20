'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Globe, LayoutDashboard, Menu, Edit2, Megaphone, Languages } from 'lucide-react';
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
} from "@/components/ui/sheet";

interface PortalHeaderProps {
  menuItems: MenuItem[];
}

export function PortalHeader({ menuItems }: PortalHeaderProps) {
  const pathname = usePathname();
  const { language, setLanguage } = useSettingsStore();
  const isAr = language === 'ar';
  
  const [editLink, setEditLink] = useState<string | null>(null);
  const [tickerText, setTickerText] = useState('');

  useEffect(() => {
    const determineEditLink = async () => {
      try {
        const data = await fetchBin();
        if (data) setTickerText(data.newsTickerText || '');
        if (pathname === '/') { setEditLink('/admin'); return; }
        if (!data) return;
        if (pathname.startsWith('/p/')) {
          const slug = pathname.split('/').pop();
          const page = data.customPages?.find((p: CustomPage) => p.slug === slug);
          if (page) { setEditLink(`/pagebuild?id=${page.id}`); return; }
        }
        if (pathname.startsWith('/services/')) {
          const id = pathname.split('/').pop();
          const svc = data.services?.find((s: Service) => s.id === id);
          if (svc) { setEditLink(`/servicebuild?id=${svc.id}`); return; }
        }
        setEditLink(null);
      } catch (err) { setEditLink(null); }
    };
    determineEditLink();
  }, [pathname]);

  return (
    <header className="w-full">
      {/* Dynamic News Ticker - Teal Theme */}
      <div className="dm-gradient-primary text-white py-3.5 overflow-hidden border-b border-white/10 shadow-lg relative">
        <div className="absolute inset-0 dm-pattern-wave-pro opacity-10 pointer-events-none" />
        <div className="flex items-center gap-6 px-6 animate-marquee whitespace-nowrap relative z-10">
           <div className="flex items-center gap-3 font-black text-[11px] uppercase tracking-[0.2em] bg-white text-primary px-4 py-1.5 rounded-full shrink-0 shadow-xl">
             <Megaphone size={14} />
             {isAr ? "آخر الأخبار" : "Breaking News"}
           </div>
           <p className="text-base font-black opacity-95 tracking-tight">
             {tickerText || (isAr 
               ? "بدء العمل في مشروع رصف الطرق الداخلية بمنطقة المزيونة - بلدية ظفار تدعو المواطنين لتحديث بياناتهم عبر البوابة الموحدة."
               : "New road paving projects launched in Al-Mazyuna - Dhofar Municipality invites citizens to update data via the portal.")}
           </p>
        </div>
      </div>

      <nav className="bg-slate-900 text-white py-3 text-[10px] font-bold tracking-[0.2em] border-b border-white/5 uppercase">
        <div className="mx-auto max-w-7xl px-6 flex justify-between items-center">
          <span className="flex items-center gap-3 opacity-80">
            <Globe size={16} className="text-primary" /> {isAr ? 'بوابة حكومة سلطنة عُمان الموحدة' : 'Oman Government Unified Portal'}
          </span>
          <div className="flex items-center gap-8">
            {editLink && (
              <Button variant="ghost" asChild className="text-primary hover:text-white h-auto py-1 px-4 font-black gap-2 bg-white/5 rounded-full">
                <Link href={editLink}><Edit2 size={12} /> {isAr ? 'تعديل هذا القسم' : 'Edit Section'}</Link>
              </Button>
            )}
            <Link href="/admin" className="text-primary hover:underline flex items-center gap-2 font-black">
              <LayoutDashboard size={14} /> {isAr ? 'لوحة التحكم' : 'Admin'}
            </Link>
          </div>
        </div>
      </nav>

      <nav className="bg-white border-b py-8 sticky top-0 z-[50] shadow-sm">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center gap-6 group">
               <Image src="https://imagetourl.cloud/a90z81isxaf9.png" alt="Dhofar Logo" width={95} height={65} className="object-contain" priority unoptimized />
               <span className="text-3xl font-black text-secondary leading-none tracking-tighter uppercase">بلدية ظفار</span>
            </Link>
            <div className="hidden xl:flex items-center gap-5 pl-10 border-l border-slate-100">
              <a href="https://tajawob.om" target="_blank" rel="noopener noreferrer" className="hover:opacity-80 transition-opacity">
                <Image src="https://tajawob.om/img/NSCP_AppSpecifc_UI$Images$Tajawob_logo.png?639247653587397355" alt="Tajawoob" width={120} height={45} className="object-contain" unoptimized />
              </a>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-8">
            <Link href="/" className={cn("text-sm font-black hover:text-primary transition-all uppercase tracking-widest", pathname === '/' ? "text-primary border-b-4 border-secondary pb-1" : "text-slate-600")}>{isAr ? 'الرئيسية' : 'Home'}</Link>
            <Link href="/catalog" className={cn("text-sm font-black hover:text-primary transition-all uppercase tracking-widest", pathname === '/catalog' ? "text-primary border-b-4 border-secondary pb-1" : "text-slate-600")}>{isAr ? 'دليل الخدمات' : 'Catalog'}</Link>
            <Link href="/identity" className={cn("text-sm font-black text-primary bg-primary/5 px-6 py-2 rounded-2xl hover:bg-primary hover:text-slate-900 transition-all uppercase tracking-widest", pathname === '/identity' && "bg-primary text-slate-900 shadow-lg")}>{isAr ? 'دليل الهوية' : 'Identity Hub'}</Link>
            
            <Button variant="outline" size="sm" onClick={() => setLanguage(isAr ? 'en' : 'ar')} className="rounded-full border-slate-200 font-black h-10 px-6 text-slate-700 hover:border-primary">
              <Languages size={16} className="ml-2" /> {isAr ? 'English' : 'العربية'}
            </Button>

            <Button asChild className="dm-gradient-royal rounded-full px-10 h-10 font-black shadow-2xl text-white uppercase text-[11px] tracking-widest">
              <Link href="/services/svc_105">{isAr ? 'تواصل معنا' : 'Support'}</Link>
            </Button>
          </div>

          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="size-14 rounded-2xl bg-slate-50 border shadow-sm"><Menu size={32}/></Button>
              </SheetTrigger>
              <SheetContent side={isAr ? "right" : "left"} className="rounded-l-[3.5rem] border-none shadow-2xl">
                <SheetTitle className="text-secondary font-black text-4xl mb-12 uppercase tracking-tighter">{isAr ? "قائمة البوابة" : "Digital Menu"}</SheetTitle>
                <nav className="flex flex-col gap-8">
                  <Link href="/" className="text-3xl font-black text-slate-800 hover:text-primary transition-colors">{isAr ? 'الرئيسية' : 'Portal Home'}</Link>
                  <Link href="/catalog" className="text-3xl font-black text-slate-800 hover:text-primary transition-colors">{isAr ? 'دليل الخدمات' : 'Service Catalog'}</Link>
                  <Link href="/identity" className="text-3xl font-black text-primary hover:text-primary transition-colors">{isAr ? 'دليل الهوية' : 'Identity Hub'}</Link>
                  <a href="https://tajawob.om" target="_blank" className="text-3xl font-black text-secondary">{isAr ? 'منصة تجاوب' : 'Tajawoob'}</a>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </header>
  );
}