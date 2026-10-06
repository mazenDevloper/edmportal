const { C, R, CIRC, LINE, T, P, I, G, BTN, CHIP, IMG, LOGO, PATTERN, patternSize, HEADER, board, esc } = require('./lib');

/*
 * 11 Integrated identity board: the /identity/board page (src/app/identity/board/page.tsx) as a design board.
 * Same twenty sections, in the same order, with the values of src/lib/identity/tokens.ts.
 */
const W = 1440, RX = 1336, SB = 220, MR = RX - SB - 32, ML = 104, MW = MR - ML;
const INK = '#0F172A';
let o = '', y = 0, seq = 0;

const uid = p => `${p}-${++seq}`;
const logo = (x, yy, h, extra = '', white = false) => LOGO(x, yy, h, white).replace('id="logo"', `id="${uid('logo')}" ${extra}`);
/** Latin / code text, left-anchored by default */
const M = (x, yy, s, q = {}) => `<text x="${x}" y="${yy}" font-family="Consolas, 'Courier New', monospace" font-size="${q.s ?? 12}" font-weight="${q.w ?? 400}" fill="${q.f ?? C.mut}" text-anchor="${q.a ?? 'start'}" xml:space="preserve">${esc(s)}</text>`;
const card = (x, yy, w, h, title, q = {}) => R(x, yy, w, h, { r: q.r ?? 24, f: q.f ?? C.white, s: q.s ?? C.line }) + (title ? T(x + w - 20, yy + 34, title, { s: 14, w: 700, f: C.mut }) : '');
/** i-th cell of an n-column row laid out from the right */
const cell = (n, gap, i, x1 = MR, w0 = MW) => { const w = (w0 - gap * (n - 1)) / n; return { w, x: x1 - (i % n + 1) * w - (i % n) * gap, row: Math.floor(i / n) }; };
const head = (id, title, desc) => { o += G(`${id}-heading`, T(MR, y + 28, title, { s: 30, w: 700 }) + P(MR, y + 58, desc, 124, { s: 15, f: C.mut, lh: 24 }).svg); y += 88; };
const add = (id, svg, h) => { o += G(id, svg); y += h + 64; };
/** Row of pills from the right; returns svg */
const pills = (x, yy, items, q = {}) => { let s = ''; items.forEach((it, i) => { const lab = Array.isArray(it) ? it[0] : it, on = q.active === i, c = CHIP(x, yy, lab, { h: q.h ?? 36, s: q.s ?? 13.5, f: Array.isArray(it) ? it[1] : on ? C.ink : C.white, c: Array.isArray(it) ? it[2] : on ? C.white : '#475569', stroke: Array.isArray(it) || on ? undefined : C.line }); s += c.svg; x -= c.w + (q.gap ?? 8); }); return s; };

const rgb = hex => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const lum = hex => { const ch = c => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; }; const [r, g, b] = rgb(hex); return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b); };
const ratio = (a, b) => { const [x, z] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (z + 0.05); };
const rating = r => (r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : r >= 3 ? 'AA Large' : 'Fail');
const rateChip = (x, yy, r) => { const k = rating(r), col = k === 'Fail' ? ['#fee2e2', '#b91c1c'] : k === 'AA Large' ? ['#fef3c7', '#92400e'] : ['#d1fae5', '#047857']; return CHIP(x, yy, `${r.toFixed(1)}:1 ${k}`, { h: 18, s: 10, f: col[0], c: col[1] }); };

const BRAND = [['#03CFCB', '--primary', 'التيل الحيوي', 'اللون الأساسي للتفاعل والأزرار', INK], ['#470D67', '--secondary', 'الأرجواني الملكي', 'العلامة والعناوين الرسمية', '#fff'], ['#008E91', '--dm-teal-dark', 'تيل داكن', 'تدرجات وحالات التحويم', '#fff'],
  ['#005751', '--dm-teal-deep', 'تيل عميق', 'نصوص على خلفيات فاتحة', '#fff'], ['#A187B2', '--dm-purple-light', 'أرجواني فاتح', 'عناصر ثانوية وزخارف', INK], ['#BCA3CC', '--dm-purple-soft', 'أرجواني ناعم', 'خلفيات هادئة', INK]];
const NEUTRAL = [['#0F172A', '--dm-ink', 'حبر', 'النصوص الأساسية', '#fff'], ['#475569', '--dm-slate', 'رمادي أردوازي', 'نصوص ثانوية', '#fff'], ['#E2E8F0', '--dm-mist', 'ضباب', 'الحدود والفواصل', INK], ['#F8FAFC', '--dm-cloud', 'غيم', 'خلفية الصفحات', INK]];
const STATUS = [['#059669', '--dm-success', 'نجاح', 'الموافقات والإنجاز', '#fff'], ['#D97706', '--dm-warning', 'تنبيه', 'الاشتراطات والتنبيهات', '#fff'], ['#DC2626', '--dm-danger', 'خطر', 'الرفض والأخطاء', '#fff'], ['#2563EB', '--dm-info', 'معلومة', 'الإرشاد والمعلومات', '#fff']];
const ALL = [...BRAND, ...NEUTRAL, ...STATUS];

// ───────────────────────── Top: header, hero, section list ─────────────────────────
const hd = HEADER(W, 0); y = hd.h;
{
  const hh = 300, ps = patternSize('landmark'), pw = hh * ps.w / ps.h;
  o += G('hero', `<linearGradient id="g-board-hero" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#470D67"/><stop offset="1" stop-color="#2a0640"/></linearGradient>` + R(0, y, W, hh, { f: 'url(#g-board-hero)' }) + PATTERN('landmark', W / 2 - pw / 2, y, pw, { op: 0.10 }) +
    T(RX, y + 74, 'نظام التصميم', { s: 12, w: 700, f: C.aqua, ls: 1.5 }) + T(RX, y + 144, 'لوحة الهوية المتكاملة', { s: 58, w: 700, f: C.white }) +
    P(RX, y + 190, 'مرجع واحد لألوان بلدية ظفار وخطوطها وأنماطها ومكوّناتها وكتل الصفحات وقوالبها — كل ما يظهر هنا هو نفسه المستخدم في باني الصفحات والبوابة.', 82, { s: 18, f: '#e0d3e8' }).svg +
    BTN(ML, y + 216, 150, 42, 'باني الصفحات', { f: C.aqua, c: C.ink, r: 12, s: 14, icon: 'layout-template', is: 16 }) + BTN(ML + 158, y + 216, 96, 42, 'JSON', { f: 'none', stroke: 'rgba(255,255,255,0.4)', r: 12, s: 14, icon: 'download', is: 16 }) + BTN(ML + 262, y + 216, 88, 42, 'CSS', { f: C.white, c: C.purple, r: 12, s: 14, icon: 'download', is: 16 }));
  y += hh + 44;
}
{
  const groups = [['الأساسيات', [['stamp', 'الشعار'], ['palette', 'الألوان'], ['contrast', 'فاحص التباين'], ['type', 'الطباعة'], ['ruler', 'المسافات والزوايا'], ['layout-grid', 'الشبكة والتجاوب'], ['grid-3x3', 'الأنماط الزخرفية'], ['shapes', 'الأيقونات'], ['wind', 'الحركة']]],
    ['المكونات والأنماط', [['boxes', 'المكونات الأساسية'], ['workflow', 'أنماط الخدمات'], ['message-square-warning', 'حالات الواجهة'], ['table-2', 'عرض البيانات'], ['bell-ring', 'قوالب الإشعارات']]],
    ['الصفحات', [['layout-template', 'مكتبة الكتل'], ['sparkles', 'قوالب الصفحات'], ['panel-top', 'الترويسة والتذييل']]],
    ['المحتوى والنفاذ', [['pen-line', 'أسلوب الكتابة'], ['accessibility', 'معايير النفاذ'], ['book-a', 'المسرد']]]];
  let s = '', ny = y, first = true;
  groups.forEach(g => {
    s += T(RX - 12, ny + 12, g[0], { s: 11, w: 700, f: C.faint, ls: 1 }); ny += 24;
    g[1].forEach(it => { s += (first ? R(RX - SB, ny, SB, 36, { r: 12, f: C.purple }) : '') + I(it[0], RX - 12 - 15, ny + 10.5, 15, first ? C.white : '#475569') + T(RX - 36, ny + 23, it[1], { s: 14, w: 700, f: first ? C.white : '#475569' }); first = false; ny += 38; });
    ny += 16;
  });
  o += G('sections-nav', s);
}

// ───────────────────────── 1 Logo ─────────────────────────
head('logo', 'الشعار', 'الاستخدام الصحيح لشعار بلدية ظفار: النسخ المعتمدة، والمساحة الآمنة، والحد الأدنى للحجم، وما يجب تجنبه.');
{
  const lw = MW * 1.2 / 2.2 - 8, rw = MW - lw - 16, lh = 380;
  let s = `<filter id="gray"><feColorMatrix type="saturate" values="0"/></filter><filter id="hue"><feColorMatrix type="hueRotate" values="160"/><feColorMatrix type="saturate" values="3"/></filter><filter id="fx"><feDropShadow dx="6" dy="6" stdDeviation="0" flood-color="#f59e0b"/></filter>`;
  s += card(MR - lw, y, lw, lh, 'المساحة الآمنة والحد الأدنى') + R(MR - lw + 20, y + 52, lw - 40, 210, { r: 16, f: '#f8fafc' });
  const bx = MR - lw / 2 - 98, by = y + 85;
  s += R(bx, by, 196, 144, { f: 'none', s: C.aqua, sw: 2, dash: '7 6' }) + logo(bx + 32, by + 32, 80) + [[bx + 98, by], [bx + 98, by + 144], [bx, by + 72], [bx + 196, by + 72]].map(p => R(p[0] - 12, p[1] - 12, 24, 24, { r: 4, f: '#b3f1ef' }) + T(p[0], p[1] + 4, 'x', { s: 10, w: 700, f: C.teal, a: 'middle' })).join('');
  [['x', 'المساحة الآمنة = ارتفاع الحرف في الشعار من كل جهة'], ['32px', 'أصغر ارتفاع رقمي للشعار الكامل'], ['24px', 'أصغر حجم للرمز (الأيقونة) منفرداً']].forEach((it, i) => { const c = cell(3, 8, i, MR - 20, lw - 40); s += R(c.x, y + 276, c.w, 84, { r: 12, f: '#f8fafc' }) + T(c.x + c.w - 12, y + 302, it[0], { s: 14, w: 700 }) + P(c.x + c.w - 12, y + 322, it[1], 22, { s: 11, w: 700, f: '#475569', lh: 17 }).svg; });
  s += card(ML, y, rw, lh, 'النسخ المعتمدة');
  [['#ffffff', 'على خلفية فاتحة', '', C.line, '#475569'], ['#005751', 'على اللون الأساسي', 'filter="url(#white)"', '', '#e2e8f0'], ['#020617', 'على خلفية داكنة', 'filter="url(#white)"', '', '#e2e8f0'], ['#f1f5f9', 'أحادي اللون', 'filter="url(#gray)"', C.line, '#475569']].forEach((v, i) => {
    const c = cell(2, 12, i, ML + rw - 20, rw - 40), h = 150, yy = y + 52 + c.row * (h + 12);
    s += R(c.x, yy, c.w, h, { r: 16, f: v[0], s: v[3] || undefined }) + logo(c.x + c.w / 2 - 46, yy + 28, 56, v[2]) + T(c.x + c.w / 2, yy + 126, v[1], { s: 11, w: 700, f: v[4], a: 'middle' });
  });
  const dy = y + lh + 16;
  ['لا تمدّد الشعار', 'لا تغيّر ألوانه', 'لا تُدِره', 'لا تضف ظلالاً'].forEach((d, i) => {
    const c = cell(4, 12, i), cx = c.x + c.w / 2, lx = cx - 40, ly = dy + 26;
    const extra = [`transform="translate(${cx} 0) scale(1.5 1) translate(${-cx} 0)"`, 'filter="url(#hue)"', `transform="rotate(-18 ${lx + 40} ${ly + 24})"`, 'filter="url(#fx)"'][i];
    s += R(c.x, dy, c.w, 130, { r: 16, f: C.white, s: '#fee2e2' }) + logo(lx, ly, 48, extra) + I('square-x', cx + 62, dy + 14, 20, '#ef4444') + T(cx, dy + 108, d, { s: 12, w: 700, f: '#b91c1c', a: 'middle' });
  });
  add('logo-section', s, lh + 16 + 130);
}

