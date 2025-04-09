/**
 * backup-system.js
 * Handles game state backups and recovery
 */

import { gameCore } from './game-core.js';
import { gameSheets } from './game-sheets.js';
import { dataSync } from './data-sync.js';
import { googleService } from './google-service.js';
import { config } from './config.js';
import { monitoring } from './monitoring.js';
import { ERROR_TYPES } from './error-types.js';

export class BackupSystem {
    constructor() {
        this.backupInterval = 300000; // 5 minutes
        this.maxBackups = 10;
        this.backupHistory = [];
        this.lastBackup = null;
        this.backupInProgress = false;
        this.errorCount = 0;
        this.lastErrorTime = null;
    }

    async initialize() {
        try {
            // Start backup loop
            this.startBackupLoop();
            
            // Load backup history
            await this.loadBackupHistory();
            
            console.log('Backup system initialized');
            return true;
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
                this.handleError(error);
            }
        }, this.backupInterval);

        // Initial backup
        this.createBackup();
    }

    async createBackup() {
        if (this.backupInProgress) return;

        this.backupInProgress = true;
        try {
            // Get current game state
            const gameState = await gameSheets.loadGameState();
            this.validateGameState(gameState);

            // Create backup sheet if it doesn't exist
            const sheets = await googleService.sheets.spreadsheets.get({
                spreadsheetId: config.google.spreadsheetId
            });

            const backupSheet = sheets.data.sheets.find(sheet => 
                sheet.properties.title === 'Game State Backup'
            );

            if (!backupSheet) {
                await googleService.sheets.spreadsheets.batchUpdate({
                    spreadsheetId: config.google.spreadsheetId,
                    resource: {
                        requests: [{
                            addSheet: {
                                properties: {
                                    title: 'Game State Backup',
                                    index: 2
                                }
                            }
                        }]
                    }
                });
            }

            // Save backup with timestamp
            const timestamp = new Date().toISOString();
            const backupData = {
                timestamp,
                lobbyCode: gameState.lobbyCode,
                currentPhase: gameState.currentPhase,
                currentRound: gameState.currentRound,
                timer: gameState.timer,
                playerCount: gameState.playerCount,
                players: gameState.players
            };

            // Store backup in history
            this.backupHistory.push(backupData);
            if (this.backupHistory.length > this.maxBackups) {
                this.backupHistory.shift();
            }

            // Save to Google Sheets
            await googleService.updateSheetData('Game State Backup!A1:G1', [
                ['Timestamp', 'Lobby Code', 'Phase', 'Round', 'Timer', 'Players', 'Backup ID']
            ]);

            const backupId = `backup_${timestamp.replace(/[^\w]/g, '_')}`;
            await googleService.updateSheetData('Game State Backup!A2:G2', [
                [
                    timestamp,
                    gameState.lobbyCode,
                    gameState.currentPhase,
                    gameState.currentRound,
                    gameState.timer,
                    gameState.playerCount,
                    backupId
                ]
            ]);

            // Save backup to local storage
            localStorage.setItem(`backup_${backupId}`, JSON.stringify(backupData));

            this.lastBackup = timestamp;
            monitoring.recordSyncSuccess();
            console.log('Backup created successfully:', backupId);
            return backupId;
        } catch (error) {
            console.error('Error creating backup:', error);
            this.handleError(error);
            throw error;
        } finally {
            this.backupInProgress = false;
        }
    }

    async loadBackup(backupId) {
        try {
            // Try to load from local storage first
            const backupData = localStorage.getItem(`backup_${backupId}`);
            if (backupData) {
                const parsedData = JSON.parse(backupData);
                this.validateGameState(parsedData);
                return parsedData;
            }

            // If not in local storage, try to load from sheets
            const backupDataFromSheets = await googleService.getSheetData('Game State Backup!A2:G');
            if (!backupDataFromSheets || backupDataFromSheets.length === 0) {
                throw new Error('No backup data found');
            }

            // Find the backup with matching ID
            const backupRow = backupDataFromSheets.find(row => row[6] === backupId);
            if (!backupRow) {
                throw new Error(`Backup not found: ${backupId}`);
            }

            // Reconstruct game state
            const gameState = {
                lobbyCode: backupRow[1],
                currentPhase: backupRow[2],
                currentRound: parseInt(backupRow[3]),
                timer: parseInt(backupRow[4]),
                playerCount: parseInt(backupRow[5]),
                players: []
            };

            // Load player data
            const playerData = await googleService.getSheetData('Player Data!A2:E');
            if (playerData) {
                gameState.players = playerData.map(row => ({
                    id: row[0],
                    name: row[1],
                    score: parseInt(row[2]),
                    tasks: JSON.parse(row[3]),
                    towerBlocks: JSON.parse(row[4])
                }));
            }

            this.validateGameState(gameState);
            return gameState;
        } catch (error) {
            console.error('Error loading backup:', error);
            this.handleError(error);
            throw error;
        }
    }

    async loadBackupHistory() {
        try {
            const backupData = await googleService.getSheetData('Game State Backup!A2:G');
            if (!backupData) return;

            this.backupHistory = backupData.map(row => ({
                timestamp: row[0],
                lobbyCode: row[1],
                currentPhase: row[2],
                currentRound: parseInt(row[3]),
                timer: parseInt(row[4]),
                playerCount: parseInt(row[5]),
                backupId: row[6]
            })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            if (this.backupHistory.length > this.maxBackups) {
                this.backupHistory = this.backupHistory.slice(0, this.maxBackups);
            }

            return this.backupHistory;
        } catch (error) {
            console.error('Error loading backup history:', error);
            this.handleError(error);
            throw error;
        }
    }

    async recoverFromError(error) {
        try {
            // Get latest backup
            const backupHistory = await this.loadBackupHistory();
            if (!backupHistory || backupHistory.length === 0) {
                throw new Error('No backups available for recovery');
            }

            // Load from latest backup
            const latestBackup = backupHistory[0];
            const gameState = await this.loadBackup(latestBackup.backupId);
            this.validateGameState(gameState);

            // Restore game state
            gameCore.loadGameState(gameState);
            console.log('Recovered from error using backup:', latestBackup.backupId);
            return true;
        } catch (recoveryError) {
            console.error('Error during recovery:', recoveryError);
            this.handleError(recoveryError);
            throw recoveryError;
        }
    }

    validateGameState(gameState) {
        const errors = [];

        // Basic validation
        if (!gameState) {
            errors.push('Game state is required');
        }

        // Lobby code validation
        if (!gameState.lobbyCode) {
            errors.push('Lobby code is required');
        }

        // Phase validation
        const validPhases = ['work', 'action', 'break'];
        if (!gameState.currentPhase) {
            errors.push('Current phase is required');
        } else if (!validPhases.includes(gameState.currentPhase)) {
            errors.push(`Invalid phase: ${gameState.currentPhase}`);
        }

        // Round validation
        if (isNaN(gameState.currentRound)) {
            errors.push('Current round must be a number');
        }

        // Timer validation
        if (isNaN(gameState.timer)) {
            errors.push('Timer must be a number');
        }

        // Player count validation
        if (isNaN(gameState.playerCount)) {
            errors.push('Player count must be a number');
        }

        // Players validation
        if (!Array.isArray(gameState.players)) {
            errors.push('Players must be an array');
        }

        if (errors.length > 0) {
            throw new GoogleServiceError(
                `Invalid game state in backup: ${errors.join(', ')}`,
                ERROR_TYPES.VALIDATION.INVALID_DATA,
                { errors, gameState }
            );
        }
    }

    handleError(error) {
        // Log error
        console.error('Backup System Error:', {
            timestamp: error.timestamp || new Date().toISOString(),
            error: error.message,
            type: error.type,
            stack: error.stack,
            context: error.context
        });

        // Rate limiting
        const now = new Date();
        if (this.lastErrorTime && (now - this.lastErrorTime) < 1000) {
            this.errorCount++;
            if (this.errorCount > 5) {
                throw new GoogleServiceError(
                    'Too many errors in short time',
                    ERROR_TYPES.SYSTEM.RESOURCE_LIMIT
                );
            }
        } else {
            this.errorCount = 1;
        }
        this.lastErrorTime = now;

        // Retry mechanism
        if (error.retryCount < 3) {
            error.retryCount = (error.retryCount || 0) + 1;
            const retryDelay = 1000 * Math.pow(2, error.retryCount);
            setTimeout(() => {
                this.createBackup();
            }, retryDelay);
        }

        // Notify monitoring system
        if (window.monitoring) {
            monitoring.notifyError('Backup System', {
                type: error.type,
                message: error.message,
                context: error.context
            });
        }
    }
}

// Export singleton instance
export const backupSystem = new BackupSystem();
