'use client';

/*
 * Additional identity-board sections: logo usage, grid, motion, service UX patterns (from the
 * BRD workflows), notification templates, feedback states, data display and voice & tone.
 */

import React, { useEffect, useState } from 'react';
import {
  AlertTriangle, ArrowUpRight, BadgeCheck, Ban, Building2, Check, CheckCircle2, ChevronLeft, ChevronRight, CircleDashed, Clock,
  Copy, CreditCard, FileSearch, FileText, Fingerprint, Inbox, Info, Loader2, Mail, MessageSquare, Play, QrCode, Receipt,
  RefreshCw, ShieldCheck, Signature, SquareX, TrendingDown, TrendingUp, User, Users, WifiOff, X, XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type CopyFn = (text: string, label?: string) => void;
interface P { isAr: boolean; copy: CopyFn }

// Official logo (bilingual wordmark + emblem)
const LOGO_FULL = '/brand/dhofar-municipality-logo.png';

export const EXTRA_SECTIONS = {
  logo: { id: 'logo', ar: 'الشعار', en: 'Logo' },
  grid: { id: 'grid', ar: 'الشبكة والتجاوب', en: 'Grid & breakpoints' },
  motion: { id: 'motion', ar: 'الحركة', en: 'Motion' },
  serviceUx: { id: 'service-ux', ar: 'أنماط الخدمات', en: 'Service patterns' },
  notifications: { id: 'notifications', ar: 'قوالب الإشعارات', en: 'Notification templates' },
  states: { id: 'states', ar: 'حالات الواجهة', en: 'Feedback states' },
  data: { id: 'data', ar: 'عرض البيانات', en: 'Data display' },
  voice: { id: 'voice', ar: 'أسلوب الكتابة', en: 'Voice & tone' },
} as const;

/* ---------- shared bits ---------- */

function Head({ id, isAr, ar, en, descAr, descEn, action }: { id: string; isAr: boolean; ar: string; en: string; descAr: string; descEn: string; action?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div>
        <h2 id={`${id}-title`} className="text-3xl font-black text-slate-900">{isAr ? ar : en}</h2>
        <p className="text-slate-500 font-medium mt-1 max-w-2xl">{isAr ? descAr : descEn}</p>
      </div>
      {action}
    </header>
  );
}
const Sec = ({ id, children }: { id: string; children: React.ReactNode }) => <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-6">{children}</section>;
const Card = ({ title, children, className }: { title?: string; children: React.ReactNode; className?: string }) => (
  <div className={cn('bg-white rounded-3xl ring-1 ring-slate-200 p-5 space-y-4', className)}>
    {title && <h3 className="text-sm font-black text-slate-500">{title}</h3>}
    {children}
  </div>
);
const Do = ({ ok, isAr, children }: { ok: boolean; isAr: boolean; children: React.ReactNode }) => (
  <div className={cn('rounded-2xl border-2 p-4 space-y-2', ok ? 'border-emerald-200 bg-emerald-50/40' : 'border-red-200 bg-red-50/40')}>
    <p className={cn('flex items-center gap-1.5 text-xs font-black', ok ? 'text-emerald-700' : 'text-red-700')}>{ok ? <CheckCircle2 size={14} aria-hidden /> : <XCircle size={14} aria-hidden />}{ok ? (isAr ? 'اكتب هكذا' : 'Write this') : (isAr ? 'تجنّب' : 'Avoid')}</p>
    {children}
  </div>
);

/* ------------------------------------------------------------------ */
/* Logo                                                                */
/* ------------------------------------------------------------------ */

export function LogoSection({ isAr, copy }: P) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const variants = [
    { bg: 'bg-white', label: t('على خلفية فاتحة', 'On light'), img: 'object-contain', ring: 'ring-slate-200' },
    { bg: 'bg-[#005751]', label: t('على اللون الأساسي', 'On brand teal'), img: 'object-contain brightness-0 invert', ring: 'ring-transparent' },
    { bg: 'bg-slate-950', label: t('على خلفية داكنة', 'On dark'), img: 'object-contain brightness-0 invert', ring: 'ring-transparent' },
    { bg: 'bg-slate-100', label: t('أحادي اللون', 'Monochrome'), img: 'object-contain grayscale', ring: 'ring-slate-200' },
  ];
  const donts = [
    { label: t('لا تمدّد الشعار', 'Don\'t stretch'), style: { transform: 'scaleX(1.5)' } },
    { label: t('لا تغيّر ألوانه', 'Don\'t recolour'), style: { filter: 'hue-rotate(160deg) saturate(3)' } },
    { label: t('لا تُدِره', 'Don\'t rotate'), style: { transform: 'rotate(-18deg)' } },
    { label: t('لا تضف ظلالاً', 'Don\'t add effects'), style: { filter: 'drop-shadow(6px 6px 0 #f59e0b)' } },
  ];
  return (
    <Sec id="logo">
      <Head id="logo" isAr={isAr} ar="الشعار" en="Logo" descAr="الاستخدام الصحيح لشعار بلدية ظفار: النسخ المعتمدة، والمساحة الآمنة، والحد الأدنى للحجم، وما يجب تجنبه." descEn="Correct use of the Dhofar Municipality logo: approved versions, clear space, minimum size and what to avoid."
        action={<button type="button" onClick={() => copy(LOGO_FULL, t('رابط الشعار', 'Logo URL'))} className="h-10 px-4 rounded-xl bg-white ring-1 ring-slate-200 font-bold text-sm flex items-center gap-2 hover:ring-[#008E91]"><Copy size={14} />{t('نسخ رابط الشعار', 'Copy logo URL')}</button>} />
      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-4">
        <Card title={t('المساحة الآمنة والحد الأدنى', 'Clear space & minimum size')}>
          <div className="flex items-center justify-center p-6 bg-slate-50 rounded-2xl">
            <div className="relative p-8 border-2 border-dashed border-[#03CFCB]">
              {['top-0 left-1/2 -translate-x-1/2 -translate-y-1/2', 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2', 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2', 'right-0 top-1/2 translate-x-1/2 -translate-y-1/2'].map(pos => (
                <span key={pos} aria-hidden className={cn('absolute size-6 rounded bg-[#03CFCB]/30 text-[10px] font-black text-[#005751] flex items-center justify-center', pos)}>x</span>
              ))}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOGO_FULL} alt={t('شعار بلدية ظفار', 'Dhofar Municipality logo')} className="h-20 w-auto object-contain" />
            </div>
          </div>
          <ul className="grid sm:grid-cols-3 gap-2 text-xs font-bold text-slate-600">
            <li className="p-3 rounded-xl bg-slate-50"><b className="block text-slate-900 text-sm">x</b>{t('المساحة الآمنة = ارتفاع الحرف في الشعار من كل جهة', 'Clear space = logo letter height on every side')}</li>
            <li className="p-3 rounded-xl bg-slate-50"><b className="block text-slate-900 text-sm">32px</b>{t('أصغر ارتفاع رقمي للشعار الكامل', 'Minimum digital height, full logo')}</li>
            <li className="p-3 rounded-xl bg-slate-50"><b className="block text-slate-900 text-sm">24px</b>{t('أصغر حجم للرمز (الأيقونة) منفرداً', 'Minimum size, symbol only')}</li>
          </ul>
        </Card>
        <Card title={t('النسخ المعتمدة', 'Approved versions')}>
          <div className="grid grid-cols-2 gap-3">
            {variants.map(v => (
              <figure key={v.label} className={cn('rounded-2xl ring-1 p-4 flex flex-col items-center gap-3', v.bg, v.ring)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={LOGO_FULL} alt="" className={cn('h-14 w-auto object-contain', v.img)} />
                <figcaption className={cn('text-[11px] font-black', v.bg === 'bg-white' || v.bg === 'bg-slate-100' ? 'text-slate-600' : 'text-white/80')}>{v.label}</figcaption>
              </figure>
            ))}
          </div>
        </Card>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        {donts.map(d => (
          <figure key={d.label} className="bg-white rounded-2xl ring-1 ring-red-100 p-4 flex flex-col items-center gap-3">
            <div className="relative h-16 flex items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOGO_FULL} alt="" className="h-12 w-auto object-contain" style={d.style} />
              <SquareX size={20} className="absolute -top-1 -end-5 text-red-500" aria-hidden />
            </div>
            <figcaption className="text-xs font-black text-red-700">{d.label}</figcaption>
          </figure>
        ))}
      </div>
    </Sec>
  );
}

