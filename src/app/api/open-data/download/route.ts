import { NextResponse } from 'next/server';
import { getSnapshot, todayOman, yesterdayOman, HISTORY_START } from '@/lib/open-data/transactions-source';
import { datasetById, DatasetId } from '@/lib/open-data/catalog';
import { fetchBin } from '@/lib/jsonbin';
import { SLA_SERVICES } from '@/lib/footer-pages';
import type { Service } from '@/lib/types';

export const dynamic = 'force-dynamic';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
type Row = Record<string, string>;

/**
 * GET /api/open-data/download?dataset=rent&format=csv|json[&from=YYYY-MM-DD&to=YYYY-MM-DD&wilaya=…&limit=N]
 * Open-licence distributions of every catalogue dataset. CSV is UTF-8 with a BOM so Excel shows Arabic.
 */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const ds = datasetById(q.get('dataset') || '');
  if (!ds) return NextResponse.json({ error: 'Unknown dataset' }, { status: 404 });
  const format = q.get('format') === 'csv' ? 'csv' : 'json';
  const from = DATE.test(q.get('from') || '') ? q.get('from')! : HISTORY_START;
  // Complete days only by default; &includeToday=1 adds today's partial data
  const bound = q.get('includeToday') === '1' ? todayOman() : yesterdayOman();
  const asked = DATE.test(q.get('to') || '') ? q.get('to')! : bound;
  const to = asked > bound ? bound : asked;
  const wilaya = (q.get('wilaya') || '').trim().slice(0, 60) || null;
  const limit = Math.min(Math.max(Number(q.get('limit')) || 0, 0), 500_000);

  let rows: Row[];
  try {
    rows = await rowsFor(ds.id, from, to, wilaya);
  } catch {
    return NextResponse.json({ error: 'Source unavailable, try again shortly' }, { status: 503 });
  }
  const total = rows.length;
  if (limit) rows = rows.slice(0, limit);
  const fields = ds.fields.map(f => f.name);

  if (format === 'json') {
    return NextResponse.json({ dataset: ds.id, total, returned: rows.length, fields, rows }, {
      headers: { 'Cache-Control': 'public, max-age=300', 'Access-Control-Allow-Origin': '*' },
    });
  }
  const esc = (v: string) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const csv = '﻿' + [fields.join(','), ...rows.map(r => fields.map(f => esc(r[f] ?? '')).join(','))].join('\r\n');
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="dhofar-${ds.id}-${from}_${to}.csv"`,
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

async function rowsFor(id: DatasetId, from: string, to: string, wilaya: string | null): Promise<Row[]> {
  const keep = <T extends { d: string; w: string }>(r: T) => r.d >= from && r.d <= to && (!wilaya || r.w === wilaya);
  if (id === 'services') {
    const db = await fetchBin();
    return ((db.services || []) as Service[]).filter(s => s.isPublic === true).map(s => ({
      id: s.id, title_ar: s.title, title_en: s.titleEn || '', category: s.category || '', fees: s.fees || '', duration: s.durationAr || '',
    }));
  }
  if (id === 'sla') return SLA_SERVICES.map(s => ({ service_ar: s.nameAr, service_en: s.nameEn, duration_ar: s.durationAr, duration_en: s.durationEn }));

  const snap = await getSnapshot();
  const newestFirst = (a: Row, b: Row) => b.date.localeCompare(a.date);
  if (id === 'rent') { if (!snap.rent) throw new Error('down'); return snap.rent.filter(keep).map(r => ({ date: r.d, wilayat: r.w, use: r.u, status: r.s })).sort(newestFirst); }
  if (id === 'licences') { if (!snap.licences) throw new Error('down'); return snap.licences.filter(keep).map(r => ({ date: r.d, wilayat: r.w, activity: r.a, expiry: r.e })).sort(newestFirst); }
  if (id === 'buildings') { if (!snap.buildings) throw new Error('down'); return snap.buildings.filter(keep).map(r => ({ date: r.d, wilayat: r.w, permit_type: r.s, building_type: r.t, use: r.u })).sort(newestFirst); }
  if (!snap.dig) throw new Error('down');
  return snap.dig.filter(keep).map(r => ({ date: r.d, wilayat: r.w, project: r.p })).sort(newestFirst);
}
