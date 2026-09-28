/*
 * Data the applicant must never upload or type in by hand:
 * - identity (national ID / civil number, personal details) comes from Thiqa sign-in
 * - establishment data comes from the Commercial Registration link (by CR number only)
 * Service forms replace matching fields with a linked-data card, and the builder flags them.
 */

export type LinkedKind = 'identity' | 'cr';

const PATTERNS: Record<LinkedKind, RegExp> = {
  identity: /البطاقة الشخصية|بطاقة شخصية|بطاقة الهوية|صورة من الهوية|صورة الهوية|الرقم المدني|الهوية الوطنية|national id|id card|id copy|identity card|civil (id|number)/i,
  cr: /السجل التجاري|سجل تجاري|commercial regist|\bCR\b/i,
};

/** Which linked source a field/document label refers to, if any */
export function linkedKind(label?: string): LinkedKind | null {
  if (!label) return null;
  if (PATTERNS.cr.test(label)) return 'cr';
  if (PATTERNS.identity.test(label)) return 'identity';
  return null;
}

export const LINKED_INFO: Record<LinkedKind, { titleAr: string; titleEn: string; sourceAr: string; sourceEn: string; noteAr: string; noteEn: string }> = {
  identity: {
    titleAr: 'البيانات الشخصية والرقم المدني', titleEn: 'Personal data & civil number',
    sourceAr: 'ثقة', sourceEn: 'Thiqa',
    noteAr: 'تُجلب تلقائياً من نظام ثقة عند تسجيل الدخول، ولا يُطلب إرفاق البطاقة الشخصية.',
    noteEn: 'Fetched automatically from Thiqa at sign-in; no ID card upload is needed.',
  },
  cr: {
    titleAr: 'بيانات السجل التجاري', titleEn: 'Commercial Registration data',
    sourceAr: 'الربط مع وزارة التجارة', sourceEn: 'Ministry of Commerce link',
    noteAr: 'أدخل رقم السجل التجاري فقط، وتُجلب بيانات المنشأة تلقائياً دون إرفاق أي مستند.',
    noteEn: 'Enter the CR number only; the establishment data is fetched automatically, no document upload.',
  },
};

/** CR numbers are digits; allow 4–12 */
export const isValidCrNumber = (v: string) => /^\d{4,12}$/.test(v.trim());
