
export const SHOP_CATEGORIES = {
    fastfood: '快餐连锁',
    casual: '大众餐饮',
    dinner: '正餐/烧烤',
    dessert: '甜品/奶茶',
    drink: '饮品/轻食',
    night: '夜宵/特殊营业'
};

export const FULL_SHOP_POOL = [
    // Fast Food
    { name: '肯德基', type: 'fastfood' },
    { name: '麦当劳', type: 'fastfood' },
    { name: '汉堡王', type: 'fastfood' },
    { name: '德克士', type: 'fastfood' },
    { name: '华莱士', type: 'fastfood' },

    // Casual
    { name: '沙县小吃', type: 'casual' },
    { name: '兰州拉面', type: 'casual' },
    { name: '张亮麻辣烫', type: 'casual' },
    { name: '杨国福麻辣烫', type: 'casual' },
    { name: '老乡鸡', type: 'casual' },

    // Dinner/BBQ
    { name: '象三胖烤肉', type: 'dinner' },
    { name: '半天妖烤鱼', type: 'dinner' },
    { name: '西贝莜面村', type: 'dinner' },
    { name: '海底捞', type: 'dinner' },
    { name: '木屋烧烤', type: 'dinner' },

    // Dessert
    { name: '满记甜品', type: 'dessert' },
    { name: '三花奶奶甜品店', type: 'dessert' },
    { name: '野人先生冰淇淋', type: 'dessert' },
    { name: '蜜雪冰城', type: 'dessert' },
    { name: '喜茶', type: 'dessert' },

    // Drink
    { name: '瑞幸咖啡', type: 'drink' },
    { name: '星巴克', type: 'drink' },
    { name: '奈雪的茶', type: 'drink' },
    { name: 'CoCo都可', type: 'drink' },
    { name: '霸王茶姬', type: 'drink' },

    // Night
    { name: '绝味鸭脖', type: 'night' },
    { name: '周黑鸭', type: 'night' },
    { name: '正新鸡排', type: 'night' },
    { name: '小龙虾大排档', type: 'night' },
    { name: '夜猫烧烤', type: 'night' }
];

// Helper to select 10 unique shops following rules
export function generateShopPool() {
    const _selected = [];
    const _categories = Object.keys(SHOP_CATEGORIES);
    const _pool = [...FULL_SHOP_POOL];

    // Logic to be implemented in GameEngine, but placing here for portability if needed
    // For now, just export the static data
}
