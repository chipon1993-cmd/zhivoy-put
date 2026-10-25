const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'dist');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out);
// Explicit public allowlist. No admin HTML/source, SQL, tests, .env or node_modules.
for (const dir of ['css', 'js', 'pages', 'data']) {
  fs.cpSync(path.join(root, dir), path.join(out, dir), { recursive: true, dereference: false });
}
for (const file of fs.readdirSync(root)) {
  if (/\.(html|png|svg|ico|webp)$/.test(file) || ['sw.js', 'robots.txt', 'sitemap.xml', 'manifest.json'].includes(file)) {
    fs.copyFileSync(path.join(root, file), path.join(out, file));
  }
}
console.log('Public assets built in dist; admin files are served only through the authenticated API.');
