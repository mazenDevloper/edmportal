'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BlockStyle, BuilderComponent } from '@/lib/types';
import { PATTERN_CLASS } from '@/lib/identity/tokens';
import { BLOCK_MAP } from './registry';
import { cn } from '@/lib/utils';

const BG: Record<NonNullable<BlockStyle['background']>, string> = {
  none: '',
  white: 'bg-white border border-slate-100',
  soft: 'bg-[#F3F7FB]',
  teal: 'bg-[#E6FAFA]',
  purple: 'bg-[#F3EEF7]',
  dark: 'bg-slate-950',
  gradient: 'bg-gradient-to-br from-[#470D67] to-[#2a0640]',
};
const DARK_BG = new Set(['dark', 'gradient']);
const PAD: Record<NonNullable<BlockStyle['padding']>, string> = { none: '', sm: 'p-4', md: 'p-6 md:p-8', lg: 'p-8 md:p-12', xl: 'p-10 md:p-20' };
const RADIUS: Record<NonNullable<BlockStyle['radius']>, string> = { none: '', md: 'rounded-2xl', xl: 'rounded-[2.5rem]' };
const SPAN: Record<number, string> = { 3: 'md:col-span-3', 4: 'md:col-span-4', 6: 'md:col-span-6', 8: 'md:col-span-8', 9: 'md:col-span-9', 12: 'md:col-span-12' };
const MIN_H: Record<string, string> = { sm: 'min-h-[200px]', md: 'min-h-[400px]', lg: 'min-h-[600px]', full: 'min-h-screen' };

/** Style actually applied: block default, overridden by what the author set */
export function effectiveStyle(block: BuilderComponent): BlockStyle {
  return { padding: 'md', ...(BLOCK_MAP[block.type]?.defaultStyle || {}), ...(block.style || {}) };
}

/** `.custom-widget` (legacy) or `&` in author CSS targets this block only */
const scopeCss = (css: string, id: string) => css.replace(/\.custom-widget/g, `.widget-${id}`).replace(/&/g, `.widget-${id}`);

export function BlockView({ block, isAr, animate = true }: { block: BuilderComponent; isAr: boolean; animate?: boolean }) {
  const def = BLOCK_MAP[block.type];
  if (!def) return null;
  const s = effectiveStyle(block);
  const dark = DARK_BG.has(s.background || 'none');
  const Wrapper: any = animate && s.animate !== false ? motion.section : 'section';
  const motionProps = animate && s.animate !== false
    ? { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-40px' }, transition: { duration: 0.5 } }
    : {};

  return (
    <Wrapper
      id={s.anchor || undefined}
      {...motionProps}
      className={cn(
        `widget-${block.id} relative overflow-hidden h-full`,
        BG[s.background || 'none'], PAD[s.padding || 'md'], RADIUS[s.radius || (s.background && s.background !== 'none' ? 'xl' : 'none')],
        s.shadow && 'shadow-2xl', s.align === 'center' ? 'text-center' : 'text-start',
        dark && 'text-white', MIN_H[block.gridHeight || ''],
      )}
      style={{ ...(block.gridHeight === 'custom' && block.customHeight ? { minHeight: block.customHeight } : {}) }}
    >
      {s.pattern && s.pattern !== 'none' && <div aria-hidden className={cn('absolute inset-0 pointer-events-none', PATTERN_CLASS[s.pattern], dark ? 'opacity-20' : 'opacity-40')} />}
      {block.customCss && <style dangerouslySetInnerHTML={{ __html: scopeCss(block.customCss, block.id) }} />}
      <div className="relative">
        <def.Render c={block.content || {}} isAr={isAr} dark={dark} center={s.align === 'center'} />
      </div>
    </Wrapper>
  );
}

export interface PageBlocksProps {
  blocks: BuilderComponent[];
  isAr: boolean;
  animate?: boolean;
  /** Force the phone layout (builder's mobile preview) */
  mobile?: boolean;
  /** Lets the builder wrap each block with selection chrome */
  wrap?: (block: BuilderComponent, index: number, node: React.ReactNode) => React.ReactNode;
}

/** Renders a page's blocks on the 12-column grid (full width on phones) */
export function PageBlocks({ blocks, isAr, animate = true, mobile, wrap }: PageBlocksProps) {
  return (
    <div className="grid grid-cols-12 gap-6 md:gap-8 items-stretch">
      {blocks.map((b, i) => {
        const hideMobile = effectiveStyle(b).hideOnMobile;
        if (mobile && hideMobile) return null;
        const node = <BlockView block={b} isAr={isAr} animate={animate} />;
        return (
          <div key={b.id} className={cn('col-span-12', !mobile && (SPAN[b.gridSpan || 12] || 'md:col-span-12'), !mobile && hideMobile && 'hidden md:block')}>
            {wrap ? wrap(b, i, node) : node}
          </div>
        );
      })}
    </div>
  );
}
