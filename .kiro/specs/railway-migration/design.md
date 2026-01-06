# 设计文档

## 概述

本设计文档描述了将 AI 测评应用从 Vercel + Supabase 架构迁移到 Railway 全栈部署的技术实现方案。迁移将创建一个 Express.js 后端 API 服务器，直接连接 Railway PostgreSQL 数据库，并重构前端以使用 REST API 而非 Supabase SDK。

### 架构变化

**当前架构:**
```
用户浏览器 → Vercel (静态托管) → Supabase (BaaS: 数据库 + API)
```

**目标架构:**
```
用户浏览器 → Railway (Express 服务器 + 静态文件) → Railway PostgreSQL
```

### 主要优势

1. **数据所有权**: 完全控制数据库和数据
2. **安全性提升**: API 密钥不暴露在客户端
3. **统一平台**: 简化部署和监控
4. **成本可预测**: 单一供应商计费
5. **扩展灵活**: 可添加自定义后端逻辑

## 架构

### 系统组件

```
┌─────────────────────────────────────────────────────────────┐
│                        Railway 平台                          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Express.js 应用服务                      │  │
│  │                                                       │  │
│  │  ┌─────────────────┐      ┌──────────────────────┐  │  │
│  │  │  静态文件服务    │      │    REST API 路由      │  │  │
│  │  │  (dist/)        │      │                      │  │  │
│  │  │  - index.html   │      │  POST /api/         │  │  │
│  │  │  - assets/      │      │    assessments      │  │  │
│  │  │  - *.js, *.css  │      │  GET /api/          │  │  │
│  │  └─────────────────┘      │    assessments/     │  │  │
│  │                           │    stats/:cohort    │  │  │
│  │                           │  GET /api/          │  │  │
│  │                           │    assessments/     │  │  │
│  │                           │    recent/:cohort   │  │  │
│  │                           │  GET /api/          │  │  │
│  │                           │    assessments/     │  │  │
│  │                           │    distribution/    │  │  │
│  │                           │    :cohort          │  │  │
│  │                           └──────────────────────┘  │  │
│  │                                    │                │  │
│  │                                    ▼                │  │
│  │                           ┌──────────────────────┐  │  │
│  │                           │   数据库连接池        │  │  │
│  │                           │   (node-postgres)    │  │  │
│  │                           └──────────────────────┘  │  │
│  └───────────────────────────────────┼─────────────────┘  │
│                                      │                    │
│                                      ▼                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              PostgreSQL 数据库服务                    │  │
│  │                                                       │  │
│  │  - ai_assessments 表                                  │  │
│  │  - ai_assessment_public_stats 视图                    │  │
│  │  - 索引和约束                                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 技术栈

**后端:**
- Node.js 18+
- Express.js 4.x (Web 框架)
- TypeScript 5.x (类型安全)
- pg (node-postgres) 8.x (PostgreSQL 客户端)
- express-rate-limit (限流)
- cors (跨域支持)
- helmet (安全头)

**前端:**
- React 19.x
- TypeScript 5.x
- Vite 7.x (构建工具)
- 原有 UI 库保持不变

**数据库:**
- PostgreSQL 14+ (Railway 提供)

## 组件和接口

### 后端服务器结构

```
ai-assessment-app/
├── server/                    # 后端代码目录
│   ├── src/
│   │   ├── index.ts          # 服务器入口
│   │   ├── config/
│   │   │   └── database.ts   # 数据库配置
│   │   ├── routes/
│   │   │   └── assessments.ts # API 路由
│   │   ├── controllers/
│   │   │   └── assessmentController.ts # 业务逻辑
│   │   ├── models/
│   │   │   └── assessment.ts  # 数据模型和验证
│   │   ├── middleware/
│   │   │   ├── errorHandler.ts # 错误处理
│   │   │   ├── rateLimiter.ts  # 限流
│   │   │   └── validator.ts    # 输入验证
│   │   └── utils/
│   │       └── logger.ts      # 日志工具
│   ├── migrations/
│   │   └── init.sql          # 数据库初始化脚本
│   ├── tsconfig.json
│   └── package.json
├── src/                      # 前端代码（现有）
├── dist/                     # 前端构建输出
└── package.json              # 根 package.json
```

### API 端点规范

#### 1. 提交测评

**端点:** `POST /api/assessments`

**请求体:**
```typescript
{
  name?: string;           // 可选，默认 "匿名用户"
  cohort?: string;         // 可选，默认 "default"
  total: number;           // 必需，0-30
  title: string;           // 必需
  d1: number;              // 必需，0-6
  d2: number;              // 必需，0-6
  d3: number;              // 必需，0-6
  d4: number;              // 必需，0-6
  d5: number;              // 必需，0-6
  answers: object;         // 必需，JSON 对象
  user_agent?: string;     // 可选，自动从请求头获取
}
```

**响应:**
```typescript
// 成功 (201)
{
  success: true;
  data: {
    id: string;  // UUID
  }
}

