# Phase 1 Jobs Legacy Parity Report

## 1. 已修复差异清单

1. 招聘列表 `/jobs`
   - 恢复招聘专属页面结构，不再使用通用 `ChannelPageShell` 展示招聘列表。
   - 恢复旧站招聘/求职 Tab：`招聘岗位`、`求职人才`。
   - 恢复旧站筛选项：关键词、工作类型、职位分类、地区。
   - 新增招聘专属查询 `getPublicJobPosts`，筛选不再是静态 UI。
   - 招聘卡片改为招聘专属卡片，显示标题、公司、工作类型、薪资、地区、分类、发布时间、置顶标识。

2. 招聘发布页
   - `/jobs/publish?type=hiring|seeking` 可按旧站入口预选招聘/求职类型。
   - 新增 `/publish/job` 兼容入口。
   - 招聘发布表单隐藏旧站没有的 email、首选联系方式、草稿恢复提示。
   - 招聘仍禁用图片上传，与旧站一致。
   - 新发布招聘写入 `metadata.job_mode`，用于招聘/求职 Tab 过滤。

3. 招聘编辑页
   - `/jobs/edit/[id]` 使用 legacy parity 表单模式。
   - 编辑回填不再只依赖展示字段，补齐招聘 mode、公司、职位分类、工作类型、薪资、薪资单位、地区。

4. 招聘详情页
   - `/jobs/[id]` 改为招聘专属详情布局。
   - 恢复旧站风格的标题、公司、工作类型 badge、薪资卡、地点卡、分类、浏览次数、发布时间、职位描述。
   - 联系方式改为招聘专属“查看联系方式”按钮，显示联系人、电话、微信，并支持拨打电话、复制微信号。
   - 隐藏通用详情页的新站 engagement 面板，避免招聘详情显示旧站没有的举报/扩展面板。

5. 我的招聘
   - `/profile/jobs` 改为招聘专属管理列表。
   - 新增旧站路径 `/profile/my-jobs`。
   - `/profile/my-jobs` 未登录 returnTo 保留为 `/profile/my-jobs`。
   - 我的招聘卡片恢复状态 badge、招聘/求职 badge、工作类型、薪资、地区、时间。
   - 我的招聘操作按钮恢复旧站文案：查看、编辑、隐藏、恢复显示、删除。

6. 招聘权限逻辑
   - Active：保留发布、编辑、隐藏、恢复、删除路径。
   - Restricted：继续禁止发布、隐藏、恢复；保留编辑/删除路径。
   - Banned：招聘模块按审计记录放开编辑/删除本人招聘；仍禁止发布、隐藏、恢复。
   - 以上 job 专属调整通过 `post_type === "job"` 条件限制，不扩展到房屋、二手、本地服务。

## 2. 未修复差异清单

1. 未登录发布页文案仍使用新站 `auth-required` 页面，未完全恢复旧站原地显示 `请先登录` 的视觉结构。
2. 公开联系方式仍受现有 `post_contacts` RLS/API 约束，需要点击后通过 API 读取；UI 已贴近旧站，但不是服务端直出联系方式。
3. 旧站置顶字段 `is_pinned/pinned_until/pinned_order` 在新站 posts 表中没有同名列，本阶段使用 `posts.metadata` 兼容读取；历史数据如未导入 metadata，置顶只能无法确认。
4. 旧站真实登录态 active/restricted/banned/admin 账号未提供，本阶段只做代码路径和未登录 HTTP 验证，未完成真实账号端到端操作。
5. 招聘详情页缺少真实公开招聘 id 样本，详情页布局通过 build 和代码路径验证，未完成线上真实数据截图复核。
6. 后台招聘审核/管理员操作不属于 Phase 1 范围，未处理。

## 3. 修改文件清单

