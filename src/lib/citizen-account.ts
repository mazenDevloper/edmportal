/*
 * The beneficiary's account: the capacities (الصفة) a person can act in, and what the account
 * pages show for the chosen capacity.
 *
 * PROTOTYPE: there is no link yet to the Commercial Registration or the consultancy-office
 * register, nor to the municipality's finance system. So the establishments linked to a civil
 * number, and the dues, deposits and notifications below, are SAMPLE data so the screens can be
 * reviewed. Requests are real: they are the applications stored by the portal.
 */

export type CapacityKind = 'person' | 'company' | 'office';
export interface Capacity { id: string; kind: CapacityKind; nameAr: string; nameEn: string; ref: string }

export const CAPACITY_KIND: Record<CapacityKind, { ar: string; en: string }> = {
  person: { ar: 'فرد', en: 'Individual' },
  company: { ar: 'منشأة تجارية', en: 'Commercial establishment' },
  office: { ar: 'استشاري أو مقاول', en: 'Consultant or contractor' },
};

/** Everything the same civil number may act as. The person always comes first. */
export function capacitiesFor(identity: string, nameAr: string, nameEn = nameAr): Capacity[] {
  const digits = identity.replace(/\D/g, '').slice(-8) || '10458823';
  return [
    { id: 'person', kind: 'person', nameAr, nameEn, ref: digits },
    { id: 'cr-1187342', kind: 'company', nameAr: 'شركة المعشني للتجارة والفعاليات ش.م.م', nameEn: 'Al Mashani Trading & Events LLC', ref: '1187342' },
    { id: 'or-0417', kind: 'office', nameAr: 'مكتب آفاق ظفار للاستشارات الهندسية', nameEn: 'Afaq Dhofar Engineering Consultancy', ref: 'OR-0417' },
  ];
}

export const capacityName = (c: Capacity, isAr: boolean) => (isAr ? c.nameAr : c.nameEn);

// ── Requests ──
export type RequestStatus = 'pending' | 'review' | 'changes' | 'approved' | 'rejected';
export const STATUS_INFO: Record<RequestStatus, { ar: string; en: string; tone: 'info' | 'warn' | 'ok' | 'bad'; step: number; needsYou: boolean; closed: boolean }> = {
  pending: { ar: 'قيد المراجعة', en: 'In review', tone: 'info', step: 1, needsYou: false, closed: false },
  review: { ar: 'قيد المراجعة', en: 'In review', tone: 'info', step: 1, needsYou: false, closed: false },
  changes: { ar: 'معاد لاستكمال البيانات', en: 'Returned for more information', tone: 'warn', step: 1, needsYou: true, closed: false },
  approved: { ar: 'معتمد', en: 'Approved', tone: 'ok', step: 4, needsYou: false, closed: true },
  rejected: { ar: 'مرفوض', en: 'Rejected', tone: 'bad', step: 1, needsYou: false, closed: true },
};
const STATUS_ALIAS: Record<string, RequestStatus> = { 'in-review': 'review', request_info: 'changes' };
export const statusOf = (s: string): RequestStatus => STATUS_ALIAS[s] || (s in STATUS_INFO ? (s as RequestStatus) : 'pending');
export const REQUEST_STEPS: [string, string][] = [['تقديم الطلب', 'Submitted'], ['مراجعة المختص', 'Staff review'], ['الاعتماد', 'Approval'], ['السداد', 'Payment'], ['إصدار الوثيقة', 'Document issued']];

// ── Sample finance and notification data, per capacity kind ──
export interface Due { id: string; group: 'fines' | 'taxes' | 'fees'; ar: string; en: string; dueAr: string; dueEn: string; amount: number }
export interface Deposit { id: string; ar: string; en: string; permit: string; amount: number; certificate?: string }
export interface Notice { id: string; channel: 'sms' | 'email'; ar: string; en: string; dateAr: string; dateEn: string; unread: boolean }
export interface IssuedDocument { id: string; ar: string; en: string; categoryAr: string; categoryEn: string; icon: 'home' | 'flask' | 'store' | 'hard-hat' | 'file'; issued: string; validUntil?: string; tone: 'aqua' | 'teal' | 'purple' }

export const DUE_GROUPS: Record<Due['group'], [string, string]> = { fines: ['المخالفات', 'Fines'], taxes: ['الضرائب البلدية', 'Municipal taxes'], fees: ['الرسوم البلدية', 'Municipal fees'] };

