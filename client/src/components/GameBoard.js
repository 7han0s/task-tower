import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api/game-state';

const GameBoard = () => {
    const [gameState, setGameState] = useState({
        lobbyCode: '',
        currentPhase: '',
        currentRound: 0,
        timer: 0,
        playerCount: 0,
        players: []
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchGameState = async () => {
        try {
            const response = await axios.get(API_URL);
            setGameState(response.data);
            setError('');
        } catch (err) {
            console.error('Error fetching game state:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const startGame = async () => {
        try {
            await axios.post(API_URL, {
                gameState: {
                    lobbyCode: 'GAME123',
                    currentPhase: 'work',
                    currentRound: 1,
                    timer: 60,
                    playerCount: 1,
                    players: [{
                        id: 1,
                        name: 'Player 1',
                        score: 0,
                        tasks: [{ id: 1, description: 'Sample Task', completed: false }],
                        towerBlocks: []
                    }]
                }
            });
            fetchGameState();
        } catch (err) {
            console.error('Error starting game:', err);
            setError(err.message);
        }
    };

    const handlePlayerAction = async (action) => {
        try {
            const updatedGameState = { ...gameState };
            const player = updatedGameState.players[0];

            switch (action) {
                case 'addBlock':
                    player.towerBlocks.push({ id: Date.now(), type: 'default' });
                    break;
                case 'removeBlock':
                    if (player.towerBlocks.length > 0) {
                        player.towerBlocks.pop();
                    }
                    break;
                case 'completeTask':
                    if (player.tasks.length > 0 && !player.tasks[0].completed) {
                        player.tasks[0].completed = true;
                        player.score += 10;
                    }
                    break;
            }

            await axios.post(API_URL, { gameState: updatedGameState });
            fetchGameState();
        } catch (err) {
            console.error('Error handling player action:', err);
            setError(err.message);
        }
    };

    useEffect(() => {
        fetchGameState();
        const interval = setInterval(fetchGameState, 1000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return <div className="loading">Loading game state...</div>;
    }

    if (error) {
        return <div className="error">Error: {error}</div>;
    }

    return (
        <div className="game-board">
            <div className="game-controls">
                <button
                    onClick={startGame}
                    disabled={gameState.currentPhase !== ''}
                >
                    Start Game
                </button>
                <button
                    onClick={() => handlePlayerAction('addBlock')}
                    disabled={gameState.currentPhase !== 'work'}
                >
                    Add Block
                </button>
                <button
                    onClick={() => handlePlayerAction('removeBlock')}
                    disabled={gameState.currentPhase !== 'work' || gameState.players[0]?.towerBlocks.length === 0}
                >
                    Remove Block
                </button>
                <button
                    onClick={() => handlePlayerAction('completeTask')}
                    disabled={gameState.currentPhase !== 'work' || gameState.players[0]?.tasks[0]?.completed}
                >
                    Complete Task
                </button>
            </div>

            <div className="game-info">
                <div className="phase">Phase: {gameState.currentPhase}</div>
                <div className="round">Round: {gameState.currentRound}</div>
                <div className="timer">Time: {gameState.timer}s</div>
            </div>

            <div className="player-info">
                <h3>Player Information</h3>
                {gameState.players.map((player, index) => (
                    <div key={index} className="player-card">
                        <div className="player-name">{player.name}</div>
                        <div className="player-score">Score: {player.score}</div>
                        <div className="player-tasks">
                            <h4>Tasks:</h4>
                            {player.tasks.map((task, taskIndex) => (
                                <div
                                    key={taskIndex}
                                    className={`task ${task.completed ? 'completed' : ''}`}
                                >
                                    {task.description}
                                </div>
                            ))}
                        </div>
                        <div className="player-tower">
                            <h4>Tower Blocks:</h4>
                            <div className="tower-container">
                                {player.towerBlocks.map((block, blockIndex) => (
                                    <div key={blockIndex} className="tower-block">
                                        {block.type}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GameBoard;
