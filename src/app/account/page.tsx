'use client';

/*
 * The beneficiary's account after sign-in: my requests, municipal dues, deposits, issued
 * documents, notifications and profile, for the capacity (الصفة) they are acting in.
 * Requests are the applications stored by the portal; the finance and notification sections
 * show sample data until those systems are linked (see src/lib/citizen-account.ts).
 */

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, Bell, Check, ChevronLeft, Clock, CreditCard, FileText, Fingerprint, Globe, Info, Loader2, LogOut, Mail, MessageSquare, RotateCcw, ShieldCheck, UserRound, Wallet } from 'lucide-react';
import { fetchBin } from '@/lib/jsonbin';
import { MenuItem, ServiceApplication, SiteConfig } from '@/lib/types';
import { useSettingsStore } from '@/lib/settings-store';
import { useCitizenSession } from '@/lib/citizen-session';
import { CAPACITY_KIND, DUE_GROUPS, Due, IssuedDocument, REQUEST_STEPS, STATUS_INFO, capacityName, omr, sampleDeposits, sampleDocuments, sampleDues, sampleNotices, statusOf } from '@/lib/citizen-account';
import { CapacityOption, useCapacity } from '@/components/citizen/capacity';
import { PermitCard } from '@/components/citizen/permit-card';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { cn } from '@/lib/utils';

type Tab = 'requests' | 'dues' | 'deposits' | 'documents' | 'notifications' | 'profile';
const TABS: { id: Tab; ar: string; en: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: 'requests', ar: 'طلباتي', en: 'My requests', icon: FileText },
  { id: 'dues', ar: 'سداد المستحقات البلدية', en: 'Municipal dues', icon: CreditCard },
  { id: 'deposits', ar: 'مبالغ التأمين', en: 'Deposits', icon: RotateCcw },
  { id: 'documents', ar: 'الوثائق الصادرة', en: 'Issued documents', icon: ShieldCheck },
  { id: 'notifications', ar: 'الإشعارات', en: 'Notifications', icon: Bell },
  { id: 'profile', ar: 'الملف الشخصي', en: 'Profile', icon: UserRound },
];
const TONE = { info: 'bg-sky-100 text-sky-800', warn: 'bg-amber-100 text-amber-900', ok: 'bg-emerald-100 text-emerald-800', bad: 'bg-red-100 text-red-800' } as const;

const Sample = ({ isAr }: { isAr: boolean }) => (
  <p className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900 ring-1 ring-amber-200">
    <Info size={14} className="shrink-0" aria-hidden />{isAr ? 'بيانات نموذجية للعرض في المرحلة التجريبية؛ ستُستبدل ببياناتك الفعلية عند ربط الأنظمة.' : 'Sample data for the trial phase; it will be replaced by your real records once the systems are linked.'}
  </p>
);

export default function AccountPage() {
  return <Suspense fallback={null}><Account /></Suspense>;
}

