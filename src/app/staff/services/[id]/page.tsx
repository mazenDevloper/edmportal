'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowRight, CheckCircle2, ChevronDown, ChevronUp, Clock, Eye, Loader2, Lock, MessageSquareWarning, ShieldCheck, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useSettingsStore } from '@/lib/settings-store';
import { fetchBin, updateBin } from '@/lib/jsonbin';
import { useToast } from '@/hooks/use-toast';
import { classifyActor, getStageHandlers, getUserRoles, hasServicePermission } from '@/lib/rbac';
import { ApplicationEvent, RolePermission, ServiceApplication } from '@/lib/types';
import { StaffShell, useStaffPortal } from '@/components/staff/staff-shell';
import { ServiceIcon } from '@/components/service/service-icon';
import { RoleScreens } from '@/components/flow/role-screens';
import { attachPdfBlueprints } from '@/lib/flow-blueprints';
import { cn } from '@/lib/utils';

const STATUS: Record<ServiceApplication['status'], { ar: string; en: string; cls: string }> = {
  pending: { ar: 'جديد', en: 'New', cls: 'bg-amber-500' },
  'in-review': { ar: 'قيد المراجعة', en: 'In review', cls: 'bg-blue-500' },
  approved: { ar: 'معتمد', en: 'Approved', cls: 'bg-emerald-600' },
  rejected: { ar: 'مرفوض', en: 'Rejected', cls: 'bg-red-500' },
};

