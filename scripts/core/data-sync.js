/**
 * data-sync.js
 * Handles data synchronization between game state and Google Sheets
 */

import { gameSheets } from './game-sheets.js';
import { gameCore } from './game-core.js';

export class DataSync {
    constructor() {
        this.syncInterval = null;
        this.lastSyncTime = null;
        this.syncQueue = [];
        this.isSyncing = false;
    }

    async initialize() {
        try {
            await gameSheets.initialize();
            this.startSyncLoop();
            console.log('Data synchronization initialized');
            return true;
        } catch (error) {
            console.error('Error initializing data sync:', error);
            this.handleError({
                ...error,
                type: 'Initialization'
            });
            throw error;
        }
    }

    startSyncLoop() {
        this.syncInterval = setInterval(async () => {
            try {
                await this.syncData();
            } catch (error) {
                console.error('Error in sync loop:', error);
                this.handleError({
                    ...error,
                    type: 'SyncLoop'
                });
            }
        }, 5000); // Sync every 5 seconds

        // Initial sync
        this.syncData();
    }

    async syncData() {
        if (this.isSyncing) return;

        this.isSyncing = true;
        try {
            // Get current game state
            const gameState = {
                lobbyCode: 'TOWER_' + Math.random().toString(36).substring(7),
                currentPhase: gameCore.currentPhase,
                currentRound: gameCore.currentRound,
                timer: gameCore.phaseTimeRemaining,
                playerCount: gameCore.currentPlayerCount,
                players: gameCore.players
            };

            // Validate game state
            gameSheets.validateGameState(gameState);

            // Process sync queue
            while (this.syncQueue.length > 0) {
                const { type, data } = this.syncQueue.shift();
                await this.handleSyncEvent(type, data);
            }

            // Save current state
            await gameSheets.saveGameState(gameState);
            
            // Create backup if enough time has passed
            const now = new Date();
            if (!this.lastSyncTime || 
                (now - this.lastSyncTime) > 300000) { // 5 minutes
                await gameSheets.backupGameState();
                this.lastSyncTime = now;
            }

            console.log('Data synchronization completed successfully');
            return true;
        } catch (error) {
            console.error('Error during data sync:', error);
            this.handleError({
                ...error,
                type: 'SyncData'
            });
            
            // Retry failed syncs
            this.syncQueue.unshift({ type: 'retry', data: { error } });
            throw error;
        } finally {
            this.isSyncing = false;
        }
    }

    async handleSyncEvent(type, data) {
        try {
            switch (type) {
                case 'player-update':
                    await this.handlePlayerUpdate(data);
                    break;
                case 'game-state':
                    await this.handleGameStateUpdate(data);
                    break;
                case 'error':
                    await this.handleError(data);
                    break;
                default:
                    console.warn('Unknown sync event type:', type);
                    throw new Error(`Unknown sync event type: ${type}`);
            }
        } catch (error) {
            console.error('Error handling sync event:', error);
            this.handleError({
                ...error,
                type: 'HandleSyncEvent',
                eventType: type
            });
            throw error;
        }
    }

    async handlePlayerUpdate(playerData) {
        try {
            // Validate player data
            gameSheets.validatePlayerData(playerData);

            // Update player data in sheets
            await gameSheets.updateSheetData('Player Data!A2:E', [
                [
                    playerData.id,
                    playerData.name,
                    playerData.score,
                    JSON.stringify(playerData.tasks),
                    JSON.stringify(playerData.towerBlocks)
                ]
            ]);
            return true;
        } catch (error) {
            console.error('Error updating player data:', error);
            this.handleError({
                ...error,
                type: 'HandlePlayerUpdate'
            });
            throw error;
        }
    }

    async handleGameStateUpdate(gameState) {
        try {
            // Validate game state
            gameSheets.validateGameState(gameState);

            // Update game state in sheets
            await gameSheets.updateSheetData('Game State!A2:E2', [
                [
                    gameState.lobbyCode,
                    gameState.currentPhase,
                    gameState.currentRound,
                    gameState.timer,
                    gameState.playerCount
                ]
            ]);
            return true;
        } catch (error) {
            console.error('Error updating game state:', error);
            this.handleError({
                ...error,
                type: 'HandleGameStateUpdate'
            });
            throw error;
        }
    }

    async handleError(errorData) {
        try {
            // Log error
            console.error('Data Sync Error:', {
                timestamp: new Date().toISOString(),
                error: errorData.error,
                type: errorData.type,
                stack: errorData.stack,
                context: errorData.context
            });

            // Retry mechanism
            if (errorData.retryCount < 3) {
                errorData.retryCount = (errorData.retryCount || 0) + 1;
                setTimeout(() => {
                    this.syncData();
                }, 1000 * errorData.retryCount);
            }

            // Notify monitoring system
            if (window.monitoring) {
                monitoring.notifyError('Data Sync', errorData);
            }

            // Attempt recovery
            if (errorData.type === 'SyncData') {
                await this.recoverFromError(errorData);
            }
        } catch (error) {
            console.error('Error handling error:', error);
            throw error;
        }
    }

    addSyncEvent(type, data) {
        // Validate sync event
        if (!type) throw new Error('Sync event type is required');
        if (!data) throw new Error('Sync event data is required');

        this.syncQueue.push({ type, data });
    }

    async recoverFromError(error) {
        try {
            // Load last known good state
            const savedState = await gameSheets.loadGameState();
            if (savedState) {
                gameCore.loadGameState(savedState);
                console.log('Recovered from error using saved state');
                return true;
            } else {
                console.warn('No saved state found for recovery');
                throw new Error('No saved state available for recovery');
            }
        } catch (recoveryError) {
            console.error('Error during recovery:', recoveryError);
            this.handleError({
                ...recoveryError,
                type: 'Recovery'
            });
            throw recoveryError;
        }
    }

    stopSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        this.isSyncing = false;
        this.syncQueue = [];
    }
}

// Export singleton instance
export const dataSync = new DataSync();
