/*
 * Open-data catalogue: one entry per published dataset, with the metadata the W3C "Data on the Web
 * Best Practices" and DCAT-AP expect (description, publisher, licence, coverage, update frequency,
 * provenance, data dictionary, distributions). Shared by the hub page and the DCAT API.
 */

export type Bi = { ar: string; en: string };
export type DatasetId = 'rent' | 'licences' | 'buildings' | 'dig' | 'services' | 'sla';
export type Theme = 'housing' | 'business' | 'construction' | 'infrastructure' | 'services';

export interface FieldDef { name: string; type: 'date' | 'string' | 'number'; label: Bi }
export interface Dataset {
  id: DatasetId;
  title: Bi;
  description: Bi;
  theme: Theme;
  keywords: Bi[];
  /** ISO 8601 / DCAT frequency */
  frequency: 'daily' | 'monthly' | 'irregular';
  temporalStart?: string;
  /** Upstream open-data page (provenance) */
  source?: string;
  /** Live transaction series, if any (links the dataset to the dashboards) */
  series?: 'rent' | 'dig' | 'licences' | 'buildings';
  fields: FieldDef[];
  /** 5-star open data: 3★ = open licence + machine-readable + open format (CSV/JSON) */
  stars: 1 | 2 | 3 | 4 | 5;
}

const b = (ar: string, en: string): Bi => ({ ar, en });

export const PUBLISHER = { name: b('بلدية ظفار', 'Dhofar Municipality'), url: 'https://edm.gov.om', email: 'portal@dm.gov.om' };
export const LICENSE = { name: b('رخصة البيانات المفتوحة لبلدية ظفار', 'Dhofar Municipality Open Data Licence'), path: '/open-data' };

export const THEMES: Record<Theme, Bi & { icon: string }> = {
  housing: { ar: 'الإسكان والعقارات', en: 'Housing & property', icon: 'Home' },
  business: { ar: 'الأعمال والتراخيص', en: 'Business & licensing', icon: 'Store' },
  construction: { ar: 'البناء والتعمير', en: 'Building & planning', icon: 'Building2' },
  infrastructure: { ar: 'البنية التحتية', en: 'Infrastructure', icon: 'Construction' },
  services: { ar: 'الخدمات الحكومية', en: 'Government services', icon: 'LayoutGrid' },
};

