# 实现计划: Railway 迁移

## 概述

本实现计划将 AI 测评应用从 Vercel + Supabase 架构迁移到 Railway 全栈部署。迁移将分阶段进行，首先搭建后端基础设施，然后迁移数据库，接着重构前端，最后配置部署。每个阶段都包含测试任务以确保功能正确性。

## 任务

- [x] 1. 搭建后端项目结构
  - 在 ai-assessment-app 目录下创建 server 子目录
  - 初始化后端 package.json 和 TypeScript 配置
  - 安装必要依赖: express, pg, cors, helmet, express-rate-limit
  - 安装开发依赖: @types/express, @types/pg, @types/cors, ts-node, nodemon
  - 创建基本目录结构: src/, src/config/, src/routes/, src/controllers/, src/models/, src/middleware/, src/utils/
  - _需求: 1.1_

- [-] 2. 实现数据库连接和配置
  - [x] 2.1 创建数据库连接池配置
    - 实现 server/src/config/database.ts
    - 配置连接池参数（最大连接数、超时等）
    - 实现连接健康检查函数
    - _需求: 1.2, 8.1_

  - [ ]* 2.2 编写数据库连接测试
    - 测试成功连接场景
    - 测试连接失败场景（返回 503）
    - _需求: 11.2_

- [-] 3. 创建数据库迁移脚本
  - [x] 3.1 编写 SQL 迁移脚本
    - 创建 server/migrations/init.sql
    - 定义 ai_assessments 表结构（包含所有列和约束）
    - 创建索引（cohort, created_at）
    - 创建 ai_assessment_public_stats 视图
    - 确保脚本幂等性（使用 IF NOT EXISTS）
    - _需求: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 3.2 测试迁移脚本
    - 测试首次运行创建所有对象
    - 测试重复运行不产生错误
    - 验证表结构与 Supabase 一致
    - _需求: 6.4, 6.5_

- [ ] 4. 实现数据模型和验证
  - [x] 4.1 创建数据模型接口
    - 实现 server/src/models/assessment.ts
    - 定义 Assessment 和 AssessmentStats 接口
    - 实现输入验证函数 validateAssessment()
    - _需求: 2.2, 2.5, 2.6_

  - [ ]* 4.2 编写属性测试: 输入验证完整性
    - **属性 2: 输入验证完整性**
    - 生成随机测评数据（有效和无效）
    - 验证所有超出范围的分数被拒绝
    - 验证所有缺少必填字段的提交被拒绝
    - **验证: 需求 2.2, 2.5, 2.6**

  - [ ]* 4.3 编写属性测试: 默认值应用正确性
    - **属性 11: 默认值应用正确性**
    - 生成不包含 name 或 cohort 的随机数据
    - 验证默认值被正确应用
    - **验证: 需求 2.7, 2.8**

- [ ] 5. 实现 API 控制器
  - [x] 5.1 实现测评提交控制器
    - 创建 server/src/controllers/assessmentController.ts
    - 实现 submitAssessment() 函数
    - 处理验证、数据库插入、错误处理
    - _需求: 2.1, 2.3, 2.4_

  - [x] 5.2 实现统计查询控制器
    - 实现 getCohortStatistics() 函数
    - 查询 ai_assessment_public_stats 视图
    - 处理空结果情况
    - _需求: 3.1, 3.2, 3.3_

  - [x] 5.3 实现最近测评查询控制器
    - 实现 getRecentAssessments() 函数
    - 支持 limit 参数（默认 50，最大 100）
    - 仅返回非敏感字段
    - _需求: 4.1, 4.2, 4.3_

  - [x] 5.4 实现分布数据查询控制器
    - 实现 getAssessmentDistribution() 函数
    - 限制结果为 1000 条
    - 按时间降序排列
    - _需求: 5.1, 5.2, 5.3_

  - [ ]* 5.5 编写属性测试: 测评数据往返一致性
    - **属性 1: 测评数据往返一致性**
    - 生成随机有效测评数据
    - 提交后查询并比较所有字段
    - **验证: 需求 2.1, 2.3**

  - [ ]* 5.6 编写属性测试: 统计计算正确性
    - **属性 3: 统计计算正确性**
    - 插入随机测评数据集
    - 查询统计并手动计算验证
    - **验证: 需求 3.1, 3.2**

  - [ ]* 5.7 编写属性测试: 时间序列排序一致性
    - **属性 4: 时间序列排序一致性**
    - 插入随机时间戳的测评数据
    - 验证查询结果严格降序排列
    - **验证: 需求 4.1, 5.3**

  - [ ]* 5.8 编写属性测试: 结果集限制遵守
    - **属性 5: 结果集限制遵守**
    - 插入超过限制数量的数据
    - 验证返回结果不超过 limit
    - **验证: 需求 4.2, 5.2**

  - [ ]* 5.9 编写属性测试: 字段过滤安全性
    - **属性 6: 字段过滤安全性**
    - 查询最近测评
    - 验证响应不包含敏感字段
    - **验证: 需求 4.3**

