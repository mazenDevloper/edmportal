'use client';

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Service, ServiceRole, StaffUser, UserRoleAssignment, RolePermission } from '@/lib/types';
import {
  ALL_PERMISSIONS, buildSeedRoles, buildSeedUsers, mergeById,
  findUserByEmployeeNumber, getUserRoles, SERVICE_ROLE_MAP,
} from '@/lib/rbac';
import { Users, ShieldCheck, KeyRound, Plus, Trash2, Search, Database, UserCog, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Props {
  isAr: boolean;
  services: Service[];
  staffUsers: StaffUser[];
  setStaffUsers: React.Dispatch<React.SetStateAction<StaffUser[]>>;
  serviceRoles: ServiceRole[];
  setServiceRoles: React.Dispatch<React.SetStateAction<ServiceRole[]>>;
  roleAssignments: UserRoleAssignment[];
  setRoleAssignments: React.Dispatch<React.SetStateAction<UserRoleAssignment[]>>;
}

const EMPTY_USER = { employeeNumber: '', nameAr: '', nameEn: '', email: '', department: '', isSuperAdmin: false };

export function AccessControlCenter({
  isAr, services, staffUsers, setStaffUsers, serviceRoles, setServiceRoles, roleAssignments, setRoleAssignments,
}: Props) {
  const { toast } = useToast();
  const [newUser, setNewUser] = useState(EMPTY_USER);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [assignSearch, setAssignSearch] = useState('');
  const [roleServiceId, setRoleServiceId] = useState<string>('svc_110');
  const [newRole, setNewRole] = useState({ nameAr: '', nameEn: '' });
  const [checkNumber, setCheckNumber] = useState('');

  const serviceName = (id: string) => {
    const s = services.find(x => x.id === id);
    return s ? (isAr ? s.title : s.titleEn || s.title) : id;
  };

  const accessData = { staffUsers, serviceRoles, roleAssignments };
  const selectedUser = staffUsers.find(u => u.id === selectedUserId) || null;

  // Services that have roles defined, first; then the rest
  const servicesWithRoles = useMemo(() => {
    const ids = new Set(serviceRoles.map(r => r.serviceId));
    return [...services].sort((a, b) => Number(ids.has(b.id)) - Number(ids.has(a.id)));
  }, [services, serviceRoles]);

  const filteredUsers = staffUsers.filter(u =>
    [u.employeeNumber, u.nameAr, u.nameEn, u.department].some(v => (v || '').toLowerCase().includes(userSearch.toLowerCase()))
  );

  // ─── Users ───
  const handleAddUser = () => {
    const num = newUser.employeeNumber.trim();
    if (!num || !newUser.nameAr.trim()) {
      toast({ variant: 'destructive', title: isAr ? 'الرقم الوظيفي والاسم مطلوبان' : 'Employee number and name are required' });
      return;
    }
    if (staffUsers.some(u => u.employeeNumber === num)) {
      toast({ variant: 'destructive', title: isAr ? 'الرقم الوظيفي مسجل مسبقاً' : 'Employee number already exists' });
      return;
    }
    const user: StaffUser = {
      id: `usr_${num}`,
      employeeNumber: num,
      nameAr: newUser.nameAr.trim(),
      nameEn: newUser.nameEn.trim() || undefined,
      email: newUser.email.trim() || undefined,
      department: newUser.department.trim() || undefined,
      isSuperAdmin: newUser.isSuperAdmin,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    setStaffUsers(prev => [...prev, user]);
    setNewUser(EMPTY_USER);
    setSelectedUserId(user.id);
  };

  const handleDeleteUser = (id: string) => {
    setStaffUsers(prev => prev.filter(u => u.id !== id));
    setRoleAssignments(prev => prev.filter(a => a.userId !== id));
    if (selectedUserId === id) setSelectedUserId(null);
  };

  const toggleAssignment = (user: StaffUser, role: ServiceRole, on: boolean) => {
    setRoleAssignments(prev => on
      ? [...prev.filter(a => !(a.userId === user.id && a.roleId === role.id)), {
          id: `asg_${user.id}_${role.id}`,
          userId: user.id,
          roleId: role.id,
          serviceId: role.serviceId,
          assignedAt: new Date().toISOString(),
          assignedBy: 'admin',
        }]
      : prev.filter(a => !(a.userId === user.id && a.roleId === role.id))
    );
  };

  // ─── Roles ───
  const rolesOfService = serviceRoles.filter(r => r.serviceId === roleServiceId);

  const handleAddRole = () => {
    if (!newRole.nameAr.trim()) return;
    const role: ServiceRole = {
      id: `role_${roleServiceId}_${Date.now()}`,
      serviceId: roleServiceId,
      code: `custom_${Date.now()}`,
      nameAr: newRole.nameAr.trim(),
      nameEn: newRole.nameEn.trim() || newRole.nameAr.trim(),
      permissions: ['view'],
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    setServiceRoles(prev => [...prev, role]);
    setNewRole({ nameAr: '', nameEn: '' });
  };

  const updateRole = (id: string, updates: Partial<ServiceRole>) =>
    setServiceRoles(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));

  const togglePermission = (role: ServiceRole, p: RolePermission, on: boolean) =>
    updateRole(role.id, { permissions: on ? [...new Set([...role.permissions, p])] : role.permissions.filter(x => x !== p) });

  const handleDeleteRole = (id: string) => {
    setServiceRoles(prev => prev.filter(r => r.id !== id));
    setRoleAssignments(prev => prev.filter(a => a.roleId !== id));
  };

  const handleSeed = () => {
    const seed = buildSeedUsers();
    // Reuse an existing record when the employee number is already registered
    const idMap = new Map(seed.users.map(u => [u.id, staffUsers.find(p => p.employeeNumber === u.employeeNumber)?.id ?? u.id]));
    const assignments = seed.assignments.map(a => {
      const userId = idMap.get(a.userId) ?? a.userId;
      return { ...a, userId, id: `asg_${userId}_${a.roleId}` };
    });
    setServiceRoles(prev => mergeById(prev, buildSeedRoles()));
    setStaffUsers(prev => mergeById(prev, seed.users.filter(u => !prev.some(p => p.employeeNumber === u.employeeNumber))));
    setRoleAssignments(prev => mergeById(prev, assignments.filter(a => !prev.some(p => p.userId === a.userId && p.roleId === a.roleId))));
    toast({
      title: isAr ? 'تم تحميل أدوار المسارات' : 'Workflow roles loaded',
      description: isAr ? `${Object.keys(SERVICE_ROLE_MAP).length} خدمة — اضغط "حفظ ومزامنة النظام" للحفظ في قاعدة البيانات` : `${Object.keys(SERVICE_ROLE_MAP).length} services — press "Sync Matrix" to persist`,
    });
  };

  // ─── Permission check ───
  const checkedUser = checkNumber.trim() ? findUserByEmployeeNumber(accessData, checkNumber) : undefined;
  const checkedRoles = checkedUser ? getUserRoles(accessData, checkedUser.id) : [];
  const checkedByService = checkedRoles.reduce<Record<string, ServiceRole[]>>((acc, r) => {
    (acc[r.serviceId] ||= []).push(r);
    return acc;
  }, {});

  const permLabel = (p: RolePermission) => {
    const def = ALL_PERMISSIONS.find(x => x.id === p);
    return def ? (isAr ? def.labelAr : def.labelEn) : p;
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        {[
          { label: isAr ? 'المستخدمون' : 'Staff users', val: staffUsers.length, icon: <Users />, color: 'bg-primary' },
          { label: isAr ? 'الأدوار المعرّفة' : 'Service roles', val: serviceRoles.length, icon: <ShieldCheck />, color: 'bg-accent' },
          { label: isAr ? 'الإسنادات' : 'Assignments', val: roleAssignments.length, icon: <KeyRound />, color: 'bg-slate-900' },
        ].map((card, i) => (
          <Card key={i} className={cn('rounded-[2rem] border-none shadow-xl text-white p-8 flex items-center justify-between', card.color)}>
            <div>
              <p className="text-[10px] font-black opacity-60 uppercase tracking-widest">{card.label}</p>
              <h3 className="text-5xl font-black tracking-tighter">{card.val}</h3>
            </div>
            <div className="opacity-40">{card.icon}</div>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="users" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-4 rounded-[2rem] shadow-sm">
          <TabsList className="rounded-xl">
            <TabsTrigger value="users" className="font-black gap-2"><UserCog size={16} />{isAr ? 'المستخدمون وأدوارهم' : 'Users & roles'}</TabsTrigger>
            <TabsTrigger value="roles" className="font-black gap-2"><ShieldCheck size={16} />{isAr ? 'أدوار كل خدمة' : 'Roles per service'}</TabsTrigger>
            <TabsTrigger value="check" className="font-black gap-2"><KeyRound size={16} />{isAr ? 'فحص الصلاحيات' : 'Check access'}</TabsTrigger>
          </TabsList>
          <Button variant="outline" onClick={handleSeed} className="rounded-full px-6 font-black border-slate-200 gap-2">
            <Database size={16} /> {isAr ? 'تحميل أدوار المسارات' : 'Seed workflow roles'}
          </Button>
        </div>

        {/* ─── Users ─── */}
        <TabsContent value="users" className="mt-6">
          <div className="grid xl:grid-cols-5 gap-6">
            <div className="xl:col-span-2 space-y-6">
              <Card className="rounded-[2rem] border-none shadow-xl bg-white p-6 space-y-4">
                <h3 className="font-black text-lg flex items-center gap-2"><Plus size={18} className="text-accent" />{isAr ? 'إضافة مستخدم' : 'Add user'}</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><Label className="text-xs font-bold">{isAr ? 'الرقم الوظيفي *' : 'Employee no. *'}</Label><Input value={newUser.employeeNumber} onChange={e => setNewUser({ ...newUser, employeeNumber: e.target.value })} placeholder="14105" className="rounded-xl" /></div>
                  <div className="space-y-1"><Label className="text-xs font-bold">{isAr ? 'الاسم (عربي) *' : 'Name (AR) *'}</Label><Input value={newUser.nameAr} onChange={e => setNewUser({ ...newUser, nameAr: e.target.value })} className="rounded-xl" /></div>
                  <div className="space-y-1"><Label className="text-xs font-bold">{isAr ? 'الاسم (إنجليزي)' : 'Name (EN)'}</Label><Input value={newUser.nameEn} onChange={e => setNewUser({ ...newUser, nameEn: e.target.value })} className="rounded-xl" /></div>
                  <div className="space-y-1"><Label className="text-xs font-bold">{isAr ? 'البريد الإلكتروني' : 'Email'}</Label><Input type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} className="rounded-xl" /></div>
                  <div className="space-y-1 col-span-2"><Label className="text-xs font-bold">{isAr ? 'الدائرة / القسم' : 'Department'}</Label><Input value={newUser.department} onChange={e => setNewUser({ ...newUser, department: e.target.value })} className="rounded-xl" /></div>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <Label className="text-xs font-bold">{isAr ? 'مدير نظام (كل الصلاحيات)' : 'Super admin (all permissions)'}</Label>
                  <Switch checked={newUser.isSuperAdmin} onCheckedChange={v => setNewUser({ ...newUser, isSuperAdmin: v })} />
                </div>
                <Button onClick={handleAddUser} className="w-full rounded-xl dm-gradient-primary font-black">{isAr ? 'إضافة' : 'Add'}</Button>
              </Card>

              <Card className="rounded-[2rem] border-none shadow-xl bg-white overflow-hidden">
                <div className="p-4 border-b relative">
                  <Search className="absolute start-7 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <Input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder={isAr ? 'بحث بالرقم الوظيفي أو الاسم...' : 'Search by number or name...'} className="ps-10 rounded-xl" />
                </div>
                <Table>
                  <TableHeader className="bg-slate-50"><TableRow>
                    <TableHead className="font-black">{isAr ? 'الرقم' : 'No.'}</TableHead>
                    <TableHead className="font-black">{isAr ? 'الاسم' : 'Name'}</TableHead>
                    <TableHead className="font-black text-center">{isAr ? 'الأدوار' : 'Roles'}</TableHead>
                    <TableHead className="font-black text-center">{isAr ? 'نشط' : 'Active'}</TableHead>
                    <TableHead />
                  </TableRow></TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-slate-400 py-8 text-sm">{isAr ? 'لا يوجد مستخدمون بعد' : 'No users yet'}</TableCell></TableRow>
                    )}
                    {filteredUsers.map(u => (
                      <TableRow key={u.id} onClick={() => setSelectedUserId(u.id)} className={cn('cursor-pointer', selectedUserId === u.id && 'bg-accent/10')}>
                        <TableCell className="font-mono font-bold">{u.employeeNumber}</TableCell>
                        <TableCell>
                          <p className="font-bold text-sm">{isAr ? u.nameAr : u.nameEn || u.nameAr}</p>
                          {u.isSuperAdmin && <Badge className="text-[9px] bg-red-500">SUPER ADMIN</Badge>}
                        </TableCell>
                        <TableCell className="text-center"><Badge variant="secondary">{roleAssignments.filter(a => a.userId === u.id).length}</Badge></TableCell>
                        <TableCell className="text-center" onClick={e => e.stopPropagation()}>
                          <Switch checked={u.isActive} onCheckedChange={v => setStaffUsers(prev => prev.map(x => x.id === u.id ? { ...x, isActive: v } : x))} />
                        </TableCell>
                        <TableCell onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(u.id)} className="text-red-400 hover:bg-red-50 rounded-xl"><Trash2 size={16} /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>

            <Card className="xl:col-span-3 rounded-[2rem] border-none shadow-xl bg-white p-6 space-y-4">
              {!selectedUser ? (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-slate-400 gap-3">
                  <UserCog size={40} />
                  <p className="font-bold text-sm">{isAr ? 'اختر مستخدماً لتحديد أدواره في كل خدمة' : 'Select a user to assign roles per service'}</p>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black text-xl">{isAr ? selectedUser.nameAr : selectedUser.nameEn || selectedUser.nameAr}</h3>
                      <p className="text-xs text-slate-400 font-bold">{isAr ? 'الرقم الوظيفي' : 'Employee no.'} {selectedUser.employeeNumber}{selectedUser.department ? ` · ${selectedUser.department}` : ''}</p>
                    </div>
                    <div className="flex flex-wrap gap-1 max-w-md">
                      {getUserRoles(accessData, selectedUser.id).map(r => (
                        <Badge key={r.id} variant="outline" className="gap-1 rounded-lg text-[10px]">
                          {isAr ? r.nameAr : r.nameEn} — {serviceName(r.serviceId)}
                          <button onClick={() => toggleAssignment(selectedUser, r, false)} aria-label="remove"><X size={10} /></button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="relative">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <Input value={assignSearch} onChange={e => setAssignSearch(e.target.value)} placeholder={isAr ? 'ابحث عن خدمة...' : 'Search services...'} className="ps-10 rounded-xl" />
                  </div>
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pe-1">
                    {servicesWithRoles
                      .filter(s => serviceName(s.id).toLowerCase().includes(assignSearch.toLowerCase()) || s.id.includes(assignSearch))
                      .map(s => {
                        const roles = serviceRoles.filter(r => r.serviceId === s.id);
                        if (roles.length === 0) return null;
                        return (
                          <div key={s.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                            <p className="font-black text-sm mb-3">{serviceName(s.id)} <span className="text-[9px] text-slate-400 font-mono">{s.id}</span></p>
                            <div className="flex flex-wrap gap-4">
                              {roles.map(r => {
                                const checked = roleAssignments.some(a => a.userId === selectedUser.id && a.roleId === r.id);
                                return (
                                  <label key={r.id} className={cn('flex items-center gap-2 text-sm font-bold cursor-pointer', !r.isActive && 'opacity-40')}>
                                    <Checkbox checked={checked} onCheckedChange={v => toggleAssignment(selectedUser, r, v === true)} />
                                    {isAr ? r.nameAr : r.nameEn}
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    {serviceRoles.length === 0 && (
                      <p className="text-center text-slate-400 text-sm py-8">{isAr ? 'لا توجد أدوار معرّفة. استخدم "تحميل أدوار المسارات" أو أضف أدواراً من تبويب أدوار كل خدمة.' : 'No roles defined yet. Seed workflow roles or add them in "Roles per service".'}</p>
                    )}
                  </div>
                </>
              )}
            </Card>
          </div>
        </TabsContent>

        {/* ─── Roles per service ─── */}
        <TabsContent value="roles" className="mt-6 space-y-6">
          <Card className="rounded-[2rem] border-none shadow-xl bg-white p-6 flex flex-wrap items-end gap-4">
            <div className="space-y-1 flex-1 min-w-[280px]">
              <Label className="text-xs font-bold">{isAr ? 'الخدمة' : 'Service'}</Label>
              <Select value={roleServiceId} onValueChange={setRoleServiceId}>
                <SelectTrigger className="rounded-xl h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {servicesWithRoles.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {serviceName(s.id)} ({serviceRoles.filter(r => r.serviceId === s.id).length})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label className="text-xs font-bold">{isAr ? 'اسم الدور (عربي)' : 'Role name (AR)'}</Label><Input value={newRole.nameAr} onChange={e => setNewRole({ ...newRole, nameAr: e.target.value })} placeholder={isAr ? 'مثال: مهندس' : 'e.g. مهندس'} className="rounded-xl h-11" /></div>
            <div className="space-y-1"><Label className="text-xs font-bold">{isAr ? 'اسم الدور (إنجليزي)' : 'Role name (EN)'}</Label><Input value={newRole.nameEn} onChange={e => setNewRole({ ...newRole, nameEn: e.target.value })} placeholder="Engineer" className="rounded-xl h-11" /></div>
            <Button onClick={handleAddRole} className="rounded-xl h-11 dm-gradient-primary font-black gap-2"><Plus size={16} />{isAr ? 'إضافة دور' : 'Add role'}</Button>
          </Card>

          <div className="bg-white border rounded-[2.5rem] overflow-x-auto shadow-xl">
            <Table>
              <TableHeader className="bg-slate-50"><TableRow>
                <TableHead className="p-4 font-black">{isAr ? 'الدور' : 'Role'}</TableHead>
                {ALL_PERMISSIONS.map(p => <TableHead key={p.id} className="p-2 font-black text-center text-[11px]">{isAr ? p.labelAr : p.labelEn}</TableHead>)}
                <TableHead className="p-4 font-black text-center">{isAr ? 'المسندون' : 'Holders'}</TableHead>
                <TableHead className="p-4 font-black text-center">{isAr ? 'نشط' : 'Active'}</TableHead>
                <TableHead />
              </TableRow></TableHeader>
              <TableBody>
                {rolesOfService.length === 0 && (
                  <TableRow><TableCell colSpan={ALL_PERMISSIONS.length + 4} className="text-center text-slate-400 py-10 text-sm">{isAr ? 'لا توجد أدوار لهذه الخدمة' : 'No roles for this service'}</TableCell></TableRow>
                )}
                {rolesOfService.map(r => {
                  const holders = roleAssignments.filter(a => a.roleId === r.id).map(a => staffUsers.find(u => u.id === a.userId)?.employeeNumber).filter(Boolean);
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="p-4 min-w-[220px]">
                        <Input value={isAr ? r.nameAr : r.nameEn} onChange={e => updateRole(r.id, isAr ? { nameAr: e.target.value } : { nameEn: e.target.value })} className="rounded-lg font-bold h-9" />
                      </TableCell>
                      {ALL_PERMISSIONS.map(p => (
                        <TableCell key={p.id} className="text-center">
                          <Checkbox checked={r.permissions.includes(p.id)} onCheckedChange={v => togglePermission(r, p.id, v === true)} aria-label={permLabel(p.id)} />
                        </TableCell>
                      ))}
                      <TableCell className="text-center text-xs font-mono">{holders.length ? holders.join('، ') : '—'}</TableCell>
                      <TableCell className="text-center"><Switch checked={r.isActive} onCheckedChange={v => updateRole(r.id, { isActive: v })} /></TableCell>
                      <TableCell><Button variant="ghost" size="icon" onClick={() => handleDeleteRole(r.id)} className="text-red-400 hover:bg-red-50 rounded-xl"><Trash2 size={16} /></Button></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* ─── Access check ─── */}
        <TabsContent value="check" className="mt-6">
          <Card className="rounded-[2rem] border-none shadow-xl bg-white p-8 space-y-6">
            <div className="relative max-w-sm">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <Input value={checkNumber} onChange={e => setCheckNumber(e.target.value)} placeholder={isAr ? 'أدخل الرقم الوظيفي (مثال 14105)' : 'Enter employee number (e.g. 14105)'} className="ps-10 rounded-xl h-11 font-mono" />
            </div>
            {checkNumber.trim() && !checkedUser && <p className="text-sm text-red-500 font-bold">{isAr ? 'لا يوجد مستخدم بهذا الرقم' : 'No user with this number'}</p>}
            {checkedUser && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <h3 className="font-black text-lg">{isAr ? checkedUser.nameAr : checkedUser.nameEn || checkedUser.nameAr}</h3>
                  <Badge className={checkedUser.isActive ? 'bg-emerald-500' : 'bg-slate-400'}>{checkedUser.isActive ? (isAr ? 'نشط' : 'Active') : (isAr ? 'موقوف' : 'Disabled')}</Badge>
                  {checkedUser.isSuperAdmin && <Badge className="bg-red-500">{isAr ? 'صلاحية كاملة على كل الخدمات' : 'Full access to all services'}</Badge>}
                </div>
                {Object.keys(checkedByService).length === 0 && !checkedUser.isSuperAdmin && (
                  <p className="text-sm text-slate-400">{isAr ? 'لا توجد أدوار مسندة' : 'No roles assigned'}</p>
                )}
                {Object.entries(checkedByService).map(([sid, roles]) => (
                  <div key={sid} className="p-4 rounded-2xl border border-slate-100">
                    <p className="font-black text-sm mb-2">{serviceName(sid)}</p>
                    {roles.map(r => (
                      <div key={r.id} className="flex flex-wrap items-center gap-2 mb-1">
                        <Badge variant="outline" className="font-black">{isAr ? r.nameAr : r.nameEn}</Badge>
                        {r.permissions.map(p => <Badge key={p} variant="secondary" className="text-[10px]">{permLabel(p)}</Badge>)}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
