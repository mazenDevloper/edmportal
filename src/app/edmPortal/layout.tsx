'use client';

import { AdminGate } from '@/components/admin-gate';

export default function PortalPanelLayout({ children }: { children: React.ReactNode }) {
  return <AdminGate mode="login" panelAr="لوحة تحكم البوابة" panelEn="Portal control panel">{children}</AdminGate>;
}
