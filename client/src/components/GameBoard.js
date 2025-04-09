import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api/game-state';

const GameBoard = () => {
    const [gameState, setGameState] = useState({
        lobbyCode: '',
        currentPhase: 'work',
        currentRound: 1,
        timer: 600,
        playerCount: 1,
        players: []
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [taskInput, setTaskInput] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('personal');

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
                    timer: 600,
                    playerCount: 1,
                    players: [{
                        id: 1,
                        name: 'Player 1',
                        score: 0,
                        tasks: [],
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

    const handlePlayerAction = async (action, playerId, taskId) => {
        try {
            const updatedGameState = { ...gameState };
            const player = updatedGameState.players.find(p => p.id === playerId);

            if (action === 'addTask') {
                const points = {
                    personal: 1,
                    chores: 2,
                    work: 3
                }[selectedCategory];

                player.tasks.push({
                    id: Date.now(),
                    description: taskInput,
                    category: selectedCategory,
                    points,
                    completed: false
                });
                setTaskInput('');
            } else if (action === 'completeTask') {
                const task = player.tasks.find(t => t.id === taskId);
                if (task && !task.completed) {
                    task.completed = true;
                    player.score += task.points;
                    player.towerBlocks.push({
                        type: task.category,
                        points: task.points
                    });
                }
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
        const interval = setInterval(fetchGameState, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (error) {
            const retry = setTimeout(() => {
                fetchGameState();
            }, 3000);
            return () => clearTimeout(retry);
        }
    }, [error]);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading">Loading game state...</div>
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <div className="error">Error: {error}</div>
                <button onClick={fetchGameState} className="retry-button">
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="game-board-container">
            {/* Phase Indicator */}
            <div className="phase-indicator">
                <div className={`phase-dot ${gameState.currentPhase}`}></div>
                <span>{gameState.currentPhase.toUpperCase()}</span>
            </div>

            {/* Timer Display */}
            <div className="timer-display">
                <div className="time-remaining">{Math.floor(gameState.timer / 60)}:{String(gameState.timer % 60).padStart(2, '0')}</div>
                <div className="timer-bar-container">
                    <div className="timer-bar" style={{ width: `${(gameState.timer / 600) * 100}%` }}></div>
                </div>
            </div>

            {/* Player Cards Grid */}
            <div className="player-grid">
                {gameState.players.map((player) => (
                    <div key={player.id} className="player-card">
                        <div className="player-header">
                            <h3>Player {player.id}</h3>
                            <div className="player-score">Score: {player.score}</div>
                        </div>

                        {/* Task Tower */}
                        <div className="tower-container">
                            {player.towerBlocks.map((block, index) => (
                                <div
                                    key={index}
                                    className={`block ${block.type} transition-transform duration-300`}
                                    style={{
                                        animation: `slideIn ${index * 0.1 + 0.5}s ease-out`
                                    }}
                                >
                                    {block.points}
                                </div>
                            ))}
                        </div>

                        {/* Task Input Section */}
                        {gameState.currentPhase === 'work' && (
                            <div className="task-input-section">
                                <div className="task-input-group">
                                    <input
                                        type="text"
                                        value={taskInput}
                                        onChange={(e) => setTaskInput(e.target.value)}
                                        placeholder="Enter task description"
                                        className="task-input"
                                    />
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="task-category-select"
                                    >
                                        <option value="personal">Personal ( 1pt)</option>
                                        <option value="chores">Chores ( 2pt)</option>
                                        <option value="work">Work ( 3pt)</option>
                                    </select>
                                    <button
                                        onClick={() => handlePlayerAction('addTask', player.id)}
                                        className="action-btn add-task-btn"
                                    >
                                        Add Task
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Pending Tasks List */}
                        <div className="pending-tasks-list">
                            {player.tasks.map((task, index) => (
                                <div key={index} className="task-item">
                                    <span className={`task-description ${task.completed ? 'line-through' : ''}`}>
                                        {task.description} ({task.category} - {task.points}pt)
                                    </span>
                                    <button
                                        onClick={() => handlePlayerAction('completeTask', player.id, task.id)}
                                        disabled={task.completed}
                                        className={`action-btn complete-task-btn ${task.completed ? 'completed' : ''}`}
                                    >
                                        {task.completed ? '' : 'Complete'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Multiplayer Controls */}
            <div className="multiplayer-controls">
                <button className="action-btn" onClick={startGame}>
                    Start Game
                </button>
                <button className="action-btn" onClick={() => handlePlayerAction('pauseGame')}>
                    Pause Game
                </button>
                <button className="action-btn" onClick={() => handlePlayerAction('addPlayer')}>
                    Add Player
                </button>
            </div>
        </div>
    );
};

export default GameBoard;
