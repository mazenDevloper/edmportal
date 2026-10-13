/*
 * Usage counters for the portal: how often something was used, and by how many people.
 *
 * Nothing personal is recorded. Each event is a short key ("a11y:open", "service:<id>", "page:/track");
 * per day the store keeps how many times it happened and how many browsers did it at least once.
 * "How many people" is counted by a flag in the visitor's own browser, so no identifier leaves it.
 *
 * Storage is a separate jsonbin store for now (see jsonbin.ts). Two visitors saving at the same moment
 * can lose a few counts; the database that replaces jsonbin removes that limit, and only readAnalytics /
 * saveAnalytics need to change then.
 */
import { readAnalytics, saveAnalytics } from '@/lib/jsonbin';

export interface DayCounts { e: Record<string, number>; u: Record<string, number> }
export interface AnalyticsData { version: number; days: Record<string, DayCounts> }

const SEEN = 'dm-analytics-seen';
const KEEP_DAYS = 400;
const pending: DayCounts = { e: {}, u: {} };
let timer: ReturnType<typeof setTimeout> | null = null;
let busy = false;

const today = () => new Date().toISOString().slice(0, 10);

/** True the first time this browser does `key` today */
function firstToday(key: string) {
  try {
    const raw = JSON.parse(localStorage.getItem(SEEN) || '{}') as { d?: string; k?: string[] };
    const seen = raw.d === today() ? new Set(raw.k || []) : new Set<string>();
    if (seen.has(key)) return false;
    seen.add(key);
    localStorage.setItem(SEEN, JSON.stringify({ d: today(), k: [...seen] }));
    return true;
  } catch { return false; }
}

async function flush() {
  timer = null;
  if (busy || !Object.keys(pending.e).length) return;
  busy = true;
  const send: DayCounts = { e: { ...pending.e }, u: { ...pending.u } };
  pending.e = {}; pending.u = {};
  try {
    const data = await readAnalytics();
    const day = (data.days[today()] ||= { e: {}, u: {} });
    for (const [k, n] of Object.entries(send.e)) day.e[k] = (day.e[k] || 0) + n;
    for (const [k, n] of Object.entries(send.u)) day.u[k] = (day.u[k] || 0) + n;
    const days = Object.keys(data.days).sort();
    for (const d of days.slice(0, Math.max(0, days.length - KEEP_DAYS))) delete data.days[d];
    await saveAnalytics(data);
  } catch {
    // Offline or the store refused: keep the counts for the next attempt
    for (const [k, n] of Object.entries(send.e)) pending.e[k] = (pending.e[k] || 0) + n;
    for (const [k, n] of Object.entries(send.u)) pending.u[k] = (pending.u[k] || 0) + n;
  } finally { busy = false; }
}

/** Count one use of `key`. Keys are "group:name", e.g. "a11y:open" or "service:<id>". */
export function track(key: string) {
  if (typeof window === 'undefined' || !key) return;
  // A developer's own machine is not a visitor
  if (['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)) return;
  const k = key.slice(0, 80);
  pending.e[k] = (pending.e[k] || 0) + 1;
  if (firstToday(k)) pending.u[k] = (pending.u[k] || 0) + 1;
  if (!timer) timer = setTimeout(flush, 12000);
}

/** Send what is waiting now (the page is being hidden or closed) */
export function flushAnalytics() { if (timer) clearTimeout(timer); void flush(); }

/** The events a path stands for: the page itself, and the service it opens or applies for */
export function eventsForPath(path: string): string[] {
  const p = path.replace(/\/+$/, '') || '/';
  const apply = /^\/services\/([^/]+)\/apply$/.exec(p), svc = /^\/services\/([^/]+)$/.exec(p);
  if (apply) return ['page:/services/[id]/apply', `apply:${apply[1]}`];
  if (svc) return ['page:/services/[id]', `service:${svc[1]}`];
  // Other pages with an id in the path are counted as one page
  return [`page:${p.replace(/\/(p|survey|staff\/services)\/[^/]+/, '/$1/[id]')}`];
}
