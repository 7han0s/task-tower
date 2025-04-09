/**
 * game-sheets.test.js
 * Comprehensive test suite for Google Sheets integration
 */

import { gameSheets } from '../../scripts/core/game-sheets.js';
import { gameCore } from '../../scripts/core/game-core.js';
import { googleService } from '../../scripts/core/google-service.js';

// Mock window object for Node.js
if (typeof window === 'undefined') {
    global.window = {
        location: {
            href: '',
            search: ''
        },
        localStorage: {
            getItem: jest.fn(),
            setItem: jest.fn()
        }
    };
}

describe('Game Sheets Integration', () => {
    let testSpreadsheetId;
    let testGameState;
    let testPlayers;

    beforeAll(async () => {
        // Create test spreadsheet
        const sheets = google.sheets({ version: 'v4' });
        const response = await sheets.spreadsheets.create({
            resource: {
                properties: {
                    title: 'Task Tower Test Sheet'
                }
            }
        });
        testSpreadsheetId = response.data.spreadsheetId;

        // Set up test data
        testPlayers = [
            {
                id: 1,
                name: 'Test Player 1',
                score: 0,
                tasks: [],
                towerBlocks: []
            },
            {
                id: 2,
                name: 'Test Player 2',
                score: 0,
                tasks: [],
                towerBlocks: []
            }
        ];

        testGameState = {
            lobbyCode: 'TEST123',
            currentPhase: 'setup',
            currentRound: 1,
            timer: 0,
            playerCount: 2,
            players: testPlayers
        };
    });

    afterAll(async () => {
        // Clean up test spreadsheet
        const sheets = google.sheets({ version: 'v4' });
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: testSpreadsheetId,
            resource: {
                requests: [
                    {
                        deleteSheet: {
                            sheetId: 0
                        }
                    }
                ]
            }
        });
    });

    describe('Initialization', () => {
        test('should initialize Google Sheets successfully', async () => {
            // Mock authentication
            jest.spyOn(googleService, 'initialize').mockResolvedValue(true);

            await expect(gameSheets.initialize()).resolves.not.toThrow();
            expect(googleService.initialize).toHaveBeenCalled();
        });

        test('should handle initialization errors gracefully', async () => {
            // Mock authentication failure
            jest.spyOn(googleService, 'initialize').mockRejectedValue(new Error('Auth failed'));

            await expect(gameSheets.initialize()).rejects.toThrow('Error initializing Google Sheets');
        });
    });

    describe('Game State Management', () => {
        test('should save game state to Google Sheets', async () => {
            // Mock successful save
            jest.spyOn(googleService, 'updateSheetData').mockResolvedValue(true);

            await expect(gameSheets.saveGameState(testGameState)).resolves.not.toThrow();
            expect(googleService.updateSheetData).toHaveBeenCalledTimes(2);
        });

        test('should load game state from Google Sheets', async () => {
            // Mock successful load
            jest.spyOn(googleService, 'getSheetData')
                .mockResolvedValueOnce([['TEST123', 'setup', 1, 0, 2]])
                .mockResolvedValueOnce([
                    [1, 'Test Player 1', 0, '[]', '[]'],
                    [2, 'Test Player 2', 0, '[]', '[]']
                ]);

            const loadedState = await gameSheets.loadGameState();
            expect(loadedState).toEqual(testGameState);
        });

        test('should handle load errors gracefully', async () => {
            // Mock failed load
            jest.spyOn(googleService, 'getSheetData').mockRejectedValue(new Error('Load failed'));

            await expect(gameSheets.loadGameState()).rejects.toThrow('Error loading game state');
        });
    });

    describe('Backup System', () => {
        test('should create backup of game state', async () => {
            // Mock successful backup
            jest.spyOn(googleService, 'sheets').mockImplementation(() => ({
                spreadsheets: {
                    get: jest.fn().mockResolvedValue({ data: { sheets: [] } }),
                    batchUpdate: jest.fn().mockResolvedValue(true),
                    values: {
                        update: jest.fn().mockResolvedValue(true)
                    }
                }
            }));

            await expect(gameSheets.backupGameState()).resolves.not.toThrow();
            expect(googleService.sheets.spreadsheets.batchUpdate).toHaveBeenCalled();
        });

        test('should handle backup errors gracefully', async () => {
            // Mock failed backup
            jest.spyOn(googleService, 'sheets').mockImplementation(() => ({
                spreadsheets: {
                    get: jest.fn().mockRejectedValue(new Error('Get failed'))
                }
            }));

            await expect(gameSheets.backupGameState()).rejects.toThrow('Error creating backup');
        });
    });

    describe('Error Handling', () => {
        test('should handle invalid player data gracefully', async () => {
            // Mock corrupted data
            jest.spyOn(googleService, 'getSheetData')
                .mockResolvedValueOnce([['TEST123', 'setup', 1, 0, 2]])
                .mockResolvedValueOnce([
                    [1, 'Test Player 1', 0, 'invalid_json', '[]']
                ]);

            await expect(gameSheets.loadGameState()).rejects.toThrow('Error parsing player data');
        });

        test('should handle missing game state gracefully', async () => {
            // Mock empty data
            jest.spyOn(googleService, 'getSheetData')
                .mockResolvedValueOnce([])
                .mockResolvedValueOnce([]);

            await expect(gameSheets.loadGameState()).rejects.toThrow('No game state found');
        });
    });

    describe('Authentication Flow', () => {
        test('should handle callback with valid code', async () => {
            // Mock successful token exchange
            jest.spyOn(googleService, 'handleCallback').mockResolvedValue(true);

            const code = 'test-code';
            window.location.search = `?code=${code}`;

            await expect(googleService.handleCallback(code)).resolves.toBe(true);
            expect(googleService.handleCallback).toHaveBeenCalledWith(code);
        });

        test('should handle invalid callback gracefully', async () => {
            // Mock failed token exchange
            jest.spyOn(googleService, 'handleCallback').mockRejectedValue(new Error('Invalid code'));

            const code = 'invalid-code';
            window.location.search = `?code=${code}`;

            await expect(googleService.handleCallback(code)).resolves.toBe(false);
        });
    });
});
