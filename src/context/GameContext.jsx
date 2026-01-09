
import React, { createContext, useReducer, useContext, useEffect, useRef } from 'react';
import { generateMap } from '../engine/MapGenerator';
import { FACTIONS } from '../data/factions';
import { FATE_EVENTS } from '../data/fateEvents';
import { findBestMove, shouldBuyShop, getNextStepToward, getAISocialAction } from '../utils/aiLogic';
import { getWeightedRandom } from '../utils/gameUtils';

const GameContext = createContext();

const INITIAL_STATE = {
    players: [],
    mapNodes: [],
    currentPlayerIndex: 0,
    turn: 1,
    phase: 'SETUP', // SETUP, IDLE, MOVING, EVENT_HANDLING, END_TURN
    dice: 0,
    pendingMove: 0,
    gameLog: [],
    modal: null,
    winner: null,
    victoryTarget: 10 // Default victory condition
};

const BASE_MOVE_COST = 0.5;

function getMoveCost(player) {
    const f = player.stats.faction;
    return f.passives.moveCost || BASE_MOVE_COST;
}

function log(state, msg) {
    return { ...state, gameLog: [`[T${state.turn}] ${msg}`, ...state.gameLog] };
}

function gameReducer(state, action) {
    switch (action.type) {
        case 'INIT_GAME': {
            const { playerConfigs, victoryTarget = 10 } = action.payload;
            const map = generateMap();
            const players = playerConfigs.map((cfg, idx) => {
                const f = FACTIONS.find(x => x.id === cfg.factionId);
                return {
                    id: idx,
                    name: f.name,
                    factionId: f.id,
                    color: f.color,
                    money: f.initialMoney,
                    power: f.initialPower,
                    coupons: [],
                    position: 0,
                    isSkipped: false,
                    skillCooldown: 0,
                    highPowerCooldown: 0,
                    turnsSinceFate: 0,
                    buffs: [],
                    shields: 0,
                    extraTurn: false,
                    isAI: cfg.isAI || false,
                    stats: { faction: f }
                };
            });
            return { ...INITIAL_STATE, players, mapNodes: map, phase: 'IDLE', gameLog: ['游戏开始！'], victoryTarget };
        }

        case 'ROLL_DICE': {
            const p = state.players[state.currentPlayerIndex];
            const moveCost = getMoveCost(p);
            // Power Check
            if (p.power < moveCost) {
                return handleEmergencyCharge(state, p);
            }

            let roll = Math.floor(Math.random() * 3) + 1;

            // Check buffs
            let newBuffs = p.buffs || [];
            if (newBuffs.includes('move_minus_1')) {
                roll = Math.max(1, roll - 1);
                newBuffs = newBuffs.filter(b => b !== 'move_minus_1');
            }

            // Update player with cleared buff (if any)
            let updatedPlayers = [...state.players];
            updatedPlayers[state.currentPlayerIndex] = { ...p, buffs: newBuffs };

            return {
                ...log(state, `${p.name} 掷出了 ${roll} 点`),
                players: updatedPlayers,
                dice: roll,
                pendingMove: roll,
                phase: 'MOVING'
            };
        }

        case 'MOVE_STEP': {
            const { targetNodeId } = action.payload;
            const pIndex = state.currentPlayerIndex;
            const p = state.players[pIndex];

            // Validate adjacency
            const currentNode = state.mapNodes[p.position];
            if (!currentNode.connections.includes(targetNodeId)) {
                return state; // Invalid move
            }

            // Execute Move
            const moveCost = getMoveCost(p);
            let newPower = p.power - moveCost;
            // Round to 2 decimal places to avoid floating point precision issues
            newPower = Math.round(newPower * 100) / 100;
            newPower = Math.max(0, newPower);
            const newPending = state.pendingMove - 1;

            let updatedPlayers = [...state.players];
            updatedPlayers[pIndex] = { ...p, position: targetNodeId, power: newPower };

            let newState = { ...state, players: updatedPlayers, pendingMove: newPending };

            // Log detailed movement resource change
            const remPower = Number(newPower.toFixed(1)); // Format to 1 decimal
            newState = log(newState, `${p.name} 移动一步 (电量 -${moveCost}, 剩余 ${remPower})`);

            // Emergency Check during movement
            if (newPower < 0) { // Should not happen if logic is correct, but < 0.5 check is for NEXT move
                // If we reached 0, it's fine as long as we don't need to move more.
                // But rule: "If power insufficient... trigger emergency". 
                // Implies check happens BEFORE move. Here we checked.
            }

            // Check if finished moving
            if (newPending === 0) {
                return handleLandOnNode(newState, updatedPlayers[pIndex], state.mapNodes[targetNodeId]);
            } else {
                // Prepare for next step, check power again
                if (newPower < moveCost) {
                    return handleEmergencyCharge(newState, updatedPlayers[pIndex]);
                }
                return newState;
            }
        }

        case 'RESOLVE_MODAL': {
            // Check for chained events (e.g. Retrigger Fate)
            if (state.modal && state.modal.triggerNext) {
                const p = state.players[state.currentPlayerIndex];
                const nextNode = state.mapNodes[p.position];
                // Continue handling the new node immediately after closing current modal
                return handleLandOnNode({ ...state, modal: null }, p, nextNode);
            }
            // Close modal and End Turn usually
            return endTurn({ ...state, modal: null });
        }

        case 'BUY_SHOP': {
            const pIndex = state.currentPlayerIndex;
            const p = state.players[pIndex];
            const { shop } = action.payload; // { name, type, price }

            if (p.money < shop.price) return state; // Should be guarded by UI

            const newPlayers = [...state.players];
            newPlayers[pIndex] = {
                ...p,
                money: Math.max(0, p.money - shop.price),
                coupons: [...p.coupons, shop],
                buffs: (p.buffs || []).filter(b => b !== 'discount_2') // Consume discount buff
            };

            let s = log(state, `${p.name} 购买了 ${shop.name} (-${shop.price}元, 剩余 ${newPlayers[pIndex].money}元)`);

            // Meituan Passive: Bonus for specific shop types
            const f = p.stats.faction;
            if (f.passives.shopBonusTypes && f.passives.shopBonusTypes.includes(shop.type)) {
                // Calculate Bonus
                let bonus = f.passives.shopBonusAmount || 2;
                if (f.passives.shopBonusBuffCondition) {
                    if (p.coupons.length >= f.passives.shopBonusBuffCondition.minCoupons) {
                        bonus = f.passives.shopBonusBuffCondition.amount;
                    }
                }
                newPlayers[pIndex].money += bonus;
                s = log(s, `${p.name} 触发被动：获得 ${bonus} 元返利！`);
            }

            s = { ...s, players: newPlayers, modal: null }; // Clears modal here

            // Winner Check
            if (checkVictory(newPlayers[pIndex], state.victoryTarget)) {
                return { ...s, winner: p.name, gameLog: [`🏆 ${p.name} 获胜！`, ...s.gameLog] };
            }

            return endTurn(s);
        }

        case 'SKIP_BUY': {
            return endTurn({ ...state, modal: null });
        }

        case 'PERFORM_SHUTDOWN': {
            const { targetId, shopIndex } = action.payload;
            const pIndex = state.currentPlayerIndex;
            const p = state.players[pIndex];
            const target = state.players[targetId];
            const shop = target.coupons[shopIndex];

            const newPlayers = [...state.players];
            let msg = "";

            if (target.shields > 0) {
                // Shielded
                newPlayers[targetId] = { ...target, shields: target.shields - 1 };
                newPlayers[pIndex] = { ...p, money: p.money + 2 };
                msg = `${p.name} 试图破坏 ${target.name} 的 ${shop.name}，但被护盾挡住了！(获得 2 元安慰金)`;
            } else {
                // Success
                const newCoupons = [...target.coupons];
                newCoupons.splice(shopIndex, 1);
                newPlayers[targetId] = { ...target, coupons: newCoupons };
                newPlayers[pIndex] = { ...p, money: p.money + 5 };
                msg = `${p.name} 成功破坏了 ${target.name} 的 ${shop.name}！(获得 5 元报酬)`;
            }

            return endTurn(log({ ...state, players: newPlayers, modal: null }, msg));
        }

        case 'PERFORM_HEIST': {
            const { amount } = action.payload;
            const pIndex = state.currentPlayerIndex;
            const p = state.players[pIndex];
            
            const enemies = state.players.filter(pl => pl.id !== pIndex && pl.money > 0);
            const newPlayers = [...state.players];
            let msg = "";

            if (enemies.length > 0 && amount > 0) {
                const target = enemies[Math.floor(Math.random() * enemies.length)];
                const actualSteal = Math.min(target.money, amount);
                
                newPlayers[target.id] = { ...target, money: target.money - actualSteal };
                newPlayers[pIndex] = { ...p, money: p.money + actualSteal };
                msg = `${p.name} 在社交中心大显身手，从 ${target.name} 处窃取了 ${actualSteal} 元！`;
            } else {
                msg = `${p.name} 在社交中心空手而归。`;
            }

            return endTurn(log({ ...state, players: newPlayers, modal: null }, msg));
        }

        case 'CANCEL_SOCIAL': {
            return endTurn({ ...state, modal: null });
        }

        case 'USE_SKILL': {
            const pIndex = state.currentPlayerIndex;
            const p = state.players[pIndex];
            const skill = p.stats.faction.activeSkill;

            if (!skill) return state;
            if (p.skillCooldown > 0) return log(state, "技能冷却中！");

            // Eleme: Power to Money
            if (skill.id === 'power_to_money') {
                if (p.power < skill.costPower) return log(state, "电量不足，无法发动！");

                const newPlayers = [...state.players];
                newPlayers[pIndex] = {
                    ...p,
                    power: Math.max(0, p.power - skill.costPower),
                    money: p.money + skill.gainMoney,
                    skillCooldown: skill.cooldown
                };
                return log({ ...state, players: newPlayers }, `${p.name} 发动技能：转化 3 电量为 2 元 (剩余电量 ${newPlayers[pIndex].power}, 资金 ${newPlayers[pIndex].money})`);
            }

            // Guochao: Pause Enemy
            if (skill.id === 'pause_enemy') {
                const { targetId } = action.payload;
                // Validation
                if (targetId === undefined || targetId === pIndex) return state;
                if (p.money < skill.cost) return log(state, "资金不足，无法发动！");

                const newPlayers = [...state.players];
                // Cost & Cooldown
                newPlayers[pIndex] = {
                    ...p,
                    money: Math.max(0, p.money - skill.cost),
                    skillCooldown: skill.cooldown // Apply cooldown from faction config
                };
                // Effect
                const target = newPlayers[targetId];
                
                // Shield Defense Logic
                if (target.shields > 0) {
                    newPlayers[targetId] = { ...target, shields: target.shields - 1 };
                    return log({ ...state, players: newPlayers }, `${p.name} 发动技能，但被 ${target.name} 的护盾抵御了！(消耗 1 个护盾)`);
                }

                newPlayers[targetId] = { ...target, isSkipped: true, money: target.money + 1 };

                return log({ ...state, players: newPlayers }, `${p.name} 发动技能：暂停 ${target.name} (花费 ${skill.cost}, 剩余 ${newPlayers[pIndex].money})`);
            }

            return state;
        }

        default: return state;
    }
}

