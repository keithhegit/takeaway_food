
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useGame } from '../context/GameContext';
import { FACTIONS } from '../data/factions';
import clsx from 'clsx';
import { CheckCircle, User } from 'lucide-react';

const SetupScreen = () => {
    const { dispatch } = useGame();
    const [step, setStep] = useState(1); // 1: Victory Condition, 2: Player Count, 3: Faction Selection
    const [victoryTarget, setVictoryTarget] = useState(10);
    const [playerCount, setPlayerCount] = useState(4);
    const [playerConfigs, setPlayerConfigs] = useState([]); // [{ name, factionId }]
    const [currentSelector, setCurrentSelector] = useState(0); // Index of player choosing
    const [hoveredFaction, setHoveredFaction] = useState(null);
    const [hoverRect, setHoverRect] = useState(null);

    const handleVictorySelect = (target) => {
        setVictoryTarget(target);
        setStep(2);
    };

    const handleCountSelect = (count) => {
        setPlayerCount(count);
        setStep(3);
        setPlayerConfigs([]);
        setCurrentSelector(0);
    };

    const handleFactionSelect = (factionId) => {
        const newConfigs = [...playerConfigs, {
            name: `P${currentSelector + 1}`,
            factionId
        }];
        setPlayerConfigs(newConfigs);

        if (currentSelector + 1 < playerCount) {
            setCurrentSelector(currentSelector + 1);
        } else {
            // Finished
            dispatch({ type: 'INIT_GAME', payload: { playerConfigs: newConfigs, victoryTarget } });
        }
    };

    const availableFactions = FACTIONS.filter(
        f => !playerConfigs.some(p => p.factionId === f.id)
    );

    return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-slate-900 absolute inset-0 z-50 p-4 sm:p-8">
            <div className="max-w-5xl w-full bg-slate-800/90 backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-10 shadow-2xl relative overflow-hidden">
                {/* Background Deco */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-400 to-purple-500"></div>

                <h1 className="text-3xl sm:text-5xl font-bold text-center mb-6 sm:mb-10 text-white tracking-wider">
                    {step === 1 ? '胜利条件' : step === 2 ? '游戏设置' : '选择势力'}
                </h1>

                {step === 1 && (
                    <div className="text-center animate-in fade-in slide-in-from-bottom-5">
                        <label className="text-base sm:text-xl text-slate-300 mb-6 sm:mb-8 block">请选择获胜所需的店铺券数量</label>
                        <div className="flex justify-center gap-3 sm:gap-4 flex-wrap max-w-2xl mx-auto">
                            {[5, 6, 7, 8, 9, 10].map(num => (
                                <button
                                    key={num}
                                    onClick={() => handleVictorySelect(num)}
                                    className={clsx(
                                        "w-16 h-16 sm:w-20 sm:h-20 rounded-2xl text-2xl sm:text-3xl font-bold border-2 transition-all flex items-center justify-center group relative overflow-hidden",
                                        "bg-slate-700 border-slate-500 text-white hover:border-purple-400 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)]"
                                    )}
                                >
                                    <span className="relative z-10">{num}</span>
                                    <div className="absolute inset-0 bg-purple-600 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="text-center animate-in fade-in slide-in-from-bottom-5">
                        <label className="text-base sm:text-xl text-slate-300 mb-6 sm:mb-8 block">请选择能够参与外卖大战的玩家人数</label>
                        <div className="flex justify-center gap-5 sm:gap-8">
                            {[2, 3, 4].map(num => (
                                <button
                                    key={num}
                                    onClick={() => handleCountSelect(num)}
                                    className={clsx(
                                        "w-20 h-20 sm:w-24 sm:h-24 rounded-2xl text-3xl sm:text-4xl font-bold border-2 transition-all flex items-center justify-center group relative overflow-hidden",
                                        "bg-slate-700 border-slate-500 text-white hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(34,211,238,0.4)]"
                                    )}
                                >
                                    <span className="relative z-10">{num}</span>
                                    <div className="absolute inset-0 bg-cyan-600 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="animate-in fade-in slide-in-from-right-10">
                        <div className="text-center mb-6 sm:mb-8">
                            <div className="text-xl sm:text-2xl text-white mb-2">
                                玩家 <span className="text-cyan-400 font-bold">{currentSelector + 1}</span> 请选择阵营
                            </div>
                            <div className="text-slate-400">剩余可选势力: {availableFactions.length}</div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
                            {/* Detailed Info Portal */}
                            {hoveredFaction && hoverRect && createPortal(
                                <div
                                    className="fixed z-[9999] w-[400px] max-w-[90vw] p-6 bg-slate-950/95 border-2 border-cyan-400/50 rounded-2xl shadow-[0_0_50px_rgba(34,211,238,0.3)] backdrop-blur-md animate-in fade-in zoom-in-95 duration-200 pointer-events-none flex flex-col gap-4"
                                    style={{
                                        top: hoverRect.top + hoverRect.height / 2,
                                        transform: 'translateY(-50%)',
                                        left: hoverRect.left < window.innerWidth / 2 ? hoverRect.right + 24 : undefined,
                                        right: hoverRect.left >= window.innerWidth / 2 ? window.innerWidth - hoverRect.left + 24 : undefined
                                    }}
                                >
                                    {/* Header */}
                                    <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                                        <div className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-3xl text-white shadow-neon"
                                            style={{ backgroundColor: hoveredFaction.color, boxShadow: `0 0 20px ${hoveredFaction.color}` }}>
                                            {hoveredFaction.name[0]}
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-bold text-white tracking-wide" style={{ color: hoveredFaction.color }}>
                                                {hoveredFaction.name}
                                            </h4>
                                            <p className="text-slate-400 text-sm">{hoveredFaction.desc}</p>
                                        </div>
                                    </div>

                                    {/* Resources */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-900/50 p-3 rounded-lg border border-white/5 flex items-center justify-between">
                                            <span className="text-slate-400 text-sm">初始电量</span>
                                            <span className="text-green-400 font-bold font-mono text-xl">⚡ {hoveredFaction.initialPower}</span>
                                        </div>
                                        <div className="bg-slate-900/50 p-3 rounded-lg border border-white/5 flex items-center justify-between">
                                            <span className="text-slate-400 text-sm">初始资金</span>
                                            <span className="text-yellow-400 font-bold font-mono text-xl">💰 {hoveredFaction.initialMoney}</span>
                                        </div>
                                    </div>

                                    {/* Skills */}
                                    <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5">
                                        <h5 className="text-cyan-400 font-bold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                                            <span>❖</span> 核心技能
                                        </h5>
                                        <ul className="space-y-2.5">
                                            {hoveredFaction.skillsList && hoveredFaction.skillsList.map((skill, idx) => (
                                                <li key={idx} className="flex items-start gap-3 text-sm text-slate-200 leading-relaxed">
                                                    <span className="text-cyan-500 mt-1 min-w-[4px] h-4 rounded-full bg-cyan-500/50 block"></span>
                                                    <span>{skill}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>,
                                document.body
                            )}

                            {FACTIONS.map(faction => {
                                const isTaken = playerConfigs.some(p => p.factionId === faction.id);

                                return (
                                    <button
                                        key={faction.id}
                                        disabled={isTaken}
                                        onClick={() => handleFactionSelect(faction.id)}
                                        onMouseEnter={(e) => {
                                            setHoverRect(e.currentTarget.getBoundingClientRect());
                                            setHoveredFaction(faction);
                                        }}
                                        onMouseLeave={() => {
                                            setHoveredFaction(null);
                                            setHoverRect(null);
                                        }}
                                        className={clsx(
                                            "relative p-6 rounded-xl border-2 text-left transition-all duration-300 group",
                                            isTaken
                                                ? "border-slate-700 bg-slate-800/50 opacity-50 cursor-not-allowed grayscale"
                                                : "border-slate-600 bg-slate-800 hover:scale-105 hover:shadow-xl"
                                        )}
                                        style={{
                                            borderColor: !isTaken ? faction.color : undefined,
                                            boxShadow: !isTaken ? `0 0 0 1px ${faction.color}30` : 'none'
                                        }}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl text-white shadow-lg"
                                                style={{ backgroundColor: faction.color }}>
                                                {faction.name[0]}
                                            </div>
                                            {isTaken && <span className="text-red-500 font-bold text-xs uppercase tracking-widest border border-red-500/50 px-2 py-1 rounded">已选</span>}
                                        </div>

                                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">{faction.name}</h3>
                                        <div className="space-y-1">
                                            <p className="text-xs text-slate-300 bg-black/30 p-2 rounded">{faction.desc}</p>
                                            <div className="flex gap-2 text-[10px] text-slate-400 mt-2">
                                                <span>⚡ {faction.initialPower}</span>
                                                <span>💰 {faction.initialMoney}</span>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-8 flex justify-center gap-2">
                            {Array.from({ length: playerCount }).map((_, i) => (
                                <div
                                    key={i}
                                    className={clsx(
                                        "w-3 h-3 rounded-full transition-all",
                                        i < currentSelector ? "bg-green-500" : i === currentSelector ? "bg-cyan-400 scale-125 animate-pulse" : "bg-slate-600"
                                    )}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SetupScreen;
