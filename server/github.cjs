const { HttpError, request, text } = require('./http.cjs');
const sanitize = require('sanitize-html');
const REPO = 'chipon1993-cmd/zhivoy-put';
function branch() { return process.env.GITHUB_CONTENT_BRANCH || 'master'; }
async function github(path, options = {}) {
  const token = process.env.GITHUB_CONTENT_TOKEN;
  if (!token) throw new HttpError(503, 'Публикация не настроена на сервере');
  const result = await request('https://api.github.com/repos/' + REPO + '/' + path, {
    ...options, headers: { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json', 'User-Agent': 'zhivoy-put-cms', ...options.headers }
  });
  if (result.status === 404 && !options.method) return null;
  if (!result.ok) throw new HttpError(result.status === 409 || result.status === 422 ? 409 : 502,
    result.status === 409 || result.status === 422 ? 'Конфликт публикации. Загрузите актуальную версию' : 'GitHub отклонил запрос');
  return result.json();
}
function writeEnabled() {
  if (process.env.GITHUB_PUBLISH_ENABLED !== 'true' || (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production')) {
    throw new HttpError(503, 'Публикация отключена для этого окружения');
  }
}
function pagePath(slug) {
  if (typeof slug !== 'string' || !/^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/.test(slug)) throw new HttpError(400, 'Недопустимое имя страницы');
  return 'pages/generated/' + slug + '.html';
}
async function readFile(file) { return github('contents/' + file + '?ref=' + encodeURIComponent(branch())); }
async function writeFile(file, content, expectedSha, userId) {
  writeEnabled();
  if (file !== 'data/cms-data.json' && !/^pages\/generated\/[a-z0-9-]+\.html$/.test(file)) throw new HttpError(400, 'Запись этого файла запрещена');
  const current = await readFile(file);
  if (current && (current.type !== 'file' || current.encoding !== 'base64')) throw new HttpError(409, 'Неподдерживаемый файл');
  if (expectedSha !== undefined && expectedSha !== (current?.sha || null)) throw new HttpError(409, 'Файл изменился. Загрузите актуальную версию');
  const result = await github('contents/' + file, { method: 'PUT', body: JSON.stringify({
    message: 'CMS: update ' + file + ' (user ' + userId + ')', branch: branch(),
    content: Buffer.from(content, 'utf8').toString('base64'), ...(current ? { sha: current.sha } : {})
  }) });
  return { sha: result.content?.sha, commit: result.commit?.sha, path: file };
}
function buildPage(input) {
  const title = text(input.title, 1, 120);
  const html = text(input.html, 1, 400000);
  const css = typeof input.css === 'string' ? input.css : '';
  if (css.length > 150000 || /<\/style/i.test(css)) throw new HttpError(400, 'Некорректный CSS');
  const clean = sanitize(html, {
    allowedTags: sanitize.defaults.allowedTags.concat(['img', 'section', 'article', 'header', 'footer', 'main', 'nav', 'div', 'span']),
    allowedAttributes: { '*': ['class', 'id', 'style'], a: ['href', 'title'], img: ['src', 'alt', 'width', 'height'] },
    allowedSchemes: ['https', 'http', 'mailto', 'tel'], allowProtocolRelative: false
  });
  const safeTitle = sanitize(title, { allowedTags: [], allowedAttributes: {} }).replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return '<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'self\' \'unsafe-inline\' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src \'self\' https: data:; base-uri \'none\'; form-action \'none\'">' +
    '<title>' + safeTitle + '</title><link rel="stylesheet" href="/css/variables.css"><link rel="stylesheet" href="/css/base.css">' +
    '<style>' + css + '</style></head><body><nav><a href="/">Живой путь — на главную</a></nav>' + clean + '</body></html>';
}
module.exports = { REPO, github, readFile, writeFile, writeEnabled, pagePath, buildPage };
