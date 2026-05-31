alter table public.top_quick_links
  add column if not exists city_id uuid references public.cities(id) on delete set null,
  add column if not exists open_mode text not null default 'same' check (open_mode in ('same', 'new'));

alter table public.home_banners
  add column if not exists open_mode text not null default 'same' check (open_mode in ('same', 'new'));

alter table public.ads
  add column if not exists open_mode text not null default 'same' check (open_mode in ('same', 'new'));

create index if not exists top_quick_links_city_active_sort_idx
  on public.top_quick_links (city_id, is_active, sort_order);
