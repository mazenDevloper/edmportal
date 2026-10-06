const { C, R, CIRC, LINE, T, P, I, G, BTN, CHIP, IMG, NOTE, LOGO, LEGEND, DOC, save } = require('./lib');

const W = 1440;
/** Toggle switch; x is the left edge */
const SW = (x, y, on) => R(x, y, 44, 24, { r: 12, f: on ? C.teal2 : '#cbd5e1' }) + CIRC(on ? x + 12 : x + 32, y + 12, 9, { f: C.white });
/** Field with a label above; x is the left edge */
const FIELD = (x, y, w, label, value, o = {}) => T(x + w, y, label, { s: 12, w: 700, f: C.mut }) + R(x, y + 8, w, o.h ?? 40, { r: 10, f: C.white, s: C.line }) + T(x + w - 12, y + 8 + (o.h ?? 40) / 2 + 5, value, { s: 13.5, f: o.ph ? C.faint : C.ink });
/** Section title inside a side panel */
const H = (x, y, label) => T(x, y, label, { s: 13, w: 700, f: C.ink });

/** Admin shell: dark sidebar on the right with the tool tabs; returns { svg, left, right, top } of the work area */
function shell(active, title, sub) {
  const tabs = [['bar-chart-3', 'الإحصائيات'], ['zap', 'الخدمات'], ['newspaper', 'الأخبار'], ['git-branch', 'مسارات الخدمات'], ['user-cog', 'المستخدمون والصلاحيات'], ['history', 'الطلبات'],
    ['layout', 'الصفحات'], ['menu', 'الملاحة'], ['palette', 'الهوية'], ['image', 'البنرات'], ['bell', 'المنبثقات'], ['clipboard-list', 'الاستطلاعات'], ['megaphone', 'شريط الأخبار'], ['layers', 'التذييل'], ['database', 'البيانات المفتوحة'], ['smile', 'مؤشر السعادة']];
  let s = R(W - 260, 0, 260, 1000, { f: C.ink }) + LOGO(W - 150, 22, 44, true) + T(W - 24, 96, 'لوحة الإدارة المركزية', { s: 14, w: 700, f: C.white }) + T(W - 24, 116, 'مدير المشروع', { s: 11.5, f: C.faint });
  tabs.forEach((t, i) => {
    const y = 140 + i * 48, on = t[1] === active;
    s += G(`tab-${i + 1}`, (on ? R(W - 248, y, 236, 40, { r: 12, f: C.teal }) : '') + I(t[0], W - 52, y + 10, 20, on ? C.white : C.faint) + T(W - 64, y + 26, t[1], { s: 13.5, w: on ? 700 : 500, f: on ? C.white : '#cbd5e1' }));
  });
  s = G('sidebar', s) + G('page-title', T(W - 300, 56, title, { s: 26, w: 700 }) + T(W - 300, 84, sub, { s: 13.5, f: C.mut }));
  return { svg: s, right: W - 300, left: 40, top: 110 };
}

