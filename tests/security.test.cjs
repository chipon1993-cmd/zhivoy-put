const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const auth = require('../api/auth.js');
const content = require('../api/content.js');
const admin = require('../api/admin.js');
const github = require('../api/github.js');
const contact = require('../api/contact.js');
const { pagePath, buildPage } = require('../server/github.cjs');
const { validateCMS } = require('../server/content.cjs');
const originalFetch = global.fetch;
const env = { ...process.env };
afterEach(() => { global.fetch = originalFetch; process.env = { ...env }; });
const uid = '11111111-1111-4111-8111-111111111111';
const token = 'test.jwt.signature';
function setup() {
  Object.assign(process.env, { APP_ORIGIN: 'https://site.example', SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_PUBLISHABLE_KEY: 'test-only-publishable', GITHUB_CONTENT_TOKEN: 'test-only-server-secret',
    GITHUB_PUBLISH_ENABLED: 'true', VERCEL_ENV: 'production' });
}
function response(value, status = 200) { return new Response(status === 204 ? null : JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } }); }
function stub(member = true, extra) {
  const calls = [];
  global.fetch = async (url, options = {}) => {
    calls.push({ url, options });
    if (url.endsWith('/auth/v1/user')) return response({ id: uid, email: 'test@example.test', email_confirmed_at: '2026-01-01', user_metadata: { isAdmin: true, role: 'admin', name: '<script>' } });
    if (url.includes('/rest/v1/site_admins?')) return response(member ? [{ user_id: uid }] : []);
    if (extra) return extra(url, options);
    throw new Error('Unexpected upstream request');
  };
  return calls;
}
async function call(handler, { method = 'GET', url = '/api/test', payload, signed = false, origin = 'https://site.example', headers = {} } = {}) {
  const req = { method, url, body: payload, headers: { origin, 'content-type': 'application/json', 'x-requested-with': 'zhivoy-put',
    ...(signed ? { cookie: '__Host-zp_session=' + token } : {}), ...headers } };
  const res = { statusCode: 200, headers: {}, setHeader(k, v) { this.headers[k.toLowerCase()] = v; }, end(value) { this.raw = value === undefined ? '' : String(value); } };
  await handler(req, res);
  try { res.body = JSON.parse(res.raw); } catch {}
  return res;
}
test('every administrative API rejects unsigned requests, even forged role headers/body', async () => {
  setup(); const calls = stub();
  for (const [handler, method, payload] of [[content, 'PUT', { isAdmin: true, data: { cms_content: {} } }], [github, 'POST', { action: 'publish', isAdmin: true }], [contact, 'GET'], [contact, 'DELETE', { id: uid }]]) {
    assert.equal((await call(handler, { method, payload, headers: { 'x-admin': 'true', authorization: 'Bearer forged' } })).statusCode, 401);
  }
  assert.equal(calls.length, 0);
  const page = await call(admin);
  assert.equal(page.statusCode, 303); assert.equal(page.headers.location, '/pages/login.html?redirect=admin');
  assert.match(page.headers['cache-control'], /no-store/);
});
test('user_metadata cannot grant admin and revocation is checked on every request', async () => {
  setup(); stub(false);
  for (const handler of [admin, github, contact]) assert.equal((await call(handler, { signed: true })).statusCode, 403);
  stub(true); assert.equal((await call(admin, { signed: true, url: '/api/admin?file=editor.html' })).statusCode, 200);
  stub(false); assert.equal((await call(admin, { signed: true })).statusCode, 403);
});
test('expired/forged JWT, duplicate cookies, and upstream failures fail closed', async () => {
  setup(); global.fetch = async () => response({}, 401);
  assert.equal((await call(github, { signed: true })).statusCode, 401);
  assert.equal((await call(github, { headers: { cookie: '__Host-zp_session=a.b.c; __Host-zp_session=d.e.f' } })).statusCode, 401);
  global.fetch = async () => { throw new Error('secret upstream details'); };
  const result = await call(github, { signed: true });
  assert.equal(result.statusCode, 503); assert.doesNotMatch(result.raw, /secret upstream/);
});
test('writes require exact configured origin, custom header, JSON; Host is not trusted', async () => {
  setup(); const calls = stub();
  for (const origin of ['https://evil.example', 'null', undefined, 'https://site.example.evil.test']) {
    const headers = { origin, host: 'evil.example', 'x-forwarded-host': 'evil.example' };
    assert.equal((await call(content, { method: 'PUT', signed: true, payload: { data: {} }, headers })).statusCode, 403);
  }
  assert.equal((await call(auth, { method: 'POST', headers: { 'x-requested-with': '' }, payload: {} })).statusCode, 403);
  assert.equal((await call(auth, { method: 'POST', headers: { 'content-type': 'text/plain' }, payload: {} })).statusCode, 415);
  assert.equal(calls.length, 0);
});
test('login exposes access token only in a secure HttpOnly host cookie, never JSON/refresh', async () => {
  setup(); global.fetch = async () => response({ access_token: token, refresh_token: 'never-return-this', expires_in: 7200, user: { email_confirmed_at: '2026-01-01' } });
  const result = await call(auth, { method: 'POST', payload: { action: 'login', email: 'a@example.test', password: 'test-only-password' } });
  assert.equal(result.statusCode, 200);
  assert.match(result.headers['set-cookie'], /^__Host-zp_session=.*; Path=\/; HttpOnly; Secure; SameSite=Strict; Max-Age=3600$/);
  assert.doesNotMatch(result.raw, /signature|refresh|never-return/);
  assert.match(result.headers['vercel-cdn-cache-control'], /no-store/);
});
test('logout revokes Supabase session before clearing cookie; no false success on outage', async () => {
  setup(); let endpoint;
  global.fetch = async (url) => { endpoint = url; return response(null, 204); };
  const result = await call(auth, { method: 'POST', signed: true, payload: { action: 'logout' } });
  assert.match(endpoint, /logout\?scope=local$/); assert.match(result.headers['set-cookie'], /Max-Age=0/);
  global.fetch = async () => response({}, 500);
  assert.equal((await call(auth, { method: 'POST', signed: true, payload: { action: 'logout' } })).statusCode, 503);
});
test('CMS writes require membership, use user JWT and allow only public CMS keys', async () => {
  setup(); const calls = stub(true, (url, options) => { assert.match(url, /site_data\?on_conflict=key$/); assert.equal(options.headers.Authorization, 'Bearer ' + token); return response([]); });
  assert.equal((await call(content, { method: 'PUT', signed: true, payload: { data: { cms_content: { title: 'Привет' }, cms_menu: [] } } })).statusCode, 200);
  assert.equal(calls.length, 3);
  assert.equal((await call(content, { method: 'PUT', signed: true, payload: { data: { site_admins: [] } } })).statusCode, 400);
  assert.equal((await call(content, { url: '/api/content?key=contact_messages' })).statusCode, 400);
  assert.equal((await call(content, { url: '/api/content?key=navigator_data' })).statusCode, 400);
  assert.equal((await call(content, { method: 'DELETE' })).statusCode, 405);
});
test('bounded bodies and nested/prototype payloads are rejected', async () => {
  setup(); stub(true);
  const r = await call(content, { method: 'PUT', signed: true, payload: { data: { cms_content: { x: 'a'.repeat(800000) } } } });
  assert.equal(r.statusCode, 413);
  const input = require('../data/cms-data.json');
  assert.throws(() => validateCMS({ ...input, content: JSON.parse('{"__proto__":{"isAdmin":true}}') }));
  assert.throws(() => validateCMS({ ...input, themes: {} }));
  assert.throws(() => validateCMS({ ...input, arbitrary: 'bad' }));
  assert.equal(validateCMS(input)._meta.source, 'admin-server');
});
test('GitHub writes are fixed to server repo/branch/path and redact credentials/upstream bodies', async () => {
  setup(); let written;
  stub(true, (url, options) => {
    assert.match(url, /^https:\/\/api.github.com\/repos\/chipon1993-cmd\/zhivoy-put\/contents\/data\/cms-data.json/);
    assert.equal(options.headers.Authorization, 'Bearer test-only-server-secret');
    if (options.method === 'PUT') { written = JSON.parse(options.body); return response({ content: { sha: 'new-sha' }, commit: { sha: 'commit-sha' } }); }
    return response({ type: 'file', encoding: 'base64', sha: 'old-sha' });
  });
  const result = await call(github, { method: 'POST', signed: true, payload: { action: 'publish', path: '.github/workflows/evil.yml', repo: 'evil', branch: 'evil', expectedSha: 'old-sha', data: require('../data/cms-data.json') } });
  assert.equal(result.statusCode, 200); assert.equal(written.branch, 'master'); assert.equal(written.sha, 'old-sha');
  assert.doesNotMatch(result.raw, /test-only|Bearer/);
  assert.equal((await call(github, { method: 'POST', signed: true, payload: { action: 'publish', expectedSha: 'stale', data: require('../data/cms-data.json') } })).statusCode, 409);
  stub(true, () => response({ message: 'test-only-server-secret' }, 500));
  const failed = await call(github, { signed: true, url: '/api/github?action=status' });
  assert.equal(failed.statusCode, 502); assert.doesNotMatch(failed.raw, /test-only-server-secret/);
});
test('preview and disabled deployments cannot publish even with a valid admin', async () => {
  setup(); const calls = stub(); process.env.VERCEL_ENV = 'preview';
  assert.equal((await call(github, { method: 'POST', signed: true, payload: { action: 'publish', data: require('../data/cms-data.json') } })).statusCode, 503);
  assert.equal(calls.length, 2);
});
test('builder rejects path traversal/reserved directories and strips executable HTML', () => {
  for (const slug of ['../auth', 'login.html', '/index', 'a%2fb', 'x?ref=master', '', 'a'.repeat(61)]) assert.throws(() => pagePath(slug));
  assert.equal(pagePath('login'), 'pages/generated/login.html');
  const html = buildPage({ title: 'Test', html: '<p>Текст</p><script>bad()</script><img src="x" onerror="bad()"><a href="javascript:bad()">X</a><iframe src="/admin"></iframe><form action="/api/auth"></form>', css: 'p { color: red; }' });
  assert.doesNotMatch(html, /bad\(|<script|<iframe|onerror|<form/);
  assert.match(html, /Текст/); assert.match(html, /Content-Security-Policy/);
  assert.throws(() => buildPage({ title: 'X', html: '<p>x</p>', css: '</style><script>bad()</script>' }));
});
test('protected assets and aliases require auth; traversal and source files are not served', async () => {
  setup(); stub();
  for (const file of ['index', 'index.html', 'editor', 'editor.html', 'js/github-sync.js', 'css/admin-vars.css']) {
    assert.equal((await call(admin, { signed: true, url: '/api/admin?file=' + file })).statusCode, 200);
    assert.equal((await call(admin, { url: '/api/admin?file=' + file })).statusCode, 303);
  }
  for (const file of ['../server/auth.cjs', '%2e%2e%2f.env', '/etc/passwd', 'index.html/other', '../../admin/index.html']) assert.equal((await call(admin, { signed: true, url: '/api/admin?file=' + file })).statusCode, 404);
});
test('contact form performs anonymous insert without inbox reads or user-controlled IDs', async () => {
  setup(); let calls = 0;
  global.fetch = async (url, options) => {
    calls++; assert.match(url, /rest\/v1\/contact_inbox$/); assert.equal(options.method, 'POST');
    assert.equal(options.headers.Authorization, undefined);
    assert.deepEqual(Object.keys(JSON.parse(options.body)).sort(), ['email', 'message', 'name', 'subject']);
    return new Response(null, { status: 201 });
  };
  const result = await call(contact, { method: 'POST', payload: { id: uid, name: 'Test', email: 'a@example.test', subject: 'Hi', message: 'Hello', date: 'bad' } });
  assert.equal(result.statusCode, 200); assert.equal(calls, 1);
});
test('service worker never intercepts admin, auth, HTML, JavaScript or cross-origin requests', () => {
  const listeners = {};
  vm.runInNewContext(fs.readFileSync('sw.js', 'utf8'), { URL, self: { location: { origin: 'https://site.example' }, addEventListener: (name, fn) => listeners[name] = fn } });
  for (const path of ['/admin', '/admin/editor.html', '/api/auth', '/api/content', '/js/auth.js', '/pages/login.html', 'https://other.example/css/base.css']) {
    listeners.fetch({ request: { method: 'GET', url: new URL(path, 'https://site.example').href }, respondWith() { assert.fail('Private/dynamic request was intercepted'); } });
  }
});
test('legacy localStorage roles are removed and cannot grant browser admin UI state', async () => {
  const removed = [];
  const window = { location: { pathname: '/' } };
  vm.runInNewContext(fs.readFileSync('js/auth.js', 'utf8'), { window,
    document: { addEventListener() {}, getElementById() { return null; } }, localStorage: { removeItem(key) { removed.push(key); }, getItem() { return '{"isAdmin":true}'; } },
    fetch: async () => ({ ok: true, json: async () => ({ session: null }) }) });
  await window.ZhivoyAuth.ready;
  assert.equal(window.ZhivoyAuth.isAdmin(), false);
  assert.deepEqual(removed, ['zhivoyput_users', 'zhivoyput_session', 'github_pat']);
});
test('static build contains no admin pages, APIs, server code, SQL or secret templates', () => {
  require('../scripts/build.cjs');
  for (const p of ['admin', 'api', 'server', 'supabase', 'tests', '.env.example', 'package.json']) assert.equal(fs.existsSync('dist/' + p), false);
  assert.equal(fs.existsSync('dist/pages/login.html'), true);
});
test('registration confirmation verifies only signup and never returns a login session', async () => {
  setup(); const confirm = require('../api/confirm.js'); let verified = false;
  global.fetch = async (url, options) => {
    if (url.endsWith('/auth/v1/verify')) {
      const payload = JSON.parse(options.body); assert.equal(payload.type, 'signup');
      verified = true; return response({ access_token: token, refresh_token: 'never-return' });
    }
    assert.match(url, /logout\?scope=local/); return response(null, 204);
  };
  assert.equal((await call(confirm, { method: 'GET' })).statusCode, 405);
  const result = await call(confirm, { method: 'POST', payload: { token_hash: 'a'.repeat(64), type: 'recovery' } });
  assert.equal(verified, true); assert.equal(result.statusCode, 200);
  assert.equal(result.headers['set-cookie'], undefined); assert.doesNotMatch(result.raw, /signature|never-return/);
});
