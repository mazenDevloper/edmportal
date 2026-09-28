'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/*
 * Admin sign-in for the control panel, the page/service/survey builders and the full identity board.
 * Only SHA-256 hashes of the credentials are kept here — never the plain values.
 * NOTE: this is a client-side gate (it hides admin UI); real protection needs a server-side check,
 * because the database key is also in the browser today.
 */

const SALT = 'dm-portal-admin:';
const CREDENTIAL_HASH = '0035053e4d680b7b303c99bb57b539b43d525501644eff14f2b22c17aa367980';
const THIQA_HASH = '10bed8c4d47f37bd21e8000d7293c1fa9f0bb7391e7d366eb64389fad8d1db20';

const SESSION_MS = 8 * 60 * 60 * 1000;
const MAX_FAILURES = 5;
const LOCK_MS = 60 * 1000;

async function sha256(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(SALT + text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Constant-time-ish comparison so the check doesn't leak how many characters matched */
function same(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const digits = (v: string) => v.replace(/\D/g, '').replace(/^968(?=\d{8}$)/, '');

export async function verifyAdminCredentials(username: string, password: string) {
  return same(await sha256(`${username.trim().toLowerCase()}\n${password}`), CREDENTIAL_HASH);
}

/** Thiqa is simulated for now: mobile number + one-time code */
export async function verifyAdminThiqa(phone: string, code: string) {
  return same(await sha256(`thiqa\n${digits(phone)}\n${code.trim()}`), THIQA_HASH);
}

interface AdminSessionState {
  signedInAt: number;
  expiresAt: number;
  method: 'credentials' | 'thiqa' | null;
  failures: number;
  lockedUntil: number;
  signIn: (method: 'credentials' | 'thiqa') => void;
  signOut: () => void;
  recordFailure: () => void;
}

export const useAdminSession = create<AdminSessionState>()(
  persist(
    (set, get) => ({
      signedInAt: 0,
      expiresAt: 0,
      method: null,
      failures: 0,
      lockedUntil: 0,
      signIn: method => set({ signedInAt: Date.now(), expiresAt: Date.now() + SESSION_MS, method, failures: 0, lockedUntil: 0 }),
      signOut: () => set({ signedInAt: 0, expiresAt: 0, method: null }),
      recordFailure: () => {
        const failures = get().failures + 1;
        set(failures >= MAX_FAILURES ? { failures: 0, lockedUntil: Date.now() + LOCK_MS } : { failures });
      },
    }),
    { name: 'dm-admin-session', storage: createJSONStorage(() => sessionStorage) },
  ),
);

/** True once hydrated and the session is still valid */
export function useIsAdmin() {
  const expiresAt = useAdminSession(s => s.expiresAt);
  return expiresAt > Date.now();
}