/* ------------------------------------------------------------------ */
/* Grid                                                                */
/* ------------------------------------------------------------------ */

export function GridSection({ isAr, copy }: P) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const [w, setW] = useState(0);
  useEffect(() => { const f = () => setW(window.innerWidth); f(); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f); }, []);
  const bps = [
    { id: 'base', min: 0, cols: 4, gutter: 16, label: t('الجوال', 'Mobile') },
    { id: 'sm', min: 640, cols: 4, gutter: 16, label: t('جوال كبير', 'Large phone') },
    { id: 'md', min: 768, cols: 8, gutter: 24, label: t('لوحي', 'Tablet') },
    { id: 'lg', min: 1024, cols: 12, gutter: 24, label: t('حاسوب', 'Laptop') },
    { id: 'xl', min: 1280, cols: 12, gutter: 32, label: t('شاشة عريضة', 'Desktop') },
  ];
  const current = [...bps].reverse().find(b => w >= b.min) || bps[0];
  return (
    <Sec id="grid">
      <Head id="grid" isAr={isAr} ar="الشبكة ونقاط التجاوب" en="Grid & breakpoints" descAr="شبكة من 12 عموداً على الشاشات الكبيرة و4 أعمدة على الجوال، وعرض أقصى للمحتوى 1280px." descEn="A 12-column grid on large screens and 4 on mobile, with a 1280px maximum content width." />
      <div className="grid lg:grid-cols-[1fr_320px] gap-4">
        <Card title={t(`الشبكة الحالية: ${current.label} (${current.cols} أعمدة)`, `Current grid: ${current.label} (${current.cols} columns)`)}>
          <div className="grid gap-2 h-40" style={{ gridTemplateColumns: `repeat(${current.cols}, minmax(0, 1fr))` }} aria-hidden>
            {Array.from({ length: current.cols }, (_, i) => <div key={i} className="rounded-lg bg-[#03CFCB]/20 border border-[#03CFCB]/40 flex items-end justify-center pb-1 text-[10px] font-black text-[#005751]">{i + 1}</div>)}
          </div>
          <p className="text-xs font-bold text-slate-500">{t('غيّر عرض النافذة لرؤية الشبكة تتكيف.', 'Resize the window to watch the grid adapt.')} · <span dir="ltr">{w}px</span></p>
        </Card>
        <Card title={t('نقاط التجاوب', 'Breakpoints')}>
          <ul className="space-y-1.5">
            {bps.map(b => (
              <li key={b.id}>
                <button type="button" onClick={() => copy(`${b.id}: ${b.min}px`)} className={cn('w-full flex items-center justify-between p-2.5 rounded-xl text-sm font-bold', b.id === current.id ? 'bg-[#005751] text-white' : 'hover:bg-slate-50 text-slate-700')}>
                  <span>{b.label} <span className="font-mono text-xs opacity-70">{b.id}</span></span>
                  <span className="font-mono text-xs" dir="ltr">≥{b.min}px · {b.cols}col · {b.gutter}px</span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </Sec>
  );
}

/* ------------------------------------------------------------------ */
/* Motion                                                              */
/* ------------------------------------------------------------------ */

export function MotionSection({ isAr, copy }: P) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const [run, setRun] = useState(0);
  const tokens = [
    { id: 'instant', ms: 100, ease: 'linear', use: t('تغيّر الحالة (تحويم، تركيز)', 'State changes (hover, focus)') },
    { id: 'fast', ms: 200, ease: 'cubic-bezier(0.2, 0, 0, 1)', use: t('القوائم والتلميحات', 'Menus and tooltips') },
    { id: 'base', ms: 300, ease: 'cubic-bezier(0.2, 0, 0, 1)', use: t('النوافذ واللوحات الجانبية', 'Dialogs and drawers') },
    { id: 'slow', ms: 500, ease: 'cubic-bezier(0.3, 0, 0, 1)', use: t('ظهور الأقسام عند التمرير', 'Sections entering on scroll') },
  ];
  return (
    <Sec id="motion">
      <Head id="motion" isAr={isAr} ar="الحركة" en="Motion" descAr="حركة هادئة وهادفة توضح التغيير ولا تشتت. تتوقف كل الحركات عند تفعيل «إيقاف الحركة» أو تفضيل تقليل الحركة في النظام." descEn="Calm, purposeful motion that explains change without distracting. All motion stops with 'Stop animations' or the system reduced-motion setting."
        action={<button type="button" onClick={() => setRun(r => r + 1)} className="h-10 px-4 rounded-xl bg-[#005751] text-white font-bold text-sm flex items-center gap-2"><Play size={14} />{t('تشغيل العرض', 'Play demo')}</button>} />
      <div className="grid md:grid-cols-2 gap-3">
        {tokens.map(tok => (
          <button key={tok.id} type="button" onClick={() => copy(`transition: all ${tok.ms}ms ${tok.ease};`)} className="text-start bg-white rounded-2xl ring-1 ring-slate-200 p-4 space-y-3 hover:ring-[#008E91]">
            <div className="flex items-center justify-between">
              <span className="font-black text-slate-900">{tok.id} · <span dir="ltr">{tok.ms}ms</span></span>
              <span className="font-mono text-[10px] text-slate-400" dir="ltr">{tok.ease}</span>
            </div>
            <div className="h-3 rounded-full bg-slate-100 overflow-hidden" aria-hidden>
              {run > 0 && <div key={run} className="h-full w-1/4 rounded-full bg-[#03CFCB] motion-reduce:!animate-none" style={{ animation: `${isAr ? 'dm-slide-rtl' : 'dm-slide'} ${tok.ms * 4}ms ${tok.ease} forwards` }} />}
              {run === 0 && <div className="h-full w-1/4 rounded-full bg-[#03CFCB]" />}
            </div>
            <span className="block text-xs font-bold text-slate-500">{tok.use}</span>
          </button>
        ))}
      </div>
      <style>{'@keyframes dm-slide { to { transform: translateX(300%) } } @keyframes dm-slide-rtl { to { transform: translateX(-300%) } }'}</style>
    </Sec>
  );
}

/* ------------------------------------------------------------------ */
/* Service patterns (from the BRD workflows)                           */
/* ------------------------------------------------------------------ */

function FakeQr({ size = 96 }: { size?: number }) {
  // Decorative sample pattern — real certificates encode a verification URL
  const n = 21;
  const cells: boolean[] = Array.from({ length: n * n }, (_, i) => ((i * 7919) % 13) < 6);
  const finder = (x: number, y: number) => [[0, 0], [n - 7, 0], [0, n - 7]].some(([fx, fy]) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7);
  const inFinder = (x: number, y: number) => [[0, 0], [n - 7, 0], [0, n - 7]].some(([fx, fy]) => {
    const dx = x - fx, dy = y - fy;
    if (dx < 0 || dy < 0 || dx > 6 || dy > 6) return false;
    return dx === 0 || dy === 0 || dx === 6 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4);
  });
  return (
    <svg viewBox={`0 0 ${n} ${n}`} width={size} height={size} aria-hidden className="bg-white p-1 rounded">
      {cells.map((on, i) => {
        const x = i % n, y = Math.floor(i / n);
        const fill = finder(x, y) ? inFinder(x, y) : on;
        return fill ? <rect key={i} x={x} y={y} width={1} height={1} fill="#0f172a" /> : null;
      })}
    </svg>
  );
}

