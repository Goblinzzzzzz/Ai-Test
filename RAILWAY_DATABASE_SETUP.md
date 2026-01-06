# Railway 数据库设置指南

## 🎉 恭喜！应用已成功部署

现在需要创建数据库表结构。

---

## 方法 1: 使用 Railway Dashboard（最简单）

### 步骤：

1. **在 Railway Dashboard 中，点击你的 Postgres 服务**

2. **点击 "Data" 标签**

3. **点击 "Query" 按钮**

4. **复制并粘贴以下 SQL 脚本到查询框中：**

```sql
-- Railway PostgreSQL Migration Script
-- This script is idempotent and can be run multiple times safely

-- Create ai_assessments table if it doesn't exist
CREATE TABLE IF NOT EXISTS ai_assessments (
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_ai_assessments_cohort 
    ON ai_assessments(cohort);

CREATE INDEX IF NOT EXISTS idx_ai_assessments_created_at 
    ON ai_assessments(created_at DESC);

-- Create view for aggregated statistics
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

5. **点击 "Run Query" 或 "Execute"**

6. **确认看到成功消息**

---

## 方法 2: 使用 Railway CLI

如果你更喜欢使用命令行：

```bash
# 1. 安装 Railway CLI（如果还没安装）
npm install -g @railway/cli

# 2. 登录
railway login

# 3. 连接到你的项目
railway link

# 4. 连接到数据库并运行迁移
railway connect Postgres

# 然后在 psql 提示符中，运行：
\i ai-assessment-app/server/migrations/init.sql
```

---

## 方法 3: 使用 psql 客户端

如果你本地安装了 PostgreSQL 客户端：

```bash
# 1. 从 Railway Dashboard 获取数据库连接字符串
# Variables 标签 → 复制 DATABASE_URL

# 2. 使用 psql 连接
psql "你的DATABASE_URL"

# 3. 运行迁移脚本
\i ai-assessment-app/server/migrations/init.sql
```

---

## ✅ 验证数据库设置

运行以下 SQL 来验证表已创建：

```sql
-- 查看所有表
\dt

-- 查看 ai_assessments 表结构
\d ai_assessments

-- 查看视图
\dv

-- 测试插入一条数据
INSERT INTO ai_assessments (name, cohort, total, title, d1, d2, d3, d4, d5, answers)
VALUES ('测试用户', 'default', 15, '效率尝鲜者', 3, 3, 3, 3, 3, '{}');

-- 查询数据
SELECT * FROM ai_assessments;

-- 查看统计视图
SELECT * FROM ai_assessment_public_stats;
```

---

## 🔧 配置环境变量

确保在 Railway 应用服务中配置了数据库连接：

1. **进入你的应用服务（不是 Postgres 服务）**
2. **点击 "Variables" 标签**
3. **添加变量：**
   ```
   DATABASE_URL = ${{Postgres.DATABASE_URL}}
   ```
4. **保存并重新部署**

---

## 🚀 测试应用

数据库设置完成后：

1. **访问你的应用 URL**（在 Settings → Domains 中查看）
2. **完成一次测评**
3. **查看统计页面**
4. **在数据库中验证数据已保存**

---

## 📊 数据库表结构说明

### ai_assessments 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键，自动生成 |
| name | TEXT | 用户名，默认"匿名用户" |
| cohort | TEXT | 群组标识，默认"default" |
| total | INTEGER | 总分 (0-30) |
| title | TEXT | 测评结果标题 |
| d1-d5 | INTEGER | 五个维度的分数 (0-6) |
| answers | JSONB | 详细答案的 JSON 对象 |
| created_at | TIMESTAMPTZ | 创建时间 |
| user_agent | TEXT | 浏览器信息 |

### ai_assessment_public_stats 视图

提供按 cohort 分组的聚合统计数据：
- 总数量
- 各维度平均分
- 最高分/最低分

---

## ❓ 常见问题

### Q: 如何查看数据库连接字符串？
A: Railway Dashboard → Postgres 服务 → Variables 标签 → 复制 DATABASE_URL

### Q: 如何重置数据库？
A: 在 Query 界面运行：
```sql
DROP TABLE IF EXISTS ai_assessments CASCADE;
```
然后重新运行迁移脚本。

### Q: 如何备份数据？
A: Railway Dashboard → Postgres 服务 → Backups 标签

---

## 🎊 完成！

数据库设置完成后，你的应用就完全可以使用了！

如果遇到任何问题，请查看：
- 应用服务的 Logs 标签
- Postgres 服务的 Metrics 标签
