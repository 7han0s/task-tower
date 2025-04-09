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
const pointsPerCategory = { personal: 1, chores: 2, work: 3 };
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
    maxBreakTime: 30 // Maximum break time
};

// Import Google Sheets integration and data sync
import { gameSheets } from './game-sheets.js';
import { dataSync } from './data-sync.js';
import { realTime } from './real-time.js';
import { backupSystem } from './backup-system.js';
import { monitoring } from './monitoring.js';

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
