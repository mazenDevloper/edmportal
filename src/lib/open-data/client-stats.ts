/*
 * Open-data figures for the browser.
 *
 * First choice is the server (/api/open-data/transactions). Where the server cannot answer in time
 * (a serverless host cannot hold the history in memory), the browser reads the snapshot that the
 * build made (/open-data-snapshot.json) and works the same totals out itself, with the same code.
 */
import { HISTORY_START, todayOman, yesterdayOman, type Snapshot } from './transactions-source';
import { summarise, type TransactionStats } from './transactions-stats';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
let apiDown = false;
let snapshot: Promise<Snapshot> | null = null;

function loadSnapshot() {
  snapshot ||= fetch('/open-data-snapshot.json').then(r => (r.ok ? (r.json() as Promise<Snapshot>) : Promise.reject(new Error(`snapshot ${r.status}`))));
  return snapshot.catch(e => { snapshot = null; throw e; });
}

/** `query` is the API's own query string, e.g. "?from=2026-01-01&to=2026-03-31&wilaya=صلالة" */
export async function loadTransactionStats(query = ''): Promise<TransactionStats> {
  if (!apiDown) {
    try {
      const r = await fetch(`/api/open-data/transactions${query}`, { signal: AbortSignal.timeout(7000) });
      if (r.ok) return (await r.json()) as TransactionStats;
    } catch { /* fall through to the snapshot */ }
  }
  const snap = await loadSnapshot();
  apiDown = true;
  const q = new URLSearchParams(query.replace(/^\?/, ''));
  // The snapshot stops on the day it was built, so nothing later can be counted
  const built = new Date(Date.parse(snap.fetchedAt) + 4 * 3600 * 1000 - 86_400_000).toISOString().slice(0, 10);
  const wanted = q.get('includeToday') === '1' ? todayOman() : yesterdayOman();
  const bound = wanted < built ? wanted : built;
  const from = DATE.test(q.get('from') || '') ? q.get('from')! : HISTORY_START;
  const asked = DATE.test(q.get('to') || '') ? q.get('to')! : bound;
  const to = asked > bound ? bound : asked;
  const wilaya = (q.get('wilaya') || '').trim().slice(0, 60) || null;
  return summarise(snap, from, to < from ? from : to, wilaya, bound);
}
