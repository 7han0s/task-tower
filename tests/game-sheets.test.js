/**
 * game-sheets.test.js
 * Test suite for Google Sheets integration
 */

const { GameSheets } = require('../scripts/core/game-sheets.js');
const { StorageManager } = require('../scripts/core/storage-manager.js');
const { TaskComplexity } = require('../scripts/core/task-complexity.js');

describe('Game Sheets Integration', () => {
    let gameSheets;
    let mockGameState;

    beforeEach(() => {
        // Mock the Google Sheets API
        jest.mock('googleapis', () => ({
            google: {
                sheets: () => ({
                    spreadsheets: {
                        values: {
                            get: jest.fn(),
                            update: jest.fn(),
                            append: jest.fn()
                        }
                    }
                })
            }
        }));

        // Initialize GameSheets
        gameSheets = new GameSheets();

        // Create mock game state
        mockGameState = {
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
                            complexity: TaskComplexity.MODERATE,
                            points: 3,
                            status: 'completed'
                        }
                    ]
                }
            ],
            currentRound: 1,
            currentPhase: 'work',
            phaseTimeRemaining: 1500
        };
    });

    test('should initialize Google Sheets integration', async () => {
        await gameSheets.initialize();
        expect(gameSheets.sheets).toBeDefined();
    });

    test('should save game state to Google Sheets', async () => {
        // Mock the update response
        jest.mocked(gameSheets.sheets.spreadsheets.values.update).mockResolvedValue({
            data: {
                updates: {
                    updatedCells: 1
                }
            }
        });

        await gameSheets.saveGameState(mockGameState);
        expect(gameSheets.sheets.spreadsheets.values.update).toHaveBeenCalledWith(
            expect.objectContaining({
                spreadsheetId: expect.any(String),
                range: 'Game State!A2:E2',
                valueInputOption: 'RAW',
                resource: {
                    values: expect.any(Array)
                }
            })
        );
    });

    test('should load game state from Google Sheets', async () => {
        // Mock the get response
        jest.mocked(gameSheets.sheets.spreadsheets.values.get).mockResolvedValue({
            data: {
                values: [
                    ['Test Player 1', 100, 'Test Task 1', 'completed', 1500]
                ]
            }
        });

        const gameState = await gameSheets.loadGameState();
        expect(gameState).toBeDefined();
        expect(gameState.players[0].name).toBe('Test Player 1');
    });

    test('should create backup of game state', async () => {
        // Mock the append response
        jest.mocked(gameSheets.sheets.spreadsheets.values.append).mockResolvedValue({
            data: {
                updates: {
                    updatedCells: 1
                }
            }
        });

        const backupId = await gameSheets.createBackup(mockGameState);
        expect(backupId).toBeDefined();
        expect(gameSheets.sheets.spreadsheets.values.append).toHaveBeenCalledWith(
            expect.objectContaining({
                spreadsheetId: expect.any(String),
                range: 'Backups!A1:E1',
                valueInputOption: 'RAW',
                resource: {
                    values: expect.any(Array)
                }
            })
        );
    });

    test('should handle errors gracefully', async () => {
        // Mock API error
        jest.mocked(gameSheets.sheets.spreadsheets.values.update).mockRejectedValue(new Error('API Error'));

        try {
            await gameSheets.saveGameState(mockGameState);
        } catch (error) {
            expect(error).toBeDefined();
            expect(error.message).toBe('API Error');
        }
    });

    test('should recover from backup on error', async () => {
        // Mock error scenario
        jest.mocked(gameSheets.sheets.spreadsheets.values.update).mockRejectedValue(new Error('API Error'));

        // Mock backup data
        jest.mocked(gameSheets.sheets.spreadsheets.values.get).mockResolvedValue({
            data: {
                values: [
                    ['Test Player 1', 100, 'Test Task 1', 'completed', 1500]
                ]
            }
        });

        try {
            await gameSheets.saveGameState(mockGameState);
        } catch (error) {
            expect(error).toBeDefined();
            
            // Verify backup recovery
            const recoveredState = await gameSheets.loadGameState();
            expect(recoveredState).toBeDefined();
            expect(recoveredState.players[0].name).toBe('Test Player 1');
        }
    });
});
