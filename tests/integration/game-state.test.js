const { GameState } = require('../../scripts/core/game-core');
const { TaskManager } = require('../../scripts/core/task-manager');
const { ScoringManager } = require('../../scripts/core/scoring-manager');

describe('Game State Management', () => {
    let gameState;
    let taskManager;
    let scoringManager;

    beforeEach(() => {
        gameState = new GameState();
        taskManager = new TaskManager();
        scoringManager = new ScoringManager();
    });

    test('should initialize game state correctly', () => {
        expect(gameState.round).toBe(0);
        expect(gameState.phase).toBe('work');
        expect(gameState.players.size).toBe(0);
        expect(gameState.tasks.length).toBe(0);
        expect(gameState.settings.maxPlayers).toBe(8);
        expect(gameState.settings.maxRounds).toBe(20);
        expect(gameState.settings.roundTime).toBe(25);
        expect(gameState.settings.breakTime).toBe(5);
    });

    test('should add player correctly', () => {
        const playerId = 'player-1';
        const playerName = 'Test Player';
        gameState.addPlayer(playerId, playerName);

        const player = gameState.players.get(playerId);
        expect(player).toBeDefined();
        expect(player.name).toBe(playerName);
        expect(player.score).toBe(0);
        expect(player.tasks).toEqual([]);
    });

    test('should update game state correctly', () => {
        const playerId = 'player-1';
        const playerName = 'Test Player';
        gameState.addPlayer(playerId, playerName);

        // Add task
        const task = {
            description: 'Test task',
            category: 'work',
            complexity: 'MEDIUM',
            priority: 'HIGH'
        };
        const taskId = taskManager.addTask(task);
        gameState.addTask(playerId, taskId);

        // Update task
        const updatedTask = {
            status: 'completed',
            progress: 100
        };
        taskManager.updateTask(taskId, updatedTask);

        // Update game state
        gameState.update();

        const player = gameState.players.get(playerId);
        expect(player.tasks[0]).toEqual(expect.objectContaining(updatedTask));
    });

    test('should handle score updates correctly', () => {
        const playerId = 'player-1';
        const playerName = 'Test Player';
        gameState.addPlayer(playerId, playerName);

        // Add task
        const task = {
            description: 'Test task',
            category: 'work',
            complexity: 'VERY_COMPLEX',
            priority: 'CRITICAL'
        };
        const taskId = taskManager.addTask(task);
        gameState.addTask(playerId, taskId);

        // Complete task
        taskManager.updateTask(taskId, {
            status: 'completed',
            progress: 100
        });

        // Update game state
        gameState.update();

        const player = gameState.players.get(playerId);
        expect(player.score).toBeGreaterThan(0);
    });

    test('should handle round progression correctly', () => {
        gameState.startRound();
        expect(gameState.round).toBe(1);
        expect(gameState.phase).toBe('work');

        // Complete round
        gameState.completeRound();
        expect(gameState.round).toBe(1);
        expect(gameState.phase).toBe('break');

        // Start next round
        gameState.startRound();
        expect(gameState.round).toBe(2);
        expect(gameState.phase).toBe('work');
    });

    test('should handle game completion correctly', () => {
        gameState.settings.maxRounds = 1;
        gameState.startRound();

        // Complete round
        gameState.completeRound();
        expect(gameState.isGameOver()).toBe(true);

        // Try to start new round
        gameState.startRound();
        expect(gameState.round).toBe(1);
        expect(gameState.phase).toBe('break');
    });

    test('should handle player disconnection correctly', () => {
        const playerId = 'player-1';
        const playerName = 'Test Player';
        gameState.addPlayer(playerId, playerName);

        // Add task
        const task = {
            description: 'Test task',
            category: 'work'
        };
        const taskId = taskManager.addTask(task);
        gameState.addTask(playerId, taskId);

        // Disconnect player
        gameState.disconnectPlayer(playerId);
        
        const player = gameState.players.get(playerId);
        expect(player.isConnected).toBe(false);
        expect(player.tasks.length).toBe(0);
    });

    test('should handle game reset correctly', () => {
        const playerId = 'player-1';
        const playerName = 'Test Player';
        gameState.addPlayer(playerId, playerName);

        // Add task
        const task = {
            description: 'Test task',
            category: 'work'
        };
        const taskId = taskManager.addTask(task);
        gameState.addTask(playerId, taskId);

        // Reset game
        gameState.reset();

        expect(gameState.round).toBe(0);
        expect(gameState.phase).toBe('work');
        expect(gameState.players.size).toBe(0);
        expect(gameState.tasks.length).toBe(0);
    });
});