function Account() {
  const router = useRouter();
  const asked = useSearchParams().get('tab') as Tab | null;
  const tab: Tab = asked && TABS.some(x => x.id === asked) ? asked : 'requests';
  const { language, setLanguage } = useSettingsStore();
  const isAr = language === 'ar';
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const { identity, capacities, current } = useCapacity();
  const [mounted, setMounted] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [apps, setApps] = useState<ServiceApplication[] | null>(null);
  const [read, setRead] = useState<Set<string>>(new Set());

  useEffect(() => {
    setMounted(true);
    fetchBin().then(db => { setMenuItems(db.menuItems || []); setSiteConfig(db.siteConfig || null); setApps(db.applications || []); }).catch(() => setApps([]));
  }, []);
  useEffect(() => { document.title = `${t('حسابي', 'My account')} | ${t('بلدية ظفار', 'Dhofar Municipality')}`; }, [isAr]); // eslint-disable-line react-hooks/exhaustive-deps
  const open = (id: Tab) => router.replace(`/account?tab=${id}`, { scroll: false });

  // Requests filed by this person in the current capacity (older requests carry no capacity: they belong to the person)
  const mine = useMemo(() => (apps || []).filter(a => a.applicantPhone === identity && ((a as ServiceApplication & { capacityId?: string }).capacityId || 'person') === (current?.id || 'person')), [apps, identity, current]);
  const kind = current?.kind || 'person';
  const notices = useMemo(() => sampleNotices(kind).map(n => ({ ...n, unread: n.unread && !read.has(n.id) })), [kind, read]);
  const needsYou = mine.filter(a => STATUS_INFO[statusOf(a.status)].needsYou).length;
  const badge: Partial<Record<Tab, number>> = { requests: needsYou, notifications: notices.filter(n => n.unread).length };
  const holder = current ? capacityName(current, isAr) : '';

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen flex flex-col bg-slate-50" dir={isAr ? 'rtl' : 'ltr'} lang={isAr ? 'ar' : 'en'}>
      <PortalHeader menuItems={menuItems} variant="compact" />
      <main id="main" className="flex-1">{children}</main>
      <PortalFooter siteConfig={siteConfig} />
    </div>
  );

  if (!mounted) return <div className="h-screen flex items-center justify-center" role="status"><Loader2 className="animate-spin text-slate-400" /></div>;
  if (!identity) return shell(
    <div className="mx-auto max-w-md px-4 py-20 text-center space-y-4">
      <Fingerprint size={44} className="mx-auto text-[#008E91]" aria-hidden />
      <h1 className="text-2xl font-black text-slate-900">{t('سجّل الدخول لعرض حسابك', 'Sign in to see your account')}</h1>
      <p className="font-bold text-slate-500">{t('طلباتك ومستحقاتك ووثائقك في مكان واحد.', 'Your requests, dues and documents in one place.')}</p>
      <button type="button" onClick={() => useCitizenSession.getState().openPrompt('/account')} className="h-12 px-6 rounded-xl bg-[#005751] text-white font-black">{t('تسجيل الدخول عبر ثقة', 'Sign in with Thiqa')}</button>
    </div>,
  );

  return shell(
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-8 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
      {/* Who you are acting as, and the sections */}
      <aside className="min-w-0 space-y-4">
        <div className="border-b pb-4">
          <p className="text-xs font-bold text-slate-500">{t('بصفة', 'Acting as')}</p>
          <p className="text-lg font-black leading-snug text-slate-900">{holder || t('اختر الصفة', 'Choose a capacity')}</p>
          {capacities.length > 1 && <button type="button" onClick={() => open('profile')} className="mt-1 text-sm font-bold text-[#005751] underline underline-offset-4">{t('تبديل الصفة', 'Switch capacity')}</button>}
        </div>
        <nav aria-label={t('أقسام الحساب', 'Account sections')}>
          <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TABS.map(x => (
              <li key={x.id} className="shrink-0">
                <button type="button" onClick={() => open(x.id)} aria-current={tab === x.id ? 'page' : undefined}
                  className={cn('w-full flex items-center gap-3 rounded-xl px-4 h-12 text-start font-bold whitespace-nowrap transition-colors', tab === x.id ? 'bg-[#03CFCB]/15 text-[#005751] font-black' : 'text-slate-700 hover:bg-white')}>
                  <x.icon size={19} className="shrink-0" /><span className="flex-1">{isAr ? x.ar : x.en}</span>
                  {!!badge[x.id] && <span className="size-6 rounded-full bg-[#470D67] text-white text-xs font-black flex items-center justify-center">{badge[x.id]}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <section aria-labelledby="account-title" className="min-w-0 space-y-5">
        <h1 id="account-title" className="text-3xl font-black text-slate-900">{isAr ? TABS.find(x => x.id === tab)!.ar : TABS.find(x => x.id === tab)!.en}</h1>
        {tab === 'requests' && <Requests apps={apps} mine={mine} isAr={isAr} holder={holder} />}
        {tab === 'dues' && <Dues dues={sampleDues(kind)} isAr={isAr} holder={holder} refNo={current?.ref || ''} />}
        {tab === 'deposits' && <Deposits isAr={isAr} kind={kind} />}
        {tab === 'documents' && <Documents isAr={isAr} holder={holder} docs={[...approvedDocs(mine, isAr), ...sampleDocuments(kind)]} />}
        {tab === 'notifications' && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-bold text-slate-500">{t('نسخ من الرسائل النصية والبريد الإلكتروني المرسلة إليك.', 'Copies of the text messages and emails sent to you.')}</p>
              <button type="button" onClick={() => setRead(new Set(notices.map(n => n.id)))} className="h-10 px-4 rounded-xl bg-white ring-1 ring-slate-200 text-sm font-black hover:ring-[#008E91]">{t('تعليم الكل كمقروء', 'Mark all as read')}</button>
            </div>
            <Sample isAr={isAr} />
            <ul className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 divide-y">
              {notices.map(n => (
                <li key={n.id} className={cn('flex gap-3 p-4', n.unread && 'bg-[#03CFCB]/5')}>
                  {n.channel === 'sms' ? <MessageSquare size={19} className="mt-0.5 shrink-0 text-slate-500" aria-hidden /> : <Mail size={19} className="mt-0.5 shrink-0 text-slate-500" aria-hidden />}
                  <div className="min-w-0 flex-1"><p className="font-bold text-slate-900">{isAr ? n.ar : n.en}</p><p className="text-xs font-bold text-slate-500">{n.channel === 'sms' ? t('رسالة نصية', 'Text message') : t('البريد الإلكتروني', 'Email')} — {isAr ? n.dateAr : n.dateEn}</p></div>
                  {n.unread && <span className="h-6 shrink-0 rounded-full bg-[#470D67]/10 px-2.5 text-xs font-black leading-6 text-[#470D67]">{t('جديد', 'New')}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
        {tab === 'profile' && (
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 space-y-4">
              <h2 className="text-xl font-black text-slate-900">{t('البيانات الشخصية', 'Personal details')}</h2>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4"><dt className="font-bold text-slate-500">{t('الاسم', 'Name')}</dt><dd className="font-black text-slate-900">{capacities[0] ? capacityName(capacities[0], isAr) : ''}</dd></div>
                <div className="flex justify-between gap-4"><dt className="font-bold text-slate-500">{t('الرقم المدني', 'Civil number')}</dt><dd className="font-black text-slate-900" dir="ltr">{capacities[0]?.ref}</dd></div>
              </dl>
              <p className="text-xs font-bold text-slate-500">{t('مسترجعة من ثقة ومن النظام، تواصل مع البلدية لتصحيحها.', 'Retrieved from Thiqa and the registry; contact the municipality to correct them.')}</p>
              <div className="flex flex-wrap gap-2 border-t pt-4">
                <button type="button" onClick={() => setLanguage(isAr ? 'en' : 'ar')} lang={isAr ? 'en' : 'ar'} className="h-11 px-4 rounded-xl bg-white ring-1 ring-slate-200 font-black text-[#005751] flex items-center gap-2 hover:ring-[#008E91]"><Globe size={17} aria-hidden />{isAr ? 'English' : 'العربية'}</button>
                <button type="button" onClick={() => useCitizenSession.getState().signOut()} className="h-11 px-4 rounded-xl bg-white ring-1 ring-slate-200 font-black text-slate-800 flex items-center gap-2 hover:ring-red-300"><LogOut size={17} className={cn(isAr && '-scale-x-100')} aria-hidden />{t('تسجيل الخروج', 'Sign out')}</button>
              </div>
            </div>
            <div className="rounded-2xl bg-white p-6 ring-1 ring-slate-200 space-y-3">
              <h2 className="text-xl font-black text-slate-900">{t('الصفات التي تتعامل بها', 'Capacities you act in')}</h2>
              {capacities.map(c => <CapacityOption key={c.id} c={c} isAr={isAr} active={current?.id === c.id} onPick={() => useCitizenSession.getState().setCapacity(c.id)} />)}
              {capacities.length > 1 && <Sample isAr={isAr} />}
            </div>
          </div>
        )}
      </section>
    </div>,
  );
}

/** Approved requests are the person's real issued documents */
function approvedDocs(mine: ServiceApplication[], isAr: boolean): IssuedDocument[] {
  return mine.filter(a => a.status === 'approved').map(a => ({ id: a.id, ar: a.serviceName, en: a.serviceName, categoryAr: 'خدمات البلدية', categoryEn: 'Municipal services', icon: 'file' as const, issued: (a.history?.[a.history.length - 1]?.at || a.createdAt).slice(0, 10), tone: 'teal' as const }));
}

function Requests({ apps, mine, isAr, holder }: { apps: ServiceApplication[] | null; mine: ServiceApplication[]; isAr: boolean; holder: string }) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const [filter, setFilter] = useState<'all' | 'you' | 'open' | 'closed'>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const info = (a: ServiceApplication) => STATUS_INFO[statusOf(a.status)];
  const groups = { all: mine, you: mine.filter(a => info(a).needsYou), open: mine.filter(a => !info(a).closed && !info(a).needsYou), closed: mine.filter(a => info(a).closed) };
  const date = (iso: string) => new Date(iso).toLocaleDateString(isAr ? 'ar-OM' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  if (!apps) return <p role="status" className="flex items-center gap-2 py-10 font-bold text-slate-500"><Loader2 className="animate-spin" aria-hidden />{t('جارٍ جلب طلباتك…', 'Loading your requests…')}</p>;
  if (!mine.length) return (
    <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-slate-200 space-y-3">
      <FileText size={36} className="mx-auto text-slate-300" aria-hidden />
      <p className="text-lg font-black text-slate-900">{t('لا توجد طلبات بهذه الصفة بعد', 'No requests in this capacity yet')}</p>
      <p className="font-bold text-slate-500">{t('ستظهر طلباتك هنا بعد تقديمها.', 'Your requests will appear here once you apply.')}</p>
      <Link href="/catalog" className="inline-flex h-11 items-center rounded-xl bg-[#005751] px-5 font-black text-white">{t('تصفح دليل الخدمات', 'Browse the services')}</Link>
    </div>
  );
  return (
    <div className="space-y-5">
      {groups.you.length > 0 && (
        <div className="rounded-2xl bg-amber-50 p-5 ring-1 ring-amber-200 space-y-3">
          <h2 className="font-black text-slate-900">{t('بحاجة لإجراء منك', 'Needs your action')}</h2>
          {groups.you.map(a => (
            <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-amber-200/70 pt-3 first:border-0 first:pt-0">
              <div><p className="font-black text-slate-900">{a.serviceName}</p><p className="text-sm font-bold text-slate-600"><span dir="ltr">{a.id}</span> — {a.history?.[a.history.length - 1]?.note || t('أعيد الطلب لاستكمال البيانات.', 'Returned for more information.')}</p></div>
              <Link href={`/track?ref=${encodeURIComponent(a.id)}`} className="h-10 px-4 rounded-xl bg-[#470D67] text-white font-black flex items-center">{t('استكمل الآن', 'Complete now')}</Link>
            </div>
          ))}
        </div>
      )}
      <div role="tablist" aria-label={t('تصفية الطلبات', 'Filter requests')} className="flex gap-1 overflow-x-auto border-b">
        {([['all', t('الكل', 'All')], ['you', t('بحاجة لإجراء منك', 'Needs you')], ['open', t('قيد الإجراء', 'In progress')], ['closed', t('مغلقة', 'Closed')]] as const).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={filter === id} onClick={() => setFilter(id)}
            className={cn('-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-4 h-11 font-black', filter === id ? 'border-[#470D67] text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800')}>
            {label}<span className="size-6 rounded-full bg-slate-100 text-xs flex items-center justify-center">{groups[id].length}</span>
          </button>
        ))}
      </div>
      <ul className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 divide-y">
        {groups[filter].map(a => {
          const s = info(a), expanded = openId === a.id;
          return (
            <li key={a.id}>
              <button type="button" onClick={() => setOpenId(expanded ? null : a.id)} aria-expanded={expanded} className="w-full grid grid-cols-[1fr_auto] sm:grid-cols-[9rem_1fr_9rem_auto_auto] items-center gap-3 p-4 text-start hover:bg-slate-50">
                <span className="hidden sm:block text-sm font-bold text-slate-500" dir="ltr">{a.id}</span>
                <span className="min-w-0"><span className="block font-black text-slate-900">{a.serviceName}</span><span className="block text-xs font-bold text-slate-500">{holder}<span className="sm:hidden" dir="ltr"> · {a.id}</span></span></span>
                <span className="hidden sm:block text-sm font-bold text-slate-600">{date(a.createdAt)}</span>
                <span className={cn('rounded-full px-3 py-1 text-xs font-black whitespace-nowrap', TONE[s.tone])}>{isAr ? s.ar : s.en}</span>
                <ChevronLeft size={18} className={cn('hidden sm:block text-slate-400 transition-transform', expanded ? '-rotate-90' : !isAr && 'rotate-180')} aria-hidden />
              </button>
              {expanded && (
                <div className="space-y-4 bg-slate-50 p-4 sm:p-6">
                  <ol className="grid grid-cols-5 gap-1 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                    {REQUEST_STEPS.map((st, i) => {
                      const done = a.status === 'approved' || i < s.step, here = a.status !== 'approved' && i === s.step;
                      return (
                        <li key={st[1]} aria-current={here ? 'step' : undefined} className="flex flex-col items-center gap-1.5 text-center">
                          <span className={cn('size-7 rounded-full flex items-center justify-center ring-2', done ? 'bg-[#005751] text-white ring-[#005751]' : here ? 'bg-white ring-[#470D67]' : 'bg-white ring-slate-300')}>{done && <Check size={14} aria-hidden />}</span>
                          <span className={cn('text-[11px] sm:text-xs font-bold', here ? 'font-black text-slate-900' : 'text-slate-500')}>{isAr ? st[0] : st[1]}</span>
                        </li>
                      );
                    })}
                  </ol>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className={cn('rounded-2xl p-4', TONE[s.tone])}>
                      <p className="flex items-center gap-2 font-black">{s.tone === 'warn' ? <AlertTriangle size={17} aria-hidden /> : <Clock size={17} aria-hidden />}{isAr ? s.ar : s.en}</p>
                      <p className="mt-1 text-sm font-bold">{t('سنشعرك برسالة نصية وبريد إلكتروني عند أي تغيير.', 'We will text and email you when anything changes.')}</p>
                    </div>
                    <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                      <h3 className="font-black text-slate-900">{t('السجل', 'History')}</h3>
                      <ul className="mt-2 space-y-2 text-sm">
                        {[...(a.history || [])].reverse().map((h, i) => <li key={i} className="font-bold text-slate-700">{h.note || h.action}<span className="block text-xs text-slate-500">{date(h.at)}</span></li>)}
                        <li className="font-bold text-slate-700">{t('تم تقديم الطلب', 'Request submitted')}<span className="block text-xs text-slate-500">{date(a.createdAt)} — {t('أنت', 'You')}</span></li>
                      </ul>
                    </div>
                  </div>
                  <Link href={`/track?ref=${encodeURIComponent(a.id)}`} className="inline-flex h-10 items-center rounded-xl bg-white px-4 text-sm font-black text-[#005751] ring-1 ring-slate-200 hover:ring-[#008E91]">{t('فتح صفحة متابعة الطلب', 'Open the tracking page')}</Link>
                </div>
              )}
            </li>
          );
        })}
        {!groups[filter].length && <li className="p-8 text-center font-bold text-slate-400">{t('لا توجد طلبات في هذا التصنيف', 'No requests in this group')}</li>}
      </ul>
    </div>
  );
}

function Dues({ dues, isAr, holder, refNo }: { dues: Due[]; isAr: boolean; holder: string; refNo: string }) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [told, setTold] = useState(false);
  const total = dues.reduce((s, d) => s + d.amount, 0);
  const chosen = dues.filter(d => picked.has(d.id)), sum = chosen.reduce((s, d) => s + d.amount, 0);
  const toggle = (id: string) => { setTold(false); setPicked(p => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; }); };
  const all = dues.length > 0 && picked.size === dues.length;
  return (
    <div className="space-y-4">
      <p className="font-bold text-slate-500">{t(`المبالغ المستحقة في سجلات ${holder} (${refNo}).`, `Amounts due on record for ${holder} (${refNo}).`)}</p>
      <Sample isAr={isAr} />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          {(Object.keys(DUE_GROUPS) as Due['group'][]).filter(g => dues.some(d => d.group === g)).map(g => (
            <fieldset key={g} className="space-y-2">
              <legend className="mb-2 text-lg font-black text-slate-900">{isAr ? DUE_GROUPS[g][0] : DUE_GROUPS[g][1]}</legend>
              {dues.filter(d => d.group === g).map(d => (
                <label key={d.id} className={cn('flex cursor-pointer items-center gap-3 rounded-2xl border-2 bg-white p-4', picked.has(d.id) ? 'border-[#008E91] bg-[#03CFCB]/5' : 'border-slate-200 hover:border-slate-300')}>
                  <input type="checkbox" checked={picked.has(d.id)} onChange={() => toggle(d.id)} className="size-5 accent-[#005751]" />
                  <span className="min-w-0 flex-1"><span className="block font-black text-slate-900">{isAr ? d.ar : d.en}</span><span className="block text-xs font-bold text-slate-500"><span dir="ltr">{d.id}</span> — {t('الاستحقاق', 'Due')} {isAr ? d.dueAr : d.dueEn}</span></span>
                  <span className="shrink-0 font-black tabular-nums text-slate-900">{omr(d.amount, isAr)}</span>
                </label>
              ))}
            </fieldset>
          ))}
          {!dues.length && <p className="rounded-2xl bg-white p-8 text-center font-bold text-slate-500 ring-1 ring-slate-200">{t('لا مستحقات عليك.', 'Nothing is due.')}</p>}
        </div>
        <div className="h-fit rounded-2xl bg-white p-5 ring-1 ring-slate-200 space-y-3">
          <p className="text-sm font-bold text-slate-500">{t('المبلغ المختار للسداد', 'Selected to pay')}</p>
          <p className="text-3xl font-black tabular-nums text-slate-900" aria-live="polite">{omr(sum, isAr)}</p>
          <p className="text-sm font-bold text-slate-500">{t(`${chosen.length} من ${dues.length} بنود · إجمالي المستحق ${omr(total, true)}`, `${chosen.length} of ${dues.length} items · total due ${omr(total, false)}`)}</p>
          {dues.length > 1 && (
            <label className="flex cursor-pointer items-center gap-2 text-sm font-black text-slate-800">
              <input type="checkbox" checked={all} onChange={() => { setTold(false); setPicked(all ? new Set() : new Set(dues.map(d => d.id))); }} className="size-4 accent-[#005751]" />{t('اختيار الكل', 'Select all')}
            </label>
          )}
          <p className="text-sm font-bold text-slate-500">{t('اختر بنداً أو أكثر، وادفع بالبطاقة عبر بوابة الدفع أو من محفظتك الإلكترونية.', 'Choose one or more items, and pay by card through the payment gateway or from your wallet.')}</p>
          <button type="button" disabled={!chosen.length} onClick={() => setTold(true)} className="w-full h-12 rounded-xl bg-[#470D67] font-black text-white disabled:opacity-40">{chosen.length ? t(`سداد ${omr(sum, true)}`, `Pay ${omr(sum, false)}`) : t('المتابعة إلى السداد', 'Continue to payment')}</button>
          {told && <p role="status" className="text-xs font-bold text-amber-800">{t('بوابة الدفع غير مربوطة في المرحلة التجريبية، ولم يُخصم أي مبلغ.', 'The payment gateway is not connected in the trial phase; nothing was charged.')}</p>}
          <p className="flex items-center justify-between border-t pt-3 text-sm font-bold text-slate-600"><span className="flex items-center gap-2"><Wallet size={16} aria-hidden />{t('رصيد المحفظة الإلكترونية', 'Wallet balance')}</span><span className="font-black tabular-nums text-slate-900">{omr(85, isAr)}</span></p>
        </div>
      </div>
    </div>
  );
}

