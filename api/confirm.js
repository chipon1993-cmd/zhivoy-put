const { route, json, method, csrf, body, HttpError } = require('../server/http.cjs');
const { supabase } = require('../server/auth.cjs');
module.exports = route(async (req, res) => {
  method(req, ['POST']);
  csrf(req);
  const input = await body(req, 1000);
  if (typeof input.token_hash !== 'string' || !/^[A-Za-z0-9_-]{32,256}$/.test(input.token_hash)) throw new HttpError(400, 'Некорректная ссылка');
  const result = await supabase('/auth/v1/verify', null, {
    method: 'POST', body: JSON.stringify({ token_hash: input.token_hash, type: 'signup' })
  });
  if (!result.ok) throw new HttpError(400, 'Ссылка истекла или уже использована');
  const session = await result.json();
  if (session.access_token) {
    const logout = await supabase('/auth/v1/logout?scope=local', session.access_token, { method: 'POST' });
    if (!logout.ok && logout.status !== 401 && logout.status !== 403) throw new HttpError(503, 'Email подтверждён. Войдите через страницу входа');
  }
  // Confirmation never signs the browser in or returns session credentials.
  json(res, 200, { success: true });
});
