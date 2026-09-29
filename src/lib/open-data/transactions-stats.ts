import type { DigRow, RentRow, Snapshot } from './transactions-source';

/*
 * Aggregations over the open-data snapshot, and the shared shape the API route returns.
 * Pure functions — safe to import on the client for the types.
 */

export interface Count { key: string; n: number }
export interface TransactionStats {
  updatedAt: string;
  live: { rent: boolean; dig: boolean };
  range: { from: string; to: string; wilaya: string | null };
  /** In the selected period (and wilayat) */
  totals: { rent: number | null; dig: number | null };
  /** Whole history, all wilayat: the headline figures */
  allTime: { rent: number | null; dig: number | null };
  byWilaya: { wilaya: string; rent: number; dig: number }[];
  byMonth: { month: string; rent: number; dig: number }[];
  rentByUse: Count[];
  rentByStatus: Count[];
  digByProject: Count[];
  /** Last full month in the period vs the month before, per source (null if not enough data) */
  monthOverMonth: { rent: number | null; dig: number | null; month: string | null };
  wilayat: string[];
}

const inRange = (d: string, from: string, to: string) => d >= from && d <= to;
const tally = (items: string[]): Count[] => {
  const m = new Map<string, number>();
  items.forEach(k => m.set(k, (m.get(k) || 0) + 1));
  return [...m.entries()].map(([key, n]) => ({ key, n })).sort((a, b) => b.n - a.n);
};

export function summarise(snap: Snapshot, from: string, to: string, wilaya: string | null): TransactionStats {
  const rentAll = snap.rent, digAll = snap.dig;
  const pick = <T extends { d: string; w: string }>(rows: T[] | null) =>
    rows ? rows.filter(r => inRange(r.d, from, to) && (!wilaya || r.w === wilaya)) : null;
  const rent = pick<RentRow>(rentAll);
  const dig = pick<DigRow>(digAll);

  // Per wilayat for the period (ignores the wilayat filter so the comparison stays visible)
  const periodRent = rentAll?.filter(r => inRange(r.d, from, to)) || [];
  const periodDig = digAll?.filter(r => inRange(r.d, from, to)) || [];
  const wMap = new Map<string, { rent: number; dig: number }>();
  periodRent.forEach(r => { const e = wMap.get(r.w) || { rent: 0, dig: 0 }; e.rent++; wMap.set(r.w, e); });
  periodDig.forEach(r => { const e = wMap.get(r.w) || { rent: 0, dig: 0 }; e.dig++; wMap.set(r.w, e); });

  const mMap = new Map<string, { rent: number; dig: number }>();
  rent?.forEach(r => { const k = r.d.slice(0, 7); const e = mMap.get(k) || { rent: 0, dig: 0 }; e.rent++; mMap.set(k, e); });
  dig?.forEach(r => { const k = r.d.slice(0, 7); const e = mMap.get(k) || { rent: 0, dig: 0 }; e.dig++; mMap.set(k, e); });
  const byMonth = [...mMap.entries()].map(([month, v]) => ({ month, ...v })).sort((a, b) => a.month.localeCompare(b.month));

  // Month-over-month on the last *complete* month inside the period
  const thisMonth = new Date().toISOString().slice(0, 7);
  const full = byMonth.filter(m => m.month < thisMonth);
  const last = full[full.length - 1], prev = full[full.length - 2];
  const pct = (a?: number, b?: number) => (a !== undefined && b ? Math.round(((a - b) / b) * 1000) / 10 : null);

  // Every wilayat in the history, busiest first
  const wCount = new Map<string, number>();
  [...(rentAll || []), ...(digAll || [])].forEach(r => wCount.set(r.w, (wCount.get(r.w) || 0) + 1));
  const wilayat = [...wCount.entries()].sort((a, b) => b[1] - a[1]).map(([w]) => w);

  return {
    updatedAt: snap.fetchedAt,
    live: { rent: !!rentAll && !snap.rentError, dig: !!digAll && !snap.digError },
    range: { from, to, wilaya },
    totals: { rent: rent ? rent.length : null, dig: dig ? dig.length : null },
    allTime: { rent: rentAll ? rentAll.length : null, dig: digAll ? digAll.length : null },
    byWilaya: [...wMap.entries()].map(([w, v]) => ({ wilaya: w, ...v })).sort((a, b) => b.rent + b.dig - (a.rent + a.dig)),
    byMonth,
    rentByUse: tally((rent || []).map(r => r.u)),
    rentByStatus: tally((rent || []).map(r => r.s)),
    digByProject: tally((dig || []).map(r => r.p)),
    monthOverMonth: { rent: pct(last?.rent, prev?.rent), dig: pct(last?.dig, prev?.dig), month: last?.month || null },
    wilayat,
  };
}
