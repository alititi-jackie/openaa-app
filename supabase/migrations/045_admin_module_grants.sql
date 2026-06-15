create table if not exists public.admin_user_modules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_key text not null,
  is_allowed boolean not null default true,
  granted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, module_key)
);

create index if not exists admin_user_modules_user_idx
  on public.admin_user_modules (user_id, module_key);

create table if not exists public.admin_user_exemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exemption_key text not null,
  is_enabled boolean not null default true,
  granted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, exemption_key)
);

create index if not exists admin_user_exemptions_user_idx
  on public.admin_user_exemptions (user_id, exemption_key);

create or replace function public.has_admin_module(p_module_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when auth.uid() is null then false
    when public.is_super_admin() then true
    when p_module_key = 'admin-access' then false
    when exists (
      select 1
      from public.admin_roles ar
      join public.admin_user_modules aum on aum.user_id = ar.user_id
      where ar.user_id = auth.uid()
        and ar.is_active = true
        and aum.module_key = p_module_key
        and aum.is_allowed = true
      limit 1
    ) then true
    else false
  end;
$$;

create or replace function public.has_admin_exemption(p_exemption_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when auth.uid() is null then false
    when public.is_super_admin() then true
    when p_exemption_key not in ('daily_post_limit', 'rename_limit') then false
    when exists (
      select 1
      from public.admin_roles ar
      join public.admin_user_exemptions aue on aue.user_id = ar.user_id
      where ar.user_id = auth.uid()
        and ar.is_active = true
        and aue.exemption_key = p_exemption_key
        and aue.is_enabled = true
      limit 1
    ) then true
    else false
  end;
$$;

alter table public.admin_user_modules enable row level security;
alter table public.admin_user_exemptions enable row level security;

create policy "Super admins can read admin module grants"
  on public.admin_user_modules
  for select
  to authenticated
  using (public.is_super_admin());

create policy "Super admins can manage admin module grants"
  on public.admin_user_modules
  for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "Super admins can read admin exemptions"
  on public.admin_user_exemptions
  for select
  to authenticated
  using (public.is_super_admin());

create policy "Super admins can manage admin exemptions"
  on public.admin_user_exemptions
  for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());
