/**
 * game-sheets.test.js
 * Test suite for Google Sheets integration
 */

import { gameSheets } from '../scripts/core/game-sheets.js';
import { gameCore } from '../scripts/core/game-core.js';

// Mock Google service for testing
jest.mock('../scripts/core/google-service.js', () => ({
    googleService: {
        initialize: jest.fn(),
        updateSheetData: jest.fn(),
        getSheetData: jest.fn(),
        sheets: {
            spreadsheets: {
                create: jest.fn(),
                batchUpdate: jest.fn(),
                values: {
                    clear: jest.fn()
                }
            }
        }
    }
}));

// Mock StorageManager
jest.mock('../scripts/core/storage-manager.js', () => ({
    isAvailable: jest.fn().mockReturnValue(true),
    loadGame: jest.fn(),
    saveGame: jest.fn(),
    clearSaved: jest.fn()
}));

describe('Game Sheets Integration', () => {
    let mockGameState;
    let mockPlayerData;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Create mock game state
        mockGameState = {
            lobbyCode: 'TOWER_TEST',
            currentPhase: 'work',
            currentRound: 1,
            timer: 1500,
            playerCount: 2,
            players: [
                {
                    id: 1,
                    name: 'Player 1',
                    score: 10,
                    tasks: [{ id: 1, description: 'Test task', category: 'work' }],
                    towerBlocks: [{ id: 1, type: 'basic' }]
                },
                {
                    id: 2,
                    name: 'Player 2',
                    score: 5,
                    tasks: [],
                    towerBlocks: []
                }
            ]
        };

        // Create mock player data
        mockPlayerData = mockGameState.players.map(player => [
            player.id,
            player.name,
            player.score,
            JSON.stringify(player.tasks),
            JSON.stringify(player.towerBlocks)
        ]);
    });

    test('should initialize Google Sheets successfully', async () => {
        await gameSheets.initialize();
        expect(gameSheets.spreadsheetId).toBeDefined();
    });

    test('should save game state to Google Sheets', async () => {
        await gameSheets.saveGameState(mockGameState);

        // Verify game state was saved
        expect(gameSheets.sheets.spreadsheets.values.update).toHaveBeenCalledWith({
            spreadsheetId: expect.any(String),
            range: 'Game State!A2:E2',
            valueInputOption: 'RAW',
            resource: {
                values: [
                    [
                        mockGameState.lobbyCode,
                        mockGameState.currentPhase,
                        mockGameState.currentRound,
                        mockGameState.timer,
                        mockGameState.playerCount
                    ]
                ]
            }
        });

        // Verify player data was saved
        expect(gameSheets.sheets.spreadsheets.values.update).toHaveBeenCalledWith({
            spreadsheetId: expect.any(String),
            range: 'Player Data!A2:E',
            valueInputOption: 'RAW',
            resource: { values: mockPlayerData }
        });
    });

    test('should load game state from Google Sheets', async () => {
        // Mock getSheetData responses
        gameSheets.sheets.spreadsheets.values.get.mockResolvedValue({
            data: {
                values: [
                    [
                        mockGameState.lobbyCode,
                        mockGameState.currentPhase,
                        mockGameState.currentRound,
                        mockGameState.timer,
                        mockGameState.playerCount
                    ]
                ]
            }
        });

        const loadedState = await gameSheets.loadGameState();
        expect(loadedState).toEqual(mockGameState);
    });

    test('should create backup of game state', async () => {
        await gameSheets.backupGameState();

        // Verify backup sheet was created
        expect(gameSheets.sheets.spreadsheets.batchUpdate).toHaveBeenCalled();

        // Verify backup data was saved
        expect(gameSheets.sheets.spreadsheets.values.update).toHaveBeenCalledWith({
            spreadsheetId: expect.any(String),
            range: 'Game State Backup!A1:E1',
            valueInputOption: 'RAW',
            resource: {
                values: [
                    ['Lobby Code', 'Current Phase', 'Current Round', 'Timer', 'Player Count']
                ]
            }
        });
    });

    test('should handle errors gracefully', async () => {
        // Mock error scenarios
        gameSheets.sheets.spreadsheets.values.update.mockRejectedValue(new Error('API Error'));

        try {
            await gameSheets.saveGameState(mockGameState);
        } catch (error) {
            expect(error.message).toBe('API Error');
            expect(console.error).toHaveBeenCalled();
        }
    });
});
