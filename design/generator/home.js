const { C, R, CIRC, LINE, T, P, I, G, BTN, CHIP, IMG, NOTE, LOGO, LEGEND, PATTERN, HEADER, board } = require('./lib');

// ───────────────────────── 01 Home page, desktop 1440 ─────────────────────────
function homeDesktop() {
  const W = 1440, LX = 120, RX = 1320, CW = RX - LX;
  let y = 0, out = '';
  const sec = (id, h, inner) => { out += G(id, inner); y += h; };

  // 1 Header: slim message bar, then menu + search, hanging logo, language + sign-in
  const hd = HEADER(W, 0); y += hd.h; // drawn last, so the hanging logo sits over the hero

  // 2 Welcome and search, over a faint landmark pattern
  const hy = y;
  let chips = '', cx = RX;
  ['تراخيص البناء', 'عقود الإيجار', 'تصريح حفر', 'التراخيص البلدية', 'حجز تذاكر'].forEach(c => { const ch = CHIP(cx, hy + 318, c, { f: C.white, c: C.text, stroke: C.line, h: 34 }); chips += ch.svg; cx -= ch.w + 10; });
  sec('02-welcome-search', 400,
    R(0, hy, W, 400, { f: '#f6f8fa' }) + `<clipPath id="clip-hero"><rect x="0" y="${hy}" width="${W}" height="400"/></clipPath><g id="landmark-pattern" clip-path="url(#clip-hero)">` +
      [[40, 150], [200, 190], [400, 150], [560, 120]].map(m => PATTERN('landmark', m[0], hy + 400 - m[1] * 388 / 261, m[1], { op: 0.09 })).join('') + '</g>' +
    T(RX, hy + 128, 'مرحباً', { s: 60, w: 700, f: C.teal2 }) + T(RX, hy + 186, 'كيف يمكننا مساعدتك اليوم؟', { s: 30, w: 400 }) +
    R(RX - 840, hy + 226, 840, 64, { r: 32, f: C.white, s: '#94a3b8' }) + T(RX - 30, hy + 265, 'ابحث عن خدمة بلدية…', { s: 17, f: C.faint }) + CIRC(RX - 840 + 32, hy + 258, 27, { f: C.teal }) + I('search', RX - 840 + 21, hy + 247, 22, C.white) +
    chips + LINE(0, hy + 400, W, hy + 400));

  // 3 Banner (managed from the banners tool)
  const by = y + 44;
  sec('03-banner', 470,
    R(LX, by, CW, 380, { r: 0, f: '#eaf4f3' }) + `<path d="M${LX} ${by} H${LX + 250} C ${LX + 430} ${by + 70}, ${LX + 500} ${by + 210}, ${LX + 480} ${by + 380} H${LX} Z" fill="${C.teal}"/>` +
    PATTERN('landmark', LX + 30, by + 380 - 170 * 388 / 261, 170, { op: 0.16 }) + IMG(LX + 150, by + 90, 250, 290, { r: 20, f: '#0a6b64', label: '' }) + T(LX + 275, by + 240, 'صورة الحملة', { s: 13, w: 700, f: '#cfe9e7', a: 'middle' }) +
    LOGO(RX - 40 - 120, by + 44, 72) +
    T(RX - 40, by + 200, 'خدمات بلدية ظفار', { s: 50, w: 700, f: C.teal }) + T(RX - 40, by + 266, 'في منفذ رقمي موحّد', { s: 50, w: 700, f: C.teal }) +
    T(RX - 40, by + 310, 'قدّم طلبك، تابع معاملتك، وسدّد رسومك إلكترونياً.', { s: 18, f: C.text }) +
    BTN(RX - 40 - 220, by + 330, 220, 46, 'العرض الافتراضي', { f: 'url(#g-night)', icon: 'glasses' }) + BTN(RX - 40 - 500, by + 330, 264, 46, 'رحلة التحول الرقمي VR', { f: 'url(#g-purple)', icon: 'glasses' }) +
    [0, 1, 2, 3].map(i => CIRC(W / 2 - 24 + i * 16, by + 404, i === 0 ? 5 : 4, { f: i === 0 ? C.teal2 : C.faint })).join(''));

  // 4 News ticker (slim strip)
  const yTicker = y + 22;
  sec('04-news-ticker', 76,
    R(LX, y, CW, 44, { r: 22, f: C.white, s: C.line }) + R(RX - 96, y + 7, 88, 30, { r: 15, f: C.teal }) + T(RX - 52, y + 27, 'عاجل', { s: 13, w: 700, f: C.white, a: 'middle' }) +
    T(RX - 112, y + 28, 'بدء استقبال طلبات المشاركة في مجلة Agora  •  تحديث بيانات تراخيص البناء يومياً  •  ملتقى الخدمات الرقمية 12 أكتوبر', { s: 13.5, f: C.text }));

  // 5 Quick services
  y += 10;
  const sy = y;
  const tabs = ['الكل', 'الأفراد', 'الأعمال', 'الجهات الحكومية'];
  let tx = RX, tabSvg = '';
  tabs.forEach((t, i) => { const ch = CHIP(tx, sy + 50, t, { f: i === 0 ? C.teal : C.white, c: i === 0 ? C.white : C.text, stroke: i === 0 ? undefined : C.line, h: 36, s: 14 }); tabSvg += ch.svg; tx -= ch.w + 8; });
  const svcs = [['building-2', 'تراخيص البناء', '5 أيام عمل'], ['file-signature', 'توثيق عقود الإيجار', 'فوري'], ['store', 'التراخيص البلدية', '3 أيام عمل'], ['construction', 'تصريح حفر أو شق', '7 أيام عمل'],
    ['ticket', 'ختم وتصديق التذاكر', 'يوم عمل'], ['signpost', 'ترخيص اللوحات الإرشادية', '5 أيام عمل'], ['flask-conical', 'فحص العينات المخبرية', '5 أيام عمل'], ['credit-card', 'سداد المخالفات والرسوم', 'فوري']];
  let grid = '';
  svcs.forEach((s, i) => {
    const col = i % 4, row = Math.floor(i / 4), w = (CW - 60) / 4, x = RX - (col + 1) * w - col * 20, yy = sy + 110 + row * 138;
    grid += G(`service-${i + 1}`, R(x, yy, w, 118, { r: 22, f: C.white, s: C.line }) + R(x + w - 74, yy + 22, 52, 52, { r: 16, f: '#e6f7f6' }) + I(s[0], x + w - 62, yy + 34, 28, C.teal2) +
      T(x + w - 90, yy + 46, s[1], { s: 16, w: 700 }) + T(x + w - 90, yy + 70, s[2], { s: 12.5, f: C.mut }) + I('arrow-left', x + 20, yy + 80, 18, C.teal2));
  });
  sec('05-quick-services', 420,
    T(RX, sy + 28, 'الخدمات الأكثر استخداماً', { s: 28, w: 700 }) + T(LX + 150, sy + 74, 'عرض كل الخدمات (18)', { s: 14, w: 700, f: C.teal2 }) + I('arrow-left', LX, sy + 60, 18, C.teal2) + tabSvg + grid);

  // 6 Track + Thiqa + assistant
  const ty = y;
  const cw3 = (CW - 40) / 3;
  const card = (i, inner) => R(RX - (i + 1) * cw3 - i * 20, ty, cw3, 210, { r: 28, f: C.white, s: C.line }) + inner(RX - i * (cw3 + 20), RX - (i + 1) * cw3 - i * 20);
  sec('06-track-signin-assistant', 266,
    G('track-request', card(0, (r, l) => I('search-check', r - 56, ty + 24, 32, C.teal2) + T(r - 70, ty + 48, 'الاستعلام عن معاملة', { s: 19, w: 700 }) +
      T(r - 24, ty + 84, 'أدخل رقم المعاملة، مثل GS-00482', { s: 13.5, f: C.mut }) + R(l + 24, ty + 104, cw3 - 48, 48, { r: 14, f: C.soft, s: C.line }) + T(r - 40, ty + 134, 'رقم المعاملة', { s: 14, f: C.faint }) +
      BTN(l + 24, ty + 164, 130, 36, 'استعلام', { f: C.teal, s: 14 }))) +
    G('thiqa-signin', R(RX - 2 * cw3 - 20, ty, cw3, 210, { r: 28, f: C.purple }) + I('fingerprint', RX - cw3 - 20 - 56, ty + 24, 32, C.aqua) +
      T(RX - cw3 - 20 - 70, ty + 48, 'الدخول عبر «ثقة»', { s: 19, w: 700, f: C.white }) +
      P(RX - cw3 - 20 - 24, ty + 86, 'سجّل دخولك بالهوية الرقمية الوطنية لتقديم الطلبات ومتابعتها والوصول إلى مستنداتك.', 44, { s: 13.5, f: '#e2d3f0', lh: 23 }).svg +
      BTN(RX - 2 * cw3 - 20 + 24, ty + 156, 180, 40, 'تسجيل الدخول', { f: C.white, c: C.purple, s: 14 })) +
    G('ai-assistant-card', card(2, (r, l) => R(r - 76, ty + 22, 52, 52, { r: 26, f: C.ink }) + T(r - 50, ty + 55, 'AI', { s: 17, w: 700, f: C.aqua, a: 'middle' }) + T(r - 90, ty + 48, 'المساعد الذكي', { s: 19, w: 700 }) +
      P(r - 24, ty + 98, 'اسأل عن المستندات والاشتراطات والرسوم والمدة لأي خدمة، ويجيبك من دليل الخدمات.', 44, { s: 13.5, f: C.mut, lh: 23 }).svg +
      BTN(l + 24, ty + 156, 150, 40, 'ابدأ المحادثة', { f: C.ink, s: 14 }))));

  // 7 Transactions in numbers
  const fy = y;
  const figs = [['globe', 'عدد الزيارات لكل الزوار', '7,255,874', C.teal], ['receipt-text', 'المعاملات الإلكترونية', '378,849', C.ink], ['file-signature', 'إجمالي عقود الإيجار', '128,189', C.ink]];
  const figs2 = [['ticket', 'حجز التذاكر إلكترونياً', '123,416'], ['store', 'التراخيص البلدية', '109,061'], ['building-2', 'تراخيص البناء', '14,167'], ['construction', 'تراخيص الحفر', '4,016']];
  let fsvg = '';
  figs.forEach((f, i) => { const w = (CW - 40) / 3, x = RX - (i + 1) * w - i * 20; fsvg += G(`figure-big-${i + 1}`, R(x, fy + 150, w, 150, { r: 26, f: i === 0 ? 'url(#g-brand)' : C.ink }) + I(f[0], x + w - 52, fy + 172, 28, C.aqua) + T(x + w - 28, fy + 250, f[2], { s: 40, w: 700, f: C.white }) + T(x + w - 28, fy + 280, f[1], { s: 14, f: '#cbd5e1' }) + R(x + 22, fy + 172, 62, 24, { r: 12, f: 'rgba(3,207,203,0.2)' }) + T(x + 53, fy + 189, 'مباشر', { s: 11.5, w: 700, f: C.aqua, a: 'middle' })); });
  figs2.forEach((f, i) => { const w = (CW - 60) / 4, x = RX - (i + 1) * w - i * 20; fsvg += G(`figure-${i + 1}`, R(x, fy + 320, w, 116, { r: 22, f: C.ink }) + I(f[0], x + w - 46, fy + 340, 24, C.aqua) + T(x + w - 24, fy + 398, f[2], { s: 28, w: 700, f: C.white }) + T(x + w - 24, fy + 422, f[1], { s: 13, f: '#cbd5e1' })); });
  sec('07-transactions-in-numbers', 500,
    R(0, fy, W, 480, { f: C.soft }) + T(RX, fy + 76, 'أرقام المعاملات', { s: 28, w: 700 }) + T(RX, fy + 106, 'المعاملات المخزنة إلكترونياً من 2020 · تُحدَّث يومياً من البيانات المفتوحة', { s: 14, f: C.mut }) +
    BTN(LX, fy + 56, 170, 40, 'التحليل التفصيلي', { f: C.ink, s: 13.5, icon: 'arrow-up-left', is: 16 }) +
    R(LX + 186, fy + 56, 250, 40, { r: 20, f: '#ecfdf5', s: '#a7f3d0' }) + CIRC(LX + 414, fy + 76, 5, { f: C.green }) + T(LX + 400, fy + 81, 'متصل بالبيانات المفتوحة · حتى أمس', { s: 12.5, w: 700, f: '#065f46' }) + fsvg);

  // 8 News
  const ny = y + 20;
  let news = '';
  [['البلدية تدشّن خدمة الاستعلام عن المعاملة برقمها', '5 أكتوبر 2026'], ['إطلاق المستكشف المرئي للبيانات المفتوحة', '1 أكتوبر 2026'], ['استطلاع رأي حول أولويات الخدمات الرقمية', '28 سبتمبر 2026']].forEach((n, i) => {
    const w = (CW - 40) / 3, x = RX - (i + 1) * w - i * 20;
    news += G(`news-${i + 1}`, R(x, ny + 70, w, 330, { r: 26, f: C.white, s: C.line }) + IMG(x + 12, ny + 82, w - 24, 170, { r: 18 }) + T(x + w - 24, ny + 284, n[1], { s: 12.5, f: C.teal2, w: 700 }) + P(x + w - 24, ny + 314, n[0], 34, { s: 17, w: 700, lh: 28 }).svg + T(x + w - 24, ny + 380, 'اقرأ المزيد', { s: 13.5, w: 700, f: C.teal2 }));
  });
  y = ny;
  sec('08-news', 440, T(RX, ny + 30, 'الأخبار والإعلانات', { s: 28, w: 700 }) + T(LX + 120, ny + 30, 'المركز الإعلامي', { s: 14, w: 700, f: C.teal2 }) + I('arrow-left', LX, ny + 16, 18, C.teal2) + news);

  // 9 Open data & participation band
  const oy = y;
  const band = [['database', 'البيانات المفتوحة', 'مجموعات بيانات حية بصيغ CSV و JSON ورخصة مفتوحة.', 'تصفح البيانات', C.teal], ['map', 'المستكشف المرئي', 'خريطة الولايات، ومجسم ثلاثي الأبعاد، وخريطة حرارية.', 'استكشف', C.blue], ['messages-square', 'المشاركة الرقمية', 'شارك برأيك في الاستطلاعات والمقترحات عبر «تجاوب».', 'شارك الآن', C.purple], ['book-open', 'دليل الخدمة', 'المستندات والاشتراطات والرسوم والمدة قبل التقديم.', 'افتح الدليل', C.orange]];
  let bsvg = '';
  band.forEach((b, i) => { const w = (CW - 60) / 4, x = RX - (i + 1) * w - i * 20; bsvg += G(`band-${i + 1}`, R(x, oy + 70, w, 210, { r: 26, f: C.white, s: C.line }) + R(x + w - 76, oy + 92, 52, 52, { r: 16, f: b[4], op: 0.12 }) + I(b[0], x + w - 64, oy + 104, 28, b[4]) + T(x + w - 24, oy + 176, b[1], { s: 18, w: 700 }) + P(x + w - 24, oy + 202, b[2], 30, { s: 13, f: C.mut, lh: 21 }).svg + T(x + w - 24, oy + 262, b[3], { s: 13.5, w: 700, f: b[4] })); });
  sec('09-open-data-participation', 330, T(RX, oy + 30, 'الشفافية والمشاركة', { s: 28, w: 700 }) + bsvg);

  // 10 Poll + happiness + social
  const py = y;
  const half = (CW - 20) / 2;
  let poll = R(RX - half, py, half, 300, { r: 28, f: C.white, s: C.line }) + I('clipboard-list', RX - 56, py + 24, 30, C.teal2) + T(RX - 70, py + 46, 'استطلاع الرأي', { s: 19, w: 700 }) + T(RX - 24, py + 84, 'ما الخدمة التي تود أن نطوّرها أولاً؟', { s: 16, w: 700, f: C.text });
  [['تراخيص البناء', 46], ['عقود الإيجار', 31], ['تصاريح الحفر', 23]].forEach((o, i) => { const yy = py + 104 + i * 46; poll += R(RX - half + 24, yy, half - 48, 36, { r: 12, f: C.soft }) + R(RX - 24 - (half - 48) * o[1] / 100, yy, (half - 48) * o[1] / 100, 36, { r: 12, f: '#ccf3f1' }) + T(RX - 40, yy + 23, o[0], { s: 14, w: 700 }) + T(RX - half + 44, yy + 23, o[1] + '%', { s: 13, w: 700, f: C.teal, a: 'start' }); });
  poll += BTN(RX - half + 24, py + 250, 120, 36, 'صوّت', { f: C.teal, s: 14 }) + T(RX - 24, py + 274, '1,284 مشاركاً · يُدار من أداة «الاستطلاعات»', { s: 12.5, f: C.mut });
  let soc = R(LX, py, half, 300, { r: 28, f: C.white, s: C.line }) + I('rss', LX + half - 56, py + 24, 30, C.teal2) + T(LX + half - 70, py + 46, 'من حسابات البلدية', { s: 19, w: 700 });
  ['youtube', 'facebook', 'instagram', 'twitter'].forEach((s, i) => { soc += R(LX + 24 + i * 52, py + 22, 40, 40, { r: 20, f: C.soft }) + I(s, LX + 34 + i * 52, py + 32, 20, C.text); });
  [0, 1, 2].forEach(i => { const w = (half - 68) / 3, x = LX + 24 + i * (w + 10); soc += IMG(x, py + 84, w, 130, { r: 16 }) + R(x, py + 224, w, 12, { r: 6, f: C.line }) + R(x + w * 0.3, py + 244, w * 0.7, 12, { r: 6, f: C.soft }); });
  sec('10-poll-and-social', 350, G('poll', poll) + G('social-feed', soc));

  // 11 Footer (collapsed)
  const fy2 = y;
  let secs = '', sx = RX;
  ['تواصل معنا', 'روابط مهمة', 'الخدمات الإلكترونية', 'عن البوابة', 'الدعم والمساعدة'].forEach(s => { const ch = CHIP(sx, fy2 + 104, s + '  ▾', { f: 'rgba(255,255,255,0.07)', c: '#e2e8f0', h: 38, s: 13.5 }); secs += ch.svg; sx -= ch.w + 8; });
  sec('11-footer', 210,
    R(0, fy2, W, 210, { f: '#020617' }) + R(0, fy2, W, 4, { f: C.aqua }) + LOGO(RX - 110, fy2 + 26, 50, true) +
    I('phone', RX - 190, fy2 + 42, 16, C.aqua) + T(RX - 200, fy2 + 56, 'مركز الاتصال 1771', { s: 13.5, f: '#e2e8f0', w: 700 }) +
    I('mail', RX - 380, fy2 + 42, 16, C.aqua) + T(RX - 390, fy2 + 56, 'info@edm.gov.om', { s: 13.5, f: '#e2e8f0', w: 700 }) +
    ['youtube', 'facebook', 'instagram', 'twitter'].map((s, i) => CIRC(LX + 20 + i * 46, fy2 + 50, 18, { f: 'rgba(255,255,255,0.08)' }) + I(s, LX + 11 + i * 46, fy2 + 41, 18, '#e2e8f0')).join('') +
    LINE(LX, fy2 + 88, RX, fy2 + 88, { s: 'rgba(255,255,255,0.1)' }) + secs + LINE(LX, fy2 + 160, RX, fy2 + 160, { s: 'rgba(255,255,255,0.1)' }) +
    T(RX, fy2 + 188, '© 2026 بلدية ظفار - جميع الحقوق محفوظة', { s: 12, f: '#94a3b8' }) + T(W / 2, fy2 + 188, 'آخر تحديث لهذه الصفحة: 6 أكتوبر 2026', { s: 12, f: C.aqua, a: 'middle', w: 700 }) + T(LX, fy2 + 188, 'سلطنة عمان - محافظة ظفار', { s: 12, f: '#94a3b8', a: 'start' }));
  const H = y;

  out += hd.svg;
  // Floating tools (fixed on screen; drawn beside the hero bottom)
  const fl = sy + 150;
  out += G('floating-tools', CIRC(LX - 60, fl, 28, { f: C.purple, s: C.white, sw: 4 }) + I('accessibility', LX - 73, fl - 13, 26, C.white) +
    CIRC(LX - 60, fl + 70, 28, { f: C.ink, s: C.white, sw: 4 }) + T(LX - 60, fl + 76, 'AI', { s: 16, w: 700, f: C.aqua, a: 'middle' }) +
    CIRC(LX - 60, fl + 140, 28, { f: '#fbbf24', s: C.white, sw: 4 }) + I('smile', LX - 73, fl + 127, 26, C.ink));

  // Popup announcement (shown over the page on entry)
  const popup = (px, pyy) => G('popup-announcement', R(px, pyy, 420, 250, { r: 28, f: C.white, filter: 'shadow', s: C.line }) + R(px, pyy, 420, 80, { r: 28, f: C.teal }) + R(px, pyy + 50, 420, 30, { f: C.teal }) +
    T(px + 396, pyy + 48, 'انضم إلينا: ملتقى الخدمات الرقمية', { s: 17, w: 700, f: C.white }) + CIRC(px + 28, pyy + 28, 14, { f: 'rgba(0,0,0,0.3)' }) + I('x', px + 20, pyy + 20, 16, C.white) +
    R(px + 316, pyy + 100, 80, 80, { r: 16, f: C.teal2 }) + T(px + 356, pyy + 140, '12', { s: 28, w: 700, f: C.white, a: 'middle' }) + T(px + 356, pyy + 164, 'أكتوبر', { s: 12, f: C.white, a: 'middle' }) +
    T(px + 300, pyy + 126, 'الأحد · 10:00 ص', { s: 13.5, w: 700 }) + T(px + 300, pyy + 150, 'مبنى بلدية ظفار، صلالة', { s: 13, f: C.mut }) + T(px + 300, pyy + 174, 'يبدأ خلال 06 يوم 21 ساعة', { s: 12.5, f: C.teal2, w: 700 }) +
    BTN(px + 236, pyy + 196, 160, 38, 'سجّل الآن', { f: C.teal, s: 14 }) + T(px + 24, pyy + 220, 'إعلان منبثق · يُصمَّم من أداة «المنبثقات»', { s: 11.5, f: C.faint, a: 'start' }));

  // Notes: what the vendor's home page lacks
  const notes = [
    ['شريط الأخبار العاجلة', 'غير موجود في عرض الشركة. شريط نحيف يُدار من لوحة التحكم (شريط الأخبار).'],
    ['الدخول عبر «ثقة»', 'العرض يستخدم رقماً مدنياً ورمز SMS تجريبياً. المطلوب زر الهوية الرقمية الوطنية في الشريط العلوي وبطاقة في الصفحة.'],
    ['بنرات متحركة (Carousel)', 'لا يوجد في العرض مكان لحملات البلدية وصورها. تُدار من أداة «البنرات».'],
    ['أزرار العرض الافتراضي و VR', 'عرض الخدمات ثلاثي الأبعاد ورحلة التحول الرقمي غير موجودين في العرض.'],
    ['الاستعلام عن معاملة والمساعد الذكي', 'الاستعلام موجود عند الشركة كصفحة فرعية فقط، والمساعد الذكي غير موجود.'],
    ['أرقام المعاملات الحية', 'لا توجد أي إحصاءات في الصفحة الرئيسية للعرض. المطلوب بطاقات مباشرة من واجهات البيانات المفتوحة.'],
    ['الأخبار والإعلانات', 'العرض يقتصر على الخدمات الثماني عشرة، بلا أخبار ولا مركز إعلامي.'],
    ['البيانات المفتوحة والمشاركة الرقمية', 'غير موجودتين في العرض: مجموعات البيانات، المستكشف المرئي، الاستطلاعات، «تجاوب».'],
    ['استطلاع الرأي وحسابات التواصل', 'لا يوجد استطلاع في الصفحة ولا تغذية من حسابات البلدية الاجتماعية.'],
    ['تذييل قابل للتوسيع وتاريخ آخر تحديث', 'تذييل العرض ثابت وبيانات التواصل فيه من مثال 2021. المطلوب تذييل مختصر يتوسع وتاريخ آخر تحديث لكل صفحة.'],
    ['الأدوات العائمة', 'أدوات النفاذ الرقمي، والمساعد الذكي، ومؤشر السعادة: ثلاثتها غير موجودة في العرض.'],
    ['الإعلان المنبثق', 'لا توجد إعلانات منبثقة في العرض. تُصمَّم بالسحب والإفلات وتُجدول من لوحة التحكم.'],
  ];
  const marks = [[RX + 40, yTicker], [LX + 95, 64], [LX + 520, by + 40], [RX - 560, by + 353], [RX + 40, ty + 30], [RX + 40, fy + 70], [RX + 40, ny + 24], [RX + 40, oy + 24], [RX + 40, py + 30], [RX + 40, fy2 + 40], [LX - 60, fl - 44]];
  out += G('notes', marks.map((m, i) => NOTE(i + 1, m[0], m[1])).join(''));
  const lg = LEGEND(1480, 40, 440, 'النواقص في الصفحة الرئيسية لعرض الشركة', notes);
  const py2 = lg.h + 120, TH = Math.max(H, py2 + 300);
  const side = lg.svg + T(1920, py2 - 24, 'الإعلان المنبثق (يظهر فوق الصفحة عند الدخول)', { s: 15, w: 700 }) + popup(1490, py2) + NOTE(12, 1490, py2);
  out = R(0, 0, 1960, TH, { f: '#e5e7eb' }) + G('artboard-home-desktop', R(0, 0, W, H, { f: C.bg }) + out) + side;
  board('03-home-desktop.svg', 1960, TH, out, '03', 'الصفحة الرئيسية · سطح المكتب', 'ترويسة بسيطة، ترحيب وبحث، ونمط المعلم الخفيف. الملاحظات الحمراء: ما ينقص عرض الشركة', 1440);
}