// 验证错误 (400)
{
  success: false;
  error: {
    message: string;
    details: string[];
  }
}

// 服务器错误 (500)
{
  success: false;
  error: {
    message: string;
  }
}
```

#### 2. 获取群组统计

**端点:** `GET /api/assessments/stats/:cohort`

**路径参数:**
- `cohort`: 群组标识符

**响应:**
```typescript
// 成功 (200)
{
  success: true;
  data: {
    cohort: string;
    total_count: number;
    avg_total: number;
    avg_d1: number;
    avg_d2: number;
    avg_d3: number;
    avg_d4: number;
    avg_d5: number;
    min_total: number;
    max_total: number;
  } | null
}
```

#### 3. 获取最近测评

**端点:** `GET /api/assessments/recent/:cohort`

**路径参数:**
- `cohort`: 群组标识符

**查询参数:**
- `limit`: 可选，默认 50，最大 100

**响应:**
```typescript
// 成功 (200)
{
  success: true;
  data: Array<{
    id: string;
    name: string;
    total: number;
    title: string;
    d1: number;
    d2: number;
    d3: number;
    d4: number;
    d5: number;
    created_at: string;  // ISO 8601
  }>
}
```

#### 4. 获取分布数据

**端点:** `GET /api/assessments/distribution/:cohort`

**路径参数:**
- `cohort`: 群组标识符

**响应:**
```typescript
// 成功 (200)
{
  success: true;
  data: Array<{
    total: number;
    d1: number;
    d2: number;
    d3: number;
    d4: number;
    d5: number;
    created_at: string;  // ISO 8601
  }>
}
```

### 数据库接口

#### 连接池配置

```typescript
// server/src/config/database.ts
import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  max: 20,                    // 最大连接数
  idleTimeoutMillis: 30000,   // 空闲超时
  connectionTimeoutMillis: 2000, // 连接超时
});
```

#### 数据模型

```typescript
// server/src/models/assessment.ts
export interface Assessment {
  id?: string;
  name: string;
  cohort: string;
  total: number;
  title: string;
  d1: number;
  d2: number;
  d3: number;
  d4: number;
  d5: number;
  answers: any;
  created_at?: Date;
  user_agent?: string;
}

export interface AssessmentStats {
  cohort: string;
  total_count: number;
  avg_total: number;
  avg_d1: number;
  avg_d2: number;
  avg_d3: number;
  avg_d4: number;
  avg_d5: number;
  min_total: number;
  max_total: number;
}
```

### 前端 API 客户端

```typescript
// src/utils/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export interface AssessmentSubmission {
  name?: string;
  cohort: string;
  total: number;
  title: string;
  d1: number;
  d2: number;
  d3: number;
  d4: number;
  d5: number;
  answers: any;
}

export async function submitAssessment(
  submission: AssessmentSubmission
): Promise<{ ok: boolean; error?: any }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/assessments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submission),
    });

    const data = await response.json();

    if (!response.ok) {
      return { ok: false, error: data.error };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}

