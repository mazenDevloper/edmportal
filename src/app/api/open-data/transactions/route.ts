import { NextResponse } from 'next/server';
import { getSnapshot, HISTORY_START, todayOman, yesterdayOman } from '@/lib/open-data/transactions-source';
import { summarise } from '@/lib/open-data/transactions-stats';
import { getWebsiteCounters } from '@/lib/open-data/website-counters';

export const dynamic = 'force-dynamic';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * GET /api/open-data/transactions?from=2026-01-01&to=2026-03-31&wilaya=صلالة
 * Totals and breakdowns from the municipality's open-data APIs (cached on the server).
 * Defaults to the whole history up to yesterday (complete days only) and all wilayat;
 * &includeToday=1 extends the end to today (partial day).
 */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const from = DATE.test(q.get('from') || '') ? q.get('from')! : HISTORY_START;
  const bound = q.get('includeToday') === '1' ? todayOman() : yesterdayOman();
  const asked = DATE.test(q.get('to') || '') ? q.get('to')! : bound;
  const to = asked > bound ? bound : asked;
  const wilaya = (q.get('wilaya') || '').trim().slice(0, 60) || null;
  if (from > to) return NextResponse.json({ error: 'from must be before to' }, { status: 400 });

  const [snap, website] = await Promise.all([getSnapshot(), getWebsiteCounters()]);
  if (!snap.rent && !snap.dig && !snap.licences && !snap.buildings) {
    return NextResponse.json({ error: 'Open-data APIs are unreachable' }, { status: 503 });
  }
  return NextResponse.json({ ...summarise(snap, from, to, wilaya, bound), website }, {
    headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=1800' },
  });
}