type Action = { id: ApplicationEvent['action']; perm: RolePermission; status?: ServiceApplication['status']; ar: string; en: string; noteRequired?: boolean; icon: React.ReactNode; tone: string };
const ACTIONS: Action[] = [
  { id: 'review', perm: 'review', status: 'in-review', ar: 'بدء المراجعة', en: 'Start review', icon: <Eye size={15} />, tone: 'bg-blue-600 hover:bg-blue-700 text-white' },
  { id: 'request_info', perm: 'request_info', status: 'in-review', ar: 'طلب معلومات إضافية', en: 'Request more info', noteRequired: true, icon: <MessageSquareWarning size={15} />, tone: 'bg-amber-500 hover:bg-amber-600 text-white' },
  { id: 'approve', perm: 'approve', status: 'approved', ar: 'اعتماد', en: 'Approve', icon: <CheckCircle2 size={15} />, tone: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
  { id: 'reject', perm: 'reject', status: 'rejected', ar: 'رفض', en: 'Reject', noteRequired: true, icon: <XCircle size={15} />, tone: 'bg-red-600 hover:bg-red-700 text-white' },
];

export default function StaffServiceInbox() {
  const { id } = useParams<{ id: string }>();
  const { language } = useSettingsStore();
  const isAr = language === 'ar';
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const { toast } = useToast();
  const { data, user, loading, setData } = useStaffPortal();
  const [filter, setFilter] = useState<'open' | 'all' | ServiceApplication['status']>('open');
  const [openId, setOpenId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const service = data?.services.find(s => s.id === id);
  const flow = data?.flows.find(f => f.serviceId === id);
  const can = (p: RolePermission) => !!(data && user && hasServicePermission(data.access, user.id, id, p));
  const roles = data && user ? getUserRoles(data.access, user.id, id) : [];

  const apps = useMemo(() => (data?.applications || []).filter(a => a.serviceId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [data, id]);
  const visible = apps.filter(a => filter === 'all' ? true : filter === 'open' ? a.status === 'pending' || a.status === 'in-review' : a.status === filter);
  const fieldLabel = (key: string) => {
    const f = flow?.steps.flatMap(s => s.fields).find(x => x.id === key);
    if (key === '__crNumber') return t('رقم السجل التجاري', 'CR number');
    return f ? (isAr ? f.labelAr : f.labelEn || f.labelAr) : key;
  };
  const staffStages = (flow?.processStages || []).filter(s => classifyActor(s) === 'staff');

  const act = async (app: ServiceApplication, action: Action) => {
    if (!user || !data) return;
    // Permission is re-checked at the moment of acting, not only when rendering
    if (!hasServicePermission(data.access, user.id, id, action.perm)) {
      toast({ variant: 'destructive', title: t('لا تملك هذه الصلاحية', 'You do not have this permission') });
      return;
    }
    const note = (notes[app.id] || '').trim();
    if (action.noteRequired && !note) {
      toast({ variant: 'destructive', title: t('اكتب ملاحظة توضح السبب', 'Add a note explaining why') });
      return;
    }
    setBusy(`${app.id}:${action.id}`);
    try {
      const db = await fetchBin();
      const event: ApplicationEvent = { at: new Date().toISOString(), byUserId: user.id, byEmployeeNumber: user.employeeNumber, action: action.id, ...(note ? { note } : {}) };
      let updated: ServiceApplication | null = null;
      const applications = (db.applications || []).map((a: ServiceApplication) => {
        if (a.id !== app.id) return a;
        updated = { ...a, status: action.status || a.status, history: [...(a.history || []), event] };
        return updated;
      });
      if (!updated) throw new Error('missing');
      await updateBin({ ...db, applications });
      setData(prev => prev && { ...prev, applications });
      setNotes(n => ({ ...n, [app.id]: '' }));
      toast({ title: t(`تم: ${action.ar}`, `Done: ${action.en}`) });
    } catch {
      toast({ variant: 'destructive', title: t('تعذر حفظ الإجراء', 'Could not save the action') });
    } finally { setBusy(null); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center" role="status"><Loader2 className="animate-spin text-[#0f9e9b]" size={36} /></div>;

  // No role in this service (and not a super admin): nothing is shown
  if (!can('view')) {
    return (
      <StaffShell user={user}>
        <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
          <Lock className="mx-auto text-slate-300" size={48} />
          <h1 className="text-2xl font-black text-slate-700">{t('لا تملك صلاحية على هذه الخدمة', "You don't have access to this service")}</h1>
          <p className="font-bold text-slate-400">{t('تواصل مع مدير النظام إذا كنت تحتاج هذه الصلاحية.', 'Contact the system administrator if you need access.')}</p>
          <Link href="/staff" className="inline-flex h-11 px-6 items-center rounded-xl bg-secondary text-white font-black">{t('العودة للبوابة', 'Back to the portal')}</Link>
        </div>
      </StaffShell>
    );
  }

  return (
    <StaffShell user={user}>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <Link href="/staff" className="inline-flex items-center gap-2 text-sm font-black text-slate-500 hover:text-secondary">
          <ArrowRight size={16} className={cn(!isAr && 'rotate-180')} />{t('بوابة الموظف', 'Staff portal')}
        </Link>

        <header className="rounded-[2rem] bg-white ring-1 ring-slate-100 shadow-sm p-6 flex flex-wrap items-center gap-5">
          <span className="size-14 rounded-2xl bg-[#03CFCB]/10 text-[#008E91] flex items-center justify-center"><ServiceIcon service={service} size={28} /></span>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-black text-secondary">{isAr ? service?.title : service?.titleEn || service?.title}</h1>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {user!.isSuperAdmin
                ? <Badge className="bg-red-500 gap-1"><ShieldCheck size={12} />{t('صلاحية كاملة', 'Full access')}</Badge>
                : roles.map(r => <Badge key={r.id} variant="outline" className="font-black border-[#0f9e9b]/40 text-[#005751]">{isAr ? r.nameAr : r.nameEn}</Badge>)}
            </div>
          </div>
        </header>

        {staffStages.length > 0 && (
          <section aria-label={t('مراحل المعالجة', 'Processing stages')} className="rounded-2xl bg-white ring-1 ring-slate-100 p-4">
            <p className="text-xs font-black text-slate-400 mb-2">{t('مراحل المعالجة — المظللة مسندة إليك', 'Processing stages — highlighted ones are yours')}</p>
            <ol className="flex flex-wrap gap-2">
              {staffStages.map(s => {
                const mine = getStageHandlers(data!.access, s).some(u => u.id === user!.id);
                return <li key={s.order} className={cn('px-3 py-1.5 rounded-xl text-xs font-bold border', mine ? 'bg-[#03CFCB]/10 border-[#03CFCB] text-[#005751]' : 'bg-slate-50 border-slate-100 text-slate-500')}><span className="font-black">{s.order}.</span> {isAr ? s.titleAr : s.titleEn}</li>;
              })}
            </ol>
          </section>
        )}

        {flow && (
          <details className="rounded-2xl bg-white ring-1 ring-slate-100 p-4 group">
            <summary className="cursor-pointer font-black text-slate-800">{t('خطوات عملي وشاشاتي في هذه الخدمة', 'My steps and screens in this service')} <span className="text-xs font-bold text-slate-400">{t('— حسب مخطط المسار', '— from the flow diagram')}</span></summary>
            <div className="mt-4"><RoleScreens flow={attachPdfBlueprints([flow])[0]} isAr={isAr} mineRoleIds={roles.map(r => r.id)} /></div>
          </details>
        )}

        <div role="tablist" aria-label={t('تصفية الطلبات', 'Filter requests')} className="flex flex-wrap gap-2">
          {([['open', t('مفتوحة', 'Open')], ['all', t('الكل', 'All')], ['approved', STATUS.approved[isAr ? 'ar' : 'en']], ['rejected', STATUS.rejected[isAr ? 'ar' : 'en']]] as const).map(([k, label]) => {
            const count = k === 'all' ? apps.length : k === 'open' ? apps.filter(a => a.status === 'pending' || a.status === 'in-review').length : apps.filter(a => a.status === k).length;
            return (
              <button key={k} type="button" role="tab" aria-selected={filter === k} onClick={() => setFilter(k)}
                className={cn('h-10 px-4 rounded-xl text-sm font-black flex items-center gap-2', filter === k ? 'bg-secondary text-white' : 'bg-white ring-1 ring-slate-200 text-slate-600')}>
                {label}<span className={cn('text-[11px] rounded-md px-1.5', filter === k ? 'bg-white/20' : 'bg-slate-100')}>{count}</span>
              </button>
            );
          })}
        </div>

        {visible.length === 0 ? (
          <p className="rounded-3xl bg-white ring-1 ring-slate-100 p-12 text-center font-bold text-slate-400">{t('لا توجد طلبات هنا.', 'No requests here.')}</p>
        ) : (
          <ul className="space-y-3">
            {visible.map(app => {
              const open = openId === app.id;
              const allowed = ACTIONS.filter(a => can(a.perm) && app.status !== 'approved' && app.status !== 'rejected' && !(a.id === 'review' && app.status === 'in-review'));
              return (
                <li key={app.id} className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm overflow-hidden">
                  <button type="button" onClick={() => setOpenId(open ? null : app.id)} aria-expanded={open} className="w-full flex flex-wrap items-center gap-4 p-4 text-start hover:bg-slate-50">
                    <span className="font-mono text-xs text-slate-500" dir="ltr">{app.id}</span>
                    <span className="font-black text-slate-800 flex-1 min-w-[140px]">{app.citizenName}</span>
                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><Clock size={13} />{new Date(app.createdAt).toLocaleDateString(isAr ? 'ar-OM' : 'en-GB')}</span>
                    <Badge className={STATUS[app.status].cls}>{STATUS[app.status][isAr ? 'ar' : 'en']}</Badge>
                    {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {open && (
                    <div className="border-t p-5 grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <p className="text-xs font-black text-slate-400">{t('بيانات الطلب', 'Request data')}</p>
                        <dl className="space-y-1.5">
                          {Object.entries(app.data || {}).map(([k, v]) => (
                            <div key={k} className="flex gap-3 text-sm"><dt className="font-bold text-slate-500 min-w-[150px]">{fieldLabel(k)}</dt><dd className="font-mono text-slate-800 break-all">{String(v)}</dd></div>
                          ))}
                        </dl>
                        {(app.history || []).length > 0 && (
                          <div className="pt-3 space-y-1.5">
                            <p className="text-xs font-black text-slate-400">{t('سجل الإجراءات', 'Action history')}</p>
                            <ol className="space-y-1">
                              {app.history!.map((h, i) => {
                                const a = ACTIONS.find(x => x.id === h.action);
                                return <li key={i} className="text-xs font-bold text-slate-600">{new Date(h.at).toLocaleString(isAr ? 'ar-OM' : 'en-GB')} — {a ? (isAr ? a.ar : a.en) : h.action} · <span className="font-mono">{h.byEmployeeNumber}</span>{h.note && <span className="block text-slate-500 font-medium ps-3">“{h.note}”</span>}</li>;
                              })}
                            </ol>
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        <p className="text-xs font-black text-slate-400">{t('الإجراءات المتاحة لك', 'Actions available to you')}</p>
                        {allowed.length === 0 ? (
                          <p className="text-sm font-bold text-slate-400">{app.status === 'approved' || app.status === 'rejected' ? t('الطلب مغلق.', 'This request is closed.') : t('صلاحياتك في هذه الخدمة للعرض فقط.', 'Your role on this service is view-only.')}</p>
                        ) : (
                          <>
                            <label htmlFor={`note-${app.id}`} className="sr-only">{t('ملاحظة', 'Note')}</label>
                            <Textarea id={`note-${app.id}`} value={notes[app.id] || ''} onChange={e => setNotes(n => ({ ...n, [app.id]: e.target.value }))}
                              placeholder={t('ملاحظة (إلزامية للرفض وطلب المعلومات)', 'Note (required to reject or request info)')} className="rounded-xl min-h-[80px]" />
                            <div className="flex flex-wrap gap-2">
                              {allowed.map(a => (
                                <Button key={a.id} type="button" disabled={!!busy} onClick={() => act(app, a)} className={cn('rounded-xl font-black gap-1.5', a.tone)}>
                                  {busy === `${app.id}:${a.id}` ? <Loader2 size={15} className="animate-spin" /> : a.icon}{isAr ? a.ar : a.en}
                                </Button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </StaffShell>
  );
}
