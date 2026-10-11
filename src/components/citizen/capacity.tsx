'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BriefcaseBusiness, HardHat, UserRound } from 'lucide-react';
import { citizenLabel, useCitizen, useCitizenSession } from '@/lib/citizen-session';
import { CAPACITY_KIND, Capacity, CapacityKind, capacitiesFor, capacityName } from '@/lib/citizen-account';
import { useSettingsStore } from '@/lib/settings-store';
import { cn } from '@/lib/utils';

export const CAPACITY_ICON: Record<CapacityKind, React.ComponentType<{ size?: number; className?: string }>> = { person: UserRound, company: BriefcaseBusiness, office: HardHat };

/** The signed-in person's capacities and the one they are acting in (null until chosen when there are several) */
export function useCapacity() {
  const identity = useCitizen();
  const capacityId = useCitizenSession(s => s.capacityId);
  const capacities = useMemo(() => {
    if (!identity) return [];
    const name = identity.startsWith('thiqa:') ? citizenLabel(identity) : `${citizenLabel(identity)}`;
    return capacitiesFor(identity, name);
  }, [identity]);
  const current = capacities.find(c => c.id === capacityId) || (capacities.length === 1 ? capacities[0] : null);
  return { identity, capacities, current, needsChoice: !!identity && capacities.length > 1 && !current };
}

export function CapacityOption({ c, isAr, active, onPick }: { c: Capacity; isAr: boolean; active?: boolean; onPick: () => void }) {
  const Icon = CAPACITY_ICON[c.kind];
  return (
    <button type="button" onClick={onPick} aria-pressed={!!active}
      className={cn('w-full flex items-center gap-3 rounded-2xl border-2 p-4 text-start transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#008E91]',
        active ? 'border-[#008E91] bg-[#03CFCB]/10' : 'border-slate-200 bg-white hover:border-[#008E91]/50')}>
      <Icon size={22} className="shrink-0 text-slate-600" />
      <span className="min-w-0 flex-1">
        <span className="block font-black text-slate-900">{capacityName(c, isAr)}</span>
        <span className="block text-xs font-bold text-slate-500">{isAr ? CAPACITY_KIND[c.kind].ar : CAPACITY_KIND[c.kind].en} — <span dir="ltr">{c.ref}</span></span>
      </span>
      {active && <span className="shrink-0 rounded-full bg-[#03CFCB]/20 px-2.5 py-1 text-xs font-black text-[#005751]">{isAr ? 'نشط' : 'Active'}</span>}
    </button>
  );
}

/**
 * "Sign in as": shown once after sign-in when the civil number is linked to more than one
 * capacity. Mounted once in the root layout.
 */
export function CapacityDialogHost() {
  const isAr = useSettingsStore(s => s.language) === 'ar';
  const { capacities, needsChoice } = useCapacity();
  const [mounted, setMounted] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (needsChoice) box.current?.querySelector('button')?.focus(); }, [needsChoice]);
  if (!mounted || !needsChoice) return null;
  return (
    <div className="fixed inset-0 z-[9995] flex items-center justify-center bg-slate-900/60 p-4" dir={isAr ? 'rtl' : 'ltr'}>
      <div ref={box} role="dialog" aria-modal aria-labelledby="capacity-title" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
        <div>
          <h2 id="capacity-title" className="text-xl font-black text-slate-900">{isAr ? 'الدخول بصفة' : 'Sign in as'}</h2>
          <p className="mt-1 text-sm font-bold text-slate-500">{isAr ? 'رقمك المدني مرتبط بأكثر من صفة. اختر الصفة التي تتعامل بها الآن، ويمكنك تبديلها لاحقاً من حسابك.' : 'Your civil number is linked to more than one capacity. Choose the one to act in now; you can switch later from your account.'}</p>
        </div>
        <div className="space-y-2">
          {capacities.map(c => <CapacityOption key={c.id} c={c} isAr={isAr} onPick={() => useCitizenSession.getState().setCapacity(c.id)} />)}
        </div>
      </div>
    </div>
  );
}
