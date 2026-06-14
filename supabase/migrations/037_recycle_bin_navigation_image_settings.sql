insert into public.site_settings (key, value, description, is_public)
values
  (
    'recycle_bin_navigation_retention_days',
    '{"days":90}'::jsonb,
    '回收站中公共导航内容的保留天数。',
    false
  ),
  (
    'recycle_bin_image_retention_days',
    '{"days":30}'::jsonb,
    '图片清理工具中标记删除图片的保留天数。',
    false
  )
on conflict (key) do nothing;
