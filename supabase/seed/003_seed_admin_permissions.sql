-- See supabase/migrations/013_seed_admin_permissions.sql for the full baseline permission set.
-- This file is a local reset pointer and intentionally avoids any real admin user insert.

insert into public.admin_permissions (permission_key, name, category)
values
  ('view_users', 'View users', 'users'),
  ('manage_user_status', 'Manage user status', 'users'),
  ('view_admins', 'View admins', 'admins'),
  ('manage_admins', 'Manage admins', 'admins'),
  ('view_posts', 'View posts', 'posts'),
  ('moderate_posts', 'Moderate posts', 'posts'),
  ('view_news', 'View news', 'news'),
  ('create_news', 'Create news', 'news'),
  ('edit_news', 'Edit news', 'news'),
  ('publish_news', 'Publish news', 'news'),
  ('manage_ads', 'Manage ads', 'operations'),
  ('manage_navigation', 'Manage navigation', 'operations'),
  ('manage_home_sections', 'Manage home sections', 'operations'),
  ('view_feedback', 'View feedback', 'support'),
  ('handle_feedback', 'Handle feedback', 'support'),
  ('manage_image_assets', 'Manage image assets', 'media'),
  ('manage_dmv_questions', 'Manage DMV questions', 'dmv'),
  ('manage_settings', 'Manage settings', 'system')
on conflict (permission_key) do nothing;
