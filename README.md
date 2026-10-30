# OpenAA · 美国华人生活平台

[OpenAA 主站](https://openaa.com) 的应用仓库，面向纽约及在美华人提供招聘、房屋、二手、本地服务、新闻、DMV 学习和常用导航。采用移动端优先的 Web/PWA 结构，前台、用户中心、后台管理共用业务系统。

本文按当前代码维护。线上环境变量、域名配置、数据库迁移状态和功能可用性，仍需在对应环境核实；构建成功不等于已完成真实用户流程验收。

## 1. 技术栈与运行要求

| 项目 | 当前配置 / 来源 |
| --- | --- |
| 框架 | Next.js App Router；`next` 与 `eslint-config-next` 固定为 `16.4.3` |
| UI | React 19、TypeScript、Tailwind CSS 4、Lucide、Swiper |
| 数据服务 | Supabase Auth、Postgres、RLS、Storage |
| 部署 | Vercel；GitHub Actions 执行代码检查与测试 |
| 本地 / CI | 建议 Node.js 22，与 `.github/workflows/ci.yml` 一致；使用 npm |
| 可重复安装 | 提交并使用 `package-lock.json`；安装命令为 `npm ci` |
| 数据库权限测试 | PGlite 隔离 PostgreSQL 实例，不访问生产数据库 |

版本的准确清单见 [package.json](package.json) 和 [package-lock.json](package-lock.json)。不要仅为更新版本号而批量升级依赖；升级后必须重新验证。

## 2. 当前功能与主要入口

| 范围 | 入口 / 内容 |
| --- | --- |
| 生活信息 | `/jobs`、`/housing`、`/marketplace`、`/services`；列表、筛选、详情及登录发布 |
| 新闻 | `/news`、`/news/[slug]` |
| DMV | `/dmv`，以及 `/dmv/practice`、`/dmv/questions`、`/dmv/mock-test`、`/dmv/sign-test`、`/dmv/wrong-questions`、`/dmv/tickets` |
| 导航与地址簿 | `/navigation`、`/navigation/my`、`/directory` |
| 搜索 | `/search`，公开帖子、新闻与导航聚合搜索 |
| 用户中心 | `/profile`；资料、安全、我的发布、收藏、最近浏览、通知、个人目录等 |
| 内容管理 | `/admin/user-posts`、`/admin/news`、`/admin/users` |
| 运营管理 | `/admin/home`、`/admin/navigation`、`/admin/ads`、`/admin/messages` |
| 统一回收站 | `/admin/recycle-bin`；图片清理位于 `?tab=image-cleanup` |
| 管理与统计 | `/admin/dashboard`、`/admin/analytics`、`/admin/admins`、`/admin/audit-logs` |
| SEO / PWA | `/robots.txt`、`/sitemap.xml`、`/manifest.webmanifest`、`/sw.js` |

二手频道在本仓库的路径为 `/marketplace`，后台帖子入口为 `/admin/user-posts`。以当前路由为准，不要从历史讨论推断路径。

代码中的登录开关启用了邮箱和 Google；Google 是否可用还取决于 Supabase Provider 配置。Apple、微信、手机登录开关目前关闭，见 [featureFlags.ts](lib/config/featureFlags.ts)。

PWA 已有 manifest、图标与 service worker，但当前 service worker **没有实现离线业务缓存**。原生应用商店打包、支付、订单、会员等不属于当前实现范围。

## 3. 本地启动

以下命令在仓库根目录执行。

```sh
git clone https://github.com/alititi-jackie/openaa-app.git
cd openaa-app
npm ci
```

复制环境变量模板：

```sh
# macOS / Linux / Git Bash
cp .env.example .env.local
```

```powershell
# Windows PowerShell（与上面的复制命令二选一）
Copy-Item .env.example .env.local
```

编辑 `.env.local`，将示例占位符替换为**本次开发环境**的配置。模板同时含本地说明和生产示例，不能复制后直接当作已配置完成。日常开发应使用隔离的 Supabase 开发或测试项目；填写生产凭据会让本地操作直接影响生产数据。

```sh
npm run dev
```

打开 `http://localhost:3000`。若环境无法枚举网卡，可显式指定本机地址：

```sh
npm run dev -- --hostname 127.0.0.1
```

没有 Supabase 配置时，部分公开页面可显示回退内容，登录、发布、后台等不会完整工作。回退页面或空列表不能作为数据库连接成功的证明。这里的启动步骤假定目标数据库已经正确初始化；全新数据库见迁移章节。

## 4. 环境变量与登录回调

| 变量 | 用途 | 配置位置 / 注意事项 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Auth、数据库、Storage 项目地址 | 必须与本环境的 key 属于同一项目 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 浏览器及用户会话客户端的公开 key | 可公开不代表可绕过 RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | 服务端受控的高权限操作 | 仅服务端；不可改为 `NEXT_PUBLIC_`、写入仓库或日志 |
| `NEXT_PUBLIC_SITE_URL` | 应用基础 URL 配置 | 生产为 `https://openaa.com`；有主域校验，见下文 |
| `NEXT_PUBLIC_PRIMARY_SEO_URL` | SEO 主 URL 配置 | 生产为 `https://openaa.com` |
| `NEXT_PUBLIC_CANONICAL_URL` | canonical / sitemap / 结构化数据基础 URL | 生产为 `https://openaa.com` |
| `NEXT_PUBLIC_APP_ENV` | 应用环境标签 | 本地 `development`，生产 `production`；不是数据库隔离或权限边界 |
| `VERCEL_ENV`、`VERCEL` | 平台环境判断、统计采集行为 | 由 Vercel 注入，不要为本地测试伪造生产标签 |

`NEXT_PUBLIC_*` 变量会进入浏览器构建，修改后需要重建。私钥、账号导出和私有测试数据不得提交。历史导入工具的独立变量见 [归档工具说明](tools/archive/README.md)，不属于网站日常启动配置。

**本地主域行为：**[siteConfig.ts](lib/seo/siteConfig.ts) 当前只接受 `openaa.com` 作为应用/SEO 主域；把 `NEXT_PUBLIC_SITE_URL` 设成 localhost 也会回退为生产主域。站内通常使用相对路由，但绝对链接、分享、canonical 与认证跳转必须单独核验；不要据模板注释假设它们都已切换到本地。域名跳转还需在 Vercel 或域名服务商配置，见 [域名与 SEO 说明](docs/DOMAIN_SEO_STRATEGY.md)。

认证回调路由为 `/auth/callback`。在对应 Supabase 项目配置 Auth Site URL、允许的 Redirect URLs 和 Google Provider。生产与本地分别配置所需回调，例如 `https://openaa.com/auth/callback`、`http://localhost:3000/auth/callback`；密码重置等流程也须按实际生成的 URL 配置。预览环境应使用独立数据库，并检查实际回调域名，不能仅依赖环境标签。

## 5. 目录与修改入口

| 目录 / 文件 | 职责 |
| --- | --- |
| `app/(site)/` | 前台、账号、发布与用户中心页面；括号路由组不出现在 URL 中 |
| `app/admin/` | 后台页面及访问门禁 |
| `app/api/`、`app/auth/callback/` | HTTP 接口与认证回调 |
| `components/` | 布局、表单、四类帖子及其它业务 UI |
| `features/` | 查询、Server Actions、验证、数据映射、业务类型 |
| `features/posts/` | 招聘、房屋、二手、服务的共用业务逻辑 |
| `lib/supabase/` | 浏览器、公开读取、用户会话、服务端高权限客户端与类型 |
| `lib/permissions/`、`lib/rateLimit/` | 管理权限、审计和服务端限流 |
| `lib/seo/` | 主域、元数据、JSON-LD 等 |
| `supabase/migrations/` | 数据库结构、权限、种子与历史数据变更记录 |
| `tests/unit/`、`tests/integration/` | 单元测试及隔离数据库验证 |
| `public/` | 静态图片、PWA 文件、统计脚本 |
| `docs/` | 架构、运维与历史设计材料 |
| `tools/archive/` | 手动调用的历史导入、清理规划工具，不是运行时业务入口 |

典型数据流：页面 / 组件 → `features` 查询或 Server Action / `app/api` → Supabase → 映射为展示数据。权限同时在服务端和数据库执行。修改功能前先找共用实现，四类帖子不要复制四套业务逻辑。

## 6. 账号、帖子与管理员规则

- 普通用户可修改昵称、头像、介绍、联系方式等自有资料。账号状态、后台备注、认证标记、信用等级等管理字段由数据库保护。
- 邮箱与邮箱确认状态必须符合 Supabase Auth 的真实身份，不能由用户自行伪造。
- 当前正常新帖自动发布；待审核、已拒绝、已删除是不同状态，不等同于下架。
- **管理员下架后，正常用户可以编辑自己的帖子，再手动恢复显示 / 重新上架。** 修改保存仍保持下架，返回“我的发布”，不会自动公开。
- 当前规则允许下架帖直接恢复显示；没有额外实现“必须先修改一次”的门槛。重新上架不清除管理员操作记录。
- 受限、封禁或待完善账号不能发布、重新上架或编辑帖子内容；受限账号仍保留主帖软删除路径。已删除帖的恢复交给管理员流程。
- 待审核帖子不能由作者直接批准；已拒绝帖子不能由普通作者直接编辑或重新上架。
- 联系方式、分类详情、图片关联等子表写入也要经过账号状态、归属与帖子状态检查。

规则实现见 [帖子模块](features/posts/README.md) 与迁移 [20261030174640](supabase/migrations/20261030174640_protect_account_and_post_management.sql)。`app_private` 中的函数属于内部权限实现，不应作为公开业务 API 暴露。

管理员使用 Supabase Auth、`admin_roles`、权限点及模块授权，不能靠邮箱字符串、前端按钮或 `ADMIN_TOKEN` 获权。首次管理员初始化需先确认 Auth 用户与 profile，再核对目标环境及 SQL；已有管理员后使用 `/admin/admins`。历史初始化模板中的列名和早期阶段说明必须与当前 schema 核对后再用，不能视作可直接复制的全新环境安装脚本。参阅 [管理员授权操作说明](docs/ADMIN_ONLINE_AUTHORIZATION.md)。

## 7. 数据库迁移与数据保护

**当前数据库承载生产数据，不能按“数据可丢弃”处理。不要为了修复配置或同步代码执行生产 reset、清库、重放 baseline。**

迁移链包括 `001`—`033`，以及 `20261030174640_protect_account_and_post_management.sql`。其中既有结构/RLS变更，也有历史内容导入与数据修正；`003_seed_required_settings.sql` 也不只是空配置。不要按文件名猜测是否会写入内容。

已有环境的变更流程：

1. 确认项目、环境及已应用的 migration 版本，备份相关数据并明确恢复方式。
2. 比对仓库与目标环境，只选择尚未应用且已审查的增量迁移；先在隔离环境演练。
3. 结构先行、应用随后；确认旧代码能兼容新结构。通过 Vercel 回滚代码不会自动回滚数据库。
4. 验证读写、权限、Storage和关键用户流程。适用时使用会完整回滚的测试事务，不留下测试账号或公开帖子。
5. 若公开结构变化，重新生成 `lib/supabase/database.ts` 并审查差异，见 [类型生成说明](lib/supabase/README.md)。

**全新环境的已知限制：**历史 `001_baseline_schema.sql` 存在前向外键引用，部分表在其依赖表创建之前声明。目前不能声称“直接顺序运行所有文件即可全新建库”。权限测试会在隔离实例中重排不变的表定义，但这不是生产迁移修复或全新安装验收。新建环境需先处理依赖顺序、种子内容和迁移历史，再验证完整建库流程。详见 [迁移说明](supabase/migrations/README.md)。

## 8. 检查、测试与 CI

```sh
npm audit --omit=dev
npm run lint
npm run typecheck
npm test
npm run test:permissions
npm run audit:admin
npm run build
```

完整依赖检查另运行 `npm audit`，包含开发依赖。漏洞库持续更新，结果以执行时为准，不要把某次“0 告警”理解为永久保证。

| 检查 | 范围与边界 |
| --- | --- |
| `lint` / `typecheck` | 代码风格与静态类型，不证明真实数据可读写 |
| `test` | 验证、映射、新闻链接、统计采集、时区等单元测试 |
| `test:permissions` | PGlite 中实际 schema / RLS / trigger；覆盖自解封、身份伪造、下架编辑重上架、管理记录保护和子表写入 |
| `audit:admin` | 后台入口、门禁、SEO和敏感模式的静态审计；警告需要人工核查，不等于已证实漏洞 |
| `build` | Next.js 生产编译、类型与页面生成；不证明真实登录或生产业务流程已通过 |

CI 在 PR 和 `main` 推送时运行：`npm ci` → 权限测试 → 生产依赖审计 → lint → typecheck → 单元测试 → 后台审计 → build。CI 使用本地地址与占位公开 key，**没有启动真实 Supabase，也不连接生产数据库**。需要真正的数据权限回归时，使用隔离测试及授权环境验证，见 [测试说明](tests/integration/README.md)。

额外的统计数据库测试可运行：

```sh
node tests/integration/analytics-db.mjs
```

它已可使用仓库的 PGlite 开发依赖，不需要另装临时依赖。目前这个命令不在 CI 中。

## 9. 发布、验收与回滚

Vercel 项目关联 Git 仓库；生产分支和具体项目配置以平台设置为准。当前流程通过 `main` 更新触发部署，GitHub CI 与 Vercel 部署是两个独立结果；一个通过不代表另一个通过。

发布前完成本节检查命令并审查代码差异；有数据库变更时先完成迁移与兼容性验证。Vercel 的 Production / Preview 环境分别配置凭据，敏感凭据不要提交到仓库。

发布后至少核验：

- 部署对应预期 commit；生产域名已指向该部署，关键页面没有启动错误。
- 登录、退出、资料保存及认证回调；普通用户不能进入管理员页面。
- 四类帖子的列表、搜索/筛选、详情、发布、编辑和图片。
- 管理员下架 → 用户编辑 → 保存仍下架 → 用户恢复显示；管理员记录仍在。
- 受限/封禁账号不能绕过表单直接写入帖子或管理字段。
- 首页、广告/导航、robots、sitemap，以及手机端布局。

本地启动已构建的网站：

```sh
npm run start
# 环境无法枚举网卡时：
npm run start -- --hostname 127.0.0.1
```

应用回滚优先使用撤回提交或平台已有部署回滚，保留历史；不要强推覆盖别人的提交。数据库增量需要单独评估恢复或修正，不能把代码回滚当作数据库回滚。对本来就允许用户恢复显示的下架帖，不得在安全修复中误加永久锁定规则。

## 10. 常见排查入口

| 现象 | 先检查 |
| --- | --- |
| 页面为空、读取失败 | 环境变量、项目匹配、数据状态/过期时间、RLS、查询超时；区分空数据与连接错误 |
| 已登录但无后台权限 | `profiles.status`、有效 `admin_roles`、模块与权限点、服务器返回结果 |
| 下架帖无法编辑 / 重上架 | 前台编辑入口、`features/posts/actions.ts`、账号状态和对应迁移；不要删除管理历史来规避 |
| 图片加载或上传失败 | bucket、Storage策略、owner、资产关联；`next.config.ts` 的 HTTPS主机白名单 |
| Google或邮件回调异常 | Supabase Provider、Site URL、Redirect URLs、实际部署域名及主域配置 |
| 有部署成功但 CI失败 | 打开失败步骤；依赖审计、权限测试、类型、后台审计与构建分别处理 |
| 地址变成生产域名 | `lib/seo/siteConfig.ts` 的主域校验和认证/分享使用的绝对链接 |
| 统计不显示或本地不计数 | `025/029/030/031/033` 迁移与服务端 key；统计 SDK仅采集允许的生产域名，Preview跳过写入 |

限流与统计行为见 [统计模块](features/analytics/README.md)。不要把无法访问的测试浏览器、单次超时或构建占位配置，直接当作线上用户也遇到的故障。

## 11. 进一步阅读与维护规则

- [架构与数据流](docs/ARCHITECTURE.md) · [开发原则](docs/DEVELOPMENT_PRINCIPLES.md)
- [业务模块入口](features/README.md) · [帖子规则](features/posts/README.md)
- [Supabase](supabase/README.md) · [迁移](supabase/migrations/README.md) · [类型生成](lib/supabase/README.md)
- [统一统计](features/analytics/README.md) · [数据库测试](tests/integration/README.md)
- [域名与 SEO](docs/DOMAIN_SEO_STRATEGY.md) · [图片策略](docs/IMAGE_STRATEGY.md) · [应用封装规划](docs/APP_WRAPPER_NOTES.md)
- [归档工具](tools/archive/README.md)

`docs/` 中部分材料按早期阶段编写，可能包含已变更的路由、字段或尚未实施的设计。发生冲突时，以当前代码、已审查迁移和目标环境实测为依据；不要据历史文档断言线上状态或权限保证。

变更路由、环境变量、命令、迁移、权限或发布流程时，同步更新 README 和模块说明。PR应说明复用了哪些共用组件、是否改变权限/数据流、如何验证；不要将历史待办自动当成当前问题。
