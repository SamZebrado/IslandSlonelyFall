# 慢慢倒 (IslandSlowlyFall)

🌐 **在线访问**: https://samzebrado.github.io/IslandSlonelyFall/

---

## 📝 项目简介

**慢慢倒**是一个本地优先的日常记录与低能量决策工具，用来记录时间、觉察状态，并在事情太多或不想动的时候，帮你找到下一小步。

**IslandSlowlyFall** is a local-first daily reflection and low-energy decision-making tool. It helps you track your time, notice your state, and find the next tiny step forward when you have too many things to do or don't feel like doing anything.

### What it helps you with:

- **今日评分** - 通过1-9分评分系统，觉察健康、工作、娱乐、爱四大维度
- **共情小屋** - 用非暴力沟通的方式觉察自己的感受，还有拖延后专用入口
- **状态观测台** - 了解今天的能量和压力
- **微习惯工坊** - 把大目标缩小到今天能做的最小一步，还有学生常用模板
- **优先级决策岛** - 用五道门帮你找到最合适的行动
- **回顾花园** - 看看自己走过的路

---

## 🚀 Quick Start

### 方式一：在线使用

直接访问：https://samzebrado.github.io/IslandSlonelyFall/

### 方式二：本地运行

#### 方法1：直接打开

用浏览器打开 `index.html` 文件。

#### 方法2：本地服务器

```bash
# 使用 Python
python -m http.server 5173

# 或使用 Node.js
npx serve .
```

然后访问：`http://localhost:5173`

---

## 🎯 核心功能

### 首页快捷入口

首页有四个快速入口：
- 📊 **今日评分** - 觉察状态评分
- 🌱 **我不想动** - 直接给你一个3分钟任务
- ⚡ **事情太多** - 优先级决策
- 🌊 **有点乱** - 共情整理

### 今日评分 (Daily Rating)

基于《人生设计课》的四维评分：
- 📊 健康
- 💼 工作
- 🎮 娱乐
- ❤️ 爱

每个子项可以1-9分评分，保存后可以查看历史记录。

### 共情小屋 (Empathy House)

- 📝 记录你的状态，有专门的拖延后入口：
  - 我又拖了，很烦自己
  - 我怕做不好
  - 我不知道从哪开始
  - 已经晚了，更不想做
  - 觉得别人都比我强

### 微习惯工坊 (Micro-habit Workshop)

- 学生常用模板：
  - 期末复习
  - 论文拖延
  - 背单词
  - 收拾桌子
  - 喝水
  - 轻微运动

### 优先级决策岛 (Priority Decision Island)

- 五道门决策模型，帮你筛选任务
- 找到最适合现在做的那一件

---

## 📦 数据与隐私

**重要：本应用是纯本地应用**

- 所有数据默认保存在浏览器 localStorage 中
- 无后端服务器
- 无账号系统
- 无云端同步
- 定期导出备份很重要！

**数据备份：
- 可以导出/导入 JSON 备份

---

## 📚 参考资料

慢慢倒的设计理念来源于以下经典方法论：

### 非暴力沟通 (Nonviolent Communication)
- **来源**：[CNVC](https://www.cnvc.org/)
- **应用**：共情小屋的四步框架
- 观察→感受→需要→请求

### 原子习惯 (Atomic Habits)
- **来源**：[Atomic Habits by James Clear](https://jamesclear.com/atomic-habits)
- **应用**：微习惯工坊
- 两分钟规则，身份认同

### 人生设计课 (Designing Your Life)
- **来源**：[Designing Your Life by Bill Burnett & Dave Evans](https://designingyour.life/)
- **应用**：今日评分
- 健康、工作、娱乐、爱

### 五道门决策模型
- **来源**：《时间管理的奇迹》聚焦漏斗模型等
- **应用**：优先级决策岛

---

## 🛠️ 技术栈

- HTML5 + CSS3 + JavaScript (ES6+)
- 纯前端，无框架依赖
- Web Audio API（BGM）
- Playwright（自动化测试）

---

## 📂 项目状态

当前阶段：prototype complete

这是一个可运行的本地原型，不是完整商业产品。

---

## 📄 License

MIT License - 详见 [LICENSE](LICENSE)
