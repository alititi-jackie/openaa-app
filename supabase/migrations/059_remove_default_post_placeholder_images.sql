-- Remove leftover test media records from the removed default post
-- placeholder image feature. This runs after image_assets.entity_id became text.

delete from public.site_settings
where key in (
  'default_marketplace_placeholder_image',
  'default_service_placeholder_image'
);

update public.image_assets
set
  status = 'deleted',
  deleted_at = coalesce(deleted_at, now()),
  updated_at = now()
where entity_type = 'site_setting'
  and entity_id in (
    'default_marketplace_placeholder_image',
    'default_service_placeholder_image'
  );