// ───────────────────────── 03 Accessibility tools ─────────────────────────
function accessibility() {
  const PX = 500, PW = 440; // panel
  let y = 40, p = '';
  const RX = PX + PW - 24, LX = PX + 24;
  const head = (label, icon) => { y += 10; p += I(icon, RX - 18, y - 2, 18, C.teal2) + T(RX - 26, y + 12, label, { s: 14, w: 700 }); y += 32; };
  const tool = (label, on) => { p += R(LX, y, PW - 48, 44, { r: 12, f: on ? '#e6f7f6' : C.soft, s: on ? C.aqua : undefined }) + T(RX - 14, y + 27, label, { s: 13.5, w: 700, f: on ? C.teal : C.text }) + SW(LX + 12, y + 10, on); y += 52; };
  const stepper = (label, value) => { p += R(LX, y, PW - 48, 48, { r: 12, f: C.soft }) + T(RX - 14, y + 29, label, { s: 13.5, w: 700, f: C.text }) + R(LX + 12, y + 8, 32, 32, { r: 8, f: C.white, s: C.line }) + T(LX + 28, y + 30, '−', { s: 18, w: 700, a: 'middle' }) + T(LX + 76, y + 29, value, { s: 13, w: 700, a: 'middle', f: C.teal }) + R(LX + 108, y + 8, 32, 32, { r: 8, f: C.white, s: C.line }) + T(LX + 124, y + 30, '+', { s: 18, w: 700, a: 'middle' }); y += 56; };

  p += R(PX, 0, PW, 96, { r: 0, f: C.purple }) + I('accessibility', RX - 26, 26, 26, C.white) + T(RX - 38, 44, 'أدوات النفاذ الرقمي', { s: 19, w: 700, f: C.white }) + T(RX - 38, 68, 'WCAG 2.2 · اختصار Alt+A', { s: 12, f: '#e2d3f0' }) + CIRC(LX + 16, 44, 16, { f: 'rgba(255,255,255,0.15)' }) + I('x', LX + 8, 36, 16, C.white);
  y = 124;
  head('ملفات جاهزة', 'sparkles');
  [['ضعف البصر', 'eye'], ['عسر القراءة', 'book-open'], ['التركيز (ADHD)', 'brain'], ['آمن للصرع', 'zap-off'], ['لوحة المفاتيح', 'keyboard'], ['كبار السن', 'user']].forEach((f, i) => {
    const w = (PW - 48 - 16) / 3, x = RX - (i % 3 + 1) * w - (i % 3) * 8, yy = y + Math.floor(i / 3) * 76;
    p += R(x, yy, w, 68, { r: 14, f: i === 0 ? '#e6f7f6' : C.soft, s: i === 0 ? C.aqua : undefined }) + I(f[1], x + w / 2 - 10, yy + 10, 20, i === 0 ? C.teal : C.text) + T(x + w / 2, yy + 52, f[0], { s: 11.5, w: 700, a: 'middle', f: i === 0 ? C.teal : C.text });
  });
  y += 168;
  head('النص', 'type');
  stepper('حجم النص', '120%'); stepper('ارتفاع السطر', 'واسع'); stepper('تباعد الحروف والكلمات', 'عادي');
  tool('خط مقروء', true); tool('محاذاة البداية', false);
  head('الألوان والتباين', 'palette');
  [['افتراضي', C.aqua], ['تباين عالٍ', '#000000'], ['داكن', '#0f172a'], ['رمادي', '#9ca3af'], ['ألوان هادئة', '#8fb8b7'], ['ألوان قوية', '#9d00ff']].forEach((m, i) => {
    const w = (PW - 48 - 16) / 3, x = RX - (i % 3 + 1) * w - (i % 3) * 8, yy = y + Math.floor(i / 3) * 64;
    p += R(x, yy, w, 56, { r: 12, f: C.soft, s: i === 0 ? C.aqua : undefined }) + CIRC(x + w - 22, yy + 28, 12, { f: m[1], s: C.white, sw: 2 }) + T(x + w - 42, yy + 33, m[0], { s: 11.5, w: 700, f: C.text });
  });
  y += 144;
  head('التنقل والتركيز', 'mouse-pointer-click');
  tool('تمييز الروابط', true); tool('إبراز التركيز', false); tool('مؤشر كبير', false); tool('دليل القراءة', false); tool('قناع القراءة', false); tool('إخفاء الصور', false); tool('إيقاف الحركة', false);
  head('القراءة الصوتية', 'volume-2');
  p += BTN(RX - 200, y, 200, 44, 'اقرأ الصفحة', { f: C.teal, r: 12, s: 14, icon: 'play', is: 16 }) + BTN(LX, y, PW - 48 - 208, 44, 'اقرأ النص المحدد', { f: C.soft, c: C.text, r: 12, s: 13.5 });
  y += 56; stepper('السرعة', '1.0×');
  p += BTN(LX, y + 8, PW - 48, 44, 'إعادة ضبط', { f: C.white, c: C.red, stroke: '#fecaca', r: 12, s: 14 });
  y += 70;
  p += P(RX, y + 6, 'تُحفظ تفضيلاتك على هذا الجهاز وتُطبّق على جميع صفحات البوابة.', 56, { s: 11.5, f: C.faint }).svg;
  const PH = y + 40;

  const left = [
    ['ملفات جاهزة', 'ضغطة واحدة تفعّل مجموعة أدوات مناسبة لحالة المستخدم: ضعف البصر، عسر القراءة، التركيز، آمن للصرع، لوحة المفاتيح فقط، كبار السن.'],
    ['حجم النص', 'تكبير نص الصفحة كلها على درجات حتى 200% دون أن ينكسر التخطيط.'],
    ['ارتفاع السطر وتباعد الحروف', 'زيادة المسافة بين الأسطر وبين الحروف والكلمات لتسهيل القراءة (معيار WCAG 1.4.12).'],
    ['خط مقروء ومحاذاة البداية', 'خط واضح الأشكال، ومحاذاة النص لجهة البداية بدل التوسيط لتسهيل تتبع الأسطر.'],
    ['وضع الألوان', 'ستة أوضاع: افتراضي، تباين عالٍ، داكن، رمادي، ألوان هادئة، ألوان قوية.'],
    ['تمييز الروابط وإبراز التركيز', 'تسطير وتلوين كل الروابط، وإطار سميك حول العنصر النشط عند التنقل بلوحة المفاتيح.'],
    ['مؤشر كبير', 'تكبير مؤشر الفأرة لمن يصعب عليه تتبعه.'],
    ['دليل القراءة وقناع القراءة', 'خط أفقي يتبع المؤشر، أو تعتيم ما فوق السطر وما تحته لحصر الانتباه في سطر واحد.'],
    ['إخفاء الصور وإيقاف الحركة', 'إخفاء الصور لتقليل التشتت، وإيقاف كل الحركات والانتقالات (آمن لمن يتأثر بالوميض).'],
    ['القراءة الصوتية', 'قراءة الصفحة كاملة أو النص المحدد بالعربية أو الإنجليزية، مع إيقاف مؤقت واستئناف وتحكم بالسرعة.'],
    ['إعادة ضبط وحفظ التفضيلات', 'زر واحد يعيد كل شيء، والتفضيلات تُحفظ على جهاز المستخدم وتُطبق على كل الصفحات.'],
  ];
  const lg = LEGEND(980, 20, 440, 'شرح أدوات النفاذ الرقمي', left);
  const TH = Math.max(PH, lg.h + 60);
  let ctx = R(40, 40, 420, 300, { r: 24, f: C.white, s: C.line }) + T(436, 84, 'أين تظهر؟', { s: 18, w: 700 }) +
    P(436, 116, 'زر عائم بنفسجي في زاوية كل صفحة من البوابة، ورابط في الشريط العلوي. يفتح اللوحة الجانبية المرسومة هنا بالنقر أو بالاختصار Alt+A.', 46, { s: 13.5, f: C.text, lh: 24 }).svg +
    CIRC(96, 270, 30, { f: C.purple, s: C.white, sw: 4 }) + I('accessibility', 82, 256, 28, C.white) + T(436, 276, 'الزر العائم', { s: 13.5, w: 700, f: C.mut });
  ctx += R(40, 370, 420, 250, { r: 24, f: C.white, s: C.line }) + T(436, 414, 'متطلبات التصميم', { s: 18, w: 700 }) +
    P(436, 446, ['• تباين النص 4.5:1 على الأقل في كل الأوضاع', '• كل أداة تعمل بلوحة المفاتيح ولها اسم لقارئ الشاشة', '• مساحة اللمس 44×44 بكسل على الأقل', '• اللوحة لا تغطي المحتوى على الجوال (تنزلق من الأسفل)', '• لا تعتمد أي حالة على اللون وحده'], 60, { s: 13.5, f: C.text, lh: 30 }).svg;
  save('03-accessibility-tools.svg', DOC(W, TH, R(0, 0, W, TH, { f: '#e5e7eb' }) + G('context', ctx) + G('accessibility-panel', R(PX, 0, PW, PH, { f: C.white, filter: 'shadow' }) + p) + lg.svg, 'أدوات النفاذ الرقمي'));
}