export function ServicePatternsSection({ isAr }: P) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const timeline = [
    { icon: FileText, ar: 'تم تقديم الطلب', en: 'Request submitted', by: t('مقدم الطلب', 'Applicant'), time: '09:12', state: 'done' },
    { icon: FileSearch, ar: 'قيد المراجعة', en: 'In review', by: t('المهندس / المفتش', 'Engineer / inspector'), time: '10:40', state: 'done' },
    { icon: MessageSquare, ar: 'مطلوب معلومات إضافية', en: 'More information requested', by: t('المهندس / المفتش', 'Engineer / inspector'), time: '11:05', state: 'warn' },
    { icon: BadgeCheck, ar: 'بانتظار اعتماد رئيس الدائرة', en: 'Awaiting head of department', by: t('رئيس الدائرة', 'Head of department'), time: '—', state: 'current' },
    { icon: ShieldCheck, ar: 'إصدار الترخيص الموقّع رقمياً', en: 'Digitally signed licence issued', by: t('النظام', 'System'), time: '—', state: 'todo' },
  ] as const;
  const roles = [
    { ar: 'مقدم الطلب', en: 'Applicant', cls: 'bg-sky-100 text-sky-800' },
    { ar: 'الموظف المختص', en: 'Case officer', cls: 'bg-[#03CFCB]/20 text-[#005751]' },
    { ar: 'المهندس / المفتش', en: 'Engineer / inspector', cls: 'bg-amber-100 text-amber-800' },
    { ar: 'رئيس القسم / الدائرة', en: 'Section / department head', cls: 'bg-[#470D67]/10 text-[#470D67]' },
    { ar: 'النظام', en: 'System', cls: 'bg-slate-200 text-slate-700' },
  ];
  return (
    <Sec id="service-ux">
      <Head id="service-ux" isAr={isAr} ar="أنماط الخدمات" en="Service patterns" descAr="مكونات مشتركة مستخرجة من مسارات عمل الخدمات الثماني عشرة في وثيقة متطلبات الأعمال." descEn="Shared components drawn from the 18 service workflows in the business requirements document." />
      <div className="grid lg:grid-cols-2 gap-4">
        <Card title={t('الخط الزمني لحالة الطلب', 'Request status timeline')}>
          <ol className="relative space-y-4 ps-2">
            {timeline.map((s, i) => {
              const color = s.state === 'done' ? 'bg-emerald-500 text-white' : s.state === 'warn' ? 'bg-amber-400 text-slate-900' : s.state === 'current' ? 'bg-[#005751] text-white ring-4 ring-[#03CFCB]/30' : 'bg-slate-100 text-slate-400';
              return (
                <li key={s.en} className="relative flex gap-3" aria-current={s.state === 'current' ? 'step' : undefined}>
                  {i < timeline.length - 1 && <span aria-hidden className="absolute start-[17px] top-9 bottom-[-16px] w-0.5 bg-slate-200" />}
                  <span className={cn('relative size-9 shrink-0 rounded-full flex items-center justify-center', color)}><s.icon size={16} aria-hidden /></span>
                  <div className="flex-1 min-w-0 pt-1">
                    <p className={cn('font-black text-sm', s.state === 'todo' ? 'text-slate-400' : 'text-slate-900')}>{isAr ? s.ar : s.en}</p>
                    <p className="text-xs font-bold text-slate-500">{s.by} · <span dir="ltr">{s.time}</span></p>
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>

        <div className="space-y-4">
          <Card title={t('البيانات المرتبطة (لا مرفقات)', 'Linked data (no attachments)')}>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-2xl p-4 bg-gradient-to-br from-[#005751] to-[#008E91] text-white space-y-2">
                <p className="flex items-center gap-2 text-xs font-black text-white/80"><Fingerprint size={14} aria-hidden />{t('من ثقة', 'From Thiqa')}<BadgeCheck size={14} className="ms-auto text-[#03CFCB]" aria-label={t('موثق', 'Verified')} /></p>
                <p className="font-black">{t('محمد سالم الشحري', 'Mohammed Salim Al Shahri')}</p>
                <p className="text-xs font-bold text-white/70">{t('الرقم المدني', 'Civil no.')} <span dir="ltr" className="font-mono">•••• 4821</span></p>
              </div>
              <div className="rounded-2xl p-4 bg-white ring-2 ring-[#03CFCB]/40 space-y-2">
                <p className="flex items-center gap-2 text-xs font-black text-slate-500"><Building2 size={14} aria-hidden />{t('السجل التجاري', 'Commercial registration')}<CheckCircle2 size={14} className="ms-auto text-emerald-600" aria-label={t('تم التحقق', 'Verified')} /></p>
                <p className="font-black text-slate-900">{t('مؤسسة الخريف للمقاولات', 'Al Khareef Contracting')}</p>
                <p className="text-xs font-bold text-slate-500">CR <span dir="ltr" className="font-mono">1234567</span></p>
              </div>
            </div>
            <p className="text-xs font-bold text-slate-500">{t('تُجلب البيانات تلقائياً؛ لا تطلب من المستخدم إرفاق البطاقة الشخصية أو السجل التجاري.', 'Data is fetched automatically — never ask users to attach an ID card or CR.')}</p>
          </Card>

          <Card title={t('أدوار مسار العمل', 'Workflow roles')}>
            <div className="flex flex-wrap gap-2">
              {roles.map(r => <span key={r.en} className={cn('px-3 py-1 rounded-full text-xs font-black', r.cls)}>{isAr ? r.ar : r.en}</span>)}
            </div>
            <p className="text-xs font-bold text-slate-500">{t('لكل ممر في مخطط مسار العمل لون ثابت يُستخدم في الشارات والمخططات.', 'Each workflow lane has a fixed colour used in badges and diagrams.')}</p>
          </Card>
        </div>

        <Card title={t('ملخص الرسوم والدفع', 'Fees & payment summary')}>
          <dl className="divide-y divide-slate-100 text-sm">
            {[[t('رسوم ترخيص اللوحة', 'Signboard licence fee'), '10.000'], [t('رسوم المعاينة الميدانية', 'Field inspection fee'), '5.000'], [t('ضريبة القيمة المضافة', 'VAT'), '0.000']].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2.5"><dt className="font-bold text-slate-600">{k}</dt><dd className="font-black text-slate-900 tabular-nums" dir="ltr">OMR {v}</dd></div>
            ))}
            <div className="flex justify-between py-3"><dt className="font-black text-slate-900">{t('الإجمالي', 'Total')}</dt><dd className="text-xl font-black text-[#005751] tabular-nums" dir="ltr">OMR 15.000</dd></div>
          </dl>
          <div className="grid grid-cols-2 gap-2">
            <span className="flex items-center justify-center gap-2 h-11 rounded-xl bg-[#005751] text-white font-black text-sm"><CreditCard size={16} aria-hidden />{t('بوابة الدفع', 'Payment gateway')}</span>
            <span className="flex items-center justify-center gap-2 h-11 rounded-xl ring-2 ring-slate-200 font-black text-sm text-slate-700"><Receipt size={16} aria-hidden />{t('المحفظة الإلكترونية', 'E-wallet')}</span>
          </div>
        </Card>

        <Card title={t('شهادة / تصريح موقّع رقمياً', 'Digitally signed certificate / permit')}>
          <div className="relative overflow-hidden rounded-2xl ring-1 ring-slate-200 p-5 bg-gradient-to-br from-white to-slate-50">
            <div aria-hidden className="absolute -end-10 -top-10 size-40 rounded-full bg-[#03CFCB]/10" />
            <div className="relative flex gap-4">
              <div className="flex-1 space-y-2">
                <p className="text-[10px] font-black tracking-widest text-[#008E91] uppercase">{t('بلدية ظفار', 'Dhofar Municipality')}</p>
                <p className="text-lg font-black text-slate-900">{t('ترخيص لوحة إرشادية', 'Signboard licence')}</p>
                <p className="text-xs font-bold text-slate-500">{t('رقم الترخيص', 'Licence no.')} <span dir="ltr" className="font-mono">DM-SB-2026-00482</span></p>
                <p className="text-xs font-bold text-slate-500">{t('صالح حتى', 'Valid until')} <span dir="ltr">27/09/2027</span></p>
                <p className="flex items-center gap-1.5 text-xs font-black text-emerald-700 pt-1"><Signature size={14} aria-hidden />{t('موقّع رقمياً – رئيس الدائرة', 'Digitally signed – Head of department')}</p>
              </div>
              <div className="flex flex-col items-center gap-1">
                <FakeQr />
                <span className="flex items-center gap-1 text-[10px] font-black text-slate-500"><QrCode size={11} aria-hidden />{t('امسح للتحقق', 'Scan to verify')}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Sec>
  );
}

/* ------------------------------------------------------------------ */
/* Notification templates                                              */
/* ------------------------------------------------------------------ */

const TEMPLATES = [
  { id: 'submitted', ar: 'تقديم الطلب', en: 'Request submitted',
    smsAr: 'بلدية ظفار: تم استلام طلبك {{service}} برقم {{ref}}. تابع حالته عبر edm.gov.om', smsEn: 'Dhofar Municipality: your {{service}} request {{ref}} was received. Track it at edm.gov.om' },
  { id: 'info', ar: 'طلب معلومات', en: 'Information requested',
    smsAr: 'بلدية ظفار: طلبك {{ref}} يحتاج معلومات إضافية: {{note}}. يرجى الاستكمال خلال {{days}} أيام.', smsEn: 'Dhofar Municipality: request {{ref}} needs more information: {{note}}. Please complete within {{days}} days.' },
  { id: 'approved', ar: 'الاعتماد', en: 'Approved',
    smsAr: 'بلدية ظفار: تم اعتماد طلبك {{ref}}. يمكنك تنزيل {{document}} الموقّع رقمياً من حسابك.', smsEn: 'Dhofar Municipality: request {{ref}} is approved. Download your digitally signed {{document}} from your account.' },
  { id: 'rejected', ar: 'الرفض', en: 'Rejected',
    smsAr: 'بلدية ظفار: نعتذر، تم رفض طلبك {{ref}}. السبب: {{reason}}. للاستفسار 1771.', smsEn: 'Dhofar Municipality: sorry, request {{ref}} was rejected. Reason: {{reason}}. Questions: 1771.' },
  { id: 'paid', ar: 'نجاح الدفع', en: 'Payment received',
    smsAr: 'بلدية ظفار: تم استلام مبلغ {{amount}} ر.ع للطلب {{ref}}. رقم الإيصال {{receipt}}.', smsEn: 'Dhofar Municipality: payment of OMR {{amount}} for {{ref}} received. Receipt {{receipt}}.' },
];

export function NotificationsSection({ isAr, copy }: P) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const [sel, setSel] = useState(TEMPLATES[0].id);
  const tpl = TEMPLATES.find(x => x.id === sel)!;
  const sms = isAr ? tpl.smsAr : tpl.smsEn;
  const sample = sms.replace('{{service}}', t('ترخيص اللوحات الإرشادية', 'signboard licence')).replace(/{{ref}}/g, 'DM-2026-00482').replace('{{note}}', t('صورة الموقع من الجهات الأربع', 'site photos from all four sides')).replace('{{days}}', '7')
    .replace('{{document}}', t('الترخيص', 'licence')).replace('{{reason}}', t('الموقع خارج الاختصاص', 'location outside jurisdiction')).replace('{{amount}}', '15.000').replace('{{receipt}}', 'RC-88213');
  const highlighted = sms.split(/({{\w+}})/g);
  return (
    <Sec id="notifications">
      <Head id="notifications" isAr={isAr} ar="قوالب الإشعارات" en="Notification templates" descAr="صياغة موحدة لرسائل SMS والبريد الإلكتروني في كل مرحلة من مراحل الطلب. المتغيرات بين {{ }} تُعبأ تلقائياً." descEn="Consistent SMS and email wording for every request stage. Variables in {{ }} are filled automatically." />
      <div role="tablist" aria-label={t('نوع الإشعار', 'Notification type')} className="flex flex-wrap gap-2 mb-4">
        {TEMPLATES.map(x => (
          <button key={x.id} type="button" role="tab" aria-selected={sel === x.id} onClick={() => setSel(x.id)} className={cn('h-9 px-4 rounded-full text-sm font-black', sel === x.id ? 'bg-slate-900 text-white' : 'bg-white ring-1 ring-slate-200 text-slate-600')}>{isAr ? x.ar : x.en}</button>
        ))}
      </div>
      <div className="grid lg:grid-cols-[320px_1fr] gap-4">
        <Card title={t('رسالة نصية (معاينة)', 'SMS (preview)')}>
          <div className="mx-auto w-64 rounded-[2rem] bg-slate-900 p-3 shadow-xl">
            <div className="rounded-[1.5rem] bg-slate-100 p-3 min-h-56 space-y-2">
              <p className="text-center text-[10px] font-bold text-slate-400">DM-OMAN</p>
              <p className="max-w-[90%] rounded-2xl rounded-ss-sm bg-white p-3 text-[13px] leading-relaxed text-slate-800 shadow-sm">{sample}</p>
            </div>
          </div>
          <p className="text-[11px] font-bold text-slate-500 text-center">{t(`${sample.length} حرفاً`, `${sample.length} characters`)} · {t('الحد الموصى به 160', 'recommended max 160')}</p>
        </Card>
        <Card title={t('القالب والبريد الإلكتروني', 'Template & email')}>
          <div className="rounded-2xl bg-slate-950 p-4 text-sm leading-relaxed text-slate-200 font-medium">
            {highlighted.map((part, i) => /^{{\w+}}$/.test(part) ? <mark key={i} className="bg-[#03CFCB]/25 text-[#03CFCB] rounded px-1 font-mono">{part}</mark> : <span key={i}>{part}</span>)}
          </div>
          <button type="button" onClick={() => copy(sms)} className="h-9 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-black flex items-center gap-1.5"><Copy size={13} />{t('نسخ القالب', 'Copy template')}</button>
          <div className="rounded-2xl ring-1 ring-slate-200 overflow-hidden">
            <div className="bg-[#005751] text-white px-5 py-3 flex items-center gap-2 text-sm font-black"><Mail size={16} aria-hidden />{isAr ? tpl.ar : tpl.en} — {t('بلدية ظفار', 'Dhofar Municipality')}</div>
            <div className="p-5 space-y-3 text-sm text-slate-700">
              <p className="font-bold">{t('عزيزنا المستفيد،', 'Dear beneficiary,')}</p>
              <p>{sample}</p>
              <span className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-[#005751] text-white font-black text-xs">{t('عرض الطلب', 'View request')}<ArrowUpRight size={14} className={cn(isAr && '-scale-x-100')} aria-hidden /></span>
              <p className="text-[11px] text-slate-400 border-t pt-3">{t('هذه رسالة آلية، يرجى عدم الرد عليها. للاستفسار: 1771 أو info@dm.gov.om', 'This is an automated message — please do not reply. Questions: 1771 or info@dm.gov.om')}</p>
            </div>
          </div>
        </Card>
      </div>
    </Sec>
  );
}

/* ------------------------------------------------------------------ */
/* Feedback states                                                     */
/* ------------------------------------------------------------------ */

export function StatesSection({ isAr }: P) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const [toast, setToast] = useState(false);
  useEffect(() => { if (!toast) return; const id = setTimeout(() => setToast(false), 3000); return () => clearTimeout(id); }, [toast]);
  return (
    <Sec id="states">
      <Head id="states" isAr={isAr} ar="حالات الواجهة" en="Feedback states" descAr="كيف تخبر الواجهة المستخدم بما يحدث: التحميل، والفراغ، والخطأ، والنجاح، والتحقق من النماذج." descEn="How the interface tells users what is happening: loading, empty, error, success and form validation." />
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        <Card title={t('التحميل (هيكل مبدئي)', 'Loading (skeleton)')}>
          <div className="space-y-3 motion-safe:animate-pulse" aria-hidden>
            <div className="flex gap-3"><div className="size-12 rounded-2xl bg-slate-200" /><div className="flex-1 space-y-2 pt-1"><div className="h-3 w-2/3 rounded bg-slate-200" /><div className="h-3 w-1/3 rounded bg-slate-100" /></div></div>
            <div className="h-3 rounded bg-slate-100" /><div className="h-3 w-5/6 rounded bg-slate-100" />
          </div>
          <p role="status" className="flex items-center gap-2 text-xs font-bold text-slate-500"><Loader2 size={14} className="motion-safe:animate-spin" aria-hidden />{t('جارٍ تحميل الطلبات…', 'Loading requests…')}</p>
        </Card>
        <Card title={t('حالة فارغة', 'Empty state')}>
          <div className="text-center py-4 space-y-3">
            <span className="mx-auto size-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center"><Inbox size={26} aria-hidden /></span>
            <p className="font-black text-slate-900">{t('لا توجد طلبات بعد', 'No requests yet')}</p>
            <p className="text-xs font-bold text-slate-500">{t('ستظهر طلباتك هنا بعد تقديمها.', 'Your requests will appear here once submitted.')}</p>
            <span className="inline-flex h-9 px-4 rounded-xl bg-[#005751] text-white text-xs font-black items-center">{t('تصفح دليل الخدمات', 'Browse services')}</span>
          </div>
        </Card>
        <Card title={t('خطأ في الاتصال', 'Connection error')}>
          <div className="text-center py-4 space-y-3">
            <span className="mx-auto size-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center"><WifiOff size={26} aria-hidden /></span>
            <p className="font-black text-slate-900">{t('تعذر الاتصال بالخادم', 'Couldn\'t reach the server')}</p>
            <p className="text-xs font-bold text-slate-500">{t('تحقق من اتصالك ثم حاول مرة أخرى. لم يُفقد أي من بياناتك.', 'Check your connection and try again. None of your data was lost.')}</p>
            <span className="inline-flex h-9 px-4 rounded-xl ring-2 ring-slate-200 text-xs font-black items-center gap-1.5 text-slate-700"><RefreshCw size={13} aria-hidden />{t('إعادة المحاولة', 'Try again')}</span>
          </div>
        </Card>
        <Card title={t('رسائل تنبيهية', 'Banners')}>
          {[
            { I: CheckCircle2, cls: 'bg-emerald-50 border-emerald-200 text-emerald-800', ar: 'تم حفظ المسودة. يمكنك إكمالها لاحقاً.', en: 'Draft saved. You can finish it later.' },
            { I: Info, cls: 'bg-sky-50 border-sky-200 text-sky-800', ar: 'ستُجلب بياناتك من ثقة تلقائياً.', en: 'Your details will be fetched from Thiqa.' },
            { I: AlertTriangle, cls: 'bg-amber-50 border-amber-200 text-amber-900', ar: 'تنتهي صلاحية الطلب بعد 90 يوماً من إنشائه.', en: 'The request expires 90 days after it is created.' },
            { I: Ban, cls: 'bg-red-50 border-red-200 text-red-800', ar: 'الموقع خارج اختصاص البلدية.', en: 'The location is outside the municipality\'s jurisdiction.' },
          ].map(b => <p key={b.en} role="note" className={cn('flex gap-2 p-3 rounded-xl border text-xs font-bold', b.cls)}><b.I size={15} className="shrink-0" aria-hidden />{isAr ? b.ar : b.en}</p>)}
        </Card>
        <Card title={t('التحقق من النموذج', 'Form validation')}>
          <div role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 space-y-1">
            <p className="text-xs font-black text-red-800">{t('يرجى تصحيح حقلين:', 'Please fix 2 fields:')}</p>
            <ul className="text-xs font-bold text-red-700 list-disc ps-5"><li>{t('أبعاد اللوحة مطلوبة', 'Signboard dimensions are required')}</li><li>{t('رقم السجل التجاري يتكون من 7 أرقام', 'CR number must have 7 digits')}</li></ul>
          </div>
          <label className="block space-y-1">
            <span className="text-xs font-black text-slate-600">{t('رقم السجل التجاري', 'CR number')} <span className="text-red-500">*</span></span>
            <span className="flex items-center h-11 rounded-xl border-2 border-red-400 px-3 font-mono text-sm" dir="ltr">12345</span>
            <span className="flex items-center gap-1 text-xs font-bold text-red-600"><XCircle size={12} aria-hidden />{t('يجب أن يتكون من 7 أرقام', 'Must be 7 digits')}</span>
          </label>
        </Card>
        <Card title={t('إشعار منبثق', 'Toast')}>
          <button type="button" onClick={() => setToast(true)} className="h-10 px-4 rounded-xl bg-[#005751] text-white font-black text-sm">{t('اعرض الإشعار', 'Show toast')}</button>
          <div aria-live="polite" className="min-h-16">
            {toast && (
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-900 text-white shadow-2xl motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2">
                <CheckCircle2 size={18} className="text-[#03CFCB] shrink-0" aria-hidden />
                <div className="flex-1"><p className="text-sm font-black">{t('تم إرسال الطلب', 'Request sent')}</p><p className="text-xs text-white/70">DM-2026-00482</p></div>
                <button type="button" onClick={() => setToast(false)} aria-label={t('إغلاق', 'Close')}><X size={15} /></button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </Sec>
  );
}

/* ------------------------------------------------------------------ */
/* Data display                                                        */
/* ------------------------------------------------------------------ */

export function DataSection({ isAr }: P) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const [tab, setTab] = useState(0);
  const [page, setPage] = useState(1);
  const Prev = isAr ? ChevronRight : ChevronLeft, Next = isAr ? ChevronLeft : ChevronRight;
  const kpis = [
    { ar: 'طلبات هذا الشهر', en: 'Requests this month', v: '1,284', d: '+12%', up: true, icon: FileText },
    { ar: 'متوسط مدة الإنجاز', en: 'Avg. completion', v: t('2.4 يوم', '2.4 days'), d: '−0.6', up: true, icon: Clock },
    { ar: 'نسبة الرضا', en: 'Satisfaction', v: '92%', d: '+3%', up: true, icon: Users },
    { ar: 'طلبات متأخرة', en: 'Overdue', v: '17', d: '+4', up: false, icon: AlertTriangle },
  ];
  const statuses = {
    pending: { ar: 'قيد الانتظار', en: 'Pending', cls: 'bg-slate-100 text-slate-700', I: CircleDashed },
    review: { ar: 'قيد المراجعة', en: 'In review', cls: 'bg-sky-100 text-sky-700', I: FileSearch },
    info: { ar: 'مطلوب معلومات', en: 'Info requested', cls: 'bg-amber-100 text-amber-800', I: MessageSquare },
    approved: { ar: 'معتمد', en: 'Approved', cls: 'bg-emerald-100 text-emerald-700', I: Check },
    rejected: { ar: 'مرفوض', en: 'Rejected', cls: 'bg-red-100 text-red-700', I: X },
  } as const;
  const rows: { ref: string; ar: string; en: string; s: keyof typeof statuses; date: string }[] = [
    { ref: 'DM-00482', ar: 'ترخيص اللوحات الإرشادية', en: 'Signboard licensing', s: 'review', date: '28/09' },
    { ref: 'DM-00479', ar: 'ترقيم المنازل', en: 'House numbering', s: 'approved', date: '27/09' },
    { ref: 'DM-00475', ar: 'طلب إتلاف المواد الغذائية', en: 'Food destruction', s: 'info', date: '27/09' },
    { ref: 'DM-00471', ar: 'تسمية المباني', en: 'Building naming', s: 'pending', date: '26/09' },
    { ref: 'DM-00468', ar: 'تصريح حفر أو شق الطرق', en: 'Road cutting permit', s: 'rejected', date: '25/09' },
  ];
  return (
    <Sec id="data">
      <Head id="data" isAr={isAr} ar="عرض البيانات" en="Data display" descAr="بطاقات المؤشرات، والجداول، وشارات الحالة، والتبويبات، والتنقل بين الصفحات لشاشات الموظفين ولوحات المتابعة." descEn="KPI cards, tables, status badges, tabs and pagination for staff screens and dashboards." />
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
        {kpis.map(k => (
          <div key={k.en} className="bg-white rounded-2xl ring-1 ring-slate-200 p-4 space-y-2">
            <div className="flex items-center justify-between"><span className="text-xs font-bold text-slate-500">{isAr ? k.ar : k.en}</span><k.icon size={16} className="text-slate-400" aria-hidden /></div>
            <p className="text-2xl font-black text-slate-900 tabular-nums">{k.v}</p>
            <p className={cn('flex items-center gap-1 text-xs font-black', k.up ? 'text-emerald-600' : 'text-red-600')}>{k.up ? <TrendingUp size={13} aria-hidden /> : <TrendingDown size={13} aria-hidden />}<span dir="ltr">{k.d}</span> {t('عن الشهر الماضي', 'vs last month')}</p>
          </div>
        ))}
      </div>
      <Card>
        <div role="tablist" aria-label={t('تصفية الطلبات', 'Filter requests')} className="flex gap-1 border-b">
          {[t('الكل', 'All'), t('بانتظاري', 'Assigned to me'), t('مكتملة', 'Completed')].map((l, i) => (
            <button key={l} type="button" role="tab" aria-selected={tab === i} onClick={() => setTab(i)} className={cn('px-4 h-10 -mb-px border-b-2 text-sm font-black', tab === i ? 'border-[#005751] text-[#005751]' : 'border-transparent text-slate-500 hover:text-slate-800')}>{l}</button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">{t('نموذج جدول الطلبات', 'Sample requests table')}</caption>
            <thead><tr className="text-xs font-black text-slate-500">
              <th scope="col" className="p-3 text-start">{t('الرقم', 'Ref')}</th><th scope="col" className="p-3 text-start">{t('الخدمة', 'Service')}</th>
              <th scope="col" className="p-3 text-start">{t('الحالة', 'Status')}</th><th scope="col" className="p-3 text-start">{t('التاريخ', 'Date')}</th><th className="p-3"><span className="sr-only">{t('إجراءات', 'Actions')}</span></th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map(r => {
                const s = statuses[r.s];
                return (
                  <tr key={r.ref} className="hover:bg-slate-50">
                    <td className="p-3 font-mono text-xs font-bold text-slate-500" dir="ltr">{r.ref}</td>
                    <td className="p-3 font-bold text-slate-800">{isAr ? r.ar : r.en}</td>
                    <td className="p-3"><span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black', s.cls)}><s.I size={12} aria-hidden />{isAr ? s.ar : s.en}</span></td>
                    <td className="p-3 text-slate-500 font-bold tabular-nums" dir="ltr">{r.date}</td>
                    <td className="p-3 text-end"><span className="inline-flex items-center gap-1 text-xs font-black text-[#005751]">{t('فتح', 'Open')}<ArrowUpRight size={13} className={cn(isAr && '-scale-x-100')} aria-hidden /></span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <nav aria-label={t('التنقل بين الصفحات', 'Pagination')} className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500">{t(`عرض 1–5 من 42`, 'Showing 1–5 of 42')}</span>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="size-9 rounded-lg ring-1 ring-slate-200 flex items-center justify-center disabled:opacity-30" aria-label={t('السابق', 'Previous')}><Prev size={15} /></button>
            {[1, 2, 3].map(n => <button key={n} type="button" onClick={() => setPage(n)} aria-current={page === n ? 'page' : undefined} className={cn('size-9 rounded-lg text-sm font-black', page === n ? 'bg-[#005751] text-white' : 'ring-1 ring-slate-200 text-slate-600')}>{n}</button>)}
            <span className="px-1 text-slate-400">…</span>
            <button type="button" onClick={() => setPage(p => Math.min(9, p + 1))} className="size-9 rounded-lg ring-1 ring-slate-200 flex items-center justify-center" aria-label={t('التالي', 'Next')}><Next size={15} /></button>
          </div>
        </nav>
      </Card>
    </Sec>
  );
}

/* ------------------------------------------------------------------ */
/* Voice & tone                                                        */
/* ------------------------------------------------------------------ */

export function VoiceSection({ isAr }: P) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const principles = [
    { icon: User, ar: 'خاطب المستفيد مباشرة', en: 'Speak to the person', dAr: 'استخدم «أنت» و«طلبك» بدلاً من «المستفيد» و«الطلب المذكور».', dEn: 'Use "you" and "your request", not "the beneficiary" or "the said request".' },
    { icon: Check, ar: 'ابدأ بالأهم', en: 'Lead with what matters', dAr: 'اذكر النتيجة أو الإجراء المطلوب في أول جملة.', dEn: 'Put the outcome or the required action in the first sentence.' },
    { icon: MessageSquare, ar: 'بسيط ورسمي', en: 'Plain and official', dAr: 'جمل قصيرة بلغة عربية فصحى سهلة، دون مصطلحات تقنية.', dEn: 'Short sentences in clear Modern Standard Arabic, without technical jargon.' },
    { icon: ShieldCheck, ar: 'طمئن وأرشد', en: 'Reassure and guide', dAr: 'عند الخطأ، اشرح ما حدث وما الخطوة التالية دون لوم المستخدم.', dEn: 'When something fails, say what happened and what to do next — never blame the user.' },
  ];
  const pairs = [
    { bad: { ar: 'حدث خطأ غير متوقع (Error 500).', en: 'An unexpected error occurred (Error 500).' }, good: { ar: 'تعذر حفظ طلبك الآن. لم تُفقد بياناتك؛ حاول مرة أخرى بعد قليل.', en: 'We couldn\'t save your request just now. Your data is safe — please try again shortly.' } },
    { bad: { ar: 'يتوجب على المستفيد إرفاق كافة المستندات المطلوبة.', en: 'The beneficiary must attach all required documents.' }, good: { ar: 'أرفق صورة الموقع من الجهات الأربع لإكمال طلبك.', en: 'Attach site photos from all four sides to complete your request.' } },
    { bad: { ar: 'تم رفض الطلب.', en: 'Request rejected.' }, good: { ar: 'لم نتمكن من اعتماد طلبك لأن الموقع خارج اختصاص البلدية. يمكنك التواصل على 1771.', en: 'We couldn\'t approve your request because the location is outside our jurisdiction. Call 1771 for help.' } },
  ];
  return (
    <Sec id="voice">
      <Head id="voice" isAr={isAr} ar="أسلوب الكتابة" en="Voice & tone" descAr="كيف تتحدث البلدية في واجهاتها ورسائلها: واضحة، ومحترمة، ومفيدة." descEn="How the municipality speaks in its interfaces and messages: clear, respectful and helpful." />
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-4">
        {principles.map(p => (
          <div key={p.en} className="bg-white rounded-2xl ring-1 ring-slate-200 p-4 space-y-2">
            <span className="size-9 rounded-xl bg-[#470D67]/10 text-[#470D67] flex items-center justify-center"><p.icon size={17} aria-hidden /></span>
            <p className="font-black text-slate-900">{isAr ? p.ar : p.en}</p>
            <p className="text-xs font-medium text-slate-600 leading-relaxed">{isAr ? p.dAr : p.dEn}</p>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {pairs.map(x => (
          <div key={x.bad.en} className="grid md:grid-cols-2 gap-3">
            <Do ok={false} isAr={isAr}><p className="text-sm font-bold text-slate-700">{isAr ? x.bad.ar : x.bad.en}</p></Do>
            <Do ok isAr={isAr}><p className="text-sm font-bold text-slate-700">{isAr ? x.good.ar : x.good.en}</p></Do>
          </div>
        ))}
      </div>
    </Sec>
  );
}
