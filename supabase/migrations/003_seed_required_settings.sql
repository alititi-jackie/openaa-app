-- OpenAA production baseline seed.
-- Keep this file limited to required operating data, not imported legacy/demo content.

insert into public.cities (id, slug, name, state_code, timezone, is_default, is_active, sort_order)
values ('ny', 'ny', '纽约', 'NY', 'America/New_York', true, true, 10)
on conflict (id) do update set
  slug = excluded.slug,
  name = excluded.name,
  state_code = excluded.state_code,
  timezone = excluded.timezone,
  is_default = excluded.is_default,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.site_settings (key, value, is_public, description)
values
  ('daily_post_limit', '{"limit": 5}'::jsonb, false, 'Maximum posts a user can publish per day.'),
  ('dmv_notice', '{"enabled": true}'::jsonb, true, 'DMV public page notice.'),
  ('recycle_bin_retention_days', '{"posts": 30, "news": 30, "navigation": 30, "messages": 30}'::jsonb, false, 'Recycle bin retention settings.')
on conflict (key) do update set value = excluded.value, is_public = excluded.is_public, description = excluded.description, updated_at = now();

insert into public.admin_permissions (permission_key, name, description, category)
values
  ('view_posts', 'View posts', 'View user-published post list and detail.', 'posts'),
  ('view_post_contacts', 'View post contacts', 'View private post contact fields.', 'posts'),
  ('moderate_posts', 'Moderate posts', 'Change post status and moderation fields.', 'posts'),
  ('approve_posts', 'Approve posts', 'Approve pending posts.', 'posts'),
  ('reject_posts', 'Reject posts', 'Reject pending posts.', 'posts'),
  ('hide_posts', 'Hide posts', 'Hide published posts.', 'posts'),
  ('restore_posts', 'Restore posts', 'Restore hidden or deleted posts.', 'posts'),
  ('delete_posts', 'Delete posts', 'Delete posts to recycle bin or permanently delete.', 'posts'),
  ('view_post_reports', 'View post reports', 'View user-submitted post reports.', 'messages'),
  ('handle_post_reports', 'Handle post reports', 'Resolve or reject post reports.', 'messages'),
  ('view_news', 'View news', 'View news admin data.', 'news'),
  ('create_news', 'Create news', 'Create news posts.', 'news'),
  ('edit_news', 'Edit news', 'Edit news posts.', 'news'),
  ('publish_news', 'Publish news', 'Publish news posts.', 'news'),
  ('delete_news', 'Delete news', 'Delete news posts.', 'news'),
  ('manage_news_categories', 'Manage news categories', 'Manage news categories.', 'news'),
  ('manage_navigation', 'Manage navigation', 'Manage public navigation categories and links.', 'navigation'),
  ('manage_top_links', 'Manage top links', 'Manage top quick links.', 'navigation'),
  ('manage_home_sections', 'Manage home sections', 'Manage home modules and banners.', 'home'),
  ('manage_latest_ticker', 'Manage latest ticker', 'Manage latest ticker items and settings.', 'home'),
  ('manage_ads', 'Manage ads', 'Manage home and channel advertisements.', 'ads'),
  ('view_users', 'View users', 'View user profiles.', 'users'),
  ('view_user_contacts', 'View user contacts', 'View user contact fields.', 'users'),
  ('edit_user_notes', 'Edit user notes', 'Edit internal user notes.', 'users'),
  ('restrict_users', 'Restrict users', 'Restrict user accounts.', 'users'),
  ('ban_users', 'Ban users', 'Ban user accounts.', 'users'),
  ('restore_users', 'Restore users', 'Restore restricted or banned users.', 'users'),
  ('manage_user_status', 'Manage user status', 'Manage user account status.', 'users'),
  ('view_user_posts', 'View user posts', 'View posts by user.', 'users'),
  ('view_settings', 'View settings', 'View site settings.', 'settings'),
  ('manage_settings', 'Manage settings', 'Manage site settings and reserved admin settings.', 'settings'),
  ('manage_rate_limits', 'Manage rate limits', 'Manage platform rate limits.', 'settings'),
  ('manage_sensitive_words', 'Manage sensitive words', 'Manage sensitive word settings.', 'settings'),
  ('view_search_logs', 'View search logs', 'View search logs.', 'settings'),
  ('view_admin_audit_logs', 'View admin audit logs', 'View admin audit logs.', 'audit'),
  ('view_audit_logs', 'View audit logs', 'View audit logs.', 'audit'),
  ('view_images', 'View images', 'View image asset cleanup data.', 'images'),
  ('delete_images', 'Delete images', 'Mark image assets deleted.', 'images'),
  ('manage_image_assets', 'Manage image assets', 'Manage image assets.', 'images'),
  ('view_admins', 'View admins', 'View admin accounts.', 'admin-access'),
  ('add_admins', 'Add admins', 'Grant admin access.', 'admin-access'),
  ('edit_admin_roles', 'Edit admin roles', 'Edit admin roles.', 'admin-access'),
  ('edit_admin_permissions', 'Edit admin permissions', 'Edit admin permissions.', 'admin-access'),
  ('disable_admins', 'Disable admins', 'Disable admin access.', 'admin-access'),
  ('restore_admins', 'Restore admins', 'Restore admin access.', 'admin-access'),
  ('manage_admins', 'Manage admins', 'Full admin access management.', 'admin-access')
