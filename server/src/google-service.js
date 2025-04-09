/**
 * google-service.js
 * Handles Google Sheets API integration
 */

const { google } = require('googleapis');
const { JWT } = require('google-auth-library');
const dotenv = require('dotenv');

dotenv.config();

/**
 * Google Service class
 */
class GoogleService {
    constructor() {
        this.sheets = null;
        this.isConfigured = false;
    }

    /**
     * Initialize Google Sheets API
     */
    async init() {
        try {
            if (!process.env.GOOGLE_CREDENTIALS || !process.env.GOOGLE_SPREADSHEET_ID) {
                throw new Error('Google credentials not configured');
            }

            const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
            const client = new JWT({
                email: credentials.client_email,
                key: credentials.private_key,
                scopes: ['https://www.googleapis.com/auth/spreadsheets']
            });

            this.sheets = google.sheets({ version: 'v4', auth: client });
            this.isConfigured = true;
            return true;
        } catch (error) {
            console.error('Error initializing Google Service:', error);
            this.isConfigured = false;
            throw error;
        }
    }

    /**
     * Get sheet data from a specific range
     * @param {string} spreadsheetId - The ID of the spreadsheet
     * @param {string} range - The range to read from (e.g., 'Sheet1!A1:Z')
     * @returns {Promise<Array<Array<any>>>} - The data from the sheet
     */
    async getSheetData(spreadsheetId, range) {
        try {
            if (!this.isConfigured) {
                await this.init();
            }

            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId,
                range
            });

            return response.data.values || [];
        } catch (error) {
            console.error('Error getting sheet data:', error);
            throw error;
        }
    }

    /**
     * Update sheet data in a specific range
     * @param {string} spreadsheetId - The ID of the spreadsheet
     * @param {string} range - The range to update (e.g., 'Sheet1!A1:Z')
     * @param {Array<Array<any>>} values - The data to write
     * @returns {Promise<void>}
     */
    async updateSheetData(spreadsheetId, range, values) {
        try {
            if (!this.isConfigured) {
                await this.init();
            }

            await this.sheets.spreadsheets.values.update({
                spreadsheetId,
                range,
                valueInputOption: 'RAW',
                resource: { values }
            });
        } catch (error) {
            console.error('Error updating sheet data:', error);
            throw error;
        }
    }

    /**
     * Clear data from a specific range
     * @param {string} spreadsheetId - The ID of the spreadsheet
     * @param {string} range - The range to clear (e.g., 'Sheet1!A1:Z')
     * @returns {Promise<void>}
     */
    async clearSheetData(spreadsheetId, range) {
        try {
            if (!this.isConfigured) {
                await this.init();
            }

            await this.sheets.spreadsheets.values.clear({
                spreadsheetId,
                range
            });
        } catch (error) {
            console.error('Error clearing sheet data:', error);
            throw error;
        }
    }

    /**
     * Initialize Tasks tab with headers and sample data
     * @param {string} spreadsheetId - The ID of the spreadsheet
     * @returns {Promise<void>}
     */
    async initializeTasksTab(spreadsheetId) {
        try {
            if (!this.isConfigured) {
                await this.init();
            }

            // Define headers
            const headers = [
                'ID',
                'Task Name',
                'Description',
                'Category',
                'Points',
                'Duration (minutes)',
                'Difficulty',
                'Status',
                'Assigned To',
                'Created At',
                'Updated At'
            ];

            // Sample tasks data
            const sampleTasks = [
                [
                    1,
                    'Code Review',
                    'Review and provide feedback on team member\'s code',
                    'Development',
                    50,
                    30,
                    'Medium',
                    'Available',
                    '',
                    new Date().toISOString(),
                    new Date().toISOString()
                ],
                [
                    2,
                    'Bug Fix',
                    'Fix critical bug in authentication system',
                    'Bug',
                    100,
                    60,
                    'High',
                    'Available',
                    '',
                    new Date().toISOString(),
                    new Date().toISOString()
                ],
                [
                    3,
                    'Feature Implementation',
                    'Implement new user dashboard',
                    'Development',
                    150,
                    120,
                    'High',
                    'Available',
                    '',
                    new Date().toISOString(),
                    new Date().toISOString()
                ]
            ];

            // Clear existing data in the Tasks tab
            await this.clearSheetData(spreadsheetId, 'Tasks!A1:K');

            // Write headers
            await this.updateSheetData(spreadsheetId, 'Tasks!A1:K1', [headers]);

            // Write sample tasks
            await this.updateSheetData(spreadsheetId, 'Tasks!A2:K', sampleTasks);

            // Format headers (bold and center)
            await this.sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                resource: {
                    requests: [
                        {
                            repeatCell: {
                                range: {
                                    sheetId: 0,
                                    startRowIndex: 0,
                                    endRowIndex: 1,
                                    startColumnIndex: 0,
                                    endColumnIndex: 11
                                },
                                cell: {
                                    userEnteredFormat: {
                                        textFormat: {
                                            bold: true
                                        },
                                        horizontalAlignment: 'CENTER'
                                    }
                                },
                                fields: 'userEnteredFormat(textFormat,horizontalAlignment)'
                            }
                        }
                    ]
                }
            });

            console.log('Tasks tab initialized successfully');
        } catch (error) {
            console.error('Error initializing Tasks tab:', error);
            throw error;
        }
    }
}

// Export singleton instance
module.exports = {
    googleService: new GoogleService()
};
