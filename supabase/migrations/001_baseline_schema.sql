-- OpenAA production baseline schema.
-- This project has no production data yet. Apply this baseline only after
-- resetting the target Supabase database, not on top of the old test stack.

create extension if not exists pgcrypto;

do $$ begin create type public.post_type as enum ('job', 'housing', 'marketplace', 'service'); exception when duplicate_object then null; end $$;
do $$ begin create type public.post_status as enum ('draft', 'pending_review', 'published', 'hidden', 'rejected', 'expired', 'deleted'); exception when duplicate_object then null; end $$;
do $$ begin create type public.post_visibility as enum ('public', 'private'); exception when duplicate_object then null; end $$;
do $$ begin create type public.account_type as enum ('personal', 'business'); exception when duplicate_object then null; end $$;
do $$ begin create type public.profile_status as enum ('active', 'restricted', 'banned', 'pending'); exception when duplicate_object then null; end $$;
do $$ begin create type public.admin_role as enum ('super_admin', 'admin', 'editor', 'moderator', 'support'); exception when duplicate_object then null; end $$;
do $$ begin create type public.permission_effect as enum ('allow', 'deny'); exception when duplicate_object then null; end $$;
do $$ begin create type public.image_source_type as enum ('storage', 'external'); exception when duplicate_object then null; end $$;
do $$ begin create type public.feature_visibility as enum ('public', 'admin_only', 'beta', 'hidden'); exception when duplicate_object then null; end $$;
do $$ begin create type public.consent_type as enum ('terms', 'privacy', 'community_guidelines'); exception when duplicate_object then null; end $$;
do $$ begin create type public.deletion_status as enum ('pending', 'processing', 'completed', 'cancelled', 'rejected'); exception when duplicate_object then null; end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.cities (
  id text primary key,
  slug text not null unique,
  name text not null,
  state_code text not null,
  timezone text not null default 'America/New_York',
  is_default boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index cities_one_default_idx on public.cities ((is_default)) where is_default = true;
create index cities_active_sort_idx on public.cities (is_active, sort_order);

create table public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  is_public boolean not null default false,
  description text,
  updated_at timestamptz not null default now()
);

create table public.rate_limits (
  id uuid primary key default gen_random_uuid(),
  actor_id text not null,
  action text not null,
  window_start timestamptz not null,
  count integer not null default 1,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (actor_id, action, window_start)
);
create index rate_limits_actor_action_idx on public.rate_limits (actor_id, action, window_start desc);

create table public.search_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  query text not null,
  source text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index search_logs_user_created_idx on public.search_logs (user_id, created_at desc);
create index search_logs_query_created_idx on public.search_logs (query, created_at desc);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  email_verified boolean not null default false,
  last_login_at timestamptz,
  last_active_at timestamptz,
  nickname text,
  avatar_url text,
  phone text,
  wechat_id text,
  whatsapp text,
  preferred_contact_method text,
  default_publish_contact_name text,
  publish_email_mode text default 'hidden' check (publish_email_mode in ('hidden', 'account', 'custom')),
  publish_email text,
  bio text,
  location_area text,
  city_id text references public.cities(id),
  account_type public.account_type not null default 'personal',
  status public.profile_status not null default 'active',
  public_metadata jsonb not null default '{}'::jsonb,
  private_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_city_status_idx on public.profiles (city_id, status);
create index profiles_account_status_idx on public.profiles (account_type, status);

create or replace function public.handle_new_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    email_verified,
    nickname,
    avatar_url,
    last_login_at,
    last_active_at
  )
  values (
    new.id,
    new.email,
    new.email_confirmed_at is not null,
    nullif(left(coalesce(new.raw_user_meta_data->>'nickname', new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, ''), '@', 1)), 80), ''),
    nullif(new.raw_user_meta_data->>'avatar_url', ''),
    coalesce(new.last_sign_in_at, now()),
    coalesce(new.last_sign_in_at, now())
  )
  on conflict (id) do update set
    email = excluded.email,
    email_verified = excluded.email_verified,
    nickname = coalesce(public.profiles.nickname, excluded.nickname),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
    last_login_at = coalesce(excluded.last_login_at, public.profiles.last_login_at),
    last_active_at = coalesce(excluded.last_active_at, public.profiles.last_active_at),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.handle_new_auth_user_profile();

