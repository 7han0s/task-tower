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

// Game Core Module
export class GameCore {
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
            // Reset game state
            players = [];
            currentRound = 1;
            totalRounds = options.rounds || defaultConfig.maxRounds;
            currentPhase = 'setup';
            nextPlayerId = 1;
            nextTaskId = 1;
            actionsTakenThisRound = {};
            gamePaused = false;

            // Update configuration if provided
            if (options.config) {
                GameCore.updateConfig(options.config);
            }

            // Check for saved game if requested
            if (checkSaved && StorageManager.isAvailable()) {
                const savedGame = StorageManager.loadGame();
                if (savedGame) {
                    // Ask if the user wants to resume the saved game
                    const resumeGame = confirm('A saved game was found. Would you like to resume it?');
                    if (resumeGame) {
                        return GameCore.loadGameState(savedGame);
                    } else {
                        // Clear the saved game if not resuming
                        StorageManager.clearSaved();
                    }
                }
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

            console.log("Game initialized with players:", players);
            GameCore.saveGameState(); // Save the initial game state
            return players;
        } catch (error) {
            console.error('Error initializing game:', error);
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

    static saveGameState() {
        if (!StorageManager.isAvailable()) return;

        const gameState = {
            players,
            currentPlayerCount,
            currentRound,
            currentPhase,
            nextPlayerId,
            nextTaskId,
            phaseTimeRemaining,
            actionsTakenThisRound,
            savedAt: new Date().toISOString()
        };

        StorageManager.saveGame(gameState);
        console.log('Game state saved:', gameState.savedAt);
    }

    static loadGameState(savedState) {
        if (!savedState) return null;

        players = savedState.players;
        currentPlayerCount = savedState.currentPlayerCount;
        currentRound = savedState.currentRound;
        currentPhase = savedState.currentPhase;
        nextPlayerId = savedState.nextPlayerId;
        nextTaskId = savedState.nextTaskId;
        phaseTimeRemaining = savedState.phaseTimeRemaining;
        actionsTakenThisRound = savedState.actionsTakenThisRound || {};

        console.log(`Game state loaded from ${savedState.savedAt}`);
        return players;
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
}

// Export singleton instance
export const gameCore = new GameCore();
