-- Rebuild public navigation from reviewed old-site content.
alter table public.navigation_categories
  add column if not exists display_limit integer not null default 50;

alter table public.navigation_links
  add column if not exists deleted_at timestamp with time zone;

alter table public.navigation_links
  drop constraint if exists navigation_links_open_mode_check;

alter table public.navigation_links
  alter column open_mode set default 'auto';

alter table public.navigation_links
  add constraint navigation_links_open_mode_check
    check (open_mode in ('auto', 'same', 'new'));

alter table public.user_navigation_links
  drop constraint if exists user_navigation_links_open_mode_check;

alter table public.user_navigation_links
  alter column open_mode set default 'auto';

alter table public.user_navigation_links
  add constraint user_navigation_links_open_mode_check
    check (open_mode in ('auto', 'same', 'new'));

create index if not exists navigation_links_not_deleted_sort_idx
  on public.navigation_links (category_id, is_active, sort_order)
  where deleted_at is null;

delete from public.navigation_links;
delete from public.navigation_categories;

insert into public.navigation_categories (slug, name, description, icon, sort_order, display_limit, is_active)
values
  ('featured', '热门推荐', '', null, 10, 50, true),
  ('government', '政府服务', '', null, 20, 50, true),
  ('finance', '银行金融', '', null, 30, 50, true),
  ('shopping', '购物平台', '', null, 40, 50, true),
  ('telecom', '通讯网络', '', null, 50, 50, true),
  ('ai', 'AI工具', '', null, 60, 50, true),
  ('video', '视频娱乐', '', null, 70, 50, true),
  ('social', '社交媒体', '', null, 80, 50, true),
  ('life', '生活服务', '', null, 90, 50, true),
  ('other', '其它', '', null, 100, 50, true);

insert into public.navigation_links (category_id, title, description, url, icon, icon_image_asset_id, open_mode, sort_order, is_active, is_featured, metadata)
select
  c.id,
  v.title,
  nullif(v.description, ''),
  v.url,
  null,
  null,
  v.open_mode,
  v.sort_order,
  v.is_active,
  false,
  jsonb_build_object('source', 'legacy_official_import', 'origin', 'openaa-ny', 'legacy_id', v.legacy_id)