create table public.business_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  business_name text not null,
  business_category text,
  business_profile text,
  website_url text,
  public_phone text,
  public_email text,
  public_wechat text,
  service_area text,
  city_id text references public.cities(id),
  is_public boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index business_profiles_city_active_idx on public.business_profiles (city_id, is_active, is_public);

create table public.user_auth_identities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null,
  provider_user_id text,
  provider_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_user_id)
);
create index user_auth_identities_user_idx on public.user_auth_identities (user_id);

create table public.user_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.user_blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

create table public.user_security_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  action text not null,
  ip_address text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index user_security_logs_user_created_idx on public.user_security_logs (user_id, created_at desc);

create table public.admin_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.admin_role not null,
  is_active boolean not null default true,
  note text,
  granted_by uuid references public.profiles(id) on delete set null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  last_admin_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);
create index admin_roles_active_role_idx on public.admin_roles (is_active, role);

create table public.admin_permissions (
  permission_key text primary key,
  name text not null,
  description text,
  category text not null,
  created_at timestamptz not null default now()
);

create table public.admin_role_permissions (
  role public.admin_role not null,
  permission_key text not null references public.admin_permissions(permission_key) on delete cascade,
  allowed boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (role, permission_key)
);

create table public.admin_user_permissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  permission_key text not null references public.admin_permissions(permission_key) on delete cascade,
  effect public.permission_effect not null,
  reason text,
  granted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, permission_key)
);

create table public.admin_user_modules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  module_key text not null,
  is_allowed boolean not null default true,
  granted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, module_key)
);

create table public.admin_user_exemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  exemption_key text not null,
  is_enabled boolean not null default true,
  reason text,
  granted_by uuid references public.profiles(id) on delete set null,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, exemption_key)
);

create table public.admin_module_permissions (
  module_key text not null,
  permission_key text not null references public.admin_permissions(permission_key) on delete cascade,
  primary key (module_key, permission_key)
);

create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index admin_audit_logs_actor_created_idx on public.admin_audit_logs (actor_id, created_at desc);
create index admin_audit_logs_entity_idx on public.admin_audit_logs (entity_type, entity_id);

