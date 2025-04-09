import React from 'react';
import GameBoard from './components/GameBoard';
import './styles/App.css';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Task Tower</h1>
      </header>
      <main>
        <GameBoard />
      </main>
    </div>
  );
}

export default App;
