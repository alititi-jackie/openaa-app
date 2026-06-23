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
