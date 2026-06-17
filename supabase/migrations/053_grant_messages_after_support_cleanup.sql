insert into public.admin_user_modules (user_id, module_key, is_allowed, granted_by)
select ar.user_id, 'messages', true, null
from public.admin_roles ar
where ar.is_active = true
  and ar.role in ('support', 'moderator', 'admin')
on conflict (user_id, module_key)
do update set
  is_allowed = true,
  updated_at = now();
