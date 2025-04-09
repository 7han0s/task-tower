const gameCore = require('../core/game-core.js');
const TaskManager = require('../core/task-manager.js');
const TaskComplexity = require('../core/task-complexity.js');

// Initialize game
const game = new gameCore();
const taskManager = new TaskManager();

// Test data
const testPlayer = {
    id: 1,
    name: 'Test Player',
    score: 0
};

const testTask = {
    title: 'Test Task',
    description: 'This is a test task',
    category: 'work',
    complexity: TaskComplexity.MODERATE,
    points: 3
};

// Add player
console.log('Adding player...');
game.addPlayer(testPlayer);

// Add task
console.log('Adding task...');
const task = taskManager.addTask({
    ...testTask,
    playerId: testPlayer.id
});

// Update game state
console.log('Updating game state...');
for (let i = 0; i < 5; i++) {
    game.update();
}

// Complete task
console.log('Completing task...');
taskManager.updateTask(task.id, {
    status: 'completed',
    progress: 100
});

// Update score
console.log('Updating score...');
game.updateScore(testPlayer.id, 50);

// Get game state
console.log('Final game state:', {
    players: game.getPlayers(),
    tasks: taskManager.getTasks()
});
