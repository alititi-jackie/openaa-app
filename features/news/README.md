# News

Public news listing and detail reads, categories, validation, and admin publishing. UI lives in `components/news/`; routes live under `app/`.

## 浏览次数与显示开关

- 统一使用 `site_page_views` 的访问事件：打开、刷新、离开后返回分别计数，同一事件 ID 不重复计数。列表曝光不算文章浏览，UV 仍单独去重。
- 数据库将访问绑定到 `news_id`，原子递增 `news_stats`；不修改新闻 `updated_at`。修改 slug、下架和重新发布保留累计数。
- `/admin/news` 每篇时间信息旁始终显示浏览次数；读取失败显示“暂不可用”。新建文章为 0。
- 顶部的详情页、列表显示开关存储于 `site_settings.news_view_display`，默认均关闭。仅新闻模块且有 `publish_news` 权限者可通过界面修改，数据库同样检查权限；修改记录审计日志。
- 前台经无缓存 `/api/news/views` 批量读取。关闭时不返回数量；设置异常时隐藏。列表开关只作用于 `/news`，首页/DMV/相关阅读不接入列表展示。
- 关闭展示不停止采集。开启后的数字是浏览次数，不是阅读人数或读完次数。

## 部署与验证

先应用 `20261102030639_unified_content_views.sql` 再部署代码。迁移保留全部旧帖子浏览记录，旧 `record_post_view` RPC 改为兼容只读，并关闭客户端直接写入 `post_views` 的权限；现有全站收集器立即成为唯一写入入口。

新闻回填只接受当前精确路径、当前标题（或 ` | ` SEO 后缀）和创建/发布时间之后的历史记录。无法可靠匹配的历史记录不回填。旧帖子绝不叠加历史全站 PV。切换时间记录在 `content_views_pv_cutover`，旧帖累计数包含旧去重口径，不能当作全历史纯 PV。

`npm run test:content-views` 在隔离 PostgreSQL 引擎测试实际迁移、历史保留、四类帖子和新闻、事件重试、时间戳、改名、权限及四种开关组合。`npm test` 覆盖浏览器采集行为。生产核验仅做只读检查，功能测试不要写入真实阅读记录。

回退 UI 代码时保留迁移：旧帖子 RPC 仍可读取，旧全站收集器仍计数。不要恢复旧写入 RPC 或客户端写权限，否则会重复统计；不要删除新表或历史数据。
