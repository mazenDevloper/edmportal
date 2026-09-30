'use client';

/*
 * Service guide: the first page a beneficiary sees for a service. It gathers the required
 * documents, conditions, fees and estimated duration before they start (Thiqa sign-in first).
 */

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowUpRight, BadgeCent, Bot, CheckCircle2, ChevronLeft, Clock, ExternalLink, FileText, Fingerprint,
  Info, ListChecks, Loader2, Printer, Route, ScrollText, Search, ShieldCheck,
} from 'lucide-react';
import { fetchBin } from '@/lib/jsonbin';
import { MenuItem, Service, ServiceFlow, SiteConfig } from '@/lib/types';
import { useSettingsStore } from '@/lib/settings-store';
import { useAdminSession } from '@/lib/admin-session';
import { isPublicService, servicePrefixes } from '@/lib/service-visibility';
import { buildServiceGuide } from '@/lib/service-guide';
import { LINKED_INFO } from '@/lib/linked-data';
import { citizenLabel, requireCitizen, useCitizen } from '@/lib/citizen-session';
import { useAssistant } from '@/components/citizen/assistant-store';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { ServiceIcon } from '@/components/service/service-icon';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function ServiceGuidePage() {
  const id = useParams()?.id as string;
  const router = useRouter();
  const isAr = useSettingsStore(s => s.language) === 'ar';
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const citizen = useCitizen();
  const ask = useAssistant(s => s.ask);

  const [loading, setLoading] = useState(true);
  const [service, setService] = useState<Service | null>(null);
  const [flow, setFlow] = useState<ServiceFlow | null>(null);
  const [prefix, setPrefix] = useState('');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [mounted, setMounted] = useState(false);
  const [moreText, setMoreText] = useState(false);
  const [tab, setTab] = useState<string>('documents');
  // #documents, #conditions … open that tab
  useEffect(() => {
    const fromHash = () => { const h = window.location.hash.slice(1); if (['documents', 'conditions', 'how', 'after'].includes(h)) setTab(h); };
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  }, []);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    fetchBin().then(db => {
      const all: Service[] = db.services || [];
      const svc = all.find(s => s.id === id) || null;
      // Hidden services: not found for the public, previewable by a signed-in admin
      const visible = svc && (isPublicService(svc) || useAdminSession.getState().expiresAt > Date.now()) ? svc : null;
      setService(visible);
      setFlow((db.serviceFlows || []).find((f: ServiceFlow) => f.serviceId === id || f.id === id) || null);
      setPrefix(visible ? servicePrefixes(all).get(visible.id) || '' : '');
      setMenuItems(db.menuItems || []);
      setSiteConfig(db.siteConfig || null);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const guide = useMemo(() => (service ? buildServiceGuide(service, flow, isAr) : null), [service, flow, isAr]);
  useEffect(() => { if (guide) document.title = `${guide.title} | ${t('دليل الخدمة', 'Service guide')}`; }, [guide]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = () => {
    if (!service) return;
    if (guide?.isExternal) { window.open(service.linkUrl, '_blank', 'noopener,noreferrer'); return; }
    requireCitizen(`/services/${service.id}/apply`, p => router.push(p));
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-white" role="status" aria-label={t('جارٍ التحميل', 'Loading')}><Loader2 className="animate-spin text-primary" size={40} /></div>;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50" dir={isAr ? 'rtl' : 'ltr'} lang={isAr ? 'ar' : 'en'}>
      <PortalHeader menuItems={menuItems} variant="compact" />

      {!service || !guide ? (
        <main id="main" className="flex-1 flex items-center justify-center p-6 text-center">
          <div className="space-y-4">
            <Search size={40} className="mx-auto text-slate-300" aria-hidden />
            <h1 className="text-2xl font-black text-slate-900">{t('الخدمة غير متاحة حالياً', 'This service is not available right now')}</h1>
            <Button asChild className="rounded-xl font-black"><Link href="/catalog">{t('تصفح دليل الخدمات', 'Browse the service catalogue')}</Link></Button>
          </div>
        </main>
      ) : (
        <main id="main" className="flex-1">
          <section className="relative overflow-hidden bg-gradient-to-br from-[#005751] to-[#003b37] text-white">
            <div aria-hidden className="absolute inset-0 dm-pattern-landmark opacity-10" />
            <div className="relative max-w-6xl mx-auto px-4 md:px-6 py-4 md:py-5 space-y-3">
              <nav aria-label={t('مسار التنقل', 'Breadcrumb')} className="text-xs font-bold text-white/70 print:hidden">
                <ol className="flex flex-wrap items-center gap-1">
                  <li><Link href="/" className="hover:text-white">{t('الرئيسية', 'Home')}</Link></li>
                  <li aria-hidden><ChevronLeft size={12} className={cn(!isAr && 'rotate-180')} /></li>
                  <li><Link href="/catalog" className="hover:text-white">{t('دليل الخدمات', 'Services')}</Link></li>
                  <li aria-hidden><ChevronLeft size={12} className={cn(!isAr && 'rotate-180')} /></li>
                  <li aria-current="page" className="text-white truncate max-w-[16rem]">{guide.title}</li>
                </ol>
              </nav>
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <span className="size-12 shrink-0 rounded-xl bg-white text-[#005751] flex items-center justify-center shadow-lg"><ServiceIcon service={service} size={26} /></span>
                  <div className="min-w-0 space-y-1">
                    <p className="text-[11px] font-black tracking-widest uppercase text-[#03CFCB]">{t('دليل الخدمة', 'Service guide')}{service.category ? ` · ${service.category}` : ''}</p>
                    <h1 className="text-xl md:text-3xl font-black leading-tight">{guide.title}</h1>
                    {guide.description && (
                      <p className={cn('max-w-3xl text-sm font-medium text-white/80 leading-relaxed', !moreText && 'line-clamp-1')}>
                        {guide.description}
                      </p>
                    )}
                    {guide.description && guide.description.length > 90 && (
                      <button type="button" onClick={() => setMoreText(v => !v)} aria-expanded={moreText} className="text-xs font-black text-[#03CFCB] hover:underline print:hidden">
                        {moreText ? t('عرض أقل', 'Show less') : t('عرض الوصف كاملاً', 'Show full description')}
                      </button>
                    )}
                    {!isPublicService(service) && <p className="inline-block px-2 py-0.5 rounded-md bg-amber-400 text-slate-900 text-[11px] font-black">{t('معاينة المشرف: الخدمة مخفية عن العامة', 'Admin preview: this service is hidden from the public')}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 print:hidden">
                  <button type="button" onClick={start} className="flex-1 lg:flex-none justify-center inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-[#03CFCB] text-slate-900 font-black shadow-xl hover:bg-[#03CFCB]/90 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-white">
                    {guide.isExternal ? <ExternalLink size={18} aria-hidden /> : <Fingerprint size={18} aria-hidden />}
                    {guide.isExternal ? t('الانتقال إلى الخدمة', 'Go to the service') : citizen ? t('ابدأ الخدمة', 'Start the service') : t('ابدأ الخدمة (عبر ثقة)', 'Start (Thiqa sign-in)')}
                  </button>
                  <button type="button" onClick={() => ask(t(`ما المطلوب لخدمة ${guide.title}؟`, `What do I need for ${guide.title}?`))} className="inline-flex items-center gap-2 h-11 px-4 rounded-xl ring-2 ring-white/40 font-black text-sm hover:bg-white/10">
                    <Bot size={17} aria-hidden /><span className="hidden sm:inline">{t('اسأل المساعد', 'Ask the assistant')}</span><span className="sr-only sm:hidden">{t('اسأل المساعد', 'Ask the assistant')}</span>
                  </button>
                  <button type="button" onClick={() => window.print()} className="size-11 rounded-xl flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10" aria-label={t('طباعة الدليل', 'Print guide')} title={t('طباعة الدليل', 'Print guide')}>
                    <Printer size={18} aria-hidden />
                  </button>
                </div>
              </div>

              <dl className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                <Fact icon={<BadgeCent size={15} />} label={t('الرسوم', 'Fees')} value={guide.fees || t('تُحدد عند المراجعة', 'Set during review')} />
                <Fact icon={<Clock size={15} />} label={t('المدة', 'Time')} value={guide.duration || t('حسب الطلب', 'Depends on the request')} />
                <Fact icon={<FileText size={15} />} label={t('المستندات', 'Documents')} value={guide.documents.length ? t(`${guide.documents.length} مستندات`, `${guide.documents.length} documents`) : t('لا يلزم', 'None needed')} />
                <Fact icon={<ScrollText size={15} />} label={t('رمز المعاملة', 'Code')} value={<span dir="ltr" className="font-mono">{prefix}-00000</span>} />
                {mounted && citizen && <div className="flex items-center gap-1.5 px-3 h-9 text-xs font-bold text-white/70"><ShieldCheck size={14} aria-hidden />{t('مسجل عبر ثقة', 'Signed in with Thiqa')} <span dir="ltr">{citizenLabel(citizen)}</span></div>}
              </dl>
            </div>
          </section>

          <div className="max-w-6xl mx-auto px-4 md:px-6 py-5 grid lg:grid-cols-[minmax(0,1fr)_280px] gap-5">
            <div className="min-w-0 rounded-3xl bg-white ring-1 ring-slate-200 overflow-hidden">
              <div role="tablist" aria-label={t('أقسام الدليل', 'Guide sections')} className="flex overflow-x-auto border-b border-slate-100 px-2 print:hidden">
                {[
                  { id: 'documents', label: t('المستندات المطلوبة', 'Documents'), n: guide.documents.length },
                  { id: 'conditions', label: t('الاشتراطات', 'Conditions'), n: guide.conditions.length },
                  ...(guide.formSteps.length ? [{ id: 'how', label: t('خطوات التقديم', 'How to apply'), n: 0 }] : []),
                  ...(guide.steps.length ? [{ id: 'after', label: t('بعد التقديم', 'After you apply'), n: 0 }] : []),
                ].map(x => (
                  <button key={x.id} type="button" role="tab" id={`tab-${x.id}`} aria-selected={tab === x.id} aria-controls={x.id} onClick={() => setTab(x.id)}
                    className={cn('shrink-0 h-12 px-4 text-sm font-black border-b-2 -mb-px flex items-center gap-1.5 transition-colors', tab === x.id ? 'border-[#008E91] text-[#005751]' : 'border-transparent text-slate-500 hover:text-slate-800')}>
                    {x.label}{x.n > 0 && <span className="min-w-5 h-5 px-1 rounded-full bg-slate-100 text-[11px] flex items-center justify-center">{x.n}</span>}
                  </button>
                ))}
              </div>
              <Panel id="documents" active={tab === 'documents'} icon={<ListChecks size={20} />} title={t('المستندات المطلوبة', 'Required documents')}>
                {guide.documents.length ? (
                  <ul className="space-y-2">
                    {guide.documents.map((d, i) => (
                      <li key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                        <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-[#008E91]" aria-hidden />
                        <span className="flex-1 font-bold text-slate-700">{d.label}</span>
                        <span className={cn('shrink-0 text-[11px] font-black px-2 py-0.5 rounded-full', d.required ? 'bg-red-50 text-red-700' : 'bg-slate-200 text-slate-600')}>{d.required ? t('إلزامي', 'Required') : t('اختياري', 'Optional')}</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="font-bold text-slate-500">{t('لا يلزم إرفاق مستندات لهذه الخدمة.', 'No documents need to be uploaded for this service.')}</p>}
                {guide.linked.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {guide.linked.map(k => (
                      <li key={k} className="flex gap-3 p-3 rounded-xl border border-[#03CFCB]/40 bg-[#03CFCB]/5 text-sm">
                        <ShieldCheck size={18} className="shrink-0 text-[#005751]" aria-hidden />
                        <span><span className="font-black text-slate-800">{isAr ? LINKED_INFO[k].titleAr : LINKED_INFO[k].titleEn}</span> — <span className="font-bold text-slate-600">{isAr ? LINKED_INFO[k].noteAr : LINKED_INFO[k].noteEn}</span></span>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>

              <Panel id="conditions" active={tab === 'conditions'} icon={<ShieldCheck size={20} />} title={t('الاشتراطات', 'Conditions')}>
                {guide.conditions.length ? (
                  <ul className="space-y-2 list-disc ps-5 marker:text-[#008E91]">
                    {guide.conditions.map((c, i) => <li key={i} className="font-bold text-slate-700 leading-relaxed">{c}</li>)}
                  </ul>
                ) : <p className="font-bold text-slate-500">{t('لا توجد اشتراطات خاصة لهذه الخدمة.', 'There are no special conditions for this service.')}</p>}
              </Panel>

              {guide.formSteps.length > 0 && (
                <Panel id="how" active={tab === 'how'} icon={<Route size={20} />} title={t('خطوات تقديم الطلب', 'How to apply')}>
                  <ol className="space-y-2">
                    {[t('تسجيل الدخول عبر ثقة', 'Sign in with Thiqa'), t('الموافقة على الاشتراطات', 'Accept the conditions'), t('إرفاق المستندات', 'Attach documents'), ...guide.formSteps, t('إرسال الطلب واستلام رقم المعاملة', 'Submit and get your transaction number')].map((s, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <span className="size-8 shrink-0 rounded-full bg-[#005751] text-white text-sm font-black flex items-center justify-center">{i + 1}</span>
                        <span className="font-bold text-slate-700">{s}</span>
                      </li>
                    ))}
                  </ol>
                </Panel>
              )}

              {guide.steps.length > 0 && (
                <Panel id="after" active={tab === 'after'} icon={<Info size={20} />} title={t('ماذا يحدث بعد التقديم؟', 'What happens after you apply?')}>
                  <ol className="relative border-s-2 border-slate-200 ms-3 space-y-4">
                    {guide.steps.map((s, i) => (
                      <li key={i} className="ps-6 relative">
                        <span aria-hidden className={cn('absolute -start-[9px] top-1.5 size-4 rounded-full ring-4 ring-white', s.kind === 'applicant' ? 'bg-[#03CFCB]' : s.kind === 'system' ? 'bg-slate-400' : 'bg-[#470D67]')} />
                        <p className="font-bold text-slate-800">{s.title}</p>
                        <p className="text-xs font-bold text-slate-500">{s.kind === 'applicant' ? t('أنت', 'You') : s.actor}</p>
                      </li>
                    ))}
                  </ol>
                </Panel>
              )}
            </div>

            <aside className="space-y-3 min-w-0">
              <div className="rounded-3xl bg-white ring-1 ring-slate-200 p-4 space-y-2 text-sm">
                <p className="font-bold text-slate-500 leading-relaxed">{t('المدة تُحسب من اكتمال الطلب ومستنداته، وفق اتفاقية مستوى الخدمة.', 'Time is counted from when the request and its documents are complete, per the service level agreement.')}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  <Link href="/sla" className="text-xs font-black text-[#005751] hover:underline">{t('اتفاقية مستوى الخدمة', 'Service level agreement')}</Link>
                  <Link href="/payment" className="text-xs font-black text-[#005751] hover:underline">{t('سياسة الدفع والاسترداد', 'Payment & refund policy')}</Link>
                </div>
              </div>
              <div className="rounded-3xl bg-[#470D67] text-white p-4 space-y-2">
                <h2 className="font-black flex items-center gap-2"><Search size={18} aria-hidden />{t('قدّمت طلباً من قبل؟', 'Already applied?')}</h2>
                <p className="text-sm font-bold text-white/75">{t('تتبّع حالة معاملتك برقمها، مثل', 'Track your request by its number, e.g.')} <span dir="ltr" className="font-mono">{prefix}-00482</span></p>
                <Link href="/track" className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-white text-[#470D67] font-black text-sm">{t('الاستعلام عن معاملة', 'Track a request')}<ArrowUpRight size={15} className={cn(isAr && '-scale-x-100')} aria-hidden /></Link>
              </div>
            </aside>
          </div>
        </main>
      )}

      <PortalFooter siteConfig={siteConfig} />
    </div>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-white/10 ring-1 ring-white/15 px-2.5 sm:px-3 h-9 min-w-0 max-w-full">
      <dt className="flex items-center gap-1.5 text-xs font-bold text-white/70 shrink-0"><span aria-hidden>{icon}</span><span className="hidden sm:inline">{label}</span><span className="sr-only sm:hidden">{label}</span></dt>
      <dd className="text-sm font-black text-white truncate">{value}</dd>
    </div>
  );
}

/** One tab of the guide; every tab prints */
function Panel({ id, icon, title, active, children }: { id: string; icon: React.ReactNode; title: string; active: boolean; children: React.ReactNode }) {
  return (
    <section id={id} role="tabpanel" aria-labelledby={`tab-${id}`} className={cn('p-5 md:p-6 scroll-mt-24', !active && 'hidden print:block')}>
      <h2 className="hidden print:flex items-center gap-2 text-lg font-black text-slate-900 mb-3"><span className="text-[#008E91]" aria-hidden>{icon}</span>{title}</h2>
      {children}
    </section>
  );
}
