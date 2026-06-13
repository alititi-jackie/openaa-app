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
    join public.profiles p on p.id = ar.user_id
    where ar.user_id = auth.uid()
      and ar.is_active = true
      and p.status = 'active'
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
    join public.profiles p on p.id = ar.user_id
    where ar.user_id = auth.uid()
      and ar.is_active = true
      and ar.role = 'super_admin'
      and p.status = 'active'
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
    join public.profiles p on p.id = ar.user_id
    where ar.user_id = auth.uid()
      and ar.is_active = true
      and p.status = 'active'
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
    when not exists (select 1 from active_role) then false
    when public.is_super_admin() then true
    when exists (select 1 from user_deny) then false
    when exists (select 1 from user_allow) then true
    when exists (select 1 from role_allow) then true
    else false
  end;
$$;

create or replace function public.prevent_unsafe_profile_self_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new;
  end if;

  if new.id is distinct from old.id then
    raise exception 'profile id cannot be changed';
  end if;

  if new.status is distinct from old.status
    or new.trust_level is distinct from old.trust_level
    or new.is_verified_user is distinct from old.is_verified_user
    or new.phone_verified is distinct from old.phone_verified
    or new.wechat_verified is distinct from old.wechat_verified
    or new.private_metadata is distinct from old.private_metadata
    or new.public_metadata is distinct from old.public_metadata
  then
    if auth.uid() = old.id then
      raise exception 'profile protected fields cannot be self-updated';
    end if;

    if not public.has_admin_permission('manage_user_status') then
      raise exception 'profile protected fields require admin permission';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_unsafe_profile_self_update on public.profiles;
create trigger prevent_unsafe_profile_self_update
  before update on public.profiles
  for each row
  execute function public.prevent_unsafe_profile_self_update();
