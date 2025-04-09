/**
 * sheets-test.js
 * Test Google Sheets API integration
 */

import { googleService } from '../core/google-service.js';
import { gameSheets } from '../core/game-sheets.js';

// Mock window object for Node.js
if (typeof window === 'undefined') {
    global.window = {
        location: {
            href: '',
            assign: () => {}
        },
        monitoring: undefined
    };
}

async function authenticate() {
    try {
        // Try to initialize
        await gameSheets.initialize();
        return true;
    } catch (error) {
        if (error.type === 'AuthCallback') {
            console.log('Please authenticate by visiting:', error.context.authUrl);
            console.log('Copy the authorization code from the URL after authentication');
            console.log('The URL will look like this: https://localhost:3000/auth/google/callback?code=...');
            console.log('Enter just the code part after ?code=');
            
            // Wait for user input
            const code = await new Promise((resolve) => {
                const stdin = process.openStdin();
                console.log('\nEnter the authorization code:');
                stdin.on('data', (data) => {
                    resolve(data.toString().trim());
                    stdin.destroy();
                });
            });
            
            // Handle the callback
            try {
                const success = await googleService.handleCallback(code);
                if (!success) {
                    throw new Error('Authentication failed');
                }
                return true;
            } catch (callbackError) {
                console.error('Error handling callback:', callbackError);
                throw callbackError;
            }
        } else if (error.type === 'AuthExpired') {
            console.log('Authentication has expired. Please re-authenticate.');
            return authenticate();
        } else {
            throw error;
        }
    }
}

async function testSheetsIntegration() {
    try {
        console.log('Starting Google Sheets API test...');

        // 1. Authenticate
        console.log('\nAuthenticating...');
        try {
            await authenticate();
            console.log('Authentication successful!');
        } catch (authError) {
            console.error('Authentication failed:', authError);
            throw authError;
        }

        // 2. Test save operation with new data
        console.log('\nTesting save operation with new data...');
        
        // Create new game state with more complex data
        const gameState = {
            lobbyCode: 'TESTGAME123',
            currentPhase: 'work',
            currentRound: 3,
            timer: 120,
            playerCount: 4,
            players: [
                {
                    id: 'player1',
                    name: 'Alice',
                    score: 500,
                    tasks: [
                        { description: 'Complete project report', category: 'work', isBigTask: true },
                        { description: 'Clean living room', category: 'chores' },
                        { description: 'Read book', category: 'personal' }
                    ],
                    towerBlocks: [
                        { type: 'base', position: { x: 0, y: 0 } },
                        { type: 'middle', position: { x: 1, y: 1 } },
                        { type: 'top', position: { x: 2, y: 2 } }
                    ]
                },
                {
                    id: 'player2',
                    name: 'Bob',
                    score: 350,
                    tasks: [
                        { description: 'Prepare presentation', category: 'work' },
                        { description: 'Wash dishes', category: 'chores' },
                        { description: 'Learn new skill', category: 'personal', isBigTask: true }
                    ],
                    towerBlocks: [
                        { type: 'base', position: { x: 0, y: 1 } },
                        { type: 'middle', position: { x: 1, y: 2 } },
                        { type: 'top', position: { x: 2, y: 3 } }
                    ]
                },
                {
                    id: 'player3',
                    name: 'Charlie',
                    score: 420,
                    tasks: [
                        { description: 'Code review', category: 'work' },
                        { description: 'Vacuum carpets', category: 'chores' },
                        { description: 'Practice guitar', category: 'personal' }
                    ],
                    towerBlocks: [
                        { type: 'base', position: { x: 0, y: 2 } },
                        { type: 'middle', position: { x: 1, y: 3 } },
                        { type: 'top', position: { x: 2, y: 4 } }
                    ]
                },
                {
                    id: 'player4',
                    name: 'Diana',
                    score: 480,
                    tasks: [
                        { description: 'Write documentation', category: 'work' },
                        { description: 'Do laundry', category: 'chores' },
                        { description: 'Meditate', category: 'personal' }
                    ],
                    towerBlocks: [
                        { type: 'base', position: { x: 0, y: 3 } },
                        { type: 'middle', position: { x: 1, y: 4 } },
                        { type: 'top', position: { x: 2, y: 5 } }
                    ]
                }
            ]
        };

        // Save the game state
        try {
            await gameSheets.saveGameState(gameState);
            console.log('Game state saved successfully!');
        } catch (saveError) {
            console.error('Error saving game state:', saveError);
            throw saveError;
        }

        // 3. Test load operation
        console.log('\nTesting load operation...');
        try {
            const loadedState = await gameSheets.loadGameState();
            console.log('Loaded state successfully!');
        } catch (loadError) {
            console.error('Error loading game state:', loadError);
            throw loadError;
        }

        // 4. Test backup creation
        console.log('\nTesting backup creation...');
        try {
            await gameSheets.backupGameState();
            console.log('Backup created successfully!');
        } catch (backupError) {
            console.error('Error creating backup:', backupError);
            throw backupError;
        }

        console.log('\nAll tests completed successfully!');

    } catch (error) {
        console.error('Error in sheets test:', error);
        throw error;
    }
}

// Run the test
testSheetsIntegration().catch(console.error);
