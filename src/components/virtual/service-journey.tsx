'use client';

/*
 * The panels of one service's journey inside the virtual space: the guide, what to prepare,
 * how to apply, every stage of the process in order, and the end of the service.
 * Plain DOM, placed in 3D by the service space (CSS3DRenderer).
 */

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, BadgeCent, BadgeCheck, CheckCircle2, Clock, Cpu, FileText, Fingerprint, LayoutGrid, Link2, ListChecks, PenLine, UserRound, UsersRound } from 'lucide-react';
import { Service } from '@/lib/types';
import { ServiceGuide } from '@/lib/service-guide';
import { LINKED_INFO } from '@/lib/linked-data';
import { ServiceIcon } from '@/components/service/service-icon';
import { cn } from '@/lib/utils';

export const PANEL_W = 460;
export const PANEL_H = 520;

type Stage = ServiceGuide['steps'][number];
export type JourneyPanel =
  | { kind: 'guide'; label: string }
  | { kind: 'needs'; label: string }
  | { kind: 'apply'; label: string }
  | { kind: 'stage'; label: string; stage: Stage; n: number; of: number }
  | { kind: 'done'; label: string };

/** The usual order when a service has no process diagram yet */
const DEFAULT_STAGES: [string, string, string, string, Stage['kind']][] = [
  ['المتقدم', 'Applicant', 'تقديم الطلب', 'Submit the request', 'applicant'],
  ['الموظف المختص', 'Competent employee', 'المراجعة والتدقيق', 'Review and audit', 'staff'],
  ['رئيس القسم / الدائرة', 'Head of section', 'الموافقة المبدئية', 'Preliminary approval', 'staff'],
  ['النظام الآلي', 'Automated system', 'إشعار المراجع بالسداد', 'Payment notice', 'system'],
  ['المتقدم', 'Applicant', 'السداد الإلكتروني', 'Electronic payment', 'applicant'],
  ['النظام الآلي', 'Automated system', 'إصدار الخدمة تلقائياً', 'Automatic issue', 'system'],
];

export function buildJourney(guide: ServiceGuide, isAr: boolean): { panels: JourneyPanel[]; assumed: boolean } {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const assumed = !guide.steps.length;
  const stages: Stage[] = assumed ? DEFAULT_STAGES.map(d => ({ actor: t(d[0], d[1]), title: t(d[2], d[3]), kind: d[4] })) : guide.steps;
  const panels: JourneyPanel[] = [{ kind: 'guide', label: t('دليل الخدمة', 'Service guide') }, { kind: 'needs', label: t('المتطلبات', 'What you need') }];
  if (!guide.isExternal) panels.push({ kind: 'apply', label: t('تقديم الطلب', 'Applying') });
  stages.forEach((stage, i) => panels.push({ kind: 'stage', label: stage.title, stage, n: i + 1, of: stages.length }));
  panels.push({ kind: 'done', label: t('نهاية الخدمة', 'Service complete') });
  return { panels, assumed };
}

const KIND = {
  applicant: { icon: UserRound, tint: '#7FDAD6', ar: 'أنت', en: 'You' },
  staff: { icon: UsersRound, tint: '#C3B5E6', ar: 'موظفو البلدية', en: 'Municipality staff' },
  system: { icon: Cpu, tint: '#E8C877', ar: 'النظام آلياً', en: 'Automated' },
} as const;

