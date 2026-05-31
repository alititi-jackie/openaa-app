-- Phase 12: navigation module foundation.
-- Keeps existing RLS boundaries and only adds fields needed by the new UI.

alter table public.navigation_links
  add column if not exists icon text,
  add column if not exists open_mode text not null default 'new';

alter table public.navigation_links
  drop constraint if exists navigation_links_open_mode_check;

alter table public.navigation_links
  add constraint navigation_links_open_mode_check
    check (open_mode in ('same', 'new'));

alter table public.user_navigation_links
  add column if not exists is_active boolean not null default true,
  add column if not exists open_mode text not null default 'new';

alter table public.user_navigation_links
  drop constraint if exists user_navigation_links_open_mode_check;

alter table public.user_navigation_links
  add constraint user_navigation_links_open_mode_check
    check (open_mode in ('same', 'new'));

create index if not exists navigation_categories_active_sort_idx
  on public.navigation_categories (is_active, sort_order, name);

create index if not exists navigation_links_active_featured_sort_idx
  on public.navigation_links (is_active, is_featured, sort_order, title);

create index if not exists user_navigation_links_user_active_sort_idx
  on public.user_navigation_links (user_id, is_active, sort_order, title);

insert into public.navigation_categories (slug, name, description, icon, sort_order, is_active)
values
  ('common', '常用网站', '纽约华人常用网站与服务入口。', 'Star', 10, true),
  ('government', '政府办事', '纽约、纽约州与联邦政府常用办事入口。', 'Landmark', 20, true),
  ('dmv-license', 'DMV / 驾照', 'DMV、驾照、车辆与罚单相关入口。', 'Car', 30, true),
  ('transportation', '交通出行', '公共交通、机场、停车与出行工具。', 'Train', 40, true),
  ('life-services', '生活服务', '水电网、医疗、学校与社区生活服务。', 'Wrench', 50, true),
  ('community', '华人社区', '华人社区、公益组织与本地信息入口。', 'Users', 60, true)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  icon = excluded.icon,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();
