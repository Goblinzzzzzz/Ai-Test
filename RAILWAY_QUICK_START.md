# Railway 部署快速指南

## 当前状态

✅ **代码已修复并推送到 GitHub**
- 修复了 `supabase.ts` 中的重复方法错误
- 所有 TypeScript 编译错误已解决
- 提交: `17a4985` - "Fix duplicate then method in supabase.ts"

## 下一步操作

### 1. 等待 Railway 自动部署
Railway 会自动检测到 GitHub 的更新并开始新的部署。

**查看部署日志：**
1. 打开 Railway Dashboard: https://railway.app
2. 选择你的项目
3. 点击 "Deployments" 标签
4. 查看最新的部署日志

### 2. 确认构建成功

**期望看到的日志：**
```
✓ Backend build completed
✓ Frontend build completed  
✓ Build successful
✓ Deployment live
```

**如果构建失败：**
- 复制完整的错误日志
- 告诉我具体的错误信息
- 我会帮你快速修复

### 3. 配置环境变量

部署成功后，需要在 Railway 中设置环境变量：

**必需的环境变量：**
```
DATABASE_URL=你的数据库连接字符串
PORT=3000
NODE_ENV=production
```

**设置步骤：**
1. 在 Railway Dashboard 中选择你的项目
2. 点击 "Variables" 标签
3. 添加上述环境变量
4. 点击 "Deploy" 重新部署

### 4. 执行数据库迁移

环境变量配置完成后，需要运行数据库迁移脚本：

**方法 1: 使用 Railway CLI**
```bash
# 安装 Railway CLI (如果还没安装)
npm install -g @railway/cli

# 登录
railway login

# 连接到项目
railway link

# 运行迁移
railway run npm run migrate
```

**方法 2: 在 Railway Dashboard 中运行**
1. 进入项目的 "Settings" → "Deploy"
2. 在 "Build Command" 中临时添加: `npm run build && npm run migrate`
3. 触发重新部署
4. 部署完成后，将 Build Command 改回 `npm run build`

### 5. 测试应用

部署完成后：
1. 访问 Railway 提供的应用 URL
2. 测试基本功能：
   - 打开测评页面
   - 完成一次测评
   - 查看统计页面
3. 检查浏览器控制台是否有错误

## 常见问题

### Q: 如何查看应用 URL？
A: 在 Railway Dashboard 的项目页面，点击 "Settings" → "Domains"，可以看到自动生成的 URL。

### Q: 如何查看应用日志？
A: 在 Railway Dashboard 中，点击 "Deployments" → 选择最新部署 → 查看 "Logs" 标签。

### Q: 构建时间太长怎么办？
A: 正常情况下，构建需要 3-5 分钟。如果超过 10 分钟，可能有问题，请查看日志。

### Q: 如何回滚到之前的版本？
A: 在 "Deployments" 页面，找到之前成功的部署，点击 "Redeploy"。

## 需要帮助？

如果遇到任何问题：
1. 复制完整的错误日志
2. 告诉我你在哪一步遇到问题
3. 我会立即帮你解决

---

**提示：** 保持 Railway Dashboard 打开，这样可以实时看到部署进度和日志。