export function sampleDues(kind: CapacityKind): Due[] {
  if (kind === 'person') return [{ id: 'F-26-38817', group: 'fines', ar: 'مخالفة وقوف – مركبة خاصة، شارع 23 يوليو', en: 'Parking fine – private vehicle, 23 July St', dueAr: '5 أكتوبر 2026', dueEn: '5 Oct 2026', amount: 10 }];
  if (kind === 'office') return [{ id: 'R-26-11871', group: 'fees', ar: 'رسوم تجديد قيد المكتب 2026/2027', en: 'Office registration renewal 2026/2027', dueAr: '31 أكتوبر 2026', dueEn: '31 Oct 2026', amount: 75 }];
  return [
    { id: 'F-26-40931', group: 'fines', ar: 'مخالفة صحية – عرض مواد منتهية الصلاحية (تفتيش 14 سبتمبر 2026)', en: 'Health fine – expired goods on display (inspection 14 Sep 2026)', dueAr: '14 أكتوبر 2026', dueEn: '14 Oct 2026', amount: 50 },
    { id: 'F-26-38817', group: 'fines', ar: 'مخالفة وقوف – مركبة تجارية 45821 ر، شارع 23 يوليو', en: 'Parking fine – commercial vehicle 45821 R, 23 July St', dueAr: '5 أكتوبر 2026', dueEn: '5 Oct 2026', amount: 10 },
    { id: 'T-26-02214', group: 'taxes', ar: 'الضريبة البلدية على تذاكر الفعاليات – أغسطس 2026', en: 'Municipal tax on event tickets – August 2026', dueAr: '15 أكتوبر 2026', dueEn: '15 Oct 2026', amount: 312.5 },
    { id: 'R-26-11570', group: 'fees', ar: 'رسوم تجديد رخصة المحل – 2026/2027', en: 'Shop licence renewal – 2026/2027', dueAr: '31 أكتوبر 2026', dueEn: '31 Oct 2026', amount: 120 },
  ];
}

export function sampleDeposits(kind: CapacityKind): Deposit[] {
  if (kind !== 'office') return [];
  return [
    { id: 'DM-2025-09812', ar: 'حفر طريق – شارع الوادي، عوقد', en: 'Road excavation – Al Wadi St, Awqad', permit: 'DM-2025-09812', amount: 1500, certificate: 'CC-2026-0331' },
    { id: 'DM-2026-04477', ar: 'رصف بلاط – سكة 3104، السعادة', en: 'Paving – Lane 3104, Al Saada', permit: 'DM-2026-04477', amount: 400 },
  ];
}

export function sampleNotices(kind: CapacityKind): Notice[] {
  const common: Notice[] = [
    { id: 'n4', channel: 'email', ar: 'صدر رقم المنزل والعنوان: منزل رقم 2418، سكة 3217، الدهاريز الجنوبية.', en: 'House number and address issued: house 2418, lane 3217, South Dahariz.', dateAr: '30 أغسطس 2026', dateEn: '30 Aug 2026', unread: false },
  ];
  if (kind === 'office') return [
    { id: 'n1', channel: 'sms', ar: 'أعيد الطلب DM-2026-18107 لاستكمال البيانات. افتح البوابة لمعرفة المطلوب.', en: 'Request DM-2026-18107 was returned for more information. Open the portal to see what is needed.', dateAr: '10 سبتمبر 2026', dateEn: '10 Sep 2026', unread: true },
    { id: 'n2', channel: 'email', ar: 'صدرت شهادة الإنجاز CC-2026-0331. يمكنك الآن طلب استرداد مبلغ التأمين.', en: 'Completion certificate CC-2026-0331 was issued. You can now ask for the deposit back.', dateAr: '10 سبتمبر 2026', dateEn: '10 Sep 2026', unread: false },
    ...common,
  ];
  if (kind === 'company') return [
    { id: 'n1', channel: 'email', ar: 'تم اعتماد طلب ترخيص اللوحة DM-2026-18342. سدد 60.000 ر.ع. لاستلام الترخيص.', en: 'Signboard licence DM-2026-18342 was approved. Pay OMR 60.000 to receive the licence.', dateAr: '21 سبتمبر 2026', dateEn: '21 Sep 2026', unread: true },
    ...common,
  ];
  return [
    { id: 'n1', channel: 'sms', ar: 'موعد الفحص البيطري للطلب DM-2026-18390 في 1 أكتوبر 2026 الساعة 07:30 في المسلخ المركزي.', en: 'Veterinary check for request DM-2026-18390 on 1 Oct 2026 at 07:30, Central Slaughterhouse.', dateAr: '27 سبتمبر 2026', dateEn: '27 Sep 2026', unread: true },
    ...common,
  ];
}

export function sampleDocuments(kind: CapacityKind): IssuedDocument[] {
  if (kind === 'person') return [{ id: 'DM-2026-17620', ar: 'رقم المنزل والعنوان', en: 'House number and address', categoryAr: 'المباني والعنونة', categoryEn: 'Buildings & addressing', icon: 'home', issued: '2026-08-30', tone: 'aqua' }];
  if (kind === 'company') return [
    { id: 'DM-2026-17488', ar: 'نتيجة الفحص المخبري', en: 'Laboratory test result', categoryAr: 'الصحة وسلامة الغذاء', categoryEn: 'Health & food safety', icon: 'flask', issued: '2026-08-19', tone: 'teal' },
    { id: 'DM-2026-16002', ar: 'رخصة المحل التجاري', en: 'Shop licence', categoryAr: 'التراخيص البلدية', categoryEn: 'Municipal licences', icon: 'store', issued: '2025-11-01', validUntil: '2026-10-31', tone: 'purple' },
  ];
  return [{ id: 'CC-2026-0331', ar: 'شهادة إنجاز أعمال الحفر', en: 'Excavation completion certificate', categoryAr: 'الطرق والحفريات', categoryEn: 'Roads & excavation', icon: 'hard-hat', issued: '2026-09-10', tone: 'teal' }];
}

export const omr = (n: number, isAr: boolean) => (isAr ? `${n.toFixed(3)} ر.ع.` : `OMR ${n.toFixed(3)}`);