export const DATASETS: Dataset[] = [
  {
    id: 'rent', series: 'rent', theme: 'housing', frequency: 'daily', temporalStart: '2020-01-01', stars: 3,
    title: b('عقود الإيجار الموثقة', 'Registered rent contracts'),
    description: b('عقود الإيجار السكنية والتجارية والاستثمارية الموثقة لدى البلدية، حسب الولاية ونوع الاستخدام وحالة العقد.', 'Residential, commercial and investment leases registered with the municipality, by wilayat, use and contract status.'),
    keywords: [b('إيجار', 'rent'), b('عقارات', 'property'), b('سكن', 'housing')],
    source: 'https://main.edm.gov.om/odm2040/rent',
    fields: [
      { name: 'date', type: 'date', label: b('تاريخ بداية العقد', 'Contract start date') },
      { name: 'wilayat', type: 'string', label: b('الولاية', 'Wilayat') },
      { name: 'use', type: 'string', label: b('نوع الاستخدام', 'Use') },
      { name: 'status', type: 'string', label: b('حالة العقد', 'Contract status') },
    ],
  },
  {
    id: 'licences', series: 'licences', theme: 'business', frequency: 'daily', temporalStart: '2020-01-01', stars: 3,
    title: b('التراخيص البلدية', 'Municipal licences'),
    description: b('التراخيص البلدية الصادرة للأنشطة التجارية والمهنية، مع النشاط والولاية وتاريخي الإصدار والانتهاء.', 'Municipal licences issued to commercial and professional activities, with activity, wilayat, issue and expiry dates.'),
    keywords: [b('ترخيص', 'licence'), b('نشاط تجاري', 'business activity'), b('صحة', 'health')],
    source: 'https://main.edm.gov.om/odm2040/health',
    fields: [
      { name: 'date', type: 'date', label: b('تاريخ الإصدار', 'Issue date') },
      { name: 'wilayat', type: 'string', label: b('الولاية', 'Wilayat') },
      { name: 'activity', type: 'string', label: b('النشاط', 'Activity') },
      { name: 'expiry', type: 'date', label: b('تاريخ الانتهاء', 'Expiry date') },
    ],
  },
  {
    id: 'buildings', series: 'buildings', theme: 'construction', frequency: 'daily', temporalStart: '2020-01-01', stars: 3,
    title: b('تراخيص البناء', 'Building permits'),
    description: b('تراخيص البناء الجديدة والتعديل والإضافة والتجديد، حسب الولاية ونوع المبنى والاستخدام.', 'New, modification, extension and renewal building permits, by wilayat, building type and use.'),
    keywords: [b('بناء', 'building'), b('تعمير', 'construction'), b('فلل', 'villas')],
    source: 'https://main.edm.gov.om/odm2040/building',
    fields: [
      { name: 'date', type: 'date', label: b('تاريخ الطلب', 'Application date') },
      { name: 'wilayat', type: 'string', label: b('الولاية', 'Wilayat') },
      { name: 'permit_type', type: 'string', label: b('نوع الترخيص', 'Permit type') },
      { name: 'building_type', type: 'string', label: b('نوع المبنى', 'Building type') },
      { name: 'use', type: 'string', label: b('الاستخدام', 'Use') },
    ],
  },
  {
    id: 'dig', series: 'dig', theme: 'infrastructure', frequency: 'daily', temporalStart: '2020-01-01', stars: 3,
    title: b('تراخيص الحفر ومسارات الخدمات', 'Excavation & utility-route permits'),
    description: b('تراخيص الحفر لتمديد خدمات الكهرباء والمياه والاتصالات والطرق والإنارة، حسب الولاية ونوع المشروع.', 'Excavation permits for electricity, water, telecoms, roads and lighting extensions, by wilayat and project type.'),
    keywords: [b('حفر', 'excavation'), b('كهرباء', 'electricity'), b('بنية تحتية', 'infrastructure')],
    source: 'https://main.edm.gov.om/odm2040/excavation',
    fields: [
      { name: 'date', type: 'date', label: b('تاريخ الطلب', 'Application date') },
      { name: 'wilayat', type: 'string', label: b('الولاية', 'Wilayat') },
      { name: 'project', type: 'string', label: b('نوع المشروع', 'Project type') },
    ],
  },
  {
    id: 'services', theme: 'services', frequency: 'irregular', stars: 3,
    title: b('دليل الخدمات الإلكترونية', 'E-services catalogue'),
    description: b('الخدمات المنشورة على البوابة مع الفئة والرسوم والمدة التقديرية.', 'Services published on the portal with category, fees and estimated time.'),
    keywords: [b('خدمات', 'services'), b('رسوم', 'fees')],
    fields: [
      { name: 'id', type: 'string', label: b('المعرّف', 'ID') },
      { name: 'title_ar', type: 'string', label: b('اسم الخدمة (عربي)', 'Name (Arabic)') },
      { name: 'title_en', type: 'string', label: b('اسم الخدمة (إنجليزي)', 'Name (English)') },
      { name: 'category', type: 'string', label: b('الفئة', 'Category') },
      { name: 'fees', type: 'string', label: b('الرسوم', 'Fees') },
      { name: 'duration', type: 'string', label: b('المدة التقديرية', 'Estimated time') },
    ],
  },
  {
    id: 'sla', theme: 'services', frequency: 'irregular', stars: 3,
    title: b('اتفاقية مستوى الخدمة', 'Service level agreement'),
    description: b('مدد إنجاز الخدمات المعتمدة في اتفاقية مستوى تقديم الخدمات الإلكترونية.', 'Committed completion times from the e-services level agreement.'),
    keywords: [b('مستوى الخدمة', 'SLA'), b('مدة', 'duration')],
    fields: [
      { name: 'service_ar', type: 'string', label: b('الخدمة (عربي)', 'Service (Arabic)') },
      { name: 'service_en', type: 'string', label: b('الخدمة (إنجليزي)', 'Service (English)') },
      { name: 'duration_ar', type: 'string', label: b('المدة (عربي)', 'Time (Arabic)') },
      { name: 'duration_en', type: 'string', label: b('المدة (إنجليزي)', 'Time (English)') },
    ],
  },
];

export const datasetById = (id: string) => DATASETS.find(d => d.id === id);

/** Stable download / API address for a dataset distribution */
export const downloadUrl = (id: DatasetId, format: 'csv' | 'json', q: Record<string, string | undefined> = {}) => {
  const params = new URLSearchParams({ dataset: id, format });
  Object.entries(q).forEach(([k, v]) => { if (v) params.set(k, v); });
  return `/api/open-data/download?${params.toString()}`;
};
