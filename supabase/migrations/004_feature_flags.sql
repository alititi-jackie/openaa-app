create table if not exists public.feature_flags (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  module text not null,
  is_enabled boolean not null default false,
  visibility public.feature_visibility not null default 'hidden',
  city_id uuid references public.cities(id) on delete cascade,
  allowed_roles text[],
  allowed_account_types text[],
  config jsonb not null default '{}'::jsonb,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists feature_flags_module_idx
  on public.feature_flags (module, is_enabled, visibility);

create index if not exists feature_flags_city_idx
  on public.feature_flags (city_id, key);

alter table public.feature_flags enable row level security;

create policy "Public can read enabled public feature flags"
  on public.feature_flags
  for select
  using (
    is_enabled = true
    and visibility in ('public', 'beta')
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
  );

create policy "Admins can read feature flags"
  on public.feature_flags
  for select
  to authenticated
  using (public.has_admin_permission('manage_settings'));

create policy "Admins can manage feature flags"
  on public.feature_flags
  for all
  to authenticated
  using (public.has_admin_permission('manage_settings'))
  with check (public.has_admin_permission('manage_settings'));
