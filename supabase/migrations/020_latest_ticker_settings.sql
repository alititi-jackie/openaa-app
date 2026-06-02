create table if not exists public.latest_ticker_global_settings (
  id smallint primary key default 1 check (id = 1),
  is_enabled boolean not null default true,
  interval_seconds integer not null default 4 check (interval_seconds between 3 and 10),
  updated_at timestamptz not null default now()
);

create table if not exists public.latest_ticker_sections (
  section_key text primary key,
  section_name text not null,
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  display_count integer not null default 3 check (display_count between 1 and 20),
  updated_at timestamptz not null default now()
);

alter table public.latest_ticker_global_settings enable row level security;
alter table public.latest_ticker_sections enable row level security;

drop policy if exists "Public can read latest ticker global settings" on public.latest_ticker_global_settings;
create policy "Public can read latest ticker global settings"
  on public.latest_ticker_global_settings
  for select
  using (true);

drop policy if exists "Admins can manage latest ticker global settings" on public.latest_ticker_global_settings;
create policy "Admins can manage latest ticker global settings"
  on public.latest_ticker_global_settings
  for all
  to authenticated
  using (public.has_admin_permission('manage_latest_ticker'))
  with check (public.has_admin_permission('manage_latest_ticker'));

drop policy if exists "Public can read latest ticker sections" on public.latest_ticker_sections;
create policy "Public can read latest ticker sections"
  on public.latest_ticker_sections
  for select
  using (true);

drop policy if exists "Admins can manage latest ticker sections" on public.latest_ticker_sections;
create policy "Admins can manage latest ticker sections"
  on public.latest_ticker_sections
  for all
  to authenticated
  using (public.has_admin_permission('manage_latest_ticker'))
  with check (public.has_admin_permission('manage_latest_ticker'));

insert into public.latest_ticker_global_settings (id, is_enabled, interval_seconds)
values (1, true, 4)
on conflict (id) do nothing;

insert into public.latest_ticker_sections (section_key, section_name, is_enabled, sort_order, display_count)
values
  ('news', '新闻', true, 10, 5),
  ('jobs', '招聘', true, 20, 3),
  ('housing', '房屋', true, 30, 3),
  ('marketplace', '二手 / 市场', true, 40, 3),
  ('services', '本地服务', true, 50, 3)
on conflict (section_key) do nothing;
