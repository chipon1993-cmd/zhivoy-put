'use strict';
class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
function noStore(res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('CDN-Cache-Control', 'no-store');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
}
function json(res, status, value) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(value));
}
function route(fn) {
  return async (req, res) => {
    noStore(res);
    try { await fn(req, res); }
    catch (err) {
      // Never log upstream bodies, credentials, cookies or tokens.
      json(res, err instanceof HttpError ? err.status : 503,
        { error: err instanceof HttpError ? err.message : 'Сервис временно недоступен' });
    }
  };
}
function method(req, allowed) {
  if (!allowed.includes(req.method)) throw new HttpError(405, 'Метод не поддерживается');
}
function origin() {
  const value = process.env.APP_ORIGIN;
  if (!value) throw new HttpError(503, 'Сервер авторизации не настроен');
  const url = new URL(value);
  if (url.origin !== value || url.protocol !== 'https:') throw new HttpError(503, 'Требуется HTTPS origin');
  return value;
}
function csrf(req) {
  if (req.headers.origin !== origin() || req.headers['x-requested-with'] !== 'zhivoy-put') {
    throw new HttpError(403, 'Недопустимый источник запроса');
  }
  if ((req.headers['content-type'] || '').split(';')[0].trim() !== 'application/json') {
    throw new HttpError(415, 'Требуется application/json');
  }
}
async function body(req, max = 800000) {
  if (Number(req.headers['content-length']) > max) throw new HttpError(413, 'Слишком большой запрос');
  let data = req.body;
  if (data === undefined) {
    const chunks = []; let size = 0;
    for await (const chunk of req) {
      size += Buffer.byteLength(chunk);
      if (size > max) throw new HttpError(413, 'Слишком большой запрос');
      chunks.push(Buffer.from(chunk));
    }
    data = Buffer.concat(chunks).toString('utf8');
  }
  if (Buffer.isBuffer(data)) data = data.toString('utf8');
  if (typeof data === 'string') {
    if (Buffer.byteLength(data) > max) throw new HttpError(413, 'Слишком большой запрос');
    try { data = JSON.parse(data); } catch { throw new HttpError(400, 'Неверный JSON'); }
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new HttpError(400, 'Требуется объект');
  if (Buffer.byteLength(JSON.stringify(data)) > max) throw new HttpError(413, 'Слишком большой запрос');
  return data;
}
function text(value, min, max) {
  if (typeof value !== 'string' || value.trim().length < min || value.length > max) {
    throw new HttpError(400, 'Некорректное значение поля');
  }
  return value.trim();
}
async function request(url, options = {}) {
  return fetch(url, { ...options, redirect: 'error', signal: AbortSignal.timeout(10000) });
}
module.exports = { HttpError, route, json, method, csrf, body, text, request };
