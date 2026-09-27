'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ProcessStage, Service, ServiceFlow, ServiceRole, StaffUser, UserRoleAssignment } from '@/lib/types';
import { classifyActor, deriveRolesFromFlows, getStageAssignees, mergeById } from '@/lib/rbac';
import { ProcessStagesEditor } from '@/components/flow/process-stages-editor';
import { SwimlaneBlueprint } from '@/components/flow/swimlane-blueprint';
import { Search, Edit2, GitBranch, ListOrdered, Workflow, FileText } from 'lucide-react';
import { PDF_BLUEPRINTS, attachPdfBlueprints, assignBlueprintNode } from '@/lib/flow-blueprints';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Props {
  isAr: boolean;
  services: Service[];
  flows: ServiceFlow[];
  setFlows: React.Dispatch<React.SetStateAction<ServiceFlow[]>>;
  serviceRoles: ServiceRole[];
  setServiceRoles: React.Dispatch<React.SetStateAction<ServiceRole[]>>;
  staffUsers: StaffUser[];
  roleAssignments: UserRoleAssignment[];
  setRoleAssignments: React.Dispatch<React.SetStateAction<UserRoleAssignment[]>>;
}

/** Grants a role to a user (no-op if they already hold it) */
export function grantRole(prev: UserRoleAssignment[], userId: string, roleId: string, serviceId: string): UserRoleAssignment[] {
  if (prev.some(a => a.userId === userId && a.roleId === roleId)) return prev;
  return [...prev, { id: `asg_${userId}_${roleId}`, userId, roleId, serviceId, assignedAt: new Date().toISOString(), assignedBy: 'admin' }];
}

