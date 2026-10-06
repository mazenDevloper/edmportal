// Small SVG drawing kit for the design hand-off files (opens in Figma and Illustrator).
// Every group gets an id, which both apps show as the layer name.
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const C = {
  teal: '#005751', teal2: '#008E91', aqua: '#03CFCB', purple: '#470D67', violet: '#7B3FA8',
  ink: '#0f172a', text: '#334155', mut: '#64748b', faint: '#94a3b8', line: '#e2e8f0', soft: '#f1f5f9',
  bg: '#f4f7fb', white: '#ffffff', amber: '#f59e0b', red: '#dc2626', green: '#059669', orange: '#C2560C', blue: '#2563EB',
};
const FONT = "'Readex Pro', 'Tajawal', 'Segoe UI', Tahoma, sans-serif";
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Arabic strings are wrapped in an RTL embedding so mixed Arabic/Latin text keeps its order in every app
const RLE = String.fromCharCode(0x202B), PDF = String.fromCharCode(0x202C);
const hasAr = s => /[؀-ۿ]/.test(s);

/** Rectangle. o: r (radius), f (fill), s (stroke), sw, op */
const R = (x, y, w, h, o = {}) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${o.r ?? 0}" fill="${o.f ?? C.white}"${o.s ? ` stroke="${o.s}" stroke-width="${o.sw ?? 1}"` : ''}${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}${o.op != null ? ` opacity="${o.op}"` : ''}${o.filter ? ` filter="url(#${o.filter})"` : ''}/>`;
const CIRC = (cx, cy, r, o = {}) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${o.f ?? C.white}"${o.s ? ` stroke="${o.s}" stroke-width="${o.sw ?? 1}"` : ''}${o.op != null ? ` opacity="${o.op}"` : ''}/>`;
const LINE = (x1, y1, x2, y2, o = {}) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.s ?? C.line}" stroke-width="${o.sw ?? 1}"${o.dash ? ` stroke-dasharray="${o.dash}"` : ''}/>`;

/**
 * Text. x is the RIGHT edge by default (Arabic layouts); o.a = 'start' | 'middle' | 'end'.
 * o: s (size), w (weight), f (fill)
 */
const T = (x, y, str, o = {}) => {
  const s = String(str);
  return `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${o.s ?? 16}" font-weight="${o.w ?? 400}" fill="${o.f ?? C.ink}" text-anchor="${o.a ?? 'end'}"${o.op != null ? ` opacity="${o.op}"` : ''}${o.ls ? ` letter-spacing="${o.ls}"` : ''}>${hasAr(s) ? RLE : ''}${esc(s)}${hasAr(s) ? PDF : ''}</text>`;
};
/** Wraps on words to about `max` characters per line */
const wrap = (str, max) => {
  const out = []; let line = '';
  for (const w of String(str).split(/\s+/)) {
    if ((line + ' ' + w).trim().length > max && line) { out.push(line); line = w; } else line = (line + ' ' + w).trim();
  }
  if (line) out.push(line);
  return out;
};
/** Paragraph: wrapped lines; returns { svg, h } */
const P = (x, y, str, max, o = {}) => {
  const lines = Array.isArray(str) ? str : wrap(str, max);
  const lh = o.lh ?? Math.round((o.s ?? 16) * 1.6);
  return { svg: lines.map((l, i) => T(x, y + i * lh, l, o)).join(''), h: lines.length * lh };
};

