const Player = require('../models/player');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Load service account credentials
const SERVICE_ACCOUNT_PATH = path.join(__dirname, '../../scripts/test/service-account.json');
const CONFIG_PATH = path.join(__dirname, '../../scripts/test/sheets-config.json');

const PLAYERS_PER_PAGE = 20;

class PlayerService {
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
            console.error('PlayerService initialization error:', error);
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

    async createPlayer(data) {
        try {
            const player = Player.create(data);

            // Save to Google Sheets
            const playerData = player.toJSON();
            
            // First, check if the sheet exists
            const sheets = await this.sheets.spreadsheets.get({
                spreadsheetId: this.config.spreadsheetId
            });

            const sheetExists = sheets.data.sheets.some(sheet => 
                sheet.properties.title === 'Players'
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
                                        title: 'Players',
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
                    range: 'Players!A1:J1',
                    valueInputOption: 'RAW',
                    resource: {
                        values: [
                            ['ID', 'Name', 'Email', 'Status', 'Score', 'Current Task', 
                             'Last Active', 'Created At', 'Updated At']
                        ]
                    }
                });
            }

            // Add the player data
            await this.sheets.spreadsheets.values.append({
                spreadsheetId: this.config.spreadsheetId,
                range: 'Players!A2',
                valueInputOption: 'RAW',
                resource: {
                    values: [[
                        player.id,
                        player.name,
                        player.email,
                        player.status,
                        player.score,
                        JSON.stringify(player.currentTask),
                        player.lastActive,
                        player.createdAt,
                        player.updatedAt
                    ]]
                }
            });

            return player;
        } catch (error) {
            console.error('Error creating player:', error);
            throw error;
        }
    }

    async getPlayer(playerId) {
        try {
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.config.spreadsheetId,
                range: 'Players!A2:J1000',
                majorDimension: 'ROWS'
            });

            const players = response.data.values.map(row => {
                const playerData = {
                    id: row[0],
                    name: row[1],
                    email: row[2],
                    status: row[3],
                    score: parseInt(row[4]),
                    currentTask: row[5] ? JSON.parse(row[5]) : null,
                    lastActive: row[6],
                    createdAt: row[7],
                    updatedAt: row[8]
                };
                return Player.fromJSON(playerData);
            });

            return players.find(player => player.id === playerId.toString());
        } catch (error) {
            console.error('Error getting player:', error);
            throw error;
        }
    }

    async updatePlayer(playerId, updates) {
        try {
            // Find the player in the sheet
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.config.spreadsheetId,
                range: 'Players!A2:J1000',
                majorDimension: 'ROWS'
            });

            const players = response.data.values;
            const playerIndex = players.findIndex(row => row[0] === playerId.toString());

            if (playerIndex === -1) {
                throw new Error('Player not found');
            }

            // Update the player
            const player = Player.fromJSON(players[playerIndex]);
            const updatedPlayer = new Player({
                ...player.toJSON(),
                ...updates
            });

            // Update in Google Sheets
            await this.sheets.spreadsheets.values.update({
                spreadsheetId: this.config.spreadsheetId,
                range: `Players!A${playerIndex + 2}`,
                valueInputOption: 'RAW',
                resource: {
                    values: [[
                        updatedPlayer.id,
                        updatedPlayer.name,
                        updatedPlayer.email,
                        updatedPlayer.status,
                        updatedPlayer.score,
                        JSON.stringify(updatedPlayer.currentTask),
                        updatedPlayer.lastActive,
                        updatedPlayer.createdAt,
                        updatedPlayer.updatedAt
                    ]]
                }
            });

            return updatedPlayer;
        } catch (error) {
            console.error('Error updating player:', error);
            throw error;
        }
    }

    async getPlayers(page = 1, status = null) {
        try {
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.config.spreadsheetId,
                range: 'Players!A2:J1000',
                majorDimension: 'ROWS'
            });

            const players = response.data.values.map(row => {
                const playerData = {
                    id: row[0],
                    name: row[1],
                    email: row[2],
                    status: row[3],
                    score: parseInt(row[4]),
                    currentTask: row[5] ? JSON.parse(row[5]) : null,
                    lastActive: row[6],
                    createdAt: row[7],
                    updatedAt: row[8]
                };
                return Player.fromJSON(playerData);
            });

            // Filter by status if provided
            let filteredPlayers = players;
            if (status) {
                filteredPlayers = players.filter(player => player.status === status);
            }

            // Paginate
            const startIndex = (page - 1) * PLAYERS_PER_PAGE;
            const endIndex = startIndex + PLAYERS_PER_PAGE;

            return {
                players: filteredPlayers.slice(startIndex, endIndex),
                total: filteredPlayers.length,
                page,
                totalPages: Math.ceil(filteredPlayers.length / PLAYERS_PER_PAGE)
            };
        } catch (error) {
            console.error('Error getting players:', error);
            throw error;
        }
    }

    async updateStatus(playerId, status) {
        try {
            const player = await this.getPlayer(playerId);
            if (!player) {
                throw new Error('Player not found');
            }

            player.updateStatus(status);
            return await this.updatePlayer(playerId, player.toJSON());
        } catch (error) {
            console.error('Error updating player status:', error);
            throw error;
        }
    }

    async assignTask(playerId, task) {
        try {
            const player = await this.getPlayer(playerId);
            if (!player) {
                throw new Error('Player not found');
            }

            player.assignTask(task);
            return await this.updatePlayer(playerId, player.toJSON());
        } catch (error) {
            console.error('Error assigning task to player:', error);
            throw error;
        }
    }

    async clearTask(playerId) {
        try {
            const player = await this.getPlayer(playerId);
            if (!player) {
                throw new Error('Player not found');
            }

            player.clearTask();
            return await this.updatePlayer(playerId, player.toJSON());
        } catch (error) {
            console.error('Error clearing player task:', error);
            throw error;
        }
    }

    async getOnlinePlayers() {
        return this.getPlayers(1, Player.STATUS.ONLINE);
    }

    async getInGamePlayers() {
        return this.getPlayers(1, Player.STATUS.IN_GAME);
    }
}

module.exports = PlayerService;
