
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Globe, LayoutDashboard, Languages, Menu, Edit2 } from 'lucide-react';
import { useSettingsStore } from '@/lib/settings-store';
import { MenuItem, CustomPage, Service, Survey } from '@/lib/types';
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
      if (pathname === '/') {
        setEditLink('/admin');
        return;
      }

      const data = await fetchBin();
      if (!data) return;

      // Check Custom Pages
      if (pathname.startsWith('/p/')) {
        const slug = pathname.split('/').pop();
        const page = data.customPages?.find((p: CustomPage) => p.slug === slug);
        if (page) {
          setEditLink(`/pagebuild?id=${page.id}`);
          return;
        }
      }

      // Check Services
      if (pathname.startsWith('/services/')) {
        const id = pathname.split('/').pop();
        const svc = data.services?.find((s: Service) => s.id === id);
        if (svc) {
          setEditLink(`/servicebuild?id=${svc.id}`);
          return;
        }
      }

      setEditLink(null);
    };

    determineEditLink();
  }, [pathname]);

  return (
    <div className="w-full">
      {/* Top Utility Bar */}
      <div className="bg-slate-900 text-white py-2 text-[10px] font-bold tracking-widest border-b border-white/5">
        <div className="mx-auto max-w-7xl px-6 flex justify-between items-center">
          <span className="flex items-center gap-2 opacity-70">
            <Globe size={12} /> {isAr ? 'حكومة سلطنة عُمان' : 'Oman Government'}
          </span>
          <div className="flex items-center gap-6">
            {editLink && (
              <Button variant="ghost" asChild className="text-accent hover:text-white h-auto py-0 px-2 font-black gap-2">
                <Link href={editLink}>
                  <Edit2 size={10} /> {isAr ? 'تحرير هذا المكون' : 'Edit This Element'}
                </Link>
              </Button>
            )}
            <Link href="/template" className="text-accent hover:underline font-black">
              {isAr ? 'المساحة الذكية' : 'Spatial Workspace'}
            </Link>
            <Link href="/admin" className="text-accent hover:underline flex items-center gap-2">
              <LayoutDashboard size={12} /> {isAr ? 'لوحة التحكم' : 'Admin Panel'}
            </Link>
            <button onClick={() => setLanguage(isAr ? 'en' : 'ar')} className="hover:text-accent">
              {isAr ? 'English' : 'العربية'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Header */}
      <header className="bg-white border-b py-6 sticky top-0 z-[50] shadow-sm">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4">
             <Image src="https://apps.edm.gov.om/ords/r/dmpm/130/files/static/v15/cropped-DM-ICON.png" alt="Logo" width={60} height={60} className="object-contain" />
             <div className="flex flex-col">
               <span className="text-2xl font-black text-primary leading-none">{isAr ? 'بلدية ظفار' : 'Dhofar Municipality'}</span>
               <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">{isAr ? 'بوابة الخدمات الإلكترونية' : 'Electronic Services Portal'}</span>
             </div>
          </Link>
          
          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-6">
            <Link href="/" className={cn("text-sm font-bold hover:text-primary transition-colors", pathname === '/' ? "text-primary" : "text-slate-600")}>
              {isAr ? 'الرئيسية' : 'Home'}
            </Link>
            {menuItems.map(item => (
              <Link key={item.id} href={item.link} className={cn("text-sm font-bold hover:text-primary transition-colors", pathname === item.link ? "text-primary" : "text-slate-600")}>
                {isAr ? item.labelAr : item.labelEn}
              </Link>
            ))}
          </nav>

          {/* Mobile Menu */}
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={isAr ? "القائمة" : "Menu"}><Menu /></Button>
              </SheetTrigger>
              <SheetContent side={isAr ? "right" : "left"}>
                <SheetTitle className="text-primary font-black">{isAr ? "القائمة الرئيسية" : "Main Menu"}</SheetTitle>
                <div className="flex flex-col gap-4 mt-8">
                  <Link href="/" className="text-lg font-bold">{isAr ? 'الرئيسية' : 'Home'}</Link>
                  {menuItems.map(item => (
                    <Link key={item.id} href={item.link} className="text-lg font-bold">
                      {isAr ? item.labelAr : item.labelEn}
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </div>
  );
}
