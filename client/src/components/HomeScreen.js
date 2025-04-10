import React, { useState } from 'react';
import './HomeScreen.css';
import { useTheme } from '../contexts/ThemeContext';

const HomeScreen = ({ onGameStart, onSettingsOpen }) => {
  const { theme, variant } = useTheme();
  const [selectedMode, setSelectedMode] = useState('solo');
  const [lobbyCode, setLobbyCode] = useState('');
  const [isLobbyCodeValid, setIsLobbyCodeValid] = useState(true);

  const handleSoloStart = () => {
    onGameStart({ mode: 'solo' });
  };

  const handleMultiplayerStart = async () => {
    if (!lobbyCode) {
      alert('Please enter a lobby code');
      return;
    }

    // Validate lobby code format
    const isValidLobbyCode = /^[A-Z0-9_]+$/.test(lobbyCode);
    if (!isValidLobbyCode) {
      setIsLobbyCodeValid(false);
      return;
    }
    setIsLobbyCodeValid(true);

    onGameStart({ mode: 'multiplayer', lobbyCode });
  };

  return (
    <div className={`home-screen ${theme} ${variant}`}>
      {/* Settings Button */}
      <button 
        onClick={onSettingsOpen} 
        className="settings-btn"
      >
        ⚙️
      </button>

      <div className="home-content">
        <h1>Task Tower</h1>
        
        {/* Game Mode Selection */}
        <div className="mode-selection">
          <button
            className={`mode-btn ${selectedMode === 'solo' ? 'active' : ''}`}
            onClick={() => setSelectedMode('solo')}
          >
            Solo Mode
          </button>
          <button
            className={`mode-btn ${selectedMode === 'multiplayer' ? 'active' : ''}`}
            onClick={() => setSelectedMode('multiplayer')}
          >
            Multiplayer
          </button>
        </div>

        {/* Lobby Code Input for Multiplayer */}
        {selectedMode === 'multiplayer' && (
          <div className="lobby-input">
            <div className="lobby-code-container">
              <input
                type="text"
                value={lobbyCode}
                onChange={(e) => {
                  setLobbyCode(e.target.value);
                  setIsLobbyCodeValid(true);
                }}
                placeholder="Enter lobby code"
                className={`lobby-code-input ${isLobbyCodeValid ? '' : 'invalid'}`}
              />
              {!isLobbyCodeValid && (
                <span className="validation-error">Invalid lobby code format</span>
              )}
              <button className="create-lobby-btn" onClick={() => setLobbyCode('NEW')}>
                Create New Lobby
              </button>
            </div>
          </div>
        )}

        {/* Start Game Button */}
        <button
          className="start-game-btn"
          onClick={selectedMode === 'solo' ? handleSoloStart : handleMultiplayerStart}
        >
          Start Game
        </button>
      </div>
    </div>
  );
};

export default HomeScreen;