from (values
  ('featured', 'Google翻译', '中英文翻译、网页翻译与文档翻译。', 'https://translate.google.com/', 'auto', 1, true, '7abfc8ec-3e40-46de-a77d-fe343512bc1c'),
  ('featured', '移民局收费', '庇护年费缴费页面', 'https://my.uscis.gov/accounts/annual-asylum-fee/questionnaire', 'auto', 2, true, '12c28315-e093-48cb-be57-6019150f59a8'),
  ('featured', 'DMV小工具', 'DMV 文件检查器，6 Points 计算器，REAL ID', 'https://openaa.com/tool/dmv/document-checker.html', 'auto', 3, true, 'b398a0fa-bfdf-4656-b835-88abf531be2a'),
  ('featured', '招聘信息', 'OpenAA 招聘板块入口。', '/jobs', 'auto', 20, true, '04a56077-a3d5-4566-85e8-34088345b1de'),
  ('featured', '二手闲置', 'OpenAA 二手板块入口。', '/secondhand', 'auto', 30, true, 'ffb92e90-564e-49f9-a30b-125ca49c87b9'),
  ('featured', '手机靓号', '低价美国手机靓号', 'https://numbermobi.com/#buy-note', 'auto', 31, true, '2503681c-cf54-414e-8a2d-8c444eb8b3c6'),
  ('featured', '纽约工作网', '纽约地区招聘信息。', 'https://newyork.craigslist.org/search/jjj', 'auto', 40, true, 'c58549d7-4f8d-494f-92e1-ace1395452f4'),
  ('featured', '纽约生活', '纽约本地生活信息。', 'https://newyork.craigslist.org/', 'auto', 50, true, 'f1f8010d-2e0d-4e1c-bb25-bf40c1b475c7'),
  ('featured', '一亩三分地', '留学、求职、移民与北美生活社区。', 'https://www.1point3acres.com/', 'auto', 60, true, 'c8d06825-eb8e-41d0-bede-9f28814a0ee0'),
  ('featured', 'DMV NY', '纽约州 DMV 官方网站。', 'https://dmv.ny.gov/', 'auto', 70, true, 'c2d73ce1-c5f5-493c-9ce0-e0a910fd4357'),
  ('featured', 'OpenAA站内搜索', 'OpenAA站内搜索', 'https://ny.openaa.com/search', 'auto', 80, true, '169e3727-2dec-4544-a90d-e9e241c851d1'),
  ('government', 'DMV官方入口', '各州 DMV 官方导航入口。', 'https://openaa.com/nav/dmv', 'auto', 10, true, '7fc59537-e7f8-4f2c-a1f6-b73a2faf24e8'),
  ('government', 'USCIS', '移民/工卡/入籍等官方办理入口。', 'https://www.uscis.gov/', 'auto', 20, true, '6e98644c-e018-4dbc-892d-5185d05c0ef9'),
  ('government', 'IRS', '联邦税务申报与查询。', 'https://www.irs.gov/', 'auto', 30, true, '0f2d478c-58c0-4a4d-ab81-01fada9cec2c'),
  ('government', 'SSA', '社保号与社保服务。', 'https://www.ssa.gov/', 'auto', 40, true, '4dad046a-e9e7-485d-bbf4-32ae55d20698'),
  ('government', 'USA.gov', '美国政府服务总入口。', 'https://www.usa.gov/', 'auto', 50, true, '88d140f2-9b62-4bd7-b65f-892b3226fe16'),
  ('government', '美国国务院', '国务院信息与领事服务。', 'https://www.state.gov/', 'auto', 60, true, '4ebe6410-0966-4912-84c0-8438090246dc'),
  ('government', 'CBP', '海关与边境保护。', 'https://www.cbp.gov/', 'auto', 70, true, 'e7c4e362-4863-42f3-bfc8-e81dff797877'),
  ('government', 'DOL', '劳工部与劳动相关信息。', 'https://www.dol.gov/', 'auto', 80, true, 'ae8b8ea7-ea91-44b0-bbd3-b92ce237ff2e'),
  ('finance', '更多', '整合更多的各类银行', 'https://openaa.com/nav/bank', 'auto', 0, true, '5c679bef-1a68-4885-81dc-74f69254ffbb'),
  ('finance', 'Bank of America', '美国银行官网。', 'https://www.bankofamerica.com/', 'auto', 10, true, '4c722ae7-4e12-4c71-b8fc-4f2ea237fe3f'),
  ('finance', 'Chase', '摩根大通 Chase 官网。', 'https://www.chase.com/', 'auto', 20, true, 'a4a5d45c-0706-402d-9630-fc151052db3d'),
  ('finance', 'Wells Fargo', '富国银行官网。', 'https://www.wellsfargo.com/', 'auto', 30, true, '54962ea0-7409-4f58-9c24-af1bae3882d1'),
  ('finance', 'Citi', '花旗银行官网。', 'https://www.citi.com/', 'auto', 40, true, '264beec9-8aac-4456-a1cb-1e403b543352'),
  ('finance', 'TD', 'TD Bank 官网。', 'https://www.td.com/us/en/personal-banking', 'auto', 50, true, 'f6d5197c-505e-48e7-9d3f-695d378d7726'),
  ('finance', 'Capital One', 'Capital One 官网。', 'https://www.capitalone.com/', 'auto', 60, true, 'eef11327-6ffa-4519-af32-b94e2f6a57ad'),
  ('finance', 'PNC', 'PNC 银行官网。', 'https://www.pnc.com/', 'auto', 70, true, '58b7800e-970c-420e-aaf7-b079b0ca1884'),
  ('finance', 'Discover', 'Discover 金融服务。', 'https://www.discover.com/', 'auto', 80, true, '520b2506-6a7e-45c7-bd08-544baffa406a'),
  ('finance', 'Amex', 'American Express 官网。', 'https://www.americanexpress.com/', 'auto', 90, true, 'aea85f49-baa1-4172-8305-1bedb3eb6a90'),
  ('shopping', '更多', '整合更多分类购物', 'https://openaa.com/nav/onegobuy', 'auto', 0, true, '83bfdc9c-7e53-49be-b0ca-1d8ba4b16367'),
  ('shopping', 'Amazon', '电商平台。', 'https://www.amazon.com/', 'auto', 10, true, 'd53e0fde-c099-4c5b-8af7-8cf86feede15'),
  ('shopping', 'Walmart', 'Walmart 超市与电商。', 'https://www.walmart.com/', 'auto', 20, true, 'e10f6241-1eb0-4fbb-b1d3-5b5dec739590'),
  ('shopping', 'eBay', 'eBay 二手与拍卖平台。', 'https://www.ebay.com/', 'auto', 30, true, 'f4f23903-153f-476b-9646-1a06b4c93a54'),
  ('shopping', 'Costco', 'Costco 仓储会员店。', 'https://www.costco.com/', 'auto', 40, true, '9fc96629-0add-4c8e-a090-2568670fc24c'),
  ('shopping', 'Target', 'Target 官网。', 'https://www.target.com/', 'auto', 50, true, '7d628435-62c1-42ac-b546-1414b4200e9a'),
  ('shopping', 'BestBuy', 'BestBuy 电子产品零售。', 'https://www.bestbuy.com/', 'auto', 60, true, '9b9edc5d-cc62-4179-b163-bf4e76ef2b61'),
  ('shopping', 'Weee', 'Weee 亚洲食品生鲜配送。', 'https://www.sayweee.com/', 'auto', 70, true, '253e58d0-8fbd-491d-b63e-ad5195a80adf'),
  ('shopping', 'AliExpress', 'AliExpress 海淘平台。', 'https://www.aliexpress.com/', 'auto', 80, true, 'cdc11b1c-6b8c-4393-bf4b-ab33ebfeebe2'),
  ('telecom', 'T-Mobile', 'T-Mobile 官网。', 'https://www.t-mobile.com/', 'auto', 10, true, '558f80d7-0859-477b-8f10-8f44beac96f5'),
  ('telecom', 'Verizon', 'Verizon 官网。', 'https://www.verizon.com/', 'auto', 20, true, '608d7923-8727-4806-b6b3-2ef4d0f93e6e'),
  ('telecom', 'AT&T', 'AT&T 官网。', 'https://www.att.com/', 'auto', 30, true, 'e666a0f3-f653-4dfa-92fa-180084fad03d'),
  ('telecom', 'Tello', 'Tello 虚拟运营商。', 'https://tello.com/', 'auto', 40, true, '8071cf27-b558-4130-b749-7828bdb433da'),
  ('telecom', 'Mint', 'Mint Mobile 虚拟运营商。', 'https://www.mintmobile.com/', 'auto', 50, true, '7ccd4bfd-9fbc-490b-a469-e96eb343b6f9'),
  ('telecom', 'Lycamobile', 'Lycamobile 官网。', 'https://www.lycamobile.us/', 'auto', 60, true, '22872569-6c5f-4be0-8f9b-a663eb5c8841'),
  ('telecom', 'Cricket', 'Cricket Wireless 官网。', 'https://www.cricketwireless.com/', 'auto', 70, true, '365faa22-5b86-42ca-be32-173dafc884e4'),
  ('telecom', 'Google Fi', 'Google Fi 官网。', 'https://fi.google.com/', 'auto', 80, true, '8a515687-e2e4-47f2-a2bd-ab0d6fbe16cc'),
  ('ai', '更多AI', '整合分类用途的更多的AI', 'https://openaa.com/nav/ai', 'auto', 0, true, '87e73c3b-1fa3-4dc4-b42c-e02a5f167419'),
  ('ai', 'ChatGPT', 'OpenAI ChatGPT。', 'https://chat.openai.com/', 'auto', 10, true, 'b946aabf-d9cf-42c2-be06-166d7879b525'),
  ('ai', 'DeepSeek', 'DeepSeek。', 'https://www.deepseek.com/', 'auto', 20, true, '354d50ea-1703-49cb-bcb2-14c507f45305'),
  ('ai', 'Gemini', 'Google Gemini。', 'https://gemini.google.com/', 'auto', 30, true, '48f237c4-0980-432b-a0e0-12a939b3a207'),
  ('ai', 'Claude', 'Anthropic Claude。', 'https://claude.ai/', 'auto', 40, true, '2bdb3c0f-44bd-481b-94c3-27134356b148'),
  ('ai', 'Copilot', 'Microsoft Copilot。', 'https://copilot.microsoft.com/', 'auto', 50, true, 'fcb61e18-8180-4a45-bfe0-c92815f7244f'),
  ('ai', 'Grok', 'xAI Grok。', 'https://grok.x.ai/', 'auto', 60, true, 'b12d86aa-857c-44f5-8275-1798d0f8d06c'),
  ('ai', 'Perplexity', 'Perplexity 搜索助手。', 'https://www.perplexity.ai/', 'auto', 70, true, 'e3053a76-d2eb-4752-957b-5bfbc6906f46'),
  ('ai', 'Kimi', 'Kimi 智能助手。', 'https://kimi.moonshot.cn/', 'auto', 80, true, '353e35b4-8539-4b28-92e0-b9309c23922c'),
  ('ai', '豆包', '豆包 AI。', 'https://www.doubao.com/', 'auto', 90, true, 'c7afd27d-e4fd-4011-8a38-e7b9cca8337b'),
  ('ai', '通义千问', '阿里通义千问。', 'https://tongyi.aliyun.com/qianwen/', 'auto', 100, true, '40129b31-0a4f-4219-a3fc-03eb57a481d0'),
  ('video', 'YouTube', 'YouTube 视频平台。', 'https://www.youtube.com/', 'auto', 10, true, '5fca782c-9c24-4a52-921c-b0c845ede119'),
  ('video', 'Netflix', 'Netflix 流媒体。', 'https://www.netflix.com/', 'auto', 20, true, '1776f94f-ff51-4cfd-8923-fbee86da8cd8'),
  ('video', 'TikTok', 'TikTok 短视频。', 'https://www.tiktok.com/', 'auto', 30, true, 'f489e3ff-3eac-4e99-b444-d9c4a6ad7a36'),
  ('video', 'B站', '哔哩哔哩。', 'https://www.bilibili.com/', 'auto', 40, true, 'c012d0e2-7c5d-4acb-b67f-1d16d617d7ec'),
  ('video', 'Disney+', 'Disney+ 流媒体。', 'https://www.disneyplus.com/', 'auto', 50, true, 'c9e2b62e-f9f1-44b3-8690-b91fc6734d27'),
  ('video', 'Hulu', 'Hulu 流媒体。', 'https://www.hulu.com/', 'auto', 60, true, '36f47e9d-7a38-4e60-8b17-886c8f56a526'),
  ('social', 'Facebook', 'Facebook 社交。', 'https://www.facebook.com/', 'auto', 10, true, '88371d02-2fa2-4d8a-8f3d-ca84569eb1f0'),
  ('social', 'Instagram', 'Instagram 社交。', 'https://www.instagram.com/', 'auto', 20, true, '1ccb3e13-76c8-4db7-818d-7dbcc894bcb0'),
  ('social', '小红书', '小红书社区。', 'https://www.xiaohongshu.com/', 'auto', 30, true, 'c96233e8-42f9-44ed-9d92-0d18d99fa3e2'),
  ('social', 'X', 'X (Twitter)。', 'https://x.com/', 'auto', 40, true, 'f534f31d-6ff2-45bb-9f55-29326d8a8e99'),
  ('social', 'Reddit', 'Reddit 社区。', 'https://www.reddit.com/', 'auto', 50, true, 'd6f2d34f-85f9-4e07-b977-330c562d231a'),
  ('social', 'LinkedIn', 'LinkedIn 职场社交。', 'https://www.linkedin.com/', 'auto', 60, true, 'e8e90dd5-0760-4db5-9d90-90484fabf6fb'),
  ('social', '微信网页版', '微信网页版。', 'https://web.wechat.com/', 'auto', 70, true, '52ed509d-3350-4ac8-a19a-47e107faeed4'),
  ('social', '微博', '微博。', 'https://weibo.com/', 'auto', 80, true, 'd496ef40-2459-4bf6-b244-888bd470f3b5'),
  ('life', '纽约生活', '纽约本地生活信息。', 'https://newyork.craigslist.org/', 'auto', 10, true, 'dfab989a-7f88-41b4-81a3-1827ad796f5d'),
  ('life', '纽约华人365', '房屋与生活信息。', 'https://www.365wuyu.com/', 'auto', 20, true, '0323ba80-8fa8-4bac-8053-fc4e90b45546'),
  ('life', '华人工商黄页', '商家查询黄页。', 'https://www.yellowpages.com/', 'auto', 30, true, 'b32fa9cd-6a98-4373-a4ff-260a9511884e'),
  ('life', 'Yelp', 'Yelp 商家点评与搜索。', 'https://www.yelp.com/', 'auto', 40, true, '1f2c5246-6e36-4c8c-a099-31a6ed32453c'),
  ('life', 'Groupon', 'Groupon 优惠与团购。', 'https://www.groupon.com/', 'auto', 50, true, '6aa4ee4d-21eb-463b-b980-da2cb572b9b5'),
  ('life', 'DoorDash', 'DoorDash 外卖配送。', 'https://www.doordash.com/', 'auto', 60, true, 'fb16ce5d-1656-45ec-8972-24ffca1bc185'),
  ('other', '百度', '百度搜索。', 'https://www.baidu.com/', 'auto', 10, true, 'f1c67736-6e47-4b26-8a17-d55cf38d38ec'),
  ('other', 'Gmail', 'Gmail 邮箱。', 'https://mail.google.com/', 'auto', 20, true, '718050e8-64e8-4dc1-8b7f-aa40db77eb81'),
  ('other', 'Outlook', 'Outlook 邮箱。', 'https://outlook.live.com/', 'auto', 30, true, 'a08cfd92-b1f5-49fc-965f-a93f461155ae'),
  ('other', '知乎', '知乎。', 'https://www.zhihu.com/', 'auto', 40, true, '45bf5456-1ec0-42bb-b2b2-39a742fd7829'),
  ('other', 'Steam', 'Steam 游戏平台。', 'https://store.steampowered.com/', 'auto', 50, true, '1769d7c8-af36-474c-9c15-a9e9a86b4706'),
  ('other', '世界日报', '世界日报官网。', 'https://www.worldjournal.com/', 'auto', 60, true, 'bcbf8bcf-6781-4596-bbc4-abdc98178cdc')
) as v(category_slug, title, description, url, open_mode, sort_order, is_active, legacy_id)
join public.navigation_categories c on c.slug = v.category_slug;
