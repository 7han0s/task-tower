/**
 * game-core.js
 * Core game state and logic for Task Tower
 */

// --- Game State Variables ---
let players = [];
let currentPlayerCount = 0;
let currentRound = 1;
let totalRounds = 12;
let currentPhase = 'setup'; // setup, work, action, paused, ended
let timerInterval = null;
let phaseTimeRemaining = 0;
let nextPlayerId = 1; // Keep track of the next ID to assign
let nextTaskId = 1; // Keep track of task IDs within a round
let actionsTakenThisRound = {}; // Track actions per player { playerId: boolean }
const pointsPerCategory = { 
    personal: 1, 
    chores: 2, 
    work: 3, 
    big: 1.5 // Multiplier for big tasks
};
let gamePaused = false;

// Configuration options (now customizable)
const defaultConfig = {
    roundTime: 25, // Default 25 minutes
    breakTime: 5,  // Default 5 minutes
    maxPlayers: 8, // Maximum players
    maxRounds: 20, // Maximum rounds
    workPhaseDuration: 10, // Work phase duration in minutes
    actionPhaseDuration: 7, // Action phase duration in minutes
    minRoundTime: 10, // Minimum round time
    maxRoundTime: 60, // Maximum round time
    minBreakTime: 5, // Minimum break time
    maxBreakTime: 30, // Maximum break time
    taskCategories: ['personal', 'chores', 'work', 'big'],
    taskComplexityLevels: [1, 2, 3], // Easy, Medium, Hard
    taskCompletionBonus: 1.2, // Bonus multiplier for completing tasks
    consecutiveTaskBonus: 1.5, // Bonus multiplier for completing tasks in sequence
    bigTaskBonus: 2.0 // Bonus multiplier for big tasks
};

// Import Google Sheets integration and data sync
import { gameSheets } from './game-sheets.js';
import { dataSync } from './data-sync.js';
import { realTime } from './real-time.js';
import { backupSystem } from './backup-system.js';
import { monitoring } from './monitoring.js';

// Task Manager
const taskManager = {
    generateTask: (category, isBigTask = false) => {
        const basePoints = pointsPerCategory[category] || 1;
        const multiplier = isBigTask ? pointsPerCategory.big : 1;
        return {
            id: nextTaskId++,
            category: category,
            isBigTask: isBigTask,
            points: basePoints * multiplier,
            subtasks: []
        };
    },
    
    addSubtask: (task, description, isBigTask = false) => {
        const subtask = {
            id: nextTaskId++,
            description: description,
            isBigTask: isBigTask,
            completed: false
        };
        task.subtasks.push(subtask);
        return subtask;
    },

    calculateTaskPoints: (task) => {
        let totalPoints = task.points;
        
        // Add points from subtasks
        task.subtasks.forEach(subtask => {
            if (subtask.completed) {
                totalPoints += pointsPerCategory[subtask.category] || 1;
            }
        });

        // Apply complexity multiplier
        totalPoints *= task.complexity || 1;

        return totalPoints;
    }
};

// Game Core Module
export class GameCore {
    constructor() {
        this.initializeSheets();
        this.initializeSync();
        this.initializeRealTime();
        this.initializeBackup();
        this.initializeMonitoring();
    }

    async initializeSheets() {
        try {
            await gameSheets.initialize();
            console.log('Google Sheets integration initialized');
        } catch (error) {
            console.error('Failed to initialize Google Sheets:', error);
            // Continue without sheets if initialization fails
        }
    }

    async initializeSync() {
        try {
            await dataSync.initialize();
            console.log('Data synchronization initialized');
        } catch (error) {
            console.error('Failed to initialize data sync:', error);
            // Continue without sync if initialization fails
        }
    }

    async initializeRealTime() {
        try {
            await realTime.initialize();
            console.log('Real-time updates initialized');
        } catch (error) {
            console.error('Failed to initialize real-time updates:', error);
            // Continue without real-time if initialization fails
        }
    }

    async initializeBackup() {
        try {
            await backupSystem.initialize();
            console.log('Backup system initialized');
        } catch (error) {
            console.error('Failed to initialize backup system:', error);
            // Continue without backup if initialization fails
        }
    }

