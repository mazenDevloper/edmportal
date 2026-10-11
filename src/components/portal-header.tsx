'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
import { BrandLogo } from '@/components/brand-logo';
import { CitizenSignIn, DesktopMenu, MobileMenu, useMenu } from '@/components/main-nav';
import { CitizenBar } from '@/components/citizen/citizen-bar';
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
            const { translatedText, ok } = await translateToEnglish({ text: rawTicker });
            if (ok) setTranslatedTicker(translatedText);
          }
        }
        if (pathname === '/') { setEditLink('/edmPortal'); return; }
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
  }, [pathname, isAr]);

  const handleLanguageToggle = () => {
    setLanguage(isAr ? 'en' : 'ar');
  };

  if (variant === 'none') return null;

  const tickerOn = showTicker ?? variant === 'full';
  const topBarOn = (showTopBar ?? variant === 'full') && (isAdmin || isStaff);
  // Menu entries that point at admin-only pages are hidden from everyone but admins
  const ADMIN_ONLY = /^\/(admin|edmPortal|edmEmp|pagebuild|servicebuild|surveybuild|identity\/board)(\/|\?|$)/;
  const menu = useMenu([...(menuItems || [])].filter(m => isAdmin || !ADMIN_ONLY.test(m.link || '')).sort((a, b) => a.order - b.order));

  if (variant === 'minimal') {
    return (
      <header className={cn('w-full bg-white border-b z-[50]', sticky && 'sticky top-0')}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#03CFCB] rounded-lg">
            <BrandLogo height={44} alt={isAr ? 'بلدية ظفار – الصفحة الرئيسية' : 'Dhofar Municipality – home'} />
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
                <Link href="/edmPortal" className="text-primary hover:underline flex items-center gap-2 font-black">
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

      <div className={cn('bg-white border-b z-[50] shadow-sm', sticky && 'sticky top-0')}>
        <div className={cn('max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between gap-3', variant === 'compact' ? 'py-3' : 'py-4')}>
          <Link href="/" className="flex items-center min-w-0 rounded-lg focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#03CFCB]">
            {/* The official logo carries the bilingual name */}
            <BrandLogo height={variant === 'compact' ? 48 : 64} className="max-h-12 md:max-h-none" alt={isAr ? 'بلدية ظفار – الصفحة الرئيسية' : 'Dhofar Municipality – home'} />
          </Link>

          <div className="hidden xl:flex items-center gap-3">
            <Button variant="outline" onClick={handleLanguageToggle} lang={isAr ? 'en' : 'ar'} className="rounded-full border-slate-200 font-black h-10 px-5 text-slate-700 hover:border-primary flex items-center gap-2 group">
              <Globe size={16} className="text-accent" aria-hidden />
              <span>{isAr ? 'English' : 'العربية'}</span>
            </Button>
            <CitizenSignIn isAr={isAr} />
            <Button asChild className="dm-gradient-royal rounded-full px-6 h-10 font-black shadow-lg text-white text-sm">
              <Link href="/services/svc_105">{isAr ? 'تواصل معنا' : 'Contact us'}</Link>
            </Button>
          </div>

          <div className="xl:hidden flex items-center gap-2">
            <CitizenSignIn isAr={isAr} className="hidden sm:flex" />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="size-12 rounded-2xl bg-slate-50 border shadow-sm" aria-label={isAr ? 'القائمة' : 'Menu'}><Menu size={26} /></Button>
              </SheetTrigger>
              <SheetContent side={isAr ? 'right' : 'left'} dir={isAr ? 'rtl' : 'ltr'} className="w-[min(24rem,100vw)] overflow-y-auto border-none shadow-2xl">
                <SheetTitle className="text-secondary font-black text-2xl mb-6">{isAr ? 'قائمة البوابة' : 'Menu'}</SheetTitle>
                <nav aria-label={isAr ? 'التنقل الرئيسي' : 'Main navigation'} className="space-y-6">
                  <MobileMenu groups={menu} isAr={isAr} pathname={pathname} />
                  <div className="flex flex-wrap gap-2 border-t pt-4">
                    <CitizenSignIn isAr={isAr} />
                    <Button variant="outline" onClick={handleLanguageToggle} lang={isAr ? 'en' : 'ar'} className="rounded-full font-black h-10 px-5">{isAr ? 'English' : 'العربية'}</Button>
                  </div>
                  <div className="flex flex-col gap-1 border-t pt-4 text-base font-black">
                    <Link href="/services/svc_105" className="px-3 py-2 rounded-lg text-secondary hover:bg-slate-50">{isAr ? 'تواصل معنا' : 'Contact us'}</Link>
                    <Link href="/tajawoob" className="px-3 py-2 rounded-lg text-secondary hover:bg-slate-50">{isAr ? 'منصة تجاوب' : 'Tajawob'}</Link>
                    <Link href="/staff" className="px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-50">{isAr ? 'بوابة الموظف' : 'Staff portal'}</Link>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <nav aria-label={isAr ? 'التنقل الرئيسي' : 'Main navigation'} className="hidden xl:block border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-1.5">
            <DesktopMenu groups={menu} isAr={isAr} pathname={pathname} />
          </div>
        </nav>
      </div>
      <CitizenBar isAr={isAr} />
    </header>
  );
}