
import React from 'react';
import { GameProvider, useGame } from './context/GameContext';
import GameBoard from './components/GameBoard';
import SidePanel from './components/SidePanel';
import Modal from './components/Modal';
import SetupScreen from './components/SetupScreen';

function GameLayout() {
  const { state, dispatch } = useGame();
  const [mobilePanelOpen, setMobilePanelOpen] = React.useState(false);

  const activePlayer = state.players[state.currentPlayerIndex];
  const canRoll = state.phase === 'IDLE' && !state.modal && !state.winner;

  return (
    <div className="relative w-full h-[100dvh] md:h-full flex flex-col md:flex-row">
      {state.phase === 'SETUP' && <SetupScreen />}
      <div className="relative flex-1 min-h-0 overflow-hidden bg-slate-900 flex justify-center items-center">
        <GameBoard />

        {state.phase !== 'SETUP' && (
          <div className="md:hidden absolute top-0 left-0 right-0 z-20 pt-[env(safe-area-inset-top)] px-3">
            <div className="glass-panel mt-3 px-3 py-2 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] text-slate-300">当前行动</div>
                <div className="text-sm font-bold truncate" style={{ color: activePlayer?.color }}>
                  {activePlayer?.name || '-'}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => dispatch({ type: 'ROLL_DICE' })}
                  disabled={!canRoll}
                  className="px-3 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-cyan-500 to-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  掷骰
                </button>
                <button
                  onClick={() => setMobilePanelOpen(v => !v)}
                  className="px-3 py-2 rounded-lg text-xs font-bold bg-slate-800/70 border border-white/10 text-white"
                >
                  {mobilePanelOpen ? '收起' : '面板'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="hidden md:block w-96 flex-shrink-0 z-10 glass-panel m-4 ml-0 overflow-hidden">
        <SidePanel />
      </div>
      {state.phase !== 'SETUP' && (
        <div
          className={[
            'md:hidden w-full px-3 pb-[calc(env(safe-area-inset-bottom)+12px)]',
            mobilePanelOpen ? 'h-[56dvh]' : 'h-[76px]',
            'transition-[height] duration-300 ease-out',
          ].join(' ')}
        >
          <div className="glass-panel h-full overflow-hidden flex flex-col">
            <button
              onClick={() => setMobilePanelOpen(v => !v)}
              className="w-full flex items-center justify-between px-4 h-[76px] border-b border-white/10"
            >
              <div className="text-left">
                <div className="text-xs text-slate-300">外卖势力大富翁</div>
                <div className="text-[11px] text-slate-400">
                  {state.phase === 'MOVING' ? `移动中：剩余 ${state.pendingMove} 步` : '状态与操作面板'}
                </div>
              </div>
              <div className="text-xs font-bold text-cyan-300">
                {mobilePanelOpen ? '向下收起' : '向上展开'}
              </div>
            </button>
            <div
              className={[
                'flex-1 min-h-0 transition-opacity duration-200',
                mobilePanelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
              ].join(' ')}
            >
              <SidePanel />
            </div>
          </div>
        </div>
      )}
      {state.modal && <Modal />}
      {state.winner && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 text-center animate-in fade-in duration-1000">
          <div className="p-6 sm:p-10 border-4 border-yellow-400 rounded-2xl glow-text bg-gradient-to-b from-yellow-900/50 to-black mx-4 max-w-[min(44rem,calc(100vw-2rem))]">
            <h1 className="text-4xl sm:text-6xl font-bold text-yellow-500 mb-4">🏆 胜利 🏆</h1>
            <div className="text-2xl sm:text-4xl text-white mb-6 sm:mb-8">{state.winner} 统治了外卖江湖！</div>
            <div className="text-xl text-yellow-200">集齐 {state.victoryTarget} 张店铺券</div>
            <button onClick={() => window.location.reload()} className="mt-8 px-8 py-3 bg-yellow-600 rounded text-white font-bold hover:bg-yellow-500">再来一局</button>
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <GameProvider>
      <GameLayout />
    </GameProvider>
  );
}

export default App;
