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
  return `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${o.s ?? 16}" font-weight="${o.w ?? 400}" fill="${o.f ?? C.ink}" text-anchor="${o.a ?? 'end'}"${o.op != null ? ` opacity="${o.op}"` : ''}${o.ls ? ` letter-spacing="${o.ls}"` : ''}>${hasAr(s) ? '‏' : ''}${esc(s)}${hasAr(s) ? '‏' : ''}</text>`;
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

module.exports = { C, FONT, R, CIRC, LINE, T, P, I, G, BTN, CHIP, IMG, NOTE, LOGO, LEGEND, DOC, save, wrap, esc };
