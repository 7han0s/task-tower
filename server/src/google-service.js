/**
 * google-service.js
 * Handles Google Sheets API integration
 */

const { google } = require('googleapis');
const dotenv = require('dotenv');

dotenv.config();

/**
 * Google Service class
 */
class GoogleService {
    constructor() {
        this.sheets = google.sheets({ version: 'v4' });
        this.client = null;
    }

    /**
     * Initialize Google Sheets API
     */
    async initialize() {
        try {
            if (this.client) {
                return { sheets: this.sheets, client: this.client };
            }

            const auth = new google.auth.GoogleAuth({
                credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
                scopes: ['https://www.googleapis.com/auth/spreadsheets']
            });

            this.client = await auth.getClient();
            return { sheets: this.sheets, client: this.client };
        } catch (error) {
            console.error('Error initializing Google Sheets API:', error);
            throw new Error('Error initializing Google Sheets API');
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
            const { sheets, client } = await this.initialize();
            
            const response = await sheets.spreadsheets.values.get({
                auth: client,
                spreadsheetId,
                range
            });

            return response.data.values || [];
        } catch (error) {
            console.error('Error getting sheet data:', error);
            throw new Error('Error getting sheet data');
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
            const { sheets, client } = await this.initialize();
            
            await sheets.spreadsheets.values.update({
                auth: client,
                spreadsheetId,
                range,
                valueInputOption: 'RAW',
                resource: { values }
            });
        } catch (error) {
            console.error('Error updating sheet data:', error);
            throw new Error('Error updating sheet data');
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
            const { sheets, client } = await this.initialize();
            
            await sheets.spreadsheets.values.clear({
                auth: client,
                spreadsheetId,
                range
            });
        } catch (error) {
            console.error('Error clearing sheet data:', error);
            throw new Error('Error clearing sheet data');
        }
    }
}

// Export singleton instance
const googleService = new GoogleService();
module.exports = { googleService };
