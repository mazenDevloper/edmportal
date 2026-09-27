'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProcessStage, ServiceRole } from '@/lib/types';
import { AccessData, ActorType, classifyActor, getStageAssignees, getStageHandlers } from '@/lib/rbac';
import { Bot, User, UserCog, Plus, Trash2, ChevronUp, ChevronDown, Link2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const SYSTEM_ACTOR = { actorAr: 'النظام الآلي', actorEn: 'Automated System' };
const APPLICANT_ACTOR = { actorAr: 'المتقدم', actorEn: 'Applicant' };

const ACTOR_STYLE: Record<ActorType, { icon: React.ReactNode; className: string }> = {
  system: { icon: <Bot size={14} />, className: 'bg-slate-100 text-slate-500 border-slate-200' },
  applicant: { icon: <User size={14} />, className: 'bg-amber-50 text-amber-700 border-amber-200' },
  staff: { icon: <UserCog size={14} />, className: 'bg-accent/10 text-primary border-accent/30' },
};

interface Props {
  isAr: boolean;
  stages: ProcessStage[];
  onChange: (next: ProcessStage[]) => void;
  rolesOfService: ServiceRole[];
  access: AccessData;
  onAutoLink?: () => void;
}

/** Ordered list of back-office stages; each staff stage is bound to a service role and optionally a named assignee */
export function ProcessStagesEditor({ isAr, stages, onChange, rolesOfService, access, onAutoLink }: Props) {
  const setStages = (next: ProcessStage[]) => onChange(next.map((s, i) => ({ ...s, order: i + 1 })));
  const updateStage = (idx: number, updates: Partial<ProcessStage>) => setStages(stages.map((s, i) => i === idx ? { ...s, ...updates } : s));

  const setActorType = (idx: number, type: ActorType) => {
    const reset = { roleId: undefined, assigneeUserId: undefined };
    if (type === 'system') updateStage(idx, { ...SYSTEM_ACTOR, ...reset });
    else if (type === 'applicant') updateStage(idx, { ...APPLICANT_ACTOR, ...reset });
    else {
      const role = rolesOfService[0];
      updateStage(idx, role ? { actorAr: role.nameAr, actorEn: role.nameEn, roleId: role.id, assigneeUserId: undefined } : { actorAr: 'الموظف المختص', actorEn: 'Competent Employee', ...reset });
    }
  };

  const setStageRole = (idx: number, roleId: string) => {
    const role = rolesOfService.find(r => r.id === roleId);
    if (role) updateStage(idx, { roleId: role.id, actorAr: role.nameAr, actorEn: role.nameEn, assigneeUserId: undefined });
  };

  const move = (idx: number, dir: -1 | 1) => {
    const t = idx + dir;
    if (t < 0 || t >= stages.length) return;
    const next = [...stages];
    [next[idx], next[t]] = [next[t], next[idx]];
    setStages(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-400 font-bold max-w-lg">{isAr ? 'كل مرحلة يقوم بها موظف تُسند إلى دور في هذه الخدمة، ويمكن تحديد موظف بعينه من حاملي الدور.' : 'Each staff stage is bound to a role of this service; you can name a specific holder.'}</p>
        <div className="flex gap-2">
          {onAutoLink && <Button variant="outline" onClick={onAutoLink} className="rounded-full font-black gap-2 border-slate-200"><Link2 size={14} />{isAr ? 'ربط تلقائي بالأدوار' : 'Auto-link roles'}</Button>}
          <Button onClick={() => setStages([...stages, { order: stages.length + 1, ...SYSTEM_ACTOR, titleAr: 'مرحلة جديدة', titleEn: 'New stage' }])} className="rounded-full font-black gap-2 dm-gradient-primary"><Plus size={14} />{isAr ? 'مرحلة' : 'Stage'}</Button>
        </div>
      </div>

      {stages.length === 0 && <p className="text-center text-slate-400 text-sm py-8">{isAr ? 'لا توجد مراحل معالجة لهذه الخدمة بعد.' : 'No processing stages yet.'}</p>}

      <ol className="relative space-y-3 before:absolute before:inset-y-4 before:start-5 before:w-0.5 before:bg-slate-100">
        {stages.map((stage, idx) => {
          const type = classifyActor(stage);
          const holders = type === 'staff' ? getStageAssignees(access, stage) : [];
          const handlers = type === 'staff' ? getStageHandlers(access, stage) : [];
          return (
            <li key={idx} className="relative flex gap-3">
              <div className={cn('relative z-10 size-10 shrink-0 rounded-xl border-2 flex items-center justify-center font-black text-sm bg-white', ACTOR_STYLE[type].className)}>{stage.order}</div>
              <div className="flex-1 rounded-2xl border border-slate-100 p-4 space-y-3 bg-slate-50/40">
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={type} onValueChange={v => setActorType(idx, v as ActorType)}>
                    <SelectTrigger className={cn('h-8 w-auto gap-2 rounded-lg text-xs font-black border', ACTOR_STYLE[type].className)}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">{isAr ? 'النظام الآلي' : 'Automated system'}</SelectItem>
                      <SelectItem value="applicant">{isAr ? 'المتقدم' : 'Applicant'}</SelectItem>
                      <SelectItem value="staff">{isAr ? 'موظف (دور)' : 'Staff (role)'}</SelectItem>
                    </SelectContent>
                  </Select>
                  {type === 'staff' && (
                    <Select value={stage.roleId ?? ''} onValueChange={v => setStageRole(idx, v)}>
                      <SelectTrigger className={cn('h-8 w-auto min-w-[200px] rounded-lg text-xs font-bold', !stage.roleId && 'border-amber-400 text-amber-700')}>
                        <SelectValue placeholder={isAr ? `${stage.actorAr} — اختر الدور` : `${stage.actorEn} — pick role`} />
                      </SelectTrigger>
                      <SelectContent>
                        {rolesOfService.length === 0 && <div className="p-3 text-xs text-slate-400">{isAr ? 'لا توجد أدوار — استخدم الربط التلقائي' : 'No roles — use auto-link'}</div>}
                        {rolesOfService.map(r => <SelectItem key={r.id} value={r.id}>{isAr ? r.nameAr : r.nameEn}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                  {type === 'staff' && stage.roleId && holders.length > 0 && (
                    <Select value={stage.assigneeUserId && holders.some(h => h.id === stage.assigneeUserId) ? stage.assigneeUserId : 'any'} onValueChange={v => updateStage(idx, { assigneeUserId: v === 'any' ? undefined : v })}>
                      <SelectTrigger className="h-8 w-auto min-w-[160px] rounded-lg text-xs font-bold"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">{isAr ? `كل حاملي الدور (${holders.length})` : `Any holder (${holders.length})`}</SelectItem>
                        {holders.map(u => <SelectItem key={u.id} value={u.id}>{u.employeeNumber} · {isAr ? u.nameAr : u.nameEn || u.nameAr}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                  <div className="ms-auto flex items-center">
                    <Button variant="ghost" size="icon" className="size-8" onClick={() => move(idx, -1)}><ChevronUp size={14} /></Button>
                    <Button variant="ghost" size="icon" className="size-8" onClick={() => move(idx, 1)}><ChevronDown size={14} /></Button>
                    <Button variant="ghost" size="icon" className="size-8 text-red-400" onClick={() => setStages(stages.filter((_, i) => i !== idx))}><Trash2 size={14} /></Button>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-2">
                  <Input value={stage.titleAr} onChange={e => updateStage(idx, { titleAr: e.target.value })} dir="rtl" className="rounded-lg bg-white text-sm" />
                  <Input value={stage.titleEn} onChange={e => updateStage(idx, { titleEn: e.target.value })} dir="ltr" className="rounded-lg bg-white text-sm" />
                </div>
                {type === 'staff' && (
                  <div className="flex flex-wrap items-center gap-1 text-xs">
                    {handlers.length > 0 ? (
                      <>
                        <span className="text-slate-400 font-bold">{isAr ? 'يعالجها:' : 'Handled by:'}</span>
                        {handlers.map(u => <Badge key={u.id} variant="secondary" className="font-mono">{u.employeeNumber} · {isAr ? u.nameAr : u.nameEn || u.nameAr}</Badge>)}
                      </>
                    ) : (
                      <span className="text-amber-600 font-bold flex items-center gap-1"><AlertTriangle size={12} />{isAr ? 'لا يوجد موظف يحمل هذا الدور — أسنده من تبويب المستخدمين والصلاحيات أو من المخطط' : 'No employee holds this role — assign one in Users & Roles or on the blueprint'}</span>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
