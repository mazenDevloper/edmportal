const { C, R, CIRC, LINE, T, P, I, G, LOGO, HEADER, board } = require('./lib');

/*
 * 10 Open data: "periods and wilayat analysis" tab (/open-data/hub), first quarter of 2026.
 * Layout and figures follow the live screen: filter bar, period cards, monthly columns,
 * distribution by wilaya, and the six breakdowns.
 */
const SRC = { rent: ['#00979B', 'عقود الإيجار'], dig: ['#7B3FA8', 'تراخيص الحفر'], lic: ['#C2560C', 'التراخيص البلدية'], build: ['#2563EB', 'تراخيص البناء'] };
const ar = n => Number(n).toLocaleString('en').replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);

const KPI = [['rent', 5645, -19.1], ['dig', 255, 4.8], ['lic', 8644, -6.1], ['build', 678, -16.7]];
const MONTHS = ['يناير 26', 'فبراير 26', 'مارس 26'];
const MONTHLY = { rent: [[2560, 1705, 1380], 2600], dig: [[83, 84, 88], 100], lic: [[3380, 2715, 2549], 3400], build: [[249, 234, 195], 260] };
const WILAYAT = [['صلالة', 4568, 140, 6690, 492], ['طاقة', 289, 24, 621, 58], ['ضلكوت', 124, 1, 310, 1], ['ثمريت', 110, 49, 233, 33], ['مرباط', 138, 12, 228, 33], ['شليم وجزر الحلانيات', 89, 9, 234, 19],
  ['المزيونة', 75, 7, 121, 26], ['رخيوت', 80, 3, 137, 2], ['سدح', 53, 7, 63, 11], ['نيابات ولاية صلالة', 105, 0, 0, 0], ['مقشن', 14, 3, 5, 3], ['السيب', 0, 0, 1, 0], ['صحار', 0, 0, 1, 0]];
const BREAKDOWNS = [
  ['التراخيص البلدية حسب النشاط', 'lic', [['أعمال البناء والمقاولات', 1029, 26], ['تأجير المعدات التجارية والآلات المهنية', 533, 13], ['ورشة إصلاح المركبات (جراج)', 498, 12], ['بيع الملبوسات والأحذية والأصناف الجلدية بالتجزئة', 453, 11], ['خدمات التنظيف', 422, 11], ['مطعم', 420, 10]]],
  ['تراخيص البناء حسب نوع المبنى', 'build', [['فيلا', 531, 78], ['بناية', 67, 10], ['أخرى', 49, 7], ['محطة توزيع كهرباء', 12, 2], ['معرض', 10, 1], ['برج تقوية اتصالات', 9, 1]]],
  ['تراخيص البناء حسب نوع الترخيص', 'build', [['ترخيص بناء جديد', 423, 62], ['تعديل / اضافة / تجديد (ترخيص بناء)', 192, 28], ['ملحق ترخيص (تسوير)', 16, 2], ['ترخيص بناء (السكن الريفي)', 14, 2], ['ملحق ترخيص (هدم)', 10, 1], ['ملحق ترخيص (محطات توزيع كهرباء)', 10, 1]]],
  ['عقود الإيجار حسب الاستخدام', 'rent', [['تجاري', 4165, 74], ['سكني', 1371, 24], ['استثمار', 108, 2], ['مهني', 1, 0]]],
  ['عقود الإيجار حسب الحالة', 'rent', [['تجديد', 2943, 52], ['جديد', 2498, 44], ['ملغي', 204, 4]]],
  ['تراخيص الحفر حسب نوع المشروع', 'dig', [['كهرباء', 228, 89], ['اتصالات', 18, 7], ['طرق', 5, 2], ['مياه', 3, 1], ['انارة', 1, 0]]],
];

/** A bar that grows from the right edge, with rounded ends */
const bar = (xRight, y, w, h, color) => (w <= 0 ? '' : R(xRight - Math.max(w, h * 0.5), y, Math.max(w, h * 0.5), h, { r: h / 2, f: color }));

