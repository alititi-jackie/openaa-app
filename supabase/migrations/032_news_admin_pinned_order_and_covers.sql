alter table public.news_posts
  add column if not exists pinned_order integer not null default 0;

alter table public.news_posts
  drop constraint if exists news_posts_pinned_order_nonnegative;

alter table public.news_posts
  add constraint news_posts_pinned_order_nonnegative
    check (pinned_order >= 0);

create index if not exists news_posts_admin_display_idx
  on public.news_posts (status, is_pinned, pinned_order, published_at desc, created_at desc);

drop policy if exists "Admins can delete news" on public.news_posts;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'news-cover-images',
  'news-cover-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Public can read news cover images'
  ) then
    create policy "Public can read news cover images"
      on storage.objects
      for select
      using (bucket_id = 'news-cover-images');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'News editors can upload news cover images'
  ) then
    create policy "News editors can upload news cover images"
      on storage.objects
      for insert
      to authenticated
      with check (
        bucket_id = 'news-cover-images'
        and (
          public.has_admin_permission('create_news')
          or public.has_admin_permission('edit_news')
        )
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'News editors can update news cover images'
  ) then
    create policy "News editors can update news cover images"
      on storage.objects
      for update
      to authenticated
      using (
        bucket_id = 'news-cover-images'
        and public.has_admin_permission('edit_news')
      )
      with check (
        bucket_id = 'news-cover-images'
        and public.has_admin_permission('edit_news')
      );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'News editors can delete news cover images'
  ) then
    create policy "News editors can delete news cover images"
      on storage.objects
      for delete
      to authenticated
      using (
        bucket_id = 'news-cover-images'
        and public.has_admin_permission('edit_news')
      );
  end if;
end $$;
