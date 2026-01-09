# 任务列表

- [ ] **初始化**
  - [x] 创建 Vite React 项目
  - [ ] 安装依赖 (`lucide-react`, `clsx`, `lodash`)
  - [ ] 清理默认样板代码，创建基础目录结构

- [ ] **核心逻辑 - 数据层**
  - [ ] 创建 `src/constants/rules.js`: 定义常量 (初始资源, 胜利条件)
  - [ ] 创建 `src/data/factions.js`: 实现 4 大势力配置
  - [ ] 创建 `src/data/shops.js`: 店铺池数据
  - [ ] 创建 `src/data/fateEvents.js`: 16 个命运事件

- [ ] **核心逻辑 - 引擎层**
  - [ ] 实现 `MapGenerator.js`: 生成 40 格地图图结构
  - [ ] 实现 `GameContext.jsx`: 全局状态管理 (Reducer 模式)
  - [ ] 实现 `MovementLogic.js`: 移动算法、电量扣除、应急充电检测

- [ ] **UI 组件 - 基础**
  - [ ] `App.css`: 定义 Neon Dark 主题变量
  - [ ] `Button.jsx`, `Card.jsx`: 通用 UI 组件

- [ ] **UI 组件 - 游戏板**
  - [ ] `MapNode.jsx`: 单个格子渲染 (包含类型图标)
  - [ ] `ConnectionLine.jsx`: 格子连线 SVG
  - [ ] `GameBoard.jsx`: 整合地图渲染
  - [ ] `PlayerToken.jsx`: 玩家棋子

- [ ] **UI 组件 - 交互面板**
  - [ ] `PlayerHUD.jsx`: 显示 4 玩家状态 (高亮当前玩家)
  - [ ] `ActionPanel.jsx`: 掷骰子、技能释放、购买移动步数
  - [ ] `LogPanel.jsx`: 游戏记录显示

- [ ] **交互流程实现**
  - [ ] 回合开始逻辑 (电量检查)
  - [ ] 掷骰子与通过路径选择
  - [ ] 落点事件触发 (店铺购买, 命运卡, 充电/扣费)
  - [ ] 胜利条件检测

- [ ] **视觉打磨**
  - [ ] 添加 CSS 动画 (移动、骰子滚动)
  - [ ] 优化毛玻璃效果与配色