on conflict (permission_key) do update set name = excluded.name, description = excluded.description, category = excluded.category;

insert into public.admin_role_permissions (role, permission_key, allowed)
select role_name::public.admin_role, permission_key, true
from (
  values
    ('admin'), ('editor'), ('moderator'), ('support')
) as roles(role_name)
cross join public.admin_permissions
where
  role_name = 'admin'
  or (role_name = 'editor' and permission_key in ('view_posts','view_post_contacts','moderate_posts','approve_posts','reject_posts','hide_posts','view_news','create_news','edit_news','publish_news','delete_news','manage_news_categories','manage_navigation','manage_top_links','manage_home_sections','manage_latest_ticker','manage_ads'))
  or (role_name = 'moderator' and permission_key in ('view_posts','view_post_contacts','moderate_posts','approve_posts','reject_posts','hide_posts','restore_posts','view_post_reports','handle_post_reports','view_users','view_user_posts'))
  or (role_name = 'support' and permission_key in ('view_post_reports','handle_post_reports','view_users','view_user_contacts','view_user_posts'))
on conflict (role, permission_key) do update set allowed = excluded.allowed, updated_at = now();

insert into public.admin_module_permissions (module_key, permission_key)
values
  ('user-posts', 'view_posts'),
  ('user-posts', 'moderate_posts'),
  ('user-posts', 'view_post_contacts'),
  ('messages', 'view_post_reports'),
  ('messages', 'handle_post_reports'),
  ('news', 'view_news'),
  ('news', 'edit_news'),
  ('news', 'publish_news'),
  ('news', 'delete_news'),
  ('navigation', 'manage_navigation'),
  ('navigation', 'manage_top_links'),
  ('home', 'manage_home_sections'),
  ('home', 'manage_latest_ticker'),
  ('ads', 'manage_ads'),
  ('users', 'view_users'),
  ('users', 'manage_user_status'),
  ('settings', 'view_settings'),
  ('settings', 'manage_settings'),
  ('settings', 'manage_rate_limits'),
  ('audit-logs', 'view_admin_audit_logs'),
  ('recycle-bin', 'restore_posts'),
  ('recycle-bin', 'delete_posts'),
  ('recycle-bin', 'view_images'),
  ('recycle-bin', 'delete_images'),
  ('recycle-bin', 'manage_image_assets'),
  ('admin-access', 'view_admins'),
  ('admin-access', 'manage_admins')
on conflict (module_key, permission_key) do nothing;

insert into public.feature_flags (key, name, description, module, is_enabled, visibility, metadata)
values
  ('posts', '用户发布信息', 'Jobs, housing, marketplace, and services posts.', 'posts', true, 'public', '{}'::jsonb),
  ('news', '新闻', 'News module.', 'news', true, 'public', '{}'::jsonb),
  ('navigation', '公共导航', 'Public navigation module.', 'navigation', true, 'public', '{}'::jsonb),
  ('dmv', 'DMV', 'DMV practice module.', 'dmv', true, 'public', '{}'::jsonb),
  ('feedback', '线索与建议', 'Feedback and support tickets.', 'messages', true, 'public', '{}'::jsonb),
  ('favorites', '收藏', 'Unified user favorites.', 'users', true, 'public', '{}'::jsonb)
