# OpenAA 基础知识库 v2

## 1. 网站身份

正式名称：OpenAA

正式域名：https://openaa.com

唯一正式项目仓库：openaa-app

网站定位：OpenAA 是面向纽约及美国华人的中文生活信息平台，提供招聘、房屋、二手市场、本地服务、新闻资讯、DMV 工具、常用导航、用户中心和后台管理能力。

目标用户：美国华人、新移民、留学生、华人家庭、本地商家、服务提供者、招聘方、求职者、房东、租客、二手交易用户。

当前开发阶段：OpenAA 仍处于持续开发和测试完善阶段。当前代码基准是 openaa-app。OpenAA 不存在“新站/旧站”概念。

## 2. 当前核心功能

招聘：用户可以浏览、搜索、筛选招聘/求职信息；登录用户可以发布和管理自己的招聘相关帖子；管理员可以在后台统一管理用户发布内容。

房屋：用户可以浏览、搜索、筛选出租、出售、求租、求购等房屋信息；登录用户可以发布和管理自己的房屋帖子；管理员可以审核、隐藏、恢复、删除或处理相关内容。

二手：用户可以浏览、搜索、筛选二手出售和求购信息；登录用户可以发布和管理自己的二手帖子；管理员可以统一管理二手市场内容。

本地服务：用户可以浏览、搜索、筛选搬家、维修、装修、报税、法律、会计、接送等本地服务信息；登录用户可以发布服务信息；管理员可以管理服务类帖子。

新闻：用户可以浏览新闻资讯、分类新闻和新闻详情；管理员可以管理新闻、分类、封面、状态和发布内容。

DMV：用户可以使用 DMV 相关页面，包括中文练习、模拟考试、题库、标志测试、罚单查询入口、错题等功能。DMV 题库运行时优先读取 Supabase dmv_questions；当数据库没有可用题目时，当前代码仍存在归档 JSON fallback。该 JSON 属于归档题库来源，不代表独立业务系统或另一个 OpenAA 站点。

华人导航：用户可以浏览常用网站导航；登录用户可以使用个人导航相关能力；管理员可以管理导航分类、链接、排序、启用状态和顶部快捷入口。

搜索：用户可以通过站内搜索聚合查询公开帖子、新闻和导航链接。当前 /api/search 调用公开内容聚合搜索，不应描述为已确认存在搜索词或搜索历史持久化。

用户中心：用户可以管理资料、发布内容、收藏、通知、最近浏览、安全设置和商家/目录相关信息。

后台管理：管理员可以管理用户、用户发布、新闻、导航、首页、广告、举报/反馈、回收站、图片清理、管理员授权和审计日志。

## 3. 当前技术架构

Next.js：项目使用 Next.js App Router，package.json 中依赖 Next.js 16.x。

React：项目使用 React 19.x。

Supabase：用于 Auth、数据库、RLS、服务端查询、公开客户端查询、后台管理数据和运行时业务数据。

Vercel：仓库包含面向 Vercel/Next.js 部署的结构；线上部署状态和 Vercel 项目设置不应仅凭仓库内容断言。

GitHub Actions：仓库包含 CI 工作流，在 main push 和 pull_request 时运行 npm ci、lint、typecheck、build，Node 版本为 22。

本地开发环境和线上生产环境边界：本地可使用开发环境、测试环境和本地 Supabase；生产环境必须使用正式域名 https://openaa.com 和生产环境变量。不要把本地 Docker、Open WebUI、Ollama、n8n、OAICC 等工作站工具说成 OpenAA 正式网站已上线功能。

## 4. 当前数据架构

posts：招聘、房屋、二手、本地服务的统一主表，承载通用帖子字段、状态、作者、类型、可见性和管理状态。

post_details_*：帖子详情扩展表。当前招聘、房屋、二手、本地服务统一使用 posts + post_details_jobs、post_details_housing、post_details_marketplace、post_details_services。

post_contacts：帖子联系方式相关数据。

user_favorites：用户收藏数据。

news_posts：新闻内容主表。

navigation_*：导航相关数据，包括 navigation_categories、navigation_links，以及用户导航相关表。

notifications：站内通知数据，不代表短信、邮件营销、浏览器 Push 或原生 App Push 已上线。

home_sections：首页模块配置数据。

latest_ticker：首页和频道动态条相关数据。

ads：广告位、广告内容和相关展示配置。

site_page_views：站点访问统计相关数据。

当前不要把 job_postings、裸 housing、secondhand_items、裸 services 写成运行时主表。当前招聘、房屋、二手、本地服务的运行时主结构是 posts + post_details_*。

## 5. 当前用户流程

注册：用户可通过注册入口创建账号。

邮箱确认：注册流程与 Supabase Auth 邮箱确认能力相关，具体线上邮件配置状态仅凭仓库无法确认。

