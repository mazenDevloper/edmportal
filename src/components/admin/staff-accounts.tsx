'use client';

import React, { useMemo, useState } from 'react';
import { Check, Copy, KeyRound, Loader2, Pencil, Plus, Search, ShieldAlert, Trash2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { StaffUser, UserRoleAssignment } from '@/lib/types';
import { generateTempPassword, hashPassword } from '@/lib/staff-password';
import { IssuedCredential } from '@/lib/staff-directory';
import { cn } from '@/lib/utils';

interface Props {
  isAr: boolean;
  staffUsers: StaffUser[];
  roleAssignments: UserRoleAssignment[];
  /** Applies the change and saves it to the database right away (password changes must not wait for "Save") */
  commit: (users: StaffUser[], assignments?: UserRoleAssignment[]) => Promise<boolean>;
  setStaffUsers: React.Dispatch<React.SetStateAction<StaffUser[]>>;
}

type Draft = Pick<StaffUser, 'employeeNumber' | 'nameAr' | 'nameEn' | 'jobTitle' | 'jobTitleEn' | 'department' | 'email' | 'phone' | 'civilNumber' | 'isSuperAdmin'>;
const EMPTY: Draft = { employeeNumber: '', nameAr: '', nameEn: '', jobTitle: '', jobTitleEn: '', department: '', email: '', phone: '', civilNumber: '', isSuperAdmin: false };
type Filter = 'all' | 'active' | 'inactive' | 'temp' | 'nopass';

export function passwordState(u: StaffUser): 'set' | 'temp' | 'none' {
  if (!u.passwordHash) return 'none';
  return u.mustChangePassword ? 'temp' : 'set';
}

export function StaffAccounts({ isAr, staffUsers, roleAssignments, commit, setStaffUsers }: Props) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [editing, setEditing] = useState<{ id: string | null; draft: Draft } | null>(null);
  const [confirmReset, setConfirmReset] = useState<StaffUser | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<StaffUser | null>(null);
  const [issued, setIssued] = useState<IssuedCredential[] | null>(null);
  const [busy, setBusy] = useState(false);

  const roleCount = (id: string) => roleAssignments.filter(a => a.userId === id).length;
  const counts = {
    all: staffUsers.length,
    active: staffUsers.filter(u => u.isActive).length,
    inactive: staffUsers.filter(u => !u.isActive).length,
    temp: staffUsers.filter(u => passwordState(u) === 'temp').length,
    nopass: staffUsers.filter(u => passwordState(u) === 'none').length,
  };

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return staffUsers
      .filter(u => filter === 'all' || (filter === 'active' ? u.isActive : filter === 'inactive' ? !u.isActive : filter === 'temp' ? passwordState(u) === 'temp' : passwordState(u) === 'none'))
      .filter(u => !needle || [u.employeeNumber, u.nameAr, u.nameEn, u.department, u.jobTitle, u.email].some(v => (v || '').toLowerCase().includes(needle)))
      .sort((a, b) => a.employeeNumber.localeCompare(b.employeeNumber, undefined, { numeric: true }));
  }, [staffUsers, q, filter]);

  const saveDraft = async () => {
    if (!editing) return;
    const d = editing.draft;
    const emp = d.employeeNumber.trim();
    if (!/^\d{3,10}$/.test(emp) || !d.nameAr.trim()) {
      toast({ variant: 'destructive', title: t('الرقم الوظيفي (أرقام) والاسم العربي مطلوبان', 'Employee number (digits) and Arabic name are required') });
      return;
    }
    if (staffUsers.some(u => u.employeeNumber === emp && u.id !== editing.id)) {
      toast({ variant: 'destructive', title: t('الرقم الوظيفي مسجل لموظف آخر', 'That employee number belongs to someone else') });
      return;
    }
    const clean = (v?: string) => v?.trim() || undefined;
    const fields = { employeeNumber: emp, nameAr: d.nameAr.trim(), nameEn: clean(d.nameEn), jobTitle: clean(d.jobTitle), jobTitleEn: clean(d.jobTitleEn), department: clean(d.department), email: clean(d.email), phone: clean(d.phone), civilNumber: clean(d.civilNumber), isSuperAdmin: !!d.isSuperAdmin };
    setBusy(true);
    if (editing.id) {
      setStaffUsers(prev => prev.map(u => (u.id === editing.id ? { ...u, ...fields } : u)));
      setEditing(null);
      setBusy(false);
      return;
    }
    // New account: created with a temporary password, saved immediately
    const tempPassword = generateTempPassword();
    const user: StaffUser = { id: `usr_${emp}`, ...fields, isActive: true, passwordHash: await hashPassword(tempPassword), mustChangePassword: true, passwordUpdatedAt: new Date().toISOString(), createdAt: new Date().toISOString() };
    const ok = await commit([...staffUsers, user]);
    setBusy(false);
    if (ok) { setEditing(null); setIssued([{ employeeNumber: emp, nameAr: user.nameAr, nameEn: user.nameEn || '', tempPassword }]); }
  };

  const doReset = async (u: StaffUser) => {
    setBusy(true);
    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);
    const ok = await commit(staffUsers.map(x => (x.id === u.id ? { ...x, passwordHash, mustChangePassword: true, passwordUpdatedAt: new Date().toISOString() } : x)));
    setBusy(false);
    setConfirmReset(null);
    if (ok) setIssued([{ employeeNumber: u.employeeNumber, nameAr: u.nameAr, nameEn: u.nameEn || '', tempPassword }]);
  };

  const doDelete = async (u: StaffUser) => {
    setBusy(true);
    const ok = await commit(staffUsers.filter(x => x.id !== u.id), roleAssignments.filter(a => a.userId !== u.id));
    setBusy(false);
    setConfirmDelete(null);
    if (ok) toast({ title: t('تم حذف الحساب', 'Account deleted') });
  };

  const FILTERS: { id: Filter; ar: string; en: string }[] = [
    { id: 'all', ar: 'الكل', en: 'All' }, { id: 'active', ar: 'نشط', en: 'Active' }, { id: 'inactive', ar: 'موقوف', en: 'Disabled' },
    { id: 'temp', ar: 'كلمة مرور مؤقتة', en: 'Temporary password' }, { id: 'nopass', ar: 'بلا كلمة مرور', en: 'No password' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={16} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder={t('ابحث بالرقم الوظيفي أو الاسم أو الدائرة', 'Search by number, name or department')} aria-label={t('بحث في الموظفين', 'Search staff')} className="h-11 ps-9 rounded-xl" />
        </div>
        <Button onClick={() => setEditing({ id: null, draft: EMPTY })} className="h-11 rounded-xl font-black gap-2 bg-[#005751] hover:bg-[#005751]/90"><UserPlus size={17} />{t('إضافة موظف', 'Add employee')}</Button>
      </div>

      <div role="group" aria-label={t('تصفية', 'Filter')} className="flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <button key={f.id} type="button" onClick={() => setFilter(f.id)} aria-pressed={filter === f.id}
            className={cn('h-9 px-3 rounded-full text-xs font-black ring-1 transition-colors', filter === f.id ? 'bg-slate-900 text-white ring-slate-900' : 'bg-white text-slate-600 ring-slate-200 hover:ring-slate-400')}>
            {isAr ? f.ar : f.en} <span className="opacity-60">{counts[f.id]}</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl ring-1 ring-slate-200 overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-black">{t('الموظف', 'Employee')}</TableHead>
              <TableHead className="font-black">{t('الدائرة', 'Department')}</TableHead>
              <TableHead className="font-black text-center">{t('الأدوار', 'Roles')}</TableHead>
              <TableHead className="font-black">{t('كلمة المرور', 'Password')}</TableHead>
              <TableHead className="font-black text-center">{t('نشط', 'Active')}</TableHead>
              <TableHead className="font-black">{t('إجراءات', 'Actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(u => {
              const ps = passwordState(u);
              const name = isAr ? u.nameAr : u.nameEn || u.nameAr;
              return (
                <TableRow key={u.id} className={cn(!u.isActive && 'opacity-60')}>
                  <TableCell>
                    <p className="font-black text-slate-800">{name}{u.isSuperAdmin && <Badge className="ms-2 bg-red-500">{t('مدير نظام', 'Super admin')}</Badge>}</p>
                    <p className="text-xs font-bold text-slate-400"><span className="font-mono" dir="ltr">{u.employeeNumber}</span>{u.jobTitle && ` · ${u.jobTitle}`}</p>
                  </TableCell>
                  <TableCell className="text-sm font-bold text-slate-600">{u.department || '—'}</TableCell>
                  <TableCell className="text-center font-black">{u.isSuperAdmin ? t('الكل', 'All') : roleCount(u.id)}</TableCell>
                  <TableCell>
                    <span className={cn('inline-block px-2.5 py-1 rounded-full text-[11px] font-black', ps === 'set' ? 'bg-emerald-100 text-emerald-800' : ps === 'temp' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600')}>
                      {ps === 'set' ? t('معيّنة', 'Set') : ps === 'temp' ? t('مؤقتة – يغيّرها عند الدخول', 'Temporary – change at sign-in') : t('غير معيّنة', 'Not set')}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch checked={u.isActive} onCheckedChange={v => setStaffUsers(prev => prev.map(x => (x.id === u.id ? { ...x, isActive: v } : x)))} aria-label={t(`تفعيل حساب ${name}`, `Account active: ${name}`)} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="rounded-xl" aria-label={t(`تعديل ${name}`, `Edit ${name}`)} onClick={() => setEditing({ id: u.id, draft: { employeeNumber: u.employeeNumber, nameAr: u.nameAr, nameEn: u.nameEn || '', jobTitle: u.jobTitle || '', jobTitleEn: u.jobTitleEn || '', department: u.department || '', email: u.email || '', phone: u.phone || '', civilNumber: u.civilNumber || '', isSuperAdmin: !!u.isSuperAdmin } })}><Pencil size={16} /></Button>
                      <Button variant="ghost" size="sm" className="rounded-xl font-black gap-1.5 text-[#005751]" onClick={() => setConfirmReset(u)}><KeyRound size={15} />{t('إعادة تعيين', 'Reset')}</Button>
                      <Button variant="ghost" size="icon" className="rounded-xl text-red-500 hover:bg-red-50" aria-label={t(`حذف ${name}`, `Delete ${name}`)} onClick={() => setConfirmDelete(u)}><Trash2 size={16} /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {!rows.length && <TableRow><TableCell colSpan={6} className="text-center py-10 font-bold text-slate-400">{t('لا يوجد موظفون مطابقون', 'No matching staff')}</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

      {/* Add / edit */}
      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent dir={isAr ? 'rtl' : 'ltr'} className="max-w-xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-black">{editing?.id ? t('تعديل بيانات الموظف', 'Edit employee') : t('إضافة موظف', 'Add employee')}</DialogTitle>
            {!editing?.id && <DialogDescription>{t('يُنشأ الحساب بكلمة مرور مؤقتة تظهر لك مرة واحدة، ويُطلب من الموظف تغييرها عند أول دخول.', 'The account gets a temporary password shown to you once; the employee must change it at first sign-in.')}</DialogDescription>}
          </DialogHeader>
          {editing && (
            <div className="grid sm:grid-cols-2 gap-3">
              {([
                ['employeeNumber', t('الرقم الوظيفي *', 'Employee number *'), 'numeric', 'ltr'],
                ['nameAr', t('الاسم بالعربية *', 'Name (Arabic) *'), 'text', 'rtl'],
                ['nameEn', t('الاسم بالإنجليزية', 'Name (English)'), 'text', 'ltr'],
                ['jobTitle', t('المسمى الوظيفي', 'Job title'), 'text', undefined],
                ['jobTitleEn', t('المسمى الوظيفي (إنجليزي)', 'Job title (English)'), 'text', 'ltr'],
                ['department', t('الدائرة', 'Department'), 'text', undefined],
                ['email', t('البريد الإلكتروني', 'Email'), 'email', 'ltr'],
                ['phone', t('الهاتف', 'Phone'), 'tel', 'ltr'],
                ['civilNumber', t('الرقم المدني (للدخول عبر ثقة)', 'Civil number (for Thiqa)'), 'numeric', 'ltr'],
              ] as const).map(([key, label, mode, dir]) => (
                <div key={key} className="space-y-1">
                  <Label htmlFor={`st-${key}`} className="text-xs font-black text-slate-600">{label}</Label>
                  <Input id={`st-${key}`} dir={dir} inputMode={mode === 'numeric' ? 'numeric' : undefined} type={mode === 'email' ? 'email' : mode === 'tel' ? 'tel' : 'text'}
                    value={(editing.draft[key] as string) || ''} onChange={e => setEditing({ ...editing, draft: { ...editing.draft, [key]: mode === 'numeric' ? e.target.value.replace(/\D/g, '') : e.target.value } })} className="h-10 rounded-xl" />
                </div>
              ))}
              <label className="sm:col-span-2 flex items-center justify-between gap-3 p-3 rounded-xl bg-red-50 text-sm font-black text-red-800">
                <span className="flex items-center gap-2"><ShieldAlert size={16} aria-hidden />{t('مدير نظام (صلاحية على كل الخدمات)', 'Super admin (access to every service)')}</span>
                <Switch checked={!!editing.draft.isSuperAdmin} onCheckedChange={v => setEditing({ ...editing, draft: { ...editing.draft, isSuperAdmin: v } })} />
              </label>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setEditing(null)} className="font-black">{t('إلغاء', 'Cancel')}</Button>
            <Button onClick={saveDraft} disabled={busy} className="font-black gap-2 bg-[#005751]">{busy ? <Loader2 size={16} className="animate-spin" /> : editing?.id ? <Check size={16} /> : <Plus size={16} />}{editing?.id ? t('تطبيق', 'Apply') : t('إنشاء الحساب', 'Create account')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset confirmation */}
      <Dialog open={!!confirmReset} onOpenChange={o => !o && setConfirmReset(null)}>
        <DialogContent dir={isAr ? 'rtl' : 'ltr'} className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-black">{t('إعادة تعيين كلمة المرور', 'Reset password')}</DialogTitle>
            <DialogDescription>{confirmReset && t(`ستتوقف كلمة المرور الحالية لـ ${confirmReset.nameAr} (${confirmReset.employeeNumber}) فوراً، وتُنشأ كلمة مرور مؤقتة يجب تغييرها عند الدخول.`, `${confirmReset.nameEn || confirmReset.nameAr}'s current password stops working now, and a temporary one is created that must be changed at sign-in.`)}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setConfirmReset(null)} className="font-black">{t('إلغاء', 'Cancel')}</Button>
            <Button onClick={() => confirmReset && doReset(confirmReset)} disabled={busy} className="font-black gap-2 bg-[#005751]">{busy ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}{t('إعادة التعيين', 'Reset')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!confirmDelete} onOpenChange={o => !o && setConfirmDelete(null)}>
        <DialogContent dir={isAr ? 'rtl' : 'ltr'} className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-black">{t('حذف حساب الموظف', 'Delete staff account')}</DialogTitle>
            <DialogDescription>{confirmDelete && t(`سيُحذف حساب ${confirmDelete.nameAr} وكل أدواره نهائياً. لإيقافه مؤقتاً استخدم مفتاح "نشط" بدلاً من ذلك.`, `${confirmDelete.nameEn || confirmDelete.nameAr}'s account and all their roles will be deleted. To pause it instead, switch off "Active".`)}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setConfirmDelete(null)} className="font-black">{t('إلغاء', 'Cancel')}</Button>
            <Button variant="destructive" onClick={() => confirmDelete && doDelete(confirmDelete)} disabled={busy} className="font-black gap-2">{busy ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}{t('حذف', 'Delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <IssuedCredentials isAr={isAr} issued={issued} onClose={() => setIssued(null)} />
    </div>
  );
}

/** Temporary passwords, shown exactly once after they are created */
export function IssuedCredentials({ isAr, issued, onClose }: { isAr: boolean; issued: IssuedCredential[] | null; onClose: () => void }) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (text: string, key: string) => {
    try { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(null), 1500); } catch { /* clipboard blocked */ }
  };
  const all = (issued || []).map(c => `${c.employeeNumber}\t${c.nameAr}\t${c.tempPassword}`).join('\n');

  return (
    <Dialog open={!!issued} onOpenChange={o => !o && onClose()}>
      <DialogContent dir={isAr ? 'rtl' : 'ltr'} className="max-w-lg rounded-3xl">
        <DialogHeader>
          <DialogTitle className="font-black">{t('كلمات المرور المؤقتة', 'Temporary passwords')}</DialogTitle>
          <DialogDescription className="font-bold text-amber-800">{t('تظهر مرة واحدة فقط ولا يمكن استرجاعها. سلّمها لأصحابها بطريقة آمنة؛ وسيُطلب منهم تغييرها عند أول دخول.', 'Shown only once and cannot be recovered. Hand them over securely; each employee must change theirs at first sign-in.')}</DialogDescription>
        </DialogHeader>
        <ul className="max-h-[50vh] overflow-y-auto divide-y rounded-2xl ring-1 ring-slate-200">
          {(issued || []).map(c => (
            <li key={c.employeeNumber} className="flex items-center gap-3 p-3">
              <div className="flex-1 min-w-0">
                <p className="font-black text-slate-800 truncate">{isAr ? c.nameAr : c.nameEn || c.nameAr}</p>
                <p className="text-xs font-bold text-slate-400">{t('الرقم الوظيفي', 'Employee no.')} <span className="font-mono" dir="ltr">{c.employeeNumber}</span></p>
              </div>
              <code dir="ltr" className="px-3 py-1.5 rounded-lg bg-slate-900 text-emerald-300 font-mono font-black tracking-wider">{c.tempPassword}</code>
              <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => copy(c.tempPassword, c.employeeNumber)} aria-label={t('نسخ كلمة المرور', 'Copy password')}>
                {copied === c.employeeNumber ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
              </Button>
            </li>
          ))}
        </ul>
        <DialogFooter className="gap-2">
          {(issued?.length || 0) > 1 && <Button variant="outline" onClick={() => copy(all, '__all')} className="font-black gap-2">{copied === '__all' ? <Check size={16} /> : <Copy size={16} />}{t('نسخ الكل', 'Copy all')}</Button>}
          <Button onClick={onClose} className="font-black bg-[#005751]">{t('تم التسليم', 'Done')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
