const { route, method, csrf, body, json, HttpError } = require('../server/http.cjs');
const { requireAdmin } = require('../server/auth.cjs');
const { REPO, github, readFile, writeFile, pagePath, buildPage } = require('../server/github.cjs');
const { validateCMS } = require('../server/content.cjs');
module.exports = route(async (req, res) => {
  method(req, ['GET', 'POST']);
  if (req.method === 'POST') csrf(req);
  const auth = await requireAdmin(req);
  if (req.method === 'GET') {
    const action = new URL(req.url, 'https://localhost').searchParams.get('action');
    if (action === 'status') {
      const repo = await github('');
      if (!repo) throw new HttpError(502, 'Репозиторий недоступен');
      return json(res, 200, { ok: true, repo: REPO, publishEnabled: process.env.GITHUB_PUBLISH_ENABLED === 'true' && (!process.env.VERCEL_ENV || process.env.VERCEL_ENV === 'production') });
    }
    if (action === 'history') {
      const commits = await github('commits?per_page=6&sha=' + encodeURIComponent(process.env.GITHUB_CONTENT_BRANCH || 'master'));
      return json(res, 200, { commits: (commits || []).map(c => ({ sha: c.sha.slice(0, 7), message: c.commit.message, date: c.commit.author.date })) });
    }
    if (action === 'pull') {
      const file = await readFile('data/cms-data.json');
      if (!file?.content) throw new HttpError(502, 'Файл контента недоступен');
      return json(res, 200, { data: JSON.parse(Buffer.from(file.content, 'base64').toString('utf8')), sha: file.sha });
    }
    throw new HttpError(400, 'Неизвестное действие');
  }
  const input = await body(req);
  let file, content;
  if (input.action === 'publish') {
    file = 'data/cms-data.json'; content = JSON.stringify(validateCMS(input.data), null, 2);
  } else if (input.action === 'page') {
    file = pagePath(input.slug); content = buildPage(input);
  } else throw new HttpError(400, 'Неизвестное действие');
  json(res, 200, await writeFile(file, content, input.expectedSha, auth.user.id));
});
