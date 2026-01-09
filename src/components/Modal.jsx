
import React from 'react';
import { useGame } from '../context/GameContext';
import clsx from 'clsx';

const Modal = () => {
    const { state, dispatch } = useGame();
    const { modal } = state;

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
