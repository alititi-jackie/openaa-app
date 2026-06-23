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
  ('recycle_bin_user_retention_days', '{"days": 30}'::jsonb, false, 'Retention days for user-deleted posts.'),
  ('recycle_bin_admin_retention_days', '{"days": 90}'::jsonb, false, 'Retention days for admin-deleted posts.'),
  ('recycle_bin_news_retention_days', '{"days": 90}'::jsonb, false, 'Retention days for deleted news posts.')
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
  ('user-posts', 'view_post_contacts'),
  ('user-posts', 'moderate_posts'),
  ('user-posts', 'approve_posts'),
  ('user-posts', 'reject_posts'),
  ('user-posts', 'hide_posts'),
  ('user-posts', 'restore_posts'),
  ('user-posts', 'delete_posts'),
  ('messages', 'view_post_reports'),
  ('messages', 'handle_post_reports'),
  ('news', 'view_news'),
  ('news', 'create_news'),
  ('news', 'edit_news'),
  ('news', 'publish_news'),
  ('news', 'delete_news'),
  ('news', 'manage_news_categories'),
  ('navigation', 'manage_navigation'),
  ('navigation', 'manage_top_links'),
  ('home', 'manage_home_sections'),
  ('home', 'manage_latest_ticker'),
  ('ads', 'manage_ads'),
  ('users', 'view_users'),
  ('users', 'view_user_contacts'),
  ('users', 'edit_user_notes'),
  ('users', 'restrict_users'),
  ('users', 'ban_users'),
  ('users', 'restore_users'),
  ('users', 'manage_user_status'),
  ('users', 'view_user_posts'),
  ('settings', 'view_settings'),
  ('settings', 'manage_settings'),
  ('settings', 'manage_rate_limits'),
  ('settings', 'manage_sensitive_words'),
  ('settings', 'view_search_logs'),
  ('audit-logs', 'view_admin_audit_logs'),
  ('audit-logs', 'view_audit_logs'),
  ('recycle-bin', 'restore_posts'),
  ('recycle-bin', 'delete_posts'),
  ('recycle-bin', 'view_images'),
  ('recycle-bin', 'delete_images'),
  ('recycle-bin', 'manage_image_assets'),
  ('admin-access', 'view_admins'),
  ('admin-access', 'add_admins'),
  ('admin-access', 'edit_admin_roles'),
  ('admin-access', 'edit_admin_permissions'),
  ('admin-access', 'disable_admins'),
  ('admin-access', 'restore_admins'),
  ('admin-access', 'manage_admins')
on conflict (module_key, permission_key) do nothing;

insert into public.feature_flags (key, name, description, module, is_enabled, visibility, metadata)
values
  ('home', '首页', '首页 feature flag.', 'core', true, 'public', '{}'::jsonb),
  ('auth_email', '邮箱登录', '邮箱登录 feature flag.', 'auth', true, 'public', '{}'::jsonb),
  ('auth_google', 'Google 登录', 'Google 登录 feature flag.', 'auth', true, 'public', '{}'::jsonb),
  ('profiles', '用户资料', '用户资料 feature flag.', 'users', true, 'public', '{}'::jsonb),
  ('business_profiles_basic', '商家基础资料', '商家基础资料 feature flag.', 'users', true, 'public', '{}'::jsonb),
  ('jobs', '招聘', '招聘 feature flag.', 'posts', true, 'public', '{}'::jsonb),
  ('housing', '房屋', '房屋 feature flag.', 'posts', true, 'public', '{}'::jsonb),
  ('marketplace', '二手市场', '二手市场 feature flag.', 'posts', true, 'public', '{}'::jsonb),
  ('services', '本地服务', '本地服务 feature flag.', 'posts', true, 'public', '{}'::jsonb),
  ('news', '新闻', '新闻 feature flag.', 'content', true, 'public', '{}'::jsonb),
  ('dmv', 'DMV', 'DMV feature flag.', 'dmv', true, 'public', '{}'::jsonb),
  ('navigation', '导航', '导航 feature flag.', 'navigation', true, 'public', '{}'::jsonb),
  ('search_basic', '基础搜索', '基础搜索 feature flag.', 'search', true, 'public', '{}'::jsonb),
  ('favorites', '收藏', '收藏 feature flag.', 'users', true, 'public', '{}'::jsonb),
  ('recent_views', '最近浏览', '最近浏览 feature flag.', 'users', true, 'public', '{}'::jsonb),
  ('drafts', '草稿', '草稿 feature flag.', 'posts', true, 'public', '{}'::jsonb),
  ('feedback', '反馈', '反馈 feature flag.', 'feedback', true, 'public', '{}'::jsonb),
  ('reports', '举报', '举报 feature flag.', 'moderation', true, 'public', '{}'::jsonb),
  ('notifications_in_app', '站内通知', '站内通知 feature flag.', 'notifications', true, 'public', '{}'::jsonb),
  ('system_announcements', '系统公告', '系统公告 feature flag.', 'notifications', true, 'public', '{}'::jsonb),
  ('ads', '广告', '广告 feature flag.', 'operations', true, 'public', '{}'::jsonb),
  ('pwa', 'PWA', 'PWA feature flag.', 'app', true, 'public', '{}'::jsonb),
  ('seo', 'SEO', 'SEO feature flag.', 'seo', true, 'public', '{}'::jsonb),
  ('admin_roles', '后台角色', '后台角色 feature flag.', 'admin', true, 'admin_only', '{}'::jsonb),
  ('image_management', '图片管理', '图片管理 feature flag.', 'media', true, 'admin_only', '{}'::jsonb),
  ('auth_apple', 'Apple 登录', 'Apple 登录 feature flag.', 'auth', false, 'hidden', '{}'::jsonb),
  ('auth_wechat', '微信登录', '微信登录 feature flag.', 'auth', false, 'hidden', '{}'::jsonb),
  ('auth_phone', '手机号登录', '手机号登录 feature flag.', 'auth', false, 'hidden', '{}'::jsonb),
  ('web_push', '浏览器推送', '浏览器推送 feature flag.', 'notifications', false, 'hidden', '{}'::jsonb),
  ('native_push', '原生推送', '原生推送 feature flag.', 'notifications', false, 'hidden', '{}'::jsonb),
  ('comments', '评论', '评论 feature flag.', 'community', false, 'hidden', '{}'::jsonb),
  ('ratings', '评分', '评分 feature flag.', 'community', false, 'hidden', '{}'::jsonb),
  ('business_verification', '商家认证', '商家认证 feature flag.', 'business', false, 'hidden', '{}'::jsonb),
  ('business_public_pages', '商家主页', '商家主页 feature flag.', 'business', false, 'hidden', '{}'::jsonb),
  ('appointments', '预约', '预约 feature flag.', 'business', false, 'hidden', '{}'::jsonb),
  ('coupons', '优惠券', '优惠券 feature flag.', 'business', false, 'hidden', '{}'::jsonb),
  ('memberships', '会员', '会员 feature flag.', 'commerce', false, 'hidden', '{}'::jsonb),
  ('points', '积分', '积分 feature flag.', 'commerce', false, 'hidden', '{}'::jsonb),
  ('payments', '支付', '支付 feature flag.', 'commerce', false, 'hidden', '{}'::jsonb),
  ('orders', '订单', '订单 feature flag.', 'commerce', false, 'hidden', '{}'::jsonb),
  ('chats', '聊天', '聊天 feature flag.', 'messaging', false, 'hidden', '{}'::jsonb),
  ('rideshare', '拼车', '拼车 feature flag.', 'community', false, 'hidden', '{}'::jsonb),
  ('multi_city_public', '多城市前台', '多城市前台 feature flag.', 'cities', false, 'hidden', '{}'::jsonb),
  ('app_deep_links', 'APP 深链', 'APP 深链 feature flag.', 'app', false, 'hidden', '{}'::jsonb),
  ('ad_packages', '广告套餐', '广告套餐 feature flag.', 'operations', false, 'hidden', '{}'::jsonb)
on conflict (key) do update set name = excluded.name, description = excluded.description, module = excluded.module, is_enabled = excluded.is_enabled, visibility = excluded.visibility, updated_at = now();

insert into public.navigation_categories (slug, name, description, icon, display_limit, sort_order, is_active)
values
  ('featured', '热门推荐', '', null, 50, 10, true),
  ('government', '政府服务', '', null, 50, 20, true),
  ('finance', '银行金融', '', null, 50, 30, true),
  ('shopping', '购物平台', '', null, 50, 40, true),
  ('telecom', '通讯网络', '', null, 50, 50, true),
  ('ai', 'AI工具', '', null, 50, 60, true),
  ('video', '视频娱乐', '', null, 50, 70, true),
  ('social', '社交媒体', '', null, 50, 80, true),
  ('life', '生活服务', '', null, 50, 90, true),
  ('other', '其它', '', null, 50, 100, true)
on conflict (slug) do update set name = excluded.name, description = excluded.description, icon = excluded.icon, display_limit = excluded.display_limit, sort_order = excluded.sort_order, is_active = excluded.is_active, updated_at = now();

insert into public.navigation_links (category_id, title, description, url, icon, open_mode, sort_order, is_active, is_featured)
select c.id, seed.title, seed.description, seed.url, seed.icon, seed.open_mode, seed.sort_order, seed.is_active, seed.is_featured
from (
  values
    ('featured', 'OpenAA DMV 中文练习', '纽约 DMV 中文题库、模拟考试与罚单查询。', '/dmv', 'car-front', 'same', 10, true, true),
    ('featured', 'OpenAA 招聘', '纽约华人招聘、求职和兼职信息。', '/jobs', 'briefcase-business', 'same', 20, true, true),
    ('featured', 'OpenAA 房屋', '纽约租房、求租、合租和转租信息。', '/housing', 'building-2', 'same', 30, true, true),
    ('featured', 'OpenAA 新闻资讯', '纽约华人本地新闻、新手指南和平台公告。', '/news', 'newspaper', 'same', 40, true, true),
    ('government', 'NY DMV 官方网站', '纽约州 DMV 驾照、车辆注册和交通罚单官方入口。', 'https://dmv.ny.gov/', 'landmark', 'new', 10, true, false),
    ('government', 'USCIS', '美国移民局申请、案件状态和表格入口。', 'https://www.uscis.gov/', 'landmark', 'new', 20, true, false),
    ('government', 'IRS', '美国国税局报税、退税和税务信息入口。', 'https://www.irs.gov/', 'landmark', 'new', 30, true, false),
    ('government', 'SSA 社安局', '社会安全号、福利和账户服务入口。', 'https://www.ssa.gov/', 'landmark', 'new', 40, true, false),
    ('government', 'NYC 311', '纽约市政府服务、投诉和信息查询入口。', 'https://portal.311.nyc.gov/', 'landmark', 'new', 50, true, false),
    ('government', 'NYC Finance 罚单缴费', '纽约市停车罚单和车辆违规缴费入口。', 'https://www.nyc.gov/site/finance/vehicles/services-violation.page', 'landmark', 'new', 60, true, false),
    ('government', 'NY.gov', '纽约州政府服务统一入口。', 'https://www.ny.gov/', 'landmark', 'new', 70, true, false),
    ('finance', 'Chase', '大通银行网上银行入口。', 'https://www.chase.com/', 'credit-card', 'new', 10, true, false),
    ('finance', 'Bank of America', '美国银行网上银行入口。', 'https://www.bankofamerica.com/', 'credit-card', 'new', 20, true, false),
    ('finance', 'Citibank', '花旗银行网上银行入口。', 'https://www.citi.com/', 'credit-card', 'new', 30, true, false),
    ('finance', 'Capital One', 'Capital One 信用卡和银行账户入口。', 'https://www.capitalone.com/', 'credit-card', 'new', 40, true, false),
    ('finance', 'American Express', 'Amex 信用卡账户入口。', 'https://www.americanexpress.com/', 'credit-card', 'new', 50, true, false),
    ('finance', 'Credit Karma', '信用分和信用报告工具。', 'https://www.creditkarma.com/', 'credit-card', 'new', 60, true, false),
    ('shopping', 'Amazon', '亚马逊购物平台。', 'https://www.amazon.com/', 'shopping-bag', 'new', 10, true, false),
    ('shopping', 'Costco', 'Costco 会员超市与线上购物。', 'https://www.costco.com/', 'shopping-bag', 'new', 20, true, false),
    ('shopping', 'Walmart', 'Walmart 线上购物和门店服务。', 'https://www.walmart.com/', 'shopping-bag', 'new', 30, true, false),
    ('shopping', 'Target', 'Target 线上购物和门店服务。', 'https://www.target.com/', 'shopping-bag', 'new', 40, true, false),
    ('shopping', 'Best Buy', '电子产品和家电购物平台。', 'https://www.bestbuy.com/', 'shopping-bag', 'new', 50, true, false),
    ('shopping', 'Instacart', '超市配送和自提平台。', 'https://www.instacart.com/', 'shopping-bag', 'new', 60, true, false),
    ('telecom', 'Verizon', '手机、网络和账户服务入口。', 'https://www.verizon.com/', 'wifi', 'new', 10, true, false),
    ('telecom', 'T-Mobile', '手机套餐和账户服务入口。', 'https://www.t-mobile.com/', 'wifi', 'new', 20, true, false),
    ('telecom', 'AT&T', '手机、网络和账户服务入口。', 'https://www.att.com/', 'wifi', 'new', 30, true, false),
    ('telecom', 'Spectrum', '家庭网络和电视服务入口。', 'https://www.spectrum.com/', 'wifi', 'new', 40, true, false),
    ('telecom', 'Xfinity', '家庭网络和移动服务入口。', 'https://www.xfinity.com/', 'wifi', 'new', 50, true, false),
    ('ai', 'ChatGPT', 'OpenAI ChatGPT。', 'https://chatgpt.com/', 'bot', 'new', 10, true, false),
    ('ai', 'Claude', 'Anthropic Claude。', 'https://claude.ai/', 'bot', 'new', 20, true, false),
    ('ai', 'Gemini', 'Google Gemini。', 'https://gemini.google.com/', 'bot', 'new', 30, true, false),
    ('ai', 'Perplexity', 'AI 搜索和问答工具。', 'https://www.perplexity.ai/', 'bot', 'new', 40, true, false),
    ('ai', 'DeepL', '翻译和写作辅助工具。', 'https://www.deepl.com/', 'bot', 'new', 50, true, false),
    ('video', 'YouTube', '视频、频道和学习内容平台。', 'https://www.youtube.com/', 'play', 'new', 10, true, false),
    ('video', 'Netflix', '影视流媒体平台。', 'https://www.netflix.com/', 'play', 'new', 20, true, false),
    ('video', 'Disney+', 'Disney 流媒体平台。', 'https://www.disneyplus.com/', 'play', 'new', 30, true, false),
    ('video', 'Hulu', '影视流媒体平台。', 'https://www.hulu.com/', 'play', 'new', 40, true, false),
    ('video', 'Spotify', '音乐和播客平台。', 'https://www.spotify.com/', 'play', 'new', 50, true, false),
    ('social', '微信网页版', '微信网页版入口。', 'https://web.wechat.com/', 'message-circle', 'new', 10, true, false),
    ('social', 'Xiaohongshu', '小红书海外访问入口。', 'https://www.xiaohongshu.com/', 'message-circle', 'new', 20, true, false),
    ('social', 'Facebook', '社交媒体平台。', 'https://www.facebook.com/', 'message-circle', 'new', 30, true, false),
    ('social', 'Instagram', '图片和短视频社交平台。', 'https://www.instagram.com/', 'message-circle', 'new', 40, true, false),
    ('social', 'LinkedIn', '职业社交和招聘平台。', 'https://www.linkedin.com/', 'message-circle', 'new', 50, true, false),
    ('life', 'Google Maps', '地图、路线和商家查询。', 'https://maps.google.com/', 'map', 'new', 10, true, false),
    ('life', 'MTA', '纽约公共交通路线和服务状态。', 'https://new.mta.info/', 'train', 'new', 20, true, false),
    ('life', 'Uber', '打车和出行服务。', 'https://www.uber.com/', 'car', 'new', 30, true, false),
    ('life', 'DoorDash', '外卖配送平台。', 'https://www.doordash.com/', 'utensils', 'new', 40, true, false),
    ('life', 'Zillow', '房源和租售信息平台。', 'https://www.zillow.com/', 'home', 'new', 50, true, false),
    ('life', 'Indeed', '招聘和求职搜索平台。', 'https://www.indeed.com/', 'briefcase-business', 'new', 60, true, false),
    ('other', 'Gmail', 'Google 邮箱入口。', 'https://mail.google.com/', 'mail', 'new', 10, true, false),
    ('other', 'Google Translate', 'Google 翻译。', 'https://translate.google.com/', 'languages', 'new', 20, true, false),
    ('other', 'Wikipedia', '百科资料查询。', 'https://www.wikipedia.org/', 'book-open', 'new', 30, true, false),
    ('other', 'Zoom', '视频会议平台。', 'https://zoom.us/', 'video', 'new', 40, true, false)
) as seed(category_slug, title, description, url, icon, open_mode, sort_order, is_active, is_featured)
join public.navigation_categories c on c.slug = seed.category_slug
where not exists (
  select 1 from public.navigation_links existing
  where existing.url = seed.url and existing.title = seed.title and existing.deleted_at is null
);

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
  ('news', '新闻', true, 50, 2),
  ('dmv', 'DMV', true, 60, 2),
  ('navigation', '导航', true, 70, 2)
on conflict (section_key) do update set section_name = excluded.section_name, is_enabled = excluded.is_enabled, sort_order = excluded.sort_order, display_count = excluded.display_count;

insert into public.latest_ticker (title, href, module, is_enabled, sort_order)
values
  ('OpenAA 纽约站上线：招聘、房屋、二手、服务和 DMV 工具已开放。', '/news', 'news', true, 10),
  ('DMV 中文题库已整理完成，可直接练习和模拟考试。', '/dmv', 'dmv', true, 20),
  ('常用网站导航已提供首版分类和入口。', '/navigation', 'navigation', true, 30)
;