// ───────────────────────── 04 Project manager dashboard ─────────────────────────
function dashboard() {
  const s = shell('الإحصائيات', 'مهام مدير المشروع', 'كل ما تديره من محتوى البوابة وأدواتها، في مكان واحد');
  let o = s.svg; const RX = s.right, LX = s.left, CW = RX - LX;
  // KPI row
  [['الخدمات المنشورة', '18', 'zap', C.teal], ['طلبات مفتوحة', '42', 'inbox', C.orange], ['إعلانات منبثقة فعالة', '2', 'bell', C.purple], ['استطلاعات جارية', '1', 'clipboard-list', C.blue], ['مؤشر السعادة', '87%', 'smile', C.green]].forEach((k, i) => {
    const w = (CW - 64) / 5, x = RX - (i + 1) * w - i * 16;
    o += G(`kpi-${i + 1}`, R(x, 120, w, 100, { r: 20, f: C.white, s: C.line }) + R(x + w - 56, 138, 40, 40, { r: 12, f: k[3], op: 0.12 }) + I(k[2], x + w - 46, 148, 20, k[3]) + T(x + 20, 172, k[1], { s: 30, w: 700, a: 'start' }) + T(x + w - 16, 204, k[0], { s: 12.5, f: C.mut }));
  });
  // Task cards
  const tasks = [
    ['bell', 'إنشاء إعلان منبثق', 'صمّم إعلاناً بالسحب والإفلات: نص، صورة، زر رابط، موعد، عدّاد.', 'المنبثقات', C.purple],
    ['clipboard-list', 'إنشاء استطلاع', 'ثمانية أنواع أسئلة، ونشر في الصفحة الرئيسية أو كنافذة.', 'الاستطلاعات', C.blue],
    ['layout', 'بناء صفحة جديدة', 'صفحات من مكونات جاهزة دون برمجة، مع مسودة ونشر.', 'الصفحات', C.teal],
    ['database', 'إدارة البيانات المفتوحة', 'مجموعات البيانات، التحديث اليومي، طلبات البيانات.', 'البيانات المفتوحة', C.green],
    ['newspaper', 'نشر خبر', 'خبر بالعربية والإنجليزية مع صورة، وترجمة آلية.', 'الأخبار', C.orange],
    ['megaphone', 'شريط الأخبار العاجلة', 'عناصر الشريط المتحرك أعلى الصفحات وتفعيلها.', 'شريط الأخبار', C.red],
    ['image', 'بنرات الصفحة الرئيسية', 'صور الحملات وترتيبها وروابطها.', 'البنرات', C.violet],
    ['zap', 'إظهار وإخفاء الخدمات', 'نشر الخدمة للعامة، ورمز المعاملة، ودليل الخدمة.', 'الخدمات', C.teal2],
    ['git-branch', 'مسارات الخدمات والشاشات', 'مخطط المسار، خطوات كل دور، وشاشات كل خطوة.', 'مسارات الخدمات', C.ink],
    ['user-cog', 'الموظفون والصلاحيات', 'حسابات الموظفين، الأدوار لكل خدمة، إعادة كلمة المرور.', 'المستخدمون', C.purple],
    ['menu', 'القائمة الرئيسية والتذييل', 'عناصر القائمة وروابط التذييل وبيانات التواصل.', 'الملاحة', C.blue],
    ['smile', 'نتائج مؤشر السعادة', 'تقييمات الزوار وأسبابها لكل صفحة.', 'مؤشر السعادة', C.green],
  ];
  o += T(RX, 268, 'المهام السريعة', { s: 19, w: 700 });
  tasks.forEach((t, i) => {
    const w = (CW - 48) / 4, x = RX - (i % 4 + 1) * w - (i % 4) * 16, y = 290 + Math.floor(i / 4) * 176;
    o += G(`task-${i + 1}`, R(x, y, w, 160, { r: 22, f: C.white, s: C.line }) + R(x + w - 64, y + 18, 46, 46, { r: 14, f: t[4], op: 0.12 }) + I(t[0], x + w - 53, y + 29, 24, t[4]) +
      T(x + w - 18, y + 88, t[1], { s: 15.5, w: 700 }) + P(x + w - 18, y + 110, t[2], 34, { s: 12, f: C.mut, lh: 19 }).svg + R(x + 16, y + 20, 84, 24, { r: 12, f: C.soft }) + T(x + 58, y + 37, t[3], { s: 10.5, w: 700, f: C.text, a: 'middle' }));
  });
  // Calendar strip
  o += G('schedule', R(LX, 830, CW, 130, { r: 22, f: C.white, s: C.line }) + T(RX - 20, 866, 'المجدول هذا الأسبوع', { s: 16, w: 700 }) +
    [['إعلان منبثق: ملتقى الخدمات الرقمية', 'يبدأ 8 أكتوبر · ينتهي 12 أكتوبر', C.purple], ['استطلاع: أولويات الخدمات', 'ينتهي 10 أكتوبر · 1,284 مشاركاً', C.blue], ['صفحة: دليل تصاريح الحفر', 'مسودة بانتظار النشر', C.teal]].map((e, i) => { const w = (CW - 72) / 3, x = RX - 20 - (i + 1) * w - i * 16; return R(x, 884, w, 60, { r: 14, f: C.soft }) + R(x + w - 6, 884, 6, 60, { r: 3, f: e[2] }) + T(x + w - 20, 908, e[0], { s: 13.5, w: 700 }) + T(x + w - 20, 930, e[1], { s: 12, f: C.mut }); }).join(''));
  save('04-project-manager-dashboard.svg', DOC(W, 1000, R(0, 0, W, 1000, { f: C.bg }) + o, 'لوحة مهام مدير المشروع'));
}

