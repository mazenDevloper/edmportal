'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import * as Icons from 'lucide-react';
import { ArrowUpRight, Inbox, Loader2, Lock, LogIn, ShieldCheck, Sparkles, Star } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetchBin, updateBin } from '@/lib/jsonbin';
import { daysUntil } from '@/lib/papers';
import { EmployeeCard } from '@/components/staff/employee-card';
import { Badge } from '@/components/ui/badge';
import { useSettingsStore } from '@/lib/settings-store';
import { ALL_PERMISSIONS, getUserRoles, getUserStages } from '@/lib/rbac';
import { PLATFORM_CATEGORIES } from '@/lib/staff-platforms';
import { ServiceRole, StaffPlatform, StaffUser } from '@/lib/types';
import { StaffShell, useStaffPortal } from '@/components/staff/staff-shell';
import { ServiceIcon } from '@/components/service/service-icon';
import { cn } from '@/lib/utils';

type HomeTab = 'platforms' | 'my-services' | 'guides';
const HOME_TABS: HomeTab[] = ['platforms', 'my-services', 'guides'];

export default function StaffPortalHome() {
  const { language } = useSettingsStore();
  const isAr = language === 'ar';
  const t = (ar: string, en: string) => (isAr ? ar : en);
  // Public page: platforms need no sign-in; only "my services" does
  const { data, user, loading, setData } = useStaffPortal({ requireAuth: false });
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<HomeTab>('platforms');
  const [category, setCategory] = useState<string>('all');
  const favs = useFavourites(user?.id);

  // Header links (/staff#my-services …) switch tabs
  useEffect(() => {
    const fromHash = () => {
      const h = window.location.hash.slice(1) as HomeTab;
      if (HOME_TABS.includes(h)) { setTab(h); document.getElementById('staff-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, []);
  const changeTab = (v: string) => { setTab(v as HomeTab); history.replaceState(null, '', `#${v}`); };

  // Services this employee may see: any role in the service (super admins see all)
  const myServices = useMemo(() => {
    if (!data || !user) return [];
    const withFlows = data.services.filter(s => data.flows.some(f => f.serviceId === s.id));
    return withFlows
      .map(s => {
        const roles = user.isSuperAdmin ? [] : getUserRoles(data.access, user.id, s.id);
        const flow = data.flows.find(f => f.serviceId === s.id);
        const open = data.applications.filter(a => a.serviceId === s.id && (a.status === 'pending' || a.status === 'in-review')).length;
        const myStages = flow ? getUserStages(data.access, user.id, flow).length : 0;
        return { service: s, roles, open, myStages };
      })
      .filter(x => user.isSuperAdmin || x.roles.length > 0);
  }, [data, user]);

  const q = query.trim().toLowerCase();
  const visibleServices = myServices.filter(x => !q || `${x.service.title} ${x.service.titleEn}`.toLowerCase().includes(q));
  const allPlatforms = data?.platforms || [];
  const platforms = allPlatforms.filter(p => !q || `${p.nameAr} ${p.nameEn}`.toLowerCase().includes(q));
  const totalOpen = myServices.reduce((n, x) => n + x.open, 0);
  const tools = platforms.filter(p => p.category !== 'guides');
  const shown = category === 'all' ? tools : tools.filter(p => p.category === category);
  const guides = platforms.filter(p => p.category === 'guides');

  /** The employee's own card photo: read-merge-write of their record only */
  const savePhoto = async (url: string | undefined) => {
    if (!user) return;
    const db = await fetchBin();
    const staffUsers = (db.staffUsers || []).map((u: StaffUser) => (u.id === user.id ? { ...u, photoUrl: url } : u));
    await updateBin({ ...db, staffUsers });
    setData(d => d && { ...d, access: { ...d.access, staffUsers } });
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" role="status" aria-label={t('جارٍ التحميل', 'Loading')}><Loader2 className="animate-spin text-[#0f9e9b]" size={36} /></div>;
  }

  const nextCall = (data?.paperCalls || []).filter(c => daysUntil(c.submissionDeadline) >= 0).sort((a, b) => a.submissionDeadline.localeCompare(b.submissionDeadline))[0];
  const favPlatforms = allPlatforms.filter(p => favs.list.includes(p.id));

  return (
    <StaffShell user={user} search={query} onSearch={setQuery}>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <h1 className="sr-only">{t('بوابة موظفي بلدية ظفار', 'Dhofar Municipality staff portal')}</h1>

        {/* Widgets */}
        {user ? (
          <div className="grid gap-5 lg:grid-cols-12">
            <Widget className="lg:col-span-4 lg:row-span-2" title={t('بطاقتي', 'My card')} icon={Icons.IdCard}>
              <EmployeeCard user={user} isAr={isAr} onPhoto={savePhoto} />
            </Widget>

            <Widget className="lg:col-span-8 relative overflow-hidden">
              <div aria-hidden className="absolute inset-0 dm-pattern-wave-pro opacity-20" />
              <div className="relative flex flex-wrap items-start justify-between gap-6">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-400">{greeting(isAr)}</p>
                  <h2 className="text-3xl font-black text-secondary">{isAr ? user.nameAr : user.nameEn || user.nameAr}</h2>
                  <p className="text-sm font-bold text-slate-500">
                    {t('الرقم الوظيفي', 'Employee no.')} <span className="font-mono">{user.employeeNumber}</span>{user.department && ` · ${user.department}`}
                    {user.isSuperAdmin && <Badge className="ms-2 bg-red-500">{t('مدير نظام', 'Super admin')}</Badge>}
                  </p>
                </div>
                <Clock isAr={isAr} />
              </div>
              <dl className="relative mt-6 grid grid-cols-3 gap-3">
                <Stat label={t('خدماتي', 'My services')} value={myServices.length} onClick={() => changeTab('my-services')} />
                <Stat label={t('طلبات مفتوحة', 'Open requests')} value={totalOpen} highlight={totalOpen > 0} onClick={() => changeTab('my-services')} />
                <Stat label={t('المنصات المتاحة', 'Platforms')} value={tools.length} onClick={() => changeTab('platforms')} />
              </dl>
            </Widget>

            <Widget className="lg:col-span-4" title={t('منصاتي المفضلة', 'My favourites')} icon={Star}>
              {favPlatforms.length ? (
                <ul className="grid grid-cols-3 gap-2">{favPlatforms.map(p => <li key={p.id}><PlatformTile platform={p} isAr={isAr} compact /></li>)}</ul>
              ) : (
                <p className="text-sm font-bold text-slate-400 leading-relaxed">{t('اضغط النجمة ☆ على أي منصة لتثبيتها هنا للوصول السريع.', 'Tap the ☆ on any platform to pin it here.')}</p>
              )}
            </Widget>

            <Widget className="lg:col-span-4" title={t('المشاركات وأوراق العمل', 'Working papers')} icon={Icons.FileText}>
              <Link href="/staff/papers" className="group block space-y-2 rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0f9e9b]">
                {nextCall ? <>
                  <p className="font-black text-slate-800 leading-snug">{nextCall.title}</p>
                  <p className="text-sm font-bold text-amber-700">{t(`يُغلق خلال ${daysUntil(nextCall.submissionDeadline)} يوم`, `Closes in ${daysUntil(nextCall.submissionDeadline)} days`)}</p>
                </> : <>
                  <p className="font-black text-slate-800">{t('لا توجد دعوات مفتوحة حالياً', 'No open calls right now')}</p>
                  <p className="text-sm font-bold text-slate-500">{t('تصفّح البنك المعرفي ودليل الكتابة', 'Browse the knowledge bank and writing guide')}</p>
                </>}
                <span className="inline-flex items-center gap-1 text-sm font-black text-[#0f9e9b]">{t('فتح البوابة', 'Open')}<ArrowUpRight size={15} className={cn('transition-transform group-hover:-translate-y-0.5', isAr && '-scale-x-100')} /></span>
              </Link>
            </Widget>
          </div>
        ) : (
          <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#0f9e9b] to-[#005751] text-white p-7 flex flex-wrap items-center justify-between gap-6">
            <div aria-hidden className="absolute inset-0 dm-pattern-landmark opacity-10" />
            <div className="relative space-y-2 max-w-2xl">
              <h2 className="text-2xl font-black">{t('خدماتك وبطاقتك حسب صلاحياتك', 'Your services and card')}</h2>
              <p className="font-medium text-white/80">{t('المنصات العامة والأدلة متاحة للجميع. سجّل الدخول لعرض بطاقتك الرقمية والخدمات المسندة إليك ومنصاتك المفضلة.', 'Platforms and guides are open to everyone. Sign in for your digital card, assigned services and favourites.')}</p>
            </div>
            <Link href="/staff/login?next=/staff" className="relative inline-flex items-center gap-2 h-12 px-6 rounded-2xl bg-white text-[#005751] font-black shadow-lg focus-visible:outline focus-visible:outline-4 focus-visible:outline-white/60">
              <LogIn size={18} className={cn(isAr && '-scale-x-100')} />{t('تسجيل الدخول', 'Sign in')}
            </Link>
          </section>
        )}

        {/* Tabs */}
        <Tabs id="staff-tabs" value={tab} onValueChange={changeTab} dir={isAr ? 'rtl' : 'ltr'} className="scroll-mt-24 space-y-5">
          <TabsList className="h-auto flex flex-wrap justify-start gap-1 bg-white ring-1 ring-slate-100 rounded-2xl p-1.5 shadow-sm">
            {([
              ['platforms', Icons.LayoutGrid, t('منصات الموظفين', 'Staff platforms'), tools.length],
              ['my-services', Inbox, t('خدماتي حسب الصلاحيات', 'My services'), user ? visibleServices.length : null],
              ['guides', Icons.BookOpen, t('الأدلة والسياسات', 'Guides & policies'), guides.length],
            ] as const).map(([id, Icon, label, n]) => (
              <TabsTrigger key={id} value={id} className="h-11 px-5 rounded-xl font-black gap-2 data-[state=active]:bg-[#0f9e9b] data-[state=active]:text-white">
                <Icon size={17} aria-hidden />{label}
                {n !== null && <span className="min-w-6 h-6 px-1.5 rounded-full bg-black/10 text-xs flex items-center justify-center">{n}</span>}
              </TabsTrigger>
            ))}
            <Link href="/staff/papers" className="h-11 px-5 rounded-xl font-black text-sm text-slate-600 hover:bg-slate-100 inline-flex items-center gap-2">
              <Icons.FileText size={17} aria-hidden />{t('المشاركات وأوراق العمل', 'Working papers')}
            </Link>
          </TabsList>

          <TabsContent value="platforms" id="platforms" className="space-y-5">
            <div role="group" aria-label={t('تصفية حسب الفئة', 'Filter by category')} className="flex flex-wrap gap-2">
              {[{ id: 'all', labelAr: 'الكل', labelEn: 'All' }, ...PLATFORM_CATEGORIES.filter(c => c.id !== 'guides')].map(c => {
                const n = c.id === 'all' ? tools.length : tools.filter(p => p.category === c.id).length;
                if (!n && c.id !== 'all') return null;
                return (
                  <button key={c.id} type="button" onClick={() => setCategory(c.id)} aria-pressed={category === c.id}
                    className={cn('h-9 px-4 rounded-full text-sm font-black ring-1 transition-colors', category === c.id ? 'bg-secondary text-white ring-secondary' : 'bg-white text-slate-600 ring-slate-200 hover:ring-[#0f9e9b]/50')}>
                    {isAr ? c.labelAr : c.labelEn} <span className="opacity-60">{n}</span>
                  </button>
                );
              })}
            </div>
            {shown.length === 0 ? <p className="text-center py-10 font-bold text-slate-400">{t('لا توجد نتائج', 'No results')}</p> : (
              <ul className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {shown.map(p => <li key={p.id}><PlatformTile platform={p} isAr={isAr} fav={user ? { on: favs.list.includes(p.id), toggle: () => favs.toggle(p.id) } : undefined} /></li>)}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="my-services" id="my-services">
            {!user ? (
              <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-10 text-center space-y-3">
                <Lock className="mx-auto text-slate-300" size={32} />
                <p className="font-black text-slate-600">{t('هذا القسم يتطلب تسجيل الدخول', 'This section needs you to sign in')}</p>
                <p className="text-sm font-bold text-slate-400">{t('ادخل عبر ثقة أو بالرقم الوظيفي والرقم المدني لعرض خدماتك وطلباتها.', 'Sign in with Thiqa or your employee and civil numbers to see your services and requests.')}</p>
                <Link href="/staff/login?next=/staff" className="inline-flex items-center gap-2 h-11 px-6 rounded-xl bg-secondary text-white font-black"><LogIn size={16} className={cn(isAr && '-scale-x-100')} />{t('تسجيل الدخول', 'Sign in')}</Link>
              </div>
            ) : visibleServices.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-10 text-center space-y-2">
                <Lock className="mx-auto text-slate-300" size={32} />
                <p className="font-black text-slate-600">{q ? t('لا توجد نتائج', 'No results') : t('لا توجد لديك صلاحيات على أي خدمة بعد', "You don't have permissions on any service yet")}</p>
                {!q && <p className="text-sm font-bold text-slate-400">{t('تواصل مع مدير النظام لإسناد دور لك في الخدمة.', 'Ask the system administrator to assign you a service role.')}</p>}
              </div>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visibleServices.map(({ service, roles, open, myStages }) => (
                  <li key={service.id}>
                    <Link href={`/staff/services/${service.id}`} className="group flex flex-col h-full rounded-3xl bg-white ring-1 ring-slate-100 shadow-sm p-5 space-y-4 hover:shadow-xl hover:ring-[#0f9e9b]/40 transition-all focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#03CFCB]">
                      <div className="flex items-start gap-3">
                        <span className="size-12 rounded-2xl bg-[#03CFCB]/10 text-[#008E91] flex items-center justify-center shrink-0"><ServiceIcon service={service} size={24} /></span>
                        <h3 className="font-black text-slate-800 leading-snug flex-1">{isAr ? service.title : service.titleEn || service.title}</h3>
                        {open > 0 && <Badge className="bg-amber-500 shrink-0" aria-label={t(`${open} طلبات مفتوحة`, `${open} open requests`)}>{open}</Badge>}
                      </div>
                      <RoleChips roles={roles} isAr={isAr} superAdmin={!!user.isSuperAdmin} />
                      <div className="mt-auto flex items-center justify-between text-xs font-bold text-slate-400">
                        <span className="flex items-center gap-1.5"><Inbox size={14} />{myStages ? t(`${myStages} مراحل مسندة لك`, `${myStages} stages assigned to you`) : t('صندوق الطلبات', 'Request inbox')}</span>
                        <ArrowUpRight size={16} className={cn('text-[#0f9e9b] transition-transform group-hover:translate-x-0.5', isAr && '-scale-x-100')} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="guides" id="guides">
            <ul className="grid gap-3 sm:grid-cols-2">
              {guides.map(p => <li key={p.id}><PlatformTile platform={p} isAr={isAr} row /></li>)}
            </ul>
          </TabsContent>
        </Tabs>
      </div>
    </StaffShell>
  );
}

function Widget({ title, icon: Icon, className, children }: { title?: string; icon?: React.ElementType; className?: string; children: React.ReactNode }) {
  return (
    <section className={cn('rounded-[2rem] bg-white ring-1 ring-slate-100 shadow-sm p-6', className)} aria-label={title}>
      {title && <h2 className="flex items-center gap-2 text-sm font-black text-slate-500 mb-4">{Icon && <Icon size={16} className="text-[#0f9e9b]" aria-hidden />}{title}</h2>}
      {children}
    </section>
  );
}

const greeting = (isAr: boolean) => {
  const h = new Date().getHours();
  return h < 12 ? (isAr ? 'صباح الخير' : 'Good morning') : h < 18 ? (isAr ? 'مساء الخير' : 'Good afternoon') : (isAr ? 'مساء النور' : 'Good evening');
};

/** Live time and the Gregorian and Hijri dates (rendered after mount to avoid a hydration mismatch) */
function Clock({ isAr }: { isAr: boolean }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { setNow(new Date()); const id = setInterval(() => setNow(new Date()), 30_000); return () => clearInterval(id); }, []);
  if (!now) return <div className="h-20 w-44" aria-hidden />;
  const loc = isAr ? 'ar-OM' : 'en-GB';
  return (
    <div className="text-end rounded-2xl bg-slate-50 px-5 py-3">
      <p className="text-3xl font-black text-slate-800 tabular-nums">{now.toLocaleTimeString(loc, { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Muscat' })}</p>
      <p className="text-xs font-bold text-slate-500">{now.toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Muscat' })}</p>
      <p className="text-xs font-bold text-[#0f9e9b]">{now.toLocaleDateString(isAr ? 'ar-SA-u-ca-islamic-umalqura' : 'en-GB-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Muscat' })}</p>
    </div>
  );
}

/** Pinned platforms, kept in this browser per employee */
function useFavourites(userId?: string) {
  const key = `dm-staff-favs:${userId || 'guest'}`;
  const [list, setList] = useState<string[]>([]);
  useEffect(() => { try { setList(JSON.parse(localStorage.getItem(key) || '[]')); } catch { setList([]); } }, [key]);
  const toggle = (id: string) => setList(l => {
    const next = l.includes(id) ? l.filter(x => x !== id) : [...l, id];
    try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* storage blocked */ }
    return next;
  });
  return { list, toggle };
}

const SectionTitle = ({ id, children }: { id: string; children: React.ReactNode }) => (
  <h2 id={id} className="text-2xl font-black text-secondary flex items-center gap-3"><span className="w-2 h-7 rounded bg-[#03CFCB]" aria-hidden />{children}</h2>
);

const Stat = ({ label, value, highlight, onClick }: { label: string; value: number; highlight?: boolean; onClick?: () => void }) => (
  <div className={cn('rounded-2xl text-center', highlight ? 'bg-amber-50 text-amber-800' : 'bg-slate-50 text-slate-700')}>
    <button type="button" onClick={onClick} className="w-full px-4 py-3 rounded-2xl hover:ring-1 hover:ring-[#0f9e9b]/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0f9e9b]">
      <dd className="text-3xl font-black">{value}</dd>
      <dt className="text-[11px] font-bold opacity-70">{label}</dt>
    </button>
  </div>
);

function RoleChips({ roles, isAr, superAdmin }: { roles: ServiceRole[]; isAr: boolean; superAdmin: boolean }) {
  if (superAdmin) return <p className="text-xs font-bold text-red-600 flex items-center gap-1"><ShieldCheck size={13} />{isAr ? 'صلاحية كاملة' : 'Full access'}</p>;
  const perms = Array.from(new Set(roles.flatMap(r => r.permissions)));
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">{roles.map(r => <Badge key={r.id} variant="outline" className="font-black border-[#0f9e9b]/40 text-[#005751]">{isAr ? r.nameAr : r.nameEn}</Badge>)}</div>
      <p className="text-[11px] font-bold text-slate-400">
        {perms.map(p => { const d = ALL_PERMISSIONS.find(x => x.id === p); return d ? (isAr ? d.labelAr : d.labelEn) : p; }).join(' · ')}
      </p>
    </div>
  );
}

function PlatformTile({ platform: p, isAr, row, compact, fav }: { platform: StaffPlatform; isAr: boolean; row?: boolean; compact?: boolean; fav?: { on: boolean; toggle: () => void } }) {
  const Icon = (p.icon && (Icons as any)[p.icon]) || Sparkles;
  const name = isAr ? p.nameAr : p.nameEn;
  // External logos can be blocked or moved; fall back to the icon instead of a broken image
  const [logoFailed, setLogoFailed] = React.useState(false);
  const logo = p.logoUrl && !logoFailed
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={p.logoUrl} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setLogoFailed(true)} className={cn('object-contain', row || compact ? 'size-10' : 'size-16')} />
    : <span className={cn('rounded-2xl bg-gradient-to-br from-[#03CFCB]/15 to-[#470D67]/10 text-[#005751] flex items-center justify-center', row || compact ? 'size-12' : 'size-16')}><Icon size={row || compact ? 22 : 30} aria-hidden /></span>;
  const inner = (
    <>
      <span className="relative">{logo}{p.isNew && <Badge className="absolute -top-2 -end-6 bg-[#0f9e9b] text-[9px] px-1.5">{isAr ? 'جديد' : 'New'}</Badge>}</span>
      <span className={cn('font-black text-slate-700 leading-snug', row ? 'text-sm' : compact ? 'text-[10px] text-center line-clamp-2' : 'text-xs text-center')}>{name}</span>
      {!p.url && <span className="text-[10px] font-bold text-slate-400">{isAr ? 'الرابط غير محدد بعد' : 'Link not set yet'}</span>}
    </>
  );
  const cls = cn('h-full rounded-2xl p-3 transition-all', row ? 'flex items-center gap-4 bg-white ring-1 ring-slate-100' : compact ? 'flex flex-col items-center gap-1.5 bg-slate-50' : 'flex flex-col items-center gap-2 bg-white ring-1 ring-slate-100 shadow-sm py-5', p.url ? 'hover:bg-slate-50 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#03CFCB]' : 'opacity-60');
  const tile = p.url
    ? <a href={p.url} target="_blank" rel="noopener noreferrer" className={cls}>{inner}<span className="sr-only">{isAr ? '(تفتح في نافذة جديدة)' : '(opens in a new tab)'}</span></a>
    : <div className={cls} aria-disabled>{inner}</div>;
  if (!fav) return tile;
  return (
    <div className="relative h-full">
      {tile}
      <button type="button" onClick={fav.toggle} aria-pressed={fav.on} aria-label={fav.on ? (isAr ? `إزالة ${name} من المفضلة` : `Unpin ${name}`) : (isAr ? `تثبيت ${name} في المفضلة` : `Pin ${name}`)}
        className={cn('absolute top-2 start-2 size-7 rounded-full flex items-center justify-center transition-colors', fav.on ? 'text-amber-500' : 'text-slate-300 hover:text-amber-400')}>
        <Star size={15} fill={fav.on ? 'currentColor' : 'none'} />
      </button>
    </div>
  );
}
