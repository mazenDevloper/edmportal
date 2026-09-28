'use client';

/*
 * Public, compact identity guide for graphic designers and partners.
 * The full design-system board (components, blocks, templates…) is admin-only at /identity/board.
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Copy, Download, ExternalLink, LayoutDashboard, Palette, Type as TypeIcon } from 'lucide-react';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { useToast } from '@/hooks/use-toast';
import { useSettingsStore } from '@/lib/settings-store';
import { fetchBin } from '@/lib/jsonbin';
import { MenuItem, SiteConfig } from '@/lib/types';
import { BRAND_COLORS, ColorToken, NEUTRAL_COLORS, PATTERNS, RADII, STATUS_COLORS, TYPE_SCALE, contrastRatio, wcagRating } from '@/lib/identity/tokens';
import { LogoSection, VoiceSection } from '@/components/identity/extra-sections';
import { useIsAdmin } from '@/lib/admin-session';
import { cn } from '@/lib/utils';

const CSS_URL = '/brand/dhofar-identity.css';

const rgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const cmyk = (hex: string) => {
  const [r, g, b] = rgb(hex).map(v => v / 255);
  const k = 1 - Math.max(r, g, b);
  if (k === 1) return [0, 0, 0, 100];
  return [(1 - r - k) / (1 - k), (1 - g - k) / (1 - k), (1 - b - k) / (1 - k), k].map(v => Math.round(v * 100));
};

const NAV = [
  { id: 'logo', ar: 'الشعار', en: 'Logo' },
  { id: 'colors', ar: 'الألوان', en: 'Colour' },
  { id: 'type', ar: 'الخط', en: 'Typeface' },
  { id: 'patterns', ar: 'الأنماط', en: 'Patterns' },
  { id: 'css', ar: 'ملف CSS', en: 'CSS file' },
  { id: 'voice', ar: 'أسلوب الكتابة', en: 'Voice & tone' },
];

export default function IdentityGuide() {
  const isAr = useSettingsStore(s => s.language) === 'ar';
  const t = (ar: string, en: string) => (isAr ? ar : en);
  const { toast } = useToast();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [mounted, setMounted] = useState(false);
  const isAdmin = useIsAdmin() && mounted;

  useEffect(() => {
    setMounted(true);
    fetchBin().then(db => { setMenuItems(db.menuItems || []); setSiteConfig(db.siteConfig || null); }).catch(() => {});
  }, []);
  useEffect(() => { document.title = `${t('دليل الهوية البصرية', 'Visual identity guide')} | ${t('بلدية ظفار', 'Dhofar Municipality')}`; }, [isAr]); // eslint-disable-line react-hooks/exhaustive-deps

  const copy = async (text: string, label?: string) => {
    try { await navigator.clipboard.writeText(text); toast({ title: t('تم النسخ', 'Copied'), description: label || text }); }
    catch { toast({ variant: 'destructive', title: t('تعذر النسخ', 'Could not copy') }); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" dir={isAr ? 'rtl' : 'ltr'} lang={isAr ? 'ar' : 'en'}>
      <PortalHeader menuItems={menuItems} variant="compact" />

      <section className="relative overflow-hidden bg-gradient-to-br from-[#470D67] to-[#2a0640] text-white">
        <div aria-hidden className="absolute inset-0 dm-pattern-landmark opacity-10" />
        <div className="relative max-w-6xl mx-auto px-4 md:px-6 py-12 md:py-16 space-y-6">
          <p className="text-xs font-black tracking-widest uppercase text-[#03CFCB]">{t('للمصممين والشركاء', 'For designers & partners')}</p>
          <h1 className="text-4xl md:text-6xl font-black leading-tight">{t('دليل الهوية البصرية', 'Visual identity guide')}</h1>
          <p className="max-w-2xl text-lg text-white/80 font-medium">
            {t('الأساسيات التي تحتاجها لتصميم أي مادة باسم بلدية ظفار: الشعار، والألوان، والخط، والأنماط الزخرفية، مع ملف CSS جاهز للاستخدام.',
              'Everything you need to design for Dhofar Municipality: logo, colours, typeface and patterns — plus a ready-to-use CSS file.')}
          </p>
          <div className="flex flex-wrap gap-2">
            <a href={CSS_URL} download="dhofar-identity.css" className="inline-flex items-center gap-2 h-12 px-6 rounded-2xl bg-[#03CFCB] text-slate-900 font-black hover:bg-[#03CFCB]/90 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-white">
              <Download size={18} aria-hidden />{t('تنزيل ملف CSS', 'Download CSS file')}
            </a>
            <a href={CSS_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 h-12 px-5 rounded-2xl ring-2 ring-white/40 font-black hover:bg-white/10">
              <ExternalLink size={16} aria-hidden />{t('عرض الملف', 'View file')}
            </a>
            {isAdmin && (
              <Link href="/identity/board" className="inline-flex items-center gap-2 h-12 px-5 rounded-2xl bg-white text-[#470D67] font-black hover:bg-white/90">
                <LayoutDashboard size={16} aria-hidden />{t('لوحة الهوية الكاملة (للإدارة)', 'Full identity board (admin)')}
              </Link>
            )}
          </div>
        </div>
      </section>

      <nav aria-label={t('أقسام الدليل', 'Guide sections')} className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b">
        <ul className="max-w-6xl mx-auto px-4 md:px-6 flex gap-1 overflow-x-auto">
          {NAV.map(n => (
            <li key={n.id} className="shrink-0"><a href={`#${n.id}`} className="block px-4 py-3 text-sm font-black text-slate-600 hover:text-[#005751] border-b-2 border-transparent hover:border-[#03CFCB]">{isAr ? n.ar : n.en}</a></li>
          ))}
        </ul>
      </nav>

      <main id="main" className="flex-1 max-w-6xl w-full mx-auto px-4 md:px-6 py-12 space-y-16">
        <LogoSection isAr={isAr} copy={copy} />

        <section id="colors" aria-labelledby="colors-title" className="scroll-mt-20">
          <h2 id="colors-title" className="text-3xl font-black text-slate-900">{t('الألوان', 'Colour')}</h2>
          <p className="text-slate-500 font-medium mt-1 mb-6">{t('قيم الألوان للشاشة (HEX / RGB) وللطباعة (CMYK تقريبية). انقر على أي قيمة لنسخها.', 'Screen (HEX / RGB) and approximate print (CMYK) values. Click any value to copy it.')}</p>
          {[
            { ar: 'ألوان العلامة', en: 'Brand', list: BRAND_COLORS },
            { ar: 'الألوان المحايدة', en: 'Neutrals', list: NEUTRAL_COLORS },
            { ar: 'ألوان الحالات', en: 'Status', list: STATUS_COLORS },
          ].map(g => (
            <div key={g.en} className="mb-8">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-3">{isAr ? g.ar : g.en}</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {g.list.map(c => <ColorChip key={c.id} c={c} isAr={isAr} copy={copy} />)}
              </div>
            </div>
          ))}
        </section>

        <section id="type" aria-labelledby="type-title" className="scroll-mt-20">
          <h2 id="type-title" className="text-3xl font-black text-slate-900">{t('الخط', 'Typeface')}</h2>
          <p className="text-slate-500 font-medium mt-1 mb-6">{t('الخط المعتمد Readex Pro للعربية والإنجليزية، متاح مجاناً من Google Fonts.', 'The approved typeface is Readex Pro for Arabic and English, free on Google Fonts.')}</p>
          <div className="grid lg:grid-cols-[1fr_1.4fr] gap-4">
            <div className="bg-white rounded-3xl ring-1 ring-slate-200 p-6 space-y-4">
              <p className="text-7xl font-black text-[#005751] leading-none">أ ب ج</p>
              <p className="text-5xl font-black text-[#470D67] leading-none" dir="ltr">Aa Bb</p>
              <div className="flex flex-wrap gap-2 text-sm">
                {[[200, t('خفيف', 'Light')], [400, t('عادي', 'Regular')], [700, t('عريض', 'Bold')], [900, t('أسود', 'Black')]].map(([w, l]) => (
                  <span key={w} className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700" style={{ fontWeight: w as number }}>{l} {w}</span>
                ))}
              </div>
              <a href="https://fonts.google.com/specimen/Readex+Pro" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-black text-[#005751] hover:underline underline-offset-4"><TypeIcon size={15} aria-hidden />{t('تحميل الخط من Google Fonts', 'Get the font on Google Fonts')}<ExternalLink size={13} aria-hidden /></a>
            </div>
            <div className="bg-white rounded-3xl ring-1 ring-slate-200 divide-y">
              {TYPE_SCALE.map(ty => (
                <button key={ty.id} type="button" onClick={() => copy(`font-size: ${ty.size}px; font-weight: ${ty.weight}; line-height: ${ty.leading};`)} className="w-full text-start flex items-center gap-4 p-4 hover:bg-slate-50">
                  <span className="w-24 shrink-0 text-xs font-bold text-slate-500">{isAr ? ty.labelAr : ty.labelEn}<span className="block font-mono text-slate-400" dir="ltr">{ty.size}/{ty.weight}</span></span>
                  <span className="truncate text-slate-900" style={{ fontSize: Math.min(ty.size, 40), fontWeight: ty.weight, lineHeight: ty.leading }}>{t('بلدية ظفار', 'Dhofar Municipality')}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <section id="patterns" aria-labelledby="patterns-title" className="scroll-mt-20">
          <h2 id="patterns-title" className="text-3xl font-black text-slate-900">{t('الأنماط الزخرفية', 'Patterns')}</h2>
          <p className="text-slate-500 font-medium mt-1 mb-6">{t('زخارف مستوحاة من معالم ظفار؛ تُستخدم بشفافية 10–30% فوق ألوان العلامة.', 'Motifs inspired by Dhofar landmarks, used at 10–30% opacity over brand colours.')}</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {PATTERNS.map(p => (
              <button key={p.id} type="button" onClick={() => copy(p.className)} className="text-start bg-white rounded-2xl ring-1 ring-slate-200 overflow-hidden hover:ring-[#008E91]">
                <div className="relative h-28 bg-[#005751]"><div aria-hidden className={cn('absolute inset-0 opacity-30', p.className)} /></div>
                <div className="p-3"><p className="font-black text-slate-900 text-sm">{isAr ? p.nameAr : p.nameEn}</p><p className="text-[11px] font-mono text-slate-400">.{p.className}</p></div>
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-xs font-bold text-slate-600">
            {RADII.map(r => <span key={r.id} className="px-3 py-1.5 rounded-xl bg-white ring-1 ring-slate-200">{t('زاوية', 'Radius')} {isAr ? r.labelAr : r.labelEn}: <span dir="ltr">{r.px === 999 ? '∞' : `${r.px}px`}</span></span>)}
          </div>
        </section>

        <section id="css" aria-labelledby="css-title" className="scroll-mt-20">
          <h2 id="css-title" className="text-3xl font-black text-slate-900">{t('ملف CSS', 'CSS file')}</h2>
          <p className="text-slate-500 font-medium mt-1 mb-6">{t('يحتوي الملف على متغيرات الألوان والخطوط والمسافات والزوايا، والأنماط الزخرفية، وأزرار وبطاقات جاهزة.', 'The file contains colour, type, spacing and radius variables, the patterns, and ready buttons and cards.')}</p>
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="rounded-3xl bg-slate-950 text-slate-200 p-5 font-mono text-xs leading-relaxed overflow-x-auto" dir="ltr">
              <pre>{`<link rel="stylesheet" href="${CSS_URL}">

<div class="dm-root">
  <h1 class="dm-text-h1 dm-text-color-purple">…</h1>
  <a class="dm-btn dm-btn-primary">…</a>
  <div class="dm-card dm-pattern-wave-pro">…</div>
</div>

.my-banner { background: var(--dm-teal-deep);
  border-radius: var(--dm-radius-xl); }`}</pre>
            </div>
            <div className="bg-white rounded-3xl ring-1 ring-slate-200 p-6 space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center h-11 px-6 rounded-[20px] font-black text-slate-900" style={{ background: 'linear-gradient(90deg,#03CFCB,#008E91)' }}>dm-btn-primary</span>
                <span className="inline-flex items-center h-11 px-6 rounded-[20px] font-black text-white bg-[#005751]">dm-btn-secondary</span>
                <span className="inline-flex items-center h-11 px-6 rounded-[20px] font-black text-white" style={{ background: 'linear-gradient(90deg,#470D67,#6b149b)' }}>dm-btn-royal</span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-black">
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">dm-badge-success</span>
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800">dm-badge-warning</span>
                <span className="px-3 py-1 rounded-full bg-red-100 text-red-700">dm-badge-danger</span>
                <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-700">dm-badge-info</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <a href={CSS_URL} download="dhofar-identity.css" className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-[#005751] text-white font-black text-sm"><Download size={16} aria-hidden />{t('تنزيل', 'Download')}</a>
                <button type="button" onClick={() => copy(`<link rel="stylesheet" href="${window.location.origin}${CSS_URL}">`, t('وسم الربط', 'Link tag'))} className="inline-flex items-center gap-2 h-11 px-5 rounded-xl ring-2 ring-slate-200 font-black text-sm text-slate-700"><Copy size={15} aria-hidden />{t('نسخ وسم الربط', 'Copy link tag')}</button>
              </div>
            </div>
          </div>
        </section>

        <VoiceSection isAr={isAr} copy={copy} />
      </main>

      <PortalFooter siteConfig={siteConfig} />
    </div>
  );
}

function ColorChip({ c, isAr, copy }: { c: ColorToken; isAr: boolean; copy: (t: string, l?: string) => void }) {
  const [r, g, b] = rgb(c.hex);
  const [cc, m, y, k] = cmyk(c.hex);
  const onWhite = contrastRatio(c.hex, '#ffffff');
  return (
    <div className="bg-white rounded-2xl ring-1 ring-slate-200 overflow-hidden">
      <button type="button" onClick={() => copy(c.hex, isAr ? c.nameAr : c.nameEn)} className="w-full h-20 flex items-end p-2 font-mono text-xs font-black" style={{ background: c.hex, color: c.onColor }} aria-label={`${isAr ? 'نسخ' : 'Copy'} ${c.hex}`}>{c.hex}</button>
      <div className="p-3 space-y-1">
        <p className="text-sm font-black text-slate-900 truncate">{isAr ? c.nameAr : c.nameEn}</p>
        <button type="button" onClick={() => copy(`rgb(${r}, ${g}, ${b})`)} className="block font-mono text-[10px] text-slate-500 hover:text-slate-900" dir="ltr">RGB {r} {g} {b}</button>
        <button type="button" onClick={() => copy(`C${cc} M${m} Y${y} K${k}`)} className="block font-mono text-[10px] text-slate-500 hover:text-slate-900" dir="ltr">CMYK {cc} {m} {y} {k}</button>
        <p className="text-[10px] font-bold text-slate-400"><Palette size={10} className="inline me-1" aria-hidden />{isAr ? 'على الأبيض' : 'on white'} {onWhite.toFixed(1)}:1 {wcagRating(onWhite)}</p>
      </div>
    </div>
  );
}
