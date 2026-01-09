
import React from 'react';
import { useGame } from '../context/GameContext';
import { ShoppingBag, Zap, Banknote, Plus, HelpCircle, User, Users } from 'lucide-react';
import clsx from 'clsx';

const ICON_MAP = {
    shop: ShoppingBag,
    charger: Zap,
    money: Banknote,
    hospital: Plus,
    fate: HelpCircle,
    social: Users,
    normal: null
};

const COLOR_MAP = {
    shop: '#10b981',
    charger: '#eab308',
    money: '#3b82f6',
    hospital: '#ef4444',
    fate: '#a855f7',
    social: '#f97316',
    normal: '#64748b'
};

const GameBoard = () => {
    const { state, dispatch } = useGame();
    const { mapNodes, players, currentPlayerIndex, phase } = state;

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
        <div className="relative aspect-square w-full h-full max-w-[860px] max-h-[860px] p-3 sm:p-5 md:p-8 select-none m-auto">
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
                                stroke="rgba(255,255,255,0.1)"
                                strokeWidth="1.5"
                                className="transition-all duration-500"
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
                            stroke={isSelectable ? "#4ade80" : "rgba(34, 211, 238, 0.3)"} // Green if moving, Cyan if just looking
                            strokeWidth={isSelectable ? "3" : "1.5"}
                            strokeDasharray={isSelectable ? "6" : "3"}
                            className={isSelectable ? "animate-pulse" : ""}
                        />
                    );
                })}
            </svg>

            {/* 2. Nodes Layer */}
            {mapNodes.map(node => {
                const Icon = ICON_MAP[node.type];
                const isValidMove = validNeighbors.includes(node.id);
                // Determine if this is a special node that needs distinct coloring
                const nodeColor = isValidMove ? '#ffffff' : COLOR_MAP[node.type];
                const ringColor = isValidMove ? '#22c55e' : COLOR_MAP[node.type];

                return (
                    <div
                        key={node.id}
                        onClick={() => handleNodeClick(node.id)}
                        className={clsx(
                            "absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-all duration-300 rounded-full",
                            // Mobile size optimized: w-9 h-9 (36px)
                            "w-9 h-9 sm:w-12 sm:h-12",
                            // Modern Style: Glassmorphism + Glow
                            isValidMove 
                                ? "bg-green-500 shadow-[0_0_20px_rgba(34,197,94,0.6)] scale-110 z-20 ring-2 ring-white" 
                                : "bg-slate-900/80 backdrop-blur-sm border border-white/10 z-10 shadow-lg hover:scale-110 hover:z-30 hover:bg-slate-800",
                            !isValidMove && "opacity-90"
                        )}
                        style={{
                            left: `${node.x}%`,
                            top: `${node.y}%`,
                            borderColor: ringColor, // For border style if needed, but we use ring/bg mostly
                            // box-shadow for type glow
                            boxShadow: isValidMove ? undefined : `0 0 10px ${COLOR_MAP[node.type]}20`
                        }}
                    >
                        {Icon && <Icon size={16} className="sm:hidden" color={nodeColor} strokeWidth={2.5} />}
                        {Icon && <Icon size={20} className="hidden sm:block" color={nodeColor} strokeWidth={2.5} />}

                        {/* Node Type Labels - REMOVED for clarity on mobile, only show Shop Names */}
                        
                        {/* Shop Name Tag - Simplified */}
                        {node.shop && (
                            <div className={clsx(
                                "absolute -top-5 whitespace-nowrap px-1.5 py-0.5 rounded text-orange-300 font-bold z-30 pointer-events-none transition-all",
                                "text-[9px] sm:text-[11px] bg-black/60 backdrop-blur-md border border-orange-500/20",
                                isValidMove ? "scale-110 -top-6 bg-black/80" : ""
                            )}>
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
                            className="px-2 py-1 rounded-full border-2 border-white flex items-center justify-center shadow-[0_0_10px_black] relative whitespace-nowrap text-[10px] sm:text-[11px] font-bold text-white min-w-[44px] sm:min-w-[50px]"
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