export function ServiceFlowsPanel({ isAr, services, flows, setFlows, serviceRoles, setServiceRoles, staffUsers, roleAssignments, setRoleAssignments }: Props) {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'blueprint' | 'list'>('blueprint');
  const [selectedId, setSelectedId] = useState<string | null>(() => flows.find(f => f.processStages?.length)?.serviceId ?? flows[0]?.serviceId ?? null);

  const access = useMemo(() => ({ staffUsers, serviceRoles, roleAssignments }), [staffUsers, serviceRoles, roleAssignments]);
  const serviceName = (id: string) => {
    const s = services.find(x => x.id === id);
    const f = flows.find(x => x.serviceId === id);
    return isAr ? (s?.title || f?.titleAr || id) : (s?.titleEn || f?.titleEn || s?.title || id);
  };

  // Staff stages with no active employee able to handle them
  const gapsOf = (flow: ServiceFlow) => (flow.processStages || []).filter(s =>
    classifyActor(s) === 'staff' && getStageAssignees(access, s).length === 0
  ).length;

  const sortedFlows = [...flows]
    .filter(f => serviceName(f.serviceId).toLowerCase().includes(query.toLowerCase()) || f.serviceId.includes(query))
    .sort((a, b) => (b.processStages?.length ?? 0) - (a.processStages?.length ?? 0));

  const flow = flows.find(f => f.serviceId === selectedId) || null;

  const setStages = (next: ProcessStage[]) => {
    if (!flow) return;
    setFlows(prev => prev.map(f => f.serviceId === flow.serviceId ? { ...f, processStages: next } : f));
  };

  const assignNode = (nodeId: string, userId: string | null) => {
    if (!flow) return;
    setFlows(prev => prev.map(f => f.serviceId === flow.serviceId ? assignBlueprintNode(attachPdfBlueprints([f])[0], nodeId, userId) : f));
  };

  const reloadFromPdf = () => {
    if (!flow) return;
    const derived = deriveRolesFromFlows(attachPdfBlueprints([flow], true));
    setServiceRoles(prev => mergeById(prev, derived.roles));
    setFlows(prev => prev.map(f => f.serviceId === flow.serviceId ? derived.flows[0] : f));
    toast({ title: isAr ? 'تم تحديث المخطط من ملف PDF' : 'Diagram reloaded from the PDF' });
  };

  const autoLink = () => {
    if (!flow) return;
    const derived = deriveRolesFromFlows(attachPdfBlueprints([flow]));
    setServiceRoles(prev => mergeById(prev, derived.roles));
    setFlows(prev => prev.map(f => f.serviceId === flow.serviceId ? derived.flows[0] : f));
    toast({ title: isAr ? `تم ربط المراحل بـ ${derived.roles.length} دور` : `Linked stages to ${derived.roles.length} roles` });
  };

  return (
    <div className="grid xl:grid-cols-4 gap-6">
      <Card className="rounded-[2rem] border-none shadow-xl bg-white overflow-hidden h-fit">
        <div className="p-4 border-b relative">
          <Search className="absolute start-7 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
          <Input value={query} onChange={e => setQuery(e.target.value)} placeholder={isAr ? 'ابحث عن خدمة...' : 'Search services...'} className="ps-10 rounded-xl" />
        </div>
        <div className="max-h-[70vh] overflow-y-auto divide-y divide-slate-50">
          {sortedFlows.map(f => {
            const gaps = gapsOf(f);
            return (
              <button key={f.id} onClick={() => setSelectedId(f.serviceId)} className={cn('w-full text-start p-4 hover:bg-slate-50 transition-colors', selectedId === f.serviceId && 'bg-accent/10')}>
                <p className="font-bold text-sm line-clamp-2">{serviceName(f.serviceId)}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge variant="secondary" className="text-[10px]">{f.steps.length} {isAr ? 'خطوات للمتقدم' : 'form steps'}</Badge>
                  <Badge variant="secondary" className="text-[10px]">{f.processStages?.length ?? 0} {isAr ? 'مراحل معالجة' : 'stages'}</Badge>
                  {(f.blueprint || PDF_BLUEPRINTS[f.serviceId]) && <Badge className="text-[10px] bg-[#1f6fb2]">PDF</Badge>}
                  {gaps > 0 && <Badge className="text-[10px] bg-amber-500">{gaps} {isAr ? 'بلا موظف' : 'unstaffed'}</Badge>}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      <div className="xl:col-span-3 space-y-6 min-w-0">
        {!flow ? (
          <Card className="rounded-[2rem] border-none shadow-xl bg-white p-12 text-center text-slate-400 font-bold">{isAr ? 'اختر خدمة' : 'Select a service'}</Card>
        ) : (
          <Card className="rounded-[2rem] border-none shadow-xl bg-white p-6 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="font-black text-xl">{serviceName(flow.serviceId)}</h3>
                <p className="text-[11px] text-slate-400 font-mono">{flow.serviceId}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-bold">
                  {isAr ? 'مفعّلة' : 'Active'}
                  <Switch checked={flow.isActive} onCheckedChange={v => setFlows(prev => prev.map(f => f.serviceId === flow.serviceId ? { ...f, isActive: v } : f))} />
                </label>
                {PDF_BLUEPRINTS[flow.serviceId] && (
                  <Button variant="outline" onClick={reloadFromPdf} className="rounded-full font-black gap-2 border-slate-200">
                    <FileText size={14} />{isAr ? 'تحديث المخطط من PDF' : 'Reload diagram from PDF'}
                  </Button>
                )}
                <Button variant="outline" asChild className="rounded-full font-black gap-2 border-slate-200">
                  <Link href={`/servicebuild?id=${flow.serviceId}`}><Edit2 size={14} />{isAr ? 'فتح في مصنع العمليات' : 'Open in builder'}</Link>
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 me-2"><GitBranch size={12} />{isAr ? 'خطوات المتقدم' : 'Form steps'}</p>
              {flow.steps.map((s, i) => (
                <Badge key={s.id} variant="outline" className="rounded-lg gap-1 py-1">
                  <span className="text-accent font-black">{i + 1}</span> {isAr ? s.titleAr : s.titleEn || s.titleAr}
                </Badge>
              ))}
            </div>

            <div className="inline-flex rounded-full bg-slate-100 p-1">
              {([
                ['blueprint', <Workflow key="b" size={14} />, isAr ? 'المخطط (مثل PDF)' : 'Blueprint (PDF style)'],
                ['list', <ListOrdered key="l" size={14} />, isAr ? 'تحرير المراحل' : 'Edit stages'],
              ] as const).map(([v, icon, label]) => (
                <button key={v} onClick={() => setView(v)} className={cn('flex items-center gap-2 px-4 h-9 rounded-full text-xs font-black', view === v ? 'bg-white shadow text-primary' : 'text-slate-500')}>{icon}{label}</button>
              ))}
            </div>

            {view === 'blueprint' ? (
              <SwimlaneBlueprint
                key={flow.serviceId}
                isAr={isAr}
                flow={flow.blueprint ? flow : attachPdfBlueprints([flow])[0]}
                title={serviceName(flow.serviceId)}
                access={access}
                onAssign={assignNode}
                onGrantRole={(userId, roleId, serviceId) => setRoleAssignments(prev => grantRole(prev, userId, roleId, serviceId))}
              />
            ) : (
              <ProcessStagesEditor
                isAr={isAr}
                stages={flow.processStages || []}
                onChange={setStages}
                rolesOfService={serviceRoles.filter(r => r.serviceId === flow.serviceId)}
                access={access}
                onAutoLink={autoLink}
              />
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
