create table if not exists public.site_page_views (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  title text,
  user_id uuid references public.profiles(id) on delete set null,
  visitor_id text,
  referrer text,
  user_agent text,
  device_type text,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  constraint site_page_views_actor_check check (
    user_id is not null or (visitor_id is not null and length(btrim(visitor_id)) > 0)
  ),
  constraint site_page_views_path_check check (
    length(btrim(path)) > 0 and left(path, 1) = '/'
  )
);

create index if not exists site_page_views_created_idx on public.site_page_views (created_at desc);
create index if not exists site_page_views_path_created_idx on public.site_page_views (path, created_at desc);
create index if not exists site_page_views_user_created_idx on public.site_page_views (user_id, created_at desc);
create index if not exists site_page_views_visitor_created_idx on public.site_page_views (visitor_id, created_at desc);

alter table public.site_page_views enable row level security;

drop policy if exists "Public can insert site page views" on public.site_page_views;
create policy "Public can insert site page views"
on public.site_page_views
for insert
with check (
  (
    auth.uid() is not null
    and user_id = auth.uid()
    and visitor_id is null
  )
  or (
    auth.uid() is null
    and user_id is null
    and visitor_id is not null
    and length(btrim(visitor_id)) > 0
  )
);

drop policy if exists "Admins can read site page views" on public.site_page_views;
create policy "Admins can read site page views"
on public.site_page_views
for select
using (
  public.is_admin()
  or public.has_admin_permission('view_admin_audit_logs')
  or public.has_admin_permission('view_audit_logs')
);

grant insert on public.site_page_views to anon, authenticated;
grant select on public.site_page_views to authenticated;

comment on table public.site_page_views is
  'Lightweight page-view analytics for public OpenAA pages. Admin/API/static paths are excluded in application code. Raw IP addresses are intentionally not stored.';
comment on column public.site_page_views.visitor_id is
  'Anonymous browser identifier generated client-side. This is not an IP address.';
comment on column public.site_page_views.device_type is
  'Simple device bucket derived from user-agent: mobile, tablet, or desktop.';
