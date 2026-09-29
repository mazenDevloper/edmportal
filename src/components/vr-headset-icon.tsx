import React from 'react';

/** VR headset (goggles) icon, drawn in the same 24×24 stroke style as lucide */
export function VrHeadsetIcon({ size = 24, className, strokeWidth = 2 }: { size?: number; className?: string; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {/* strap */}
      <path d="M2 10.5h1M21 10.5h1" />
      {/* visor with the nose bridge cut-out */}
      <path d="M5.5 6.5h13A2.5 2.5 0 0 1 21 9v4.5a2.5 2.5 0 0 1-2.5 2.5h-3.2a1.5 1.5 0 0 1-1.3-.8l-.7-1.3a1.5 1.5 0 0 0-2.6 0l-.7 1.3a1.5 1.5 0 0 1-1.3.8H5.5A2.5 2.5 0 0 1 3 13.5V9a2.5 2.5 0 0 1 2.5-2.5Z" />
      {/* lens shine */}
      <path d="M6.5 9.5h2.5" />
    </svg>
  );
}
