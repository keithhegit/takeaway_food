# 外卖势力大富翁（H5 竖屏）

一个偏“轻策略 + 运气 + 干扰”的回合制地图棋盘小游戏：玩家在地图节点间移动、经营店铺券、管理电量与资金，并通过命运事件制造变数。项目已做手机竖屏沉浸式适配，适合 Cloudflare Pages 直接托管。

## 玩法综合介绍（尽量详细）

### 1) 胜利条件

- 胜利目标是“集齐指定数量的店铺券（按店铺名称去重）”。
- 开局在设置界面选择胜利目标数量（目前提供 5～10），写入 `victoryTarget`。
- 任意玩家在购买店铺后，若其“不同店铺券数量 ≥ victoryTarget”，立刻获胜（弹出胜利界面）。
  - 判定逻辑：在 [GameContext.jsx](file:///d:/Code/takeaway_food/src/context/GameContext.jsx) 的 `checkVictory` 中用店铺 `name` 去重计数。

### 2) 核心资源：电量与资金

- 电量（power）
  - 用于移动：每走一步都会消耗电量，默认每步消耗 `0.5`。
  - 部分势力会改变每步消耗（例如“国潮外卖”每步消耗 `0.75`）。
  - 电量不足会触发“紧急充电”（见后文）。
- 资金（money）
  - 购买店铺券的主要消耗。
  - 事件、势力被动、特殊规则都会增减资金。

### 3) 地图与格子类型

地图为 40 个节点（双环布局），每个节点有类型与连接边：

- 节点数：`TOTAL_NODES = 40`
- 格子类型数量（默认分配）：
  - 店铺 `shop`: 10
  - 命运 `fate`: 8
  - 充电桩 `charger`: 4
  - 打工点 `money`: 4
  - 医院 `hospital`: 2
  - 普通 `normal`: 12

地图生成逻辑在 [MapGenerator.js](file:///d:/Code/takeaway_food/src/engine/MapGenerator.js)：

- 布局：外环 24 + 内环 16，少量抖动（jitter）避免完全重合。
- 连线：主环按序连接（i -> i+1），并以 0.25 概率添加 3～8 步的“近距离捷径”（单点连接数限制 < 3）。

### 4) 开局流程（Setup）

开局会经历 3 步：

1. 选择胜利所需店铺券数量（5～10）
2. 选择玩家数量（2～4）
3. 逐个玩家选择势力（势力不可重复）

界面与流程在 [SetupScreen.jsx](file:///d:/Code/takeaway_food/src/components/SetupScreen.jsx)。

完成设置后触发 `INIT_GAME`：

- 生成地图 `generateMap()`
- 初始化每位玩家：初始电量/资金/颜色/技能与被动数据来自势力配置 [factions.js](file:///d:/Code/takeaway_food/src/data/factions.js)
- 游戏 phase 从 `SETUP` 进入 `IDLE`

### 5) 回合与阶段（Phase）

游戏通过一个 reducer 状态机驱动，核心阶段如下（字段 `phase`）：

- `SETUP`：开局设置
- `IDLE`：当前玩家可以行动（掷骰 / 发动技能）
- `MOVING`：移动中，玩家需要在地图上点击相邻节点走步数
- `EVENT_HANDLING`：落点触发事件/商店，通常通过弹窗确认后继续

实现位置：[GameContext.jsx](file:///d:/Code/takeaway_food/src/context/GameContext.jsx)

### 6) 掷骰与移动

- 当前玩家在 `IDLE` 时可以掷骰（`ROLL_DICE`），点数范围 1～3。
- 若玩家携带 buff `move_minus_1`，本次掷骰点数会 -1（最低为 1），并在掷骰时移除该 buff。
- 进入 `MOVING` 后，玩家需要在地图上点击可达的相邻节点逐步移动：
  - 地图节点 `connections` 定义了邻接关系
  - `GameBoard` 会高亮可点击邻居节点（绿线/绿圈）

每走一步：

- 电量消耗：默认 `0.5`，也可能被势力被动 `moveCost` 覆盖
- `pendingMove` 减 1
- 记录日志（会显示电量扣除与剩余电量）

移动完成（`pendingMove === 0`）后进入“落点结算”（见下一节）。

### 7) 电量不足与“紧急充电”

在掷骰前，如果电量不足以支付一次移动成本（`power < moveCost`），会触发紧急充电：

- 随机传送到一个充电桩节点
- 扣除 2 元
- 电量直接补到“本势力的充电桩收益值”（例如叮咚 6、饿了么 10）
- 立即结束回合

实现位置：`handleEmergencyCharge` in [GameContext.jsx](file:///d:/Code/takeaway_food/src/context/GameContext.jsx)

### 8) 落点结算：不同节点类型的规则

落点逻辑集中在 `handleLandOnNode` in [GameContext.jsx](file:///d:/Code/takeaway_food/src/context/GameContext.jsx)。

#### A. 店铺（shop）

- 若玩家尚未拥有该店铺券：弹出“店铺弹窗”
  - 玩家可以选择“离开”（不买）或“购买”
  - 价格计算会叠加多种规则：
    - 地图生成时会为每个 shop 赋予一个基础随机价格（3～10）
    - 势力可能额外加价（如国潮 `shopCostExtra: 1`）
    - `discount_2` buff：下次购买 -2（购买时消耗）
    - 叮咚“连续 3 回合不进命运格子，下次购买 -2（最低 3）”：由 `turnsSinceFate` 判断
- 若玩家已拥有该店铺券：简化处理为“光顾自家店铺 +1 元”，直接结束回合

购买后还会检查：

- 美团“甜品/饮品返利”：当购买的店铺类型属于 `dessert/drink` 时，额外 +2；当自己已有 ≥3 张券时变为 +3。
- 胜利判定：购买店铺后立刻检查是否达成胜利。

弹窗 UI： [Modal.jsx](file:///d:/Code/takeaway_food/src/components/Modal.jsx)

#### B. 充电桩（charger）

- 默认：电量增加 `chargerBonus`（不同势力不同）
- 若玩家处于“电池老化（no_charger_5_turns）”状态：本次无法充电，直接结束回合

#### C. 打工点（money）

- 资金增加 `moneyStationBonus`（不同势力不同），然后结束回合

#### D. 医院（hospital）

- 若势力拥有 `hospitalImmunity`：到达医院但免疫（不会被暂停），直接结束回合
- 否则：玩家 `isSkipped = true`，下回合会被跳过

#### E. 命运（fate）

进入命运格子后会随机抽取一个事件（见 [fateEvents.js](file:///d:/Code/takeaway_food/src/data/fateEvents.js)），并弹出“命运弹窗”：

- 事件可能直接改变资源（money/power）
- 事件可能添加 buff（如 `move_minus_1`, `discount_2`, `no_charger_5_turns`）
- 事件可能改变位置（随机/定向传送、交换位置、命运回响等）
- 事件可能产生连锁：关闭弹窗后继续触发新落点（`triggerNext` 为 true 时）

命运结算会将 `turnsSinceFate` 重置为 0（表示“刚进入过命运”）。

### 9) Buff 与冷却

- buff 分两类：
  - 字符串 buff：如 `move_minus_1`、`discount_2`（通常一次性，用完移除）
  - 对象 buff：如 `{ id: 'no_charger_5_turns', label: '电池老化', duration: 6 }`（按回合递减）
- 回合结束时会对“刚行动完的玩家”递减对象 buff 的 `duration`，为 0 则移除。

技能与被动的冷却：

- 主动技能使用后会进入 `skillCooldown`（如国潮 1、饿了么 3）
- 饿了么还有 `highPowerCooldown`，用于其“电量 >10 时 +资金”的被动冷却

### 10) 势力被动（回合周期触发）

不同势力在 [factions.js](file:///d:/Code/takeaway_food/src/data/factions.js) 中配置了被动：

- 周期回复（powerRegen / moneyRegen）
- 充电桩收益（chargerBonus）
- 打工点收益（moneyStationBonus）
- 医院免疫（hospitalImmunity）
- 移动成本覆盖（moveCost）
- 店铺额外价格（shopCostExtra）
- 店铺购买返利（shopBonusTypes / shopBonusAmount / shopBonusBuffCondition）
- 叮咚的“连续不进命运折扣”（shopDiscountCondition）
- 饿了么的“高电量返利”被动（highPowerBonus + cooldown）

触发时机概览（当前实现）：

- 每一“轮”（所有玩家都行动一次）结束时全局回合数 +1
- 轮到某玩家行动前，会按全局回合数检查其周期回复（powerRegen/moneyRegen）
- 行动结束时检查饿了么“高电量返利”并设置冷却

## 策划配置方法（数据驱动入口）

本项目的策划配置主要通过 `src/data` 与 `src/engine` 完成，核心改动点如下：

### 1) 势力配置（新增/改平衡）

文件：[factions.js](file:///d:/Code/takeaway_food/src/data/factions.js)

单个势力对象字段建议理解为：

- `id`: 唯一 id（用于选择与逻辑判断）
- `name`: 显示名（当前也用于玩家名）
- `color`: UI 主色
- `desc`: 玩法定位
- `initialPower` / `initialMoney`: 初始资源
- `skillsList`: 说明用文本（用于选择界面的展示）
- `passives`: 被动集合（哪些字段会被读取以触发逻辑，见 `GameContext.jsx`）
- `activeSkill`（可选）：主动技能定义（由 SidePanel 触发 `USE_SKILL`）

### 2) 命运事件配置（新增事件、增强趣味性）

文件：[fateEvents.js](file:///d:/Code/takeaway_food/src/data/fateEvents.js)

事件数据结构目前支持以下写法组合：

- 通用字段：
  - `id` / `text`
  - `effect`：`{ money?: number, power?: number, buff?: string }`
- 带 `type` 的复杂事件（由 `handleLandOnNode -> fate -> switch(event.type)` 处理）：
  - `choice`：提供 `options: [{ text, effect }]`
  - `teleport_random`：随机传送（当前实现为“非医院”）
  - `teleport_choice`：给定 `targets`，随机传送到这些类型之一
  - `swap_position`：与某玩家交换位置
  - `extra_turn`：获得额外回合
  - `stun_random_enemy`：随机敌方暂停一回合
  - `buy_random_coupon`：支付 `cost` 购买随机未拥有店铺券
  - `lose_power_or_hospital`：扣电，不足则送医院
  - `steal_money` / `catchup_bonus`：经济与追赶机制
  - `retrigger_fate`：传送到另一命运点（并可能产生连锁）

如果你要新增一个全新 `type`，需要：

1. 在 `fateEvents.js` 中添加事件数据
2. 在 `GameContext.jsx` 的命运 switch-case 中实现该 `type` 的处理逻辑
3. 需要连锁触发则将 `type` 加入 `triggerNext` 判断集合

### 3) 店铺池配置（店铺内容、品类分布）

文件：[shops.js](file:///d:/Code/takeaway_food/src/data/shops.js)

- `SHOP_CATEGORIES`：品类表（key 为类型，value 为中文名）
- `FULL_SHOP_POOL`：完整店铺池（`{ name, type }`）

地图生成时会从店铺池中抽取 10 个店铺：

- 至少保证 4 个不同品类（随机抽 4 个品类各取 1）
- 每个品类最多 3 家
- 抽中的店铺会被随机赋予价格（3～10）

实现位置：`selectShops` in [MapGenerator.js](file:///d:/Code/takeaway_food/src/engine/MapGenerator.js)

### 4) 地图生成与平衡参数（格子数量、连线密度）

文件：[MapGenerator.js](file:///d:/Code/takeaway_food/src/engine/MapGenerator.js)

可直接调参的关键常量：

- `TOTAL_NODES`：节点数
- `TILE_COUNTS`：不同格子类型的数量分配
- `OUTER_RADIUS / INNER_RADIUS`：两环半径（影响密度与遮挡）
- `Math.random() < 0.25`：捷径概率（影响路线复杂度与策略空间）
- `skipDistance`：捷径距离范围（影响“跳跃程度”）

## 项目结构与代码逻辑

### 目录结构

```
public/                 静态资源
src/
  App.jsx               页面布局（含移动端竖屏 H5 游戏 UI）
  main.jsx              应用入口
  index.css             全局样式（含 dvh / 安全区等）
  components/
    SetupScreen.jsx     开局设置流程
    GameBoard.jsx       地图渲染与移动交互
    SidePanel.jsx       玩家状态/技能/掷骰/日志面板
    Modal.jsx           店铺弹窗/命运弹窗
  context/
    GameContext.jsx     核心状态机（reducer + helper）
  engine/
    MapGenerator.js     地图生成与店铺抽取
  data/
    factions.js         势力策划配置
    fateEvents.js       命运事件策划配置
    shops.js            店铺池与品类配置
```

### 核心状态机（GameContext）

[GameContext.jsx](file:///d:/Code/takeaway_food/src/context/GameContext.jsx) 是整个游戏的“唯一真相来源”，负责：

- 存储：玩家数组、地图节点、当前玩家索引、回合数、阶段、待移动步数、弹窗、胜利者、日志等
- Action 入口（组件只负责 dispatch）：
  - `INIT_GAME`：初始化新局
  - `ROLL_DICE`：掷骰并进入 MOVING
  - `MOVE_STEP`：执行一步移动
  - `BUY_SHOP` / `SKIP_BUY`：店铺购买/离开
  - `USE_SKILL`：主动技能
  - `RESOLVE_MODAL`：关闭命运弹窗（可能触发连锁）
- 辅助函数：
  - `handleLandOnNode`：落点处理（店铺/充电/打工/医院/命运）
  - `endTurn`：统一的回合结束入口（跳过/被动触发/回合数推进/buff 递减）
  - `handleEmergencyCharge`：紧急充电
  - `checkVictory`：胜利判定

### UI 组件分工

- [App.jsx](file:///d:/Code/takeaway_food/src/App.jsx)
  - 负责整体布局与竖屏适配：地图全屏 + 顶部 HUD + 底部可收起面板
- [GameBoard.jsx](file:///d:/Code/takeaway_food/src/components/GameBoard.jsx)
  - 渲染节点与连线（SVG）
  - 高亮可移动邻居
  - 接收点击触发 `MOVE_STEP`
- [SidePanel.jsx](file:///d:/Code/takeaway_food/src/components/SidePanel.jsx)
  - 展示玩家列表、当前行动玩家、技能按钮、掷骰按钮、日志
- [Modal.jsx](file:///d:/Code/takeaway_food/src/components/Modal.jsx)
  - 店铺到达购买确认
  - 命运事件展示与确认

## 开发与部署

### 本地开发

```bash
npm install
npm run dev
```

### 代码质量与构建

```bash
npm run lint
npm run build
npm run preview
```

### Cloudflare Pages

- Build command：`npm run build`
- Output directory：`dist`

## Roadmap（迭代方向）

### 1) 人机对战（玩家 vs 电脑玩家）

- 增加“电脑玩家”类型：根据 phase 与局面自动决策（掷骰/选路/买不买/用技能）
- 先做规则型 AI（启发式），再做难度分级（保守/均衡/激进）
- 引入随机种子（seed）以便复盘与联机同步（也方便回放/录像）

### 2) 联机与多玩家对战

- 抽象“权威状态”：服务端（或 Durable Objects）作为唯一状态源，客户端只发意图
- 同步策略：Action 日志 + seed 驱动随机，保证可重放与断线重连
- 房间系统：创建/加入房间、观战、掉线托管（临时 AI 接管）

### 3) 更多事件与趣味性（内容扩展）

- 扩展命运事件：
  - 更多“选择型事件”（玩家可选而非随机）
  - 连锁事件树与代价/收益权衡
  - 与店铺品类/玩家当前势力相关的“专属命运”
- 扩展店铺体系：
  - 店铺券变成“带技能的卡牌”（触发被动/一次性道具）
  - 组合加成（同品类收集、连锁套装）
- 扩展地图与玩法模式：
  - 地图主题、不同连接密度、特殊地形（收费捷径、单向边等）

### 4) H5 游戏体验增强

- 新手引导与规则面板
- 全屏模式、音效、震动反馈、PWA 安装与离线缓存
- 结算与战绩（本地存档/云存档）
