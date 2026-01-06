# 清空数据功能

## 🗑️ 功能说明 (2026-01-06 18:45)

### ✅ 新增功能

为统计页面添加了"清空数据"功能，允许管理员一键删除指定班级的所有测评数据。

### 🎯 功能特点

1. **一键清空**
   - 删除指定班级（cohort）的所有测评记录
   - 支持数据初始化，方便重新开始测评

2. **安全确认**
   - 双重确认机制，防止误操作
   - 显示将要删除的记录数量
   - 明确警告"此操作不可恢复"

3. **实时反馈**
   - 删除过程显示加载动画
   - 删除完成后自动刷新统计数据
   - 错误处理和友好提示

---

## 🎨 用户界面

### 清空数据按钮

位置：统计页面右上角，标题旁边

```
┌─────────────────────────────────────────┐
│ 群体数据统计              [🗑️ 清空数据] │
│ 班级: default | 样本数: 2               │
└─────────────────────────────────────────┘
```

样式：
- 红色背景 (#DC2626)
- 白色文字
- 垃圾桶图标
- 悬停时变深红色

### 确认对话框

点击"清空数据"按钮后弹出：

```
┌─────────────────────────────────────┐
│          🗑️                         │
│                                     │
│      确认清空数据                    │
│                                     │
│  此操作将删除班级 "default" 的       │
│  所有测评数据（共 2 条记录）。        │
│                                     │
│  ⚠️ 此操作不可恢复！                 │
│                                     │
│  [  取消  ]  [  确认删除  ]         │
└─────────────────────────────────────┘
```

特点：
- 居中显示的模态对话框
- 半透明黑色背景遮罩
- 显示班级名称和记录数量
- 红色警告文字
- 两个操作按钮（取消/确认）

---

## 🔧 技术实现

### 后端 API

**新增端点：**
```
DELETE /api/assessments/:cohort
```

**功能：**
- 删除指定 cohort 的所有测评记录
- 返回删除的记录数量

**请求示例：**
```bash
curl -X DELETE https://aitest.kehr.work/api/assessments/default
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "deleted_count": 2,
    "cohort": "default"
  }
}
```

**SQL 查询：**
```sql
DELETE FROM ai_assessments
WHERE cohort = $1
RETURNING id
```

### 前端实现

**1. API 客户端函数**

```typescript
export async function deleteAllAssessments(cohort: string = 'default') {
  const response = await fetch(
    `${API_BASE_URL}/api/assessments/${cohort}`,
    { method: 'DELETE' }
  );
  
  const result = await response.json();
  return result.data;
}
```

**2. React 状态管理**

```typescript
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
const [isDeleting, setIsDeleting] = useState(false);
```

**3. 删除处理函数**

```typescript
const handleDeleteAll = async () => {
  setIsDeleting(true);
  try {
    const result = await deleteAllAssessments(selectedCohort);
    console.log(`成功删除 ${result?.deleted_count || 0} 条记录`);
    
    setShowDeleteConfirm(false);
    await loadStatistics(); // 重新加载数据
  } catch (err) {
    setError('删除数据失败，请稍后重试');
  } finally {
    setIsDeleting(false);
  }
};
```

---

## 📦 修改的文件

### 后端
1. **`ai-assessment-app/server/src/controllers/assessmentController.ts`**
   - 新增 `deleteAllAssessments` 函数

2. **`ai-assessment-app/server/src/routes/assessments.ts`**
   - 新增 DELETE 路由

### 前端
1. **`ai-assessment-app/src/utils/api.ts`**
   - 新增 `deleteAllAssessments` 函数

2. **`ai-assessment-app/src/pages/Statistics.tsx`**
   - 导入 Trash2 图标
   - 添加状态管理
   - 添加删除处理函数
   - 添加清空数据按钮
   - 添加确认对话框 UI

---

## 🚀 使用流程

### 管理员操作步骤

1. **访问统计页面**
   ```
   https://aitest.kehr.work/stats.html
   ```

2. **点击"清空数据"按钮**
   - 位于页面右上角
   - 红色按钮，带垃圾桶图标

3. **确认删除**
   - 阅读确认对话框中的信息
   - 确认班级名称和记录数量
   - 点击"确认删除"按钮

4. **等待处理**
   - 按钮显示"删除中..."和加载动画
   - 通常在 1-2 秒内完成

5. **查看结果**
   - 对话框自动关闭
   - 页面自动刷新
   - 统计数据显示为空或初始状态

---

## 🔒 安全考虑

### 防止误操作

1. **双重确认**
   - 需要点击两次才能删除
   - 第一次：点击"清空数据"按钮
   - 第二次：点击确认对话框中的"确认删除"

2. **明确警告**
   - 红色警告文字："⚠️ 此操作不可恢复！"
   - 显示将要删除的记录数量
   - 显示班级名称

3. **取消选项**
   - 提供"取消"按钮
   - 点击对话框外部不会关闭（需要明确点击取消）

### 权限控制建议

目前该功能对所有访问统计页面的用户开放。如果需要限制权限，可以考虑：

1. **添加身份验证**
   - 要求管理员登录
   - 使用 JWT 或 Session 验证

2. **添加 API 密钥**
   - 在请求头中添加 API 密钥
   - 后端验证密钥有效性

3. **IP 白名单**
   - 限制只有特定 IP 可以访问删除端点

---

## 📊 使用场景

### 适用情况

1. **新学期开始**
   - 清空上学期的测评数据
   - 为新学期准备干净的数据环境

2. **测试阶段**
   - 清除测试数据
   - 准备正式使用

3. **数据重置**
   - 发现数据错误需要重新收集
   - 重新开始测评活动

4. **班级切换**
   - 清空当前班级数据
   - 为新班级准备环境

### 不适用情况

1. **数据备份**
   - 删除前应先导出 CSV 备份
   - 使用"导出CSV"功能保存数据

2. **部分删除**
   - 该功能删除所有数据
   - 如需删除特定记录，需要其他方式

---

## ⚠️ 注意事项

### 重要提醒

1. **不可恢复**
   - 删除的数据无法恢复
   - 删除前务必确认

2. **建议备份**
   - 删除前先导出 CSV
   - 保存重要数据

3. **影响范围**
   - 只删除指定班级（cohort）的数据
   - 不影响其他班级的数据

4. **统计更新**
   - 删除后统计数据立即更新
   - 图表和表格会显示为空

---

## 🎯 后续优化建议

### 功能增强

1. **软删除**
   - 添加 `deleted_at` 字段
   - 支持数据恢复功能

2. **批量操作**
   - 支持选择性删除
   - 按日期范围删除

3. **删除日志**
   - 记录删除操作
   - 包含操作人、时间、数量

4. **权限管理**
   - 添加管理员角色
   - 限制删除权限

### UI 改进

1. **删除动画**
   - 添加删除成功的动画效果
   - 提供更好的视觉反馈

2. **撤销功能**
   - 删除后 5 秒内可撤销
   - 类似 Gmail 的撤销发送

3. **删除预览**
   - 显示将要删除的记录列表
   - 让用户更清楚删除内容

---

## 📝 提交信息

**提交:** `51f1c87` - "Add clear data functionality with confirmation dialog"

**修改文件:**
- `ai-assessment-app/server/src/controllers/assessmentController.ts`
- `ai-assessment-app/server/src/routes/assessments.ts`
- `ai-assessment-app/src/utils/api.ts`
- `ai-assessment-app/src/pages/Statistics.tsx`

**状态:** ✅ 已推送到 GitHub，Railway 正在自动部署

---

## ✅ 验证步骤

部署完成后（约 3-5 分钟），请执行以下验证：

1. **访问统计页面**
   ```
   https://aitest.kehr.work/stats.html
   ```

2. **检查按钮显示**
   - 右上角应该显示红色的"清空数据"按钮
   - 按钮带有垃圾桶图标

3. **测试确认对话框**
   - 点击"清空数据"按钮
   - 应该弹出确认对话框
   - 对话框显示班级名称和记录数量

4. **测试取消功能**
   - 点击"取消"按钮
   - 对话框应该关闭
   - 数据不应该被删除

5. **测试删除功能**
   - 再次点击"清空数据"
   - 点击"确认删除"
   - 等待删除完成
   - 页面应该自动刷新
   - 统计数据应该显示为空

6. **测试 API 端点**
   ```bash
   curl -X DELETE https://aitest.kehr.work/api/assessments/default
   ```

---

## 🎉 完成

清空数据功能已成功添加到统计页面，提供了安全、便捷的数据管理能力！
