create table if not exists public.admin_module_permissions (
  id uuid primary key default gen_random_uuid(),
  module_key text not null,
  permission_key text not null references public.admin_permissions(permission_key) on delete cascade,
  created_at timestamptz not null default now(),
  unique (module_key, permission_key)
);

create index if not exists admin_module_permissions_permission_idx
  on public.admin_module_permissions (permission_key, module_key);

alter table public.admin_module_permissions enable row level security;

drop policy if exists "Super admins can read admin module permissions" on public.admin_module_permissions;
create policy "Super admins can read admin module permissions"
  on public.admin_module_permissions
  for select
  to authenticated
  using (public.is_super_admin());

drop policy if exists "Super admins can manage admin module permissions" on public.admin_module_permissions;
create policy "Super admins can manage admin module permissions"
  on public.admin_module_permissions
  for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

insert into public.admin_module_permissions (module_key, permission_key)
values
  ('user-posts', 'view_posts'),
  ('user-posts', 'view_post_contacts'),
  ('user-posts', 'moderate_posts'),
  ('user-posts', 'approve_posts'),
  ('user-posts', 'reject_posts'),
  ('user-posts', 'hide_posts'),
  ('user-posts', 'restore_posts'),
  ('user-posts', 'delete_posts'),
  ('messages', 'view_feedback'),
  ('messages', 'handle_feedback'),
  ('messages', 'view_reports'),
  ('messages', 'handle_reports'),
  ('messages', 'view_post_reports'),
  ('messages', 'handle_post_reports'),
  ('messages', 'manage_system_announcements'),
  ('messages', 'manage_notifications'),
  ('news', 'view_news'),
  ('news', 'create_news'),
  ('news', 'edit_news'),
  ('news', 'publish_news'),
  ('news', 'delete_news'),
  ('news', 'manage_news_categories'),
  ('navigation', 'manage_navigation'),
  ('navigation', 'manage_top_links'),
  ('home', 'manage_home_sections'),
  ('home', 'manage_latest_ticker'),
  ('ads', 'manage_ads'),
  ('users', 'view_users'),
  ('users', 'view_user_contacts'),
  ('users', 'edit_user_notes'),
  ('users', 'restrict_users'),
  ('users', 'ban_users'),
  ('users', 'restore_users'),
  ('users', 'manage_user_status'),
  ('users', 'view_user_posts'),
  ('settings', 'view_settings'),
  ('settings', 'manage_settings'),
  ('settings', 'manage_rate_limits'),
  ('settings', 'manage_sensitive_words'),
  ('settings', 'view_search_logs'),
  ('recycle-bin', 'view_images'),
  ('recycle-bin', 'delete_images'),
  ('recycle-bin', 'manage_image_assets'),
  ('audit-logs', 'view_admin_audit_logs'),
  ('audit-logs', 'view_audit_logs'),
  ('dmv', 'view_dmv_questions'),
  ('dmv', 'import_dmv_questions'),
  ('dmv', 'edit_dmv_questions'),
  ('dmv', 'disable_dmv_questions'),
  ('dmv', 'manage_dmv_questions'),
  ('admin-access', 'view_admins'),
  ('admin-access', 'add_admins'),
  ('admin-access', 'edit_admin_roles'),
  ('admin-access', 'edit_admin_permissions'),
  ('admin-access', 'disable_admins'),
  ('admin-access', 'restore_admins'),
  ('admin-access', 'manage_admins')
on conflict (module_key, permission_key) do nothing;

create or replace function public.has_admin_permission(p_permission_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with active_role as (
    select ar.role
    from public.admin_roles ar
    join public.profiles p on p.id = ar.user_id
    where ar.user_id = auth.uid()
      and ar.is_active = true
      and p.status = 'active'
    limit 1
  ),
  mapped_modules as (
    select amp.module_key
    from public.admin_module_permissions amp
    join public.admin_permissions ap on ap.permission_key = amp.permission_key
    where amp.permission_key = p_permission_key
      and ap.is_active = true
  ),
  user_deny as (
    select 1
    from public.admin_user_permissions aup
    where aup.user_id = auth.uid()
      and aup.permission_key = p_permission_key
      and aup.effect = 'deny'
    limit 1
  ),
  user_allow as (
    select 1
    from public.admin_user_permissions aup
    where aup.user_id = auth.uid()
      and aup.permission_key = p_permission_key
      and aup.effect = 'allow'
    limit 1
  ),
  role_allow as (
    select 1
    from public.admin_role_permissions arp
    join active_role ar on ar.role = arp.role
    join public.admin_permissions ap on ap.permission_key = arp.permission_key
    where arp.permission_key = p_permission_key
      and arp.allowed = true
      and ap.is_active = true
    limit 1
  ),
  mapped_module_allowed as (
    select 1
    from mapped_modules mm
    where public.has_admin_module(mm.module_key)
    limit 1
  )
  select case
    when auth.uid() is null then false
    when not exists (select 1 from active_role) then false
    when public.is_super_admin() then true
    when exists (select 1 from user_deny) then false
    when exists (select 1 from mapped_modules)
      and not exists (select 1 from mapped_module_allowed) then false
    when exists (select 1 from user_allow) then true
    when exists (select 1 from role_allow) then true
    else false
  end;
$$;
