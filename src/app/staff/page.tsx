'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import * as Icons from 'lucide-react';
import { ArrowUpRight, Inbox, Loader2, Lock, LogIn, ShieldCheck, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useSettingsStore } from '@/lib/settings-store';
import { ALL_PERMISSIONS, getUserRoles, getUserStages } from '@/lib/rbac';
import { PLATFORM_CATEGORIES } from '@/lib/staff-platforms';
import { ServiceRole, StaffPlatform } from '@/lib/types';
import { StaffShell, useStaffPortal } from '@/components/staff/staff-shell';
import { ServiceIcon } from '@/components/service/service-icon';
import { cn } from '@/lib/utils';

export default function StaffPortalHome() {
  const { language } = useSettingsStore();
  const isAr = language === 'ar';
  const t = (ar: string, en: string) => (isAr ? ar : en);
  // Public page: platforms need no sign-in; only "my services" does
  const { data, user, loading } = useStaffPortal({ requireAuth: false });
  const [query, setQuery] = useState('');

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
  const platforms = (data?.platforms || []).filter(p => !q || `${p.nameAr} ${p.nameEn}`.toLowerCase().includes(q));
  const totalOpen = myServices.reduce((n, x) => n + x.open, 0);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" role="status" aria-label={t('جارٍ التحميل', 'Loading')}><Loader2 className="animate-spin text-[#0f9e9b]" size={36} /></div>;
  }

  return (
    <StaffShell user={user} search={query} onSearch={setQuery}>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-10">
        <h1 className="sr-only">{t('بوابة موظفي بلدية ظفار', 'Dhofar Municipality staff portal')}</h1>
        {/* Public platforms always come first on the page */}
        <section id="platforms" aria-labelledby="platforms-title" className="scroll-mt-24 space-y-6">
          <SectionTitle id="platforms-title">{t('منصات الموظفين', 'Staff platforms')}</SectionTitle>
          {PLATFORM_CATEGORIES.filter(c => c.id !== 'guides').map(cat => {
            const list = platforms.filter(p => p.category === cat.id);
            if (!list.length) return null;
            return (
              <div key={cat.id} className="rounded-[2rem] bg-white ring-1 ring-slate-100 shadow-sm p-6 space-y-5">
                <h3 className="flex items-center gap-2 font-black text-slate-700"><span className="w-1.5 h-5 rounded bg-red-500" aria-hidden />{isAr ? cat.labelAr : cat.labelEn}</h3>
                <ul className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {list.map(p => <li key={p.id}><PlatformTile platform={p} isAr={isAr} /></li>)}
                </ul>
              </div>
            );
          })}
        </section>

        {/* Welcome (signed in) or public intro */}
        {!user ? (
          <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#0f9e9b] to-[#005751] text-white p-8 flex flex-wrap items-center justify-between gap-6">
            <div aria-hidden className="absolute inset-0 dm-pattern-landmark opacity-10" />
            <div className="relative space-y-2 max-w-2xl">
              <h2 className="text-3xl font-black">{t('خدماتك حسب صلاحياتك', 'Your services by permission')}</h2>
              <p className="font-medium text-white/80">{t('المنصات العامة وعروض الموظفين والأدلة متاحة للجميع. سجّل الدخول لعرض الخدمات المسندة إليك حسب صلاحياتك.', 'Platforms, staff offers and guides are open to everyone. Sign in to see the services assigned to you.')}</p>
            </div>
            <Link href="/staff/login?next=/staff" className="relative inline-flex items-center gap-2 h-12 px-6 rounded-2xl bg-white text-[#005751] font-black shadow-lg focus-visible:outline focus-visible:outline-4 focus-visible:outline-white/60">
              <LogIn size={18} className={cn(isAr && '-scale-x-100')} />{t('تسجيل الدخول', 'Sign in')}
            </Link>
          </section>
        ) : (
        <section className="relative overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-100 p-8 flex flex-wrap items-center justify-between gap-6">
          <div aria-hidden className="absolute inset-0 dm-pattern-wave-pro opacity-20" />
          <div className="relative space-y-1">
            <p className="text-sm font-bold text-slate-400">{t('مرحباً', 'Welcome')}</p>
            <h2 className="text-3xl font-black text-secondary">{isAr ? user!.nameAr : user!.nameEn || user!.nameAr}</h2>
            <p className="text-sm font-bold text-slate-500">
              {t('الرقم الوظيفي', 'Employee no.')} <span className="font-mono">{user!.employeeNumber}</span>{user!.department && ` · ${user!.department}`}
              {user!.isSuperAdmin && <Badge className="ms-2 bg-red-500">{t('مدير نظام', 'Super admin')}</Badge>}
            </p>
          </div>
          <dl className="relative grid grid-cols-2 gap-3">
            <Stat label={t('خدماتي', 'My services')} value={myServices.length} />
            <Stat label={t('طلبات مفتوحة', 'Open requests')} value={totalOpen} highlight={totalOpen > 0} />
          </dl>
        </section>
        )}

        {/* My services by permission */}
        <section id="my-services" aria-labelledby="my-services-title" className="scroll-mt-24 space-y-4">
          <SectionTitle id="my-services-title">{t('خدماتي حسب الصلاحيات', 'My services by permission')}</SectionTitle>
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
                    <RoleChips roles={roles} isAr={isAr} superAdmin={!!user!.isSuperAdmin} />
                    <div className="mt-auto flex items-center justify-between text-xs font-bold text-slate-400">
                      <span className="flex items-center gap-1.5"><Inbox size={14} />{myStages ? t(`${myStages} مراحل مسندة لك`, `${myStages} stages assigned to you`) : t('صندوق الطلبات', 'Request inbox')}</span>
                      <ArrowUpRight size={16} className={cn('text-[#0f9e9b] transition-transform group-hover:translate-x-0.5', isAr && '-scale-x-100')} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section id="guides" aria-labelledby="guides-title" className="scroll-mt-24 space-y-4">
          <SectionTitle id="guides-title">{t('الأدلة والسياسات', 'Guides & policies')}</SectionTitle>
          <ul className="grid gap-3 sm:grid-cols-2">
            {platforms.filter(p => p.category === 'guides').map(p => <li key={p.id}><PlatformTile platform={p} isAr={isAr} row /></li>)}
          </ul>
        </section>
      </div>
    </StaffShell>
  );
}

