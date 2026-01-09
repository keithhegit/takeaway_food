
import { shuffle, sampleSize } from 'lodash';
import { SHOP_CATEGORIES, FULL_SHOP_POOL } from '../data/shops';

const TOTAL_NODES = 40;
const TILE_COUNTS = {
    shop: 10,
    fate: 8,
    charger: 4,
    money: 4,
    hospital: 2,
    social: 4,
    normal: 8
};

export function generateMap() {
    const nodes = [];

    // 1. Assign Types
    let types = [];
    types.push(...Array(TILE_COUNTS.shop).fill('shop'));
    types.push(...Array(TILE_COUNTS.fate).fill('fate'));
    types.push(...Array(TILE_COUNTS.charger).fill('charger'));
    types.push(...Array(TILE_COUNTS.money).fill('money'));
    types.push(...Array(TILE_COUNTS.hospital).fill('hospital'));
    types.push(...Array(TILE_COUNTS.social).fill('social'));
    types.push(...Array(TILE_COUNTS.normal).fill('normal'));

    types = shuffle(types);

    const selectedShops = selectShops();
    let shopIndex = 0;

    // 2. Generate Hollow Circle (Ring) Layout to Prevent Overlapping
    // Arrange nodes in concentric circles for maximum spacing
    const CENTER_X = 50;
    const CENTER_Y = 50;

    // Use 2 rings: outer ring with more nodes, inner ring with fewer
    const OUTER_RADIUS = 42;
    const INNER_RADIUS = 28;
    const OUTER_COUNT = 24; // More nodes on outer ring
    const INNER_COUNT = 16; // Fewer nodes on inner ring

    for (let i = 0; i < TOTAL_NODES; i++) {
        let type = types[i];
        let shopData = null;

        if (type === 'shop') {
            shopData = { ...selectedShops[shopIndex], price: Math.floor(Math.random() * 8) + 3 };
            shopIndex++;
        }

        // Determine which ring and position within that ring
        let radius, angle;
        if (i < OUTER_COUNT) {
            // Outer ring
            radius = OUTER_RADIUS;
            angle = (i / OUTER_COUNT) * 2 * Math.PI - Math.PI / 2;
        } else {
            // Inner ring
            radius = INNER_RADIUS;
            const innerIndex = i - OUTER_COUNT;
            // Offset inner ring by half step for better visual distribution
            angle = ((innerIndex / INNER_COUNT) * 2 * Math.PI) - Math.PI / 2 + (Math.PI / INNER_COUNT);
        }

        const baseX = CENTER_X + radius * Math.cos(angle);
        const baseY = CENTER_Y + radius * Math.sin(angle);

        // Minimal jitter to keep clean circular appearance
        const jitter = 1.5;
        const x = baseX + (Math.random() - 0.5) * jitter;
        const y = baseY + (Math.random() - 0.5) * jitter;

        nodes.push({
            id: i,
            type,
            x: Math.min(95, Math.max(5, x)),
            y: Math.min(95, Math.max(5, y)),
            shop: shopData,
            connections: [],
            players: [],
        });
    }

    // 3. Connections
    // Primary loop connection (sequential nodes around the circle)
    for (let i = 0; i < TOTAL_NODES; i++) {
        const next = (i + 1) % TOTAL_NODES;
        nodes[i].connections.push(next);

        // Add occasional shortcuts across the circle for gameplay variety
        // But only connect to nearby nodes to minimize crossings
        if (Math.random() < 0.25) { // Reduced probability for cleaner layout
            // Find nodes that are 3-8 steps ahead (not too far, not adjacent)
            const skipDistance = 3 + Math.floor(Math.random() * 6);
            const target = (i + skipDistance) % TOTAL_NODES;

            // Only add if it doesn't create too many connections
            if (nodes[i].connections.length < 3 && !nodes[i].connections.includes(target)) {
                nodes[i].connections.push(target);
            }
        }
    }

    return nodes;
}

function selectShops() {
    let pool = [...FULL_SHOP_POOL];
    let selection = [];
    const categories = Object.keys(SHOP_CATEGORIES);

    const guaranteedCats = sampleSize(categories, 4);
    guaranteedCats.forEach(cat => {
        const candidateIndex = pool.findIndex(s => s.type === cat);
        if (candidateIndex > -1) {
            selection.push(pool[candidateIndex]);
            pool.splice(candidateIndex, 1);
        }
    });

    while (selection.length < 10) {
        if (pool.length === 0) break;
        const index = Math.floor(Math.random() * pool.length);
        const candidate = pool[index];
        const count = selection.filter(s => s.type === candidate.type).length;
        if (count < 3) {
            selection.push(candidate);
        }
        pool.splice(index, 1);
    }

    return shuffle(selection);
}
