// Builds public/brand/dhofar-identity.css from src/lib/identity/tokens.ts and the pattern
// classes in src/app/globals.css. Run: node scripts/build-brand-css.js
const fs = require('fs');
const tokens = fs.readFileSync('src/lib/identity/tokens.ts', 'utf8');
const globals = fs.readFileSync('src/app/globals.css', 'utf8');

const colors = [...tokens.matchAll(/\{ id: '([\w-]+)', hex: '(#[0-9A-Fa-f]{6})', nameAr: '([^']+)', nameEn: '([^']+)'/g)]
  .map(m => ({ id: m[1], hex: m[2], ar: m[3], en: m[4] }));
const type = [...tokens.matchAll(/\{ id: '([\w-]+)', size: (\d+), weight: (\d+), leading: ([\d.]+)/g)]
  .map(m => ({ id: m[1], size: +m[2], weight: +m[3], leading: +m[4] }));
const radii = [...tokens.matchAll(/\{ id: '(\w+)', px: (\d+), labelAr/g)].map(m => ({ id: m[1], px: +m[2] }));
const spacing = JSON.parse(tokens.match(/SPACING = (\[[^\]]+\])/)[1]);

const start = globals.indexOf('.dm-pattern-landmark');
const end = globals.indexOf('@keyframes marquee');
const patterns = globals.slice(start, end).trim();

const css = `/*!
 * Dhofar Municipality — visual identity tokens (v5.0)
 * Colours, type scale, spacing, radii, patterns and a few ready components.
 * Generated from the portal's design tokens — do not edit by hand.
 * Usage: <link rel="stylesheet" href="https://<portal>/brand/dhofar-identity.css">
 */
@import url('https://fonts.googleapis.com/css2?family=Readex+Pro:wght@200;400;700;900&display=swap');

:root {
  /* Colour */
${colors.map(c => `  --dm-${c.id}: ${c.hex}; /* ${c.ar} — ${c.en} */`).join('\n')}
  --dm-gradient-primary: linear-gradient(90deg, #03CFCB 0%, #008E91 100%);
  --dm-gradient-royal: linear-gradient(90deg, #470D67 0%, #6b149b 100%);

  /* Typography */
  --dm-font-family: 'Readex Pro', Tahoma, Arial, sans-serif;
${type.map(t => `  --dm-font-${t.id}: ${t.size / 16}rem; --dm-weight-${t.id}: ${t.weight}; --dm-leading-${t.id}: ${t.leading};`).join('\n')}

  /* Spacing (4px scale) */
${spacing.map((s, i) => `  --dm-space-${i + 1}: ${s}px;`).join('\n')}

  /* Radii */
${radii.map(r => `  --dm-radius-${r.id}: ${r.px}px;`).join('\n')}

  /* Elevation */
  --dm-shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.06);
  --dm-shadow-md: 0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.1);
  --dm-shadow-lg: 0 30px 80px rgba(0, 0, 0, 0.2);

  /* Motion */
  --dm-ease: cubic-bezier(0.2, 0, 0, 1);
  --dm-duration-fast: 200ms;
  --dm-duration-base: 300ms;
}

/* Base */
.dm-root { font-family: var(--dm-font-family); color: var(--dm-ink); background: var(--dm-cloud); line-height: 1.8; }
${type.map(t => `.dm-text-${t.id} { font-size: var(--dm-font-${t.id}); font-weight: var(--dm-weight-${t.id}); line-height: var(--dm-leading-${t.id}); }`).join('\n')}

/* Colour helpers */
${colors.map(c => `.dm-bg-${c.id} { background-color: var(--dm-${c.id}); }\n.dm-text-color-${c.id} { color: var(--dm-${c.id}); }`).join('\n')}

/* Components */
.dm-btn { display: inline-flex; align-items: center; justify-content: center; gap: .5rem; height: 2.75rem; padding: 0 1.5rem; border-radius: var(--dm-radius-lg); font-family: var(--dm-font-family); font-weight: 900; border: 0; cursor: pointer; transition: all var(--dm-duration-fast) var(--dm-ease); }
.dm-btn:focus-visible { outline: 3px solid #f59e0b; outline-offset: 2px; }
.dm-btn-primary { background: var(--dm-gradient-primary); color: var(--dm-ink); }
.dm-btn-secondary { background: var(--dm-teal-deep); color: #fff; }
.dm-btn-royal { background: var(--dm-gradient-royal); color: #fff; }
.dm-btn-outline { background: transparent; color: var(--dm-teal-deep); box-shadow: inset 0 0 0 2px var(--dm-mist); }
.dm-card { background: #fff; border-radius: var(--dm-radius-xl); box-shadow: var(--dm-shadow-sm); padding: var(--dm-space-5); border: 1px solid var(--dm-mist); }
.dm-badge { display: inline-flex; align-items: center; gap: .25rem; padding: .25rem .75rem; border-radius: var(--dm-radius-pill); font-size: .75rem; font-weight: 900; }
.dm-badge-success { background: #d1fae5; color: #047857; }
.dm-badge-warning { background: #fef3c7; color: #92400e; }
.dm-badge-danger { background: #fee2e2; color: #b91c1c; }
.dm-badge-info { background: #e0f2fe; color: #0369a1; }

/* Gradients and patterns */
${patterns}

@media (prefers-reduced-motion: reduce) {
  .dm-btn { transition: none; }
}
`;
fs.writeFileSync('public/brand/dhofar-identity.css', css);
console.log('colors', colors.length, 'type', type.length, 'radii', radii.length, 'bytes', css.length);
