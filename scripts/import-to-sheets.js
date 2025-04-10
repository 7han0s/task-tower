const { google } = require('googleapis');
const { JWT } = require('google-auth-library');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

async function importToSheets() {
    try {
        // Initialize Google Sheets API
        const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
        const client = new JWT({
            email: credentials.client_email,
            key: credentials.private_key,
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        const sheets = google.sheets({ version: 'v4', auth: client });
        const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

        // Read data from JSON files
        const games = JSON.parse(fs.readFileSync('data/games.json', 'utf8'));
        const players = JSON.parse(fs.readFileSync('data/players.json', 'utf8'));
        const tasks = JSON.parse(fs.readFileSync('data/tasks.json', 'utf8'));
        const subtasks = JSON.parse(fs.readFileSync('data/subtasks.json', 'utf8'));
        const settings = JSON.parse(fs.readFileSync('data/settings.json', 'utf8'));

        // Helper function to convert data to rows
        function convertToRows(data, headers) {
            return [headers].concat(
                data.map(item => headers.map(header => item[header.split(' ').join('')]))
            );
        }

        // Import Games
        const gameHeaders = ['ID', 'Lobby Code', 'Mode', 'Current Phase', 'Time Remaining', 'Created At', 'Updated At'];
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: 'Games!A1:H1000',
            valueInputOption: 'RAW',
            resource: { values: convertToRows(games, gameHeaders) }
        });

        // Import Players
        const playerHeaders = ['ID', 'Game ID', 'Name', 'Score', 'Created At', 'Updated At'];
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: 'Players!A1:G1000',
            valueInputOption: 'RAW',
            resource: { values: convertToRows(players, playerHeaders) }
        });

        // Import Tasks
        const taskHeaders = ['ID', 'Player ID', 'Text', 'Category', 'Points', 'Completed', 'Created At', 'Updated At'];
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: 'Tasks!A1:I1000',
            valueInputOption: 'RAW',
            resource: { values: convertToRows(tasks, taskHeaders) }
        });

        // Import Subtasks
        const subtaskHeaders = ['ID', 'Task ID', 'Text', 'Completed', 'Created At', 'Updated At'];
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: 'Subtasks!A1:G1000',
            valueInputOption: 'RAW',
            resource: { values: convertToRows(subtasks, subtaskHeaders) }
        });

        // Import Settings
        const settingsHeaders = ['ID', 'Game ID', 'Categories', 'Round Duration', 'Theme', 'Variant', 'Created At', 'Updated At'];
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: 'Settings!A1:I1000',
            valueInputOption: 'RAW',
            resource: { values: convertToRows(settings, settingsHeaders) }
        });

        console.log('Data imported to Google Sheets successfully');
    } catch (error) {
        console.error('Error importing to Google Sheets:', error);
        throw error;
    }
}

importToSheets().catch(console.error);
