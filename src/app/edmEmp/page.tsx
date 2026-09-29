'use client';

/*
 * Staff control panel (/edmEmp): staff accounts, password resets, roles and permissions per
 * service, and the default staff list. Reached only by its address; admin sign-in required.
 */

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Database, KeyRound, Languages, LayoutDashboard, Loader2, LogOut, Save, ShieldCheck, UserCog, Users } from 'lucide-react';
import { fetchBin, updateBin } from '@/lib/jsonbin';
import { Service, ServiceFlow, ServiceRole, StaffUser, UserRoleAssignment } from '@/lib/types';
import { useSettingsStore } from '@/lib/settings-store';
import { useAdminSession } from '@/lib/admin-session';
import { buildDefaultStaff, DEFAULT_STAFF, IssuedCredential } from '@/lib/staff-directory';
import { AccessControlCenter } from '@/components/admin/access-control-center';
import { IssuedCredentials, StaffAccounts, passwordState } from '@/components/admin/staff-accounts';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type Tab = 'accounts' | 'permissions' | 'defaults';

export default function StaffControlPanel() {
  const { language, setLanguage } = useSettingsStore();
  const isAr = language === 'ar';
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const { toast } = useToast();
  const signOut = useAdminSession(s => s.signOut);

  const [tab, setTab] = useState<Tab>('accounts');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [flows, setFlows] = useState<ServiceFlow[]>([]);
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [serviceRoles, setServiceRoles] = useState<ServiceRole[]>([]);
  const [roleAssignments, setRoleAssignments] = useState<UserRoleAssignment[]>([]);
  const [issued, setIssued] = useState<IssuedCredential[] | null>(null);
  // What the database holds, to know what changed and what to write back
  const saved = useRef({ access: '', flows: '' });

  const snapshot = (u = staffUsers, r = serviceRoles, a = roleAssignments) => JSON.stringify([u, r, a]);
  const dirty = !loading && (snapshot() !== saved.current.access || JSON.stringify(flows) !== saved.current.flows);

  useEffect(() => {
    fetchBin().then(db => {
      setServices(db.services || []);
      setFlows(db.serviceFlows || []);
      setStaffUsers(db.staffUsers || []);
      setServiceRoles(db.serviceRoles || []);
      setRoleAssignments(db.userRoleAssignments || []);
      saved.current = { access: JSON.stringify([db.staffUsers || [], db.serviceRoles || [], db.userRoleAssignments || []]), flows: JSON.stringify(db.serviceFlows || []) };
    }).catch(() => toast({ variant: 'destructive', title: t('تعذّر تحميل البيانات', 'Could not load data') })).finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Warn before leaving with unsaved edits
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  /** Writes staff data (and flows only if this panel changed them) on top of the latest database */
  const save = async (users = staffUsers, roles = serviceRoles, assignments = roleAssignments): Promise<boolean> => {
    setSaving(true);
    try {
      const remote = await fetchBin();
      const flowsChanged = JSON.stringify(flows) !== saved.current.flows;
      await updateBin({ ...remote, staffUsers: users, serviceRoles: roles, userRoleAssignments: assignments, ...(flowsChanged ? { serviceFlows: flows } : {}) });
      setStaffUsers(users); setServiceRoles(roles); setRoleAssignments(assignments);
      saved.current = { access: snapshot(users, roles, assignments), flows: JSON.stringify(flows) };
      toast({ title: t('تم الحفظ', 'Saved') });
      return true;
    } catch {
      toast({ variant: 'destructive', title: t('تعذّر الحفظ. لم تُطبّق التغييرات.', 'Save failed. Nothing was changed.') });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const seedDefaults = async () => {
    setSaving(true);
    const { users, assignments, issued } = await buildDefaultStaff(staffUsers, serviceRoles);
    setSaving(false);
    if (!users.length) { toast({ title: t('القائمة الافتراضية موجودة بالفعل', 'The default list already exists') }); return; }
    const ids = new Set(roleAssignments.map(a => a.id));
    if (await save([...staffUsers, ...users], serviceRoles, [...roleAssignments, ...assignments.filter(a => !ids.has(a.id))])) setIssued(issued);
  };

  const stats = [
    { label: t('الموظفون', 'Staff'), value: staffUsers.length, icon: Users },
    { label: t('نشط', 'Active'), value: staffUsers.filter(u => u.isActive).length, icon: ShieldCheck },
    { label: t('بانتظار تغيير كلمة المرور', 'Must change password'), value: staffUsers.filter(u => passwordState(u) === 'temp').length, icon: KeyRound },
    { label: t('أدوار الخدمات', 'Service roles'), value: serviceRoles.length, icon: UserCog },
  ];
  const TABS: { id: Tab; ar: string; en: string; icon: React.ElementType }[] = [
    { id: 'accounts', ar: 'حسابات الموظفين', en: 'Staff accounts', icon: Users },
    { id: 'permissions', ar: 'الأدوار والصلاحيات', en: 'Roles & permissions', icon: ShieldCheck },
    { id: 'defaults', ar: 'القائمة الافتراضية', en: 'Default list', icon: Database },
  ];
  const missingDefaults = DEFAULT_STAFF.filter(p => !staffUsers.some(u => u.employeeNumber === p.employeeNumber));

  if (loading) return <div className="h-screen flex items-center justify-center" role="status" aria-label={t('جارٍ التحميل', 'Loading')}><Loader2 className="animate-spin text-slate-400" size={36} /></div>;

  return (
    <div className="min-h-screen bg-slate-50" dir={isAr ? 'rtl' : 'ltr'} lang={isAr ? 'ar' : 'en'}>
      <header className="sticky top-0 z-40 bg-[#0b3b37] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center gap-3">
          <span className="size-10 rounded-xl bg-white/10 flex items-center justify-center"><UserCog size={20} aria-hidden /></span>
          <h1 className="font-black text-lg flex-1 truncate">{t('لوحة تحكم الموظفين', 'Staff control panel')}</h1>
          {dirty && <span className="hidden sm:inline text-xs font-black text-amber-300" role="status">{t('تغييرات غير محفوظة', 'Unsaved changes')}</span>}
          <Button onClick={() => save()} disabled={saving || !dirty} className="rounded-xl font-black gap-2 bg-[#03CFCB] text-slate-900 hover:bg-[#03CFCB]/90">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}<span className="hidden sm:inline">{t('حفظ', 'Save')}</span>
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setLanguage(isAr ? 'en' : 'ar')} className="rounded-xl text-white hover:bg-white/10" aria-label={isAr ? 'English' : 'العربية'}><Languages size={18} /></Button>
          <Button variant="ghost" size="icon" asChild className="rounded-xl text-white hover:bg-white/10"><Link href="/edmPortal" aria-label={t('لوحة تحكم البوابة', 'Portal control panel')}><LayoutDashboard size={18} /></Link></Button>
          <Button variant="ghost" size="icon" onClick={signOut} className="rounded-xl text-white hover:bg-white/10" aria-label={t('تسجيل الخروج', 'Sign out')}><LogOut size={18} className={cn(isAr && '-scale-x-100')} /></Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-6">
        <dl className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map(s => (
            <div key={s.label} className="rounded-2xl bg-white ring-1 ring-slate-200 p-4 flex items-center gap-3">
              <span className="size-10 rounded-xl bg-[#03CFCB]/10 text-[#005751] flex items-center justify-center"><s.icon size={18} aria-hidden /></span>
              <div><dt className="text-xs font-bold text-slate-500">{s.label}</dt><dd className="text-2xl font-black text-slate-900">{s.value}</dd></div>
            </div>
          ))}
        </dl>

        <div role="tablist" aria-label={t('أقسام اللوحة', 'Panel sections')} className="flex gap-2 overflow-x-auto p-1.5 bg-white rounded-2xl ring-1 ring-slate-200 w-fit max-w-full">
          {TABS.map(x => (
            <button key={x.id} type="button" role="tab" id={`tab-${x.id}`} aria-selected={tab === x.id} aria-controls={`panel-${x.id}`} onClick={() => setTab(x.id)}
              className={cn('shrink-0 h-11 px-4 rounded-xl flex items-center gap-2 text-sm font-black transition-colors', tab === x.id ? 'bg-[#005751] text-white' : 'text-slate-600 hover:bg-slate-50')}>
              <x.icon size={16} aria-hidden />{isAr ? x.ar : x.en}
            </button>
          ))}
        </div>

        <section id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`}>
          {tab === 'accounts' && (
            <StaffAccounts isAr={isAr} staffUsers={staffUsers} setStaffUsers={setStaffUsers} roleAssignments={roleAssignments}
              commit={(users, assignments) => save(users, serviceRoles, assignments ?? roleAssignments)} />
          )}

          {tab === 'permissions' && (
            <AccessControlCenter isAr={isAr} services={services}
              staffUsers={staffUsers} setStaffUsers={setStaffUsers}
              serviceRoles={serviceRoles} setServiceRoles={setServiceRoles}
              roleAssignments={roleAssignments} setRoleAssignments={setRoleAssignments}
              flows={flows} setFlows={setFlows} />
          )}

          {tab === 'defaults' && (
            <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
              <div className="rounded-3xl bg-white ring-1 ring-slate-200 overflow-hidden">
                <div className="p-5 border-b">
                  <h2 className="text-xl font-black text-slate-900">{t('القائمة الافتراضية للموظفين', 'Default staff list')}</h2>
                  <p className="text-sm font-bold text-slate-500">{t('حساب نموذجي لكل نوع دور في مسارات الخدمات، حتى تجد كل مرحلة من يعالجها. بيانات تجريبية تُستبدل بقائمة الموارد البشرية.', 'One sample account per kind of role in the service flows, so every stage has a handler. Sample data to be replaced with the HR list.')}</p>
                </div>
                <ul className="divide-y">
                  {DEFAULT_STAFF.map(p => {
                    const exists = staffUsers.some(u => u.employeeNumber === p.employeeNumber);
                    const roles = p.roles ? serviceRoles.filter(r => r.isActive && p.roles!.test(r.nameEn)).length : 0;
                    return (
                      <li key={p.employeeNumber} className="flex items-center gap-3 p-4">
                        <span className="font-mono text-sm font-black text-slate-400 w-14" dir="ltr">{p.employeeNumber}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-slate-800 truncate">{isAr ? p.nameAr : p.nameEn}</p>
                          <p className="text-xs font-bold text-slate-500 truncate">{p.jobTitleAr} · {p.department}</p>
                        </div>
                        <span className="text-xs font-black text-slate-500 shrink-0">{p.isSuperAdmin ? t('كل الخدمات', 'All services') : t(`${roles} أدوار`, `${roles} roles`)}</span>
                        <span className={cn('shrink-0 px-2.5 py-1 rounded-full text-[11px] font-black', exists ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500')}>{exists ? t('موجود', 'Exists') : t('سيُنشأ', 'Will be created')}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <aside className="space-y-4">
                <div className="rounded-3xl bg-[#005751] text-white p-5 space-y-3">
                  <h3 className="font-black">{t('إنشاء القائمة', 'Create the list')}</h3>
                  <p className="text-sm font-bold text-white/80">{missingDefaults.length
                    ? t(`سيُنشأ ${missingDefaults.length} حساباً بكلمات مرور مؤقتة، وتُسند لهم أدوارهم ويُحفظ ذلك فوراً. الحسابات الموجودة لا تُمس.`, `${missingDefaults.length} accounts will be created with temporary passwords and their roles, and saved right away. Existing accounts are untouched.`)
                    : t('كل حسابات القائمة الافتراضية موجودة.', 'Every default account already exists.')}</p>
                  <Button onClick={seedDefaults} disabled={saving || !missingDefaults.length} className="w-full rounded-xl font-black gap-2 bg-white text-[#005751] hover:bg-white/90">
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />}{t('إنشاء القائمة الافتراضية', 'Create default list')}
                  </Button>
                </div>
                <p className="text-xs font-bold text-slate-500 px-1">{t('تظهر كلمات المرور المؤقتة مرة واحدة بعد الإنشاء. يمكن إعادة تعيين أي كلمة مرور لاحقاً من تبويب حسابات الموظفين.', 'Temporary passwords are shown once after creation. Any password can be reset later from Staff accounts.')}</p>
              </aside>
            </div>
          )}
        </section>
      </main>

      <IssuedCredentials isAr={isAr} issued={issued} onClose={() => setIssued(null)} />
    </div>
  );
}