export async function getCohortStatistics(cohort: string = 'default') {
  const response = await fetch(
    `${API_BASE_URL}/api/assessments/stats/${cohort}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch statistics');
  }
  
  const { data } = await response.json();
  return data;
}

export async function getRecentAssessments(
  cohort: string = 'default',
  limit: number = 50
) {
  const response = await fetch(
    `${API_BASE_URL}/api/assessments/recent/${cohort}?limit=${limit}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch recent assessments');
  }
  
  const { data } = await response.json();
  return data;
}

export async function getAssessmentDistribution(cohort: string = 'default') {
  const response = await fetch(
    `${API_BASE_URL}/api/assessments/distribution/${cohort}`
  );
  
  if (!response.ok) {
    throw new Error('Failed to fetch distribution');
  }
  
  const { data } = await response.json();
  return data;
}
```

## 数据模型

### 数据库表结构

#### ai_assessments 表

```sql
CREATE TABLE ai_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL DEFAULT '匿名用户',
    cohort TEXT NOT NULL DEFAULT 'default',
    total INTEGER NOT NULL CHECK (total >= 0 AND total <= 30),
    title TEXT NOT NULL,
    d1 INTEGER NOT NULL CHECK (d1 >= 0 AND d1 <= 6),
    d2 INTEGER NOT NULL CHECK (d2 >= 0 AND d2 <= 6),
    d3 INTEGER NOT NULL CHECK (d3 >= 0 AND d3 <= 6),
    d4 INTEGER NOT NULL CHECK (d4 >= 0 AND d4 <= 6),
    d5 INTEGER NOT NULL CHECK (d5 >= 0 AND d5 <= 6),
    answers JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_agent TEXT
);

CREATE INDEX idx_ai_assessments_cohort ON ai_assessments(cohort);
CREATE INDEX idx_ai_assessments_created_at ON ai_assessments(created_at DESC);
```

#### ai_assessment_public_stats 视图

```sql
CREATE OR REPLACE VIEW ai_assessment_public_stats AS
SELECT 
    cohort,
    COUNT(*) as total_count,
    AVG(total) as avg_total,
    AVG(d1) as avg_d1,
    AVG(d2) as avg_d2,
    AVG(d3) as avg_d3,
    AVG(d4) as avg_d4,
    AVG(d5) as avg_d5,
    MIN(total) as min_total,
    MAX(total) as max_total
