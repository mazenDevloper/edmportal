'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle, ArrowLeft, Bot, CheckCircle2, ChevronLeft, ClipboardCheck, CreditCard, FileCheck2, FileText, Inbox, LayoutList,
  ListChecks, MapPinned, MonitorSmartphone, MousePointerClick, Receipt, Send, Split, User, UserCog, Bell,
} from 'lucide-react';
import type { ServiceFlow } from '@/lib/types';
import { Bi, MAIN_PHASES, PHASE_LABEL, Phase, ScreenType, SeqStep, buildSequence } from '@/lib/flow-sequence';
import { laneRoleId } from '@/lib/rbac';
import { cn } from '@/lib/utils';

/*
 * "خطوات العمل والشاشات": the procedural sequence read from the flow diagram, shown per actor
 * (applicant, system and each staff role), with the screen each step is worked on.
 */

const PHASE_TONE: Record<Phase, string> = {
  submit: 'bg-cyan-50 text-cyan-800 ring-cyan-200', review: 'bg-indigo-50 text-indigo-800 ring-indigo-200',
  approval: 'bg-violet-50 text-violet-800 ring-violet-200', notify_pay: 'bg-amber-50 text-amber-900 ring-amber-200',
  pay: 'bg-orange-50 text-orange-900 ring-orange-200', issue: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  info: 'bg-slate-100 text-slate-700 ring-slate-200', reject: 'bg-red-50 text-red-700 ring-red-200',
};
const SCREEN_ICON: Record<ScreenType, React.ElementType> = {
  catalog: LayoutList, form: FileText, inbox: Inbox, review: ClipboardCheck, visit: MapPinned, decision: Split,
  fees: Receipt, payment: CreditCard, notice: Bell, document: FileCheck2, auto: Bot,
};
const SCREEN_NAME: Record<ScreenType, Bi> = {
  catalog: { ar: 'شاشة دليل الخدمة', en: 'Service guide screen' }, form: { ar: 'شاشة نموذج الطلب', en: 'Request form screen' },
  inbox: { ar: 'شاشة صندوق المهام', en: 'Task inbox screen' }, review: { ar: 'شاشة مراجعة الطلب', en: 'Request review screen' },
  visit: { ar: 'شاشة الزيارة الميدانية', en: 'Field visit screen' }, decision: { ar: 'شاشة القرار', en: 'Decision screen' },
  fees: { ar: 'شاشة تحديد الرسوم', en: 'Fee setting screen' }, payment: { ar: 'شاشة السداد الإلكتروني', en: 'E-payment screen' },
  notice: { ar: 'شاشة الإشعار', en: 'Notice screen' }, document: { ar: 'شاشة المستند', en: 'Document screen' },
  auto: { ar: 'إجراء آلي (دون شاشة)', en: 'Automatic action (no screen)' },
};
const STAFF_COLORS = ['#470D67', '#C2560C', '#2563EB', '#0f766e', '#9d174d'];

