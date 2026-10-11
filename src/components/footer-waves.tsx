import React from 'react';

/**
 * The moving wave band along the footer's top edge: the brand wave lines (public/brand/wave.svg)
 * in turquoise, drifting sideways. Sits inside the footer, which needs `relative overflow-hidden`.
 * Decorative; it stands still under "stop animations" and reduced motion (see globals.css).
 */
export function FooterWaves() {
  return <span aria-hidden className="dm-foot-waves" />;
}