function analysis() {
  const W = 1440, LX = 96, RX = 1344, CW = RX - LX;
  let o = '', y = 0;
  const hd = HEADER(W, 0); y = hd.h + 40;

  // Tabs
  o += G('tabs', R(W / 2 - 172, y, 344, 54, { r: 20, f: C.white, s: C.line }) + R(W / 2 - 166, y + 6, 190, 42, { r: 14, f: C.ink }) + T(W / 2 - 71, y + 33, 'تحليل الفترات والولايات', { s: 14.5, w: 700, f: C.white, a: 'middle' }) + T(W / 2 + 96, y + 33, 'المؤشرات العامة', { s: 14.5, w: 700, f: C.mut, a: 'middle' }));
  y += 54 + 40;

  // Filter bar
  let f = R(LX, y, CW, 124, { r: 28, f: C.white, s: C.line }) + I('filter', RX - 44, y + 30, 18, C.faint);
  let cx = RX - 60;
  ['الربع الأول 2026', 'الربع الثاني 2026', 'الربع الثالث 2026', 'الربع الرابع 2026', 'كامل عام 2026', 'منذ 2020'].forEach((c, i) => {
    const w = c.length * 6.6 + 28;
    f += R(cx - w, y + 22, w, 36, { r: 18, f: i === 0 ? C.teal : C.soft }) + T(cx - w / 2, y + 45, c, { s: 13, w: 700, f: i === 0 ? C.white : C.text, a: 'middle' });
    cx -= w + 8;
  });
  f += R(LX + 20, y + 22, 62, 36, { r: 18, f: C.ink }) + T(LX + 51, y + 45, 'تطبيق', { s: 13, w: 700, f: C.white, a: 'middle' });
  [['إلى', '03/31/2026', LX + 90], ['من', '01/01/2026', LX + 250]].forEach(d => {
    f += R(d[2], y + 22, 126, 36, { r: 18, f: C.white, s: C.line }) + I('calendar', d[2] + 98, y + 32, 15, C.mut) + T(d[2] + 12, y + 45, d[1], { s: 12.5, w: 700, a: 'start' }) + T(d[2] + 152, y + 45, d[0], { s: 13, w: 700 });
  });
  f += LINE(LX + 20, y + 74, RX - 20, y + 74) + I('map-pin', RX - 44, y + 87, 16, C.violet) + T(RX - 54, y + 101, 'الولاية:', { s: 13, f: C.mut }) + T(RX - 104, y + 101, 'كافة الولايات', { s: 13, w: 700 }) +
    T(LX + 20, y + 101, 'من 2026-01-01 إلى 2026-03-31', { s: 11.5, f: C.faint, a: 'start' }) + T(LX + 400, y + 101, 'تضمين بيانات اليوم (غير مكتملة)', { s: 12.5, w: 700, f: C.text }) + R(LX + 408, y + 88, 16, 16, { r: 4, f: C.white, s: C.mut });
  o += G('filter-bar', f); y += 124 + 24;

  // Period cards
  let k = '';
  KPI.forEach((it, i) => {
    const w = (CW - 72) / 4, x = RX - (i + 1) * w - i * 24, up = it[2] > 0;
    k += G(`kpi-${it[0]}`, R(x, y, w, 116, { r: 24, f: C.white, s: C.line }) + CIRC(x + w - 24, y + 28, 5, { f: SRC[it[0]][0] }) + T(x + w - 38, y + 33, `${SRC[it[0]][1]} في الفترة`, { s: 13, w: 700, f: C.mut }) +
      T(x + w - 20, y + 72, ar(it[1]), { s: 30, w: 700 }) + I(up ? 'trending-up' : 'trending-down', x + w - 34, y + 86, 14, up ? '#047857' : '#b91c1c') +
      T(x + w - 42, y + 98, `${up ? '+' : '-'}${ar(Math.abs(it[2])).replace('.', '٫')}%`, { s: 12, w: 700, f: up ? '#047857' : '#b91c1c' }) + T(x + w - 92, y + 98, '(مارس) مقارنة بالشهر السابق', { s: 12, f: C.faint }));
  });
  o += k; y += 116 + 24;

  // Monthly columns
  ['rent', 'dig', 'lic', 'build'].forEach((id, i) => {
    const w = (CW - 24) / 2, h = 350, x = RX - (i % 2 + 1) * w - (i % 2) * 24, yy = y + Math.floor(i / 2) * (h + 24);
    const [vals, max] = MONTHLY[id], p0 = x + 28, p1 = x + w - 84, top = yy + 76, bot = yy + h - 86;
    let c = R(x, yy, w, h, { r: 28, f: C.white, s: C.line }) + T(x + w - 28, yy + 44, `${SRC[id][1]} شهرياً`, { s: 18, w: 700 });
    for (let t = 0; t <= 4; t++) { const gy = bot - (bot - top) * t / 4; c += LINE(p0, gy, p1, gy, { s: t ? '#eef2f6' : '#cbd5e1' }) + T(x + w - 28, gy + 4, ar(max * t / 4), { s: 11, f: C.faint }); }
    vals.forEach((v, m) => { const bx = p1 - (m + 0.5) * (p1 - p0) / 3, bh = (bot - top) * v / max; c += `<path d="M${bx - 18} ${bot} v${-(bh - 4)} a4 4 0 0 1 4 -4 h28 a4 4 0 0 1 4 4 v${bh - 4} z" fill="${SRC[id][0]}"/>` + T(bx, bot + 22, MONTHS[m], { s: 11.5, f: C.mut, a: 'middle' }); });
    c += T(x + w - 28, yy + h - 26, '◄ عرض كجدول', { s: 13, w: 700, f: C.mut });
    o += G(`monthly-${id}`, c);
  });
  y += 2 * 350 + 24 + 24;

  // Distribution by wilaya
  const rh = 40, th = 110 + WILAYAT.length * rh + 20, colw = (CW - 56 - 230) / 4, ids = ['rent', 'dig', 'lic', 'build'];
  let t = R(LX, y, CW, th, { r: 28, f: C.white, s: C.line }) + T(RX - 28, y + 44, 'توزيع المعاملات حسب ولايات ظفار', { s: 18, w: 700 }) + T(LX + 28, y + 42, 'اختر ولاية لتصفية باقي الأرقام', { s: 12, w: 700, f: C.faint, a: 'start' }) + T(RX - 28, y + 86, 'الولاية', { s: 12.5, w: 700, f: C.mut });
  ids.forEach((id, c) => { const cr = RX - 28 - 230 - c * colw; t += CIRC(cr - 5, y + 82, 5, { f: SRC[id][0] }) + T(cr - 18, y + 86, SRC[id][1], { s: 12.5, w: 700, f: C.mut }); });
  WILAYAT.forEach((row, r) => {
    const ry = y + 104 + r * rh;
    t += LINE(LX + 28, ry, RX - 28, ry) + T(RX - 28, ry + 26, row[0], { s: 14, w: 700 });
    ids.forEach((id, c) => {
      const cr = RX - 28 - 230 - c * colw, v = row[c + 1], max = Math.max(...WILAYAT.map(x => x[c + 1])), tw = colw - 96;
      t += R(cr - tw, ry + 16, tw, 9, { r: 4.5, f: C.soft }) + bar(cr, ry + 16, tw * v / max, 9, SRC[id][0]) + T(cr - tw - 12, ry + 25, ar(v), { s: 13, w: 700, f: C.text });
    });
  });
  o += G('by-wilaya', t); y += th + 24;

  // Six breakdowns
  const bw = (CW - 48) / 3, bh = 372;
  BREAKDOWNS.forEach((b, i) => {
    const x = RX - (i % 3 + 1) * bw - (i % 3) * 24, yy = y + Math.floor(i / 3) * (bh + 24), max = b[2][0][1];
    let c = R(x, yy, bw, bh, { r: 28, f: C.white, s: C.line }) + T(x + bw - 24, yy + 42, b[0], { s: 16.5, w: 700 }), iy = yy + 78;
    b[2].forEach(it => {
      const lab = P(x + bw - 24, iy, it[0], 34, { s: 13, w: 700, f: C.text, lh: 20 });
      c += lab.svg + T(x + 24, iy, `(${it[2]}%)`, { s: 12, f: C.faint, a: 'start' }) + T(x + 66, iy, ar(it[1]), { s: 13, w: 700, a: 'start' });
      iy += lab.h - 8;
      c += R(x + 24, iy, bw - 48, 8, { r: 4, f: C.soft }) + bar(x + bw - 24, iy, (bw - 48) * it[1] / max, 8, SRC[b[1]][0]);
      iy += 34;
    });
    o += G(`breakdown-${i + 1}`, c);
  });
  y += 2 * bh + 24 + 56;

  o += hd.svg;
  o += G('footer', R(0, y, W, 120, { f: '#020617' }) + R(0, y, W, 4, { f: C.aqua }) + LOGO(RX - 110, y + 26, 50, true) + T(RX - 190, y + 56, 'مركز الاتصال 1771  ·  portal@dm.gov.om', { s: 13.5, w: 700, f: '#e2e8f0' }) + T(LX, y + 56, '© 2026 بلدية ظفار', { s: 12, f: '#94a3b8', a: 'start' }) + T(W / 2, y + 96, 'المصدر: واجهة البيانات المفتوحة · تُحدَّث الأرقام تلقائياً', { s: 12, w: 700, f: C.aqua, a: 'middle' }));
  y += 120;

  board('10-open-data-analysis.svg', W, y, R(0, 0, W, y, { f: '#f1f5f9' }) + o, '10', 'البيانات المفتوحة · تحليل الفترات والولايات', 'الربع الأول 2026: بطاقات الفترة، الأعمدة الشهرية، التوزيع حسب الولايات، والتفصيلات الستة');
}

analysis();
