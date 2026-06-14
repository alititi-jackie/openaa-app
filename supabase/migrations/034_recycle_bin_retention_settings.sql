insert into public.site_settings (key, value, description, is_public)
values
  (
    'recycle_bin_user_retention_days',
    '{"days": 30}'::jsonb,
    '回收站中用户删除内容的保留天数。',
    false
  ),
  (
    'recycle_bin_admin_retention_days',
    '{"days": 90}'::jsonb,
    '回收站中管理员删除内容的保留天数。',
    false
  )
on conflict (key) do update
set
  value = public.site_settings.value,
  description = excluded.description,
  is_public = excluded.is_public,
  updated_at = now();
