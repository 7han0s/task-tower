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
}

// Export singleton instance
module.exports = {
    googleService: new GoogleService()
};
