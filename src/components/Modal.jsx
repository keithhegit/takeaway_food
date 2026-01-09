
import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { Shield, Target, Search, Coins, XCircle, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

const Modal = () => {
    const { state, dispatch } = useGame();
    const { modal } = state;

    // Mini-game states
    const [heistCards, setHeistCards] = useState([]);
    const [flippedIndices, setFlippedIndices] = useState([]);
    const [heistTotal, setHeistTotal] = useState(0);
    const [heistFinished, setHeistFinished] = useState(false);

    // Initialize heist game when modal opens
    useEffect(() => {
        if (modal?.type === 'HEIST') {
            const cards = [...Array(4).fill('money'), ...Array(5).fill('empty')]
                .sort(() => Math.random() - 0.5);
            setHeistCards(cards);
            setFlippedIndices([]);
            setHeistTotal(0);
            setHeistFinished(false);
        }
    }, [modal?.type]);

    if (!modal) return null;

    const currentPlayer = state.players[state.currentPlayerIndex];
    const isAI = currentPlayer.isAI;

    let title, content, actions, typeColor;

    if (modal.type === 'SHOP') {
        const { shop } = modal;
        const player = state.players[state.currentPlayerIndex];
        title = `到达店铺: ${shop.name}`;
        content = (
            <div className="space-y-2">
                <div className="flex justify-between border-b border-white/10 pb-2">
                    <span>分类</span>
                    <span className="text-cyan-400">{shop.type}</span>
                </div>
                <div className="flex justify-between border-b border-white/10 pb-2">
                    <span>价格</span>
                    <span className="text-yellow-400 font-mono text-lg">{shop.price} 元</span>
                </div>
                <div className="flex justify-between items-center bg-slate-900 p-2 rounded">
                    <span>当前资金</span>
                    <span className={clsx("font-bold", player.money >= shop.price ? "text-green-400" : "text-red-400")}>
                        {player.money} 元
                    </span>
                </div>
            </div>
        );
        typeColor = "border-green-500";
        actions = (
            <>
                <button
                    onClick={() => dispatch({ type: 'SKIP_BUY' })}
                    className="px-4 py-2 rounded text-slate-400 hover:text-white hover:bg-slate-700"
                >
                    离开
                </button>
                <button
                    onClick={() => dispatch({ type: 'BUY_SHOP', payload: { shop } })}
                    disabled={player.money < shop.price}
                    className="px-6 py-2 rounded bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    购买
                </button>
            </>
        );
    } else if (modal.type === 'FATE') {
        const { event } = modal;
        const categoryLabels = {
            gain: { label: '增益', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
            loss: { label: '损益', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
            strategy: { label: '策略', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' }
        };
        const cat = categoryLabels[event.category] || categoryLabels.strategy;

        title = "命运时间";
        content = (
            <div className="flex flex-col items-center">
                {/* Receipt Header */}
                <div className="w-full bg-white text-slate-900 p-6 rounded-sm shadow-inner relative overflow-hidden font-mono text-sm mb-4 border-b-4 border-dashed border-slate-300">
                    <div className="absolute top-0 left-0 w-full h-1 bg-slate-800 opacity-10"></div>
                    <div className="flex justify-between mb-4 border-b border-slate-200 pb-2">
                        <span>订单号: #{Math.floor(Math.random() * 900000) + 100000}</span>
                        <span>{new Date().toLocaleTimeString()}</span>
                    </div>
                    
                    <div className="text-center py-4 mb-4 border-b-2 border-slate-100">
                        <div className={clsx("inline-block px-2 py-0.5 rounded text-[10px] font-bold mb-2 border", cat.border, cat.color, cat.bg)}>
                            {cat.label}
                        </div>
                        <div className="text-lg font-bold leading-tight px-2 text-slate-800">
                            {modal.text}
                        </div>
                    </div>

                    <div className="space-y-1 text-[10px] text-slate-500">
                        <div className="flex justify-between">
                            <span>配送员:</span>
                            <span>{currentPlayer.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>站点:</span>
                            <span>命运中转站</span>
                        </div>
                    </div>
                </div>
                <div className="text-xs text-slate-500 italic">“无论结果如何，请继续前进。”</div>
            </div>
        );
        typeColor = cat.border.replace('/30', ''); // Use a slightly more opaque version for the outer border
        actions = (
            <button
                onClick={() => dispatch({ type: 'RESOLVE_MODAL' })}
                className={clsx(
                    "w-full py-3 rounded-lg text-white font-bold transition-all shadow-lg",
                    event.category === 'gain' ? "bg-green-600 hover:bg-green-500" :
                    event.category === 'loss' ? "bg-red-600 hover:bg-red-500" :
                    "bg-purple-600 hover:bg-purple-500"
                )}
            >
                收到，继续出发
            </button>
        );
    } else if (modal.type === 'SHUTDOWN') {
        const enemiesWithShops = state.players.filter(p => p.id !== state.currentPlayerIndex && p.coupons.length > 0);
        
        title = "破坏计划";
        typeColor = "border-orange-500";
        
        if (enemiesWithShops.length === 0) {
            content = (
                <div className="text-center py-8">
                    <div className="text-slate-400 mb-4">当前没有可破坏的目标（对手均无店铺）</div>
                    <div className="text-xs text-slate-500">“有时候，没有对手也是一种寂寞。”</div>
                </div>
            );
            actions = (
                <button
                    onClick={() => dispatch({ type: 'CANCEL_SOCIAL' })}
                    className="w-full py-2 rounded bg-slate-700 text-white"
                >
                    无功而返
                </button>
            );
        } else {
            content = (
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    <div className="text-sm text-slate-400 mb-2">选择一个目标进行破坏：</div>
                    {enemiesWithShops.map(enemy => (
                        <div key={enemy.id} className="border border-white/10 rounded-lg p-3 bg-slate-900/50">
                            <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: enemy.color}}></div>
                                    <span className="font-bold text-white">{enemy.name}</span>
                                </div>
                                {enemy.shields > 0 && (
                                    <div className="flex items-center gap-1 text-cyan-400 text-xs font-mono bg-cyan-400/10 px-1.5 py-0.5 rounded border border-cyan-400/20">
                                        <Shield size={10} /> x{enemy.shields}
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {enemy.coupons.map((shop, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => dispatch({ type: 'PERFORM_SHUTDOWN', payload: { targetId: enemy.id, shopIndex: idx } })}
                                        className="group relative flex items-center justify-between text-[10px] bg-slate-800 hover:bg-red-600/80 p-2 rounded border border-white/5 transition-all text-slate-300 hover:text-white"
                                    >
                                        <span className="truncate mr-1">{shop.name}</span>
                                        <Target size={12} className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            );
            actions = (
                <button
                    onClick={() => dispatch({ type: 'CANCEL_SOCIAL' })}
                    className="px-4 py-2 rounded text-slate-400 hover:text-white"
                >
                    放弃机会
                </button>
            );
        }
    } else if (modal.type === 'HEIST') {
        title = "黑客行动";
        typeColor = "border-cyan-500";

        const handleFlip = (index) => {
            if (heistFinished || flippedIndices.includes(index) || flippedIndices.length >= 3) return;
            
            const newFlipped = [...flippedIndices, index];
            setFlippedIndices(newFlipped);
            
            if (heistCards[index] === 'money') {
                setHeistTotal(prev => prev + 2);
            }
            
            if (newFlipped.length === 3) {
                setTimeout(() => setHeistFinished(true), 1000);
            }
        };

        content = (
            <div className="flex flex-col items-center">
                <div className="flex justify-between w-full mb-4 px-2">
                    <div className="text-xs text-slate-400">
                        次数: <span className="text-white font-mono">{flippedIndices.length} / 3</span>
                    </div>
                    <div className="text-xs text-slate-400">
                        获得: <span className="text-cyan-400 font-mono">{heistTotal} 元</span>
                    </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
                    {heistCards.map((card, idx) => {
                        const isFlipped = flippedIndices.includes(idx);
                        return (
                            <button
                                key={idx}
                                onClick={() => handleFlip(idx)}
                                disabled={heistFinished || isFlipped}
                                className={clsx(
                                    "aspect-square rounded-lg flex items-center justify-center transition-all duration-500 preserve-3d relative",
                                    isFlipped ? "rotate-y-180" : "hover:scale-105 hover:shadow-cyan-500/20 shadow-md",
                                    !isFlipped && "bg-slate-700 border-2 border-cyan-500/30",
                                    isFlipped && card === 'money' && "bg-cyan-500/20 border-2 border-cyan-500",
                                    isFlipped && card === 'empty' && "bg-slate-900 border-2 border-white/10 opacity-50"
                                )}
                            >
                                {!isFlipped ? (
                                    <Search size={20} className="text-cyan-500/50" />
                                ) : (
                                    card === 'money' ? <Coins size={24} className="text-cyan-400" /> : <XCircle size={24} className="text-slate-600" />
                                )}
                            </button>
                        );
                    })}
                </div>
                
                <div className="mt-6 text-[10px] text-slate-500 text-center px-4 italic">
                    “在 3x3 矩阵中翻开卡片。找到 <span className="text-cyan-400">金币</span> 即可窃取对手资金。”
                </div>
            </div>
        );

        actions = (
            <button
                onClick={() => dispatch({ type: 'PERFORM_HEIST', payload: { amount: heistTotal } })}
                disabled={!heistFinished && flippedIndices.length < 3}
                className={clsx(
                    "w-full py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2",
                    (heistFinished || flippedIndices.length >= 3) 
                        ? "bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg" 
                        : "bg-slate-700 text-slate-400 cursor-not-allowed"
                )}
            >
                {heistFinished ? "收工离场" : `还需要翻开 ${3 - flippedIndices.length} 张卡`}
                {heistFinished && <ChevronRight size={18} />}
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm">
            <div className={clsx(
                "bg-slate-800 border-2 rounded-xl p-4 sm:p-6 max-w-md w-full mx-4 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden animate-in fade-in zoom-in duration-200",
                typeColor,
                isAI && "pointer-events-none"
            )}>
                {isAI && (
                    <div className="absolute top-0 right-0 bg-cyan-600/20 text-cyan-400 text-xs px-2 py-1 rounded-bl-lg font-mono border-b border-l border-cyan-500/30">
                        AI DECIDING...
                    </div>
                )}
                <h2 className="text-xl sm:text-2xl font-bold mb-4 text-white text-shadow-md">{title}</h2>
                <div className="mb-6 sm:mb-8">{content}</div>
                <div className="flex justify-end gap-3">{actions}</div>
            </div>
        </div>
    );
};

export default Modal;
