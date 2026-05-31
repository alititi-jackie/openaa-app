create table if not exists public.admin_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  role public.admin_role not null,
  is_active boolean not null default true,
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  revoked_by uuid references auth.users(id) on delete set null,
  revoked_at timestamptz,
  last_admin_login_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admin_roles_active_role_idx
  on public.admin_roles (is_active, role);

create table if not exists public.admin_permissions (
  id uuid primary key default gen_random_uuid(),
  permission_key text not null unique,
  name text not null,
  description text,
  category text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists admin_permissions_category_idx
  on public.admin_permissions (category, permission_key);

create table if not exists public.admin_role_permissions (
  id uuid primary key default gen_random_uuid(),
  role public.admin_role not null,
  permission_key text not null references public.admin_permissions(permission_key) on delete cascade,
  allowed boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (role, permission_key)
);

create table if not exists public.admin_user_permissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  permission_key text not null references public.admin_permissions(permission_key) on delete cascade,
  effect public.permission_effect not null,
  reason text,
  granted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, permission_key)
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  ip_hash text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_logs_actor_created_idx
  on public.admin_audit_logs (actor_id, created_at desc);

create index if not exists admin_audit_logs_entity_idx
  on public.admin_audit_logs (entity_type, entity_id);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_roles ar
    where ar.user_id = auth.uid()
      and ar.is_active = true
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_roles ar
    where ar.user_id = auth.uid()
      and ar.is_active = true
      and ar.role = 'super_admin'
  );
$$;

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
    where ar.user_id = auth.uid()
      and ar.is_active = true
    limit 1
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
  )
  select case
    when auth.uid() is null then false
    when public.is_super_admin() then true
    when exists (select 1 from user_deny) then false
    when exists (select 1 from user_allow) then true
    when exists (select 1 from role_allow) then true
    else false
  end;
$$;

create or replace function public.has_other_active_super_admin(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_roles ar
    where ar.user_id <> p_user_id
      and ar.role = 'super_admin'
      and ar.is_active = true
  );
$$;

create or replace function public.prevent_last_super_admin_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE'
    and old.role = 'super_admin'
    and old.is_active = true
    and (new.role <> 'super_admin' or new.is_active = false)
    and not public.has_other_active_super_admin(old.user_id)
  then
    raise exception 'cannot disable or demote the last active super_admin';
  end if;

  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'admin_roles_prevent_last_super_admin_change'
      and tgrelid = 'public.admin_roles'::regclass
  ) then
    execute 'create trigger admin_roles_prevent_last_super_admin_change
      before update on public.admin_roles
      for each row
      execute function public.prevent_last_super_admin_change()';
  end if;
end $$;

alter table public.admin_roles enable row level security;
alter table public.admin_permissions enable row level security;
alter table public.admin_role_permissions enable row level security;
alter table public.admin_user_permissions enable row level security;
alter table public.admin_audit_logs enable row level security;

create policy "Admins can read own role or admin list"
  on public.admin_roles
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.has_admin_permission('view_admins')
    or public.has_admin_permission('manage_admins')
  );

create policy "Authorized admins can insert admin roles"
  on public.admin_roles
  for insert
  to authenticated
  with check (
    public.is_super_admin()
    or (
      role <> 'super_admin'
      and (public.has_admin_permission('add_admins') or public.has_admin_permission('manage_admins'))
    )
  );

create policy "Authorized admins can update admin roles"
  on public.admin_roles
  for update
  to authenticated
  using (
    public.is_super_admin()
    or (
      role <> 'super_admin'
      and (
        public.has_admin_permission('edit_admin_roles')
        or public.has_admin_permission('disable_admins')
        or public.has_admin_permission('restore_admins')
        or public.has_admin_permission('manage_admins')
      )
    )
  )
  with check (
    public.is_super_admin()
    or (
      role <> 'super_admin'
      and (
        public.has_admin_permission('edit_admin_roles')
        or public.has_admin_permission('disable_admins')
        or public.has_admin_permission('restore_admins')
        or public.has_admin_permission('manage_admins')
      )
    )
  );

create policy "Admins can read permission definitions"
  on public.admin_permissions
  for select
  to authenticated
  using (public.has_admin_permission('view_admins') or public.has_admin_permission('manage_admins'));

create policy "Authorized admins can manage permission definitions"
  on public.admin_permissions
  for all
  to authenticated
  using (public.has_admin_permission('edit_admin_permissions') or public.has_admin_permission('manage_admins'))
  with check (public.has_admin_permission('edit_admin_permissions') or public.has_admin_permission('manage_admins'));

create policy "Admins can read role permission mappings"
  on public.admin_role_permissions
  for select
  to authenticated
  using (public.has_admin_permission('view_admins') or public.has_admin_permission('manage_admins'));

create policy "Authorized admins can manage role permission mappings"
  on public.admin_role_permissions
  for all
  to authenticated
  using (public.has_admin_permission('edit_admin_permissions') or public.has_admin_permission('manage_admins'))
  with check (public.has_admin_permission('edit_admin_permissions') or public.has_admin_permission('manage_admins'));

create policy "Admins can read user permission overrides"
  on public.admin_user_permissions
  for select
  to authenticated
  using (public.has_admin_permission('view_admins') or public.has_admin_permission('manage_admins'));

create policy "Authorized admins can manage user permission overrides"
  on public.admin_user_permissions
  for all
  to authenticated
  using (public.has_admin_permission('edit_admin_permissions') or public.has_admin_permission('manage_admins'))
  with check (public.has_admin_permission('edit_admin_permissions') or public.has_admin_permission('manage_admins'));

create policy "Admins can read audit logs"
  on public.admin_audit_logs
  for select
  to authenticated
  using (public.has_admin_permission('view_admin_audit_logs') or public.has_admin_permission('view_audit_logs'));

create policy "Admins can insert audit logs"
  on public.admin_audit_logs
  for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can manage cities"
  on public.cities
  for all
  to authenticated
  using (public.has_admin_permission('manage_settings'))
  with check (public.has_admin_permission('manage_settings'));

create policy "Admins can manage site settings"
  on public.site_settings
  for all
  to authenticated
  using (public.has_admin_permission('manage_settings'))
  with check (public.has_admin_permission('manage_settings'));

create policy "Admins can manage rate limits"
  on public.rate_limits
  for all
  to authenticated
  using (public.has_admin_permission('manage_rate_limits'))
  with check (public.has_admin_permission('manage_rate_limits'));

create policy "Admins can read search logs"
  on public.search_logs
  for select
  to authenticated
  using (public.has_admin_permission('view_search_logs'));

create policy "Admins can read profiles"
  on public.profiles
  for select
  to authenticated
  using (public.has_admin_permission('view_users'));

create policy "Admins can update profiles"
  on public.profiles
  for update
  to authenticated
  using (public.has_admin_permission('manage_user_status'))
  with check (public.has_admin_permission('manage_user_status'));

create policy "Admins can manage business profiles"
  on public.business_profiles
  for all
  to authenticated
  using (public.has_admin_permission('view_users') or public.has_admin_permission('manage_user_status'))
  with check (public.has_admin_permission('manage_user_status'));

create policy "Admins can read auth identities"
  on public.user_auth_identities
  for select
  to authenticated
  using (public.has_admin_permission('view_users'));

create policy "Admins can read user settings"
  on public.user_settings
  for select
  to authenticated
  using (public.has_admin_permission('view_users'));

create policy "Admins can read security logs"
  on public.user_security_logs
  for select
  to authenticated
  using (public.has_admin_permission('view_users'));
