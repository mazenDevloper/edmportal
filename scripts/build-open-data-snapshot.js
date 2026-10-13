/*
 * Builds public/open-data-snapshot.json: the municipality's open-data history, trimmed to the few
 * fields the portal uses (the same shape as Snapshot in src/lib/open-data/transactions-source.ts).
 *
 * Why: on a serverless host (Netlify) a request has seconds, not minutes, and keeps nothing in memory,
 * so the ~50 MB of source data cannot be downloaded while a visitor waits. The build has the time, so
 * the snapshot is made here and the API route reads it. It is as fresh as the last build; a daily
 * scheduled build keeps it current.
 *
 * Runs only where asked (NETLIFY or OPEN_DATA_SNAPSHOT=1), and never fails the build: without a
 * snapshot the API route falls back to fetching live, as it does on a long-running server.
 */
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'public', 'open-data-snapshot.json');
const BASE = 'https://main.edm.gov.om/opendatedm';
const START = '2020-01-01';
const OMAN = 4 * 3600 * 1000;
const omanDate = iso => new Date(Date.parse(iso) + OMAN).toISOString().slice(0, 10);
const today = new Date(Date.now() + OMAN).toISOString().slice(0, 10);
const normWilaya = w => (w || '').trim().replace(/^ولاية\s+/, '') || 'غير محدد';
const activity = a => (a || 'غير محدد').replace(/\s*\(\s*ظفار\s*\)\s*$/, '').trim();

async function getJson(url, timeoutMs) {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = JSON.parse(await res.text());
  if (!Array.isArray(data)) throw new Error('Unexpected response');
  return data;
}
async function attempt(name, fn) {
  for (let i = 1; i <= 3; i++) {
    try { const rows = await fn(); console.log(`[open-data snapshot] ${name}: ${rows.length} rows`); return rows; }
    catch (e) { console.warn(`[open-data snapshot] ${name} attempt ${i} failed: ${e.message}`); await new Promise(r => setTimeout(r, 4000)); }
  }
  return null;
}

const sources = {
  dig: async () => (await getJson(`${BASE}/dig/getDigs?city=null&type=&startDate=${START.replace(/-/g, '/')}&endDate=${today.replace(/-/g, '/')}`, 180000))
    .filter(r => r.CreatedDate).map(r => ({ d: omanDate(r.CreatedDate), w: normWilaya(r.City), p: r.Project || 'غير محدد' })),
  buildings: async () => (await getJson(`${BASE}/building/getBuilding?city=null&startDate=${START}&endDate=${today}`, 180000))
    .filter(r => r.Date).map(r => ({ d: omanDate(r.Date), w: normWilaya(r.city), s: r.ServiceName || 'غير محدد', t: r.BuildingType || 'غير محدد', u: r.UseType || 'غير محدد' })),
  rent: async () => (await getJson(`${BASE}/rent/getRent?city=%25&type=0&status=${encodeURIComponent('كل')}&startDate=${START}&endDate=${today}`, 300000))
    .filter(r => r.START_DATE).map(r => ({ d: omanDate(r.START_DATE), w: normWilaya(r.Welaya), u: r.USE_TYPE || 'غير محدد', s: r.CONTRACT_STATUS || 'غير محدد' })),
  licences: async () => (await getJson(`${BASE}/health/getHealth?city=%25&startDate=${START}&endDate=${today}`, 300000))
    .filter(r => r.ISSUEDATE).map(r => ({ d: omanDate(r.ISSUEDATE), w: normWilaya(r.STATENAMEAR), a: activity(r.DEFINITIONNAMEAR), e: r.EXPIRYDATE ? omanDate(r.EXPIRYDATE) : '' })),
};

(async () => {
  if (!process.env.NETLIFY && process.env.OPEN_DATA_SNAPSHOT !== '1') { console.log('[open-data snapshot] skipped (not a serverless build)'); return; }
  const snap = { errors: {}, fetchedAt: new Date().toISOString() };
  // One source at a time, smallest first, to keep the load on the municipality's server low
  for (const key of ['dig', 'buildings', 'rent', 'licences']) {
    snap[key] = await attempt(key, sources[key]);
    if (!snap[key]) snap.errors[key] = 'unreachable at build time';
  }
  if (!snap.dig && !snap.buildings && !snap.rent && !snap.licences) { console.warn('[open-data snapshot] no source answered; no snapshot written'); return; }
  fs.writeFileSync(OUT, JSON.stringify(snap));
  console.log(`[open-data snapshot] written: ${(fs.statSync(OUT).size / 1048576).toFixed(1)} MB`);
})().catch(e => console.warn('[open-data snapshot] failed:', e.message));
