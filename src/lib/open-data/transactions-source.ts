/*
 * Live transaction data from Dhofar Municipality's open-data APIs (ODM2040), server side only.
 *
 * - Rent contracts:     main.edm.gov.om/opendatedm/rent/getRent  (~20 MB for 2020→today)
 * - Excavation permits: main.edm.gov.om/opendatedm/dig/getDigs
 *
 * The full history is fetched once, trimmed to the few fields we use, and kept in memory for
 * 30 minutes (then refreshed in the background while the old copy keeps being served). Every
 * period / wilayat question is answered from that copy, so the browser only ever gets totals.
 */

const RENT_API = 'https://main.edm.gov.om/opendatedm/rent/getRent';
const DIG_API = 'https://main.edm.gov.om/opendatedm/dig/getDigs';
export const HISTORY_START = '2020-01-01';
const TTL_MS = 30 * 60 * 1000;
const OMAN_OFFSET_MS = 4 * 3600 * 1000;

export interface RentRow { d: string; w: string; u: string; s: string }
export interface DigRow { d: string; w: string; p: string }
export interface Snapshot {
  rent: RentRow[] | null;
  dig: DigRow[] | null;
  rentError?: string;
  digError?: string;
  fetchedAt: string;
}

/** Oman calendar date (UTC+4) of an API timestamp: "2025-12-31T20:00:00Z" → "2026-01-01" */
const omanDate = (iso: string) => new Date(Date.parse(iso) + OMAN_OFFSET_MS).toISOString().slice(0, 10);
export const todayOman = () => new Date(Date.now() + OMAN_OFFSET_MS).toISOString().slice(0, 10);
/** "ولاية صلالة" (excavation API) and "صلالة" (rent API) are the same wilayat */
export const normWilaya = (w: string) => (w || '').trim().replace(/^ولاية\s+/, '') || 'غير محدد';

async function getJson(url: string, timeoutMs: number) {
  const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(timeoutMs), headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  // The API labels its JSON as text/html, so parse the text ourselves
  const data = JSON.parse(await res.text());
  if (!Array.isArray(data)) throw new Error('Unexpected response');
  return data as Record<string, string>[];
}

async function fetchRent(): Promise<RentRow[]> {
  const url = `${RENT_API}?city=%25&type=0&status=${encodeURIComponent('كل')}&startDate=${HISTORY_START}&endDate=${todayOman()}`;
  const rows = await getJson(url, 90_000);
  return rows.filter(r => r.START_DATE).map(r => ({ d: omanDate(r.START_DATE), w: normWilaya(r.Welaya), u: r.USE_TYPE || 'غير محدد', s: r.CONTRACT_STATUS || 'غير محدد' }));
}

async function fetchDig(): Promise<DigRow[]> {
  const url = `${DIG_API}?city=null&type=&startDate=${HISTORY_START.replace(/-/g, '/')}&endDate=${todayOman().replace(/-/g, '/')}`;
  const rows = await getJson(url, 60_000);
  return rows.filter(r => r.CreatedDate).map(r => ({ d: omanDate(r.CreatedDate), w: normWilaya(r.City), p: r.Project || 'غير محدد' }));
}

// Module-level cache shared by all requests on this server instance
let cached: { snap: Snapshot; at: number } | null = null;
let inFlight: Promise<Snapshot> | null = null;

async function refresh(): Promise<Snapshot> {
  const [rent, dig] = await Promise.allSettled([fetchRent(), fetchDig()]);
  const prev = cached?.snap;
  const snap: Snapshot = {
    // If one source fails, keep its last good copy rather than dropping to nothing
    rent: rent.status === 'fulfilled' ? rent.value : prev?.rent ?? null,
    dig: dig.status === 'fulfilled' ? dig.value : prev?.dig ?? null,
    rentError: rent.status === 'rejected' ? String((rent.reason as Error)?.message || rent.reason) : undefined,
    digError: dig.status === 'rejected' ? String((dig.reason as Error)?.message || dig.reason) : undefined,
    fetchedAt: new Date().toISOString(),
  };
  if (snap.rentError) console.warn('[open-data] rent API failed:', snap.rentError);
  if (snap.digError) console.warn('[open-data] dig API failed:', snap.digError);
  cached = { snap, at: Date.now() };
  return snap;
}

/** Latest snapshot: fresh copy if we have one, stale copy while refreshing, or wait for the first fetch */
export async function getSnapshot(): Promise<Snapshot> {
  const stale = !cached || Date.now() - cached.at > TTL_MS;
  if (stale && !inFlight) inFlight = refresh().finally(() => { inFlight = null; });
  if (cached) return cached.snap;
  return inFlight!;
}
