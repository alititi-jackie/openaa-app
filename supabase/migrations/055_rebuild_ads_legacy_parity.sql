alter table public.ads
  drop constraint if exists ads_open_mode_check;

alter table public.ads
  add column if not exists link_type text not null default 'external',
  add column if not exists external_url text,
  add column if not exists slug text,
  add column if not exists content text,
  add column if not exists contact_name text,
  add column if not exists phone text,
  add column if not exists wechat text,
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references auth.users(id) on delete set null;

alter table public.ads
  alter column open_mode set default 'external_new';

delete from public.ads;

update public.ads
set
  link_type = case
    when open_mode = 'internal' then 'internal'
    when slug is not null then 'internal'
    else 'external'
  end,
  external_url = case
    when open_mode = 'internal' then null
    when href ~* '^https?://' then href
    else external_url
  end,
  href = case
    when open_mode = 'internal' and slug is not null then '/ads/' || slug
    else href
  end,
  open_mode = case
    when open_mode = 'new' then 'external_new'
    when open_mode = 'same' then 'external_same'
    when open_mode in ('internal', 'external_new', 'external_same') then open_mode
    else 'external_new'
  end;

alter table public.ads
  add constraint ads_link_type_check check (link_type in ('external', 'internal')),
  add constraint ads_open_mode_check check (open_mode in ('internal', 'external_new', 'external_same')),
  add constraint ads_internal_slug_required_check check (
    link_type <> 'internal'
    or (slug is not null and slug ~ '^[a-z0-9-]+$')
  ),
  add constraint ads_external_url_required_check check (
    link_type <> 'external'
    or external_url ~* '^https?://'
  );

create unique index if not exists ads_internal_slug_unique
  on public.ads (slug)
  where link_type = 'internal' and slug is not null and deleted_at is null;

create index if not exists ads_placement_deleted_active_sort_idx
  on public.ads (placement, deleted_at, is_active, sort_order, created_at desc);

drop policy if exists "Public can read active ads" on public.ads;
create policy "Public can read active ads"
  on public.ads
  for select
  using (
    deleted_at is null
    and is_active = true
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
  );

drop policy if exists "Admins can manage ads" on public.ads;
create policy "Admins can manage ads"
  on public.ads
  for all
  to authenticated
  using (public.has_admin_permission('manage_ads'))
  with check (public.has_admin_permission('manage_ads'));