FROM ai_assessments
GROUP BY cohort;
```

### 数据验证规则

**测评提交验证:**
```typescript
function validateAssessment(data: any): string[] {
  const errors: string[] = [];
  
  // 必填字段
  if (typeof data.total !== 'number') {
    errors.push('total 必须是数字');
  }
  if (typeof data.title !== 'string' || !data.title.trim()) {
    errors.push('title 必须是非空字符串');
  }
  if (typeof data.answers !== 'object') {
    errors.push('answers 必须是对象');
  }
  
  // 分数范围
  if (data.total < 0 || data.total > 30) {
    errors.push('total 必须在 0-30 之间');
  }
  
  for (let i = 1; i <= 5; i++) {
    const key = `d${i}`;
    if (typeof data[key] !== 'number' || data[key] < 0 || data[key] > 6) {
      errors.push(`${key} 必须在 0-6 之间`);
    }
  }
  
  return errors;
}
```

## 正确性属性

*属性是一个特征或行为，应该在系统的所有有效执行中保持为真——本质上是关于系统应该做什么的正式陈述。属性作为人类可读规范和机器可验证正确性保证之间的桥梁。*

### 属性 1: 测评数据往返一致性

*对于任何* 有效的测评提交，当数据被插入数据库后再查询该记录，返回的所有字段值应与提交时相同（系统生成的 id 和 created_at 除外）

**验证: 需求 2.1, 2.3**

### 属性 2: 输入验证完整性

*对于任何* 测评提交，如果 total 不在 0-30 范围内，或任何 d1-d5 不在 0-6 范围内，或缺少必填字段（title、answers），则 API 应拒绝该提交并返回 400 错误及验证详情

**验证: 需求 2.2, 2.5, 2.6**

### 属性 3: 统计计算正确性

*对于任何* 群组，统计 API 返回的所有聚合值（avg_total、avg_d1-d5、min_total、max_total、total_count）应与该群组实际数据的计算结果一致（浮点数误差在 0.01 以内）

**验证: 需求 3.1, 3.2**

### 属性 4: 时间序列排序一致性

*对于任何* 群组的最近测评或分布数据查询，返回的记录应严格按 created_at 降序排列，即对于任意相邻的两条记录 i 和 i+1，record[i].created_at >= record[i+1].created_at

**验证: 需求 4.1, 5.3**

### 属性 5: 结果集限制遵守

*对于任何* 最近测评查询，当指定 limit 参数时，返回的记录数应不超过 limit 值（最大 100）；对于分布数据查询，返回的记录数应不超过 1000

**验证: 需求 4.2, 5.2**

### 属性 6: 字段过滤安全性

*对于任何* 最近测评查询，返回的记录应仅包含非敏感字段（id、name、total、title、d1-d5、created_at），不应包含完整的 answers 或 user_agent 字段

**验证: 需求 4.3**

### 属性 7: 限流保护有效性

*对于任何* IP 地址，在 60 秒滑动窗口内向 POST /api/assessments 发送超过 10 个请求时，第 11 个及之后的请求应收到 429 Too Many Requests 响应

**验证: 需求 10.1**

### 属性 8: SQL 注入防护

*对于任何* 包含 SQL 特殊字符（如 `'`, `"`, `;`, `--`, `/*`, `*/`）或 SQL 关键字的输入，系统应安全处理而不执行意外的 SQL 命令，且应正常返回结果或验证错误，不应导致数据库错误

**验证: 需求 10.3**

### 属性 9: 输入清理一致性

*对于任何* 用户输入，在数据库操作之前应经过验证和清理，确保存储的数据不包含恶意脚本或格式错误的内容

**验证: 需求 10.2**

### 属性 10: API 响应格式一致性

*对于任何* API 请求，成功响应（2xx）应包含 `{ success: true, data: ... }` 结构，失败响应（4xx/5xx）应包含 `{ success: false, error: { message: string, details?: any } }` 结构

**验证: 需求 12.3**

### 属性 11: 默认值应用正确性

*对于任何* 不包含 name 字段的测评提交，数据库中存储的 name 应为 "匿名用户"；对于任何不包含 cohort 字段的提交，cohort 应为 "default"

**验证: 需求 2.7, 2.8**

### 属性 12: 错误日志完整性

*对于任何* 导致错误的请求，系统应记录包含错误消息、堆栈跟踪（开发环境）、请求路径、方法和 IP 地址的日志条目

**验证: 需求 11.1, 11.3**

### 属性 13: 生产环境信息隐藏

*对于任何* 在生产环境（NODE_ENV=production）中发生的错误，API 响应不应包含堆栈跟踪、数据库凭据或其他敏感信息，仅返回通用错误消息

**验证: 需求 11.5**

## 错误处理

### 错误类型和响应

**1. 验证错误 (400 Bad Request)**
```typescript
{
  success: false,
  error: {
    message: "验证失败",
    details: [
      "total 必须在 0-30 之间",
      "d1 必须在 0-6 之间"
    ]
  }
}
```

**2. 未找到资源 (404 Not Found)**
```typescript
{
  success: false,
  error: {
    message: "资源未找到"
  }
}
```

**3. 限流错误 (429 Too Many Requests)**
```typescript
{
  success: false,
  error: {
    message: "请求过于频繁，请稍后再试"
  }
}
```

**4. 服务器错误 (500 Internal Server Error)**
```typescript
{
  success: false,
  error: {
    message: "服务器内部错误"
  }
}
```

**5. 服务不可用 (503 Service Unavailable)**
```typescript
{
  success: false,
  error: {
    message: "数据库连接失败，请稍后再试"
  }
}
```