function handleLandOnNode(state, player, node) {
    const f = player.stats.faction;

    // 1. Shop
    if (node.type === 'shop') {
        // Check if owned
        const hasCoupon = player.coupons.some(c => c.name === node.shop.name);
        if (!hasCoupon) {
            let finalPrice = node.shop.price;
            if (f.passives.shopCostExtra) finalPrice += f.passives.shopCostExtra;

            // Buff: Discount
            if (player.buffs && player.buffs.includes('discount_2')) {
                finalPrice = Math.max(0, finalPrice - 2);
                // We don't remove buff here, we remove it when purchased? Or usually single use?
                // Let's assume single use. But we are in "View" mode here (generating modal).
                // Real removal happens in BUY_SHOP.
            }

            // Dingdong Passive: -2 if no fate for 3 turns
            if (f.passives.shopDiscountCondition === 'no_fate_3_turns') {
                if (player.turnsSinceFate >= 3) {
                    finalPrice = Math.max(3, finalPrice - 2);
                    // Note: We don't log here to avoid spam, but price will reflect it.
                    // Could append to shop object to show "Discounted" in UI?
                }
            }

            // Always show modal for Shop to confirm arrival, let Modal handle disable logic
            return {
                ...state,
                phase: 'EVENT_HANDLING',
                modal: {
                    type: 'SHOP',
                    shop: { ...node.shop, price: finalPrice }
                }
            };
        } else {
            // Already owned -> Bonus
            const bonusPlayers = [...state.players];
            bonusPlayers[player.id].money += 1; // Simplify to +1 money for now
            return endTurn(log({ ...state, players: bonusPlayers }, `光顾自家店铺 ${node.shop.name}，获得 1 元`));
        }
    }

    // 2. Charger
    if (node.type === 'charger') {
        let amount = f.passives.chargerBonus || 5;

        // Check Buff: no_charger_10_turns
        // Check Buff: no_charger_10_turns
        // Check Buff: no_charger_5_turns
        if (player.buffs && player.buffs.some(b => typeof b === 'object' ? b.id === 'no_charger_5_turns' : b === 'no_charger_5_turns')) {
            const buff = player.buffs.find(b => typeof b === 'object' && b.id === 'no_charger_5_turns');
            const remaining = buff ? buff.duration : '?';
            return endTurn(log(state, `电池老化，无法充电！(剩余 ${remaining} 回合)`));
        }

        const newPlayers = [...state.players];
        newPlayers[player.id] = { ...newPlayers[player.id], power: newPlayers[player.id].power + amount };
        return endTurn(log({ ...state, players: newPlayers }, `充电完成！电量 +${amount} (当前 ${newPlayers[player.id].power})`));
    }

    // 3. Money Station
    if (node.type === 'money') {
        let amount = f.passives.moneyStationBonus || 5;
        const newPlayers = [...state.players];
        newPlayers[player.id] = { ...newPlayers[player.id], money: newPlayers[player.id].money + amount };
        return endTurn(log({ ...state, players: newPlayers }, `打工结束！金钱 +${amount} (当前 ${newPlayers[player.id].money})`));
    }

    // 4. Hospital
    if (node.type === 'hospital') {
        if (f.passives.hospitalImmunity) {
            return endTurn(log(state, `到达医院，但拥有免疫特权！`));
        }
        const newPlayers = [...state.players];
        newPlayers[player.id] = { ...newPlayers[player.id], isSkipped: true };
        return endTurn(log({ ...state, players: newPlayers }, `进入医院，下回合暂停！`));
    }

    // 5. Fate
    if (node.type === 'fate') {
        const event = getWeightedRandom(FATE_EVENTS);

        // Process simple effects immediately, complex ones need modal logic
        let msg = `命运时间: ${event.text}`;
        let newState = state;

        // Apply simple effects
        const newPlayers = [...state.players];
        let p = { ...newPlayers[player.id] };
        const initialMoney = p.money;
        const initialPower = p.power;

        // 1. Simple Effects (effect property)
        if (event.effect) {
            if (event.effect.money) p.money = Math.max(0, p.money + event.effect.money);
            if (event.effect.power) p.power = Math.max(0, p.power + event.effect.power);
            if (event.effect.shield) p.shields = Math.min(3, (p.shields || 0) + event.effect.shield);
            if (event.effect.skip) p.isSkipped = true;
        }

        // 2. Complex Logic based on Type
        switch (event.type) {
            case 'teleport_hospital': {
                const hospitals = state.mapNodes.filter(n => n.type === 'hospital');
                if (hospitals.length > 0) {
                    const nearestHospital = hospitals[0];
                    p.position = nearestHospital.id;
                    if (!f.passives.hospitalImmunity) p.isSkipped = true;
                    msg += ` -> 传送至医院`;
                }
                break;
            }

            case 'buy_random_coupon':
                if (p.money >= event.cost) {
                    const allShops = state.mapNodes
                        .filter(n => n.type === 'shop')
                        .map(n => n.shop);

                    const unownedShops = allShops.filter(s => !p.coupons.some(c => c.name === s.name));

                    if (unownedShops.length > 0) {
                        p.money = Math.max(0, p.money - event.cost);
                        const wonShop = unownedShops[Math.floor(Math.random() * unownedShops.length)];
                        p.coupons = [...p.coupons, wonShop];
                        msg += ` -> 交易成功！获得 [${wonShop.name}]`;
                    } else {
                        msg += ` -> 市场上没有可购买的店铺了 (退款)`;
                    }
                } else {
                    msg += ` -> 资金不足 (需要 ${event.cost} 元)`;
                }
                break;

            case 'swap_position': {
                const enemies = newPlayers.filter(pl => pl.id !== player.id);
                if (enemies.length > 0) {
                    const swapTarget = enemies[Math.floor(Math.random() * enemies.length)];
                    const myPos = p.position;
                    p.position = swapTarget.position;
                    newPlayers[swapTarget.id] = { ...swapTarget, position: myPos };
                    msg += ` -> 与 ${swapTarget.name} 互换位置`;
                }
                break;
            }

            case 'retrigger_fate': {
                const otherFates = state.mapNodes.filter(n => n.type === 'fate' && n.id !== node.id);
                if (otherFates.length > 0) {
                    const nextFate = otherFates[Math.floor(Math.random() * otherFates.length)];
                    p.position = nextFate.id;
                    msg += ` -> 传送至另一命运点`;
                }
                break;
            }
        }

        // 3. Buffs application from Event
        if (event.effect && event.effect.buff) {
            const currentBuffs = p.buffs || [];
            const duration = event.effect.duration || 5;
            const label = event.id === 'rainy_race' ? '雨天竞速' : 
                         event.id === 'discount_card' ? '购店优惠' : '特殊状态';
            
            p.buffs = [...currentBuffs, { 
                id: event.effect.buff, 
                label: label, 
                duration: duration 
            }];
        }

        // Calculate changes for detailed logging
        const moneyDiff = p.money - initialMoney;
        const powerDiff = p.power - initialPower;
        let changeMsg = [];
        if (moneyDiff !== 0) changeMsg.push(`金钱 ${moneyDiff > 0 ? '+' : ''}${moneyDiff}`);
        if (powerDiff !== 0) changeMsg.push(`电量 ${powerDiff > 0 ? '+' : ''}${powerDiff}`);
        if (p.shields > (player.shields || 0)) changeMsg.push(`护盾 +${p.shields - (player.shields || 0)}`);

        if (changeMsg.length > 0) msg += ` [${changeMsg.join(', ')}]`;
        msg += ` (当前: ${p.money}金 / ${p.power}电)`;

        newState = log(newState, msg);
        newPlayers[player.id] = { ...p, turnsSinceFate: 0 };
        newState.players = newPlayers;
        
        newState.modal = {
            type: 'FATE',
            text: event.text,
            event: event,
            triggerNext: ['retrigger_fate', 'swap_position', 'teleport_hospital'].includes(event.type)
        };
        newState.phase = 'EVENT_HANDLING';

        return newState;
    }

    // 6. Social
    if (node.type === 'social') {
        const type = Math.random() < 0.5 ? 'SHUTDOWN' : 'HEIST';
        return {
            ...state,
            phase: 'EVENT_HANDLING',
            modal: {
                type: type,
                player: player
            }
        };
    }

    // Normal
    return endTurn(state);
}

