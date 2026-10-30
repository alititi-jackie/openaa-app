# 隔离数据库测试

这里已有基于PGlite的PostgreSQL测试，不再只是预留目录。运行`npm ci`后即可使用开发依赖；不需要生产URL、key或真实用户。

| 命令 | 验证范围 | CI |
| --- | --- | --- |
| `npm run test:permissions` | 账号保护、Auth身份同步、直接写入、受限/封禁、帖子状态、管理记录与子表；管理员下架→作者修改→重新上架 | 已接入 |
| `node tests/integration/analytics-db.mjs` | 统计迁移、聚合、站点隔离、RLS/执行权限、去重、纽约时区与夏令时 | 尚未接入 |

默认加载仓库的`@electric-sql/pglite`。确需指定其它安装位置时，两个脚本也支持`PGLITE_MODULE`指向其入口文件。

## 测试边界

- 使用实际迁移定义与受控的Auth/Storage替身，不调用Supabase云服务，不创建生产账号。
- 权限测试会按依赖顺序重排历史baseline中不变的表定义，以处理前向外键引用。此处理仅服务于测试，不能证明原始初始化链已能直接运行。
- 可以验证数据库规则，但不覆盖真实GoTrue登录、OAuth回调、Storage文件传输、Vercel配置、网页交互或手机布局。
- 真实用户流程需要在授权环境另外验收；构建成功和单元测试通过不能替代它。

更多验证命令见[主README](../../README.md)。
