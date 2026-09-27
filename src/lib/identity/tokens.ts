/*
 * Dhofar Municipality visual identity — single source for colors, type, spacing and patterns.
 * The identity board documents these, and page blocks only accept these options.
 */

export interface ColorToken {
  id: string;
  hex: string;
  nameAr: string;
  nameEn: string;
  roleAr: string;
  roleEn: string;
  cssVar?: string;
  onColor: '#ffffff' | '#0f172a';
}

export const BRAND_COLORS: ColorToken[] = [
  { id: 'teal', hex: '#03CFCB', nameAr: 'التيل الحيوي', nameEn: 'Vital Teal', roleAr: 'اللون الأساسي للتفاعل والأزرار', roleEn: 'Primary interaction & buttons', cssVar: '--primary', onColor: '#0f172a' },
  { id: 'purple', hex: '#470D67', nameAr: 'الأرجواني الملكي', nameEn: 'Royal Purple', roleAr: 'العلامة والعناوين الرسمية', roleEn: 'Brand & official headings', cssVar: '--secondary', onColor: '#ffffff' },
  { id: 'teal-dark', hex: '#008E91', nameAr: 'تيل داكن', nameEn: 'Deep Teal', roleAr: 'تدرجات وحالات التحويم', roleEn: 'Gradients & hover states', onColor: '#ffffff' },
  { id: 'teal-deep', hex: '#005751', nameAr: 'تيل عميق', nameEn: 'Forest Teal', roleAr: 'نصوص على خلفيات فاتحة', roleEn: 'Text on light surfaces', onColor: '#ffffff' },
  { id: 'purple-light', hex: '#A187B2', nameAr: 'أرجواني فاتح', nameEn: 'Lilac', roleAr: 'عناصر ثانوية وزخارف', roleEn: 'Secondary accents', onColor: '#0f172a' },
  { id: 'purple-soft', hex: '#BCA3CC', nameAr: 'أرجواني ناعم', nameEn: 'Soft Lilac', roleAr: 'خلفيات هادئة', roleEn: 'Calm backgrounds', onColor: '#0f172a' },
];

export const NEUTRAL_COLORS: ColorToken[] = [
  { id: 'ink', hex: '#0F172A', nameAr: 'حبر', nameEn: 'Ink', roleAr: 'النصوص الأساسية', roleEn: 'Body text', onColor: '#ffffff' },
  { id: 'slate', hex: '#475569', nameAr: 'رمادي أردوازي', nameEn: 'Slate', roleAr: 'نصوص ثانوية', roleEn: 'Secondary text', onColor: '#ffffff' },
  { id: 'mist', hex: '#E2E8F0', nameAr: 'ضباب', nameEn: 'Mist', roleAr: 'الحدود والفواصل', roleEn: 'Borders & dividers', onColor: '#0f172a' },
  { id: 'cloud', hex: '#F8FAFC', nameAr: 'غيم', nameEn: 'Cloud', roleAr: 'خلفية الصفحات', roleEn: 'Page background', onColor: '#0f172a' },
];

export const STATUS_COLORS: ColorToken[] = [
  { id: 'success', hex: '#059669', nameAr: 'نجاح', nameEn: 'Success', roleAr: 'الموافقات والإنجاز', roleEn: 'Approvals & completion', onColor: '#ffffff' },
  { id: 'warning', hex: '#D97706', nameAr: 'تنبيه', nameEn: 'Warning', roleAr: 'الاشتراطات والتنبيهات', roleEn: 'Conditions & alerts', onColor: '#ffffff' },
  { id: 'danger', hex: '#DC2626', nameAr: 'خطر', nameEn: 'Danger', roleAr: 'الرفض والأخطاء', roleEn: 'Rejections & errors', onColor: '#ffffff' },
  { id: 'info', hex: '#2563EB', nameAr: 'معلومة', nameEn: 'Info', roleAr: 'الإرشاد والمعلومات', roleEn: 'Guidance & information', onColor: '#ffffff' },
];

