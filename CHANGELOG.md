# 更新日志

## P2 Frozen (2026-05-15)

### 新增
- **文档**：完整的用户文档体系
  - README.md：项目说明
  - USER_GUIDE.md：用户使用指南
  - HELP.md：常见问题解答
  - STORAGE.md：数据存储说明

### 改进
- **数据可靠性**
  - 统一存储层（schema version, normalize）
  - 备份恢复机制
  - 导入失败保护
  - 多标签页状态同步感知
- **展示增强**
  - 首页地点卡片设计
  - 下一站导航引导
  - 回顾花园时间线分组
  - 柔和反馈UI
- **无障碍**
  - prefers-reduced-motion 支持
  - focus-visible 键盘导航

---

## P2B (2026-05-15)

### 新增
- 首页地点卡片设计（place-card）
- 下一站导航引导（next-stop）
- 回顾花园时间线分组

### 改进
- 首页从"模块卡片"改为"地点卡片"
- 副标题改为"带你慢慢走，每一步都是探索"
- 回顾花园按时间分组（今天/昨天/近三天/更早）

---

## P2A (2026-05-15)

### 新增
- 统一存储层（storage.js）
- Schema version 管理
- 数据规范化（normalizeRecord）
- 备份与恢复机制
- 导入失败保护
- 多标签页监听

### 文档
- P2A_TAIL_REPORT.md

---

## P1.6 (2026-05-15)

### 新增
- prefers-reduced-motion 支持
- focus-visible 键盘样式

### 文档
- P1_FINAL_SCOPE.md

---

## P1.5 (2026-05-15)

### 改进
- 五道门视觉层次增强
- pending/active/completed 状态样式区分
- gate-card 动画和入场效果
- result 区域样式增强
- record-item 展示效果

---

## P1.4 (2026-05-15)

### 新增
- 优先级决策岛（优先级决策岛）
- 五道门决策模型
  - 放下门
  - 简化门
  - 求助门
  - 稍后门
  - 专注门
- derivePriorityDecision 决策函数
- test_priority_gates.py 测试

---

## P1.3 (2026-05-15)

### 新增
- 微习惯工坊
- 种子/点灯视觉反馈
- 习惯追踪统计
- test_habit_gamefeel.py 游戏化测试

---

## P1.2 (2026-05-15)

### 新增
- 原创BGM背景音乐
- 表达调音台
- test_expression_tuner.py 测试
- test_audio.py 音频测试

---

## P1.1 (2026-05-15)

### 新增
- 共情小屋（非暴力沟通框架）
- 状态观测台
- 回顾花园基础版本

---

## P1.0 (2026-05-15)

### 初始版本
- 纯前端应用架构
- localStorage 数据持久化
- Playwright 测试框架
- 基础UI样式
