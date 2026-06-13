drop trigger if exists refresh_post_stats_after_favorite on public.post_favorites;

drop table if exists public.post_favorites;

create table if not exists public.user_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null,
  target_id text not null,
  target_url text not null,
  title text not null,
  category text,
  created_at timestamptz not null default now(),
  constraint user_favorites_target_type_check check (length(trim(target_type)) between 1 and 80),
  constraint user_favorites_target_id_check check (length(trim(target_id)) between 1 and 200),
  constraint user_favorites_target_url_check check (
    (target_url like '/%' and target_url not like '//%')
    or target_url like 'https://%'
  ),
  constraint user_favorites_title_check check (length(trim(title)) between 1 and 300),
  unique (user_id, target_type, target_id)
);

create index if not exists user_favorites_user_created_idx
  on public.user_favorites (user_id, created_at desc);

create index if not exists user_favorites_user_type_created_idx
  on public.user_favorites (user_id, target_type, created_at desc);

alter table public.user_favorites enable row level security;

create policy "Users can read own user favorites"
  on public.user_favorites
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own user favorites"
  on public.user_favorites
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete own user favorites"
  on public.user_favorites
  for delete
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.refresh_post_stats(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.post_stats (
    post_id,
    view_count,
    favorite_count,
    report_count,
    updated_at
  )
  values (
    p_post_id,
    (select count(*)::integer from public.post_views where post_id = p_post_id),
    (
      select count(*)::integer
      from public.user_favorites
      where target_type in ('job', 'housing', 'marketplace', 'service', 'post')
        and target_id = p_post_id::text
    ),
    (select count(*)::integer from public.post_reports where post_id = p_post_id),
    now()
  )
  on conflict (post_id)
  do update set
    view_count = excluded.view_count,
    favorite_count = excluded.favorite_count,
    report_count = excluded.report_count,
    updated_at = now();
end;
$$;

create or replace function public.refresh_post_stats_from_user_favorite_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_post_id uuid;
  target_text text;
begin
  target_text := coalesce(new.target_id, old.target_id);

  if coalesce(new.target_type, old.target_type) in ('job', 'housing', 'marketplace', 'service', 'post')
    and target_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  then
    target_post_id := target_text::uuid;
    perform public.refresh_post_stats(target_post_id);
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists refresh_post_stats_after_user_favorite on public.user_favorites;
create trigger refresh_post_stats_after_user_favorite
after insert or delete on public.user_favorites
for each row execute function public.refresh_post_stats_from_user_favorite_row();

update public.post_stats stats
set
  favorite_count = (
    select count(*)::integer
    from public.user_favorites favorites
    where favorites.target_type in ('job', 'housing', 'marketplace', 'service', 'post')
      and favorites.target_id = stats.post_id::text
  ),
  updated_at = now();
