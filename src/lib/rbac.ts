import { RolePermission, ServiceRole, StaffUser, UserRoleAssignment } from './types';

export const ALL_PERMISSIONS: { id: RolePermission; labelAr: string; labelEn: string }[] = [
  { id: 'view', labelAr: 'عرض الطلبات', labelEn: 'View applications' },
  { id: 'review', labelAr: 'مراجعة الطلب', labelEn: 'Review application' },
  { id: 'request_info', labelAr: 'طلب معلومات إضافية', labelEn: 'Request more info' },
  { id: 'field_visit', labelAr: 'زيارة ميدانية', labelEn: 'Field visit' },
  { id: 'report', labelAr: 'إعداد التقرير', labelEn: 'Prepare report' },
  { id: 'approve', labelAr: 'اعتماد / موافقة', labelEn: 'Approve' },
  { id: 'reject', labelAr: 'رفض الطلب', labelEn: 'Reject' },
  { id: 'assign', labelAr: 'إعادة إسناد المهام', labelEn: 'Reassign tasks' },
];

// Role templates reused across services (names follow the swimlanes in the workflow PDFs)
const ROLE_TEMPLATES = {
  engineer: { nameAr: 'المهندس / المفتش', nameEn: 'Engineer / Inspector', permissions: ['view', 'review', 'request_info', 'field_visit', 'report'] },
  head: { nameAr: 'رئيس القسم / رئيس الإدارة', nameEn: 'Head of Section / Department', permissions: ['view', 'review', 'approve', 'reject', 'assign'] },
  specialist: { nameAr: 'الموظف المختص', nameEn: 'Specialist Employee', permissions: ['view', 'review', 'request_info', 'report'] },
  technician: { nameAr: 'فني ميداني', nameEn: 'Field Technician', permissions: ['view', 'field_visit', 'report'] },
  coordinator: { nameAr: 'منسق البلدية', nameEn: 'Municipality Coordinator', permissions: ['view', 'review', 'request_info'] },
  gis_coordinator: { nameAr: 'منسق نظم المعلومات الجغرافية', nameEn: 'GIS Coordinator', permissions: ['view', 'review', 'request_info', 'approve'] },
  events_reviewer: { nameAr: 'مراجع الفعاليات', nameEn: 'Events Reviewer', permissions: ['view', 'review', 'request_info', 'field_visit'] },
  food_inspector: { nameAr: 'مفتش الأغذية / قسم الأغذية والمختبرات', nameEn: 'Food Inspector', permissions: ['view', 'review', 'request_info', 'field_visit', 'report'] },
  health_dg: { nameAr: 'المدير العام لشؤون الصحة', nameEn: 'Director General of Health Affairs', permissions: ['view', 'approve', 'reject', 'assign'] },
  veterinarian: { nameAr: 'الطبيب البيطري', nameEn: 'Veterinarian', permissions: ['view', 'review', 'report', 'approve', 'reject'] },
  lab_technician: { nameAr: 'فني المختبر', nameEn: 'Lab Technician', permissions: ['view', 'review', 'report'] },
  finance_officer: { nameAr: 'الموظف المالي المختص', nameEn: 'Finance Officer', permissions: ['view', 'review', 'approve', 'reject'] },
} as const satisfies Record<string, { nameAr: string; nameEn: string; permissions: RolePermission[] }>;

type RoleCode = keyof typeof ROLE_TEMPLATES;

/** Roles per service, extracted from the process swimlanes in "المسارات" PDFs */
export const SERVICE_ROLE_MAP: Record<string, RoleCode[]> = {
  svc_121: ['specialist', 'events_reviewer', 'head'],           // الموافقة على تنظيم الأسواق التخصصية المؤقتة
  svc_125: ['specialist'],                                       // تجديد تصريح قطع أو ثقب
  svc_130: ['finance_officer'],                                  // تحصيل مبالغ التأمينات وإعادتها
  svc_110: ['engineer', 'head'],                                 // ترخيص اللوحات الإرشادية
  svc_108: ['gis_coordinator'],                                  // ترقيم المنازل
  svc_109: ['coordinator', 'engineer', 'head'],                  // تسمية مبنى
  svc_102: ['specialist', 'technician', 'head'],                 // تصاريح ناقلات صهاريج مياه الصرف الصحي
  svc_131: ['specialist', 'head'],                               // ختم تذاكر محلات التسلية ودور السينما
  svc_129: ['finance_officer'],                                  // دفع الغرامات والضرائب والرسوم البلدية
  svc_115: ['engineer', 'head'],                                 // التصديق على مخططات إنارة الطرق والمجمعات
  svc_107: ['engineer', 'technician', 'head'],                   // الرصف بالبلاط المتشابك
  svc_119: ['food_inspector', 'health_dg'],                      // إتلاف مواد غذائية
  svc_132: ['engineer', 'head'],                                 // إنارة مجمع سكني
  svc_127: ['specialist', 'head'],                               // تدريب طلاب مؤسسات التعليم العالي
  svc_113: ['engineer', 'head'],                                 // تصريح قطع أو ثقب الطريق
  svc_117: ['engineer', 'head'],                                 // تقييم أضرار مادية للحوادث المرورية
  svc_118: ['specialist', 'veterinarian'],                       // ذبح حيوانات بالمسلخ المركزي
  svc_126: ['specialist', 'lab_technician'],                     // فحص عينة مخبرية (أغذية - مياه)
};

export const roleId = (serviceId: string, code: string) => `role_${serviceId}_${code}`;

export function buildSeedRoles(now = new Date().toISOString()): ServiceRole[] {
  return Object.entries(SERVICE_ROLE_MAP).flatMap(([serviceId, codes]) =>
    codes.map(code => ({
      id: roleId(serviceId, code),
      serviceId,
      code,
      nameAr: ROLE_TEMPLATES[code].nameAr,
      nameEn: ROLE_TEMPLATES[code].nameEn,
      permissions: [...ROLE_TEMPLATES[code].permissions],
      isActive: true,
      createdAt: now,
    }))
  );
}

/** Example from the requirement: employee 14105 is an engineer in signage licensing (svc_110) */
export function buildSeedUsers(now = new Date().toISOString()): { users: StaffUser[]; assignments: UserRoleAssignment[] } {
  const user: StaffUser = {
    id: 'usr_14105',
    employeeNumber: '14105',
    nameAr: 'موظف 14105',
    department: 'دائرة الطرق والإنارة',
    isActive: true,
    createdAt: now,
  };
  return {
    users: [user],
    assignments: [{
      id: `asg_${user.id}_${roleId('svc_110', 'engineer')}`,
      userId: user.id,
      roleId: roleId('svc_110', 'engineer'),
      serviceId: 'svc_110',
      assignedAt: now,
      assignedBy: 'seed',
    }],
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