insert into public.dmv_questions (state, language, source_version, source_question_id, category, question_text, options, correct_answer, explanation, difficulty, is_active, sort_order, metadata)
values
  ('NY', 'zh-CN', '2026-05-15', '1', 'traffic-signs', '看到这个标志时，驾驶员必须怎么做？', '{"choices":["减速后继续行驶","完全停车，确认安全后再行驶","鸣笛后通过","只在有行人时停车"],"answerIndex":1,"legacyId":"1","tags":["sign","stop"]}'::jsonb, '完全停车，确认安全后再行驶', 'STOP 标志表示必须完全停车。', 'easy', true, 1, '{"image_url":"https://img.openaa.com/img/dmv/ny/signs/stop-sign.png","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '2', 'traffic-signs', '这个标志表示什么？', '{"choices":["停车","靠右","让路，必要时停车","禁止驶入"],"answerIndex":2,"legacyId":"2","tags":["sign","yield"]}'::jsonb, '让路，必要时停车', 'YIELD 表示让路。', 'easy', true, 2, '{"image_url":"https://img.openaa.com/img/dmv/ny/signs/yield-sign.png","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '3', 'traffic-signs', '这个标志提醒你什么？', '{"choices":["前方有交通信号灯","前方铁路","前方医院","前方学校"],"answerIndex":0,"legacyId":"3","tags":["sign"]}'::jsonb, '前方有交通信号灯', '交通灯图案表示前方有信号灯。', 'easy', true, 3, '{"image_url":"https://img.openaa.com/img/dmv/ny/signs/traffic-signal-ahead.png","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '4', 'traffic-signs', '这个标志表示什么？', '{"choices":["禁止左转","禁止掉头","只能左转","禁止驶入"],"answerIndex":0,"legacyId":"4","tags":["sign"]}'::jsonb, '禁止左转', '红圈斜线加左转箭头表示禁止左转。', 'easy', true, 4, '{"image_url":"https://img.openaa.com/img/dmv/ny/signs/no-left-turn.png","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '5', 'traffic-signs', '这个标志表示什么？', '{"choices":["禁止左转","禁止掉头","靠右行驶","前方双向交通"],"answerIndex":1,"legacyId":"5","tags":["sign"]}'::jsonb, '禁止掉头', 'U 形箭头上有红色斜线，表示禁止掉头。', 'easy', true, 5, '{"image_url":"https://img.openaa.com/img/dmv/ny/signs/no-u-turn.png","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '6', 'traffic-signs', '看到这个标志应怎样行驶？', '{"choices":["靠左","靠右","停车","禁止进入"],"answerIndex":1,"legacyId":"6","tags":["sign"]}'::jsonb, '靠右', 'KEEP RIGHT 表示应靠右通过。', 'easy', true, 6, '{"image_url":"https://img.openaa.com/img/dmv/ny/signs/keep-right.png","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '7', 'traffic-signs', '这个标志表示什么？', '{"choices":["禁止驶入","让路","停车","单行道"],"answerIndex":0,"legacyId":"7","tags":["sign"]}'::jsonb, '禁止驶入', 'DO NOT ENTER 表示禁止从该方向进入。', 'easy', true, 7, '{"image_url":"https://img.openaa.com/img/dmv/ny/signs/do-not-enter.png","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '8', 'traffic-signs', '这个标志提醒你什么？', '{"choices":["路面湿滑","前方施工","前方学校","前方铁路"],"answerIndex":0,"legacyId":"8","tags":["sign","weather"]}'::jsonb, '路面湿滑', '汽车打滑图案表示湿滑路面。', 'easy', true, 8, '{"image_url":"https://img.openaa.com/img/dmv/ny/signs/slippery-when-wet.png","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '9', 'traffic-signs', '这个标志通常表示什么？', '{"choices":["铁路道口","学校区域","医院方向","禁止停车"],"answerIndex":0,"legacyId":"9","tags":["sign"]}'::jsonb, '铁路道口', '黄色 RR 标志提醒前方铁路平交道。', 'easy', true, 9, '{"image_url":"https://img.openaa.com/img/dmv/ny/signs/railroad-crossing.png","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '10', 'traffic-signs', '这个标志提醒驾驶员什么？', '{"choices":["学校区域或学生过街","前方医院","前方施工","前方禁止通行"],"answerIndex":0,"legacyId":"10","tags":["sign"]}'::jsonb, '学校区域或学生过街', '学校标志提醒有学生或儿童过街。', 'easy', true, 10, '{"image_url":"https://img.openaa.com/img/dmv/ny/signs/school-crossing.png","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '11', 'traffic-signs', '这个标志表示什么？', '{"choices":["双向交通","单行道","分隔公路结束","车道结束"],"answerIndex":0,"legacyId":"11","tags":["sign"]}'::jsonb, '双向交通', '两个相反方向箭头表示双向交通。', 'easy', true, 11, '{"image_url":"https://img.openaa.com/img/dmv/ny/signs/two-way-traffic.png","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '12', 'traffic-signs', '这个标志表示什么？', '{"choices":["右车道结束，向左合并","左转专用","前方禁止通行","停车让行"],"answerIndex":0,"legacyId":"12","tags":["sign","merge"]}'::jsonb, '右车道结束，向左合并', '车道结束标志提醒应提前安全合并。', 'medium', true, 12, '{"image_url":"https://img.openaa.com/img/dmv/ny/signs/signsmerge-left.png","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '13', 'traffic-signs', '这个标志表示什么？', '{"choices":["分隔公路开始","分隔公路结束","前方铁路","道路封闭"],"answerIndex":1,"legacyId":"13","tags":["sign"]}'::jsonb, '分隔公路结束', '分隔公路结束表示前方道路结构改变。', 'medium', true, 13, '{"image_url":"https://img.openaa.com/img/dmv/ny/signs/divided-highway-ends.png","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '14', 'traffic-signs', '这个标志提醒什么？', '{"choices":["前方下坡","前方上坡","前方医院","前方湿滑"],"answerIndex":0,"legacyId":"14","tags":["sign"]}'::jsonb, '前方下坡', '卡车下坡图案提醒前方坡道。', 'easy', true, 14, '{"image_url":"https://img.openaa.com/img/dmv/ny/signs/hill-ahead.png","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '15', 'traffic-signs', '这个标志通常表示什么？', '{"choices":["医院或医疗服务方向","学校区域","停车场","施工区"],"answerIndex":0,"legacyId":"15","tags":["sign"]}'::jsonb, '医院或医疗服务方向', '蓝底白色 H 表示医院或医疗服务方向。', 'easy', true, 15, '{"image_url":"https://img.openaa.com/img/dmv/ny/signs/hospital-sign.png","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '16', 'traffic-signs', '这个标志表示什么？', '{"choices":["右侧车辆汇入主路","只能右转","禁止并线","前方双向交通"],"answerIndex":0,"legacyId":"16","tags":["sign","merge"]}'::jsonb, '右侧车辆汇入主路', '合流标志提醒右侧车流可能并入。', 'medium', true, 16, '{"image_url":"https://img.openaa.com/img/dmv/ny/signs/merging-traffic-right.png","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '17', 'traffic-control', '红灯闪烁时，驾驶员应如何处理？', '{"choices":["像停车标志一样完全停车，再确认安全通过","快速通过","只减速不停车","按喇叭后通过"],"answerIndex":0,"legacyId":"17","tags":["red-light"]}'::jsonb, '像停车标志一样完全停车，再确认安全通过', '闪烁红灯通常按 STOP 处理。', 'easy', true, 17, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '18', 'traffic-control', '黄灯闪烁通常表示什么？', '{"choices":["必须停车","小心减速通过","可以加速通过","禁止通行"],"answerIndex":1,"legacyId":"18","tags":["yellow-light"]}'::jsonb, '小心减速通过', '闪烁黄灯表示警告，应减速并小心通过。', 'easy', true, 18, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '19', 'traffic-control', '交通警察指挥与交通灯冲突时，应听谁的？', '{"choices":["交通灯","交通警察","路边标志","先到先走"],"answerIndex":1,"legacyId":"19","tags":["police"]}'::jsonb, '交通警察', '现场交通警察或执法人员的指挥优先。', 'easy', true, 19, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '20', 'traffic-control', '绿色箭头亮起时，驾驶员应怎样做？', '{"choices":["可以按箭头方向通行，但仍需注意行人和车辆","必须停车","可以向任意方向行驶","只能直行"],"answerIndex":0,"legacyId":"20","tags":["green-arrow"]}'::jsonb, '可以按箭头方向通行，但仍需注意行人和车辆', '绿色箭头允许按箭头方向行驶，但仍要注意安全。', 'easy', true, 20, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '21', 'traffic-control', '双黄实线通常表示什么？', '{"choices":["可随时超车","两方向车流分隔，通常不得越线超车","只给公交车使用","道路施工"],"answerIndex":1,"legacyId":"21","tags":["pavement"]}'::jsonb, '两方向车流分隔，通常不得越线超车', '双黄实线通常禁止越线超车。', 'easy', true, 21, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '22', 'traffic-control', '白色虚线分隔同方向车道时表示什么？', '{"choices":["不得变道","在安全情况下可以变道","必须停车","只供紧急车辆使用"],"answerIndex":1,"legacyId":"22","tags":["lane"]}'::jsonb, '在安全情况下可以变道', '白色虚线通常分隔同方向车道。', 'easy', true, 22, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '23', 'right-of-way', '没有信号灯的十字路口，两车同时到达时，谁先行？', '{"choices":["左边车辆","右边车辆","车速快的车辆","较大的车辆"],"answerIndex":1,"legacyId":"23","tags":["intersection"]}'::jsonb, '右边车辆', '在没有控制标志的路口同时到达时，通常让右侧车辆先行。', 'easy', true, 23, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '24', 'right-of-way', '左转车辆遇到对向直行车辆时，应怎样做？', '{"choices":["左转车先走","让对向直行车辆先行","按喇叭要求对方停车","加速抢过"],"answerIndex":1,"legacyId":"24","tags":["left-turn"]}'::jsonb, '让对向直行车辆先行', '左转通常要让对向直行车辆和行人先行。', 'easy', true, 24, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '25', 'right-of-way', '从私人车道驶入道路时，应如何处理？', '{"choices":["主路车辆让你","让道路上的车辆和行人先行","快速驶入","按喇叭后驶入"],"answerIndex":1,"legacyId":"25","tags":["driveway"]}'::jsonb, '让道路上的车辆和行人先行', '从车道、停车场或小巷进入道路时，应让行。', 'easy', true, 25, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '26', 'right-of-way', '行人在合法横道内过街时，驾驶员应怎样做？', '{"choices":["减速或停车让行","鸣笛让行人快走","绕过行人","只在绿灯时让行"],"answerIndex":0,"legacyId":"26","tags":["pedestrian"]}'::jsonb, '减速或停车让行', '行人在合法横道内有优先权。', 'easy', true, 26, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '27', 'right-of-way', '盲人携带白色手杖或导盲犬过街时，驾驶员应怎样做？', '{"choices":["鸣笛提醒","继续行驶","必须让行","只在有信号灯时让行"],"answerIndex":2,"legacyId":"27","tags":["pedestrian"]}'::jsonb, '必须让行', '盲人使用白杖或导盲犬过街时，驾驶员必须让行。', 'easy', true, 27, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '28', 'right-of-way', '听到或看到紧急车辆警灯警报时，应怎样做？', '{"choices":["立即停在原车道","安全靠右停车，让紧急车辆通过","加速离开","跟在紧急车辆后面"],"answerIndex":1,"legacyId":"28","tags":["emergency"]}'::jsonb, '安全靠右停车，让紧急车辆通过', '应安全靠右并停车，直到紧急车辆通过。', 'easy', true, 28, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '29', 'right-of-way', '校车红灯闪烁并停车上下学生时，纽约驾驶员通常应怎样做？', '{"choices":["同向车辆才停车","双向车辆都必须停车","只减速即可","如果看不到学生可通过"],"answerIndex":1,"legacyId":"29","tags":["school-bus"]}'::jsonb, '双向车辆都必须停车', '纽约校车红灯闪烁时，通常双向交通都必须停车。', 'easy', true, 29, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '30', 'turns', '右转前应怎样准备？', '{"choices":["尽量靠右并提前打转向灯","从道路左侧右转","不需要打灯","转弯时再看后视镜"],"answerIndex":0,"legacyId":"30","tags":["right-turn"]}'::jsonb, '尽量靠右并提前打转向灯', '右转前应提前打灯、靠右、观察行人和自行车。', 'easy', true, 30, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '31', 'turns', '左转前应怎样做？', '{"choices":["不需打灯","提前打左转灯并让对向车辆和行人","尽量靠右转","停车后倒车"],"answerIndex":1,"legacyId":"31","tags":["left-turn"]}'::jsonb, '提前打左转灯并让对向车辆和行人', '左转前应提前打灯，观察对向车辆、行人和自行车。', 'easy', true, 31, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '32', 'turns', '在路口等左转时，方向盘最好怎样放？', '{"choices":["提前向左打死","保持车轮直行方向","向右打","随意"],"answerIndex":1,"legacyId":"32","tags":["left-turn"]}'::jsonb, '保持车轮直行方向', '等待左转时保持车轮直行更安全。', 'medium', true, 32, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '33', 'turns', '错过高速公路出口时，应怎样做？', '{"choices":["倒车回出口","在路肩掉头","继续到下一个出口","立即停车"],"answerIndex":2,"legacyId":"33","tags":["highway"]}'::jsonb, '继续到下一个出口', '错过出口时应继续到下一个出口。', 'easy', true, 33, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '34', 'turns', '黄灯亮起时，你已接近路口但能安全停车，应怎样做？', '{"choices":["加速冲过","准备停车","鸣笛通过","换到左车道"],"answerIndex":1,"legacyId":"34","tags":["traffic-light"]}'::jsonb, '准备停车', '黄灯表示即将变红，如果能安全停车，应停车等待。', 'easy', true, 34, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '35', 'passing-lanes', '变道前最重要的动作是什么？', '{"choices":["只看前方","打灯、看镜子并检查盲点","加速","按喇叭"],"answerIndex":1,"legacyId":"35","tags":["blind-spot"]}'::jsonb, '打灯、看镜子并检查盲点', '变道前应打灯、看镜子，并转头检查盲点。', 'easy', true, 35, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '36', 'passing-lanes', '盲点是什么？', '{"choices":["车灯照不到的地方","镜子不容易看到的区域","只有夜间存在","车头前方区域"],"answerIndex":1,"legacyId":"36","tags":["blind-spot"]}'::jsonb, '镜子不容易看到的区域', '盲点是镜子不容易看到的区域。', 'easy', true, 36, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '37', 'passing-lanes', '超车通常应从哪一侧进行？', '{"choices":["右侧","左侧","路肩","任意方向"],"answerIndex":1,"legacyId":"37","tags":["passing"]}'::jsonb, '左侧', '大多数情况下应从左侧超车。', 'easy', true, 37, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '38', 'passing-lanes', '何时绝对不应超车？', '{"choices":["前车为行人停车时","道路很直时","白天时","前车慢时"],"answerIndex":0,"legacyId":"38","tags":["passing"]}'::jsonb, '前车为行人停车时', '前车为行人停车时，不得从旁边超车。', 'medium', true, 38, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '39', 'parking', '消防栓附近停车至少应保持多远？', '{"choices":["5英尺","10英尺","15英尺","30英尺"],"answerIndex":2,"legacyId":"39","tags":["parking"]}'::jsonb, '15英尺', '纽约通常要求车辆不能停在消防栓 15 英尺以内。', 'easy', true, 39, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '40', 'parking', '车辆停在路边时，离路缘石最远通常不得超过多少？', '{"choices":["6英寸","12英寸","18英寸","3英尺"],"answerIndex":1,"legacyId":"40","tags":["parking"]}'::jsonb, '12英寸', '平行停车时通常不得超过路缘 12 英寸。', 'medium', true, 40, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '41', 'parking', '上坡且有路缘石停车时，前轮应怎样打？', '{"choices":["向左，远离路缘石","向右，靠向路缘石","保持直","随意"],"answerIndex":0,"legacyId":"41","tags":["parking"]}'::jsonb, '向左，远离路缘石', '上坡有路缘石时，前轮通常向左。', 'medium', true, 41, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '42', 'parking', '下坡停车时，前轮通常应怎样打？', '{"choices":["向路缘石方向","离开路缘石方向","保持直","向左"],"answerIndex":0,"legacyId":"42","tags":["parking"]}'::jsonb, '向路缘石方向', '下坡停车时前轮应向路缘石方向。', 'medium', true, 42, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '43', 'speed-weather', '纽约州普通道路若没有其它限速标志，常见最高限速是多少？', '{"choices":["45 mph","55 mph","65 mph","75 mph"],"answerIndex":1,"legacyId":"43","tags":["speed"]}'::jsonb, '55 mph', '纽约州很多普通道路默认最高限速为 55 mph，具体以标志为准。', 'easy', true, 43, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '44', 'speed-weather', '安全车速取决于什么？', '{"choices":["只取决于限速牌","天气、道路、交通和能见度等情况","司机心情","车辆价格"],"answerIndex":1,"legacyId":"44","tags":["speed"]}'::jsonb, '天气、道路、交通和能见度等情况', '安全速度要根据道路、天气、交通和能见度调整。', 'easy', true, 44, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '45', 'speed-weather', '雨天或湿滑路面应怎样调整驾驶？', '{"choices":["保持平时速度","减速并增加跟车距离","急刹测试路面","频繁变道"],"answerIndex":1,"legacyId":"45","tags":["weather"]}'::jsonb, '减速并增加跟车距离', '湿滑路面制动距离变长，应减速并增加距离。', 'easy', true, 45, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '46', 'speed-weather', '车辆开始打滑时，通常应怎样做？', '{"choices":["急刹车","朝车尾滑动方向轻转方向盘并避免急刹","猛打反方向","加速"],"answerIndex":1,"legacyId":"46","tags":["skid"]}'::jsonb, '朝车尾滑动方向轻转方向盘并避免急刹', '打滑时应保持冷静，避免急刹和猛打方向。', 'medium', true, 46, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '47', 'highway', '高速公路和普通道路主要区别之一是什么？', '{"choices":["高速公路车速通常更高，需要更早观察和判断","高速公路没有规则","高速公路不能变道","高速公路只能夜间用"],"answerIndex":0,"legacyId":"47","tags":["highway"]}'::jsonb, '高速公路车速通常更高，需要更早观察和判断', '高速公路速度高，更需要保持距离和提前判断。', 'easy', true, 47, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '48', 'highway', '从高速公路出口驶入普通道路时，应注意什么？', '{"choices":["保持高速公路速度","看速度表并降低到较低限速","立即停车","关掉车灯"],"answerIndex":1,"legacyId":"48","tags":["highway"]}'::jsonb, '看速度表并降低到较低限速', '离开高速后应看速度表并减速。', 'medium', true, 48, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '49', 'alcohol-drugs', '纽约通常以多少 BAC 作为醉酒驾驶 DWI 的重要标准？', '{"choices":["0.02%","0.05%","0.08%","0.20%"],"answerIndex":2,"legacyId":"49","tags":["alcohol"]}'::jsonb, '0.08%', '在纽约，BAC 0.08% 或以上通常构成 DWI 的重要证据。', 'easy', true, 49, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '50', 'alcohol-drugs', '酒精对驾驶的影响包括什么？', '{"choices":["反应变快","判断力和反应能力下降","视力更好","更容易集中"],"answerIndex":1,"legacyId":"50","tags":["alcohol"]}'::jsonb, '判断力和反应能力下降', '酒精会降低判断、反应和控制能力。', 'easy', true, 50, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '51', 'alcohol-drugs', '使酒精离开身体最可靠的方法是什么？', '{"choices":["喝咖啡","冷水浴","时间和休息","运动出汗"],"answerIndex":2,"legacyId":"51","tags":["alcohol"]}'::jsonb, '时间和休息', '身体需要时间代谢酒精。', 'easy', true, 51, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '52', 'safety', '安全带什么时候应该使用？', '{"choices":["只在高速公路","只在长途","每次驾车，驾驶员和乘客都应使用","只在下雨时"],"answerIndex":2,"legacyId":"52","tags":["seat-belt"]}'::jsonb, '每次驾车，驾驶员和乘客都应使用', '每次行车都应系安全带。', 'easy', true, 52, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '53', 'safety', '防卫驾驶的核心是什么？', '{"choices":["只看前方","预判他人可能犯错并保持安全空间","总是开得更快","相信别人会让你"],"answerIndex":1,"legacyId":"53","tags":["defensive"]}'::jsonb, '预判他人可能犯错并保持安全空间', '防卫驾驶强调观察、预判和保留安全空间。', 'easy', true, 53, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '54', 'sharing-road', '遇到骑自行车者时应怎样做？', '{"choices":["贴近通过","保持安全距离并耐心通过","鸣笛逼其靠边","从路肩超越"],"answerIndex":1,"legacyId":"54","tags":["bicycle"]}'::jsonb, '保持安全距离并耐心通过', '自行车也是道路使用者，应保持安全距离。', 'easy', true, 54, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '55', 'law', '发生有人受伤或死亡的交通事故时，应怎样做？', '{"choices":["立即离开","停车、提供信息并按规定报警/报告","只给保险公司打电话","只拍照片"],"answerIndex":1,"legacyId":"55","tags":["crash"]}'::jsonb, '停车、提供信息并按规定报警/报告', '发生伤亡事故时必须停车、协助并按要求报告。', 'easy', true, 55, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '56', 'law', '驾驶执照地址变更后，通常应多快通知 DMV？', '{"choices":["10天内","30天内","半年内","不需要"],"answerIndex":0,"legacyId":"56","tags":["license"]}'::jsonb, '10天内', '纽约驾驶执照地址变更通常需要在 10 天内通知 DMV。', 'medium', true, 56, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '57', 'road-signs-general', '红色交通标志通常传达什么含义？', '{"choices":["服务信息","禁止、停止或让行","风景区","高速出口"],"answerIndex":1,"legacyId":"57","tags":["sign-color"]}'::jsonb, '禁止、停止或让行', '红色常用于 STOP、YIELD、DO NOT ENTER 等。', 'easy', true, 57, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '58', 'road-signs-general', '黄色菱形标志通常是什么类型？', '{"choices":["警告标志","服务标志","停车许可","医院方向"],"answerIndex":0,"legacyId":"58","tags":["sign-shape"]}'::jsonb, '警告标志', '黄色菱形一般是警告标志。', 'easy', true, 58, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '59', 'road-signs-general', '八边形标志几乎总是表示什么？', '{"choices":["停车","让路","铁路","医院"],"answerIndex":0,"legacyId":"59","tags":["sign-shape"]}'::jsonb, '停车', '八边形红色标志是 STOP。', 'easy', true, 59, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '60', 'traffic-control', '常见题：红灯闪烁时，驾驶员应如何处理？', '{"choices":["像停车标志一样完全停车，再确认安全通过","快速通过","只减速不停车","按喇叭后通过"],"answerIndex":0,"legacyId":"60","tags":["red-light"]}'::jsonb, '像停车标志一样完全停车，再确认安全通过', '闪烁红灯通常按 STOP 处理。', 'easy', true, 60, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '61', 'traffic-control', '练习题：黄灯闪烁通常表示什么？', '{"choices":["必须停车","小心减速通过","可以加速通过","禁止通行"],"answerIndex":1,"legacyId":"61","tags":["yellow-light"]}'::jsonb, '小心减速通过', '闪烁黄灯表示警告，应减速并小心通过。', 'easy', true, 61, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '62', 'traffic-control', '复习题：交通警察指挥与交通灯冲突时，应听谁的？', '{"choices":["交通灯","交通警察","路边标志","先到先走"],"answerIndex":1,"legacyId":"62","tags":["police"]}'::jsonb, '交通警察', '现场交通警察或执法人员的指挥优先。', 'easy', true, 62, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '63', 'traffic-control', '模拟题：绿色箭头亮起时，驾驶员应怎样做？', '{"choices":["可以按箭头方向通行，但仍需注意行人和车辆","必须停车","可以向任意方向行驶","只能直行"],"answerIndex":0,"legacyId":"63","tags":["green-arrow"]}'::jsonb, '可以按箭头方向通行，但仍需注意行人和车辆', '绿色箭头允许按箭头方向行驶，但仍要注意安全。', 'easy', true, 63, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '64', 'traffic-control', '常见题：双黄实线通常表示什么？', '{"choices":["可随时超车","两方向车流分隔，通常不得越线超车","只给公交车使用","道路施工"],"answerIndex":1,"legacyId":"64","tags":["pavement"]}'::jsonb, '两方向车流分隔，通常不得越线超车', '双黄实线通常禁止越线超车。', 'easy', true, 64, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '65', 'traffic-control', '练习题：白色虚线分隔同方向车道时表示什么？', '{"choices":["不得变道","在安全情况下可以变道","必须停车","只供紧急车辆使用"],"answerIndex":1,"legacyId":"65","tags":["lane"]}'::jsonb, '在安全情况下可以变道', '白色虚线通常分隔同方向车道。', 'easy', true, 65, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '66', 'right-of-way', '复习题：没有信号灯的十字路口，两车同时到达时，谁先行？', '{"choices":["左边车辆","右边车辆","车速快的车辆","较大的车辆"],"answerIndex":1,"legacyId":"66","tags":["intersection"]}'::jsonb, '右边车辆', '在没有控制标志的路口同时到达时，通常让右侧车辆先行。', 'easy', true, 66, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '67', 'right-of-way', '模拟题：左转车辆遇到对向直行车辆时，应怎样做？', '{"choices":["左转车先走","让对向直行车辆先行","按喇叭要求对方停车","加速抢过"],"answerIndex":1,"legacyId":"67","tags":["left-turn"]}'::jsonb, '让对向直行车辆先行', '左转通常要让对向直行车辆和行人先行。', 'easy', true, 67, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '68', 'right-of-way', '常见题：从私人车道驶入道路时，应如何处理？', '{"choices":["主路车辆让你","让道路上的车辆和行人先行","快速驶入","按喇叭后驶入"],"answerIndex":1,"legacyId":"68","tags":["driveway"]}'::jsonb, '让道路上的车辆和行人先行', '从车道、停车场或小巷进入道路时，应让行。', 'easy', true, 68, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '69', 'right-of-way', '练习题：行人在合法横道内过街时，驾驶员应怎样做？', '{"choices":["减速或停车让行","鸣笛让行人快走","绕过行人","只在绿灯时让行"],"answerIndex":0,"legacyId":"69","tags":["pedestrian"]}'::jsonb, '减速或停车让行', '行人在合法横道内有优先权。', 'easy', true, 69, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '70', 'right-of-way', '复习题：盲人携带白色手杖或导盲犬过街时，驾驶员应怎样做？', '{"choices":["鸣笛提醒","继续行驶","必须让行","只在有信号灯时让行"],"answerIndex":2,"legacyId":"70","tags":["pedestrian"]}'::jsonb, '必须让行', '盲人使用白杖或导盲犬过街时，驾驶员必须让行。', 'easy', true, 70, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '71', 'right-of-way', '模拟题：听到或看到紧急车辆警灯警报时，应怎样做？', '{"choices":["立即停在原车道","安全靠右停车，让紧急车辆通过","加速离开","跟在紧急车辆后面"],"answerIndex":1,"legacyId":"71","tags":["emergency"]}'::jsonb, '安全靠右停车，让紧急车辆通过', '应安全靠右并停车，直到紧急车辆通过。', 'easy', true, 71, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '72', 'right-of-way', '常见题：校车红灯闪烁并停车上下学生时，纽约驾驶员通常应怎样做？', '{"choices":["同向车辆才停车","双向车辆都必须停车","只减速即可","如果看不到学生可通过"],"answerIndex":1,"legacyId":"72","tags":["school-bus"]}'::jsonb, '双向车辆都必须停车', '纽约校车红灯闪烁时，通常双向交通都必须停车。', 'easy', true, 72, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '73', 'turns', '练习题：右转前应怎样准备？', '{"choices":["尽量靠右并提前打转向灯","从道路左侧右转","不需要打灯","转弯时再看后视镜"],"answerIndex":0,"legacyId":"73","tags":["right-turn"]}'::jsonb, '尽量靠右并提前打转向灯', '右转前应提前打灯、靠右、观察行人和自行车。', 'easy', true, 73, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '74', 'turns', '复习题：左转前应怎样做？', '{"choices":["不需打灯","提前打左转灯并让对向车辆和行人","尽量靠右转","停车后倒车"],"answerIndex":1,"legacyId":"74","tags":["left-turn"]}'::jsonb, '提前打左转灯并让对向车辆和行人', '左转前应提前打灯，观察对向车辆、行人和自行车。', 'easy', true, 74, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '75', 'turns', '模拟题：在路口等左转时，方向盘最好怎样放？', '{"choices":["提前向左打死","保持车轮直行方向","向右打","随意"],"answerIndex":1,"legacyId":"75","tags":["left-turn"]}'::jsonb, '保持车轮直行方向', '等待左转时保持车轮直行更安全。', 'medium', true, 75, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '76', 'turns', '常见题：错过高速公路出口时，应怎样做？', '{"choices":["倒车回出口","在路肩掉头","继续到下一个出口","立即停车"],"answerIndex":2,"legacyId":"76","tags":["highway"]}'::jsonb, '继续到下一个出口', '错过出口时应继续到下一个出口。', 'easy', true, 76, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '77', 'turns', '练习题：黄灯亮起时，你已接近路口但能安全停车，应怎样做？', '{"choices":["加速冲过","准备停车","鸣笛通过","换到左车道"],"answerIndex":1,"legacyId":"77","tags":["traffic-light"]}'::jsonb, '准备停车', '黄灯表示即将变红，如果能安全停车，应停车等待。', 'easy', true, 77, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '78', 'passing-lanes', '复习题：变道前最重要的动作是什么？', '{"choices":["只看前方","打灯、看镜子并检查盲点","加速","按喇叭"],"answerIndex":1,"legacyId":"78","tags":["blind-spot"]}'::jsonb, '打灯、看镜子并检查盲点', '变道前应打灯、看镜子，并转头检查盲点。', 'easy', true, 78, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '79', 'passing-lanes', '模拟题：盲点是什么？', '{"choices":["车灯照不到的地方","镜子不容易看到的区域","只有夜间存在","车头前方区域"],"answerIndex":1,"legacyId":"79","tags":["blind-spot"]}'::jsonb, '镜子不容易看到的区域', '盲点是镜子不容易看到的区域。', 'easy', true, 79, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '80', 'passing-lanes', '常见题：超车通常应从哪一侧进行？', '{"choices":["右侧","左侧","路肩","任意方向"],"answerIndex":1,"legacyId":"80","tags":["passing"]}'::jsonb, '左侧', '大多数情况下应从左侧超车。', 'easy', true, 80, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '81', 'passing-lanes', '练习题：何时绝对不应超车？', '{"choices":["前车为行人停车时","道路很直时","白天时","前车慢时"],"answerIndex":0,"legacyId":"81","tags":["passing"]}'::jsonb, '前车为行人停车时', '前车为行人停车时，不得从旁边超车。', 'medium', true, 81, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '82', 'parking', '复习题：消防栓附近停车至少应保持多远？', '{"choices":["5英尺","10英尺","15英尺","30英尺"],"answerIndex":2,"legacyId":"82","tags":["parking"]}'::jsonb, '15英尺', '纽约通常要求车辆不能停在消防栓 15 英尺以内。', 'easy', true, 82, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '83', 'parking', '模拟题：车辆停在路边时，离路缘石最远通常不得超过多少？', '{"choices":["6英寸","12英寸","18英寸","3英尺"],"answerIndex":1,"legacyId":"83","tags":["parking"]}'::jsonb, '12英寸', '平行停车时通常不得超过路缘 12 英寸。', 'medium', true, 83, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '84', 'parking', '常见题：上坡且有路缘石停车时，前轮应怎样打？', '{"choices":["向左，远离路缘石","向右，靠向路缘石","保持直","随意"],"answerIndex":0,"legacyId":"84","tags":["parking"]}'::jsonb, '向左，远离路缘石', '上坡有路缘石时，前轮通常向左。', 'medium', true, 84, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '85', 'parking', '练习题：下坡停车时，前轮通常应怎样打？', '{"choices":["向路缘石方向","离开路缘石方向","保持直","向左"],"answerIndex":0,"legacyId":"85","tags":["parking"]}'::jsonb, '向路缘石方向', '下坡停车时前轮应向路缘石方向。', 'medium', true, 85, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '86', 'speed-weather', '复习题：纽约州普通道路若没有其它限速标志，常见最高限速是多少？', '{"choices":["45 mph","55 mph","65 mph","75 mph"],"answerIndex":1,"legacyId":"86","tags":["speed"]}'::jsonb, '55 mph', '纽约州很多普通道路默认最高限速为 55 mph，具体以标志为准。', 'easy', true, 86, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '87', 'speed-weather', '模拟题：安全车速取决于什么？', '{"choices":["只取决于限速牌","天气、道路、交通和能见度等情况","司机心情","车辆价格"],"answerIndex":1,"legacyId":"87","tags":["speed"]}'::jsonb, '天气、道路、交通和能见度等情况', '安全速度要根据道路、天气、交通和能见度调整。', 'easy', true, 87, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '88', 'speed-weather', '常见题：雨天或湿滑路面应怎样调整驾驶？', '{"choices":["保持平时速度","减速并增加跟车距离","急刹测试路面","频繁变道"],"answerIndex":1,"legacyId":"88","tags":["weather"]}'::jsonb, '减速并增加跟车距离', '湿滑路面制动距离变长，应减速并增加距离。', 'easy', true, 88, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '89', 'speed-weather', '练习题：车辆开始打滑时，通常应怎样做？', '{"choices":["急刹车","朝车尾滑动方向轻转方向盘并避免急刹","猛打反方向","加速"],"answerIndex":1,"legacyId":"89","tags":["skid"]}'::jsonb, '朝车尾滑动方向轻转方向盘并避免急刹', '打滑时应保持冷静，避免急刹和猛打方向。', 'medium', true, 89, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '90', 'highway', '复习题：高速公路和普通道路主要区别之一是什么？', '{"choices":["高速公路车速通常更高，需要更早观察和判断","高速公路没有规则","高速公路不能变道","高速公路只能夜间用"],"answerIndex":0,"legacyId":"90","tags":["highway"]}'::jsonb, '高速公路车速通常更高，需要更早观察和判断', '高速公路速度高，更需要保持距离和提前判断。', 'easy', true, 90, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '91', 'highway', '模拟题：从高速公路出口驶入普通道路时，应注意什么？', '{"choices":["保持高速公路速度","看速度表并降低到较低限速","立即停车","关掉车灯"],"answerIndex":1,"legacyId":"91","tags":["highway"]}'::jsonb, '看速度表并降低到较低限速', '离开高速后应看速度表并减速。', 'medium', true, 91, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '92', 'alcohol-drugs', '常见题：纽约通常以多少 BAC 作为醉酒驾驶 DWI 的重要标准？', '{"choices":["0.02%","0.05%","0.08%","0.20%"],"answerIndex":2,"legacyId":"92","tags":["alcohol"]}'::jsonb, '0.08%', '在纽约，BAC 0.08% 或以上通常构成 DWI 的重要证据。', 'easy', true, 92, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '93', 'alcohol-drugs', '练习题：酒精对驾驶的影响包括什么？', '{"choices":["反应变快","判断力和反应能力下降","视力更好","更容易集中"],"answerIndex":1,"legacyId":"93","tags":["alcohol"]}'::jsonb, '判断力和反应能力下降', '酒精会降低判断、反应和控制能力。', 'easy', true, 93, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '94', 'alcohol-drugs', '复习题：使酒精离开身体最可靠的方法是什么？', '{"choices":["喝咖啡","冷水浴","时间和休息","运动出汗"],"answerIndex":2,"legacyId":"94","tags":["alcohol"]}'::jsonb, '时间和休息', '身体需要时间代谢酒精。', 'easy', true, 94, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '95', 'safety', '模拟题：安全带什么时候应该使用？', '{"choices":["只在高速公路","只在长途","每次驾车，驾驶员和乘客都应使用","只在下雨时"],"answerIndex":2,"legacyId":"95","tags":["seat-belt"]}'::jsonb, '每次驾车，驾驶员和乘客都应使用', '每次行车都应系安全带。', 'easy', true, 95, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '96', 'safety', '常见题：防卫驾驶的核心是什么？', '{"choices":["只看前方","预判他人可能犯错并保持安全空间","总是开得更快","相信别人会让你"],"answerIndex":1,"legacyId":"96","tags":["defensive"]}'::jsonb, '预判他人可能犯错并保持安全空间', '防卫驾驶强调观察、预判和保留安全空间。', 'easy', true, 96, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '97', 'sharing-road', '练习题：遇到骑自行车者时应怎样做？', '{"choices":["贴近通过","保持安全距离并耐心通过","鸣笛逼其靠边","从路肩超越"],"answerIndex":1,"legacyId":"97","tags":["bicycle"]}'::jsonb, '保持安全距离并耐心通过', '自行车也是道路使用者，应保持安全距离。', 'easy', true, 97, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '98', 'law', '复习题：发生有人受伤或死亡的交通事故时，应怎样做？', '{"choices":["立即离开","停车、提供信息并按规定报警/报告","只给保险公司打电话","只拍照片"],"answerIndex":1,"legacyId":"98","tags":["crash"]}'::jsonb, '停车、提供信息并按规定报警/报告', '发生伤亡事故时必须停车、协助并按要求报告。', 'easy', true, 98, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '99', 'law', '模拟题：驾驶执照地址变更后，通常应多快通知 DMV？', '{"choices":["10天内","30天内","半年内","不需要"],"answerIndex":0,"legacyId":"99","tags":["license"]}'::jsonb, '10天内', '纽约驾驶执照地址变更通常需要在 10 天内通知 DMV。', 'medium', true, 99, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '100', 'road-signs-general', '常见题：红色交通标志通常传达什么含义？', '{"choices":["服务信息","禁止、停止或让行","风景区","高速出口"],"answerIndex":1,"legacyId":"100","tags":["sign-color"]}'::jsonb, '禁止、停止或让行', '红色常用于 STOP、YIELD、DO NOT ENTER 等。', 'easy', true, 100, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '101', 'road-signs-general', '练习题：黄色菱形标志通常是什么类型？', '{"choices":["警告标志","服务标志","停车许可","医院方向"],"answerIndex":0,"legacyId":"101","tags":["sign-shape"]}'::jsonb, '警告标志', '黄色菱形一般是警告标志。', 'easy', true, 101, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '102', 'road-signs-general', '复习题：八边形标志几乎总是表示什么？', '{"choices":["停车","让路","铁路","医院"],"answerIndex":0,"legacyId":"102","tags":["sign-shape"]}'::jsonb, '停车', '八边形红色标志是 STOP。', 'easy', true, 102, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '103', 'traffic-control', '模拟题：红灯闪烁时，驾驶员应如何处理？', '{"choices":["像停车标志一样完全停车，再确认安全通过","快速通过","只减速不停车","按喇叭后通过"],"answerIndex":0,"legacyId":"103","tags":["red-light"]}'::jsonb, '像停车标志一样完全停车，再确认安全通过', '闪烁红灯通常按 STOP 处理。', 'easy', true, 103, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '104', 'traffic-control', '常见题：黄灯闪烁通常表示什么？', '{"choices":["必须停车","小心减速通过","可以加速通过","禁止通行"],"answerIndex":1,"legacyId":"104","tags":["yellow-light"]}'::jsonb, '小心减速通过', '闪烁黄灯表示警告，应减速并小心通过。', 'easy', true, 104, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '105', 'traffic-control', '练习题：交通警察指挥与交通灯冲突时，应听谁的？', '{"choices":["交通灯","交通警察","路边标志","先到先走"],"answerIndex":1,"legacyId":"105","tags":["police"]}'::jsonb, '交通警察', '现场交通警察或执法人员的指挥优先。', 'easy', true, 105, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '106', 'traffic-control', '复习题：绿色箭头亮起时，驾驶员应怎样做？', '{"choices":["可以按箭头方向通行，但仍需注意行人和车辆","必须停车","可以向任意方向行驶","只能直行"],"answerIndex":0,"legacyId":"106","tags":["green-arrow"]}'::jsonb, '可以按箭头方向通行，但仍需注意行人和车辆', '绿色箭头允许按箭头方向行驶，但仍要注意安全。', 'easy', true, 106, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '107', 'traffic-control', '模拟题：双黄实线通常表示什么？', '{"choices":["可随时超车","两方向车流分隔，通常不得越线超车","只给公交车使用","道路施工"],"answerIndex":1,"legacyId":"107","tags":["pavement"]}'::jsonb, '两方向车流分隔，通常不得越线超车', '双黄实线通常禁止越线超车。', 'easy', true, 107, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '108', 'traffic-control', '常见题：白色虚线分隔同方向车道时表示什么？', '{"choices":["不得变道","在安全情况下可以变道","必须停车","只供紧急车辆使用"],"answerIndex":1,"legacyId":"108","tags":["lane"]}'::jsonb, '在安全情况下可以变道', '白色虚线通常分隔同方向车道。', 'easy', true, 108, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '109', 'right-of-way', '练习题：没有信号灯的十字路口，两车同时到达时，谁先行？', '{"choices":["左边车辆","右边车辆","车速快的车辆","较大的车辆"],"answerIndex":1,"legacyId":"109","tags":["intersection"]}'::jsonb, '右边车辆', '在没有控制标志的路口同时到达时，通常让右侧车辆先行。', 'easy', true, 109, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '110', 'right-of-way', '复习题：左转车辆遇到对向直行车辆时，应怎样做？', '{"choices":["左转车先走","让对向直行车辆先行","按喇叭要求对方停车","加速抢过"],"answerIndex":1,"legacyId":"110","tags":["left-turn"]}'::jsonb, '让对向直行车辆先行', '左转通常要让对向直行车辆和行人先行。', 'easy', true, 110, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '111', 'right-of-way', '模拟题：从私人车道驶入道路时，应如何处理？', '{"choices":["主路车辆让你","让道路上的车辆和行人先行","快速驶入","按喇叭后驶入"],"answerIndex":1,"legacyId":"111","tags":["driveway"]}'::jsonb, '让道路上的车辆和行人先行', '从车道、停车场或小巷进入道路时，应让行。', 'easy', true, 111, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '112', 'right-of-way', '常见题：行人在合法横道内过街时，驾驶员应怎样做？', '{"choices":["减速或停车让行","鸣笛让行人快走","绕过行人","只在绿灯时让行"],"answerIndex":0,"legacyId":"112","tags":["pedestrian"]}'::jsonb, '减速或停车让行', '行人在合法横道内有优先权。', 'easy', true, 112, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '113', 'right-of-way', '练习题：盲人携带白色手杖或导盲犬过街时，驾驶员应怎样做？', '{"choices":["鸣笛提醒","继续行驶","必须让行","只在有信号灯时让行"],"answerIndex":2,"legacyId":"113","tags":["pedestrian"]}'::jsonb, '必须让行', '盲人使用白杖或导盲犬过街时，驾驶员必须让行。', 'easy', true, 113, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '114', 'right-of-way', '复习题：听到或看到紧急车辆警灯警报时，应怎样做？', '{"choices":["立即停在原车道","安全靠右停车，让紧急车辆通过","加速离开","跟在紧急车辆后面"],"answerIndex":1,"legacyId":"114","tags":["emergency"]}'::jsonb, '安全靠右停车，让紧急车辆通过', '应安全靠右并停车，直到紧急车辆通过。', 'easy', true, 114, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '115', 'right-of-way', '模拟题：校车红灯闪烁并停车上下学生时，纽约驾驶员通常应怎样做？', '{"choices":["同向车辆才停车","双向车辆都必须停车","只减速即可","如果看不到学生可通过"],"answerIndex":1,"legacyId":"115","tags":["school-bus"]}'::jsonb, '双向车辆都必须停车', '纽约校车红灯闪烁时，通常双向交通都必须停车。', 'easy', true, 115, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '116', 'turns', '常见题：右转前应怎样准备？', '{"choices":["尽量靠右并提前打转向灯","从道路左侧右转","不需要打灯","转弯时再看后视镜"],"answerIndex":0,"legacyId":"116","tags":["right-turn"]}'::jsonb, '尽量靠右并提前打转向灯', '右转前应提前打灯、靠右、观察行人和自行车。', 'easy', true, 116, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '117', 'turns', '练习题：左转前应怎样做？', '{"choices":["不需打灯","提前打左转灯并让对向车辆和行人","尽量靠右转","停车后倒车"],"answerIndex":1,"legacyId":"117","tags":["left-turn"]}'::jsonb, '提前打左转灯并让对向车辆和行人', '左转前应提前打灯，观察对向车辆、行人和自行车。', 'easy', true, 117, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '118', 'turns', '复习题：在路口等左转时，方向盘最好怎样放？', '{"choices":["提前向左打死","保持车轮直行方向","向右打","随意"],"answerIndex":1,"legacyId":"118","tags":["left-turn"]}'::jsonb, '保持车轮直行方向', '等待左转时保持车轮直行更安全。', 'medium', true, 118, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '119', 'turns', '模拟题：错过高速公路出口时，应怎样做？', '{"choices":["倒车回出口","在路肩掉头","继续到下一个出口","立即停车"],"answerIndex":2,"legacyId":"119","tags":["highway"]}'::jsonb, '继续到下一个出口', '错过出口时应继续到下一个出口。', 'easy', true, 119, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '120', 'turns', '常见题：黄灯亮起时，你已接近路口但能安全停车，应怎样做？', '{"choices":["加速冲过","准备停车","鸣笛通过","换到左车道"],"answerIndex":1,"legacyId":"120","tags":["traffic-light"]}'::jsonb, '准备停车', '黄灯表示即将变红，如果能安全停车，应停车等待。', 'easy', true, 120, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '121', 'passing-lanes', '练习题：变道前最重要的动作是什么？', '{"choices":["只看前方","打灯、看镜子并检查盲点","加速","按喇叭"],"answerIndex":1,"legacyId":"121","tags":["blind-spot"]}'::jsonb, '打灯、看镜子并检查盲点', '变道前应打灯、看镜子，并转头检查盲点。', 'easy', true, 121, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '122', 'passing-lanes', '复习题：盲点是什么？', '{"choices":["车灯照不到的地方","镜子不容易看到的区域","只有夜间存在","车头前方区域"],"answerIndex":1,"legacyId":"122","tags":["blind-spot"]}'::jsonb, '镜子不容易看到的区域', '盲点是镜子不容易看到的区域。', 'easy', true, 122, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '123', 'passing-lanes', '模拟题：超车通常应从哪一侧进行？', '{"choices":["右侧","左侧","路肩","任意方向"],"answerIndex":1,"legacyId":"123","tags":["passing"]}'::jsonb, '左侧', '大多数情况下应从左侧超车。', 'easy', true, 123, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '124', 'passing-lanes', '常见题：何时绝对不应超车？', '{"choices":["前车为行人停车时","道路很直时","白天时","前车慢时"],"answerIndex":0,"legacyId":"124","tags":["passing"]}'::jsonb, '前车为行人停车时', '前车为行人停车时，不得从旁边超车。', 'medium', true, 124, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '125', 'parking', '练习题：消防栓附近停车至少应保持多远？', '{"choices":["5英尺","10英尺","15英尺","30英尺"],"answerIndex":2,"legacyId":"125","tags":["parking"]}'::jsonb, '15英尺', '纽约通常要求车辆不能停在消防栓 15 英尺以内。', 'easy', true, 125, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '126', 'parking', '复习题：车辆停在路边时，离路缘石最远通常不得超过多少？', '{"choices":["6英寸","12英寸","18英寸","3英尺"],"answerIndex":1,"legacyId":"126","tags":["parking"]}'::jsonb, '12英寸', '平行停车时通常不得超过路缘 12 英寸。', 'medium', true, 126, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '127', 'parking', '模拟题：上坡且有路缘石停车时，前轮应怎样打？', '{"choices":["向左，远离路缘石","向右，靠向路缘石","保持直","随意"],"answerIndex":0,"legacyId":"127","tags":["parking"]}'::jsonb, '向左，远离路缘石', '上坡有路缘石时，前轮通常向左。', 'medium', true, 127, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '128', 'parking', '常见题：下坡停车时，前轮通常应怎样打？', '{"choices":["向路缘石方向","离开路缘石方向","保持直","向左"],"answerIndex":0,"legacyId":"128","tags":["parking"]}'::jsonb, '向路缘石方向', '下坡停车时前轮应向路缘石方向。', 'medium', true, 128, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '129', 'speed-weather', '练习题：纽约州普通道路若没有其它限速标志，常见最高限速是多少？', '{"choices":["45 mph","55 mph","65 mph","75 mph"],"answerIndex":1,"legacyId":"129","tags":["speed"]}'::jsonb, '55 mph', '纽约州很多普通道路默认最高限速为 55 mph，具体以标志为准。', 'easy', true, 129, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '130', 'speed-weather', '复习题：安全车速取决于什么？', '{"choices":["只取决于限速牌","天气、道路、交通和能见度等情况","司机心情","车辆价格"],"answerIndex":1,"legacyId":"130","tags":["speed"]}'::jsonb, '天气、道路、交通和能见度等情况', '安全速度要根据道路、天气、交通和能见度调整。', 'easy', true, 130, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '131', 'speed-weather', '模拟题：雨天或湿滑路面应怎样调整驾驶？', '{"choices":["保持平时速度","减速并增加跟车距离","急刹测试路面","频繁变道"],"answerIndex":1,"legacyId":"131","tags":["weather"]}'::jsonb, '减速并增加跟车距离', '湿滑路面制动距离变长，应减速并增加距离。', 'easy', true, 131, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '132', 'speed-weather', '常见题：车辆开始打滑时，通常应怎样做？', '{"choices":["急刹车","朝车尾滑动方向轻转方向盘并避免急刹","猛打反方向","加速"],"answerIndex":1,"legacyId":"132","tags":["skid"]}'::jsonb, '朝车尾滑动方向轻转方向盘并避免急刹', '打滑时应保持冷静，避免急刹和猛打方向。', 'medium', true, 132, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '133', 'highway', '练习题：高速公路和普通道路主要区别之一是什么？', '{"choices":["高速公路车速通常更高，需要更早观察和判断","高速公路没有规则","高速公路不能变道","高速公路只能夜间用"],"answerIndex":0,"legacyId":"133","tags":["highway"]}'::jsonb, '高速公路车速通常更高，需要更早观察和判断', '高速公路速度高，更需要保持距离和提前判断。', 'easy', true, 133, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '134', 'highway', '复习题：从高速公路出口驶入普通道路时，应注意什么？', '{"choices":["保持高速公路速度","看速度表并降低到较低限速","立即停车","关掉车灯"],"answerIndex":1,"legacyId":"134","tags":["highway"]}'::jsonb, '看速度表并降低到较低限速', '离开高速后应看速度表并减速。', 'medium', true, 134, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '135', 'alcohol-drugs', '模拟题：纽约通常以多少 BAC 作为醉酒驾驶 DWI 的重要标准？', '{"choices":["0.02%","0.05%","0.08%","0.20%"],"answerIndex":2,"legacyId":"135","tags":["alcohol"]}'::jsonb, '0.08%', '在纽约，BAC 0.08% 或以上通常构成 DWI 的重要证据。', 'easy', true, 135, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '136', 'alcohol-drugs', '常见题：酒精对驾驶的影响包括什么？', '{"choices":["反应变快","判断力和反应能力下降","视力更好","更容易集中"],"answerIndex":1,"legacyId":"136","tags":["alcohol"]}'::jsonb, '判断力和反应能力下降', '酒精会降低判断、反应和控制能力。', 'easy', true, 136, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '137', 'alcohol-drugs', '练习题：使酒精离开身体最可靠的方法是什么？', '{"choices":["喝咖啡","冷水浴","时间和休息","运动出汗"],"answerIndex":2,"legacyId":"137","tags":["alcohol"]}'::jsonb, '时间和休息', '身体需要时间代谢酒精。', 'easy', true, 137, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '138', 'safety', '复习题：安全带什么时候应该使用？', '{"choices":["只在高速公路","只在长途","每次驾车，驾驶员和乘客都应使用","只在下雨时"],"answerIndex":2,"legacyId":"138","tags":["seat-belt"]}'::jsonb, '每次驾车，驾驶员和乘客都应使用', '每次行车都应系安全带。', 'easy', true, 138, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '139', 'safety', '模拟题：防卫驾驶的核心是什么？', '{"choices":["只看前方","预判他人可能犯错并保持安全空间","总是开得更快","相信别人会让你"],"answerIndex":1,"legacyId":"139","tags":["defensive"]}'::jsonb, '预判他人可能犯错并保持安全空间', '防卫驾驶强调观察、预判和保留安全空间。', 'easy', true, 139, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '140', 'sharing-road', '常见题：遇到骑自行车者时应怎样做？', '{"choices":["贴近通过","保持安全距离并耐心通过","鸣笛逼其靠边","从路肩超越"],"answerIndex":1,"legacyId":"140","tags":["bicycle"]}'::jsonb, '保持安全距离并耐心通过', '自行车也是道路使用者，应保持安全距离。', 'easy', true, 140, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '141', 'law', '练习题：发生有人受伤或死亡的交通事故时，应怎样做？', '{"choices":["立即离开","停车、提供信息并按规定报警/报告","只给保险公司打电话","只拍照片"],"answerIndex":1,"legacyId":"141","tags":["crash"]}'::jsonb, '停车、提供信息并按规定报警/报告', '发生伤亡事故时必须停车、协助并按要求报告。', 'easy', true, 141, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '142', 'law', '复习题：驾驶执照地址变更后，通常应多快通知 DMV？', '{"choices":["10天内","30天内","半年内","不需要"],"answerIndex":0,"legacyId":"142","tags":["license"]}'::jsonb, '10天内', '纽约驾驶执照地址变更通常需要在 10 天内通知 DMV。', 'medium', true, 142, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '143', 'road-signs-general', '模拟题：红色交通标志通常传达什么含义？', '{"choices":["服务信息","禁止、停止或让行","风景区","高速出口"],"answerIndex":1,"legacyId":"143","tags":["sign-color"]}'::jsonb, '禁止、停止或让行', '红色常用于 STOP、YIELD、DO NOT ENTER 等。', 'easy', true, 143, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '144', 'road-signs-general', '常见题：黄色菱形标志通常是什么类型？', '{"choices":["警告标志","服务标志","停车许可","医院方向"],"answerIndex":0,"legacyId":"144","tags":["sign-shape"]}'::jsonb, '警告标志', '黄色菱形一般是警告标志。', 'easy', true, 144, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '145', 'road-signs-general', '练习题：八边形标志几乎总是表示什么？', '{"choices":["停车","让路","铁路","医院"],"answerIndex":0,"legacyId":"145","tags":["sign-shape"]}'::jsonb, '停车', '八边形红色标志是 STOP。', 'easy', true, 145, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '146', 'traffic-control', '复习题：红灯闪烁时，驾驶员应如何处理？', '{"choices":["像停车标志一样完全停车，再确认安全通过","快速通过","只减速不停车","按喇叭后通过"],"answerIndex":0,"legacyId":"146","tags":["red-light"]}'::jsonb, '像停车标志一样完全停车，再确认安全通过', '闪烁红灯通常按 STOP 处理。', 'easy', true, 146, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '147', 'traffic-control', '模拟题：黄灯闪烁通常表示什么？', '{"choices":["必须停车","小心减速通过","可以加速通过","禁止通行"],"answerIndex":1,"legacyId":"147","tags":["yellow-light"]}'::jsonb, '小心减速通过', '闪烁黄灯表示警告，应减速并小心通过。', 'easy', true, 147, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '148', 'traffic-control', '常见题：交通警察指挥与交通灯冲突时，应听谁的？', '{"choices":["交通灯","交通警察","路边标志","先到先走"],"answerIndex":1,"legacyId":"148","tags":["police"]}'::jsonb, '交通警察', '现场交通警察或执法人员的指挥优先。', 'easy', true, 148, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '149', 'traffic-control', '练习题：绿色箭头亮起时，驾驶员应怎样做？', '{"choices":["可以按箭头方向通行，但仍需注意行人和车辆","必须停车","可以向任意方向行驶","只能直行"],"answerIndex":0,"legacyId":"149","tags":["green-arrow"]}'::jsonb, '可以按箭头方向通行，但仍需注意行人和车辆', '绿色箭头允许按箭头方向行驶，但仍要注意安全。', 'easy', true, 149, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb),
  ('NY', 'zh-CN', '2026-05-15', '150', 'traffic-control', '复习题：双黄实线通常表示什么？', '{"choices":["可随时超车","两方向车流分隔，通常不得越线超车","只给公交车使用","道路施工"],"answerIndex":1,"legacyId":"150","tags":["pavement"]}'::jsonb, '两方向车流分隔，通常不得越线超车', '双黄实线通常禁止越线超车。', 'easy', true, 150, '{"image_url":"","reference":"NY DMV Driver''s Manual"}'::jsonb)
on conflict (state, language, source_version, source_question_id) where source_version is not null and source_question_id is not null
do update set category = excluded.category, question_text = excluded.question_text, options = excluded.options, correct_answer = excluded.correct_answer, explanation = excluded.explanation, difficulty = excluded.difficulty, is_active = excluded.is_active, sort_order = excluded.sort_order, metadata = excluded.metadata, updated_at = now();

insert into public.dmv_question_imports (source, imported_count, metadata)
values ('OpenAA 纽约 DMV 中文笔试题库 V1', 150, '{"version":"2026-05-15","language":"zh-CN","jurisdiction":"New York"}'::jsonb);

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

-- Launch baseline content exported read-only from linked openaa-app.
-- This replaces earlier minimal placeholders in this seed file for fresh local/remote rebuilds.
delete from public.navigation_links;
delete from public.top_quick_links;
delete from public.latest_ticker;
delete from public.notification_templates;
delete from public.home_sections;
delete from public.ads;
delete from public.news_posts;
delete from public.news_categories;
delete from public.image_assets;
delete from public.site_settings where key = 'dmv_notice';

insert into public.navigation_categories (slug, name, description, icon, display_limit, sort_order, is_active)
values
  ('featured', '热门推荐', '', null, 6, 10, true),
  ('government', '政府服务', '', null, 6, 20, true),
  ('finance', '银行金融', '', null, 6, 30, true),
  ('telecom', '通讯网络', '', null, 6, 40, true),
  ('shopping', '购物平台', '', null, 6, 50, true),
  ('ai', 'AI工具', '', null, 6, 60, true),
  ('video', '视频娱乐', '', null, 50, 70, true),
  ('social', '社交媒体', '', null, 50, 80, true),
  ('life', '生活服务', '', null, 50, 90, true),
  ('other', '其它', '', null, 50, 100, true)
on conflict (slug) do update set name = excluded.name, description = excluded.description, icon = excluded.icon, display_limit = excluded.display_limit, sort_order = excluded.sort_order, is_active = excluded.is_active, updated_at = now();

insert into public.navigation_links (category_id, title, description, url, icon, icon_image_asset_id, open_mode, sort_order, is_active, is_featured, metadata)
select c.id, seed.title, seed.description, seed.url, seed.icon, seed.icon_image_asset_id::uuid, seed.open_mode, seed.sort_order, seed.is_active, seed.is_featured, seed.metadata
from (values
  ('featured', 'OpenAA工具', null, 'https://tools.openaa.com', null, null, 'auto', 0, true, false, '{}'::jsonb),
  ('finance', '更多', '整合更多的各类银行', 'https://openaa.com/nav/bank', null, null, 'auto', 0, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"5c679bef-1a68-4885-81dc-74f69254ffbb"}'::jsonb),
  ('shopping', '更多', '整合更多分类购物', 'https://openaa.com/nav/onegobuy', null, null, 'auto', 0, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"83bfdc9c-7e53-49be-b0ca-1d8ba4b16367"}'::jsonb),
  ('ai', '更多AI', '整合分类用途的更多的AI', 'https://openaa.com/nav/ai', null, null, 'auto', 0, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"87e73c3b-1fa3-4dc4-b42c-e02a5f167419"}'::jsonb),
  ('featured', 'Google翻译', '中英文翻译、网页翻译与文档翻译。', 'https://translate.google.com/', null, null, 'auto', 1, false, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"7abfc8ec-3e40-46de-a77d-fe343512bc1c"}'::jsonb),
  ('featured', '移民局收费', '庇护年费缴费页面', 'https://my.uscis.gov/accounts/annual-asylum-fee/questionnaire', null, null, 'auto', 2, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"12c28315-e093-48cb-be57-6019150f59a8"}'::jsonb),
  ('featured', 'DMV小工具', 'DMV 文件检查器，6 Points 计算器，REAL ID', 'https://openaa.com/tool/dmv/document-checker.html', null, null, 'auto', 3, false, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"b398a0fa-bfdf-4656-b835-88abf531be2a"}'::jsonb),
  ('shopping', 'Amazon', '电商平台。', 'https://www.amazon.com/', null, null, 'auto', 10, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"d53e0fde-c099-4c5b-8af7-8cf86feede15"}'::jsonb),
  ('finance', 'Bank of America', '美国银行官网。', 'https://www.bankofamerica.com/', null, null, 'auto', 10, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"4c722ae7-4e12-4c71-b8fc-4f2ea237fe3f"}'::jsonb),
  ('ai', 'ChatGPT', 'OpenAI ChatGPT。', 'https://chat.openai.com/', null, null, 'auto', 10, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"b946aabf-d9cf-42c2-be06-166d7879b525"}'::jsonb),
  ('government', 'DMV官方入口', '各州 DMV 官方导航入口。', 'https://openaa.com/nav/dmv', null, null, 'auto', 10, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"7fc59537-e7f8-4f2c-a1f6-b73a2faf24e8"}'::jsonb),
  ('social', 'Facebook', 'Facebook 社交。', 'https://www.facebook.com/', null, null, 'auto', 10, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"88371d02-2fa2-4d8a-8f3d-ca84569eb1f0"}'::jsonb),
  ('telecom', 'T-Mobile', 'T-Mobile 官网。', 'https://www.t-mobile.com/', null, null, 'auto', 10, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"558f80d7-0859-477b-8f10-8f44beac96f5"}'::jsonb),
  ('video', 'YouTube', 'YouTube 视频平台。', 'https://www.youtube.com/', null, null, 'auto', 10, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"5fca782c-9c24-4a52-921c-b0c845ede119"}'::jsonb),
  ('other', '百度', '百度搜索。', 'https://www.baidu.com/', null, null, 'auto', 10, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"f1c67736-6e47-4b26-8a17-d55cf38d38ec"}'::jsonb),
  ('life', '纽约生活', '纽约本地生活信息。', 'https://newyork.craigslist.org/', null, null, 'auto', 10, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"dfab989a-7f88-41b4-81a3-1827ad796f5d"}'::jsonb),
  ('finance', 'Chase', '摩根大通 Chase 官网。', 'https://www.chase.com/', null, null, 'auto', 20, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"a4a5d45c-0706-402d-9630-fc151052db3d"}'::jsonb),
  ('ai', 'DeepSeek', 'DeepSeek。', 'https://www.deepseek.com/', null, null, 'auto', 20, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"354d50ea-1703-49cb-bcb2-14c507f45305"}'::jsonb),
  ('other', 'Gmail', 'Gmail 邮箱。', 'https://mail.google.com/', null, null, 'auto', 20, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"718050e8-64e8-4dc1-8b7f-aa40db77eb81"}'::jsonb),
  ('social', 'Instagram', 'Instagram 社交。', 'https://www.instagram.com/', null, null, 'auto', 20, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"1ccb3e13-76c8-4db7-818d-7dbcc894bcb0"}'::jsonb),
  ('video', 'Netflix', 'Netflix 流媒体。', 'https://www.netflix.com/', null, null, 'auto', 20, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"1776f94f-ff51-4cfd-8923-fbee86da8cd8"}'::jsonb),
  ('government', 'USCIS', '移民/工卡/入籍等官方办理入口。', 'https://www.uscis.gov/', null, null, 'auto', 20, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"6e98644c-e018-4dbc-892d-5185d05c0ef9"}'::jsonb),
  ('telecom', 'Verizon', 'Verizon 官网。', 'https://www.verizon.com/', null, null, 'auto', 20, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"608d7923-8727-4806-b6b3-2ef4d0f93e6e"}'::jsonb),
  ('shopping', 'Walmart', 'Walmart 超市与电商。', 'https://www.walmart.com/', null, null, 'auto', 20, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"e10f6241-1eb0-4fbb-b1d3-5b5dec739590"}'::jsonb),
  ('featured', '招聘信息', 'OpenAA 招聘板块入口。', '/jobs', null, null, 'auto', 20, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"04a56077-a3d5-4566-85e8-34088345b1de"}'::jsonb),
  ('life', '纽约华人365', '房屋与生活信息。', 'https://www.365wuyu.com/', null, null, 'auto', 20, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"0323ba80-8fa8-4bac-8053-fc4e90b45546"}'::jsonb),
  ('telecom', 'AT&T', 'AT&T 官网。', 'https://www.att.com/', null, null, 'auto', 30, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"e666a0f3-f653-4dfa-92fa-180084fad03d"}'::jsonb),
  ('shopping', 'eBay', 'eBay 二手与拍卖平台。', 'https://www.ebay.com/', null, null, 'auto', 30, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"f4f23903-153f-476b-9646-1a06b4c93a54"}'::jsonb),
  ('ai', 'Gemini', 'Google Gemini。', 'https://gemini.google.com/', null, null, 'auto', 30, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"48f237c4-0980-432b-a0e0-12a939b3a207"}'::jsonb),
  ('government', 'IRS', '联邦税务申报与查询。', 'https://www.irs.gov/', null, null, 'auto', 30, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"0f2d478c-58c0-4a4d-ab81-01fada9cec2c"}'::jsonb),
  ('other', 'Outlook', 'Outlook 邮箱。', 'https://outlook.live.com/', null, null, 'auto', 30, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"a08cfd92-b1f5-49fc-965f-a93f461155ae"}'::jsonb),
  ('video', 'TikTok', 'TikTok 短视频。', 'https://www.tiktok.com/', null, null, 'auto', 30, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"f489e3ff-3eac-4e99-b444-d9c4a6ad7a36"}'::jsonb),
  ('finance', 'Wells Fargo', '富国银行官网。', 'https://www.wellsfargo.com/', null, null, 'auto', 30, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"54962ea0-7409-4f58-9c24-af1bae3882d1"}'::jsonb),
  ('featured', '二手闲置', 'OpenAA 二手板块入口。', '/secondhand', null, null, 'auto', 30, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"ffb92e90-564e-49f9-a30b-125ca49c87b9"}'::jsonb),
  ('life', '华人工商黄页', '商家查询黄页。', 'https://www.yellowpages.com/', null, null, 'auto', 30, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"b32fa9cd-6a98-4373-a4ff-260a9511884e"}'::jsonb),
  ('social', '小红书', '小红书社区。', 'https://www.xiaohongshu.com/', null, null, 'auto', 30, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"c96233e8-42f9-44ed-9d92-0d18d99fa3e2"}'::jsonb),
  ('featured', '手机靓号', '低价美国手机靓号', 'https://numbermobi.com/#buy-note', null, null, 'auto', 31, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"2503681c-cf54-414e-8a2d-8c444eb8b3c6"}'::jsonb),
  ('video', 'B站', '哔哩哔哩。', 'https://www.bilibili.com/', null, null, 'auto', 40, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"c012d0e2-7c5d-4acb-b67f-1d16d617d7ec"}'::jsonb),
  ('finance', 'Citi', '花旗银行官网。', 'https://www.citi.com/', null, null, 'auto', 40, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"264beec9-8aac-4456-a1cb-1e403b543352"}'::jsonb),
  ('ai', 'Claude', 'Anthropic Claude。', 'https://claude.ai/', null, null, 'auto', 40, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"2bdb3c0f-44bd-481b-94c3-27134356b148"}'::jsonb),
  ('shopping', 'Costco', 'Costco 仓储会员店。', 'https://www.costco.com/', null, null, 'auto', 40, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"9fc96629-0add-4c8e-a090-2568670fc24c"}'::jsonb),
  ('government', 'SSA', '社保号与社保服务。', 'https://www.ssa.gov/', null, null, 'auto', 40, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"4dad046a-e9e7-485d-bbf4-32ae55d20698"}'::jsonb),
  ('telecom', 'Tello', 'Tello 虚拟运营商。', 'https://tello.com/', null, null, 'auto', 40, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"8071cf27-b558-4130-b749-7828bdb433da"}'::jsonb),
  ('social', 'X', 'X (Twitter)。', 'https://x.com/', null, null, 'auto', 40, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"f534f31d-6ff2-45bb-9f55-29326d8a8e99"}'::jsonb),
  ('life', 'Yelp', 'Yelp 商家点评与搜索。', 'https://www.yelp.com/', null, null, 'auto', 40, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"1f2c5246-6e36-4c8c-a099-31a6ed32453c"}'::jsonb),
  ('other', '知乎', '知乎。', 'https://www.zhihu.com/', null, null, 'auto', 40, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"45bf5456-1ec0-42bb-b2b2-39a742fd7829"}'::jsonb),
  ('featured', '纽约工作网', '纽约地区招聘信息。', 'https://newyork.craigslist.org/search/jjj', null, null, 'auto', 40, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"c58549d7-4f8d-494f-92e1-ace1395452f4"}'::jsonb),
  ('ai', 'Copilot', 'Microsoft Copilot。', 'https://copilot.microsoft.com/', null, null, 'auto', 50, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"fcb61e18-8180-4a45-bfe0-c92815f7244f"}'::jsonb),
  ('video', 'Disney+', 'Disney+ 流媒体。', 'https://www.disneyplus.com/', null, null, 'auto', 50, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"c9e2b62e-f9f1-44b3-8690-b91fc6734d27"}'::jsonb),
  ('life', 'Groupon', 'Groupon 优惠与团购。', 'https://www.groupon.com/', null, null, 'auto', 50, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"6aa4ee4d-21eb-463b-b980-da2cb572b9b5"}'::jsonb),
  ('telecom', 'Mint', 'Mint Mobile 虚拟运营商。', 'https://www.mintmobile.com/', null, null, 'auto', 50, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"7ccd4bfd-9fbc-490b-a469-e96eb343b6f9"}'::jsonb),
  ('social', 'Reddit', 'Reddit 社区。', 'https://www.reddit.com/', null, null, 'auto', 50, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"d6f2d34f-85f9-4e07-b977-330c562d231a"}'::jsonb),
  ('other', 'Steam', 'Steam 游戏平台。', 'https://store.steampowered.com/', null, null, 'auto', 50, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"1769d7c8-af36-474c-9c15-a9e9a86b4706"}'::jsonb),
  ('shopping', 'Target', 'Target 官网。', 'https://www.target.com/', null, null, 'auto', 50, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"7d628435-62c1-42ac-b546-1414b4200e9a"}'::jsonb),
  ('finance', 'TD', 'TD Bank 官网。', 'https://www.td.com/us/en/personal-banking', null, null, 'auto', 50, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"f6d5197c-505e-48e7-9d3f-695d378d7726"}'::jsonb),
  ('government', 'USA.gov', '美国政府服务总入口。', 'https://www.usa.gov/', null, null, 'auto', 50, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"88d140f2-9b62-4bd7-b65f-892b3226fe16"}'::jsonb),
  ('featured', '纽约生活', '纽约本地生活信息。', 'https://newyork.craigslist.org/', null, null, 'auto', 50, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"f1f8010d-2e0d-4e1c-bb25-bf40c1b475c7"}'::jsonb),
  ('shopping', 'BestBuy', 'BestBuy 电子产品零售。', 'https://www.bestbuy.com/', null, null, 'auto', 60, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"9b9edc5d-cc62-4179-b163-bf4e76ef2b61"}'::jsonb),
  ('finance', 'Capital One', 'Capital One 官网。', 'https://www.capitalone.com/', null, null, 'auto', 60, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"eef11327-6ffa-4519-af32-b94e2f6a57ad"}'::jsonb),
  ('life', 'DoorDash', 'DoorDash 外卖配送。', 'https://www.doordash.com/', null, null, 'auto', 60, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"fb16ce5d-1656-45ec-8972-24ffca1bc185"}'::jsonb),
  ('ai', 'Grok', 'xAI Grok。', 'https://grok.x.ai/', null, null, 'auto', 60, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"b12d86aa-857c-44f5-8275-1798d0f8d06c"}'::jsonb),
  ('video', 'Hulu', 'Hulu 流媒体。', 'https://www.hulu.com/', null, null, 'auto', 60, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"36f47e9d-7a38-4e60-8b17-886c8f56a526"}'::jsonb),
  ('social', 'LinkedIn', 'LinkedIn 职场社交。', 'https://www.linkedin.com/', null, null, 'auto', 60, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"e8e90dd5-0760-4db5-9d90-90484fabf6fb"}'::jsonb),
  ('telecom', 'Lycamobile', 'Lycamobile 官网。', 'https://www.lycamobile.us/', null, null, 'auto', 60, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"22872569-6c5f-4be0-8f9b-a663eb5c8841"}'::jsonb),
  ('featured', '一亩三分地', '留学、求职、移民与北美生活社区。', 'https://openaa.com', null, null, 'auto', 60, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"c8d06825-eb8e-41d0-bede-9f28814a0ee0"}'::jsonb),
  ('other', '世界日报', '世界日报官网。', 'https://www.worldjournal.com/', null, null, 'auto', 60, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"bcbf8bcf-6781-4596-bbc4-abdc98178cdc"}'::jsonb),
  ('government', '美国国务院', '国务院信息与领事服务。', 'https://www.state.gov/', null, null, 'auto', 60, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"4ebe6410-0966-4912-84c0-8438090246dc"}'::jsonb),
  ('government', 'CBP', '海关与边境保护。', 'https://www.cbp.gov/', null, null, 'auto', 70, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"e7c4e362-4863-42f3-bfc8-e81dff797877"}'::jsonb),
  ('telecom', 'Cricket', 'Cricket Wireless 官网。', 'https://www.cricketwireless.com/', null, null, 'auto', 70, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"365faa22-5b86-42ca-be32-173dafc884e4"}'::jsonb),
  ('featured', 'DMV NY', '纽约州 DMV 官方网站。', 'https://dmv.ny.gov/', null, null, 'auto', 70, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"c2d73ce1-c5f5-493c-9ce0-e0a910fd4357"}'::jsonb),
  ('ai', 'Perplexity', 'Perplexity 搜索助手。', 'https://www.perplexity.ai/', null, null, 'auto', 70, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"e3053a76-d2eb-4752-957b-5bfbc6906f46"}'::jsonb),
  ('finance', 'PNC', 'PNC 银行官网。', 'https://www.pnc.com/', null, null, 'auto', 70, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"58b7800e-970c-420e-aaf7-b079b0ca1884"}'::jsonb),
  ('shopping', 'Weee', 'Weee 亚洲食品生鲜配送。', 'https://www.sayweee.com/', null, null, 'auto', 70, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"253e58d0-8fbd-491d-b63e-ad5195a80adf"}'::jsonb),
  ('social', '微信网页版', '微信网页版。', 'https://web.wechat.com/', null, null, 'auto', 70, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"52ed509d-3350-4ac8-a19a-47e107faeed4"}'::jsonb),
  ('shopping', 'AliExpress', 'AliExpress 海淘平台。', 'https://www.aliexpress.com/', null, null, 'auto', 80, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"cdc11b1c-6b8c-4393-bf4b-ab33ebfeebe2"}'::jsonb),
  ('finance', 'Discover', 'Discover 金融服务。', 'https://www.discover.com/', null, null, 'auto', 80, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"520b2506-6a7e-45c7-bd08-544baffa406a"}'::jsonb),
  ('government', 'DOL', '劳工部与劳动相关信息。', 'https://www.dol.gov/', null, null, 'auto', 80, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"ae8b8ea7-ea91-44b0-bbd3-b92ce237ff2e"}'::jsonb),
  ('telecom', 'Google Fi', 'Google Fi 官网。', 'https://fi.google.com/', null, null, 'auto', 80, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"8a515687-e2e4-47f2-a2bd-ab0d6fbe16cc"}'::jsonb),
  ('ai', 'Kimi', 'Kimi 智能助手。', 'https://kimi.moonshot.cn/', null, null, 'auto', 80, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"353e35b4-8539-4b28-92e0-b9309c23922c"}'::jsonb),
  ('featured', 'OpenAA站内搜索', 'OpenAA站内搜索', 'https://ny.openaa.com/search', null, null, 'auto', 80, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"169e3727-2dec-4544-a90d-e9e241c851d1"}'::jsonb),
  ('social', '微博', '微博。', 'https://weibo.com/', null, null, 'auto', 80, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"d496ef40-2459-4bf6-b244-888bd470f3b5"}'::jsonb),
  ('finance', 'Amex', 'American Express 官网。', 'https://www.americanexpress.com/', null, null, 'auto', 90, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"aea85f49-baa1-4172-8305-1bedb3eb6a90"}'::jsonb),
  ('ai', '豆包', '豆包 AI。', 'https://www.doubao.com/', null, null, 'auto', 90, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"c7afd27d-e4fd-4011-8a38-e7b9cca8337b"}'::jsonb),
  ('ai', '通义千问', '阿里通义千问。', 'https://tongyi.aliyun.com/qianwen/', null, null, 'auto', 100, true, false, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"40129b31-0a4f-4219-a3fc-03eb57a481d0"}'::jsonb)
) as seed(category_slug, title, description, url, icon, icon_image_asset_id, open_mode, sort_order, is_active, is_featured, metadata)
join public.navigation_categories c on c.slug = seed.category_slug;

insert into public.image_assets (id, source_type, bucket, storage_path, path, public_url, external_url, external_host, entity_type, entity_id, mime_type, size_bytes, width, height, status, is_public, metadata, is_deleted, deleted_at, created_at, updated_at)
values
  ('effa3b28-c551-4ba3-b1b1-23931f3ee006', 'external', null, null, null, null, 'https://img.openaa.com/img/banners/0026e90b-6c28-4674-838e-986546de21a9.png', 'img.openaa.com', 'ad', '1c3cfb08-cb09-46e8-9b37-939e55d0db26', null, null, null, null, 'active', true, '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, false, null, '2026-04-26T17:23:38.889535+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('02a7a3a7-8572-4229-a423-c4e76cd5b84d', 'external', null, null, null, null, 'https://img.openaa.com/img/banners/919b88a8-1ec1-4b2e-bbc6-d7a7eeaabbbb.png', 'img.openaa.com', 'ad', '6d4de89b-6324-46ee-9c63-317d81695aea', null, null, null, null, 'active', true, '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, false, null, '2026-04-26T17:38:45.119579+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('947ee330-bca1-4b11-9f58-aadf4e023dd4', 'external', null, null, null, null, 'https://img.openaa.com/img/banners/b720c8f2-d90c-451b-87fc-bec4179d7d61.png', 'img.openaa.com', 'ad', '08af3c14-59e1-4074-8ddb-939eb5ea56ad', null, null, null, null, 'active', true, '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, false, null, '2026-04-26T20:11:20.796304+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('d01dd556-7d3d-40ce-b2cd-c731020c9085', 'external', null, null, null, null, 'https://img.openaa.com/img/news/6e374654-6816-4da8-9736-bd374ea70b04.png', 'img.openaa.com', 'ad', 'bab4abb0-6dee-4a04-941f-676631285723', null, null, null, null, 'active', true, '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, false, null, '2026-04-27T01:10:58.886846+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('ebc654fc-0717-4aa6-a2b1-f3d201483d8c', 'external', null, null, null, null, 'https://img.openaa.com/img/banners/ed34e822-4982-40ec-90d1-adbbcbfb13b7.png', 'img.openaa.com', 'ad', 'ed100911-7f4b-4f47-bcb1-c53daf66562d', null, null, null, null, 'active', true, '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, false, null, '2026-04-29T01:09:56.258057+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('ca66e312-5ea1-415e-9e66-74477bbab638', 'external', null, null, null, null, 'https://qqrrvbqtbxatrpfxtpil.supabase.co/storage/v1/object/public/ads/ads/1778105597680.png', 'qqrrvbqtbxatrpfxtpil.supabase.co', 'ad', '6bad8ad7-e977-4be3-b7d1-a2ceaec3e265', null, null, null, null, 'active', true, '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, false, null, '2026-05-06T22:13:18.889381+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('6f864b6f-f9c4-4faa-ad31-0177a055e18f', 'external', null, null, null, null, 'https://qqrrvbqtbxatrpfxtpil.supabase.co/storage/v1/object/public/ads/ads/1778105681723.png', 'qqrrvbqtbxatrpfxtpil.supabase.co', 'ad', 'ffe7ef48-35a1-4552-8b2c-ffc5007cde43', null, null, null, null, 'active', true, '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, false, null, '2026-05-06T22:14:42.182861+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('ee5f18e2-b878-4d5c-b439-a7975a1658fe', 'external', null, null, null, null, 'https://img.openaa.com/img/banners/7cb4ef79-58f2-4cbb-9bbc-7d9eb90c9479.png', 'img.openaa.com', 'ad', 'cdb934fd-699a-46a3-ae0e-863cc81f3724', null, null, null, null, 'active', true, '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, false, null, '2026-05-09T00:30:36.744805+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('57ca875f-9700-472d-9b70-6579ff147d75', 'external', null, null, null, null, 'https://img.openaa.com/img/banners/6e374654-6816-4da8-9736-bd374ea70b04.png', 'img.openaa.com', 'ad', 'b52f3760-b7d8-4f38-a337-d0f4eb013ea7', null, null, null, null, 'active', true, '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, false, null, '2026-05-09T00:31:48.024058+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('93d6643c-a551-4a49-b03b-486a184c1a60', 'external', null, null, null, null, 'https://img.openaa.com/img/banners/5ecd92d7-6b42-4bc5-9237-2d1b85d83ec2.png', 'img.openaa.com', 'ad', 'f3181d00-85f0-4ef9-95e3-a75b36c39adb', null, null, null, null, 'active', true, '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, false, null, '2026-05-09T21:43:54.882079+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('935568da-fb5c-4eec-855d-0daedfdc36d8', 'external', null, null, null, null, 'https://img.openaa.com/img/banners/af1cf36f-b523-4b76-90f9-0e623631411f.png', 'img.openaa.com', 'ad', 'd0ec24d1-f157-4a16-b3f1-cb7051b9b83a', null, null, null, null, 'active', true, '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, false, null, '2026-05-09T21:46:10.983729+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('37c5671d-14c9-446f-a58f-ff14f966fda4', 'external', null, null, null, null, 'https://img.openaa.com/img/banners/1215d9b3-f38c-4173-ad87-aa0792690bd8.png', 'img.openaa.com', 'ad', 'e72f0c96-aed9-4303-9ef0-49cb9340f905', null, null, null, null, 'active', true, '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, false, null, '2026-05-09T22:34:21.445055+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('b593b9c1-c7f5-4f6c-972c-30f8b6afcdfb', 'external', null, null, null, null, 'https://img.openaa.com/img/banners/4bd57d0e-08dc-4f07-a8a2-96158193c569.png', 'img.openaa.com', 'ad', 'ea3f8047-1a7b-4e02-b4e0-4e5b91d3f032', null, null, null, null, 'active', true, '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, false, null, '2026-05-10T02:40:44.60478+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('5ce6cd54-0ef6-4212-b8c5-0ac6ce66d9ac', 'external', null, null, null, null, 'https://img.openaa.com/img/banners/5c6006d2-b716-43b4-98e7-cc1761718a48.webp', 'img.openaa.com', 'ad', '035edba7-1496-411d-860b-843b4a623aa5', null, null, null, null, 'active', true, '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, false, null, '2026-05-10T18:38:08.066513+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('90f9db4b-f08e-49ff-946d-fe8f95ea29da', 'external', null, null, null, null, 'https://img.openaa.com/img/banners/17588ab5-0248-47ae-a9a2-b0e02e06ea5b.png', 'img.openaa.com', 'ad', 'd6ff3144-18c9-48c6-9c40-222d2b66cfef', null, null, null, null, 'active', true, '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, false, null, '2026-05-10T18:43:32.530821+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('fca8587e-4244-43cf-8a61-7d834852a62a', 'external', null, null, null, null, 'https://img.openaa.com/img/banners/6e374654-6816-4da8-9736-bd374ea70b04.png', 'img.openaa.com', 'ad', '185841bc-3605-4435-b5f4-35de81d0db3a', null, null, null, null, 'active', true, '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, false, null, '2026-05-10T18:46:54.942571+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('d6870bfa-32b8-4b69-b31e-98bbd1bd48d9', 'external', null, null, null, null, 'https://img.openaa.com/img/banners/1215d9b3-f38c-4173-ad87-aa0792690bd8.png', 'img.openaa.com', 'ad', '9488836e-2bd2-4852-9599-64fd4288ff3e', null, null, null, null, 'active', true, '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, false, null, '2026-05-10T18:50:42.56459+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('de39d24b-2901-47e4-ad89-6991b1a34795', 'external', null, null, null, null, 'https://img.openaa.com/img/banners/1fe24ddc-ba0e-4b39-9319-04167f139d29.png', 'img.openaa.com', 'ad', '3b71ba02-f40f-4017-8c1e-a8b503ebcf0a', null, null, null, null, 'active', true, '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, false, null, '2026-05-10T18:52:03.74349+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('eb46a987-2844-4335-9332-d41d91d2ea86', 'external', null, null, null, null, 'https://img.openaa.com/img/banners/4bd57d0e-08dc-4f07-a8a2-96158193c569.png', 'img.openaa.com', 'ad', 'b2f78245-3899-49b2-8d02-e82306d65f9a', null, null, null, null, 'active', true, '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, false, null, '2026-05-10T18:54:35.11789+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('2fc24ace-1434-4520-b398-0e8b1e3539f1', 'external', null, null, null, null, 'https://img.openaa.com/img/banners/fb592415-540c-4cfa-ac66-161876571940.webp', 'img.openaa.com', 'ad', '91ce0e87-d933-4f97-9dc0-4899f6362044', null, null, null, null, 'active', true, '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, false, null, '2026-05-10T18:55:47.288716+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('031bc997-bb7d-43b5-8eef-55260c918c2f', 'external', null, null, null, null, 'https://img.openaa.com/img/banners/1215d9b3-f38c-4173-ad87-aa0792690bd8.png', 'img.openaa.com', 'ad', '8e386fe6-ba1e-44d9-85d3-7f3927053659', null, null, null, null, 'active', true, '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, false, null, '2026-05-10T19:00:32.063254+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('536318ec-6e21-4f2e-8369-2aba7fe65f44', 'external', null, null, null, null, 'https://img.openaa.com/img/banners/0026e90b-6c28-4674-838e-986546de21a9.png', 'img.openaa.com', 'ad', 'aae73c38-1864-4586-8f0a-21cf1d90db76', null, null, null, null, 'active', true, '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, false, null, '2026-05-10T19:05:33.157301+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('8fcbbf99-a210-4106-9be1-78ef2b6bdcec', 'external', null, null, null, null, 'https://img.openaa.com/img/banners/b720c8f2-d90c-451b-87fc-bec4179d7d61.png', 'img.openaa.com', 'ad', 'a871ccba-cd8d-44db-8320-56a7214aa496', null, null, null, null, 'active', true, '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, false, null, '2026-05-10T19:07:37.256403+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('be6b4be0-954e-4e84-87ce-c68d9bd84680', 'external', null, null, null, null, 'https://img.openaa.com/img/banners/17588ab5-0248-47ae-a9a2-b0e02e06ea5b.png', 'img.openaa.com', 'ad', 'b154837c-2241-4ae2-bf42-bae1cc8697f2', null, null, null, null, 'active', true, '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, false, null, '2026-05-10T19:10:58.074016+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('baaf9d93-d6f6-427e-83d3-8baf5361352f', 'external', null, null, null, null, 'https://img.openaa.com/img/banners/5ecd92d7-6b42-4bc5-9237-2d1b85d83ec2.png', 'img.openaa.com', 'ad', '659aa135-dbcc-4fc7-912a-b3551220117e', null, null, null, null, 'active', true, '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, false, null, '2026-05-10T19:14:42.27445+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('8e8e1206-3625-45e8-9b6c-f3ddbd857429', 'external', null, null, null, null, 'https://img.openaa.com/img/banners/4cbbab1c-a91d-4414-9889-97a8844b1e24.png', 'img.openaa.com', 'ad', '0ae817f8-2b6f-4df4-9be6-6882892053bb', null, null, null, null, 'active', true, '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, false, null, '2026-05-10T19:16:03.152662+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('2b52455d-d71a-4855-b907-07451ad0db71', 'external', null, null, null, null, 'https://img.openaa.com/img/banners/af1cf36f-b523-4b76-90f9-0e623631411f.png', 'img.openaa.com', 'ad', '3d1cae3e-ec3d-48e3-95cf-0dd8d39bd7ac', null, null, null, null, 'active', true, '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, false, null, '2026-05-10T19:17:24.06022+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('3778afb9-f2e5-4bf4-a43e-41b322932a85', 'external', null, null, null, null, 'https://img.openaa.com/img/banners/af1cf36f-b523-4b76-90f9-0e623631411f.png', 'img.openaa.com', 'ad', '1a0b1ad1-acc3-4b97-9904-5058eef7203f', null, null, null, null, 'active', true, '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, false, null, '2026-05-10T19:18:31.366069+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('b36722c5-585f-4e16-93d7-d67b0f1aaa1b', 'external', null, null, null, null, 'https://img.openaa.com/img/banners/5c6006d2-b716-43b4-98e7-cc1761718a48.png', 'img.openaa.com', 'ad', '268b8a1a-5891-4185-bea1-d00c581c8e6b', null, null, null, null, 'active', true, '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, false, null, '2026-05-10T19:19:35.195469+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('d2158abb-1a98-4f12-94a1-969d2d77e936', 'external', null, null, null, null, 'https://img.openaa.com/img/banners/4bd57d0e-08dc-4f07-a8a2-96158193c569.webp', 'img.openaa.com', 'ad', '577fc129-7dcd-4f34-8d8c-af031717af5f', null, null, null, null, 'active', true, '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, false, null, '2026-05-10T19:20:31.295881+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('78777dd7-f936-4b20-b806-5428c8dd3cdf', 'external', null, null, null, 'https://img.openaa.com/img/news/c7a91108-77d2-4b45-8123-d874f998bc82.png', 'https://img.openaa.com/img/news/c7a91108-77d2-4b45-8123-d874f998bc82.png', 'img.openaa.com', 'news_post', null, null, null, null, null, 'active', true, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"https://img.openaa.com/img/news/c7a91108-77d2-4b45-8123-d874f998bc82.png","source_type":"external","approved_for":"initial_production_content"}'::jsonb, false, null, '2026-06-01T03:12:54.069965+00:00', '2026-06-01T03:12:54.221+00:00'),
  ('8e597f96-a59a-4059-88bc-13bd3887dd15', 'external', null, null, null, 'https://img.openaa.com/img/news/openaa-first-time-user-guide.png', 'https://img.openaa.com/img/news/openaa-first-time-user-guide.png', 'img.openaa.com', 'news_post', null, null, null, null, null, 'active', true, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"https://img.openaa.com/img/news/openaa-first-time-user-guide.png","source_type":"external","approved_for":"initial_production_content"}'::jsonb, false, null, '2026-06-01T03:12:54.497491+00:00', '2026-06-01T03:12:55.849+00:00'),
  ('a013b1e3-81b0-4f05-bc91-879f91dce837', 'external', null, null, null, 'https://img.openaa.com/img/news/ny-driver-license-application-guide.png', 'https://img.openaa.com/img/news/ny-driver-license-application-guide.png', 'img.openaa.com', 'news_post', null, null, null, null, null, 'active', true, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"https://img.openaa.com/img/news/ny-driver-license-application-guide.png","source_type":"external","approved_for":"initial_production_content"}'::jsonb, false, null, '2026-06-01T03:12:54.793639+00:00', '2026-06-01T03:12:54.946+00:00'),
  ('707752a4-2b8a-4c7e-a31b-3ef35d3149a7', 'external', null, null, null, 'https://img.openaa.com/img/news/us-rental-tips-for-chinese-newcomers.png', 'https://img.openaa.com/img/news/us-rental-tips-for-chinese-newcomers.png', 'img.openaa.com', 'news_post', null, null, null, null, null, 'active', true, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"https://img.openaa.com/img/news/us-rental-tips-for-chinese-newcomers.png","source_type":"external","approved_for":"initial_production_content"}'::jsonb, false, null, '2026-06-01T03:12:55.146463+00:00', '2026-06-01T03:12:56.113+00:00'),
  ('323b70f5-1cad-491b-8a2d-76d52fd01551', 'external', null, null, null, 'https://img.openaa.com/img/news/openaa-news-center-for-ny-chinese-community.png', 'https://img.openaa.com/img/news/openaa-news-center-for-ny-chinese-community.png', 'img.openaa.com', 'news_post', null, null, null, null, null, 'active', true, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"https://img.openaa.com/img/news/openaa-news-center-for-ny-chinese-community.png","source_type":"external","approved_for":"initial_production_content"}'::jsonb, false, null, '2026-06-01T03:12:55.445336+00:00', '2026-06-01T03:12:55.594+00:00'),
  ('513accc1-94e4-41d0-ac89-c5f968a7e92d', 'external', null, null, null, 'https://img.openaa.com/img/news/us-bank-account-opening-guide.png', 'https://img.openaa.com/img/news/us-bank-account-opening-guide.png', 'img.openaa.com', 'news_post', null, null, null, null, null, 'active', true, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"https://img.openaa.com/img/news/us-bank-account-opening-guide.png","source_type":"external","approved_for":"initial_production_content"}'::jsonb, false, null, '2026-06-01T03:12:56.225934+00:00', '2026-06-01T03:12:56.376+00:00'),
  ('873697e1-eea7-409a-8818-bacb48c26467', 'external', null, null, null, 'https://img.openaa.com/img/dmv/uscis-annual-asylum-fee-payment-guide.png', 'https://img.openaa.com/img/dmv/uscis-annual-asylum-fee-payment-guide.png', 'img.openaa.com', 'news_post', null, null, null, null, null, 'active', true, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"https://img.openaa.com/img/dmv/uscis-annual-asylum-fee-payment-guide.png","source_type":"external","approved_for":"initial_production_content"}'::jsonb, false, null, '2026-06-01T03:12:56.83357+00:00', '2026-06-01T03:12:56.984+00:00'),
  ('12631c15-62c3-48ee-96f7-2ea20c72708b', 'external', null, null, null, 'https://img.openaa.com/img/dmv/uscis-fee-rule-may-2026.png', 'https://img.openaa.com/img/dmv/uscis-fee-rule-may-2026.png', 'img.openaa.com', 'news_post', null, null, null, null, null, 'active', true, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"https://img.openaa.com/img/dmv/uscis-fee-rule-may-2026.png","source_type":"external","approved_for":"initial_production_content"}'::jsonb, false, null, '2026-06-01T03:12:57.386673+00:00', '2026-06-01T03:12:57.536+00:00'),
  ('21752893-4e23-43ee-ba56-0aa73eb45235', 'external', null, null, null, 'https://img.openaa.com/img/dmv/ny-road-test-schedule-guide.png', 'https://img.openaa.com/img/dmv/ny-road-test-schedule-guide.png', 'img.openaa.com', 'news_post', null, null, null, null, null, 'active', true, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"https://img.openaa.com/img/dmv/ny-road-test-schedule-guide.png","source_type":"external","approved_for":"initial_production_content"}'::jsonb, false, null, '2026-06-01T03:12:57.693884+00:00', '2026-06-01T03:12:58.662+00:00'),
  ('516b969c-6bfc-4609-b651-fbd6f135dcdd', 'external', null, null, null, 'https://img.openaa.com/img/dmv/ny-dmv-permit-test-prepare.png', 'https://img.openaa.com/img/dmv/ny-dmv-permit-test-prepare.png', 'img.openaa.com', 'news_post', null, null, null, null, null, 'active', true, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"https://img.openaa.com/img/dmv/ny-dmv-permit-test-prepare.png","source_type":"external","approved_for":"initial_production_content"}'::jsonb, false, null, '2026-06-01T03:12:57.991975+00:00', '2026-06-01T03:12:58.142+00:00'),
  ('1f506579-bf79-4555-a221-85d37e9a4968', 'external', null, null, null, 'https://img.openaa.com/img/dmv/what-is-learner-permit-ny.png', 'https://img.openaa.com/img/dmv/what-is-learner-permit-ny.png', 'img.openaa.com', 'news_post', null, null, null, null, null, 'active', true, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"https://img.openaa.com/img/dmv/what-is-learner-permit-ny.png","source_type":"external","approved_for":"initial_production_content"}'::jsonb, false, null, '2026-06-01T03:12:58.257563+00:00', '2026-06-01T03:12:58.407+00:00'),
  ('9dbf8e2b-8007-43f0-b7a0-f3c145ace731', 'external', null, null, null, 'https://img.openaa.com/img/dmv/new-driver-after-buying-car-ny.png', 'https://img.openaa.com/img/dmv/new-driver-after-buying-car-ny.png', 'img.openaa.com', 'news_post', null, null, null, null, null, 'active', true, '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"https://img.openaa.com/img/dmv/new-driver-after-buying-car-ny.png","source_type":"external","approved_for":"initial_production_content"}'::jsonb, false, null, '2026-06-01T03:12:58.772758+00:00', '2026-06-01T03:12:58.923+00:00'),
  ('ebcd3909-0543-41aa-a37c-3be2225cfbba', 'external', null, null, null, null, 'https://img.openaa.com/img/banners/ed34e822-4982-40ec-90d1-adbbcbfb13b7.png', 'img.openaa.com', 'ad', '6d5e794e-3c00-4b5e-aea0-e37da8765db5', null, null, null, null, 'active', true, '{}'::jsonb, false, null, '2026-06-21T12:53:49.184315+00:00', '2026-06-21T12:53:49.184315+00:00'),
  ('d288fb9f-f0cb-4205-ad88-c891924a82e8', 'external', null, null, null, null, 'https://img.openaa.com/img/news/openaa-official-launch-ny-chinese-life-platform.png', 'img.openaa.com', 'news_post', 'cf6cd563-58a6-4d5d-a993-c37e201d0102', null, null, null, null, 'active', true, '{}'::jsonb, false, null, '2026-06-21T20:30:37.318559+00:00', '2026-06-21T20:30:37.318559+00:00');

insert into public.site_settings (key, value, is_public, description)
values
  ('admin_bootstrap', '{"status":"manual-bootstrap-required","firstSuperAdminEmail":"fengjiancheng8@gmail.com"}'::jsonb, false, 'Non-secret bootstrap note. Insert the first super_admin manually after the user signs up.'),
  ('daily_post_limit', '{"dailyPostLimit":10}'::jsonb, false, '每个账号每天最多可发布的信息总数。'),
  ('default_marketplace_placeholder_image', '{"url":"https://img.openaa.com/img/icons/openaa-secondhand-placeholder.png","sourceType":"external","imageAssetId":"58b3a82e-c24e-453f-9827-be1e6f2d2d87"}'::jsonb, true, '二手信息没有用户上传图片时使用的默认占位图片。'),
  ('default_service_placeholder_image', '{"url":"https://img.openaa.com/img/icons/openaa-service-placeholder.png","sourceType":"external","imageAssetId":"8aa42394-f012-4eaf-aefc-4bd232df024a"}'::jsonb, true, '本地服务信息没有用户上传图片时使用的默认占位图片。'),
  ('dmv_disclaimer', '{"text":"OpenAA 纽约 DMV 中文练习题库，仅供学习参考，实际考试内容以 New York DMV 官方资料为准。"}'::jsonb, true, 'Public DMV disclaimer copy.'),
  ('domain_strategy', '{"appDomain":"openaa.app","allowedDomains":["openaa.app","openaa.com","openaa.cn"],"redirectDomains":["openaa.cn"],"canonicalBaseUrl":"https://openaa.com","primarySeoDomain":"openaa.com"}'::jsonb, true, 'Canonical and domain strategy for OpenAA.'),
  ('recycle_bin_admin_retention_days', '{"days":20}'::jsonb, false, '回收站中管理员删除内容的保留天数。'),
  ('recycle_bin_image_retention_days', '{"days":30}'::jsonb, false, '图片清理工具中标记删除图片的保留天数。'),
  ('recycle_bin_navigation_retention_days', '{"days":90}'::jsonb, false, '回收站中公共导航内容的保留天数。'),
  ('recycle_bin_news_retention_days', '{"days":90}'::jsonb, false, '回收站中新闻内容的保留天数。'),
  ('recycle_bin_user_retention_days', '{"days":10}'::jsonb, false, '回收站中用户删除内容的保留天数。')
on conflict (key) do update set value = excluded.value, is_public = excluded.is_public, description = excluded.description, updated_at = now();

insert into public.home_sections (key, title, description, module, config, is_visible, sort_order)
values
  ('quick_grid', '8 宫格入口', '首页 8 宫格入口配置。', 'quick_grid', '{"items":[{"href":"/jobs","icon":"briefcase","label":"招聘","is_visible":true,"sort_order":10},{"href":"/housing","icon":"home","label":"房屋","is_visible":true,"sort_order":20},{"href":"/marketplace","icon":"shopping-bag","label":"二手","metadata":{"notes":["mapped_secondhand_to_marketplace"]},"is_visible":true,"sort_order":30},{"href":"/dmv","icon":"car","label":"DMV","is_visible":true,"sort_order":40},{"href":"/news","icon":"newspaper","label":"新闻","is_visible":true,"sort_order":50},{"href":"/navigation","icon":"navigation","label":"导航","is_visible":true,"sort_order":60},{"href":"/news?category=newcomer-guide","icon":"book-open-check","label":"新手指南","is_visible":true,"sort_order":70},{"href":"/services","icon":"store","label":"本地服务","is_visible":true,"sort_order":80}],"metadata":{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"quick_grid","approved_for":"initial_production_content","legacy_source":"GridMenu"}}'::jsonb, true, 10),
  ('utility_tools', '实用工具', '首页实用工具入口配置。', 'utility_tools', '{"items":[{"cta":"练习","href":"/dmv","icon":"dmv","theme":"blue","title":"DMV 笔试练习","open_mode":"same","is_visible":true,"sort_order":10,"description":"中文题库、练习模式、模拟考试入口。"},{"cta":"查询","href":"/dmv/tickets","icon":"ticket","theme":"orange","title":"罚单查询","open_mode":"same","is_visible":true,"sort_order":20,"description":"停车、闯红灯、超速拍照查询入口。"},{"cta":"打开","href":"/navigation","icon":"navigation","theme":"cyan","title":"常用导航","open_mode":"same","is_visible":true,"sort_order":30,"description":"政府服务、交通、生活网站入口。"},{"cta":"查看","href":"/news?category=newcomer-guide","icon":"guide","theme":"amber","title":"新手指南","open_mode":"same","is_visible":true,"sort_order":40,"description":"纽约生活、证件、交通和常用信息。"}],"metadata":{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"utility_tools","approved_for":"initial_production_content","legacy_source":"fallbackUtilityTools"}}'::jsonb, true, 20),
  ('latest_posts', '最新发布', '首页最新发布模块配置。', 'home', '{"sections":[{"key":"jobs","route":"/jobs","title":"最新招聘","layout":"grid","nav_label":"招聘","post_type":"job","is_visible":true,"sort_order":10,"description":"纽约华人招聘、求职、兼职和全职信息。","limit_count":4,"empty_message":"暂无最新招聘。"},{"key":"housing","route":"/housing","title":"最新房屋","layout":"grid","nav_label":"房屋","post_type":"housing","is_visible":true,"sort_order":20,"description":"租房、求租、合租和房屋信息。","limit_count":4,"empty_message":"暂无最新房屋信息。"},{"key":"marketplace","route":"/secondhand","title":"最新二手","layout":"grid","nav_label":"二手","post_type":"marketplace","is_visible":true,"sort_order":30,"description":"出售、求购和跳蚤市场信息。","limit_count":4,"empty_message":"暂无最新二手信息。"},{"key":"services","route":"/services","title":"本地服务","layout":"media","nav_label":"服务","post_type":"service","is_visible":true,"sort_order":40,"description":"搬家、维修、装修、报税等服务。","limit_count":4,"empty_message":"暂无最新本地服务。"},{"key":"news","route":"/news","title":"最新新闻","layout":"news","nav_label":"新闻","post_type":"news","is_visible":true,"sort_order":50,"description":"本地新闻、新手指南、DMV 教程和平台公告。","limit_count":3,"empty_message":"暂无最新新闻。"}]}'::jsonb, true, 30),
  ('seo_content', 'SEO 文案', '首页 SEO 文案配置。', 'seo_content', '{"title":"OpenAA 纽约华人生活入口","content":"OpenAA 是一个为美国华人和美华人提供生活信息的中文平台，涵盖华人招聘、找工作、房屋租售、二手市场、本地服务、DMV 驾照信息、新闻资讯和实用导航。平台重点服务纽约及周边华人用户，也适合更多在美国生活的中文用户使用。","metadata":{"notes":["needs_domain_review"],"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"seo_content","approved_for":"initial_production_content","legacy_source":"public_home_page"}}'::jsonb, true, 90)
on conflict (key) do update set title = excluded.title, description = excluded.description, module = excluded.module, config = excluded.config, is_visible = excluded.is_visible, sort_order = excluded.sort_order, updated_at = now();

insert into public.top_quick_links (key, city_id, title, href, icon, image_asset_id, open_mode, sort_order, is_active, metadata)
values
  ('openaa-tools', 'ny', 'OpenAA工具', 'https://tools.openaa.com/', null, null, 'new', 0, true, '{"source":"openaa-app-remote","remote_key":"openaa工具-1782073357713"}'::jsonb),
  ('openaa-web', 'ny', 'OpenAA网页版', 'https://go.openaa.com/', 'globe', null, 'new', 10, true, '{"source":"openaa-app-remote","remote_key":"legacy-bde9619a-3a64-43d4-9512-2e312df03655"}'::jsonb),
  ('navigation', 'ny', '导航', '/navigation', 'navigation', null, 'same', 20, true, '{"source":"openaa-app-remote","remote_key":"legacy-c31e6546-1a03-43a4-8dd5-4f81702729df"}'::jsonb),
  ('gpt', 'ny', 'GPT', 'https://chatgpt.com/', 'bot', null, 'new', 30, true, '{"source":"openaa-app-remote","remote_key":"legacy-eff4dbcd-49ac-48c9-89a6-0ca70e2e982e"}'::jsonb),
  ('jobs', 'ny', '招聘', '/jobs', 'briefcase', null, 'same', 40, true, '{"source":"openaa-app-remote","remote_key":"legacy-316665f2-dc66-4c75-b5ab-c298e776fba5"}'::jsonb),
  ('housing', 'ny', '房屋', '/housing', 'home', null, 'same', 50, true, '{"source":"openaa-app-remote","remote_key":"legacy-9e7b340c-fa22-4baf-9ffa-22a6db0d0520"}'::jsonb),
  ('secondhand', 'ny', '二手', '/marketplace', 'shopping-bag', null, 'same', 60, true, '{"source":"openaa-app-remote","remote_key":"legacy-3096a011-d593-47a9-a695-f425344fe44a"}'::jsonb),
  ('news', 'ny', '新闻', '/news', 'newspaper', null, 'same', 70, true, '{"source":"openaa-app-remote","remote_key":"legacy-6d56716b-bd31-4749-8ae2-2d2bc4abf134"}'::jsonb),
  ('feedback', 'ny', '线索与建议', '/feedback', 'message-square', null, 'same', 80, true, '{"source":"openaa-app-remote","remote_key":"feedback"}'::jsonb),
  ('services', 'ny', '本地服务', '/services', 'wrench', null, 'same', 80, true, '{"source":"openaa-app-remote","remote_key":"legacy-27841ad8-6917-4fa8-9bbb-701b5d805e63"}'::jsonb),
  ('dmv', 'ny', 'DMV', '/dmv', 'car', null, 'same', 90, true, '{"source":"openaa-app-remote","remote_key":"legacy-9cdbec15-3de8-4b7b-b104-3b73a89d139f"}'::jsonb),
  ('about-openaa', 'ny', '关于 OpenAA', 'https://openaa.com/about/', 'info', null, 'new', 100, true, '{"source":"openaa-app-remote","remote_key":"legacy-417946c7-3ad8-432b-89f7-908a616d0593"}'::jsonb),
  ('search', 'ny', '站内搜索', '/search', 'search', null, 'same', 110, true, '{"source":"openaa-app-remote","remote_key":"legacy-425b387d-cac2-4955-9529-aae875be0945"}'::jsonb)
on conflict (key) do update set city_id = excluded.city_id, title = excluded.title, href = excluded.href, icon = excluded.icon, image_asset_id = excluded.image_asset_id, open_mode = excluded.open_mode, sort_order = excluded.sort_order, is_active = excluded.is_active, metadata = excluded.metadata, updated_at = now();

insert into public.latest_ticker_global_settings (id, is_enabled, interval_seconds)
values
  (1, true, 4)
on conflict (id) do update set is_enabled = excluded.is_enabled, interval_seconds = excluded.interval_seconds;

insert into public.latest_ticker_sections (section_key, section_name, is_enabled, sort_order, display_count)
values
  ('news', '新闻', true, 10, 5),
  ('jobs', '招聘', true, 20, 3),
  ('housing', '房屋', true, 30, 3),
  ('marketplace', '二手 / 市场', true, 40, 3),
  ('services', '本地服务', true, 50, 3)
on conflict (section_key) do update set section_name = excluded.section_name, is_enabled = excluded.is_enabled, sort_order = excluded.sort_order, display_count = excluded.display_count;

insert into public.latest_ticker (id, title, href, module, is_enabled, sort_order, starts_at, ends_at, created_at, updated_at)
values
  ('e912dafc-9e8f-415a-bdfd-fbaa10ea286e', '??', '/news', 'news', true, 10, null, null, '2026-06-01T03:12:50.934313+00:00', '2026-06-01T03:12:51.017+00:00'),
  ('48aa28fb-dba8-415a-9bc1-046b89ca97a6', '??', '/jobs', 'jobs', true, 20, null, null, '2026-06-01T03:12:51.244047+00:00', '2026-06-01T03:12:51.399+00:00'),
  ('7cd26598-48be-4598-8330-227dc06ad3c5', '??', '/housing', 'housing', true, 30, null, null, '2026-06-01T03:12:51.613509+00:00', '2026-06-01T03:12:51.763+00:00'),
  ('74d076f2-7e86-4d6c-9f0c-f952373d8189', '??', '/marketplace', 'marketplace', true, 40, null, null, '2026-06-01T03:12:51.87592+00:00', '2026-06-01T03:12:52.03+00:00'),
  ('d47088a1-3054-469a-ad98-8d28eb901e7f', '????', '/services', 'services', true, 50, null, null, '2026-06-01T03:12:52.233814+00:00', '2026-06-01T03:12:52.379+00:00');

insert into public.notification_templates (key, title, body, is_active, metadata)
values
  ('account_notice', '账号提醒', '你的账号或资料需要注意，请进入个人中心查看并处理。', true, '{"type":"account","target_type":"profile"}'::jsonb),
  ('admin_post_deleted', '信息已被删除', '因收到用户反馈、举报或平台审核发现问题，你的信息已被删除并移入回收站。如有疑问，请联系网站管理员。', true, '{"type":"content","target_type":"post"}'::jsonb),
  ('admin_post_hidden', '信息已被下架', '因收到用户反馈、举报或平台审核发现问题，你的信息已被下架，当前不会公开显示。如有疑问，请联系网站管理员。', true, '{"type":"content","target_type":"post"}'::jsonb),
  ('admin_post_published', '信息已恢复显示', '你的信息已恢复公开显示，用户现在可以正常查看。', true, '{"type":"content","target_type":"post"}'::jsonb),
  ('admin_post_rejected', '信息未通过审核', '因内容不符合平台发布要求，你的信息未通过审核，请根据提示修改后重新提交。', true, '{"type":"content","target_type":"post"}'::jsonb),
  ('admin_post_restored', '信息已恢复', '你的已删除信息已由管理员恢复。当前状态为未上架，如需重新公开显示，请进入我的发布，点击恢复显示或重新上架。', true, '{"type":"content","target_type":"post"}'::jsonb),
  ('contact_issue', '联系方式需要修改', '你的联系方式可能不完整或格式不正确，请修改后重新提交。', true, '{"type":"content","target_type":"post"}'::jsonb),
  ('content_issue', '内容需要修改', '你的信息内容存在问题，请修改后重新提交。', true, '{"type":"content","target_type":"post"}'::jsonb),
  ('duplicate_post', '重复发布提醒', '你的信息可能存在重复发布，请保留一条有效信息，避免影响展示。', true, '{"type":"content","target_type":"post"}'::jsonb),
  ('image_issue', '图片需要修改', '你的信息图片存在问题，请更换图片后重新提交。', true, '{"type":"content","target_type":"post"}'::jsonb),
  ('missing_info', '信息需要补充', '你的信息内容不够完整，请补充必要信息后重新提交。', true, '{"type":"content","target_type":"post"}'::jsonb),
  ('system_announcement', '平台通知', '这是一条平台通知，请进入通知中心查看详情。', true, '{"type":"system","target_type":null}'::jsonb),
  ('wrong_category', '分类需要修改', '你的发布内容分类可能选择不正确，请重新选择合适的分类后再上架。', true, '{"type":"content","target_type":"post"}'::jsonb)
on conflict (key) do update set title = excluded.title, body = excluded.body, is_active = excluded.is_active, metadata = excluded.metadata, updated_at = now();

insert into public.news_categories (id, slug, name, description, sort_order, is_active, created_at, updated_at)
values
  ('d6a072c8-9d8d-4e10-b334-35ebf801c23d', 'local-news', '本地新闻', '纽约华人本地新闻和社区资讯。', 10, true, '2026-06-01T03:09:35.078805+00:00', '2026-06-01T03:12:52.591+00:00'),
  ('022b268e-456c-4d2b-a544-c1bf3eb4ccec', 'newcomer-guide', '新手指南', '面向新移民、留学生和美国华人新用户的生活入门指南。', 20, true, '2026-06-01T03:09:35.078805+00:00', '2026-06-01T03:12:52.862+00:00'),
  ('2798e7eb-4ab5-4c4b-a854-3ad81133a8d6', 'dmv-guide', 'DMV 教程', '纽约 DMV、驾照、罚单和出行相关教程。', 30, true, '2026-06-01T03:09:35.078805+00:00', '2026-06-01T03:12:53.201+00:00'),
  ('89cbc71a-3d54-4d12-a23d-bfd017ddb851', 'life-guide', '生活指南', '美国华人日常生活、租房、银行、手机和办事指南。', 40, true, '2026-06-01T03:09:35.078805+00:00', '2026-06-01T03:12:53.451+00:00'),
  ('07ce32c3-18f8-40d8-9f57-5fecb0ae9a2b', 'announcement', '平台公告', 'OpenAA 平台公告、规则提醒和功能说明。', 50, true, '2026-06-01T03:09:35.078805+00:00', '2026-06-01T03:12:53.813+00:00')
on conflict (slug) do update set name = excluded.name, description = excluded.description, sort_order = excluded.sort_order, is_active = excluded.is_active, updated_at = excluded.updated_at;

insert into public.news_posts (id, category_id, title, slug, excerpt, body, cover_image_asset_id, status, is_featured, is_pinned, pinned_order, pinned_until, published_at, seo_title, seo_description, metadata, created_at, updated_at)
values
  ('cf6cd563-58a6-4d5d-a993-c37e201d0102', 'd6a072c8-9d8d-4e10-b334-35ebf801c23d', 'OpenAA 正式上线：纽约华人生活入口平台，招聘、房屋、二手、DMV、新闻与本地服务一站式整合', 'openaa-official-launch-ny-chinese-life-platform', 'OpenAA 正式上线，服务纽约及周边华人，提供招聘求职、房屋租售、二手交易、DMV 驾照笔试、罚单查询、新闻资讯、本地服务和常用网站导航，打造实用、简洁、手机友好的华人生活入口。', 'OpenAA 正式上线了。

OpenAA 是一个面向纽约及周边华人的生活信息平台，希望帮助在美国生活、工作、学习和创业的华人，更方便地找到真实、有用、常用的信息。

网站目前主域名为：

https://openaa.com/

OpenAA 的定位很简单：

做一个纽约华人日常生活入口。

很多华人在美国生活时，经常会遇到这些问题：找工作不知道去哪里看，租房信息分散，二手物品不好发布，考驾照英文看不懂，DMV 流程复杂，本地服务不容易找到，常用网站也经常要到处搜索。

OpenAA 希望把这些常用功能集中在一个平台里，让用户打开网站后，就能快速进入自己需要的板块。

目前 OpenAA 已上线多个核心功能：

一、招聘求职

OpenAA 提供招聘信息发布和浏览功能，适合餐馆、装修、仓库、司机、办公室、兼职等本地岗位发布。用户可以按地区、分类查看招聘信息，也可以登录后发布自己的招聘内容。

平台希望让招聘信息更清晰、更容易查看，也方便雇主和求职者之间直接联系。

二、房屋租售

房屋板块主要服务纽约及周边华人租房、找房、转租和房屋相关信息发布。用户可以查看房源标题、地区、介绍、图片和联系方式，方便快速了解房屋情况。

无论是找单房、整租、合租，还是发布出租信息，都可以通过 OpenAA 更方便地展示。

三、二手闲置

二手板块适合发布家具、电器、手机、电脑、生活用品、车辆相关用品等闲置物品。用户可以上传图片、填写说明，让附近用户更容易看到。

很多华人搬家、换家具、处理闲置物品时，都需要一个简单好用的平台。OpenAA 希望让二手信息发布更方便，也让买家更容易找到合适物品。

四、本地服务

OpenAA 本地服务板块面向华人日常生活需求，例如搬家、装修、清洁、维修、汽车服务、会计报税、法律咨询、电脑手机维修等。

服务商可以发布服务信息，用户可以按分类和地区查找。这个板块的目标是做成一个轻量实用的华人本地服务黄页。

五、DMV 驾照与罚单服务

DMV 是很多新移民和华人用户非常关心的内容。OpenAA 已经整理 DMV 相关入口，包括纽约 DMV 笔试练习、模拟考试、题库查看、错题练习、罚单查询等功能。

特别是纽约驾照笔试，对英文不熟悉的用户来说比较困难。OpenAA 希望通过中文说明、练习题和清晰流程，帮助更多华人顺利了解 DMV 办理步骤。

六、新闻资讯

OpenAA 新闻资讯中心会发布与纽约华人生活相关的实用内容，包括本地新闻、新手指南、DMV 教程、生活指南和平台公告。

新闻板块不仅是资讯发布，也是 OpenAA 后续 SEO 和内容沉淀的重要部分。未来会继续增加更多适合华人搜索和阅读的实用文章。

七、常用网站导航

OpenAA 也提供常用网站导航功能，把政府服务、银行金融、保险、购物、社交媒体、视频平台、邮箱服务、AI 工具等常用链接集中整理，方便用户快速打开。

对于很多不熟悉英文网站或不想反复搜索的用户来说，一个清晰的中文导航页会非常实用。

八、手机端优先体验

OpenAA 从一开始就重视手机端体验。因为大多数用户查看招聘、房屋、二手、DMV 和本地服务时，都是用手机打开。

网站整体设计尽量保持简洁、清楚、容易点击。底部导航、返回顶部、分类栏、图片展示、详情页返回按钮等，都按照手机使用习惯进行优化。

OpenAA 适合哪些用户？

OpenAA 主要适合以下人群：

在纽约生活的华人；

刚来美国的新移民；

正在找工作、找房、处理二手物品的用户；

准备考纽约驾照笔试的人；

需要本地服务的家庭或商家；

希望快速找到常用网站和生活信息的人；

需要发布招聘、房屋、服务、二手信息的用户。

OpenAA 后续还会继续完善

OpenAA 目前仍在持续优化中。后续会继续完善用户体验、后台管理、内容发布、搜索功能、SEO 收录、导航功能、图片展示和更多生活服务模块。

OpenAA 的目标不是做一个复杂难用的网站，而是做一个稳定、实用、打开就能用的华人生活入口。

未来，OpenAA 会继续围绕纽约华人真实生活需求，逐步增加更多实用内容和功能，让用户找信息更快，发布信息更方便，生活办事更省心。

欢迎访问 OpenAA：

https://openaa.com/

OpenAA · 美国华人生活入口', 'd288fb9f-f0cb-4205-ad88-c891924a82e8', 'published', false, false, 0, null, '2026-05-17T18:25:00+00:00', 'OpenAA 正式上线｜纽约华人生活入口平台｜招聘房屋二手DMV本地服务', 'OpenAA 正式上线，服务纽约及周边华人，提供招聘求职、房屋租售、二手交易、DMV 驾照笔试、罚单查询、新闻资讯、本地服务和常用网站导航，打造实用、简洁、手机友好的华人生活入口。', '{"notes":["needs_freshness_review"],"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"openaa-official-launch-ny-chinese-life-platform","source_url":"https://ny.openaa.com/news/openaa-official-launch-ny-chinese-life-platform","approved_for":"initial_production_content"}'::jsonb, '2026-06-01T03:12:57.258907+00:00', '2026-06-21T20:30:37.355+00:00'),
  ('a9fff785-9d1c-4aea-9048-32b3617d577f', 'd6a072c8-9d8d-4e10-b334-35ebf801c23d', 'USCIS 庇护年费现在可以自己网上查询了｜很多律师不会主动通知', 'uscis-annual-asylum-fee-payment-guide', 'USCIS 庇护年费现在可以自己网上查询，不再只能等律师通知。本文整理 USCIS 官方查询入口、A Number 与 Receipt Number 填写方法、如何查看是否需要缴费，以及网上付款步骤中文说明。', '如果你的庇护案件目前还在 USCIS 等待处理中，现在有一个很多华人还不知道的重要变化：

你已经可以自己直接上网查询，到底需不需要缴纳 USCIS 庇护年费了。

以前，很多人只能等律师楼通知。

但现实情况是，有些律师楼可能不会第一时间提醒，甚至有人直到快超期才知道需要缴费。

现在 USCIS 已提供官方网上查询页面，用户可以自己直接查询是否需要缴费，也可以直接在线付款。

这对于很多华人来说，会方便很多。

一、什么是 USCIS 庇护年费？

部分庇护申请案件，在达到一定等待时间后，USCIS 可能会要求申请人缴纳 Annual Asylum Fee（庇护年费）。

目前不少通知中的金额显示为：

$102

但 USCIS 的费用、规则和政策未来都有可能变化，所以最终还是以移民局官方通知为准。

二、为什么建议自己查询？

很多华人用户现在最大的担心是：

“我到底有没有被要求缴费？”

“律师为什么没有通知我？”

“如果没及时缴费，会不会影响案件？”

实际上，现在 USCIS 已经提供了官方在线查询系统。

即使律师没有联系你，你也可以自己登录官方页面查看。

这样至少能知道：

自己目前是否需要缴费；

系统是否已经生成付款要求；

是否已经进入需要缴费阶段。

三、USCIS 官方查询入口:https://my.uscis.gov/accounts/annual-asylum-fee/questionnaire

USCIS 官方查询与缴费页面：

USCIS Annual Asylum Fee 官方页面

进入页面后，按提示填写信息即可。

四、需要准备什么信息？

进入 USCIS 页面后，系统一般会要求填写：

1，A Number（A 号码）

通常是以 A 开头的移民号码。

例如：

A123456789

2，Receipt Number（收据号）

一般是 USCIS 通知上的收据号码。

通常格式为：

三个英文字母 + 10 位数字

例如：

IOE1234567890

这些信息通常可以在：

USCIS 通知；

律师发来的文件；

I-797 收据；

案件通知图片；

里面找到。

五、填写完成后怎样看是否需要缴费？

填写 A Number 和 Receipt Number 后，页面会继续进入下一步。

如果你的案件目前已经符合缴费要求，系统一般会显示：

需要缴纳的金额；

付款页面；

付款按钮。

如果系统没有要求缴费，也可能会显示暂时不需要付款。

因此，现在最重要的是：

不要只等律师通知。

自己也可以定期上网检查。

六、如果需要缴费，可以直接网上付款

如果系统显示需要付款，可以直接在线完成缴费。

目前 USCIS 页面一般支持两种付款方式：

1，Bank account（银行账户）

需要填写：

Routing Number；

Account Number；

账户姓名等信息。

2，Debit or credit card（借记卡或信用卡）

需要填写：

银行卡号；

有效期；

安全码；

账单地址等信息。

确认信息后，勾选确认框，然后继续提交即可。

七、缴费成功后会怎样？

如果付款成功，页面一般会显示类似：

You successfully submitted your Annual Asylum Fee

建议：

立即截图保存；

保存付款确认页面；

必要时发给律师楼确认；

同时保存付款邮件记录。

八、几个非常重要的提醒

1，尽量使用 USCIS 官方网站查询和付款。

不要随便点击陌生短信或陌生链接。

2，填写 A Number 和 Receipt Number 时一定要仔细确认。

信息错误可能导致查询失败。

3，如果收到通知后，建议尽量及时处理。

不要长期拖延。

4，如果自己不会操作，可以请律师或专业人士协助。

但现在至少已经可以自己先查询。

5，USCIS 政策未来可能变化。

包括金额、期限、规则和页面内容，都可能调整。

OpenAA 提醒

现在很多华人还不知道：

USCIS 庇护年费已经可以自己网上查询。

以前很多人完全依赖律师通知，但现在即使律师没有主动联系，你也可以自己先到 USCIS 官方网站检查。

至少能知道：

自己目前是否已经进入需要缴费阶段。

对于很多等待庇护案件的华人来说，这会更安心一些。

最终规则、费用和案件要求，请以 USCIS 官方通知和律师意见为准。', '873697e1-eea7-409a-8818-bacb48c26467', 'published', false, false, 0, null, '2026-05-17T00:27:58.53+00:00', 'USCIS 庇护年费怎么查｜现在可以自己网上查询是否需要缴费｜华人中文教程', 'USCIS 庇护年费现在可以自己网上查询，不再只能等律师通知。本文整理 USCIS 官方查询入口、A Number 与 Receipt Number 填写方法、如何查看是否需要缴费，以及网上付款步骤中文说明。', '{"notes":["needs_freshness_review"],"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"uscis-annual-asylum-fee-payment-guide","source_url":"https://ny.openaa.com/news/uscis-annual-asylum-fee-payment-guide","approved_for":"initial_production_content"}'::jsonb, '2026-06-01T03:12:56.955568+00:00', '2026-06-01T03:12:57.105+00:00'),
  ('62408d49-b821-4507-ae37-bdffaeab0f0d', 'd6a072c8-9d8d-4e10-b334-35ebf801c23d', '2026 美国移民局缴费新规来了？5月29日后这些费用和规定要特别注意', 'uscis-fee-rule-may-2026', '美国 USCIS 2026 最新缴费规则整理，包括 5 月 29 日后生效的新费用、庇护年费、拒件风险和华人申请人需要注意的问题。', '最近很多华人圈都在讨论：“5 月 29 日后，如果没有按时缴费，会不会影响移民申请？”

根据美国 USCIS（美国移民局）和 DHS（国土安全部）近期公布的新规则，2026 年开始，部分移民申请、庇护申请和相关表格，确实出现了新的费用和更严格的缴费要求。

这次更新，最受关注的是：

一些 USCIS 表格费用上涨

新增年度庇护费用（Annual Asylum Fee）

某些申请如果没有正确缴费，可能直接被拒件

2026 年 5 月 29 日后，部分规则正式生效

下面用简单中文整理一下重点。

一、5 月 29 日后有什么变化？

根据 USCIS 和 DHS 公布的信息，新的 USCIS Immigration Fees Rule（移民费用规则）将在 2026 年 5 月 29 日开始正式实施。

重点之一是：

某些申请如果没有按规定缴费，USCIS 会直接拒收（Reject）或拒绝处理。

例如：

I-102

I-589（庇护申请）

某些工作许可相关申请

部分移民福利申请

USCIS 官方已经说明：

如果申请在 2026 年 5 月 29 日之后寄出（postmarked），但没有附上正确费用，可能直接被退件。

二、什么是新的“庇护年费”？

这次变化里，最引人注意的是：

Annual Asylum Fee（年度庇护费用）

简单理解：

如果你的 I-589 庇护申请已经 pending（等待处理中）超过 1 年，之后 USCIS 可能会要求你每年缴一次费用。

USCIS 说明：

庇护申请 pending 满 365 天后

USCIS 会寄通知

申请人需要按通知缴费

之后每年可能都需要继续缴费

如果没有按时缴费，可能产生严重后果。

三、不缴费会怎样？

目前 USCIS 和相关移民法律提醒：

如果收到缴费通知后长期不处理，可能会：

庇护申请被拒绝

申请被终止

某些福利失效

工作许可受影响

甚至可能影响后续身份处理

特别是：

地址一定要更新。

如果你搬家了，但没有更新 USCIS 地址，可能收不到缴费通知。

USCIS 规定：

非美国公民更换地址后，一般需要在 10 天内更新地址。

很多华人最容易忽略这一点。

四、现在 USCIS 缴费还有哪些变化？

除了 5 月的新规则外，USCIS 2026 年还有几项变化：

1）部分费用上涨

USCIS 在 2026 年已经调整部分费用，包括：

I-140

I-129

Premium Processing（加急处理）

工作许可

某些移民申请

部分费用因为通货膨胀再次提高。

2）越来越偏向电子支付

USCIS 正逐步改成：

在线缴费

ACH 银行转账

信用卡

电子付款

部分纸质支票处理正在减少。

3）付款错误更容易被拒

USCIS 现在对：

签名

金额

支票

表格版本

缴费方式

审核更严格。

以前有些小错误还能补，现在很多情况可能直接 Reject。

五、华人申请人现在最应该注意什么？

1）不要拖到最后一天

很多人喜欢最后几天才寄材料。

现在规则变化多，费用也容易改，最好提前确认。

2）确认最新费用

不要只看旧 YouTube 视频。

USCIS 经常更新费用。

提交前一定要查看 USCIS 官方费用页面。

3）搬家一定更新地址

这是很多华人最容易踩坑的地方。

如果收不到通知，可能错过缴费时间。

4）收到缴费通知不要忽略

特别是：

庇护申请

工作许可

Pending 超过 1 年的案件

最好第一时间确认。

六、OpenAA 提醒

最近美国移民规则变化非常快。

网上很多旧视频、旧文章，已经不一定准确。

尤其是：

费用

缴费时间

表格版本

邮寄地址

在线提交规则

都可能变化。

如果你的案件比较复杂，或者涉及：

庇护

工卡

身份转换

绿卡

上庭

被要求补件

建议直接查看 USCIS 官方网站，或者咨询专业移民律师。', '12631c15-62c3-48ee-96f7-2ea20c72708b', 'published', false, true, 0, null, '2026-05-17T00:21:21.848+00:00', 'USCIS 2026 缴费新规｜5月29日后不缴费可能被拒件', '美国 USCIS 2026 最新缴费规则整理，包括 5 月 29 日后生效的新费用、庇护年费、拒件风险和华人申请人需要注意的问题。', '{"notes":["needs_freshness_review"],"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"uscis-fee-rule-may-2026","source_url":"https://ny.openaa.com/news/uscis-fee-rule-may-2026","approved_for":"initial_production_content"}'::jsonb, '2026-06-01T03:12:57.514196+00:00', '2026-06-14T04:42:02.063+00:00'),
  ('f66e292f-d19b-4c8d-8517-37937bbb7911', '2798e7eb-4ab5-4c4b-a854-3ad81133a8d6', '新手买车后需要做什么？', 'new-driver-after-buying-car-ny', '纽约新手买车后注意事项，包括车辆保险、注册、车牌、验车、停车罚单和日常驾驶提醒。 正文：', '在纽约买车后，不是拿到钥匙就可以放心开走。新手最容易忽略的是保险、注册、车牌、验车和停车规则。

第一，确认车辆保险。纽约开车必须有合规保险。买车前后要和保险公司确认保单生效时间，不要出现车已经上路但保险还没生效的情况。

第二，办理车辆注册和车牌。车辆需要按规定完成注册，取得合法车牌和相关文件。不同购买方式可能流程不同，例如从车行买车和私人交易买车，处理方式可能不一样。

第三，注意车辆检查和安全状态。买二手车时，建议重点检查轮胎、刹车、灯光、雨刷、发动机、变速箱、仪表盘故障灯和是否有事故记录。必要时找懂车的人或维修店帮忙检查。

第四，熟悉停车规则。纽约停车规则复杂，清扫街道、消防栓、学校区域、装卸区、计时停车、居民区限停都可能导致罚单。新手买车后，建议先学会看路牌，不确定时不要乱停。

第五，保存好车辆文件。保险卡、注册文件、驾照、买卖文件、维修记录等都要保存好。以后续保、卖车、处理罚单或事故时都会用到。

如果收到停车罚单或摄像头罚单，可以通过纽约市官方系统按罚单号或车牌查询。

OpenAA 提醒：新手买车最重要的是合法上路、安全驾驶、停车谨慎。便宜车不一定省钱，保险、维修、停车和罚单成本也要一起算进去。', '9dbf8e2b-8007-43f0-b7a0-f3c145ace731', 'published', false, false, 0, null, '2026-05-16T21:16:03.073+00:00', '纽约新手买车后需要做什么？保险注册验车中文指南', '纽约新手买车后注意事项，包括车辆保险、注册、车牌、验车、停车罚单和日常驾驶提醒。 正文：', '{"notes":["needs_freshness_review"],"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"new-driver-after-buying-car-ny","source_url":"https://ny.openaa.com/news/new-driver-after-buying-car-ny","approved_for":"initial_production_content"}'::jsonb, '2026-06-01T03:12:58.902026+00:00', '2026-06-01T03:12:59.05+00:00'),
  ('7b501b6c-983e-465a-8b2f-a8ba7323be6c', '2798e7eb-4ab5-4c4b-a854-3ad81133a8d6', 'Learner Permit 是什么？', 'what-is-learner-permit-ny', '纽约 Learner Permit 中文解释，适合第一次在纽约考驾照的新手，了解学习驾照用途、限制和后续路考流程。', 'Learner Permit 可以理解为“学习驾照”或“学车许可”。它不是正式驾照，而是允许你在符合规定的情况下练习开车，为以后参加路考做准备。

拿到 Learner Permit 后，不能自己单独开车。纽约 DMV 规定，持有 Learner Permit 的人开车时，必须有一名 21 岁或以上、并且持有相应有效驾照的监督驾驶员陪同。

一般流程是：先准备材料，申请 Learner Permit，参加笔试和视力测试；通过后拿到 Permit；之后练车，完成必要课程或要求，再预约路考。纽约州说明，申请 Learner Permit 的费用通常包含笔试、两次路考和驾照费用，Permit 有效期为 5 年。

新手要特别注意：Learner Permit 不是正式驾照，不等于可以随便上路。不同年龄、不同地区和不同道路可能有额外限制。练车前最好先了解纽约 DMV 的 Permit 限制，避免违规。

OpenAA 提醒：如果你刚来美国、英文不熟，建议先用中文理解流程，再回到 DMV 官方页面核对材料和规则。', '1f506579-bf79-4555-a221-85d37e9a4968', 'published', false, false, 0, null, '2026-05-16T21:11:29.638+00:00', 'Learner Permit 是什么？纽约学习驾照中文说明', '纽约 Learner Permit 中文解释，适合第一次在纽约考驾照的新手，了解学习驾照用途、限制和后续路考流程。', '{"notes":["needs_freshness_review"],"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"what-is-learner-permit-ny","source_url":"https://ny.openaa.com/news/what-is-learner-permit-ny","approved_for":"initial_production_content"}'::jsonb, '2026-06-01T03:12:58.382798+00:00', '2026-06-01T03:12:58.531+00:00'),
  ('22b6b057-17a1-479a-9ee6-f18384490d4e', '2798e7eb-4ab5-4c4b-a854-3ad81133a8d6', '纽约 DMV 笔试怎么准备？', 'ny-dmv-permit-test-prepare', '纽约 DMV 笔试准备中文指南，适合第一次申请 Learner Permit 的华人新手，整理学习重点、刷题方法和考试注意事项。', '纽约 DMV 笔试主要考交通规则、道路标志、安全驾驶和基本驾驶常识。对新手来说，不要只靠背答案，最好先看一遍纽约州 Driver’s Manual，再配合中文题库反复练习。

准备时可以分三步：

第一步，先了解考试内容。纽约 DMV 笔试会涉及限速、让行、停车、校车、酒驾、路权、交通标志等内容。很多题目不是死记硬背，而是考你是否理解实际开车时该怎样判断。

第二步，重点练习交通标志。交通标志题通常比较直观，但也容易因为英文不熟或图形相似而选错。建议把常见的 STOP、YIELD、限速、禁止停车、学校区域、铁路交叉、施工区域等标志单独练习。

第三步，做模拟考试。练习时不要只看正确答案，要看自己错在哪里。连续几次模拟考试都能稳定通过后，再去参加正式笔试会更稳。

参加考试前，还要准备好身份证明、地址证明和 DMV 要求的申请材料。申请 Learner Permit 通常需要填写 MV-44 表格，并通过视力和知识测试。

OpenAA 提醒：本页面只做中文整理和入口导航，最终规则、费用、材料和预约信息，请以纽约 DMV 官方页面为准。', '516b969c-6bfc-4609-b651-fbd6f135dcdd', 'published', false, false, 0, null, '2026-05-16T21:07:39.554+00:00', '纽约 DMV 笔试怎么准备？新手考 Learner Permit 中文指南', '纽约 DMV 笔试准备中文指南，适合第一次申请 Learner Permit 的华人新手，整理学习重点、刷题方法和考试注意事项。', '{"notes":["needs_freshness_review"],"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"ny-dmv-permit-test-prepare","source_url":"https://ny.openaa.com/news/ny-dmv-permit-test-prepare","approved_for":"initial_production_content"}'::jsonb, '2026-06-01T03:12:58.128634+00:00', '2026-06-01T03:12:58.267+00:00'),
  ('93553665-124a-4b55-a920-dd7f31235473', '07ce32c3-18f8-40d8-9f57-5fecb0ae9a2b', 'OpenAA 信息发布规则提醒：真实、清楚、及时更新', 'openaa-posting-rules-reminder', 'OpenAA 提醒用户发布招聘、房屋、二手等信息时保持真实、清楚、联系方式有效，并及时更新或删除过期信息。', '为了让 OpenAA 上的信息更有用，也为了减少用户之间的误会，平台提醒所有发布者：发布信息时请尽量做到真实、清楚、及时更新。

无论你发布的是招聘、房屋、二手商品，还是以后开放的本地服务信息，都建议遵守以下原则。

第一，标题要清楚。

标题应该让用户一眼看懂你发布的内容。比如招聘信息可以写清楚岗位类型，房屋信息可以写清楚出租类型，二手商品可以写清楚物品名称。

第二，内容要真实。

不要夸大工资、房源、商品情况或服务内容。虚假信息不仅会影响用户信任，也会影响平台整体质量。

第三，联系方式要有效。

如果电话、微信或其它联系方式已经不用了，请及时修改。联系方式错误会让用户无法联系，也会浪费双方时间。

第四，价格和条件尽量说明。

如果是招聘，建议说明工资范围、工作地点、工作时间和基本要求。如果是房屋，建议说明租金、位置、房型和入住时间。如果是二手商品，建议说明价格、成色和交易方式。

第五，信息过期后及时处理。

如果岗位已经招满、房子已经租出、商品已经卖掉，请及时编辑、下架或删除信息。这样可以减少无效联系，也能让平台信息更干净。

第六，不要发布明显违法、欺诈或误导性内容。

OpenAA 会逐步完善反馈和举报机制。发现虚假信息、可疑内容或严重违规内容时，平台会根据情况进行处理。

OpenAA 希望成为一个轻量、实用、可信的美国华人生活信息平台。信息质量越高，用户体验越好，平台对大家的帮助也会越大。', null, 'published', false, false, 0, null, '2026-05-09T01:24:43.173+00:00', 'OpenAA 信息发布规则提醒 - 招聘房屋二手信息发布注意事项', 'OpenAA 提醒用户发布招聘、房屋、二手等信息时保持真实、清楚、联系方式有效，并及时更新或删除过期信息。', '{"notes":["cover_needs_replacement"],"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"openaa-posting-rules-reminder","source_url":"https://ny.openaa.com/news/openaa-posting-rules-reminder","approved_for":"initial_production_content"}'::jsonb, '2026-06-01T03:12:59.34327+00:00', '2026-06-01T03:12:59.486+00:00'),
  ('c72fe379-2583-4f13-9dd4-d9d4db7b3050', '89cbc71a-3d54-4d12-a23d-bfd017ddb851', '美国租房前要注意什么：给华人新手的基础提醒', 'us-rental-tips-for-chinese-newcomers', '美国租房前要注意房源真实性、租金包含内容、押金规则、交通位置、合同内容和付款安全，适合华人新手参考。', '在美国租房，对很多刚来的华人新手来说是一件非常重要的事情。房子不只是住的地方，也会影响通勤、生活成本、安全感和后续安排。

租房前，建议先注意几个基础问题。

第一，确认房源是否真实。

看到房源图片后，不要只看装修和价格。要尽量确认房子位置、房型、房间数量、是否真实存在、是否可以看房。如果价格明显低于周边很多，需要特别谨慎。

第二，了解周边位置和交通。

租房不能只看房间本身，还要看交通是否方便、附近是否有超市、公交、地铁、停车位和日常生活设施。对于没有车的新手来说，交通尤其重要。

第三，问清楚租金包含什么。

有些房租包含水电网，有些不包含。有些需要额外支付电费、煤气费、暖气费、网络费、垃圾费或停车费。签约前一定要问清楚，不要只看表面租金。

第四，确认押金和付款方式。

正常租房可能会涉及押金和首月租金，但如果对方要求你在没看房、没签合同、没确认身份前就提前转账，一定要谨慎。特别是礼品卡、Zelle、现金转账等方式，更要小心核实。

第五，看清合同内容。

合同里通常会写租期、租金、押金、付款日期、维修责任、退租规则、是否允许转租、是否允许养宠物等内容。签字前要认真看清楚。

第六，确认联系人的身份。

如果是房东、二房东、中介或室友转租，情况会不同。你要尽量了解对方是否有出租权，避免入住后产生纠纷。

第七，保留沟通记录。

租房过程中，重要信息最好通过文字确认，例如租金、押金、入住时间、地址、包含费用和维修约定。这样以后出现问题时更容易说明情况。

租房没有绝对简单的标准，但有一个原则很重要：不要因为着急入住，就忽略核实信息。

OpenAA 房屋栏目会继续帮助用户发布和查看房屋相关信息，也会通过新闻资讯整理更多租房安全提醒和实用指南。', '707752a4-2b8a-4c7e-a31b-3ef35d3149a7', 'published', false, false, 0, null, '2026-05-09T01:23:25.13+00:00', '美国租房前要注意什么 - 华人新手租房基础提醒', '美国租房前要注意房源真实性、租金包含内容、押金规则、交通位置、合同内容和付款安全，适合华人新手参考。', '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"us-rental-tips-for-chinese-newcomers","source_url":"https://ny.openaa.com/news/us-rental-tips-for-chinese-newcomers","approved_for":"initial_production_content"}'::jsonb, '2026-06-01T03:12:56.09379+00:00', '2026-06-01T03:12:56.245+00:00'),
  ('1e260db7-7940-4158-8d0c-b8a8001300b8', '2798e7eb-4ab5-4c4b-a854-3ad81133a8d6', '纽约 DMV 办事前准备清单：新手容易忽略的几个重点', 'ny-dmv-preparation-checklist-for-beginners', '纽约 DMV 办事前准备清单，帮助新手提前确认材料、预约、地址证明、身份信息和办理类型，减少白跑一趟的情况。', '在纽约办理 DMV 相关业务时，很多新手最容易遇到的问题不是流程太复杂，而是出发前没有把材料和办理类型确认清楚。

无论是申请 learner permit、办理驾照、更新证件、查询罚单，还是处理车辆相关事项，去 DMV 前都建议先做一次准备。

第一，确认自己要办理的具体业务。

不同业务需要的材料和步骤可能不一样。比如申请学习驾驶许可、更新驾照、办理 Real ID、车辆登记、地址变更等，都属于不同类型。出发前先确认业务名称，避免到现场才发现排错队或材料不符合要求。

第二，提前查看官方说明。

DMV 政策和材料要求可能会更新，办理前最好查看纽约 DMV 官方网站的最新说明。不要只依赖网上旧文章或朋友以前的经验，因为不同时间、不同身份、不同业务可能会有不同要求。

第三，准备身份证明和地址证明。

很多 DMV 业务都会涉及身份证明、地址证明和身份相关文件。材料最好提前整理好，原件和需要的复印件分开放，避免现场手忙脚乱。

第四，确认姓名和地址是否一致。

如果你的银行账单、租约、证件、信件上的姓名或地址不一致，可能会影响办理。去 DMV 前建议先检查材料上的信息是否匹配。

第五，留意预约和现场等待时间。

有些业务可以预约，有些业务可能需要现场排队。建议提前规划时间，不要赶在上班前、下班前或有急事时去办理。

第六，笔试和路考要提前准备。

如果是驾照相关业务，笔试和路考都需要认真准备。笔试要熟悉交通规则、标志和安全驾驶常识；路考则需要实际练车和掌握基本驾驶动作。

第七，不懂英文时要提前准备。

如果你英文不太熟，可以提前把要办理的事项、材料名称和问题写下来。必要时可以请熟悉流程的人陪同，或者先在网上查清楚关键词。

办理 DMV 业务最重要的是提前准备，不要等到现场才发现少材料、选错业务或信息不一致。

OpenAA 后续会继续整理 DMV 相关实用内容，帮助华人用户更清楚地了解驾照、笔试、路考和罚单查询等常见问题。', '21752893-4e23-43ee-ba56-0aa73eb45235', 'published', false, false, 0, null, '2026-05-09T01:22:25.772+00:00', '纽约 DMV 办事前准备清单 - 新手办理驾照和证件注意事项', '纽约 DMV 办事前准备清单，帮助新手提前确认材料、预约、地址证明、身份信息和办理类型，减少白跑一趟的情况。', '{"notes":["needs_freshness_review"],"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"ny-dmv-preparation-checklist-for-beginners","source_url":"https://ny.openaa.com/news/ny-dmv-preparation-checklist-for-beginners","approved_for":"initial_production_content"}'::jsonb, '2026-06-01T03:12:57.818265+00:00', '2026-06-01T03:12:57.968+00:00'),
  ('96c2395f-1129-4ab9-877e-34dc2b3fda69', '022b268e-456c-4d2b-a544-c1bf3eb4ccec', 'OpenAA 新用户使用指南：第一次进入网站应该怎么看', 'openaa-first-time-user-guide', 'OpenAA 新用户使用指南，帮助第一次进入网站的用户了解招聘、房屋、二手、新闻资讯、导航和我的页面等主要功能。', '如果你是第一次使用 OpenAA，可以先从首页开始了解整个平台。

OpenAA 是一个面向美国华人的轻量生活信息平台，主要功能包括招聘、房屋、二手、DMV、新闻资讯、导航和用户中心。平台的设计方向是手机端优先，希望用户可以像使用一个简单 App 一样快速查看信息。

进入首页后，你会看到几个主要入口。

招聘入口主要用于查看招聘信息、求职信息和发布相关内容。如果你正在找工作，可以先查看招聘列表；如果你需要招人，可以登录后发布招聘信息。

房屋入口主要用于查看房屋出租、求租、合租等信息。用户可以根据地区和内容查看房源，也可以发布自己的房屋信息。

二手入口主要用于发布和查看二手闲置物品。适合搬家、清理闲置、寻找便宜实用物品的用户使用。

新闻资讯入口主要用于查看平台公告、新手指南、本地新闻、DMV 教程和生活指南。以后很多平台使用说明和实用教程都会放在这里。

导航入口主要整理美国华人常用网站和生活服务链接。对于不熟悉美国各类网站的新用户来说，导航页面可以作为常用入口使用。

我的页面主要用于管理自己的账号和发布内容。登录后，你可以查看自己发布过的招聘、房屋、二手等信息，并进行编辑或删除。

使用 OpenAA 时，请注意保护个人信息。联系对方前，建议先看清楚信息内容；涉及转账、押金、工资、租金、验证码等问题时，一定要谨慎核实。

OpenAA 会持续优化用户体验，让更多华人用户可以用更简单的方式查找生活信息、发布内容和联系对方。', '8e597f96-a59a-4059-88bc-13bd3887dd15', 'published', false, false, 0, null, '2026-05-09T01:21:21.21+00:00', 'OpenAA 新用户使用指南 - 第一次使用 OpenAA 应该怎么看', 'OpenAA 新用户使用指南，帮助第一次进入网站的用户了解招聘、房屋、二手、新闻资讯、导航和我的页面等主要功能。', '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"openaa-first-time-user-guide","source_url":"https://ny.openaa.com/news/openaa-first-time-user-guide","approved_for":"initial_production_content"}'::jsonb, '2026-06-01T03:12:55.837516+00:00', '2026-06-01T03:12:55.986+00:00'),
  ('975b2bfa-8d83-431c-925c-4e8e0743f13e', 'd6a072c8-9d8d-4e10-b334-35ebf801c23d', '纽约华人生活信息平台 OpenAA 正式开放新闻资讯中心', 'openaa-news-center-for-ny-chinese-community', 'OpenAA 新闻资讯中心正式开放，面向纽约及美国华人用户发布生活资讯、平台公告、新手指南、DMV教程和实用生活内容。', 'OpenAA 新闻资讯中心正式开放。

这个栏目主要面向纽约及美国华人用户，整理和发布生活资讯、平台公告、新手指南、DMV 教程、本地消息和实用生活内容，帮助用户更方便地了解 OpenAA 平台，也更快找到日常生活中需要的信息。

OpenAA 当前已经逐步完善招聘、房屋、二手、导航、新闻资讯等功能。新闻资讯中心上线后，平台不仅可以展示用户发布的信息，也可以长期整理对华人用户有帮助的文章内容。

新闻资讯中心第一阶段会重点发布几类内容。

第一类是新手指南，例如如何使用 OpenAA、如何发布招聘信息、如何发布房屋信息、如何发布二手商品、如何查看和联系发布者等。

第二类是平台公告，例如功能上线说明、使用规则提醒、信息安全提示、反馈入口说明等。

第三类是 DMV 和生活教程，例如纽约驾照申请流程、DMV 笔试准备、美国银行开户基础说明、租房注意事项、二手交易安全提醒等。

第四类是本地生活资讯，例如纽约华人常用生活信息、社区消息、生活服务推荐方向和实用资源整理。

OpenAA 的目标不是做复杂的大型门户，而是先把华人用户最常用、最需要、最实用的信息整理清楚，让手机端访问更简单，让用户查找信息更方便。

后续 OpenAA 会继续优化内容质量、页面体验、信息分类和反馈机制，让平台更适合纽约及美国华人日常使用。', '323b70f5-1cad-491b-8a2d-76d52fd01551', 'published', false, false, 0, null, '2026-05-09T01:20:17.876+00:00', 'OpenAA 新闻资讯中心上线 - 纽约华人生活资讯平台', 'OpenAA 新闻资讯中心正式开放，面向纽约及美国华人用户发布生活资讯、平台公告、新手指南、DMV教程和实用生活内容。', '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"openaa-news-center-for-ny-chinese-community","source_url":"https://ny.openaa.com/news/openaa-news-center-for-ny-chinese-community","approved_for":"initial_production_content"}'::jsonb, '2026-06-01T03:12:55.574705+00:00', '2026-06-01T03:12:55.719+00:00'),
  ('5f61e238-e659-4c4e-98dd-0b389c75e8e8', '07ce32c3-18f8-40d8-9f57-5fecb0ae9a2b', 'OpenAA 平台发布信息安全提醒', 'openaa-post-safety-notice', 'OpenAA 提醒用户在查看招聘、房屋、二手和本地服务信息时注意防诈骗，核实信息后再交易。', 'OpenAA 提醒所有用户，在使用招聘、房屋、二手和本地服务等信息时，请注意信息安全。

如果对方要求提前转账、缴纳保证金、购买礼品卡、提供验证码或点击不明链接，请提高警惕。

租房时，请尽量核实房源真实性，不要只凭图片和低价就轻易付款。

求职时，请注意异常高薪、无需面试、先交费用等可疑情况。

二手交易时，建议优先当面交易，确认物品情况后再付款。

本地服务联系时，请尽量确认服务方身份、价格、时间和服务范围，避免产生纠纷。

OpenAA 会持续优化举报与反馈机制。如果你发现虚假信息、可疑内容或页面问题，后续可以通过反馈入口提交给平台处理。', '78777dd7-f936-4b20-b806-5428c8dd3cdf', 'published', false, false, 0, null, '2026-05-09T01:11:02.87+00:00', 'OpenAA 信息安全提醒 - 招聘房屋二手交易防诈骗说明', 'OpenAA 提醒用户在查看招聘、房屋、二手和本地服务信息时注意防诈骗，核实信息后再交易。', '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"openaa-post-safety-notice","source_url":"https://ny.openaa.com/news/openaa-post-safety-notice","approved_for":"initial_production_content"}'::jsonb, '2026-06-01T03:12:54.277622+00:00', '2026-06-01T03:12:54.427+00:00'),
  ('11ef38e0-5390-4068-b931-486353d8b7da', '89cbc71a-3d54-4d12-a23d-bfd017ddb851', '美国银行开户基础说明：新手需要准备什么', 'us-bank-account-opening-guide', '美国银行开户基础说明，介绍开户材料、checking账户、saving账户、手续费和新手注意事项。', '在美国生活，银行账户是非常常用的基础服务。

开设银行账户时，银行通常会要求申请人提供身份证明、地址信息、联系方式和相关身份文件。不同银行和不同账户类型要求可能不完全一样。

常见账户包括 checking account 和 savings account。Checking account 通常用于日常消费、收款、转账和支付账单。Savings account 通常用于储蓄。

新手开户时要注意是否有月费、最低余额要求、转账限制、ATM 手续费和账户管理费。

如果英文沟通不方便，可以优先选择附近有中文服务的银行网点，或者提前准备好需要咨询的问题。

开户后要保管好银行卡、网上银行密码和验证码，不要把验证码告诉任何人，避免账户被盗用。', '513accc1-94e4-41d0-ac89-c5f968a7e92d', 'published', false, false, 0, null, '2026-05-09T01:09:49.188+00:00', '美国银行开户基础说明 - 华人新手生活指南', '美国银行开户基础说明，介绍开户材料、checking账户、saving账户、手续费和新手注意事项。', '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"us-bank-account-opening-guide","source_url":"https://ny.openaa.com/news/us-bank-account-opening-guide","approved_for":"initial_production_content"}'::jsonb, '2026-06-01T03:12:56.35242+00:00', '2026-06-01T03:12:56.5+00:00'),
  ('a9a5e611-3772-45f1-8404-f02bb0f604c7', '2798e7eb-4ab5-4c4b-a854-3ad81133a8d6', '纽约驾照申请流程基础说明', 'ny-driver-license-application-guide', '纽约驾照申请流程基础说明，包括材料准备、DMV笔试、学习许可、练车和路考等常见步骤。', '在纽约申请驾照，一般需要先准备身份证明、地址证明和合法身份相关材料，然后前往 DMV 办理申请。

第一步通常是准备材料。申请人需要根据 DMV 要求准备身份证明、纽约地址证明和其它相关文件。

第二步是参加笔试。通过笔试后，可以获得 learner permit，也就是学习驾驶许可。

第三步是练车。拿到学习许可后，需要按照规定练习驾驶，并了解纽约道路规则、停车规则和安全驾驶要求。

第四步是预约并参加路考。路考通过后，申请人可以获得纽约驾照。

不同身份、年龄和申请情况可能会有不同要求，办理前建议先查看纽约 DMV 官方网站的最新说明。

OpenAA 后续会继续整理 DMV 笔试、路考、罚单查询和驾照相关实用教程，方便华人用户参考。', 'a013b1e3-81b0-4f05-bc91-879f91dce837', 'published', false, false, 0, null, '2026-05-09T01:08:16.865+00:00', '纽约驾照申请流程基础说明 - OpenAA DMV教程', '纽约驾照申请流程基础说明，包括材料准备、DMV笔试、学习许可、练车和路考等常见步骤。', '{"notes":["needs_freshness_review"],"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"ny-driver-license-application-guide","source_url":"https://ny.openaa.com/news/ny-driver-license-application-guide","approved_for":"initial_production_content"}'::jsonb, '2026-06-01T03:12:54.963156+00:00', '2026-06-01T03:12:55.112+00:00'),
  ('fd0ffcb7-fd20-481f-9eba-9a2d75a60b33', '022b268e-456c-4d2b-a544-c1bf3eb4ccec', 'OpenAA 新用户使用指南：快速了解主要功能', 'openaa-new-user-guide', 'OpenAA 新用户使用指南，帮助美国华人快速了解招聘、房屋、二手、新闻资讯、DMV和本地服务等功能。', '欢迎使用 OpenAA。

OpenAA 是一个面向美国华人的生活信息平台，主要提供招聘、房屋、二手、DMV、导航、新闻资讯和本地服务等功能。

如果你想找工作，可以进入“招聘”栏目查看招聘信息，也可以登录后发布招聘或求职信息。

如果你想租房、找室友或发布房屋出租信息，可以进入“房屋”栏目查看相关内容。

如果你有二手物品想出售，或者想找便宜实用的二手商品，可以进入“二手”栏目。

如果你刚来美国，或者需要办理 DMV、银行、保险、手机卡等生活事项，可以关注“新闻资讯”和“新手指南”分类。

OpenAA 会持续优化页面体验，让用户可以像使用手机 App 一样方便地查看信息、发布内容和联系对方。

使用平台时请注意安全，不要提前转账，不要轻信异常低价信息，涉及押金、租金、工资和交易时请尽量当面核实。', '8e597f96-a59a-4059-88bc-13bd3887dd15', 'published', false, false, 0, null, '2026-05-09T01:06:41.348+00:00', 'OpenAA 新用户使用指南 - 美国华人生活平台入门说明', 'OpenAA 新用户使用指南，帮助美国华人快速了解招聘、房屋、二手、新闻资讯、DMV和本地服务等功能。', '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"openaa-new-user-guide","source_url":"https://ny.openaa.com/news/openaa-new-user-guide","approved_for":"initial_production_content"}'::jsonb, '2026-06-01T03:12:54.622535+00:00', '2026-06-01T03:12:54.771+00:00'),
  ('ee92d6ef-fd3a-4f6c-acfd-17afe8a42cdb', 'd6a072c8-9d8d-4e10-b334-35ebf801c23d', '纽约华人生活信息更新：OpenAA 新闻资讯中心上线', 'openaa-news-center-launch', 'OpenAA 新闻资讯中心上线，提供美国华人生活资讯、本地新闻、平台公告、新手指南、DMV教程和实用生活内容。', 'OpenAA 新闻资讯中心正式上线。

这个栏目会陆续整理美国华人常用的生活资讯、本地消息、DMV 教程、新手指南、平台公告和实用说明，方便用户在一个页面快速查看重要信息。

第一阶段内容会以轻量实用为主，重点包括纽约华人生活、找工作、租房、二手交易、安全提醒、DMV 办事流程和 OpenAA 使用说明。

后续 OpenAA 会继续完善招聘、房屋、二手、导航、新闻资讯和本地服务等模块，让用户更方便地找到自己需要的信息。

如果你发现页面问题、虚假信息或需要反馈建议，可以通过 OpenAA 后续的反馈入口提交。', '707752a4-2b8a-4c7e-a31b-3ef35d3149a7', 'published', false, false, 0, null, '2026-05-09T01:04:43.354+00:00', 'OpenAA 新闻资讯中心上线 - 美国华人生活资讯平台', 'OpenAA 新闻资讯中心上线，提供美国华人生活资讯、本地新闻、平台公告、新手指南、DMV教程和实用生活内容。', '{"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"openaa-news-center-launch","source_url":"https://ny.openaa.com/news/openaa-news-center-launch","approved_for":"initial_production_content"}'::jsonb, '2026-06-01T03:12:55.275961+00:00', '2026-06-01T03:12:55.423+00:00'),
  ('48a58954-67ee-43bf-910c-bc45f7cd5ecd', '2798e7eb-4ab5-4c4b-a854-3ad81133a8d6', '纽约路考预约流程', 'ny-road-test-schedule-guide', '纽约 DMV 路考预约中文指南，说明预约前准备、需要的信息、考试地点选择和路考当天注意事项。', '在纽约考正式驾照，通常需要先拿到 Learner Permit，完成练车和相关课程后，再预约 Road Test 路考。

预约路考前，一般需要准备好 Learner Permit 上的信息，例如 Client ID、Document Number、出生日期、邮编，以及可能需要的 Social Security 相关信息。纽约 DMV 官方预约页面说明，用户可以在线预约、取消、改期或确认路考时间。

预约流程可以这样理解：

第一步，确认自己已经符合路考条件。不要刚拿 Permit 就急着预约，建议先练熟基本驾驶、停车、转弯、变道、看镜、让行和路口判断。

第二步，进入 DMV 官方 Road Test 预约系统，按要求填写个人信息。

第三步，选择合适的考试地点和时间。不同地区排期不同，热门地点可能需要提前预约。

第四步，预约成功后保存确认信息。考试当天要带好 Permit、预约信息、合规车辆和陪同人员。车辆本身也要符合路考要求，例如保险、注册和安全状态正常。

如果第一次或第二次没有通过，也不要太紧张。纽约州说明，申请 Learner Permit 的费用通常包含两次路考；如果两次都没有通过，需要再购买额外路考次数。

OpenAA 提醒：路考不是只看会不会开车，更看你是否安全、守规矩、观察到位。练车时要养成看镜、打灯、停稳、让行的习惯。', '21752893-4e23-43ee-ba56-0aa73eb45235', 'hidden', false, false, 0, null, null, '纽约路考怎么预约？DMV Road Test 中文流程', '纽约 DMV 路考预约中文指南，说明预约前准备、需要的信息、考试地点选择和路考当天注意事项。', '{"notes":["needs_freshness_review"],"origin":"openaa-ny","source":"legacy_official_import","legacy_id":"ny-road-test-schedule-guide","source_url":"https://ny.openaa.com/news/ny-road-test-schedule-guide","approved_for":"initial_production_content"}'::jsonb, '2026-06-01T03:12:58.65001+00:00', '2026-06-14T17:37:06.118+00:00')
on conflict (slug) do update set category_id = excluded.category_id, title = excluded.title, excerpt = excluded.excerpt, body = excluded.body, cover_image_asset_id = excluded.cover_image_asset_id, status = excluded.status, is_featured = excluded.is_featured, is_pinned = excluded.is_pinned, pinned_order = excluded.pinned_order, pinned_until = excluded.pinned_until, published_at = excluded.published_at, seo_title = excluded.seo_title, seo_description = excluded.seo_description, metadata = excluded.metadata, updated_at = excluded.updated_at;

insert into public.ads (id, title, placement, href, open_mode, link_type, external_url, slug, image_asset_id, content, contact_name, phone, wechat, address, is_active, sort_order, starts_at, ends_at, metadata, created_at, updated_at)
values
  ('6d5e794e-3c00-4b5e-aea0-e37da8765db5', 'https://app.openaa.com/housing', 'dmv', 'https://app.openaa.com/housing', 'external_same', 'external', 'https://app.openaa.com/housing', null, 'ebcd3909-0543-41aa-a37c-3be2225cfbba', null, null, null, null, null, false, 0, null, null, '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, '2026-05-10T18:49:01.756376+00:00', '2026-06-21T12:54:25.926+00:00'),
  ('d6ff3144-18c9-48c6-9c40-222d2b66cfef', 'https://app.openaa.com/services', 'dmv', 'https://app.openaa.com/services', 'external_same', 'external', 'https://app.openaa.com/services', null, '90f9db4b-f08e-49ff-946d-fe8f95ea29da', null, null, null, null, null, false, 1, null, '2026-12-10T14:43:00+00:00', '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, '2026-05-10T18:43:32.530821+00:00', '2026-06-21T12:54:30.384+00:00'),
  ('ea3f8047-1a7b-4e02-b4e0-4e5b91d3f032', 'https://app.openaa.com/news', 'dmv', 'https://app.openaa.com/news', 'external_same', 'external', 'https://app.openaa.com/news', null, 'b593b9c1-c7f5-4f6c-972c-30f8b6afcdfb', null, null, null, null, null, false, 2, null, '2026-12-09T22:40:00+00:00', '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, '2026-05-10T02:40:44.60478+00:00', '2026-06-21T12:54:32.778+00:00'),
  ('e72f0c96-aed9-4303-9ef0-49cb9340f905', 'https://app.openaa.com/secondhand', 'dmv', 'https://app.openaa.com/secondhand', 'external_same', 'external', 'https://app.openaa.com/secondhand', null, '37c5671d-14c9-446f-a58f-ff14f966fda4', null, null, null, null, null, false, 3, null, '2026-12-09T18:34:00+00:00', '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, '2026-05-09T22:34:21.445055+00:00', '2026-06-21T12:54:35.145+00:00'),
  ('d0ec24d1-f157-4a16-b3f1-cb7051b9b83a', 'https://openaa.com/nav/dmv', 'dmv', 'https://openaa.com/nav/dmv', 'external_same', 'external', 'https://openaa.com/nav/dmv', null, '935568da-fb5c-4eec-855d-0daedfdc36d8', null, null, null, null, null, false, 4, null, '2026-12-09T17:46:00+00:00', '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, '2026-05-09T21:46:10.983729+00:00', '2026-06-21T12:54:37.191+00:00'),
  ('577fc129-7dcd-4f34-8d8c-af031717af5f', 'https://app.openaa.com/news', 'home', 'https://app.openaa.com/news', 'external_same', 'external', 'https://app.openaa.com/news', null, 'd2158abb-1a98-4f12-94a1-969d2d77e936', null, null, null, null, null, true, 0, null, null, '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, '2026-05-10T19:20:31.295881+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('91ce0e87-d933-4f97-9dc0-4899f6362044', 'https://app.openaa.com/services', 'home', 'https://app.openaa.com/services', 'external_same', 'external', 'https://app.openaa.com/services', null, '2fc24ace-1434-4520-b398-0e8b1e3539f1', null, null, null, null, null, true, 1, null, '2027-12-10T14:55:00+00:00', '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, '2026-05-10T18:55:47.288716+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('035edba7-1496-411d-860b-843b4a623aa5', 'https://app.openaa.com/jobs', 'home', 'https://app.openaa.com/jobs', 'external_same', 'external', 'https://app.openaa.com/jobs', null, '5ce6cd54-0ef6-4212-b8c5-0ac6ce66d9ac', null, null, null, null, null, true, 2, null, '2026-12-10T14:38:00+00:00', '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, '2026-05-10T18:38:08.066513+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('aae73c38-1864-4586-8f0a-21cf1d90db76', 'https://app.openaa.com/news', 'housing', 'https://app.openaa.com/news', 'external_new', 'external', 'https://app.openaa.com/news', null, '536318ec-6e21-4f2e-8369-2aba7fe65f44', null, null, null, null, null, true, 0, null, '2027-12-10T15:04:00+00:00', '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, '2026-05-10T19:05:33.157301+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('8e386fe6-ba1e-44d9-85d3-7f3927053659', 'https://app.openaa.com/secondhand', 'housing', 'https://app.openaa.com/secondhand', 'external_same', 'external', 'https://app.openaa.com/secondhand', null, '031bc997-bb7d-43b5-8eef-55260c918c2f', null, null, null, null, null, true, 1, null, '2027-12-10T14:59:00+00:00', '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, '2026-05-10T19:00:32.063254+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('ed100911-7f4b-4f47-bcb1-c53daf66562d', 'https://app.openaa.com/jobs', 'housing', 'https://app.openaa.com/jobs', 'external_same', 'external', 'https://app.openaa.com/jobs', null, 'ebc654fc-0717-4aa6-a2b1-f3d201483d8c', null, null, null, null, null, true, 2, null, '2026-12-28T21:09:00+00:00', '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, '2026-04-29T01:09:56.258057+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('bab4abb0-6dee-4a04-941f-676631285723', 'https://app.openaa.com/', 'housing', 'https://app.openaa.com/', 'external_same', 'external', 'https://app.openaa.com/', null, 'd01dd556-7d3d-40ce-b2cd-c731020c9085', null, null, null, null, null, true, 3, null, '2026-12-26T21:10:00+00:00', '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, '2026-04-27T01:10:58.886846+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('b2f78245-3899-49b2-8d02-e82306d65f9a', 'https://app.openaa.com/news', 'jobs', 'https://app.openaa.com/news', 'external_same', 'external', 'https://app.openaa.com/news', null, 'eb46a987-2844-4335-9332-d41d91d2ea86', null, null, null, null, null, true, 0, null, '2027-12-10T14:54:00+00:00', '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, '2026-05-10T18:54:35.11789+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('3b71ba02-f40f-4017-8c1e-a8b503ebcf0a', 'https://openaa.com/nav/dmv', 'jobs', 'https://openaa.com/nav/dmv', 'external_same', 'external', 'https://openaa.com/nav/dmv', null, 'de39d24b-2901-47e4-ad89-6991b1a34795', null, null, null, null, null, true, 1, null, '2027-12-10T14:51:00+00:00', '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, '2026-05-10T18:52:03.74349+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('9488836e-2bd2-4852-9599-64fd4288ff3e', 'https://app.openaa.com/secondhand', 'jobs', 'https://app.openaa.com/secondhand', 'external_same', 'external', 'https://app.openaa.com/secondhand', null, 'd6870bfa-32b8-4b69-b31e-98bbd1bd48d9', null, null, null, null, null, true, 2, null, '2027-12-10T14:50:00+00:00', '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, '2026-05-10T18:50:42.56459+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('185841bc-3605-4435-b5f4-35de81d0db3a', 'https://app.openaa.com/', 'jobs', 'https://app.openaa.com/', 'external_same', 'external', 'https://app.openaa.com/', null, 'fca8587e-4244-43cf-8a61-7d834852a62a', null, null, null, null, null, true, 3, null, '2027-12-10T14:46:00+00:00', '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, '2026-05-10T18:46:54.942571+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('08af3c14-59e1-4074-8ddb-939eb5ea56ad', 'https://app.openaa.com/jobs', 'navigation', 'https://app.openaa.com/jobs', 'external_same', 'external', 'https://app.openaa.com/jobs', null, '947ee330-bca1-4b11-9f58-aadf4e023dd4', null, null, null, null, null, true, 0, null, '2026-12-26T16:11:00+00:00', '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, '2026-04-26T20:11:20.796304+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('6d4de89b-6324-46ee-9c63-317d81695aea', 'http://numbermobi.com/', 'navigation', 'http://numbermobi.com/', 'external_new', 'external', 'http://numbermobi.com/', null, '02a7a3a7-8572-4229-a423-c4e76cd5b84d', null, null, null, null, null, true, 1, null, '2026-12-26T13:38:00+00:00', '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, '2026-04-26T17:38:45.119579+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('1c3cfb08-cb09-46e8-9b37-939e55d0db26', 'https://app.openaa.com/', 'navigation', 'https://app.openaa.com/', 'external_same', 'external', 'https://app.openaa.com/', null, 'effa3b28-c551-4ba3-b1b1-23931f3ee006', null, null, null, null, null, true, 2, null, '2026-12-26T13:23:00+00:00', '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, '2026-04-26T17:23:38.889535+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('268b8a1a-5891-4185-bea1-d00c581c8e6b', 'https://app.openaa.com/jobs', 'news', 'https://app.openaa.com/jobs', 'external_same', 'external', 'https://app.openaa.com/jobs', null, 'b36722c5-585f-4e16-93d7-d67b0f1aaa1b', null, null, null, null, null, true, 0, null, null, '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, '2026-05-10T19:19:35.195469+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('1a0b1ad1-acc3-4b97-9904-5058eef7203f', 'https://openaa.com/nav/dmv', 'news', 'https://openaa.com/nav/dmv', 'external_same', 'external', 'https://openaa.com/nav/dmv', null, '3778afb9-f2e5-4bf4-a43e-41b322932a85', null, null, null, null, null, true, 1, null, null, '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, '2026-05-10T19:18:31.366069+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('b52f3760-b7d8-4f38-a337-d0f4eb013ea7', 'https://app.openaa.com/', 'news', 'https://app.openaa.com/', 'external_same', 'external', 'https://app.openaa.com/', null, '57ca875f-9700-472d-9b70-6579ff147d75', null, null, null, null, null, true, 2, null, '2026-12-08T20:31:00+00:00', '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, '2026-05-09T00:31:48.024058+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('cdb934fd-699a-46a3-ae0e-863cc81f3724', 'https://numbermobi.com/', 'news', 'https://numbermobi.com/', 'external_new', 'external', 'https://numbermobi.com/', null, 'ee5f18e2-b878-4d5c-b439-a7975a1658fe', null, null, null, null, null, true, 3, null, '2026-12-08T20:30:00+00:00', '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, '2026-05-09T00:30:36.744805+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('b154837c-2241-4ae2-bf42-bae1cc8697f2', 'https://app.openaa.com/services', 'secondhand', 'https://app.openaa.com/services', 'external_same', 'external', 'https://app.openaa.com/services', null, 'be6b4be0-954e-4e84-87ce-c68d9bd84680', null, null, null, null, null, true, 0, null, null, '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, '2026-05-10T19:10:58.074016+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('a871ccba-cd8d-44db-8320-56a7214aa496', 'https://app.openaa.com/jobs', 'secondhand', 'https://app.openaa.com/jobs', 'external_same', 'external', 'https://app.openaa.com/jobs', null, '8fcbbf99-a210-4106-9be1-78ef2b6bdcec', null, null, null, null, null, true, 1, null, '2027-12-10T15:07:00+00:00', '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, '2026-05-10T19:07:37.256403+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('f3181d00-85f0-4ef9-95e3-a75b36c39adb', 'https://app.openaa.com/', 'secondhand', 'https://app.openaa.com/', 'external_same', 'external', 'https://app.openaa.com/', null, '93d6643c-a551-4a49-b03b-486a184c1a60', null, null, null, null, null, true, 2, null, '2026-12-09T17:43:00+00:00', '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, '2026-05-09T21:43:54.882079+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('3d1cae3e-ec3d-48e3-95cf-0dd8d39bd7ac', 'https://openaa.com/nav/dmv', 'services', 'https://openaa.com/nav/dmv', 'external_same', 'external', 'https://openaa.com/nav/dmv', null, '2b52455d-d71a-4855-b907-07451ad0db71', null, null, null, null, null, true, 0, null, null, '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, '2026-05-10T19:17:24.06022+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('0ae817f8-2b6f-4df4-9be6-6882892053bb', 'https://app.openaa.com/secondhand', 'services', 'https://app.openaa.com/secondhand', 'external_same', 'external', 'https://app.openaa.com/secondhand', null, '8e8e1206-3625-45e8-9b6c-f3ddbd857429', null, null, null, null, null, true, 1, null, null, '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, '2026-05-10T19:16:03.152662+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('659aa135-dbcc-4fc7-912a-b3551220117e', 'https://app.openaa.com/', 'services', 'https://app.openaa.com/', 'external_same', 'external', 'https://app.openaa.com/', null, 'baaf9d93-d6f6-427e-83d3-8baf5361352f', null, null, null, null, null, true, 2, null, null, '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, '2026-05-10T19:14:42.27445+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('ffe7ef48-35a1-4552-8b2c-ffc5007cde43', 'https://numbermobi.com/', 'services', 'https://numbermobi.com/', 'external_new', 'external', 'https://numbermobi.com/', null, '6f864b6f-f9c4-4faa-ad31-0177a055e18f', null, null, null, null, null, true, 3, null, null, '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, '2026-05-06T22:14:42.182861+00:00', '2026-06-20T18:18:39.747979+00:00'),
  ('6bad8ad7-e977-4be3-b7d1-a2ceaec3e265', 'https://openaa.com/', 'services', 'https://openaa.com/', 'external_same', 'external', 'https://openaa.com/', null, 'ca66e312-5ea1-415e-9e66-74477bbab638', null, null, null, null, null, true, 4, null, '2026-12-06T18:08:00+00:00', '{"source":"legacy_openaa_ny_public_ads_import"}'::jsonb, '2026-05-06T22:13:18.889381+00:00', '2026-06-20T18:18:39.747979+00:00');
