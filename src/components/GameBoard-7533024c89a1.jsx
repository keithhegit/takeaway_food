
import React from 'react';
import { useGame } from '../context/GameContext';
import { ShoppingBag, Zap, Banknote, Plus, HelpCircle, User } from 'lucide-react';
import clsx from 'clsx';

const ICON_MAP = {
    shop: ShoppingBag,
    charger: Zap,
    money: Banknote,
    hospital: Plus,
    fate: HelpCircle,
    normal: null
};

const COLOR_MAP = {
    shop: '#10b981',
    charger: '#eab308',
    money: '#3b82f6',
    hospital: '#ef4444',
    fate: '#a855f7',
    normal: '#64748b'
};

const GameBoard = () => {
    const { state, dispatch } = useGame();
    const { mapNodes, players, currentPlayerIndex, phase, pendingMove } = state;

    const currentPlayer = players[currentPlayerIndex];
    const currentNode = currentPlayer ? mapNodes[currentPlayer.position] : null;

    // Highlight available paths for current player
    const confirmedNeighbors = currentNode ? currentNode.connections : [];

    // Interaction valid only if moving
    const validNeighbors = (phase === 'MOVING' && currentNode)
        ? currentNode.connections
        : [];

    const handleNodeClick = (nodeId) => {
        if (phase !== 'MOVING') return;
        if (validNeighbors.includes(nodeId)) {
            dispatch({ type: 'MOVE_STEP', payload: { targetNodeId: nodeId } });
        }
    };

    return (
        <div className="relative aspect-square w-full h-full max-w-[800px] max-h-[800px] p-8 select-none m-auto">
            {/* 1. Connections Layer (SVG) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                {mapNodes.map(node => (
                    node.connections.map(targetId => {
                        const target = mapNodes[targetId];
                        return (
                            <line
                                key={`${node.id}-${targetId}`}
                                x1={`${node.x}%`} y1={`${node.y}%`}
                                x2={`${target.x}%`} y2={`${target.y}%`}
                                stroke="rgba(255,255,255,0.2)"
                                strokeWidth="4"
                            />
                        );
                    })
                ))}
                {/* Draw Highlight lines for current potential moves */}
                {currentNode && confirmedNeighbors.map(targetId => {
                    const target = mapNodes[targetId];
                    const isSelectable = validNeighbors.includes(targetId);
                    return (
                        <line
                            key={`highlight-${currentNode.id}-${targetId}`}
                            x1={`${currentNode.x}%`} y1={`${currentNode.y}%`}
                            x2={`${target.x}%`} y2={`${target.y}%`}
                            stroke={isSelectable ? "#22c55e" : "rgba(34, 211, 238, 0.4)"} // Green if moving, Cyan if just looking
                            strokeWidth={isSelectable ? "8" : "4"}
                            strokeDasharray={isSelectable ? "10" : "5"}
                            className={isSelectable ? "animate-pulse" : ""}
                        />
                    );
                })}
            </svg>

            {/* 2. Nodes Layer */}
            {mapNodes.map(node => {
                const Icon = ICON_MAP[node.type];
                const isValidMove = validNeighbors.includes(node.id);
                const isCurrentPos = currentPlayer && currentPlayer.position === node.id;

                return (
                    <div
                        key={node.id}
                        onClick={() => handleNodeClick(node.id)}
                        className={clsx(
                            "absolute transform -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full flex items-center justify-center border-4 transition-all duration-300",
                            isValidMove ? "scale-125 border-green-400 shadow-[0_0_20px_#22c55e] cursor-pointer z-20" : "bg-slate-800 z-10",
                            !isValidMove && "opacity-90"
                        )}
                        style={{
                            left: `${node.x}%`,
                            top: `${node.y}%`,
                            borderColor: isValidMove ? '#4ade80' : COLOR_MAP[node.type],
                            backgroundColor: isValidMove ? '#064e3b' : undefined
                        }}
                        title={`Node ${node.id}: ${node.type}`}
                    >
                        {Icon && <Icon size={16} color={isValidMove ? 'white' : COLOR_MAP[node.type]} />}

                        {/* Node Type Labels */}
                        {['hospital', 'money', 'charger', 'fate'].includes(node.type) && (
                            <div
                                className="absolute -top-6 whitespace-nowrap text-[12px] bg-black/80 px-2 py-0.5 rounded font-bold z-30 border border-white/10 shadow-sm"
                                style={{ color: COLOR_MAP[node.type] }}
                            >
                                {node.type === 'hospital' ? '医院' : node.type === 'money' ? '打工点' : node.type === 'charger' ? '充电桩' : '命运'}
                            </div>
                        )}

                        {/* Shop Price Tag */}
                        {node.shop && (
                            <div className="absolute -top-6 whitespace-nowrap text-[12px] bg-black/90 px-2 py-0.5 rounded text-orange-400 border border-orange-500/50 font-bold z-30">
                                {node.shop.name}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* 3. Players Layer */}
            {players.map((player, idx) => {
                const node = mapNodes[player.position];
                if (!node) return null;

                // Offset multiple players
                const offsets = [
                    { x: -6, y: -6 }, { x: 6, y: -6 },
                    { x: -6, y: 6 }, { x: 6, y: 6 }
                ];
                const off = offsets[idx % 4];

                return (
                    <div
                        key={player.id}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ease-out z-40 pointer-events-none"
                        style={{
                            left: `calc(${node.x}% + ${off.x * 2}px)`,
                            top: `calc(${node.y}% + ${off.y * 2}px)`,
                        }}
                    >
                        <div
                            className="px-2 py-1 rounded-full border-2 border-white flex items-center justify-center shadow-[0_0_10px_black] relative whitespace-nowrap text-[10px] font-bold text-white min-w-[50px]"
                            style={{ backgroundColor: player.color }}
                        >
                            <User size={12} fill="white" className="mr-1" />
                            {player.name.replace('外卖', '').replace('买菜', '')}

                            {/* Turn Indicator */}
                            {state.currentPlayerIndex === idx && (
                                <div className="absolute -inset-2 border-2 border-white rounded-full animate-ping opacity-60"></div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default GameBoard;
