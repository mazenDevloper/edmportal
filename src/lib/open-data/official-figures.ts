import { SiteConfig } from '../types';

/*
 * Figures with no open-data API yet. Defaults come from the municipality's "المعاملات المخزنة
 * إلكترونياً" dashboard (2020 → end of Q1 2026); admins update them in /edmPortal → Identity.
 * Rent contracts, excavation permits, municipal licences and building permits are NOT here:
 * they are counted live from the open-data APIs (lib/open-data/transactions-source.ts).
 */

export type FigureKey = 'visits' | 'eTransactions' | 'bookings' | 'municipalLicences' | 'buildingPermits';

export const DEFAULT_FIGURES: Record<FigureKey, number> & { asOfAr: string; asOfEn: string } = {
  visits: 6_950_242,
  eTransactions: 360_806,
  bookings: 123_416,
  municipalLicences: 104_152,
  buildingPermits: 12_546,
  asOfAr: 'حتى نهاية الربع الأول 2026',
  asOfEn: 'to the end of Q1 2026',
};

/** Figures still entered by hand in the control panel */
// E-transactions is not entered: it is the sum of the transaction cards
export const MANUAL_FIGURES: FigureKey[] = ['visits', 'bookings'];

export const FIGURE_LABELS: Record<FigureKey, { ar: string; en: string }> = {
  visits: { ar: 'عدد الزيارات لكل الزوار', en: 'Total visits' },
  eTransactions: { ar: 'المعاملات الإلكترونية', en: 'E-transactions' },
  bookings: { ar: 'حجز التذاكر إلكترونياً', en: 'Tickets booked online' },
  municipalLicences: { ar: 'تراخيص بلدية أُتمّت', en: 'Municipal licences issued' },
  buildingPermits: { ar: 'تراخيص بناء أُتمّت', en: 'Building permits issued' },
};

/** Open-data source pages (ODM2040) behind each figure */
export const ODM_SOURCES = {
  rent: 'https://main.edm.gov.om/odm2040/rent',
  dig: 'https://main.edm.gov.om/odm2040/excavation',
  municipalLicences: 'https://main.edm.gov.om/odm2040/health',
  buildingPermits: 'https://main.edm.gov.om/odm2040/building',
} as const;

/** Panel values win; anything missing falls back to the published defaults */
export function officialFigures(stats?: SiteConfig['stats']) {
  const pick = (k: FigureKey) => (typeof stats?.[k] === 'number' && stats[k]! > 0 ? stats[k]! : DEFAULT_FIGURES[k]);
  return {
    visits: pick('visits'),
    eTransactions: pick('eTransactions'),
    bookings: pick('bookings'),
    municipalLicences: pick('municipalLicences'),
    buildingPermits: pick('buildingPermits'),
    asOfAr: stats?.figuresAsOfAr?.trim() || DEFAULT_FIGURES.asOfAr,
    asOfEn: stats?.figuresAsOfEn?.trim() || DEFAULT_FIGURES.asOfEn,
  };
}
