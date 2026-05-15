# 实现笔记

## 内容转化来源

基于 deep-research-report.md 中的自我共情、状态觉察、微习惯养成和优先级决策内容进行模块化设计。

## 信息架构

```
首页
├── 开始今日探索 → 共情小屋
├── 继续上次进度 → 回顾花园
└── 模块入口
    ├── 共情小屋
    ├── 状态观测台
    ├── 微习惯工坊
    ├── 优先级决策岛
    └── 回顾花园
```

## localStorage 数据结构

```javascript
{
  version: "0.1.0",
  empathyRecords: [
    {
      timestamp: "2026-05-15T10:00:00.000Z",
      situation: "...",
      feelings: ["焦虑", "疲惫"],
      needs: ["休息", "安全感"],
      request: "...",
      selfExpression: "...",
      otherExpression: "..."
    }
  ],
  statusRecords: [
    {
      timestamp: "2026-05-15T10:00:00.000Z",
      energy: 3,
      pressure: 2,
      clarity: 4,
      status: ["疲惫", "有动力"],
      directions: ["工作", "休息"],
      note: "..."
    }
  ],
  habits: [
    {
      id: "...",
      identity: "我是一个会照顾自己的人",
      action: "喝一杯水",
      trigger: "起床后",
      triggerCustom: "",
      reward: "打个勾",
      createdAt: "2026-05-15T10:00:00.000Z",
      isActive: true
    }
  ],
  habitLogs: [
    {
      habitId: "...",
      status: "completed" | "skipped",
      timestamp: "2026-05-15T10:00:00.000Z"
    }
  ],
  priorityRecords: [
    {
      timestamp: "2026-05-15T10:00:00.000Z",
      task: "完成季度报告",
      answers: { q1: "yes", q2: "no", q3: "no", q4: "yes", q5: "打开文档写一行" },
      result: {
        category: "TODAY",
        minStep: "打开文档写一行",
        timeBlock: "15-25分钟",
        reminder: "先开始，就已经迈出了第一步。"
      }
    }
  ],
  meta: {
    createdAt: "2026-05-15T10:00:00.000Z",
    updatedAt: "2026-05-15T10:00:00.000Z"
  }
}
```

## 核心交互流程

### 共情小屋流程
1. 描述发生的事情
2. 选择感受（多选）
3. 选择需要（多选）
4. 写出请求
5. 选择表达对象和语气
6. 生成表达

### 五道门决策流程
1. 这件事真的需要做吗？ → 决定继续或删除
2. 能不能删除？ → 进一步确认
3. 能不能简化/委托/推迟？ → 找到简化方案
4. 现在做是否比其他事情更重要？ → 决定优先级
5. 最小下一步是什么？ → 得出具体行动

## 当前 MVP 限制

- 仅支持单用户本地使用
- 无多语言支持
- 无数据备份到云端
- 无同步功能
- 无密码保护

## 后续可迭代方向

1. **数据安全**: 添加密码锁定和加密存储
2. **数据可视化**: 添加状态趋势图、习惯完成率图表
3. **提醒系统**: 定时提醒记录状态或完成习惯
4. **个性化**: 支持自定义情绪词表和需求词表
5. **导出增强**: 支持导出为 PDF、图片等格式
6. **主题定制**: 支持浅色/深色主题切换