function handleEmergencyCharge(state, player) {
    // Find nearest charger
    const chargers = state.mapNodes.filter(n => n.type === 'charger');
    const target = chargers[Math.floor(Math.random() * chargers.length)]; // Random for now

    // Calculate charge amount based on faction passive
    const chargeAmount = player.stats.faction.passives.chargerBonus || 5;

    const newPlayers = [...state.players];
    newPlayers[player.id] = {
        ...player,
        position: target.id,
        power: chargeAmount,
        money: Math.max(0, player.money - 2)
    };

    return endTurn(log({ ...state, players: newPlayers }, `⚡ 紧急充电！扣除 2 元，传送至充电桩 (获得 ${chargeAmount} 电量)`));
}

// Helper for ending turn
function endTurn(state) {
    let logMsg = [];
    let nextIdx = (state.currentPlayerIndex + 1) % state.players.length; // Use actual length
    let nextPlayer = state.players[nextIdx];

    // Decrement Cooldowns for next player
    if (nextPlayer.skillCooldown > 0) nextPlayer.skillCooldown--;
    if (nextPlayer.highPowerCooldown > 0) nextPlayer.highPowerCooldown--;

    // Increment trackers for next player (they are about to start their turn, so 1 more turn passed without Fate?)
    // Actually, "Continuous 3 turns" usually means "Since I last touched it".
    // We increment at End of Turn for the player who JUST finished? 
    // Or Start of their turn?
    // Let's increment for the CURRENT player who just finished.
    // Let's increment for the CURRENT player who just finished.
    let currentPlayers = [...state.players];
    const finishedPlayer = currentPlayers[state.currentPlayerIndex];

    // Decrement Buffs for the finished player
    if (finishedPlayer.buffs && finishedPlayer.buffs.length > 0) {
        finishedPlayer.buffs = finishedPlayer.buffs.map(b => {
            if (typeof b === 'object' && b.duration) {
                return { ...b, duration: b.duration - 1 };
            }
            return b;
        }).filter(b => {
            if (typeof b === 'object') return b.duration > 0;
            return true; // Keep string buffs
        });
    }

    // Extra Turn Check
    if (currentPlayers[state.currentPlayerIndex].extraTurn) {
        logMsg.push(`[${currentPlayers[state.currentPlayerIndex].name}] 触发额外回合！`);
        // Consume extra turn
        currentPlayers[state.currentPlayerIndex] = { ...currentPlayers[state.currentPlayerIndex], extraTurn: false };
        // Return state with same index, same turn count
        let finalState = {
            ...state,
            players: currentPlayers,
            phase: 'IDLE',
            dice: 0,
            modal: null
        };
        if (logMsg.length > 0) finalState = log(finalState, logMsg.join(' | '));
        return finalState;
    }

    currentPlayers[state.currentPlayerIndex].turnsSinceFate += 1;

    // Check Eleme High Power Passive (Triggered at End of Turn?)
    // "If current power > 10, gain +2 money (3 turn CD)"
    // Let's check for the player who just moved (state.currentPlayerIndex).
    const currP = currentPlayers[state.currentPlayerIndex];
    if (currP.stats.faction.passives.highPowerBonus) {
        const hpb = currP.stats.faction.passives.highPowerBonus;
        if (currP.highPowerCooldown === 0 && currP.power > hpb.threshold) {
            currP.money += hpb.amount;
            currP.highPowerCooldown = hpb.cooldown;
            logMsg.push(`[${currP.name}] 电量充盈(>${hpb.threshold})：获得资金 +${hpb.amount}`);
        }
    }

    // Check Faction Passive Regen (Start of turn?) 
    // Rules say: "Every 3 turns +0.5 power". Ideally checked at start of THEIR turn.
    // We'll advance turn counter when circle completes? 
    // Let's increment global turn when P0 moves.

    // Logic: A "Turn" (Round) is defined as when ALL players have moved.
    // So we increment the global turn counter only when the index wraps back to 0.
    let newTurn = state.turn;
    const roundEnded = (nextIdx === 0);

    // Accumulate Logs

    if (roundEnded) {
        newTurn++;
        // Adding visual separator for rounds
        logMsg.push(`====== 第 ${state.turn} 回合结束 ======`);
        logMsg.push(`====== 第 ${newTurn} 回合开始 ======`);
    }

    // Handle Skip
    if (nextPlayer.isSkipped) {
        const skippedState = log(state, `${nextPlayer.name} 暂停一回合`);
        let players = [...state.players];
        // Fix: Do not mutate nextPlayer directly. Create a copy.
        players[nextIdx] = { ...nextPlayer, isSkipped: false };

        // Recurse to find next valid
        return endTurn({
            ...skippedState,
            currentPlayerIndex: nextIdx,
            players,
            turn: (roundEnded ? newTurn : state.turn)
        });
    }

    // Apply Passive Regen for Next Player
    let players = [...state.players];
    const p = players[nextIdx];
    const f = p.stats.faction;
    const currentRound = (roundEnded ? newTurn : state.turn);

    // logMsg is already declared above

    // Power Regen
    if (f.passives.powerRegen) {
        if (currentRound > 0 && currentRound % f.passives.powerRegen.every === 0) {
            players[nextIdx].power += f.passives.powerRegen.amount;
            logMsg.push(`[${p.name}] 被动触发：电量 +${f.passives.powerRegen.amount}`);
        }
    }

    // Money Regen
    if (f.passives.moneyRegen) {
        if (currentRound > 0 && currentRound % f.passives.moneyRegen.every === 0) {
            players[nextIdx].money += f.passives.moneyRegen.amount;
            logMsg.push(`[${p.name}] 被动触发：金钱 +${f.passives.moneyRegen.amount}`);
        }
    }

    let finalState = {
        ...state,
        currentPlayerIndex: nextIdx,
        turn: newTurn, // newTurn is calculated above in the original function
        phase: 'IDLE',
        dice: 0,
        players,
        modal: null
    };

    if (logMsg.length > 0) {
        finalState = log(finalState, logMsg.join(' | '));
    }

    return finalState;
}

