import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GameBoard = () => {
    const [gameState, setGameState] = useState({
        lobbyCode: '',
        currentPhase: '',
        currentRound: 0,
        timer: 0,
        playerCount: 0,
        players: []
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Fetch initial game state
        fetchGameState();

        // Set up interval to update game state every second
        const interval = setInterval(fetchGameState, 1000);

        // Cleanup interval on unmount
        return () => clearInterval(interval);
    }, []);

    const fetchGameState = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get('http://localhost:3001/api/game-state');
            setGameState(response.data);
        } catch (error) {
            console.error('Error fetching game state:', error);
            setError('Failed to fetch game state');
        } finally {
            setLoading(false);
        }
    };

    const handleStartGame = async () => {
        try {
            setLoading(true);
            await axios.post('http://localhost:3001/api/game-state', {
                gameState: {
                    lobbyCode: gameState.lobbyCode || 'LOBBY123',
                    currentPhase: 'work',
                    currentRound: 1,
                    timer: 1500,
                    playerCount: gameState.players.length
                }
            });
        } catch (error) {
            console.error('Error starting game:', error);
            setError('Failed to start game');
        } finally {
            setLoading(false);
        }
    };

    const handlePauseGame = async (playerId, reason) => {
        try {
            setLoading(true);
            await axios.post('http://localhost:3001/api/game-state/pause', {
                playerId,
                reason
            });
        } catch (error) {
            console.error('Error pausing game:', error);
            setError('Failed to pause game');
        } finally {
            setLoading(false);
        }
    };

    const handleResumeGame = async () => {
        try {
            setLoading(true);
            await axios.post('http://localhost:3001/api/game-state/resume');
        } catch (error) {
            console.error('Error resuming game:', error);
            setError('Failed to resume game');
        } finally {
            setLoading(false);
        }
    };

    const handleResetGame = async () => {
        try {
            setLoading(true);
            await axios.post('http://localhost:3001/api/game-state/reset', {
                lobbyCode: gameState.lobbyCode
            });
        } catch (error) {
            console.error('Error resetting game:', error);
            setError('Failed to reset game');
        } finally {
            setLoading(false);
        }
    };

    const handlePlayerAction = async (playerId, action, data) => {
        try {
            setLoading(true);
            await axios.post('http://localhost:3001/api/game-state/player/action', {
                playerId,
                action,
                data
            });
        } catch (error) {
            console.error('Error processing player action:', error);
            setError('Failed to process player action');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="game-board">
                <div className="loading">Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="game-board">
                <div className="error">{error}</div>
            </div>
        );
    }

    return (
        <div className="game-board">
            <div className="game-info">
                <h2>Game Information</h2>
                <div className="info-item">
                    <span>Lobby Code:</span>
                    <span>{gameState.lobbyCode}</span>
                </div>
                <div className="info-item">
                    <span>Phase:</span>
                    <span>{gameState.currentPhase}</span>
                </div>
                <div className="info-item">
                    <span>Round:</span>
                    <span>{gameState.currentRound}</span>
                </div>
                <div className="info-item">
                    <span>Time Remaining:</span>
                    <span>{gameState.timer}s</span>
                </div>
                <div className="info-item">
                    <span>Player Count:</span>
                    <span>{gameState.playerCount}</span>
                </div>
            </div>

            <div className="controls">
                <button 
                    onClick={handleStartGame} 
                    disabled={gameState.currentPhase !== ''}
                >
                    Start Game
                </button>
                <button 
                    onClick={() => handlePauseGame(gameState.players[0]?.id, 'Break time')}
                    disabled={gameState.currentPhase === 'paused'}
                >
                    Pause Game
                </button>
                <button 
                    onClick={handleResumeGame}
                    disabled={gameState.currentPhase !== 'paused'}
                >
                    Resume Game
                </button>
                <button 
                    onClick={handleResetGame}
                    disabled={gameState.currentPhase === ''}
                >
                    Reset Game
                </button>
            </div>

            <div className="players-section">
                <h2>Players</h2>
                <div className="players-list">
                    {gameState.players.map((player) => (
                        <div key={player.id} className="player-card">
                            <h3>{player.name}</h3>
                            <p>Score: {player.score}</p>
                            <div className="player-actions">
                                <button 
                                    onClick={() => handlePlayerAction(player.id, 'add-block', { block: 'block1' })}
                                    disabled={gameState.currentPhase !== 'work'}
                                >
                                    Add Block
                                </button>
                                <button 
                                    onClick={() => handlePlayerAction(player.id, 'remove-block', { block: player.towerBlocks[0] })}
                                    disabled={gameState.currentPhase !== 'work' || !player.towerBlocks.length}
                                >
                                    Remove Block
                                </button>
                                {player.tasks.length > 0 && (
                                    <button 
                                        onClick={() => handlePlayerAction(player.id, 'complete-task', { task: player.tasks[0], points: 10 })}
                                        disabled={gameState.currentPhase !== 'work'}
                                    >
                                        Complete Task
                                    </button>
                                )}
                            </div>
                            <div className="player-tasks">
                                <h4>Tasks:</h4>
                                <ul>
                                    {player.tasks.map((task, index) => (
                                        <li key={index}>{task}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default GameBoard;
