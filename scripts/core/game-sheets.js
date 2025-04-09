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

            // Save player data
            const playerData = gameState.players.map(player => [
                player.id,
                player.name,
                player.score,
                JSON.stringify(player.tasks),
                JSON.stringify(player.towerBlocks)
            ]);

            // Clear existing data and add new data
            await googleService.sheets.spreadsheets.values.clear({
                spreadsheetId: this.spreadsheetId,
                range: 'Player Data!A2:E'
            });

            await googleService.updateSheetData('Player Data!A2:E', playerData);

            console.log('Game state saved to Google Sheets successfully');
        } catch (error) {
            console.error('Error saving game state:', error);
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

            // Parse player data
            const players = playerData.map(row => ({
                id: row[0],
                name: row[1],
                score: row[2],
                tasks: JSON.parse(row[3]),
                towerBlocks: JSON.parse(row[4])
            }));

            return {
                lobbyCode: gameStateData[0][0],
                currentPhase: gameStateData[0][1],
                currentRound: gameStateData[0][2],
                timer: gameStateData[0][3],
                playerCount: gameStateData[0][4],
                players: players
            };
        } catch (error) {
            console.error('Error loading game state:', error);
            throw error;
        }
    }

    async backupGameState() {
        try {
            // Get current game state
            const gameState = await this.loadGameState();

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

            // Save backup
            await googleService.updateSheetData('Game State Backup!A1:E1', [
                ['Lobby Code', 'Current Phase', 'Current Round', 'Timer', 'Player Count']
            ]);

            await googleService.updateSheetData('Game State Backup!A2:E2', [
                [
                    gameState.lobbyCode,
                    gameState.currentPhase,
                    gameState.currentRound,
                    gameState.timer,
                    gameState.playerCount
                ]
            ]);

            console.log('Game state backed up successfully');
        } catch (error) {
            console.error('Error creating backup:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const gameSheets = new GameSheets();