// ───────────────────────── 2 Colour ─────────────────────────
head('colors', 'الألوان', 'انقر على اللون لنسخ قيمته. الشارات تبيّن تباين اللون كنص على الأبيض وعلى الحبر وفق WCAG 2.2.');
{
  let s = '', yy = y;
  for (const [title, list] of [['ألوان العلامة', BRAND], ['الألوان المحايدة', NEUTRAL], ['ألوان الحالات', STATUS]]) {
    s += T(MR, yy + 14, title, { s: 14, w: 700, f: C.faint, ls: 1 }); yy += 30;
    list.forEach((c, i) => {
      const q = cell(3, 16, i), x = q.x, w = q.w, cy = yy + q.row * 266;
      let b = R(x, cy, w, 250, { r: 24, f: C.white, s: C.line }) + `<path d="M${x} ${cy + 24} a24 24 0 0 1 24 -24 h${w - 48} a24 24 0 0 1 24 24 v88 h-${w} z" fill="${c[0]}"/>` + M(x + w - 16, cy + 32, c[1], { s: 12, w: 700, f: c[4], a: 'end' }) + M(x + w - 16, cy + 94, c[0], { s: 15, w: 700, f: c[4], a: 'end' }) +
        T(x + w - 16, cy + 142, c[2], { s: 16, w: 700 }) + T(x + w - 16, cy + 164, c[3], { s: 12, f: C.mut });
      let px = x + w - 16; ['HSL', 'Tailwind', 'CSS var'].forEach(t => { const tw = t.length * 6.4 + 12; b += R(px - tw, cy + 180, tw, 18, { r: 4, f: C.soft }) + M(px - tw / 2, cy + 193, t, { s: 10, w: 700, a: 'middle' }); px -= tw + 6; });
      const a = rateChip(x + w - 34, cy + 214, ratio(c[0], '#ffffff')); b += CIRC(x + w - 22, cy + 223, 6, { f: C.white, s: C.line }) + a.svg;
      const z = rateChip(x + w - 34 - a.w - 26, cy + 214, ratio(c[0], INK)); b += CIRC(x + w - 22 - a.w - 26, cy + 223, 6, { f: INK }) + z.svg;
      s += G(`color-${c[0].slice(1)}`, b);
    });
    yy += Math.ceil(list.length / 3) * 266 + 16;
  }
  s += T(MR, yy + 14, 'التدرجات', { s: 14, w: 700, f: C.faint, ls: 1 }); yy += 30;
  s += `<linearGradient id="g-b-primary" x1="0" x2="1"><stop offset="0" stop-color="#03CFCB"/><stop offset="1" stop-color="#008E91"/></linearGradient><linearGradient id="g-b-royal" x1="0" x2="1"><stop offset="0" stop-color="#470D67"/><stop offset="1" stop-color="#6b149b"/></linearGradient>`;
  [['التيل الأساسي', '.dm-gradient-primary', 'g-b-primary'], ['الملكي', '.dm-gradient-royal', 'g-b-royal']].forEach((g, i) => { const c = cell(2, 16, i); s += R(c.x, yy, c.w, 96, { r: 24, f: `url(#${g[2]})` }) + T(c.x + c.w - 20, yy + 76, g[0], { s: 16, w: 700, f: C.white }) + M(c.x + 20, yy + 76, g[1], { f: '#e2e8f0' }); });
  add('colors-section', s, yy + 96 - y);
}

// ───────────────────────── 3 Contrast checker ─────────────────────────
head('contrast', 'فاحص التباين', 'اختبر أي تركيبة ألوان قبل استخدامها في صفحة أو مكوّن.');
{
  const h = 420, cx = MR - 24; let s = card(ML, y, MW, h);
  [['لون النص', '#470D67', 1], ['لون الخلفية', '#FFFFFF', -1]].forEach((f, i) => {
    const fy = y + 28 + i * 136;
    s += T(cx, fy + 12, f[0], { s: 12, w: 700, f: C.mut }) + R(cx - 48, fy + 24, 48, 40, { r: 8, f: f[1], s: C.line }) + R(cx - 320, fy + 24, 264, 40, { r: 12, f: C.white, s: C.line }) + M(cx - 308, fy + 49, f[1], { s: 14, f: C.ink });
    ALL.forEach((c, k) => { s += CIRC(cx - 12 - (k % 12) * 27, fy + 86 + Math.floor(k / 12) * 26, 11, { f: c[0], s: k === f[2] ? INK : C.line, sw: k === f[2] ? 2.5 : 1 }); });
  });
  s += R(cx - 70, y + 304, 70, 36, { r: 12, f: C.white, s: C.line }) + T(cx - 35, y + 327, 'تبديل', { s: 13, w: 700, a: 'middle' });
  const pw = MW - 320 - 72, px = ML + 24;
  s += R(px, y + 28, pw, 170, { r: 16, f: C.white, s: C.line }) + T(px + pw - 28, y + 78, 'بلدية ظفار — خدمات أسرع', { s: 28, w: 700, f: C.purple }) + T(px + pw - 28, y + 112, 'هذا نص تجريبي بحجم عادي لاختبار سهولة القراءة على هذه الخلفية.', { s: 15, w: 500, f: C.purple }) +
    R(px + pw - 28 - 56, y + 134, 56, 38, { r: 12, f: 'none', s: C.purple, sw: 2 }) + T(px + pw - 56, y + 158, 'زر', { s: 14, w: 700, f: C.purple, a: 'middle' });
  s += T(px + pw - 34, y + 252, '13.80', { s: 46, w: 700 }) + T(px + pw - 30, y + 252, ':1', { s: 20, f: C.faint, a: 'start' }) + rateChip(px + pw - 190, y + 232, 13.8).svg;
  ['نص عادي AA (4.5:1)', 'نص عادي AAA (7:1)', 'نص كبير AA (3:1)', 'نص كبير AAA (4.5:1)', 'عناصر الواجهة (3:1)'].forEach((t, i) => { const c = cell(2, 8, i, px + pw, pw), yy = y + 276 + c.row * 46; s += R(c.x, yy, c.w, 38, { r: 12, f: '#ecfdf5' }) + I('circle-check', c.x + c.w - 28, yy + 11, 16, '#047857') + T(c.x + c.w - 36, yy + 24, t, { s: 13.5, w: 700, f: '#047857' }); });
  add('contrast-section', s, h);
}

// ───────────────────────── 4 Typography ─────────────────────────
head('type', 'الطباعة', 'خط Readex Pro للعربية والإنجليزية. اكتب نصك لمعاينته بكل المقاسات.');
{
  const rows = [['عرض', 64, 900, 1.05, 'عناوين الصفحات الرئيسية', 56], ['عنوان 1', 48, 900, 1.1, 'عنوان الصفحة', 48], ['عنوان 2', 36, 800, 1.2, 'عناوين الأقسام', 36], ['عنوان 3', 24, 700, 1.3, 'عناوين البطاقات', 24], ['نص كبير', 20, 400, 1.8, 'المقدمات', 20], ['نص', 16, 400, 1.8, 'النصوص العامة', 16], ['تعليق', 12, 700, 1.5, 'الوسوم والملاحظات', 12]];
  let s = R(ML, y - 76, 288, 40, { r: 12, f: C.white, s: C.line }) + T(ML + 272, y - 51, 'اكتب نصاً للمعاينة…', { s: 13.5, f: C.faint }), yy = y;
  rows.forEach((r, i) => {
    const h = Math.max(84, r[5] + 46);
    s += (i ? LINE(ML, yy, MR, yy) : '') + T(MR - 20, yy + h / 2 - 12, r[0], { s: 16, w: 700 }) + M(MR - 20, yy + h / 2 + 6, `${r[1]}px · ${r[2]} · ${r[3]}`, { s: 12, w: 700, f: C.faint, a: 'end' }) + T(MR - 20, yy + h / 2 + 24, r[4], { s: 12, f: C.mut }) +
      T(MR - 216, yy + h / 2 + r[5] * 0.34, i < 4 ? 'خدمات بلدية ظفار' : 'نص توضيحي لقراءة مريحة وواضحة', { s: r[5], w: Math.min(r[2], 700) }) + I('copy', ML + 62, yy + h / 2 - 7, 13, C.text) + T(ML + 20, yy + h / 2 + 4, 'CSS', { s: 12, w: 700, f: C.text, a: 'start' });
    yy += h;
  });
  add('type-section', R(ML, y, MW, yy - y, { r: 24, f: C.white, s: C.line }) + s, yy - y);
}

// ───────────────────────── 5 Spacing, radii, shadows ─────────────────────────
head('layout', 'المسافات والزوايا والظلال', 'مقياس مسافات من مضاعفات 4px، وزوايا ثابتة لكل نوع من العناصر.');
{
  const h = 396, a = cell(2, 24, 0), b = cell(2, 24, 1); let s = card(a.x, y, a.w, h) + card(b.x, y, b.w, h);
  [4, 8, 12, 16, 24, 32, 48, 64, 96].forEach((v, i) => { const yy = y + 28 + i * 36; s += M(a.x + a.w - 24, yy + 13, `${v}px`, { w: 700, a: 'end' }) + R(a.x + a.w - 86 - v * 2.5, yy, v * 2.5, 16, { r: 4, f: C.aqua, op: 0.75 }) + M(a.x + a.w - 98 - v * 2.5, yy + 12, `--dm-space-${i + 1}`, { s: 10, f: C.faint, a: 'end' }); });
  [['متوسط · 12px', 'حقول الإدخال', 12], ['كبير · 20px', 'الأزرار والبطاقات الصغيرة', 20], ['واسع · 32px', 'البطاقات والأقسام', 32], ['كبسولة · ∞', 'الوسوم والمفاتيح', 40]].forEach((r, i) => {
    const c = cell(2, 16, i, b.x + b.w - 24, b.w - 48), yy = y + 24 + c.row * 138, cx = c.x + c.w / 2;
    s += R(cx - 40, yy, 80, 80, { r: r[2], f: '#ede7f0', s: C.purple, sw: 2 }) + T(cx, yy + 102, r[0], { s: 14, w: 700, f: '#1e293b', a: 'middle' }) + T(cx, yy + 120, r[1], { s: 11, f: C.mut, a: 'middle' });
  });
  ['منخفض', 'متوسط', 'مرتفع'].forEach((t, i) => { const c = cell(3, 12, i, b.x + b.w - 24, b.w - 48); s += `<rect x="${c.x}" y="${y + 318}" width="${c.w}" height="56" rx="16" fill="#fff" stroke="#f1f5f9" filter="url(#sh-${i})"/>` + T(c.x + c.w / 2, y + 351, t, { s: 12, w: 700, f: '#475569', a: 'middle' }); });
  s = `<filter id="sh-0" x="-20%" y="-30%" width="140%" height="180%"><feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#0f172a" flood-opacity="0.08"/></filter><filter id="sh-1" x="-20%" y="-30%" width="140%" height="200%"><feDropShadow dx="0" dy="10" stdDeviation="9" flood-color="#0f172a" flood-opacity="0.12"/></filter><filter id="sh-2" x="-30%" y="-40%" width="160%" height="260%"><feDropShadow dx="0" dy="16" stdDeviation="16" flood-color="#000" flood-opacity="0.2"/></filter>` + s;
  add('layout-section', s, h);
}

