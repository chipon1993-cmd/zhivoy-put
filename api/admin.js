const fs = require('node:fs/promises');
const path = require('node:path');
const { route, method, HttpError } = require('../server/http.cjs');
const { requireAdmin } = require('../server/auth.cjs');
module.exports = route(async (req, res) => {
  method(req, ['GET', 'HEAD']);
  try { await requireAdmin(req); }
  catch (err) {
    if (err.status !== 401) throw err;
    res.statusCode = 303;
    res.setHeader('Location', '/pages/login.html?redirect=admin');
    return res.end();
  }
  let file = new URL(req.url, 'https://localhost').searchParams.get('file') || 'index.html';
  if (file === 'index' || file === 'editor') file += '.html';
  if (!/^[a-zA-Z0-9_/-]+\.(html|js|css|svg)$/.test(file) || file.startsWith('/') || file.includes('//')) throw new HttpError(404, 'Не найдено');
  const root = path.join(process.cwd(), 'admin');
  let bytes;
  try {
    const target = file === 'js/purify.min.js'
      ? path.join(path.dirname(require.resolve('dompurify')), 'purify.min.js')
      : path.join(root, file);
    bytes = await fs.readFile(target);
  }
  catch { throw new HttpError(404, 'Не найдено'); }
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };
  res.setHeader('Content-Type', types[path.extname(file)] + '; charset=utf-8');
  res.setHeader('Content-Security-Policy', "base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'");
  res.statusCode = 200;
  res.end(req.method === 'HEAD' ? undefined : bytes);
});
