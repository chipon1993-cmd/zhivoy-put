const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { PGlite } = require('@electric-sql/pglite');
const user = '11111111-1111-4111-8111-111111111111';
const other = '22222222-2222-4222-8222-222222222222';
const sid = '33333333-3333-4333-8333-333333333333';
test('actual PostgreSQL RLS denies bypass, self-promotion, inbox disclosure and revoked sessions', async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated;
      create schema auth;
      create table auth.users(id uuid primary key);
      create table auth.sessions(id uuid primary key, user_id uuid);
      create function auth.uid() returns uuid language sql stable as $$ select (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid $$;
      create function auth.jwt() returns jsonb language sql stable as $$ select current_setting('request.jwt.claims', true)::jsonb $$;
      grant usage on schema auth to anon, authenticated;
      grant execute on function auth.uid(), auth.jwt() to anon, authenticated;
      insert into auth.users values ('${user}'), ('${other}');
      insert into auth.sessions values ('${sid}', '${user}');
      create table public.site_data(key text primary key, value jsonb not null, updated_at timestamptz default now());
      alter table public.site_data enable row level security;
      grant all on public.site_data to anon, authenticated;
      create policy legacy_open_access on public.site_data for all using (true) with check (true);
      insert into public.site_data(key,value) values ('cms_content','{}'), ('navigator_data','{"private":true}'), ('contact_messages','[{"name":"Test","email":"a@example.test","subject":"Hi","message":"Legacy"}]');
    `);
    const sql = fs.readFileSync('supabase/security.sql', 'utf8');
    await db.exec(sql); await db.exec(sql); // re-run is idempotent
    assert.equal((await db.query("select count(*)::int n from contact_inbox")).rows[0].n, 1);
    assert.equal((await db.query("select count(*)::int n from pg_policies where policyname='legacy_open_access'")).rows[0].n, 0);
    await db.exec(`insert into public.site_admins(user_id) values ('${user}')`);
    async function role(name, claims) {
      await db.exec('reset role');
      await db.query("select set_config('request.jwt.claims', $1, false)", [JSON.stringify(claims || {})]);
      await db.exec('set role ' + name);
    }
    await role('anon');
    assert.deepEqual((await db.query('select key from site_data')).rows, [{ key: 'cms_content' }]);
    await assert.rejects(db.exec("insert into site_data(key,value) values ('cms_menu','[]')"));
    await assert.rejects(db.exec('select * from site_admins'));
    await assert.rejects(db.exec('select * from contact_inbox'));
    await assert.rejects(db.exec('select private.is_site_admin()'));
    await db.exec("insert into contact_inbox(name,email,subject,message) values ('A','a@example.test','Hello','World')");
    await assert.rejects(db.exec("insert into contact_inbox(id,name,email,subject,message) values (gen_random_uuid(),'A','a@example.test','Hi','x')"));
    await role('authenticated', { sub: other, session_id: sid, user_metadata: { isAdmin: true, role: 'admin' } });
    assert.equal((await db.query('select * from site_admins')).rows.length, 0);
    assert.equal((await db.query('select * from contact_inbox')).rows.length, 0);
    await assert.rejects(db.exec(`insert into site_admins(user_id) values ('${other}')`));
    await assert.rejects(db.exec("insert into site_data(key,value) values ('cms_menu','[]')"));
    assert.equal((await db.query("update site_data set value='{}' where key='cms_content' returning key")).rows.length, 0);
    await role('authenticated', { sub: user, session_id: sid });
    assert.equal((await db.query('select * from site_admins')).rows.length, 1);
    await db.exec("insert into site_data(key,value) values ('cms_menu','[]') on conflict(key) do update set value=excluded.value");
    assert.equal((await db.query("update site_data set value='{}' where key='cms_content' returning key")).rows.length, 1);
    await assert.rejects(db.exec("update site_data set key='navigator_data2' where key='cms_menu'"));
    assert.equal((await db.query('select * from contact_inbox')).rows.length, 2);
    await db.exec('delete from contact_inbox');
    assert.equal((await db.query('select * from contact_inbox')).rows.length, 0);
    await role('authenticated', { sub: user, session_id: sid, is_anonymous: true });
    assert.equal((await db.query('select * from site_admins')).rows.length, 0);
    await db.exec('reset role'); await db.exec(`delete from auth.sessions where id='${sid}'`);
    await role('authenticated', { sub: user, session_id: sid });
    assert.equal((await db.query('select * from site_admins')).rows.length, 0);
    await assert.rejects(db.exec("insert into site_data(key,value) values ('cms_themes','[]')"));
    await db.exec('reset role'); await db.exec(`insert into auth.sessions values ('${sid}', '${user}'); delete from site_admins where user_id='${user}'`);
    await role('authenticated', { sub: user, session_id: sid });
    assert.equal((await db.query('select * from site_admins')).rows.length, 0);
    await assert.rejects(db.exec("insert into site_data(key,value) values ('cms_themes','[]')"));
  } finally { await db.close(); }
});