export const TYPE_SCALE = [
  { id: 'display', size: 64, weight: 900, leading: 1.05, labelAr: 'عرض', labelEn: 'Display', useAr: 'عناوين الصفحات الرئيسية', useEn: 'Hero titles' },
  { id: 'h1', size: 48, weight: 900, leading: 1.1, labelAr: 'عنوان 1', labelEn: 'Heading 1', useAr: 'عنوان الصفحة', useEn: 'Page title' },
  { id: 'h2', size: 36, weight: 800, leading: 1.2, labelAr: 'عنوان 2', labelEn: 'Heading 2', useAr: 'عناوين الأقسام', useEn: 'Section titles' },
  { id: 'h3', size: 24, weight: 700, leading: 1.3, labelAr: 'عنوان 3', labelEn: 'Heading 3', useAr: 'عناوين البطاقات', useEn: 'Card titles' },
  { id: 'body-lg', size: 20, weight: 400, leading: 1.8, labelAr: 'نص كبير', labelEn: 'Body large', useAr: 'المقدمات', useEn: 'Lead paragraphs' },
  { id: 'body', size: 16, weight: 400, leading: 1.8, labelAr: 'نص', labelEn: 'Body', useAr: 'النصوص العامة', useEn: 'Running text' },
  { id: 'caption', size: 12, weight: 700, leading: 1.5, labelAr: 'تعليق', labelEn: 'Caption', useAr: 'الوسوم والملاحظات', useEn: 'Labels & notes' },
];

export const RADII = [
  { id: 'md', px: 12, labelAr: 'متوسط', labelEn: 'Medium', useAr: 'حقول الإدخال', useEn: 'Inputs' },
  { id: 'lg', px: 20, labelAr: 'كبير', labelEn: 'Large', useAr: 'الأزرار والبطاقات الصغيرة', useEn: 'Buttons & small cards' },
  { id: 'xl', px: 32, labelAr: 'واسع', labelEn: 'Extra large', useAr: 'البطاقات والأقسام', useEn: 'Cards & sections' },
  { id: 'pill', px: 999, labelAr: 'كبسولة', labelEn: 'Pill', useAr: 'الوسوم والمفاتيح', useEn: 'Badges & toggles' },
];

export const SPACING = [4, 8, 12, 16, 24, 32, 48, 64, 96];

export const PATTERNS = [
  { id: 'landmark', className: 'dm-pattern-landmark', nameAr: 'المعالم', nameEn: 'Landmark', useAr: 'ترويسات الصفحات الرسمية', useEn: 'Official page headers' },
  { id: 'wave', className: 'dm-pattern-wave-pro', nameAr: 'الأمواج', nameEn: 'Wave', useAr: 'الأشرطة والبنرات', useEn: 'Bands & banners' },
  { id: 'tree', className: 'dm-pattern-tree-pro', nameAr: 'الشجرة العمانية', nameEn: 'Omani Tree', useAr: 'البيئة والزراعة', useEn: 'Environment & agriculture' },
  { id: 'circle', className: 'dm-pattern-circle-pro', nameAr: 'الدوائر', nameEn: 'Circles', useAr: 'البطاقات والإحصائيات', useEn: 'Cards & statistics' },
  { id: 'matrix', className: 'dm-pattern-matrix-all', nameAr: 'النمط الشامل', nameEn: 'Matrix', useAr: 'الخلفيات الكبيرة', useEn: 'Large backgrounds' },
] as const;

export const PATTERN_CLASS: Record<string, string> = Object.fromEntries(PATTERNS.map(p => [p.id, p.className]));

// ─── WCAG contrast ───

const channel = (c: number) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

export function luminance(hex: string) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(x => x + x).join('') : h, 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

export function contrastRatio(a: string, b: string) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** WCAG 2.2 rating for normal text (large text passes AA at 3:1) */
export function wcagRating(ratio: number): 'AAA' | 'AA' | 'AA Large' | 'Fail' {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3) return 'AA Large';
  return 'Fail';
}

export function hexToHsl(hex: string) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/** Bilingual terminology the portal and the translator must use consistently */
export const GLOSSARY: { ar: string; en: string }[] = [
  { ar: 'بلدية ظفار', en: 'Dhofar Municipality' },
  { ar: 'محافظة ظفار', en: 'Dhofar Governorate' },
  { ar: 'سلطنة عُمان', en: 'Sultanate of Oman' },
  { ar: 'ثقة', en: 'Thiqa' },
  { ar: 'تجاوب', en: 'Tajawob' },
  { ar: 'رؤية عُمان 2040', en: 'Oman Vision 2040' },
  { ar: 'موسم الخريف', en: 'Khareef season' },
  { ar: 'الكروكي', en: 'krooki (site sketch)' },
  { ar: 'شهادة عدم ممانعة', en: 'No-Objection Certificate (NOC)' },
  { ar: 'السجل التجاري', en: 'Commercial Registration (CR)' },
  { ar: 'البطاقة الشخصية', en: 'National ID card' },
  { ar: 'الخزانة الرقمية', en: 'digital vault' },
  { ar: 'رسوم بلدية', en: 'municipal fees' },
  { ar: 'ر.ع', en: 'OMR' },
  { ar: 'المتقدم', en: 'applicant' },
  { ar: 'الموظف المختص', en: 'competent employee' },
  { ar: 'رئيس القسم', en: 'Head of Section' },
];
