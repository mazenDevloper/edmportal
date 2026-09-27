'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CustomPage, PageTemplateSettings } from '@/lib/types';
import { PageBlocks, PageBlocksProps } from './block-renderer';
import { cn } from '@/lib/utils';

const WIDTH: Record<NonNullable<PageTemplateSettings['width']>, string> = {
  narrow: 'max-w-4xl', normal: 'max-w-6xl', wide: 'max-w-7xl', full: 'max-w-none',
};

/** Page body between header and footer: breadcrumb, title band and blocks. Shared by /p/[slug] and the builder preview. */
export function PageShell({ page, template, isAr, animate = true, mobile, wrapBlock, after }: { page: Pick<CustomPage, 'titleAr' | 'titleEn' | 'descriptionAr' | 'descriptionEn' | 'components'>; template: PageTemplateSettings; isAr: boolean; animate?: boolean; mobile?: boolean; wrapBlock?: PageBlocksProps['wrap']; after?: React.ReactNode }) {
  const title = isAr ? page.titleAr : page.titleEn || page.titleAr;
  const desc = isAr ? page.descriptionAr : page.descriptionEn || page.descriptionAr;
  const band = template.titleBand ?? 'pattern';
  const width = WIDTH[template.width || 'wide'];
  const Chevron = isAr ? ChevronLeft : ChevronRight;

  return (
    <main id="page-content" className="flex-1" lang={isAr ? 'ar' : 'en'}>
      {band !== 'none' && (
        <section className={cn('relative overflow-hidden',
          band === 'dark' ? 'bg-slate-950 text-white' : band === 'pattern' ? 'bg-white border-b' : 'bg-transparent')}>
          {band === 'pattern' && <div aria-hidden className="absolute inset-0 dm-pattern-wave-pro opacity-30" />}
          {band === 'dark' && <div aria-hidden className="absolute inset-0 dm-pattern-landmark opacity-10" />}
          <div className={cn('relative mx-auto px-6 py-14 md:py-20 space-y-4', width)}>
            {template.showBreadcrumb !== false && (
              <nav aria-label={isAr ? 'مسار التنقل' : 'Breadcrumb'}>
                <ol className={cn('flex items-center gap-2 text-xs font-bold', band === 'dark' ? 'text-white/60' : 'text-slate-400')}>
                  <li><Link href="/" className="hover:underline">{isAr ? 'الرئيسية' : 'Home'}</Link></li>
                  <li aria-hidden><Chevron size={12} /></li>
                  <li aria-current="page" className={band === 'dark' ? 'text-white' : 'text-secondary'}>{title}</li>
                </ol>
              </nav>
            )}
            <h1 className={cn('font-black tracking-tight', mobile ? 'text-3xl' : 'text-4xl md:text-6xl', band === 'dark' ? 'text-white' : 'text-secondary')}>{title}</h1>
            <div className="h-1.5 w-20 rounded-full bg-accent" aria-hidden />
            {desc && <p className={cn('text-lg font-medium max-w-3xl', band === 'dark' ? 'text-white/70' : 'text-slate-500')}>{desc}</p>}
          </div>
        </section>
      )}
      <div className={cn('mx-auto px-6 py-12 md:py-16', width)}>
        {band === 'none' && <h1 className="sr-only">{title}</h1>}
        <PageBlocks blocks={page.components || []} isAr={isAr} animate={animate} mobile={mobile} wrap={wrapBlock} />
        {after}
      </div>
    </main>
  );
}
