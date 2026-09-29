import { Service, ServiceApplication } from './types';

/** Services are hidden from the public until an admin switches them on in /edmPortal */
export const isPublicService = (s: Service) => s.isPublic === true;

// ─── Transaction numbers: two letters for the service, then a running number (SL-00482) ───

const STOP_WORDS = new Set(['a', 'an', 'the', 'of', 'for', 'and', 'to', 'in', 'on', 'at', 'by', 'with', 'or', 'request', 'service', 'services', 'apply', 'application']);
const RESERVED = new Set(['DM']);
// Older "DM-<timestamp>" numbers are not part of the sequence
const REF_RE = /^(?!DM-)([A-Z]{2})-(\d{5,7})$/;

const letters = (s: string) => s.toUpperCase().replace(/[^A-Z]/g, '');

/** Candidate prefixes from the English title, best first: initials of the first two words, then other letter pairs */
function candidates(s: Service): string[] {
  const words = (s.titleEn || s.id).split(/[^A-Za-z]+/).filter(w => w && !STOP_WORDS.has(w.toLowerCase())).map(letters).filter(Boolean);
  const out: string[] = [];
  if (words.length >= 2) out.push(words[0][0] + words[1][0]);
  words.slice(2).forEach(w => out.push(words[0][0] + w[0]));
  if (words[0]) for (const c of words[0].slice(1)) out.push(words[0][0] + c);
  words.slice(1).forEach(w => { for (const c of w.slice(1)) out.push(words[0][0] + c); });
  for (let a = 65; a <= 90; a++) for (let b = 65; b <= 90; b++) out.push(String.fromCharCode(a, b));
  return out;
}

/**
 * One unique two-letter code per service. Codes an admin set by hand win; the rest are derived
 * from the English title in id order, so every service keeps the same code between visits.
 */
export function servicePrefixes(services: Service[]): Map<string, string> {
  const map = new Map<string, string>();
  const used = new Set(RESERVED);
  services.forEach(s => {
    const p = letters(s.refPrefix || '').slice(0, 2);
    if (p.length === 2 && !used.has(p)) { map.set(s.id, p); used.add(p); }
  });
  [...services].sort((a, b) => a.id.localeCompare(b.id)).forEach(s => {
    if (map.has(s.id)) return;
    const p = candidates(s).find(c => !used.has(c))!;
    map.set(s.id, p);
    used.add(p);
  });
  return map;
}

/** Next number for a service: running sequence across all services, so numbers never repeat */
export function nextReference(service: Service, services: Service[], applications: ServiceApplication[]): string {
  const prefix = servicePrefixes(services).get(service.id) || 'XX';
  const max = applications.reduce((m, a) => {
    const hit = REF_RE.exec(a.id);
    return hit ? Math.max(m, Number(hit[2])) : m;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(5, '0')}`;
}

/** "sl 482", "SL00482", "sl-00482" → "SL-00482". Older DM- numbers are kept as typed. */
export function normalizeReference(input: string): string | null {
  const raw = input.trim().toUpperCase().replace(/\s+/g, '');
  if (!raw) return null;
  if (raw.startsWith('DM-')) return raw;
  const m = /^([A-Z]{2})-?(\d{1,10})$/.exec(raw);
  return m ? `${m[1]}-${m[2].padStart(5, '0')}` : null;
}

/** Finds an application in any typed form of its number */
export const looksLikeReference = (text: string) => /\b[A-Za-z]{2}[- ]?\d{3,15}\b/.exec(text)?.[0] || null;

export function findApplication(applications: ServiceApplication[], input: string) {
  const ref = normalizeReference(input);
  if (!ref) return null;
  return applications.find(a => a.id.toUpperCase() === ref) || null;
}

export const STATUS_INFO: Record<ServiceApplication['status'], { ar: string; en: string; tone: string; step: number }> = {
  pending: { ar: 'تم الاستلام', en: 'Received', tone: 'bg-sky-100 text-sky-800', step: 1 },
  'in-review': { ar: 'قيد المراجعة', en: 'Under review', tone: 'bg-amber-100 text-amber-800', step: 2 },
  approved: { ar: 'مكتملة – تمت الموافقة', en: 'Completed – approved', tone: 'bg-emerald-100 text-emerald-800', step: 3 },
  rejected: { ar: 'مرفوضة', en: 'Rejected', tone: 'bg-red-100 text-red-800', step: 3 },
};
