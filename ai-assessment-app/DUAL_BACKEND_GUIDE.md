# 双后端支持指南 (Dual Backend Support Guide)

## 概述

本应用支持在 Railway 后端和 Supabase 后端之间切换，以便在迁移过程中实现平滑过渡。

## 配置

### 使用 Railway 后端（推荐，默认）

在 `.env` 文件中设置：

```bash
VITE_USE_RAILWAY=true
VITE_API_URL=http://localhost:3000  # 开发环境
# 或
VITE_API_URL=https://your-railway-app.railway.app  # 生产环境
```

或者直接省略 `VITE_USE_RAILWAY`（默认为 true）：

```bash
VITE_API_URL=http://localhost:3000
```

### 使用 Supabase 后端（已弃用，仅用于向后兼容）

在 `.env` 文件中设置：

```bash
VITE_USE_RAILWAY=false
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 工作原理

### API 客户端 (`src/utils/api.ts`)

API 客户端会根据 `VITE_USE_RAILWAY` 环境变量自动选择后端：

- **Railway 模式**: 直接调用 REST API 端点
- **Supabase 模式**: 使用 Supabase 客户端（通过动态导入）

### Supabase 兼容层 (`src/utils/supabase.ts`)

为了保持向后兼容，我们保留了 Supabase 客户端代码，但标记为已弃用：

```typescript
/**
 * @deprecated This Supabase client is deprecated and maintained only for backward compatibility.
 * New implementations should use the Railway backend API in api.ts
 */
```

## 迁移建议

### 阶段 1: 测试 Railway 后端

1. 确保 Railway 后端正常运行
2. 设置 `VITE_USE_RAILWAY=true`
3. 测试所有功能

### 阶段 2: 并行运行

在过渡期间，可以通过环境变量快速切换后端进行对比测试：

```bash
# 测试 Railway
VITE_USE_RAILWAY=true npm run dev

# 测试 Supabase（如果需要）
VITE_USE_RAILWAY=false npm run dev
```

### 阶段 3: 完全迁移

一旦确认 Railway 后端稳定：

1. 移除 `VITE_USE_RAILWAY` 环境变量（默认使用 Railway）
2. 移除 Supabase 相关环境变量
3. 在未来版本中删除 `src/utils/supabase.ts`

## 功能对比

| 功能 | Railway 后端 | Supabase 后端 |
|------|-------------|--------------|
| 提交测评 | ✅ | ✅ (已弃用) |
| 获取统计 | ✅ | ✅ (已弃用) |
| 最近测评 | ✅ | ✅ (已弃用) |
| 分布数据 | ✅ | ✅ (已弃用) |
| 数据所有权 | ✅ 完全控制 | ❌ 第三方托管 |
| 安全性 | ✅ API 密钥不暴露 | ⚠️ 客户端暴露密钥 |
| 成本 | ✅ 单一平台 | ❌ 多平台费用 |

## 故障排查

### Railway 后端连接失败

检查：
1. `VITE_API_URL` 是否正确
2. Railway 服务是否正常运行
3. CORS 配置是否正确

### Supabase 后端连接失败

检查：
1. `VITE_USE_RAILWAY` 是否设置为 `false`
2. `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY` 是否正确
3. Supabase 项目是否仍然活跃

## 控制台日志

应用启动时会在浏览器控制台显示当前使用的后端：

```
[API] Using Railway backend: http://localhost:3000
```

或

```
[API] Using Supabase backend (legacy mode)
```

## 需求追溯

此功能实现了需求 12.5：

> 系统 应当支持在过渡期间同时运行 Supabase 和 Railway 后端（通过环境标志）

## 相关文件

- `src/utils/api.ts` - 主 API 客户端（支持双后端）
- `src/utils/supabase.ts` - Supabase 兼容层（已弃用）
- `.env.example` - 环境变量示例
- `DUAL_BACKEND_GUIDE.md` - 本文档
