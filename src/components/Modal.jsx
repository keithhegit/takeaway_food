
import React from 'react';
import { useGame } from '../context/GameContext';
import clsx from 'clsx';

const Modal = () => {
    const { state, dispatch } = useGame();
    const { modal } = state;

    if (!modal) return null;

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
        title = "命运时间";
        content = <div className="text-lg p-4 text-center text-purple-200">{modal.text}</div>;
        typeColor = "border-purple-500";
        actions = (
            <button
                onClick={() => dispatch({ type: 'RESOLVE_MODAL' })}
                className="w-full py-2 bg-purple-600 rounded text-white font-bold hover:bg-purple-700"
            >
                确定
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
