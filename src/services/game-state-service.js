const GameState = require('../models/game-state');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Load service account credentials
const SERVICE_ACCOUNT_PATH = path.join(__dirname, '../../scripts/test/service-account.json');
const CONFIG_PATH = path.join(__dirname, '../../scripts/test/sheets-config.json');

const GAMES_PER_PAGE = 10;

class GameStateService {
    constructor() {
        this.auth = null;
        this.sheets = null;
        this.config = null;
    }

    async initialize() {
        try {
            // Authenticate
            const serviceAccount = await this.loadServiceAccount();
            this.auth = new google.auth.GoogleAuth({
                credentials: serviceAccount,
                scopes: [
                    'https://www.googleapis.com/auth/spreadsheets',
                    'https://www.googleapis.com/auth/drive.file',
                    'https://www.googleapis.com/auth/drive'
                ]
            });

            this.sheets = google.sheets({ version: 'v4', auth: this.auth });
            this.config = await this.loadConfig();
        } catch (error) {
            console.error('GameStateService initialization error:', error);
            throw error;
        }
    }

    async loadServiceAccount() {
        try {
            const content = await fs.readFile(SERVICE_ACCOUNT_PATH, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            console.error('Error loading service account:', error);
            throw error;
        }
    }

    async loadConfig() {
        try {
            const content = await fs.readFile(CONFIG_PATH, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            console.error('Error loading config:', error);
            throw error;
        }
    }

    async createGameState(data) {
        try {
            const gameState = GameState.create(data);

            // Save to Google Sheets
            const gameStateData = gameState.toJSON();
            
            // First, check if the sheet exists
            const sheets = await this.sheets.spreadsheets.get({
                spreadsheetId: this.config.spreadsheetId
            });

            const sheetExists = sheets.data.sheets.some(sheet => 
                sheet.properties.title === 'Games'
            );

            if (!sheetExists) {
                // Create the sheet
                await this.sheets.spreadsheets.batchUpdate({
                    spreadsheetId: this.config.spreadsheetId,
                    resource: {
                        requests: [
                            {
                                addSheet: {
                                    properties: {
                                        title: 'Games',
                                        index: 0
                                    }
                                }
                            }
                        ]
                    }
                });

                // Add headers
                await this.sheets.spreadsheets.values.update({
                    spreadsheetId: this.config.spreadsheetId,
                    range: 'Games!A1:K1',
                    valueInputOption: 'RAW',
                    resource: {
                        values: [
                            ['ID', 'Round', 'Phase', 'Start Time', 'End Time', 'Duration', 
                             'Current Task', 'Players', 'Settings', 'Created At', 'Updated At']
                        ]
                    }
                });
            }

            // Add the game state data
            await this.sheets.spreadsheets.values.append({
                spreadsheetId: this.config.spreadsheetId,
                range: 'Games!A2',
                valueInputOption: 'RAW',
                resource: {
                    values: [[
                        gameState.id,
                        gameState.round,
                        gameState.phase,
                        gameState.startTime,
                        gameState.endTime,
                        gameState.duration,
                        JSON.stringify(gameState.currentTask),
                        JSON.stringify(gameState.players),
                        JSON.stringify(gameState.settings),
                        gameState.createdAt,
                        gameState.updatedAt
                    ]]
                }
            });

            return gameState;
        } catch (error) {
            console.error('Error creating game state:', error);
            throw error;
        }
    }

    async getGameState(gameId) {
        try {
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.config.spreadsheetId,
                range: 'Games!A2:K1000',
                majorDimension: 'ROWS'
            });

            const games = response.data.values.map(row => {
                const gameStateData = {
                    id: row[0],
                    round: parseInt(row[1]),
                    phase: row[2],
                    startTime: row[3],
                    endTime: row[4],
                    duration: parseInt(row[5]),
                    currentTask: row[6] ? JSON.parse(row[6]) : null,
                    players: row[7] ? JSON.parse(row[7]) : {},
                    settings: row[8] ? JSON.parse(row[8]) : {},
                    createdAt: row[9],
                    updatedAt: row[10]
                };
                return GameState.fromJSON(gameStateData);
            });

            return games.find(game => game.id === gameId.toString());
        } catch (error) {
            console.error('Error getting game state:', error);
            throw error;
        }
    }

    async updateGameState(gameId, updates) {
        try {
            // Find the game in the sheet
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.config.spreadsheetId,
                range: 'Games!A2:K1000',
                majorDimension: 'ROWS'
            });

            const games = response.data.values;
            const gameIndex = games.findIndex(row => row[0] === gameId.toString());

            if (gameIndex === -1) {
                throw new Error('Game state not found');
            }

            // Update the game state
            const gameState = GameState.fromJSON(games[gameIndex]);
            const updatedGameState = new GameState({
                ...gameState.toJSON(),
                ...updates
            });

            // Update in Google Sheets
            await this.sheets.spreadsheets.values.update({
                spreadsheetId: this.config.spreadsheetId,
                range: `Games!A${gameIndex + 2}`,
                valueInputOption: 'RAW',
                resource: {
                    values: [[
                        updatedGameState.id,
                        updatedGameState.round,
                        updatedGameState.phase,
                        updatedGameState.startTime,
                        updatedGameState.endTime,
                        updatedGameState.duration,
                        JSON.stringify(updatedGameState.currentTask),
                        JSON.stringify(updatedGameState.players),
                        JSON.stringify(updatedGameState.settings),
                        updatedGameState.createdAt,
                        updatedGameState.updatedAt
                    ]]
                }
            });

