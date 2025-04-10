import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';
import ThemeSwitcher from './ThemeSwitcher';
import gameSheets from '../services/game-sheets';
import { useGame } from '../hooks/useGame';

const GameBoard = ({ mode, lobbyCode, onSettingsOpen }) => {
    const { theme, variant, toggleTheme, setTheme, setVariant } = useContext(ThemeContext);
    const [gameState, setGameState] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const [taskInput, setTaskInput] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Personal');

    // Initialize game state
    useEffect(() => {
        const fetchGameState = async () => {
            try {
                const state = await gameSheets.fetchGameState(lobbyCode);
                setGameState(state);
                setError('');
            } catch (err) {
                console.error('Error fetching game state:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchGameState();
    }, [lobbyCode]);

    // Handle menu drag
    const handleMenuDrag = (e) => {
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.width / 2;
        const y = e.clientY - rect.height / 2;
        setMenuPosition({ x, y });
    };

    // Handle menu click
    const handleMenuClick = (e) => {
        e.stopPropagation();
        setIsMenuOpen(true);
    };

    // Handle menu close
    const handleMenuClose = () => {
        setIsMenuOpen(false);
    };

    // Handle theme switch
    const handleThemeSwitch = (newTheme) => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    // Handle variant switch
    const handleVariantSwitch = (newVariant) => {
        setVariant(newVariant);
        localStorage.setItem('variant', newVariant);
    };

    const handleTaskAdd = async (playerId, task) => {
        try {
            const updatedGameState = { ...gameState };
            const player = updatedGameState.players.find(p => p.id === playerId);
            if (player) {
                const points = {
                    Personal: 1,
                    Chores: 2,
                    Work: 3
                }[selectedCategory];

                const newTask = {
                    id: Date.now(),
                    text: taskInput,
                    category: selectedCategory,
                    points,
                    completed: false,
                    subtasks: []
                };

                player.tasks.push(newTask);
                setTaskInput('');
                
                // Save to server
                if (mode === 'multiplayer') {
                    await gameSheets.addTask(lobbyCode, playerId, newTask);
                }
                setGameState(updatedGameState);
            }
        } catch (error) {
            console.error('Error adding task:', error);
            setError('Failed to add task');
        }
    };

    const handleTaskComplete = async (playerId, taskId) => {
        try {
            const updatedGameState = { ...gameState };
            const player = updatedGameState.players.find(p => p.id === playerId);
            if (player) {
                const task = player.tasks.find(t => t.id === taskId);
                if (task && !task.completed) {
                    task.completed = true;
                    player.score += task.points;
                    
                    // Save to server
                    if (mode === 'multiplayer') {
                        await gameSheets.completeTask(lobbyCode, playerId, taskId);
                    }
                    setGameState(updatedGameState);
                }
            }
        } catch (error) {
            console.error('Error completing task:', error);
            setError('Failed to complete task');
        }
    };

    const handleSubtaskComplete = async (playerId, taskId, subtaskId) => {
        try {
            const updatedGameState = { ...gameState };
            const player = updatedGameState.players.find(p => p.id === playerId);
            if (player) {
                const task = player.tasks.find(t => t.id === taskId);
                if (task) {
                    const subtask = task.subtasks.find(s => s.id === subtaskId);
                    if (subtask && !subtask.completed) {
                        subtask.completed = true;
                        // Check if all subtasks are complete
                        const allSubtasksComplete = task.subtasks.every(s => s.completed);
                        if (allSubtasksComplete) {
                            task.completed = true;
                            player.score += task.points;
                        }
                        
                        // Save to server
                        if (mode === 'multiplayer') {
                            await gameSheets.completeSubtask(lobbyCode, playerId, taskId, subtaskId);
                        }
                        setGameState(updatedGameState);
                    }
                }
            }
        } catch (error) {
            console.error('Error completing subtask:', error);
            setError('Failed to complete subtask');
        }
    };

    const handleAddSubtask = async (playerId, taskId, subtask) => {
        try {
            const updatedGameState = { ...gameState };
            const player = updatedGameState.players.find(p => p.id === playerId);
            if (player) {
                const task = player.tasks.find(t => t.id === taskId);
                if (task) {
                    const newSubtask = {
                        id: Date.now(),
                        text: subtask,
                        completed: false
                    };
                    task.subtasks.push(newSubtask);
                    
                    // Save to server
                    if (mode === 'multiplayer') {
                        await gameSheets.addSubtask(lobbyCode, playerId, taskId, newSubtask);
                    }
                    setGameState(updatedGameState);
                }
            }
        } catch (error) {
            console.error('Error adding subtask:', error);
            setError('Failed to add subtask');
        }
    };

    const getCategoryColor = (category) => {
        const colors = {
            Personal: '#dc3545',
            Chores: '#0d6efd',
            Work: '#4CAF50'
        };
        return colors[category] || '#6c757d';
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <p>{error}</p>
                <button onClick={() => window.location.reload()}>Retry</button>
            </div>
        );
    }

    return (
        <>
            <div className={`game-board ${theme} ${variant}`}>
                <div className="game-container">
                    {/* Theme Switcher */}
                    <ThemeSwitcher 
                        theme={theme} 
                        variant={variant} 
                        onThemeSwitch={handleThemeSwitch} 
                        onVariantSwitch={handleVariantSwitch}
                    />

                    {/* Menu Button */}
                    <button
                        onClick={handleMenuClick}
                        className="menu-btn"
                    >
                        ≡
                    </button>

                    {/* Menu */}
                    {isMenuOpen && (
                        <div
                            className="menu"
                            style={{ left: `${menuPosition.x}px`, top: `${menuPosition.y}px` }}
                            onMouseDown={handleMenuDrag}
                        >
                            <div className="menu-content">
                                <button onClick={handleMenuClose} className="close-btn">×</button>
                                <div className="menu-section">
                                    <h3>Settings</h3>
                                    <button onClick={onSettingsOpen}>Open Settings</button>
                                </div>
                                <div className="menu-section">
                                    <h3>Game Mode</h3>
                                    <p>{mode === 'multiplayer' ? 'Multiplayer' : 'Solo'}</p>
                                </div>
                                <div className="menu-section">
                                    <h3>Theme</h3>
                                    <p>{theme} {variant}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Game Content */}
                    <div className="game-content">
                        {/* Task Categories */}
                        <div className="task-categories">
                            {['Personal', 'Chores', 'Work'].map(category => (
                                <div key={category} className="category-section">
                                    <h2>{category}</h2>
                                    <div className="task-list">
                                        {gameState?.players?.[0]?.tasks?.filter(t => t.category === category).map(task => (
                                            <div key={task.id} className="task-item">
                                                <div className="task-details">
                                                    <p className="task-text">{task.text}</p>
                                                    <div className="task-info">
                                                        <span className="task-category">{task.category}</span>
                                                        <span className="task-points">{task.points}pts</span>
                                                    </div>
                                                </div>
                                                <div className="subtasks">
                                                    <h3>Subtasks</h3>
                                                    {task.subtasks.map(subtask => (
                                                        <div key={subtask.id} className="subtask-item">
                                                            <input
                                                                type="checkbox"
                                                                checked={subtask.completed}
                                                                onChange={() => handleSubtaskComplete(1, task.id, subtask.id)}
                                                            />
                                                            <span>{subtask.text}</span>
                                                        </div>
                                                    ))}
                                                    <input
                                                        type="text"
                                                        placeholder="Add subtask..."
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' && e.target.value.trim()) {
                                                                handleAddSubtask(1, task.id, e.target.value);
                                                                e.target.value = '';
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ))}

                                        {/* Add Task Form for this category */}
                                        <div className="add-task-form">
                                            <input
                                                type="text"
                                                value={taskInput}
                                                onChange={(e) => setTaskInput(e.target.value)}
                                                placeholder={`Add ${category} task...`}
                                                className="task-input"
                                            />
                                            <button
                                                onClick={() => handleTaskAdd(1, taskInput)}
                                                className="add-btn"
                                                disabled={!taskInput.trim()}
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Player Cards */}
                        <div className="player-cards-container">
                            {gameState.players.map((player) => (
                                <div key={player.id} className="player-card">
                                    <div className="player-header">
                                        <h3>Player {player.id}</h3>
                                        <div className="score-display">
                                            <span className="score-value">{player.score}</span>
                                            <span className="score-label">Score</span>
                                        </div>
                                    </div>

                                    {/* Tower Visualization */}
                                    <div className="tower-container">
                                        <div className="tower-base"></div>
                                        <div className="tower-blocks">
                                            {player.tasks.filter(t => t.completed).map((task, index) => (
                                                <div key={index} className="tower-block" style={{
                                                    backgroundColor: getCategoryColor(task.category)
                                                }}>
                                                    {task.points}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default GameBoard;
