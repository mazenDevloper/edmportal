import React from 'react';
import { cn } from '@/lib/utils';

/** Official Dhofar Municipality logo (bilingual wordmark + emblem), 327×198 transparent PNG */
export const LOGO_SRC = '/brand/dhofar-municipality-logo.png';
const RATIO = 327 / 198;
// The emblem is the right-hand 108px of the 327px-wide artwork
const EMBLEM_SHARE = 108 / 327;

/**
 * Full logo. `height` sets the size; `onDark` turns it white for dark backgrounds.
 * The logo already says "بلدية ظفار / Dhofar Municipality", so don't repeat the name next to it.
 */
export function BrandLogo({ height = 56, onDark = false, className, alt = 'بلدية ظفار – Dhofar Municipality' }: { height?: number; onDark?: boolean; className?: string; alt?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={LOGO_SRC} alt={alt} width={Math.round(height * RATIO)} height={height}
      className={cn('object-contain shrink-0', onDark && 'brightness-0 invert', className)} style={{ height, width: 'auto' }} />
  );
}

/** Emblem only, cropped from the same artwork (no second file to keep in sync) */
export function BrandEmblem({ height = 40, onDark = false, className }: { height?: number; onDark?: boolean; className?: string }) {
  const fullWidth = height * RATIO;
  return (
    <span aria-hidden className={cn('relative inline-block overflow-hidden shrink-0', className)} style={{ height, width: fullWidth * EMBLEM_SHARE }} dir="ltr">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={LOGO_SRC} alt="" className={cn('absolute top-0 right-0 max-w-none', onDark && 'brightness-0 invert')} style={{ height, width: fullWidth }} />
    </span>
  );
}
