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
const scoreBonuses = {
    completion: 1.2, // Bonus for completing tasks
    consecutive: 1.5, // Bonus for completing tasks in sequence
    bigTask: 2.0, // Bonus for big tasks
    roundCompletion: 1.1, // Bonus for completing all tasks in a round
    earlyCompletion: 1.2, // Bonus for completing tasks early
    perfectRound: 1.5, // Bonus for completing all tasks perfectly
    teamwork: 1.3, // Bonus for helping other players
    streak: {
        length: 3, // Number of consecutive completions needed
        multiplier: 1.5 // Multiplier for streak
    }
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
    basePoints: 100, // Base points for task completion
    streakLength: 3, // Number of consecutive completions needed for streak
    streakMultiplier: 1.5, // Multiplier for streak
    perfectRoundMultiplier: 1.5, // Multiplier for perfect round
    earlyCompletionThreshold: 0.75, // Percentage of time remaining for early completion bonus
    teamworkBonus: 1.3, // Bonus for helping other players
    maxTaskPoints: 500, // Maximum points per task
    minTaskPoints: 50, // Minimum points per task
    taskCompletionTime: 300, // Time in seconds to complete a task
    taskCompletionBonus: 1.2, // Bonus for completing tasks
    consecutiveTaskBonus: 1.5, // Bonus for completing tasks in sequence
    bigTaskBonus: 2.0 // Bonus multiplier for big tasks
};

// Import Google Sheets integration and data sync
import { gameSheets } from './game-sheets.js';
import { dataSync } from './data-sync.js';
import { realTime } from './real-time.js';
import { backupSystem } from './backup-system.js';
import { monitoring } from './monitoring.js';

