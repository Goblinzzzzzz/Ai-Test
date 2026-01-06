# Railway 部署故障排查

## 当前问题

部署卡在 "scheduling build" 阶段，没有实际开始构建。

## 解决方案

### 方案 1: 在 Railway 中设置 Root Directory（推荐）

1. 进入 Railway Dashboard
2. 点击你的应用服务
3. 进入 **Settings** 标签
4. 找到 **Root Directory** 设置
5. 输入: `ai-assessment-app`
6. 点击 **Save**
7. 返回 **Deployments** 标签
8. 点击 **Redeploy**

### 方案 2: 手动配置构建设置

在 **Settings** → **Deploy** 中设置：

**Root Directory**:
```
ai-assessment-app
```

**Build Command** (可选，留空让 Railway 自动检测):
```
npm install && npm run build
```

**Start Command** (可选，留空让 Railway 自动检测):
```
npm start
```

### 方案 3: 重新创建项目

如果上述方法都不行，尝试：

1. 删除当前的 Railway 项目
2. 创建新项目
3. 选择 "Deploy from GitHub repo"
4. 选择仓库后，**立即**在设置中添加 Root Directory: `ai-assessment-app`
5. 添加 PostgreSQL 数据库
6. 配置环境变量

### 方案 4: 检查 Railway 账户状态

有时候 Railway 的免费额度或账户状态会导致构建卡住：

1. 检查 Railway 账户是否有足够的免费额度
2. 检查是否需要验证邮箱或添加支付方式
3. 查看 Railway 状态页面: https://status.railway.app

## 环境变量配置

确保在 **Variables** 标签中设置了：

```
DATABASE_URL = ${{Postgres.DATABASE_URL}}
NODE_ENV = production
PORT = 3000
```

## 预期的成功日志

成功部署后，你应该看到类似这样的日志：

```
[info] Nixpacks build starting
[info] Installing Node.js 18.x
[info] Installing dependencies
[info] Building backend
[info] Building frontend
[info] Build completed successfully
[info] Starting application
[info] Server listening on port 3000
```

## 如果还是失败

请提供以下信息：

1. Railway Dashboard 中的完整构建日志
2. Settings → General 中的配置截图
3. 是否有任何错误提示或警告

## 联系支持

如果问题持续存在，可以：
- 联系 Railway 支持: https://railway.app/help
- 加入 Railway Discord: https://discord.gg/railway
