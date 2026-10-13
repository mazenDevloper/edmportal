/*
 * Live transaction data from Dhofar Municipality's open-data APIs (ODM2040), server side only.
 *
 * - Rent contracts:     main.edm.gov.om/opendatedm/rent/getRent          (~20 MB for 2020→today)
 * - Excavation permits: main.edm.gov.om/opendatedm/dig/getDigs
 * - Municipal licences: main.edm.gov.om/opendatedm/health/getHealth      (~29 MB for 2020→today)
 * - Building permits:   main.edm.gov.om/opendatedm/building/getBuilding
 *
 * The full history is fetched once a day (first request after midnight, Oman time), trimmed to the
 * few fields we use, and kept in memory; the old copy keeps being served while a refresh runs. Every
 * period / wilayat question is answered from that copy, so the browser only ever gets totals.
 */

const RENT_API = 'https://main.edm.gov.om/opendatedm/rent/getRent';
const DIG_API = 'https://main.edm.gov.om/opendatedm/dig/getDigs';
const HEALTH_API = 'https://main.edm.gov.om/opendatedm/health/getHealth';
const BUILDING_API = 'https://main.edm.gov.om/opendatedm/building/getBuilding';
export const HISTORY_START = '2020-01-01';
/** Refreshed daily: at most 24 h old, and always renewed when the Oman calendar day changes */
const TTL_MS = 24 * 60 * 60 * 1000;
/** After a failed source, try again this soon instead of waiting the full TTL */
const RETRY_MS = 2 * 60 * 1000;
const OMAN_OFFSET_MS = 4 * 3600 * 1000;

export interface RentRow { d: string; w: string; u: string; s: string }
export interface DigRow { d: string; w: string; p: string }
/** Municipal licence: issue date, wilayat, activity, expiry date */
export interface LicenceRow { d: string; w: string; a: string; e: string }
/** Building permit: date, wilayat, permit type, building type, use */
export interface BuildingRow { d: string; w: string; s: string; t: string; u: string }
export type SourceKey = 'rent' | 'dig' | 'licences' | 'buildings';
export interface Snapshot {
  rent: RentRow[] | null;
  dig: DigRow[] | null;
  licences: LicenceRow[] | null;
  buildings: BuildingRow[] | null;
  errors: Partial<Record<SourceKey, string>>;
  fetchedAt: string;
}

/** Oman calendar date (UTC+4) of an API timestamp: "2025-12-31T20:00:00Z" → "2026-01-01" */
const omanDate = (iso: string) => new Date(Date.parse(iso) + OMAN_OFFSET_MS).toISOString().slice(0, 10);
export const todayOman = () => new Date(Date.now() + OMAN_OFFSET_MS).toISOString().slice(0, 10);
/** Last complete day: the default end of every count, so no figure includes a half-finished day */
export const yesterdayOman = () => new Date(Date.now() + OMAN_OFFSET_MS - 86_400_000).toISOString().slice(0, 10);
const omanDayOf = (ms: number) => new Date(ms + OMAN_OFFSET_MS).toISOString().slice(0, 10);
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

async function fetchLicences(): Promise<LicenceRow[]> {
  const url = `${HEALTH_API}?city=%25&startDate=${HISTORY_START}&endDate=${todayOman()}`;
  const rows = await getJson(url, 120_000);
  // The activity names end with " (ظفار)"; drop it, every licence here is in Dhofar
  const activity = (a: string) => (a || 'غير محدد').replace(/\s*\(\s*ظفار\s*\)\s*$/, '').trim();
  return rows.filter(r => r.ISSUEDATE).map(r => ({ d: omanDate(r.ISSUEDATE), w: normWilaya(r.STATENAMEAR), a: activity(r.DEFINITIONNAMEAR), e: r.EXPIRYDATE ? omanDate(r.EXPIRYDATE) : '' }));
}

