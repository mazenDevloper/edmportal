import React from 'react';

/**
 * The moving wave band on the footer's top edge: three wave lines in the brand colours drifting
 * sideways at different speeds, the last one in the footer's own colour so it reads as its edge.
 * Decorative; it stands still under "stop animations" and reduced motion (see globals.css).
 */
export function FooterWaves({ footer = '#3b0a57' }: { footer?: string }) {
  const layers: [string, string, number][] = [['#03CFCB', 'dm-wave-a', 2], ['#008E91', 'dm-wave-b', 14], [footer, 'dm-wave-c', 26]];
  return (
    <div aria-hidden dir="ltr" className="relative -mb-px h-12 overflow-hidden">
      {layers.map(([color, cls, top], i) => (
        <svg key={cls} className={`absolute left-0 h-full w-[calc(100%+160px)] ${cls}`} style={{ top }} preserveAspectRatio="none">
          <defs>
            <pattern id={`dm-fw-${i}`} width="160" height="48" patternUnits="userSpaceOnUse">
              <path d="M0 12 Q40 -4 80 12 T160 12 V48 H0 Z" fill={color} />
            </pattern>
          </defs>
          <rect width="100%" height="48" fill={`url(#dm-fw-${i})`} />
        </svg>
      ))}
    </div>
  );
}
