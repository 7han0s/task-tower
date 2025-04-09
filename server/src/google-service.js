/**
 * google-service.js
 * Handles Google Sheets API integration
 */

const { google } = require('googleapis');
const dotenv = require('dotenv');

dotenv.config();

const sheets = google.sheets({ version: 'v4' });

/**
 * Initialize Google Sheets API
 */
async function initialize() {
    try {
        const auth = new google.auth.GoogleAuth({
            credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        const client = await auth.getClient();
        return { sheets, client };
    } catch (error) {
        console.error('Error initializing Google Sheets API:', error);
        throw error;
    }
}

/**
 * Get sheet data from a specific range
 * @param {string} spreadsheetId - The ID of the spreadsheet
 * @param {string} range - The range to read from (e.g., 'Sheet1!A1:Z')
 * @returns {Promise<Array<Array<any>>>} - The data from the sheet
 */
async function getSheetData(spreadsheetId, range) {
    try {
        const { sheets, client } = await initialize();
        
        const response = await sheets.spreadsheets.values.get({
            auth: client,
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
async function updateSheetData(spreadsheetId, range, values) {
    try {
        const { sheets, client } = await initialize();
        
        await sheets.spreadsheets.values.update({
            auth: client,
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
async function clearSheetData(spreadsheetId, range) {
    try {
        const { sheets, client } = await initialize();
        
        await sheets.spreadsheets.values.clear({
            auth: client,
            spreadsheetId,
            range
        });
    } catch (error) {
        console.error('Error clearing sheet data:', error);
        throw error;
    }
}

module.exports = {
    initialize,
    getSheetData,
    updateSheetData,
    clearSheetData
};