// ───────────────────────── 6 Grid & breakpoints ─────────────────────────
head('grid', 'الشبكة ونقاط التجاوب', 'شبكة من 12 عموداً على الشاشات الكبيرة و4 أعمدة على الجوال، وعرض أقصى للمحتوى 1280px.');
{
  const h = 290, lw = MW - 320 - 16; let s = card(MR - lw, y, lw, h, 'الشبكة الحالية: حاسوب (12 أعمدة)') + card(ML, y, 320, h, 'نقاط التجاوب');
  for (let i = 0; i < 12; i++) { const c = cell(12, 8, i, MR - 20, lw - 40); s += R(c.x, y + 56, c.w, 160, { r: 8, f: '#d5f7f6', s: '#9aebe9' }) + T(c.x + c.w / 2, y + 208, i + 1, { s: 10, w: 700, f: C.teal, a: 'middle' }); }
  s += T(MR - 20, y + 254, 'غيّر عرض النافذة لرؤية الشبكة تتكيف. · 1440px', { s: 12, w: 700, f: C.mut });
  [['الجوال', 'base', '≥0px · 4col · 16px'], ['جوال كبير', 'sm', '≥640px · 4col · 16px'], ['لوحي', 'md', '≥768px · 8col · 24px'], ['حاسوب', 'lg', '≥1024px · 12col · 24px'], ['شاشة عريضة', 'xl', '≥1280px · 12col · 32px']].forEach((b, i) => {
    const yy = y + 54 + i * 44, on = i === 3;
    s += (on ? R(ML + 16, yy, 288, 40, { r: 12, f: C.teal }) : '') + T(ML + 292, yy + 25, b[0], { s: 14, w: 700, f: on ? C.white : '#334155' }) + M(ML + 292 - b[0].length * 8.2 - 12, yy + 25, b[1], { a: 'end', f: on ? '#cfe9e7' : C.faint }) + M(ML + 28, yy + 25, b[2], { f: on ? C.white : '#334155' });
  });
  add('grid-section', s, h);
}

// ───────────────────────── 7 Patterns ─────────────────────────
head('patterns', 'الأنماط الزخرفية', 'زخارف مستوحاة من معالم ظفار، متاحة كخلفية لأي كتلة في باني الصفحات.');
{
  let s = '';
  [['landmark', 'المعالم', 'ترويسات الصفحات الرسمية'], ['wave-pro', 'الأمواج', 'الأشرطة والبنرات'], ['tree-pro', 'الشجرة العمانية', 'البيئة والزراعة'], ['circle-pro', 'الدوائر', 'البطاقات والإحصائيات'], ['matrix-all', 'النمط الشامل', 'الخلفيات الكبيرة']].forEach((p, i) => {
    const c = cell(3, 16, i), yy = y + c.row * 256, sz = patternSize(p[0]), id = uid('clip-pat'), tw = p[0] === 'landmark' ? 144 * sz.w / sz.h : c.w / 2.4;
    const tiles = p[0] === 'landmark' ? PATTERN(p[0], c.x + c.w / 2 - tw / 2, yy, tw, { op: 0.3 }) : Array.from({ length: 9 }, (_, k) => PATTERN(p[0], c.x - 10 + (k % 3) * tw, yy - 6 + Math.floor(k / 3) * tw * sz.h / sz.w, tw, { op: 0.3 })).join('');
    s += G(`pattern-${p[0]}`, R(c.x, yy, c.w, 240, { r: 24, f: C.white, s: C.line }) + `<clipPath id="${id}"><path d="M${c.x} ${yy + 24} a24 24 0 0 1 24 -24 h${c.w - 48} a24 24 0 0 1 24 24 v120 h-${c.w} z"/></clipPath><g clip-path="url(#${id})">` + R(c.x, yy, c.w, 144, { f: C.purple }) + tiles + '</g>' +
      T(c.x + c.w - 16, yy + 176, p[1], { s: 16, w: 700 }) + T(c.x + c.w - 16, yy + 198, p[2], { s: 12, f: C.mut }) + M(c.x + c.w - 16, yy + 220, `.dm-pattern-${p[0]}`, { s: 11, f: C.faint, a: 'end' }));
  });
  add('patterns-section', s, 2 * 256 - 16);
}

// ───────────────────────── 8 Icons ─────────────────────────
head('icons', 'الأيقونات', 'مكتبة Lucide بخط 2px. هذه المجموعة المعتمدة لأيقونات الخدمات؛ انقر لنسخ الاسم.');
{
  const icons = [['file-text', 'FileText'], ['file-check', 'FileCheck'], ['file-pen-line', 'FileSignature'], ['clipboard-list', 'ClipboardList'], ['stamp', 'Stamp'], ['badge-check', 'BadgeCheck'], ['landmark', 'Landmark'], ['building', 'Building'], ['building-2', 'Building2'], ['house', 'Home'],
    ['construction', 'Construction'], ['hard-hat', 'HardHat'], ['hammer', 'Hammer'], ['ruler', 'Ruler'], ['map-pin', 'MapPin'], ['map', 'Map'], ['signpost', 'Signpost'], ['traffic-cone', 'TrafficCone'], ['car-front', 'CarFront'], ['truck', 'Truck'],
    ['lightbulb', 'Lightbulb'], ['zap', 'Zap'], ['droplets', 'Droplets'], ['waves', 'Waves'], ['trash-2', 'Trash2'], ['recycle', 'Recycle'], ['leaf', 'Leaf'], ['trees', 'Trees'], ['flask-conical', 'FlaskConical'], ['microscope', 'Microscope'],
    ['beef', 'Beef'], ['bone', 'Bone'], ['utensils', 'Utensils'], ['store', 'Store'], ['shopping-bag', 'ShoppingBag'], ['ticket', 'Ticket'], ['tent', 'Tent'], ['party-popper', 'PartyPopper'], ['megaphone', 'Megaphone'], ['presentation', 'Presentation'],
    ['graduation-cap', 'GraduationCap'], ['users', 'Users'], ['user-check', 'UserCheck'], ['handshake', 'Handshake'], ['scale', 'Scale'], ['gavel', 'Gavel'], ['wallet', 'Wallet'], ['badge-cent', 'BadgeCent'], ['receipt', 'Receipt'], ['credit-card', 'CreditCard'],
    ['phone', 'Phone'], ['mail', 'Mail'], ['message-square', 'MessageSquare'], ['circle-help', 'HelpCircle'], ['globe', 'Globe'], ['link', 'Link'], ['shield-check', 'ShieldCheck'], ['clock', 'Clock'], ['calendar', 'Calendar'], ['sparkles', 'Sparkles']];
  let s = R(ML, y - 76, 224, 40, { r: 12, f: C.white, s: C.line }) + I('search', ML + 196, y - 63, 15, C.faint) + T(ML + 186, y - 51, 'ابحث…', { s: 13.5, f: C.faint });
  icons.forEach((ic, i) => { const c = cell(10, 8, i), yy = y + c.row * (c.w + 8); s += G(`icon-${ic[1]}`, R(c.x, yy, c.w, c.w, { r: 16, f: C.white, s: C.line }) + I(ic[0], c.x + c.w / 2 - 12, yy + c.w / 2 - 20, 24, '#334155') + M(c.x + c.w / 2, yy + c.w / 2 + 24, ic[1], { s: 9, f: C.faint, a: 'middle' })); });
  const cw = cell(10, 8, 0).w; add('icons-section', s, 6 * (cw + 8) - 8);
}

// ───────────────────────── 9 Motion ─────────────────────────
head('motion', 'الحركة', 'حركة هادئة وهادفة توضح التغيير ولا تشتت. تتوقف كل الحركات عند تفعيل «إيقاف الحركة» أو تفضيل تقليل الحركة في النظام.');
{
  let s = BTN(ML, y - 76, 140, 40, 'تشغيل العرض', { f: C.teal, r: 12, s: 13.5, icon: 'play', is: 14 });
  [['instant · 100ms', 'linear', 'تغيّر الحالة (تحويم، تركيز)'], ['fast · 200ms', 'cubic-bezier(0.2, 0, 0, 1)', 'القوائم والتلميحات'], ['base · 300ms', 'cubic-bezier(0.2, 0, 0, 1)', 'النوافذ واللوحات الجانبية'], ['slow · 500ms', 'cubic-bezier(0.3, 0, 0, 1)', 'ظهور الأقسام عند التمرير']].forEach((m, i) => {
    const c = cell(2, 12, i), yy = y + c.row * 126;
    s += R(c.x, yy, c.w, 114, { r: 16, f: C.white, s: C.line }) + M(c.x + c.w - 16, yy + 32, m[0], { s: 15, w: 700, f: C.ink, a: 'end' }).replace('Consolas', 'Readex Pro') + M(c.x + 16, yy + 30, m[1], { s: 10, f: C.faint }) + R(c.x + 16, yy + 48, c.w - 32, 12, { r: 6, f: C.soft }) + R(c.x + c.w - 16 - (c.w - 32) / 4, yy + 48, (c.w - 32) / 4, 12, { r: 6, f: C.aqua }) + T(c.x + c.w - 16, yy + 90, m[2], { s: 12, w: 700, f: C.mut });
  });
  add('motion-section', s, 2 * 126 - 12);
}

