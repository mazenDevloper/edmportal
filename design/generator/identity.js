const { C, R, CIRC, LINE, T, P, I, G, BTN, LOGO, PATTERN, patternSize, HEADER, board } = require('./lib');

/*
 * 02 Identity guide: the public /identity page (src/app/identity/page.tsx) as a design board,
 * same sections and values: logo, colour, typeface, patterns, CSS file, voice & tone.
 * Tokens mirror src/lib/identity/tokens.ts.
 */
const BRAND = [['#03CFCB', 'التيل الحيوي', 'اللون الأساسي للتفاعل والأزرار', '#0f172a'], ['#470D67', 'الأرجواني الملكي', 'العلامة والعناوين الرسمية', '#ffffff'], ['#008E91', 'تيل داكن', 'تدرجات وحالات التحويم', '#ffffff'],
  ['#005751', 'تيل عميق', 'نصوص على خلفيات فاتحة', '#ffffff'], ['#A187B2', 'أرجواني فاتح', 'عناصر ثانوية وزخارف', '#0f172a'], ['#BCA3CC', 'أرجواني ناعم', 'خلفيات هادئة', '#0f172a']];
const NEUTRAL = [['#0F172A', 'حبر', 'النصوص الأساسية', '#ffffff'], ['#475569', 'رمادي أردوازي', 'نصوص ثانوية', '#ffffff'], ['#E2E8F0', 'ضباب', 'الحدود والفواصل', '#0f172a'], ['#F8FAFC', 'غيم', 'خلفية الصفحات', '#0f172a']];
const STATUS = [['#059669', 'نجاح', 'الموافقات والإنجاز', '#ffffff'], ['#D97706', 'تنبيه', 'الاشتراطات والتنبيهات', '#ffffff'], ['#DC2626', 'خطر', 'الرفض والأخطاء', '#ffffff'], ['#2563EB', 'معلومة', 'الإرشاد والمعلومات', '#ffffff']];
const SCALE = [['عرض', 64, 900], ['عنوان 1', 48, 900], ['عنوان 2', 36, 800], ['عنوان 3', 24, 700], ['نص كبير', 20, 400], ['نص', 16, 400], ['تعليق', 12, 700]];
const PATTERNS = [['landmark', 'المعالم', 'dm-pattern-landmark'], ['wave-pro', 'الأمواج', 'dm-pattern-wave-pro'], ['tree-pro', 'الشجرة العمانية', 'dm-pattern-tree-pro'], ['circle-pro', 'الدوائر', 'dm-pattern-circle-pro'], ['matrix-all', 'النمط الشامل', 'dm-pattern-matrix-all']];

const rgb = hex => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const cmyk = hex => { const [r, g, b] = rgb(hex).map(v => v / 255); const k = 1 - Math.max(r, g, b); if (k === 1) return [0, 0, 0, 100]; return [(1 - r - k) / (1 - k), (1 - g - k) / (1 - k), (1 - b - k) / (1 - k), k].map(v => Math.round(v * 100)); };
const lum = hex => { const ch = c => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; }; const [r, g, b] = rgb(hex); return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b); };
const contrast = hex => { const [a, b] = [lum(hex), 1].sort((x, y) => y - x); return (a + 0.05) / (b + 0.05); };
const rating = r => (r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : r >= 3 ? 'AA Large' : 'Fail');

let logoSeq = 0;
const logo = (x, y, h, extra = '') => LOGO(x, y, h).replace('id="logo"', `id="logo-${++logoSeq}" ${extra}`);

