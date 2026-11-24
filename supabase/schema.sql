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

-- Safe upgrade if an older activities table existed without user_id
alter table public.activities
  add column if not exists user_id text;

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

-- 4. Enable Row Level Security (server accesses tables via SUPABASE_SERVICE_ROLE_KEY)
-- Blocking anon/public client access ensures password hashes, login records, and other users' activities are never exposed.
alter table public.users enable row level security;
alter table public.user_logins enable row level security;
alter table public.activities enable row level security;