// ───────────────────────── 10 Core components ─────────────────────────
head('components', 'المكونات الأساسية', 'المكونات الحية المستخدمة في البوابة، بحالاتها المختلفة.');
{
  const a = cell(2, 16, 0), b = cell(2, 16, 1), r1 = 150, r2 = 290, r3 = 150, y2 = y + r1 + 16, y3 = y2 + r2 + 16, ax = a.x + a.w - 20, bx = b.x + b.w - 20;
  let s = card(a.x, y, a.w, r1, 'الأزرار') + card(b.x, y, b.w, r1, 'حالات الطلب') + card(a.x, y2, a.w, r2, 'حقول الإدخال') + card(b.x, y2, b.w, r2, 'التنبيهات') + card(a.x, y3, a.w, r3, 'بطاقة خدمة') + card(b.x, y3, b.w, r3, 'مؤشر الخطوات');
  let x = ax;
  [['أساسي', 'url(#g-b-primary)', C.ink], ['ثانوي', C.purple, C.white], ['محدد', C.white, C.ink, C.line], ['شفاف', 'none', C.ink], ['حذف', '#ef4444', C.white], ['معطل', '#9be9e7', '#5b7f7e']].forEach(t => { const w = t[0].length * 9 + 34; s += R(x - w, y + 56, w, 40, { r: 12, f: t[1], s: t[3] }) + T(x - w / 2, y + 81, t[0], { s: 14, w: 700, f: t[2], a: 'middle' }); x -= w + 8; });
  s += pills(bx, y + 54, [['قيد الانتظار', '#f1f5f9', '#334155'], ['قيد المراجعة', '#e0f2fe', '#0369a1'], ['مطلوب معلومات', '#fef3c7', '#92400e']], { h: 26, s: 12 }) + pills(bx, y + 90, [['معتمد', '#d1fae5', '#047857'], ['مرفوض', '#fee2e2', '#b91c1c']], { h: 26, s: 12 });
  s += T(ax, y2 + 68, 'رقم السجل التجاري', { s: 12, w: 700, f: '#475569' }) + R(a.x + 20, y2 + 78, a.w - 40, 44, { r: 12, f: C.white, s: C.line }) + M(a.x + 34, y2 + 105, '1234567', { s: 14, f: C.faint }) +
    T(ax, y2 + 148, 'البريد الإلكتروني', { s: 12, w: 700, f: '#475569' }) + R(a.x + 20, y2 + 158, a.w - 40, 44, { r: 12, f: C.white, s: '#f87171' }) + M(a.x + 34, y2 + 185, 'name@', { s: 14, f: C.ink }) + T(ax, y2 + 222, 'أدخل بريداً صحيحاً.', { s: 12, w: 700, f: '#dc2626' }) +
    T(ax, y2 + 262, 'إشعارات الرسائل النصية', { s: 14, w: 700, f: '#334155' }) + R(a.x + 20, y2 + 246, 44, 24, { r: 12, f: C.aqua }) + CIRC(a.x + 32, y2 + 258, 10, { f: C.white });
  [['info', 'سيتم جلب بياناتك من ثقة تلقائياً.', '#eff6ff', '#bfdbfe', '#1e40af'], ['triangle-alert', 'تأكد من صلاحية السجل التجاري.', '#fffbeb', '#fde68a', '#92400e'], ['circle-check', 'تم تقديم الطلب بنجاح.', '#ecfdf5', '#a7f3d0', '#065f46']].forEach((n, i) => { const yy = y2 + 56 + i * 54; s += R(b.x + 20, yy, b.w - 40, 46, { r: 12, f: n[2], s: n[3] }) + I(n[0], bx - 30, yy + 15, 16, n[4]) + T(bx - 40, yy + 28, n[1], { s: 14, w: 700, f: n[4] }); });
  s += R(a.x + 20, y3 + 52, a.w - 40, 80, { r: 16, f: C.white, s: C.soft }) + R(ax - 64, y3 + 68, 48, 48, { r: 16, f: '#d5f7f6' }) + I('signpost', ax - 51, y3 + 81, 22, C.teal) + T(ax - 80, y3 + 88, 'ترخيص اللوحات الإرشادية', { s: 15.5, w: 700 }) + T(ax - 80, y3 + 110, '3 أيام عمل · 10 ر.ع', { s: 12, w: 700, f: C.mut }) + I('arrow-up-left', a.x + 36, y3 + 83, 18, C.faint);
  ['الشروط', 'المستندات', 'النموذج', 'الإرسال'].forEach((st, i) => { const c = cell(4, 8, i, bx, b.w - 40), cx = c.x + c.w - 14; s += CIRC(cx, y3 + 92, 14, { f: i === 0 ? '#10b981' : i === 1 ? C.purple : C.soft }) + (i === 0 ? I('check', cx - 7, y3 + 85, 14, C.white) : T(cx, y3 + 96, i + 1, { s: 12, w: 700, f: i === 1 ? C.white : C.faint, a: 'middle' })) + T(cx - 22, y3 + 96, st, { s: 12, w: 700, f: i === 1 ? C.ink : C.faint }); });
  add('components-section', s, r1 + r2 + r3 + 32);
}

// ───────────────────────── 11 Service patterns ─────────────────────────
head('service-ux', 'أنماط الخدمات', 'مكونات مشتركة مستخرجة من مسارات عمل الخدمات الثماني عشرة في وثيقة متطلبات الأعمال.');
{
  const a = cell(2, 16, 0), b = cell(2, 16, 1), h1 = 440, h2 = 330, y2 = y + h1 + 16, ax = a.x + a.w - 20, bx = b.x + b.w - 20;
  let s = card(a.x, y, a.w, h1, 'الخط الزمني لحالة الطلب');
  [['file-text', 'تم تقديم الطلب', 'مقدم الطلب · 09:12', '#10b981', C.white], ['file-search', 'قيد المراجعة', 'المهندس / المفتش · 10:40', '#10b981', C.white], ['message-square', 'مطلوب معلومات إضافية', 'المهندس / المفتش · 11:05', '#fbbf24', C.ink], ['badge-check', 'بانتظار اعتماد رئيس الدائرة', 'رئيس الدائرة · —', C.teal, C.white], ['shield-check', 'إصدار الترخيص الموقّع رقمياً', 'النظام · —', C.soft, C.faint]].forEach((t, i) => {
    const yy = y + 64 + i * 72, cx = ax - 24;
    s += (i < 4 ? LINE(cx, yy + 36, cx, yy + 72, { s: C.line, sw: 2 }) : '') + (i === 3 ? CIRC(cx, yy + 18, 22, { f: '#b3f1ef' }) : '') + CIRC(cx, yy + 18, 18, { f: t[3] }) + I(t[0], cx - 8, yy + 10, 16, t[4]) + T(cx - 32, yy + 16, t[1], { s: 14, w: 700, f: i === 4 ? C.faint : C.ink }) + T(cx - 32, yy + 36, t[2], { s: 12, w: 700, f: C.mut });
  });
  const hA = 264, hB = h1 - hA - 16;
  s += card(b.x, y, b.w, hA, 'البيانات المرتبطة (لا مرفقات)');
  const c1 = cell(2, 12, 0, bx, b.w - 40), c2 = cell(2, 12, 1, bx, b.w - 40);
  s += R(c1.x, y + 54, c1.w, 110, { r: 16, f: 'url(#g-brand)' }) + I('fingerprint', c1.x + c1.w - 30, y + 68, 14, '#d5efed') + T(c1.x + c1.w - 38, y + 80, 'من ثقة', { s: 12, w: 700, f: '#d5efed' }) + I('badge-check', c1.x + 16, y + 68, 14, C.aqua) + T(c1.x + c1.w - 16, y + 112, 'محمد سالم الشحري', { s: 15, w: 700, f: C.white }) + T(c1.x + c1.w - 16, y + 138, 'الرقم المدني •••• 4821', { s: 12, w: 700, f: '#cfe9e7' }) +
    R(c2.x, y + 54, c2.w, 110, { r: 16, f: C.white, s: '#9aebe9', sw: 2 }) + I('building-2', c2.x + c2.w - 30, y + 68, 14, C.mut) + T(c2.x + c2.w - 38, y + 80, 'السجل التجاري', { s: 12, w: 700, f: C.mut }) + I('circle-check', c2.x + 16, y + 68, 14, '#059669') + T(c2.x + c2.w - 16, y + 112, 'مؤسسة الخريف للمقاولات', { s: 15, w: 700 }) + T(c2.x + c2.w - 16, y + 138, 'CR 1234567', { s: 12, w: 700, f: C.mut }) +
    P(bx, y + 194, 'تُجلب البيانات تلقائياً؛ لا تطلب من المستخدم إرفاق البطاقة الشخصية أو السجل التجاري.', 62, { s: 12, w: 700, f: C.mut, lh: 20 }).svg;
  const yB = y + hA + 16;
  s += card(b.x, yB, b.w, hB, 'أدوار مسار العمل') + pills(bx, yB + 54, [['مقدم الطلب', '#e0f2fe', '#075985'], ['الموظف المختص', '#cdf5f4', C.teal], ['المهندس / المفتش', '#fef3c7', '#92400e']], { h: 26, s: 12 }) + pills(bx, yB + 88, [['رئيس القسم / الدائرة', '#ede7f0', C.purple], ['النظام', '#e2e8f0', '#334155']], { h: 26, s: 12 }) + T(bx, yB + 140, 'لكل ممر في مخطط مسار العمل لون ثابت يُستخدم في الشارات والمخططات.', { s: 12, w: 700, f: C.mut });
  s += card(a.x, y2, a.w, h2, 'ملخص الرسوم والدفع');
  [['رسوم ترخيص اللوحة', 'OMR 10.000'], ['رسوم المعاينة الميدانية', 'OMR 5.000'], ['ضريبة القيمة المضافة', 'OMR 0.000']].forEach((f, i) => { const yy = y2 + 56 + i * 44; s += T(ax, yy + 26, f[0], { s: 14, w: 700, f: '#475569' }) + T(a.x + 20, yy + 26, f[1], { s: 14, w: 700, a: 'start' }) + LINE(a.x + 20, yy + 44, ax, yy + 44, { s: C.soft }); });
  s += T(ax, y2 + 222, 'الإجمالي', { s: 15, w: 700 }) + T(a.x + 20, y2 + 224, 'OMR 15.000', { s: 20, w: 700, f: C.teal, a: 'start' });
  const p1 = cell(2, 8, 0, ax, a.w - 40), p2 = cell(2, 8, 1, ax, a.w - 40);
  s += BTN(p1.x, y2 + 258, p1.w, 44, 'بوابة الدفع', { f: C.teal, r: 12, s: 14, icon: 'credit-card', is: 16 }) + BTN(p2.x, y2 + 258, p2.w, 44, 'المحفظة الإلكترونية', { f: C.white, c: '#334155', stroke: C.line, sw: 2, r: 12, s: 14, icon: 'receipt', is: 16 });
  s += card(b.x, y2, b.w, h2, 'شهادة / تصريح موقّع رقمياً') + R(b.x + 20, y2 + 54, b.w - 40, 220, { r: 16, f: '#fbfcfd', s: C.line }) + T(bx - 20, y2 + 88, 'بلدية ظفار', { s: 10, w: 700, f: C.teal2, ls: 1 }) + T(bx - 20, y2 + 120, 'ترخيص لوحة إرشادية', { s: 18, w: 700 }) + T(bx - 20, y2 + 148, 'رقم الترخيص DM-SB-2026-00482', { s: 12, w: 700, f: C.mut }) + T(bx - 20, y2 + 172, 'صالح حتى 27/09/2027', { s: 12, w: 700, f: C.mut }) +
    I('signature', bx - 34, y2 + 192, 14, '#047857') + T(bx - 42, y2 + 204, 'موقّع رقمياً – رئيس الدائرة', { s: 12, w: 700, f: '#047857' }) + R(b.x + 40, y2 + 82, 96, 96, { r: 4, f: C.white, s: C.line });
  for (let i = 0; i < 21 * 21; i++) { const cx = i % 21, cy = Math.floor(i / 21), fin = (cx < 7 && cy < 7) || (cx > 13 && cy < 7) || (cx < 7 && cy > 13); const on = fin ? (cx % 14 === 0 || cx % 14 === 6 || cy % 14 === 0 || cy % 14 === 6 || (cx % 14 > 1 && cx % 14 < 5 && cy % 14 > 1 && cy % 14 < 5)) : (cx * 7 + cy * 13 + cx * cy) % 3 === 0; if (on) s += R(b.x + 46 + cx * 4, y2 + 88 + cy * 4, 4, 4, { f: INK }); }
  s += T(b.x + 88, y2 + 196, 'امسح للتحقق', { s: 10, w: 700, f: C.mut, a: 'middle' });
  add('service-ux-section', s, h1 + 16 + h2);
}