const Shell = ({ children, tint, current }: { children: React.ReactNode; tint: string; current: boolean }) => (
  <div style={{ width: PANEL_W, height: PANEL_H, borderTopColor: tint }}
    className={cn('flex flex-col rounded-[28px] border-t-4 bg-[#0c1a30]/90 p-6 text-white shadow-[0_24px_70px_rgba(0,0,0,0.5)] ring-1 backdrop-blur-sm transition-shadow', current ? 'ring-white/40' : 'ring-white/15')}>
    {children}
  </div>
);
const Eyebrow = ({ children, tint }: { children: React.ReactNode; tint: string }) => <p className="text-xs font-black tracking-wide" style={{ color: tint }}>{children}</p>;
const List = ({ items, max, more }: { items: string[]; max: number; more: (n: number) => string }) => (
  <ul className="space-y-1.5 text-sm font-bold text-white/90">
    {items.slice(0, max).map(it => <li key={it} className="flex gap-2"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-white/50" aria-hidden /><span className="line-clamp-2">{it}</span></li>)}
    {items.length > max && <li className="text-xs text-white/55">{more(items.length - max)}</li>}
  </ul>
);

interface Props {
  panel: JourneyPanel; service: Service; guide: ServiceGuide; isAr: boolean; current: boolean; assumed: boolean;
  onNext: () => void; onStart: () => void; onClose: () => void;
}

export function JourneyPanelView({ panel, service, guide, isAr, current, assumed, onNext, onStart, onClose }: Props) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const more = (n: number) => t(`و${n} أخرى في الدليل الكامل`, `and ${n} more in the full guide`);
  // Panels off to the side are not reachable by Tab
  const tab = current ? 0 : -1;
  const nextBtn = (label: string) => (
    <button type="button" tabIndex={tab} onClick={onNext} className="mt-auto w-full h-12 rounded-2xl bg-white/10 font-black ring-1 ring-white/25 hover:bg-white/20 flex items-center justify-center gap-2">
      {label}<ArrowUpRight size={17} className={cn(isAr && '-scale-x-100')} aria-hidden />
    </button>
  );

  if (panel.kind === 'guide') return (
    <Shell tint="#7FDAD6" current={current}>
      <div className="flex items-start gap-3">
        <span className="size-14 shrink-0 rounded-2xl bg-white/10 ring-1 ring-white/20 flex items-center justify-center text-[#7FDAD6]"><ServiceIcon service={service} size={28} /></span>
        <div className="min-w-0"><Eyebrow tint="#7FDAD6">{t('دليل الخدمة', 'Service guide')}</Eyebrow><h2 className="text-xl font-black leading-snug line-clamp-3">{guide.title}</h2></div>
      </div>
      {guide.description && <p className="mt-4 text-sm font-medium leading-relaxed text-white/80 line-clamp-5">{guide.description}</p>}
      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-2xl bg-white/5 p-3"><dt className="flex items-center gap-1.5 text-xs font-bold text-white/60"><BadgeCent size={14} aria-hidden />{t('الرسوم', 'Fees')}</dt><dd className="mt-1 font-black line-clamp-2">{guide.fees || t('تُحدد عند المراجعة', 'Set on review')}</dd></div>
        <div className="rounded-2xl bg-white/5 p-3"><dt className="flex items-center gap-1.5 text-xs font-bold text-white/60"><Clock size={14} aria-hidden />{t('المدة', 'Duration')}</dt><dd className="mt-1 font-black line-clamp-2">{guide.duration || t('حسب طبيعة الطلب', 'Depends on the request')}</dd></div>
      </dl>
      {nextBtn(t('ما المطلوب؟', 'What do I need?'))}
    </Shell>
  );

  if (panel.kind === 'needs') return (
    <Shell tint="#C3B5E6" current={current}>
      <Eyebrow tint="#C3B5E6">{t('قبل أن تبدأ', 'Before you start')}</Eyebrow>
      <h2 className="text-xl font-black">{t('المستندات والاشتراطات', 'Documents and conditions')}</h2>
      <div className="mt-3 space-y-3 overflow-hidden">
        {guide.linked.length > 0 && (
          <p className="flex gap-2 rounded-2xl bg-[#7FDAD6]/10 p-3 text-xs font-bold text-[#bff0ee]"><Link2 size={15} className="shrink-0" aria-hidden />
            {t('تُجلب تلقائياً دون إرفاق: ', 'Fetched automatically, no upload: ')}{guide.linked.map(k => (isAr ? LINKED_INFO[k].titleAr : LINKED_INFO[k].titleEn)).join(t('، ', ', '))}
          </p>
        )}
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-black text-white/60"><FileText size={14} aria-hidden />{t('المستندات', 'Documents')}</p>
          {guide.documents.length ? <List items={guide.documents.map(d => d.label)} max={4} more={more} /> : <p className="text-sm font-bold text-white/70">{t('لا مستندات مطلوبة للإرفاق.', 'No documents to upload.')}</p>}
        </div>
        {guide.conditions.length > 0 && (
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-black text-white/60"><ListChecks size={14} aria-hidden />{t('الاشتراطات', 'Conditions')}</p>
            <List items={guide.conditions} max={3} more={more} />
          </div>
        )}
      </div>
      {nextBtn(guide.isExternal ? t('ما الذي يحدث بعدها؟', 'What happens next?') : t('كيف أقدّم الطلب؟', 'How do I apply?'))}
    </Shell>
  );

  if (panel.kind === 'apply') return (
    <Shell tint="#7FDAD6" current={current}>
      <Eyebrow tint="#7FDAD6">{t('تقديم الطلب', 'Applying')}</Eyebrow>
      <h2 className="text-xl font-black">{t('خطواتك في النموذج', 'Your steps in the form')}</h2>
      <ol className="mt-4 space-y-2.5 text-sm font-bold">
        {[t('الدخول عبر ثقة', 'Sign in with Thiqa'), ...(guide.formSteps.length ? guide.formSteps : [t('تعبئة بيانات الطلب', 'Fill in the request'), t('إرفاق المستندات', 'Attach the documents')]), t('مراجعة الطلب وإرساله', 'Review and submit')].slice(0, 7).map((s, i) => (
          <li key={`${i}-${s}`} className="flex items-center gap-3">
            <span className="size-8 shrink-0 rounded-full bg-[#7FDAD6]/15 text-[#7FDAD6] font-black flex items-center justify-center">{i === 0 ? <Fingerprint size={15} aria-hidden /> : i}</span>
            <span className="line-clamp-1">{s}</span>
          </li>
        ))}
      </ol>
      <p className="mt-3 flex gap-2 text-xs font-bold text-white/60"><PenLine size={14} className="shrink-0" aria-hidden />{t('يُحفظ الطلب مسودة تلقائياً ويمكن إكماله لاحقاً.', 'The request is saved as a draft and can be finished later.')}</p>
      {nextBtn(t('ثم ماذا؟', 'Then what?'))}
    </Shell>
  );

  if (panel.kind === 'stage') {
    const k = KIND[panel.stage.kind], Icon = k.icon;
    return (
      <Shell tint={k.tint} current={current}>
        <Eyebrow tint={k.tint}>{t(`المرحلة ${panel.n} من ${panel.of}`, `Stage ${panel.n} of ${panel.of}`)}</Eyebrow>
        <div className="mt-6 flex flex-col items-center text-center">
          <span className="size-24 rounded-full flex items-center justify-center ring-1 ring-white/20" style={{ background: `${k.tint}22`, color: k.tint }}><Icon size={44} aria-hidden /></span>
          <p className="mt-5 text-6xl font-black tabular-nums" style={{ color: k.tint }}>{panel.n}</p>
          <h2 className="mt-2 text-2xl font-black leading-snug line-clamp-3">{panel.stage.title}</h2>
          <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-black">{panel.stage.actor}</p>
          <p className="mt-2 text-xs font-bold text-white/55">{isAr ? k.ar : k.en}</p>
        </div>
        {assumed && <p className="mt-auto text-center text-[11px] font-bold text-white/45">{t('تسلسل عام: لم يُعتمد مخطط مسار هذه الخدمة بعد.', 'A general sequence: this service has no approved flow yet.')}</p>}
        <div className={cn(!assumed && 'mt-auto')}>{nextBtn(panel.n === panel.of ? t('نهاية الخدمة', 'Service complete') : t('المرحلة التالية', 'Next stage'))}</div>
      </Shell>
    );
  }

  return (
    <Shell tint="#8FD9B6" current={current}>
      <div className="flex flex-col items-center text-center">
        <span className="mt-2 size-24 rounded-full bg-[#8FD9B6]/15 text-[#8FD9B6] flex items-center justify-center ring-1 ring-white/20"><BadgeCheck size={48} aria-hidden /></span>
        <Eyebrow tint="#8FD9B6">{t('نهاية الخدمة', 'Service complete')}</Eyebrow>
        <h2 className="mt-1 text-2xl font-black leading-snug">{t('تصلك الخدمة إلكترونياً', 'The service reaches you online')}</h2>
        <p className="mt-2 text-sm font-medium leading-relaxed text-white/80">{t('يصلك إشعار عند كل مرحلة، وتجد المستند الصادر موقّعاً رقمياً في حسابك مع رمز تحقق.', 'You are notified at every stage, and the issued document is in your account, digitally signed with a verification code.')}</p>
      </div>
      <div className="mt-auto space-y-2">
        <button type="button" tabIndex={tab} onClick={onStart} className="w-full h-12 rounded-2xl bg-[#7FDAD6] text-slate-900 font-black flex items-center justify-center gap-2 hover:bg-[#9be6e2]">
          <CheckCircle2 size={18} aria-hidden />{guide.isExternal ? t('الانتقال إلى الخدمة', 'Go to the service') : t('ابدأ الخدمة الآن', 'Start the service now')}
        </button>
        <div className="grid grid-cols-2 gap-2">
          <Link href={`/services/${service.id}`} tabIndex={tab} className="h-11 rounded-2xl bg-white/10 ring-1 ring-white/25 text-sm font-black flex items-center justify-center gap-1.5 hover:bg-white/20"><FileText size={15} aria-hidden />{t('الدليل الكامل', 'Full guide')}</Link>
          <button type="button" tabIndex={tab} onClick={onClose} className="h-11 rounded-2xl bg-white/10 ring-1 ring-white/25 text-sm font-black flex items-center justify-center gap-1.5 hover:bg-white/20"><LayoutGrid size={15} aria-hidden />{t('خدمة أخرى', 'Another service')}</button>
        </div>
      </div>
    </Shell>
  );
}