// Scoring System
const scoringSystem = {
    calculateBasePoints: (task) => {
        // Calculate base points based on category and complexity
        let basePoints = pointsPerCategory[task.category] || 1;
        
        // Apply complexity multiplier
        basePoints *= task.complexity || 1;
        
        // Apply big task multiplier
        if (task.isBigTask) {
            basePoints *= pointsPerCategory.big;
        }
        
        // Cap points between min and max
        basePoints = Math.max(
            defaultConfig.minTaskPoints,
            Math.min(defaultConfig.maxTaskPoints, basePoints)
        );
        
        return basePoints;
    },

    calculateCompletionBonus: (task, player) => {
        let bonus = 1;
        
        // Completion bonus
        bonus *= scoreBonuses.completion;
        
        // Big task bonus
        if (task.isBigTask) {
            bonus *= scoreBonuses.bigTask;
        }
        
        // Consecutive task bonus
        if (player.lastTaskCompleted && 
            player.lastTaskCompleted.category === task.category) {
            bonus *= scoreBonuses.consecutive;
        }
        
        // Early completion bonus
        const timeRemaining = phaseTimeRemaining;
        const phaseDuration = currentPhase === 'work' 
            ? defaultConfig.roundTime * 60 
            : defaultConfig.breakTime * 60;
        
        if (timeRemaining / phaseDuration > defaultConfig.earlyCompletionThreshold) {
            bonus *= scoreBonuses.earlyCompletion;
        }
        
        return bonus;
    },

    calculateStreakBonus: (player) => {
        let bonus = 1;
        
        // Check for streak
        if (player.consecutiveCompletions >= defaultConfig.streakLength) {
            bonus *= defaultConfig.streakMultiplier;
        }
        
        return bonus;
    },

    calculatePerfectRoundBonus: (player) => {
        let bonus = 1;
        
        // Check if all tasks completed
        const allTasksCompleted = player.tasks.every(task => 
            !task.subtasks.some(subtask => !subtask.completed)
        );
        
        if (allTasksCompleted) {
            bonus *= defaultConfig.perfectRoundMultiplier;
        }
        
        return bonus;
    },

    calculateTeamworkBonus: (player, helper) => {
        let bonus = 1;
        
        // Check if helping another player
        if (helper && helper.id !== player.id) {
            bonus *= defaultConfig.teamworkBonus;
        }
        
        return bonus;
    },

    calculateTotalPoints: (task, player, helper = null) => {
        try {
            // Calculate base points
            let totalPoints = scoringSystem.calculateBasePoints(task);
            
            // Apply completion bonus
            totalPoints *= scoringSystem.calculateCompletionBonus(task, player);
            
            // Apply streak bonus
            totalPoints *= scoringSystem.calculateStreakBonus(player);
            
            // Apply perfect round bonus
            totalPoints *= scoringSystem.calculatePerfectRoundBonus(player);
            
            // Apply teamwork bonus
            totalPoints *= scoringSystem.calculateTeamworkBonus(player, helper);
            
            // Round to nearest integer
            totalPoints = Math.round(totalPoints);
            
            return totalPoints;
        } catch (error) {
            console.error('Error calculating points:', error);
            throw error;
        }
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

    async initializeGame(options, checkSaved = true) {
        try {
            // Validate options
            if (!this.validateConfig(options)) {
                throw new Error('Invalid game configuration');
            }

            // Load saved game state if requested
            if (checkSaved) {
                try {
                    const savedState = await this.loadGameState();
                    if (savedState) {
                        this.loadGameState(savedState);
                        return;
                    }
                } catch (error) {
                    console.log('No saved game state found, starting new game');
                }
            }

            // Initialize game state
            players = [];
            currentPlayerCount = 0;
            currentRound = 1;
            totalRounds = options.totalRounds || totalRounds;
            currentPhase = 'setup';
            phaseTimeRemaining = 0;
            nextPlayerId = 1;
            nextTaskId = 1;
            actionsTakenThisRound = {};
            gamePaused = false;

            // Update configuration if provided
            if (options.config) {
                GameCore.updateConfig(options.config);
            }

            // Validate player count
            if (!options.players || !Array.isArray(options.players) || options.players.length < 2) {
                throw new Error('At least 2 players are required');
            }

            if (options.players.length > defaultConfig.maxPlayers) {
                throw new Error(`Maximum ${defaultConfig.maxPlayers} players allowed`);
            }

            // Create player objects
            for (let i = 0; i < options.players.length; i++) {
                players.push({
                    id: nextPlayerId++,
                    name: options.players[i],
                    score: 0,
                    towerBlocks: [],
                    pendingTasks: [],
                    lastAction: null
                });
            }

            // Save initial game state
            await dataSync.syncData();
            await realTime.broadcastEvent('game-state', {
                lobbyCode: 'TOWER_' + Math.random().toString(36).substring(7),
                currentPhase: currentPhase,
                currentRound: currentRound,
                timer: phaseTimeRemaining,
                playerCount: players.length,
                players: players
            });

            // Create initial backup
            await backupSystem.createBackup();

            // Monitor game initialization
            monitoring.checkHealth();

            return players;
        } catch (error) {
            monitoring.trackError(error);
            throw error;
        }
    }

    async saveGameState() {
        try {
            const startTime = performance.now();
            await gameSheets.saveGameState({
                players: players,
                currentPlayerCount: currentPlayerCount,
                currentRound: currentRound,
                totalRounds: totalRounds,
                currentPhase: currentPhase,
                phaseTimeRemaining: phaseTimeRemaining,
                nextPlayerId: nextPlayerId,
                nextTaskId: nextTaskId,
                actionsTakenThisRound: actionsTakenThisRound,
                config: { ...defaultConfig }
            });

            const duration = performance.now() - startTime;
            monitoring.trackSheetOperation({
                type: 'save_game_state',
                duration,
                success: true
            });

            console.log('Game state saved successfully');
        } catch (error) {
            monitoring.trackError(error);
            throw error;
        }
    }

    async loadGameState(savedState) {
        try {
            const startTime = performance.now();
            
            // Validate saved state
            if (!savedState || typeof savedState !== 'object') {
                throw new Error('Invalid saved game state');
            }

            // Load game state
            players = savedState.players;
            currentPlayerCount = savedState.currentPlayerCount;
            currentRound = savedState.currentRound;
            totalRounds = savedState.totalRounds;
            currentPhase = savedState.currentPhase;
            phaseTimeRemaining = savedState.phaseTimeRemaining;
            nextPlayerId = savedState.nextPlayerId;
            nextTaskId = savedState.nextTaskId;
            actionsTakenThisRound = savedState.actionsTakenThisRound;

            const duration = performance.now() - startTime;
            monitoring.trackSheetOperation({
                type: 'load_game_state',
                duration,
                success: true
            });

            console.log('Game state loaded successfully');
        } catch (error) {
            monitoring.trackError(error);
            throw error;
        }
    }

    async handlePlayerUpdate(playerId, updates) {
        try {
            const player = players.find(p => p.id === playerId);
            if (!player) {
                throw new Error(`Player ${playerId} not found`);
            }

            Object.assign(player, updates);
            await this.saveGameState();
        } catch (error) {
            monitoring.trackError(error);
            throw error;
        }
    }

    async handleTaskCompletion(playerId, taskId, helperId = null) {
        try {
            const player = players.find(p => p.id === playerId);
            if (!player) {
                throw new Error(`Player ${playerId} not found`);
            }

            const taskIndex = player.pendingTasks.findIndex(t => t.id === taskId);
            if (taskIndex === -1) {
                throw new Error(`Task ${taskId} not found for player ${playerId}`);
            }

            const task = player.pendingTasks[taskIndex];
            
            // Calculate points
            const helper = helperId ? players.find(p => p.id === helperId) : null;
            const totalPoints = scoringSystem.calculateTotalPoints(task, player, helper);

            // Update player score
            player.score += totalPoints;
            
            // Update streak
            if (player.lastTaskCompleted && 
                player.lastTaskCompleted.category === task.category) {
                player.consecutiveCompletions++;
            } else {
                player.consecutiveCompletions = 1;
            }
            
            // Update last completed task
            player.lastTaskCompleted = task;

            // Remove completed task
            player.pendingTasks.splice(taskIndex, 1);

            // Save game state
            GameCore.saveGameState();

            // Broadcast completion event
            realTime.broadcastEvent('task-completion', {
                playerId: playerId,
                taskId: taskId,
                helperId: helperId,
                points: totalPoints,
                newScore: player.score
            });

            return {
                taskId: taskId,
                points: totalPoints,
                newScore: player.score,
                helperId: helperId
            };
        } catch (error) {
            console.error('Error handling task completion:', error);
            throw error;
        }
    }

    async endGame() {
        try {
            // Save final game state
            await dataSync.syncData();

            // Calculate winners
            const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
            const maxScore = sortedPlayers[0].score;
            const winners = sortedPlayers.filter(p => p.score === maxScore);

            // Add game end event to sync
            await dataSync.addSyncEvent('game-state', {
                currentPhase: 'ended',
                players: players
            });
            await realTime.broadcastEvent('game-state', {
                currentPhase: 'ended',
                players: players
            });

            // Create final backup
            await backupSystem.createBackup();

            // Monitor game end
            monitoring.checkHealth();

            return winners;
        } catch (error) {
            monitoring.trackError(error);
            throw error;
        }
    }

    static startGame() {
        // Start first round
        GameCore.startRound();
    }

    static updateConfig(newConfig) {
        // Validate configuration
        function validateConfig(newConfig) {
            if (!newConfig) return;
            
            // Validate player settings
            if (newConfig.maxPlayers) {
                if (typeof newConfig.maxPlayers !== 'number' || newConfig.maxPlayers < 2) {
                    throw new Error('Invalid maxPlayers value. Must be a number greater than 1');
                }
            }

            // Validate time settings
            if (newConfig.roundTime) {
                if (typeof newConfig.roundTime !== 'number' || 
                    newConfig.roundTime < defaultConfig.minRoundTime || 
                    newConfig.roundTime > defaultConfig.maxRoundTime) {
                    throw new Error(`Invalid roundTime value. Must be between ${defaultConfig.minRoundTime} and ${defaultConfig.maxRoundTime} minutes`);
                }
            }

            if (newConfig.breakTime) {
                if (typeof newConfig.breakTime !== 'number' || 
                    newConfig.breakTime < defaultConfig.minBreakTime || 
                    newConfig.breakTime > defaultConfig.maxBreakTime) {
                    throw new Error(`Invalid breakTime value. Must be between ${defaultConfig.minBreakTime} and ${defaultConfig.maxBreakTime} minutes`);
                }
            }
        }

        validateConfig(newConfig);
        defaultConfig = { ...defaultConfig, ...newConfig };
        GameCore.saveGameState();
    }

    static getConfig() {
        return { ...defaultConfig };
    }

    static addGameStateListener(listener) {
        if (typeof listener === 'function') {
            gameStateListeners.push(listener);
        }
    }

    static removeGameStateListener(listener) {
        gameStateListeners = gameStateListeners.filter(l => l !== listener);
    }

    static addPlayer(name) {
        const newPlayer = {
            id: nextPlayerId,
            name: name,
            score: 0,
            towerBlocks: [],
            pendingTasks: []
        };
        players.push(newPlayer);
        currentPlayerCount = players.length;

        console.log(`Player ${nextPlayerId} (${name}) added mid-game.`);
        nextPlayerId++; // Increment ID for the next potential player

        return newPlayer;
    }

    static handleTaskCompletion(playerId, taskId) {
        if (currentPhase !== 'action' || actionsTakenThisRound[playerId]) {
            console.log(`Action blocked: Phase=${currentPhase}, Player ${playerId} acted=${!!actionsTakenThisRound[playerId]}`);
            return null; // Ignore clicks outside action phase or if already acted
        }

        const player = players.find(p => p.id === playerId);
        if (!player) return null;

        const taskIndex = player.pendingTasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) {
            console.error(`Task ${taskId} not found for player ${playerId}`);
            return null;
        }

        // Use TaskManager to complete the task - this will calculate efficiency bonuses
        const result = TaskManager.completeTask(playerId, taskId);
        if (!result) return null;

        const { task: completedTask, finalScore, basePoints, bonusPoints } = result;
        const type = completedTask.category;

        actionsTakenThisRound[playerId] = true; // Mark player as having acted

        // Log detailed task completion info
        let completionMessage = `Player ${playerId} completed task: ${completedTask.description} (${type}, ${finalScore} points)`;
        if (bonusPoints > 0) {
            completionMessage += ` (includes ${bonusPoints} efficiency bonus points!)`;
        }
        if (completedTask.subtasks.length > 0) {
            const completedSubtasks = completedTask.subtasks.filter(st => st.completed).length;
            completionMessage += ` [${completedSubtasks}/${completedTask.subtasks.length} subtasks]`;
        }
        console.log(completionMessage);

        player.score += finalScore;
        player.towerBlocks.push({ type, points: finalScore }); // Store block info with final score

        // Remove task from pending list
        player.pendingTasks.splice(taskIndex, 1);

        // Save game state after task completion
        GameCore.saveGameState();

        // Check if all players have acted
        if (Object.keys(actionsTakenThisRound).length === players.length) {
            console.log("All players have acted this round.");
            clearInterval(timerInterval); // Stop timer early
            currentRound++;
            GameCore.startRound(); // Move to next round immediately
        }

        return completedTask;
    }

    static endGame() {
        console.log("Game Over!");
        currentPhase = 'ended';
        clearInterval(timerInterval);

        // Determine winner(s)
        let maxScore = -1;
        players.forEach(p => {
            if (p.score > maxScore) {
                maxScore = p.score;
            }
        });

        const winners = players.filter(p => p.score === maxScore);
        return winners;
    }

    static startRound() {
        if (currentRound > totalRounds) {
            GameCore.endGame();
            return;
        }

        actionsTakenThisRound = {}; // Reset actions for the new round
        players.forEach(p => {
            // Reset visual indicators if any
            p.pendingTasks = []; // Clear pending tasks for the new round
        });
        nextTaskId = 1; // Reset task ID counter for the round

        console.log(`Starting Round ${currentRound}`);
        GameCore.startPhase('work');
        GameCore.saveGameState(); // Save game state at the start of each round
    }

    static startPhase(phaseName) {
        currentPhase = phaseName;
        clearInterval(timerInterval); // Clear any existing timer
        console.log(`Starting Phase: ${phaseName}`);

        // Set phase duration and update UI
        if (phaseName === 'work') {
            phaseTimeRemaining = defaultConfig.roundTime * 60;
        } else if (phaseName === 'action') {
            phaseTimeRemaining = defaultConfig.breakTime * 60;
        }
        GameCore.startTimer(phaseTimeRemaining);
    }

    static startTimer(duration) {
        let remainingTime = duration;

        // Clear any existing timer
        if (timerInterval) {
            clearInterval(timerInterval);
        }

        timerInterval = setInterval(() => {
            if (gamePaused) return;

            remainingTime--;

            // Update timer display
            const minutes = Math.floor(remainingTime / 60);
            const seconds = remainingTime % 60;
            const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

            // Update game status with timer
            if (currentPhase === 'work') {
                console.log(`Round ${currentRound} - Work Phase: ${timeString}`);
            } else if (currentPhase === 'action') {
                console.log(`Round ${currentRound} - Break: ${timeString}`);
            }

            if (remainingTime <= 0) {
                clearInterval(timerInterval);

                if (currentPhase === 'work') {
                    // End work phase and start break
                    GameCore.endWorkPhase();
                } else if (currentPhase === 'action') {
                    // End break phase and start next round
                    GameCore.endBreakPhase();
                }
            }
        }, 1000);
    }

    static endWorkPhase() {
        currentPhase = 'action';

        // Start break phase timer
        GameCore.startTimer(defaultConfig.breakTime * 60); // Convert minutes to seconds

        // Notify UI of phase change
        console.log("Phase changed to action");
    }

    static endBreakPhase() {
        currentRound++;

        if (currentRound <= totalRounds) {
            // Start next round
            GameCore.startRound();
        } else {
            // End game
            GameCore.endGame();
        }
    }

    static pauseGame() {
        gamePaused = true;
        console.log("Game Paused");

        // Clear timer during pause
        if (timerInterval) {
            clearInterval(timerInterval);
        }
    }

    static resumeGame() {
        gamePaused = false;

        // Restart timer if in work or rest phase
        if (currentPhase === 'work' || currentPhase === 'action') {
            const remainingTime = phaseTimeRemaining;
            GameCore.startTimer(remainingTime);
        }

        console.log(`Game resumed in phase ${currentPhase}`);
    }

    static formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
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
                    bigTasksCompleted: player.tasks.filter(t => t.isBigTask && !t.subtasks.some(s => !s.completed)).length,
                    perfectRounds: player.perfectRounds || 0,
                    streak: player.consecutiveCompletions || 0
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
                byComplexity: {},
                streaks: 0,
                perfectRounds: 0
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

                // Count streaks and perfect rounds
                if (player.consecutiveCompletions >= defaultConfig.streakLength) {
                    stats.streaks++;
                }
                if (player.perfectRounds) {
                    stats.perfectRounds += player.perfectRounds;
                }
            });

            return stats;
        } catch (error) {
            console.error('Error getting task stats:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const gameCore = new GameCore();
