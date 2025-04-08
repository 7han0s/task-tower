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
const GameCore = (function() {
    // Private variables
    let gameStateListeners = [];
    let config = { ...defaultConfig };

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
                newConfig.roundTime < config.minRoundTime || 
                newConfig.roundTime > config.maxRoundTime) {
                throw new Error(`Invalid roundTime value. Must be between ${config.minRoundTime} and ${config.maxRoundTime} minutes`);
            }
        }

        if (newConfig.breakTime) {
            if (typeof newConfig.breakTime !== 'number' || 
                newConfig.breakTime < config.minBreakTime || 
                newConfig.breakTime > config.maxBreakTime) {
                throw new Error(`Invalid breakTime value. Must be between ${config.minBreakTime} and ${config.maxBreakTime} minutes`);
            }
        }
    }

    // Update configuration
    function updateConfig(newConfig) {
        validateConfig(newConfig);
        config = { ...config, ...newConfig };
        saveGameState();
    }

    // Update game state
    function updateGameState(newState) {
        if (!newState) return;

        // Validate state updates
        if (newState.currentPhase && !['setup', 'work', 'action', 'paused', 'ended'].includes(newState.currentPhase)) {
            console.error('Invalid phase:', newState.currentPhase);
            return;
        }

        // Update all game state properties
        currentPhase = newState.currentPhase || currentPhase;
        currentRound = newState.currentRound || currentRound;
        phaseTimeRemaining = newState.phaseTimeRemaining || phaseTimeRemaining;

        // Update players
        if (newState.players) {
            players = newState.players;
            currentPlayerCount = players.length;
        }

        // Notify listeners of state change
        gameStateListeners.forEach(listener => listener());
    }

    // Add game state listener
    function addGameStateListener(listener) {
        if (typeof listener === 'function') {
            gameStateListeners.push(listener);
        }
    }

    // Remove game state listener
    function removeGameStateListener(listener) {
        gameStateListeners = gameStateListeners.filter(l => l !== listener);
    }

    // --- Game Flow Functions ---

    /**
     * Initialize a new game with the given players
     * @param {Object} options - Options for the game
     * @param {number} options.rounds - Number of rounds
     * @param {number} options.roundTime - Time per round in minutes
     * @param {number} options.breakTime - Time per break in minutes
     * @param {Array<string>} options.players - Array of player names
     * @param {Object} options.config - Game configuration options
     * @param {boolean} checkSaved - Whether to check for a saved game
     */
    function initializeGame(options, checkSaved = true) {
        try {
            // Reset game state
            players = [];
            currentRound = 1;
            totalRounds = options.rounds || config.maxRounds;
            currentPhase = 'setup';
            nextPlayerId = 1;
            nextTaskId = 1;
            actionsTakenThisRound = {};
            gamePaused = false;

            // Update configuration if provided
            if (options.config) {
                updateConfig(options.config);
            }

            // Check for saved game if requested
            if (checkSaved && StorageManager.isAvailable()) {
                const savedGame = StorageManager.loadGame();
                if (savedGame) {
                    // Ask if the user wants to resume the saved game
                    const resumeGame = confirm('A saved game was found. Would you like to resume it?');
                    if (resumeGame) {
                        return loadGameState(savedGame);
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

            if (options.players.length > config.maxPlayers) {
                throw new Error(`Maximum ${config.maxPlayers} players allowed`);
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
            saveGameState(); // Save the initial game state
            return players;
        } catch (error) {
            console.error('Error initializing game:', error);
            throw error;
        }
    }

    /**
     * Start a new round
     */
    function startRound() {
        if (currentRound > totalRounds) {
            endGame();
            return;
        }

        actionsTakenThisRound = {}; // Reset actions for the new round
        players.forEach(p => {
            // Reset visual indicators if any
            p.pendingTasks = []; // Clear pending tasks for the new round
        });
        nextTaskId = 1; // Reset task ID counter for the round

        console.log(`Starting Round ${currentRound}`);
        startPhase('work');
        saveGameState(); // Save game state at the start of each round
    }

    /**
     * Start a specific game phase
     * @param {string} phaseName - 'work' or 'action'
     */
    function startPhase(phaseName) {
        currentPhase = phaseName;
        clearInterval(timerInterval); // Clear any existing timer
        console.log(`Starting Phase: ${phaseName}`);

        // Set phase duration and update UI
        if (phaseName === 'work') {
            phaseTimeRemaining = config.roundTime * 60;
        } else if (phaseName === 'action') {
            phaseTimeRemaining = config.breakTime * 60;
        }
        startTimer(phaseTimeRemaining);
    }

    /**
     * Update the timer countdown
     */
    function startTimer(duration) {
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
                    endWorkPhase();
                } else if (currentPhase === 'action') {
                    // End break phase and start next round
                    endBreakPhase();
                }
            }
        }, 1000);
    }

    /**
     * End the work phase
     */
    function endWorkPhase() {
        currentPhase = 'action';

        // Start break phase timer
        startTimer(config.breakTime * 60); // Convert minutes to seconds

        // Notify UI of phase change
        console.log("Phase changed to action");
    }

    /**
     * End the break phase
     */
    function endBreakPhase() {
        currentRound++;

        if (currentRound <= totalRounds) {
            // Start next round
            startRound();
        } else {
            // End game
            endGame();
        }
    }

    /**
     * Pause the current game
     * @returns {string} - The phase that was paused
     */
    function pauseGame() {
        gamePaused = true;
        console.log("Game Paused");

        // Clear timer during pause
        if (timerInterval) {
            clearInterval(timerInterval);
        }
    }

    /**
     * Resume a paused game
     * @param {string} phaseToResume - The phase to resume
     */
    function resumeGame() {
        gamePaused = false;

        // Restart timer if in work or rest phase
        if (currentPhase === 'work' || currentPhase === 'action') {
            const remainingTime = phaseTimeRemaining;
            startTimer(remainingTime);
        }

        console.log(`Game resumed in phase ${currentPhase}`);
    }

    /**
     * Format seconds into MM:SS format
     * @param {number} seconds - Seconds to format
     * @returns {string} - Formatted time string
     */
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    }

    /**
     * Handle a player completing a task
     * @param {number} playerId - The player's ID
     * @param {number} taskId - The task's ID
     * @returns {object|null} - The completed task or null if action failed
     */
    function handleTaskCompletion(playerId, taskId) {
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
        saveGameState();

        // Check if all players have acted
        if (Object.keys(actionsTakenThisRound).length === players.length) {
            console.log("All players have acted this round.");
            clearInterval(timerInterval); // Stop timer early
            currentRound++;
            startRound(); // Move to next round immediately
        }

        return completedTask;
    }

    /**
     * Add a player mid-game
     * @param {string} name - The player's name
     * @returns {object} - The newly created player
     */
    function addPlayer(name) {
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

    /**
     * End the game and calculate winners
     * @returns {Array<object>} - The winner(s)
     */
    function endGame() {
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

    /**
     * Save the current game state to local storage
     */
    function saveGameState() {
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

    /**
     * Load a saved game state
     * @param {Object} savedState - The saved game state
     * @returns {Array} - The loaded players array
     */
    function loadGameState(savedState) {
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

    // Public API
    return {
        // Configuration
        updateConfig,
        getConfig: () => ({ ...config }),

        // Game initialization
        initializeGame,

        // Game flow
        startGame: function() {
            // Start first round
            startRound();
        },

        // State management
        addGameStateListener,
        removeGameStateListener,

        // Getters
        get players() { return players; },
        get currentPlayerCount() { return currentPlayerCount; },
        get currentRound() { return currentRound; },
        get totalRounds() { return totalRounds; },
        get currentPhase() { return currentPhase; },
        get phaseTimeRemaining() { return phaseTimeRemaining; },
        get nextPlayerId() { return nextPlayerId; },
        get nextTaskId() { return nextTaskId; },
        get actionsTakenThisRound() { return actionsTakenThisRound; },
        get config() { return { ...config }; },
        get pointsPerCategory() { return pointsPerCategory; },
        get workPhaseDuration() { return config.workPhaseDuration; },
        get actionPhaseDuration() { return config.actionPhaseDuration; },
        get roundTime() { return config.roundTime; },
        get breakTime() { return config.breakTime; }
    };
})();

// Export to window scope
window.GameCore = GameCore;
