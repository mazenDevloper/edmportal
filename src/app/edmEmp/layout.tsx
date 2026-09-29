'use client';

import { AdminGate } from '@/components/admin-gate';

export default function StaffPanelLayout({ children }: { children: React.ReactNode }) {
  return <AdminGate mode="login" panelAr="لوحة تحكم الموظفين" panelEn="Staff control panel">{children}</AdminGate>;
}
