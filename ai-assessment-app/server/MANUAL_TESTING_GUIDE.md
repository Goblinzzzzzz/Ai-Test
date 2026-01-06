# 手动功能测试指南

## 概述

本文档提供了 Railway 迁移后端 API 的完整手动测试指南，涵盖需求 12.1、12.2 和 12.3。

## 测试前准备

### 1. 环境配置

确保以下环境已配置：

```bash
# 在 server/.env 文件中配置
DATABASE_URL=postgresql://user:password@host:port/database
PORT=3000
NODE_ENV=development
```

### 2. 启动服务器

```bash
cd ai-assessment-app/server
npm start
```

验证服务器启动成功：
- 查看日志输出 "服务器运行在端口 3000"
- 数据库连接健康检查通过

### 3. 运行自动化测试脚本

```bash
cd ai-assessment-app/server
./manual-test.sh
```

## 测试场景

### 需求 12.1: 完整的测评提交流程

#### 测试 1.1: 提交有效测评（完整字段）

**目的**: 验证系统能够接受并存储完整的测评数据

**步骤**:
```bash
curl -X POST http://localhost:3000/api/assessments \
  -H "Content-Type: application/json" \
  -d '{
    "name": "张三",
    "cohort": "test-2024",
    "total": 25,
    "title": "AI 应用先锋",
    "d1": 5,
    "d2": 5,
    "d3": 5,
    "d4": 5,
    "d5": 5,
    "answers": {"q1": 5, "q2": 5, "q3": 5, "q4": 5, "q5": 5, "q6": 5}
  }'
```

**预期结果**:
- HTTP 状态码: 201
- 响应格式: `{ "success": true, "data": { "id": "uuid" } }`
- 数据库中创建新记录

**验证点**:
- ✓ 返回 201 状态码
- ✓ 响应包含 success: true
- ✓ 响应包含生成的 UUID
- ✓ 所有字段正确存储

#### 测试 1.2: 提交测评（使用默认值）

**目的**: 验证系统正确应用默认值

**步骤**:
```bash
curl -X POST http://localhost:3000/api/assessments \
  -H "Content-Type: application/json" \
  -d '{
    "total": 18,
    "title": "AI 探索者",
    "d1": 4,
    "d2": 3,
    "d3": 4,
    "d4": 4,
    "d5": 3,
    "answers": {"q1": 4}
  }'
```

**预期结果**:
- HTTP 状态码: 201
- name 默认为 "匿名用户"
- cohort 默认为 "default"

**验证点**:
- ✓ 返回 201 状态码
- ✓ 数据库记录 name = "匿名用户"
- ✓ 数据库记录 cohort = "default"

#### 测试 1.3: 提交测评（边界值）

**目的**: 验证系统接受边界值

**步骤**:
```bash
# 最小值
curl -X POST http://localhost:3000/api/assessments \
  -H "Content-Type: application/json" \
  -d '{
    "total": 0,
    "title": "测试",
    "d1": 0, "d2": 0, "d3": 0, "d4": 0, "d5": 0,
    "answers": {}
  }'

# 最大值
curl -X POST http://localhost:3000/api/assessments \
  -H "Content-Type: application/json" \
  -d '{
    "total": 30,
    "title": "测试",
    "d1": 6, "d2": 6, "d3": 6, "d4": 6, "d5": 6,
    "answers": {}
  }'
```

**预期结果**:
- 两个请求都返回 201
- 数据正确存储

### 需求 12.2: 统计页面数据显示

#### 测试 2.1: 获取群组统计

**目的**: 验证统计数据计算正确

**步骤**:
```bash
# 先提交一些测试数据
for i in {1..5}; do
  curl -s -X POST http://localhost:3000/api/assessments \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"用户$i\",
      \"cohort\": \"test-cohort\",
      \"total\": $((15 + i * 2)),
      \"title\": \"测试\",
      \"d1\": $((3 + i % 3)),
      \"d2\": $((3 + i % 3)),
      \"d3\": $((3 + i % 3)),
      \"d4\": $((3 + i % 3)),
      \"d5\": $((3 + i % 3)),
      \"answers\": {}
    }"
done

# 获取统计
curl http://localhost:3000/api/assessments/stats/test-cohort
```

**预期结果**:
```json
{
  "success": true,
  "data": {
    "cohort": "test-cohort",
    "total_count": 5,
    "avg_total": 21.0,
    "avg_d1": 4.0,
    "avg_d2": 4.0,
    "avg_d3": 4.0,
    "avg_d4": 4.0,
    "avg_d5": 4.0,
    "min_total": 17,
    "max_total": 25
  }
}
```