- `app/jobs/page.tsx`
- `app/jobs/publish/page.tsx`
- `app/jobs/edit/[id]/page.tsx`
- `app/jobs/[id]/page.tsx`
- `app/profile/jobs/page.tsx`
- `app/profile/my-jobs/page.tsx`
- `app/publish/job/page.tsx`
- `components/jobs/JobCard.tsx`
- `components/jobs/JobsLegacyPage.tsx`
- `components/jobs/JobDetailLegacyView.tsx`
- `components/jobs/JobContactCard.tsx`
- `components/jobs/UserJobsList.tsx`
- `components/jobs/UserJobManagementActions.tsx`
- `components/forms/PostForm.tsx`
- `components/forms/ContactFields.tsx`
- `features/jobs/legacy.ts`
- `features/posts/queries.ts`
- `features/posts/mappers.ts`
- `features/posts/types.ts`
- `features/posts/formMappers.ts`
- `features/posts/actions.ts`
- `phase1-jobs-parity-report.md`

## 4. 是否修改公共组件

是，但为最小条件改动。

1. `components/forms/PostForm.tsx`
   - 原因：招聘发布/编辑必须隐藏旧站没有的草稿恢复提示。
   - 影响范围：只有传入 `legacyParity` 的表单生效；当前只在招聘发布/编辑页使用。
   - 最小改动：新增 `legacyParity` prop，不改变默认行为。

2. `components/forms/ContactFields.tsx`
   - 原因：招聘旧站没有 email 和首选联系方式字段。
   - 影响范围：只有 `hideExtendedFields` 为 true 时隐藏扩展字段；当前只由招聘表单传入。
   - 最小改动：新增可选 prop，不改变默认行为。

3. `features/posts/*`
   - 原因：新站统一 posts 架构需要给招聘专属页面暴露 job mode、薪资、公司、地区等字段，并增加 job 专属筛选。
   - 影响范围：新增字段均为 optional；非 job 类型不读取。权限变更使用 `post_type === "job"` 或 `values.postType === "job"` 条件限制。
   - 最小改动：保留 `getPublicPosts` 给其它模块使用，新增 `getPublicJobPosts` 给招聘使用。

## 5. 是否影响其它模块

预期不影响。

- 未修改房屋页面、二手页面、本地服务页面、后台页面。
- 通用表单和 posts 层只增加 job 条件分支或 optional 字段。
- `npm run build` 通过，说明其它路由仍可编译。

## 6. 验证结果

已通过：

- `npm.cmd run typecheck`：通过。
- `npm.cmd run build`：通过。
- build 路由表确认存在：
  - `/jobs`
  - `/jobs/[id]`
  - `/jobs/edit/[id]`
  - `/jobs/publish`
  - `/profile/jobs`
  - `/profile/my-jobs`
  - `/publish/job`
- 本地 HTTP 验证：
  - `GET /jobs`：200 OK。
  - 未登录 `GET /jobs/publish`：307 到 `/auth-required?returnTo=%2Fjobs%2Fpublish`。
  - 未登录 `GET /publish/job`：307 到 `/auth-required?returnTo=%2Fpublish%2Fjob`。
  - 未登录 `GET /profile/jobs`：307 到 `/auth-required?returnTo=%2Fprofile%2Fjobs`。
  - 未登录 `GET /profile/my-jobs`：307 到 `/auth-required?returnTo=%2Fprofile%2Fmy-jobs`。

未完成真实账号验证：

- Active 用户：未提供测试账号，未实际发布/编辑/隐藏/恢复/删除。
- Restricted 用户：未提供测试账号，未实际验证提示语。
- Banned 用户：未提供测试账号，未实际验证编辑/删除边界。
- Admin 用户：Phase 1 不修改后台，未验证管理员后台路径。

## 7. 招聘模块当前预计一致度

预计一致度：82%。

依据：

- 列表、筛选、Tab、卡片、发布/编辑字段显示、详情布局、我的招聘旧路径和按钮文案已明显接近旧站。
- 剩余差异主要来自登录提示页、真实账号权限验证、联系方式 RLS/API 读取方式、置顶历史数据兼容和真实详情数据截图复核。
