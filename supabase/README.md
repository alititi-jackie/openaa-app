# Supabase

OpenAA 使用 Supabase Auth、Postgres、RLS与Storage。浏览器公开key和服务端高权限key必须来自同一个、明确选择的环境；不要复用无关项目凭据。

- 日常启动与环境变量：[根目录 README](../README.md)。
- 数据库版本与更新：[迁移说明](migrations/README.md)。目录包含`001`—`033`及后续时间戳迁移，不止最早的三个baseline文件。
- 生成类型：[lib/supabase](../lib/supabase/README.md)。
- 账号/帖子数据库权限回归：`npm run test:permissions`；隔离运行，不访问生产。
- 统计数据库回归：`node tests/integration/analytics-db.mjs`。

已有生产环境只应用审查后的必要增量，不重置、不重放baseline或全部种子。全新初始化仍有历史前向外键依赖需要处理，不能把`supabase/config.toml`或权限测试当作一键建库流程。

`SUPABASE_SERVICE_ROLE_KEY`只在服务端使用；公开读取和用户操作应保留各自的权限边界。`app_private`里的权限函数不是公开业务API。新增或修改RLS/Storage/函数后，应检查实际访问行为与Supabase安全建议，不能仅靠前台隐藏按钮。