function checkVictory(player, victoryTarget = 10) {
    const unique = new Set(player.coupons.map(c => c.name)).size;
    return unique >= victoryTarget;
}

export const GameProvider = ({ children }) => {
    const [state, dispatch] = useReducer(gameReducer, INITIAL_STATE);
    const aiTargetRef = useRef(null);

    // AI Logic Loop
    useEffect(() => {
        const currentPlayer = state.players[state.currentPlayerIndex];
        // Ensure game is initialized and player exists
        if (!currentPlayer || !currentPlayer.isAI || state.winner || state.phase === 'SETUP') return;

        let isMounted = true;
        const delay = (ms) => new Promise(res => setTimeout(res, ms));

        const runAI = async () => {
            // 1. IDLE Phase: Roll Dice
            if (state.phase === 'IDLE') {
                aiTargetRef.current = null; // Reset target
                await delay(1000);
                if (isMounted) dispatch({ type: 'ROLL_DICE' });
            }
            // 2. MOVING Phase
            else if (state.phase === 'MOVING') {
                await delay(800);
                if (!isMounted) return;

                // Calculate Target if needed
                // If pendingMove equals dice, we are at the start of movement (or we just rolled)
                // We should calculate target once.
                if (state.pendingMove === state.dice || !aiTargetRef.current) {
                     const target = findBestMove(
                         currentPlayer.position, 
                         state.dice, 
                         currentPlayer, 
                         state.mapNodes, 
                         state.players
                     );
                     aiTargetRef.current = target;
                }

                if (state.pendingMove > 0) {
                     // If we have a target, move towards it
                     // If for some reason target is null (shouldn't happen), fallback
                     const target = aiTargetRef.current || currentPlayer.position;
                     
                     const nextStep = getNextStepToward(
                         currentPlayer.position, 
                         target, 
                         state.pendingMove, 
                         state.mapNodes
                     );
                     
                     if (nextStep) {
                         dispatch({ type: 'MOVE_STEP', payload: { targetNodeId: nextStep } });
                     } else {
                         // Fallback: pick first neighbor
                         const currNode = state.mapNodes[currentPlayer.position];
                         if (currNode && currNode.connections.length > 0) {
                            dispatch({ type: 'MOVE_STEP', payload: { targetNodeId: currNode.connections[0] } });
                         }
                     }
                }
            }
            // 3. EVENT_HANDLING (Modals)
            else if (state.phase === 'EVENT_HANDLING' && state.modal) {
                await delay(1500);
                if (!isMounted) return;

                if (state.modal.type === 'SHOP') {
                    const shouldBuy = shouldBuyShop(state.modal.shop, currentPlayer, state.victoryTarget);
                    if (shouldBuy) {
                        dispatch({ type: 'BUY_SHOP', payload: { shop: state.modal.shop } });
                    } else {
                        dispatch({ type: 'SKIP_BUY' });
                    }
                } else if (state.modal.type === 'SHUTDOWN' || state.modal.type === 'HEIST') {
                    const aiAction = getAISocialAction(state.modal, state);
                    if (aiAction) {
                        dispatch(aiAction);
                    } else {
                        dispatch({ type: 'CANCEL_SOCIAL' });
                    }
                } else {
                    // Fate or others -> Resolve
                    dispatch({ type: 'RESOLVE_MODAL' });
                }
            }
        };

        runAI();

        return () => { isMounted = false; };
    }, [state.phase, state.currentPlayerIndex, state.pendingMove, state.modal, state.turn, state.dice, state.players, state.winner, state.mapNodes, state.victoryTarget]); 

    const enhancedDispatch = (action) => {
        dispatch(action);
    };

    const stateWithDispatch = { ...state, dispatch: enhancedDispatch };

    return (
        <GameContext.Provider value={{ state: stateWithDispatch, dispatch: enhancedDispatch }}>
            {children}
        </GameContext.Provider>
    );
};

export const useGame = () => useContext(GameContext);
