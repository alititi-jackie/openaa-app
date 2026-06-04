# Phase 2 Housing PR Review

## 自检结果

### 1. PR diff 范围

- 通过。
- PR #84 共 22 个文件，范围为：
  - 房屋页面：`app/housing/*`
  - 房屋个人中心：`app/profile/housing/page.tsx`、`app/profile/my-housing/page.tsx`
  - 房屋兼容发布入口：`app/publish/housing/page.tsx`
  - 房屋专属组件：`components/housing/*`
  - 房屋专属 helper：`features/housing/legacy.ts`
  - 必要公共表单/帖子层：`components/forms/*`、`features/posts/*`
  - 报告文件：`phase2-housing-parity-report.md`

### 2. 是否误改其它模块

- 未发现误改招聘、二手、本地服务页面。
- 未发现误改后台无关页面。
- `git diff --name-only origin/main...HEAD` 未包含 `app/jobs`、`app/marketplace`、`app/secondhand`、`app/services`、`app/admin`。

### 3. 公共组件是否 opt-in

- 通过。
- `PostForm.legacyParity` 默认值为 `false`，只有房屋发布/编辑页面传入后才启用旧站兼容行为。
- `ContactFields.hideExtendedFields` 默认值为 `false`，只有房屋旧站表单传入后才隐藏邮箱和首选联系方式。
- `features/posts/actions.ts` 中 metadata、`/profile/my-housing` revalidate、banned 编辑/删除放行都限定在 `postType === "housing"` 或 `post.post_type === "housing"`。
- `features/posts/queries.ts` 新增 `getPublicHousingPosts`，没有改动通用 `getPublicPosts` 的默认查询语义。

### 4. 页面与路由验证

- `/housing`：通过。页面包含 `房源信息`、`求租求购`、`全部地区`、`纽约租房与华人房屋信息指南`。
- `/housing/[id]`：通过。`/housing/nonexistent-id` 返回 200 并渲染不存在状态，详情路由可正常进入房屋专属视图。
- `/housing/publish`：通过。未登录访问 307 到 `/auth-required?returnTo=%2Fhousing%2Fpublish`。
- `/publish/housing`：通过。未登录访问 307 到 `/auth-required?returnTo=%2Fpublish%2Fhousing`。
- `/profile/housing`：通过。未登录访问 307 到 `/auth-required?returnTo=%2Fprofile%2Fhousing`。
- `/profile/my-housing`：通过。未登录访问 307 到 `/auth-required?returnTo=%2Fprofile%2Fmy-housing`。
- `/housing/edit/[id]`：通过。未登录访问 307 到 `/auth-required?returnTo=%2Fhousing%2Fedit%2Fnonexistent-id`。

### 5. 权限逻辑审查

- 未登录用户：通过。发布页、我的房屋、编辑页均跳转 `auth-required` 并保留 returnTo。
- active 用户：代码路径通过。可发布、编辑、删除、隐藏、恢复；需要用真实 active 账号做人工回归。
- restricted 用户：代码路径通过。`createPost` 阻止发布；隐藏/恢复要求 active；删除仍走自有内容管理路径。需要真实 restricted 账号人工确认提示语。
- banned 用户：代码路径通过。发布被阻止；隐藏/恢复被阻止；房屋自己的编辑/删除按本阶段旧站兼容要求放行。需要真实 banned 账号人工确认。
- admin 用户：本阶段未改后台；房屋前台详情/列表不依赖 admin 权限。后台统一留到 Phase 6。

### 6. 构建检查

- `npm.cmd run typecheck`：通过。
- `npm.cmd run build`：通过。

## 是否建议合并

建议合并 PR #84。

未发现阻断问题。当前剩余风险主要是需要真实账号状态做交互回归，不属于代码合并阻断项。

## 合并后需要重点人工测试的页面

- `/housing`
- `/housing?type=seeking`
- `/housing?type=renting&q=法拉盛&region=法拉盛%20Flushing`
- `/housing/[id]`
- `/housing/publish`
- `/publish/housing`
- `/housing/edit/[id]`
- `/profile/housing`
- `/profile/my-housing`

重点账号矩阵：

- active：发布、编辑、隐藏、恢复显示、删除。
- restricted：确认不能发布、不能隐藏/恢复，提示语正确。
- banned：确认不能发布、不能隐藏/恢复，但可编辑/删除自己的房屋内容。
- 未登录：确认所有受保护入口 returnTo 正确。

## 是否可以进入 Phase 3 二手模块

可以。

建议合并 PR #84 后再进入 Phase 3 二手模块，保持每个 phase 一个独立 PR，避免房屋与二手 diff 混在一起。