/** `mineRoleIds` (staff portal): opens on the lanes of those roles and marks them as the employee's own */
export function RoleScreens({ flow, isAr, mineRoleIds }: { flow: ServiceFlow; isAr: boolean; mineRoleIds?: string[] }) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const tx = (b: Bi) => (isAr ? b.ar : b.en);
  const seq = useMemo(() => buildSequence(flow), [flow]);
  const mine = (l: { id: string; roleId?: string; kind: string }) => !!mineRoleIds && l.kind === 'staff' && mineRoleIds.includes(l.roleId || laneRoleId(flow.serviceId, l as never) || '');
  const [lane, setLane] = useState<string>(() => seq.lanes.find(mine)?.id || 'all');
  const [open, setOpen] = useState<string | null>(null);

  const laneColor = (id: string) => {
    const l = seq.lanes.find(x => x.id === id);
    if (!l || l.kind === 'system') return '#64748b';
    if (l.kind === 'applicant') return '#0891b2';
    return STAFF_COLORS[seq.lanes.filter(x => x.kind === 'staff').findIndex(x => x.id === id) % STAFF_COLORS.length];
  };
  const laneIcon = (kind: string) => (kind === 'applicant' ? User : kind === 'system' ? Bot : UserCog);
  const shown = lane === 'all' ? seq.steps : seq.steps.filter(s => s.lane.id === lane);
  const failed = seq.checks.filter(c => !c.ok);

  if (!seq.steps.length) {
    return <div className="rounded-[2rem] bg-white p-12 text-center font-bold text-slate-500">{t('لا يوجد مخطط مسار لهذه الخدمة بعد. أضف مراحل المعالجة أو مخطط المسار أولاً.', 'This service has no flow diagram yet. Add processing stages or a diagram first.')}</div>;
  }

  return (
    <div className="space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
      {/* The standard sequence, filled from the diagram */}
      <section aria-labelledby="seq-title" className="rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-100 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 id="seq-title" className="font-black text-slate-900">{t('التسلسل الإجرائي', 'Procedural sequence')}</h3>
          <p className="text-xs font-bold text-slate-500">{seq.generated ? t('مشتق من مراحل المعالجة', 'Derived from the processing stages') : t(`مشتق من مخطط المسار${flow.blueprint?.source ? ` (${flow.blueprint.source})` : ''}`, 'Derived from the flow diagram')} · {seq.steps.length} {t('خطوة', 'steps')}</p>
        </div>
        <ol className="flex flex-wrap items-stretch gap-2">
          {seq.phases.map((p, i) => (
            <li key={p.phase} className="flex items-stretch gap-2">
              <div className={cn('rounded-2xl px-4 py-3 ring-1 min-w-[9rem]', p.count ? PHASE_TONE[p.phase] : 'bg-white text-slate-400 ring-0 border border-dashed border-slate-300')}>
                <p className="text-[11px] font-black opacity-70">{i + 1}</p>
                <p className="font-black leading-snug">{tx(PHASE_LABEL[p.phase])}</p>
                <p className="text-[11px] font-bold mt-1">{p.count ? `${p.count} ${t('خطوة', 'steps')} · ${p.actors.map(tx).join(isAr ? '، ' : ', ')}` : t('غير موجودة في المسار', 'Not in this path')}</p>
              </div>
              {i < seq.phases.length - 1 && <ChevronLeft size={18} className={cn('self-center text-slate-300 shrink-0', !isAr && 'rotate-180')} aria-hidden />}
            </li>
          ))}
        </ol>
        <ul className="grid gap-1.5 sm:grid-cols-2 text-xs font-bold">
          {seq.checks.map(c => (
            <li key={c.text.ar} className={cn('flex items-center gap-2', c.ok ? 'text-emerald-700' : 'text-amber-800')}>
              {c.ok ? <CheckCircle2 size={14} aria-hidden /> : <AlertTriangle size={14} aria-hidden />}{tx(c.text)}
              <span className="sr-only">{c.ok ? t('(متحقق)', '(ok)') : t('(يحتاج مراجعة)', '(needs review)')}</span>
            </li>
          ))}
        </ul>
        {failed.length > 0 && <p className="text-xs font-bold text-amber-800">{t('الملاحظات أعلاه تُصحَّح من مخطط المسار أو مراحل المعالجة، وهذا العرض يتحدّث تلقائياً.', 'Fix these in the flow diagram or the processing stages; this view updates automatically.')}</p>}
      </section>

      {/* Per actor */}
      <div role="tablist" aria-label={t('نوع المستخدم', 'User type')} className="flex flex-wrap gap-2">
        {[{ id: 'all', label: t('التسلسل الكامل', 'Full sequence'), kind: 'all', n: seq.steps.length }, ...seq.lanes.map(l => ({ id: l.id, label: (isAr ? l.labelAr : l.labelEn) + (mine(l) ? t(' (دوري)', ' (my role)') : ''), kind: l.kind, n: seq.steps.filter(s => s.lane.id === l.id).length }))].map(x => {
          const Icon = x.kind === 'all' ? ListChecks : laneIcon(x.kind);
          const active = lane === x.id;
          return (
            <button key={x.id} type="button" role="tab" aria-selected={active} onClick={() => setLane(x.id)}
              className={cn('h-11 px-4 rounded-2xl text-sm font-black flex items-center gap-2 ring-1 transition-colors', active ? 'text-white ring-transparent' : 'bg-white text-slate-700 ring-slate-200 hover:ring-slate-300')}
              style={active ? { background: x.id === 'all' ? '#0f172a' : laneColor(x.id) } : undefined}>
              <Icon size={16} aria-hidden />{x.kind === 'staff' ? t(`خطوات وشاشات ${x.label}`, `${x.label}: steps & screens`) : x.label}
              <span className={cn('min-w-6 h-6 px-1.5 rounded-full text-xs flex items-center justify-center', active ? 'bg-white/20' : 'bg-slate-100')}>{x.n}</span>
            </button>
          );
        })}
      </div>

      <ol className="space-y-3">
        {shown.map(s => <StepCard key={s.id} s={s} isAr={isAr} color={laneColor(s.lane.id)} LaneIcon={laneIcon(s.lane.kind)} showLane={lane === 'all'} open={open === s.id} onToggle={() => setOpen(open === s.id ? null : s.id)} forceOpen={lane !== 'all'} />)}
      </ol>
    </div>
  );
}

