import { BlueprintLane, ProcessStage, RolePermission, ServiceFlow, ServiceRole, StaffUser, UserRoleAssignment } from './types';

export const ALL_PERMISSIONS: { id: RolePermission; labelAr: string; labelEn: string }[] = [
  { id: 'view', labelAr: 'عرض الطلبات', labelEn: 'View applications' },
  { id: 'review', labelAr: 'مراجعة الطلب', labelEn: 'Review application' },
  { id: 'request_info', labelAr: 'طلب معلومات إضافية', labelEn: 'Request more info' },
  { id: 'field_visit', labelAr: 'زيارة ميدانية', labelEn: 'Field visit' },
  { id: 'report', labelAr: 'إعداد التقرير', labelEn: 'Prepare report' },
  { id: 'approve', labelAr: 'اعتماد / موافقة', labelEn: 'Approve' },
  { id: 'reject', labelAr: 'رفض الطلب', labelEn: 'Reject' },
  { id: 'assign', labelAr: 'إحالة / إسناد', labelEn: 'Refer / assign' },
  { id: 'complete', labelAr: 'تنفيذ وإغلاق', labelEn: 'Complete' },
];

export const roleId = (serviceId: string, code: string) => `role_${serviceId}_${code}`;

// ─── Stage actors ─────────────────────────────────────────────────────

export type ActorType = 'system' | 'applicant' | 'staff';

export function classifyActor(stage: Pick<ProcessStage, 'actorAr' | 'actorEn'>): ActorType {
  const en = (stage.actorEn || '').toLowerCase();
  if (en.includes('automated') || stage.actorAr?.includes('النظام الآلي')) return 'system';
  if (en === 'applicant' || stage.actorAr === 'المتقدم') return 'applicant';
  return 'staff';
}

/** "Engineer / Inspector" → "engineer_inspector" */
export const actorCode = (stage: Pick<ProcessStage, 'actorAr' | 'actorEn'>) =>
  (stage.actorEn || stage.actorAr).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'staff';

// Permissions inferred from the Arabic wording of the stages an actor performs
const PERMISSION_HINTS: [RegExp, RolePermission[]][] = [
  [/مراجعة|التحقق/, ['review']],
  [/معلومات إضافية|توضيح|الاستكمال/, ['request_info']],
  [/زيارة|معاينة/, ['field_visit']],
  [/تقرير|التقدير/, ['report']],
  [/القرار|قرار|الموافقة|قبول|مراجعة الميزانية/, ['approve', 'reject']],
  [/إحالة|تحديد الدائرة/, ['assign']],
  [/تنفيذ|مكتملة|تقديم رقم/, ['complete']],
];

// "مراجعة ملاحظات المهندس وتقرير الزيارة" reviews someone else's work, it isn't a visit/report itself
const REVIEWED_WORK = /ملاحظات \S+( وتقرير الزيارة)?|التحقق من تقرير الزيارة/g;

export function inferPermissions(stages: ProcessStage[]): RolePermission[] {
  const perms = new Set<RolePermission>(['view']);
  stages.forEach(s => {
    const text = s.titleAr.replace(REVIEWED_WORK, '');
    PERMISSION_HINTS.forEach(([re, ps]) => { if (re.test(text)) ps.forEach(p => perms.add(p)); });
  });
  return ALL_PERMISSIONS.map(p => p.id).filter(p => perms.has(p));
}

/**
 * Builds one role per distinct staff actor in each flow's processStages and
 * links every staff stage to its role (stage.roleId). Existing roleIds are kept.
 */
export function deriveRolesFromFlows(flows: ServiceFlow[], now = new Date().toISOString()) {
  const roles: ServiceRole[] = [];
  const linkedFlows = flows.map(flow => {
    if (!flow.processStages?.length) return flow;
    const staffStages = flow.processStages.filter(s => classifyActor(s) === 'staff');
    const byCode = new Map<string, ProcessStage[]>();
    staffStages.forEach(s => byCode.set(actorCode(s), [...(byCode.get(actorCode(s)) || []), s]));
    byCode.forEach((stages, code) => roles.push({
      id: roleId(flow.serviceId, code),
      serviceId: flow.serviceId,
      code,
      nameAr: stages[0].actorAr,
      nameEn: stages[0].actorEn,
      permissions: inferPermissions(stages),
      isActive: true,
      createdAt: now,
    }));
    return {
      ...flow,
      processStages: flow.processStages.map(s =>
        classifyActor(s) === 'staff' && !s.roleId ? { ...s, roleId: roleId(flow.serviceId, actorCode(s)) } : s
      ),
    };
  }).map(flow => linkBlueprintLanes(flow, roles, now));
  return { roles, flows: linkedFlows };
}

