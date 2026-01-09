
export const FACTIONS = [
  {
    id: 'dingdong',
    name: '叮咚买菜',
    color: '#00B140', // Green
    desc: '稳定运营流',
    initialPower: 10,
    initialMoney: 8,
    skillsList: [
      '每 3 回合 +0.5 度电',
      '每 5 回合 +1 元',
      '进入充电桩：+6 度电',
      '进入金钱桩：+8 元',
      '无法被任何效果传送到医院',
      '连续 3 回合不进入命运格子，下次购买店铺 -2 元（最低 3）'
    ],
    passives: {
      powerRegen: { every: 3, amount: 0.5 },
      moneyRegen: { every: 5, amount: 1 },
      chargerBonus: 6,
      moneyStationBonus: 8,
      hospitalImmunity: true,
      shopDiscountCondition: 'no_fate_3_turns'
    }
  },
  {
    id: 'guochao',
    name: '国潮外卖',
    color: '#FF4500', // Orange Red
    desc: '干扰控场流',
    initialPower: 13,
    initialMoney: 16,
    skillsList: [
      '每 4 回合 +0.5 度电',
      '每 6 回合 +1 元',
      '进入充电桩：+5 度电',
      '进入金钱桩：+8 元',
      '花费 5 元，使任意一方暂停 1 回合（对方 +1 元）',
      '每次行动额外消耗 0.75 度电',
      '进入店铺额外多花 1 元'
    ],
    passives: {
      powerRegen: { every: 4, amount: 0.5 },
      moneyRegen: { every: 6, amount: 1 },
      chargerBonus: 5,
      moneyStationBonus: 8,
      moveCost: 0.75, // Special override
      shopCostExtra: 1
    },
    activeSkill: {
      id: 'pause_enemy',
      cost: 5,
      cooldown: 1,
      desc: '花费 5 元，使任意一方暂停 1 回合（对方 +1 元）'
    }
  },
  {
    id: 'meituan',
    name: '美团外卖',
    color: '#FFC300', // Yellow
    desc: '连锁经营流',
    initialPower: 6,
    initialMoney: 12,
    skillsList: [
      '每 3 回合 +0.5 度电',
      '每 5 回合 +1 元',
      '进入充电桩：+7 度电',
      '进入金钱桩：+6 元',
      '进入【甜品 / 奶茶】类店铺时，获得 +2 元（5 回合冷却）',
      '拥有 ≥3 张店铺券后，该技能收益变为 +3 元'
    ],
    passives: {
      powerRegen: { every: 3, amount: 0.5 },
      moneyRegen: { every: 5, amount: 1 },
      chargerBonus: 7,
      moneyStationBonus: 6,
      shopBonusTypes: ['dessert', 'drink'],
      shopBonusAmount: 2,
      shopBonusBuffCondition: { minCoupons: 3, amount: 3 }
    }
  },
  {
    id: 'eleme',
    name: '饿了么',
    color: '#00A1E9', // Blue
    desc: '电量爆发流',
    initialPower: 8,
    initialMoney: 10,
    skillsList: [
      '每 5 回合 +0.5 度电',
      '每 4 回合 +1 元',
      '进入充电桩：+10 度电',
      '进入金钱桩：+5 元',
      '若当前电量 >10，可获得 +2 元（3 回合冷却）',
      '可消耗 3 度电换取 2 元（任意时刻使用，3 回合冷却）'
    ],
    passives: {
      powerRegen: { every: 5, amount: 0.5 },
      moneyRegen: { every: 4, amount: 1 },
      chargerBonus: 10,
      moneyStationBonus: 5,
      highPowerBonus: { threshold: 10, amount: 2, cooldown: 3 }
    },
    activeSkill: {
      id: 'power_to_money',
      costPower: 3,
      gainMoney: 2,
      cooldown: 3,
      desc: '消耗 3 度电换取 2 元'
    }
  }
];