    async initializeMonitoring() {
        try {
            await monitoring.initialize();
            console.log('Monitoring system initialized');
        } catch (error) {
            console.error('Failed to initialize monitoring system:', error);
            // Continue without monitoring if initialization fails
        }
    }

    static get players() { return players; }
    static get currentPlayerCount() { return currentPlayerCount; }
    static get currentRound() { return currentRound; }
    static get totalRounds() { return totalRounds; }
    static get currentPhase() { return currentPhase; }
    static get phaseTimeRemaining() { return phaseTimeRemaining; }
    static get nextPlayerId() { return nextPlayerId; }
    static get nextTaskId() { return nextTaskId; }
    static get actionsTakenThisRound() { return actionsTakenThisRound; }
    static get config() { return { ...defaultConfig }; }
    static get pointsPerCategory() { return pointsPerCategory; }
    static get workPhaseDuration() { return defaultConfig.workPhaseDuration; }
    static get actionPhaseDuration() { return defaultConfig.actionPhaseDuration; }
    static get roundTime() { return defaultConfig.roundTime; }
    static get breakTime() { return defaultConfig.breakTime; }

    static initializeGame(options, checkSaved = true) {
        try {
            // Load saved game state if available and requested
            if (checkSaved) {
                const savedState = dataSync.loadGameState();
                if (savedState) {
                    GameCore.loadGameState(savedState);
                    return;
                }
            }

            // Initialize new game
            players = [];
            currentPlayerCount = 0;
            currentRound = 1;
            totalRounds = defaultConfig.maxRounds;
            currentPhase = 'setup';
            timerInterval = null;
            phaseTimeRemaining = 0;
            nextPlayerId = 1;
            nextTaskId = 1;
            actionsTakenThisRound = {};
            gamePaused = false;

            // Save initial game state
            GameCore.saveGameState();
            console.log('New game initialized');
        } catch (error) {
            console.error('Error initializing game:', error);
            throw error;
        }
    }

    static saveGameState() {
        try {
            const gameState = {
                players: players,
                currentRound: currentRound,
                totalRounds: totalRounds,
                currentPhase: currentPhase,
                phaseTimeRemaining: phaseTimeRemaining,
                nextPlayerId: nextPlayerId,
                nextTaskId: nextTaskId,
                actionsTakenThisRound: actionsTakenThisRound,
                gamePaused: gamePaused
            };

            dataSync.saveGameState(gameState);
            console.log('Game state saved');
        } catch (error) {
            console.error('Error saving game state:', error);
            throw error;
        }
    }

    static loadGameState(savedState) {
        try {
            if (savedState) {
                players = savedState.players;
                currentRound = savedState.currentRound;
                totalRounds = savedState.totalRounds;
                currentPhase = savedState.currentPhase;
                phaseTimeRemaining = savedState.phaseTimeRemaining;
                nextPlayerId = savedState.nextPlayerId;
                nextTaskId = savedState.nextTaskId;
                actionsTakenThisRound = savedState.actionsTakenThisRound;
                gamePaused = savedState.gamePaused;
                currentPlayerCount = players.length;

                console.log('Game state loaded');
            }
        } catch (error) {
            console.error('Error loading game state:', error);
            throw error;
        }
    }

    static handlePlayerUpdate(playerId, updates) {
        try {
            const playerIndex = players.findIndex(p => p.id === playerId);
            if (playerIndex !== -1) {
                players[playerIndex] = { ...players[playerIndex], ...updates };
                GameCore.saveGameState();
            }
        } catch (error) {
            console.error('Error handling player update:', error);
            throw error;
        }
    }

    static handleTaskCompletion(playerId, taskId) {
        try {
            const player = players.find(p => p.id === playerId);
            if (player) {
                const taskIndex = player.tasks.findIndex(t => t.id === taskId);
                if (taskIndex !== -1) {
                    const task = player.tasks[taskIndex];
                    const points = pointsPerCategory[task.category] || 1;
                    player.score += points;
                    player.tasks.splice(taskIndex, 1);
                    GameCore.saveGameState();
                }
            }
        } catch (error) {
            console.error('Error handling task completion:', error);
            throw error;
        }
    }