**验证点**:
- ✓ HTTP 状态码: 200
- ✓ 包含所有统计字段
- ✓ total_count 正确
- ✓ 平均值计算正确
- ✓ 最小/最大值正确

#### 测试 2.2: 获取最近测评

**目的**: 验证最近测评列表正确返回

**步骤**:
```bash
curl "http://localhost:3000/api/assessments/recent/test-cohort?limit=10"
```

**预期结果**:
- HTTP 状态码: 200
- 返回数组，最多 10 条记录
- 按 created_at 降序排列
- 仅包含非敏感字段

**验证点**:
- ✓ 返回数组格式
- ✓ 记录数 ≤ limit
- ✓ 时间戳降序排列
- ✓ 不包含完整 answers 字段
- ✓ 不包含 user_agent 字段

#### 测试 2.3: 获取分布数据

**目的**: 验证分布数据正确返回

**步骤**:
```bash
curl http://localhost:3000/api/assessments/distribution/test-cohort
```

**预期结果**:
- HTTP 状态码: 200
- 返回数组，最多 1000 条记录
- 包含分数和时间戳

**验证点**:
- ✓ 返回数组格式
- ✓ 记录数 ≤ 1000
- ✓ 包含 total, d1-d5, created_at

#### 测试 2.4: 查询不存在的群组

**目的**: 验证空结果处理

**步骤**:
```bash
curl http://localhost:3000/api/assessments/stats/nonexistent-cohort-99999
```

**预期结果**:
- HTTP 状态码: 200
- data 为 null 或包含 total_count: 0

**验证点**:
- ✓ 不返回错误
- ✓ 优雅处理空结果

### 需求 12.3: 错误场景处理

#### 测试 3.1: 总分超出范围

**目的**: 验证分数范围验证

**步骤**:
```bash
# total > 30
curl -X POST http://localhost:3000/api/assessments \
  -H "Content-Type: application/json" \
  -d '{
    "total": 35,
    "title": "测试",
    "d1": 5, "d2": 5, "d3": 5, "d4": 5, "d5": 5,
    "answers": {}
  }'

# total < 0
curl -X POST http://localhost:3000/api/assessments \
  -H "Content-Type: application/json" \
  -d '{
    "total": -5,
    "title": "测试",
    "d1": 5, "d2": 5, "d3": 5, "d4": 5, "d5": 5,
    "answers": {}
  }'
```

**预期结果**:
- HTTP 状态码: 400
- 响应格式: `{ "success": false, "error": { "message": "...", "details": [...] } }`

**验证点**:
- ✓ 返回 400 状态码
- ✓ success: false
- ✓ 包含错误消息
- ✓ 包含验证详情

#### 测试 3.2: 维度分数超出范围

**目的**: 验证维度分数验证

**步骤**:
```bash
curl -X POST http://localhost:3000/api/assessments \
  -H "Content-Type: application/json" \
  -d '{
    "total": 25,
    "title": "测试",
    "d1": 8, "d2": 5, "d3": 5, "d4": 5, "d5": 5,
    "answers": {}
  }'
```

**预期结果**:
- HTTP 状态码: 400
- 错误消息指出 d1 超出范围

#### 测试 3.3: 缺少必填字段

**目的**: 验证必填字段检查

**步骤**:
```bash
# 缺少 title
curl -X POST http://localhost:3000/api/assessments \
  -H "Content-Type: application/json" \
  -d '{
    "total": 25,
    "d1": 5, "d2": 5, "d3": 5, "d4": 5, "d5": 5,
    "answers": {}
  }'

# 缺少 answers
curl -X POST http://localhost:3000/api/assessments \
  -H "Content-Type: application/json" \
  -d '{
    "total": 25,
    "title": "测试",
    "d1": 5, "d2": 5, "d3": 5, "d4": 5, "d5": 5
  }'

# 缺少维度分数
curl -X POST http://localhost:3000/api/assessments \
  -H "Content-Type: application/json" \
  -d '{
    "total": 25,
    "title": "测试",
    "d1": 5, "d2": 5, "d3": 5,
    "answers": {}
  }'
```

**预期结果**:
- 所有请求返回 400
- 错误消息指出缺少的字段

#### 测试 3.4: 无效 JSON

**目的**: 验证 JSON 解析错误处理

**步骤**:
```bash
curl -X POST http://localhost:3000/api/assessments \
  -H "Content-Type: application/json" \
  -d '{ invalid json }'
```

**预期结果**:
- HTTP 状态码: 400
- 错误消息指出 JSON 格式错误

#### 测试 3.5: SQL 注入防护

**目的**: 验证 SQL 注入防护

