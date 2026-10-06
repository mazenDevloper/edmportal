// Builds the Figma hand-off: one SVG canvas with every screen side by side (each a named top-level group),
// plus the design tokens as JSON. Run from the project root: node design/generator/figma.js
const fs = require('fs');
const path = require('path');
const dir = path.join(process.cwd(), 'design');
const files = fs.readdirSync(dir).filter(f => /^\d\d-.*\.svg$/.test(f)).sort();
const GAP = 240;
let x = 0, maxH = 0, body = '';
files.forEach((f, i) => {
  const svg = fs.readFileSync(path.join(dir, f), 'utf8');
  const [, w, h] = /<svg[^>]*width="(\d+)" height="(\d+)"/.exec(svg);
  const title = /<title>([^<]*)<\/title>/.exec(svg)[1];
  // ids must stay unique when all screens share one document
  const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<title>[^<]*<\/title>/, '')
    .replace(/id="([^"]+)"/g, `id="s${i + 1}-$1"`).replace(/url\(#([^)]+)\)/g, `url(#s${i + 1}-$1)`);
  body += `<g id="${f.slice(0, 2)} ${title}" transform="translate(${x} 0)">${inner}</g>\n`;
  x += +w + GAP; maxH = Math.max(maxH, +h);
});
const W = x - GAP;
fs.writeFileSync(path.join(dir, 'dhofar-portal-figma.svg'), `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${maxH}" viewBox="0 0 ${W} ${maxH}">
<title>Dhofar Municipality portal - all screens</title>
${body}</svg>
`);

// Design tokens (W3C format), values of src/lib/identity/tokens.ts
const color = (value, description) => ({ $type: 'color', $value: value, $description: description });
const dim = v => ({ $type: 'dimension', $value: `${v}px` });
const tokens = {
  color: {
    brand: { primary: color('#03CFCB', 'التيل الحيوي: اللون الأساسي للتفاعل والأزرار'), secondary: color('#470D67', 'الأرجواني الملكي: العلامة والعناوين الرسمية'), 'teal-dark': color('#008E91', 'تيل داكن: تدرجات وحالات التحويم'), 'teal-deep': color('#005751', 'تيل عميق: نصوص على خلفيات فاتحة'), 'purple-light': color('#A187B2', 'أرجواني فاتح: عناصر ثانوية وزخارف'), 'purple-soft': color('#BCA3CC', 'أرجواني ناعم: خلفيات هادئة') },
    neutral: { ink: color('#0F172A', 'حبر: النصوص الأساسية'), slate: color('#475569', 'رمادي أردوازي: نصوص ثانوية'), mist: color('#E2E8F0', 'ضباب: الحدود والفواصل'), cloud: color('#F8FAFC', 'غيم: خلفية الصفحات') },
    status: { success: color('#059669', 'نجاح'), warning: color('#D97706', 'تنبيه'), danger: color('#DC2626', 'خطر'), info: color('#2563EB', 'معلومة') },
    data: { rent: color('#00979B', 'عقود الإيجار'), dig: color('#7B3FA8', 'تراخيص الحفر'), licences: color('#C2560C', 'التراخيص البلدية'), buildings: color('#2563EB', 'تراخيص البناء') },
  },
  font: { family: { $type: 'fontFamily', $value: 'Readex Pro' } },
  type: Object.fromEntries([['display', 64, 900, 1.05], ['h1', 48, 900, 1.1], ['h2', 36, 800, 1.2], ['h3', 24, 700, 1.3], ['lead', 20, 400, 1.8], ['body', 16, 400, 1.8], ['caption', 12, 700, 1.5]]
    .map(t => [t[0], { $type: 'typography', $value: { fontFamily: 'Readex Pro', fontSize: `${t[1]}px`, fontWeight: t[2], lineHeight: t[3] } }])),
  space: Object.fromEntries([4, 8, 12, 16, 24, 32, 48, 64, 96].map((v, i) => [i + 1, dim(v)])),
  radius: { md: dim(12), lg: dim(20), xl: dim(32), pill: dim(9999) },
  breakpoint: { sm: dim(640), md: dim(768), lg: dim(1024), xl: dim(1280) },
  motion: { instant: { $type: 'duration', $value: '100ms' }, fast: { $type: 'duration', $value: '200ms' }, base: { $type: 'duration', $value: '300ms' }, slow: { $type: 'duration', $value: '500ms' } },
};
fs.writeFileSync(path.join(dir, 'dhofar-design-tokens.json'), JSON.stringify(tokens, null, 2));
console.log(files.length + ' screens', W + 'x' + maxH);