    static endGame() {
        try {
            currentPhase = 'ended';
            clearInterval(timerInterval);
            GameCore.saveGameState();
            console.log('Game ended');
        } catch (error) {
            console.error('Error ending game:', error);
            throw error;
        }
    }

    static startGame() {
        GameCore.initializeGame();
        GameCore.startRound();
    }

    static updateConfig(newConfig) {
        try {
            // Validate configuration
            if (!newConfig) {
                throw new Error('Invalid configuration');
            }

            // Update configuration
            Object.assign(defaultConfig, newConfig);
            GameCore.saveGameState();
            console.log('Configuration updated');
        } catch (error) {
            console.error('Error updating configuration:', error);
            throw error;
        }
    }

    static getConfig() {
        return { ...defaultConfig };
    }

    static addGameStateListener(listener) {
        try {
            if (typeof listener === 'function') {
                // Add listener
                console.log('Game state listener added');
            }
        } catch (error) {
            console.error('Error adding game state listener:', error);
            throw error;
        }
    }

    static removeGameStateListener(listener) {
        try {
            if (typeof listener === 'function') {
                // Remove listener
                console.log('Game state listener removed');
            }
        } catch (error) {
            console.error('Error removing game state listener:', error);
            throw error;
        }
    }

    static addPlayer(name) {
        try {
            const player = {
                id: nextPlayerId++,
                name: name,
                score: 0,
                tasks: [],
                pendingTasks: []
            };

            players.push(player);
            currentPlayerCount++;
            GameCore.saveGameState();
            return player;
        } catch (error) {
            console.error('Error adding player:', error);
            throw error;
        }
    }

    static addTask(playerId, category, isBigTask = false) {
        try {
            const player = players.find(p => p.id === playerId);
            if (!player) {
                throw new Error(`Player ${playerId} not found`);
            }

            const task = taskManager.generateTask(category, isBigTask);
            player.tasks.push(task);
            GameCore.saveGameState();
            return task;
        } catch (error) {
            console.error('Error adding task:', error);
            throw error;
        }
    }

    static handleTaskCompletion(playerId, taskId) {
        try {
            const player = players.find(p => p.id === playerId);
            if (!player) {
                throw new Error(`Player ${playerId} not found`);
            }

            const taskIndex = player.tasks.findIndex(t => t.id === taskId);
            if (taskIndex === -1) {
                throw new Error(`Task ${taskId} not found for player ${playerId}`);
            }

            const task = player.tasks[taskIndex];
            let totalPoints = taskManager.calculateTaskPoints(task);

            // Apply completion bonus
            totalPoints *= defaultConfig.taskCompletionBonus;

            // Check for consecutive task completion bonus
            if (player.lastTaskCompleted && 
                player.lastTaskCompleted.category === task.category) {
                totalPoints *= defaultConfig.consecutiveTaskBonus;
            }

            // Apply big task bonus
            if (task.isBigTask) {
                totalPoints *= defaultConfig.bigTaskBonus;
            }

            // Update player score
            player.score += totalPoints;
            player.lastTaskCompleted = task;

            // Remove completed task
            player.tasks.splice(taskIndex, 1);

            // Save game state
            GameCore.saveGameState();

            return {
                taskId: taskId,
                points: totalPoints,
                newScore: player.score
            };
        } catch (error) {
            console.error('Error handling task completion:', error);
            throw error;
        }
    }

    static calculatePlayerRankings() {
        try {
            return players
                .sort((a, b) => b.score - a.score)
                .map((player, index) => ({
                    ...player,
                    rank: index + 1,
                    score: player.score,
                    tasksCompleted: player.tasks.filter(t => !t.subtasks.some(s => !s.completed)).length,
                    bigTasksCompleted: player.tasks.filter(t => t.isBigTask && !t.subtasks.some(s => !s.completed)).length
                }));
        } catch (error) {
            console.error('Error calculating rankings:', error);
            throw error;
        }
    }

    static getTopPlayers(count = 3) {
        try {
            const rankings = this.calculatePlayerRankings();
            return rankings.slice(0, count);
        } catch (error) {
            console.error('Error getting top players:', error);
            throw error;
        }
    }