async function fetchBuildings(): Promise<BuildingRow[]> {
  const url = `${BUILDING_API}?city=null&startDate=${HISTORY_START}&endDate=${todayOman()}`;
  const rows = await getJson(url, 60_000);
  return rows.filter(r => r.Date).map(r => ({ d: omanDate(r.Date), w: normWilaya(r.city), s: r.ServiceName || 'غير محدد', t: r.BuildingType || 'غير محدد', u: r.UseType || 'غير محدد' }));
}

// Module-level cache shared by all requests on this server instance
// Kept on globalThis so every API route shares ONE copy (in development each route is bundled separately)
/** at = when fetched; retryAt = when to try again after a failed source (null when all succeeded) */
type Store = { cached: { snap: Snapshot; at: number; retryAt: number | null } | null; inFlight: Promise<Snapshot> | null };
const store: Store = ((globalThis as unknown as { __dmOpenData?: Store }).__dmOpenData ??= { cached: null, inFlight: null });

/** One retry after a short pause: the municipality's server has brief hiccups */
async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  try { return await fn(); } catch { await new Promise(r => setTimeout(r, 3000)); return fn(); }
}

/**
 * The snapshot made at build time (scripts/build-open-data-snapshot.js), served as a static file.
 * A serverless host cannot download the sources while a visitor waits, so there this is the data.
 */
async function fromBuild(origin: string): Promise<Snapshot | null> {
  try {
    const res = await fetch(`${origin}/open-data-snapshot.json`, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const snap = (await res.json()) as Snapshot;
    return snap && typeof snap.fetchedAt === 'string' && (snap.rent || snap.dig || snap.licences || snap.buildings) ? { ...snap, errors: snap.errors || {} } : null;
  } catch { return null; }
}

async function refresh(origin?: string): Promise<Snapshot> {
  if (origin) {
    const built = await fromBuild(origin);
    if (built) { store.cached = { snap: built, at: Date.now(), retryAt: null }; return built; }
  }
  // One source at a time, smallest first, to keep the load on the municipality's server low
  const settle = async <T,>(fn: () => Promise<T>): Promise<PromiseSettledResult<T>> => {
    try { return { status: 'fulfilled', value: await withRetry(fn) }; } catch (reason) { return { status: 'rejected', reason }; }
  };
  const dig = await settle(fetchDig);
  const buildings = await settle(fetchBuildings);
  const rent = await settle(fetchRent);
  const licences = await settle(fetchLicences);
  const prev = store.cached?.snap;
  const errors: Snapshot['errors'] = {};
  // If one source fails, keep its last good copy rather than dropping to nothing
  const keep = <T,>(key: SourceKey, r: PromiseSettledResult<T[]>, old: T[] | null | undefined): T[] | null => {
    if (r.status === 'fulfilled') return r.value;
    errors[key] = String((r.reason as Error)?.message || r.reason);
    console.warn(`[open-data] ${key} API failed:`, errors[key]);
    return old ?? null;
  };
  const snap: Snapshot = {
    rent: keep('rent', rent, prev?.rent),
    dig: keep('dig', dig, prev?.dig),
    licences: keep('licences', licences, prev?.licences),
    buildings: keep('buildings', buildings, prev?.buildings),
    errors,
    fetchedAt: new Date().toISOString(),
  };
  // A failure is kept only briefly, so a short outage upstream doesn't stick for the whole TTL
  const failed = Object.keys(errors).length > 0;
  store.cached = { snap, at: Date.now(), retryAt: failed ? Date.now() + RETRY_MS : null };
  return snap;
}

/** Latest snapshot: fresh copy if we have one, stale copy while refreshing, or wait for the first fetch */
export async function getSnapshot(origin?: string): Promise<Snapshot> {
  const c = store.cached;
  const stale = !c || (c.retryAt !== null && Date.now() > c.retryAt) || Date.now() - c.at > TTL_MS || omanDayOf(c.at) !== todayOman();
  if (stale && !store.inFlight) store.inFlight = refresh(origin).finally(() => { store.inFlight = null; });
  if (store.cached) return store.cached.snap;
  return store.inFlight!;
}
