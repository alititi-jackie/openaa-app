create extension if not exists pgcrypto;
create extension if not exists citext;

do $$
begin
  create type public.post_type as enum ('job', 'housing', 'marketplace', 'service');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.post_status as enum ('draft', 'pending_review', 'published', 'hidden', 'rejected', 'expired', 'deleted');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.post_visibility as enum ('public', 'private');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.account_type as enum ('personal', 'business');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.profile_status as enum ('active', 'restricted', 'banned', 'pending');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.admin_role as enum ('super_admin', 'admin', 'editor', 'moderator', 'support');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.permission_effect as enum ('allow', 'deny');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.image_source_type as enum ('storage', 'external');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.feedback_status as enum ('open', 'in_review', 'resolved', 'closed');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.report_status as enum ('open', 'in_review', 'resolved', 'rejected');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.feature_visibility as enum ('public', 'admin_only', 'beta', 'hidden');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.consent_type as enum ('terms', 'privacy', 'community_guidelines');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.deletion_status as enum ('pending', 'processing', 'completed', 'cancelled', 'rejected');
exception when duplicate_object then null;
end $$;

create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  state_code text not null,
  country_code text not null default 'US',
  timezone text not null default 'America/New_York',
  is_default boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists cities_one_default_idx
  on public.cities (is_default)
  where is_default = true;

create index if not exists cities_active_sort_idx
  on public.cities (is_active, sort_order, name);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  description text,
  is_public boolean not null default false,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rate_limits (
  id uuid primary key default gen_random_uuid(),
  scope text not null,
  key text not null,
  action text not null,
  actor_id uuid references auth.users(id) on delete cascade,
  ip_hash text,
  window_start timestamptz not null,
  window_seconds integer not null,
  request_count integer not null default 0,
  blocked_until timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (scope, key, action, window_start)
);

create index if not exists rate_limits_actor_action_idx
  on public.rate_limits (actor_id, action, window_start desc);

create table if not exists public.search_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  visitor_id text,
  query text not null,
  filters jsonb not null default '{}'::jsonb,
  result_count integer,
  source text,
  created_at timestamptz not null default now()
);

create index if not exists search_logs_user_created_idx
  on public.search_logs (user_id, created_at desc);

create index if not exists search_logs_query_created_idx
  on public.search_logs (query, created_at desc);

alter table public.cities enable row level security;
alter table public.site_settings enable row level security;
alter table public.rate_limits enable row level security;
alter table public.search_logs enable row level security;

create policy "Public can read active cities"
  on public.cities
  for select
  using (is_active = true);

create policy "Public can read public site settings"
  on public.site_settings
  for select
  using (is_public = true);

create policy "Users can insert own search logs"
  on public.search_logs
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can read own search logs"
  on public.search_logs
  for select
  to authenticated
  using (auth.uid() = user_id);
