// Builds one print page with every artboard, for exporting a multi-page PDF / Illustrator file.
// Run from the project root: node design/generator/export.js  (then print design/_export.html to PDF)
const fs = require('fs');
const path = require('path');
const dir = path.join(process.cwd(), 'design');
const files = fs.readdirSync(dir).filter(f => /^\d\d-.*\.svg$/.test(f)).sort();
let css = '', body = '';
files.forEach((f, i) => {
  const svg = fs.readFileSync(path.join(dir, f), 'utf8').replace(/<\?xml[^>]*\?>\s*/, '');
  const [, w, h] = /<svg[^>]*width="(\d+)" height="(\d+)"/.exec(svg);
  // ids must stay unique when all files share one document
  const scoped = svg.replace(/id="([^"]+)"/g, `id="a${i}-$1"`).replace(/url\(#([^)]+)\)/g, `url(#a${i}-$1)`);
  css += `@page p${i} { size: ${w}px ${h}px; margin: 0 } .p${i} { page: p${i}; width: ${w}px; height: ${h}px }\n`;
  body += `<section class="p${i}">${scoped}</section>\n`;
});
fs.writeFileSync(path.join(dir, '_export.html'), `<!doctype html><html lang="ar"><head><meta charset="utf-8"><title>Dhofar Municipality portal - screens</title>
<link href="https://fonts.googleapis.com/css2?family=Readex+Pro:wght@400;500;700&display=swap" rel="stylesheet">
<style>html,body{margin:0;padding:0} section{break-after:page;overflow:hidden} section:last-child{break-after:auto} svg{display:block}
${css}</style></head><body>${body}</body></html>`);
console.log(files.length + ' artboards');
