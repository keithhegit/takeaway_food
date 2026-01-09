/**
 * Game Utility Functions
 */

/**
 * Selects an item from a list based on weights.
 * @param {Array} list - Array of objects with a 'weight' property.
 * @returns {Object} - The selected item.
 */
export function getWeightedRandom(list) {
    const totalWeight = list.reduce((sum, item) => sum + (item.weight || 1), 0);
    let random = Math.random() * totalWeight;
    
    for (const item of list) {
        if (random < (item.weight || 1)) return item;
        random -= (item.weight || 1);
    }
    
    return list[0]; // Fallback
}
