const { route, json, method, csrf, body, HttpError } = require('../server/http.cjs');
const { data, requireAdmin } = require('../server/auth.cjs');
const { KEYS, validateSection } = require('../server/content.cjs');
module.exports = route(async (req, res) => {
  method(req, ['GET', 'PUT']);
  if (req.method === 'GET') {
    const key = new URL(req.url, 'https://localhost').searchParams.get('key');
    if (key && !KEYS.includes(key)) throw new HttpError(400, 'Недопустимый раздел');
    const rows = await data('site_data?select=key,value&key=' + (key ? 'eq.' + key : 'in.(' + KEYS.join(',') + ')'), null);
    return json(res, 200, { data: Object.fromEntries(rows.map(row => [row.key, row.value])) });
  }
  csrf(req);
  const auth = await requireAdmin(req);
  const input = await body(req);
  if (!input.data || typeof input.data !== 'object' || Array.isArray(input.data)) throw new HttpError(400, 'Неверные данные');
  const rows = Object.entries(input.data).map(([key, value]) => ({ key, value: validateSection(key, value), updated_at: new Date().toISOString() }));
  if (!rows.length) throw new HttpError(400, 'Пустой запрос');
  await data('site_data?on_conflict=key', auth.token, { method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' }, body: JSON.stringify(rows) });
  json(res, 200, { success: true });
});
