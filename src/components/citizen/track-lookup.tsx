'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Circle, Fingerprint, Loader2, Search, XCircle } from 'lucide-react';
import { fetchBin } from '@/lib/jsonbin';
import { Service, ServiceApplication } from '@/lib/types';
import { STATUS_INFO, findApplication, normalizeReference } from '@/lib/service-visibility';
import { buildServiceGuide } from '@/lib/service-guide';
import { useCitizen, useCitizenSession } from '@/lib/citizen-session';
import { cn } from '@/lib/utils';

type Lookup =
  | { state: 'idle' | 'loading' | 'invalid' | 'notfound' | 'error' }
  | { state: 'found'; app: ServiceApplication; service: Service | null };

const EVENT_LABEL: Record<string, { ar: string; en: string }> = {
  review: { ar: 'بدأت المراجعة', en: 'Review started' },
  request_info: { ar: 'مطلوب معلومات إضافية منك', en: 'More information needed from you' },
  approve: { ar: 'تمت الموافقة', en: 'Approved' },
  reject: { ar: 'تم الرفض', en: 'Rejected' },
  note: { ar: 'تحديث على الطلب', en: 'Update on the request' },
};

const fmt = (iso: string, isAr: boolean) => {
  try { return new Date(iso).toLocaleString(isAr ? 'ar-OM' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }); } catch { return iso; }
};

/**
 * Transaction status by number (e.g. SL-00482). Needs a Thiqa sign-in; a request filed from
 * another phone number is reported as not found, so numbers can't be used to look up others' requests.
 */
export function TrackLookup({ isAr, initialRef = '', compact = false, autoSubmit = false }: { isAr: boolean; initialRef?: string; compact?: boolean; autoSubmit?: boolean }) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const citizen = useCitizen();
  const [ref, setRef] = useState(initialRef);
  const [result, setResult] = useState<Lookup>({ state: 'idle' });
  const inputId = compact ? 'track-ref-compact' : 'track-ref';

  const run = useCallback(async (value: string) => {
    const normalized = normalizeReference(value);
    if (!normalized) { setResult({ state: 'invalid' }); return; }
    if (!citizen) { useCitizenSession.getState().openPrompt(`/track?ref=${encodeURIComponent(normalized)}`); return; }
    setResult({ state: 'loading' });
    try {
      const db = await fetchBin();
      const app = findApplication(db.applications || [], normalized);
      if (!app || (app.applicantPhone && app.applicantPhone !== citizen)) { setResult({ state: 'notfound' }); return; }
      setResult({ state: 'found', app, service: (db.services || []).find((s: Service) => s.id === app.serviceId) || null });
    } catch { setResult({ state: 'error' }); }
  }, [citizen]);

  useEffect(() => { if (autoSubmit && initialRef && citizen) run(initialRef); }, [autoSubmit, initialRef, citizen, run]);

  return (
    <div className="space-y-4">
      <form onSubmit={e => { e.preventDefault(); run(ref); }} className="space-y-2" noValidate>
        <label htmlFor={inputId} className={cn('block font-black text-slate-700', compact ? 'text-sm' : 'text-base')}>{t('رقم المعاملة', 'Transaction number')}</label>
        <div className="flex gap-2">
          <input id={inputId} value={ref} onChange={e => { setRef(e.target.value.toUpperCase()); if (result.state !== 'idle') setResult({ state: 'idle' }); }}
            placeholder="SL-00482" dir="ltr" autoComplete="off" spellCheck={false}
            aria-describedby={`${inputId}-hint`} aria-invalid={result.state === 'invalid'}
            className="min-w-0 flex-1 h-12 rounded-xl border-2 border-slate-200 bg-white px-4 font-mono text-lg font-black tracking-wider uppercase outline-none focus:border-[#008E91]" />
          <button type="submit" disabled={!ref.trim() || result.state === 'loading'} className="shrink-0 h-12 px-5 rounded-xl bg-[#005751] text-white font-black flex items-center gap-2 disabled:opacity-40">
            {result.state === 'loading' ? <Loader2 size={18} className="animate-spin" /> : citizen ? <Search size={18} aria-hidden /> : <Fingerprint size={18} aria-hidden />}
            <span className={cn(compact && 'sr-only sm:not-sr-only')}>{t('استعلام', 'Check')}</span>
          </button>
        </div>
        <p id={`${inputId}-hint`} className="text-xs font-bold text-slate-500">
          {t('أول حرفين يدلان على نوع الخدمة، ثم رقم المعاملة.', 'The first two letters show the service type, then the request number.')}
          {!citizen && ` ${t('يلزم تسجيل الدخول عبر ثقة.', 'Thiqa sign-in required.')}`}
        </p>
      </form>

      <div aria-live="polite">
        {result.state === 'invalid' && <Notice tone="warn">{t('صيغة الرقم غير صحيحة. اكتب حرفين ثم الأرقام، مثل SL-00482.', 'That number format is not valid. Type two letters then digits, e.g. SL-00482.')}</Notice>}
        {result.state === 'notfound' && <Notice tone="warn">{t('لم نجد معاملة بهذا الرقم مرتبطة بحسابك. تأكد من الرقم وحاول مرة أخرى.', 'No request with this number is linked to your account. Check the number and try again.')}</Notice>}
        {result.state === 'error' && <Notice tone="warn">{t('تعذّر الاستعلام الآن. حاول بعد قليل.', 'We could not check right now. Try again shortly.')}</Notice>}
        {result.state === 'found' && <TrackResult app={result.app} service={result.service} isAr={isAr} compact={compact} />}
      </div>
    </div>
  );
}

