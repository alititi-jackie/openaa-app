-- Deprecated: marketplace and service listings no longer use configurable
-- default placeholder images. Keep this migration filename as a historical
-- cleanup point for environments that may still have test placeholder data.

delete from public.site_settings
where key in (
  'default_marketplace_placeholder_image',
  'default_service_placeholder_image'
);
