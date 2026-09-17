'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Globe, LayoutDashboard, Menu, Edit2, Megaphone, Languages, Palette, Search, MessageSquare } from 'lucide-react';
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
      {/* Dynamic News Ticker */}
      <div className="bg-[#470D67] text-white py-3 overflow-hidden border-b border-white/10">
        <div className="flex items-center gap-4 px-6 animate-marquee whitespace-nowrap">
           <div className="flex items-center gap-3 font-black text-[10px] uppercase tracking-widest bg-[#03CFCB] text-slate-900 px-3 py-1 rounded-full shrink-0">
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

      <nav className="bg-slate-900 text-white py-3 text-[10px] font-bold tracking-widest border-b border-white/5">
        <div className="mx-auto max-w-7xl px-6 flex justify-between items-center">
          <span className="flex items-center gap-2 opacity-80 uppercase">
            <Globe size={14} className="text-[#03CFCB]" /> {isAr ? 'بوابة حكومة سلطنة عُمان الموحدة' : 'Oman Government Unified Portal'}
          </span>
          <div className="flex items-center gap-8">
            {editLink && (
              <Button variant="ghost" asChild className="text-[#03CFCB] hover:text-white h-auto py-0.5 px-3 font-black gap-2 animate-pulse bg-white/5 rounded-full">
                <Link href={editLink}>
                  <Edit2 size={12} /> {isAr ? 'تعديل هذا القسم' : 'Edit Section'}
                </Link>
              </Button>
            )}
            <Link href="/admin" className="text-[#03CFCB] hover:underline flex items-center gap-2 font-black">
              <LayoutDashboard size={14} /> {isAr ? 'لوحة التحكم' : 'Admin'}
            </Link>
          </div>
        </div>
      </nav>

      <nav className="bg-white border-b py-6 sticky top-0 z-[50] shadow-sm">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-5 group">
               <div className="relative group-hover:rotate-12 transition-transform duration-500">
                 <Image src="https://edm.gov.om/wp-content/uploads/2025/05/dhofar-logo-1.svg" alt="Dhofar Logo" width={60} height={60} className="object-contain" priority />
               </div>
               <div className="flex flex-col">
                 <span className="text-2xl font-black text-[#470D67] leading-none tracking-tighter uppercase">بلدية ظفار</span>
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{isAr ? 'بوابة الخدمات الرقمية الموحدة' : 'Unified Digital Portal'}</span>
               </div>
            </Link>

            {/* Tajawoob Logo Integrated */}
            <div className="hidden xl:flex items-center gap-4 pl-8 border-l border-slate-100">
              <a href="https://tajawob.om" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <Image src="https://tajawob.om/img/NSCP_AppSpecifc_UI$Images$Tajawob_logo.png?639247653587397355" alt="Tajawoob" width={110} height={40} className="object-contain" unoptimized />
              </a>
            </div>
          </div>
          
          <div className="hidden lg:flex items-center gap-6">
            <Link href="/" className={cn("text-sm font-black hover:text-[#470D67] transition-all uppercase tracking-widest", pathname === '/' ? "text-[#470D67] border-b-2 border-[#03CFCB]" : "text-slate-600")}>{isAr ? 'الرئيسية' : 'Home'}</Link>
            <Link href="/catalog" className={cn("text-sm font-black hover:text-[#470D67] transition-all uppercase tracking-widest", pathname === '/catalog' ? "text-[#470D67] border-b-2 border-[#03CFCB]" : "text-slate-600")}>{isAr ? 'دليل الخدمات' : 'Catalog'}</Link>
            <Link href="/identity" className={cn("text-sm font-black text-[#03CFCB] bg-[#03CFCB]/5 px-4 py-1.5 rounded-full hover:bg-[#03CFCB] hover:text-white transition-all uppercase tracking-widest", pathname === '/identity' && "bg-[#03CFCB] text-white")}>{isAr ? 'دليل الهوية' : 'Identity Guide'}</Link>
            
            <Button variant="outline" size="sm" onClick={() => setLanguage(isAr ? 'en' : 'ar')} className="rounded-full border-[#470D67]/20 font-black h-9 px-4 text-[#470D67]">
              <Languages size={14} className="ml-2" /> {isAr ? 'English' : 'العربية'}
            </Button>

            <Button asChild className="bg-[#470D67] hover:bg-slate-800 rounded-full px-8 h-9 font-black shadow-lg text-white uppercase text-[10px] tracking-widest">
              <Link href="/services/svc_105">{isAr ? 'تواصل معنا' : 'Support'}</Link>
            </Button>
          </div>

          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="size-12 rounded-xl bg-slate-50 border shadow-sm"><Menu size={24}/></Button>
              </SheetTrigger>
              <SheetContent side={isAr ? "right" : "left"} className="rounded-l-[3rem] border-none shadow-2xl">
                <SheetTitle className="text-[#470D67] font-black text-3xl mb-8">{isAr ? "قائمة البوابة" : "Menu"}</SheetTitle>
                <nav className="flex flex-col gap-6">
                  <Link href="/" className="text-2xl font-black">{isAr ? 'الرئيسية' : 'Home'}</Link>
                  <Link href="/catalog" className="text-2xl font-black">{isAr ? 'دليل الخدمات' : 'Catalog'}</Link>
                  <Link href="/identity" className="text-2xl font-black text-[#03CFCB]">{isAr ? 'دليل الهوية' : 'Identity'}</Link>
                  <a href="https://tajawob.om" target="_blank" className="text-2xl font-black text-emerald-600">{isAr ? 'منصة تجاوب' : 'Tajawoob'}</a>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </header>
  );
}
