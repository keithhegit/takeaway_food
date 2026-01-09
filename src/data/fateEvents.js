
export const FATE_EVENTS = [
    { id: 1, text: '意想不到的收入：获得 6 元，但在随后消耗 3 度电', effect: { money: 6, power: -3 } },
    { id: 2, text: '紧急充电：获得 2 度电，但花费 3 元', effect: { power: 2, money: -3 } },
    { id: 3, text: '命运的选择：随机选择其一 [获得4元] 或 [获得2度电]', type: 'choice', options: [{ text: '+4 元', effect: { money: 4 } }, { text: '+2 度电', effect: { power: 2 } }] },
    { id: 4, text: '空间折跃：随机传送到任意非医院格子', type: 'teleport_random' },
    { id: 5, text: '定向传送：随机传送到一个充电桩或打工点', type: 'teleport_choice', targets: ['charger', 'money'] },
    { id: 6, text: '移形换位：与任意一名玩家交换位置', type: 'swap_position' },
    { id: 7, text: '由于暴雪：下一回合移动步数 -1', effect: { buff: 'move_minus_1' } },
    { id: 8, text: '时间加速：立刻额外行动 1 回合', type: 'extra_turn' },
    { id: 9, text: '系统故障：随机一名对手暂停 1 回合', type: 'stun_random_enemy' },
    { id: 10, text: '打折券：下次购买店铺 -2 元', effect: { buff: 'discount_2' } },
    { id: 11, text: '黑市交易：支付 5 元，随机获得地图中一张店铺券', type: 'buy_random_coupon', cost: 5 },
    { id: 12, text: '电力泄漏：扣 4 度电，若不足则送往医院', type: 'lose_power_or_hospital', amount: 4 },
    { id: 13, text: '劫富济贫：随机一名领先玩家 -3 元，你 +3 元', type: 'steal_money', amount: 3 },
    { id: 14, text: '商业扶持：若你当前店铺最少，获得 +1 元 +1 度电', type: 'catchup_bonus' },
    { id: 15, text: '电池老化：5 回合内无法进入充电桩（无法获得回复）', effect: { buff: 'no_charger_5_turns' } },
    { id: 16, text: '命运回响：传送至最近的命运格子并再次触发', type: 'retrigger_fate' }
];