- [ ] 6. 实现安全中间件
  - [x] 6.1 实现限流中间件
    - 创建 server/src/middleware/rateLimiter.ts
    - 配置每 IP 每分钟 10 次请求限制
    - 应用到 POST /api/assessments 端点
    - _需求: 10.1_

  - [x] 6.2 实现输入清理中间件
    - 创建 server/src/middleware/validator.ts
    - 实现请求体大小限制
    - 实现输入清理函数
    - _需求: 10.2, 10.4_

  - [ ]* 6.3 编写属性测试: 限流保护有效性
    - **属性 7: 限流保护有效性**
    - 快速发送超过 10 个请求
    - 验证第 11 个请求返回 429
    - **验证: 需求 10.1**

  - [ ]* 6.4 编写属性测试: SQL 注入防护
    - **属性 8: SQL 注入防护**
    - 生成包含 SQL 特殊字符的输入
    - 验证系统安全处理不执行恶意 SQL
    - **验证: 需求 10.3**

  - [ ]* 6.5 编写属性测试: 输入清理一致性
    - **属性 9: 输入清理一致性**
    - 发送各种恶意输入
    - 验证存储的数据已被清理
    - **验证: 需求 10.2**

- [ ] 7. 实现错误处理和日志
  - [x] 7.1 创建日志工具
    - 实现 server/src/utils/logger.ts
    - 支持不同日志级别（info, warn, error）
    - 记录请求信息（方法、路径、IP、状态）
    - _需求: 10.5, 11.3, 11.4_

  - [x] 7.2 实现错误处理中间件
    - 创建 server/src/middleware/errorHandler.ts
    - 捕获所有未处理的错误
    - 根据环境返回适当的错误信息
    - 记录错误日志
    - _需求: 11.1, 11.2, 11.5_

  - [ ]* 7.3 编写属性测试: 错误日志完整性
    - **属性 12: 错误日志完整性**
    - 触发各种错误
    - 验证日志包含必要信息
    - **验证: 需求 11.1, 11.3**

  - [ ]* 7.4 编写属性测试: 生产环境信息隐藏
    - **属性 13: 生产环境信息隐藏**
    - 在生产模式下触发错误
    - 验证响应不包含敏感信息
    - **验证: 需求 11.5**

- [ ] 8. 实现 API 路由
  - [x] 8.1 创建路由定义
    - 创建 server/src/routes/assessments.ts
    - 定义 POST /api/assessments
    - 定义 GET /api/assessments/stats/:cohort
    - 定义 GET /api/assessments/recent/:cohort
    - 定义 GET /api/assessments/distribution/:cohort
    - 连接控制器和中间件
    - _需求: 2.1, 3.1, 4.1, 5.1_

  - [ ]* 8.2 编写属性测试: API 响应格式一致性
    - **属性 10: API 响应格式一致性**
    - 发送成功和失败的请求
    - 验证响应格式符合规范
    - **验证: 需求 12.3**

- [ ] 9. 实现服务器入口
  - [x] 9.1 创建服务器主文件
    - 实现 server/src/index.ts
    - 配置 Express 应用
    - 应用中间件（CORS, helmet, body-parser）
    - 挂载路由
    - 配置静态文件服务（dist 目录）
    - 启动服务器监听
    - _需求: 1.1, 1.3, 1.4, 1.5, 1.6_

  - [ ]* 9.2 编写集成测试
    - 测试服务器启动
    - 测试静态文件服务
    - 测试 CORS 头
    - 测试完整的提交和查询流程
    - _需求: 1.2, 1.3, 1.4, 1.5_

- [x] 10. 检查点 - 后端功能验证
  - 运行所有后端测试确保通过
  - 手动测试所有 API 端点
  - 验证数据库连接和查询
  - 如有问题请询问用户

