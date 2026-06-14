alter table public.news_posts
  add column if not exists deletion_error text,
  add column if not exists deletion_error_at timestamptz;

create index if not exists news_posts_deletion_error_idx
  on public.news_posts (deletion_error_at desc)
  where status = 'deleted' and (deletion_error is not null or deletion_error_at is not null);

insert into public.site_settings (key, value, description, is_public)
values (
  'recycle_bin_news_retention_days',
  '{"days":90}'::jsonb,
  '回收站中新闻内容的保留天数。',
  false
)
on conflict (key) do nothing;