**步骤**:
```bash
curl -X POST http://localhost:3000/api/assessments \
  -H "Content-Type: application/json" \
  -d '{
    "name": "'; DROP TABLE ai_assessments; --",
    "total": 25,
    "title": "测试",
    "d1": 5, "d2": 5, "d3": 5, "d4": 5, "d5": 5,
    "answers": {}
  }'
```

**预期结果**:
- 请求成功或被验证拒绝
- 数据库表未被删除
- 恶意输入被安全处理

### 测试 3.6: 限流保护

**目的**: 验证限流机制

**步骤**:
```bash
# 快速发送 12 个请求
for i in {1..12}; do
  curl -X POST http://localhost:3000/api/assessments \
    -H "Content-Type: application/json" \
    -d '{
      "total": 20,
      "title": "Rate Test",
      "d1": 4, "d2": 4, "d3": 4, "d4": 4, "d5": 4,
      "answers": {}
    }'
  echo "Request $i"
done
```

**预期结果**:
- 前 10 个请求成功 (201)
- 第 11 个及之后返回 429 Too Many Requests

**验证点**:
- ✓ 限流在 ~10 个请求后触发
- ✓ 返回 429 状态码
- ✓ 错误消息友好

### 测试 3.7: 网络错误模拟

**目的**: 验证网络错误处理

**步骤**:
1. 停止服务器
2. 尝试发送请求
3. 观察前端错误处理

**预期结果**:
- 前端显示友好的错误消息
- 不暴露技术细节

## API 响应格式验证

### 成功响应格式

所有成功的 API 响应应遵循以下格式：

```json
{
  "success": true,
  "data": {
    // 实际数据
  }
}
```

### 错误响应格式

所有错误响应应遵循以下格式：

```json
{
  "success": false,
  "error": {
    "message": "错误描述",
    "details": ["详细信息1", "详细信息2"]  // 可选
  }
}
```

## 与 Supabase 版本对比

### 功能对比清单

| 功能 | Supabase 版本 | Railway 版本 | 状态 |
|------|--------------|--------------|------|
| 提交测评 | ✓ | ✓ | ✓ 一致 |
| 获取统计 | ✓ | ✓ | ✓ 一致 |
| 最近测评 | ✓ | ✓ | ✓ 一致 |
| 分布数据 | ✓ | ✓ | ✓ 一致 |
| 输入验证 | ✓ | ✓ | ✓ 增强 |
| 错误处理 | ✓ | ✓ | ✓ 改进 |
| 限流保护 | ✗ | ✓ | ✓ 新增 |
| 日志记录 | 基础 | 完整 | ✓ 改进 |

### 数据格式对比

确保以下数据格式与 Supabase 版本一致：

1. **测评记录字段**:
   - id (UUID)
   - name (string)
   - cohort (string)
   - total (number, 0-30)
   - title (string)
   - d1-d5 (number, 0-6)
   - answers (object)
   - created_at (timestamp)

2. **统计数据字段**:
   - cohort
   - total_count
   - avg_total, avg_d1-d5
   - min_total, max_total

## 测试报告模板

### 测试执行记录

| 测试编号 | 测试名称 | 执行时间 | 结果 | 备注 |
|---------|---------|---------|------|------|
| 1.1 | 提交有效测评 | YYYY-MM-DD HH:MM | ✓ PASS | |
| 1.2 | 使用默认值 | YYYY-MM-DD HH:MM | ✓ PASS | |
| 2.1 | 获取统计 | YYYY-MM-DD HH:MM | ✓ PASS | |
| 3.1 | 分数验证 | YYYY-MM-DD HH:MM | ✓ PASS | |
| ... | ... | ... | ... | ... |

### 问题记录

| 问题编号 | 严重程度 | 描述 | 重现步骤 | 状态 |
|---------|---------|------|---------|------|
| | | | | |

## 自动化测试脚本使用

### 快速测试

```bash
cd ai-assessment-app/server
./manual-test.sh
```

### 自定义测试

```bash
# 指定不同的 API 端点
API_BASE_URL=https://your-railway-app.railway.app ./manual-test.sh

# 使用特定群组
COHORT=my-test-cohort ./manual-test.sh
```

## 故障排查

### 常见问题

1. **数据库连接失败**
   - 检查 DATABASE_URL 环境变量
   - 验证数据库服务运行中
   - 检查网络连接

2. **测试失败**
   - 查看服务器日志
   - 验证数据库迁移已运行
   - 检查环境变量配置

3. **限流测试不触发**
   - 等待 60 秒后重试
   - 检查限流配置
   - 验证 IP 地址识别

## 结论

完成所有测试后，确认：

- ✓ 所有 API 端点正常工作
- ✓ 数据验证正确
- ✓ 错误处理完善
- ✓ 与 Supabase 版本功能一致
- ✓ 新增安全功能（限流、日志）正常

测试通过后，可以进行生产部署。
