// Writes src/lib/page-dates.json: for every route, when its content last changed.
// A page's date is the newest of its page.tsx and the files it imports directly, ignoring
// shared chrome (header, footer, UI kit, helpers) so a header tweak doesn't "update" every page.
// Committed files use their last git commit; files with uncommitted edits use their modified time.
// Runs automatically before `npm run dev` and `npm run build`.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const APP = 'src/app';
const CHROME = [
  /^src\/components\/ui\//, /^src\/components\/(portal-header|portal-footer|accessibility-|popup-manager|admin-gate|admin-login-form)/,
  /^src\/components\/citizen\//, /^src\/components\/service\/service-icon/,
  /^src\/lib\/(utils|jsonbin|types|settings-store|admin-session|citizen-session|staff-session|i18n)\b/, /^src\/hooks\//, /^src\/firebase/,
];

const git = (...args) => { try { return execFileSync('git', args, { encoding: 'utf8' }).trim(); } catch { return ''; } };

function fileDate(file) {
  const dirty = git('status', '--porcelain', '--', file);
  if (dirty) return fs.statSync(file).mtime.toISOString();
  return git('log', '-1', '--format=%cI', '--', file) || fs.statSync(file).mtime.toISOString();
}

function resolveImport(spec, from) {
  let base;
  if (spec.startsWith('@/')) base = path.join('src', spec.slice(2));
  else if (spec.startsWith('.')) base = path.join(path.dirname(from), spec);
  else return null;
  for (const ext of ['.tsx', '.ts', '/index.tsx', '/index.ts', '']) {
    const f = (base + ext).split(path.sep).join('/');
    if (fs.existsSync(f) && fs.statSync(f).isFile()) return f;
  }
  return null;
}

function pages(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? pages(p) : d.name === 'page.tsx' ? [p.split(path.sep).join('/')] : [];
  });
}

const out = {};
for (const page of pages(APP)) {
  const route = '/' + path.dirname(page).slice(APP.length + 1).split('/').filter(s => s && !/^\(.*\)$/.test(s)).join('/');
  const src = fs.readFileSync(page, 'utf8');
  const deps = [...src.matchAll(/from\s+['"]([^'"]+)['"]/g)]
    .map(m => resolveImport(m[1], page))
    .filter(f => f && !CHROME.some(re => re.test(f)));
  // Compare as times, not text: git dates come with different time zones
  const newest = Math.max(...[page, ...deps].map(f => Date.parse(fileDate(f))));
  out[route.replace(/\/$/, '') || '/'] = new Date(newest).toISOString();
}

const target = 'src/lib/page-dates.json';
fs.writeFileSync(target, JSON.stringify(out, null, 2) + '\n');
console.log(`page dates: ${Object.keys(out).length} routes → ${target}`);
