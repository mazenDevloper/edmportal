import type { Snapshot, SourceKey } from './transactions-source';
import type { WebsiteCounters } from './website-counters';

/*
 * Aggregations over the open-data snapshot, and the shared shape the API route returns.
 * Pure functions — safe to import on the client for the types.
 */

export type { SourceKey };
export const SOURCES: SourceKey[] = ['rent', 'dig', 'licences', 'buildings'];

export interface Count { key: string; n: number }
type PerSource<T> = Record<SourceKey, T>;

export interface TransactionStats {
  updatedAt: string;
  live: PerSource<boolean>;
  range: { from: string; to: string; wilaya: string | null };
  /** Last day included in the whole-history figures (yesterday unless today was asked for) */
  asOf: string;
  /** In the selected period (and wilayat) */
  totals: PerSource<number | null>;
  /** Whole history, all wilayat: the headline figures */
  allTime: PerSource<number | null>;
  /** Municipal licences not yet expired today (all wilayat) */
  activeLicences: number | null;
  byWilaya: ({ wilaya: string } & PerSource<number>)[];
  byMonth: ({ month: string } & PerSource<number>)[];
  rentByUse: Count[];
  rentByStatus: Count[];
  digByProject: Count[];
  licencesByActivity: Count[];
  buildingsByType: Count[];
  buildingsByUse: Count[];
  buildingsByService: Count[];
  /** Last full month in the period vs the month before, per source (null if not enough data) */
  monthOverMonth: PerSource<number | null> & { month: string | null };
  wilayat: string[];
  /** Counters read from the municipality website's home page (visits, e-transactions, bookings) */
  website?: WebsiteCounters;
}

const inRange = (d: string, from: string, to: string) => d >= from && d <= to;
const tally = (items: string[], top = 8): Count[] => {
  const m = new Map<string, number>();
  items.forEach(k => m.set(k, (m.get(k) || 0) + 1));
  return [...m.entries()].map(([key, n]) => ({ key, n })).sort((a, b) => b.n - a.n).slice(0, top);
};
const zero = (): PerSource<number> => ({ rent: 0, dig: 0, licences: 0, buildings: 0 });

export function summarise(snap: Snapshot, from: string, to: string, wilaya: string | null, asOf: string = to): TransactionStats {
  // Whole history up to asOf: by default yesterday, so no figure includes a half-finished day
  const upTo = <T extends { d: string }>(rows: T[] | null) => (rows ? rows.filter(r => r.d <= asOf) : null);
  const all = { rent: upTo(snap.rent), dig: upTo(snap.dig), licences: upTo(snap.licences), buildings: upTo(snap.buildings) };
  const inPeriod = <T extends { d: string }>(rows: T[] | null) => rows ? rows.filter(r => inRange(r.d, from, to)) : null;
  const period = { rent: inPeriod(all.rent), dig: inPeriod(all.dig), licences: inPeriod(all.licences), buildings: inPeriod(all.buildings) };
  const pick = <T extends { w: string }>(rows: T[] | null) => rows ? rows.filter(r => !wilaya || r.w === wilaya) : null;
  const sel = { rent: pick(period.rent), dig: pick(period.dig), licences: pick(period.licences), buildings: pick(period.buildings) };

  // Per wilayat for the period (ignores the wilayat filter so the comparison stays visible)
  const wMap = new Map<string, PerSource<number>>();
  SOURCES.forEach(k => (period[k] as { w: string }[] | null)?.forEach(r => {
    const e = wMap.get(r.w) || zero(); e[k]++; wMap.set(r.w, e);
  }));

  const mMap = new Map<string, PerSource<number>>();
  SOURCES.forEach(k => (sel[k] as { d: string }[] | null)?.forEach(r => {
    const key = r.d.slice(0, 7); const e = mMap.get(key) || zero(); e[k]++; mMap.set(key, e);
  }));
  const byMonth = [...mMap.entries()].map(([month, v]) => ({ month, ...v })).sort((a, b) => a.month.localeCompare(b.month));

  // Month-over-month on the last *complete* month inside the period
  const thisMonth = new Date(Date.now() + 4 * 3600e3).toISOString().slice(0, 7);
  const full = byMonth.filter(m => m.month < thisMonth);
  const last = full[full.length - 1], prev = full[full.length - 2];
  const pct = (a?: number, b?: number) => (a !== undefined && b ? Math.round(((a - b) / b) * 1000) / 10 : null);

  // Every wilayat in the history, busiest first
  const wCount = new Map<string, number>();
  SOURCES.forEach(k => (all[k] as { w: string }[] | null)?.forEach(r => wCount.set(r.w, (wCount.get(r.w) || 0) + 1)));

  const today = new Date(Date.now() + 4 * 3600e3).toISOString().slice(0, 10);
  const count = (rows: unknown[] | null) => (rows ? rows.length : null);

  return {
    updatedAt: snap.fetchedAt,
    live: { rent: !!all.rent && !snap.errors.rent, dig: !!all.dig && !snap.errors.dig, licences: !!all.licences && !snap.errors.licences, buildings: !!all.buildings && !snap.errors.buildings },
    range: { from, to, wilaya },
    asOf,
    totals: { rent: count(sel.rent), dig: count(sel.dig), licences: count(sel.licences), buildings: count(sel.buildings) },
    allTime: { rent: count(all.rent), dig: count(all.dig), licences: count(all.licences), buildings: count(all.buildings) },
    activeLicences: all.licences ? all.licences.filter(r => r.e && r.e >= today).length : null,
    byWilaya: [...wMap.entries()].map(([w, v]) => ({ wilaya: w, ...v }))
      .sort((a, b) => SOURCES.reduce((s, k) => s + b[k], 0) - SOURCES.reduce((s, k) => s + a[k], 0)),
    byMonth,
    rentByUse: tally((sel.rent || []).map(r => r.u)),
    rentByStatus: tally((sel.rent || []).map(r => r.s)),
    digByProject: tally((sel.dig || []).map(r => r.p)),
    licencesByActivity: tally((sel.licences || []).map(r => r.a)),
    buildingsByType: tally((sel.buildings || []).map(r => r.t)),
    buildingsByUse: tally((sel.buildings || []).map(r => r.u)),
    buildingsByService: tally((sel.buildings || []).map(r => r.s)),
    monthOverMonth: {
      rent: pct(last?.rent, prev?.rent), dig: pct(last?.dig, prev?.dig),
      licences: pct(last?.licences, prev?.licences), buildings: pct(last?.buildings, prev?.buildings),
      month: last?.month || null,
    },
    wilayat: [...wCount.entries()].sort((a, b) => b[1] - a[1]).map(([w]) => w),
  };
}
