/*
 * Main navigation, mirroring the municipality website's menu.
 * Items added in the control panel (menuItems in the database) are appended after these.
 */

export type Bi = { ar: string; en: string };

export interface MenuLink { label: Bi; href: string; external?: boolean; note?: Bi }
export interface MenuGroup {
  id: string;
  label: Bi;
  href?: string;              // a plain link when there are no children
  icon?: 'play';
  badge?: Bi;                 // e.g. "جديد"
  intro?: { title: Bi; text: Bi }[]; // text panels (vision / mission)
  children?: MenuLink[];
}

export const MAIN_MENU: MenuGroup[] = [
  { id: 'home', label: { ar: 'الرئيسية', en: 'Home' }, href: '/' },
  {
    id: 'about', label: { ar: 'عن بلدية ظفار', en: 'About the municipality' },
    intro: [
      { title: { ar: 'الرؤية', en: 'Vision' }, text: { ar: 'بلدية رائدة لتنمية مستدامة', en: 'A leading municipality for sustainable development' } },
      { title: { ar: 'الرسالة', en: 'Mission' }, text: {
        ar: 'تحقيق تنمية مستدامة ترتكز على الابتكار، ورفاهية المجتمع، وحماية البيئة؛ عبر موارد بشرية كفؤة وشراكات فاعلة وخدمات عالية الجودة.',
        en: 'Sustainable development built on innovation, community well-being and environmental protection, through capable people, effective partnerships and high-quality services.',
      } },
    ],
    children: [
      { label: { ar: 'عن البلدية', en: 'About us' }, href: 'https://edm.gov.om/?page_id=32', external: true },
      { label: { ar: 'الهيكل التنظيمي', en: 'Organisation chart' }, href: 'https://edm.gov.om/?p=4501', external: true },
    ],
  },
  { id: 'services', label: { ar: 'دليل الخدمات', en: 'Service guide' }, href: '/catalog' },
  {
    id: 'open-data', label: { ar: 'البيانات المفتوحة', en: 'Open data' }, badge: { ar: 'جديد', en: 'New' },
    children: [
      { label: { ar: 'الصفحة الرئيسية للبيانات المفتوحة', en: 'Open data home' }, href: '/open-data/hub' },
      { label: { ar: 'لوحة المعاملات المخزنة إلكترونياً', en: 'Transactions dashboard' }, href: '/open-data/transactions' },
      { label: { ar: 'إحصائيات التراخيص البلدية', en: 'Municipal licence statistics' }, href: 'https://apps.edm.gov.om/ords/dm_health/r/health-system/225', external: true },
      { label: { ar: 'إحصائيات عقود الإيجار', en: 'Lease contract statistics' }, href: 'https://apps.edm.gov.om/ords/f?p=105:182', external: true },
      { label: { ar: 'رخصة البيانات المفتوحة', en: 'Open data licence' }, href: '/open-data' },
    ],
  },
  {
    id: 'reports', label: { ar: 'التقارير', en: 'Reports' },
    children: [
      { label: { ar: 'التقرير السنوي لعام 2022', en: 'Annual report 2022' }, href: 'https://www.edm.gov.om/ar2022.pdf', external: true, note: { ar: 'PDF · 10 م.ب', en: 'PDF · 10 MB' } },
      { label: { ar: 'التقرير السنوي لعام 2021', en: 'Annual report 2021' }, href: 'https://www.edm.gov.om/ar2021.pdf', external: true, note: { ar: 'PDF · 2.6 م.ب', en: 'PDF · 2.6 MB' } },
      { label: { ar: 'نتائج استبيانات الخدمات', en: 'Service survey results' }, href: 'https://edm.gov.om/wp-content/uploads/2025/05/%D9%86%D8%AA%D8%A7%D8%A6%D8%AC-%D8%A7%D9%84%D8%A5%D8%B3%D8%AA%D8%A8%D9%8A%D8%A7%D9%86%D8%A7%D8%AA.xlsx', external: true, note: { ar: 'Excel', en: 'Excel' } },
    ],
  },
  {
    id: 'media', label: { ar: 'المركز الإعلامي', en: 'Media centre' },
    children: [
      { label: { ar: 'كل الأخبار', en: 'All news' }, href: 'https://edm.gov.om/?cat=12', external: true },
      { label: { ar: 'أخبار البلدية', en: 'Municipality news' }, href: 'https://edm.gov.om/?cat=20', external: true },
      { label: { ar: 'الهيكل التنظيمي', en: 'Organisation chart' }, href: 'https://edm.gov.om/?cat=56', external: true },
    ],
  },
  {
    id: 'videos', label: { ar: 'الشروحات المرئية', en: 'Video guides' }, icon: 'play',
    children: [
      { label: { ar: 'شروحات خدمات الترخيص البلدي', en: 'Municipal licensing services' }, href: 'https://www.youtube.com/playlist?list=PL3x7I3AhabsHjo1__5_10i-FMKxNOuLd7', external: true },
      { label: { ar: 'شروحات خدمات عقود الإيجار', en: 'Lease contract services' }, href: 'https://www.youtube.com/playlist?list=PL3x7I3AhabsFU6v6M3-txyAoCoYB-MmZi', external: true },
      { label: { ar: 'شرح خدمة تواصل معنا', en: '"Contact us" service' }, href: 'https://www.youtube.com/watch?v=kqm97LC2U0U&list=PL3x7I3AhabsEwRiRuMWaewp9B4TjrPj9i&index=1', external: true },
    ],
  },
  { id: 'participation', label: { ar: 'المشاركة الرقمية', en: 'Digital participation' }, href: '/participation' },
];

/** Every link the built-in menu already covers (so database items don't duplicate them) */
export const MENU_HREFS = new Set(MAIN_MENU.flatMap(g => [g.href, ...(g.children || []).map(c => c.href)].filter(Boolean) as string[]));
export const MENU_LABELS = new Set(MAIN_MENU.map(g => g.label.ar));
