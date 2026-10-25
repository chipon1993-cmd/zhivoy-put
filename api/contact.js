const { route, json, method, csrf, body, text, HttpError } = require('../server/http.cjs');
const { data, requireAdmin } = require('../server/auth.cjs');
module.exports = route(async (req, res) => {
  method(req, ['GET', 'POST', 'DELETE']);
  if (req.method === 'GET') {
    const auth = await requireAdmin(req);
    return json(res, 200, { messages: await data('contact_inbox?select=id,name,email,subject,message,date&order=date.asc&limit=500', auth.token) });
  }
  csrf(req);
  if (req.method === 'DELETE') {
    const auth = await requireAdmin(req);
    const input = await body(req, 300);
    if (typeof input.id !== 'string' || !/^[0-9a-f-]{36}$/.test(input.id)) throw new HttpError(400, 'Неверный ID');
    await data('contact_inbox?id=eq.' + input.id, auth.token, { method: 'DELETE', headers: { Prefer: 'return=representation' } });
    return json(res, 200, { success: true });
  }
  const input = await body(req, 20000);
  const row = { name: text(input.name, 1, 120), email: text(input.email, 3, 254),
    subject: text(input.subject || 'Без темы', 1, 200), message: text(input.message, 1, 10000) };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) throw new HttpError(400, 'Некорректный email');
  // Anonymous insert only, never SELECT/UPDATE the entire inbox.
  await data('contact_inbox', null, { method: 'POST', headers: { Prefer: 'return=minimal' }, body: JSON.stringify(row) });
  json(res, 200, { success: true });
});
