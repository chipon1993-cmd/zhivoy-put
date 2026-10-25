const { route, json, method, csrf, body, text, HttpError } = require('../server/http.cjs');
const { supabase, readCookie, setCookie, clearCookie, authenticate, profile } = require('../server/auth.cjs');
module.exports = route(async (req, res) => {
  method(req, ['GET', 'POST']);
  if (req.method === 'GET') {
    try { return json(res, 200, { session: profile(await authenticate(req)) }); }
    catch (err) { if (err.status === 401) return json(res, 200, { session: null }); throw err; }
  }
  csrf(req);
  const input = await body(req, 6000);
  if (input.action === 'logout') {
    const token = readCookie(req);
    if (token) {
      const result = await supabase('/auth/v1/logout?scope=local', token, { method: 'POST' });
      if (!result.ok && result.status !== 401 && result.status !== 403) throw new HttpError(503, 'Выход не подтверждён. Повторите');
    }
    clearCookie(res);
    return json(res, 200, { success: true });
  }
  if (!['login', 'register'].includes(input.action)) throw new HttpError(400, 'Неизвестное действие');
  const email = text(input.email, 3, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Некорректный email');
  if (typeof input.password !== 'string' || input.password.length < (input.action === 'register' ? 12 : 1) || input.password.length > 256) {
    throw new HttpError(400, 'Проверьте пароль (для регистрации — минимум 12 символов)');
  }
  const signup = input.action === 'register';
  const payload = { email, password: input.password };
  if (signup) payload.data = { name: text(input.name, 1, 120) };
  const result = await supabase(signup ? '/auth/v1/signup' : '/auth/v1/token?grant_type=password', null,
    { method: 'POST', body: JSON.stringify(payload) });
  if (!result.ok) throw new HttpError(result.status === 429 ? 429 : 400,
    result.status === 429 ? 'Слишком много попыток. Повторите позже' : 'Не удалось войти или зарегистрироваться. Проверьте данные и подтверждение email');
  const session = await result.json();
  if (signup) {
    // Even if email confirmation was accidentally disabled, do not auto-login.
    if (session.access_token) await supabase('/auth/v1/logout?scope=local', session.access_token, { method: 'POST' });
    return json(res, 200, { success: true, confirmationRequired: true });
  }
  if (!session.access_token || !session.user?.email_confirmed_at || session.user?.is_anonymous || !Number.isFinite(session.expires_in)) {
    throw new HttpError(401, 'Подтвердите email');
  }
  setCookie(res, session.access_token, session.expires_in);
  // Refresh token is deliberately not persisted or sent to JS. Re-login within one hour.
  return json(res, 200, { success: true });
});