create table public.feature_flags (
  key text primary key,
  name text not null,
  description text,
  module text not null,
  is_enabled boolean not null default false,
  visibility public.feature_visibility not null default 'hidden',
  allowed_roles text[],
  city_id text references public.cities(id),
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create index feature_flags_module_idx on public.feature_flags (module, is_enabled);
create index feature_flags_city_idx on public.feature_flags (city_id);

create table public.image_assets (
  id uuid primary key default gen_random_uuid(),
  bucket text,
  storage_path text,
  path text,
  public_url text,
  external_url text,
  external_host text,
  source_type public.image_source_type not null default 'storage',
  entity_type text,
  entity_id text,
  owner_id uuid references public.profiles(id) on delete set null,
  mime_type text,
  size_bytes bigint,
  width integer,
  height integer,
  status text not null default 'active' check (status in ('active', 'deleted', 'failed')),
  is_public boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index image_assets_entity_idx on public.image_assets (entity_type, entity_id);
create index image_assets_owner_idx on public.image_assets (owner_id, created_at desc);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  post_type public.post_type not null,
  author_id uuid references public.profiles(id) on delete set null,
  city_id text references public.cities(id),
  title text not null,
  summary text,
  body text,
  category text,
  subcategory text,
  status public.post_status not null default 'draft',
  visibility public.post_visibility not null default 'public',
  price_amount numeric,
  currency text default 'USD',
  metadata jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  expires_at timestamptz,
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null,
  deleted_source text,
  deletion_error text,
  deletion_error_at timestamptz,
  last_admin_action text,
  last_admin_action_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index posts_public_idx on public.posts (post_type, status, visibility, city_id, published_at desc);
create index posts_author_status_idx on public.posts (author_id, status, updated_at desc);
create index posts_deleted_idx on public.posts (deleted_at desc) where status = 'deleted' or deleted_at is not null;

create table public.post_details_jobs (
  post_id uuid primary key references public.posts(id) on delete cascade,
  employment_type text,
  wage_min numeric,
  wage_max numeric,
  wage_unit text,
  job_category text,
  work_area text,
  experience_requirement text,
  language_requirement text,
  includes_meals boolean,
  includes_housing boolean,
  requires_work_authorization boolean,
  employer_type text
);

create table public.post_details_housing (
  post_id uuid primary key references public.posts(id) on delete cascade,
  listing_type text,
  housing_type text,
  rent_amount numeric,
  deposit_amount numeric,
  available_date date,
  lease_term text,
  pets_allowed boolean,
  utilities_included boolean,
  transit_nearby text,
  address_area text
);

create table public.post_details_marketplace (
  post_id uuid primary key references public.posts(id) on delete cascade,
  listing_type text,
  item_category text,
  condition text,
  price_amount numeric,
  negotiable boolean,
  trade_area text,
  delivery_options text[],
  sold_at timestamptz
);

create table public.post_details_services (
  post_id uuid primary key references public.posts(id) on delete cascade,
  service_category text,
  service_area text,
  business_hours jsonb,
  price_range text,
  service_status text
);

create table public.post_contacts (
  post_id uuid primary key references public.posts(id) on delete cascade,
  contact_name text,
  phone text,
  wechat text,
  email text,
  preferred_contact_method text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.post_stats (
  post_id uuid primary key references public.posts(id) on delete cascade,
  view_count integer not null default 0,
  favorite_count integer not null default 0,
  report_count integer not null default 0,
  updated_at timestamptz not null default now()
);

create table public.post_views (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  visitor_id text,
  created_at timestamptz not null default now()
);
create index post_views_post_created_idx on public.post_views (post_id, created_at desc);
create index post_views_user_created_idx on public.post_views (user_id, created_at desc);

create table public.post_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  reporter_id uuid references public.profiles(id) on delete set null,
  visitor_id text,
  reason text not null,
  detail text not null,
  contact_info text,
  related_url text,
  status text not null default 'open' check (status in ('open', 'in_review', 'resolved', 'rejected')),
  admin_reason text,
  admin_message_editable text,
  admin_message_fixed text,
  post_action text check (post_action is null or post_action in ('none', 'hide', 'delete')),
  handled_by uuid references public.profiles(id) on delete set null,
  handled_at timestamptz,
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index post_reports_open_reporter_post_uidx on public.post_reports (reporter_id, post_id) where reporter_id is not null and deleted_at is null and status in ('open', 'in_review');
create unique index post_reports_open_visitor_post_uidx on public.post_reports (visitor_id, post_id) where visitor_id is not null and deleted_at is null and status in ('open', 'in_review');
create index post_reports_post_status_created_idx on public.post_reports (post_id, status, created_at desc);
create index post_reports_deleted_created_idx on public.post_reports (deleted_at desc) where deleted_at is not null;

create table public.post_admin_events (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  before_data jsonb,
  after_data jsonb,
  note text,
  created_at timestamptz not null default now()
);
create index post_admin_events_post_id_created_at_idx on public.post_admin_events (post_id, created_at desc);

create table public.post_images (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  image_asset_id uuid references public.image_assets(id) on delete set null,
  sort_order integer not null default 0,
  is_cover boolean not null default false,
  caption text,
  created_at timestamptz not null default now()
);
create index post_images_post_sort_idx on public.post_images (post_id, sort_order);

create table public.user_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null,
  target_id text not null,
  target_url text not null,
  title text not null,
  category text,
  created_at timestamptz not null default now(),
  constraint user_favorites_target_type_check check (length(btrim(target_type)) between 1 and 80),
  constraint user_favorites_target_id_check check (length(btrim(target_id)) between 1 and 200),
  constraint user_favorites_target_url_check check ((target_url like '/%' and target_url not like '//%') or target_url like 'https://%'),
  constraint user_favorites_title_check check (length(btrim(title)) between 1 and 300),
  unique (user_id, target_type, target_id)
);
create index user_favorites_user_created_idx on public.user_favorites (user_id, created_at desc);
create index user_favorites_user_type_created_idx on public.user_favorites (user_id, target_type, created_at desc);

create table public.news_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.news_posts (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.news_categories(id) on delete set null,
  author_id uuid references public.profiles(id) on delete set null,
  title text not null,
  slug text not null unique,
  excerpt text,
  body text not null,
  cover_image_asset_id uuid references public.image_assets(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'published', 'hidden', 'deleted')),
  is_featured boolean not null default false,
  is_pinned boolean not null default false,
  pinned_order integer not null default 0,
  pinned_until timestamptz,
  published_at timestamptz,
  seo_title text,
  seo_description text,
  metadata jsonb not null default '{}'::jsonb,
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null,
  deletion_error text,
  deletion_error_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index news_posts_public_idx on public.news_posts (status, published_at desc);
create index news_posts_admin_display_idx on public.news_posts (status, is_pinned desc, pinned_order, updated_at desc);
create index news_posts_deleted_idx on public.news_posts (deleted_at desc) where deleted_at is not null;

create table public.navigation_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  icon text,
  display_limit integer,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.navigation_links (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.navigation_categories(id) on delete set null,
  title text not null,
  description text,
  url text not null,
  icon text,
  icon_image_asset_id uuid references public.image_assets(id) on delete set null,
  image_url text,
  open_mode text not null default 'auto' check (open_mode in ('auto', 'same', 'new')),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index navigation_links_active_featured_sort_idx on public.navigation_links (is_active, is_featured, sort_order);
create index navigation_links_deleted_idx on public.navigation_links (deleted_at desc) where deleted_at is not null;

create table public.user_navigation_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  url text not null,
  icon text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index user_navigation_links_user_active_sort_idx on public.user_navigation_links (user_id, is_active, sort_order);

create table public.user_navigation_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.home_sections (
  key text primary key,
  title text not null,
  description text,
  module text not null,
  config jsonb not null default '{}'::jsonb,
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create table public.home_banners (
  id uuid primary key default gen_random_uuid(),
  city_id text references public.cities(id),
  title text not null,
  subtitle text,
  href text,
  open_mode text not null default 'same' check (open_mode in ('same', 'new')),
  image_asset_id uuid references public.image_assets(id) on delete set null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.top_quick_links (
  id uuid primary key default gen_random_uuid(),
  key text unique,
  city_id text references public.cities(id),
  title text not null,
  href text not null,
  icon text,
  image_asset_id uuid references public.image_assets(id) on delete set null,
  open_mode text not null default 'same' check (open_mode in ('same', 'new')),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index top_quick_links_city_active_sort_idx on public.top_quick_links (city_id, is_active, sort_order);

create table public.latest_ticker (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  href text not null,
  module text not null,
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.latest_ticker_global_settings (
  id integer primary key default 1 check (id = 1),
  is_enabled boolean not null default true,
  interval_seconds integer not null default 5
);

create table public.latest_ticker_sections (
  section_key text primary key,
  section_name text not null,
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  display_count integer not null default 3
);

create table public.ads (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  placement text not null,
  href text,
  open_mode text not null default 'external_new' check (open_mode in ('internal', 'external_new', 'external_same', 'same', 'new')),
  link_type text not null default 'external' check (link_type in ('external', 'internal')),
  external_url text,
  slug text,
  image_asset_id uuid references public.image_assets(id) on delete set null,
  content text,
  contact_name text,
  phone text,
  wechat text,
  address text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index ads_internal_slug_unique on public.ads (slug) where slug is not null;
create index ads_placement_deleted_active_sort_idx on public.ads (placement, deleted_at, is_active, sort_order);

create table public.dmv_questions (
  id uuid primary key default gen_random_uuid(),
  state text not null default 'NY',
  language text not null default 'zh-CN',
  source_version text,
  source_question_id text,
  category text not null,
  question_text text not null,
  options jsonb not null,
  correct_answer text not null,
  explanation text,
  difficulty text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index dmv_questions_source_uidx on public.dmv_questions (state, language, source_version, source_question_id) where source_version is not null and source_question_id is not null;
create index dmv_questions_active_state_language_category_idx on public.dmv_questions (is_active, state, language, category, sort_order);

create table public.dmv_user_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_id uuid not null references public.dmv_questions(id) on delete cascade,
  is_correct boolean,
  answered_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

create table public.dmv_wrong_questions (
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_id uuid not null references public.dmv_questions(id) on delete cascade,
  wrong_count integer not null default 1,
  last_wrong_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

create table public.dmv_exam_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  score integer not null,
  total integer not null,
  passed boolean not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.dmv_question_imports (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  imported_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  type text,
  action_url text,
  target_type text,
  target_id text,
  is_read boolean not null default false,
  read_at timestamptz,
  deleted_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index notifications_user_deleted_read_created_idx on public.notifications (user_id, deleted_at, is_read, created_at desc);
create index notifications_target_idx on public.notifications (target_type, target_id);

create table public.notification_templates (
  key text primary key,
  title text not null,
  body text not null,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_no text unique,
  user_id uuid references public.profiles(id) on delete set null,
  visitor_id text,
  type text not null check (type in ('business', 'news_tip', 'feature_suggestion', 'other', 'admin_reply')),
  source text not null default 'feedback_page',
  target_type text,
  target_id text,
  related_url text,
  contact_info text,
  content text not null,
  status text not null default 'new' check (status in ('new', 'viewed', 'deleted')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  admin_reply text,
  admin_note text,
  handled_by uuid references public.profiles(id) on delete set null,
  handled_at timestamptz,
  closed_at timestamptz,
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint support_tickets_actor_check check (user_id is not null or (visitor_id is not null and length(btrim(visitor_id)) > 0)),
  constraint support_tickets_content_check check (length(btrim(content)) > 0)
);
create index support_tickets_status_created_idx on public.support_tickets (status, created_at desc) where deleted_at is null;
create index support_tickets_type_created_idx on public.support_tickets (type, created_at desc) where deleted_at is null;
create index support_tickets_deleted_created_idx on public.support_tickets (deleted_at desc) where deleted_at is not null;
create index support_tickets_user_created_idx on public.support_tickets (user_id, created_at desc);
create index support_tickets_visitor_created_idx on public.support_tickets (visitor_id, created_at desc);

create table public.support_ticket_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

create table public.support_ticket_events (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);
create index support_ticket_events_ticket_created_idx on public.support_ticket_events (ticket_id, created_at desc);

create table public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  consent_type public.consent_type not null,
  version text not null,
  accepted_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);
create index user_consents_user_created_idx on public.user_consents (user_id, accepted_at desc);

create table public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status public.deletion_status not null default 'pending',
  reason text,
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);
create index account_deletion_requests_status_created_idx on public.account_deletion_requests (status, requested_at desc);

create or replace function public.refresh_post_stats(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.post_stats (
    post_id,
    view_count,
    favorite_count,
    report_count,
    updated_at
  )
  values (
    p_post_id,
    (select count(*)::integer from public.post_views where post_id = p_post_id),
    (
      select count(*)::integer
      from public.user_favorites
      where target_type in ('job', 'housing', 'marketplace', 'service', 'post')
        and target_id = p_post_id::text
    ),
    (
      select count(*)::integer
      from public.post_reports
      where post_id = p_post_id
        and deleted_at is null
    ),
    now()
  )
  on conflict (post_id)
  do update set
    view_count = excluded.view_count,
    favorite_count = excluded.favorite_count,
    report_count = excluded.report_count,
    updated_at = now();
end;
$$;

create or replace function public.refresh_post_stats_from_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_post_id uuid;
begin
  if tg_table_name = 'user_favorites' then
    if coalesce(new.target_type, old.target_type) not in ('job', 'housing', 'marketplace', 'service', 'post') then
      return coalesce(new, old);
    end if;

    if coalesce(new.target_id, old.target_id) !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      return coalesce(new, old);
    end if;

    target_post_id := coalesce(new.target_id, old.target_id)::uuid;
  else
    target_post_id := coalesce(new.post_id, old.post_id);
  end if;

  if target_post_id is not null then
    perform public.refresh_post_stats(target_post_id);
  end if;

  return coalesce(new, old);
end;
$$;

create or replace function public.record_post_view(
  p_post_id uuid,
  p_visitor_id text default null,
  p_user_agent text default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  viewer_id uuid;
  safe_visitor_id text;
  actor_key text;
  next_view_count integer;
begin
  if not public.is_public_post(p_post_id) then
    raise exception 'post is not public' using errcode = '42501';
  end if;

  viewer_id := auth.uid();
  safe_visitor_id := nullif(left(btrim(coalesce(p_visitor_id, '')), 80), '');

  if viewer_id is null and safe_visitor_id is null then
    raise exception 'missing view actor' using errcode = '23514';
  end if;

  actor_key := coalesce(viewer_id::text, safe_visitor_id);
  perform pg_advisory_xact_lock(hashtext(p_post_id::text), hashtext(actor_key));

  if exists (
    select 1
    from public.post_views pv
    where pv.post_id = p_post_id
      and pv.created_at >= now() - interval '30 minutes'
      and (
        (viewer_id is not null and pv.user_id = viewer_id)
        or (viewer_id is null and pv.visitor_id = safe_visitor_id)
      )
  ) then
    perform public.refresh_post_stats(p_post_id);

    select ps.view_count
    into next_view_count
    from public.post_stats ps
    where ps.post_id = p_post_id;

    return coalesce(next_view_count, 0);
  end if;

  insert into public.post_views (
    post_id,
    user_id,
    visitor_id,
    user_agent
  )
  values (
    p_post_id,
    viewer_id,
    case when viewer_id is null then safe_visitor_id else null end,
    nullif(left(coalesce(p_user_agent, ''), 500), '')
  );

  perform public.refresh_post_stats(p_post_id);

  select ps.view_count
  into next_view_count
  from public.post_stats ps
  where ps.post_id = p_post_id;

  return coalesce(next_view_count, 0);
end;
$$;

create or replace function public.set_support_ticket_no()
returns trigger
language plpgsql
as $$
begin
  if new.ticket_no is null then
    new.ticket_no = 'T' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(new.id::text, 1, 8));
  end if;
  return new;
end;
$$;

create trigger trg_support_tickets_set_ticket_no
before insert on public.support_tickets
for each row execute function public.set_support_ticket_no();

create trigger refresh_post_stats_after_view
after insert or delete on public.post_views
for each row execute function public.refresh_post_stats_from_row();

create trigger refresh_post_stats_after_report
after insert or update or delete on public.post_reports
for each row execute function public.refresh_post_stats_from_row();

create trigger refresh_post_stats_after_favorite
after insert or delete on public.user_favorites
for each row execute function public.refresh_post_stats_from_row();

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'cities','profiles','business_profiles','admin_roles','admin_user_permissions','admin_user_modules',
    'feature_flags','image_assets','posts','post_contacts','post_reports','news_categories','news_posts',
    'navigation_categories','navigation_links','user_navigation_links','home_banners','top_quick_links',
    'latest_ticker','ads','dmv_questions','notifications','support_tickets','support_ticket_settings'
  ]
  loop
    execute format('drop trigger if exists trg_%s_updated_at on public.%I', table_name, table_name);
    execute format('create trigger trg_%s_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name);
  end loop;
end $$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp']),
  ('post-images', 'post-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('news-cover-images', 'news-cover-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('home-banner-images', 'home-banner-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('ad-images', 'ad-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
