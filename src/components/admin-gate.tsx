'use client';

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAdminSession } from '@/lib/admin-session';
import { AdminLoginForm } from '@/components/admin-login-form';

/**
 * Wraps admin-only routes.
 * - mode "login": the panel entry points (/edmPortal, /edmEmp) show the sign-in form in place.
 * - mode "hidden": tools opened from a panel (builders, identity board) look like a missing page,
 *   so nothing reveals where the panels are.
 */
export function AdminGate({ children, mode = 'hidden', panelAr, panelEn }: {
  children: React.ReactNode;
  mode?: 'login' | 'hidden';
  panelAr?: string;
  panelEn?: string;
}) {
  const expiresAt = useAdminSession(s => s.expiresAt);
  const signOut = useAdminSession(s => s.signOut);
  const [mounted, setMounted] = useState(false);
  const ok = mounted && expiresAt > Date.now();

  useEffect(() => { setMounted(true); }, []);
  // Clear an expired session so the header stops showing admin links
  useEffect(() => { if (mounted && expiresAt && expiresAt <= Date.now()) signOut(); }, [mounted, expiresAt, signOut]);

  if (!mounted) {
    return <div className="h-screen flex items-center justify-center" role="status" aria-label="Loading"><Loader2 className="animate-spin text-slate-400" /></div>;
  }
  if (ok) return <>{children}</>;
  if (mode === 'login') return <AdminLoginForm panelAr={panelAr} panelEn={panelEn} />;
  return <NotFoundScreen />;
}

/** Same look as Next's default 404, so hidden routes are indistinguishable from missing ones */
function NotFoundScreen() {
  useEffect(() => { document.title = '404: This page could not be found.'; }, []);
  return (
    <div className="h-screen flex items-center justify-center font-sans text-center" dir="ltr">
      <div className="flex items-center">
        <h1 className="text-2xl font-medium pe-6 me-6 border-e border-black/30 leading-[49px]">404</h1>
        <h2 className="text-sm font-normal">This page could not be found.</h2>
      </div>
    </div>
  );
}
