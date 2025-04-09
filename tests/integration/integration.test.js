/**
 * integration.test.js
 * Integration tests for Google Sheets integration
 */

import { gameCore } from '../../scripts/core/game-core.js';
import { gameSheets } from '../../scripts/core/game-sheets.js';
import { dataSync } from '../../scripts/core/data-sync.js';
import { realTime } from '../../scripts/core/real-time.js';
import { backupSystem } from '../../scripts/core/backup-system.js';
import { monitoring } from '../../scripts/core/monitoring.js';

describe('Integration Tests', () => {
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

    describe('Game State Integration', () => {
        test('should initialize game state and sync with sheets', async () => {
            await gameCore.initializeGame({
                players: ['Player 1', 'Player 2'],
                rounds: 5
            });

            // Verify game state was saved to sheets
            expect(gameSheets.saveGameState).toHaveBeenCalledWith(expect.any(Object));
            
            // Verify sync was triggered
            expect(dataSync.addSyncEvent).toHaveBeenCalledWith('game-state', expect.any(Object));
            
            // Verify real-time update was sent
            expect(realTime.broadcastEvent).toHaveBeenCalledWith('game-state', expect.any(Object));
            
            // Verify backup was created
            expect(backupSystem.createBackup).toHaveBeenCalled();
        });

        test('should handle player updates across systems', async () => {
            // Initialize game
            await gameCore.initializeGame({
                players: ['Player 1', 'Player 2'],
                rounds: 5
            });

            // Update player
            await gameCore.handlePlayerUpdate(1, {
                score: 20,
                tasks: [{ id: 2, description: 'New task', category: 'work' }]
            });

            // Verify updates were propagated
            expect(dataSync.addSyncEvent).toHaveBeenCalledWith('player-update', expect.any(Object));
            expect(realTime.broadcastEvent).toHaveBeenCalledWith('player-update', expect.any(Object));
            expect(backupSystem.createBackup).toHaveBeenCalled();
        });

        test('should handle task completion with proper sync', async () => {
            // Initialize game
            await gameCore.initializeGame({
                players: ['Player 1', 'Player 2'],
                rounds: 5
            });

            // Complete task
            await gameCore.handleTaskCompletion(1, 1);

            // Verify updates were propagated
            expect(dataSync.addSyncEvent).toHaveBeenCalledWith('player-update', expect.any(Object));
            expect(realTime.broadcastEvent).toHaveBeenCalledWith('task-completion', expect.any(Object));
            expect(backupSystem.createBackup).toHaveBeenCalled();
        });
    });

    describe('Data Synchronization', () => {
        test('should sync data between systems', async () => {
            // Initialize game
            await gameCore.initializeGame({
                players: ['Player 1', 'Player 2'],
                rounds: 5
            });

            // Update game state
            await gameCore.saveGameState();

            // Verify sync was triggered
            expect(dataSync.syncData).toHaveBeenCalled();
            expect(realTime.broadcastEvent).toHaveBeenCalledWith('game-state', expect.any(Object));
            expect(backupSystem.createBackup).toHaveBeenCalled();
        });

        test('should handle sync conflicts', async () => {
            // Initialize game
            await gameCore.initializeGame({
                players: ['Player 1', 'Player 2'],
                rounds: 5
            });

            // Simulate conflict
            dataSync.syncQueue = [{
                type: 'player-update',
                data: {
                    id: 1,
                    score: 20
                }
            }, {
                type: 'player-update',
                data: {
                    id: 1,
                    score: 30
                }
            }];

            // Process sync queue
            await dataSync.syncData();

            // Verify conflict resolution
            expect(dataSync.addSyncEvent).toHaveBeenCalledWith('player-update', expect.any(Object));
            expect(realTime.broadcastEvent).toHaveBeenCalledWith('player-update', expect.any(Object));
            expect(backupSystem.createBackup).toHaveBeenCalled();
        });
    });

    describe('Backup System', () => {
        test('should create and manage backups', async () => {
            // Initialize game
            await gameCore.initializeGame({
                players: ['Player 1', 'Player 2'],
                rounds: 5
            });

            // Create backup
            await backupSystem.createBackup();

            // Verify backup was created
            expect(gameSheets.backupGameState).toHaveBeenCalled();
            
            // List backups
            const backups = await backupSystem.listBackups();
            expect(backups).toHaveLength(1);

            // Recover from backup
            const recoveredState = await backupSystem.recoverFromBackup(0);
            expect(recoveredState).toBeDefined();
        });

        test('should handle backup cleanup', async () => {
            // Initialize game
            await gameCore.initializeGame({
                players: ['Player 1', 'Player 2'],
                rounds: 5
            });

            // Create multiple backups
            for (let i = 0; i < 15; i++) {
                await backupSystem.createBackup();
            }

            // Verify only max backups are kept
            const backups = await backupSystem.listBackups();
            expect(backups).toHaveLength(backupSystem.maxBackups);
        });
    });

    describe('Monitoring System', () => {
        test('should monitor system health', async () => {
            // Initialize game
            await gameCore.initializeGame({
                players: ['Player 1', 'Player 2'],
                rounds: 5
            });

            // Check health
            await monitoring.checkHealth();

            // Verify metrics were logged
            expect(gameSheets.updateSheetData).toHaveBeenCalledWith('Health Metrics!A2:H', expect.any(Array));
            
            // Verify alerts were generated
            const alerts = await monitoring.getAlerts();
            expect(alerts).toBeDefined();
        });

        test('should detect and report issues', async () => {
            // Simulate issues
            gameSheets.sheets.spreadsheets.values.update.mockRejectedValue(new Error('API Error'));
            realTime.socket = null;

            // Check health
            await monitoring.checkHealth();

            // Verify alerts were generated
            const alerts = await monitoring.getAlerts();
            expect(alerts).toHaveLength(2);
            expect(alerts[0].message).toContain('Google Sheets sync errors detected');
            expect(alerts[1].message).toContain('Network connection issues detected');
        });
    });

    describe('Error Handling', () => {
        test('should handle and recover from errors', async () => {
            // Simulate error
            gameSheets.sheets.spreadsheets.values.update.mockRejectedValue(new Error('API Error'));

            try {
                await gameCore.saveGameState();
            } catch (error) {
                // Verify error was handled
                expect(error.message).toBe('API Error');
                
                // Verify backup was attempted
                expect(backupSystem.createBackup).toHaveBeenCalled();
                
                // Verify monitoring was triggered
                expect(monitoring.checkHealth).toHaveBeenCalled();
            }
        });

        test('should recover from backup on error', async () => {
            // Initialize game
            await gameCore.initializeGame({
                players: ['Player 1', 'Player 2'],
                rounds: 5
            });

            // Create backup
            await backupSystem.createBackup();

            // Simulate error
            gameSheets.sheets.spreadsheets.values.update.mockRejectedValue(new Error('API Error'));

            try {
                await gameCore.saveGameState();
            } catch (error) {
                // Verify recovery was attempted
                expect(backupSystem.recoverFromBackup).toHaveBeenCalled();
            }
        });
    });
});
