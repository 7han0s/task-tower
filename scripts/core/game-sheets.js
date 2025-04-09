/**
 * game-sheets.js
 * Handles Google Sheets integration for game state
 */

import { googleService } from './google-service.js';
import config from './google-config.js';

export class GameSheets {
    constructor() {
        this.spreadsheetId = config.google.spreadsheetId;
    }

    async initialize() {
        try {
            await googleService.initialize();
            console.log('Google Sheets integration initialized successfully');
        } catch (error) {
            console.error('Error initializing Google Sheets:', error);
            throw error;
        }
    }

    async saveGameState(gameState) {
        try {
            // Validate game state
            this.validateGameState(gameState);

            // Save game state
            await googleService.updateSheetData('Game State!A2:E2', [
                [
                    gameState.lobbyCode,
                    gameState.currentPhase,
                    gameState.currentRound,
                    gameState.timer,
                    gameState.playerCount
                ]
            ]);

            // Save player data with validation
            const playerData = gameState.players.map(player => {
                this.validatePlayerData(player);
                return [
                    player.id,
                    player.name,
                    player.score,
                    JSON.stringify(player.tasks),
                    JSON.stringify(player.towerBlocks)
                ];
            });

            // Clear existing data and add new data
            await googleService.sheets.spreadsheets.values.clear({
                spreadsheetId: this.spreadsheetId,
                range: 'Player Data!A2:E'
            });

            await googleService.updateSheetData('Player Data!A2:E', playerData);

            console.log('Game state saved to Google Sheets successfully');
            return true;
        } catch (error) {
            console.error('Error saving game state:', error);
            googleService.handleError({
                ...error,
                type: 'SaveGameState'
            });
            throw error;
        }
    }

    async loadGameState() {
        try {
            // Load game state
            const gameStateData = await googleService.getSheetData('Game State!A2:E2');
            if (!gameStateData || gameStateData.length === 0) {
                throw new Error('No game state found in Google Sheets');
            }

            // Load player data
            const playerData = await googleService.getSheetData('Player Data!A2:E');
            if (!playerData) {
                throw new Error('No player data found in Google Sheets');
            }

            // Parse and validate player data
            const players = playerData.map(row => {
                try {
                    const player = {
                        id: row[0],
                        name: row[1],
                        score: row[2],
                        tasks: JSON.parse(row[3]),
                        towerBlocks: JSON.parse(row[4])
                    };
                    this.validatePlayerData(player);
                    return player;
                } catch (parseError) {
                    console.error('Error parsing player data:', parseError);
                    throw new Error(`Invalid player data: ${parseError.message}`);
                }
            });

            // Validate game state data
            const gameState = {
                lobbyCode: gameStateData[0][0],
                currentPhase: gameStateData[0][1],
                currentRound: parseInt(gameStateData[0][2]),
                timer: parseInt(gameStateData[0][3]),
                playerCount: parseInt(gameStateData[0][4]),
                players: players
            };

            this.validateGameState(gameState);

            return gameState;
        } catch (error) {
            console.error('Error loading game state:', error);
            googleService.handleError({
                ...error,
                type: 'LoadGameState'
            });
            throw error;
        }
    }

