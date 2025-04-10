const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// Generate sample data
function generateSampleData() {
    const games = [];
    const players = [];
    const tasks = [];
    const subtasks = [];
    const settings = [];

    // Generate 5 sample games
    for (let i = 0; i < 5; i++) {
        const gameId = uuidv4();
        const lobbyCode = Math.floor(10000 + Math.random() * 90000);
        
        // Game
        games.push({
            id: gameId,
            lobbyCode: lobbyCode.toString(),
            mode: 'multiplayer',
            currentPhase: 'WORK',
            timeRemaining: 1500,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        // Settings
        settings.push({
            id: uuidv4(),
            gameId,
            categories: ['Personal', 'Chores', 'Work'],
            roundDuration: 25,
            theme: 'light',
            variant: 'clean',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        // Generate 3 players per game
        for (let j = 0; j < 3; j++) {
            const playerId = uuidv4();
            players.push({
                id: playerId,
                gameId,
                name: `Player ${j + 1}`,
                score: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            // Generate 2 tasks per player
            for (let k = 0; k < 2; k++) {
                const taskId = uuidv4();
                tasks.push({
                    id: taskId,
                    playerId,
                    text: `Task ${k + 1} for Player ${j + 1}`,
                    category: 'Work',
                    points: 50,
                    completed: false,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });

                // Generate 2 subtasks per task
                for (let l = 0; l < 2; l++) {
                    subtasks.push({
                        id: uuidv4(),
                        taskId,
                        text: `Subtask ${l + 1} for Task ${k + 1}`,
                        completed: false,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    });
                }
            }
        }
    }

    // Save to JSON files
    fs.writeFileSync('data/games.json', JSON.stringify(games, null, 2));
    fs.writeFileSync('data/players.json', JSON.stringify(players, null, 2));
    fs.writeFileSync('data/tasks.json', JSON.stringify(tasks, null, 2));
    fs.writeFileSync('data/subtasks.json', JSON.stringify(subtasks, null, 2));
    fs.writeFileSync('data/settings.json', JSON.stringify(settings, null, 2));

    console.log('Sample data generated successfully');
}

// Create data directory if it doesn't exist
if (!fs.existsSync('data')) {
    fs.mkdirSync('data');
}

generateSampleData();