### 错误处理中间件

```typescript
// server/src/middleware/errorHandler.ts
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // 记录错误
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  // 生产环境不暴露堆栈跟踪
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(500).json({
    success: false,
    error: {
      message: '服务器内部错误',
      ...(isDevelopment && { stack: err.stack }),
    },
  });
}
```

### 数据库错误处理

```typescript
try {
  const result = await pool.query(query, params);
  return result.rows;
} catch (error) {
  if (error.code === '23505') {
    // 唯一约束违反
    throw new Error('记录已存在');
  } else if (error.code === '23514') {
    // 检查约束违反
    throw new Error('数据不符合约束条件');
  } else if (error.code === 'ECONNREFUSED') {
    // 连接被拒绝
    logger.error('数据库连接失败');
    throw new Error('数据库服务不可用');
  } else {
    // 其他错误
    logger.error('数据库查询错误', error);
    throw error;
  }
}
```

## 测试策略

### 双重测试方法

本项目采用单元测试和基于属性的测试相结合的方法：

- **单元测试**: 验证特定示例、边缘情况和错误条件
- **属性测试**: 通过所有输入验证通用属性
- 两者互补，对于全面覆盖都是必要的

### 单元测试

单元测试专注于：
- 演示正确行为的特定示例
- 组件之间的集成点
- 边缘情况和错误条件

**示例单元测试:**
```typescript
describe('Assessment Validation', () => {
  it('应拒绝总分为负数的提交', () => {
    const invalid = { ...validAssessment, total: -1 };
    const errors = validateAssessment(invalid);
    expect(errors).toContain('total 必须在 0-30 之间');
  });

  it('应接受所有字段有效的提交', () => {
    const errors = validateAssessment(validAssessment);
    expect(errors).toHaveLength(0);
  });
});
```

### 基于属性的测试

属性测试通过随机化实现全面的输入覆盖。

**配置:**
- 每个属性测试最少 100 次迭代
- 使用 fast-check 库（TypeScript/JavaScript）
- 每个测试必须引用其设计文档属性

**标签格式:** `Feature: railway-migration, Property {number}: {property_text}`

**示例属性测试:**
```typescript
import fc from 'fast-check';

// Feature: railway-migration, Property 2: 分数范围约束
describe('Property: Score Range Constraints', () => {
  it('应拒绝任何超出范围的分数', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100, max: 100 }),
        fc.array(fc.integer({ min: -10, max: 10 }), { minLength: 5, maxLength: 5 }),
        (total, dimensions) => {
          const submission = {
            total,
            d1: dimensions[0],
            d2: dimensions[1],
            d3: dimensions[2],
            d4: dimensions[3],
            d5: dimensions[4],
            title: 'Test',
            answers: {},
          };

          const errors = validateAssessment(submission);
          
          const hasInvalidTotal = total < 0 || total > 30;
          const hasInvalidDimension = dimensions.some(d => d < 0 || d > 6);
          
          if (hasInvalidTotal || hasInvalidDimension) {
            expect(errors.length).toBeGreaterThan(0);
          } else {
            expect(errors).toHaveLength(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### 集成测试

测试完整的 API 流程：
```typescript
describe('API Integration', () => {
  it('应完成完整的提交和检索流程', async () => {
    // 提交测评
    const submission = createValidSubmission();
    const submitResponse = await request(app)
      .post('/api/assessments')
      .send(submission);
    
    expect(submitResponse.status).toBe(201);
    
    // 检索统计
    const statsResponse = await request(app)
      .get(`/api/assessments/stats/${submission.cohort}`);
    
    expect(statsResponse.status).toBe(200);
    expect(statsResponse.body.data.total_count).toBeGreaterThan(0);
  });
});
```

### 测试覆盖目标

- 单元测试: 80%+ 代码覆盖率
- 属性测试: 所有 8 个正确性属性
- 集成测试: 所有 4 个 API 端点
- 边缘情况: 空输入、极值、特殊字符
