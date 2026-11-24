-- Physical List Activity System (v2.0) — Supabase PostgreSQL Schema
-- Run this script in your Supabase Project -> SQL Editor -> New Query.

-- 1. Users table for sign-up accounts, profile details, and preferences
create table if not exists public.users (
  id text primary key,
  email text not null unique,
  name text not null,
  subtitle text not null default 'Building a consistent routine',
  preset_avatar text,
  avatar_url text,
  daily_goal_minutes integer not null default 60 check (daily_goal_minutes >= 10 and daily_goal_minutes <= 300),
  default_activity text not null default 'Running',
  password_hash text not null,
  password_salt text not null,
  created_at bigint not null,
  last_login_at bigint
);

-- Ensure last_login_at exists if upgrading an existing users table
alter table public.users
  add column if not exists last_login_at bigint;

create index if not exists idx_users_email on public.users (email);

-- 2. Dedicated login & session history table for users who sign in
create table if not exists public.user_logins (
  id text primary key,
  user_id text not null references public.users(id) on delete cascade,
  email text not null,
  event_type text not null default 'login' check (event_type in ('signup', 'login')),
  token_jti text,
  user_agent text,
  logged_in_at bigint not null,
  logged_out_at bigint
);

create index if not exists idx_user_logins_user_id_time
  on public.user_logins (user_id, logged_in_at desc);

create index if not exists idx_user_logins_token_jti
  on public.user_logins (token_jti);

-- 3. Activities table isolated per user
create table if not exists public.activities (
  id text primary key,
  user_id text not null references public.users(id) on delete cascade,
  name text not null,
  date text not null,
  duration_minutes integer not null check (duration_minutes > 0 and duration_minutes <= 1440),
  status text not null default 'Not Started' check (status in ('Completed', 'Ongoing', 'Not Started')),
  category text not null default 'Cardio',
  description text not null default '',
  created_at bigint not null
);

-- Safe upgrade if an older activities table existed without user_id or category
alter table public.activities
  add column if not exists user_id text;

alter table public.activities
  add column if not exists category text not null default 'Cardio';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'activities_user_id_fkey'
  ) then
    alter table public.activities
      add constraint activities_user_id_fkey
      foreign key (user_id) references public.users(id) on delete cascade
      not valid;
  end if;
end $$;

create index if not exists idx_activities_user_id_date
  on public.activities (user_id, date desc, created_at desc);

-- 4. Profiles table synced with auth.users and public.users metadata
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  app_user_id text unique references public.users(id) on delete set null,
  email text not null,
  name text not null default '',
  full_name text not null default '',
  subtitle text not null default 'Building a consistent routine',
  preset_avatar text,
  avatar_url text,
  daily_goal_minutes integer not null default 60 check (daily_goal_minutes >= 10 and daily_goal_minutes <= 300),
  default_activity text not null default 'Running',
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz
);

alter table public.profiles add column if not exists app_user_id text;
alter table public.profiles add column if not exists email text not null default '';
alter table public.profiles add column if not exists name text not null default '';
alter table public.profiles add column if not exists full_name text not null default '';
alter table public.profiles add column if not exists subtitle text not null default 'Building a consistent routine';
alter table public.profiles add column if not exists preset_avatar text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists daily_goal_minutes integer not null default 60;
alter table public.profiles add column if not exists default_activity text not null default 'Running';
alter table public.profiles add column if not exists raw_user_meta_data jsonb not null default '{}'::jsonb;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();
alter table public.profiles add column if not exists last_login_at timestamptz;

create index if not exists idx_profiles_email on public.profiles (email);
create index if not exists idx_profiles_app_user_id on public.profiles (app_user_id);

-- Trigger function: automatically create/update public.profiles when a user registers or updates metadata in auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_name text;
  v_full_name text;
  v_subtitle text;
  v_preset_avatar text;
  v_avatar_url text;
  v_daily_goal integer := 60;
  v_daily_goal_raw text;
  v_default_activity text;
  v_app_user_id text;