// ───────────────────────── 05 Popup builder ─────────────────────────
function popupBuilder() {
  let o = R(0, 0, W, 64, { f: C.white }) + LINE(0, 64, W, 64) + I('x', W - 44, 22, 20, C.ink) + R(W - 300, 14, 230, 36, { r: 10, f: C.white, s: C.line }) + T(W - 82, 37, 'ملتقى الخدمات الرقمية', { s: 13.5, w: 700 }) +
    BTN(24, 14, 130, 36, 'حفظ ونشر', { f: C.teal2, r: 12, s: 13.5 }) + BTN(164, 14, 100, 36, 'معاينة', { f: C.white, c: C.ink, stroke: C.line, r: 12, s: 13.5 }) + I('undo-2', 292, 24, 18, C.text) + I('redo-2', 324, 24, 18, C.text) +
    R(372, 14, 96, 36, { r: 10, f: C.soft }) + R(374, 16, 46, 32, { r: 8, f: C.white }) + I('monitor', 388, 24, 16, C.teal) + I('smartphone', 434, 24, 16, C.mut) + R(480, 14, 96, 36, { r: 10, f: C.soft }) + R(528, 16, 46, 32, { r: 8, f: C.white }) + T(551, 37, 'عربي', { s: 12, w: 700, a: 'middle', f: C.teal }) + T(504, 37, 'EN', { s: 12, w: 700, a: 'middle', f: C.mut });
  // Right: elements + layers
  let side = R(W - 250, 64, 250, 836, { f: C.white }) + LINE(W - 250, 64, W - 250, 900) + T(W - 20, 100, 'إضافة عنصر', { s: 12.5, w: 700, f: C.mut });
  [['heading-1', 'عنوان'], ['type', 'نص'], ['image', 'صورة'], ['mouse-pointer-click', 'زر رابط'], ['calendar-days', 'موعد'], ['timer', 'عدّاد'], ['play', 'فيديو'], ['shapes', 'شكل'], ['sparkles', 'أيقونة']].forEach((e, i) => { const x = W - 20 - (i % 3 + 1) * 66 - (i % 3) * 6, y = 114 + Math.floor(i / 3) * 72; side += R(x, y, 66, 66, { r: 12, f: C.soft }) + I(e[0], x + 23, y + 12, 20, C.teal2) + T(x + 33, y + 54, e[1], { s: 11, w: 700, a: 'middle', f: C.text }); });
  side += T(W - 20, 360, 'الطبقات (5)', { s: 12.5, w: 700, f: C.mut });
  ['زر: سجّل الآن', 'عدّاد تنازلي', 'موعد: الملتقى', 'عنوان', 'شكل: الترويسة'].forEach((l, i) => { const y = 374 + i * 40; side += R(W - 238, y, 226, 34, { r: 8, f: i === 2 ? '#e6f7f6' : C.white }) + T(W - 28, y + 22, l, { s: 12.5, w: 700, f: i === 2 ? C.teal : C.text }) + I('eye', W - 228, y + 9, 15, C.faint) + I('lock-open', W - 204, y + 9, 15, C.faint); });
  o += G('elements-and-layers', side);
  // Canvas
  const cx = 420, cy = 190;
  let cv = R(330, 64, W - 250 - 330, 836, { f: '#eef2f7' });
  for (let gx = 350; gx < W - 260; gx += 22) for (let gy = 84; gy < 890; gy += 22) cv += CIRC(gx, gy, 1, { f: '#cbd5e1' });
  cv += R(cx, cy, 600, 540, { r: 32, f: '#f0fdfa', filter: 'shadow' }) + R(cx, cy, 600, 150, { r: 32, f: C.teal }) + R(cx, cy + 100, 600, 50, { f: C.teal }) + T(cx + 300, cy + 90, 'انضم إلينا', { s: 36, w: 700, f: C.white, a: 'middle' });
  cv += G('selected-element', R(cx + 80, cy + 180, 440, 110, { r: 20, f: C.white, s: C.line }) + R(cx + 428, cy + 192, 80, 86, { r: 16, f: C.teal2 }) + T(cx + 468, cy + 236, '12', { s: 30, w: 700, f: C.white, a: 'middle' }) + T(cx + 468, cy + 262, 'أكتوبر', { s: 12, f: C.white, a: 'middle' }) + T(cx + 414, cy + 222, 'ملتقى الخدمات الرقمية', { s: 16, w: 700 }) + T(cx + 414, cy + 246, 'الأحد · 10:00 ص', { s: 12.5, f: C.mut }) + T(cx + 414, cy + 268, 'مبنى بلدية ظفار، صلالة', { s: 12.5, f: C.mut }) +
    R(cx + 80, cy + 180, 440, 110, { r: 0, f: 'none', s: C.teal2, sw: 2 }) + [[80, 180], [300, 180], [520, 180], [80, 235], [520, 235], [80, 290], [300, 290], [520, 290]].map(h => CIRC(cx + h[0], cy + h[1], 6, { f: C.white, s: C.teal2, sw: 2 })).join('') + R(cx + 80, cy + 152, 76, 22, { r: 6, f: C.teal }) + T(cx + 118, cy + 168, '440 × 110', { s: 10.5, w: 700, f: C.white, a: 'middle' }));
  cv += LINE(cx + 300, cy, cx + 300, cy + 540, { s: '#d946ef', sw: 1 }) + R(cx + 90, cy + 315, 420, 96, { r: 18, f: C.teal });
  ['06', '21', '38', '17'].forEach((n, i) => { cv += T(cx + 450 - i * 100, cy + 366, n, { s: 30, w: 700, f: C.white, a: 'middle' }) + T(cx + 450 - i * 100, cy + 392, ['يوم', 'ساعة', 'دقيقة', 'ثانية'][i], { s: 12, f: '#cfe9e7', a: 'middle' }); });
  cv += BTN(cx + 200, cy + 440, 200, 52, 'سجّل الآن', { f: C.teal2, s: 17 }) + CIRC(cx + 572, cy + 28, 16, { f: 'rgba(0,0,0,0.35)' }) + I('x', cx + 564, cy + 20, 16, C.white) + R(346, 866, 130, 24, { r: 8, f: C.white }) + T(411, 883, '600 × 540 · 100%', { s: 11, w: 700, f: C.mut, a: 'middle' });
  o += G('canvas', cv);
  // Left: properties
  let pr = R(0, 64, 330, 836, { f: C.white }) + LINE(330, 64, 330, 900) + R(12, 76, 306, 36, { r: 10, f: C.soft }) + R(214, 78, 102, 32, { r: 8, f: C.teal2 }) + T(265, 99, 'العنصر', { s: 12.5, w: 700, f: C.white, a: 'middle' }) + T(163, 99, 'النافذة', { s: 12.5, w: 700, f: C.text, a: 'middle' }) + T(63, 99, 'العرض', { s: 12.5, w: 700, f: C.text, a: 'middle' });
  pr += I('calendar-days', 290, 130, 18, C.teal2) + T(282, 144, 'موعد / فعالية', { s: 14.5, w: 700 }) + H(310, 180, 'المحتوى') + FIELD(20, 204, 290, 'اسم الموعد (عربي)', 'ملتقى الخدمات الرقمية') + FIELD(20, 270, 290, 'اسم الموعد (إنجليزي)', 'Digital Services Forum') + FIELD(20, 336, 290, 'تاريخ ووقت الموعد', '12/10/2026  10:00') + FIELD(20, 402, 290, 'المكان', 'مبنى بلدية ظفار، صلالة');
  pr += H(310, 486, 'التنسيق') + T(310, 510, 'لون النص', { s: 12, w: 700, f: C.mut }) + ['#ffffff', C.ink, '#475569', C.teal2, C.teal, C.aqua, C.purple, C.orange].map((c, i) => CIRC(298 - i * 30, 532, 11, { f: c, s: i === 1 ? C.teal2 : C.line, sw: i === 1 ? 3 : 1 })).join('');
  pr += FIELD(170, 568, 140, 'استدارة الزوايا', '20') + FIELD(20, 568, 140, 'الشفافية %', '100') + H(310, 652, 'الموضع والحجم') + FIELD(170, 676, 140, 'X', '80') + FIELD(20, 676, 140, 'Y', '180') + FIELD(170, 742, 140, 'العرض', '440') + FIELD(20, 742, 140, 'الارتفاع', '110');
  pr += T(310, 830, 'تبويب «العرض»: التأخير، التكرار للزائر، الجدولة', { s: 11.5, f: C.faint }) + T(310, 852, 'تبويب «النافذة»: المقاس، الخلفية، مكان الظهور، الحركة', { s: 11.5, f: C.faint });
  o += G('properties', pr);
  save('05-popup-builder.svg', DOC(W, 900, R(0, 0, W, 900, { f: C.bg }) + o, 'محرر الإعلانات المنبثقة'));
}

