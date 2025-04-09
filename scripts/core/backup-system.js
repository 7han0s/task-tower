/**
 * backup-system.js
 * Handles game state backups and recovery
 */

import { gameCore } from './game-core.js';
import { gameSheets } from './game-sheets.js';
import { dataSync } from './data-sync.js';

export class BackupSystem {
    constructor() {
        this.backupInterval = null;
        this.lastBackupTime = null;
        this.backupHistory = [];
        this.maxBackups = 10;
        this.backupFrequency = 300000; // 5 minutes
    }

    async initialize() {
        try {
            // Load backup history
            await this.loadBackupHistory();
            
            // Start backup loop
            this.startBackupLoop();

            // Create initial backup
            await this.createBackup();

            console.log('Backup system initialized');
        } catch (error) {
            console.error('Error initializing backup system:', error);
            throw error;
        }
    }

    startBackupLoop() {
        this.backupInterval = setInterval(async () => {
            try {
                await this.createBackup();
            } catch (error) {
                console.error('Error in backup loop:', error);
            }
        }, this.backupFrequency);

        // Initial backup
        this.createBackup();
    }

    async createBackup() {
        try {
            // Get current game state
            const gameState = {
                lobbyCode: 'TOWER_' + Math.random().toString(36).substring(7),
                currentPhase: gameCore.currentPhase,
                currentRound: gameCore.currentRound,
                timer: gameCore.phaseTimeRemaining,
                playerCount: gameCore.currentPlayerCount,
                players: gameCore.players,
                timestamp: new Date().toISOString()
            };

            // Save to Google Sheets
            await gameSheets.backupGameState();

            // Add to backup history
            this.backupHistory.unshift({
                timestamp: new Date().toISOString(),
                round: gameState.currentRound,
                phase: gameState.currentPhase
            });

            // Keep only the last maxBackups
            if (this.backupHistory.length > this.maxBackups) {
                this.backupHistory = this.backupHistory.slice(0, this.maxBackups);
            }

            // Save backup history
            await this.saveBackupHistory();

            console.log('Game state backed up successfully');
        } catch (error) {
            console.error('Error creating backup:', error);
            throw error;
        }
    }

    async loadBackupHistory() {
        try {
            // Load from Google Sheets
            const history = await gameSheets.getSheetData('Backup History!A2:D');
            
            // Convert to objects
            this.backupHistory = history.map(row => ({
                timestamp: row[0],
                round: parseInt(row[1]),
                phase: row[2]
            }));

            console.log('Backup history loaded successfully');
        } catch (error) {
            console.error('Error loading backup history:', error);
            throw error;
        }
    }

    async saveBackupHistory() {
        try {
            // Convert to array format
            const historyArray = this.backupHistory.map(backup => [
                backup.timestamp,
                backup.round,
                backup.phase
            ]);

            // Save to Google Sheets
            await gameSheets.updateSheetData('Backup History!A2:D', historyArray);

            console.log('Backup history saved successfully');
        } catch (error) {
            console.error('Error saving backup history:', error);
            throw error;
        }
    }

    async recoverFromBackup(backupIndex = 0) {
        try {
            // Get backup from history
            const backup = this.backupHistory[backupIndex];
            if (!backup) {
                throw new Error('No backup available at index ' + backupIndex);
            }

            // Load game state from backup
            const savedState = await gameSheets.loadGameState();
            if (!savedState) {
                throw new Error('No saved game state found');
            }

            // Load game state
            await gameCore.loadGameState(savedState);

            console.log('Game state recovered from backup successfully');
            return savedState;
        } catch (error) {
            console.error('Error recovering from backup:', error);
            throw error;
        }
    }

    async listBackups() {
        try {
            return this.backupHistory.map((backup, index) => ({
                index,
                timestamp: backup.timestamp,
                round: backup.round,
                phase: backup.phase
            }));
        } catch (error) {
            console.error('Error listing backups:', error);
            throw error;
        }
    }

    async deleteBackup(backupIndex) {
        try {
            if (backupIndex < 0 || backupIndex >= this.backupHistory.length) {
                throw new Error('Invalid backup index');
            }

            // Remove from history
            this.backupHistory.splice(backupIndex, 1);

            // Save updated history
            await this.saveBackupHistory();

            console.log('Backup deleted successfully');
        } catch (error) {
            console.error('Error deleting backup:', error);
            throw error;
        }
    }

    async clearAllBackups() {
        try {
            // Clear backup history
            this.backupHistory = [];

            // Clear backup sheet
            await gameSheets.clearSheetData('Backup History');

            console.log('All backups cleared successfully');
        } catch (error) {
            console.error('Error clearing backups:', error);
            throw error;
        }
    }

    async getBackupStats() {
        try {
            return {
                totalBackups: this.backupHistory.length,
                lastBackup: this.backupHistory[0]?.timestamp,
                oldestBackup: this.backupHistory[this.backupHistory.length - 1]?.timestamp,
                backupFrequency: this.backupFrequency,
                maxBackups: this.maxBackups
            };
        } catch (error) {
            console.error('Error getting backup stats:', error);
            throw error;
        }
    }

    async monitorBackupHealth() {
        try {
            const stats = await this.getBackupStats();
            const now = new Date();

            // Check if backups are being created regularly
            if (stats.lastBackup) {
                const lastBackupTime = new Date(stats.lastBackup);
                const timeSinceLastBackup = now - lastBackupTime;

                if (timeSinceLastBackup > this.backupFrequency * 2) {
                    console.warn('Warning: Backups are not being created regularly');
                    // TODO: Implement alerting system
                }
            }

            // Check for backup history consistency
            if (stats.totalBackups > 0) {
                const lastBackup = this.backupHistory[0];
                const secondLastBackup = this.backupHistory[1];

                if (lastBackup && secondLastBackup) {
                    const timeDiff = new Date(lastBackup.timestamp) - 
                                   new Date(secondLastBackup.timestamp);
                    
                    if (Math.abs(timeDiff - this.backupFrequency) > 60000) {
                        console.warn('Warning: Backup timing inconsistency detected');
                        // TODO: Implement alerting system
                    }
                }
            }

            console.log('Backup system health check completed');
        } catch (error) {
            console.error('Error monitoring backup health:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const backupSystem = new BackupSystem();
