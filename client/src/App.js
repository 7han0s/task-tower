import React from 'react';
import GameBoard from './components/GameBoard';
import './styles/App.css';

function App() {
  return (
    <div className="app bg-black text-white p-4 font-pixel flex flex-col items-center min-h-screen">
      <header className="app-header text-center mb-8">
        <h1 className="text-4xl font-bold">TASK TOWER PLUS</h1>
      </header>
      <main className="flex flex-col w-full max-w-6xl">
        <div className="mb-8">
          <div className="text-lg">ROUND: <span id="current-round">1</span> / <span id="total-rounds">12</span></div>
          <div id="timer-display" className="text-xl font-bold">WORK PHASE: 10:00</div>
          <div className="flex justify-between items-center">
            <button id="add-player-midgame" className="btn-primary text-xs px-2 py-1 mr-2">ADD PLAYER</button>
            <button id="pause-button" className="btn-primary">PAUSE</button>
          </div>
        </div>

        <div className="timer-bar-container w-full bg-gray-700 rounded h-4 mb-6 border-2 border-white">
          <div id="timer-bar" className="timer-bar bg-yellow-400 h-full rounded-l" style={{ width: '100%' }}></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
          <GameBoard />
        </div>

        <div id="game-instructions" className="mt-8 p-4 bg-gray-900 rounded border border-gray-700 text-sm w-full max-w-2xl mx-auto">
          <h4 className="text-center mb-3 text-yellow-400">HOW TO PLAY</h4>
          <ul className="space-y-2 text-xs">
            <li>• <span className="text-blue-400">WORK PHASE</span>: Add tasks you want to complete</li>
            <li>• <span className="text-green-400">ACTION PHASE</span>: Mark tasks as completed to build your tower</li>
            <li>• Each category (Personal, Chores, Work) gives different points</li>
            <li>• The player with the tallest tower after 12 rounds wins!</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

export default App;
