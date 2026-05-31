create table if not exists public.news_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.news_posts (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.news_categories(id) on delete set null,
  author_id uuid references auth.users(id) on delete set null,
  title text not null,
  slug text not null unique,
  excerpt text,
  body text,
  cover_image_asset_id uuid references public.image_assets(id) on delete set null,
  status public.post_status not null default 'draft',
  is_featured boolean not null default false,
  is_pinned boolean not null default false,
  published_at timestamptz,
  seo_title text,
  seo_description text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists news_posts_public_idx
  on public.news_posts (published_at desc)
  where status = 'published';

create table if not exists public.navigation_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  icon text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.navigation_links (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.navigation_categories(id) on delete set null,
  title text not null,
  description text,
  url text not null,
  icon_image_asset_id uuid references public.image_assets(id) on delete set null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists navigation_links_category_sort_idx
  on public.navigation_links (category_id, is_active, sort_order);

create table if not exists public.user_navigation_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  url text not null,
  icon text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_navigation_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.home_banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  href text,
  image_asset_id uuid references public.image_assets(id) on delete set null,
  city_id uuid references public.cities(id) on delete set null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.home_sections (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  title text not null,
  description text,
  module text not null,
  config jsonb not null default '{}'::jsonb,
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.top_quick_links (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  title text not null,
  href text not null,
  icon text,
  image_asset_id uuid references public.image_assets(id) on delete set null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.latest_ticker (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  href text,
  module text,
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ads (
  id uuid primary key default gen_random_uuid(),
  placement text not null,
  title text not null,
  href text,
  image_asset_id uuid references public.image_assets(id) on delete set null,
  city_id uuid references public.cities(id) on delete set null,
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ads_placement_active_idx
  on public.ads (placement, is_active, sort_order);

create table if not exists public.business_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_profile_id uuid references public.business_profiles(id) on delete cascade,
  status public.report_status not null default 'open',
  submitted_data jsonb not null default '{}'::jsonb,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_profile_id uuid references public.business_profiles(id) on delete set null,
  service_post_id uuid references public.posts(id) on delete set null,
  status text not null default 'requested' check (status in ('requested', 'confirmed', 'cancelled', 'completed')),
  scheduled_at timestamptz,
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  business_profile_id uuid references public.business_profiles(id) on delete cascade,
  title text not null,
  description text,
  code text,
  status text not null default 'hidden' check (status in ('active', 'hidden', 'expired', 'deleted')),
  starts_at timestamptz,
  ends_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.news_categories enable row level security;
alter table public.news_posts enable row level security;
alter table public.navigation_categories enable row level security;
alter table public.navigation_links enable row level security;
alter table public.user_navigation_links enable row level security;
alter table public.user_navigation_settings enable row level security;
alter table public.home_banners enable row level security;
alter table public.home_sections enable row level security;
alter table public.top_quick_links enable row level security;
alter table public.latest_ticker enable row level security;
alter table public.ads enable row level security;
alter table public.business_verifications enable row level security;
alter table public.appointments enable row level security;
alter table public.coupons enable row level security;

create policy "Public can read active news categories"
  on public.news_categories
  for select
  using (is_active = true);

create policy "Admins can manage news categories"
  on public.news_categories
  for all
  to authenticated
  using (public.has_admin_permission('manage_news_categories'))
  with check (public.has_admin_permission('manage_news_categories'));

create policy "Public can read published news"
  on public.news_posts
  for select
  using (status = 'published' and (published_at is null or published_at <= now()));

create policy "Admins and editors can manage news"
  on public.news_posts
  for all
  to authenticated
  using (
    public.has_admin_permission('view_news')
    or public.has_admin_permission('create_news')
    or public.has_admin_permission('edit_news')
    or public.has_admin_permission('publish_news')
  )
  with check (
    public.has_admin_permission('create_news')
    or public.has_admin_permission('edit_news')
    or public.has_admin_permission('publish_news')
  );

create policy "Public can read active navigation categories"
  on public.navigation_categories
  for select
  using (is_active = true);

create policy "Public can read active navigation links"
  on public.navigation_links
  for select
  using (is_active = true);

create policy "Admins can manage navigation"
  on public.navigation_categories
  for all
  to authenticated
  using (public.has_admin_permission('manage_navigation'))
  with check (public.has_admin_permission('manage_navigation'));

create policy "Admins can manage navigation links"
  on public.navigation_links
  for all
  to authenticated
  using (public.has_admin_permission('manage_navigation'))
  with check (public.has_admin_permission('manage_navigation'));

create policy "Users can manage own navigation links"
  on public.user_navigation_links
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage own navigation settings"
  on public.user_navigation_settings
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Public can read active home banners"
  on public.home_banners
  for select
  using (
    is_active = true
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
  );

create policy "Public can read visible home sections"
  on public.home_sections
  for select
  using (is_visible = true);

create policy "Public can read active top quick links"
  on public.top_quick_links
  for select
  using (is_active = true);

create policy "Public can read enabled latest ticker"
  on public.latest_ticker
  for select
  using (
    is_enabled = true
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
  );

create policy "Public can read active ads"
  on public.ads
  for select
  using (
    is_active = true
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
  );

create policy "Admins can manage home and ads"
  on public.home_banners
  for all
  to authenticated
  using (public.has_admin_permission('manage_home_sections'))
  with check (public.has_admin_permission('manage_home_sections'));

create policy "Admins can manage home sections"
  on public.home_sections
  for all
  to authenticated
  using (public.has_admin_permission('manage_home_sections'))
  with check (public.has_admin_permission('manage_home_sections'));

create policy "Admins can manage top quick links"
  on public.top_quick_links
  for all
  to authenticated
  using (public.has_admin_permission('manage_top_links'))
  with check (public.has_admin_permission('manage_top_links'));

create policy "Admins can manage latest ticker"
  on public.latest_ticker
  for all
  to authenticated
  using (public.has_admin_permission('manage_latest_ticker'))
  with check (public.has_admin_permission('manage_latest_ticker'));

create policy "Admins can manage ads"
  on public.ads
  for all
  to authenticated
  using (public.has_admin_permission('manage_ads'))
  with check (public.has_admin_permission('manage_ads'));

create policy "Users can submit own business verification"
  on public.business_verifications
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can read own business verification"
  on public.business_verifications
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Admins can manage business verification"
  on public.business_verifications
  for all
  to authenticated
  using (public.has_admin_permission('manage_settings'))
  with check (public.has_admin_permission('manage_settings'));

create policy "Users can manage own appointments"
  on public.appointments
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Admins can manage appointments"
  on public.appointments
  for all
  to authenticated
  using (public.has_admin_permission('manage_settings'))
  with check (public.has_admin_permission('manage_settings'));

create policy "Admins can manage coupons"
  on public.coupons
  for all
  to authenticated
  using (public.has_admin_permission('manage_settings'))
  with check (public.has_admin_permission('manage_settings'));
