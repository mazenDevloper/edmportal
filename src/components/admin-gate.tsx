'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAdminSession } from '@/lib/admin-session';

/** Wraps admin-only routes: sends anyone without a valid admin session to the sign-in page */
export function AdminGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const expiresAt = useAdminSession(s => s.expiresAt);
  const signOut = useAdminSession(s => s.signOut);
  const [mounted, setMounted] = useState(false);
  const ok = mounted && expiresAt > Date.now();

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (!mounted || ok) return;
    if (expiresAt) signOut();
    const qs = typeof window !== 'undefined' ? window.location.search : '';
    router.replace(`/admin-login?next=${encodeURIComponent(pathname + qs)}`);
  }, [mounted, ok, expiresAt, pathname, router, signOut]);

  if (!ok) {
    return <div className="h-screen flex items-center justify-center" role="status" aria-label="Checking access"><Loader2 className="animate-spin text-slate-400" /></div>;
  }
  return <>{children}</>;
}
