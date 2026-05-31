create table if not exists public.image_assets (
  id uuid primary key default gen_random_uuid(),
  source_type public.image_source_type not null,
  bucket text,
  path text,
  public_url text,
  external_url text,
  external_host text,
  owner_id uuid references auth.users(id) on delete set null,
  entity_type text,
  entity_id uuid,
  mime_type text,
  size_bytes bigint,
  width integer,
  height integer,
  status text not null default 'active' check (status in ('active', 'orphaned', 'deleted')),
  is_public boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint image_assets_source_check check (
    (source_type = 'storage' and bucket is not null and path is not null)
    or
    (source_type = 'external' and external_url is not null and external_host is not null)
  ),
  constraint image_assets_external_https_check check (
    source_type <> 'external'
    or (
      external_url ~* '^https://'
      and lower(external_host) in ('img.openaa.com')
    )
  )
);

create index if not exists image_assets_owner_created_idx
  on public.image_assets (owner_id, created_at desc);

create index if not exists image_assets_entity_idx
  on public.image_assets (entity_type, entity_id);

create index if not exists image_assets_external_host_idx
  on public.image_assets (external_host)
  where source_type = 'external';

create table if not exists public.post_images (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  image_asset_id uuid not null references public.image_assets(id) on delete cascade,
  sort_order integer not null default 0,
  is_cover boolean not null default false,
  caption text,
  created_at timestamptz not null default now(),
  unique (post_id, image_asset_id)
);

create index if not exists post_images_post_sort_idx
  on public.post_images (post_id, sort_order);

alter table public.image_assets enable row level security;
alter table public.post_images enable row level security;

create policy "Public can read public active image assets"
  on public.image_assets
  for select
  using (status = 'active' and is_public = true);

create policy "Owners can manage own image assets"
  on public.image_assets
  for all
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Admins can read image assets"
  on public.image_assets
  for select
  to authenticated
  using (public.has_admin_permission('view_images') or public.has_admin_permission('manage_image_assets'));

create policy "Admins can manage image assets"
  on public.image_assets
  for all
  to authenticated
  using (public.has_admin_permission('manage_image_assets'))
  with check (public.has_admin_permission('manage_image_assets'));

create policy "Public can read images for public posts"
  on public.post_images
  for select
  using (public.is_public_post(post_id));

create policy "Authors can manage own post images"
  on public.post_images
  for all
  to authenticated
  using (public.is_post_author(post_id))
  with check (public.is_post_author(post_id));

create policy "Admins can manage post images"
  on public.post_images
  for all
  to authenticated
  using (public.has_admin_permission('manage_image_assets') or public.has_admin_permission('moderate_posts'))
  with check (public.has_admin_permission('manage_image_assets') or public.has_admin_permission('moderate_posts'));
