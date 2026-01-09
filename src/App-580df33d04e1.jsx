
import React from 'react';
import { GameProvider, useGame } from './context/GameContext';
import GameBoard from './components/GameBoard';
import SidePanel from './components/SidePanel';
import Modal from './components/Modal';
import SetupScreen from './components/SetupScreen';

function GameLayout() {
  const { state } = useGame();

  return (
    <div className="flex w-full h-full relative">
      {state.phase === 'SETUP' && <SetupScreen />}
      <div className="flex-grow relative overflow-hidden bg-slate-900 flex justify-center items-center">
        <GameBoard />
      </div>
      <div className="w-96 flex-shrink-0 z-10 glass-panel m-4 ml-0">
        <SidePanel />
      </div>
      {state.modal && <Modal />}
      {state.winner && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 text-center animate-in fade-in duration-1000">
          <div className="p-10 border-4 border-yellow-400 rounded-2xl glow-text bg-gradient-to-b from-yellow-900/50 to-black">
            <h1 className="text-6xl font-bold text-yellow-500 mb-4">🏆 胜利 🏆</h1>
            <div className="text-4xl text-white mb-8">{state.winner} 统治了外卖江湖！</div>
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
