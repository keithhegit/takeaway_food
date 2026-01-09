/**
 * Fate Event System (v0.3)
 * Categories: gain (增益), loss (损益), strategy (策略)
 * Weight: Higher weight means higher probability
 */
export const FATE_EVENTS = [
    // --- GAIN (增益) ---
    { 
        id: 'lucky_tip', 
        text: '豪爽小费：获得 6 元，心情大好！', 
        category: 'gain', 
        weight: 30, 
        effect: { money: 6 } 
    },
    { 
        id: 'gold_rush', 
        text: '黄金时段：送餐效率翻倍，获得 10 元奖励！', 
        category: 'gain', 
        weight: 15, 
        effect: { money: 10 } 
    },
    { 
        id: 'full_charge', 
        text: '备用电池：电量瞬间补满！', 
        category: 'gain', 
        weight: 15, 
        effect: { power: 10 } 
    },
    { 
        id: 'shield_gain', 
        text: '锦鲤订单：获得一个护盾，可抵御一次破坏！', 
        category: 'gain', 
        weight: 20, 
        effect: { shield: 1 } 
    },
    { 
        id: 'discount_card', 
        text: '平台补贴：获得一张 3 元购店优惠券', 
        category: 'gain', 
        weight: 20, 
        effect: { buff: 'discount_3' } 
    },

    // --- LOSS (损益) ---
    { 
        id: 'fine_ticket', 
        text: '超时罚单：违规停放，罚款 4 元', 
        category: 'loss', 
        weight: 25, 
        effect: { money: -4 } 
    },
    { 
        id: 'flat_tire', 
        text: '爆胎危机：电瓶车爆胎，下回合暂停 1 轮', 
        category: 'loss', 
        weight: 15, 
        effect: { skip: true } 
    },
    { 
        id: 'power_drain', 
        text: '系统漏电：电量流失 5 度', 
        category: 'loss', 
        weight: 20, 
        effect: { power: -5 } 
    },
    { 
        id: 'hospital_trip', 
        text: '中暑晕倒：被路人送往最近的医院', 
        category: 'loss', 
        weight: 10, 
        type: 'teleport_hospital' 
    },

    // --- STRATEGY (策略/中性) ---
    { 
        id: 'rainy_race', 
        text: '雨天竞速：由于赶时间，下 2 回合步数 +1', 
        category: 'strategy', 
        weight: 15, 
        effect: { buff: 'move_plus_1', duration: 2 } 
    },
    { 
        id: 'swap_pos', 
        text: '移形换位：与随机一名竞争对手交换位置', 
        category: 'strategy', 
        weight: 10, 
        type: 'swap_position' 
    },
    { 
        id: 'black_market', 
        text: '黑市交易：支付 5 元，随机获得地图中一张店铺券', 
        category: 'strategy', 
        weight: 12, 
        type: 'buy_random_coupon', 
        cost: 5 
    },
    { 
        id: 'echo_fate', 
        text: '命运回响：传送至最近的命运格子并再次触发', 
        category: 'strategy', 
        weight: 8, 
        type: 'retrigger_fate' 
    }
];
