# Phase 3 Secondhand Legacy Parity Report

## 1. 已修复差异清单

- 恢复 `/secondhand` 主入口，不再 404。
- `/secondhand` 列表恢复旧站二手结构：H1 `二手交易`、`出售商品 / 求购信息` Tab、关键词、分类、地区筛选。
- `/secondhand` 列表恢复二手网格卡片，显示图片、出售/求购、置顶、价格/预算、分类、地区。
- `/marketplace` 保留兼容入口，并复用同一套二手旧站列表结构。
- 新增二手专用查询 `getPublicSecondhandPosts`：按出售/求购、关键词、分类、地区过滤，并按置顶优先、时间倒序排序。
- 二手详情页 `/secondhand/[id]` 改为二手专属旧站结构：大图、价格/预算、标题、分类、浏览、日期、商品描述、联系方式、收藏/分享/举报。
- `/marketplace/[id]` 保留兼容详情入口，并复用二手详情结构。
- `/secondhand/publish` 不再跳转到 `/marketplace/publish`，改为直接渲染二手旧站兼容发布表单。
- 新增 `/publish/secondhand` 兼容发布入口。
- `/marketplace/publish` 保留兼容入口，并使用同一套二手旧站兼容发布表单。
- 发布页支持 `type=buying` / `type=selling` 默认模式。
- 二手发布/编辑旧站兼容模式隐藏旧站没有的草稿恢复提示、成色、邮箱、首选联系方式。
- 二手发布成功后返回 `/secondhand`。
- 新增 `/secondhand/edit/[id]` 编辑入口，并保留 `/marketplace/edit/[id]` 兼容入口。
- 我的二手恢复旧站“我的商品”管理视图。
- `/profile/secondhand` 不再跳转，直接显示二手管理页。
- `/profile/marketplace` 保留兼容入口，显示同一套“我的商品”管理页。
- 新增 `/profile/my-secondhand` 与 `/profile/my-marketplace`，并保留各自未登录 returnTo。
- 我的二手操作文案恢复旧站：查看、编辑、隐藏、恢复显示、删除。
- 我的二手确认文案恢复旧站：`确认隐藏此商品？`、`确认删除此商品？`。
- `POST_TYPE_TO_ROUTE.marketplace` 改为 `/secondhand`，让新架构内的二手链接默认走旧站主路径。
- 二手数据映射保留出售/求购模式、价格/预算、分类、成色、地区、置顶信息，编辑页可稳定回填。
- 二手发布/编辑写入 `metadata.marketplace_mode`，支持旧站出售/求购 Tab 稳定识别。
- 二手权限逻辑按旧站恢复：active 可发布/编辑/隐藏/恢复/删除；restricted/banned 不能发布、隐藏、恢复，但可编辑/删除自己的二手内容。
- 二手图片删除/上传权限与编辑权限保持一致，避免 banned 用户能进编辑但无法保存图片调整。

## 2. 未修复差异清单

- 未实现旧站详情图片轮播、触摸切换和 lightbox 全量交互；当前详情展示主图，完整图片交互留到图片系统专项或像素级阶段。
- 未做像素级完全一致；当前恢复结构、字段、路径、筛选和主要卡片样式，细节统一留到 Phase 8。
- 未做真实账号矩阵的端到端人工操作；代码路径与未登录路由已验证，active/restricted/banned/admin 仍需人工账号回归。
- 未修改后台二手审核/排序/提示语；后台统一属于 Phase 6。
- 旧站 `/profile/my-items` 未纳入本次用户指定兼容路径，未新增。

## 3. 修改文件清单

