'use client';

import React from 'react';
import * as Icons from 'lucide-react';
import {
  LayoutTemplate, Heading1, Type, Info, TrendingUp, LayoutGrid, ListOrdered, Megaphone, Quote,
  Image as ImageIcon, PlayCircle, FileText, Table as TableIcon, List, Layers, User, Users, Award,
  Phone, Link2, Minus, MoveVertical, Code, Brush, Mail, MapPin, Clock, ArrowUpRight, Download,
  CheckCircle2, AlertTriangle, XCircle,
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BlockStyle, BlockType } from '@/lib/types';
import { cn } from '@/lib/utils';

/*
 * The page-block library. Each block declares its default content, the fields the builder
 * edits, and how it renders. The page builder, the public page (/p/[slug]) and the identity
 * board all use this registry, so a block looks the same everywhere.
 */

// ─── Field schema (drives the builder inspector) ───

export type FieldType = 'bi' | 'bitext' | 'text' | 'textarea' | 'number' | 'url' | 'image' | 'select' | 'switch' | 'icon' | 'list' | 'code';

export interface FieldDef {
  key: string;
  labelAr: string;
  labelEn: string;
  /** `bi` / `bitext` edit `${key}Ar` + `${key}En` side by side, with translate buttons */
  type: FieldType;
  options?: { value: string; labelAr: string; labelEn: string }[];
  itemFields?: FieldDef[];
  newItem?: () => Record<string, unknown>;
  itemLabel?: (item: any, isAr: boolean) => string;
}

export type BlockCategory = 'layout' | 'content' | 'data' | 'media' | 'engage' | 'advanced';

export const BLOCK_CATEGORIES: { id: BlockCategory; labelAr: string; labelEn: string }[] = [
  { id: 'layout', labelAr: 'تخطيط', labelEn: 'Layout' },
  { id: 'content', labelAr: 'محتوى', labelEn: 'Content' },
  { id: 'data', labelAr: 'بيانات', labelEn: 'Data' },
  { id: 'media', labelAr: 'وسائط', labelEn: 'Media' },
  { id: 'engage', labelAr: 'تفاعل وتواصل', labelEn: 'Engagement' },
  { id: 'advanced', labelAr: 'متقدم', labelEn: 'Advanced' },
];

export interface RenderProps { c: any; isAr: boolean; dark: boolean; center?: boolean }

export interface BlockDef {
  type: BlockType;
  category: BlockCategory;
  labelAr: string;
  labelEn: string;
  descAr: string;
  descEn: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  defaults: () => Record<string, any>;
  defaultStyle?: BlockStyle;
  defaultSpan?: number;
  fields: FieldDef[];
  Render: React.FC<RenderProps>;
}

// ─── Helpers ───

/** Picks the language variant, falling back to the other one */
export const tr = (obj: any, key: string, isAr: boolean): string =>
  (isAr ? obj?.[`${key}Ar`] ?? obj?.[`${key}En`] : obj?.[`${key}En`] || obj?.[`${key}Ar`]) ?? obj?.[key] ?? '';

const LucideIcon = ({ name, size = 24, className }: { name?: string; size?: number; className?: string }) => {
  const Cmp = (name && (Icons as any)[name]) || Icons.Sparkles;
  return <Cmp size={size} className={className} />;
};

const muted = (dark: boolean) => (dark ? 'text-white/75' : 'text-slate-600');
const strong = (dark: boolean) => (dark ? 'text-white' : 'text-slate-900');
const brand = (dark: boolean) => (dark ? 'text-[#03CFCB]' : 'text-secondary');

const toneOptions = [
  { value: 'info', labelAr: 'معلومة', labelEn: 'Info' },
  { value: 'success', labelAr: 'نجاح', labelEn: 'Success' },
  { value: 'warning', labelAr: 'تنبيه', labelEn: 'Warning' },
  { value: 'danger', labelAr: 'هام', labelEn: 'Important' },
];

const bi = (key: string, labelAr: string, labelEn: string, multiline = false): FieldDef =>
  ({ key, labelAr, labelEn, type: multiline ? 'bitext' : 'bi' });

// ─── Legacy normalisers (older pages stored different shapes) ───

export function normalizeStats(c: any): { value: string; labelAr: string; labelEn: string }[] {
  if (Array.isArray(c?.items)) return c.items;
  return [1, 2, 3, 4].filter(i => c?.[`v${i}`] !== undefined).map(i => ({
    value: String(c[`v${i}`]),
    labelAr: c[`t${i}Ar`] ?? c[`t${i}`] ?? '',
    labelEn: c[`t${i}En`] ?? c[`t${i}`] ?? '',
  }));
}

export function normalizeTable(c: any) {
  if (Array.isArray(c?.columns)) return { columns: c.columns, rows: c.rows || [] };
  const hAr: string[] = c?.headersAr || c?.headers || [];
  const hEn: string[] = c?.headersEn || c?.headers || [];
  const columns = hAr.map((h, i) => ({ labelAr: h, labelEn: hEn[i] ?? h }));
  const rows = (c?.rows || []).map((r: any) => {
    const row: Record<string, string> = {};
    columns.forEach((_, i) => {
      const k = `c${i + 1}`;
      row[`${k}Ar`] = r[`${k}Ar`] ?? r[k] ?? '';
      row[`${k}En`] = r[`${k}En`] ?? r[k] ?? '';
    });
    return row;
  });
  return { columns, rows };
}

const youtubeEmbed = (url: string) => {
  const m = url?.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/);
  return m ? `https://www.youtube-nocookie.com/embed/${m[1]}` : url;
};

// ─── Blocks ───

