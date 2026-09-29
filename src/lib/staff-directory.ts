import { ServiceRole, StaffUser, UserRoleAssignment } from './types';
import { generateTempPassword, hashPassword } from './staff-password';

/*
 * Default staff list: one sample account per kind of role found in the service flows, so every
 * service stage has someone to handle it on day one. Sample data — replace with the HR list.
 */

interface DefaultProfile {
  employeeNumber: string;
  nameAr: string;
  nameEn: string;
  jobTitleAr: string;
  department: string;
  isSuperAdmin?: boolean;
  /** Service roles this person receives, matched on the role's English name */
  roles?: RegExp;
}

export const DEFAULT_STAFF: DefaultProfile[] = [
  { employeeNumber: '20001', nameAr: 'مدير النظام', nameEn: 'System Administrator', jobTitleAr: 'مدير نظام البوابة', department: 'دائرة تقنية المعلومات', isSuperAdmin: true },
  { employeeNumber: '20002', nameAr: 'سالم بن علي الشحري', nameEn: 'Salim Al Shahri', jobTitleAr: 'رئيس قسم', department: 'دائرة التراخيص', roles: /^Head of Section/ },
  { employeeNumber: '20003', nameAr: 'خالد بن سعيد المعشني', nameEn: 'Khalid Al Mashani', jobTitleAr: 'مهندس / مفتش', department: 'دائرة الطرق والإنارة', roles: /Engineer|Inspector \//i },
  { employeeNumber: '20004', nameAr: 'مريم بنت محمد الكثيري', nameEn: 'Maryam Al Kathiri', jobTitleAr: 'مهندسة / مفتشة', department: 'دائرة التخطيط العمراني', roles: /Engineer/i },
  { employeeNumber: '20005', nameAr: 'أحمد بن مسلم الحضري', nameEn: 'Ahmed Al Hadhri', jobTitleAr: 'موظف مختص', department: 'دائرة خدمة المراجعين', roles: /Competent Employee/i },
  { employeeNumber: '20006', nameAr: 'فاطمة بنت سالم المهري', nameEn: 'Fatma Al Mahri', jobTitleAr: 'موظفة مختصة', department: 'دائرة خدمة المراجعين', roles: /Competent Employee/i },
  { employeeNumber: '20007', nameAr: 'يوسف بن عوض البرعمي', nameEn: 'Yousuf Al Baraami', jobTitleAr: 'منسق الشؤون الفنية ونظم المعلومات الجغرافية', department: 'دائرة الشؤون الفنية', roles: /Coordinator/i },
  { employeeNumber: '20008', nameAr: 'د. نادية بنت عامر العمري', nameEn: 'Dr Nadia Al Amri', jobTitleAr: 'طبيبة بيطرية', department: 'دائرة الشؤون الصحية', roles: /Veterinarian/i },
  { employeeNumber: '20009', nameAr: 'سعيد بن حمد الرواس', nameEn: 'Saeed Al Rawas', jobTitleAr: 'مفتش أغذية ومختبرات', department: 'دائرة الشؤون الصحية', roles: /Food Inspector/i },
  { employeeNumber: '20010', nameAr: 'محمد بن عبدالله الغساني', nameEn: 'Mohammed Al Ghassani', jobTitleAr: 'مدير عام الشؤون الصحية', department: 'المديرية العامة للشؤون الصحية', roles: /Director General/i },
  { employeeNumber: '20011', nameAr: 'هند بنت سهيل بيت سعيد', nameEn: 'Hind Bait Saeed', jobTitleAr: 'مراجعة الفعاليات', department: 'دائرة الفعاليات والأنشطة', roles: /Events Reviewer/i },
];

export interface IssuedCredential { employeeNumber: string; nameAr: string; nameEn: string; tempPassword: string }

/** Adds the default accounts that don't exist yet (by employee number), each with a temporary password */
export async function buildDefaultStaff(existing: StaffUser[], roles: ServiceRole[], by = 'edmEmp') {
  const now = new Date().toISOString();
  const taken = new Set(existing.map(u => u.employeeNumber));
  const users: StaffUser[] = [];
  const assignments: UserRoleAssignment[] = [];
  const issued: IssuedCredential[] = [];

  for (const p of DEFAULT_STAFF.filter(p => !taken.has(p.employeeNumber))) {
    const tempPassword = generateTempPassword();
    const user: StaffUser = {
      id: `usr_${p.employeeNumber}`,
      employeeNumber: p.employeeNumber,
      nameAr: p.nameAr,
      nameEn: p.nameEn,
      jobTitle: p.jobTitleAr,
      department: p.department,
      isActive: true,
      isSuperAdmin: p.isSuperAdmin,
      passwordHash: await hashPassword(tempPassword),
      mustChangePassword: true,
      passwordUpdatedAt: now,
      createdAt: now,
    };
    users.push(user);
    issued.push({ employeeNumber: p.employeeNumber, nameAr: p.nameAr, nameEn: p.nameEn, tempPassword });
    if (p.roles) roles.filter(r => r.isActive && p.roles!.test(r.nameEn)).forEach(r => assignments.push({
      id: `asg_${user.id}_${r.id}`, userId: user.id, roleId: r.id, serviceId: r.serviceId, assignedAt: now, assignedBy: by,
    }));
  }
  return { users, assignments, issued };
}
