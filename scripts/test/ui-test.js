// Create test container
document.body.innerHTML = `
    <div id="test-container" style="width: 800px; margin: 20px;">
        <div id="player-list-container"></div>
        <div id="task-list-container"></div>
    </div>
`;

// Test data
const testPlayers = [
    {
        id: 1,
        name: 'Test Player 1',
        score: 100,
        status: 'active'
    },
    {
        id: 2,
        name: 'Test Player 2',
        score: 50,
        status: 'inactive'
    }
];

const testTasks = [
    {
        id: 1,
        title: 'Test Task 1',
        category: 'work',
        status: 'pending',
        progress: 0
    },
    {
        id: 2,
        title: 'Test Task 2',
        category: 'personal',
        status: 'completed',
        progress: 100
    }
];

// Test PlayerList
const playerList = new PlayerList(document.getElementById('player-list-container'));
playerList.initialize();

testPlayers.forEach(player => {
    playerList.addPlayer(player);
});

// Test TaskList
const taskList = new TaskList(document.getElementById('task-list-container'));
taskList.initialize();

testTasks.forEach(task => {
    taskList.addTask(task);
});

// Update a player's score
setTimeout(() => {
    const updatedPlayer = { ...testPlayers[0], score: 150 };
    playerList.updatePlayer(updatedPlayer);
}, 1000);

// Complete a task
setTimeout(() => {
    const updatedTask = { ...testTasks[0], status: 'completed', progress: 100 };
    taskList.updateTask(updatedTask);
}, 2000);

// Remove a player
setTimeout(() => {
    playerList.removePlayer(testPlayers[1].id);
}, 3000);

// Remove a task
setTimeout(() => {
    taskList.removeTask(testTasks[1].id);
}, 4000);
