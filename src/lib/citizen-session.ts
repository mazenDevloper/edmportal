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
  /** Test sign-in (phone + one-time code) */
  phone: string | null;
  /** Thiqa SSO sign-in: the name Thiqa returns, and its sign-in reference */
  name: string | null;
  ssoId: string | null;
  method: 'thiqa' | 'otp' | null;
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
  signInThiqa: (name: string, ssoId: string) => void;
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
      name: null,
      ssoId: null,
      method: null,
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
        set({ phone: s.pendingPhone, name: null, ssoId: null, method: 'otp', expiresAt: Date.now() + SESSION_MS, pendingCode: null, pendingPhone: null, failures: 0 });
        return true;
      },
      signInThiqa: (name, ssoId) => set({ name, ssoId, phone: null, method: 'thiqa', expiresAt: Date.now() + SESSION_MS }),
      signOut: () => set({ phone: null, name: null, ssoId: null, method: null, expiresAt: 0 }),
      openPrompt: (afterSignIn = null) => set({ promptOpen: true, afterSignIn }),
      closePrompt: () => set({ promptOpen: false, afterSignIn: null }),
    }),
    {
      name: 'dm-citizen-session',
      storage: createJSONStorage(() => sessionStorage),
      // The pop-up state is per page view, not part of the session
      partialize: s => ({ phone: s.phone, name: s.name, ssoId: s.ssoId, method: s.method, expiresAt: s.expiresAt, pendingPhone: s.pendingPhone, pendingCode: s.pendingCode, codeExpiresAt: s.codeExpiresAt, failures: s.failures }),
    }
  )
);

/** Who is signed in, as one key: the phone (test sign-in) or "thiqa:<name>" (Thiqa SSO) */
const identityKey = (s: Pick<CitizenSessionState, 'phone' | 'name' | 'expiresAt'>) =>
  s.expiresAt > Date.now() ? s.phone || (s.name ? `thiqa:${s.name}` : null) : null;

export const citizenSignedIn = () => !!identityKey(useCitizenSession.getState());

/** Signed-in citizen's identity key once hydrated, else null */
export function useCitizen() {
  const phone = useCitizenSession(s => s.phone);
  const name = useCitizenSession(s => s.name);
  const expiresAt = useCitizenSession(s => s.expiresAt);
  return identityKey({ phone, name, expiresAt });
}

/** What to show for a signed-in citizen: the Thiqa name, or the masked phone */
export const citizenLabel = (key: string) => (key.startsWith('thiqa:') ? key.slice(6) : maskPhone(key));

/**
 * Reads the Thiqa return (?SSO=<guid>&Name=<name>). The name is shown and used to link requests.
 * PROTOTYPE: the parameters are not verified with Thiqa yet — production must confirm the SSO
 * reference with the municipality's SSO server before trusting the name.
 */
export function parseThiqaReturn(search: string): { ssoId: string; name: string } | null {
  const q = new URLSearchParams(search);
  const ssoId = (q.get('SSO') || q.get('sso') || '').trim();
  const name = (q.get('Name') || q.get('name') || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 120);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(ssoId) || !name) return null;
  return { ssoId, name };
}

/** Runs the action now if signed in, otherwise opens the Thiqa pop-up and goes to `path` after sign-in */
export function requireCitizen(path: string, go: (path: string) => void) {
  if (citizenSignedIn()) go(path);
  else useCitizenSession.getState().openPrompt(path);
}
