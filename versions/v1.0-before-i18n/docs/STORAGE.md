# 数据存储说明

本文档介绍本地指南的数据存储机制和技术细节。

## 概述

本地指南使用浏览器 **localStorage** 作为唯一的数据存储方式，没有后端服务器。

## 存储结构

### 主存储

所有数据保存在 `localGuideGameState` 键下，结构如下：

```json
{
  "schemaVersion": 2,
  "appVersion": "1.0.0",
  "meta": {
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "empathyRecords": [...],
  "statusRecords": [...],
  "habits": [...],
  "habitLogs": [...],
  "priorityRecords": [...]
}
```

### 备份存储

最近一次备份保存在 `localGuideGameBackup` 键下。

### 临时存储

导入操作时使用 `localGuideGameTempBackup` 键确保导入失败时能回滚。

## 数据类型

### empathyRecords

共情记录，结构：

```json
{
  "id": "uuid-string",
  "timestamp": "ISO-date-string",
  "situation": "情境描述",
  "feelings": ["感受1", "感受2"],
  "needs": ["需求1", "需求2"],
  "selfExpression": "自我共情表达"
}
```

### statusRecords

状态记录，结构：

```json
{
  "id": "uuid-string",
  "timestamp": "ISO-date-string",
  "energy": 5,
  "pressure": 5,
  "note": "备注"
}
```

### habits

习惯列表，结构：

```json
{
  "id": "uuid-string",
  "timestamp": "ISO-date-string",
  "action": "习惯描述",
  "frequency": "daily|weekly",
  "status": "active|paused|archived"
}
```

### habitLogs

习惯日志，结构：

```json
{
  "id": "uuid-string",
  "timestamp": "ISO-date-string",
  "habitId": "habit-uuid",
  "status": "done|skip|partial",
  "note": "备注"
}
```

### priorityRecords

优先级记录，结构：

```json
{
  "id": "uuid-string",
  "timestamp": "ISO-date-string",
  "task": "任务描述",
  "gatePath": [
    { "gateId": "release", "answer": "keep", "gateName": "放下门" }
  ],
  "result": {
    "category": "DELETE|DEFER|SIMPLIFY|DELEGATE|TODAY|NOW",
    "minStep": "最小步骤",
    "timeBlock": "时间块"
  },
  "decision": {}
}
```

## 存储机制

### Schema 版本管理

- 当前版本：2
- 每次加载数据时通过 `normalizeState()` 规范化
- 支持未来版本迁移

### 数据规范化

`normalizeRecord()` 函数确保：
- 所有记录都有 `id` 和 `timestamp`
- 缺失字段补默认值
- 类型错误转换为正确类型
- 非法字段被忽略
- 坏记录返回 `null` 而非崩溃

### 备份与恢复

1. **自动备份**：每次保存前自动创建备份
2. **自动恢复**：主数据损坏时自动从备份恢复
3. **导入回滚**：导入前创建临时备份，失败时自动回滚

### 多标签页同步

使用 `storage` 事件监听跨标签页更新：

```javascript
window.addEventListener('storage', (event) => {
  if (event.key === 'localGuideGameState') {
    // 检测到外部更新
  }
});
```

## 风险说明

### localStorage 限制

- 容量：约 5-10MB（因浏览器而异）
- 同步：读写是同步操作，可能阻塞UI
- 过期：除非手动清除，否则永不过期

### 数据安全风险

- **清缓存丢失**：清空浏览器数据会删除localStorage
- **隐私模式不可用**：大多数隐私模式禁用localStorage
- **跨域隔离**：无法从其他域名访问
- **无加密**：数据以明文存储

### 多标签页冲突

- 后写入的标签页会覆盖先前的修改
- 没有冲突合并机制
- 建议使用单标签页

## 导出与导入

### 导出

导出完整JSON格式的备份文件，包含所有记录。

### 导入

1. 导入前校验JSON格式
2. 导入失败时回滚到导入前状态
3. 不污染现有数据

### 格式兼容性

当前版本 (schemaVersion=2)：
- 导入旧版本数据会自动规范化
- 无法导出为旧版本格式

## 错误处理

| 错误类型 | 处理方式 |
|---------|---------|
| JSON解析失败 | 尝试从备份恢复 |
| 数据结构损坏 | normalize隔离坏记录 |
| 导入格式错误 | 返回错误，不修改数据 |
| 容量超限 | 抛出异常，不保存 |

## 未来可能改进

- 历史版本备份（多条）
- 更丰富的导出格式（CSV等）
- 云端备份选项（可选）
- 数据迁移工具
