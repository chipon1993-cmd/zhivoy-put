'use strict';
const { HttpError, request } = require('./http.cjs');
const COOKIE = '__Host-zp_session';
function config() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url)) {
    throw new HttpError(503, 'Supabase не настроен');
  }
  return { url, key };
}
async function supabase(path, token, options = {}) {
  const { url, key } = config();
  return request(url + path, { ...options, headers: {
    apikey: key, ...(token ? { Authorization: 'Bearer ' + token } : {}),
    'Content-Type': 'application/json', ...options.headers
  } });
}
async function data(path, token, options) {
  const res = await supabase('/rest/v1/' + path, token, options);
  if (!res.ok) throw new HttpError(res.status === 401 || res.status === 403 ? 403 : 503,
    'Операция с данными отклонена');
  const raw = await res.text();
  return raw ? JSON.parse(raw) : null;
}
function readCookie(req) {
  const cookies = (req.headers.cookie || '').split(';').map(s => s.trim()).filter(s => s.startsWith(COOKIE + '='));
  if (cookies.length !== 1) return null;
  const token = cookies[0].slice(COOKIE.length + 1);
  return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token) && token.length < 3800 ? token : null;
}
function setCookie(res, token, seconds) {
  if (!token || token.length >= 3800 || !/^[A-Za-z0-9_.-]+$/.test(token)) throw new HttpError(503, 'Не удалось создать сессию');
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${Math.max(0, Math.min(3600, Math.floor(seconds)))}`);
}
function clearCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
}
async function authenticate(req) {
  const token = readCookie(req);
  if (!token) throw new HttpError(401, 'Войдите в аккаунт');
  // Online verification: never trust a decoded JWT or a browser role flag.
  const result = await supabase('/auth/v1/user', token);
  if (result.status === 401 || result.status === 403) throw new HttpError(401, 'Сессия истекла. Войдите снова');
  if (!result.ok) throw new HttpError(503, 'Проверка сессии недоступна');
  const user = await result.json();
  if (!user.id || !user.email_confirmed_at || user.is_anonymous) throw new HttpError(401, 'Подтвердите email');
  // RLS checks the current membership AND the live auth.sessions row.
  const members = await data('site_admins?select=user_id&user_id=eq.' + encodeURIComponent(user.id) + '&limit=1', token);
  return { token, user, isAdmin: Array.isArray(members) && members.some(row => row.user_id === user.id) };
}
async function requireAdmin(req) {
  const auth = await authenticate(req);
  if (!auth.isAdmin) throw new HttpError(403, 'Требуются права администратора');
  return auth;
}
function profile(auth) {
  return { id: auth.user.id, email: auth.user.email,
    name: String(auth.user.user_metadata?.name || auth.user.email || '').slice(0, 120), isAdmin: auth.isAdmin };
}
module.exports = { supabase, data, readCookie, setCookie, clearCookie, authenticate, requireAdmin, profile };
