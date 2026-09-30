import { NextResponse } from 'next/server';
import { DATASETS, LICENSE, PUBLISHER, THEMES } from '@/lib/open-data/catalog';

export const dynamic = 'force-dynamic';

const FREQ: Record<string, string> = {
  daily: 'http://publications.europa.eu/resource/authority/frequency/DAILY',
  monthly: 'http://publications.europa.eu/resource/authority/frequency/MONTHLY',
  irregular: 'http://publications.europa.eu/resource/authority/frequency/IRREG',
};

/**
 * GET /api/open-data/catalog — the catalogue as DCAT-AP (JSON-LD), so other portals and
 * harvesters (e.g. national open-data portals, Google Dataset Search) can read it.
 */
export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  const lit = (v: { ar: string; en: string }) => [{ '@value': v.ar, '@language': 'ar' }, { '@value': v.en, '@language': 'en' }];
  const catalog = {
    '@context': { dcat: 'http://www.w3.org/ns/dcat#', dct: 'http://purl.org/dc/terms/', foaf: 'http://xmlns.com/foaf/0.1/', vcard: 'http://www.w3.org/2006/vcard/ns#' },
    '@id': `${origin}/api/open-data/catalog`,
    '@type': 'dcat:Catalog',
    'dct:title': lit({ ar: 'البيانات المفتوحة لبلدية ظفار', en: 'Dhofar Municipality open data' }),
    'dct:publisher': { '@type': 'foaf:Organization', 'foaf:name': lit(PUBLISHER.name), 'foaf:homepage': PUBLISHER.url },
    'dct:license': `${origin}${LICENSE.path}`,
    'dcat:themeTaxonomy': Object.entries(THEMES).map(([id, th]) => ({ '@id': `${origin}/open-data/hub#theme-${id}`, 'dct:title': lit(th) })),
    'dcat:dataset': DATASETS.map(d => ({
      '@id': `${origin}/open-data/hub#${d.id}`,
      '@type': 'dcat:Dataset',
      'dct:identifier': `dhofar-${d.id}`,
      'dct:title': lit(d.title),
      'dct:description': lit(d.description),
      'dcat:keyword': d.keywords.flatMap(k => lit(k)),
      'dcat:theme': `${origin}/open-data/hub#theme-${d.theme}`,
      'dct:publisher': { '@type': 'foaf:Organization', 'foaf:name': lit(PUBLISHER.name) },
      'dcat:contactPoint': { '@type': 'vcard:Organization', 'vcard:fn': PUBLISHER.name.en, 'vcard:hasEmail': `mailto:${PUBLISHER.email}` },
      'dct:accrualPeriodicity': FREQ[d.frequency],
      'dct:spatial': 'https://www.geonames.org/286246',  // Dhofar Governorate
      ...(d.temporalStart ? { 'dct:temporal': { '@type': 'dct:PeriodOfTime', 'dcat:startDate': d.temporalStart } } : {}),
      ...(d.source ? { 'dct:source': d.source } : {}),
      'dct:license': `${origin}${LICENSE.path}`,
      'dcat:landingPage': `${origin}/open-data/hub#${d.id}`,
      'dcat:distribution': (['csv', 'json'] as const).map(f => ({
        '@type': 'dcat:Distribution',
        'dct:title': `${d.title.en} (${f.toUpperCase()})`,
        'dcat:downloadURL': `${origin}/api/open-data/download?dataset=${d.id}&format=${f}`,
        'dcat:mediaType': f === 'csv' ? 'text/csv' : 'application/json',
        'dct:license': `${origin}${LICENSE.path}`,
      })),
    })),
  };
  return NextResponse.json(catalog, { headers: { 'Content-Type': 'application/ld+json; charset=utf-8', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=3600' } });
}