// ───────────────────────── 12 Feedback states ─────────────────────────
head('states', 'حالات الواجهة', 'كيف تخبر الواجهة المستخدم بما يحدث: التحميل، والفراغ، والخطأ، والنجاح، والتحقق من النماذج.');
{
  const h = 270; let s = '';
  const titles = ['التحميل (هيكل مبدئي)', 'حالة فارغة', 'خطأ في الاتصال', 'رسائل تنبيهية', 'التحقق من النموذج', 'إشعار منبثق'];
  titles.forEach((t, i) => {
    const c = cell(3, 16, i), yy = y + c.row * (h + 16), rx = c.x + c.w - 20, cx = c.x + c.w / 2; s += card(c.x, yy, c.w, h, t);
    if (i === 0) s += R(rx - 48, yy + 56, 48, 48, { r: 16, f: C.line }) + R(rx - 60 - 150, yy + 62, 150, 12, { r: 4, f: C.line }) + R(rx - 60 - 80, yy + 84, 80, 12, { r: 4, f: C.soft }) + R(c.x + 20, yy + 120, c.w - 40, 12, { r: 4, f: C.soft }) + R(c.x + 60, yy + 144, c.w - 80, 12, { r: 4, f: C.soft }) + I('loader-circle', rx - 14, yy + 180, 14, C.mut) + T(rx - 22, yy + 192, 'جارٍ تحميل الطلبات…', { s: 12, w: 700, f: C.mut });
    if (i === 1) s += R(cx - 28, yy + 60, 56, 56, { r: 16, f: C.soft }) + I('inbox', cx - 13, yy + 75, 26, C.faint) + T(cx, yy + 146, 'لا توجد طلبات بعد', { s: 16, w: 700, a: 'middle' }) + T(cx, yy + 170, 'ستظهر طلباتك هنا بعد تقديمها.', { s: 12, w: 700, f: C.mut, a: 'middle' }) + BTN(cx - 75, yy + 190, 150, 36, 'تصفح دليل الخدمات', { f: C.teal, r: 12, s: 12 });
    if (i === 2) s += R(cx - 28, yy + 54, 56, 56, { r: 16, f: '#fef2f2' }) + I('wifi-off', cx - 13, yy + 69, 26, '#ef4444') + T(cx, yy + 138, 'تعذر الاتصال بالخادم', { s: 16, w: 700, a: 'middle' }) + P(cx, yy + 162, 'تحقق من اتصالك ثم حاول مرة أخرى. لم يُفقد أي من بياناتك.', 38, { s: 12, w: 700, f: C.mut, a: 'middle', lh: 19 }).svg + BTN(cx - 70, yy + 212, 140, 36, 'إعادة المحاولة', { f: C.white, c: '#334155', stroke: C.line, sw: 2, r: 12, s: 12, icon: 'refresh-cw', is: 13 });
    if (i === 3) [['circle-check', 'تم حفظ المسودة. يمكنك إكمالها لاحقاً.', '#ecfdf5', '#a7f3d0', '#065f46'], ['info', 'ستُجلب بياناتك من ثقة تلقائياً.', '#f0f9ff', '#bae6fd', '#075985'], ['triangle-alert', 'تنتهي صلاحية الطلب بعد 90 يوماً.', '#fffbeb', '#fde68a', '#78350f'], ['ban', 'الموقع خارج اختصاص البلدية.', '#fef2f2', '#fecaca', '#991b1b']].forEach((n, k) => { const ny = yy + 52 + k * 50; s += R(c.x + 20, ny, c.w - 40, 42, { r: 12, f: n[2], s: n[3] }) + I(n[0], rx - 27, ny + 13, 15, n[4]) + T(rx - 36, ny + 26, n[1], { s: 12, w: 700, f: n[4] }); });
    if (i === 4) s += R(c.x + 20, yy + 52, c.w - 40, 82, { r: 12, f: '#fef2f2', s: '#fecaca' }) + T(rx - 12, yy + 76, 'يرجى تصحيح حقلين:', { s: 12, w: 700, f: '#991b1b' }) + T(rx - 24, yy + 98, '• أبعاد اللوحة مطلوبة', { s: 12, w: 700, f: '#b91c1c' }) + T(rx - 24, yy + 118, '• رقم السجل التجاري يتكون من 7 أرقام', { s: 12, w: 700, f: '#b91c1c' }) +
      T(rx, yy + 160, 'رقم السجل التجاري *', { s: 12, w: 700, f: '#475569' }) + R(c.x + 20, yy + 170, c.w - 40, 44, { r: 12, f: C.white, s: '#f87171', sw: 2 }) + M(c.x + 34, yy + 197, '12345', { s: 14, f: C.ink }) + I('circle-x', rx - 12, yy + 226, 12, '#dc2626') + T(rx - 18, yy + 237, 'يجب أن يتكون من 7 أرقام', { s: 12, w: 700, f: '#dc2626' });
    if (i === 5) s += BTN(rx - 120, yy + 56, 120, 40, 'اعرض الإشعار', { f: C.teal, r: 12, s: 14 }) + R(c.x + 20, yy + 124, c.w - 40, 70, { r: 16, f: C.white, s: C.line, filter: 'shadow' }) + I('circle-check', rx - 34, yy + 142, 18, '#059669') + T(rx - 44, yy + 152, 'تم حفظ التغييرات', { s: 14, w: 700 }) + T(rx - 44, yy + 174, 'يظهر 5 ثوانٍ ثم يختفي', { s: 12, f: C.mut });
  });
  add('states-section', s, 2 * h + 16);
}

// ───────────────────────── 13 Data display ─────────────────────────
head('data', 'عرض البيانات', 'بطاقات المؤشرات، والجداول، وشارات الحالة، والتبويبات، والتنقل بين الصفحات لشاشات الموظفين ولوحات المتابعة.');
{
  let s = '';
  [['طلبات هذا الشهر', '1,284', '+12%', 'file-text', 1], ['متوسط مدة الإنجاز', '2.4 يوم', '−0.6', 'clock', 1], ['نسبة الرضا', '92%', '+3%', 'users', 1], ['طلبات متأخرة', '17', '+4', 'triangle-alert', 0]].forEach((k, i) => {
    const c = cell(4, 12, i), col = k[4] ? '#059669' : '#dc2626';
    s += R(c.x, y, c.w, 116, { r: 16, f: C.white, s: C.line }) + T(c.x + c.w - 16, y + 30, k[0], { s: 12, w: 700, f: C.mut }) + I(k[3], c.x + 16, y + 18, 16, C.faint) + T(c.x + c.w - 16, y + 68, k[1], { s: 24, w: 700 }) + I(k[4] ? 'trending-up' : 'trending-down', c.x + c.w - 29, y + 84, 13, col) + T(c.x + c.w - 36, y + 95, `${k[2]} عن الشهر الماضي`, { s: 12, w: 700, f: col });
  });
  const ty = y + 132, th = 430, rx = MR - 20; s += card(ML, ty, MW, th);
  let tx = rx; ['الكل', 'بانتظاري', 'مكتملة'].forEach((t, i) => { const w = t.length * 9 + 32; s += T(tx - w / 2, ty + 42, t, { s: 14, w: 700, f: i ? C.mut : C.teal, a: 'middle' }) + (i ? '' : R(tx - w, ty + 56, w, 2, { f: C.teal })); tx -= w + 4; });
  s += LINE(ML + 20, ty + 58, rx, ty + 58);
  const colx = [rx - 12, rx - 150, rx - 480, rx - 680];
  ['الرقم', 'الخدمة', 'الحالة', 'التاريخ'].forEach((hh, i) => { s += T(colx[i], ty + 88, hh, { s: 12, w: 700, f: C.mut }); });
  [['DM-00482', 'ترخيص اللوحات الإرشادية', 'قيد المراجعة', '#e0f2fe', '#0369a1', '28/09'], ['DM-00479', 'ترقيم المنازل', 'معتمد', '#d1fae5', '#047857', '27/09'], ['DM-00475', 'طلب إتلاف المواد الغذائية', 'مطلوب معلومات', '#fef3c7', '#92400e', '27/09'], ['DM-00471', 'تسمية المباني', 'قيد الانتظار', '#f1f5f9', '#334155', '26/09'], ['DM-00468', 'تصريح حفر أو شق الطرق', 'مرفوض', '#fee2e2', '#b91c1c', '25/09']].forEach((r, i) => {
    const ry = ty + 104 + i * 52;
    s += LINE(ML + 20, ry, rx, ry, { s: C.soft }) + M(colx[0], ry + 31, r[0], { w: 700, a: 'end' }) + T(colx[1], ry + 31, r[1], { s: 14, w: 700, f: '#1e293b' }) + CHIP(colx[2], ry + 13, r[2], { h: 26, s: 12, f: r[3], c: r[4] }).svg + T(colx[3], ry + 31, r[5], { s: 13, w: 700, f: C.mut }) + T(ML + 52, ry + 31, 'فتح', { s: 12, w: 700, f: C.teal, a: 'start' }) + I('arrow-up-left', ML + 32, ry + 20, 13, C.teal);
  });
  s += T(rx, ty + th - 28, 'عرض 1–5 من 42', { s: 12, w: 700, f: C.mut });
  ['chevron-left', '…', '3', '2', '1', 'chevron-right'].forEach((p, i) => { const px = ML + 20 + i * 40, on = p === '1'; s += p === '…' ? T(px + 18, ty + th - 28, '…', { s: 14, f: C.faint, a: 'middle' }) : R(px, ty + th - 50, 36, 36, { r: 8, f: on ? C.teal : C.white, s: on ? undefined : C.line }) + (p.length > 1 ? I(p, px + 10, ty + th - 40, 15, i === 5 ? C.faint : C.text) : T(px + 18, ty + th - 27, p, { s: 14, w: 700, f: on ? C.white : '#475569', a: 'middle' })); });
  add('data-section', s, 132 + th);
}

// ───────────────────────── 14 Notification templates ─────────────────────────
head('notifications', 'قوالب الإشعارات', 'صياغة موحدة لرسائل SMS والبريد الإلكتروني في كل مرحلة من مراحل الطلب. المتغيرات بين {{ }} تُعبأ تلقائياً.');
{
  const h = 470, yy = y + 52, lw = MW - 336, sx = MR - 160; let s = pills(MR, y, ['تقديم الطلب', 'طلب معلومات', 'الاعتماد', 'الرفض', 'نجاح الدفع'], { active: 0 });
  s += card(MR - 320, yy, 320, h, 'رسالة نصية (معاينة)') + R(sx - 128, yy + 56, 256, 340, { r: 32, f: C.ink }) + R(sx - 116, yy + 68, 232, 316, { r: 24, f: C.soft }) + T(sx, yy + 92, 'DM-OMAN', { s: 10, w: 700, f: C.faint, a: 'middle' }) + R(sx - 96, yy + 104, 200, 124, { r: 16, f: C.white }) +
    P(sx + 92, yy + 128, 'بلدية ظفار: تم استلام طلبك ترخيص اللوحات الإرشادية برقم DM-2026-00482. تابع حالته عبر edm.gov.om', 28, { s: 12.5, f: '#1e293b', lh: 21 }).svg + T(sx, yy + 430, '96 حرفاً · الحد الموصى به 160', { s: 11, w: 700, f: C.mut, a: 'middle' });
  const rx = ML + lw - 20;
  s += card(ML, yy, lw, h, 'القالب والبريد الإلكتروني') + R(ML + 20, yy + 52, lw - 40, 76, { r: 16, f: '#020617' }) + T(rx - 16, yy + 84, 'بلدية ظفار: تم استلام طلبك {{service}} برقم {{ref}}.', { s: 14, w: 500, f: '#e2e8f0' }) + T(rx - 16, yy + 110, 'تابع حالته عبر edm.gov.om', { s: 14, w: 500, f: '#e2e8f0' }) +
    R(rx - 112, yy + 140, 112, 36, { r: 8, f: C.soft }) + I('copy', rx - 24, yy + 152, 13, C.ink) + T(rx - 32, yy + 163, 'نسخ القالب', { s: 12, w: 700 }) +
    R(ML + 20, yy + 192, lw - 40, 258, { r: 16, f: C.white, s: C.line }) + `<path d="M${ML + 20} ${yy + 208} a16 16 0 0 1 16 -16 h${lw - 72} a16 16 0 0 1 16 16 v28 h-${lw - 40} z" fill="${C.teal}"/>` + I('mail', rx - 36, yy + 206, 16, C.white) + T(rx - 46, yy + 219, 'تقديم الطلب — بلدية ظفار', { s: 14, w: 700, f: C.white }) +
    T(rx - 20, yy + 268, 'عزيزنا المستفيد،', { s: 14, w: 700, f: '#334155' }) + P(rx - 20, yy + 296, 'بلدية ظفار: تم استلام طلبك ترخيص اللوحات الإرشادية برقم DM-2026-00482. تابع حالته عبر edm.gov.om', 70, { s: 14, f: '#334155', lh: 24 }).svg +
    BTN(rx - 20 - 120, yy + 348, 120, 40, 'عرض الطلب', { f: C.teal, r: 12, s: 12 }) + LINE(ML + 40, yy + 404, rx - 20, yy + 404) + T(rx - 20, yy + 428, 'هذه رسالة آلية، يرجى عدم الرد عليها. للاستفسار: 1771 أو info@dm.gov.om', { s: 11, f: C.faint });
  add('notifications-section', s, 52 + h);
}