export const BLOCKS: BlockDef[] = [
  {
    type: 'hero', category: 'layout', icon: LayoutTemplate,
    labelAr: 'واجهة رئيسية', labelEn: 'Hero', descAr: 'افتتاحية الصفحة مع عنوان وأزرار', descEn: 'Page opener with title and buttons',
    defaultStyle: { background: 'dark', pattern: 'landmark', padding: 'xl', radius: 'xl', align: 'center', animate: true },
    defaults: () => ({ eyebrowAr: 'بلدية ظفار', eyebrowEn: 'Dhofar Municipality', titleAr: 'عنوان الصفحة الرئيسي', titleEn: 'Main page title', subtitleAr: 'وصف مختصر يوضح هدف الصفحة للمواطن.', subtitleEn: 'A short line telling citizens what this page is for.', ctaAr: 'ابدأ الآن', ctaEn: 'Get started', ctaUrl: '/catalog', cta2Ar: '', cta2En: '', cta2Url: '' }),
    fields: [bi('eyebrow', 'سطر علوي', 'Eyebrow'), bi('title', 'العنوان', 'Title'), bi('subtitle', 'الوصف', 'Subtitle', true), bi('cta', 'الزر الرئيسي', 'Primary button'), { key: 'ctaUrl', labelAr: 'رابط الزر الرئيسي', labelEn: 'Primary button link', type: 'url' }, bi('cta2', 'الزر الثانوي', 'Secondary button'), { key: 'cta2Url', labelAr: 'رابط الزر الثانوي', labelEn: 'Secondary button link', type: 'url' }],
    Render: ({ c, isAr, dark, center }) => (
      <div className="space-y-6 py-4">
        {tr(c, 'eyebrow', isAr) && <p className={cn('text-xs font-black uppercase tracking-[0.3em]', brand(dark))}>{tr(c, 'eyebrow', isAr)}</p>}
        <h1 className={cn('text-4xl md:text-6xl font-black tracking-tight leading-[1.1]', strong(dark))}>{tr(c, 'title', isAr)}</h1>
        {tr(c, 'subtitle', isAr) && <p className={cn('text-lg md:text-xl font-medium leading-relaxed max-w-3xl', center && 'mx-auto', muted(dark))}>{tr(c, 'subtitle', isAr)}</p>}
        <div className={cn('flex flex-wrap gap-3', center && 'justify-center')}>
          {tr(c, 'cta', isAr) && <a href={c.ctaUrl || '#'} className="inline-flex items-center gap-2 h-12 px-8 rounded-2xl font-black bg-[#03CFCB] text-slate-900 shadow-lg hover:brightness-95 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#03CFCB]">{tr(c, 'cta', isAr)}<ArrowUpRight size={18} className={cn(isAr && '-scale-x-100')} /></a>}
          {tr(c, 'cta2', isAr) && <a href={c.cta2Url || '#'} className={cn('inline-flex items-center h-12 px-8 rounded-2xl font-black border-2', dark ? 'border-white/30 text-white hover:bg-white/10' : 'border-secondary/20 text-secondary hover:bg-secondary/5')}>{tr(c, 'cta2', isAr)}</a>}
        </div>
      </div>
    ),
  },
  {
    type: 'heading', category: 'layout', icon: Heading1,
    labelAr: 'عنوان قسم', labelEn: 'Section heading', descAr: 'عنوان مع سطر توضيحي', descEn: 'Title with an optional subtitle',
    defaultStyle: { padding: 'sm', align: 'center' },
    defaults: () => ({ level: 'h2', textAr: 'عنوان قسم جديد', textEn: 'New section heading', subAr: '', subEn: '' }),
    fields: [bi('text', 'العنوان', 'Heading'), bi('sub', 'سطر توضيحي', 'Subtitle'), { key: 'level', labelAr: 'المستوى', labelEn: 'Level', type: 'select', options: [{ value: 'h1', labelAr: 'عنوان 1', labelEn: 'H1' }, { value: 'h2', labelAr: 'عنوان 2', labelEn: 'H2' }, { value: 'h3', labelAr: 'عنوان 3', labelEn: 'H3' }] }],
    Render: ({ c, isAr, dark, center }) => {
      const Tag = (['h1', 'h2', 'h3'].includes(c.level) ? c.level : 'h2') as 'h1' | 'h2' | 'h3';
      return (
        <div className="space-y-3">
          <Tag className={cn('font-black tracking-tight', brand(dark), Tag === 'h1' ? 'text-4xl md:text-6xl' : Tag === 'h2' ? 'text-3xl md:text-4xl' : 'text-2xl')}>{tr(c, 'text', isAr)}</Tag>
          <div className={cn('h-1.5 w-16 rounded-full bg-[#03CFCB]', center && 'mx-auto')} />
          {tr(c, 'sub', isAr) && <p className={cn('text-lg font-medium', muted(dark))}>{tr(c, 'sub', isAr)}</p>}
        </div>
      );
    },
  },
  {
    type: 'text', category: 'content', icon: Type,
    labelAr: 'نص', labelEn: 'Rich text', descAr: 'فقرات نصية', descEn: 'Paragraphs of text',
    defaults: () => ({ bodyAr: 'اكتب المحتوى هنا. يمكنك استخدام أسطر متعددة.', bodyEn: 'Write your content here. Multiple lines are supported.', size: 'md' }),
    fields: [bi('body', 'النص', 'Text', true), { key: 'size', labelAr: 'حجم النص', labelEn: 'Text size', type: 'select', options: [{ value: 'md', labelAr: 'عادي', labelEn: 'Normal' }, { value: 'lg', labelAr: 'كبير (مقدمة)', labelEn: 'Large (lead)' }] }],
    Render: ({ c, isAr, dark, center }) => (
      <div className={cn('whitespace-pre-wrap leading-loose font-medium max-w-4xl', center && 'mx-auto', muted(dark), c.size === 'lg' ? 'text-xl' : 'text-base md:text-lg')}>
        {tr(c, 'body', isAr)}
      </div>
    ),
  },
  {
    type: 'info', category: 'content', icon: Info,
    labelAr: 'بطاقة تنبيه', labelEn: 'Callout', descAr: 'معلومة أو تنبيه أو شرط هام', descEn: 'Info, success, warning or important note',
    defaults: () => ({ variant: 'info', titleAr: 'معلومة هامة', titleEn: 'Important information', bodyAr: 'نص توضيحي للمواطن.', bodyEn: 'An explanatory note for citizens.' }),
    fields: [{ key: 'variant', labelAr: 'النوع', labelEn: 'Type', type: 'select', options: toneOptions }, bi('title', 'العنوان', 'Title'), bi('body', 'النص', 'Text', true)],
    Render: ({ c, isAr }) => {
      const v = c.variant || 'info';
      const style = { info: 'bg-blue-50 border-blue-200 text-blue-900', success: 'bg-emerald-50 border-emerald-200 text-emerald-900', warning: 'bg-amber-50 border-amber-200 text-amber-900', danger: 'bg-red-50 border-red-200 text-red-900' }[v as 'info'] || '';
      const Icon = { info: Info, success: CheckCircle2, warning: AlertTriangle, danger: XCircle }[v as 'info'] || Info;
      return (
        <div role={v === 'danger' || v === 'warning' ? 'alert' : 'note'} className={cn('flex gap-4 p-6 rounded-2xl border-s-8 border text-start', style)}>
          <Icon size={26} className="shrink-0 mt-0.5" aria-hidden />
          <div className="space-y-1">
            {tr(c, 'title', isAr) && <p className="font-black text-lg">{tr(c, 'title', isAr)}</p>}
            <p className="font-medium leading-relaxed whitespace-pre-wrap">{tr(c, 'body', isAr)}</p>
          </div>
        </div>
      );
    },
  },
  {
    type: 'stats', category: 'data', icon: TrendingUp,
    labelAr: 'إحصائيات', labelEn: 'Statistics', descAr: 'أرقام رئيسية', descEn: 'Key figures',
    defaultStyle: { background: 'dark', pattern: 'circle', padding: 'lg', radius: 'xl', align: 'center' },
    defaults: () => ({ items: [{ value: '25,000+', labelAr: 'معاملة رقمية', labelEn: 'Digital transactions' }, { value: '98%', labelAr: 'رضا المستفيدين', labelEn: 'Satisfaction' }, { value: '24/7', labelAr: 'توفر الخدمات', labelEn: 'Availability' }] }),
    fields: [{ key: 'items', labelAr: 'الأرقام', labelEn: 'Figures', type: 'list', newItem: () => ({ value: '0', labelAr: 'مؤشر', labelEn: 'Metric' }), itemLabel: (it, isAr) => `${it.value} — ${isAr ? it.labelAr : it.labelEn}`, itemFields: [{ key: 'value', labelAr: 'القيمة', labelEn: 'Value', type: 'text' }, bi('label', 'الوصف', 'Label')] }],
    Render: ({ c, isAr, dark }) => {
      const items = normalizeStats(c);
      return (
        <dl className={cn('grid gap-6', items.length >= 4 ? 'grid-cols-2 md:grid-cols-4' : items.length === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2')}>
          {items.map((it, i) => (
            <div key={i} className="space-y-2">
              <dt className={cn('text-xs font-black uppercase tracking-widest order-2', muted(dark))}>{isAr ? it.labelAr : it.labelEn || it.labelAr}</dt>
              <dd className={cn('text-4xl md:text-5xl font-black tracking-tight', dark ? 'text-[#03CFCB]' : 'text-secondary')}>{it.value}</dd>
            </div>
          ))}
        </dl>
      );
    },
  },
  {
    type: 'features', category: 'content', icon: LayoutGrid,
    labelAr: 'شبكة بطاقات', labelEn: 'Feature cards', descAr: 'بطاقات بأيقونات وروابط', descEn: 'Icon cards with optional links',
    defaults: () => ({ columns: '3', items: [
      { icon: 'Zap', titleAr: 'خدمات فورية', titleEn: 'Instant services', bodyAr: 'أنجز معاملتك دون زيارة المبنى.', bodyEn: 'Complete your request without visiting.', url: '' },
      { icon: 'ShieldCheck', titleAr: 'دخول آمن بثقة', titleEn: 'Secure Thiqa sign-in', bodyAr: 'هوية رقمية موحدة ومحمية.', bodyEn: 'A unified, protected digital identity.', url: '' },
      { icon: 'Clock', titleAr: 'متابعة لحظية', titleEn: 'Live tracking', bodyAr: 'تابع حالة طلبك في كل مرحلة.', bodyEn: 'Track your request at every stage.', url: '' },
    ] }),
    fields: [
      { key: 'columns', labelAr: 'عدد الأعمدة', labelEn: 'Columns', type: 'select', options: [{ value: '2', labelAr: '2', labelEn: '2' }, { value: '3', labelAr: '3', labelEn: '3' }, { value: '4', labelAr: '4', labelEn: '4' }] },
      { key: 'items', labelAr: 'البطاقات', labelEn: 'Cards', type: 'list', newItem: () => ({ icon: 'Sparkles', titleAr: 'بطاقة', titleEn: 'Card', bodyAr: '', bodyEn: '', url: '' }), itemLabel: (it, isAr) => (isAr ? it.titleAr : it.titleEn), itemFields: [{ key: 'icon', labelAr: 'الأيقونة', labelEn: 'Icon', type: 'icon' }, bi('title', 'العنوان', 'Title'), bi('body', 'الوصف', 'Text', true), { key: 'url', labelAr: 'رابط (اختياري)', labelEn: 'Link (optional)', type: 'url' }] },
    ],
    Render: ({ c, isAr, dark }) => (
      <div className={cn('grid gap-5 grid-cols-1 sm:grid-cols-2', c.columns === '4' ? 'lg:grid-cols-4' : c.columns === '2' ? '' : 'lg:grid-cols-3')}>
        {(c.items || []).map((it: any, i: number) => {
          const body = (
            <>
              <div className="size-12 rounded-2xl bg-[#03CFCB]/15 text-[#008E91] flex items-center justify-center"><LucideIcon name={it.icon} /></div>
              <h3 className={cn('text-lg font-black', dark ? 'text-white' : 'text-slate-900')}>{tr(it, 'title', isAr)}</h3>
              {tr(it, 'body', isAr) && <p className={cn('text-sm font-medium leading-relaxed', muted(dark))}>{tr(it, 'body', isAr)}</p>}
            </>
          );
          const cls = cn('p-6 rounded-3xl border text-start space-y-3 transition-all', dark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm', it.url && 'hover:-translate-y-1 hover:shadow-lg focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#03CFCB] block');
          return it.url ? <a key={i} href={it.url} className={cls}>{body}</a> : <div key={i} className={cls}>{body}</div>;
        })}
      </div>
    ),
  },
  {
    type: 'steps', category: 'content', icon: ListOrdered,
    labelAr: 'خطوات', labelEn: 'Steps', descAr: 'مراحل مرقّمة لإجراء', descEn: 'Numbered procedure steps',
    defaults: () => ({ items: [
      { titleAr: 'سجّل الدخول عبر ثقة', titleEn: 'Sign in with Thiqa', bodyAr: '', bodyEn: '' },
      { titleAr: 'عبّئ نموذج الطلب', titleEn: 'Fill in the form', bodyAr: '', bodyEn: '' },
      { titleAr: 'تابع حالة الطلب', titleEn: 'Track your request', bodyAr: '', bodyEn: '' },
    ] }),
    fields: [{ key: 'items', labelAr: 'الخطوات', labelEn: 'Steps', type: 'list', newItem: () => ({ titleAr: 'خطوة', titleEn: 'Step', bodyAr: '', bodyEn: '' }), itemLabel: (it, isAr) => (isAr ? it.titleAr : it.titleEn), itemFields: [bi('title', 'العنوان', 'Title'), bi('body', 'الوصف', 'Text', true)] }],
    Render: ({ c, isAr, dark }) => (
      <ol className="grid gap-4 md:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] text-start">
        {(c.items || []).map((it: any, i: number) => (
          <li key={i} className={cn('relative p-6 rounded-3xl border', dark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm')}>
            <span className="size-10 rounded-full bg-secondary text-white font-black flex items-center justify-center mb-4" aria-hidden>{i + 1}</span>
            <p className={cn('font-black text-lg', strong(dark))}>{tr(it, 'title', isAr)}</p>
            {tr(it, 'body', isAr) && <p className={cn('text-sm font-medium mt-1 leading-relaxed', muted(dark))}>{tr(it, 'body', isAr)}</p>}
          </li>
        ))}
      </ol>
    ),
  },
  {
    type: 'cta', category: 'engage', icon: Megaphone,
    labelAr: 'دعوة لإجراء', labelEn: 'Call to action', descAr: 'شريط يدعو لإجراء محدد', descEn: 'Band prompting one action',
    defaultStyle: { background: 'gradient', pattern: 'wave', padding: 'lg', radius: 'xl' },
    defaults: () => ({ titleAr: 'هل أنت جاهز لتقديم طلبك؟', titleEn: 'Ready to apply?', bodyAr: 'قدّم طلبك إلكترونياً خلال دقائق.', bodyEn: 'Submit your request online in minutes.', buttonAr: 'قدّم الطلب', buttonEn: 'Apply now', url: '/catalog' }),
    fields: [bi('title', 'العنوان', 'Title'), bi('body', 'النص', 'Text', true), bi('button', 'نص الزر', 'Button'), { key: 'url', labelAr: 'الرابط', labelEn: 'Link', type: 'url' }],
    Render: ({ c, isAr, dark }) => (
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-start">
        <div className="space-y-2">
          <h2 className={cn('text-2xl md:text-3xl font-black', strong(dark))}>{tr(c, 'title', isAr)}</h2>
          {tr(c, 'body', isAr) && <p className={cn('font-medium', muted(dark))}>{tr(c, 'body', isAr)}</p>}
        </div>
        {tr(c, 'button', isAr) && <a href={c.url || '#'} className={cn('shrink-0 inline-flex items-center gap-2 h-12 px-8 rounded-2xl font-black shadow-lg focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2', dark ? 'bg-white text-secondary' : 'bg-secondary text-white')}>{tr(c, 'button', isAr)}<ArrowUpRight size={18} className={cn(isAr && '-scale-x-100')} /></a>}
      </div>
    ),
  },
  {
    type: 'quote', category: 'content', icon: Quote,
    labelAr: 'اقتباس', labelEn: 'Quote', descAr: 'كلمة أو شهادة', descEn: 'Statement or testimonial',
    defaults: () => ({ textAr: 'نسعى لتقديم خدمات بلدية رقمية ميسّرة لكل مواطن ومقيم.', textEn: 'We strive to make municipal services simple and digital for everyone.', authorAr: 'رئيس بلدية ظفار', authorEn: 'Chairman of Dhofar Municipality', roleAr: '', roleEn: '' }),
    fields: [bi('text', 'نص الاقتباس', 'Quote', true), bi('author', 'القائل', 'Author'), bi('role', 'الصفة', 'Role')],
    Render: ({ c, isAr, dark, center }) => (
      <figure className={cn('max-w-3xl space-y-4', center && 'mx-auto')}>
        <Quote size={36} className={cn('text-[#03CFCB]', center && 'mx-auto')} aria-hidden />
        <blockquote className={cn('text-2xl md:text-3xl font-bold leading-relaxed', strong(dark))}>{tr(c, 'text', isAr)}</blockquote>
        <figcaption className={cn('font-black', brand(dark))}>{tr(c, 'author', isAr)}{tr(c, 'role', isAr) && <span className={cn('font-medium', muted(dark))}> — {tr(c, 'role', isAr)}</span>}</figcaption>
      </figure>
    ),
  },
  {
    type: 'image', category: 'media', icon: ImageIcon,
    labelAr: 'صورة', labelEn: 'Image', descAr: 'صورة مع نص بديل وتعليق', descEn: 'Image with alt text and caption',
    defaults: () => ({ src: 'https://picsum.photos/seed/dhofar/1200/600', altAr: 'منظر من محافظة ظفار', altEn: 'A view of Dhofar Governorate', captionAr: '', captionEn: '', ratio: 'wide' }),
    fields: [{ key: 'src', labelAr: 'رابط الصورة', labelEn: 'Image URL', type: 'image' }, bi('alt', 'النص البديل (إلزامي للنفاذ)', 'Alt text (required for accessibility)'), bi('caption', 'التعليق', 'Caption'), { key: 'ratio', labelAr: 'النسبة', labelEn: 'Ratio', type: 'select', options: [{ value: 'wide', labelAr: 'عريضة 2:1', labelEn: 'Wide 2:1' }, { value: 'video', labelAr: '16:9', labelEn: '16:9' }, { value: 'square', labelAr: 'مربعة', labelEn: 'Square' }, { value: 'auto', labelAr: 'تلقائي', labelEn: 'Auto' }] }],
    Render: ({ c, isAr, dark }) => (
      <figure className="space-y-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={c.src} alt={tr(c, 'alt', isAr)} loading="lazy" className={cn('w-full rounded-3xl object-cover bg-slate-100', c.ratio === 'wide' ? 'aspect-[2/1]' : c.ratio === 'video' ? 'aspect-video' : c.ratio === 'square' ? 'aspect-square' : '')} />
        {tr(c, 'caption', isAr) && <figcaption className={cn('text-sm font-medium', muted(dark))}>{tr(c, 'caption', isAr)}</figcaption>}
      </figure>
    ),
  },
  {
    type: 'video', category: 'media', icon: PlayCircle,
    labelAr: 'فيديو', labelEn: 'Video', descAr: 'فيديو يوتيوب أو رابط مباشر', descEn: 'YouTube or direct video',
    defaults: () => ({ url: 'https://www.youtube.com/watch?v=eNcPhpw_vVo', titleAr: 'فيديو تعريفي', titleEn: 'Introduction video' }),
    fields: [{ key: 'url', labelAr: 'رابط الفيديو', labelEn: 'Video URL', type: 'url' }, bi('title', 'عنوان الفيديو (للقارئ الصوتي)', 'Title (for screen readers)')],
    Render: ({ c, isAr }) => (
      <div className="aspect-video rounded-3xl overflow-hidden bg-slate-900 shadow-xl">
        {/\.(mp4|webm)$/i.test(c.url || '')
          ? <video src={c.url} controls className="w-full h-full" aria-label={tr(c, 'title', isAr)} />
          : <iframe src={youtubeEmbed(c.url)} title={tr(c, 'title', isAr)} className="w-full h-full" allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen loading="lazy" />}
      </div>
    ),
  },
  {
    type: 'pdf', category: 'media', icon: FileText,
    labelAr: 'ملف للتحميل', labelEn: 'Download', descAr: 'رابط تحميل مستند', descEn: 'Document download link',
    defaults: () => ({ labelAr: 'تحميل الدليل', labelEn: 'Download the guide', url: '#', meta: 'PDF' }),
    fields: [bi('label', 'النص', 'Label'), { key: 'url', labelAr: 'رابط الملف', labelEn: 'File URL', type: 'url' }, { key: 'meta', labelAr: 'نوع/حجم الملف', labelEn: 'File type/size', type: 'text' }],
    Render: ({ c, isAr, dark }) => (
      <a href={c.url || '#'} target="_blank" rel="noopener noreferrer" className={cn('group inline-flex items-center gap-5 p-5 pe-8 rounded-3xl border-2 transition-all hover:border-[#03CFCB] focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#03CFCB]', dark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm')}>
        <span className="size-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors"><Download size={26} /></span>
        <span className="text-start">
          <span className={cn('block text-lg font-black', strong(dark))}>{tr(c, 'label', isAr)}</span>
          {(c.meta || 'PDF') && <span className={cn('text-xs font-bold', muted(dark))}>{c.meta || 'PDF'}</span>}
        </span>
      </a>
    ),
  },
  {
    type: 'table', category: 'data', icon: TableIcon,
    labelAr: 'جدول', labelEn: 'Table', descAr: 'جدول بيانات حتى 4 أعمدة', descEn: 'Data table, up to 4 columns',
    defaults: () => ({ columns: [{ labelAr: 'الخدمة', labelEn: 'Service' }, { labelAr: 'المدة', labelEn: 'Duration' }, { labelAr: 'الرسوم', labelEn: 'Fees' }], rows: [
      { c1Ar: 'ترخيص اللوحات الإرشادية', c1En: 'Signboard license', c2Ar: '3 أيام عمل', c2En: '3 working days', c3Ar: '10 ر.ع', c3En: '10 OMR' },
      { c1Ar: 'ترقيم المنازل', c1En: 'House numbering', c2Ar: 'يوم عمل', c2En: '1 working day', c3Ar: 'مجاناً', c3En: 'Free' },
    ] }),
    fields: [
      { key: 'columns', labelAr: 'الأعمدة (حتى 4)', labelEn: 'Columns (up to 4)', type: 'list', newItem: () => ({ labelAr: 'عمود', labelEn: 'Column' }), itemLabel: (it, isAr) => (isAr ? it.labelAr : it.labelEn), itemFields: [bi('label', 'العنوان', 'Header')] },
      { key: 'rows', labelAr: 'الصفوف', labelEn: 'Rows', type: 'list', newItem: () => ({}), itemLabel: (it, isAr) => (isAr ? it.c1Ar : it.c1En) || '—', itemFields: [bi('c1', 'العمود 1', 'Column 1'), bi('c2', 'العمود 2', 'Column 2'), bi('c3', 'العمود 3', 'Column 3'), bi('c4', 'العمود 4', 'Column 4')] },
    ],
    Render: ({ c, isAr, dark }) => {
      const { columns, rows } = normalizeTable(c);
      const cols = columns.slice(0, 4);
      return (
        <div className={cn('overflow-x-auto rounded-3xl border', dark ? 'border-white/10' : 'border-slate-100 bg-white shadow-sm')}>
          <table className="w-full text-start text-sm">
            <thead className={dark ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-500'}>
              <tr>{cols.map((col: any, i: number) => <th key={i} scope="col" className="p-4 font-black text-start">{isAr ? col.labelAr : col.labelEn || col.labelAr}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r: any, ri: number) => (
                <tr key={ri} className={cn('border-t', dark ? 'border-white/10 text-white/85' : 'border-slate-100 text-slate-700')}>
                  {cols.map((_: any, ci: number) => <td key={ci} className={cn('p-4', ci === 0 && 'font-bold')}>{tr(r, `c${ci + 1}`, isAr)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    },
  },
  {
    type: 'accordion', category: 'content', icon: List,
    labelAr: 'أسئلة شائعة', labelEn: 'FAQ / accordion', descAr: 'أسئلة قابلة للطي', descEn: 'Collapsible questions',
    defaults: () => ({ items: [{ titleAr: 'كيف أدخل إلى البوابة؟', titleEn: 'How do I sign in?', contentAr: 'عبر نظام ثقة للهوية الرقمية.', contentEn: 'With the Thiqa digital identity.' }] }),
    fields: [{ key: 'items', labelAr: 'الأسئلة', labelEn: 'Questions', type: 'list', newItem: () => ({ titleAr: 'سؤال', titleEn: 'Question', contentAr: '', contentEn: '' }), itemLabel: (it, isAr) => (isAr ? it.titleAr : it.titleEn), itemFields: [bi('title', 'السؤال', 'Question'), bi('content', 'الإجابة', 'Answer', true)] }],
    Render: ({ c, isAr, dark }) => (
      <Accordion type="single" collapsible className={cn('w-full rounded-3xl text-start', dark ? '' : 'bg-white border border-slate-100 px-6 shadow-sm')}>
        {(c.items || []).map((it: any, i: number) => (
          <AccordionItem key={i} value={`q-${i}`} className={dark ? 'border-white/10' : 'border-slate-100'}>
            <AccordionTrigger className={cn('text-lg font-black text-start hover:no-underline', dark ? 'text-white' : 'text-secondary')}>{tr(it, 'title', isAr)}</AccordionTrigger>
            <AccordionContent className={cn('text-base font-medium leading-loose whitespace-pre-wrap', muted(dark))}>{tr(it, 'content', isAr)}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    ),
  },
  {
    type: 'tabs', category: 'content', icon: Layers,
    labelAr: 'تبويبات', labelEn: 'Tabs', descAr: 'محتوى مقسّم في تبويبات', descEn: 'Content split into tabs',
    defaults: () => ({ items: [{ titleAr: 'المتطلبات', titleEn: 'Requirements', contentAr: 'البطاقة الشخصية سارية المفعول.', contentEn: 'A valid national ID card.' }, { titleAr: 'الرسوم', titleEn: 'Fees', contentAr: '10 ر.ع', contentEn: '10 OMR' }] }),
    fields: [{ key: 'items', labelAr: 'التبويبات', labelEn: 'Tabs', type: 'list', newItem: () => ({ titleAr: 'تبويب', titleEn: 'Tab', contentAr: '', contentEn: '' }), itemLabel: (it, isAr) => (isAr ? it.titleAr : it.titleEn), itemFields: [bi('title', 'العنوان', 'Title'), bi('content', 'المحتوى', 'Content', true)] }],
    Render: ({ c, isAr, dark }) => {
      const items = c.items || [];
      if (!items.length) return null;
      return (
        <Tabs defaultValue="t-0" dir={isAr ? 'rtl' : 'ltr'} className="w-full text-start">
          <TabsList className="h-auto flex-wrap rounded-2xl">{items.map((it: any, i: number) => <TabsTrigger key={i} value={`t-${i}`} className="font-black rounded-xl">{tr(it, 'title', isAr)}</TabsTrigger>)}</TabsList>
          {items.map((it: any, i: number) => <TabsContent key={i} value={`t-${i}`} className={cn('p-6 rounded-2xl whitespace-pre-wrap leading-loose font-medium', dark ? 'bg-white/5 text-white/85' : 'bg-white border border-slate-100 text-slate-700')}>{tr(it, 'content', isAr)}</TabsContent>)}
        </Tabs>
      );
    },
  },
  {
    type: 'avatar', category: 'content', icon: User,
    labelAr: 'شخصية', labelEn: 'Profile', descAr: 'صورة واسم ومنصب', descEn: 'Photo, name and title',
    defaultStyle: { align: 'center', padding: 'md' },
    defaults: () => ({ nameAr: 'معالي محافظ ظفار', nameEn: 'HE Governor of Dhofar', roleAr: '', roleEn: '', src: '' }),
    fields: [bi('name', 'الاسم', 'Name'), bi('role', 'المنصب', 'Title'), { key: 'src', labelAr: 'رابط الصورة', labelEn: 'Photo URL', type: 'image' }],
    Render: ({ c, isAr, dark }) => (
      <div className="flex flex-col items-center gap-4">
        {c.src
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={c.src} alt={tr(c, 'name', isAr)} className="size-32 rounded-full object-cover border-8 border-white shadow-xl" />
          : <div className="size-32 rounded-full bg-secondary text-white text-5xl font-black flex items-center justify-center border-8 border-white shadow-xl" aria-hidden>{tr(c, 'name', isAr).slice(0, 1)}</div>}
        <div className="text-center"><p className={cn('text-xl font-black', brand(dark))}>{tr(c, 'name', isAr)}</p>{tr(c, 'role', isAr) && <p className={cn('text-sm font-bold', muted(dark))}>{tr(c, 'role', isAr)}</p>}</div>
      </div>
    ),
  },
  {
    type: 'team', category: 'content', icon: Users,
    labelAr: 'فريق / قيادات', labelEn: 'Team', descAr: 'مجموعة أشخاص', descEn: 'Group of people',
    defaults: () => ({ items: [{ nameAr: 'اسم المسؤول', nameEn: 'Official name', roleAr: 'المنصب', roleEn: 'Title', src: '' }, { nameAr: 'اسم المسؤول', nameEn: 'Official name', roleAr: 'المنصب', roleEn: 'Title', src: '' }, { nameAr: 'اسم المسؤول', nameEn: 'Official name', roleAr: 'المنصب', roleEn: 'Title', src: '' }] }),
    fields: [{ key: 'items', labelAr: 'الأشخاص', labelEn: 'People', type: 'list', newItem: () => ({ nameAr: 'اسم', nameEn: 'Name', roleAr: '', roleEn: '', src: '' }), itemLabel: (it, isAr) => (isAr ? it.nameAr : it.nameEn), itemFields: [bi('name', 'الاسم', 'Name'), bi('role', 'المنصب', 'Title'), { key: 'src', labelAr: 'رابط الصورة', labelEn: 'Photo URL', type: 'image' }] }],
    Render: ({ c, isAr, dark }) => (
      <ul className="grid gap-6 grid-cols-2 md:grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
        {(c.items || []).map((it: any, i: number) => (
          <li key={i} className="flex flex-col items-center gap-3 text-center">
            {it.src
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={it.src} alt={tr(it, 'name', isAr)} className="size-24 rounded-full object-cover border-4 border-white shadow-lg" />
              : <div className="size-24 rounded-full bg-[#03CFCB]/20 text-[#005751] text-3xl font-black flex items-center justify-center" aria-hidden>{tr(it, 'name', isAr).slice(0, 1)}</div>}
            <p className={cn('font-black', strong(dark))}>{tr(it, 'name', isAr)}</p>
            <p className={cn('text-xs font-bold -mt-2', muted(dark))}>{tr(it, 'role', isAr)}</p>
          </li>
        ))}
      </ul>
    ),
  },
  {
    type: 'badge', category: 'content', icon: Award,
    labelAr: 'وسم', labelEn: 'Badge', descAr: 'شارة قصيرة', descEn: 'Short label',
    defaultStyle: { padding: 'sm', align: 'center' },
    defaults: () => ({ textAr: 'خدمة معتمدة', textEn: 'Certified service', tone: 'success' }),
    fields: [bi('text', 'النص', 'Text'), { key: 'tone', labelAr: 'اللون', labelEn: 'Tone', type: 'select', options: [...toneOptions, { value: 'brand', labelAr: 'الهوية', labelEn: 'Brand' }] }],
    Render: ({ c, isAr }) => {
      const tone = { info: 'bg-blue-50 text-blue-700', success: 'bg-emerald-50 text-emerald-700', warning: 'bg-amber-50 text-amber-800', danger: 'bg-red-50 text-red-700', brand: 'bg-secondary text-white' }[(c.tone || 'brand') as 'info'] || 'bg-secondary text-white';
      return <span className={cn('inline-flex items-center gap-2 px-5 py-2 rounded-full font-black text-sm', tone)}><Award size={16} aria-hidden />{tr(c, 'text', isAr)}</span>;
    },
  },
  {
    type: 'contact', category: 'engage', icon: Phone,
    labelAr: 'بطاقة تواصل', labelEn: 'Contact card', descAr: 'هاتف وبريد وعنوان وساعات عمل', descEn: 'Phone, email, address, hours',
    defaults: () => ({ phone: '1771', email: 'care@dm.gov.om', addressAr: 'صلالة، محافظة ظفار', addressEn: 'Salalah, Dhofar Governorate', hoursAr: 'الأحد – الخميس، 7:30 ص – 2:30 م', hoursEn: 'Sun – Thu, 7:30 AM – 2:30 PM' }),
    fields: [{ key: 'phone', labelAr: 'الهاتف', labelEn: 'Phone', type: 'text' }, { key: 'email', labelAr: 'البريد', labelEn: 'Email', type: 'text' }, bi('address', 'العنوان', 'Address'), bi('hours', 'ساعات العمل', 'Working hours')],
    Render: ({ c, isAr, dark }) => {
      const rows = [
        { icon: Phone, label: isAr ? 'الهاتف' : 'Phone', value: c.phone, href: c.phone && `tel:${c.phone}` },
        { icon: Mail, label: isAr ? 'البريد الإلكتروني' : 'Email', value: c.email, href: c.email && `mailto:${c.email}` },
        { icon: MapPin, label: isAr ? 'العنوان' : 'Address', value: tr(c, 'address', isAr) },
        { icon: Clock, label: isAr ? 'ساعات العمل' : 'Hours', value: tr(c, 'hours', isAr) },
      ].filter(r => r.value);
      return (
        <dl className="grid gap-4 sm:grid-cols-2 text-start">
          {rows.map(r => (
            <div key={r.label} className={cn('flex items-center gap-4 p-5 rounded-2xl border', dark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100 shadow-sm')}>
              <span className="size-11 rounded-xl bg-[#03CFCB]/15 text-[#008E91] flex items-center justify-center shrink-0"><r.icon size={20} aria-hidden /></span>
              <div><dt className={cn('text-xs font-bold', muted(dark))}>{r.label}</dt><dd className={cn('font-black', strong(dark))} dir="auto">{r.href ? <a href={r.href} className="hover:underline">{r.value}</a> : r.value}</dd></div>
            </div>
          ))}
        </dl>
      );
    },
  },
  {
    type: 'links', category: 'engage', icon: Link2,
    labelAr: 'روابط سريعة', labelEn: 'Quick links', descAr: 'قائمة روابط أو خدمات', descEn: 'List of links or services',
    defaults: () => ({ titleAr: 'خدمات ذات صلة', titleEn: 'Related services', items: [{ labelAr: 'دليل الخدمات', labelEn: 'Service catalog', url: '/catalog' }, { labelAr: 'منصة تجاوب', labelEn: 'Tajawob platform', url: 'https://tajawob.om' }] }),
    fields: [bi('title', 'العنوان', 'Title'), { key: 'items', labelAr: 'الروابط', labelEn: 'Links', type: 'list', newItem: () => ({ labelAr: 'رابط', labelEn: 'Link', url: '/' }), itemLabel: (it, isAr) => (isAr ? it.labelAr : it.labelEn), itemFields: [bi('label', 'النص', 'Label'), { key: 'url', labelAr: 'الرابط', labelEn: 'URL', type: 'url' }] }],
    Render: ({ c, isAr, dark }) => (
      <nav aria-label={tr(c, 'title', isAr) || undefined} className="text-start space-y-4">
        {tr(c, 'title', isAr) && <h3 className={cn('text-xl font-black', brand(dark))}>{tr(c, 'title', isAr)}</h3>}
        <ul className="grid gap-3 sm:grid-cols-2">
          {(c.items || []).map((it: any, i: number) => (
            <li key={i}><a href={it.url || '#'} {...(/^https?:/.test(it.url || '') ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className={cn('flex items-center justify-between gap-3 p-4 rounded-2xl border font-bold transition-colors focus-visible:outline focus-visible:outline-4 focus-visible:outline-[#03CFCB]', dark ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white border-slate-100 text-slate-700 hover:border-[#03CFCB]')}>
              {tr(it, 'label', isAr)}<ArrowUpRight size={16} className={cn('shrink-0 text-[#008E91]', isAr && '-scale-x-100')} aria-hidden />
            </a></li>
          ))}
        </ul>
      </nav>
    ),
  },
  {
    type: 'separator', category: 'layout', icon: Minus,
    labelAr: 'فاصل', labelEn: 'Divider', descAr: 'خط فاصل', descEn: 'Horizontal rule',
    defaultStyle: { padding: 'sm' },
    defaults: () => ({ style: 'line' }),
    fields: [{ key: 'style', labelAr: 'الشكل', labelEn: 'Style', type: 'select', options: [{ value: 'line', labelAr: 'خط', labelEn: 'Line' }, { value: 'brand', labelAr: 'خط الهوية', labelEn: 'Brand bar' }, { value: 'pattern', labelAr: 'نمط الأمواج', labelEn: 'Wave pattern' }] }],
    Render: ({ c }) => c.style === 'brand'
      ? <div className="h-1.5 w-24 mx-auto rounded-full bg-gradient-to-r from-[#03CFCB] to-[#470D67]" role="separator" />
      : c.style === 'pattern'
        ? <div className="h-10 dm-pattern-wave-pro opacity-40" role="separator" />
        : <hr className="border-slate-200" />,
  },
  {
    type: 'spacer', category: 'layout', icon: MoveVertical,
    labelAr: 'مسافة', labelEn: 'Spacer', descAr: 'فراغ عمودي', descEn: 'Vertical space',
    defaultStyle: { padding: 'none' },
    defaults: () => ({ size: 'md' }),
    fields: [{ key: 'size', labelAr: 'الحجم', labelEn: 'Size', type: 'select', options: [{ value: 'sm', labelAr: 'صغير', labelEn: 'Small' }, { value: 'md', labelAr: 'متوسط', labelEn: 'Medium' }, { value: 'lg', labelAr: 'كبير', labelEn: 'Large' }] }],
    Render: ({ c }) => <div aria-hidden className={c.size === 'sm' ? 'h-6' : c.size === 'lg' ? 'h-24' : 'h-12'} />,
  },
  {
    type: 'html', category: 'advanced', icon: Code,
    labelAr: 'HTML مخصص', labelEn: 'Custom HTML', descAr: 'شيفرة HTML (بدون سكربتات)', descEn: 'HTML markup (scripts removed)',
    defaults: () => ({ code: '<div class="p-8 rounded-3xl border-2 border-dashed text-center font-bold">HTML</div>' }),
    fields: [{ key: 'code', labelAr: 'الشيفرة', labelEn: 'Markup', type: 'code' }],
    // Scripts and inline event handlers are stripped before rendering
    Render: ({ c }) => <div className="text-start" dangerouslySetInnerHTML={{ __html: sanitizeHtml(typeof c === 'string' ? c : c.code || '') }} />,
  },
  {
    type: 'style', category: 'advanced', icon: Brush,
    labelAr: 'أنماط CSS للصفحة', labelEn: 'Page CSS', descAr: 'CSS يطبّق على الصفحة كاملة', descEn: 'CSS applied to the whole page',
    defaultStyle: { padding: 'none' },
    defaults: () => ({ code: '/* CSS */' }),
    fields: [{ key: 'code', labelAr: 'CSS', labelEn: 'CSS', type: 'code' }],
    Render: ({ c }) => <style dangerouslySetInnerHTML={{ __html: String(c.code || '').replace(/<\/style/gi, '') }} />,
  },
];

export function sanitizeHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son\w+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*(['"])\s*javascript:[^'"]*\2/gi, '$1="#"');
}

export const BLOCK_MAP: Record<string, BlockDef> = Object.fromEntries(BLOCKS.map(b => [b.type, b]));

/** Blocks the add-menu offers (legacy-only types stay renderable but aren't offered) */
export const ADDABLE_BLOCKS = BLOCKS;
