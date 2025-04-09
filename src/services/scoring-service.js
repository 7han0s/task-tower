const Score = require('../models/scoring');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Load service account credentials
const SERVICE_ACCOUNT_PATH = path.join(__dirname, '../../scripts/test/service-account.json');
const CONFIG_PATH = path.join(__dirname, '../../scripts/test/sheets-config.json');

const SCORES_PER_PAGE = 10;

class ScoringService {
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
            console.error('ScoringService initialization error:', error);
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

    async createScore(playerId) {
        try {
            const score = Score.create({
                playerId
            });

            // Save to Google Sheets
            const scoreData = score.toJSON();
            
            // First, check if the sheet exists
            const sheets = await this.sheets.spreadsheets.get({
                spreadsheetId: this.config.spreadsheetId
            });

            const sheetExists = sheets.data.sheets.some(sheet => 
                sheet.properties.title === 'Scores'
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
                                        title: 'Scores',
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
                    range: 'Scores!A1:K1',
                    valueInputOption: 'RAW',
                    resource: {
                        values: [
                            ['ID', 'Player ID', 'Points', 'Completed Tasks', 'Streak', 
                             'Last Task Time', 'Created At', 'Updated At', 
                             'Streak Multiplier', 'Category Multiplier', 'Time Multiplier']
                        ]
                    }
                });
            }

            // Add the score data
            await this.sheets.spreadsheets.values.append({
                spreadsheetId: this.config.spreadsheetId,
                range: 'Scores!A2',
                valueInputOption: 'RAW',
                resource: {
                    values: [[
                        score.id,
                        score.playerId,
                        score.points,
                        JSON.stringify(score.completedTasks),
                        score.streak,
                        score.lastTaskTime,
                        score.createdAt,
                        score.updatedAt,
                        score.multipliers.streak,
                        score.multipliers.category,
                        score.multipliers.time
                    ]]
                }
            });

            return score;
        } catch (error) {
            console.error('Error creating score:', error);
            throw error;
        }
    }

    async getScore(playerId) {
        try {
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.config.spreadsheetId,
                range: 'Scores!A2:K1000',
                majorDimension: 'ROWS'
            });

            const scores = response.data.values.map(row => {
                const scoreData = {
                    id: row[0],
                    playerId: row[1],
                    points: parseInt(row[2]),
                    completedTasks: JSON.parse(row[3]),
                    streak: parseInt(row[4]),
                    lastTaskTime: row[5],
                    createdAt: row[6],
                    updatedAt: row[7],
                    multipliers: {
                        streak: parseFloat(row[8]),
                        category: parseFloat(row[9]),
                        time: parseFloat(row[10])
                    }
                };
                return Score.fromJSON(scoreData);
            });

            return scores.find(score => score.playerId === playerId);
        } catch (error) {
            console.error('Error getting score:', error);
            throw error;
        }
    }

    async updateScore(playerId, updates) {
        try {
            // Find the score in the sheet
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.config.spreadsheetId,
                range: 'Scores!A2:K1000',
                majorDimension: 'ROWS'
            });

            const scores = response.data.values;
            const scoreIndex = scores.findIndex(row => row[1] === playerId);

            if (scoreIndex === -1) {
                throw new Error('Score not found');
            }

            // Update the score
            const score = Score.fromJSON(scores[scoreIndex]);
            const updatedScore = new Score({
                ...score.toJSON(),
                ...updates
            });

            // Update in Google Sheets
            await this.sheets.spreadsheets.values.update({
                spreadsheetId: this.config.spreadsheetId,
                range: `Scores!A${scoreIndex + 2}`,
                valueInputOption: 'RAW',
                resource: {
                    values: [[
                        updatedScore.id,
                        updatedScore.playerId,
                        updatedScore.points,
                        JSON.stringify(updatedScore.completedTasks),
                        updatedScore.streak,
                        updatedScore.lastTaskTime,
                        updatedScore.createdAt,
                        updatedScore.updatedAt,
                        updatedScore.multipliers.streak,
                        updatedScore.multipliers.category,
                        updatedScore.multipliers.time
                    ]]
                }
            });

            return updatedScore;
        } catch (error) {
            console.error('Error updating score:', error);
            throw error;
        }
    }

    async getLeaderboard(page = 1) {
        try {
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.config.spreadsheetId,
                range: 'Scores!A2:K1000',
                majorDimension: 'ROWS'
            });

            const scores = response.data.values.map(row => {
                const scoreData = {
                    id: row[0],
                    playerId: row[1],
                    points: parseInt(row[2]),
                    completedTasks: JSON.parse(row[3]),
                    streak: parseInt(row[4]),
                    lastTaskTime: row[5],
                    createdAt: row[6],
                    updatedAt: row[7],
                    multipliers: {
                        streak: parseFloat(row[8]),
                        category: parseFloat(row[9]),
                        time: parseFloat(row[10])
                    }
                };
                return Score.fromJSON(scoreData);
            });

            // Sort by points (descending)
            scores.sort((a, b) => b.points - a.points);

            // Paginate
            const startIndex = (page - 1) * SCORES_PER_PAGE;
            const endIndex = startIndex + SCORES_PER_PAGE;

            return {
                scores: scores.slice(startIndex, endIndex),
                total: scores.length,
                page,
                totalPages: Math.ceil(scores.length / SCORES_PER_PAGE)
            };
        } catch (error) {
            console.error('Error getting leaderboard:', error);
            throw error;
        }
    }

    async addPoints(playerId, points, task) {
        try {
            const score = await this.getScore(playerId);
            if (!score) {
                throw new Error('Score not found');
            }

            score.addPoints(points);
            score.addTask(task);

            return await this.updateScore(playerId, score.toJSON());
        } catch (error) {
            console.error('Error adding points:', error);
            throw error;
        }
    }
}

module.exports = ScoringService;
