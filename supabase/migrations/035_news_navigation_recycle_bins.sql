alter table public.news_posts
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references auth.users(id) on delete set null;

create index if not exists news_posts_deleted_idx
  on public.news_posts (deleted_at desc)
  where status = 'deleted';

alter table public.navigation_links
  add column if not exists deleted_by uuid references auth.users(id) on delete set null;

create index if not exists navigation_links_deleted_idx
  on public.navigation_links (deleted_at desc)
  where deleted_at is not null;

drop policy if exists "Public can read active navigation links" on public.navigation_links;

create policy "Public can read active navigation links"
  on public.navigation_links
  for select
  using (is_active = true and deleted_at is null);
