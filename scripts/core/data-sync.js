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
        } catch (error) {
            console.error('Error initializing data sync:', error);
            throw error;
        }
    }

    startSyncLoop() {
        this.syncInterval = setInterval(async () => {
            try {
                await this.syncData();
            } catch (error) {
                console.error('Error in sync loop:', error);
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
        } catch (error) {
            console.error('Error during data sync:', error);
            // Retry failed syncs
            this.syncQueue.unshift({ type: 'retry', data: { error } });
        } finally {
            this.isSyncing = false;
        }
    }

    async handleSyncEvent(type, data) {
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
        }
    }

    async handlePlayerUpdate(playerData) {
        try {
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
        } catch (error) {
            console.error('Error updating player data:', error);
            throw error;
        }
    }

    async handleGameStateUpdate(gameState) {
        try {
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
        } catch (error) {
            console.error('Error updating game state:', error);
            throw error;
        }
    }

    async handleError(errorData) {
        try {
            // Log error to sheets
            await gameSheets.updateSheetData('Error Log!A1:D1', [
                ['Timestamp', 'Error Type', 'Error Message', 'Stack Trace']
            ]);

            await gameSheets.updateSheetData('Error Log!A2:D', [
                [
                    new Date().toISOString(),
                    errorData.type,
                    errorData.message,
                    errorData.stack
                ]
            ]);
        } catch (error) {
            console.error('Error logging error:', error);
        }
    }

    addSyncEvent(type, data) {
        this.syncQueue.push({ type, data });
    }

    stopSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
        this.isSyncing = false;
        this.syncQueue = [];
    }

    async recoverFromError(error) {
        try {
            // Load last known good state
            const savedState = await gameSheets.loadGameState();
            if (savedState) {
                gameCore.loadGameState(savedState);
                console.log('Recovered from error using saved state');
            } else {
                console.warn('No saved state found for recovery');
            }
        } catch (recoveryError) {
            console.error('Error during recovery:', recoveryError);
            throw recoveryError;
        }
    }
}

// Export singleton instance
export const dataSync = new DataSync();
