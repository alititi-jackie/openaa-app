# Phase 2 Housing Legacy Parity Report

## 1. 已修复差异清单

- `/housing` 列表页改为房屋专属旧站结构：恢复 `房源信息 / 求租求购` tab、关键词搜索、地区筛选、发布入口、SEO 信息区块。
- `/housing` 卡片改为旧站文字信息列表：显示出租/求租、置顶、标题、摘要、租金、地区、房型，不在列表卡片显示图片缩略图。
- `/housing` 查询改为房屋专用查询：按出租/求租模式、关键词、地区过滤，并按置顶优先、时间倒序排序。
- `/housing/[id]` 详情页改为房屋专属旧站结构：显示类型、标题、租金/地区摘要、图片、房屋描述、房屋字段、联系方式、返回列表。
- 联系方式显示按旧站房屋字段收敛：详情页只显示联系人、电话、微信；邮箱和首选联系方式不在房屋旧站详情卡中展示。
- `/housing/publish` 发布页启用旧站兼容模式：隐藏旧站没有的入住日期、邮箱、首选联系方式、草稿恢复提示；创建成功后返回 `/housing`。
- 新增 `/publish/housing` 兼容入口，未登录时保留 `/publish/housing` returnTo。
- `/housing/edit/[id]` 编辑页启用旧站兼容模式，并显示“编辑模式下不支持切换类型（出租/求租）。”提示。
- `/profile/housing` 改为房屋专属“我的房屋”管理视图。
- 新增 `/profile/my-housing` 旧站路径，恢复旧站“我的房屋”入口。
- 我的房屋恢复旧站管理动作文案：查看、编辑、隐藏、恢复显示、删除。
- 我的房屋隐藏/删除确认文案恢复为房屋专属：`确认隐藏此房屋信息？`、`确认删除此房屋信息？`。
- 房屋数据映射保留 `housing_mode`、租金、房型、地区、置顶信息，编辑页回填不再依赖显示文案反推。
- 房屋发布/编辑写入 `metadata.housing_mode`，支持旧站出租/求租 tab 稳定识别。
- 房屋 revalidate 新增 `/profile/my-housing`，避免旧路径管理页缓存不同步。
- 房屋权限逻辑按审计要求收敛：banned 用户仍不能发布、隐藏、恢复显示，但允许编辑/删除自己的房屋内容。

## 2. 未修复差异清单

- 未做像素级完全一致：当前已恢复旧站结构和字段顺序，但字体、间距、边框细节仍需 Phase 8 统一。
- 未实现旧站图片弹窗预览交互；详情页已显示图片，弹窗预览留到图片系统专项或像素级阶段。
- 未做真实账号矩阵的端到端操作验证；本次验证覆盖未登录路由与代码权限分支，active/restricted/banned/admin 仍需人工账号测试。
- 未修改后台房屋审核/排序/提示语；后台统一属于 Phase 6。

## 3. 修改文件清单

- `app/housing/page.tsx`
- `app/housing/[id]/page.tsx`
- `app/housing/publish/page.tsx`
- `app/housing/edit/[id]/page.tsx`
- `app/profile/housing/page.tsx`
- `app/profile/my-housing/page.tsx`
- `app/publish/housing/page.tsx`
- `components/housing/HousingCard.tsx`
- `components/housing/HousingLegacyPage.tsx`
- `components/housing/HousingDetailLegacyView.tsx`
- `components/housing/HousingContactRevealCard.tsx`
- `components/housing/UserHousingList.tsx`
- `components/housing/UserHousingManagementActions.tsx`
- `features/housing/legacy.ts`
- `components/forms/PostForm.tsx`
- `components/forms/ContactFields.tsx`
- `features/posts/actions.ts`
- `features/posts/formMappers.ts`
- `features/posts/mappers.ts`
- `features/posts/queries.ts`
- `features/posts/types.ts`
- `phase2-housing-parity-report.md`

## 4. 是否修改公共组件

是。

- `PostForm`：新增 `legacyParity` 可选开关，仅房屋页面传入时生效；默认行为不变。
- `ContactFields`：新增 `hideExtendedFields` 可选开关，仅房屋旧站兼容表单传入时隐藏邮箱和首选联系方式；默认行为不变。
- `features/posts/*`：新增房屋字段映射、房屋专用查询、房屋权限和 revalidate 分支；未修改招聘、二手、本地服务页面。

## 5. 是否影响其它模块

预期不影响其它模块。

- 没有修改招聘、二手、本地服务页面文件。
- 公共表单开关默认关闭，非房屋页面不触发旧站兼容行为。
- 公共 action 中 banned 编辑/删除放宽仅限 `post_type === "housing"`。
- `metadata` 写入和更新仅限房屋。

## 6. 验证结果

- `npm.cmd run typecheck`：通过。
- `npm.cmd run build`：通过。
- `/housing`：通过，页面包含 `房源信息`、`求租求购`、`全部地区`、`纽约租房与华人房屋信息指南`。
- `/housing/[id]`：用 `/housing/nonexistent-id` 验证通过，返回 200 并显示不存在状态。
- `/housing/publish`：未登录访问 307 到 `/auth-required?returnTo=%2Fhousing%2Fpublish`。
- `/publish/housing`：未登录访问 307 到 `/auth-required?returnTo=%2Fpublish%2Fhousing`。
- `/profile/housing`：未登录访问 307 到 `/auth-required?returnTo=%2Fprofile%2Fhousing`。
- `/profile/my-housing`：未登录访问 307 到 `/auth-required?returnTo=%2Fprofile%2Fmy-housing`。
- active 用户发布/编辑/删除/隐藏/恢复：代码路径已覆盖，需人工账号回归。
- restricted 用户限制：发布入口沿用 `createPost` restricted 拦截，需人工账号回归。
- banned 用户限制：发布、隐藏、恢复显示拦截；编辑/删除自己的房屋内容按本阶段修复放行，需人工账号回归。
- admin 用户：本阶段未改后台，需 Phase 6 回归。

## 7. 房屋模块当前预计一致度

约 92%。

主要功能、结构、字段顺序、列表筛选、详情联系方式、发布/编辑旧站字段、我的房屋路径与管理动作已恢复。剩余差距集中在像素级样式、图片弹窗预览、真实账号权限矩阵人工验证，以及后台房屋管理统一。
