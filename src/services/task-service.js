const Task = require('../models/task');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Load service account credentials
const SERVICE_ACCOUNT_PATH = path.join(__dirname, '../../scripts/test/service-account.json');
const CONFIG_PATH = path.join(__dirname, '../../scripts/test/sheets-config.json');

const TASKS_PER_PAGE = 10;

class TaskService {
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
            console.error('TaskService initialization error:', error);
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

    async createTask(data, playerId) {
        try {
            const task = Task.create({
                ...data,
                assignedTo: playerId
            });

            // Save to Google Sheets
            const taskData = task.toJSON();
            
            // First, check if the sheet exists
            const sheets = await this.sheets.spreadsheets.get({
                spreadsheetId: this.config.spreadsheetId
            });

            const sheetExists = sheets.data.sheets.some(sheet => 
                sheet.properties.title === this.config.sheets.tasks.name
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
                                        title: this.config.sheets.tasks.name,
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
                    range: `${this.config.sheets.tasks.name}!A1:J1`,
                    valueInputOption: 'RAW',
                    resource: {
                        values: [this.config.sheets.tasks.headers]
                    }
                });
            }

            // Add the task data
            await this.sheets.spreadsheets.values.append({
                spreadsheetId: this.config.spreadsheetId,
                range: `${this.config.sheets.tasks.name}!A2`,
                valueInputOption: 'RAW',
                resource: {
                    values: [Object.values(taskData)]
                }
            });

            return task;
        } catch (error) {
            console.error('Error creating task:', error);
            throw error;
        }
    }

    async getTasks(playerId, page = 1) {
        try {
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.config.spreadsheetId,
                range: `${this.config.sheets.tasks.name}!A2:J1000`,
                majorDimension: 'ROWS'
            });

            const tasks = response.data.values.map(row => {
                const taskData = {
                    id: row[0],
                    title: row[1],
                    description: row[2],
                    category: row[3],
                    complexity: row[4],
                    points: row[5],
                    status: row[6],
                    createdAt: row[7],
                    completedAt: row[8] || null,
                    assignedTo: row[9]
                };
                return Task.fromJSON(taskData);
            });

            // Filter by player and paginate
            const playerTasks = tasks.filter(task => task.assignedTo === playerId);
            const startIndex = (page - 1) * TASKS_PER_PAGE;
            const endIndex = startIndex + TASKS_PER_PAGE;

            return {
                tasks: playerTasks.slice(startIndex, endIndex),
                total: playerTasks.length,
                page,
                totalPages: Math.ceil(playerTasks.length / TASKS_PER_PAGE)
            };
        } catch (error) {
            console.error('Error getting tasks:', error);
            throw error;
        }
    }

    async updateTask(taskId, updates) {
        try {
            // Find the task in the sheet
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.config.spreadsheetId,
                range: `${this.config.sheets.tasks.name}!A2:J1000`,
                majorDimension: 'ROWS'
            });

            const tasks = response.data.values;
            const taskIndex = tasks.findIndex(row => row[0] === taskId.toString());

            if (taskIndex === -1) {
                throw new Error('Task not found');
            }

            // Update the task
            const task = Task.fromJSON(tasks[taskIndex]);
            const updatedTask = new Task({
                ...task.toJSON(),
                ...updates
            });

            // Update in Google Sheets
            await this.sheets.spreadsheets.values.update({
                spreadsheetId: this.config.spreadsheetId,
                range: `${this.config.sheets.tasks.name}!A${taskIndex + 2}`,
                valueInputOption: 'RAW',
                resource: {
                    values: [Object.values(updatedTask.toJSON())]
                }
            });

            return updatedTask;
        } catch (error) {
            console.error('Error updating task:', error);
            throw error;
        }
    }

    async deleteTask(taskId) {
        try {
            // Find the task in the sheet
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.config.spreadsheetId,
                range: `${this.config.sheets.tasks.name}!A2:J1000`,
                majorDimension: 'ROWS'
            });

            const tasks = response.data.values;
            const taskIndex = tasks.findIndex(row => row[0] === taskId.toString());

            if (taskIndex === -1) {
                throw new Error('Task not found');
            }

            // Remove the task
            const remainingTasks = tasks.filter(row => row[0] !== taskId.toString());
            await this.sheets.spreadsheets.values.clear({
                spreadsheetId: this.config.spreadsheetId,
                range: `${this.config.sheets.tasks.name}!A2:J1000`
            });

            // Re-add remaining tasks
            if (remainingTasks.length > 0) {
                await this.sheets.spreadsheets.values.update({
                    spreadsheetId: this.config.spreadsheetId,
                    range: `${this.config.sheets.tasks.name}!A2`,
                    valueInputOption: 'RAW',
                    resource: {
                        values: remainingTasks
                    }
                });
            }
        } catch (error) {
            console.error('Error deleting task:', error);
            throw error;
        }
    }

    async getTaskCategories() {
        return Object.values(Task.CATEGORY);
    }

    async getTaskComplexities() {
        return Object.values(Task.COMPLEXITY);
    }

    async getTaskStatuses() {
        return Object.values(Task.STATUS);
    }
}

module.exports = TaskService;
