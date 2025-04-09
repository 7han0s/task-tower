const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Load service account credentials
const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'service-account.json');
const TOKEN_PATH = path.join(__dirname, 'token.json');
const CONFIG_PATH = path.join(__dirname, 'sheets-config.json');

// Existing spreadsheet ID
const EXISTING_SPREADSHEET_ID = '1s_uCHHouasBzmei2A4bScWwX-sSNd59xLUcnh1cuQ4k';

async function loadServiceAccount() {
    try {
        const content = await fs.readFile(SERVICE_ACCOUNT_PATH, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        console.error('Error loading service account:', error);
        throw error;
    }
}

async function loadConfig() {
    try {
        const content = await fs.readFile(CONFIG_PATH, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        console.error('Error loading config:', error);
        throw error;
    }
}

async function saveConfig(config) {
    try {
        await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
    } catch (error) {
        console.error('Error saving config:', error);
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
                'https://www.googleapis.com/auth/drive.file',
                'https://www.googleapis.com/auth/drive'
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

async function createSheets(spreadsheetId, auth) {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const config = await loadConfig();

        // First, get the current sheets
        const currentSheets = await sheets.spreadsheets.get({
            spreadsheetId,
            fields: 'sheets(properties(sheetId,title))'
        });

        // Create requests for new sheets
        const requests = [];
        for (const [key, sheetConfig] of Object.entries(config.sheets)) {
            const existingSheet = currentSheets.data.sheets.find(
                s => s.properties.title === sheetConfig.name
            );

            if (!existingSheet) {
                requests.push({
                    addSheet: {
                        properties: {
                            title: sheetConfig.name
                        }
                    }
                });
            }
        }

        if (requests.length > 0) {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                resource: { requests }
            });
        }

        // Add headers to each sheet
        for (const [key, sheetConfig] of Object.entries(config.sheets)) {
            const existingSheet = currentSheets.data.sheets.find(
                s => s.properties.title === sheetConfig.name
            );

            if (existingSheet) {
                await sheets.spreadsheets.values.update({
                    spreadsheetId,
                    range: `${sheetConfig.name}!A1:${String.fromCharCode(65 + sheetConfig.headers.length - 1)}1`,
                    valueInputOption: 'RAW',
                    resource: {
                        values: [sheetConfig.headers]
                    }
                });
            }
        }

        console.log('Sheets created and configured successfully');

        // Debug: List all sheets and their contents
        const sheetsList = await sheets.spreadsheets.get({
            spreadsheetId,
            fields: 'sheets(properties(sheetId,title))'
        });
        console.log('\nSheet List:', sheetsList.data.sheets);

        // Debug: Show contents of each sheet
        for (const sheet of sheetsList.data.sheets) {
            const sheetName = sheet.properties.title;
            const sheetContents = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range: `${sheetName}!A1:Z100`
            });
            console.log(`\nSheet: ${sheetName}`);
            console.log('Contents:', sheetContents.data.values);
        }

    } catch (error) {
        console.error('Error creating sheets:', {
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
        const config = await loadConfig();

        // Save game state
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${config.sheets.gameState.name}!A2:E2`,  
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
            range: `${config.sheets.playerData.name}!A2:D`,
            valueInputOption: 'RAW',
            resource: {
                values: playerData
            }
        });

        console.log('Game state saved successfully');

        // Debug: Show the data we just saved
        console.log('\nSaved Data:');
        console.log('Game State:', [
            gameState.currentRound,
            gameState.currentPhase,
            gameState.phaseTimeRemaining,
            gameState.players.length
        ]);
        console.log('Player Data:', playerData);

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
        const config = await loadConfig();

        // Load game state
        const gameStateResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${config.sheets.gameState.name}!A2:E2`  
        });

        // Load player data
        const playerDataResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${config.sheets.playerData.name}!A2:D`
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

        // Use existing spreadsheet
        const spreadsheetId = EXISTING_SPREADSHEET_ID;

        // Create and configure sheets
        await createSheets(spreadsheetId, auth);

        // Test cases
        const testCases = [
            {
                name: 'Initial game state',
                gameState: {
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
                }
            },
            {
                name: 'Update game state',
                gameState: {
                    players: [
                        {
                            id: 1,
                            name: 'Test Player 1',
                            score: 150,
                            tasks: [
                                {
                                    id: 1,
                                    title: 'Test Task 1',
                                    description: 'This is a test task',
                                    category: 'work',
                                    complexity: 'MODERATE',
                                    points: 3,
                                    status: 'completed'
                                },
                                {
                                    id: 2,
                                    title: 'Test Task 2',
                                    description: 'Another test task',
                                    category: 'personal',
                                    complexity: 'EASY',
                                    points: 2,
                                    status: 'in_progress'
                                }
                            ]
                        },
                        {
                            id: 2,
                            name: 'Test Player 2',
                            score: 75,
                            tasks: [
                                {
                                    id: 3,
                                    title: 'Test Task 3',
                                    description: 'Player 2 task',
                                    category: 'chores',
                                    complexity: 'EASY',
                                    points: 2,
                                    status: 'pending'
                                }
                            ]
                        }
                    ],
                    currentRound: 2,
                    currentPhase: 'break',
                    phaseTimeRemaining: 300
                }
            },
            {
                name: 'Add new player',
                gameState: {
                    players: [
                        {
                            id: 1,
                            name: 'Test Player 1',
                            score: 150,
                            tasks: [
                                {
                                    id: 1,
                                    title: 'Test Task 1',
                                    description: 'This is a test task',
                                    category: 'work',
                                    complexity: 'MODERATE',
                                    points: 3,
                                    status: 'completed'
                                },
                                {
                                    id: 2,
                                    title: 'Test Task 2',
                                    description: 'Another test task',
                                    category: 'personal',
                                    complexity: 'EASY',
                                    points: 2,
                                    status: 'in_progress'
                                }
                            ]
                        },
                        {
                            id: 2,
                            name: 'Test Player 2',
                            score: 75,
                            tasks: [
                                {
                                    id: 3,
                                    title: 'Test Task 3',
                                    description: 'Player 2 task',
                                    category: 'chores',
                                    complexity: 'EASY',
                                    points: 2,
                                    status: 'pending'
                                }
                            ]
                        },
                        {
                            id: 3,
                            name: 'New Player',
                            score: 0,
                            tasks: []
                        }
                    ],
                    currentRound: 2,
                    currentPhase: 'break',
                    phaseTimeRemaining: 300
                }
            },
            {
                name: 'Complete tasks',
                gameState: {
                    players: [
                        {
                            id: 1,
                            name: 'Test Player 1',
                            score: 155,
                            tasks: [
                                {
                                    id: 1,
                                    title: 'Test Task 1',
                                    description: 'This is a test task',
                                    category: 'work',
                                    complexity: 'MODERATE',
                                    points: 3,
                                    status: 'completed'
                                },
                                {
                                    id: 2,
                                    title: 'Test Task 2',
                                    description: 'Another test task',
                                    category: 'personal',
                                    complexity: 'EASY',
                                    points: 2,
                                    status: 'completed'
                                }
                            ]
                        },
                        {
                            id: 2,
                            name: 'Test Player 2',
                            score: 77,
                            tasks: [
                                {
                                    id: 3,
                                    title: 'Test Task 3',
                                    description: 'Player 2 task',
                                    category: 'chores',
                                    complexity: 'EASY',
                                    points: 2,
                                    status: 'completed'
                                }
                            ]
                        },
                        {
                            id: 3,
                            name: 'New Player',
                            score: 0,
                            tasks: []
                        }
                    ],
                    currentRound: 3,
                    currentPhase: 'work',
                    phaseTimeRemaining: 1500
                }
            }
        ];

        // Run test cases
        for (const testCase of testCases) {
            console.log(`\nRunning test case: ${testCase.name}`);
            await saveGameState(spreadsheetId, testCase.gameState, auth);
            const loadedState = await loadGameState(spreadsheetId, auth);
            console.log('Loaded state:', loadedState);
        }

        console.log('All test cases completed successfully');

    } catch (error) {
        console.error('Test failed:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
    }
}

// Run the test
testGoogleSheets();
