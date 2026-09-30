/*
 * Counters published on the municipality website's home page (edm.gov.om), read server side.
 *
 * - visits:        "عدد الزيارات لكل الزوار" — live, from the site's Advanced Page Visit Counter
 * - eTransactions: "المعاملات الالكترونية"   — counter box maintained by the website team
 * - bookings:      "حجز للتذاكر الكترونيا"   — counter box maintained by the website team
 *
 * Reading the HTML doesn't run the page's scripts, so it doesn't add a visit. Cached 30 minutes;
 * a failed read is retried after 2 minutes and the last good values are kept meanwhile.
 */

const SITE = 'https://edm.gov.om/';
const TTL_MS = 30 * 60 * 1000;
const RETRY_MS = 2 * 60 * 1000;

export interface WebsiteCounters {
  visits: number | null;
  eTransactions: number | null;
  bookings: number | null;
  fetchedAt: string;
  ok: boolean;
}

const num = (s?: string) => { const n = Number((s || '').replace(/[^\d]/g, '')); return Number.isFinite(n) && n > 0 ? n : null; };

/** The number in a counter box whose label contains `label` (the number comes just before its label) */
function boxBefore(html: string, label: string): number | null {
  const i = html.indexOf(label);
  if (i < 0) return null;
  const before = html.slice(Math.max(0, i - 600), i).replace(/<[^>]+>/g, ' ');
  const nums = before.match(/\d[\d,]{2,}/g);
  return nums ? num(nums[nums.length - 1]) : null;
}

export function parseCounters(html: string): Omit<WebsiteCounters, 'fetchedAt' | 'ok'> {
  const visits = num(/class=['"]avc_visit_counter_front['"][^>]*>\s*([\d,]+)/.exec(html)?.[1]);
  return {
    visits,
    eTransactions: boxBefore(html, 'المعاملات الالكترونية'),
    bookings: boxBefore(html, 'حجز للتذاكر'),
  };
}

// Shared by every API route (in development each route is bundled separately)
type Store = { cached: { at: number; data: WebsiteCounters } | null; inFlight: Promise<WebsiteCounters> | null };
const store: Store = ((globalThis as unknown as { __dmWebsiteCounters?: Store }).__dmWebsiteCounters ??= { cached: null, inFlight: null });

async function load(): Promise<WebsiteCounters> {
  try {
    const res = await fetch(SITE, { cache: 'no-store', signal: AbortSignal.timeout(30_000), headers: { 'User-Agent': 'DhofarPortal/1.0 (+counters)' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const parsed = parseCounters(await res.text());
    const prev = store.cached?.data;
    const data: WebsiteCounters = {
      visits: parsed.visits ?? prev?.visits ?? null,
      eTransactions: parsed.eTransactions ?? prev?.eTransactions ?? null,
      bookings: parsed.bookings ?? prev?.bookings ?? null,
      fetchedAt: new Date().toISOString(),
      ok: parsed.visits !== null,
    };
    store.cached = { at: data.ok ? Date.now() : Date.now() - TTL_MS + RETRY_MS, data };
    return data;
  } catch (e) {
    console.warn('[website-counters]', (e as Error).message);
    const data = store.cached?.data ? { ...store.cached.data, ok: false } : { visits: null, eTransactions: null, bookings: null, fetchedAt: new Date().toISOString(), ok: false };
    store.cached = { at: Date.now() - TTL_MS + RETRY_MS, data };
    return data;
  }
}

export async function getWebsiteCounters(): Promise<WebsiteCounters> {
  const stale = !store.cached || Date.now() - store.cached.at > TTL_MS;
  if (stale && !store.inFlight) store.inFlight = load().finally(() => { store.inFlight = null; });
  return store.cached ? store.cached.data : store.inFlight!;
}
