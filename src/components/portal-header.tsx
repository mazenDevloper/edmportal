
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Globe, LayoutDashboard, Menu, Edit2 } from 'lucide-react';
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

        // 1. Dynamic Pages
        if (pathname.startsWith('/p/')) {
          const slug = pathname.split('/').pop();
          const page = data.customPages?.find((p: CustomPage) => p.slug === slug);
          if (page) {
            setEditLink(`/pagebuild?id=${page.id}`);
            return;
          }
        }

        // 2. Service Workflows
        if (pathname.startsWith('/services/')) {
          const id = pathname.split('/').pop();
          const svc = data.services?.find((s: Service) => s.id === id);
          if (svc) {
            setEditLink(`/servicebuild?id=${svc.id}`);
            return;
          }
        }

        // 3. Standard Pages (Dynamic Overrides)
        const standardSlugs = ['privacy', 'terms', 'payment', 'access-controls', 'faqs', 'sla', 'governor-portal', 'open-data', 'service-controls', 'sitemap', 'tajawoob'];
        const currentSlug = pathname.replace('/', '');
        if (standardSlugs.includes(currentSlug)) {
          const page = data.customPages?.find((p: CustomPage) => p.slug === currentSlug);
          if (page) {
            setEditLink(`/pagebuild?id=${page.id}`);
          } else {
            // First time editing a standard page - pass slug to importer
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
      <nav className="bg-slate-900 text-white py-2 text-[10px] font-bold tracking-widest border-b border-white/5" aria-label={isAr ? "روابط سريعة" : "Quick Links"}>
        <div className="mx-auto max-w-7xl px-6 flex justify-between items-center">
          <span className="flex items-center gap-2 opacity-80">
            <Globe size={12} aria-hidden="true" /> {isAr ? 'حكومة سلطنة عُمان' : 'Oman Government'}
          </span>
          <div className="flex items-center gap-6">
            {editLink && (
              <Button variant="ghost" asChild className="text-[#04F0EB] hover:text-white h-auto py-0 px-2 font-black gap-2 animate-pulse">
                <Link href={editLink}>
                  <Edit2 size={10} aria-hidden="true" /> {isAr ? 'تحرير المكونات' : 'Edit Components'}
                </Link>
              </Button>
            )}
            <Link href="/template" className="text-[#04F0EB] hover:underline font-black">
              {isAr ? 'المساحة الذكية' : 'Spatial Workspace'}
            </Link>
            <Link href="/admin" className="text-[#04F0EB] hover:underline flex items-center gap-2">
              <LayoutDashboard size={12} aria-hidden="true" /> {isAr ? 'لوحة التحكم' : 'Admin Panel'}
            </Link>
            <button onClick={() => setLanguage(isAr ? 'en' : 'ar')} className="hover:text-[#04F0EB] transition-colors focus:ring-2 focus:ring-[#04F0EB] rounded px-1">
              {isAr ? 'English' : 'العربية'}
            </button>
          </div>
        </div>
      </nav>

      <nav className="bg-white border-b py-6 sticky top-0 z-[50] shadow-sm" aria-label={isAr ? "الملاحة الرئيسية" : "Primary Navigation"}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4" aria-label={isAr ? 'الرئيسية بلدية ظفار' : 'Dhofar Municipality Home'}>
             <Image src="https://apps.edm.gov.om/ords/r/dmpm/130/files/static/v15/cropped-DM-ICON.png" alt="" width={60} height={60} className="object-contain" />
             <div className="flex flex-col">
               <span className="text-2xl font-black text-primary leading-none">{isAr ? 'بلدية ظفار' : 'Dhofar Municipality'}</span>
               <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">{isAr ? 'بوابة الخدمات الإلكترونية' : 'Electronic Services Portal'}</span>
             </div>
          </Link>
          
          <div className="hidden lg:flex items-center gap-6">
            <Link href="/" className={cn("text-sm font-bold hover:text-primary transition-colors", pathname === '/' ? "text-primary" : "text-slate-600")}>
              {isAr ? 'الرئيسية' : 'Home'}
            </Link>
            {menuItems.map(item => (
              <Link key={item.id} href={item.link} className={cn("text-sm font-bold hover:text-primary transition-colors", pathname === item.link ? "text-primary" : "text-slate-600")}>
                {isAr ? item.labelAr : item.labelEn}
              </Link>
            ))}
          </div>

          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={isAr ? "افتح القائمة" : "Open Menu"}><Menu /></Button>
              </SheetTrigger>
              <SheetContent side={isAr ? "right" : "left"}>
                <SheetTitle className="text-primary font-black">{isAr ? "القائمة الرئيسية" : "Main Menu"}</SheetTitle>
                <nav className="flex flex-col gap-4 mt-8">
                  <Link href="/" className="text-lg font-bold">{isAr ? 'الرئيسية' : 'Home'}</Link>
                  {menuItems.map(item => (
                    <Link key={item.id} href={item.link} className="text-lg font-bold">
                      {isAr ? item.labelAr : item.labelEn}
                    </Link>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </header>
  );
}