// ───────────────────────── 06 Survey builder ─────────────────────────
function surveyBuilder() {
  const s = shell('الاستطلاعات', 'منشئ الاستطلاعات', 'أضف الأسئلة، حدّد مكان النشر، وتابع النتائج');
  let o = s.svg; const RX = s.right, LX = s.left;
  // question types (right column)
  let types = R(RX - 230, 120, 230, 560, { r: 22, f: C.white, s: C.line }) + T(RX - 20, 156, 'أنواع الأسئلة', { s: 15, w: 700 });
  [['circle-dot', 'اختيار واحد'], ['check-square', 'اختيار متعدد'], ['chevron-down', 'قائمة منسدلة'], ['toggle-left', 'نعم / لا'], ['star', 'تقييم بالنجوم'], ['gauge', 'مؤشر التوصية NPS'], ['minus', 'نص قصير'], ['align-right', 'نص طويل']].forEach((t, i) => { const y = 174 + i * 60; types += R(RX - 214, y, 198, 50, { r: 12, f: C.soft }) + I(t[0], RX - 52, y + 15, 20, C.teal2) + T(RX - 62, y + 31, t[1], { s: 13.5, w: 700, f: C.text }) + I('plus', RX - 204, y + 16, 18, C.faint); });
  o += G('question-types', types);
  // questions (middle)
  const MX = RX - 250, MW = 560, ML = MX - MW;
  let q = R(ML, 120, MW, 96, { r: 22, f: C.white, s: C.line }) + T(MX - 24, 158, 'استطلاع أولويات الخدمات الرقمية', { s: 18, w: 700 }) + T(MX - 24, 186, 'ساعدنا في ترتيب الخدمات التي نطوّرها أولاً', { s: 13, f: C.mut });
  const qcard = (y, h, n, title, body) => R(ML, y, MW, h, { r: 22, f: C.white, s: C.line }) + R(MX - 56, y + 20, 34, 34, { r: 10, f: C.teal }) + T(MX - 39, y + 43, n, { s: 14, w: 700, f: C.white, a: 'middle' }) + T(MX - 68, y + 43, title, { s: 15, w: 700 }) + I('grip-vertical', ML + 18, y + 24, 18, C.faint) + I('trash-2', ML + 46, y + 24, 18, C.faint) + I('copy', ML + 74, y + 24, 18, C.faint) + body;
  q += qcard(232, 196, 1, 'ما الخدمة التي تود أن نطوّرها أولاً؟', ['تراخيص البناء', 'عقود الإيجار', 'تصاريح الحفر'].map((op, i) => CIRC(MX - 40, 310 + i * 36, 8, { f: C.white, s: C.faint, sw: 2 }) + T(MX - 60, 315 + i * 36, op, { s: 13.5, f: C.text })).join('') + T(ML + 24, 404, '+ إضافة خيار', { s: 12.5, w: 700, f: C.teal2, a: 'start' }) + R(ML + 420, 248, 0, 0, {}) );
  q += qcard(444, 130, 2, 'ما مدى رضاك عن البوابة؟', [0, 1, 2, 3, 4].map(i => I('star', MX - 60 - i * 40, 512, 28, i < 4 ? C.amber : C.line)).join('') + T(ML + 24, 532, 'إلزامي', { s: 12, w: 700, f: C.red, a: 'start' }));
  q += qcard(590, 150, 3, 'ما احتمال أن توصي بالبوابة لغيرك؟ (NPS)', Array.from({ length: 11 }, (_, i) => R(MX - 60 - i * 42, 660, 36, 36, { r: 8, f: i < 2 ? '#dcfce7' : i < 4 ? '#fef9c3' : C.soft }) + T(MX - 42 - i * 42, 684, 10 - i, { s: 13, w: 700, a: 'middle', f: C.text })).join(''));
  q += qcard(756, 110, 4, 'اقتراحاتك لتحسين الخدمات', R(ML + 24, 812, MW - 48, 38, { r: 10, f: C.soft }) + T(MX - 40, 836, 'إجابة نصية طويلة', { s: 12.5, f: C.faint }));
  o += G('questions', q);
  // settings + results (left)
  const SW_ = ML - 20 - LX;
  let st = R(LX, 120, SW_, 380, { r: 22, f: C.white, s: C.line }) + T(LX + SW_ - 20, 156, 'إعدادات النشر', { s: 15, w: 700 });
  [['مفعّل', true], ['يظهر في الصفحة الرئيسية', true], ['نافذة منبثقة عند الدخول', false], ['إجابات مجهولة الهوية', true]].forEach((t, i) => { st += T(LX + SW_ - 20, 198 + i * 44, t[0], { s: 13.5, w: 700, f: C.text }) + SW(LX + 20, 180 + i * 44, t[1]); });
  st += FIELD(LX + 20, 380, SW_ - 40, 'يبدأ', '1 أكتوبر 2026') + FIELD(LX + 20, 440, SW_ - 40, 'ينتهي', '10 أكتوبر 2026');
  let rs = R(LX, 516, SW_, 350, { r: 22, f: C.white, s: C.line }) + T(LX + SW_ - 20, 552, 'النتائج', { s: 15, w: 700 }) + T(LX + 20, 552, '1,284 رداً', { s: 13, w: 700, f: C.teal2, a: 'start' });
  [['تراخيص البناء', 46], ['عقود الإيجار', 31], ['تصاريح الحفر', 23]].forEach((r, i) => { const y = 580 + i * 52; rs += T(LX + SW_ - 20, y + 14, r[0], { s: 12.5, w: 700, f: C.text }) + T(LX + 20, y + 14, r[1] + '%', { s: 12.5, w: 700, f: C.teal, a: 'start' }) + R(LX + 20, y + 22, SW_ - 40, 12, { r: 6, f: C.soft }) + R(LX + SW_ - 20 - (SW_ - 40) * r[1] / 100, y + 22, (SW_ - 40) * r[1] / 100, 12, { r: 6, f: C.teal2 }); });
  rs += LINE(LX + 20, 744, LX + SW_ - 20, 744) + T(LX + SW_ - 20, 776, 'متوسط الرضا', { s: 12.5, f: C.mut }) + T(LX + 20, 776, '4.2 / 5', { s: 15, w: 700, a: 'start' }) + T(LX + SW_ - 20, 806, 'مؤشر التوصية NPS', { s: 12.5, f: C.mut }) + T(LX + 20, 806, '+38', { s: 15, w: 700, a: 'start', f: C.green }) + BTN(LX + 20, 822, SW_ - 40, 34, 'تنزيل الردود CSV', { f: C.soft, c: C.text, r: 10, s: 12.5 });
  o += G('publish-settings', st) + G('results', rs);
  save('06-survey-builder.svg', DOC(W, 1000, R(0, 0, W, 1000, { f: C.bg }) + o, 'منشئ الاستطلاعات'));
}