begin
  v_name := coalesce(
    nullif(trim(v_meta->>'name'), ''),
    nullif(trim(v_meta->>'full_name'), ''),
    nullif(trim(v_meta->>'display_name'), ''),
    split_part(coalesce(new.email, ''), '@', 1),
    'Athlete'
  );
  v_full_name := coalesce(nullif(trim(v_meta->>'full_name'), ''), v_name);
  v_subtitle := coalesce(nullif(trim(v_meta->>'subtitle'), ''), 'Building a consistent routine');
  v_preset_avatar := nullif(trim(v_meta->>'preset_avatar'), '');
  v_avatar_url := nullif(trim(coalesce(v_meta->>'avatar_url', v_meta->>'picture')), '');

  v_daily_goal_raw := trim(coalesce(v_meta->>'daily_goal_minutes', ''));
  if v_daily_goal_raw ~ '^\d+$' then
    v_daily_goal := greatest(10, least(300, v_daily_goal_raw::integer));
  end if;

  v_default_activity := coalesce(nullif(trim(v_meta->>'default_activity'), ''), 'Running');
  v_app_user_id := nullif(trim(v_meta->>'app_user_id'), '');

  if v_app_user_id is not null and not exists (select 1 from public.users where id = v_app_user_id) then
    v_app_user_id := null;
  end if;

  if v_app_user_id is null and new.email is not null then
    select id into v_app_user_id
    from public.users
    where lower(email) = lower(new.email)
    limit 1;
  end if;

  insert into public.profiles (
    id,
    app_user_id,
    email,
    name,
    full_name,
    subtitle,
    preset_avatar,
    avatar_url,
    daily_goal_minutes,
    default_activity,
    raw_user_meta_data,
    created_at,
    updated_at,
    last_login_at
  )
  values (
    new.id,
    v_app_user_id,
    coalesce(new.email, ''),
    v_name,
    v_full_name,
    v_subtitle,
    v_preset_avatar,
    v_avatar_url,
    v_daily_goal,
    v_default_activity,
    v_meta,
    coalesce(new.created_at, now()),
    now(),
    new.last_sign_in_at
  )
  on conflict (id) do update set
    app_user_id = coalesce(excluded.app_user_id, public.profiles.app_user_id),
    email = coalesce(nullif(excluded.email, ''), public.profiles.email),
    name = excluded.name,
    full_name = excluded.full_name,
    subtitle = excluded.subtitle,
    preset_avatar = case
      when v_meta ? 'preset_avatar' then excluded.preset_avatar
      else public.profiles.preset_avatar
    end,
    avatar_url = case
      when v_meta ? 'avatar_url' then excluded.avatar_url
      else public.profiles.avatar_url
    end,
    daily_goal_minutes = excluded.daily_goal_minutes,
    default_activity = excluded.default_activity,
    raw_user_meta_data = excluded.raw_user_meta_data,
    updated_at = now(),
    last_login_at = coalesce(excluded.last_login_at, public.profiles.last_login_at);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update of email, raw_user_meta_data, last_sign_in_at on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for any pre-existing auth.users rows
insert into public.profiles (
  id,
  app_user_id,
  email,
  name,
  full_name,
  subtitle,
  preset_avatar,
  avatar_url,
  daily_goal_minutes,
  default_activity,
  raw_user_meta_data,
  created_at,
  updated_at,
  last_login_at
)
select
  au.id,
  u.id,
  coalesce(au.email, ''),
  coalesce(nullif(trim(au.raw_user_meta_data->>'name'), ''), nullif(trim(au.raw_user_meta_data->>'full_name'), ''), split_part(coalesce(au.email, ''), '@', 1), 'Athlete'),
  coalesce(nullif(trim(au.raw_user_meta_data->>'full_name'), ''), nullif(trim(au.raw_user_meta_data->>'name'), ''), split_part(coalesce(au.email, ''), '@', 1), 'Athlete'),
  coalesce(nullif(trim(au.raw_user_meta_data->>'subtitle'), ''), 'Building a consistent routine'),
  nullif(trim(au.raw_user_meta_data->>'preset_avatar'), ''),
  nullif(trim(coalesce(au.raw_user_meta_data->>'avatar_url', au.raw_user_meta_data->>'picture')), ''),
  case
    when trim(coalesce(au.raw_user_meta_data->>'daily_goal_minutes', '')) ~ '^\d+$'
      then greatest(10, least(300, trim(au.raw_user_meta_data->>'daily_goal_minutes')::integer))
    else 60
  end,
  coalesce(nullif(trim(au.raw_user_meta_data->>'default_activity'), ''), 'Running'),
  coalesce(au.raw_user_meta_data, '{}'::jsonb),
  coalesce(au.created_at, now()),
  now(),
  au.last_sign_in_at
from auth.users au
left join public.users u on lower(u.email) = lower(au.email)
on conflict (id) do nothing;

-- 5. Enable Row Level Security (server accesses tables via SUPABASE_SERVICE_ROLE_KEY)
-- Blocking anon/public client access ensures password hashes, login records, and other users' activities are never exposed.
alter table public.users enable row level security;
alter table public.user_logins enable row level security;
alter table public.activities enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);