function StepCard({ s, isAr, color, LaneIcon, showLane, open, onToggle, forceOpen }: {
  s: SeqStep; isAr: boolean; color: string; LaneIcon: React.ElementType; showLane: boolean; open: boolean; onToggle: () => void; forceOpen: boolean;
}) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const tx = (b: Bi) => (isAr ? b.ar : b.en);
  const expanded = forceOpen || open;
  const Icon = SCREEN_ICON[s.screen.type];
  return (
    <li className="rounded-[1.75rem] bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden">
      <button type="button" onClick={onToggle} disabled={forceOpen} aria-expanded={expanded} className="w-full text-start p-4 flex flex-wrap items-center gap-3 disabled:cursor-default">
        <span className="size-10 shrink-0 rounded-full text-white font-black flex items-center justify-center" style={{ background: color }}>{s.order}</span>
        <span className="flex-1 min-w-[14rem] space-y-1">
          <span className="flex flex-wrap items-center gap-1.5 text-[11px] font-black">
            <span className={cn('px-2 py-0.5 rounded-full ring-1', PHASE_TONE[s.phase])}>{tx(PHASE_LABEL[s.phase])}</span>
            {showLane && <span className="px-2 py-0.5 rounded-full text-white inline-flex items-center gap-1" style={{ background: color }}><LaneIcon size={11} aria-hidden />{isAr ? s.lane.labelAr : s.lane.labelEn}</span>}
            {s.kind === 'decision' && <span className="px-2 py-0.5 rounded-full bg-slate-900 text-white">{t('نقطة قرار', 'Decision')}</span>}
            {s.kind === 'subprocess' && <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{t('إجراء فرعي', 'Sub-process')}</span>}
            {s.derived && <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">{t('مفصّلة من إجراء السداد', 'Spelled out from the payment procedure')}</span>}
            {s.num && <span className="text-slate-400">{t('مربع', 'Box')} {s.num}</span>}
          </span>
          <span className="block font-black text-slate-900 leading-snug">{tx(s.label)}</span>
        </span>
        <span className="flex items-center gap-1.5 text-xs font-black text-slate-500"><Icon size={15} aria-hidden />{tx(SCREEN_NAME[s.screen.type])}</span>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 p-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
          {/* The screen */}
          <div className="rounded-2xl ring-1 ring-slate-200 overflow-hidden">
            <div className="h-9 px-3 flex items-center gap-2 bg-slate-100 text-xs font-black text-slate-600">
              <MonitorSmartphone size={14} aria-hidden />{t('محتوى الشاشة', 'Screen content')}: {tx(SCREEN_NAME[s.screen.type])}
            </div>
            <div className="p-4 grid gap-4 md:grid-cols-3 text-sm">
              <ScreenList icon={LayoutList} title={t('العناصر المعروضة', 'Shown on screen')} items={s.screen.elements.map(tx)} />
              <div>
                <p className="flex items-center gap-1.5 text-xs font-black text-slate-500 mb-2"><MousePointerClick size={14} aria-hidden />{t('الوظائف والأزرار', 'Functions & buttons')}</p>
                {s.screen.actions.length
                  ? <div className="flex flex-wrap gap-1.5">{s.screen.actions.map(a => <span key={a.ar} className="px-3 h-8 rounded-lg text-xs font-black inline-flex items-center text-white" style={{ background: color }}>{tx(a)}</span>)}</div>
                  : <p className="text-xs font-bold text-slate-400">{t('لا يوجد إجراء يدوي', 'No manual action')}</p>}
              </div>
              <ScreenList icon={Send} title={t('المخرجات والإشعارات', 'Outputs & notices')} items={s.screen.outputs.map(tx)} empty={t('لا مخرجات', 'None')} />
            </div>
            {!!s.screen.formSteps?.length && (
              <div className="border-t border-slate-100 p-4 space-y-3">
                <p className="text-xs font-black text-slate-500">{s.screen.type === 'payment' ? t('خطوات السداد في النموذج', 'Payment steps in the form') : t('خطوات نموذج الطلب وحقوله', 'Request form steps and fields')}</p>
                <ol className="grid gap-2 md:grid-cols-2">
                  {s.screen.formSteps.map((fs, i) => (
                    <li key={fs.id} className="rounded-xl bg-slate-50 p-3">
                      <p className="font-black text-slate-800 text-sm">{i + 1}. {isAr ? fs.titleAr : fs.titleEn || fs.titleAr}</p>
                      <ul className="mt-1.5 space-y-1">
                        {fs.fields.map(f => (
                          <li key={f.id} className="flex items-center justify-between gap-2 text-xs font-bold text-slate-600">
                            <span>{isAr ? f.labelAr : f.labelEn || f.labelAr}{f.required && <span className="text-red-600" aria-label={t('إلزامي', 'required')}> *</span>}</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase">{f.type}</span>
                          </li>
                        ))}
                        {!fs.fields.length && <li className="text-xs font-bold text-slate-400">{t('لا حقول', 'No fields')}</li>}
                      </ul>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          {/* Hand-offs */}
          <div className="space-y-3 text-xs">
            <div>
              <p className="font-black text-slate-500 mb-1.5">{t('يستلم من', 'Receives from')}</p>
              <p className="font-bold text-slate-700">{s.from.length ? s.from.map(tx).join(isAr ? '، ' : ', ') : t('الخطوة السابقة لنفس المستخدم', 'Their own previous step')}</p>
            </div>
            <div>
              <p className="font-black text-slate-500 mb-1.5">{t('ثم ينتقل الطلب إلى', 'Then the request goes to')}</p>
              {s.next.length ? (
                <ul className="space-y-1.5">
                  {s.next.map((nx, i) => (
                    <li key={i} className="flex items-start gap-1.5 font-bold text-slate-700">
                      <ArrowLeft size={13} className={cn('mt-0.5 shrink-0 text-slate-400', !isAr && 'rotate-180')} aria-hidden />
                      <span>{nx.via && <span className="px-1.5 py-0.5 rounded bg-slate-900 text-white font-black me-1">{tx(nx.via)}</span>}{nx.id === 'end' || nx.label.ar === 'نهاية' ? t('نهاية المسار', 'End of the path') : <>{tx(nx.label)} <span className="text-slate-400">({tx(nx.actor)})</span></>}{nx.dashed && <span className="text-slate-400"> · {t('اختياري', 'optional')}</span>}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="font-bold text-slate-400">{s.derived ? t('الخطوة التالية في التسلسل', 'The next step in the sequence') : t('نهاية المسار', 'End of the path')}</p>}
            </div>
          </div>
        </div>
      )}
    </li>
  );
}

function ScreenList({ icon: Icon, title, items, empty }: { icon: React.ElementType; title: string; items: string[]; empty?: string }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs font-black text-slate-500 mb-2"><Icon size={14} aria-hidden />{title}</p>
      {items.length ? <ul className="space-y-1.5">{items.map(i => <li key={i} className="flex gap-1.5 font-bold text-slate-700 leading-snug"><span className="mt-1.5 size-1.5 rounded-full bg-slate-300 shrink-0" aria-hidden />{i}</li>)}</ul>
        : <p className="text-xs font-bold text-slate-400">{empty}</p>}
    </div>
  );
}
