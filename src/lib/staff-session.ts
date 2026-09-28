'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { StaffUser } from './types';

/*
 * Staff sign-in for the internal portal.
 *
 * PROTOTYPE: the check runs in the browser against the staff list in the database, and the
 * Thiqa option is a simulation (it looks up the civil number instead of redirecting to Thiqa).
 * Before production this must move to a server that verifies Thiqa (or the employee/civil
 * numbers) and issues an httpOnly session cookie.
 */

export type StaffAuthMethod = 'thiqa' | 'credentials';

interface StaffSessionState {
  userId: string | null;
  method: StaffAuthMethod | null;
  expiresAt: number;
  failures: number;
  lockedUntil: number;
  signIn: (userId: string, method: StaffAuthMethod) => void;
  signOut: () => void;
  recordFailure: () => void;
}

const SESSION_HOURS = 8;
const MAX_FAILURES = 5;
const LOCK_MS = 60_000;

export const useStaffSession = create<StaffSessionState>()(
  persist(
    set => ({
      userId: null,
      method: null,
      expiresAt: 0,
      failures: 0,
      lockedUntil: 0,
      signIn: (userId, method) => set({ userId, method, expiresAt: Date.now() + SESSION_HOURS * 3600_000, failures: 0, lockedUntil: 0 }),
      signOut: () => set({ userId: null, method: null, expiresAt: 0 }),
      recordFailure: () => set(s => {
        const failures = s.failures + 1;
        return failures >= MAX_FAILURES ? { failures: 0, lockedUntil: Date.now() + LOCK_MS } : { failures };
      }),
    }),
    // Session storage: closing the browser signs the employee out
    { name: 'dm-staff-session', storage: createJSONStorage(() => sessionStorage) }
  )
);

const normalize = (v: string) => v.replace(/\s|-/g, '');

/** Employee number AND civil number must both belong to the same active employee */
export function verifyCredentials(staff: StaffUser[], employeeNumber: string, civilNumber: string): StaffUser | null {
  const emp = normalize(employeeNumber), civil = normalize(civilNumber);
  if (!emp || !civil) return null;
  return staff.find(u => u.isActive && u.employeeNumber === emp && !!u.civilNumber && normalize(u.civilNumber) === civil) || null;
}

/** Simulated Thiqa: the civil number Thiqa would return is matched to an active employee */
export function verifyThiqa(staff: StaffUser[], civilNumber: string): StaffUser | null {
  const civil = normalize(civilNumber);
  if (!civil) return null;
  return staff.find(u => u.isActive && !!u.civilNumber && normalize(u.civilNumber) === civil) || null;
}
