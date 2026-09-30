import type { StaffUser } from './types';

/*
 * "Participations & working papers" portal for staff (بوابة المشاركات وأوراق العمل التنظيمية):
 * calls from regional/international bodies, the themes matrix, the bank of approved papers,
 * and the submission → review → approval → sending workflow. Stored in the database as
 * paperCalls, paperRepository and paperSubmissions; the entries below are the starting content.
 */

export interface PaperCall {
  id: string;
  title: string;
  organizer: string;
  publication?: string;
  description: string;
  wordsMin?: number;
  wordsMax?: number;
  style?: string;
  assets: string[];
  /** Expression of interest deadline (YYYY-MM-DD) */
  eoiDeadline?: string;
  /** Final submission deadline (YYYY-MM-DD) */
  submissionDeadline: string;
  link?: string;
  themeIds: string[];
  createdAt: string;
  createdBy?: string;
}

export interface PaperTheme { id: string; title: string; details: string; departments: string[]; icon: string }

export interface RepoPaper {
  id: string;
  title: string;
  department: string;
  year: number;
  summary: string;
  referenceValue: string;
  themeIds: string[];
  tags: string[];
  link?: string;
  fullText?: string;
}

export type SubmissionStatus = 'draft' | 'review' | 'changes' | 'approved' | 'sent' | 'accepted' | 'rejected';
export interface SubmissionEvent { at: string; byId: string; byName: string; action: SubmissionStatus | 'note'; note?: string }
export interface PaperSubmission {
  id: string;
  callId: string;
  themeId: string;
  title: string;
  abstract: string;
  body: string;
  draftLink?: string;
  wordCount: number;
  authorId: string;
  authorName: string;
  department?: string;
  status: SubmissionStatus;
  history: SubmissionEvent[];
  createdAt: string;
  updatedAt: string;
  /** First time it was sent for review (for the on-time KPI) */
  submittedAt?: string;
}

export const THEMES: PaperTheme[] = [
  { id: 'strategic', icon: 'MapPinned', title: 'الموقع الاستراتيجي والديموغرافيا', details: 'الدور الإقليمي للمدينة، ديناميكيات السكان، واستخدامات الأراضي', departments: ['التخطيط العمراني', 'نظم المعلومات الجغرافية'] },
  { id: 'economy', icon: 'TrendingUp', title: 'الحالة الاقتصادية والتجارية', details: 'الحيوية التجارية، الأسواق المحلية، فرص العمل، وشبكات النقل', departments: ['التنمية الاقتصادية', 'المشاريع'] },
  { id: 'heritage', icon: 'Landmark', title: 'التراث والهوية', details: 'الأهمية الثقافية والتاريخية، النسيج المعماري، والسياحة المستدامة', departments: ['المشهد الحضري', 'التراث والسياحة'] },
  { id: 'smart', icon: 'Cpu', title: 'الحوكمة الحضرية والحلول الذكية', details: 'توظيف التكنولوجيا، إدارة البنية التحتية، والخدمات البلدية الرقمية', departments: ['تقنية المعلومات', 'الخدمات البلدية'] },
  { id: 'resilience', icon: 'Globe2', title: 'المرونة والدبلوماسية الحضرية', details: 'التكيف البيئي والمكاني، العدالة المكانية، والشراكات الدولية بين المدن', departments: ['قسم التنسيق والمتابعة', 'العلاقات الخارجية'] },
];

export const DEFAULT_CALLS: PaperCall[] = [
  {
    id: 'call_uclg_agora_2026',
    title: 'دعوة للنشر في مجلة Agora',
    organizer: 'منظمة المدن المتحدة والإدارات المحلية – فرع الشرق الأوسط وغرب آسيا (UCLG-MEWA)',
    publication: 'مجلة Agora',
    description: 'دعوة للمدن الأعضاء لتقديم مقالات تعرض تجاربها ومشاريعها الاستراتيجية بصياغة موجهة للسياسات.',
    wordsMin: 1000, wordsMax: 1500,
    style: 'صياغة موجهة للسياسات',
    assets: ['صور عالية الجودة', 'خرائط', 'إنفوغرافيك'],
    eoiDeadline: '2026-08-25',
    submissionDeadline: '2026-09-10',
    themeIds: THEMES.map(t => t.id),
    createdAt: '2026-08-01T00:00:00.000Z',
  },
];

export const DEFAULT_REPOSITORY: RepoPaper[] = [
  {
    id: 'repo_salalah_2040',
    title: 'صلالة الكبرى 2040: تنمية متوازنة بين المدينة والريف نحو مستقبل حضري مستدام',
    department: 'قسم التنسيق والمتابعة – بلدية ظفار',
    year: 2026,
    summary: 'ورقة عمل تعرض رؤية صلالة الكبرى 2040 للتنمية المتوازنة بين المدينة والريف ضمن مستقبل حضري مستدام.',
    referenceValue: 'توضح كيفية الربط بين التوجهات الوطنية (رؤية عُمان 2040) والتخطيط المكاني، والتوازن بين المدينة والريف، والحوكمة الحضرية من خلال الممارسات البلدية وموسم الخريف.',
    themeIds: ['strategic', 'smart', 'resilience'],
    tags: ['رؤية عُمان 2040', 'التخطيط المكاني', 'المدينة والريف', 'الحوكمة الحضرية', 'موسم الخريف'],
  },
];

