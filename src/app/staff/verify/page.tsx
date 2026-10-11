'use client';

/*
 * Staff tool: check a document a beneficiary presents. The number printed on the document (or the
 * link in its QR code) is looked up in the portal's requests: an approved request is a valid
 * document. Read-only.
 */

import React, { useEffect, useState } from 'react';
import { BadgeCheck, CircleX, Clock, Loader2, ScanLine, Search } from 'lucide-react';
import { useSettingsStore } from '@/lib/settings-store';
import { fetchBin } from '@/lib/jsonbin';
import { ServiceApplication } from '@/lib/types';
import { STATUS_INFO, statusOf } from '@/lib/citizen-account';
import { StaffShell, useStaffPortal } from '@/components/staff/staff-shell';
import { cn } from '@/lib/utils';

/** Accepts the document number, or the whole link from the QR code (…/track?ref=NUMBER) */
function refFrom(input: string) {
  const raw = input.trim();
  const m = /[?&]ref=([^&#\s]+)/i.exec(raw);
  return decodeURIComponent(m ? m[1] : raw).trim().toUpperCase();
}

type Result = { ref: string; app: ServiceApplication | null };
const PENDING = 'dm-verify-ref';

export default function VerifyDocumentPage() {
  const isAr = useSettingsStore(s => s.language) === 'ar';
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const { user, loading } = useStaffPortal({ requireAuth: true });
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => { document.title = `${t('التحقق من وثيقة', 'Verify a document')} | ${t('بوابة الموظف', 'Staff portal')}`; }, [isAr]); // eslint-disable-line react-hooks/exhaustive-deps
  // A QR code scanned with the phone camera can open this page directly: /staff/verify?ref=…
  // The number is kept across the staff sign-in redirect, then checked once the employee is in
  useEffect(() => {
    const r = new URLSearchParams(window.location.search).get('ref');
    if (r) { try { sessionStorage.setItem(PENDING, r); } catch { /* storage blocked */ } }
  }, []);
  useEffect(() => {
    if (!user) return;
    let r: string | null = null;
    try { r = sessionStorage.getItem(PENDING); sessionStorage.removeItem(PENDING); } catch { /* storage blocked */ }
    if (r) { setValue(r); void check(r); }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  async function check(input: string) {
    const ref = refFrom(input);
    if (!ref) return;
    setBusy(true); setError(false);
    try {
      const db = await fetchBin();
      const app = ((db.applications || []) as ServiceApplication[]).find(a => a.id.toUpperCase() === ref) || null;
      setResult({ ref, app });
    } catch { setError(true); } finally { setBusy(false); }
  }

  if (loading || !user) return <div className="h-screen flex items-center justify-center" role="status"><Loader2 className="animate-spin text-slate-400" /></div>;

  const app = result?.app, status = app ? statusOf(app.status) : null;
  const valid = status === 'approved';
  const date = (iso: string) => new Date(iso).toLocaleDateString(isAr ? 'ar-OM' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const issued = app ? app.history?.filter(h => h.action === 'approve').pop()?.at || app.createdAt : '';

  return (
    <StaffShell user={user}>
      <div className="mx-auto max-w-2xl px-4 py-10 space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-black text-slate-900"><ScanLine size={28} className="text-[#008E91]" aria-hidden />{t('التحقق من وثيقة', 'Verify a document')}</h1>
          <p className="mt-1 font-bold text-slate-500">{t('أدخل رقم الوثيقة المطبوع عليها، أو الصق الرابط الذي يفتحه رمز الاستجابة السريعة.', 'Enter the number printed on the document, or paste the link its QR code opens.')}</p>
        </div>
        <form onSubmit={e => { e.preventDefault(); void check(value); }} className="flex gap-2">
          <label className="relative flex-1">
            <span className="sr-only">{t('رقم الوثيقة أو رابط الرمز', 'Document number or QR link')}</span>
            <Search size={18} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
            <input value={value} onChange={e => setValue(e.target.value)} dir="ltr" placeholder="DM-2026-00482" autoComplete="off"
              className="h-12 w-full rounded-xl border border-slate-300 bg-white ps-10 pe-3 font-bold outline-none focus:border-[#008E91] focus:ring-2 focus:ring-[#03CFCB]/40" />
          </label>
          <button type="submit" disabled={!value.trim() || busy} className="h-12 px-6 rounded-xl bg-[#005751] font-black text-white disabled:opacity-40 flex items-center gap-2">
            {busy && <Loader2 size={16} className="animate-spin" aria-hidden />}{t('تحقق', 'Verify')}
          </button>
        </form>

        <div aria-live="polite">
          {error && <p role="alert" className="rounded-2xl bg-amber-50 p-4 font-bold text-amber-900 ring-1 ring-amber-200">{t('تعذّر الاتصال بقاعدة البيانات. حاول مرة أخرى.', 'The database is unreachable. Try again.')}</p>}
          {result && !error && (
            <div className={cn('rounded-3xl p-6 ring-2 space-y-4', valid ? 'bg-emerald-50 ring-emerald-300' : app ? 'bg-amber-50 ring-amber-300' : 'bg-red-50 ring-red-300')}>
              <p className={cn('flex items-center gap-3 text-2xl font-black', valid ? 'text-emerald-800' : app ? 'text-amber-900' : 'text-red-800')}>
                {valid ? <BadgeCheck size={32} aria-hidden /> : app ? <Clock size={32} aria-hidden /> : <CircleX size={32} aria-hidden />}
                {valid ? t('وثيقة صحيحة', 'Valid document') : app ? t('لم تصدر الوثيقة بعد', 'Not issued yet') : t('غير موجودة في السجلات', 'Not found in the records')}
              </p>
              {app ? (
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div><dt className="font-bold text-slate-500">{t('رقم الوثيقة', 'Document number')}</dt><dd className="font-black text-slate-900" dir="ltr">{app.id}</dd></div>
                  <div><dt className="font-bold text-slate-500">{t('الخدمة', 'Service')}</dt><dd className="font-black text-slate-900">{app.serviceName}</dd></div>
                  <div><dt className="font-bold text-slate-500">{t('صاحب الوثيقة', 'Holder')}</dt><dd className="font-black text-slate-900">{app.capacityName || app.citizenName}</dd></div>
                  <div><dt className="font-bold text-slate-500">{t('الحالة', 'Status')}</dt><dd className="font-black text-slate-900">{isAr ? STATUS_INFO[status!].ar : STATUS_INFO[status!].en}</dd></div>
                  <div><dt className="font-bold text-slate-500">{valid ? t('تاريخ الإصدار', 'Issued') : t('تاريخ التقديم', 'Submitted')}</dt><dd className="font-black text-slate-900">{date(valid ? issued : app.createdAt)}</dd></div>
                </dl>
              ) : (
                <p className="font-bold text-red-900">{t('لا يوجد طلب أو وثيقة بالرقم ', 'No request or document has the number ')}<span dir="ltr" className="font-black">{result.ref}</span>{t('. تأكد من الرقم، وإن تكرر ذلك فلا تعتمد الوثيقة.', '. Check the number; if it still fails, do not accept the document.')}</p>
              )}
              {app && !valid && <p className="text-sm font-bold text-amber-900">{t('الطلب موجود لكنه لم يُعتمد، فلا تُعد الوثيقة صادرة.', 'The request exists but is not approved, so no document has been issued.')}</p>}
            </div>
          )}
        </div>
      </div>
    </StaffShell>
  );
}
