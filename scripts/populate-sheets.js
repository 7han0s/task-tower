const { google } = require('googleapis');
const { GoogleAuth } = require('google-auth-library');
const fs = require('fs');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');

dotenv.config();

async function populateSheets() {
    try {
        // Initialize Google Sheets API
        const auth = new GoogleAuth({
            credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

        // Generate sample data
        const game = {
            id: uuidv4(),
            lobbyCode: Math.floor(10000 + Math.random() * 90000).toString(),
            round: 1,
            phase: 'WORK',
            startTime: new Date().toISOString(),
            duration: 1500
        };

        // Generate players
        const players = [];
        for (let i = 1; i <= 3; i++) {
            const player = {
                id: uuidv4(),
                gameId: game.id,
                name: `Player ${i}`,
                score: 0
            };
            players.push(player);

            // Generate tasks for each player
            const tasks = [];
            for (let j = 1; j <= 2; j++) {
                const task = {
                    id: uuidv4(),
                    playerId: player.id,
                    text: `Task ${j} for Player ${i}`,
                    category: 'WORK',
                    points: 50,
                    completed: false
                };
                tasks.push(task);

                // Generate subtasks for each task
                const subtasks = [];
                for (let k = 1; k <= 2; k++) {
                    const subtask = {
                        id: uuidv4(),
                        taskId: task.id,
                        text: `Subtask ${k} for Task ${j}`,
                        completed: false
                    };
                    subtasks.push(subtask);
                }

                // Write subtasks to Subtasks sheet
                await sheets.spreadsheets.values.append({
                    spreadsheetId,
                    range: 'Subtasks!A2',
                    valueInputOption: 'RAW',
                    resource: { values: [Object.values(subtask)] }
                });
            }

            // Write tasks to Tasks sheet
            await sheets.spreadsheets.values.append({
                spreadsheetId,
                range: 'Tasks!A2',
                valueInputOption: 'RAW',
                resource: { values: [Object.values(task)] }
            });
        }

        // Write game to Games sheet
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Games!A2',
            valueInputOption: 'RAW',
            resource: { values: [Object.values(game)] }
        });

        // Write players to Players sheet
        for (const player of players) {
            await sheets.spreadsheets.values.append({
                spreadsheetId,
                range: 'Players!A2',
                valueInputOption: 'RAW',
                resource: { values: [Object.values(player)] }
            });
        }

        // Write settings to Settings sheet
        const settings = {
            id: uuidv4(),
            gameId: game.id,
            maxPlayers: 8,
            maxRounds: 20,
            roundTime: 25,
            breakTime: 5,
            taskCategories: ['WORK', 'PERSONAL', 'CHORES'].join(','),
            complexityLevels: ['EASY', 'MODERATE', 'HARD'].join(','),
            createdAt: new Date().toISOString()
        };

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Settings!A2',
            valueInputOption: 'RAW',
            resource: { values: [Object.values(settings)] }
        });

        console.log('Sample data populated to Google Sheets successfully');
    } catch (error) {
        console.error('Error populating Google Sheets:', error);
        throw error;
    }
}

populateSheets().catch(console.error);
