-- Harden admin read/write separation for direct Supabase access.

drop policy if exists "Admins can manage posts" on public.posts;
drop policy if exists "Admins can read posts" on public.posts;
drop policy if exists "Admins can moderate posts" on public.posts;

create policy "Admins can read posts" on public.posts
  for select
  using (public.has_admin_permission('view_posts') or public.has_admin_permission('moderate_posts'));

create policy "Admins can moderate posts" on public.posts
  for all
  using (public.has_admin_permission('moderate_posts'))
  with check (public.has_admin_permission('moderate_posts'));

drop policy if exists "News editors can manage news" on public.news_posts;
drop policy if exists "News editors can read news" on public.news_posts;
drop policy if exists "News editors can insert news" on public.news_posts;
drop policy if exists "News editors can update news" on public.news_posts;
drop policy if exists "News editors can delete news" on public.news_posts;

create policy "News editors can read news" on public.news_posts
  for select
  using (
    public.has_admin_permission('view_news')
    or public.has_admin_permission('edit_news')
    or public.has_admin_permission('publish_news')
    or public.has_admin_permission('delete_news')
  );

create policy "News editors can insert news" on public.news_posts
  for insert
  with check (public.has_admin_permission('edit_news') or public.has_admin_permission('publish_news'));

create policy "News editors can update news" on public.news_posts
  for update
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

create policy "News editors can delete news" on public.news_posts
  for delete
  using (public.has_admin_permission('delete_news'));
