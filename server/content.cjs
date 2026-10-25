'use strict';
const { HttpError } = require('./http.cjs');
const SECTIONS = ['content', 'menu', 'territories', 'triggers', 'principles', 'roadmap', 'pages', 'themes'];
const KEYS = SECTIONS.map(s => 'cms_' + s);
function validateTree(value, depth = 0) {
  if (depth > 25) throw new HttpError(400, 'Слишком вложенные данные');
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      if (['__proto__', 'constructor', 'prototype'].includes(key)) throw new HttpError(400, 'Недопустимый ключ');
      validateTree(value[key], depth + 1);
    }
  }
}
function validateSection(key, value) {
  if (!KEYS.includes(key)) throw new HttpError(400, 'Недопустимый раздел');
  if (!value || typeof value !== 'object') throw new HttpError(400, 'Неверный формат раздела');
  if ((key === 'cms_content') === Array.isArray(value)) throw new HttpError(400, 'Неверный тип раздела');
  validateTree(value);
  return value;
}
function validateCMS(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new HttpError(400, 'Неверный контент');
  if (Object.keys(input).some(k => !SECTIONS.includes(k) && k !== '_meta')) throw new HttpError(400, 'Неизвестный раздел');
  const output = { _meta: { version: 1, updatedAt: new Date().toISOString(), source: 'admin-server' } };
  for (const section of SECTIONS) output[section] = validateSection('cms_' + section, input[section]);
  return output;
}
module.exports = { SECTIONS, KEYS, validateSection, validateCMS };
