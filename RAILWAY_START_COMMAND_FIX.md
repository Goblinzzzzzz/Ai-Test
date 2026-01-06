# Railway 启动命令修复指南

## 问题诊断

错误信息：`/bin/bash: line 1: cd: ai-assessment-app: No such file or directory`

这说明 Railway 仍在尝试执行 `cd ai-assessment-app`，可能的原因：

1. ✅ 代码已修复（删除了根目录的 railway.json）
2. ❌ Railway Dashboard 中可能有自定义的启动命令覆盖了配置文件
3. ❌ Railway 可能在使用缓存的旧配置

## 🔧 立即修复步骤

### 方案 1: 检查并清除 Railway Dashboard 中的自定义启动命令

1. **打开 Railway Dashboard**
2. **选择你的项目/服务**
3. **进入 Settings 标签**
4. **找到 "Deploy" 部分**
5. **查看 "Start Command" 设置**

**如果看到:**
```
cd ai-assessment-app && npm start
```

**请改为:**
```
npm start
```

**或者直接删除/清空这个字段**，让 Railway 使用 `ai-assessment-app/railway.json` 中的配置。

6. **点击 Save**
7. **返回 Deployments 标签**
8. **点击 "Redeploy" 或等待自动重新部署**

---

### 方案 2: 使用 Railway CLI 清除缓存并重新部署

如果你安装了 Railway CLI：

```bash
# 登录
railway login

# 连接到项目
railway link

# 强制重新部署（清除缓存）
railway up --detach
```

---

### 方案 3: 在 Railway Dashboard 中手动触发重新构建

1. **进入 Deployments 标签**
2. **找到最新的部署**
3. **点击右侧的 "..." 菜单**
4. **选择 "Redeploy"**
5. **确认重新部署**

---

### 方案 4: 临时使用绝对路径（快速测试）

如果上述方法都不行，可以临时修改启动命令来测试：

**在 Railway Dashboard → Settings → Deploy → Start Command 中设置:**
```
cd /app/server && npm start
```

这会直接进入容器中的 `/app/server` 目录（因为 Root Directory 是 `ai-assessment-app`，所以 `/app` 就是 `ai-assessment-app`）。

---

## 📋 检查清单

请按顺序检查以下项目：

- [ ] Railway Dashboard → Settings → Root Directory 是否设置为 `ai-assessment-app`
- [ ] Railway Dashboard → Settings → Deploy → Start Command 是否为空或设置为 `npm start`
- [ ] Railway Dashboard → Settings → Deploy → Build Command 是否为空或设置为 `npm run build`
- [ ] 最新的 GitHub 代码是否已经删除了根目录的 `railway.json`
- [ ] 是否已经触发了新的部署（不是使用旧的缓存）

---

## 🎯 正确的配置应该是

### Railway Dashboard 设置:
```
Root Directory: ai-assessment-app
Build Command: (留空，让 Railway 自动检测)
Start Command: (留空，让 Railway 使用 railway.json)
```

### ai-assessment-app/railway.json:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### ai-assessment-app/package.json:
```json
{
  "scripts": {
    "start": "cd server && npm start"
  }
}
```

---

## 🔍 预期的成功日志

修复后，你应该看到：

```
[inf] Starting Container
[inf] > ai-assessment-app@0.0.0 start
[inf] > cd server && npm start
[inf] 
[inf] > ai-assessment-server@1.0.0 start
[inf] > node dist/index.js
[inf] 
[inf] Server listening on port 3000
```

---

## 💡 如果还是不行

请提供以下信息：

1. **Railway Dashboard → Settings → Deploy 的截图**
2. **Railway Dashboard → Settings → General 中的 Root Directory 设置**
3. **最新的完整部署日志（从 Build 到 Deploy）**

我会根据这些信息提供更具体的解决方案。

---

## 🚨 紧急解决方案

如果需要立即让应用运行起来，可以：

1. **在 Railway Dashboard → Settings → Deploy → Start Command 中设置:**
   ```
   cd /app/server && npm start
   ```

2. **保存并重新部署**

这会绕过所有配置文件，直接使用绝对路径启动服务器。虽然不是最优雅的解决方案，但可以让应用先运行起来。