const iconCache = {};
/** A lucide icon as editable stroked paths. name is the file name, e.g. "bell", "file-text" */
function I(name, x, y, size = 24, color = C.teal, sw = 2) {
  if (!(name in iconCache)) {
    let file = path.join(ROOT, 'node_modules/lucide-react/dist/esm/icons', `${name}.js`);
    let els = '';
    if (fs.existsSync(file)) {
      let src = fs.readFileSync(file, 'utf8');
      // Alias files only re-export another icon
      const alias = /from '\.\/([a-z0-9-]+)\.js'/.exec(src);
      if (!src.includes('__iconNode') && alias) src = fs.readFileSync(path.join(path.dirname(file), alias[1] + '.js'), 'utf8');
      const body = src.slice(src.indexOf('const __iconNode'), src.indexOf('];', src.indexOf('const __iconNode')));
      const re = /\[\s*"(\w+)",\s*\{([^}]*)\}/g; let m;
      while ((m = re.exec(body))) {
        const attrs = [...m[2].matchAll(/(\w+):\s*"([^"]*)"/g)].filter(a => a[1] !== 'key').map(a => `${a[1]}="${a[2]}"`).join(' ');
        els += `<${m[1]} ${attrs}/>`;
      }
    } else els = '<circle cx="12" cy="12" r="9"/>';
    iconCache[name] = els;
  }
  const k = size / 24;
  return `<g transform="translate(${x} ${y}) scale(${k})" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${iconCache[name]}</g>`;
}

const G = (id, inner, extra = '') => `<g id="${esc(id)}"${extra}>${inner}</g>`;

/** Button: centred label, optional icon on the right of the label */
function BTN(x, y, w, h, label, o = {}) {
  const fill = o.f ?? C.teal, col = o.c ?? C.white, size = o.s ?? 15;
  const ic = o.icon ? I(o.icon, x + w - 16 - (o.is ?? 18), y + (h - (o.is ?? 18)) / 2, o.is ?? 18, col) : '';
  const tx = o.icon ? x + (w - 22) / 2 : x + w / 2;
  return R(x, y, w, h, { r: o.r ?? h / 2, f: fill, s: o.stroke, sw: o.sw }) + ic + T(tx, y + h / 2 + size * 0.36, label, { s: size, w: 700, f: col, a: 'middle' });
}
/** Chip (pill with text). Returns { svg, w } so chips can be laid out in a row; x is the right edge */
function CHIP(xRight, y, label, o = {}) {
  const size = o.s ?? 13, w = o.w ?? Math.round(String(label).length * size * 0.62 + 28), h = o.h ?? 30;
  return { svg: R(xRight - w, y, w, h, { r: h / 2, f: o.f ?? C.soft, s: o.stroke }) + T(xRight - w / 2, y + h / 2 + size * 0.36, label, { s: size, w: 700, f: o.c ?? C.text, a: 'middle' }), w };
}
/** Image placeholder with a crossed frame */
const IMG = (x, y, w, h, o = {}) =>
  R(x, y, w, h, { r: o.r ?? 16, f: o.f ?? '#dbe7f0' }) +
  `<path d="M${x} ${y + h} L${x + w * 0.35} ${y + h * 0.5} L${x + w * 0.55} ${y + h * 0.72} L${x + w * 0.75} ${y + h * 0.4} L${x + w} ${y + h} Z" fill="#c3d5e3" opacity="0.8"/>` +
  CIRC(x + w * 0.22, y + h * 0.28, Math.min(w, h) * 0.08, { f: '#f3f8fb' }) + (o.label ? T(x + w / 2, y + h / 2, o.label, { s: 13, f: C.mut, a: 'middle', w: 700 }) : '');

/** Numbered red note marker placed on the design */
const NOTE = (n, x, y) => G(`note-${n}`, CIRC(x, y, 15, { f: C.red, s: C.white, sw: 3 }) + T(x, y + 5, n, { s: 14, w: 700, f: C.white, a: 'middle' }));

let logoData = null;
function LOGO(x, y, h, white = false) {
  if (!logoData) logoData = 'data:image/png;base64,' + fs.readFileSync(path.join(ROOT, 'public/brand/dhofar-municipality-logo.png')).toString('base64');
  const w = Math.round(h * 327 / 198);
  return `<image id="logo" href="${logoData}" x="${x}" y="${y}" width="${w}" height="${h}"${white ? ' filter="url(#white)"' : ''}/>`;
}