登录：用户可通过登录入口进入账号。

Google OAuth：代码中存在 OAuth/Auth 相关流程；Google OAuth 的线上配置状态仅凭仓库无法确认。

忘记密码：用户可通过忘记密码入口请求重置流程。

重置密码：用户可通过重置密码入口完成密码更新。

用户资料：登录用户可管理个人资料、头像、联系方式等资料能力。

发布管理：登录用户可查看和管理自己发布的招聘、房屋、二手、本地服务内容。

收藏：登录用户可收藏公开内容，并在用户中心查看收藏。

通知：用户可查看站内通知，通知是站内系统能力，不等于短信、邮件营销或 Push。

最近浏览：用户中心包含最近浏览相关入口和能力。

## 6. 当前后台能力

用户：管理员可以查看和管理用户状态、备注、统计和相关信息。

用户发布：管理员可以管理用户发布的招聘、房屋、二手、本地服务内容。

新闻：管理员可以管理新闻文章、分类、封面、状态和发布。

导航：管理员可以管理导航分类、导航链接、排序、启用状态和顶部快捷入口。

首页：管理员可以管理首页模块配置、动态条、SEO 内容等首页相关配置；首页顶部广告主要通过广告管理处理。

广告：管理员可以管理广告位、广告内容、外部图片或图片资产、默认占位等。

举报/反馈：管理员可以在消息/支持相关后台处理举报、反馈、线索和建议。

回收站：管理员可以查看和处理软删除或回收站相关内容。

图片清理：管理员可以处理图片资产清理相关任务，当前以更安全的标记/管理方式为主。

管理员授权：超级管理员可以管理管理员角色、授权模块、启用状态和限制豁免。

审计日志：后台关键操作写入 admin_audit_logs，用于追踪管理员操作。

## 7. 首页真实结构

首页真实渲染顺序：

1. HomeBanner
2. LatestTicker
3. QuickGrid
4. UtilityCards
5. LatestPostsSection
6. SeoContentCard

首页当前通过 getHomeConfig 读取配置和公开数据，直接使用 Supabase 读取首页所需内容。首页设置 revalidate=300。

## 8. SEO 当前事实

正式主域名：https://openaa.com

metadata：项目通过统一 SEO metadata 构建方法生成页面 title、description、canonical 等信息。

canonical：正式 canonical 基准为 https://openaa.com。

robots：仓库包含 robots.txt 路由。

sitemap：仓库包含 sitemap.xml 路由。

JSON-LD：站点 layout 包含 WebSite/Organization 类站点结构化数据；新闻详情包含 NewsArticle / BreadcrumbList；DMV 页面包含 DMV 相关结构化数据。

当前没有 Product/ProductGroup 结构化数据。当前没有应指定 offers、review 或 aggregateRating 的 Product/ProductGroup JSON-LD 实现。

Search Console 线上状态：当前资料无法确认。

## 9. 明确边界和禁止误判

不要把 openaa.app 当正式网站。正式域名始终是 https://openaa.com。

OpenAA 不存在“新站/旧站”概念。

openaa-app 是唯一正式 OpenAA 项目仓库。

不要把 openaa-ny 定义为 OpenAA 旧站；openaa-ny 不属于当前 OpenAA 项目体系。

不要把 tools/archive 当当前生产功能。

不要把 legacy JSON 当当前生产功能。

不要把 demo seed 当当前生产数据。

不要把历史 migration 的兼容逻辑当当前用户功能。

不要把归档来源字段、origin、source、legacy_id 或历史 source_url 当成当前 OpenAA 项目结构。

不要凭空假设 OpenAA 已有 AI 功能。

不要凭空假设 OpenAA 已有会员、积分、支付、原生 App、Push、短信或邮件营销功能。

不要把 OAICC、DeepSeek、Qwen、Open WebUI、n8n 说成已经上线到 OpenAA 正式网站。

线上 Supabase、Vercel、Search Console、OAuth、邮件等外部服务状态，如果当前资料无法确认，必须明确写“当前资料无法确认”。

## 10. AI 回答规则

回答 OpenAA 问题时优先依据当前知识库。

技术问题优先依据 openaa-app 当前代码结构、当前数据表、当前路由和当前权限模型。

运营问题围绕美国华人、新移民、留学生、家庭、本地商家、招聘方、求职者、房东、租客和本地服务提供者。

不得虚构功能。

不得把规划中的功能说成已上线。

正式域名始终写 https://openaa.com。

无法确认的线上状态必须明确写“当前资料无法确认”。

涉及归档、迁移、demo、tools/archive、legacy_id、origin、source_url 等内容时，必须说明它们是历史来源、迁移输入或兼容字段，不代表当前生产功能。
