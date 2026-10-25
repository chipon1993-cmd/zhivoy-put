-- REVIEWED SETUP SCRIPT, not an applied migration.
-- Back up and inspect the live schema/policies first; see docs/SECURITY.md.
-- Run as postgres in the intended Supabase project. Do not expose schema private.
begin;

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create table if not exists public.site_data (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.site_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.contact_inbox (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 120),
  email text not null check (length(email) between 3 and 254),
  subject text not null check (length(subject) between 1 and 200),
  message text not null check (length(message) between 1 and 10000),
  date timestamptz not null default now()
);

alter table public.site_data enable row level security;
alter table public.site_admins enable row level security;
alter table public.contact_inbox enable row level security;

-- Existing permissive policies combine with OR. Replace all policies on these
-- three app-owned tables, rather than adding restrictive-looking policies.
do $$
declare p record;
begin
  for p in select schemaname, tablename, policyname from pg_policies
    where schemaname = 'public' and tablename in ('site_data', 'site_admins', 'contact_inbox')
  loop
    execute format('drop policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

revoke all on public.site_data, public.site_admins, public.contact_inbox from public, anon, authenticated;
grant select on public.site_data to anon, authenticated;
grant insert, update on public.site_data to authenticated;
grant select on public.site_admins to authenticated;
grant select, delete on public.contact_inbox to authenticated;
grant insert (name, email, subject, message) on public.contact_inbox to anon, authenticated;

-- The narrowly scoped SECURITY DEFINER is needed to inspect auth.sessions and
-- membership without exposing either table. No caller-supplied IDs, no dynamic SQL.
-- It lives outside the exposed API schema and uses the verified JWT's auth.uid().
create or replace function private.is_site_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select auth.uid() is not null
    and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
    and exists (select 1 from public.site_admins a where a.user_id = auth.uid())
    and exists (select 1 from auth.sessions s
      where s.user_id = auth.uid() and s.id::text = auth.jwt() ->> 'session_id');
$$;
revoke all on function private.is_site_admin() from public, anon;
grant execute on function private.is_site_admin() to authenticated;

create policy site_admin_self on public.site_admins for select to authenticated
  using (user_id = (select auth.uid()) and (select private.is_site_admin()));
-- There is deliberately no browser-writable membership policy.

create policy cms_public_read on public.site_data for select to anon, authenticated
  using (key in ('cms_content','cms_menu','cms_territories','cms_triggers',
    'cms_principles','cms_roadmap','cms_pages','cms_themes'));
create policy cms_admin_insert on public.site_data for insert to authenticated
  with check ((select private.is_site_admin()) and key in
    ('cms_content','cms_menu','cms_territories','cms_triggers','cms_principles','cms_roadmap','cms_pages','cms_themes'));
create policy cms_admin_update on public.site_data for update to authenticated
  using ((select private.is_site_admin()) and key in
    ('cms_content','cms_menu','cms_territories','cms_triggers','cms_principles','cms_roadmap','cms_pages','cms_themes'))
  with check ((select private.is_site_admin()) and key in
    ('cms_content','cms_menu','cms_territories','cms_triggers','cms_principles','cms_roadmap','cms_pages','cms_themes'));

create policy inbox_submit on public.contact_inbox for insert to anon, authenticated with check (true);
create policy inbox_admin_read on public.contact_inbox for select to authenticated using ((select private.is_site_admin()));
create policy inbox_admin_delete on public.contact_inbox for delete to authenticated using ((select private.is_site_admin()));

-- Move valid legacy messages without exposing the old shared key. Deterministic
-- IDs make rerunning the setup idempotent. Original JSON is retained for recovery.
insert into public.contact_inbox (id, name, email, subject, message, date)
select md5(m::text)::uuid, m->>'name', m->>'email',
  coalesce(nullif(m->>'subject', ''), 'Без темы'), m->>'message', now()
from public.site_data d,
  lateral jsonb_array_elements(case when jsonb_typeof(d.value) = 'array' then d.value else '[]'::jsonb end) m
where d.key = 'contact_messages'
  and length(m->>'name') between 1 and 120
  and length(m->>'email') between 3 and 254
  and length(coalesce(nullif(m->>'subject', ''), 'Без темы')) between 1 and 200
  and length(m->>'message') between 1 and 10000
on conflict (id) do nothing;

commit;

-- No bootstrap user, password or automatic first-admin promotion.
-- After creating & verifying YOUR user through Supabase Auth, an operator runs:
-- insert into public.site_admins(user_id) values ('<verified-auth-user-uuid>');
-- Revocation: delete from public.site_admins where user_id = '<uuid>';
