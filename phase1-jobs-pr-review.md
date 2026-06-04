# Phase 1 Jobs PR Review

PR: https://github.com/alititi-jackie/openaa-app/pull/83
Branch: `phase-1-jobs-legacy-parity`
Commit reviewed: `2eab0cc`
Review date: 2026-06-04

## 自检结果

| 检查项 | 结果 | 说明 |
| --- | --- | --- |
| PR diff 是否只包含招聘相关文件 | 通过 | Diff 包含 `app/jobs/*`、`app/profile/jobs`、`app/profile/my-jobs`、`app/publish/job`、`components/jobs/*`、`features/jobs/*`、招聘所需 posts/form 条件分支和报告文件。 |
| 是否误改房屋、二手、本地服务、后台无关页面 | 通过 | 未发现 `app/housing`、`app/marketplace`、`app/secondhand`、`app/services`、`app/admin` 页面改动。 |
| 是否误改公共组件并影响其它模块 | 通过，需人工关注 | `PostForm` 新增 `legacyParity`，默认 `false`；`ContactFields` 新增 `hideExtendedFields`，默认 `false`。现有非招聘调用不传入这些参数，默认行为不变。 |
| `/jobs` 列表页是否正常 | 通过 | 本地生产服务 HTTP 验证 200；页面输出包含 `招聘岗位`、`求职人才`、`工作类型`、`职位分类`、`全部地区`。 |
| `/jobs/[id]` 详情页是否正常 | 部分通过 | 路由 build 注册成功；无真实公开招聘 id，`/jobs/nonexistent-id` 返回 200 并显示空状态。真实详情数据需人工复核。 |
| `/jobs/publish` 是否正常 | 通过 | 未登录访问 307 到 `/auth-required?returnTo=%2Fjobs%2Fpublish`；build 路由注册成功。 |
| `/publish/job` 是否正常 | 通过 | 未登录访问 307 到 `/auth-required?returnTo=%2Fpublish%2Fjob`；build 路由注册成功。 |
| `/profile/jobs` 是否正常 | 通过 | 未登录访问 307 到 `/auth-required?returnTo=%2Fprofile%2Fjobs`；build 路由注册成功。 |
| `/profile/my-jobs` 是否正常 | 通过 | 未登录访问 307 到 `/auth-required?returnTo=%2Fprofile%2Fmy-jobs`；旧路径已恢复。 |
| 未登录用户访问逻辑是否正常 | 通过 | 列表公开可访问；发布页和我的招聘按新站 auth-required 保护，returnTo 正确。 |
| Active 用户发布/编辑/删除/隐藏/恢复是否正常 | 代码审查通过，需人工账号测试 | action 仍允许 active 用户 create/update/hide/publish/delete；未提供 active 测试账号，未做真实提交。 |
| Restricted 用户限制逻辑是否正常 | 代码审查通过，需人工账号测试 | create/hide/publish 仍受 restricted 限制；edit/delete 沿用原逻辑。未提供 restricted 测试账号。 |
| Banned 用户限制逻辑是否正常 | 代码审查通过，需人工账号测试 | job 专属放开编辑/删除本人招聘，仍禁止发布、隐藏、恢复；非 job 仍保留原 banned 限制。未提供 banned 测试账号。 |
| Admin 用户是否正常 | 未改后台，需人工回归 | Phase 1 未修改后台页面；PR 不应影响 admin。仍建议管理员人工打开后台招聘相关内容抽查。 |
| `npm run typecheck` 是否通过 | 通过 | 使用 Windows 可执行命令 `npm.cmd run typecheck`，通过。 |
| `npm run build` 是否通过 | 通过 | 使用 `npm.cmd run build`，通过；路由表包含 `/jobs`、`/jobs/[id]`、`/jobs/edit/[id]`、`/jobs/publish`、`/profile/jobs`、`/profile/my-jobs`、`/publish/job`。 |
| PR mergeable | 通过 | GitHub PR #83 当前 `mergeable: true`。 |

## 公共组件影响复核

1. `components/forms/PostForm.tsx`
   - 改动：新增 `legacyParity?: boolean`。
   - 默认值：`false`。
   - 影响控制：只有招聘发布/编辑传入 `legacyParity`，用于隐藏草稿恢复提示。
   - 结论：非招聘模块默认行为不变。

2. `components/forms/ContactFields.tsx`
   - 改动：新增 `hideExtendedFields?: boolean`。
   - 默认值：`false`。
   - 影响控制：只有 `legacyParity && postType === "job"` 时隐藏 email 和首选联系方式。
   - 结论：房屋、二手、服务仍显示原字段。

3. `features/posts/*`
   - 改动：新增 job optional 字段、`getPublicJobPosts`、job metadata、job 专属权限边界。
   - 影响控制：非招聘页面继续使用 `getPublicPosts`；banned 编辑/删除放开只在 `post_type === "job"` 条件下生效。
   - 注意：`mainPostPayload` 对非 job create 会写入空 `metadata`，与数据库默认 `{}` 等价，未发现功能风险。

## 是否建议合并

建议合并。

理由：

- Diff 范围符合 Phase 1 招聘模块要求。
- 没有直接修改房屋、二手、本地服务、后台页面。
- 公共组件改动为 opt-in，默认行为不变。
- `typecheck` 和 `build` 均通过。
- PR #83 当前可合并。

不建议把“真实账号权限验证”视为已完成。合并前或合并后应使用测试账号补测 active/restricted/banned/admin。

## 合并后需要重点人工测试的页面

1. `/jobs`
   - 招聘/求职 Tab。
   - 工作类型、职位分类、地区、关键词筛选。
   - 有数据时卡片字段、薪资、公司、置顶、发布时间。

2. `/jobs/[id]`
   - 真实招聘详情。
   - 联系方式按钮。
   - 电话拨打、微信复制。
   - 无联系方式状态。

3. `/jobs/publish`
   - `?type=hiring` 与 `?type=seeking`。
   - 字段顺序。
   - 是否隐藏 email、首选联系方式、草稿恢复。
   - 发布成功跳转。

4. `/publish/job`
   - 兼容入口。
   - 未登录 returnTo。
   - 登录后表单一致性。

5. `/jobs/edit/[id]`
   - 招聘字段回填。
   - 求职类型回填。
   - 薪资单位保存。
   - 编辑成功跳转。

6. `/profile/jobs`
   - 我的招聘列表。
   - 查看、编辑、隐藏、恢复显示、删除。

7. `/profile/my-jobs`
   - 旧路径可访问。
   - 未登录 returnTo 保持 `/profile/my-jobs`。
   - 登录后与 `/profile/jobs` 行为一致。

8. 权限账号矩阵
   - Active：发布、编辑、隐藏、恢复、删除。
   - Restricted：禁止发布、隐藏、恢复；确认编辑/删除。
   - Banned：禁止发布、隐藏、恢复；确认招聘编辑/删除本人内容。
   - Admin：后台查看招聘内容不受影响。

## 是否可以进入 Phase 2 房屋模块

可以进入 Phase 2 房屋模块。

前提：

- PR #83 合并后先完成一轮人工 smoke test。
- 不把 Phase 1 的招聘专属组件复用到房屋。
- Phase 2 继续保持只改房屋模块，公共组件如必须修改，需要同样使用 opt-in 方式。