- [ ] 11. 重构前端 API 客户端
  - [x] 11.1 创建新的 API 客户端
    - 创建 src/utils/api.ts（替代 supabase.ts）
    - 实现 submitAssessment() 函数
    - 实现 getCohortStatistics() 函数
    - 实现 getRecentAssessments() 函数
    - 实现 getAssessmentDistribution() 函数
    - 使用 fetch API 调用后端端点
    - _需求: 7.1, 7.2, 7.3, 7.4_

  - [x] 11.2 更新前端组件
    - 修改 src/pages/Result.tsx 使用新 API
    - 修改 src/pages/Statistics.tsx 使用新 API
    - 更新错误处理显示用户友好消息
    - _需求: 7.6_

  - [x] 11.3 移除 Supabase 依赖
    - 从 package.json 移除 @supabase/supabase-js
    - 删除 src/utils/supabase.ts
    - 删除 src/utils/constants.ts 中的 Supabase 配置
    - _需求: 7.5_

  - [ ]* 11.4 编写前端集成测试
    - 测试所有 API 调用使用正确端点
    - 测试错误处理显示友好消息
    - 测试数据接口保持一致
    - _需求: 7.1, 7.2, 7.3, 7.4, 7.6, 7.7_

- [ ] 12. 配置环境变量
  - [x] 12.1 创建后端环境配置
    - 创建 server/.env.example
    - 记录 DATABASE_URL, PORT, NODE_ENV
    - 更新 server/src/config/database.ts 读取环境变量
    - _需求: 8.1, 8.2, 8.3_

  - [x] 12.2 更新前端环境配置
    - 更新 ai-assessment-app/.env.example
    - 添加 VITE_API_URL 变量
    - 移除 Supabase 相关变量
    - _需求: 8.4, 8.5_

- [ ] 13. 配置构建和部署
  - [x] 13.1 更新 package.json
    - 在根 package.json 添加 engines 字段（Node.js 18+）
    - 添加构建脚本: build:frontend, build:backend, build
    - 添加启动脚本: start
    - _需求: 9.5_

  - [x] 13.2 创建 Railway 配置
    - 创建 railway.json 或 Procfile
    - 指定构建命令: npm run build
    - 指定启动命令: npm start
    - _需求: 9.1_

  - [x] 13.3 编写部署文档
    - 创建 RAILWAY_DEPLOYMENT.md
    - 记录 Railway 项目创建步骤
    - 记录数据库服务配置步骤
    - 记录环境变量设置
    - 记录迁移脚本执行方法
    - 提供故障排查指南
    - _需求: 8.6, 9.4_

- [ ] 14. 实现向后兼容支持（可选）
  - [x] 14.1 添加双后端支持
    - 在前端添加 VITE_USE_RAILWAY 环境变量
    - 修改 API 客户端根据标志选择后端
    - 保留 Supabase 客户端代码（标记为已弃用）
    - _需求: 12.5_

  - [ ]* 14.2 测试双后端切换
    - 测试 Railway 后端模式
    - 测试 Supabase 后端模式
    - 验证功能一致性
    - _需求: 12.5_

- [ ] 15. 最终验证和测试
  - [x] 15.1 运行完整测试套件
    - 运行所有单元测试
    - 运行所有属性测试（每个至少 100 次迭代）
    - 运行所有集成测试
    - 确保测试覆盖率达到 80%+

  - [x] 15.2 手动功能测试
    - 测试完整的测评提交流程
    - 测试统计页面数据显示
    - 测试错误场景（无效输入、网络错误）
    - 测试限流保护
    - 验证所有功能与 Supabase 版本一致
    - _需求: 12.1, 12.2, 12.3_

  - [x] 15.3 创建迁移验证清单
    - 创建 MIGRATION_CHECKLIST.md
    - 列出所有需要验证的功能点
    - 提供测试步骤和预期结果
    - _需求: 12.4_

- [x] 16. 最终检查点
  - 确保所有测试通过
  - 确保文档完整
  - 准备部署到 Railway
  - 如有问题请询问用户

## 注意事项

- 标记 `*` 的任务是可选的，可以跳过以加快 MVP 开发
- 每个任务都引用了具体的需求以便追溯
- 检查点任务确保增量验证
- 属性测试验证通用正确性属性
- 单元测试验证特定示例和边缘情况
