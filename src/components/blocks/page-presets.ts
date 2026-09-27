import { BlockStyle, BlockType, BuilderComponent, PageTemplateSettings } from '@/lib/types';
import { BLOCK_MAP } from './registry';

/*
 * Ready-made pages composed from identity blocks. Picking one in the page builder
 * creates the page skeleton with bilingual placeholder copy the author then edits.
 */

let seq = 0;
const uid = () => `c_${Date.now().toString(36)}_${(seq++).toString(36)}`;

/** New block of a type, with its default content, optionally overridden */
export function makeBlock(type: BlockType, content?: Record<string, any>, extra?: { style?: BlockStyle; gridSpan?: number }): BuilderComponent {
  const def = BLOCK_MAP[type];
  return {
    id: uid(),
    type,
    content: { ...(def?.defaults() || {}), ...(content || {}) },
    gridSpan: extra?.gridSpan ?? def?.defaultSpan ?? 12,
    gridHeight: 'auto',
    ...(extra?.style ? { style: extra.style } : {}),
  };
}

export interface PagePreset {
  id: string;
  labelAr: string;
  labelEn: string;
  descAr: string;
  descEn: string;
  icon: string;
  template?: PageTemplateSettings;
  build: () => BuilderComponent[];
}

export const PAGE_PRESETS: PagePreset[] = [
  {
    id: 'blank', icon: 'File', labelAr: 'صفحة فارغة', labelEn: 'Blank page', descAr: 'ابدأ من الصفر', descEn: 'Start from scratch',
    build: () => [],
  },
  {
    id: 'service', icon: 'FileCheck', labelAr: 'صفحة خدمة', labelEn: 'Service page',
    descAr: 'تعريف الخدمة والمتطلبات والخطوات والرسوم', descEn: 'Service intro, requirements, steps and fees',
    template: { titleBand: 'none' },
    build: () => [
      makeBlock('hero', { titleAr: 'اسم الخدمة', titleEn: 'Service name', subtitleAr: 'وصف مختصر لما تقدمه الخدمة ومن يستفيد منها.', subtitleEn: 'What the service does and who it is for.', ctaAr: 'قدّم الطلب', ctaEn: 'Apply now', ctaUrl: '/catalog' }),
      makeBlock('info', { variant: 'warning', titleAr: 'شروط الاستفادة', titleEn: 'Eligibility', bodyAr: 'يجب أن يكون مقدم الطلب مصادقاً عليه عبر ثقة.', bodyEn: 'The applicant must be authenticated with Thiqa.' }),
      makeBlock('heading', { textAr: 'خطوات التقديم', textEn: 'How to apply' }),
      makeBlock('steps'),
      makeBlock('tabs', { items: [
        { titleAr: 'المستندات المطلوبة', titleEn: 'Required documents', contentAr: '• البطاقة الشخصية\n• السجل التجاري (إن وجد)', contentEn: '• National ID card\n• Commercial Registration (if any)' },
        { titleAr: 'الرسوم والمدة', titleEn: 'Fees & duration', contentAr: 'الرسوم: 10 ر.ع\nالمدة: 3 أيام عمل', contentEn: 'Fees: 10 OMR\nDuration: 3 working days' },
      ] }),
      makeBlock('accordion'),
      makeBlock('cta'),
    ],
  },
  {
    id: 'about', icon: 'Landmark', labelAr: 'عن البلدية', labelEn: 'About us',
    descAr: 'الرؤية والأرقام والقيادات', descEn: 'Vision, figures and leadership',
    build: () => [
      makeBlock('hero', { titleAr: 'عن بلدية ظفار', titleEn: 'About Dhofar Municipality', subtitleAr: 'نعمل على تنمية محافظة ظفار وتقديم خدمات بلدية رقمية متكاملة.', subtitleEn: 'Developing Dhofar Governorate through integrated digital municipal services.', ctaAr: '', ctaEn: '' }, { style: { background: 'gradient', pattern: 'landmark', padding: 'xl', radius: 'xl', align: 'center' } }),
      makeBlock('text', { size: 'lg', bodyAr: 'نص تعريفي بالبلدية ودورها وأهدافها.', bodyEn: 'An introduction to the municipality, its role and goals.' }, { style: { align: 'center', padding: 'lg' } }),
      makeBlock('stats'),
      makeBlock('quote', {}, { style: { background: 'soft', padding: 'lg', radius: 'xl', align: 'center', pattern: 'wave' } }),
      makeBlock('heading', { textAr: 'القيادات', textEn: 'Leadership' }),
      makeBlock('team'),
    ],
  },
  {
    id: 'faq', icon: 'HelpCircle', labelAr: 'أسئلة شائعة', labelEn: 'FAQ',
    descAr: 'أسئلة مصنفة ودعم', descEn: 'Grouped questions and support',
    template: { width: 'narrow' },
    build: () => [
      makeBlock('heading', { level: 'h1', textAr: 'الأسئلة الشائعة', textEn: 'Frequently asked questions', subAr: 'إجابات سريعة لأكثر الأسئلة تكراراً.', subEn: 'Quick answers to the most common questions.' }),
      makeBlock('accordion', { items: [
        { titleAr: 'كيف أسجّل الدخول؟', titleEn: 'How do I sign in?', contentAr: 'عبر نظام ثقة للهوية الرقمية.', contentEn: 'Using the Thiqa digital identity.' },
        { titleAr: 'كيف أتابع طلبي؟', titleEn: 'How do I track my request?', contentAr: 'من لوحة المستخدم، وستصلك إشعارات في كل مرحلة.', contentEn: 'From your dashboard; you get notified at every stage.' },
        { titleAr: 'كيف أدفع الرسوم؟', titleEn: 'How do I pay fees?', contentAr: 'إلكترونياً عبر بوابة الدفع.', contentEn: 'Online through the payment gateway.' },
      ] }),
      makeBlock('contact', {}, { style: { background: 'soft', padding: 'lg', radius: 'xl' } }),
    ],
  },
  {
    id: 'policy', icon: 'ScrollText', labelAr: 'سياسة / أحكام', labelEn: 'Policy / terms',
    descAr: 'نص قانوني طويل منظم', descEn: 'Structured long legal text',
    template: { width: 'narrow', titleBand: 'simple' },
    build: () => [
      makeBlock('info', { variant: 'info', titleAr: 'آخر تحديث', titleEn: 'Last updated', bodyAr: 'يُرجى قراءة هذه السياسة بعناية.', bodyEn: 'Please read this policy carefully.' }),
      makeBlock('heading', { level: 'h3', textAr: 'أولاً: نطاق السياسة', textEn: '1. Scope' }, { style: { align: 'start', padding: 'sm' } }),
      makeBlock('text'),
      makeBlock('heading', { level: 'h3', textAr: 'ثانياً: حماية البيانات', textEn: '2. Data protection' }, { style: { align: 'start', padding: 'sm' } }),
      makeBlock('text'),
      makeBlock('pdf', { labelAr: 'تحميل السياسة', labelEn: 'Download the policy' }),
    ],
  },
  {
    id: 'campaign', icon: 'Megaphone', labelAr: 'حملة / مبادرة', labelEn: 'Campaign',
    descAr: 'مبادرة موسمية بفيديو ودعوة للمشاركة', descEn: 'Seasonal initiative with video and CTA',
    template: { titleBand: 'none' },
    build: () => [
      makeBlock('hero', { eyebrowAr: 'موسم الخريف', eyebrowEn: 'Khareef season', titleAr: 'اسم المبادرة', titleEn: 'Initiative name', subtitleAr: 'دعوة للمشاركة في المبادرة.', subtitleEn: 'An invitation to take part.', ctaAr: 'شارك الآن', ctaEn: 'Join now' }, { style: { background: 'gradient', pattern: 'tree', padding: 'xl', radius: 'xl', align: 'center', animate: true } }),
      makeBlock('features'),
      makeBlock('video', {}, { gridSpan: 8 }),
      makeBlock('stats', { items: [{ value: '120', labelAr: 'مشارك', labelEn: 'Participants' }, { value: '14', labelAr: 'يوم', labelEn: 'Days' }] }, { gridSpan: 4, style: { background: 'dark', padding: 'lg', radius: 'xl', align: 'center' } }),
      makeBlock('cta'),
    ],
  },
  {
    id: 'contact', icon: 'Phone', labelAr: 'تواصل معنا', labelEn: 'Contact us',
    descAr: 'قنوات التواصل وروابط الدعم', descEn: 'Contact channels and support links',
    template: { width: 'narrow' },
    build: () => [
      makeBlock('heading', { level: 'h1', textAr: 'تواصل معنا', textEn: 'Contact us', subAr: 'يسعدنا تواصلك عبر القنوات التالية.', subEn: 'Reach us through any of these channels.' }),
      makeBlock('contact'),
      makeBlock('links', { titleAr: 'قنوات أخرى', titleEn: 'Other channels', items: [{ labelAr: 'منصة تجاوب للمقترحات والشكاوى', labelEn: 'Tajawob suggestions & complaints', url: 'https://tajawob.om' }, { labelAr: 'الأسئلة الشائعة', labelEn: 'FAQ', url: '/p/faqs' }] }),
    ],
  },
];