const SectionTitle = ({ id, children }: { id: string; children: React.ReactNode }) => (
  <h2 id={id} className="text-2xl font-black text-secondary flex items-center gap-3"><span className="w-2 h-7 rounded bg-[#03CFCB]" aria-hidden />{children}</h2>
);

const Stat = ({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) => (
  <div className={cn('rounded-2xl px-5 py-3 text-center', highlight ? 'bg-amber-50 text-amber-800' : 'bg-slate-50 text-slate-700')}>
    <dd className="text-3xl font-black">{value}</dd>
    <dt className="text-[11px] font-bold opacity-70">{label}</dt>
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

function PlatformTile({ platform: p, isAr, row }: { platform: StaffPlatform; isAr: boolean; row?: boolean }) {
  const Icon = (p.icon && (Icons as any)[p.icon]) || Sparkles;
  const name = isAr ? p.nameAr : p.nameEn;
  // External logos can be blocked or moved; fall back to the icon instead of a broken image
  const [logoFailed, setLogoFailed] = React.useState(false);
  const logo = p.logoUrl && !logoFailed
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={p.logoUrl} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setLogoFailed(true)} className={cn('object-contain', row ? 'size-10' : 'size-16')} />
    : <span className={cn('rounded-2xl bg-gradient-to-br from-[#03CFCB]/15 to-[#470D67]/10 text-[#005751] flex items-center justify-center', row ? 'size-12' : 'size-16')}><Icon size={row ? 22 : 30} aria-hidden /></span>;
  const inner = (
    <>
      <span className="relative">{logo}{p.isNew && <Badge className="absolute -top-2 -end-6 bg-[#0f9e9b] text-[9px] px-1.5">{isAr ? 'جديد' : 'New'}</Badge>}</span>
      <span className={cn('font-black text-slate-700 leading-snug', row ? 'text-sm' : 'text-xs text-center')}>{name}</span>
      {!p.url && <span className="text-[10px] font-bold text-slate-400">{isAr ? 'الرابط غير محدد بعد' : 'Link not set yet'}</span>}
    </>
  );
  const cls = cn('h-full rounded-2xl p-3 transition-all', row ? 'flex items-center gap-4 bg-white ring-1 ring-slate-100' : 'flex flex-col items-center gap-2', p.url ? 'hover:bg-slate-50 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#03CFCB]' : 'opacity-60');
  return p.url
    ? <a href={p.url} target="_blank" rel="noopener noreferrer" className={cls}>{inner}<span className="sr-only">{isAr ? '(تفتح في نافذة جديدة)' : '(opens in a new tab)'}</span></a>
    : <div className={cls} aria-disabled>{inner}</div>;
}