- `app/secondhand/page.tsx`
- `app/secondhand/[id]/page.tsx`
- `app/secondhand/publish/page.tsx`
- `app/secondhand/edit/[id]/page.tsx`
- `app/publish/secondhand/page.tsx`
- `app/marketplace/page.tsx`
- `app/marketplace/[id]/page.tsx`
- `app/marketplace/publish/page.tsx`
- `app/marketplace/edit/[id]/page.tsx`
- `app/profile/secondhand/page.tsx`
- `app/profile/marketplace/page.tsx`
- `app/profile/my-secondhand/page.tsx`
- `app/profile/my-marketplace/page.tsx`
- `components/secondhand/SecondhandCard.tsx`
- `components/secondhand/SecondhandLegacyPage.tsx`
- `components/secondhand/SecondhandDetailLegacyView.tsx`
- `components/secondhand/SecondhandContactRevealCard.tsx`
- `components/secondhand/UserSecondhandList.tsx`
- `components/secondhand/UserSecondhandManagementActions.tsx`
- `features/secondhand/legacy.ts`
- `components/forms/PostForm.tsx`
- `components/forms/ContactFields.tsx`
- `features/posts/actions.ts`
- `features/posts/constants.ts`
- `features/posts/formMappers.ts`
- `features/posts/mappers.ts`
- `features/posts/queries.ts`
- `features/posts/types.ts`
- `phase3-secondhand-parity-report.md`

## 4. 是否修改公共组件

是。

- `PostForm`：新增 `legacyParity` 可选开关，仅二手旧站兼容页面传入时生效；默认行为不变。
- `ContactFields`：新增 `hideExtendedFields` 可选开关，仅二手旧站兼容表单传入时隐藏邮箱和首选联系方式；默认行为不变。
- `features/posts/*`：新增二手字段映射、二手专用查询、二手权限和 revalidate 分支。
- `POST_TYPE_TO_ROUTE.marketplace` 改为 `/secondhand`，原因是旧站规格要求二手主路径为 `/secondhand`，影响范围仅 marketplace/二手类型链接。

## 5. 是否影响其它模块

预期不影响其它模块。

- 没有修改招聘、房屋、本地服务、后台页面文件。
- 公共表单开关默认关闭，非二手页面不触发旧站兼容行为。
- 权限放宽、metadata 写入、revalidate 都限定在 `postType === "marketplace"` 或 `post.post_type === "marketplace"`。
- 二手类型内部链接从 `/marketplace` 改为旧站主路径 `/secondhand`，属于本 Phase 目标范围。

## 6. 验证结果

- `npm.cmd run typecheck`：通过。
- `npm.cmd run build`：通过。
- `/secondhand`：通过，页面包含 `出售商品`、`求购信息`、`全部地区`、`纽约华人二手交易频道使用说明`。
- `/marketplace`：通过，兼容入口显示同一套二手旧站结构。
- `/secondhand/[id]`：用 `/secondhand/nonexistent-id` 验证通过，返回 200 并显示不存在状态。
- `/secondhand/publish`：未登录访问 307 到 `/auth-required?returnTo=%2Fsecondhand%2Fpublish`。
- `/publish/secondhand`：未登录访问 307 到 `/auth-required?returnTo=%2Fpublish%2Fsecondhand`。
- `/marketplace/publish`：未登录访问 307 到 `/auth-required?returnTo=%2Fmarketplace%2Fpublish`。
- `/profile/secondhand`：未登录访问 307 到 `/auth-required?returnTo=%2Fprofile%2Fsecondhand`。
- `/profile/marketplace`：未登录访问 307 到 `/auth-required?returnTo=%2Fprofile%2Fmarketplace`。
- `/profile/my-secondhand`：未登录访问 307 到 `/auth-required?returnTo=%2Fprofile%2Fmy-secondhand`。
- `/profile/my-marketplace`：未登录访问 307 到 `/auth-required?returnTo=%2Fprofile%2Fmy-marketplace`。
- `/secondhand/edit/[id]`：未登录访问 307 到 `/auth-required?returnTo=%2Fsecondhand%2Fedit%2Fnonexistent-id`。
- active 用户发布/编辑/删除/隐藏/恢复：代码路径已覆盖，需真实账号人工回归。
- restricted 用户限制：发布、隐藏、恢复被限制；编辑/删除自己的二手内容按旧站兼容放行。需真实账号人工确认。
- banned 用户限制：发布、隐藏、恢复被限制；编辑/删除自己的二手内容按旧站兼容放行。需真实账号人工确认。
- admin 用户：本阶段未改后台，需 Phase 6 回归。

## 7. 二手模块当前预计一致度

约 90%。

路径、列表筛选、网格卡片、发布/编辑字段、详情主结构、我的二手路径和权限逻辑已恢复到旧站主流程。剩余差距主要集中在详情图片轮播/lightbox、像素级样式、真实账号矩阵人工验证，以及后台二手管理统一。
