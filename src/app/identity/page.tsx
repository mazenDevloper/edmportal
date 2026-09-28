'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import * as Icons from 'lucide-react';
import {
  Accessibility, ArrowUpRight, BookA, Boxes, Check, CheckCircle2, Copy, Download, Grid3X3, Info, LayoutTemplate, Palette,
  PanelBottom, PanelTop, Search, Shapes, Sparkles, Type, AlertTriangle, XCircle, Ruler,
} from 'lucide-react';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useSettingsStore } from '@/lib/settings-store';
import { fetchBin } from '@/lib/jsonbin';
import { FooterVariant, HeaderVariant, MenuItem, SiteConfig } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  BRAND_COLORS, ColorToken, GLOSSARY, NEUTRAL_COLORS, PATTERNS, RADII, SPACING, STATUS_COLORS, TYPE_SCALE,
  contrastRatio, hexToHsl, wcagRating,
} from '@/lib/identity/tokens';
import { BLOCKS, BLOCK_CATEGORIES, BlockCategory } from '@/components/blocks/registry';
import { BlockView } from '@/components/blocks/block-renderer';
import { PAGE_PRESETS, makeBlock } from '@/components/blocks/page-presets';
import { SERVICE_ICON_CHOICES } from '@/components/service/service-icon';

const SECTIONS = [
  { id: 'colors', ar: 'الألوان', en: 'Colour', icon: Palette },
  { id: 'contrast', ar: 'فاحص التباين', en: 'Contrast checker', icon: Accessibility },
  { id: 'type', ar: 'الطباعة', en: 'Typography', icon: Type },
  { id: 'layout', ar: 'المسافات والزوايا', en: 'Spacing & radii', icon: Ruler },
  { id: 'patterns', ar: 'الأنماط', en: 'Patterns', icon: Grid3X3 },
  { id: 'icons', ar: 'الأيقونات', en: 'Icons', icon: Shapes },
  { id: 'components', ar: 'المكونات', en: 'Components', icon: Boxes },
  { id: 'blocks', ar: 'مكتبة الكتل', en: 'Block library', icon: LayoutTemplate },
  { id: 'templates', ar: 'قوالب الصفحات', en: 'Page templates', icon: Sparkles },
  { id: 'chrome', ar: 'الترويسة والتذييل', en: 'Header & footer', icon: PanelTop },
  { id: 'a11y', ar: 'معايير النفاذ', en: 'Accessibility', icon: Accessibility },
  { id: 'glossary', ar: 'المسرد', en: 'Glossary', icon: BookA },
] as const;

const ALL_COLORS = [...BRAND_COLORS, ...NEUTRAL_COLORS, ...STATUS_COLORS];

/** Renders live UI as a non-interactive preview (no focus, no clicks) */
function Frame({ children, scale = 1, className }: { children: React.ReactNode; scale?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.setAttribute('inert', ''); }, []);
  return (
    <div className={cn('relative overflow-hidden', className)}>
      <div ref={ref} style={scale !== 1 ? { transform: `scale(${scale})`, transformOrigin: 'top center', width: `${100 / scale}%`, marginInline: `${-(100 / scale - 100) / 2}%` } : undefined}>
        {children}
      </div>
    </div>
  );
}