/** Side panel listing the numbered notes. Returns svg */
function LEGEND(x, y, w, title, notes) {
  let out = T(x + w - 24, y + 44, title, { s: 22, w: 700 }), cy = y + 84;
  notes.forEach((n, i) => {
    const p = P(x + w - 70, cy + 6, n[1], Math.floor((w - 100) / 8.2), { s: 13.5, f: C.text, lh: 22 });
    out += CIRC(x + w - 40, cy, 14, { f: C.red }) + T(x + w - 40, cy + 5, i + 1, { s: 13, w: 700, f: C.white, a: 'middle' });
    out += T(x + w - 70, cy - 14, n[0], { s: 15, w: 700 });
    out += G(`legend-${i + 1}`, p.svg);
    cy += p.h + 46;
  });
  return { svg: G('legend', R(x, y, w, cy - y + 10, { r: 24, f: '#fff7ed', s: '#fed7aa' }) + out), h: cy - y + 10 };
}

function DOC(w, h, inner, title) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<title>${esc(title)}</title>
<defs>
  <linearGradient id="g-brand" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.teal}"/><stop offset="1" stop-color="#003b37"/></linearGradient>
  <linearGradient id="g-aqua" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.aqua}"/><stop offset="1" stop-color="${C.teal2}"/></linearGradient>
  <linearGradient id="g-purple" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.violet}"/><stop offset="1" stop-color="#1b1035"/></linearGradient>
  <linearGradient id="g-night" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b4f86"/><stop offset="1" stop-color="#020d1c"/></linearGradient>
  <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="8" stdDeviation="14" flood-color="#0f172a" flood-opacity="0.10"/></filter>
  <filter id="white"><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0"/></filter>
