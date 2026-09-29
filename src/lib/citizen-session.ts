'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/*
 * Beneficiary (citizen) sign-in through Thiqa with a mobile number and a one-time code.
 *
 * PROTOTYPE: there is no Thiqa or SMS gateway yet, so the one-time code is generated in the
 * browser and shown on screen in the "test environment" note. Before production the code must be
 * sent and verified by Thiqa on a server, which then issues an httpOnly session cookie.
 */

/** National Thiqa sign-in used by the municipality's portals (SAML, opens the national identity provider) */
export const THIQA_SSO_URL = 'https://main.edm.gov.om/theqa/sso?origin=dhofar';

const SESSION_MS = 2 * 60 * 60 * 1000;
const CODE_MS = 5 * 60 * 1000;
const MAX_FAILURES = 5;

interface CitizenSessionState {
  phone: string | null;
  expiresAt: number;
  // One-time code in flight (kept only for the simulation)
  pendingPhone: string | null;
  pendingCode: string | null;
  codeExpiresAt: number;
  failures: number;
  // Sign-in pop-up, opened from anywhere with requireCitizen()
  promptOpen: boolean;
  afterSignIn: string | null;
  requestCode: (phone: string) => string;
  verifyCode: (code: string) => boolean;
  signOut: () => void;
  openPrompt: (afterSignIn?: string | null) => void;
  closePrompt: () => void;
}

export const normalizeOmanMobile = (v: string) => v.replace(/\D/g, '').replace(/^(00968|968)(?=\d{8}$)/, '');
export const isOmanMobile = (v: string) => /^[79]\d{7}$/.test(normalizeOmanMobile(v));
export const maskPhone = (p: string) => `•••• ${p.slice(-4)}`;

export const useCitizenSession = create<CitizenSessionState>()(
  persist(
    (set, get) => ({
      phone: null,
      expiresAt: 0,
      pendingPhone: null,
      pendingCode: null,
      codeExpiresAt: 0,
      failures: 0,
      promptOpen: false,
      afterSignIn: null,
      requestCode: phone => {
        const buf = new Uint32Array(1);
        crypto.getRandomValues(buf);
        const code = String(buf[0] % 1_000_000).padStart(6, '0');
        set({ pendingPhone: normalizeOmanMobile(phone), pendingCode: code, codeExpiresAt: Date.now() + CODE_MS, failures: 0 });
        return code;
      },
      verifyCode: code => {
        const s = get();
        if (!s.pendingCode || !s.pendingPhone || s.codeExpiresAt < Date.now()) return false;
        if (code.trim() !== s.pendingCode) {
          const failures = s.failures + 1;
          // Too many wrong codes: the code is thrown away and a new one must be requested
          set(failures >= MAX_FAILURES ? { failures: 0, pendingCode: null } : { failures });
          return false;
        }
        set({ phone: s.pendingPhone, expiresAt: Date.now() + SESSION_MS, pendingCode: null, pendingPhone: null, failures: 0 });
        return true;
      },
      signOut: () => set({ phone: null, expiresAt: 0 }),
      openPrompt: (afterSignIn = null) => set({ promptOpen: true, afterSignIn }),
      closePrompt: () => set({ promptOpen: false, afterSignIn: null }),
    }),
    {
      name: 'dm-citizen-session',
      storage: createJSONStorage(() => sessionStorage),
      // The pop-up state is per page view, not part of the session
      partialize: s => ({ phone: s.phone, expiresAt: s.expiresAt, pendingPhone: s.pendingPhone, pendingCode: s.pendingCode, codeExpiresAt: s.codeExpiresAt, failures: s.failures }),
    }
  )
);

export const citizenSignedIn = () => {
  const s = useCitizenSession.getState();
  return !!s.phone && s.expiresAt > Date.now();
};

/** Signed-in phone once hydrated, else null */
export function useCitizen() {
  const phone = useCitizenSession(s => s.phone);
  const expiresAt = useCitizenSession(s => s.expiresAt);
  return phone && expiresAt > Date.now() ? phone : null;
}

/** Runs the action now if signed in, otherwise opens the Thiqa pop-up and goes to `path` after sign-in */
export function requireCitizen(path: string, go: (path: string) => void) {
  if (citizenSignedIn()) go(path);
  else useCitizenSession.getState().openPrompt(path);
}