// ───────────────────────── 07 Page builder ─────────────────────────
function pageBuilder() {
  let o = R(0, 0, W, 64, { f: C.white }) + LINE(0, 64, W, 64) + I('arrow-right', W - 44, 22, 20, C.ink) + T(W - 60, 30, 'دليل تصاريح الحفر', { s: 16, w: 700 }) + T(W - 60, 50, '/p/excavation-guide', { s: 11.5, f: C.mut }) +
    BTN(24, 14, 110, 36, 'نشر', { f: C.teal2, r: 12, s: 13.5 }) + BTN(144, 14, 130, 36, 'حفظ كمسودة', { f: C.white, c: C.ink, stroke: C.line, r: 12, s: 13 }) + BTN(284, 14, 100, 36, 'معاينة', { f: C.white, c: C.ink, stroke: C.line, r: 12, s: 13 }) + R(400, 20, 70, 24, { r: 12, f: '#fef3c7' }) + T(435, 37, 'مسودة', { s: 11.5, w: 700, f: '#92400e', a: 'middle' });
  // blocks library (right)
  let lib = R(W - 280, 64, 280, 836, { f: C.white }) + LINE(W - 280, 64, W - 280, 900) + R(W - 264, 80, 248, 38, { r: 10, f: C.soft }) + I('search', W - 44, 90, 18, C.faint) + T(W - 54, 104, 'ابحث عن مكوّن…', { s: 12.5, f: C.faint });
  let ly = 144;
  [['تخطيط', [['layout-panel-top', 'واجهة رئيسية'], ['heading', 'عنوان قسم'], ['columns-2', 'أعمدة']]], ['محتوى', [['type', 'نص'], ['info', 'بطاقة تنبيه'], ['list-ordered', 'خطوات'], ['quote', 'اقتباس']]], ['بيانات', [['bar-chart-3', 'إحصائيات'], ['table', 'جدول']]], ['وسائط', [['image', 'صورة'], ['play', 'فيديو']]], ['تفاعل', [['megaphone', 'دعوة لإجراء'], ['clipboard-list', 'استطلاع'], ['help-circle', 'أسئلة شائعة']]]].forEach(cat => {
    lib += T(W - 20, ly, cat[0], { s: 12, w: 700, f: C.mut }); ly += 12;
    cat[1].forEach((b, i) => { const x = W - 20 - (i % 2 + 1) * 118 - (i % 2) * 8, y = ly + Math.floor(i / 2) * 58; lib += R(x, y, 118, 50, { r: 12, f: C.soft }) + I(b[0], x + 88, y + 15, 20, C.teal2) + T(x + 80, y + 31, b[1], { s: 12, w: 700, f: C.text }); });
    ly += Math.ceil(cat[1].length / 2) * 58 + 22;
  });
  o += G('blocks-library', lib);
  // canvas
  const CL = 330, CR = W - 280, CWd = CR - CL, PL = CL + 50, PR = CR - 50, PW = PR - PL;
  let cv = R(CL, 64, CWd, 836, { f: '#eef2f7' }) + R(PL, 90, PW, 790, { r: 18, f: C.white, filter: 'shadow' });
  cv += G('block-hero', R(PL, 90, PW, 190, { r: 18, f: 'url(#g-brand)' }) + R(PL, 240, PW, 40, { f: 'url(#g-brand)' }) + T(PR - 40, 150, 'دليل الخدمة', { s: 12.5, w: 700, f: C.aqua }) + T(PR - 40, 196, 'تصاريح الحفر وشق الطرق', { s: 30, w: 700, f: C.white }) + T(PR - 40, 228, 'كل ما تحتاجه قبل التقديم: المستندات والرسوم والمدة.', { s: 14, f: '#d5efed' }) + BTN(PR - 40 - 150, 244, 150, 0, '', { f: 'none' }));
  cv += G('block-steps-selected', R(PL + 20, 300, PW - 40, 210, { r: 14, f: C.white, s: C.teal2, sw: 2 }) + T(PR - 44, 338, 'خطوات التقديم', { s: 18, w: 700 }) + ['سجّل الدخول عبر ثقة', 'عبّئ بيانات الموقع ونوع الحفر', 'أرفق المخططات وعدم الممانعة', 'سدّد الرسوم واستلم التصريح'].map((sx, i) => CIRC(PR - 60, 372 + i * 34, 13, { f: C.teal }) + T(PR - 60, 377 + i * 34, i + 1, { s: 12, w: 700, f: C.white, a: 'middle' }) + T(PR - 84, 377 + i * 34, sx, { s: 13.5, f: C.text })).join('') +
    R(PL + 20, 276, 150, 26, { r: 8, f: C.teal2 }) + I('arrow-up', PL + 30, 281, 15, C.white) + I('arrow-down', PL + 54, 281, 15, C.white) + I('copy', PL + 78, 281, 15, C.white) + I('trash-2', PL + 102, 281, 15, C.white) + T(PL + 160, 294, 'خطوات', { s: 11, w: 700, f: C.white }));
  cv += G('block-callout', R(PL + 20, 528, PW - 40, 70, { r: 14, f: '#fffbeb', s: '#fde68a' }) + I('triangle-alert', PR - 62, 550, 22, '#b45309') + T(PR - 74, 558, 'لديك 90 يوماً لاستكمال الطلب بعد حفظه', { s: 14, w: 700, f: '#78350f' }) + T(PR - 74, 580, 'بعدها تنتهي صلاحية الطلب ويلزم تقديم طلب جديد.', { s: 12.5, f: '#92400e' }));
  cv += G('block-stats', [['7 أيام', 'مدة الإنجاز'], ['3', 'مستندات'], ['4,016', 'تصريحاً منذ 2020']].map((x, i) => { const w = (PW - 80) / 3, xx = PR - 20 - (i + 1) * w - i * 20; return R(xx, 616, w, 90, { r: 14, f: C.soft }) + T(xx + w / 2, 660, x[0], { s: 24, w: 700, a: 'middle', f: C.teal }) + T(xx + w / 2, 686, x[1], { s: 12.5, a: 'middle', f: C.mut }); }).join(''));
  cv += G('block-cta', R(PL + 20, 724, PW - 40, 80, { r: 14, f: C.ink }) + T(PR - 44, 772, 'جاهز للتقديم؟', { s: 18, w: 700, f: C.white }) + BTN(PL + 44, 744, 150, 40, 'ابدأ الخدمة', { f: C.aqua, c: C.ink, s: 14 }));
  cv += R(PL + 20, 820, PW - 40, 44, { r: 12, f: C.white, s: C.faint, dash: '6 6' }) + T(PL + PW / 2, 847, '+ اسحب مكوّناً إلى هنا', { s: 13, w: 700, f: C.faint, a: 'middle' });
  o += G('page-canvas', cv);
  // settings (left)
  let st = R(0, 64, 330, 836, { f: C.white }) + LINE(330, 64, 330, 900) + R(12, 76, 306, 36, { r: 10, f: C.soft }) + R(166, 78, 150, 32, { r: 8, f: C.teal2 }) + T(241, 99, 'المكوّن', { s: 12.5, w: 700, f: C.white, a: 'middle' }) + T(89, 99, 'إعدادات الصفحة', { s: 12.5, w: 700, f: C.text, a: 'middle' });
  st += H(310, 146, 'مكوّن: خطوات') + FIELD(20, 170, 290, 'العنوان (عربي)', 'خطوات التقديم') + FIELD(20, 236, 290, 'العنوان (إنجليزي)', 'How to apply') + T(310, 318, 'الخطوات (4)', { s: 12, w: 700, f: C.mut });
  ['سجّل الدخول عبر ثقة', 'عبّئ بيانات الموقع ونوع الحفر', 'أرفق المخططات', 'سدّد الرسوم'].forEach((x, i) => { st += R(20, 330 + i * 46, 290, 38, { r: 10, f: C.soft }) + T(298, 354 + i * 46, x, { s: 12.5, f: C.text }) + I('grip-vertical', 28, 340 + i * 46, 16, C.faint); });
  st += BTN(20, 520, 290, 36, '+ إضافة خطوة', { f: C.white, c: C.teal2, stroke: C.aqua, r: 10, s: 12.5 }) + BTN(20, 566, 290, 36, 'ترجمة آلية إلى الإنجليزية', { f: C.soft, c: C.text, r: 10, s: 12.5 });
  st += LINE(20, 624, 310, 624) + H(310, 654, 'إعدادات الصفحة') + P(310, 680, ['• الرابط (slug) والحالة: مسودة / منشورة', '• الترويسة: كاملة، مختصرة، مصغرة، بدون', '• التذييل: كامل، مختصر، بدون', '• شريط العنوان: بسيط، بنقش، داكن', '• عرض المحتوى: ضيق، عادي، واسع، كامل', '• مسار التنقل وشريط الأخبار'], 60, { s: 12.5, f: C.text, lh: 30 }).svg;
  o += G('settings', st);
  save('07-page-builder.svg', DOC(W, 900, R(0, 0, W, 900, { f: C.bg }) + o, 'منشئ الصفحات'));
}

