create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  post_type public.post_type not null,
  city_id uuid references public.cities(id) on delete set null,
  author_id uuid references auth.users(id) on delete set null,
  title text not null,
  slug text unique,
  summary text,
  body text,
  category text,
  subcategory text,
  status public.post_status not null default 'draft',
  visibility public.post_visibility not null default 'public',
  price_amount numeric(12, 2),
  currency text not null default 'USD',
  metadata jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  expires_at timestamptz,
  hidden_at timestamptz,
  rejected_at timestamptz,
  deleted_at timestamptz,
  moderation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_public_feed_idx
  on public.posts (post_type, city_id, published_at desc)
  where status = 'published' and visibility = 'public';

create index if not exists posts_author_status_idx
  on public.posts (author_id, status, updated_at desc);

create index if not exists posts_status_created_idx
  on public.posts (status, created_at desc);

create table if not exists public.post_details_jobs (
  post_id uuid primary key references public.posts(id) on delete cascade,
  employment_type text,
  wage_min numeric(12, 2),
  wage_max numeric(12, 2),
  wage_unit text,
  job_category text,
  work_area text,
  experience_requirement text,
  language_requirement text,
  includes_meals boolean,
  includes_housing boolean,
  requires_work_authorization boolean,
  employer_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.post_details_housing (
  post_id uuid primary key references public.posts(id) on delete cascade,
  listing_type text,
  housing_type text,
  rent_amount numeric(12, 2),
  deposit_amount numeric(12, 2),
  available_date date,
  lease_term text,
  pets_allowed boolean,
  utilities_included boolean,
  transit_nearby text,
  address_area text,
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.post_details_marketplace (
  post_id uuid primary key references public.posts(id) on delete cascade,
  listing_type text,
  item_category text,
  condition text,
  price_amount numeric(12, 2),
  negotiable boolean not null default false,
  trade_area text,
  delivery_options text[],
  sold_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.post_details_services (
  post_id uuid primary key references public.posts(id) on delete cascade,
  service_category text,
  service_area text,
  business_hours jsonb not null default '{}'::jsonb,
  price_range text,
  business_profile_id uuid references public.business_profiles(id) on delete set null,
  service_status text not null default 'active',
  booking_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.post_contacts (
  post_id uuid primary key references public.posts(id) on delete cascade,
  contact_name text,
  phone text,
  email citext,
  wechat text,
  whatsapp text,
  preferred_contact_method text,
  privacy jsonb not null default '{}'::jsonb,
  reveal_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.post_stats (
  post_id uuid primary key references public.posts(id) on delete cascade,
  view_count integer not null default 0,
  contact_view_count integer not null default 0,
  share_count integer not null default 0,
  favorite_count integer not null default 0,
  report_count integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.post_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, post_id)
);

create index if not exists post_favorites_user_created_idx
  on public.post_favorites (user_id, created_at desc);

create table if not exists public.post_views (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  visitor_id text,
  ip_hash text,
  user_agent text,
  referrer text,
  created_at timestamptz not null default now(),
  constraint post_views_actor_check check (user_id is not null or visitor_id is not null)
);

create index if not exists post_views_post_created_idx
  on public.post_views (post_id, created_at desc);

create index if not exists post_views_user_created_idx
  on public.post_views (user_id, created_at desc);

create table if not exists public.post_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  reporter_id uuid references auth.users(id) on delete set null,
  visitor_id text,
  reason text not null,
  detail text,
  status public.report_status not null default 'open',
  handler_id uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists post_reports_status_created_idx
  on public.post_reports (status, created_at desc);

create table if not exists public.post_moderation_logs (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  before_data jsonb,
  after_data jsonb,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists post_moderation_logs_post_created_idx
  on public.post_moderation_logs (post_id, created_at desc);

create table if not exists public.post_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  post_type public.post_type not null,
  city_id uuid references public.cities(id) on delete set null,
  title text,
  payload jsonb not null default '{}'::jsonb,
  local_draft_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists post_drafts_user_updated_idx
  on public.post_drafts (user_id, updated_at desc);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  status text not null default 'hidden' check (status in ('visible', 'hidden', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  body text,
  status text not null default 'hidden' check (status in ('visible', 'hidden', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entity_type, entity_id, user_id)
);

create or replace function public.is_public_post(p_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.posts p
    where p.id = p_post_id
      and p.status = 'published'
      and p.visibility = 'public'
      and (p.expires_at is null or p.expires_at > now())
      and (p.author_id is null or public.is_profile_publicly_allowed(p.author_id))
  );
$$;

create or replace function public.is_post_author(p_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.posts p
    where p.id = p_post_id
      and p.author_id = auth.uid()
  );
$$;

alter table public.posts enable row level security;
alter table public.post_details_jobs enable row level security;
alter table public.post_details_housing enable row level security;
alter table public.post_details_marketplace enable row level security;
alter table public.post_details_services enable row level security;
alter table public.post_contacts enable row level security;
alter table public.post_stats enable row level security;
alter table public.post_favorites enable row level security;
alter table public.post_views enable row level security;
alter table public.post_reports enable row level security;
alter table public.post_moderation_logs enable row level security;
alter table public.post_drafts enable row level security;
alter table public.comments enable row level security;
alter table public.ratings enable row level security;

create policy "Public can read published posts"
  on public.posts
  for select
  using (public.is_public_post(id));

create policy "Authors can read own posts"
  on public.posts
  for select
  to authenticated
  using (auth.uid() = author_id);

create policy "Authors can create own posts"
  on public.posts
  for insert
  to authenticated
  with check (
    auth.uid() = author_id
    and status in ('draft', 'pending_review', 'published')
    and (status = 'draft' or public.can_user_publish(auth.uid()))
  );

create policy "Authors can update active own posts"
  on public.posts
  for update
  to authenticated
  using (auth.uid() = author_id and status in ('draft', 'pending_review', 'published'))
  with check (
    auth.uid() = author_id
    and status in ('draft', 'pending_review', 'published', 'expired', 'deleted')
    and (status = 'draft' or public.can_user_publish(auth.uid()))
  );

create policy "Admins can read posts"
  on public.posts
  for select
  to authenticated
  using (public.has_admin_permission('view_posts'));

create policy "Admins can moderate posts"
  on public.posts
  for update
  to authenticated
  using (public.has_admin_permission('moderate_posts'))
  with check (public.has_admin_permission('moderate_posts'));

create policy "Public can read public job details"
  on public.post_details_jobs
  for select
  using (public.is_public_post(post_id));

create policy "Authors can manage own job details"
  on public.post_details_jobs
  for all
  to authenticated
  using (public.is_post_author(post_id))
  with check (public.is_post_author(post_id));

create policy "Admins can manage job details"
  on public.post_details_jobs
  for all
  to authenticated
  using (public.has_admin_permission('view_posts') or public.has_admin_permission('moderate_posts'))
  with check (public.has_admin_permission('moderate_posts'));

create policy "Public can read public housing details"
  on public.post_details_housing
  for select
  using (public.is_public_post(post_id));

create policy "Authors can manage own housing details"
  on public.post_details_housing
  for all
  to authenticated
  using (public.is_post_author(post_id))
  with check (public.is_post_author(post_id));

create policy "Admins can manage housing details"
  on public.post_details_housing
  for all
  to authenticated
  using (public.has_admin_permission('view_posts') or public.has_admin_permission('moderate_posts'))
  with check (public.has_admin_permission('moderate_posts'));

create policy "Public can read public marketplace details"
  on public.post_details_marketplace
  for select
  using (public.is_public_post(post_id));

create policy "Authors can manage own marketplace details"
  on public.post_details_marketplace
  for all
  to authenticated
  using (public.is_post_author(post_id))
  with check (public.is_post_author(post_id));

create policy "Admins can manage marketplace details"
  on public.post_details_marketplace
  for all
  to authenticated
  using (public.has_admin_permission('view_posts') or public.has_admin_permission('moderate_posts'))
  with check (public.has_admin_permission('moderate_posts'));

create policy "Public can read public service details"
  on public.post_details_services
  for select
  using (public.is_public_post(post_id));

create policy "Authors can manage own service details"
  on public.post_details_services
  for all
  to authenticated
  using (public.is_post_author(post_id))
  with check (public.is_post_author(post_id));

create policy "Admins can manage service details"
  on public.post_details_services
  for all
  to authenticated
  using (public.has_admin_permission('view_posts') or public.has_admin_permission('moderate_posts'))
  with check (public.has_admin_permission('moderate_posts'));

create policy "Authors can read own post contacts"
  on public.post_contacts
  for select
  to authenticated
  using (public.is_post_author(post_id));

create policy "Authors can manage own post contacts"
  on public.post_contacts
  for all
  to authenticated
  using (public.is_post_author(post_id))
  with check (public.is_post_author(post_id));

create policy "Admins can read post contacts"
  on public.post_contacts
  for select
  to authenticated
  using (public.has_admin_permission('view_post_contacts'));

create policy "Admins can insert post contacts"
  on public.post_contacts
  for insert
  to authenticated
  with check (public.has_admin_permission('moderate_posts'));

create policy "Admins can update post contacts"
  on public.post_contacts
  for update
  to authenticated
  using (public.has_admin_permission('moderate_posts'))
  with check (public.has_admin_permission('moderate_posts'));

create policy "Admins can delete post contacts"
  on public.post_contacts
  for delete
  to authenticated
  using (public.has_admin_permission('moderate_posts'));

create policy "Public can read post stats for public posts"
  on public.post_stats
  for select
  using (public.is_public_post(post_id));

create policy "Admins can manage post stats"
  on public.post_stats
  for all
  to authenticated
  using (public.has_admin_permission('view_posts'))
  with check (public.has_admin_permission('view_posts'));

create policy "Users can manage own favorites"
  on public.post_favorites
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can read own post views"
  on public.post_views
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users and anonymous visitors can insert post views"
  on public.post_views
  for insert
  to anon, authenticated
  with check (
    (auth.uid() is not null and auth.uid() = user_id)
    or (auth.uid() is null and user_id is null and visitor_id is not null)
  );

create policy "Users and visitors can submit post reports"
  on public.post_reports
  for insert
  to anon, authenticated
  with check (
    (auth.uid() is not null and auth.uid() = reporter_id)
    or (auth.uid() is null and reporter_id is null and visitor_id is not null)
  );

create policy "Users can read own post reports"
  on public.post_reports
  for select
  to authenticated
  using (auth.uid() = reporter_id);

create policy "Admins can manage post reports"
  on public.post_reports
  for all
  to authenticated
  using (public.has_admin_permission('view_post_reports') or public.has_admin_permission('handle_post_reports'))
  with check (public.has_admin_permission('handle_post_reports'));

create policy "Admins can read moderation logs"
  on public.post_moderation_logs
  for select
  to authenticated
  using (public.has_admin_permission('moderate_posts'));

create policy "Admins can insert moderation logs"
  on public.post_moderation_logs
  for insert
  to authenticated
  with check (public.has_admin_permission('moderate_posts'));

create policy "Users can manage own drafts"
  on public.post_drafts
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can manage own comments"
  on public.comments
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Admins can manage comments"
  on public.comments
  for all
  to authenticated
  using (public.has_admin_permission('moderate_posts'))
  with check (public.has_admin_permission('moderate_posts'));

create policy "Users can manage own ratings"
  on public.ratings
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Admins can manage ratings"
  on public.ratings
  for all
  to authenticated
  using (public.has_admin_permission('moderate_posts'))
  with check (public.has_admin_permission('moderate_posts'));
