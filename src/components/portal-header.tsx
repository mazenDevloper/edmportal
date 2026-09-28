'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Globe, LayoutDashboard, Menu, Edit2, Megaphone, Sparkles, Briefcase, LogOut } from 'lucide-react';
import { useAdminSession } from '@/lib/admin-session';
import { useStaffSession } from '@/lib/staff-session';
import { useSettingsStore } from '@/lib/settings-store';
import { MenuItem, CustomPage, Service, HeaderVariant } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { fetchBin } from '@/lib/jsonbin';
import { Badge } from '@/components/ui/badge';
import { translateToEnglish } from '@/ai/flows/translate-flow';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";

interface PortalHeaderProps {
  menuItems: MenuItem[];
  /** full = ticker + top bar + nav (default); compact = nav only; minimal = logo + language; none = hidden */
  variant?: HeaderVariant;
  showTicker?: boolean;
  showTopBar?: boolean;
  sticky?: boolean;
}

export function PortalHeader({ menuItems, variant = 'full', showTicker, showTopBar, sticky = true }: PortalHeaderProps) {
  const pathname = usePathname();
  const { language, setLanguage } = useSettingsStore();
  const isAr = language === 'ar';
  
  const [editLink, setEditLink] = useState<string | null>(null);
  const [tickerText, setTickerText] = useState('');
  const [translatedTicker, setTranslatedTicker] = useState<string | null>(null);
  const [aiName, setAiName] = useState<string | null>(null);
  // Sessions live in sessionStorage, so read them only after mount to avoid hydration mismatches
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const adminExpires = useAdminSession(s => s.expiresAt);
  const adminSignOut = useAdminSession(s => s.signOut);
  const staffExpires = useStaffSession(s => s.expiresAt);
  const staffUser = useStaffSession(s => s.userId);
  const isAdmin = mounted && adminExpires > Date.now();
  const isStaff = mounted && !!staffUser && staffExpires > Date.now();

  useEffect(() => {
    const determineEditLink = async () => {
      try {
        const data = await fetchBin();
        if (data) {
          const rawTicker = data.newsTickerText || '';
          setTickerText(rawTicker);
          if (!isAr && rawTicker) {
            const { translatedText } = await translateToEnglish({ text: rawTicker });
            setTranslatedTicker(translatedText);
          }
          if (!isAr && !aiName) {
            const { translatedText } = await translateToEnglish({ text: "بلدية ظفار" });
            setAiName(translatedText);
          }
        }
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
  }, [pathname, isAr, aiName]);

  const handleLanguageToggle = () => {
    setLanguage(isAr ? 'en' : 'ar');
  };

  if (variant === 'none') return null;

  const tickerOn = showTicker ?? variant === 'full';
  const topBarOn = (showTopBar ?? variant === 'full') && (isAdmin || isStaff);
  // Menu entries that point at admin-only pages are hidden from everyone but admins
  const ADMIN_ONLY = /^\/(admin|pagebuild|servicebuild|surveybuild|identity\/board)(\/|\?|$)/;
  const orderedMenu = [...(menuItems || [])].filter(m => isAdmin || !ADMIN_ONLY.test(m.link || '')).sort((a, b) => a.order - b.order);

  if (variant === 'minimal') {
    return (
      <header className={cn('w-full bg-white border-b z-[50]', sticky && 'sticky top-0')}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#03CFCB] rounded-lg">
            <Image src="https://imagetourl.cloud/a90z81isxaf9.png" alt="" width={56} height={38} className="object-contain" priority unoptimized />
            <span className="text-xl font-black text-secondary">{isAr ? 'بلدية ظفار' : 'Dhofar Municipality'}</span>
          </Link>
          <Button variant="outline" onClick={handleLanguageToggle} lang={isAr ? 'en' : 'ar'} className="rounded-full font-black h-9 px-5">{isAr ? 'English' : 'العربية'}</Button>
        </div>
      </header>
    );
  }

  return (
    <header className="w-full overflow-x-clip">
      {/* Dynamic News Ticker - Teal Theme (pauses on hover/focus; stops with reduced motion) */}
      {tickerOn && (
      <div className="dm-gradient-primary text-white py-3.5 overflow-hidden border-b border-white/10 shadow-lg relative group/ticker" role="region" aria-label={isAr ? 'آخر الأخبار' : 'Latest news'} tabIndex={0}>
        <div className="absolute inset-0 dm-pattern-wave-pro opacity-10 pointer-events-none" />
        <div className="flex items-center gap-6 px-6 animate-marquee group-hover/ticker:[animation-play-state:paused] group-focus/ticker:[animation-play-state:paused] whitespace-nowrap relative z-10">
           <div className="flex items-center gap-3 font-black text-[11px] uppercase tracking-[0.2em] bg-white text-primary px-4 py-1.5 rounded-full shrink-0 shadow-xl">
             <Megaphone size={14} />
             {isAr ? "آخر الأخبار" : "Latest News"}
           </div>
           <p className="text-base font-black opacity-95 tracking-tight">
             {(!isAr && translatedTicker) ? translatedTicker : tickerText || (isAr 
               ? "بدء العمل في مشروع رصف الطرق الداخلية بمنطقة المزيونة - بلدية ظفار تدعو المواطنين لتحديث بياناتهم عبر البوابة الموحدة."
               : "New road paving projects launched in Al-Mazyuna - Dhofar Municipality invites citizens to update data via the portal.")}
           </p>
        </div>
      </div>
      )}

      {topBarOn && (
      <nav aria-label={isAr ? 'روابط عامة' : 'Utility links'} className="bg-slate-900 text-white py-3 text-[10px] font-bold tracking-[0.2em] border-b border-white/5 uppercase">
        <div className="mx-auto max-w-7xl px-4 md:px-6 flex justify-between items-center gap-4">
          <span className="hidden sm:flex items-center gap-3 opacity-80">
            <Globe size={16} className="text-primary" /> {isAr ? 'بوابة حكومة سلطنة عُمان الموحدة' : 'Oman Government Unified Portal'}
          </span>
          <div className="flex items-center gap-4 md:gap-8 ms-auto">
            {isAdmin && editLink && (
              <Button variant="ghost" asChild className="text-primary hover:text-white h-auto py-1 px-4 font-black gap-2 bg-white/5 rounded-full">
                <Link href={editLink}><Edit2 size={12} /> {isAr ? 'تعديل هذا القسم' : 'Edit Section'}</Link>
              </Button>
            )}
            <Link href="/staff" className="text-white/90 hover:text-primary flex items-center gap-2 font-black">
              <Briefcase size={14} /> {isAr ? 'بوابة الموظف' : 'Staff portal'}
            </Link>
            {isAdmin && (
              <>
                <Link href="/admin" className="text-primary hover:underline flex items-center gap-2 font-black">
                  <LayoutDashboard size={14} /> {isAr ? 'لوحة التحكم' : 'Admin'}
                </Link>
                <button type="button" onClick={adminSignOut} className="text-white/70 hover:text-white flex items-center gap-2 font-black">
                  <LogOut size={14} className={cn(isAr && '-scale-x-100')} /> {isAr ? 'خروج' : 'Sign out'}
                </button>
              </>
            )}
          </div>
        </div>
      </nav>
      )}

      <nav aria-label={isAr ? 'التنقل الرئيسي' : 'Main navigation'} className={cn('bg-white border-b z-[50] shadow-sm', variant === 'compact' ? 'py-4' : 'py-8', sticky && 'sticky top-0')}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-10 min-w-0">
            <Link href="/" className="flex items-center gap-3 md:gap-6 group min-w-0">
               <Image src="https://imagetourl.cloud/a90z81isxaf9.png" alt="" width={variant === 'compact' ? 70 : 95} height={variant === 'compact' ? 48 : 65} className="object-contain w-14 md:w-auto shrink-0" priority unoptimized />
               <span className={cn('font-black text-secondary leading-none tracking-tighter uppercase', variant === 'compact' ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl')}>
                 {isAr ? 'بلدية ظفار' : (aiName || 'Dhofar Municipality')}
               </span>
            </Link>
          </div>
          
          <div className="hidden lg:flex items-center gap-8">
            <Link href="/" aria-current={pathname === '/' ? 'page' : undefined} className={cn("text-sm font-black hover:text-primary transition-all uppercase tracking-widest", pathname === '/' ? "text-primary border-b-4 border-secondary pb-1" : "text-slate-600")}>{isAr ? 'الرئيسية' : 'Home'}</Link>
            <Link href="/catalog" aria-current={pathname === '/catalog' ? 'page' : undefined} className={cn("text-sm font-black hover:text-primary transition-all uppercase tracking-widest", pathname === '/catalog' ? "text-primary border-b-4 border-secondary pb-1" : "text-slate-600")}>{isAr ? 'دليل الخدمات' : 'Catalog'}</Link>
            {orderedMenu.map(m => (
              <Link key={m.id} href={m.link} aria-current={pathname === m.link ? 'page' : undefined} className={cn("text-sm font-black hover:text-primary transition-all uppercase tracking-widest", pathname === m.link ? "text-primary border-b-4 border-secondary pb-1" : "text-slate-600")}>{isAr ? m.labelAr : m.labelEn || m.labelAr}</Link>
            ))}
            <Link href="/identity" className={cn("text-sm font-black text-primary bg-primary/5 px-6 py-2 rounded-2xl hover:bg-primary hover:text-slate-900 transition-all uppercase tracking-widest", pathname === '/identity' && "bg-primary text-slate-900 shadow-lg")}>{isAr ? 'دليل الهوية' : 'Identity Hub'}</Link>
            
            <Button 
              variant="outline" 
              onClick={handleLanguageToggle}
              className="rounded-full border-slate-200 font-black h-10 px-6 text-slate-700 hover:border-primary flex items-center gap-2 group"
            >
              <Sparkles size={16} className="text-accent group-hover:animate-pulse" />
              <span>{isAr ? 'English' : 'العربية'}</span>
              <Badge variant="outline" className="text-[9px] font-black ml-1 bg-slate-50">AI</Badge>
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
                  {orderedMenu.map(m => <Link key={m.id} href={m.link} className="text-3xl font-black text-slate-800 hover:text-primary transition-colors">{isAr ? m.labelAr : m.labelEn || m.labelAr}</Link>)}
                  <Link href="/staff" className="text-2xl font-black text-secondary hover:text-primary transition-colors">{isAr ? 'بوابة الموظف' : 'Staff portal'}</Link>
                  <Button variant="outline" onClick={handleLanguageToggle} className="rounded-full font-black h-12 w-fit px-8">{isAr ? 'English' : 'العربية'}</Button>
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