// ───────────────────────── 08 Open data ─────────────────────────
function openData() {
  const LX = 120, RX = 1320, CW = RX - LX;
  let o = R(0, 0, W, 84, { f: C.white }) + LINE(0, 84, W, 84) + LOGO(RX - 150, 12, 60) + T(RX - 190, 50, 'الرئيسية  ·  دليل الخدمات  ·  البيانات المفتوحة  ·  المشاركة الرقمية', { s: 14, f: C.text });
  o += G('hero', R(LX, 110, CW, 250, { r: 36, f: C.white, s: C.line }) + T(RX - 40, 172, 'البيانات المفتوحة', { s: 44, w: 700, f: C.teal }) + P(RX - 40, 212, 'بيانات بلدية ظفار متاحة للجميع بصيغ مفتوحة ورخصة مفتوحة: للباحثين وروّاد الأعمال والإعلاميين والمطوّرين.', 70, { s: 16, f: C.text }).svg +
    R(RX - 40 - 560, 270, 560, 54, { r: 16, f: C.soft, s: C.line }) + I('search', RX - 84, 286, 22, C.faint) + T(RX - 96, 303, 'ابحث: إيجار، تراخيص، بناء، حفر…', { s: 14.5, f: C.faint }) +
    [['6', 'مجموعات بيانات'], ['255,433', 'سجلاً منشوراً'], ['يومي', 'التحديث'], ['3★', 'تقييم الانفتاح']].map((s, i) => R(LX + 40 + i * 132, 150, 120, 96, { r: 18, f: i === 0 ? C.teal : C.soft }) + T(LX + 100 + i * 132, 198, s[0], { s: 22, w: 700, a: 'middle', f: i === 0 ? C.white : C.ink }) + T(LX + 100 + i * 132, 226, s[1], { s: 11.5, a: 'middle', f: i === 0 ? '#cfe9e7' : C.mut })).join('') +
    [['خريطة الولايات', 'map'], ['ثلاثي الأبعاد', 'box'], ['خريطة حرارية', 'calendar-days'], ['خريطة شجرية', 'layout-grid']].map((v, i) => { const x = LX + 40 + i * 132; return R(x, 270, 120, 54, { r: 14, f: C.white, s: C.line }) + I(v[1], x + 92, 288, 18, C.teal2) + T(x + 84, 302, v[0], { s: 11.5, w: 700, f: C.text }); }).join(''));
  // datasets
  const ds = [['عقود الإيجار', '128,189 سجلاً', C.teal2, 'file-signature'], ['التراخيص البلدية', '109,061 سجلاً', C.orange, 'store'], ['تراخيص البناء', '14,167 سجلاً', C.blue, 'building-2'], ['تراخيص الحفر', '4,016 سجلاً', C.violet, 'construction']];
  o += T(RX, 416, 'مجموعات البيانات', { s: 26, w: 700 });
  ds.forEach((d, i) => {
    const w = (CW - 60) / 4, x = RX - (i + 1) * w - i * 20, y = 440;
    let sp = ''; for (let k = 0; k < 12; k++) { const h = 10 + ((k * 7 + i * 5) % 9) * 4; sp += R(x + 24 + k * ((w - 48) / 12), y + 150 - h, (w - 48) / 12 - 4, h, { r: 3, f: d[2], op: 0.75 }); }
    o += G(`dataset-${i + 1}`, R(x, y, w, 250, { r: 26, f: C.white, s: C.line }) + R(x + w - 68, y + 20, 46, 46, { r: 14, f: d[2], op: 0.12 }) + I(d[3], x + w - 57, y + 31, 24, d[2]) + T(x + w - 80, y + 40, d[0], { s: 17, w: 700 }) + T(x + w - 80, y + 62, d[1], { s: 12.5, f: C.mut }) + sp +
      R(x + 20, y + 172, 60, 24, { r: 12, f: '#ecfdf5' }) + T(x + 50, y + 189, 'يومي', { s: 11, w: 700, f: '#065f46', a: 'middle' }) + T(x + w - 24, y + 189, 'منذ 2020 · حسب الولاية', { s: 11.5, f: C.mut }) +
      BTN(x + w - 20 - 76, y + 206, 76, 30, 'CSV', { f: C.soft, c: C.text, r: 10, s: 12 }) + BTN(x + w - 20 - 160, y + 206, 76, 30, 'JSON', { f: C.soft, c: C.text, r: 10, s: 12 }) + BTN(x + 20, y + 206, 70, 30, 'API', { f: C.ink, r: 10, s: 12 }));
  });
  // visual explorer strip
  const vy = 730;
  let v = R(LX, vy, CW, 360, { r: 30, f: C.white, s: C.line }) + T(RX - 30, vy + 44, 'المستكشف المرئي · كل المعاملات حسب الولاية', { s: 19, w: 700 }) + R(RX - 30 - 460, vy + 64, 460, 44, { r: 14, f: C.soft });
  ['خريطة', 'ثلاثي الأبعاد', 'خريطة حرارية', 'خريطة شجرية'].forEach((t, i) => { v += (i === 0 ? R(RX - 34 - 110, vy + 68, 106, 36, { r: 10, f: C.white }) : '') + T(RX - 87 - i * 114, vy + 91, t, { s: 12.5, w: 700, a: 'middle', f: i === 0 ? C.teal : C.text }); });
  v += R(LX + 30, vy + 124, CW - 60, 210, { r: 20, f: '#dbe9f1' }) + `<path d="M${LX + 30} ${vy + 290} C ${LX + 300} ${vy + 250}, ${LX + 600} ${vy + 320}, ${RX - 30} ${vy + 260} L ${RX - 30} ${vy + 334} L ${LX + 30} ${vy + 334} Z" fill="#a9d3e6"/>`;
  [[520, 250, 46, 'صلالة'], [640, 244, 18, 'طاقة'], [730, 250, 12, 'مرباط'], [840, 240, 9, 'سدح'], [510, 190, 13, 'ثمريت'], [260, 180, 9, 'المزيونة'], [330, 268, 8, 'رخيوت'], [1000, 160, 11, 'شليم']].forEach(b => { v += CIRC(LX + b[0], vy + b[1], b[2], { f: C.teal, op: 0.72, s: C.white, sw: 2 }) + T(LX + b[0], vy + b[1] - b[2] - 6, b[3], { s: 11.5, w: 700, a: 'middle', f: C.ink }); });
  o += G('visual-explorer', v);
  // standards strip
  o += G('standards', R(LX, 1116, CW, 84, { r: 24, f: C.ink }) + T(RX - 30, 1166, 'المعايير ورخصة البيانات المفتوحة', { s: 15, w: 700, f: C.white }) + T(RX - 330, 1166, 'DCAT-AP · schema.org · W3C DWBP', { s: 14, f: '#cbd5e1' }) + BTN(LX + 30, 1138, 190, 40, 'اطلب مجموعة بيانات', { f: C.aqua, c: C.ink, s: 13.5 }) + BTN(LX + 236, 1138, 150, 40, 'للمطوّرين', { f: 'rgba(255,255,255,0.1)', s: 13.5 }));
  save('08-open-data.svg', DOC(W, 1240, R(0, 0, W, 1240, { f: C.bg }) + o, 'البيانات المفتوحة'));
}

accessibility(); dashboard(); popupBuilder(); surveyBuilder(); pageBuilder(); openData();
