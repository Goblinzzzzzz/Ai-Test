# Railway 部署指南

本文档提供将 AI 测评应用部署到 Railway 平台的完整步骤说明。

## 目录

- [前置要求](#前置要求)
- [Railway 项目创建](#railway-项目创建)
- [数据库服务配置](#数据库服务配置)
- [应用服务配置](#应用服务配置)
- [环境变量设置](#环境变量设置)
- [数据库迁移](#数据库迁移)
- [部署验证](#部署验证)
- [故障排查](#故障排查)
- [维护和监控](#维护和监控)

---

## 前置要求

在开始部署之前，请确保：

1. **Railway 账户**: 在 [railway.app](https://railway.app) 注册账户
2. **GitHub 仓库**: 代码已推送到 GitHub 仓库
3. **本地环境**: Node.js 18+ 已安装
4. **Railway CLI** (可选): 用于本地调试
   ```bash
   npm install -g @railway/cli
   railway login
   ```

---

## Railway 项目创建

### 步骤 1: 创建新项目

1. 登录 [Railway Dashboard](https://railway.app/dashboard)
2. 点击 **"New Project"**
3. 选择 **"Deploy from GitHub repo"**
4. 授权 Railway 访问你的 GitHub 账户
5. 选择包含 AI 测评应用的仓库
6. Railway 会自动检测到项目并开始初始化

### 步骤 2: 项目结构确认

Railway 会识别项目根目录下的配置文件：
- `railway.json` - 部署配置
- `package.json` - 依赖和脚本
- `ai-assessment-app/` - 应用代码目录

---

## 数据库服务配置

### 步骤 1: 添加 PostgreSQL 数据库

1. 在 Railway 项目页面，点击 **"+ New"**
2. 选择 **"Database"**
3. 选择 **"Add PostgreSQL"**
4. Railway 会自动创建并启动 PostgreSQL 实例

### 步骤 2: 获取数据库连接信息

1. 点击 PostgreSQL 服务卡片
2. 切换到 **"Variables"** 标签
3. 找到以下变量（Railway 自动生成）：
   - `DATABASE_URL` - 完整的连接字符串
   - `PGHOST` - 数据库主机
   - `PGPORT` - 数据库端口
   - `PGUSER` - 数据库用户名
   - `PGPASSWORD` - 数据库密码
   - `PGDATABASE` - 数据库名称

### 步骤 3: 连接数据库（可选验证）

使用 Railway CLI 连接到数据库：

```bash
railway link  # 链接到你的项目
railway connect postgres
```

或使用 `psql` 客户端：

```bash
psql $DATABASE_URL
```

---

## 应用服务配置

### 步骤 1: 配置构建设置

1. 点击应用服务卡片
2. 切换到 **"Settings"** 标签
3. 确认以下设置：

**Root Directory**: 
```
ai-assessment-app
```

**Build Command** (应自动检测):
```bash
npm run build
```

**Start Command** (应自动检测):
```bash
npm start
```

### 步骤 2: 配置部署触发器

在 **"Settings"** → **"Deploys"** 中：
- **Branch**: 选择 `main` 或 `master`
- **Auto Deploy**: 启用（推荐）
- **Deploy on Push**: 启用

---

## 环境变量设置

### 步骤 1: 配置后端环境变量

在应用服务的 **"Variables"** 标签中添加：

#### 必需变量

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | 引用 PostgreSQL 服务的连接字符串 |
| `NODE_ENV` | `production` | 生产环境模式 |
| `PORT` | `3000` | 服务器端口（Railway 会自动映射） |

#### 可选变量

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `VITE_API_URL` | 留空 | 前端 API URL（留空使用相对路径） |
| `VITE_DEFAULT_COHORT` | `default` | 默认群组标识符 |

### 步骤 2: 引用数据库变量

Railway 使用特殊语法引用其他服务的变量：

```
${{Postgres.DATABASE_URL}}
```

这会自动解析为 PostgreSQL 服务的 `DATABASE_URL` 值。

### 步骤 3: 验证变量

点击 **"Variables"** 标签，确认所有变量都已正确设置并显示绿色勾号。

---

## 数据库迁移

### 方法 1: 使用 Railway CLI（推荐）

1. **连接到项目**:
   ```bash
   railway link
   ```

2. **连接到数据库**:
   ```bash
   railway connect postgres
   ```

3. **执行迁移脚本**:
   ```sql
   \i ai-assessment-app/server/migrations/init.sql
   ```

4. **验证表创建**:
   ```sql
   \dt
   \d ai_assessments
   \dv
   ```

### 方法 2: 使用 psql 客户端

1. **获取 DATABASE_URL**:
   从 Railway Dashboard 复制 PostgreSQL 的 `DATABASE_URL`

2. **执行迁移**:
   ```bash
   psql "postgresql://user:password@host:port/database" \
     -f ai-assessment-app/server/migrations/init.sql
   ```

### 方法 3: 使用 Railway Web Console

1. 在 PostgreSQL 服务卡片中，点击 **"Data"** 标签
2. 点击 **"Query"** 按钮
3. 复制 `server/migrations/init.sql` 的内容
4. 粘贴到查询编辑器并执行

### 验证迁移成功

执行以下查询确认：

```sql
-- 检查表是否存在
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- 检查表结构
\d ai_assessments

-- 检查视图
SELECT * FROM ai_assessment_public_stats;

-- 检查索引
\di
```

预期输出：
- `ai_assessments` 表存在
- `ai_assessment_public_stats` 视图存在
- 两个索引：`idx_ai_assessments_cohort` 和 `idx_ai_assessments_created_at`

---

## 部署验证

### 步骤 1: 触发部署

1. 推送代码到 GitHub（如果启用了自动部署）
2. 或在 Railway Dashboard 点击 **"Deploy"** 按钮

### 步骤 2: 监控构建日志

1. 点击应用服务卡片
2. 切换到 **"Deployments"** 标签
3. 点击最新的部署查看日志

**预期日志输出**:
```
Building...
✓ Installing dependencies
✓ Building backend (npm run build:backend)
✓ Building frontend (npm run build:frontend)
✓ Build completed

Starting...
✓ Server listening on port 3000
✓ Database connected successfully
```

### 步骤 3: 获取应用 URL

1. 在应用服务卡片中，点击 **"Settings"**
2. 切换到 **"Networking"** 标签
3. 点击 **"Generate Domain"** 生成公共 URL
4. 复制生成的 URL（格式：`https://your-app.up.railway.app`）

### 步骤 4: 测试应用

1. **访问前端**:
   ```
   https://your-app.up.railway.app
   ```

2. **测试 API 端点**:
   ```bash
   # 健康检查
   curl https://your-app.up.railway.app/api/assessments/stats/default

   # 提交测评
   curl -X POST https://your-app.up.railway.app/api/assessments \
     -H "Content-Type: application/json" \
     -d '{
       "name": "测试用户",
       "cohort": "default",
       "total": 25,
       "title": "AI 效能先锋",
       "d1": 5, "d2": 5, "d3": 5, "d4": 5, "d5": 5,
       "answers": {"q1": "a", "q2": "b"}
     }'
   ```

3. **验证数据持久化**:
   ```bash
   # 查询统计
   curl https://your-app.up.railway.app/api/assessments/stats/default
   
   # 查询最近测评
   curl https://your-app.up.railway.app/api/assessments/recent/default
   ```

---

## 故障排查

### 问题 1: 构建失败

**症状**: 部署日志显示构建错误

**可能原因**:
- Node.js 版本不兼容
- 依赖安装失败
- TypeScript 编译错误

**解决方案**:

1. **检查 Node.js 版本**:
   ```json
   // package.json
   "engines": {
     "node": ">=18.0.0"
   }
   ```

2. **本地测试构建**:
   ```bash
   cd ai-assessment-app
   npm install
   npm run build
   ```

3. **查看详细错误日志**:
   在 Railway Dashboard 的 Deployments 标签中查看完整日志

### 问题 2: 数据库连接失败

**症状**: 应用启动后显示 "Database connection failed" 或 503 错误

**可能原因**:
- `DATABASE_URL` 未正确设置
- PostgreSQL 服务未启动
- 网络连接问题

**解决方案**:

1. **验证环境变量**:
   ```bash
   railway variables
   ```
   确认 `DATABASE_URL` 存在且格式正确

2. **检查 PostgreSQL 服务状态**:
   在 Railway Dashboard 中确认 PostgreSQL 服务显示为 "Active"

3. **测试数据库连接**:
   ```bash
   railway connect postgres
   \conninfo
   ```

4. **检查应用日志**:
   ```bash
   railway logs
   ```
   查找数据库连接相关的错误信息

### 问题 3: 静态文件 404

**症状**: 访问应用 URL 返回 404 或显示空白页面

**可能原因**:
- 前端构建失败
- `dist` 目录未生成
- Express 静态文件路径配置错误

**解决方案**:

1. **验证构建输出**:
   检查部署日志确认 `npm run build:frontend` 成功执行

2. **检查 dist 目录**:
   ```bash
   railway run ls -la dist
   ```

3. **验证 Express 配置**:
   ```typescript
   // server/src/index.ts
   app.use(express.static(path.join(__dirname, '../../dist')));
   ```

### 问题 4: API 请求 CORS 错误

**症状**: 浏览器控制台显示 CORS 错误

**可能原因**:
- CORS 中间件未正确配置
- 前端使用了错误的 API URL

**解决方案**:

1. **检查 CORS 配置**:
   ```typescript
   // server/src/index.ts
   app.use(cors({
     origin: process.env.NODE_ENV === 'production' 
       ? true  // 允许所有来源
       : 'http://localhost:5173',
     credentials: true
   }));
   ```

2. **验证前端 API URL**:
   前端应使用相对路径（`/api/...`）而非绝对路径

### 问题 5: 迁移脚本执行失败

**症状**: 数据库表未创建或查询失败

**可能原因**:
- 迁移脚本未执行
- SQL 语法错误
- 权限不足

**解决方案**:

1. **手动执行迁移**:
   ```bash
   railway connect postgres
   \i server/migrations/init.sql
   ```

2. **检查表是否存在**:
   ```sql
   \dt
   SELECT * FROM ai_assessments LIMIT 1;
   ```

3. **重新创建表**（如果需要）:
   ```sql
   DROP TABLE IF EXISTS ai_assessments CASCADE;
   \i server/migrations/init.sql
   ```

### 问题 6: 应用崩溃或重启循环

**症状**: 应用不断重启，无法保持运行状态

**可能原因**:
- 未捕获的异常
- 端口冲突
- 内存不足

**解决方案**:

1. **查看崩溃日志**:
   ```bash
   railway logs --tail 100
   ```

2. **检查错误处理**:
   确保所有异步操作都有错误处理

3. **增加资源限制**:
   在 Railway Dashboard 的 Settings → Resources 中调整内存限制

4. **添加健康检查**:
   ```typescript
   app.get('/health', (req, res) => {
     res.json({ status: 'ok', timestamp: new Date().toISOString() });
   });
   ```

### 问题 7: 环境变量未生效

**症状**: 应用使用默认值而非配置的环境变量

**可能原因**:
- 变量名拼写错误
- 变量未保存
- 需要重新部署

**解决方案**:

1. **验证变量名**:
   确保变量名与代码中使用的完全一致（区分大小写）

2. **重新部署**:
   修改环境变量后，点击 **"Redeploy"** 使其生效

3. **检查变量值**:
   ```bash
   railway variables
   ```

---

## 维护和监控

### 日志查看

**使用 Railway Dashboard**:
1. 点击应用服务卡片
2. 切换到 **"Logs"** 标签
3. 实时查看应用日志

**使用 Railway CLI**:
```bash
# 实时日志
railway logs

# 最近 100 条日志
railway logs --tail 100

# 过滤错误日志
railway logs | grep ERROR
```

### 性能监控

Railway 提供基本的监控指标：

1. **CPU 使用率**: Settings → Metrics
2. **内存使用**: Settings → Metrics
3. **网络流量**: Settings → Metrics
4. **请求数量**: 通过日志分析

### 数据库备份

**自动备份**:
Railway PostgreSQL 自动进行每日备份

**手动备份**:
```bash
# 导出数据库
railway connect postgres
pg_dump > backup_$(date +%Y%m%d).sql

# 或使用 Railway CLI
railway run pg_dump > backup.sql
```

**恢复备份**:
```bash
psql $DATABASE_URL < backup.sql
```

### 扩展和升级

**垂直扩展**:
1. 在 Settings → Resources 中调整资源配置
2. 增加 CPU 和内存限制

**水平扩展**:
Railway 支持多实例部署（需要付费计划）

### 更新部署

**自动更新**:
- 推送代码到 GitHub 主分支
- Railway 自动检测并部署

**手动更新**:
1. 在 Deployments 标签点击 **"Redeploy"**
2. 或使用 CLI: `railway up`

### 回滚部署

1. 切换到 **"Deployments"** 标签
2. 找到之前的成功部署
3. 点击 **"Redeploy"** 回滚到该版本

---

## 安全最佳实践

1. **环境变量**: 永远不要在代码中硬编码敏感信息
2. **数据库访问**: 仅通过后端 API 访问数据库
3. **HTTPS**: Railway 自动提供 HTTPS，确保所有请求使用加密连接
4. **限流**: 已实现 API 限流（每 IP 每分钟 10 次请求）
5. **输入验证**: 所有用户输入都经过验证和清理
6. **日志**: 生产环境日志不包含敏感信息

---

## 成本估算

Railway 采用按使用量计费：

- **免费额度**: $5/月（约 500 小时运行时间）
- **PostgreSQL**: 包含在免费额度内
- **带宽**: 100GB/月免费
- **构建时间**: 包含在免费额度内

**预估成本**（小型应用）:
- 应用服务: $0-5/月
- PostgreSQL: $0-5/月
- 总计: $0-10/月

---

## 支持和资源

- **Railway 文档**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **项目仓库**: [你的 GitHub 仓库 URL]
- **问题反馈**: [你的 GitHub Issues URL]

---

## 附录

### A. 完整的环境变量清单

```bash
# 后端环境变量
DATABASE_URL=${{Postgres.DATABASE_URL}}
NODE_ENV=production
PORT=3000

# 前端环境变量（构建时）
VITE_API_URL=
VITE_DEFAULT_COHORT=default
```

### B. 常用命令速查

```bash
# Railway CLI
railway login                    # 登录
railway link                     # 链接项目
railway up                       # 部署
railway logs                     # 查看日志
railway variables                # 查看环境变量
railway connect postgres         # 连接数据库
railway run <command>            # 在 Railway 环境中运行命令

# 本地开发
npm run dev                      # 启动开发服务器
npm run build                    # 构建生产版本
npm start                        # 启动生产服务器

# 数据库操作
psql $DATABASE_URL               # 连接数据库
\dt                              # 列出所有表
\d ai_assessments                # 查看表结构
\dv                              # 列出所有视图
```

### C. 迁移检查清单

- [ ] Railway 项目已创建
- [ ] PostgreSQL 服务已添加
- [ ] 环境变量已配置
- [ ] 数据库迁移脚本已执行
- [ ] 应用成功部署
- [ ] 公共域名已生成
- [ ] 前端页面可访问
- [ ] API 端点正常响应
- [ ] 数据可以成功提交和查询
- [ ] 日志显示无错误
- [ ] 性能监控正常

---

**文档版本**: 1.0  
**最后更新**: 2025-01-06  
**维护者**: AI Assessment Team