// ───────────────────────── 15 Block library ─────────────────────────
head('blocks', 'مكتبة الكتل', '24 كتلة جاهزة بألوان وخطوط الهوية. افتح أي كتلة مباشرة في باني الصفحات.');
/** Half-scale sketch of a page block inside x,y,w,h */
function block(k, x, yy, w, h) {
  const cx = x + w / 2, r = x + w, bar = (bx, by, bw, q = {}) => R(bx, by, bw, q.h ?? 7, { r: 3.5, f: q.f ?? '#cbd5e1' });
  const dark = (f, pat) => { const id = uid('clip-blk'), sz = patternSize(pat), tw = pat === 'landmark' ? h * sz.w / sz.h : w / 3; return `<clipPath id="${id}"><rect x="${x}" y="${yy}" width="${w}" height="${h}" rx="20"/></clipPath><g clip-path="url(#${id})">` + R(x, yy, w, h, { f }) + (pat === 'landmark' ? PATTERN(pat, cx - tw / 2, yy, tw, { op: 0.2 }) : Array.from({ length: 8 }, (_, i) => PATTERN(pat, x + (i % 4) * tw - 10, yy + Math.floor(i / 4) * tw * sz.h / sz.w, tw, { op: 0.2 })).join('')) + '</g>'; };
  const tile = (tx, ty, tw, th) => R(tx, ty, tw, th, { r: 12, f: C.white, s: C.soft });
  switch (k) {
    case 'hero': return dark('#020617', 'landmark') + T(cx, yy + 44, 'بلدية ظفار', { s: 7, w: 700, f: C.aqua, a: 'middle', ls: 2 }) + T(cx, yy + 80, 'عنوان الصفحة الرئيسي', { s: 24, w: 700, f: C.white, a: 'middle' }) + T(cx, yy + 106, 'وصف مختصر يوضح هدف الصفحة للمواطن.', { s: 10, f: '#cbd5e1', a: 'middle' }) + BTN(cx - 44, yy + 124, 88, 26, 'ابدأ الآن', { f: C.aqua, c: C.ink, r: 9, s: 9.5 });
    case 'heading': return T(cx, yy + h / 2, 'عنوان قسم جديد', { s: 18, w: 700, f: C.purple, a: 'middle' }) + R(cx - 16, yy + h / 2 + 12, 32, 4, { r: 2, f: C.aqua });
    case 'text': return T(r - 16, yy + 40, 'اكتب المحتوى هنا. يمكنك استخدام أسطر متعددة.', { s: 10, w: 500, f: '#475569' }) + bar(r - 16 - 300, yy + 56, 300) + bar(r - 16 - 260, yy + 72, 260) + bar(r - 16 - 180, yy + 88, 180);
    case 'info': return R(x + 16, yy + 50, w - 32, 70, { r: 10, f: '#eff6ff', s: '#bfdbfe' }) + I('info', r - 44, yy + 64, 14, '#1e3a8a') + T(r - 54, yy + 78, 'معلومة هامة', { s: 11, w: 700, f: '#1e3a8a' }) + T(r - 54, yy + 98, 'نص توضيحي للمواطن.', { s: 9.5, w: 500, f: '#1e3a8a' });
    case 'stats': return dark('#020617', 'circle-pro') + [['25,000+', 'معاملة رقمية'], ['98%', 'رضا المستفيدين'], ['24/7', 'توفر الخدمات']].map((s, i) => { const c = cell(3, 0, i, r, w); return T(c.x + c.w / 2, yy + h / 2 + 2, s[0], { s: 24, w: 700, f: C.aqua, a: 'middle' }) + T(c.x + c.w / 2, yy + h / 2 + 24, s[1], { s: 8, w: 700, f: '#cbd5e1', a: 'middle' }); }).join('');
    case 'features': return [['zap', 'خدمات فورية'], ['shield-check', 'دخول آمن بثقة'], ['clock', 'متابعة لحظية']].map((f, i) => { const c = cell(3, 10, i, r - 12, w - 24); return tile(c.x, yy + 36, c.w, 112) + R(c.x + c.w - 36, yy + 48, 24, 24, { r: 8, f: '#d5f7f6' }) + I(f[0], c.x + c.w - 30, yy + 54, 12, C.teal2) + T(c.x + c.w - 12, yy + 94, f[1], { s: 10, w: 700 }) + bar(c.x + 12, yy + 106, c.w - 24, { h: 5, f: C.line }) + bar(c.x + 40, yy + 118, c.w - 52, { h: 5, f: C.line }); }).join('');
    case 'steps': return ['سجّل الدخول عبر ثقة', 'عبّئ نموذج الطلب', 'تابع حالة الطلب'].map((s, i) => { const c = cell(3, 10, i, r - 12, w - 24); return tile(c.x, yy + 46, c.w, 92) + CIRC(c.x + c.w - 22, yy + 68, 10, { f: C.purple }) + T(c.x + c.w - 22, yy + 72, i + 1, { s: 10, w: 700, f: C.white, a: 'middle' }) + T(c.x + c.w - 12, yy + 108, s, { s: 10, w: 700 }); }).join('');
    case 'cta': return `<linearGradient id="${uid('g-cta')}" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#470D67"/><stop offset="1" stop-color="#2a0640"/></linearGradient>`.replace(/id="([^"]+)"/, (m, id) => { block.g = id; return m; }) + dark(`url(#${block.g})`, 'wave-pro') + T(r - 24, yy + h / 2 - 4, 'هل أنت جاهز لتقديم طلبك؟', { s: 14, w: 700, f: C.white }) + T(r - 24, yy + h / 2 + 16, 'قدّم طلبك إلكترونياً خلال دقائق.', { s: 9.5, f: '#d8cbe0' }) + BTN(x + 24, yy + h / 2 - 14, 86, 28, 'قدّم الطلب', { f: C.white, c: C.purple, r: 9, s: 9.5 });
    case 'quote': return I('quote', r - 36, yy + 34, 18, C.aqua) + P(r - 16, yy + 78, 'نسعى لتقديم خدمات بلدية رقمية ميسّرة لكل مواطن ومقيم.', 44, { s: 14, w: 700, lh: 24 }).svg + T(r - 16, yy + 132, 'رئيس بلدية ظفار', { s: 10, w: 700, f: C.purple });
    case 'image': return IMG(x + 12, yy + 12, w - 24, h - 24, { r: 14, label: 'منظر من محافظة ظفار' });
    case 'video': return R(x + 40, yy + 12, w - 80, h - 24, { r: 14, f: C.ink }) + CIRC(cx, yy + h / 2, 22, { f: '#ef4444' }) + `<path d="M${cx - 6} ${yy + h / 2 - 9} l16 9 l-16 9 z" fill="#fff"/>`;
    case 'pdf': return R(r - 16 - 190, yy + h / 2 - 32, 190, 64, { r: 14, f: C.white, s: C.soft, sw: 2 }) + R(r - 26 - 36, yy + h / 2 - 18, 36, 36, { r: 10, f: '#fef2f2' }) + I('download', r - 52, yy + h / 2 - 8, 16, '#dc2626') + T(r - 72, yy + h / 2 + 1, 'تحميل الدليل', { s: 11.5, w: 700 }) + T(r - 72, yy + h / 2 + 18, 'PDF', { s: 8.5, w: 700, f: '#475569' });
    case 'table': return tile(x + 12, yy + 30, w - 24, 124) + R(x + 13, yy + 31, w - 26, 30, { r: 11, f: '#f8fafc' }) + [['الخدمة', 'المدة', 'الرسوم'], ['ترخيص اللوحات الإرشادية', '3 أيام عمل', '10 ر.ع'], ['ترقيم المنازل', 'يوم عمل', 'مجاناً']].map((row, i) => (i ? LINE(x + 12, yy + 30 + i * 41 - 10, r - 12, yy + 30 + i * 41 - 10, { s: C.soft }) : '') + row.map((t, c) => T(r - 28 - c * (w - 40) / 3, yy + 50 + i * 41 - (i ? 4 : 0), t, { s: 9.5, w: i && c ? 400 : 700, f: i ? '#334155' : C.mut })).join('')).join('');
    case 'accordion': return ['كيف أدخل إلى البوابة؟', 'كيف أتابع طلبي؟', 'كيف أدفع الرسوم؟'].map((q, i) => tile(x + 12, yy + 28 + i * 44, w - 24, 36) + T(r - 28, yy + 51 + i * 44, q, { s: 10.5, w: 700, f: C.purple }) + I('chevron-down', x + 26, yy + 40 + i * 44, 12, C.mut)).join('');
    case 'tabs': return R(r - 16 - 130, yy + 34, 130, 28, { r: 10, f: C.soft }) + R(r - 20 - 62, yy + 38, 62, 20, { r: 7, f: C.white }) + T(r - 51, yy + 52, 'المتطلبات', { s: 9, w: 700, a: 'middle' }) + T(r - 114, yy + 52, 'الرسوم', { s: 9, w: 700, f: C.mut, a: 'middle' }) + tile(x + 16, yy + 70, w - 32, 70) + T(r - 30, yy + 110, 'البطاقة الشخصية سارية المفعول.', { s: 10, w: 500, f: '#334155' });
    case 'avatar': return CIRC(cx, yy + 74, 38, { f: C.purple, s: C.white, sw: 5 }) + T(cx, yy + 86, 'م', { s: 30, w: 700, f: C.white, a: 'middle' }) + T(cx, yy + 142, 'معالي محافظ ظفار', { s: 12, w: 700, f: C.purple, a: 'middle' });
    case 'team': return [0, 1, 2].map(i => { const c = cell(3, 0, i, r, w), px = c.x + c.w / 2; return CIRC(px, yy + 76, 28, { f: '#cdf5f4' }) + T(px, yy + 86, 'ا', { s: 22, w: 700, f: C.teal, a: 'middle' }) + T(px, yy + 126, 'اسم المسؤول', { s: 10, w: 700, a: 'middle' }) + T(px, yy + 142, 'المنصب', { s: 8.5, w: 700, f: '#475569', a: 'middle' }); }).join('');
    case 'badge': return R(cx - 60, yy + h / 2 - 15, 120, 30, { r: 15, f: '#ecfdf5' }) + I('award', cx + 34, yy + h / 2 - 7, 14, '#047857') + T(cx - 8, yy + h / 2 + 4, 'خدمة معتمدة', { s: 11, w: 700, f: '#047857', a: 'middle' });
    case 'contact': return [['phone', 'الهاتف', '1771'], ['mail', 'البريد الإلكتروني', 'care@dm.gov.om'], ['map-pin', 'العنوان', 'صلالة، محافظة ظفار'], ['clock', 'ساعات العمل', 'الأحد – الخميس، 7:30 ص – 2:30 م']].map((ct, i) => { const c = cell(2, 10, i, r - 12, w - 24), ty = yy + 32 + c.row * 64; return tile(c.x, ty, c.w, 54) + R(c.x + c.w - 36, ty + 14, 26, 26, { r: 8, f: '#d5f7f6' }) + I(ct[0], c.x + c.w - 29, ty + 21, 12, C.teal2) + T(c.x + c.w - 44, ty + 24, ct[1], { s: 8, w: 700, f: '#475569' }) + T(c.x + c.w - 44, ty + 40, ct[2], { s: i === 3 ? 8 : 10, w: 700 }); }).join('');
    case 'links': return T(r - 16, yy + 52, 'خدمات ذات صلة', { s: 13, w: 700, f: C.purple }) + ['دليل الخدمات', 'منصة تجاوب'].map((l, i) => { const c = cell(2, 10, i, r - 16, w - 32); return tile(c.x, yy + 70, c.w, 44) + T(c.x + c.w - 14, yy + 97, l, { s: 10.5, w: 700, f: '#334155' }) + I('arrow-up-left', c.x + 12, yy + 85, 13, C.teal2); }).join('');
    case 'separator': return LINE(x + 20, yy + h / 2, r - 20, yy + h / 2, { s: C.line, sw: 1.5 });
    case 'spacer': return R(x + 40, yy + h / 2 - 22, w - 80, 44, { r: 8, f: 'none', s: '#cbd5e1', dash: '5 5' }) + I('move-vertical', cx - 9, yy + h / 2 - 9, 18, C.faint);
    case 'html': return R(x + 20, yy + 50, w - 40, 72, { r: 14, f: 'none', s: '#94a3b8', sw: 1.5, dash: '6 5' }) + M(cx, yy + 92, 'HTML', { s: 14, w: 700, f: C.ink, a: 'middle' });
    case 'style': return R(x + 30, yy + 34, w - 60, 104, { r: 14, f: '#020617' }) + M(x + 48, yy + 66, '/* CSS */', { s: 11, f: '#94a3b8' }) + M(x + 48, yy + 88, '.my-banner {', { s: 11, f: '#e2e8f0' }) + M(x + 48, yy + 108, '  background: var(--dm-teal-deep); }', { s: 11, f: C.aqua });
    default: return '';
  }
}
{
  const blocks = [['hero', 'layout-template', 'واجهة رئيسية', 'افتتاحية الصفحة مع عنوان وأزرار'], ['heading', 'heading-1', 'عنوان قسم', 'عنوان مع سطر توضيحي'], ['text', 'type', 'نص', 'فقرات نصية'], ['info', 'info', 'بطاقة تنبيه', 'معلومة أو تنبيه أو شرط هام'], ['stats', 'trending-up', 'إحصائيات', 'أرقام رئيسية'], ['features', 'layout-grid', 'شبكة بطاقات', 'بطاقات بأيقونات وروابط'],
    ['steps', 'list-ordered', 'خطوات', 'مراحل مرقّمة لإجراء'], ['cta', 'megaphone', 'دعوة لإجراء', 'شريط يدعو لإجراء محدد'], ['quote', 'quote', 'اقتباس', 'كلمة أو شهادة'], ['image', 'image', 'صورة', 'صورة مع نص بديل وتعليق'], ['video', 'circle-play', 'فيديو', 'فيديو يوتيوب أو رابط مباشر'], ['pdf', 'file-text', 'ملف للتحميل', 'رابط تحميل مستند'],
    ['table', 'table', 'جدول', 'جدول بيانات حتى 4 أعمدة'], ['accordion', 'list', 'أسئلة شائعة', 'أسئلة قابلة للطي'], ['tabs', 'layers', 'تبويبات', 'محتوى مقسّم في تبويبات'], ['avatar', 'user', 'شخصية', 'صورة واسم ومنصب'], ['team', 'users', 'فريق / قيادات', 'مجموعة أشخاص'], ['badge', 'award', 'وسم', 'شارة قصيرة'],
    ['contact', 'phone', 'بطاقة تواصل', 'هاتف وبريد وعنوان وساعات عمل'], ['links', 'link-2', 'روابط سريعة', 'قائمة روابط أو خدمات'], ['separator', 'minus', 'فاصل', 'خط فاصل'], ['spacer', 'move-vertical', 'مسافة', 'فراغ عمودي'], ['html', 'code', 'HTML مخصص', 'شيفرة HTML (بدون سكربتات)'], ['style', 'brush', 'أنماط CSS للصفحة', 'CSS يطبّق على الصفحة كاملة']];
  const ch = 300, y0 = y + 56; let s = pills(MR, y, ['الكل', 'تخطيط', 'محتوى', 'بيانات', 'وسائط', 'تفاعل وتواصل', 'متقدم'], { active: 0 });
  blocks.forEach((b, i) => {
    const c = cell(2, 16, i), yy = y0 + c.row * (ch + 16), rx = c.x + c.w - 16;
    s += G(`block-${b[0]}`, R(c.x, yy, c.w, ch, { r: 24, f: C.white, s: C.line }) + `<path d="M${c.x} ${yy + 24} a24 24 0 0 1 24 -24 h${c.w - 48} a24 24 0 0 1 24 24 v200 h-${c.w} z" fill="#f8fafc"/>` + LINE(c.x, yy + 224, c.x + c.w, yy + 224) + block(b[0], c.x + 20, yy + 20, c.w - 40, 184) +
      R(rx - 40, yy + 240, 40, 40, { r: 12, f: '#ede7f0' }) + I(b[1], rx - 29, yy + 251, 18, C.purple) + T(rx - 52, yy + 256, b[2], { s: 16, w: 700 }) + T(rx - 52, yy + 276, b[3], { s: 12, f: C.mut }) + R(c.x + 16, yy + 242, 84, 36, { r: 12, f: C.white, s: C.line }) + T(c.x + 88, yy + 265, 'استخدم', { s: 13, w: 700 }) + I('arrow-up-left', c.x + 24, yy + 254, 12, C.ink));
  });
  add('blocks-section', s, 56 + 12 * (ch + 16) - 16);
}