function Notice({ tone, children }: { tone: 'warn'; children: React.ReactNode }) {
  return <p role="alert" className={cn('flex gap-2 p-3 rounded-xl text-sm font-bold', tone === 'warn' && 'bg-amber-50 text-amber-900')}><AlertTriangle size={16} className="shrink-0 mt-0.5" aria-hidden />{children}</p>;
}

export function TrackResult({ app, service, isAr, compact }: { app: ServiceApplication; service: Service | null; isAr: boolean; compact?: boolean }) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const info = STATUS_INFO[app.status] || STATUS_INFO.pending;
  const duration = service ? buildServiceGuide(service, null, isAr).duration : null;
  const needsInfo = app.status !== 'approved' && app.status !== 'rejected' && app.history?.at(-1)?.action === 'request_info';
  const stages = [
    { ar: 'تم الاستلام', en: 'Received', done: true },
    { ar: 'قيد المراجعة', en: 'Under review', done: info.step >= 2 },
    { ar: app.status === 'rejected' ? 'مرفوضة' : 'مكتملة', en: app.status === 'rejected' ? 'Rejected' : 'Completed', done: info.step >= 3 },
  ];
  const serviceName = service ? (isAr ? service.title : service.titleEn || service.title) : app.serviceName;

  return (
    <div className="rounded-2xl bg-white ring-1 ring-slate-200 p-4 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p dir="ltr" className="font-mono font-black text-lg text-slate-900 text-start">{app.id}</p>
          <p className="text-sm font-bold text-slate-600">{serviceName}</p>
        </div>
        <span className={cn('px-3 py-1 rounded-full text-xs font-black', info.tone)}>{isAr ? info.ar : info.en}</span>
      </div>

      <ol className="grid grid-cols-3 gap-1" aria-label={t('مراحل الطلب', 'Request stages')}>
        {stages.map((s, i) => (
          <li key={i} className="flex flex-col items-center text-center gap-1">
            {s.done
              ? (app.status === 'rejected' && i === 2 ? <XCircle size={22} className="text-red-600" aria-hidden /> : <CheckCircle2 size={22} className="text-emerald-600" aria-hidden />)
              : <Circle size={22} className="text-slate-300" aria-hidden />}
            <span className={cn('text-[11px] font-black', s.done ? 'text-slate-800' : 'text-slate-400')}>{isAr ? s.ar : s.en}<span className="sr-only">{s.done ? t(' (تمت)', ' (done)') : t(' (لم تتم بعد)', ' (not yet)')}</span></span>
          </li>
        ))}
      </ol>

      {needsInfo && (
        <p className="flex gap-2 p-3 rounded-xl bg-amber-50 text-sm font-bold text-amber-900"><AlertTriangle size={16} className="shrink-0 mt-0.5" aria-hidden />{t('مطلوب منك معلومات إضافية لاستكمال الطلب.', 'We need more information from you to continue.')}{app.history?.at(-1)?.note ? ` — ${app.history.at(-1)!.note}` : ''}</p>
      )}

      <dl className="grid grid-cols-2 gap-2 text-xs">
        <div><dt className="font-bold text-slate-400">{t('تاريخ التقديم', 'Submitted')}</dt><dd className="font-black text-slate-700">{fmt(app.createdAt, isAr)}</dd></div>
        {duration && <div><dt className="font-bold text-slate-400">{t('المدة التقديرية', 'Estimated time')}</dt><dd className="font-black text-slate-700">{duration}</dd></div>}
      </dl>

      {!compact && !!app.history?.length && (
        <ol className="border-s-2 border-slate-200 ms-2 space-y-2">
          {[...app.history].reverse().map((h, i) => (
            <li key={i} className="ps-4">
              <p className="text-sm font-black text-slate-800">{isAr ? EVENT_LABEL[h.action]?.ar : EVENT_LABEL[h.action]?.en}</p>
              <p className="text-[11px] font-bold text-slate-400">{fmt(h.at, isAr)}</p>
            </li>
          ))}
        </ol>
      )}
      {service && <Link href={`/services/${service.id}`} className="inline-block text-xs font-black text-[#005751] hover:underline">{t('دليل الخدمة', 'Service guide')}</Link>}
    </div>
  );
}
