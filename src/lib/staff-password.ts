/*
 * Staff passwords: PBKDF2-SHA256 with a per-user salt, stored as "pbkdf2$<iterations>$<salt>$<hash>".
 * Plain passwords are never stored. A temporary password (from a reset) must be changed at first sign-in.
 *
 * PROTOTYPE: hashing runs in the browser and the hashes live in the shared database. In production
 * the check belongs on a server, where the database is not readable by the browser.
 */

const ITERATIONS = 150_000;
const enc = new TextEncoder();
const hex = (buf: ArrayBuffer | Uint8Array) => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
const unhex = (s: string) => new Uint8Array((s.match(/../g) || []).map(h => parseInt(h, 16)));

async function derive(password: string, salt: Uint8Array, iterations: number) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256));
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2$${ITERATIONS}$${hex(salt)}$${await derive(password, salt, ITERATIONS)}`;
}

export async function verifyPassword(password: string, stored?: string): Promise<boolean> {
  const [scheme, iter, salt, hash] = (stored || '').split('$');
  if (scheme !== 'pbkdf2' || !salt || !hash) return false;
  const got = await derive(password, unhex(salt), Number(iter));
  let diff = got.length ^ hash.length;
  for (let i = 0; i < Math.min(got.length, hash.length); i++) diff |= got.charCodeAt(i) ^ hash.charCodeAt(i);
  return diff === 0;
}

/** 10 characters, no look-alikes (0/O, 1/l/I), always letters and digits */
export function generateTempPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ', lower = 'abcdefghijkmnpqrstuvwxyz', digits = '23456789';
  const all = upper + lower + digits;
  const pick = (set: string) => set[crypto.getRandomValues(new Uint32Array(1))[0] % set.length];
  const chars = [pick(upper), pick(lower), pick(digits), ...Array.from({ length: 7 }, () => pick(all))];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

/** Returns what's missing, or [] when the password is acceptable */
export function passwordProblems(pw: string, isAr: boolean): string[] {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const out: string[] = [];
  if (pw.length < 8) out.push(t('8 أحرف على الأقل', 'at least 8 characters'));
  if (!/[A-Za-z]/.test(pw)) out.push(t('حرف واحد على الأقل', 'at least one letter'));
  if (!/\d/.test(pw)) out.push(t('رقم واحد على الأقل', 'at least one digit'));
  return out;
}