// ───────────────────────── 16 Page templates ─────────────────────────
head('templates', 'قوالب الصفحات', 'صفحات كاملة مبنية من الكتل؛ ابدأ منها في باني الصفحات ثم عدّل المحتوى.');
{
  // each wireframe row: [kind, height]; kinds: d dark band, p purple band, t text lines, c cards, h heading, n note, s soft band
  const tpl = [['file-check', 'صفحة خدمة', 'تعريف الخدمة والمتطلبات والخطوات والرسوم', 7, [['d', 62], ['n', 22], ['h', 14], ['c', 34], ['t', 26], ['p', 30]]], ['landmark', 'عن البلدية', 'الرؤية والأرقام والقيادات', 6, [['p', 62], ['t', 22], ['d', 36], ['s', 34], ['h', 14], ['c', 30]]],
    ['circle-help', 'أسئلة شائعة', 'أسئلة مصنفة ودعم', 3, [['h', 30], ['t', 22], ['t', 22], ['t', 22], ['s', 62]]], ['scroll-text', 'سياسة / أحكام', 'نص قانوني طويل منظم', 6, [['n', 26], ['h', 14], ['t', 36], ['h', 14], ['t', 36], ['c', 26]]],
    ['megaphone', 'حملة / مبادرة', 'مبادرة موسمية بفيديو ودعوة للمشاركة', 5, [['p', 60], ['c', 34], ['d', 46], ['d', 26], ['p', 26]]], ['phone', 'تواصل معنا', 'قنوات التواصل وروابط الدعم', 3, [['h', 34], ['c', 40], ['c', 40], ['h', 14], ['c', 30]]]];
  const ch = 400; let s = '';
  tpl.forEach((t, i) => {
    const c = cell(3, 16, i), yy = y + c.row * (ch + 16), rx = c.x + c.w - 16, wx = c.x + 40, ww = c.w - 80; let wy = yy + 16;
    let b = R(c.x, yy, c.w, ch, { r: 24, f: C.white, s: C.line }) + `<path d="M${c.x} ${yy + 24} a24 24 0 0 1 24 -24 h${c.w - 48} a24 24 0 0 1 24 24 v216 h-${c.w} z" fill="#f8fafc"/>` + LINE(c.x, yy + 240, c.x + c.w, yy + 240);
    t[4].forEach(r => {
      const hh = r[1], mid = wy + hh / 2;
      if (r[0] === 'd' || r[0] === 'p') b += R(wx, wy, ww, hh, { r: 8, f: r[0] === 'd' ? '#020617' : C.purple }) + R(wx + ww / 2 - ww * 0.25, mid - (hh > 50 ? 10 : 3), ww * 0.5, 6, { r: 3, f: C.white }) + (hh > 50 ? R(wx + ww / 2 - 20, mid + 6, 40, 10, { r: 4, f: C.aqua }) : '');
      if (r[0] === 's') b += R(wx, wy, ww, hh, { r: 8, f: '#e8eef5' }) + R(wx + ww * 0.2, mid - 3, ww * 0.6, 6, { r: 3, f: '#94a3b8' });
      if (r[0] === 'n') b += R(wx, wy, ww, hh, { r: 6, f: '#fef3c7', s: '#fde68a' }) + R(wx + ww - 12 - ww * 0.4, mid - 2.5, ww * 0.4, 5, { r: 2.5, f: '#d97706' });
      if (r[0] === 'h') b += R(wx + ww / 2 - ww * 0.2, mid - 4, ww * 0.4, 8, { r: 4, f: C.purple }) + (hh > 20 ? R(wx + ww / 2 - 10, mid + 8, 20, 3, { r: 1.5, f: C.aqua }) : '');
      if (r[0] === 't') for (let l = 0; l * 9 + 5 < hh; l++) b += R(wx + (l % 2 ? ww * 0.15 : 0), wy + l * 9, ww * (l % 2 ? 0.85 : 1), 5, { r: 2.5, f: '#cbd5e1' });
      if (r[0] === 'c') [0, 1, 2].forEach(k => { const cc = cell(3, 6, k, wx + ww, ww); b += R(cc.x, wy, cc.w, hh, { r: 6, f: C.white, s: C.line }) + R(cc.x + cc.w - 14, wy + 5, 8, 8, { r: 3, f: '#9aebe9' }); });
      wy += hh + 6;
    });
    b += R(rx - 40, yy + 256, 40, 40, { r: 12, f: '#d5f7f6' }) + I(t[0], rx - 29, yy + 267, 18, C.teal) + T(rx - 52, yy + 272, t[1], { s: 16, w: 700 }) + T(rx - 52, yy + 292, t[2], { s: 11.5, f: C.mut }) + T(rx - 52, yy + 312, `${t[3]} كتل`, { s: 11, w: 700, f: C.faint }) + BTN(c.x + 16, yy + ch - 56, c.w - 32, 40, 'ابدأ صفحة من هذا القالب', { f: C.purple, r: 12, s: 14 });
    s += G(`template-${i + 1}`, b);
  });
  add('templates-section', s, 2 * ch + 16);
}

