alter table public.news_posts
  add column if not exists pinned_until timestamptz;

create index if not exists news_posts_pinned_idx
  on public.news_posts (status, is_pinned, published_at desc);

drop policy if exists "Admins and editors can manage news" on public.news_posts;
drop policy if exists "Admins can read all news" on public.news_posts;
drop policy if exists "Admins can insert news" on public.news_posts;
drop policy if exists "Admins can update news" on public.news_posts;
drop policy if exists "Admins can delete news" on public.news_posts;

create policy "Admins can read all news"
  on public.news_posts
  for select
  to authenticated
  using (
    public.has_admin_permission('view_news')
    or public.has_admin_permission('create_news')
    or public.has_admin_permission('edit_news')
    or public.has_admin_permission('publish_news')
    or public.has_admin_permission('delete_news')
  );

create policy "Admins can insert news"
  on public.news_posts
  for insert
  to authenticated
  with check (
    public.has_admin_permission('create_news')
    and (
      status <> 'published'
      or public.has_admin_permission('publish_news')
    )
  );

create policy "Admins can update news"
  on public.news_posts
  for update
  to authenticated
  using (
    public.has_admin_permission('edit_news')
    or public.has_admin_permission('publish_news')
    or public.has_admin_permission('delete_news')
  )
  with check (
    public.has_admin_permission('edit_news')
    or public.has_admin_permission('publish_news')
    or public.has_admin_permission('delete_news')
  );

create policy "Admins can delete news"
  on public.news_posts
  for delete
  to authenticated
  using (
    public.has_admin_permission('delete_news')
  );

insert into public.news_categories (slug, name, description, sort_order, is_active)
values
  ('local-news', '本地新闻', '纽约华人本地新闻和社区资讯。', 10, true),
  ('newcomer-guide', '新手指南', '新移民和纽约生活入门指南。', 20, true),
  ('dmv-guide', 'DMV 教程', '纽约 DMV 笔试、驾照和罚单相关教程。', 30, true),
  ('life-guide', '生活指南', '办事、交通、居住和日常生活指南。', 40, true),
  ('announcement', '平台公告', 'OpenAA 平台更新和运营公告。', 50, true)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = true,
  updated_at = now();