    async backupGameState() {
        try {
            // Get current game state
            const gameState = await this.loadGameState();
            this.validateGameState(gameState);

            // Create backup sheet if it doesn't exist
            const sheets = await googleService.sheets.spreadsheets.get({
                spreadsheetId: this.spreadsheetId
            });

            const backupSheet = sheets.data.sheets.find(sheet => 
                sheet.properties.title === 'Game State Backup'
            );

            if (!backupSheet) {
                await googleService.sheets.spreadsheets.batchUpdate({
                    spreadsheetId: this.spreadsheetId,
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
            await googleService.updateSheetData('Game State Backup!A1:F1', [
                ['Timestamp', 'Lobby Code', 'Current Phase', 'Current Round', 'Timer', 'Player Count']
            ]);

            await googleService.updateSheetData('Game State Backup!A2:F2', [
                [
                    timestamp,
                    gameState.lobbyCode,
                    gameState.currentPhase,
                    gameState.currentRound,
                    gameState.timer,
                    gameState.playerCount
                ]
            ]);

            console.log('Game state backed up successfully');
            return true;
        } catch (error) {
            console.error('Error creating backup:', error);
            googleService.handleError({
                ...error,
                type: 'BackupGameState'
            });
            throw error;
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
        } else if (typeof gameState.lobbyCode !== 'string') {
            errors.push('Lobby code must be a string');
        } else if (gameState.lobbyCode.length < 5) {
            errors.push('Lobby code must be at least 5 characters');
        }

        // Phase validation
        const validPhases = ['work', 'action', 'break'];
        if (!gameState.currentPhase) {
            errors.push('Current phase is required');
        } else if (!validPhases.includes(gameState.currentPhase)) {
            errors.push(`Invalid phase: ${gameState.currentPhase}. Must be one of: ${validPhases.join(', ')}`);
        }

        // Round validation
        if (isNaN(gameState.currentRound)) {
            errors.push('Current round must be a number');
        } else if (gameState.currentRound < 0) {
            errors.push('Current round cannot be negative');
        }

        // Timer validation
        if (isNaN(gameState.timer)) {
            errors.push('Timer must be a number');
        } else if (gameState.timer < 0) {
            errors.push('Timer cannot be negative');
        } else if (gameState.timer > 60 * 60) { // 1 hour max
            errors.push('Timer cannot exceed 1 hour');
        }

        // Player count validation
        if (isNaN(gameState.playerCount)) {
            errors.push('Player count must be a number');
        } else if (gameState.playerCount < 1 || gameState.playerCount > 8) {
            errors.push('Player count must be between 1 and 8');
        }

        // Players validation
        if (!Array.isArray(gameState.players)) {
            errors.push('Players must be an array');
        } else if (gameState.players.length !== gameState.playerCount) {
            errors.push('Player count does not match number of players');
        }

        if (errors.length > 0) {
            throw new GoogleServiceError(
                `Game state validation failed: ${errors.join(', ')}`,
                ERROR_TYPES.VALIDATION.INVALID_DATA,
                { errors, gameState }
            );
        }
    }

    validatePlayerData(player) {
        const errors = [];
        
        // Basic validation
        if (!player) {
            errors.push('Player data is required');
        }
        
        // ID validation
        if (!player.id) {
            errors.push('Player ID is required');
        } else if (typeof player.id !== 'string') {
            errors.push('Player ID must be a string');
        } else if (player.id.length < 5) {
            errors.push('Player ID must be at least 5 characters');
        }

        // Name validation
        if (!player.name) {
            errors.push('Player name is required');
        } else if (typeof player.name !== 'string') {
            errors.push('Player name must be a string');
        } else if (player.name.length < 2 || player.name.length > 50) {
            errors.push('Player name must be between 2 and 50 characters');
        }

        // Score validation
        if (isNaN(player.score)) {
            errors.push('Player score must be a number');
        } else if (player.score < 0) {
            errors.push('Player score cannot be negative');
        }

        // Tasks validation
        if (!Array.isArray(player.tasks)) {
            errors.push('Player tasks must be an array');
        } else {
            for (const task of player.tasks) {
                const taskErrors = [];
                
                if (!task.description) {
                    taskErrors.push('Task description is required');
                }
                
                if (!task.category) {
                    taskErrors.push('Task category is required');
                } else {
                    const validCategories = ['personal', 'chores', 'work'];
                    if (!validCategories.includes(task.category)) {
                        taskErrors.push(`Invalid task category: ${task.category}`);
                    }
                }

                if (taskErrors.length > 0) {
                    errors.push(`Invalid task: ${taskErrors.join(', ')}`);
                }
            }
        }

        // Tower blocks validation
        if (!Array.isArray(player.towerBlocks)) {
            errors.push('Tower blocks must be an array');
        } else {
            for (const block of player.towerBlocks) {
                const blockErrors = [];
                
                if (!block.type) {
                    blockErrors.push('Block type is required');
                }
                
                if (!block.position) {
                    blockErrors.push('Block position is required');
                }

                if (blockErrors.length > 0) {
                    errors.push(`Invalid block: ${blockErrors.join(', ')}`);
                }
            }
        }

        if (errors.length > 0) {
            throw new GoogleServiceError(
                `Player data validation failed: ${errors.join(', ')}`,
                ERROR_TYPES.VALIDATION.INVALID_DATA,
                { errors, player }
            );
        }
    }
}

// Export singleton instance
export const gameSheets = new GameSheets();