export const STATUS: Record<SubmissionStatus, { ar: string; en: string; tone: string }> = {
  draft: { ar: 'مسودة', en: 'Draft', tone: 'bg-slate-100 text-slate-700' },
  review: { ar: 'قيد المراجعة', en: 'In review', tone: 'bg-sky-100 text-sky-800' },
  changes: { ar: 'بحاجة لتعديلات', en: 'Changes requested', tone: 'bg-amber-100 text-amber-800' },
  approved: { ar: 'معتمدة', en: 'Approved', tone: 'bg-emerald-100 text-emerald-800' },
  sent: { ar: 'أُرسلت للجهة الداعية', en: 'Sent to the organiser', tone: 'bg-violet-100 text-violet-800' },
  accepted: { ar: 'قُبلت ونُشرت', en: 'Accepted / published', tone: 'bg-emerald-600 text-white' },
  rejected: { ar: 'لم تُقبل', en: 'Not accepted', tone: 'bg-red-100 text-red-700' },
};

/** Who can review, approve and send papers, and add calls or bank entries */
export const canReview = (u: StaffUser | null) =>
  !!u && (!!u.isSuperAdmin || /التنسيق والمتابعة/.test(`${u.department || ''} ${u.jobTitle || ''}`));

/** Words in Arabic or English text */
export const countWords = (text: string) => (text.trim() ? text.trim().split(/\s+/).length : 0);

/** Days until a YYYY-MM-DD date in Oman time (negative when past) */
export function daysUntil(date: string) {
  const today = new Date(Date.now() + 4 * 3600e3).toISOString().slice(0, 10);
  return Math.round((Date.parse(date) - Date.parse(today)) / 86_400_000);
}

export function callState(c: PaperCall): 'open' | 'soon' | 'closed' {
  const d = daysUntil(c.submissionDeadline);
  return d < 0 ? 'closed' : d <= 7 ? 'soon' : 'open';
}

/** The proposal's three KPIs, from the submissions */
export function paperKpis(subs: PaperSubmission[], calls: PaperCall[]) {
  const sent = subs.filter(s => s.submittedAt);
  const authors = new Set(sent.map(s => s.authorId)).size;
  const departments = new Set(sent.map(s => s.department).filter(Boolean)).size;
  const timed = sent.map(s => {
    const call = calls.find(c => c.id === s.callId);
    return call ? Math.round((Date.parse(call.submissionDeadline) - Date.parse(s.submittedAt!.slice(0, 10))) / 86_400_000) : null;
  }).filter((d): d is number => d !== null);
  const decided = subs.filter(s => s.status === 'accepted' || s.status === 'rejected');
  return {
    submissions: sent.length,
    authors,
    departments,
    onTimeRate: timed.length ? Math.round((timed.filter(d => d >= 0).length / timed.length) * 100) : null,
    avgDaysBeforeDeadline: timed.length ? Math.round(timed.reduce((a, b) => a + b, 0) / timed.length) : null,
    acceptanceRate: decided.length ? Math.round((decided.filter(s => s.status === 'accepted').length / decided.length) * 100) : null,
    approved: subs.filter(s => ['approved', 'sent', 'accepted'].includes(s.status)).length,
  };
}

/** Writing guide for policy-oriented urban papers (regional and international standards) */
export const WRITING_GUIDE: { title: string; points: string[] }[] = [
  { title: 'الهيكل المقترح', points: [
    'عنوان واضح يعكس الفكرة الرئيسية، ثم ملخص تنفيذي في فقرة واحدة (80–120 كلمة).',
    'السياق: التحدي الحضري والأرقام الداعمة، وربطه بالتوجهات الوطنية مثل رؤية عُمان 2040.',
    'الممارسة أو المشروع: ما الذي نفذته البلدية، وكيف، ومع من.',
    'النتائج والأثر: مؤشرات قابلة للقياس قبل وبعد.',
    'الدروس المستفادة والتوصيات للسياسات، قابلة للتطبيق في مدن أخرى.',
  ] },
  { title: 'الصياغة الموجهة للسياسات', points: [
    'جمل قصيرة ومباشرة، ومصطلحات موحدة، وتجنّب اللغة الإنشائية.',
    'كل فقرة تخدم رسالة واحدة، وتنتهي باستنتاج أو توصية.',
    'اذكر المصادر والإحصاءات بدقة مع السنة والجهة.',
    'التزم بحدود الكلمات المطلوبة من الجهة الداعية (يعرضها العدّاد في نموذج التقديم).',
  ] },
  { title: 'المرفقات البصرية', points: [
    'صور بدقة عالية (300 نقطة في البوصة أو 2000 بكسل على الأقل في العرض) مع ذكر المصوّر.',
    'خرائط واضحة بمقياس ومفتاح واتجاه الشمال.',
    'إنفوغرافيك بالهوية البصرية للبلدية، وبنص قابل للقراءة.',
  ] },
  { title: 'قبل الإرسال', points: [
    'مراجعة لغوية، ومطابقة الشروط الفنية للدعوة.',
    'اعتماد القسم المختص ومراجعة قسم التنسيق والمتابعة.',
    'الإرسال قبل الموعد النهائي بثلاثة أيام عمل على الأقل.',
  ] },
];
