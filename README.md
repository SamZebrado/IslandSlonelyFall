# 本地指南

一个自助觉察工具，帮助你梳理情绪、养成微习惯、做出优先级决策、回顾走过的路。

## 项目是什么

**本地指南**是一个纯前端的本地网页应用，帮助你：

- **梳理情绪** - 通过共情小屋，用非暴力沟通的方式觉察自己的感受
- **记录状态** - 通过状态观测台，了解今天的能量和压力
- **养成习惯** - 通过微习惯工坊，把大目标缩小到今天能做的最小一步
- **做决策** - 通过优先级决策岛，用五道门找到最合适的行动
- **回顾整理** - 通过回顾花园，看看自己走过了什么路

## 当前已实现内容

### 核心模块

- **共情小屋** - 非暴力沟通(NVC)框架的情绪觉察
- **状态观测台** - 能量与压力记录
- **微习惯工坊** - 原子习惯理念的游戏化实践
- **优先级决策岛** - 五道门决策模型（放下/简化/求助/稍后/专注）
- **回顾花园** - 按时间分组的记录回顾
- **原创BGM** - 轻柔的钢琴背景音乐

### 技术特性

- 纯前端架构（HTML/CSS/JavaScript）
- localStorage 数据本地持久化
- 多标签页状态同步感知
- 无障碍支持（prefers-reduced-motion、键盘导航）
- 响应式设计（支持移动端）

## 本地运行方式

### 方式一：直接打开（简单但不推荐BGM）

1. 直接在浏览器中打开 `index.html` 文件

### 方式二：本地静态服务器（推荐）

使用任意静态服务器：

```bash
# 使用 Python
cd local-guide-game
python -m http.server 5173

# 或使用 npx（需要 Node.js）
npx serve .

# 或使用 VS Code Live Server 扩展
```

然后在浏览器中打开：`http://localhost:5173`

### 方式三：Vite 开发服务器

如果项目中有 Vite 配置：

```bash
npm install
npm run dev
```

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

## 当前边界 / 已知限制

- 仅限本地浏览器使用
- localStorage 有容量限制（约 5-10MB）
- 多设备之间不会自动同步
- 不保证跨浏览器自动迁移数据
- 不保证所有浏览器行为完全一致

## 项目状态

- **当前阶段**：P2 frozen / prototype complete
- **测试覆盖**：107/107 自动测试通过
- **这是可运行的本地原型**，不是完整商业产品

## 技术栈

- HTML5 + CSS3 + JavaScript (ES6+)
- 无框架依赖
- Web Audio API（BGM）
- Playwright（自动化测试）

## 目录结构

```
local-guide-game/
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
│   ├── audioController.js  # 音频控制
│   └── expressionTuner.js # 表达调音台
├── assets/
│   └── audio/         # BGM音频文件
├── tests/             # Playwright测试
└── docs/              # 开发文档
```

## 相关文档

- [用户使用指南](USER_GUIDE.md) - 如何使用各个模块
- [帮助文档](HELP.md) - 常见问题解答
- [更新日志](CHANGELOG.md) - 版本历史
- [数据存储说明](docs/STORAGE.md) - 技术细节
- [开发文档](docs/implementation_notes.md) - 实现笔记

## 致谢

- [非暴力沟通 (NVC)](https://www.cnvc.org/) - 共情小屋的理论基础
- [原子习惯](https://jamesclear.com/atomic-habits) - 微习惯工坊的理念来源
