-- See supabase/migrations/012_seed_feature_flags.sql for the full baseline list.
-- Keep this seed file as a local reset entry point. It is intentionally small in Phase 2.

insert into public.feature_flags (key, name, module, is_enabled, visibility, config)
values
  ('home', '首页', 'core', true, 'public', '{}'::jsonb),
  ('auth_email', '邮箱登录', 'auth', true, 'public', '{}'::jsonb),
  ('auth_google', 'Google 登录', 'auth', true, 'public', '{}'::jsonb),
  ('jobs', '招聘', 'posts', true, 'public', '{}'::jsonb),
  ('housing', '房屋', 'posts', true, 'public', '{}'::jsonb),
  ('marketplace', '二手市场', 'posts', true, 'public', '{}'::jsonb),
  ('services', '本地服务', 'posts', true, 'public', '{}'::jsonb),
  ('news', '新闻', 'content', true, 'public', '{}'::jsonb),
  ('dmv', 'DMV', 'dmv', true, 'public', '{}'::jsonb),
  ('navigation', '导航', 'navigation', true, 'public', '{}'::jsonb),
  ('admin_roles', '后台角色', 'admin', true, 'admin_only', '{}'::jsonb),
  ('comments', '评论', 'community', false, 'hidden', '{}'::jsonb),
  ('payments', '支付', 'commerce', false, 'hidden', '{}'::jsonb),
  ('orders', '订单', 'commerce', false, 'hidden', '{}'::jsonb),
  ('chats', '聊天', 'messaging', false, 'hidden', '{}'::jsonb)
on conflict (key) do update
set is_enabled = excluded.is_enabled,
    visibility = excluded.visibility,
    updated_at = now();
