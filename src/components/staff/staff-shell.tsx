'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Languages, LogIn, LogOut, Search, UserCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSettingsStore } from '@/lib/settings-store';
import { fetchBin } from '@/lib/jsonbin';
import { useStaffSession } from '@/lib/staff-session';
import { DEFAULT_STAFF_PLATFORMS } from '@/lib/staff-platforms';
import { AccessData } from '@/lib/rbac';
import { Service, ServiceApplication, ServiceFlow, StaffPlatform, StaffUser } from '@/lib/types';
import { BrandEmblem } from '@/components/brand-logo';
import { cn } from '@/lib/utils';

export interface StaffPortalData {
  access: AccessData;
  services: Service[];
  flows: ServiceFlow[];
  applications: ServiceApplication[];
  platforms: StaffPlatform[];
}

/**
 * Loads portal data and resolves the signed-in employee.
 * `requireAuth` pages (service inboxes) redirect to login; the portal home is public —
 * platforms and offers need no sign-in, only the permission-based services do.
 */
export function useStaffPortal({ requireAuth = true }: { requireAuth?: boolean } = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const { userId, expiresAt, signOut } = useStaffSession();
  const [hydrated, setHydrated] = useState(false);
  const [data, setData] = useState<StaffPortalData | null>(null);

  // zustand's sessionStorage state is only available after mount
  useEffect(() => { setHydrated(true); }, []);

  const load = useCallback(async () => {
    const db = await fetchBin();
    setData({
      access: { staffUsers: db.staffUsers || [], serviceRoles: db.serviceRoles || [], roleAssignments: db.userRoleAssignments || [] },
      services: db.services || [],
      flows: db.serviceFlows || [],
      applications: db.applications || [],
      platforms: db.staffPlatforms?.length ? db.staffPlatforms : DEFAULT_STAFF_PLATFORMS,
    });
  }, []);

  useEffect(() => { if (hydrated) load(); }, [hydrated, load]);

  const user: StaffUser | null = useMemo(() => {
    if (!data || !userId) return null;
    return data.access.staffUsers.find(u => u.id === userId && u.isActive) || null;
  }, [data, userId]);

  useEffect(() => {
    if (!hydrated) return;
    const expired = !!userId && Date.now() > expiresAt;
    // Expired, or the account was disabled/removed: drop the session
    if (expired || (data && userId && !user)) signOut();
    if (requireAuth && (!userId || expired || (data && !user))) {
      router.replace(`/staff/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [hydrated, userId, expiresAt, data, user, pathname, router, signOut, requireAuth]);

  return { data, user, loading: !data || (requireAuth && !user), reload: load, setData };
}

interface ShellProps {
  user: StaffUser | null;
  search?: string;
  onSearch?: (q: string) => void;
  children: React.ReactNode;
}

export function StaffShell({ user, search, onSearch, children }: ShellProps) {
  const { language, setLanguage } = useSettingsStore();
  const isAr = language === 'ar';
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const router = useRouter();
  const signOut = useStaffSession(s => s.signOut);

  const nav = [
    { href: '/staff#platforms', label: t('المنصات', 'Platforms') },
    { href: '/staff#my-services', label: t('خدماتي', 'My services') },
    { href: '/staff#guides', label: t('الأدلة والسياسات', 'Guides & policies') },
    { href: '/staff/papers', label: t('المشاركات وأوراق العمل', 'Working papers') },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" dir={isAr ? 'rtl' : 'ltr'} lang={isAr ? 'ar' : 'en'}>
      <header className="bg-[#0f9e9b] text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/staff" className="flex items-center gap-3 shrink-0 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
            <span className="size-10 rounded-xl bg-white flex items-center justify-center">
              <BrandEmblem height={30} />
            </span>
            <span className="leading-tight">
              <span className="block font-black">{t('بوابة الموظف', 'Staff portal')}</span>
              <span className="block text-[10px] font-bold text-white/70">{t('بلدية ظفار', 'Dhofar Municipality')}</span>
            </span>
          </Link>

          <nav aria-label={t('التنقل', 'Navigation')} className="hidden lg:flex items-center gap-1">
            {nav.map(n => (
              <Link key={n.href} href={n.href} className="px-3 h-9 rounded-lg flex items-center text-sm font-bold text-white/90 hover:bg-white/15">{n.label}</Link>
            ))}
          </nav>

          <div className="ms-auto flex items-center gap-2">
            {onSearch && (
              <div className="relative hidden md:block">
                <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-white/70" aria-hidden />
                <input
                  type="search" value={search || ''} onChange={e => onSearch(e.target.value)}
                  placeholder={t('ابحث عن خدمة أو منصة…', 'Search services & platforms…')}
                  aria-label={t('بحث', 'Search')}
                  className="h-9 w-64 rounded-xl bg-white/15 placeholder:text-white/60 ps-9 pe-8 text-sm font-bold outline-none focus:bg-white focus:text-slate-900 focus:placeholder:text-slate-400"
                />
                {search && <button type="button" onClick={() => onSearch('')} className="absolute end-2 top-1/2 -translate-y-1/2" aria-label={t('مسح البحث', 'Clear search')}><X size={14} /></button>}
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={() => setLanguage(isAr ? 'en' : 'ar')} className="text-white hover:bg-white/15 font-black gap-1.5 h-9" lang={isAr ? 'en' : 'ar'}>
              <Languages size={15} />{isAr ? 'English' : 'العربية'}
            </Button>
            {!user && (
              <Button asChild size="sm" className="bg-white text-[#005751] hover:bg-white/90 font-black gap-1.5 h-9 rounded-xl">
                <Link href="/staff/login?next=/staff"><LogIn size={15} className={cn(isAr && '-scale-x-100')} />{t('تسجيل الدخول', 'Sign in')}</Link>
              </Button>
            )}
            {user && (
              <>
                <span className="hidden sm:flex items-center gap-2 h-9 px-3 rounded-xl bg-white/10 text-sm font-bold">
                  <UserCircle2 size={17} />{isAr ? user.nameAr : user.nameEn || user.nameAr}
                  <span className="font-mono text-[11px] text-white/70">{user.employeeNumber}</span>
                </span>
                <Button variant="ghost" size="sm" onClick={() => { signOut(); router.replace('/staff/login'); }} className="text-white hover:bg-white/15 font-black gap-1.5 h-9">
                  <LogOut size={15} className={cn(isAr && '-scale-x-100')} />{t('خروج', 'Sign out')}
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      <main id="staff-main" className="flex-1">{children}</main>
      <footer className="border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-slate-400">
          <span>© {new Date().getFullYear()} {t('بلدية ظفار — بوابة الموظف الداخلية', 'Dhofar Municipality — internal staff portal')}</span>
          <Link href="/" className="hover:text-slate-600">{t('بوابة الخدمات للمواطنين', 'Citizen services portal')}</Link>
        </div>
      </footer>
    </div>
  );
}