/** Role id a blueprint staff lane maps to (same code as the matching ProcessStage actor) */
export const laneRoleId = (serviceId: string, lane: BlueprintLane) =>
  lane.kind === 'staff' ? roleId(serviceId, actorCode({ actorAr: lane.labelAr, actorEn: lane.actorEn || lane.labelEn })) : undefined;

/** Sets roleId on the blueprint's staff lanes and adds a role for any lane no stage covered */
function linkBlueprintLanes(flow: ServiceFlow, roles: ServiceRole[], now: string): ServiceFlow {
  if (!flow.blueprint) return flow;
  const lanes = flow.blueprint.lanes.map(lane => {
    const id = lane.roleId || laneRoleId(flow.serviceId, lane);
    if (!id) return lane;
    if (!roles.some(r => r.id === id)) {
      const tasks = flow.blueprint!.nodes.filter(n => n.lane === lane.id && n.kind !== 'connector');
      roles.push({
        id, serviceId: flow.serviceId, code: id.replace(`role_${flow.serviceId}_`, ''),
        nameAr: lane.labelAr, nameEn: lane.labelEn,
        permissions: inferPermissions(tasks.map((n, i) => ({ order: i, actorAr: lane.labelAr, actorEn: lane.labelEn, titleAr: n.labelAr, titleEn: n.labelEn }))),
        isActive: true, createdAt: now,
      });
    }
    return { ...lane, roleId: id };
  });
  return { ...flow, blueprint: { ...flow.blueprint, lanes } };
}

/** Example from the requirement: employee 14105 is an engineer in signage licensing (svc_110) */
export function buildSeedUsers(now = new Date().toISOString()): { users: StaffUser[]; assignments: UserRoleAssignment[] } {
  const user: StaffUser = {
    id: 'usr_14105',
    employeeNumber: '14105',
    nameAr: 'موظف 14105',
    nameEn: 'Employee 14105',
    department: 'دائرة الطرق والإنارة',
    // Demo value for the employee-number + civil-number sign-in; replace with the real one
    civilNumber: '90000001',
    isActive: true,
    createdAt: now,
  };
  const rid = roleId('svc_110', 'engineer_inspector');
  return {
    users: [user],
    assignments: [{ id: `asg_${user.id}_${rid}`, userId: user.id, roleId: rid, serviceId: 'svc_110', assignedAt: now, assignedBy: 'seed' }],
  };
}

/** Merge by id, keeping existing records (so a re-seed never overwrites admin edits) */
export function mergeById<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
  const ids = new Set(existing.map(x => x.id));
  return [...existing, ...incoming.filter(x => !ids.has(x.id))];
}

// ─── Checks ───────────────────────────────────────────────────────────

export interface AccessData {
  staffUsers: StaffUser[];
  serviceRoles: ServiceRole[];
  roleAssignments: UserRoleAssignment[];
}

export function findUserByEmployeeNumber(data: AccessData, employeeNumber: string) {
  return data.staffUsers.find(u => u.employeeNumber === employeeNumber.trim());
}

/** Active roles a user holds, optionally limited to one service */
export function getUserRoles(data: AccessData, userId: string, serviceId?: string): ServiceRole[] {
  const user = data.staffUsers.find(u => u.id === userId);
  if (!user || !user.isActive) return [];
  const roleIds = new Set(
    data.roleAssignments
      .filter(a => a.userId === userId && (!serviceId || a.serviceId === serviceId))
      .map(a => a.roleId)
  );
  return data.serviceRoles.filter(r => r.isActive && roleIds.has(r.id));
}

export function hasServicePermission(data: AccessData, userId: string, serviceId: string, permission: RolePermission): boolean {
  const user = data.staffUsers.find(u => u.id === userId);
  if (!user || !user.isActive) return false;
  if (user.isSuperAdmin) return true;
  return getUserRoles(data, userId, serviceId).some(r => r.permissions.includes(permission));
}

/** Active users who hold the role that handles a stage */
export function getStageAssignees(data: AccessData, stage: ProcessStage): StaffUser[] {
  if (!stage.roleId) return [];
  const role = data.serviceRoles.find(r => r.id === stage.roleId && r.isActive);
  if (!role) return [];
  const userIds = new Set(data.roleAssignments.filter(a => a.roleId === role.id).map(a => a.userId));
  return data.staffUsers.filter(u => u.isActive && userIds.has(u.id));
}

/** Who actually handles a stage: the named assignee if still valid, otherwise every holder of its role */
export function getStageHandlers(data: AccessData, stage: ProcessStage): StaffUser[] {
  const holders = getStageAssignees(data, stage);
  const named = holders.find(u => u.id === stage.assigneeUserId);
  return named ? [named] : holders;
}

/** Stages of a flow the user handles (named assignee, or role holder when no one is named) */
export function getUserStages(data: AccessData, userId: string, flow: ServiceFlow): ProcessStage[] {
  return (flow.processStages || []).filter(s => getStageHandlers(data, s).some(u => u.id === userId));
}
