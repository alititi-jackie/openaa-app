insert into public.admin_permissions (permission_key, name, description, category)
values
  ('view_users', 'View users', 'View user list and basic profile fields.', 'users'),
  ('view_user_contacts', 'View user contacts', 'View private user contact fields.', 'users'),
  ('edit_user_notes', 'Edit user notes', 'Edit internal user notes.', 'users'),
  ('restrict_users', 'Restrict users', 'Restrict user publishing ability.', 'users'),
  ('ban_users', 'Ban users', 'Ban users from the platform.', 'users'),
  ('restore_users', 'Restore users', 'Restore restricted or banned users.', 'users'),
  ('manage_user_status', 'Manage user status', 'Manage profile status and account state.', 'users'),
  ('view_user_posts', 'View user posts', 'View posts owned by a user.', 'users'),
  ('view_admins', 'View admins', 'View admin list and role details.', 'admins'),
  ('add_admins', 'Add admins', 'Add a user as an administrator.', 'admins'),
  ('edit_admin_roles', 'Edit admin roles', 'Change admin roles.', 'admins'),
  ('edit_admin_permissions', 'Edit admin permissions', 'Change role permissions or user permission overrides.', 'admins'),
  ('disable_admins', 'Disable admins', 'Disable an admin account.', 'admins'),
  ('restore_admins', 'Restore admins', 'Restore a disabled admin account.', 'admins'),
  ('manage_admins', 'Manage admins', 'Full admin management permission.', 'admins'),
  ('view_admin_audit_logs', 'View admin audit logs', 'View admin-specific audit logs.', 'admins'),
  ('view_posts', 'View posts', 'View all posts in admin.', 'posts'),
  ('view_post_contacts', 'View post contacts', 'View protected post contact data.', 'posts'),
  ('moderate_posts', 'Moderate posts', 'Hide, restore, approve, reject, or delete posts.', 'posts'),
  ('approve_posts', 'Approve posts', 'Approve pending posts.', 'posts'),
  ('reject_posts', 'Reject posts', 'Reject pending posts.', 'posts'),
  ('hide_posts', 'Hide posts', 'Hide public posts.', 'posts'),
  ('restore_posts', 'Restore posts', 'Restore hidden posts.', 'posts'),
  ('delete_posts', 'Delete posts', 'Delete posts from admin.', 'posts'),
  ('view_post_reports', 'View post reports', 'View user-submitted post reports.', 'posts'),
  ('handle_post_reports', 'Handle post reports', 'Resolve or reject post reports.', 'posts'),
  ('view_news', 'View news', 'View news admin list.', 'news'),
  ('create_news', 'Create news', 'Create news posts.', 'news'),
  ('edit_news', 'Edit news', 'Edit news posts.', 'news'),
  ('publish_news', 'Publish news', 'Publish news posts.', 'news'),
  ('delete_news', 'Delete news', 'Delete news posts.', 'news'),
  ('manage_news_categories', 'Manage news categories', 'Create and edit news categories.', 'news'),
  ('manage_ads', 'Manage ads', 'Manage ad placements.', 'operations'),
  ('manage_navigation', 'Manage navigation', 'Manage navigation categories and links.', 'operations'),
  ('manage_home_sections', 'Manage home sections', 'Manage home modules and banners.', 'operations'),
  ('manage_top_links', 'Manage top links', 'Manage top quick links.', 'operations'),
  ('manage_latest_ticker', 'Manage latest ticker', 'Manage latest ticker items.', 'operations'),
  ('manage_system_announcements', 'Manage system announcements', 'Manage public system announcements.', 'operations'),
  ('manage_notifications', 'Manage notifications', 'Send and manage notifications.', 'operations'),
  ('view_feedback', 'View feedback', 'View submitted feedback.', 'support'),
  ('handle_feedback', 'Handle feedback', 'Handle submitted feedback.', 'support'),
  ('view_reports', 'View reports', 'View reports.', 'support'),
  ('handle_reports', 'Handle reports', 'Handle reports.', 'support'),
  ('view_images', 'View images', 'View image assets.', 'media'),
  ('delete_images', 'Delete images', 'Delete storage image assets.', 'media'),
  ('manage_image_assets', 'Manage image assets', 'Manage image asset records.', 'media'),
  ('view_dmv_questions', 'View DMV questions', 'View DMV question admin list.', 'dmv'),
  ('import_dmv_questions', 'Import DMV questions', 'Import DMV question batches.', 'dmv'),
  ('edit_dmv_questions', 'Edit DMV questions', 'Edit DMV questions.', 'dmv'),
  ('disable_dmv_questions', 'Disable DMV questions', 'Disable DMV questions.', 'dmv'),
  ('manage_dmv_questions', 'Manage DMV questions', 'Full DMV question management.', 'dmv'),
  ('view_settings', 'View settings', 'View system settings.', 'system'),
  ('manage_settings', 'Manage settings', 'Manage system settings.', 'system'),
  ('manage_rate_limits', 'Manage rate limits', 'Manage rate limit records.', 'system'),
  ('manage_sensitive_words', 'Manage sensitive words', 'Manage future sensitive word rules.', 'system'),
  ('view_search_logs', 'View search logs', 'View search logs.', 'system'),
  ('view_audit_logs', 'View audit logs', 'View audit logs.', 'system')
on conflict (permission_key) do update
set
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  is_active = true;

insert into public.admin_role_permissions (role, permission_key, allowed)
select 'admin'::public.admin_role, permission_key, true
from public.admin_permissions
where permission_key not in ('manage_admins', 'add_admins', 'edit_admin_permissions', 'disable_admins', 'restore_admins')
on conflict (role, permission_key) do update set allowed = excluded.allowed, updated_at = now();

insert into public.admin_role_permissions (role, permission_key, allowed)
select 'editor'::public.admin_role, permission_key, true
from public.admin_permissions
where permission_key in (
  'view_posts',
  'view_news',
  'create_news',
  'edit_news',
  'publish_news',
  'manage_news_categories',
  'manage_navigation',
  'manage_home_sections',
  'manage_top_links',
  'manage_latest_ticker',
  'view_images',
  'view_dmv_questions'
)
on conflict (role, permission_key) do update set allowed = excluded.allowed, updated_at = now();

insert into public.admin_role_permissions (role, permission_key, allowed)
select 'moderator'::public.admin_role, permission_key, true
from public.admin_permissions
where permission_key in (
  'view_users',
  'view_posts',
  'view_post_contacts',
  'moderate_posts',
  'approve_posts',
  'reject_posts',
  'hide_posts',
  'restore_posts',
  'view_post_reports',
  'handle_post_reports',
  'view_reports',
  'handle_reports',
  'view_feedback',
  'handle_feedback'
)
on conflict (role, permission_key) do update set allowed = excluded.allowed, updated_at = now();

insert into public.admin_role_permissions (role, permission_key, allowed)
select 'support'::public.admin_role, permission_key, true
from public.admin_permissions
where permission_key in ('view_feedback', 'handle_feedback', 'view_reports', 'view_users')
on conflict (role, permission_key) do update set allowed = excluded.allowed, updated_at = now();
