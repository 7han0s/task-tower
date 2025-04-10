import React from 'react';
import './styles/App.css';
import HomeScreen from './components/HomeScreen';
import GameBoard from './components/GameBoard';
import Settings from './components/Settings';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  const [gameMode, setGameMode] = React.useState(null);
  const [lobbyCode, setLobbyCode] = React.useState('');
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  const handleGameStart = (config) => {
    setGameMode(config.mode);
    if (config.lobbyCode) {
      setLobbyCode(config.lobbyCode);
    }
  };

  return (
    <ThemeProvider>
      <div className="app">
        {/* Settings Overlay */}
        <Settings
          onClose={() => setIsSettingsOpen(false)}
          className={isSettingsOpen ? 'active' : ''}
        />

        {/* Main Content */}
        <div className="main-content">
          {gameMode ? (
            <GameBoard 
              mode={gameMode} 
              lobbyCode={lobbyCode} 
              onSettingsOpen={() => setIsSettingsOpen(true)}
            />
          ) : (
            <HomeScreen 
              onGameStart={handleGameStart} 
              onSettingsOpen={() => setIsSettingsOpen(true)}
            />
          )}
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
