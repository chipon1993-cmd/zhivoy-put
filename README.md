# Живой путь

Статический сайт и административная панель с серверной авторизацией на Vercel,
Supabase Auth/RLS и публикацией контента в GitHub.

## Проверка изменений

Требуется Node.js 24:

```sh
npm ci --ignore-scripts
npm test
npm run build
```

Публичные файлы находятся в `dist`. Каталог `admin` обслуживает только защищённая
Function `api/admin.js`; обычный статический хостинг не заменяет Vercel Functions.

Порядок безопасной настройки, ограничения, SQL и приёмка:
[docs/SECURITY.md](docs/SECURITY.md). До настройки служб админка закрыта.
Реальные credentials вводятся в соответствующих Dashboard, не в исходники.