export default function IdentityBoard() {
  const isAr = useSettingsStore(s => s.language) === 'ar';
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const { toast } = useToast();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [active, setActive] = useState<string>('colors');

  useEffect(() => {
    fetchBin().then(db => { setMenuItems(db.menuItems || []); setSiteConfig(db.siteConfig || null); }).catch(() => {});
  }, []);

  // Scroll-spy for the section nav
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible) setActive(visible.target.id);
    }, { rootMargin: '-20% 0px -70% 0px' });
    SECTIONS.forEach(s => { const el = document.getElementById(s.id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  const copy = async (text: string, label?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: t('تم النسخ', 'Copied'), description: label || text });
    } catch {
      toast({ variant: 'destructive', title: t('تعذر النسخ', 'Could not copy') });
    }
  };

  const download = (name: string, content: string, type: string) => {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const tokensCss = useMemo(() => [
    ':root {',
    ...ALL_COLORS.map(c => `  --dm-${c.id}: ${c.hex}; /* ${c.nameEn} */`),
    ...RADII.map(r => `  --dm-radius-${r.id}: ${r.px}px;`),
    ...SPACING.map((s, i) => `  --dm-space-${i + 1}: ${s}px;`),
    ...TYPE_SCALE.map(ty => `  --dm-font-${ty.id}: ${ty.size}px;`),
    "  --dm-font-family: 'Readex Pro', sans-serif;",
    '}',
  ].join('\n'), []);
  const tokensJson = useMemo(() => JSON.stringify({
    colors: Object.fromEntries(ALL_COLORS.map(c => [c.id, { hex: c.hex, hsl: hexToHsl(c.hex), name: { ar: c.nameAr, en: c.nameEn } }])),
    radii: Object.fromEntries(RADII.map(r => [r.id, r.px])),
    spacing: SPACING,
    type: Object.fromEntries(TYPE_SCALE.map(ty => [ty.id, { size: ty.size, weight: ty.weight, lineHeight: ty.leading }])),
    fontFamily: 'Readex Pro',
  }, null, 2), []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" dir={isAr ? 'rtl' : 'ltr'}>
      <PortalHeader menuItems={menuItems} variant="compact" />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#470D67] to-[#2a0640] text-white">
        <div aria-hidden className="absolute inset-0 dm-pattern-landmark opacity-10" />
        <div className="relative max-w-7xl mx-auto px-6 py-14 grid lg:grid-cols-[1fr_auto] gap-8 items-end">
          <div className="space-y-4">
            <p className="text-xs font-black tracking-widest uppercase text-[#03CFCB]">{t('نظام التصميم', 'Design system')}</p>
            <h1 className="text-4xl md:text-6xl font-black leading-tight">{t('لوحة الهوية المتكاملة', 'Integrated identity board')}</h1>
            <p className="max-w-2xl text-lg text-white/75 font-medium">
              {t('مرجع واحد لألوان بلدية ظفار وخطوطها وأنماطها ومكوّناتها وكتل الصفحات وقوالبها — كل ما يظهر هنا هو نفسه المستخدم في باني الصفحات والبوابة.',
                'One reference for Dhofar Municipality colours, type, patterns, components, page blocks and templates — everything here is exactly what the page builder and portal use.')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => download('dhofar-tokens.css', tokensCss, 'text/css')} className="bg-white text-[#470D67] hover:bg-white/90 font-black rounded-xl gap-2"><Download size={16} />CSS</Button>
            <Button onClick={() => download('dhofar-tokens.json', tokensJson, 'application/json')} variant="outline" className="bg-transparent border-white/40 text-white hover:bg-white/10 font-black rounded-xl gap-2"><Download size={16} />JSON</Button>
            <Button asChild className="bg-[#03CFCB] text-slate-900 hover:bg-[#03CFCB]/90 font-black rounded-xl gap-2"><Link href="/pagebuild"><LayoutTemplate size={16} />{t('باني الصفحات', 'Page builder')}</Link></Button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl w-full mx-auto px-4 md:px-6 py-10 grid lg:grid-cols-[220px_minmax(0,1fr)] gap-8">
        {/* Section nav */}
        <nav aria-label={t('أقسام الهوية', 'Identity sections')} className="lg:sticky lg:top-6 self-start">
          <ul className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
            {SECTIONS.map(s => (
              <li key={s.id} className="shrink-0">
                <a href={`#${s.id}`} aria-current={active === s.id ? 'true' : undefined}
                  className={cn('flex items-center gap-2 h-10 px-3 rounded-xl text-sm font-bold whitespace-nowrap transition-colors',
                    active === s.id ? 'bg-secondary text-white' : 'text-slate-600 hover:bg-white')}>
                  <s.icon size={16} aria-hidden />{isAr ? s.ar : s.en}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <main id="main" className="space-y-16 min-w-0">
          <ColorsSection isAr={isAr} copy={copy} />
          <ContrastSection isAr={isAr} />
          <TypeSection isAr={isAr} copy={copy} />
          <LayoutSection isAr={isAr} copy={copy} />
          <PatternsSection isAr={isAr} copy={copy} />
          <IconsSection isAr={isAr} copy={copy} />
          <ComponentsSection isAr={isAr} />
          <BlocksSection isAr={isAr} />
          <TemplatesSection isAr={isAr} />
          <ChromeSection isAr={isAr} menuItems={menuItems} siteConfig={siteConfig} />
          <A11ySection isAr={isAr} />
          <GlossarySection isAr={isAr} copy={copy} />
        </main>
      </div>

      <PortalFooter siteConfig={siteConfig} />
    </div>
  );
}

/* ------------------------------------------------------------------ */

type CopyFn = (text: string, label?: string) => void;

function SectionHead({ id, isAr, ar, en, descAr, descEn, action }: { id: string; isAr: boolean; ar: string; en: string; descAr: string; descEn: string; action?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div>
        <h2 id={`${id}-title`} className="text-3xl font-black text-slate-900">{isAr ? ar : en}</h2>
        <p className="text-slate-500 font-medium mt-1 max-w-2xl">{isAr ? descAr : descEn}</p>
      </div>
      {action}
    </header>
  );
}

function Section({ id, children }: { id: string; children: React.ReactNode }) {
  return <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-6">{children}</section>;
}

function RatingBadge({ ratio }: { ratio: number }) {
  const r = wcagRating(ratio);
  return (
    <span className={cn('inline-flex items-center gap-1 px-1.5 rounded text-[10px] font-black',
      r === 'AAA' || r === 'AA' ? 'bg-emerald-100 text-emerald-700' : r === 'AA Large' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-700')}>
      {ratio.toFixed(1)}:1 {r}
    </span>
  );
}

function Swatch({ c, isAr, copy }: { c: ColorToken; isAr: boolean; copy: CopyFn }) {
  const onWhite = contrastRatio(c.hex, '#ffffff');
  const onInk = contrastRatio(c.hex, '#0f172a');
  return (
    <div className="bg-white rounded-3xl overflow-hidden ring-1 ring-slate-200 shadow-sm">
      <button type="button" onClick={() => copy(c.hex, isAr ? c.nameAr : c.nameEn)} className="w-full h-28 p-4 flex flex-col justify-between text-start group" style={{ background: c.hex, color: c.onColor }}
        aria-label={`${isAr ? 'نسخ' : 'Copy'} ${c.hex}`}>
        <span className="text-xs font-black opacity-80">{c.cssVar || `--dm-${c.id}`}</span>
        <span className="flex items-center justify-between font-black font-mono">{c.hex}<Copy size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden /></span>
      </button>
      <div className="p-4 space-y-2">
        <p className="font-black text-slate-900">{isAr ? c.nameAr : c.nameEn}</p>
        <p className="text-xs font-medium text-slate-500 min-h-8">{isAr ? c.roleAr : c.roleEn}</p>
        <div className="flex flex-wrap gap-1.5 text-[10px] font-bold text-slate-500">
          <button type="button" onClick={() => copy(`hsl(${hexToHsl(c.hex)})`)} className="px-1.5 rounded bg-slate-100 hover:bg-slate-200 font-mono">HSL</button>
          <button type="button" onClick={() => copy(`bg-[${c.hex}]`)} className="px-1.5 rounded bg-slate-100 hover:bg-slate-200 font-mono">Tailwind</button>
          <button type="button" onClick={() => copy(`var(--dm-${c.id})`)} className="px-1.5 rounded bg-slate-100 hover:bg-slate-200 font-mono">CSS var</button>
        </div>
        <div className="flex flex-wrap gap-2 items-center text-[10px] font-bold text-slate-500 pt-1">
          <span className="flex items-center gap-1"><span className="size-3 rounded-full border bg-white" />{<RatingBadge ratio={onWhite} />}</span>
          <span className="flex items-center gap-1"><span className="size-3 rounded-full bg-slate-900" />{<RatingBadge ratio={onInk} />}</span>
        </div>
      </div>
    </div>
  );
}

function ColorsSection({ isAr, copy }: { isAr: boolean; copy: CopyFn }) {
  const groups = [
    { ar: 'ألوان العلامة', en: 'Brand', list: BRAND_COLORS },
    { ar: 'الألوان المحايدة', en: 'Neutrals', list: NEUTRAL_COLORS },
    { ar: 'ألوان الحالات', en: 'Status', list: STATUS_COLORS },
  ];
  return (
    <Section id="colors">
      <SectionHead id="colors" isAr={isAr} ar="الألوان" en="Colour" descAr="انقر على اللون لنسخ قيمته. الشارات تبيّن تباين اللون كنص على الأبيض وعلى الحبر وفق WCAG 2.2." descEn="Click a colour to copy it. Badges show its contrast as text on white and on ink, per WCAG 2.2." />
      <div className="space-y-8">
        {groups.map(g => (
          <div key={g.en}>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-3">{isAr ? g.ar : g.en}</h3>
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">{g.list.map(c => <Swatch key={c.id} c={c} isAr={isAr} copy={copy} />)}</div>
          </div>
        ))}
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-3">{isAr ? 'التدرجات' : 'Gradients'}</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {[['dm-gradient-primary', 'linear-gradient(90deg,#03CFCB,#008E91)', 'التيل الأساسي', 'Primary teal'], ['dm-gradient-royal', 'linear-gradient(90deg,#470D67,#6b149b)', 'الملكي', 'Royal']].map(([cls, css, ar, en]) => (
              <button key={cls} type="button" onClick={() => copy(cls)} className={cn('h-24 rounded-3xl p-4 flex items-end justify-between text-white font-black', cls)}>
                <span>{isAr ? ar : en}</span><span className="font-mono text-xs opacity-80">.{cls}</span>
                <span className="sr-only">{css}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

const valid = (h: string) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(h);

function ColorPicker({ label, value, onChange, id, isAr }: { label: string; value: string; onChange: (v: string) => void; id: string; isAr: boolean }) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-xs font-black text-slate-500">{label}</label>
      <div className="flex gap-2">
        <input type="color" aria-label={label} value={valid(value) && value.length === 7 ? value : '#000000'} onChange={e => onChange(e.target.value.toUpperCase())} className="h-10 w-12 rounded-lg border cursor-pointer" />
        <Input id={id} dir="ltr" value={value} onChange={e => onChange(e.target.value)} className={cn('h-10 rounded-xl font-mono', !valid(value) && 'border-red-400')} />
      </div>
      <div className="flex flex-wrap gap-1">
        {ALL_COLORS.map(c => (
          <button key={c.id} type="button" onClick={() => onChange(c.hex)} title={isAr ? c.nameAr : c.nameEn} aria-label={isAr ? c.nameAr : c.nameEn}
            className={cn('size-6 rounded-full ring-2 ring-offset-1', value.toUpperCase() === c.hex.toUpperCase() ? 'ring-slate-900' : 'ring-transparent')} style={{ background: c.hex }} />
        ))}
      </div>
    </div>
  );
}

function ContrastSection({ isAr }: { isAr: boolean }) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const [fg, setFg] = useState('#470D67');
  const [bg, setBg] = useState('#FFFFFF');
    const ratio = valid(fg) && valid(bg) ? contrastRatio(fg, bg) : 0;
  const checks = [
    { ar: 'نص عادي AA (4.5:1)', en: 'Normal text AA (4.5:1)', ok: ratio >= 4.5 },
    { ar: 'نص عادي AAA (7:1)', en: 'Normal text AAA (7:1)', ok: ratio >= 7 },
    { ar: 'نص كبير AA (3:1)', en: 'Large text AA (3:1)', ok: ratio >= 3 },
    { ar: 'نص كبير AAA (4.5:1)', en: 'Large text AAA (4.5:1)', ok: ratio >= 4.5 },
    { ar: 'عناصر الواجهة (3:1)', en: 'UI components (3:1)', ok: ratio >= 3 },
  ];
  return (
    <Section id="contrast">
      <SectionHead id="contrast" isAr={isAr} ar="فاحص التباين" en="Contrast checker" descAr="اختبر أي تركيبة ألوان قبل استخدامها في صفحة أو مكوّن." descEn="Test any colour pairing before using it in a page or component." />
      <div className="grid lg:grid-cols-[320px_1fr] gap-6 bg-white rounded-3xl ring-1 ring-slate-200 p-6">
        <div className="space-y-5">
          <ColorPicker isAr={isAr} id="fg" label={t('لون النص', 'Text colour')} value={fg} onChange={setFg} />
          <ColorPicker isAr={isAr} id="bg" label={t('لون الخلفية', 'Background')} value={bg} onChange={setBg} />
          <Button variant="outline" size="sm" onClick={() => { setFg(bg); setBg(fg); }} className="rounded-xl font-bold">{t('تبديل', 'Swap')}</Button>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl p-8 space-y-3 border" style={{ background: valid(bg) ? bg : '#fff', color: valid(fg) ? fg : '#000' }}>
            <p className="text-3xl font-black">{t('بلدية ظفار — خدمات أسرع', 'Dhofar Municipality — faster services')}</p>
            <p className="text-base font-medium">{t('هذا نص تجريبي بحجم عادي لاختبار سهولة القراءة على هذه الخلفية.', 'This is sample body text to test readability on this background.')}</p>
            <span className="inline-block px-4 py-2 rounded-xl border-2 font-black text-sm" style={{ borderColor: valid(fg) ? fg : '#000' }}>{t('زر', 'Button')}</span>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-5xl font-black tabular-nums text-slate-900" aria-live="polite">{ratio ? ratio.toFixed(2) : '—'}<span className="text-xl text-slate-400">:1</span></p>
            {ratio > 0 && <RatingBadge ratio={ratio} />}
          </div>
          <ul className="grid sm:grid-cols-2 gap-2">
            {checks.map(c => (
              <li key={c.en} className={cn('flex items-center gap-2 p-2.5 rounded-xl text-sm font-bold', c.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700')}>
                {c.ok ? <CheckCircle2 size={16} aria-hidden /> : <XCircle size={16} aria-hidden />}
                {isAr ? c.ar : c.en}<span className="sr-only">{c.ok ? t('ناجح', 'pass') : t('راسب', 'fail')}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}

function TypeSection({ isAr, copy }: { isAr: boolean; copy: CopyFn }) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const [sample, setSample] = useState('');
  return (
    <Section id="type">
      <SectionHead id="type" isAr={isAr} ar="الطباعة" en="Typography" descAr="خط Readex Pro للعربية والإنجليزية. اكتب نصك لمعاينته بكل المقاسات." descEn="Readex Pro for Arabic and English. Type your own text to preview every size."
        action={<Input value={sample} onChange={e => setSample(e.target.value)} placeholder={t('اكتب نصاً للمعاينة…', 'Type preview text…')} aria-label={t('نص المعاينة', 'Preview text')} className="h-10 w-72 rounded-xl" />} />
      <div className="bg-white rounded-3xl ring-1 ring-slate-200 divide-y">
        {TYPE_SCALE.map(ty => {
          const css = `font-size: ${ty.size}px; font-weight: ${ty.weight}; line-height: ${ty.leading};`;
          return (
            <div key={ty.id} className="grid md:grid-cols-[180px_1fr_auto] gap-4 items-center p-5">
              <div>
                <p className="font-black text-slate-900">{isAr ? ty.labelAr : ty.labelEn}</p>
                <p className="text-xs font-bold text-slate-400 font-mono">{ty.size}px · {ty.weight} · {ty.leading}</p>
                <p className="text-xs font-medium text-slate-500">{isAr ? ty.useAr : ty.useEn}</p>
              </div>
              <p className="text-slate-900 truncate" style={{ fontSize: Math.min(ty.size, 56), fontWeight: ty.weight, lineHeight: ty.leading }}>
                {sample || (ty.size >= 24 ? t('خدمات بلدية ظفار', 'Dhofar Municipality services') : t('نص توضيحي لقراءة مريحة وواضحة', 'Clear, comfortable reading text'))}
              </p>
              <Button variant="ghost" size="sm" onClick={() => copy(css)} className="rounded-xl gap-1.5 text-xs font-bold"><Copy size={13} />CSS</Button>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function LayoutSection({ isAr, copy }: { isAr: boolean; copy: CopyFn }) {
  return (
    <Section id="layout">
      <SectionHead id="layout" isAr={isAr} ar="المسافات والزوايا والظلال" en="Spacing, radii & elevation" descAr="مقياس مسافات من مضاعفات 4px، وزوايا ثابتة لكل نوع من العناصر." descEn="A 4px-based spacing scale and fixed radii per element type." />
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl ring-1 ring-slate-200 p-6 space-y-2">
          {SPACING.map((s, i) => (
            <button key={s} type="button" onClick={() => copy(`${s}px`)} className="w-full flex items-center gap-3 group">
              <span className="w-14 text-xs font-mono font-bold text-slate-500 text-end">{s}px</span>
              <span className="h-4 rounded bg-[#03CFCB]/70 group-hover:bg-[#03CFCB]" style={{ width: s * 2.5 }} />
              <span className="text-[10px] font-mono text-slate-400">--dm-space-{i + 1}</span>
            </button>
          ))}
        </div>
        <div className="bg-white rounded-3xl ring-1 ring-slate-200 p-6 grid grid-cols-2 gap-4">
          {RADII.map(r => (
            <button key={r.id} type="button" onClick={() => copy(`border-radius: ${r.px}px;`)} className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-slate-50">
              <span className="size-20 bg-[#470D67]/10 border-2 border-[#470D67]" style={{ borderRadius: Math.min(r.px, 40) }} />
              <span className="text-sm font-black text-slate-800">{isAr ? r.labelAr : r.labelEn} · {r.px === 999 ? '∞' : `${r.px}px`}</span>
              <span className="text-[11px] font-medium text-slate-500">{isAr ? r.useAr : r.useEn}</span>
            </button>
          ))}
          <div className="col-span-2 grid grid-cols-3 gap-3 pt-2">
            {[['shadow-sm', 'منخفض', 'Low'], ['shadow-xl', 'متوسط', 'Medium'], ['shadow-[0_30px_80px_rgba(0,0,0,0.2)]', 'مرتفع', 'High']].map(([cls, ar, en]) => (
              <button key={cls} type="button" onClick={() => copy(cls)} className={cn('h-16 rounded-2xl bg-white ring-1 ring-slate-100 text-xs font-black text-slate-600', cls)}>{isAr ? ar : en}</button>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

function PatternsSection({ isAr, copy }: { isAr: boolean; copy: CopyFn }) {
  return (
    <Section id="patterns">
      <SectionHead id="patterns" isAr={isAr} ar="الأنماط الزخرفية" en="Patterns" descAr="زخارف مستوحاة من معالم ظفار، متاحة كخلفية لأي كتلة في باني الصفحات." descEn="Motifs inspired by Dhofar landmarks, available as a background on any page-builder block." />
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {PATTERNS.map(p => (
          <button key={p.id} type="button" onClick={() => copy(p.className)} className="text-start bg-white rounded-3xl ring-1 ring-slate-200 overflow-hidden hover:ring-secondary">
            <div className="relative h-36 bg-[#470D67]"><div aria-hidden className={cn('absolute inset-0 opacity-30', p.className)} /></div>
            <div className="p-4">
              <p className="font-black text-slate-900">{isAr ? p.nameAr : p.nameEn}</p>
              <p className="text-xs font-medium text-slate-500">{isAr ? p.useAr : p.useEn}</p>
              <p className="text-[11px] font-mono text-slate-400 mt-1">.{p.className}</p>
            </div>
          </button>
        ))}
      </div>
    </Section>
  );
}

function IconsSection({ isAr, copy }: { isAr: boolean; copy: CopyFn }) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const [q, setQ] = useState('');
  const list = SERVICE_ICON_CHOICES.filter(n => n.toLowerCase().includes(q.toLowerCase()));
  return (
    <Section id="icons">
      <SectionHead id="icons" isAr={isAr} ar="الأيقونات" en="Icons" descAr="مكتبة Lucide بخط 2px. هذه المجموعة المعتمدة لأيقونات الخدمات؛ انقر لنسخ الاسم." descEn="Lucide at 2px stroke. This is the approved service-icon set; click to copy the name."
        action={<div className="relative"><Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden /><Input value={q} onChange={e => setQ(e.target.value)} placeholder={t('ابحث…', 'Search…')} aria-label={t('بحث الأيقونات', 'Search icons')} className="h-10 w-56 rounded-xl ps-9" dir="ltr" /></div>} />
      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
        {list.map(name => {
          const Icon = (Icons as any)[name] as React.ElementType | undefined;
          if (!Icon) return null;
          return (
            <button key={name} type="button" onClick={() => copy(name)} title={name}
              className="aspect-square bg-white rounded-2xl ring-1 ring-slate-200 flex flex-col items-center justify-center gap-1.5 hover:ring-secondary hover:text-secondary text-slate-700">
              <Icon size={24} aria-hidden />
              <span className="text-[9px] font-mono text-slate-400 truncate max-w-full px-1">{name}</span>
            </button>
          );
        })}
      </div>
      {!list.length && <p className="text-sm font-bold text-slate-400">{t('لا نتائج', 'No results')}</p>}
    </Section>
  );
}

function DemoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-3xl ring-1 ring-slate-200 p-5 space-y-4">
      <h3 className="text-sm font-black text-slate-500">{title}</h3>
      {children}
    </div>
  );
}

function ComponentsSection({ isAr }: { isAr: boolean }) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const [sw, setSw] = useState(true);
  return (
    <Section id="components">
      <SectionHead id="components" isAr={isAr} ar="المكونات الأساسية" en="Core components" descAr="المكونات الحية المستخدمة في البوابة، بحالاتها المختلفة." descEn="The live components used across the portal, with their states." />
      <div className="grid md:grid-cols-2 gap-4">
        <DemoCard title={t('الأزرار', 'Buttons')}>
          <div className="flex flex-wrap gap-2">
            <Button className="dm-gradient-primary text-slate-900 font-black rounded-xl">{t('أساسي', 'Primary')}</Button>
            <Button className="bg-secondary text-white font-black rounded-xl">{t('ثانوي', 'Secondary')}</Button>
            <Button variant="outline" className="font-black rounded-xl">{t('محدد', 'Outline')}</Button>
            <Button variant="ghost" className="font-black rounded-xl">{t('شفاف', 'Ghost')}</Button>
            <Button variant="destructive" className="font-black rounded-xl">{t('حذف', 'Delete')}</Button>
            <Button disabled className="font-black rounded-xl">{t('معطل', 'Disabled')}</Button>
          </div>
        </DemoCard>
        <DemoCard title={t('حالات الطلب', 'Request status')}>
          <div className="flex flex-wrap gap-2">
            {[['قيد الانتظار', 'Pending', 'bg-slate-100 text-slate-700'], ['قيد المراجعة', 'In review', 'bg-sky-100 text-sky-700'], ['مطلوب معلومات', 'Info requested', 'bg-amber-100 text-amber-800'], ['معتمد', 'Approved', 'bg-emerald-100 text-emerald-700'], ['مرفوض', 'Rejected', 'bg-red-100 text-red-700']].map(([ar, en, cls]) => (
              <span key={en} className={cn('px-3 py-1 rounded-full text-xs font-black', cls)}>{isAr ? ar : en}</span>
            ))}
          </div>
        </DemoCard>
        <DemoCard title={t('حقول الإدخال', 'Inputs')}>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="demo-in" className="text-xs font-black text-slate-600">{t('رقم السجل التجاري', 'CR number')}</label>
              <Input id="demo-in" placeholder="1234567" dir="ltr" className="h-11 rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="demo-err" className="text-xs font-black text-slate-600">{t('البريد الإلكتروني', 'Email')}</label>
              <Input id="demo-err" aria-invalid aria-describedby="demo-err-msg" defaultValue="name@" dir="ltr" className="h-11 rounded-xl border-red-400" />
              <p id="demo-err-msg" className="text-xs font-bold text-red-600">{t('أدخل بريداً صحيحاً.', 'Enter a valid email.')}</p>
            </div>
            <label className="flex items-center justify-between gap-3 text-sm font-bold text-slate-700">{t('إشعارات الرسائل النصية', 'SMS notifications')}<Switch checked={sw} onCheckedChange={setSw} /></label>
          </div>
        </DemoCard>
        <DemoCard title={t('التنبيهات', 'Alerts')}>
          <div className="space-y-2">
            {[[Info, 'bg-blue-50 text-blue-800 border-blue-200', 'سيتم جلب بياناتك من ثقة تلقائياً.', 'Your data will be fetched from Thiqa automatically.'],
              [AlertTriangle, 'bg-amber-50 text-amber-800 border-amber-200', 'تأكد من صلاحية السجل التجاري.', 'Make sure your CR is valid.'],
              [CheckCircle2, 'bg-emerald-50 text-emerald-800 border-emerald-200', 'تم تقديم الطلب بنجاح.', 'Request submitted successfully.']].map(([Icon, cls, ar, en], i) => {
              const I = Icon as React.ElementType;
              return <p key={i} role="note" className={cn('flex gap-2 p-3 rounded-xl border text-sm font-bold', cls as string)}><I size={16} className="shrink-0 mt-0.5" aria-hidden />{isAr ? ar as string : en as string}</p>;
            })}
          </div>
        </DemoCard>
        <DemoCard title={t('بطاقة خدمة', 'Service card')}>
          <div className="flex items-center gap-4 p-4 rounded-2xl ring-1 ring-slate-100 hover:shadow-lg transition-shadow">
            <span className="size-12 rounded-2xl bg-[#03CFCB]/15 text-[#005751] flex items-center justify-center"><Icons.Signpost size={22} aria-hidden /></span>
            <div className="flex-1 min-w-0">
              <p className="font-black text-slate-900">{t('ترخيص اللوحات الإرشادية', 'Signage licensing')}</p>
              <p className="text-xs font-bold text-slate-500">{t('3 أيام عمل · 10 ر.ع', '3 working days · OMR 10')}</p>
            </div>
            <ArrowUpRight size={18} className={cn('text-slate-400', isAr && '-scale-x-100')} aria-hidden />
          </div>
        </DemoCard>
        <DemoCard title={t('مؤشر الخطوات', 'Stepper')}>
          <ol className="flex items-center gap-2">
            {[t('الشروط', 'Conditions'), t('المستندات', 'Documents'), t('النموذج', 'Form'), t('الإرسال', 'Submit')].map((s, i) => (
              <li key={s} className="flex items-center gap-2 flex-1 min-w-0" aria-current={i === 1 ? 'step' : undefined}>
                <span className={cn('size-7 shrink-0 rounded-full flex items-center justify-center text-xs font-black', i < 1 ? 'bg-emerald-500 text-white' : i === 1 ? 'bg-secondary text-white' : 'bg-slate-100 text-slate-400')}>{i < 1 ? <Check size={14} /> : i + 1}</span>
                <span className={cn('text-xs font-black truncate', i === 1 ? 'text-slate-900' : 'text-slate-400')}>{s}</span>
              </li>
            ))}
          </ol>
        </DemoCard>
      </div>
    </Section>
  );
}

function BlocksSection({ isAr }: { isAr: boolean }) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const [cat, setCat] = useState<BlockCategory | 'all'>('all');
  const list = BLOCKS.filter(b => cat === 'all' || b.category === cat);
  // Stable sample content per block so previews don't regenerate ids on every render
  const samples = useMemo(() => Object.fromEntries(BLOCKS.map(b => [b.type, { ...makeBlock(b.type), id: `sample-${b.type}` }])), []);
  return (
    <Section id="blocks">
      <SectionHead id="blocks" isAr={isAr} ar="مكتبة الكتل" en="Block library" descAr={`${BLOCKS.length} كتلة جاهزة بألوان وخطوط الهوية. افتح أي كتلة مباشرة في باني الصفحات.`} descEn={`${BLOCKS.length} ready blocks in the identity's colours and type. Open any block straight in the page builder.`} />
      <div role="tablist" aria-label={t('تصنيف الكتل', 'Block category')} className="flex flex-wrap gap-1.5 mb-5">
        {[{ id: 'all' as const, labelAr: 'الكل', labelEn: 'All' }, ...BLOCK_CATEGORIES].map(c => (
          <button key={c.id} type="button" role="tab" aria-selected={cat === c.id} onClick={() => setCat(c.id)}
            className={cn('h-9 px-4 rounded-full text-sm font-black', cat === c.id ? 'bg-slate-900 text-white' : 'bg-white ring-1 ring-slate-200 text-slate-600 hover:ring-secondary')}>
            {isAr ? c.labelAr : c.labelEn}
          </button>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {list.map(b => (
          <article key={b.type} className="bg-white rounded-3xl ring-1 ring-slate-200 overflow-hidden flex flex-col">
            <Frame scale={0.5} className="h-56 bg-slate-50 border-b">
              <div className="p-6"><BlockView block={samples[b.type]} isAr={isAr} animate={false} /></div>
            </Frame>
            <div className="p-4 flex items-start gap-3">
              <span className="size-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0"><b.icon size={18} /></span>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-slate-900">{isAr ? b.labelAr : b.labelEn}</h3>
                <p className="text-xs font-medium text-slate-500">{isAr ? b.descAr : b.descEn}</p>
              </div>
              <Button asChild size="sm" variant="outline" className="rounded-xl font-bold gap-1 shrink-0">
                <Link href={`/pagebuild?block=${b.type}`}>{t('استخدم', 'Use')}<ArrowUpRight size={14} className={cn(isAr && '-scale-x-100')} /></Link>
              </Button>
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}

function TemplatesSection({ isAr }: { isAr: boolean }) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const presets = PAGE_PRESETS.filter(p => p.id !== 'blank');
  const built = useMemo(() => Object.fromEntries(presets.map(p => [p.id, p.build().map((b, i) => ({ ...b, id: `tpl-${p.id}-${i}` }))])), []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Section id="templates">
      <SectionHead id="templates" isAr={isAr} ar="قوالب الصفحات" en="Page templates" descAr="صفحات كاملة مبنية من الكتل؛ ابدأ منها في باني الصفحات ثم عدّل المحتوى." descEn="Complete pages built from blocks; start from one in the page builder and edit the content." />
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {presets.map(p => {
          const Icon = (Icons as any)[p.icon] || Icons.File;
          return (
            <article key={p.id} className="bg-white rounded-3xl ring-1 ring-slate-200 overflow-hidden flex flex-col">
              <Frame scale={0.3} className="h-60 bg-slate-50 border-b">
                <div className="p-8 space-y-6">{built[p.id].map(b => <BlockView key={b.id} block={b} isAr={isAr} animate={false} />)}</div>
              </Frame>
              <div className="p-4 flex items-start gap-3 flex-1">
                <span className="size-10 rounded-xl bg-[#03CFCB]/15 text-[#005751] flex items-center justify-center shrink-0"><Icon size={18} /></span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-slate-900">{isAr ? p.labelAr : p.labelEn}</h3>
                  <p className="text-xs font-medium text-slate-500">{isAr ? p.descAr : p.descEn}</p>
                  <p className="text-[11px] font-bold text-slate-400 mt-1">{t(`${built[p.id].length} كتل`, `${built[p.id].length} blocks`)}</p>
                </div>
              </div>
              <div className="px-4 pb-4">
                <Button asChild className="w-full rounded-xl font-black bg-secondary hover:bg-secondary/90 text-white gap-1.5">
                  <Link href={`/pagebuild?preset=${p.id}`}>{t('ابدأ صفحة من هذا القالب', 'Start a page from this template')}</Link>
                </Button>
              </div>
            </article>
          );
        })}
      </div>
    </Section>
  );
}

function VariantOptions<T extends string>({ label, value, onChange, list, isAr }: { label: string; value: T; onChange: (v: T) => void; list: { id: T; ar: string; en: string; descAr: string; descEn: string }[]; isAr: boolean }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {list.map(o => (
        <button key={o.id} type="button" role="radio" aria-checked={value === o.id} onClick={() => onChange(o.id)}
          className={cn('text-start px-4 py-2 rounded-2xl border-2', value === o.id ? 'border-secondary bg-secondary/5' : 'border-slate-200 bg-white hover:border-secondary/40')}>
          <span className="block text-sm font-black text-slate-900">{isAr ? o.ar : o.en}</span>
          <span className="block text-[11px] font-medium text-slate-500">{isAr ? o.descAr : o.descEn}</span>
        </button>
      ))}
    </div>
  );
}

function ChromeSection({ isAr, menuItems, siteConfig }: { isAr: boolean; menuItems: MenuItem[]; siteConfig: SiteConfig | null }) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const [header, setHeader] = useState<HeaderVariant>('full');
  const [footer, setFooter] = useState<FooterVariant>('full');
  const headers: { id: HeaderVariant; ar: string; en: string; descAr: string; descEn: string }[] = [
    { id: 'full', ar: 'كاملة', en: 'Full', descAr: 'شريط الأخبار + الشريط العلوي + القائمة', descEn: 'Ticker + top bar + navigation' },
    { id: 'compact', ar: 'مختصرة', en: 'Compact', descAr: 'القائمة فقط', descEn: 'Navigation only' },
    { id: 'minimal', ar: 'بسيطة', en: 'Minimal', descAr: 'الشعار واللغة', descEn: 'Logo and language' },
    { id: 'none', ar: 'بدون', en: 'None', descAr: 'لصفحات الحملات والهبوط', descEn: 'For campaign / landing pages' },
  ];
  const footers: { id: FooterVariant; ar: string; en: string; descAr: string; descEn: string }[] = [
    { id: 'full', ar: 'كامل', en: 'Full', descAr: 'أربعة أعمدة روابط', descEn: 'Four link columns' },
    { id: 'compact', ar: 'مختصر', en: 'Compact', descAr: 'سطر واحد', descEn: 'Single row' },
    { id: 'none', ar: 'بدون', en: 'None', descAr: 'مخفي', descEn: 'Hidden' },
  ];
  return (
    <Section id="chrome">
      <SectionHead id="chrome" isAr={isAr} ar="الترويسة والتذييل" en="Header & footer" descAr="أشكال الترويسة والتذييل المتاحة لكل صفحة في باني الصفحات، أو كإعداد افتراضي للموقع." descEn="Header and footer variants available per page in the page builder, or as the site default." />
      <div className="space-y-6">
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 font-black text-slate-700"><PanelTop size={18} className="text-secondary" />{t('الترويسة', 'Header')}</h3>
          <VariantOptions isAr={isAr} label={t('شكل الترويسة', 'Header variant')} value={header} onChange={setHeader} list={headers} />
          <Frame className="rounded-3xl ring-1 ring-slate-200 bg-white min-h-16">
            {header === 'none' ? <p className="p-6 text-center text-sm font-bold text-slate-400">{t('لا توجد ترويسة', 'No header')}</p>
              : <PortalHeader key={header} menuItems={menuItems} variant={header} sticky={false} />}
          </Frame>
        </div>
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 font-black text-slate-700"><PanelBottom size={18} className="text-secondary" />{t('التذييل', 'Footer')}</h3>
          <VariantOptions isAr={isAr} label={t('شكل التذييل', 'Footer variant')} value={footer} onChange={setFooter} list={footers} />
          <Frame scale={0.6} className="rounded-3xl ring-1 ring-slate-200 bg-white min-h-16">
            {footer === 'none' ? <p className="p-6 text-center text-sm font-bold text-slate-400">{t('لا يوجد تذييل', 'No footer')}</p>
              : <PortalFooter key={footer} siteConfig={siteConfig} variant={footer} />}
          </Frame>
        </div>
      </div>
    </Section>
  );
}

function A11ySection({ isAr }: { isAr: boolean }) {
  const rules = [
    ['تباين 4.5:1 للنص العادي و3:1 للنص الكبير وعناصر الواجهة.', 'Contrast of 4.5:1 for body text and 3:1 for large text and UI.'],
    ['كل عنصر تفاعلي يصل إليه لوحة المفاتيح ومؤشر التركيز ظاهر دائماً.', 'Every interactive element is keyboard reachable with a visible focus ring.'],
    ['أهداف اللمس لا تقل عن 44×44 بكسل.', 'Touch targets are at least 44×44px.'],
    ['كل صورة لها نص بديل، والزخارف مخفية عن قارئات الشاشة.', 'Every image has alt text; decoration is hidden from screen readers.'],
    ['كل حقل له تسمية مرئية، والأخطاء تُعلن مع الحقل المرتبط بها.', 'Every field has a visible label; errors are announced with their field.'],
    ['اتجاه الصفحة ولغتها (dir/lang) صحيحان لكل نص عربي وإنجليزي.', 'Correct dir/lang on every Arabic and English text.'],
    ['لا حركة تلقائية تتجاوز 5 ثوانٍ دون زر إيقاف، مع احترام تقليل الحركة.', 'No auto-motion over 5s without a pause, and reduced motion is honoured.'],
    ['النص يبقى مقروءاً عند تكبيره 200% وتباعد الأسطر 1.5.', 'Text stays usable at 200% zoom and 1.5 line spacing.'],
  ];
  return (
    <Section id="a11y">
      <SectionHead id="a11y" isAr={isAr} ar="معايير النفاذ الرقمي" en="Accessibility standards" descAr="قواعد WCAG 2.2 AA الملزمة لكل صفحة ومكوّن. جرّب أدوات النفاذ من الزر العائم أو Alt+A." descEn="The WCAG 2.2 AA rules every page and component must meet. Try the accessibility tools from the floating button or Alt+A." />
      <ul className="grid md:grid-cols-2 gap-3">
        {rules.map(([ar, en]) => (
          <li key={en} className="flex gap-3 p-4 bg-white rounded-2xl ring-1 ring-slate-200 text-sm font-bold text-slate-700">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" aria-hidden />{isAr ? ar : en}
          </li>
        ))}
      </ul>
    </Section>
  );
}

function GlossarySection({ isAr, copy }: { isAr: boolean; copy: CopyFn }) {
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const [q, setQ] = useState('');
  const list = GLOSSARY.filter(g => !q || g.ar.includes(q) || g.en.toLowerCase().includes(q.toLowerCase()));
  return (
    <Section id="glossary">
      <SectionHead id="glossary" isAr={isAr} ar="المسرد الثنائي" en="Bilingual glossary" descAr="المصطلحات المعتمدة التي تلتزم بها الترجمة الآلية في كل أدوات البناء." descEn="Approved terms the machine translator follows in every builder."
        action={<div className="relative"><Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden /><Input value={q} onChange={e => setQ(e.target.value)} placeholder={t('ابحث عن مصطلح…', 'Search terms…')} aria-label={t('بحث المسرد', 'Search glossary')} className="h-10 w-60 rounded-xl ps-9" /></div>} />
      <div className="bg-white rounded-3xl ring-1 ring-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs font-black text-slate-500">
            <tr><th scope="col" className="p-3 text-start">العربية</th><th scope="col" className="p-3 text-start">English</th><th className="p-3 w-12"><span className="sr-only">{t('نسخ', 'Copy')}</span></th></tr>
          </thead>
          <tbody className="divide-y">
            {list.map(g => (
              <tr key={g.ar}>
                <td className="p-3 font-black text-slate-900" lang="ar" dir="rtl">{g.ar}</td>
                <td className="p-3 font-medium text-slate-700" lang="en" dir="ltr">{g.en}</td>
                <td className="p-3"><button type="button" onClick={() => copy(`${g.ar} — ${g.en}`)} aria-label={`${t('نسخ', 'Copy')} ${g.ar}`} className="size-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"><Copy size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}
