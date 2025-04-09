const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');

// Load service account credentials
const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'service-account.json');
const TOKEN_PATH = path.join(__dirname, 'token.json');

async function loadServiceAccount() {
    try {
        const content = await fs.readFile(SERVICE_ACCOUNT_PATH, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        console.error('Error loading service account:', error);
        throw error;
    }
}

async function authenticate() {
    try {
        const serviceAccount = await loadServiceAccount();
        const auth = new google.auth.GoogleAuth({
            credentials: serviceAccount,
            scopes: [
                'https://www.googleapis.com/auth/spreadsheets',
                'https://www.googleapis.com/auth/drive.file'
            ]
        });

        return auth;
    } catch (error) {
        console.error('Authentication error:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        throw error;
    }
}

async function createTestSpreadsheet(auth) {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.create({
            resource: {
                properties: {
                    title: 'Task Tower Test Sheet'
                }
            }
        });

        console.log('Created test spreadsheet:', response.data.spreadsheetId);
        return response.data.spreadsheetId;
    } catch (error) {
        console.error('Error creating spreadsheet:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        throw error;
    }
}

async function saveGameState(spreadsheetId, gameState, auth) {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        // Save game state
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: 'Game State!A1:E1',
            valueInputOption: 'RAW',
            resource: {
                values: [
                    [
                        gameState.currentRound,
                        gameState.currentPhase,
                        gameState.phaseTimeRemaining,
                        gameState.players.length
                    ]
                ]
            }
        });

        // Save player data
        const playerData = gameState.players.map(player => [
            player.id,
            player.name,
            player.score,
            JSON.stringify(player.tasks)
        ]);

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: 'Player Data!A2:D',
            valueInputOption: 'RAW',
            resource: {
                values: playerData
            }
        });

        console.log('Game state saved successfully');
    } catch (error) {
        console.error('Error saving game state:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        throw error;
    }
}

async function loadGameState(spreadsheetId, auth) {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        // Load game state
        const gameStateResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Game State!A1:E1'
        });

        // Load player data
        const playerDataResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Player Data!A2:D'
        });

        const gameState = {
            currentRound: parseInt(gameStateResponse.data.values[0][0]),
            currentPhase: gameStateResponse.data.values[0][1],
            phaseTimeRemaining: parseInt(gameStateResponse.data.values[0][2]),
            players: playerDataResponse.data.values.map(row => ({
                id: parseInt(row[0]),
                name: row[1],
                score: parseInt(row[2]),
                tasks: JSON.parse(row[3])
            }))
        };

        console.log('Loaded game state:', gameState);
        return gameState;
    } catch (error) {
        console.error('Error loading game state:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        throw error;
    }
}

async function testGoogleSheets() {
    try {
        // Authenticate first
        const auth = await authenticate();

        // Create test spreadsheet
        const spreadsheetId = await createTestSpreadsheet(auth);

        // Save test data
        await saveGameState(spreadsheetId, testGameData, auth);

        // Load and verify data
        const loadedData = await loadGameState(spreadsheetId, auth);
        console.log('Test completed successfully');

    } catch (error) {
        console.error('Test failed:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
    }
}

// Test data
const testGameData = {
    players: [
        {
            id: 1,
            name: 'Test Player 1',
            score: 100,
            tasks: [
                {
                    id: 1,
                    title: 'Test Task 1',
                    description: 'This is a test task',
                    category: 'work',
                    complexity: 'MODERATE',
                    points: 3,
                    status: 'completed'
                }
            ]
        },
        {
            id: 2,
            name: 'Test Player 2',
            score: 50,
            tasks: []
        }
    ],
    currentRound: 1,
    currentPhase: 'work',
    phaseTimeRemaining: 1500
};

// Run the test
testGoogleSheets();