            return updatedGameState;
        } catch (error) {
            console.error('Error updating game state:', error);
            throw error;
        }
    }

    async getGames(page = 1, status = null) {
        try {
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.config.spreadsheetId,
                range: 'Games!A2:K1000',
                majorDimension: 'ROWS'
            });

            const games = response.data.values.map(row => {
                const gameStateData = {
                    id: row[0],
                    round: parseInt(row[1]),
                    phase: row[2],
                    startTime: row[3],
                    endTime: row[4],
                    duration: parseInt(row[5]),
                    currentTask: row[6] ? JSON.parse(row[6]) : null,
                    players: row[7] ? JSON.parse(row[7]) : {},
                    settings: row[8] ? JSON.parse(row[8]) : {},
                    createdAt: row[9],
                    updatedAt: row[10]
                };
                return GameState.fromJSON(gameStateData);
            });

            // Filter by status if provided
            let filteredGames = games;
            if (status) {
                filteredGames = games.filter(game => game.phase === status);
            }

            // Paginate
            const startIndex = (page - 1) * GAMES_PER_PAGE;
            const endIndex = startIndex + GAMES_PER_PAGE;

            return {
                games: filteredGames.slice(startIndex, endIndex),
                total: filteredGames.length,
                page,
                totalPages: Math.ceil(filteredGames.length / GAMES_PER_PAGE)
            };
        } catch (error) {
            console.error('Error getting games:', error);
            throw error;
        }
    }

    async startRound(gameId) {
        try {
            const gameState = await this.getGameState(gameId);
            if (!gameState) {
                throw new Error('Game state not found');
            }

            gameState.startRound();
            return await this.updateGameState(gameId, gameState.toJSON());
        } catch (error) {
            console.error('Error starting round:', error);
            throw error;
        }
    }

    async startBreak(gameId) {
        try {
            const gameState = await this.getGameState(gameId);
            if (!gameState) {
                throw new Error('Game state not found');
            }

            gameState.startBreak();
            return await this.updateGameState(gameId, gameState.toJSON());
        } catch (error) {
            console.error('Error starting break:', error);
            throw error;
        }
    }

    async endRound(gameId) {
        try {
            const gameState = await this.getGameState(gameId);
            if (!gameState) {
                throw new Error('Game state not found');
            }

            gameState.endRound();
            return await this.updateGameState(gameId, gameState.toJSON());
        } catch (error) {
            console.error('Error ending round:', error);
            throw error;
        }
    }

    async endGame(gameId) {
        try {
            const gameState = await this.getGameState(gameId);
            if (!gameState) {
                throw new Error('Game state not found');
            }

            gameState.endGame();
            return await this.updateGameState(gameId, gameState.toJSON());
        } catch (error) {
            console.error('Error ending game:', error);
            throw error;
        }
    }

    async addPlayer(gameId, playerId, playerData) {
        try {
            const gameState = await this.getGameState(gameId);
            if (!gameState) {
                throw new Error('Game state not found');
            }

            gameState.addPlayer(playerId, playerData);
            return await this.updateGameState(gameId, gameState.toJSON());
        } catch (error) {
            console.error('Error adding player:', error);
            throw error;
        }
    }

    async removePlayer(gameId, playerId) {
        try {
            const gameState = await this.getGameState(gameId);
            if (!gameState) {
                throw new Error('Game state not found');
            }

            gameState.removePlayer(playerId);
            return await this.updateGameState(gameId, gameState.toJSON());
        } catch (error) {
            console.error('Error removing player:', error);
            throw error;
        }
    }

    async updatePlayer(gameId, playerId, updates) {
        try {
            const gameState = await this.getGameState(gameId);
            if (!gameState) {
                throw new Error('Game state not found');
            }

            gameState.updatePlayer(playerId, updates);
            return await this.updateGameState(gameId, gameState.toJSON());
        } catch (error) {
            console.error('Error updating player:', error);
            throw error;
        }
    }

    async getCurrentTask(gameId) {
        try {
            const gameState = await this.getGameState(gameId);
            if (!gameState) {
                throw new Error('Game state not found');
            }

            return gameState.getCurrentTask();
        } catch (error) {
            console.error('Error getting current task:', error);
            throw error;
        }
    }

    async setCurrentTask(gameId, task) {
        try {
            const gameState = await this.getGameState(gameId);
            if (!gameState) {
                throw new Error('Game state not found');
            }

            gameState.setCurrentTask(task);
            return await this.updateGameState(gameId, gameState.toJSON());
        } catch (error) {
            console.error('Error setting current task:', error);
            throw error;
        }
    }

    async getActiveGames() {
        return this.getGames(1, GameState.ROUND_STATUS.WORK);
    }

    async getGamesInBreak() {
        return this.getGames(1, GameState.ROUND_STATUS.BREAK);
    }

    async getGamesOver() {
        return this.getGames(1, GameState.ROUND_STATUS.GAME_OVER);
    }
}

module.exports = GameStateService;