</defs>
${inner}
</svg>
`;
}

function save(name, svg) {
  const dir = path.join(ROOT, 'design');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, name), svg, 'utf8');
  console.log(name, Math.round(svg.length / 1024) + ' KB');
}

// ── Brand patterns, read from the identity CSS so they are the real ones ──
let patterns = null, patSeq = 0;
/** A brand pattern (landmark, wave-pro, tree-pro, circle-pro, matrix-all) drawn w wide at x,y. o: op (opacity) */
function PATTERN(name, x, y, w, o = {}) {
  if (!patterns) {
    patterns = {};
    const css = fs.readFileSync(path.join(ROOT, 'public/brand/dhofar-identity.css'), 'utf8');
    for (const m of css.matchAll(/\.dm-pattern-([a-z-]+)\s*\{\s*background-image:\s*url\("data:image\/svg\+xml,([^"]+)"\)/g)) {
      const svg = decodeURIComponent(m[2]);
      const vb = /viewBox='0 0 ([\d.]+) ([\d.]+)'/.exec(svg);
      patterns[m[1]] = { w: +vb[1], h: +vb[2], inner: svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '').replace(/'/g, '"') };
    }
  }
  const pt = patterns[name]; if (!pt) return '';
  const id = 'pat' + (++patSeq), k = w / pt.w;
  return `<g id="pattern-${name}-${patSeq}" transform="translate(${x} ${y}) scale(${k})" opacity="${o.op ?? 0.12}">${pt.inner.replace(/id="lg"/g, `id="${id}"`).replace(/url\(#lg\)/g, `url(#${id})`)}</g>`;
}
const patternSize = name => { PATTERN(name, 0, 0, 1); return patterns[name]; };

/** Simple public header: slim message bar, then menu + search (right), hanging logo (centre), language + sign-in (left) */
function HEADER(W, y = 0, o = {}) {
  const LX = o.lx ?? 120, RX = W - LX, mob = W < 600;
  let s = R(0, y, W, 44, { f: C.teal });
  if (mob) s += I('megaphone', RX - 18, y + 13, 18, C.white) + T(RX - 26, y + 28, 'ثقة: هويتك الرقمية للدخول والتقديم', { s: 11.5, w: 700, f: C.white }) + R(LX, y + 8, 84, 28, { r: 8, f: 'none', s: 'rgba(255,255,255,0.7)' }) + T(LX + 42, y + 27, 'ادخل عبر ثقة', { s: 10.5, w: 700, f: C.white, a: 'middle' });
  else s += I('megaphone', RX - 20, y + 12, 20, C.white) + T(RX - 32, y + 28, '«ثقة» بوابتك للهوية الرقمية الموثوقة لتسجيل الدخول والتقديم على الخدمات البلدية.', { s: 14, w: 700, f: C.white }) +
    R(LX, y + 7, 190, 30, { r: 8, f: 'none', s: 'rgba(255,255,255,0.7)' }) + I('fingerprint', LX + 160, y + 13, 18, C.white) + T(LX + 150, y + 27, 'الدخول عبر ثقة', { s: 13, w: 700, f: C.white }) + I('arrow-left', LX + 14, y + 13, 18, C.white);
  const hy = y + 44, hh = mob ? 60 : 76;
  s += R(0, hy, W, hh, { f: '#fbfcfd' }) + LINE(0, hy + hh, W, hy + hh);
  if (mob) s += I('menu', RX - 22, hy + 19, 22, C.ink) + I('search', RX - 58, hy + 20, 20, C.ink) + I('log-in', LX, hy + 20, 20, C.ink) + T(LX + 36, hy + 35, 'EN', { s: 12.5, w: 700, a: 'start' });
  else s += I('menu', RX - 22, hy + 27, 22, C.ink) + T(RX - 32, hy + 44, 'القائمة', { s: 15.5, w: 500 }) + LINE(RX - 112, hy + 24, RX - 112, hy + 52) + I('search', RX - 146, hy + 28, 20, C.ink) + T(RX - 156, hy + 44, 'ابحث', { s: 15.5, w: 500 }) +
    I('log-in', LX + 132, hy + 28, 20, C.ink) + T(LX + 122, hy + 44, 'تسجيل الدخول', { s: 15.5, w: 500 }) + LINE(LX + 168, hy + 24, LX + 168, hy + 52) + I('globe', LX + 276, hy + 28, 20, C.ink) + T(LX + 266, hy + 44, 'English', { s: 15.5, w: 500 });
  // Hanging logo plate in the centre
  const pw = mob ? 96 : 150, ph = mob ? 70 : 96;
  s += R(W / 2 - pw / 2, hy, pw, ph, { r: 0, f: C.white }) + `<path d="M${W / 2 - pw / 2} ${hy} h${pw} v${ph - 10} a10 10 0 0 1 -10 10 h-${pw - 20} a10 10 0 0 1 -10 -10 z" fill="${C.white}" stroke="${C.line}" filter="url(#shadow)"/>` + LOGO(W / 2 - (mob ? 37 : 58), hy + (mob ? 12 : 13), mob ? 45 : 70);
  return { svg: G('header', s), h: 44 + hh };
}

/** Saves a design file with a title band above the artboard */
function board(file, w, h, inner, num, title, sub, tw) {
  const TOP = 130, bw = tw || w; // tw: width of the screen itself when notes sit beside it
  const band = G('screen-title', R(0, 0, w, TOP, { f: '#e5e7eb' }) + R(bw - 40 - 64, 30, 64, 64, { r: 18, f: C.teal }) + T(bw - 72, 73, num, { s: 26, w: 700, f: C.white, a: 'middle' }) +
    T(bw - 124, 62, title, { s: 30, w: 700 }) + T(bw - 124, 94, sub, { s: 15, f: C.mut }) + T(40, 70, 'بلدية ظفار · البوابة الرقمية الموحدة', { s: 14, w: 700, f: C.mut, a: 'start' }) + T(40, 94, 'Dhofar Municipality portal', { s: 12.5, f: C.faint, a: 'start' }));
  save(file, DOC(w, h + TOP, R(0, 0, w, h + TOP, { f: '#e5e7eb' }) + band + `<g id="artboard" transform="translate(0 ${TOP})">${inner}</g>`, title));
}

module.exports = { PATTERN, patternSize, HEADER, board, C, FONT, R, CIRC, LINE, T, P, I, G, BTN, CHIP, IMG, NOTE, LOGO, LEGEND, DOC, save, wrap, esc };
