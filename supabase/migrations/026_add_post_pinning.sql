alter table public.posts
  add column if not exists is_pinned boolean not null default false,
  add column if not exists pinned_order integer not null default 0,
  add column if not exists pinned_until timestamptz;

create index if not exists posts_public_pinned_idx
  on public.posts (post_type, status, visibility, city_id, is_pinned desc, pinned_order, published_at desc);

create index if not exists posts_admin_pinned_idx
  on public.posts (status, is_pinned desc, pinned_order, updated_at desc);

create or replace function public.enforce_post_pinning_admin_only()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.has_admin_permission('moderate_posts') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.is_pinned := false;
    new.pinned_order := 0;
    new.pinned_until := null;
    return new;
  end if;

  if new.is_pinned is distinct from old.is_pinned
    or new.pinned_order is distinct from old.pinned_order
    or new.pinned_until is distinct from old.pinned_until
  then
    raise exception 'Only moderators can change post pinning fields.' using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_posts_enforce_pinning_admin_only on public.posts;
create trigger trg_posts_enforce_pinning_admin_only
  before insert or update of is_pinned, pinned_order, pinned_until on public.posts
  for each row execute function public.enforce_post_pinning_admin_only();
