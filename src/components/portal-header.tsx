
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Globe, LayoutDashboard, Languages, Menu, Edit2 } from 'lucide-react';
import { useSettingsStore } from '@/lib/settings-store';
import { MenuItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
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

  return (
    <div className="w-full">
      {/* Top Utility Bar */}
      <div className="bg-slate-900 text-white py-2 text-[10px] font-bold tracking-widest border-b border-white/5">
        <div className="mx-auto max-w-7xl px-6 flex justify-between items-center">
          <span className="flex items-center gap-2 opacity-70">
            <Globe size={12} /> {isAr ? 'حكومة سلطنة عُمان' : 'Oman Government'}
          </span>
          <div className="flex items-center gap-6">
            {/* Contextual Editor Link for Prototype Admins */}
            {pathname !== '/admin' && (
              <Button variant="ghost" asChild className="text-accent hover:text-white h-auto py-0 px-2 font-black gap-2">
                <Link href={`/pagebuild?slug=${pathname.substring(1) || 'home'}`}>
                  <Edit2 size={10} /> {isAr ? 'تحرير المحتوى' : 'Edit Content'}
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
            <Link href="/" className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">
              {isAr ? 'الرئيسية' : 'Home'}
            </Link>
            {menuItems.map(item => (
              <Link key={item.id} href={item.link} className="text-sm font-bold text-slate-600 hover:text-primary transition-colors">
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
                <SheetTitle className="sr-only">{isAr ? "قائمة التنقل" : "Navigation Menu"}</SheetTitle>
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
