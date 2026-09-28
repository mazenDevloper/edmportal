'use client';

import { AdminGate } from '@/components/admin-gate';

export default function AdminOnlyLayout({ children }: { children: React.ReactNode }) {
  return <AdminGate>{children}</AdminGate>;
}
