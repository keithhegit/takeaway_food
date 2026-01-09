
// Note: We need access to map structure. Assuming mapNodes are passed in.

/**
 * AI Logic Module
 * Pure functions to determine AI actions based on game state.
 */

// Heuristic weights
const WEIGHTS = {
    BUYABLE_SHOP: 20,
    OWNED_SHOP: -5, // Slight penalty to avoid wasting turn visiting own shop unless needed? Or maybe +1 for income? Let's say +1 income is small.
    ENEMY_SHOP: -2, // No penalty yet but maybe in future
    CHARGER_LOW_POWER: 25,
    CHARGER_HIGH_POWER: -10,
    MONEY_LOW_FUNDS: 15,
    MONEY_HIGH_FUNDS: 2,
    FATE_BEHIND: 10, // Risky when losing
    FATE_AHEAD: -5,  // Safe when winning
    HOSPITAL: -50,   // Avoid!
};

/**
 * Calculate the best target node ID for the AI movement.
 * @param {string} currentNodeId - Current node ID
 * @param {number} steps - Dice roll result
 * @param {Object} player - Current player object
 * @param {Array} mapNodes - All map nodes
 * @param {Array} players - All players (for relative standing)
 * @returns {string} - The ID of the best target node
 */
export function findBestMove(currentNodeId, steps, player, mapNodes, players) {
    // 1. Find all reachable nodes with exactly 'steps' distance
    // We need a helper to find paths. Since the graph is small, we can do a quick BFS/DFS.
    const reachablePaths = getAllPaths(currentNodeId, steps, mapNodes);
    
    // reachablePaths is an array of paths, where each path is an array of node IDs.
    // We only care about the final destination for scoring, but maybe intermediate nodes matter?
    // In this game, you only trigger the final node. Intermediate nodes consume power (handled globally).
    
    if (reachablePaths.length === 0) return currentNodeId; // Should not happen

    let bestNodeId = null;
    let maxScore = -Infinity;

    // Get unique destinations
    const destinations = [...new Set(reachablePaths.map(p => p[p.length - 1]))];

    destinations.forEach(targetId => {
        const score = evaluateNode(targetId, player, mapNodes, players);
        // Add some randomness to avoid predictability
        const randomFactor = Math.random() * 5; 
        const finalScore = score + randomFactor;

        if (finalScore > maxScore) {
            maxScore = finalScore;
            bestNodeId = targetId;
        }
    });

    return bestNodeId;
}

/**
 * Get all possible paths of length 'steps' from startNode.
 * Returns array of [nodeId1, nodeId2, ... targetId]
 */
function getAllPaths(startNodeId, steps, mapNodes) {
    const paths = [];
    
    function dfs(currentId, currentPath, remainingSteps) {
        if (remainingSteps === 0) {
            paths.push(currentPath);
            return;
        }

        const node = mapNodes[currentId];
        if (!node) return;

        // Ensure we don't go back immediately? 
        // The game rule says "choose adjacent". Usually in Monopoly-like games you can't reverse direction in same turn?
        // But here it's a graph. Let's assume simple adjacent movement.
        // To prevent infinite loops or back-and-forth in one turn, maybe visited set in path?
        // Let's allow all neighbors for now.
        
        node.connections.forEach(neighborId => {
            // Optional: Prevent immediate U-turn if steps > 1? 
            // For now, simple DFS.
            dfs(neighborId, [...currentPath, neighborId], remainingSteps - 1);
        });
    }

    dfs(startNodeId, [], steps);
    return paths;
}

/**
 * Score a target node based on player state.
 */
function evaluateNode(nodeId, player, mapNodes, players) {
    const node = mapNodes[nodeId];
    if (!node) return -100;

    let score = 0;

    // 1. Resource check
    const isLowPower = player.power < 5;
    const isLowMoney = player.money < 5;

    // 2. Node Type Evaluation
    switch (node.type) {
        case 'shop':
            if (node.shop) {
                // Check ownership
                const owner = players.find(p => p.shops && p.shops.includes(node.shop.id));
                if (owner) {
                    if (owner.id === player.id) {
                        score += WEIGHTS.OWNED_SHOP; // Own shop: small bonus or penalty
                    } else {
                        score += WEIGHTS.ENEMY_SHOP; // Enemy shop
                    }
                } else {
                    // Unowned shop
                    if (player.money >= node.shop.price) {
                        score += WEIGHTS.BUYABLE_SHOP;
                        // Bonus if it helps win (count total shops)
                        if (player.shops.length >= 8) score += 20; // Close to win
                    } else {
                        score -= 5; // Can't buy, waste of turn?
                    }
                }
            }
            break;

        case 'charger':
            if (isLowPower) score += WEIGHTS.CHARGER_LOW_POWER;
            else score += WEIGHTS.CHARGER_HIGH_POWER;
            break;

        case 'money':
            if (isLowMoney) score += WEIGHTS.MONEY_LOW_FUNDS;
            else score += WEIGHTS.MONEY_HIGH_FUNDS;
            break;

        case 'hospital':
            // Check immunity
            if (player.factionId === 'dingdong') score += 0; // Immune
            else score += WEIGHTS.HOSPITAL;
            break;

        case 'fate':
            // Simple logic: if losing, take risk
            const isWinning = player.coupons.length === Math.max(...players.map(p => p.coupons.length));
            if (isWinning) score += WEIGHTS.FATE_AHEAD;
            else score += WEIGHTS.FATE_BEHIND;
            break;

        case 'normal':
        default:
            score += 0;
            break;
    }

    return score;
}

/**
 * Decide whether to buy a shop.
 * @returns {boolean}
 */
export function shouldBuyShop(shop, player, victoryTarget) {
    // 1. If this wins the game, BUY!
    // Note: victoryTarget check might be complex here, assuming simple count
    if (player.shops.length + 1 >= victoryTarget) return true;

    // 2. Can we afford it with safety margin?
    // Safety margin = 2 (for emergency charge)
    const safetyMargin = 2;
    if (player.money >= shop.price + safetyMargin) {
        return true;
    }

    // 3. If desperate (no shops), maybe take risk?
    if (player.shops.length === 0 && player.money >= shop.price) {
        return true;
    }

    return false;
}

/**
 * Find the next step to take towards a target node.
 * Requires that the target is reachable in exactly `steps` moves.
 */
export function getNextStepToward(currentId, targetId, steps, mapNodes) {
    const node = mapNodes[currentId];
    if (!node) return null;
    
    // Shuffle connections to add variety in pathing if multiple valid paths exist
    const connections = [...node.connections].sort(() => Math.random() - 0.5);

    for (const neighborId of connections) {
        if (canReach(neighborId, targetId, steps - 1, mapNodes)) {
            return neighborId;
        }
    }
    return node.connections[0]; // Fallback
}

function canReach(startId, targetId, steps, mapNodes) {
    if (steps === 0) return startId === targetId;
    if (steps < 0) return false;
    
    const node = mapNodes[startId];
    if (!node) return false;

    for (const nId of node.connections) {
        if (canReach(nId, targetId, steps - 1, mapNodes)) return true;
    }
    return false;
}
