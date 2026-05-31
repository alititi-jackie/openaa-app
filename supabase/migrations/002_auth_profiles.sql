create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email citext,
  email_verified boolean not null default false,
  nickname text,
  avatar_url text,
  phone text,
  phone_verified boolean not null default false,
  wechat_id text,
  wechat_verified boolean not null default false,
  whatsapp text,
  preferred_contact_method text,
  bio text,
  city_id uuid references public.cities(id) on delete set null,
  location_area text,
  language_preference text not null default 'zh-CN',
  timezone text not null default 'America/New_York',
  account_type public.account_type not null default 'personal',
  status public.profile_status not null default 'active',
  trust_level integer not null default 0,
  is_verified_user boolean not null default false,
  contact_privacy_setting jsonb not null default '{}'::jsonb,
  public_metadata jsonb not null default '{}'::jsonb,
  private_metadata jsonb not null default '{}'::jsonb,
  last_login_at timestamptz,
  last_active_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_city_status_idx
  on public.profiles (city_id, status);

create index if not exists profiles_account_status_idx
  on public.profiles (account_type, status);

create table if not exists public.business_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  business_name text not null,
  business_category text,
  business_profile text,
  website_url text,
  public_phone text,
  public_email citext,
  public_wechat text,
  service_area text,
  city_id uuid references public.cities(id) on delete set null,
  is_public boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists business_profiles_city_active_idx
  on public.business_profiles (city_id, is_active, business_category);

create table if not exists public.user_auth_identities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  provider_user_id text,
  email citext,
  phone text,
  wechat_openid text,
  wechat_unionid text,
  wechat_nickname text,
  wechat_avatar text,
  provider_metadata jsonb not null default '{}'::jsonb,
  is_primary boolean not null default false,
  verified_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_user_id)
);

create index if not exists user_auth_identities_user_idx
  on public.user_auth_identities (user_id, provider);

create index if not exists user_auth_identities_wechat_union_idx
  on public.user_auth_identities (wechat_unionid)
  where wechat_unionid is not null;

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  language_preference text not null default 'zh-CN',
  timezone text not null default 'America/New_York',
  notification_preferences jsonb not null default '{}'::jsonb,
  privacy_settings jsonb not null default '{}'::jsonb,
  app_settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_user_id uuid not null references auth.users(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_user_id)
);

create table if not exists public.user_security_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  ip_hash text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists user_security_logs_user_created_idx
  on public.user_security_logs (user_id, created_at desc);

create or replace function public.is_profile_publicly_allowed(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = p_user_id
      and p.status in ('active', 'restricted', 'pending')
  );
$$;

create or replace function public.can_user_publish(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = p_user_id
      and p.status = 'active'
  );
$$;

alter table public.profiles enable row level security;
alter table public.business_profiles enable row level security;
alter table public.user_auth_identities enable row level security;
alter table public.user_settings enable row level security;
alter table public.user_blocks enable row level security;
alter table public.user_security_logs enable row level security;

create policy "Users can insert own profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users can read own profile"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Public can read active public business profiles"
  on public.business_profiles
  for select
  using (is_public = true and is_active = true);

create policy "Users can manage own business profile"
  on public.business_profiles
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can read own auth identities"
  on public.user_auth_identities
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can read own settings"
  on public.user_settings
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can manage own settings"
  on public.user_settings
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage own blocks"
  on public.user_blocks
  for all
  to authenticated
  using (auth.uid() = blocker_id)
  with check (auth.uid() = blocker_id);

create policy "Users can read own security logs"
  on public.user_security_logs
  for select
  to authenticated
  using (auth.uid() = user_id);
