alter table public.posts
  add column if not exists deleted_by uuid references auth.users(id) on delete set null,
  add column if not exists deletion_source text,
  add column if not exists deletion_error text,
  add column if not exists deletion_error_at timestamptz;

alter table public.posts
  drop constraint if exists posts_deletion_source_check;

alter table public.posts
  add constraint posts_deletion_source_check
  check (deletion_source is null or deletion_source in ('user', 'admin'));

create index if not exists posts_recycle_bin_idx
  on public.posts (post_type, deleted_at desc)
  where status = 'deleted';

create index if not exists posts_deletion_error_idx
  on public.posts (deleted_at desc)
  where status = 'deleted' and deletion_error is not null;