// ───────────────────────── 02 Home page, mobile 390 ─────────────────────────
function homeMobile() {
  const W = 390, RX = 370, LX = 20;
  let y = 0, out = '';
  const add = (id, h, inner) => { out += G(id, inner); y += h; };
  const hd = HEADER(W, 0, { lx: 20 }); y += hd.h;
  const hy = y;
  add('welcome-search', 300, R(0, hy, W, 300, { f: '#f6f8fa' }) + PATTERN('landmark', 16, hy + 300 - 110 * 388 / 261, 110, { op: 0.09 }) + PATTERN('landmark', 110, hy + 300 - 80 * 388 / 261, 80, { op: 0.07 }) +
    T(RX, hy + 92, 'مرحباً', { s: 40, w: 700, f: C.teal2 }) + T(RX, hy + 132, 'كيف يمكننا مساعدتك اليوم؟', { s: 19 }) +
    R(LX, hy + 160, W - 40, 52, { r: 26, f: C.white, s: '#94a3b8' }) + T(RX - 20, hy + 192, 'ابحث عن خدمة…', { s: 14.5, f: C.faint }) + CIRC(LX + 26, hy + 186, 21, { f: C.teal }) + I('search', LX + 17, hy + 177, 18, C.white) +
    BTN(LX + (W - 50) / 2 + 10, hy + 232, (W - 50) / 2, 44, 'العرض الافتراضي', { f: 'url(#g-night)', s: 13 }) + BTN(LX, hy + 232, (W - 50) / 2, 44, 'رحلة التحول VR', { f: 'url(#g-purple)', s: 13 }));
  add('ticker', 60, R(LX, y + 12, W - 40, 36, { r: 18, f: C.white, s: C.line }) + R(RX - 58, y + 17, 52, 26, { r: 13, f: C.teal }) + T(RX - 32, y + 35, 'عاجل', { s: 11, w: 700, f: C.white, a: 'middle' }) + T(RX - 66, y + 35, 'ملتقى الخدمات الرقمية 12 أكتوبر', { s: 12, f: C.text }));
  const sy = y + 10;
  let g = T(RX, sy + 20, 'الخدمات الأكثر استخداماً', { s: 19, w: 700 });
  [['building-2', 'تراخيص البناء'], ['file-signature', 'عقود الإيجار'], ['store', 'التراخيص البلدية'], ['construction', 'تصريح حفر'], ['ticket', 'ختم التذاكر'], ['credit-card', 'سداد الرسوم']].forEach((s, i) => { const w = (W - 52) / 2, x = RX - (i % 2 + 1) * w - (i % 2) * 12, yy = sy + 40 + Math.floor(i / 2) * 96; g += R(x, yy, w, 84, { r: 18, f: C.white, s: C.line }) + R(x + w - 52, yy + 14, 38, 38, { r: 12, f: '#e6f7f6' }) + I(s[0], x + w - 44, yy + 22, 22, C.teal2) + T(x + w - 14, yy + 70, s[1], { s: 13.5, w: 700 }); });
  y = sy; add('services', 350, g);
  const ty = y;
  add('track', 150, R(LX, ty, W - 40, 130, { r: 22, f: C.white, s: C.line }) + T(RX - 16, ty + 34, 'الاستعلام عن معاملة', { s: 16, w: 700 }) + R(LX + 16, ty + 52, W - 72 - 90, 44, { r: 12, f: C.soft }) + T(RX - 122, ty + 80, 'مثل GS-00482', { s: 13, f: C.faint }) + BTN(RX - 16 - 84, ty + 52, 84, 44, 'استعلام', { f: C.teal, s: 13, r: 12 }));
  const fy = y;
  let f = R(0, fy, W, 330, { f: C.soft }) + T(RX, fy + 40, 'أرقام المعاملات', { s: 19, w: 700 }) + T(RX, fy + 62, 'تُحدَّث يومياً من البيانات المفتوحة', { s: 12, f: C.mut });
  [['المعاملات الإلكترونية', '378,849'], ['عقود الإيجار', '128,189'], ['التراخيص البلدية', '109,061'], ['تراخيص البناء', '14,167']].forEach((x, i) => { const w = (W - 52) / 2, xx = RX - (i % 2 + 1) * w - (i % 2) * 12, yy = fy + 82 + Math.floor(i / 2) * 112; f += R(xx, yy, w, 100, { r: 18, f: i === 0 ? 'url(#g-brand)' : C.ink }) + T(xx + w - 14, yy + 52, x[1], { s: 24, w: 700, f: C.white }) + T(xx + w - 14, yy + 78, x[0], { s: 12, f: '#cbd5e1' }); });
  add('figures', 350, f);
  const ny = y;
  add('news', 300, T(RX, ny + 20, 'الأخبار', { s: 19, w: 700 }) + R(LX, ny + 36, W - 40, 240, { r: 22, f: C.white, s: C.line }) + IMG(LX + 10, ny + 46, W - 60, 130, { r: 14 }) + T(RX - 16, ny + 204, '5 أكتوبر 2026', { s: 12, f: C.teal2, w: 700 }) + P(RX - 16, ny + 230, 'البلدية تدشّن خدمة الاستعلام عن المعاملة برقمها', 40, { s: 15, w: 700 }).svg);
  const fo = y;
  add('footer', 150, R(0, fo, W, 150, { f: '#020617' }) + R(0, fo, W, 4, { f: C.aqua }) + LOGO(RX - 76, fo + 20, 44, true) + T(LX, fo + 48, '1771', { s: 15, w: 700, f: C.white, a: 'start' }) + R(LX, fo + 78, W - 40, 36, { r: 12, f: 'rgba(255,255,255,0.07)' }) + T(W / 2, fo + 101, 'أقسام التذييل  ▾', { s: 13, f: '#e2e8f0', a: 'middle', w: 700 }) + T(W / 2, fo + 136, 'آخر تحديث: 6 أكتوبر 2026', { s: 11, f: C.aqua, a: 'middle' }));
  out += hd.svg;
  out += G('floating-tools', CIRC(44, y - 200, 24, { f: C.purple, s: C.white, sw: 3 }) + I('accessibility', 33, y - 211, 22, C.white) + CIRC(100, y - 200, 24, { f: C.ink, s: C.white, sw: 3 }) + T(100, y - 195, 'AI', { s: 14, w: 700, f: C.aqua, a: 'middle' }) + CIRC(156, y - 200, 24, { f: '#fbbf24', s: C.white, sw: 3 }) + I('smile', 145, y - 211, 22, C.ink));
  board('04-home-mobile.svg', 760, y, `<g transform="translate(185 0)">` + G('artboard-home-mobile', R(0, 0, W, y, { f: C.bg }) + out) + '</g>', '04', 'الصفحة الرئيسية · الجوال', 'عرض 390 بكسل');
}

homeDesktop();
homeMobile();
