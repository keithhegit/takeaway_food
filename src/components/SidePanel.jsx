
import React from 'react';
import { createPortal } from 'react-dom';
import { useGame } from '../context/GameContext';
import { Battery, Coins, Ticket, Dices } from 'lucide-react';
import clsx from 'clsx';
import { FACTIONS } from '../data/factions';

const PlayerCard = ({ player, isActive }) => {
    const [statusRect, setStatusRect] = React.useState(null);
    const [showStatus, setShowStatus] = React.useState(false);

    const faction = FACTIONS.find(f => f.id === player.factionId);

    return (
        <div className={clsx(
            "p-2 rounded-lg mb-1 border transition-all relative flex flex-col gap-1",
            isActive ? "bg-slate-700 border-white shadow-md z-10" : "bg-slate-800 border-slate-600"
        )} style={{ borderColor: isActive ? player.color : undefined }}>
            <div className="flex items-center gap-2">
                {/* Faction Icon */}
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-sm"
                    style={{ backgroundColor: faction.color }}>
                    {faction.name[0]}
                </div>

                {/* Name */}
                <span
                    className="font-bold text-sm cursor-help hover:underline decoration-dash underline-offset-4 truncate"
                    style={{ color: player.color }}
                    onMouseEnter={(e) => {
                        setStatusRect(e.currentTarget.getBoundingClientRect());
                        setShowStatus(true);
                    }}
                    onMouseLeave={() => setShowStatus(false)}
                >
                    {player.name}
                </span>
            </div>

            {/* Status Tooltip Trigger wrapper removed. Faction name removed as per request. */}
            {/* Header closed above */}
            <div className="flex gap-3 text-xs">
                <div className="flex items-center gap-1 text-yellow-400"><Coins size={12} /> {player.money}</div>
                <div className="flex items-center gap-1 text-green-400"><Battery size={12} /> {player.power}</div>
                <div className="flex items-center gap-1 text-pink-400">
                    <Ticket size={12} /> {player.coupons.length}/10
                </div>
            </div>

            {/* Portal-based Status Tooltip */}
            {
                showStatus && statusRect && createPortal(
                    <div
                        className="fixed bg-slate-900/95 border border-slate-500 rounded-xl p-4 shadow-2xl z-[9999] backdrop-blur-md animate-in fade-in zoom-in-95 origin-right"
                        style={{
                            // Clamp vertical position to prevent top/bottom clipping (assuming ~300px height)
                            top: Math.max(160, Math.min(window.innerHeight - 160, statusRect.top + statusRect.height / 2)),
                            right: window.innerWidth - statusRect.left + 16, // Position to the left of the panel
                            transform: 'translateY(-50%)',
                            width: '16rem'
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-2">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white"
                                style={{ backgroundColor: faction.color }}>
                                {faction.name[0]}
                            </div>
                            <div>
                                <div className="font-bold text-white text-sm">{faction.name}</div>
                                <div className="text-[10px] text-slate-400">{faction.desc}</div>
                            </div>
                        </div>

                        {/* Resources */}
                        <div className="grid grid-cols-2 gap-2 mb-3">
                            <div className="bg-black/30 p-2 rounded flex flex-col items-center">
                                <span className="text-[10px] text-slate-400">资金</span>
                                <span className="text-yellow-400 font-mono font-bold">{player.money}</span>
                            </div>
                            <div className="bg-black/30 p-2 rounded flex flex-col items-center">
                                <span className="text-[10px] text-slate-400">电量</span>
                                <span className="text-green-400 font-mono font-bold">{player.power}</span>
                            </div>
                        </div>

                        {/* Status Effects */}
                        <div className="mb-3">
                            <div className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider">当前状态</div>
                            <div className="flex flex-wrap gap-1">
                                {/* Active Buffs */}
                                {player.buffs && player.buffs.map((b, i) => {
                                    if (typeof b === 'string') return null;
                                    return (
                                        <span key={`buff-${i}`} className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-[10px] border border-orange-500/50 rounded flex items-center gap-1">
                                            <span>{b.label}</span>
                                            <span className="font-mono text-white/50 border-l border-white/20 pl-1">{b.duration}</span>
                                        </span>
                                    );
                                })}
                                {player.isSkipped && (
                                    <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] border border-red-500/50 rounded">暂停一回合</span>
                                )}
                                {isActive && (
                                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] border border-green-500/50 rounded">行动中</span>
                                )}
                                {!player.isSkipped && !isActive && (!player.buffs || player.buffs.length === 0) && (
                                    <span className="text-slate-600 text-[10px]">正常</span>
                                )}
                            </div>
                        </div>

                        {/* Coupons Summary */}
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] text-slate-500 uppercase tracking-wider">店铺券 ({player.coupons.length}/10)</span>
                            </div>
                            <div className="space-y-1">
                                {player.coupons.length === 0 ? (
                                    <div className="text-[10px] text-slate-600 italic">暂无店铺</div>
                                ) : (
                                    player.coupons.map((c, i) => (
                                        <div key={i} className="flex justify-between text-[10px] bg-white/5 px-2 py-1 rounded">
                                            <span className="text-slate-300">{c.name}</span>
                                            <span className="text-cyan-600/70">{c.type}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }
        </div >
    );
};

const SidePanel = () => {
    const { state, dispatch } = useGame();

    // Removed Auto-Init useEffect

    const handleRoll = () => {
        dispatch({ type: 'ROLL_DICE' });
    };

    const currentPlayerIndex = state.currentPlayerIndex;
    const activePlayer = state.players[state.currentPlayerIndex];
    const [targetMode, setTargetMode] = React.useState(false);

    React.useEffect(() => {
        setTargetMode(false);
    }, [currentPlayerIndex]);

    return (
        <div className="flex flex-col h-full p-3 sm:p-4">
            {/* Header */}
            <h1 className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500 mb-3 sm:mb-4 tracking-wider">
                外卖势力大富翁
            </h1>

            {/* Players List */}
            <div className="flex-grow min-h-0 overflow-y-auto mb-3 sm:mb-4">
                {state.players.map((p, idx) => (
                    <PlayerCard key={p.id} player={p} isActive={idx === state.currentPlayerIndex} />
                ))}
            </div>

            {/* Active Control Area */}
            {activePlayer && (
                <div className="bg-slate-800 p-3 sm:p-4 rounded-xl border border-slate-600 mb-3 sm:mb-4">
                    <div className="text-sm text-slate-400 mb-2">当前行动: <span className="text-white font-bold">{activePlayer.name}</span></div>

                    <div className="flex flex-col gap-2">
                        {/* Active Skill Area */}
                        {activePlayer.stats.faction.activeSkill && (
                            <div className="mb-3 p-2 bg-slate-900/80 rounded border border-purple-500/30">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-bold text-purple-400">
                                        ⚡ 专属技能: {activePlayer.stats.faction.activeSkill.id === 'pause_enemy' ? '强制暂停' : '电能转化'}
                                    </span>
                                    {activePlayer.skillCooldown > 0 ? (
                                        <span className="text-[10px] text-red-400 font-mono">
                                            冷却: {activePlayer.skillCooldown} 回合
                                        </span>
                                    ) : (
                                        <span className="text-[10px] text-green-400">Ready</span>
                                    )}
                                </div>
                                <div className="text-[10px] text-slate-400 mb-2 leading-tight">{activePlayer.stats.faction.activeSkill.desc}</div>

                                {activePlayer.stats.faction.activeSkill.id === 'pause_enemy' ? (
                                    !targetMode ? (
                                        <button
                                            disabled={activePlayer.skillCooldown > 0 || state.phase !== 'IDLE' || activePlayer.money < activePlayer.stats.faction.activeSkill.cost}
                                            onClick={() => setTargetMode(true)}
                                            className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 text-xs text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-purple-500"
                                        >
                                            发动技能
                                        </button>
                                    ) : (
                                        <div className="flex flex-col gap-1 animate-in fade-in slide-in-from-top-2">
                                            <div className="text-[10px] text-center text-slate-400 mb-1">选择干扰目标:</div>
                                            <div className="grid grid-cols-2 gap-1">
                                                {state.players.map((p, idx) => {
                                                    if (idx === currentPlayerIndex) return null;
                                                    return (
                                                        <button
                                                            key={idx}
                                                            onClick={() => {
                                                                dispatch({ type: 'USE_SKILL', payload: { targetId: idx } });
                                                                setTargetMode(false);
                                                            }}
                                                            className="px-2 py-1 bg-red-500/20 hover:bg-red-500/50 border border-red-500/50 text-red-200 rounded text-[10px] transition-colors"
                                                        >
                                                            {p.name}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <button
                                                onClick={() => setTargetMode(false)}
                                                className="mt-1 w-full py-1 text-[10px] text-slate-500 hover:text-slate-300 hover:bg-white/5 rounded"
                                            >
                                                取消
                                            </button>
                                        </div>
                                    )
                                ) : (
                                    <button
                                        disabled={activePlayer.skillCooldown > 0 || state.phase !== 'IDLE' || activePlayer.power < activePlayer.stats.faction.activeSkill.costPower}
                                        onClick={() => dispatch({ type: 'USE_SKILL' })}
                                        className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-xs text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-blue-500"
                                    >
                                        发动技能
                                    </button>
                                )}
                            </div>
                        )}

                        {state.phase === 'IDLE' && (
                            <button
                                onClick={handleRoll}
                                className="btn-primary w-full flex items-center justify-center gap-2 py-3 shadow-lg shadow-cyan-500/20"
                            >
                                <Dices size={20} /> 掷骰子 (1-3)
                            </button>
                        )}

                        {state.phase === 'MOVING' && (
                            <div className="text-center p-2 bg-slate-900 rounded border border-slate-700">
                                <div className="text-slate-400 text-xs">剩余步数</div>
                                <div className="text-2xl font-mono text-cyan-400">{state.pendingMove}</div>
                                <div className="text-xs text-orange-400 mt-1">请点击地图格子移动</div>
                            </div>
                        )}

                        {/* Log */}
                        <div className="mt-3 sm:mt-4 h-28 sm:h-32 overflow-y-auto text-xs font-mono text-slate-400 bg-black p-2 rounded">
                            {state.gameLog.map((l, i) => (
                                <div key={i} className="mb-1 border-b border-white/5 pb-1">{l}</div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SidePanel;
