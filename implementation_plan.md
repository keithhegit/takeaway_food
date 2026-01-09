# 外卖势力大富翁 (Food Delivery Monopoly) - 实施计划

## 1. 项目初始化与架构
- [x] 使用 Vite + React 初始化项目
- [ ] 配置基础 CSS 变量 (Neon/Dark Theme)
- [ ] 安装必要依赖 (`lucide-react` 用于图标, `clsx` 用于类名管理)

## 2. 数据模型设计 (Data Modeling)
- **GameState**:
  - `players`: 数组，包含 4 名玩家的状态 (金钱, 电量, 拥有店铺, 位置, 暂停状态, 阵营信息).
  - `mapNodes`: 40 个格子的数据结构 (类型, 连接关系, 坐标).
  - `shops`: 10 个随机抽取的店铺信息 (名称, 价格, 分类).
  - `turn`: 当前回合数, 当前行动玩家索引.
  - `phase`: 游戏阶段 (ROLLING, MOVING, EVENT, DECISION, END_TURN).
- **Factions**: 定义 4 大势力的基础属性与技能回调函数.
- **Events**: 定义命运卡牌和特殊格子效果.

## 3. 核心游戏引擎 (Game Engine)
- **MapGenerator**: 生成 40 个节点的图结构，确保连通性与格子类型分布.
- **MovementSystem**:
  - Dijkstra/BFS 算法计算移动步数 (针对图结构).
  - 处理电量消耗与【应急充电机制】.
- **ActionSystem**:
  - 掷骰子逻辑.
  - 购买店铺逻辑.
  - 技能触发判定 (Passive & Active).

## 4. UI 组件开发
- **Layout**: 沉浸式全屏布局.
- **GameBoard**:
  - 使用 SVG 绘制连接线.
  - 使用 `div` 渲染节点 (不同类型不同样式).
  - 玩家 Token 动画渲染.
- **ControlPanel**:
  - 玩家状态面板 (HUD).
  - 操作按钮 (掷骰子, 购买 +1 步, 购买店铺确认).
- **EventModal**:
  - 显示命运卡详情.
  - 显示店铺购买界面.
  - 胜利/失败结算.

## 5. 视觉与体验 (UX/UI)
- 采用 **Glassmorphism** (毛玻璃) 风格.
- 动态光效表示 "当前玩家".
- 响应式布局适配桌面端.

## 6. 测试与平衡
- 模拟 4 人对局流程，验证规则边界条件 (如电量耗尽重置).