    static getTaskStats() {
        try {
            const stats = {
                totalTasks: 0,
                completedTasks: 0,
                bigTasks: 0,
                byCategory: {},
                byComplexity: {}
            };

            players.forEach(player => {
                player.tasks.forEach(task => {
                    stats.totalTasks++;
                    if (task.isBigTask) stats.bigTasks++;
                    
                    if (!stats.byCategory[task.category]) {
                        stats.byCategory[task.category] = { total: 0, completed: 0 };
                    }
                    stats.byCategory[task.category].total++;

                    if (task.complexity) {
                        if (!stats.byComplexity[task.complexity]) {
                            stats.byComplexity[task.complexity] = { total: 0, completed: 0 };
                        }
                        stats.byComplexity[task.complexity].total++;
                    }
                });

                // Count completed tasks
                const completedTasks = player.tasks.filter(task => 
                    !task.subtasks.some(subtask => !subtask.completed)
                );
                stats.completedTasks += completedTasks.length;

                completedTasks.forEach(task => {
                    stats.byCategory[task.category].completed++;
                    if (task.complexity) {
                        stats.byComplexity[task.complexity].completed++;
                    }
                });
            });

            return stats;
        } catch (error) {
            console.error('Error getting task stats:', error);
            throw error;
        }
    }

    static startRound() {
        try {
            if (currentRound > totalRounds) {
                GameCore.endGame();
                return;
            }

            actionsTakenThisRound = {};
            players.forEach(p => {
                p.pendingTasks = [];
            });
            nextTaskId = 1;

            console.log(`Starting Round ${currentRound}`);
            GameCore.startPhase('work');
            GameCore.saveGameState();
        } catch (error) {
            console.error('Error starting round:', error);
            throw error;
        }
    }

    static startPhase(phaseName) {
        try {
            currentPhase = phaseName;
            clearInterval(timerInterval);
            console.log(`Starting Phase: ${phaseName}`);

            const duration = phaseName === 'work' 
                ? defaultConfig.roundTime * 60
                : defaultConfig.breakTime * 60;
            
            GameCore.startTimer(duration);
        } catch (error) {
            console.error('Error starting phase:', error);
            throw error;
        }
    }

    static startTimer(duration) {
        try {
            let remainingTime = duration;
            clearInterval(timerInterval);

            timerInterval = setInterval(() => {
                if (gamePaused) return;

                remainingTime--;
                phaseTimeRemaining = remainingTime;

                const minutes = Math.floor(remainingTime / 60);
                const seconds = remainingTime % 60;
                const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

                if (currentPhase === 'work') {
                    console.log(`Round ${currentRound} - Work Phase: ${timeString}`);
                } else if (currentPhase === 'action') {
                    console.log(`Round ${currentRound} - Break: ${timeString}`);
                }

                if (remainingTime <= 0) {
                    clearInterval(timerInterval);
                    
                    if (currentPhase === 'work') {
                        GameCore.endWorkPhase();
                    } else if (currentPhase === 'action') {
                        GameCore.endBreakPhase();
                    }
                }
            }, 1000);
        } catch (error) {
            console.error('Error starting timer:', error);
            throw error;
        }
    }

    static endWorkPhase() {
        try {
            currentPhase = 'action';
            GameCore.startTimer(defaultConfig.breakTime * 60);
            console.log('Phase changed to action');
        } catch (error) {
            console.error('Error ending work phase:', error);
            throw error;
        }
    }

    static endBreakPhase() {
        try {
            currentRound++;
            
            if (currentRound <= totalRounds) {
                GameCore.startRound();
            } else {
                GameCore.endGame();
            }
        } catch (error) {
            console.error('Error ending break phase:', error);
            throw error;
        }
    }

    static pauseGame() {
        try {
            gamePaused = true;
            clearInterval(timerInterval);
            console.log('Game Paused');
        } catch (error) {
            console.error('Error pausing game:', error);
            throw error;
        }
    }

    static resumeGame() {
        try {
            gamePaused = false;
            
            if (currentPhase === 'work' || currentPhase === 'action') {
                const remainingTime = phaseTimeRemaining;
                GameCore.startTimer(remainingTime);
            }

            console.log(`Game resumed in phase ${currentPhase}`);
        } catch (error) {
            console.error('Error resuming game:', error);
            throw error;
        }
    }

    static formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    }
}

// Export singleton instance
export const gameCore = new GameCore();