function Deposits({ isAr, kind }: { isAr: boolean; kind: Parameters<typeof sampleDeposits>[0] }) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const list = sampleDeposits(kind);
  const [asked, setAsked] = useState<string | null>(null);
  return (
    <div className="space-y-4">
      <p className="font-bold text-slate-500">{t('مبالغ التأمين المحتجزة لدى البلدية. يتاح الاسترداد بعد صدور شهادة الإنجاز.', 'Deposits held by the municipality. A refund can be requested once the completion certificate is issued.')}</p>
      {list.length ? <Sample isAr={isAr} /> : null}
      {list.map(d => (
        <div key={d.id} className="flex flex-wrap items-center gap-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200">
          <span className="size-12 shrink-0 rounded-xl bg-[#03CFCB]/15 text-[#005751] flex items-center justify-center"><RotateCcw size={20} aria-hidden /></span>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="font-black text-slate-900">{isAr ? d.ar : d.en}</p>
            <p className="text-xs font-bold text-slate-500">{t('التصريح', 'Permit')} <span dir="ltr">{d.permit}</span></p>
            <p className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black', d.certificate ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700')}>
              {d.certificate ? <Check size={13} aria-hidden /> : <Clock size={13} aria-hidden />}{d.certificate ? t(`صدرت شهادة الإنجاز ${d.certificate}`, `Completion certificate ${d.certificate} issued`) : t('محتجز حتى صدور شهادة الإنجاز', 'Held until the completion certificate is issued')}
            </p>
          </div>
          <p className="text-xl font-black tabular-nums text-slate-900">{omr(d.amount, isAr)}</p>
          {d.certificate && (asked === d.id
            ? <p role="status" className="basis-full text-xs font-bold text-amber-800">{t('طلب الاسترداد غير مفعّل في المرحلة التجريبية.', 'Refund requests are not active in the trial phase.')}</p>
            : <button type="button" onClick={() => setAsked(d.id)} className="h-11 px-5 rounded-xl bg-[#470D67] font-black text-white">{t('طلب الاسترداد', 'Request refund')}</button>)}
        </div>
      ))}
      {!list.length && <p className="rounded-2xl bg-white p-8 text-center font-bold text-slate-500 ring-1 ring-slate-200">{t('لا مبالغ تأمين محتجزة بهذه الصفة.', 'No deposits are held for this capacity.')}</p>}
    </div>
  );
}

function Documents({ docs, holder, isAr }: { docs: IssuedDocument[]; holder: string; isAr: boolean }) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-black tracking-widest text-[#005751]">{t('المحفظة', 'WALLET')}</p>
        <p className="text-xl font-black text-[#470D67]">{t('تصاريحك وتراخيصك وشهاداتك', 'Your permits, licences and certificates')}</p>
        <p className="font-bold text-slate-500">{t('موقّعة رقمياً. أظهر رمز الاستجابة السريعة للمفتش أو امسحه للتحقق.', 'Digitally signed. Show the QR code to an inspector or scan it to verify.')}</p>
      </div>
      <Sample isAr={isAr} />
      {docs.length
        ? <div className="grid gap-6 md:grid-cols-2">{docs.map(d => <PermitCard key={d.id} doc={d} holder={holder} isAr={isAr} />)}</div>
        : <p className="rounded-2xl bg-white p-8 text-center font-bold text-slate-500 ring-1 ring-slate-200">{t('لا وثائق صادرة بهذه الصفة بعد.', 'No documents issued for this capacity yet.')}</p>}
    </div>
  );
}