on conflict (key) do update set name = excluded.name, description = excluded.description, module = excluded.module, is_enabled = excluded.is_enabled, visibility = excluded.visibility, updated_at = now();

insert into public.home_sections (key, title, description, module, config, is_visible, sort_order)
values
  ('quick_grid', '快捷入口', 'Home quick channel links.', 'home', '{}'::jsonb, true, 10),
  ('utility_tools', '实用工具', 'Home utility tool cards.', 'home', '{}'::jsonb, true, 20),
  ('latest_posts', '最新发布', 'Latest public posts and news.', 'home', '{}'::jsonb, true, 30),
  ('seo_content', 'SEO 内容', 'Public home SEO content.', 'home', '{}'::jsonb, true, 90)
on conflict (key) do update set title = excluded.title, description = excluded.description, module = excluded.module, config = excluded.config, is_visible = excluded.is_visible, sort_order = excluded.sort_order, updated_at = now();

insert into public.top_quick_links (key, city_id, title, href, icon, open_mode, sort_order, is_active)
values
  ('jobs', 'ny', '招聘', '/jobs', 'briefcase-business', 'same', 10, true),
  ('housing', 'ny', '房屋', '/housing', 'building-2', 'same', 20, true),
  ('secondhand', 'ny', '二手', '/secondhand', 'shopping-bag', 'same', 30, true),
  ('services', 'ny', '服务', '/services', 'store', 'same', 40, true),
  ('news', 'ny', '新闻', '/news', 'newspaper', 'same', 50, true),
  ('dmv', 'ny', 'DMV', '/dmv', 'car-front', 'same', 60, true),
  ('navigation', 'ny', '导航', '/navigation', 'map', 'same', 70, true),
  ('feedback', 'ny', '线索与建议', '/feedback', 'message-square', 'same', 80, true)
on conflict (key) do update set city_id = excluded.city_id, title = excluded.title, href = excluded.href, icon = excluded.icon, open_mode = excluded.open_mode, sort_order = excluded.sort_order, is_active = excluded.is_active, updated_at = now();

insert into public.latest_ticker_global_settings (id, is_enabled, interval_seconds)
values (1, true, 5)
on conflict (id) do update set is_enabled = excluded.is_enabled, interval_seconds = excluded.interval_seconds;

insert into public.latest_ticker_sections (section_key, section_name, is_enabled, sort_order, display_count)
values
  ('job', '招聘', true, 10, 2),
  ('housing', '房屋', true, 20, 2),
  ('marketplace', '二手', true, 30, 2),
  ('service', '服务', true, 40, 2),
  ('news', '新闻', true, 50, 2)
on conflict (section_key) do update set section_name = excluded.section_name, is_enabled = excluded.is_enabled, sort_order = excluded.sort_order, display_count = excluded.display_count;

insert into public.support_ticket_settings (key, value)
values
  ('enabled', 'true'),
  ('daily_user_limit', '5'),
  ('daily_visitor_limit', '3'),
  ('daily_total_limit', '200'),
  ('content_min_length', '10'),
  ('content_max_length', '2000'),
  ('contact_max_length', '200'),
  ('related_url_max_length', '500')
on conflict (key) do update set value = excluded.value, updated_at = now();

insert into public.notification_templates (key, title, body, is_active)
values
  ('post_approved', '发布已通过', '你的发布已通过审核并展示。', true),
  ('post_rejected', '发布未通过', '你的发布未通过审核，请根据提示修改后再提交。', true),
  ('post_hidden', '发布已隐藏', '你的发布已被管理员隐藏。', true),
  ('post_restored', '发布已恢复', '你的发布已恢复显示。', true)
on conflict (key) do update set title = excluded.title, body = excluded.body, is_active = excluded.is_active, updated_at = now();
