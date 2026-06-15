-- Reconcile legacy migration gaps that are still required by current code.
-- This migration intentionally does not repair migration history and does not
-- replay the old migration files directly.

create table if not exists public.latest_ticker_global_settings (
  id smallint primary key default 1 check (id = 1),
  is_enabled boolean not null default true,
  interval_seconds integer not null default 4 check (interval_seconds between 3 and 10),
  updated_at timestamptz not null default now()
);

create table if not exists public.latest_ticker_sections (
  section_key text primary key,
  section_name text not null,
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  display_count integer not null default 3 check (display_count between 1 and 20),
  updated_at timestamptz not null default now()
);

alter table public.latest_ticker_global_settings enable row level security;
alter table public.latest_ticker_sections enable row level security;

drop policy if exists "Public can read latest ticker global settings" on public.latest_ticker_global_settings;
create policy "Public can read latest ticker global settings"
  on public.latest_ticker_global_settings
  for select
  using (true);

drop policy if exists "Admins can manage latest ticker global settings" on public.latest_ticker_global_settings;
create policy "Admins can manage latest ticker global settings"
  on public.latest_ticker_global_settings
  for all
  to authenticated
  using (public.has_admin_permission('manage_latest_ticker'))
  with check (public.has_admin_permission('manage_latest_ticker'));

drop policy if exists "Public can read latest ticker sections" on public.latest_ticker_sections;
create policy "Public can read latest ticker sections"
  on public.latest_ticker_sections
  for select
  using (true);

drop policy if exists "Admins can manage latest ticker sections" on public.latest_ticker_sections;
create policy "Admins can manage latest ticker sections"
  on public.latest_ticker_sections
  for all
  to authenticated
  using (public.has_admin_permission('manage_latest_ticker'))
  with check (public.has_admin_permission('manage_latest_ticker'));

insert into public.latest_ticker_global_settings (id, is_enabled, interval_seconds)
values (1, true, 4)
on conflict (id) do nothing;

insert into public.latest_ticker_sections (section_key, section_name, is_enabled, sort_order, display_count)
values
  ('news', '新闻', true, 10, 5),
  ('jobs', '招聘', true, 20, 3),
  ('housing', '房屋', true, 30, 3),
  ('marketplace', '二手 / 市场', true, 40, 3),
  ('services', '本地服务', true, 50, 3)
on conflict (section_key) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ad-images',
  'ad-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read ad images" on storage.objects;
create policy "Public can read ad images"
  on storage.objects
  for select
  using (bucket_id = 'ad-images');

drop policy if exists "Admins can upload ad images" on storage.objects;
create policy "Admins can upload ad images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'ad-images'
    and public.has_admin_permission('manage_ads')
  );

drop policy if exists "Admins can update ad images" on storage.objects;
create policy "Admins can update ad images"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'ad-images'
    and public.has_admin_permission('manage_ads')
  )
  with check (
    bucket_id = 'ad-images'
    and public.has_admin_permission('manage_ads')
  );

drop policy if exists "Admins can delete ad images" on storage.objects;
create policy "Admins can delete ad images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'ad-images'
    and public.has_admin_permission('manage_ads')
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'home-banner-images',
  'home-banner-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read home banner images" on storage.objects;
create policy "Public can read home banner images"
  on storage.objects
  for select
  using (bucket_id = 'home-banner-images');

drop policy if exists "Admins can upload home banner images" on storage.objects;
create policy "Admins can upload home banner images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'home-banner-images'
    and public.has_admin_permission('manage_home_sections')
  );

drop policy if exists "Admins can update home banner images" on storage.objects;
create policy "Admins can update home banner images"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'home-banner-images'
    and public.has_admin_permission('manage_home_sections')
  )
  with check (
    bucket_id = 'home-banner-images'
    and public.has_admin_permission('manage_home_sections')
  );

drop policy if exists "Admins can delete home banner images" on storage.objects;
create policy "Admins can delete home banner images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'home-banner-images'
    and public.has_admin_permission('manage_home_sections')
  );

alter table public.news_posts
  add column if not exists deletion_error text,
  add column if not exists deletion_error_at timestamptz;

create index if not exists news_posts_deletion_error_idx
  on public.news_posts (deletion_error_at desc)
  where status = 'deleted' and (deletion_error is not null or deletion_error_at is not null);

insert into public.site_settings (key, value, description, is_public)
values
  (
    'recycle_bin_news_retention_days',
    '{"days":90}'::jsonb,
    '回收站中新闻内容的保留天数。',
    false
  ),
  (
    'recycle_bin_navigation_retention_days',
    '{"days":90}'::jsonb,
    '回收站中公共导航内容的保留天数。',
    false
  ),
  (
    'recycle_bin_image_retention_days',
    '{"days":30}'::jsonb,
    '图片清理工具中标记删除图片的保留天数。',
    false
  )
on conflict (key) do nothing;

drop policy if exists "Users can mark or soft delete own notifications" on public.notifications;
drop policy if exists "Users can update own notifications" on public.notifications;

revoke update on public.notifications from anon, authenticated;

drop policy if exists "Users can read own non-deleted notifications" on public.notifications;
create policy "Users can read own non-deleted notifications"
  on public.notifications
  for select
  to authenticated
  using (auth.uid() = user_id and deleted_at is null);