function identity() {
  const W = 1440, LX = 144, RX = 1296, CW = RX - LX;
  let o = '', y = 0;
  const hd = HEADER(W, 0); y = hd.h;

  // Hero
  const hh = 330, ps = patternSize('landmark'), pw = hh * ps.w / ps.h;
  o += G('hero', `<linearGradient id="g-id-hero" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#470D67"/><stop offset="1" stop-color="#2a0640"/></linearGradient>` +
    R(0, y, W, hh, { f: 'url(#g-id-hero)' }) + PATTERN('landmark', W / 2 - pw / 2, y, pw, { op: 0.10 }) +
    T(RX, y + 70, 'للمصممين والشركاء', { s: 12, w: 700, f: C.aqua, ls: 1.5 }) + T(RX, y + 138, 'دليل الهوية البصرية', { s: 60, w: 700, f: C.white }) +
    P(RX, y + 182, 'الأساسيات التي تحتاجها لتصميم أي مادة باسم بلدية ظفار: الشعار، والألوان، والخط، والأنماط الزخرفية، مع ملف CSS جاهز للاستخدام.', 74, { s: 18, f: '#e7dced' }).svg +
    BTN(RX - 200, y + 250, 200, 48, 'تنزيل ملف CSS', { f: C.aqua, c: C.ink, r: 16, icon: 'download' }) + BTN(RX - 200 - 12 - 150, y + 250, 150, 48, 'عرض الملف', { f: 'none', stroke: 'rgba(255,255,255,0.4)', sw: 2, r: 16, icon: 'external-link', is: 16 }));
  y += hh;

  // Section nav
  let nx = RX, nav = R(0, y, W, 48, { f: C.white }) + LINE(0, y + 48, W, y + 48);
  ['الشعار', 'الألوان', 'الخط', 'الأنماط', 'ملف CSS', 'أسلوب الكتابة'].forEach((n, i) => { const w = n.length * 9 + 32; nav += T(nx - 16, y + 30, n, { s: 14, w: 700, f: i === 0 ? C.teal : '#475569' }) + (i === 0 ? R(nx - w, y + 45, w, 3, { f: C.aqua }) : ''); nx -= w; });
  o += G('section-nav', nav); y += 48 + 48;

  const head = (title, desc) => { o += T(RX, y + 28, title, { s: 30, w: 700 }) + T(RX, y + 58, desc, { s: 15, f: '#64748b' }); y += 84; };
  const card = (x, yy, w, h, title) => R(x, yy, w, h, { r: 24, f: C.white, s: C.line }) + (title ? T(x + w - 20, yy + 34, title, { s: 14, w: 700, f: '#64748b' }) : '');

  // ── Logo ──
  head('الشعار', 'الاستخدام الصحيح لشعار بلدية ظفار: النسخ المعتمدة، والمساحة الآمنة، والحد الأدنى للحجم، وما يجب تجنبه.');
  o += R(LX, y - 74, 170, 40, { r: 12, f: C.white, s: C.line }) + I('copy', LX + 142, y - 62, 14, C.text) + T(LX + 134, y - 49, 'نسخ رابط الشعار', { s: 13.5, w: 700, f: C.text });
  const lw = CW * 1.2 / 2.2 - 8, rw = CW - lw - 16, lh = 380;
  let lg = card(RX - lw, y, lw, lh, 'المساحة الآمنة والحد الأدنى') + R(RX - lw + 20, y + 52, lw - 40, 210, { r: 16, f: '#f8fafc' });
  const bx = RX - lw / 2 - 98, byy = y + 85;
  lg += R(bx, byy, 196, 144, { r: 0, f: 'none', s: C.aqua, sw: 2, dash: '7 6' }) + logo(bx + 32, byy + 32, 80) +
    [[bx + 98, byy], [bx + 98, byy + 144], [bx, byy + 72], [bx + 196, byy + 72]].map(pt => R(pt[0] - 12, pt[1] - 12, 24, 24, { r: 4, f: '#b3f1ef' }) + T(pt[0], pt[1] + 4, 'x', { s: 10, w: 700, f: C.teal, a: 'middle' })).join('');
  [['x', 'المساحة الآمنة = ارتفاع الحرف في الشعار من كل جهة'], ['32px', 'أصغر ارتفاع رقمي للشعار الكامل'], ['24px', 'أصغر حجم للرمز (الأيقونة) منفرداً']].forEach((it, i) => {
    const w = (lw - 56) / 3, x = RX - 20 - (i + 1) * w - i * 8;
    lg += R(x, y + 276, w, 84, { r: 12, f: '#f8fafc' }) + T(x + w - 12, y + 302, it[0], { s: 14, w: 700 }) + P(x + w - 12, y + 322, it[1], 26, { s: 11.5, w: 700, f: '#475569', lh: 17 }).svg;
  });
  let vr = card(LX, y, rw, lh, 'النسخ المعتمدة');
  [['#ffffff', 'على خلفية فاتحة', '', C.line, '#475569'], ['#005751', 'على اللون الأساسي', 'filter="url(#white)"', 'none', '#e2e8f0'], ['#020617', 'على خلفية داكنة', 'filter="url(#white)"', 'none', '#e2e8f0'], ['#f1f5f9', 'أحادي اللون', 'filter="url(#gray)"', C.line, '#475569']].forEach((v, i) => {
    const w = (rw - 52) / 2, h = 150, x = LX + rw - 20 - (i % 2 + 1) * w - (i % 2) * 12, yy = y + 52 + Math.floor(i / 2) * (h + 12);
    vr += R(x, yy, w, h, { r: 16, f: v[0], s: v[3] === 'none' ? undefined : v[3] }) + logo(x + w / 2 - 46, yy + 28, 56, v[2]) + T(x + w / 2, yy + 126, v[1], { s: 11, w: 700, f: v[4], a: 'middle' });
  });
  o += G('logo-section', `<filter id="gray"><feColorMatrix type="saturate" values="0"/></filter><filter id="hue"><feColorMatrix type="hueRotate" values="160"/><feColorMatrix type="saturate" values="3"/></filter><filter id="fx"><feDropShadow dx="6" dy="6" stdDeviation="0" flood-color="#f59e0b"/></filter>` + lg + vr);
  y += lh + 16;
  let donts = '';
  [['لا تمدّد الشعار', c => `transform="translate(${c.x - 20} 0) scale(1.5 1) translate(${-c.x * 1 / 1.5 + c.x / 1.5 - c.x / 1.5 + c.x / 1.5} 0)"`], ['لا تغيّر ألوانه', () => 'filter="url(#hue)"'], ['لا تُدِره', c => `transform="rotate(-18 ${c.x + 40} ${c.y + 24})"`], ['لا تضف ظلالاً', () => 'filter="url(#fx)"']].forEach((d, i) => {
    const w = (CW - 36) / 4, x = RX - (i + 1) * w - i * 12, cxm = x + w / 2;
    const lx0 = cxm - 40, ly0 = y + 26;
    const extra = i === 0 ? `transform="translate(${cxm} 0) scale(1.5 1) translate(${-cxm} 0)"` : d[1]({ x: lx0, y: ly0 });
    donts += R(x, y, w, 130, { r: 16, f: C.white, s: '#fee2e2' }) + logo(lx0, ly0, 48, extra) + I('square-x', cxm + 62, y + 14, 20, '#ef4444') + T(cxm, y + 108, d[0], { s: 12, w: 700, f: '#b91c1c', a: 'middle' });
  });
  o += G('logo-donts', donts); y += 130 + 64;

  // ── Colour ──
  head('الألوان', 'قيم الألوان للشاشة (HEX / RGB) وللطباعة (CMYK تقريبية). انقر على أي قيمة لنسخها.');
  for (const [title, list] of [['ألوان العلامة', BRAND], ['الألوان المحايدة', NEUTRAL], ['ألوان الحالات', STATUS]]) {
    o += T(RX, y + 14, title, { s: 14, w: 700, f: '#94a3b8', ls: 1 }); y += 30;
    let row = '';
    list.forEach((c, i) => {
      const w = (CW - 60) / 6, x = RX - (i + 1) * w - i * 12, [r, g, b] = rgb(c[0]), k = cmyk(c[0]), cr = contrast(c[0]);
      row += G(`color-${c[0].slice(1)}`, R(x, y, w, 196, { r: 16, f: C.white, s: C.line }) + `<path d="M${x} ${y + 16} a16 16 0 0 1 16 -16 h${w - 32} a16 16 0 0 1 16 16 v64 h-${w} z" fill="${c[0]}"/>` + T(x + 10, y + 70, c[0], { s: 12, w: 700, f: c[3], a: 'start' }) +
        T(x + w - 12, y + 106, c[1], { s: 14, w: 700 }) + T(x + 12, y + 128, `RGB ${r} ${g} ${b}`, { s: 10.5, f: '#64748b', a: 'start' }) + T(x + 12, y + 146, `CMYK ${k.join(' ')}`, { s: 10.5, f: '#64748b', a: 'start' }) +
        T(x + w - 12, y + 170, `على الأبيض ${cr.toFixed(1)}:1 ${rating(cr)}`, { s: 10, w: 700, f: '#94a3b8' }) + T(x + w - 12, y + 186, c[2], { s: 9.5, f: '#94a3b8' }));
    });
    o += row; y += 196 + 32;
  }
  y += 32;

  // ── Typeface ──
  head('الخط', 'الخط المعتمد Readex Pro للعربية والإنجليزية، متاح مجاناً من Google Fonts.');
  const tl = CW / 2.4 - 8, tr = CW - tl - 16, th = 470;
  let ty = card(RX - tl, y, tl, th) + T(RX - 24, y + 100, 'أ ب ج', { s: 72, w: 700, f: C.teal }) + T(RX - tl + 24, y + 180, 'Aa Bb', { s: 48, w: 700, f: C.purple, a: 'start' });
  let wx = RX - 24;
  [['خفيف 200', 300], ['عادي 400', 400], ['عريض 700', 700], ['أسود 900', 700]].forEach(wt => { const w = 96; ty += R(wx - w, y + 216, w, 34, { r: 12, f: '#f1f5f9' }) + T(wx - w / 2, y + 238, wt[0], { s: 13, w: wt[1], f: '#334155', a: 'middle' }); wx -= w + 8; });
  ty += I('type', RX - 42, y + 276, 16, C.teal) + T(RX - 50, y + 290, 'تنزيل الخط من Google Fonts', { s: 14, w: 700, f: C.teal });
  let sc = card(LX, y, tr, th);
  SCALE.forEach((s, i) => {
    const yy = y + i * (th / 7);
    sc += (i ? LINE(LX, yy, LX + tr, yy) : '') + T(LX + tr - 20, yy + 30, s[0], { s: 12, w: 700, f: '#64748b' }) + T(LX + tr - 20, yy + 48, `${s[1]}/${s[2]}`, { s: 11, f: '#94a3b8' }) +
      T(LX + tr - 130, yy + th / 14 + Math.min(s[1], 40) * 0.34, 'بلدية ظفار', { s: Math.min(s[1], 40), w: Math.min(s[2], 700), f: C.ink });
  });
  o += G('typeface-section', ty + sc); y += th + 64;

  // ── Patterns ──
  head('الأنماط الزخرفية', 'زخارف مستوحاة من معالم ظفار؛ تُستخدم بشفافية 10–30% فوق ألوان العلامة.');
  let pt = '';
  PATTERNS.forEach((p, i) => {
    const w = (CW - 48) / 5, x = RX - (i + 1) * w - i * 12, sz = patternSize(p[0]);
    const clip = `clip-pat-${i}`;
    const tile = p[0] === 'landmark' ? PATTERN(p[0], x + w / 2 - (112 * sz.w / sz.h) / 2, y, 112 * sz.w / sz.h, { op: 0.3 }) :
      Array.from({ length: 6 }, (_, k) => PATTERN(p[0], x - 20 + (k % 3) * (w / 2.2), y - 10 + Math.floor(k / 3) * (w / 2.2 * sz.h / sz.w), w / 2.2, { op: 0.3 })).join('');
    pt += G(`pattern-card-${p[0]}`, R(x, y, w, 176, { r: 16, f: C.white, s: C.line }) + `<clipPath id="${clip}"><path d="M${x} ${y + 16} a16 16 0 0 1 16 -16 h${w - 32} a16 16 0 0 1 16 16 v96 h-${w} z"/></clipPath><g clip-path="url(#${clip})">` + R(x, y, w, 112, { f: C.teal }) + tile + '</g>' +
      T(x + w - 12, y + 138, p[1], { s: 14, w: 700 }) + T(x + 12, y + 160, '.' + p[2], { s: 11, f: '#94a3b8', a: 'start' }));
  });
  o += pt; y += 176 + 16;
  let rx2 = RX;
  [['متوسط', '12px'], ['كبير', '20px'], ['واسع', '32px'], ['كبسولة', '∞']].forEach(r => { const w = 150; o += R(rx2 - w, y, w, 34, { r: 12, f: C.white, s: C.line }) + T(rx2 - w / 2, y + 22, `زاوية ${r[0]}: ${r[1]}`, { s: 12, w: 700, f: '#475569', a: 'middle' }); rx2 -= w + 12; });
  y += 34 + 64;

  // ── CSS file ──
  head('ملف CSS', 'يحتوي الملف على متغيرات الألوان والخطوط والمسافات والزوايا، والأنماط الزخرفية، وأزرار وبطاقات جاهزة.');
  const cwd = (CW - 16) / 2, chh = 290;
  let css = R(RX - cwd, y, cwd, chh, { r: 24, f: '#020617' });
  ['<link rel="stylesheet" href="/brand/dhofar-identity.css">', '', '<div class="dm-root">', '  <h1 class="dm-text-h1 dm-text-color-purple">…</h1>', '  <a class="dm-btn dm-btn-primary">…</a>', '  <div class="dm-card dm-pattern-wave-pro">…</div>', '</div>', '', '.my-banner { background: var(--dm-teal-deep);', '  border-radius: var(--dm-radius-xl); }']
    .forEach((l, i) => { css += `<text x="${RX - cwd + 24}" y="${y + 44 + i * 23}" font-family="Consolas, 'Courier New', monospace" font-size="13" fill="#e2e8f0" text-anchor="start" xml:space="preserve">${l.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</text>`; });
  let cs2 = card(LX, y, cwd, chh);
  cs2 += `<linearGradient id="g-btn1" x1="0" x2="1"><stop offset="0" stop-color="#03CFCB"/><stop offset="1" stop-color="#008E91"/></linearGradient><linearGradient id="g-btn3" x1="0" x2="1"><stop offset="0" stop-color="#470D67"/><stop offset="1" stop-color="#6b149b"/></linearGradient>`;
  [['dm-btn-primary', 'url(#g-btn1)', C.ink, 170], ['dm-btn-secondary', '#005751', C.white, 190], ['dm-btn-royal', 'url(#g-btn3)', C.white, 150]].reduce((x, b) => { cs2 += R(x - b[3], y + 28, b[3], 44, { r: 20, f: b[1] }) + T(x - b[3] / 2, y + 56, b[0], { s: 14.5, w: 700, f: b[2], a: 'middle' }); return x - b[3] - 8; }, LX + cwd - 24);
  [['dm-badge-success', '#d1fae5', '#047857', 150], ['dm-badge-warning', '#fef3c7', '#92400e', 152], ['dm-badge-danger', '#fee2e2', '#b91c1c', 144], ['dm-badge-info', '#e0f2fe', '#0369a1', 124]].reduce((x, b) => { cs2 += R(x - b[3], y + 96, b[3], 26, { r: 13, f: b[1] }) + T(x - b[3] / 2, y + 113, b[0], { s: 12, w: 700, f: b[2], a: 'middle' }); return x - b[3] - 6; }, LX + cwd - 24);
  cs2 += BTN(LX + cwd - 24 - 120, y + 150, 120, 44, 'تنزيل', { f: C.teal, r: 12, s: 14, icon: 'download', is: 16 }) + BTN(LX + cwd - 24 - 120 - 8 - 170, y + 150, 170, 44, 'نسخ وسم الربط', { f: C.white, c: '#334155', stroke: C.line, sw: 2, r: 12, s: 14, icon: 'copy', is: 15 });
  o += G('css-section', css + cs2); y += chh + 64;

  // ── Voice & tone ──
  head('أسلوب الكتابة', 'كيف تتحدث البلدية في واجهاتها ورسائلها: واضحة، ومحترمة، ومفيدة.');
  let vo = '';
  [['user', 'خاطب المستفيد مباشرة', 'استخدم «أنت» و«طلبك» بدلاً من «المستفيد» و«الطلب المذكور».'], ['check', 'ابدأ بالأهم', 'اذكر النتيجة أو الإجراء المطلوب في أول جملة.'], ['message-square', 'بسيط ورسمي', 'جمل قصيرة بلغة عربية فصحى سهلة، دون مصطلحات تقنية.'], ['shield-check', 'طمئن وأرشد', 'عند الخطأ، اشرح ما حدث وما الخطوة التالية دون لوم المستخدم.']].forEach((pr, i) => {
    const w = (CW - 36) / 4, x = RX - (i + 1) * w - i * 12;
    vo += R(x, y, w, 150, { r: 16, f: C.white, s: C.line }) + R(x + w - 16 - 36, y + 16, 36, 36, { r: 12, f: '#470D67', op: 0.1 }) + I(pr[0], x + w - 16 - 27, y + 25, 17, C.purple) + T(x + w - 16, y + 80, pr[1], { s: 16, w: 700 }) + P(x + w - 16, y + 104, pr[2], 38, { s: 12, f: '#475569', lh: 19 }).svg;
  });
  y += 150 + 16;
  [['حدث خطأ غير متوقع (Error 500).', 'تعذر حفظ طلبك الآن. لم تُفقد بياناتك؛ حاول مرة أخرى بعد قليل.'], ['يتوجب على المستفيد إرفاق كافة المستندات المطلوبة.', 'أرفق صورة الموقع من الجهات الأربع لإكمال طلبك.'], ['تم رفض الطلب.', 'لم نتمكن من اعتماد طلبك لأن الموقع خارج اختصاص البلدية. يمكنك التواصل على 1771.']].forEach(pair => {
    const w = (CW - 12) / 2;
    vo += R(RX - w, y, w, 78, { r: 16, f: '#fef7f7', s: '#fecaca', sw: 2 }) + I('circle-x', RX - 16 - 14, y + 13, 14, '#b91c1c') + T(RX - 36, y + 25, 'تجنّب', { s: 12, w: 700, f: '#b91c1c' }) + T(RX - 16, y + 56, pair[0], { s: 14, w: 700, f: '#334155' }) +
      R(LX, y, w, 78, { r: 16, f: '#f3fbf7', s: '#a7f3d0', sw: 2 }) + I('circle-check', LX + w - 16 - 14, y + 13, 14, '#047857') + T(LX + w - 36, y + 25, 'اكتب هكذا', { s: 12, w: 700, f: '#047857' }) + T(LX + w - 16, y + 56, pair[1], { s: 14, w: 700, f: '#334155' });
    y += 78 + 12;
  });
  o += G('voice-section', vo); y += 60;

  o += hd.svg;
  // Footer (collapsed)
  o += G('footer', R(0, y, W, 120, { f: '#020617' }) + R(0, y, W, 4, { f: C.aqua }) + LOGO(RX - 110, y + 26, 50, true) + T(RX - 190, y + 56, 'مركز الاتصال 1771  ·  info@edm.gov.om', { s: 13.5, w: 700, f: '#e2e8f0' }) + T(LX, y + 56, '© 2026 بلدية ظفار', { s: 12, f: '#94a3b8', a: 'start' }) + T(W / 2, y + 96, 'آخر تحديث لهذه الصفحة: 6 أكتوبر 2026', { s: 12, w: 700, f: C.aqua, a: 'middle' }));
  y += 120;

  board('02-identity-guide.svg', W, y, R(0, 0, W, y, { f: '#f8fafc' }) + o, '02', 'دليل الهوية البصرية', 'صفحة /identity للمصمم والمطور: الشعار، الألوان، الخط، الأنماط، ملف CSS، أسلوب الكتابة');
}

identity();
