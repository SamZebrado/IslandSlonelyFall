# 慢慢倒 (IslandSlowlyFall)

Help get you back on feet.

慢慢倒是一个本地优先的日常记录与低能量决策工具，用来记录时间、觉察状态，并在事情太多或不想动的时候，帮你找到下一小步。

## 项目是什么

**慢慢倒**是一个纯前端的本地网页应用，帮助你：

- **觉察状态** - 通过1-9分评分系统，觉察健康、工作、娱乐、爱四大维度的当下状态
- **梳理情绪** - 通过共情小屋，用非暴力沟通的方式觉察自己的感受
- **记录状态** - 通过状态观测台，了解今天的能量和压力
- **养成习惯** - 通过微习惯工坊，把大目标缩小到今天能做的最小一步
- **做决策** - 通过优先级决策岛，用五道门找到最合适的行动
- **回顾整理** - 通过回顾花园，看看自己走过了什么路

## 当前已实现内容

### 核心模块

- **今日评分** - 基于人生设计课的健康/工作/娱乐/爱四维评分系统
- **共情小屋** - 非暴力沟通(NVC)框架的情绪觉察
- **状态观测台** - 能量与压力记录
- **微习惯工坊** - 原子习惯理念的游戏化实践
- **优先级决策岛** - 五道门决策模型（放下/简化/求助/稍后/专注）
- **回顾花园** - 按时间分组的记录回顾
- **原创BGM** - 轻柔的钢琴背景音乐

### 技术特性

- 纯前端架构（HTML/CSS/JavaScript）
- localStorage 数据本地持久化
- 中英双语支持
- 多标签页状态同步感知
- 无障碍支持（prefers-reduced-motion、键盘导航）
- 响应式设计（支持移动端）

## 本地运行方式

### 方式一：直接打开

直接在浏览器中打开 `index.html` 文件。

### 方式二：本地静态服务器

```bash
# 使用 Python
python -m http.server 5173

# 或使用 npx（需要 Node.js）
npx serve .
```

然后在浏览器中打开：`http://localhost:5173`

## 数据与隐私

**重要：本应用是纯本地应用**

- 所有数据默认保存在浏览器 localStorage 中
- **无后端服务器**
- **无账号系统**
- **无云端同步**
- 清空浏览器缓存/数据会导致本地记录丢失
- 换浏览器或换设备不会自动同步数据

### 数据备份

支持导出/导入 JSON 备份：
1. 进入"回顾花园"
2. 点击"导出 JSON"保存备份文件
3. 需要恢复时，点击"导入 JSON"

## 项目状态

- **当前阶段**：prototype complete
- **这是可运行的本地原型**，不是完整商业产品

## 技术栈

- HTML5 + CSS3 + JavaScript (ES6+)
- 无框架依赖
- Web Audio API（BGM）
- Playwright（自动化测试）

## 目录结构

```
├── index.html          # 入口页面
├── css/
│   └── style.css      # 样式
├── js/
│   ├── app.js         # 主应用逻辑
│   ├── storage.js     # 数据存储层
│   ├── empathy.js     # 共情模块
│   ├── habits.js      # 习惯模块
│   ├── priority.js    # 优先级决策
│   ├── review.js      # 回顾模块
│   ├── rating.js      # 评分模块
│   ├── dashboard.js   # 状态观测台
│   ├── i18n.js        # 国际化
│   ├── audioController.js  # 音频控制
│   └── expressionTuner.js # 表达调音台
├── assets/
│   └── audio/         # BGM音频文件
├── tests/             # Playwright测试
└── docs/              # 开发文档
```

## 参考资料

慢慢倒的设计理念来源于以下经典方法论：

### 非暴力沟通 (Nonviolent Communication)
- **来源**：[CNVC - Center for Nonviolent Communication](https://www.cnvc.org/)
- **应用**：共情小屋的四步框架（观察→感受→需要→请求）
- 共情小屋帮助用户区分事实与评价，觉察感受与需要，提出温和具体的请求

### 原子习惯 (Atomic Habits)
- **来源**：[Atomic Habits by James Clear](https://jamesclear.com/atomic-habits)
- **应用**：微习惯工坊的"两分钟规则"与身份认同设计
- 将大目标缩小到两分钟内可完成的最小动作，建立"我是这样的人"的身份认同

### 人生设计课 (Designing Your Life)
- **来源**：[Designing Your Life by Bill Burnett & Dave Evans](https://designingyour.life/)
- **应用**：今日评分系统的四维健康观
- 健康(Health)、工作(Work)、娱乐(Play)、爱(Love)的全方位觉察

### 五道门决策模型 (Five Gates Decision)
- **来源**：结合《时间管理的奇迹》中的聚焦漏斗模型与多个决策理论
- **应用**：优先级决策岛的决策流程
- 通过五道门的筛选（必须做？值得做？能做吗？何时做？真正想做吗？），找到最合适的行动

## 相关文档

- [用户使用指南](USER_GUIDE.md) - 如何使用各个模块
- [帮助文档](HELP.md) - 常见问题解答
- [更新日志](CHANGELOG.md) - 版本历史

## License

MIT License - 详见 [LICENSE](LICENSE) 文件