// ───────────────────────── 17 Header & footer ─────────────────────────
head('chrome', 'الترويسة والتذييل', 'أشكال الترويسة والتذييل المتاحة لكل صفحة في باني الصفحات، أو كإعداد افتراضي للموقع.');
{
  const radio = (yy, items) => { let x = MR, s = ''; items.forEach((it, i) => { const w = Math.max(it[0].length * 9, it[1].length * 6.2) + 34; s += R(x - w, yy, w, 54, { r: 16, f: i ? C.white : '#f6f1f8', s: i ? C.line : C.purple, sw: 2 }) + T(x - 16, yy + 23, it[0], { s: 14, w: 700 }) + T(x - 16, yy + 42, it[1], { s: 11, f: C.mut }); x -= w + 8; }); return s; };
  const k = MW / W, hs = HEADER(W, 0); let s = I('panel-top', MR - 18, y + 2, 18, C.purple) + T(MR - 28, y + 17, 'الترويسة', { s: 16, w: 700, f: '#334155' });
  s += radio(y + 34, [['كاملة', 'شريط الأخبار + الشريط العلوي + القائمة'], ['مختصرة', 'القائمة فقط'], ['بسيطة', 'الشعار واللغة'], ['بدون', 'لصفحات الحملات والهبوط']]);
  const py = y + 104, ph = (hs.h + 24) * k, id = uid('clip-chrome');
  s += `<clipPath id="${id}"><rect x="${ML}" y="${py}" width="${MW}" height="${ph}" rx="24"/></clipPath><g clip-path="url(#${id})">` + R(ML, py, MW, ph, { f: C.white }) + `<g transform="translate(${ML} ${py}) scale(${k})">${hs.svg.replace(/id="header"/, `id="${uid('header-preview')}"`).replace(/id="logo"/, `id="${uid('logo')}"`)}</g></g>` + R(ML, py, MW, ph, { r: 24, f: 'none', s: C.line });
  const fy = py + ph + 32;
  s += I('panel-bottom', MR - 18, fy + 2, 18, C.purple) + T(MR - 28, fy + 17, 'التذييل', { s: 16, w: 700, f: '#334155' }) + radio(fy + 34, [['كامل', 'أربعة أعمدة روابط'], ['مختصر', 'سطر واحد'], ['بدون', 'مخفي']]);
  const qy = fy + 104, qh = 150;
  s += R(ML, qy, MW, qh, { r: 24, f: '#020617' }) + R(ML + 24, qy, MW - 48, 3, { f: C.aqua }) + logo(MR - 24 - 53, qy + 22, 32, '', true) + T(MR - 110, qy + 43, 'مركز الاتصال 1771  ·  portal@dm.gov.om  ·  91484042', { s: 11.5, w: 700, f: '#cbd5e1' }) +
    ['facebook', 'twitter', 'youtube', 'instagram', 'message-circle'].map((ic, i) => R(ML + 24 + i * 30, qy + 26, 24, 24, { r: 6, f: '#1e293b' }) + I(ic, ML + 30 + i * 30, qy + 32, 12, C.white)).join('') + LINE(ML + 24, qy + 66, MR - 24, qy + 66, { s: '#1e293b' }) +
    pills(MR - 24, qy + 76, [['تواصل معنا', '#0f172a', '#cbd5e1'], ['المعلومات القانونية', '#0f172a', '#cbd5e1'], ['سياسات الخدمة', '#0f172a', '#cbd5e1'], ['روابط هامة', '#0f172a', '#cbd5e1']], { h: 26, s: 11 }) + LINE(ML + 24, qy + 112, MR - 24, qy + 112, { s: '#1e293b' }) +
    T(MR - 24, qy + 134, '© 2026 بلدية ظفار - جميع الحقوق محفوظة', { s: 10, w: 700, f: '#64748b' }) + T(ML + MW / 2, qy + 134, 'آخر تحديث لهذه الصفحة: ٢٩ سبتمبر ٢٠٢٦', { s: 10, w: 700, f: C.aqua, a: 'middle' }) + T(ML + 24, qy + 134, 'سلطنة عمان - محافظة ظفار', { s: 10, w: 700, f: '#64748b', a: 'start' });
  add('chrome-section', s, qy + qh - y);
}

// ───────────────────────── 18 Voice & tone ─────────────────────────
head('voice', 'أسلوب الكتابة', 'كيف تتحدث البلدية في واجهاتها ورسائلها: واضحة، ومحترمة، ومفيدة.');
{
  let s = '', yy = y;
  [['user', 'خاطب المستفيد مباشرة', 'استخدم «أنت» و«طلبك» بدلاً من «المستفيد» و«الطلب المذكور».'], ['check', 'ابدأ بالأهم', 'اذكر النتيجة أو الإجراء المطلوب في أول جملة.'], ['message-square', 'بسيط ورسمي', 'جمل قصيرة بلغة عربية فصحى سهلة، دون مصطلحات تقنية.'], ['shield-check', 'طمئن وأرشد', 'عند الخطأ، اشرح ما حدث وما الخطوة التالية دون لوم المستخدم.']].forEach((p, i) => {
    const c = cell(4, 12, i);
    s += R(c.x, yy, c.w, 164, { r: 16, f: C.white, s: C.line }) + R(c.x + c.w - 52, yy + 16, 36, 36, { r: 12, f: '#ede7f0' }) + I(p[0], c.x + c.w - 43, yy + 25, 17, C.purple) + T(c.x + c.w - 16, yy + 80, p[1], { s: 15, w: 700 }) + P(c.x + c.w - 16, yy + 104, p[2], 30, { s: 12, w: 500, f: '#475569', lh: 19 }).svg;
  });
  yy += 164 + 16;
  [['حدث خطأ غير متوقع (Error 500).', 'تعذر حفظ طلبك الآن. لم تُفقد بياناتك؛ حاول مرة أخرى بعد قليل.'], ['يتوجب على المستفيد إرفاق كافة المستندات المطلوبة.', 'أرفق صورة الموقع من الجهات الأربع لإكمال طلبك.'], ['تم رفض الطلب.', 'لم نتمكن من اعتماد طلبك لأن الموقع خارج اختصاص البلدية. يمكنك التواصل على 1771.']].forEach(pair => {
    const a = cell(2, 12, 0), b = cell(2, 12, 1);
    s += R(a.x, yy, a.w, 92, { r: 16, f: '#fef7f7', s: '#fecaca', sw: 2 }) + I('circle-x', a.x + a.w - 30, yy + 13, 14, '#b91c1c') + T(a.x + a.w - 36, yy + 25, 'تجنّب', { s: 12, w: 700, f: '#b91c1c' }) + P(a.x + a.w - 16, yy + 52, pair[0], 56, { s: 13.5, w: 700, f: '#334155', lh: 21 }).svg +
      R(b.x, yy, b.w, 92, { r: 16, f: '#f3fbf7', s: '#a7f3d0', sw: 2 }) + I('circle-check', b.x + b.w - 30, yy + 13, 14, '#047857') + T(b.x + b.w - 36, yy + 25, 'اكتب هكذا', { s: 12, w: 700, f: '#047857' }) + P(b.x + b.w - 16, yy + 52, pair[1], 56, { s: 13.5, w: 700, f: '#334155', lh: 21 }).svg;
    yy += 92 + 12;
  });
  add('voice-section', s, yy - 12 - y);
}

// ───────────────────────── 19 Accessibility ─────────────────────────
head('a11y', 'معايير النفاذ الرقمي', 'قواعد WCAG 2.2 AA الملزمة لكل صفحة ومكوّن. جرّب أدوات النفاذ من الزر العائم أو Alt+A.');
{
  let s = '';
  ['تباين 4.5:1 للنص العادي و3:1 للنص الكبير وعناصر الواجهة.', 'كل عنصر تفاعلي يصل إليه لوحة المفاتيح ومؤشر التركيز ظاهر دائماً.', 'أهداف اللمس لا تقل عن 44×44 بكسل.', 'كل صورة لها نص بديل، والزخارف مخفية عن قارئات الشاشة.', 'كل حقل له تسمية مرئية، والأخطاء تُعلن مع الحقل المرتبط بها.', 'اتجاه الصفحة ولغتها (dir/lang) صحيحان لكل نص عربي وإنجليزي.', 'لا حركة تلقائية تتجاوز 5 ثوانٍ دون زر إيقاف، مع احترام تقليل الحركة.', 'النص يبقى مقروءاً عند تكبيره 200% وتباعد الأسطر 1.5.']
    .forEach((t, i) => { const c = cell(2, 12, i), yy = y + c.row * 80; s += R(c.x, yy, c.w, 68, { r: 16, f: C.white, s: C.line }) + I('circle-check', c.x + c.w - 34, yy + 16, 18, '#059669') + P(c.x + c.w - 46, yy + 30, t, 54, { s: 13.5, w: 700, f: '#334155', lh: 21 }).svg; });
  add('a11y-section', s, 4 * 80 - 12);
}

// ───────────────────────── 20 Glossary ─────────────────────────
head('glossary', 'المسرد الثنائي', 'المصطلحات المعتمدة التي تلتزم بها الترجمة الآلية في كل أدوات البناء.');
{
  const rows = [['بلدية ظفار', 'Dhofar Municipality'], ['محافظة ظفار', 'Dhofar Governorate'], ['سلطنة عُمان', 'Sultanate of Oman'], ['ثقة', 'Thiqa'], ['تجاوب', 'Tajawob'], ['رؤية عُمان 2040', 'Oman Vision 2040'], ['موسم الخريف', 'Khareef season'], ['الكروكي', 'krooki (site sketch)'], ['شهادة عدم ممانعة', 'No-Objection Certificate (NOC)'],
    ['السجل التجاري', 'Commercial Registration (CR)'], ['البطاقة الشخصية', 'National ID card'], ['الخزانة الرقمية', 'digital vault'], ['رسوم بلدية', 'municipal fees'], ['ر.ع', 'OMR'], ['المتقدم', 'applicant'], ['الموظف المختص', 'competent employee'], ['رئيس القسم', 'Head of Section']];
  const rh = 46, h = 44 + rows.length * rh;
  let s = R(ML, y - 76, 240, 40, { r: 12, f: C.white, s: C.line }) + I('search', ML + 212, y - 63, 15, C.faint) + T(ML + 202, y - 51, 'ابحث عن مصطلح…', { s: 13.5, f: C.faint });
  s += R(ML, y, MW, h, { r: 24, f: C.white, s: C.line }) + `<path d="M${ML} ${y + 24} a24 24 0 0 1 24 -24 h${MW - 48} a24 24 0 0 1 24 24 v20 h-${MW} z" fill="#f8fafc"/>` + T(MR - 20, y + 28, 'العربية', { s: 12, w: 700, f: C.mut }) + T(ML + MW / 2, y + 28, 'English', { s: 12, w: 700, f: C.mut });
  rows.forEach((r, i) => { const yy = y + 44 + i * rh; s += LINE(ML, yy, MR, yy) + T(MR - 20, yy + 29, r[0], { s: 14, w: 700 }) + T(ML + MW / 2, yy + 29, r[1], { s: 14, w: 500, f: '#334155', a: 'end' }) + I('copy', ML + 26, yy + 16, 14, C.faint); });
  add('glossary-section', s, h);
}

// ───────────────────────── Footer, header on top ─────────────────────────
o += hd.svg;
o += G('footer', R(0, y, W, 120, { f: '#020617' }) + R(0, y, W, 4, { f: C.aqua }) + logo(RX - 83, y + 26, 50, '', true) + T(RX - 110, y + 56, 'مركز الاتصال 1771  ·  portal@dm.gov.om', { s: 13.5, w: 700, f: '#e2e8f0' }) + T(ML, y + 56, '© 2026 بلدية ظفار', { s: 12, f: '#94a3b8', a: 'start' }) + T(W / 2, y + 96, 'سلطنة عمان - محافظة ظفار', { s: 12, w: 700, f: C.aqua, a: 'middle' }));
y += 120;
o += G('accessibility-button', CIRC(ML - 40, y - 170, 28, { f: C.purple, s: C.white, sw: 4 }) + I('accessibility', ML - 52, y - 182, 24, C.white));

y = Math.ceil(y);
board('11-identity-board.svg', W, y, R(0, 0, W, y, { f: '#f8fafc' }) + o, '11', 'لوحة الهوية المتكاملة', 'صفحة /identity/board: عشرون قسماً من الشعار والألوان إلى الكتل والقوالب والمسرد');
