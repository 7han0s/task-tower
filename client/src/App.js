import React, { useState } from 'react';
import GameBoard from './components/GameBoard';
import ThemeSwitcher from './components/ThemeSwitcher';
import './styles/App.css';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <ThemeProvider>
      <div className="app-container">
        {/* Theme Switcher */}
        <ThemeSwitcher />

        {/* Settings Menu */}
        <div className={`settings-menu ${isSettingsOpen ? 'open' : ''}`}>
          <div className="settings-header">
            <h3>Settings</h3>
            <button onClick={() => setIsSettingsOpen(false)} className="close-btn">×</button>
          </div>
          <div className="settings-content">
            <div className="settings-section">
              <h4>Game Settings</h4>
              <div className="setting-item">
                <label>Round Duration</label>
                <select>
                  <option value="600">10 minutes</option>
                  <option value="900">15 minutes</option>
                  <option value="1200">20 minutes</option>
                </select>
              </div>
              <div className="setting-item">
                <label>Task Categories</label>
                <div className="category-list">
                  <div className="category-item">
                    <input type="checkbox" defaultChecked />
                    <span>Personal</span>
                  </div>
                  <div className="category-item">
                    <input type="checkbox" defaultChecked />
                    <span>Chores</span>
                  </div>
                  <div className="category-item">
                    <input type="checkbox" defaultChecked />
                    <span>Work</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="settings-section">
              <h4>UI Settings</h4>
              <div className="setting-item">
                <label>Animations</label>
                <select>
                  <option value="all">All Animations</option>
                  <option value="reduced">Reduced Animations</option>
                  <option value="none">No Animations</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setIsSettingsOpen(true)} 
          className="settings-btn"
        >
          ⚙️
        </button>

        {/* Main Content */}
        <div className="main-content">
          <header className="app-header">
            <h1>TASK TOWER PLUS</h1>
            <div className="round-info">
              <span>ROUND: <span id="current-round">1</span> / <span id="total-rounds">12</span></span>
              <span id="timer-display">WORK PHASE: 10:00</span>
            </div>
          </header>

          <main className="game-container">
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
      </div>
    </ThemeProvider>
  );
}

export default App;
