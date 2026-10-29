-- RLS tests. Any failed check raises an exception and stops the run (ON_ERROR_STOP).
\set ON_ERROR_STOP on

insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'alice@example.com', '{"name":"Alice"}'),
  ('00000000-0000-0000-0000-00000000000b', 'bob@example.com', '{}'),
  ('00000000-0000-0000-0000-0000000000ad', 'admin@example.com', '{}');
insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-0000000000ad', 'admin');

create or replace function pg_temp.expect(ok boolean, msg text) returns void language plpgsql as $$
begin
  if not ok then raise exception 'FAILED: %', msg; end if;
  raise notice 'ok - %', msg;
end $$;

select pg_temp.expect((select count(*) from public.profiles) = 3, 'a profile is created for each new user');

-- ---- Alice -------------------------------------------------------------------------
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', false);

insert into public.sync_ops (id, device_id, kind, at, schema_version, body) values
  ('10000000-0000-4000-8000-000000000001', 'phone', 'review', 1, 1, '{}'),
  ('10000000-0000-4000-8000-000000000002', 'phone', 'enroll', 2, 1, '{}');
-- The same op pushed again is ignored.
insert into public.sync_ops (id, device_id, kind, at, schema_version, body)
  values ('10000000-0000-4000-8000-000000000001', 'laptop', 'review', 1, 1, '{}')
  on conflict (user_id, id) do nothing;
select pg_temp.expect((select count(*) from public.sync_ops) = 2, 'alice sees her 2 ops, duplicates ignored');

update public.sync_ops set at = 999;
select pg_temp.expect((select max(at) from public.sync_ops) = 2, 'ops cannot be updated');
delete from public.sync_ops;
select pg_temp.expect((select count(*) from public.sync_ops) = 2, 'ops cannot be deleted');

do $$ begin
  insert into public.sync_ops (user_id, id, device_id, kind, at, schema_version, body)
    values ('00000000-0000-0000-0000-00000000000b', '10000000-0000-4000-8000-000000000009', 'x', 'review', 1, 1, '{}');
  raise exception 'FAILED: alice wrote an op for bob';
exception when insufficient_privilege then raise notice 'ok - alice cannot write ops for bob';
end $$;

do $$ begin
  insert into public.user_roles (user_id, role) values ('00000000-0000-0000-0000-00000000000a', 'admin');
  raise exception 'FAILED: alice made herself admin';
exception when insufficient_privilege then raise notice 'ok - alice cannot grant herself a role';
end $$;

update public.profiles set display_name = 'Hacked' where id = '00000000-0000-0000-0000-00000000000b';
select pg_temp.expect((select count(*) from public.profiles) = 1, 'alice sees only her own profile');

do $$ begin
  insert into public.courses (id, source_lang, target_lang, data) values ('evil', 'he', 'en', '{}');
  raise exception 'FAILED: a learner created a course';
exception when insufficient_privilege then raise notice 'ok - learners cannot write content';
end $$;

-- ---- Bob ---------------------------------------------------------------------------
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', false);
select pg_temp.expect((select count(*) from public.sync_ops) = 0, 'bob cannot see alice''s ops');
select pg_temp.expect((select display_name from public.profiles) = '', 'bob''s profile was not changed by alice');

-- ---- Anonymous ---------------------------------------------------------------------
reset role;
set role anon;
select set_config('request.jwt.claim.sub', '', false);
select pg_temp.expect((select count(*) from public.sync_ops) = 0, 'anonymous visitors see no ops');

-- ---- Admin -------------------------------------------------------------------------
reset role;
set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000ad', false);
insert into public.courses (id, source_lang, target_lang, data, status) values ('en-for-he', 'he', 'en', '{}', 'published');
insert into public.user_roles (user_id, role, languages) values ('00000000-0000-0000-0000-00000000000b', 'author', '{en}');
select pg_temp.expect((select count(*) from public.audit_log where action = 'role_insert') >= 1, 'role changes are audited');

reset role;
set role anon;
select pg_temp.expect((select count(*) from public.courses) = 1, 'anyone can read a published course');
reset role;
do $$ begin raise notice 'All RLS tests passed'; end $$;
