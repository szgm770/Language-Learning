-- Initial schema for the language-learning platform.
-- Principles:
--   * Every learner table is protected by row-level security (RLS): user_id = auth.uid().
--   * Learner progress is an append-only log of ops (sync_ops). There are no UPDATE or DELETE
--     policies on it, so no client — buggy, empty or malicious — can erase cloud progress.
--   * Roles live in their own table that only admins can change.

-- ---------------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------------
create type public.app_role as enum ('subscriber', 'author', 'editor', 'admin');

create table public.user_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.app_role not null,
  -- For authors and editors: the target languages they may edit (empty = all).
  languages text[] not null default '{}',
  granted_at timestamptz not null default now(),
  granted_by uuid references auth.users (id),
  primary key (user_id, role)
);
alter table public.user_roles enable row level security;

-- SECURITY DEFINER so policies can check roles without exposing the roles table.
create or replace function public.has_role(check_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles r
    where r.user_id = (select auth.uid()) and r.role = check_role
  );
$$;

create policy "users read their own roles" on public.user_roles
  for select to authenticated using (user_id = (select auth.uid()) or public.has_role('admin'));
create policy "admins manage roles" on public.user_roles
  for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));

-- ---------------------------------------------------------------------------
-- Profiles (display data only; learning settings are synced as ops)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "users read own profile" on public.profiles
  for select to authenticated using (id = (select auth.uid()) or public.has_role('admin'));
create policy "users update own profile" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'name', ''), 60));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Sync log: the single source of truth for learner progress
-- ---------------------------------------------------------------------------
create table public.sync_ops (
  -- Server order; clients pull "everything after seq N".
  seq bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- Op id created on the device. The same op pushed twice is stored once.
  id uuid not null,
  device_id text not null check (char_length(device_id) <= 64),
  kind text not null check (kind in ('review', 'card_add', 'lesson_result', 'activity', 'setting', 'enroll', 'unenroll')),
  -- Device time of the op (epoch ms), clamped by the server if far in the future.
  at bigint not null,
  schema_version smallint not null,
  body jsonb not null,
  received_at timestamptz not null default now(),
  unique (user_id, id)
);
create index sync_ops_user_seq on public.sync_ops (user_id, seq);
create index sync_ops_user_kind on public.sync_ops (user_id, kind);
alter table public.sync_ops enable row level security;

create policy "users read own ops" on public.sync_ops
  for select to authenticated using (user_id = (select auth.uid()));
create policy "users append own ops" on public.sync_ops
  for insert to authenticated with check (user_id = (select auth.uid()));
-- Deliberately no UPDATE or DELETE policies: the log is append-only.
-- Account deletion removes ops through the auth.users cascade.

-- Batches refused by the safety brake, kept for review.
create table public.sync_blocked (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  device_id text not null,
  reason text not null,
  op_count int not null,
  sample jsonb,
  created_at timestamptz not null default now()
);
alter table public.sync_blocked enable row level security;
create policy "users record own blocked batches" on public.sync_blocked
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "admins read blocked batches" on public.sync_blocked
  for select to authenticated using (public.has_role('admin'));

-- ---------------------------------------------------------------------------
-- Content (used by the admin panel; the learner app reads published packs)
-- ---------------------------------------------------------------------------
create type public.content_status as enum ('draft', 'in_review', 'approved', 'published');

create table public.courses (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  source_lang text not null,
  target_lang text not null,
  data jsonb not null,
  status public.content_status not null default 'draft',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id)
);

create table public.units (
  course_id text not null references public.courses (id) on delete cascade,
  id text not null check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  position int not null,
  data jsonb not null,
  version text not null,
  status public.content_status not null default 'draft',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id),
  primary key (course_id, id)
);

-- Every saved version of a unit, so any change can be rolled back.
create table public.unit_versions (
  id bigint generated always as identity primary key,
  course_id text not null,
  unit_id text not null,
  version text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  foreign key (course_id, unit_id) references public.units (course_id, id) on delete cascade
);

alter table public.courses enable row level security;
alter table public.units enable row level security;
alter table public.unit_versions enable row level security;

create policy "anyone reads published courses" on public.courses
  for select using (status = 'published' or public.has_role('author') or public.has_role('editor') or public.has_role('admin'));
create policy "staff write courses" on public.courses
  for all to authenticated
  using (public.has_role('editor') or public.has_role('admin'))
  with check (public.has_role('editor') or public.has_role('admin'));

create policy "anyone reads published units" on public.units
  for select using (status = 'published' or public.has_role('author') or public.has_role('editor') or public.has_role('admin'));
create policy "authors write draft units" on public.units
  for insert to authenticated
  with check (public.has_role('editor') or public.has_role('admin') or (public.has_role('author') and status in ('draft', 'in_review')));
create policy "authors update draft units" on public.units
  for update to authenticated
  using (public.has_role('editor') or public.has_role('admin') or (public.has_role('author') and status in ('draft', 'in_review')))
  with check (public.has_role('editor') or public.has_role('admin') or (public.has_role('author') and status in ('draft', 'in_review')));
create policy "editors delete units" on public.units
  for delete to authenticated using (public.has_role('editor') or public.has_role('admin'));

create policy "staff read versions" on public.unit_versions
  for select to authenticated using (public.has_role('author') or public.has_role('editor') or public.has_role('admin'));
create policy "staff add versions" on public.unit_versions
  for insert to authenticated with check (public.has_role('author') or public.has_role('editor') or public.has_role('admin'));

-- ---------------------------------------------------------------------------
-- "Report a problem" on an exercise
-- ---------------------------------------------------------------------------
create table public.content_reports (
  id bigint generated always as identity primary key,
  user_id uuid default auth.uid() references auth.users (id) on delete set null,
  course_id text not null,
  exercise_id text not null,
  category text not null check (category in ('answer_rejected', 'mistake', 'audio', 'other')),
  learner_answer text check (char_length(learner_answer) <= 500),
  comment text check (char_length(comment) <= 1000),
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.content_reports enable row level security;
create policy "learners file reports" on public.content_reports
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "staff read reports" on public.content_reports
  for select to authenticated using (public.has_role('editor') or public.has_role('admin'));
create policy "staff resolve reports" on public.content_reports
  for update to authenticated using (public.has_role('editor') or public.has_role('admin'));

-- ---------------------------------------------------------------------------
-- Audit log for sensitive actions (role changes, publishing, account deletion)
-- ---------------------------------------------------------------------------
create table public.audit_log (
  id bigint generated always as identity primary key,
  actor uuid references auth.users (id) on delete set null,
  action text not null,
  target text,
  details jsonb,
  created_at timestamptz not null default now()
);
alter table public.audit_log enable row level security;
create policy "admins read audit log" on public.audit_log
  for select to authenticated using (public.has_role('admin'));

create or replace function public.audit_role_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.audit_log (actor, action, target, details)
  values (
    (select auth.uid()),
    'role_' || lower(tg_op),
    coalesce(new.user_id, old.user_id)::text,
    jsonb_build_object('role', coalesce(new.role, old.role))
  );
  return coalesce(new, old);
end;
$$;

create trigger audit_user_roles
  after insert or update or delete on public.user_roles
  for each row execute function public.audit_role_change();
