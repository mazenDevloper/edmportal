'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import * as Icons from 'lucide-react';
import { CalendarDays, ChevronLeft, ChevronRight, Home, Info, Mail, MessageCircle, Phone, Printer, TriangleAlert, Globe } from 'lucide-react';
import { PortalHeader } from '@/components/portal-header';
import { PortalFooter } from '@/components/portal-footer';
import { useSettingsStore } from '@/lib/settings-store';
import { fetchBin } from '@/lib/jsonbin';
import { MenuItem, SiteConfig } from '@/lib/types';
import { Bi, DocBlock, LegalDoc } from '@/lib/footer-pages';
import { cn } from '@/lib/utils';

export const useLang = () => {
  const isAr = useSettingsStore(s => s.language) === 'ar';
  return { isAr, t: (b: Bi) => (isAr ? b.ar : b.en), tt: (ar: string, en: string) => (isAr ? ar : en) };
};

export function formatDate(iso: string, isAr: boolean) {
  return new Date(iso).toLocaleDateString(isAr ? 'ar-OM' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

interface ShellProps {
  title: Bi;
  intro?: Bi;
  icon?: string;
  updated?: string;
  toc?: { id: string; title: Bi }[];
  children: React.ReactNode;
}

/** Layout shared by every footer page: portal header, breadcrumb, title band, optional TOC, footer */
export function InfoPageShell({ title, intro, icon, updated, toc, children }: ShellProps) {
  const { isAr, t, tt } = useLang();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [active, setActive] = useState<string | null>(toc?.[0]?.id ?? null);
  const Icon = (icon && (Icons as any)[icon]) || Info;
  const Chevron = isAr ? ChevronLeft : ChevronRight;

  useEffect(() => {
    fetchBin().then(db => { setMenuItems(db.menuItems || []); setSiteConfig(db.siteConfig || null); }).catch(() => {});
  }, []);

  useEffect(() => { document.title = `${t(title)} | ${tt('بلدية ظفار', 'Dhofar Municipality')}`; }, [isAr]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!toc?.length) return;
    const obs = new IntersectionObserver(entries => {
      const top = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (top) setActive(top.target.id);
    }, { rootMargin: '-15% 0px -70% 0px' });
    toc.forEach(s => { const el = document.getElementById(s.id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [toc]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50" dir={isAr ? 'rtl' : 'ltr'} lang={isAr ? 'ar' : 'en'}>
      <div className="print:hidden"><PortalHeader menuItems={menuItems} /></div>

      <section className="relative overflow-hidden bg-gradient-to-br from-[#005751] via-[#008E91] to-[#03CFCB] text-white print:bg-none print:text-black">
        <div aria-hidden className="absolute inset-0 dm-pattern-landmark opacity-10 print:hidden" />
        <div className="relative max-w-6xl mx-auto px-4 md:px-6 py-10 md:py-14 space-y-5">
          <nav aria-label={tt('مسار التنقل', 'Breadcrumb')} className="print:hidden">
            <ol className="flex items-center gap-1.5 text-sm font-bold text-white/80">
              <li><Link href="/" className="flex items-center gap-1.5 hover:text-white rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"><Home size={14} aria-hidden />{tt('الرئيسية', 'Home')}</Link></li>
              <li aria-hidden><Chevron size={14} /></li>
              <li aria-current="page" className="text-white">{t(title)}</li>
            </ol>
          </nav>
          <div className="flex items-start gap-4">
            <span className="size-14 shrink-0 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center print:hidden"><Icon size={28} aria-hidden /></span>
            <div className="space-y-2 min-w-0">
              <h1 className="text-3xl md:text-5xl font-black leading-tight">{t(title)}</h1>
              {intro && <p className="max-w-3xl text-base md:text-lg font-medium text-white/85 leading-relaxed print:text-black">{t(intro)}</p>}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm font-bold text-white/80 print:hidden">
            {updated && <span className="flex items-center gap-1.5"><CalendarDays size={15} aria-hidden />{tt('آخر تحديث:', 'Last updated:')} <time dateTime={updated}>{formatDate(updated, isAr)}</time></span>}
            <button type="button" onClick={() => window.print()} className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-white/15 hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">
              <Printer size={15} aria-hidden />{tt('طباعة', 'Print')}
            </button>
          </div>
        </div>
      </section>

      <div className={cn('flex-1 w-full max-w-6xl mx-auto px-4 md:px-6 py-10', toc?.length && 'grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[240px_minmax(0,1fr)] gap-8')}>
        {!!toc?.length && (
          <nav aria-label={tt('محتويات الصفحة', 'On this page')} className="min-w-0 lg:sticky lg:top-24 self-start print:hidden">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">{tt('محتويات الصفحة', 'On this page')}</p>
            <ol className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0 border-s-2 border-slate-200">
              {toc.map(s => (
                <li key={s.id} className="shrink-0">
                  <a href={`#${s.id}`} aria-current={active === s.id ? 'true' : undefined}
                    className={cn('block -ms-0.5 border-s-2 ps-3 py-1.5 text-sm font-bold leading-snug transition-colors',
                      active === s.id ? 'border-[#008E91] text-[#005751]' : 'border-transparent text-slate-500 hover:text-slate-800')}>
                    {t(s.title)}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}
        <main id="main" className="min-w-0">{children}</main>
      </div>

      <div className="print:hidden"><PortalFooter siteConfig={siteConfig} lastUpdated={updated} /></div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function ContactChips({ items }: { items: Extract<DocBlock, { type: 'contact' }>['items'] }) {
  const { t } = useLang();
  const icon = { phone: Phone, whatsapp: MessageCircle, email: Mail, web: Globe };
  const href = (k: string, v: string) => (k === 'phone' ? `tel:${v}` : k === 'whatsapp' ? `https://wa.me/968${v}` : k === 'email' ? `mailto:${v}` : `https://${v}`);
  return (
    <ul className="flex flex-wrap gap-3">
      {items.map(c => {
        const I = icon[c.kind];
        return (
          <li key={c.value}>
            <a href={href(c.kind, c.value)} target={c.kind === 'whatsapp' || c.kind === 'web' ? '_blank' : undefined} rel="noopener noreferrer"
              className="flex items-center gap-3 ps-3 pe-4 py-2.5 rounded-2xl bg-white ring-1 ring-slate-200 hover:ring-[#008E91] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#008E91]">
              <span className="size-9 rounded-xl bg-[#03CFCB]/15 text-[#005751] flex items-center justify-center"><I size={17} aria-hidden /></span>
              <span>
                <span className="block text-[11px] font-bold text-slate-500">{t(c.label)}</span>
                <span className="block font-black text-slate-900" dir="ltr">{c.value}</span>
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

function Block({ block }: { block: DocBlock }) {
  const { t } = useLang();
  switch (block.type) {
    case 'p': return <p className="text-[17px] leading-loose text-slate-700 font-medium">{t(block.text)}</p>;
    case 'list': {
      const L = block.ordered ? 'ol' : 'ul';
      return (
        <L className={cn('space-y-3', block.ordered ? 'list-decimal ps-6 marker:font-black marker:text-[#008E91]' : '')}>
          {block.items.map((it, i) => (
            <li key={i} className={cn('text-[17px] leading-loose text-slate-700 font-medium', !block.ordered && 'flex gap-3')}>
              {!block.ordered && <span aria-hidden className="mt-3 size-2 shrink-0 rounded-full bg-[#03CFCB]" />}
              <span>{t(it)}</span>
            </li>
          ))}
        </L>
      );
    }
    case 'note': {
      const warn = block.tone === 'warning';
      const I = warn ? TriangleAlert : Info;
      return <p role="note" className={cn('flex gap-3 p-4 rounded-2xl border text-sm font-bold', warn ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-sky-50 border-sky-200 text-sky-900')}><I size={18} className="shrink-0 mt-0.5" aria-hidden />{t(block.text)}</p>;
    }
    case 'contact': return <ContactChips items={block.items} />;
  }
}

export function LegalDocBody({ doc }: { doc: LegalDoc }) {
  const { t } = useLang();
  return (
    <div className="space-y-6">
      {doc.sections.map((s, i) => (
        <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="scroll-mt-28 bg-white rounded-3xl ring-1 ring-slate-200/70 shadow-sm p-6 md:p-8 space-y-4 print:shadow-none print:ring-0 print:p-0">
          <h2 id={`${s.id}-h`} className="flex items-center gap-3 text-xl md:text-2xl font-black text-slate-900">
            <span aria-hidden className="size-8 shrink-0 rounded-xl bg-[#005751] text-white text-sm flex items-center justify-center tabular-nums print:hidden">{i + 1}</span>
            {t(s.title)}
          </h2>
          {s.blocks.map((b, j) => <Block key={j} block={b} />)}
        </section>
      ))}
    </div>
  );
}

export function LegalDocPage({ doc, after }: { doc: LegalDoc; after?: React.ReactNode }) {
  return (
    <InfoPageShell title={doc.title} intro={doc.intro} icon={doc.icon} updated={doc.updated} toc={doc.sections.map(s => ({ id: s.id, title: s.title }))}>
      <LegalDocBody doc={doc} />
      {after}
    </InfoPageShell>
  );
}
