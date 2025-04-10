const { google } = require('googleapis');
const { GoogleAuth } = require('google-auth-library');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

async function setupSheets() {
    try {
        // Initialize Google Sheets API
        const auth = new GoogleAuth({
            credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        const sheets = google.sheets({ version: 'v4', auth });
        const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

        // Create sheets if they don't exist
        const sheetsToCreate = [
            'Games',
            'Players',
            'Tasks',
            'Subtasks',
            'Settings'
        ];

        // First, get existing sheets
        const existingSheets = await sheets.spreadsheets.get({
            spreadsheetId
        });

        // Create any missing sheets
        for (const sheetName of sheetsToCreate) {
            const sheetExists = existingSheets.data.sheets.some(
                sheet => sheet.properties.title === sheetName
            );

            if (!sheetExists) {
                await sheets.spreadsheets.batchUpdate({
                    spreadsheetId,
                    resource: {
                        requests: [{
                            addSheet: {
                                properties: {
                                    title: sheetName,
                                    gridProperties: {
                                        rowCount: 1000,
                                        columnCount: 20
                                    }
                                }
                            }
                        }]
                    }
                });
            }
        }

        // Set headers for each sheet
        const headers = {
            Games: [
                'ID', 'Lobby Code', 'Round', 'Phase', 'Start Time',
                'End Time', 'Duration', 'Current Task', 'Created At', 'Updated At'
            ],
            Players: [
                'ID', 'Game ID', 'Name', 'Score', 'Created At', 'Updated At'
            ],
            Tasks: [
                'ID', 'Player ID', 'Text', 'Category', 'Points', 'Completed',
                'Created At', 'Updated At'
            ],
            Subtasks: [
                'ID', 'Task ID', 'Text', 'Completed', 'Created At', 'Updated At'
            ],
            Settings: [
                'ID', 'Game ID', 'Max Players', 'Max Rounds', 'Round Time',
                'Break Time', 'Task Categories', 'Complexity Levels', 'Created At', 'Updated At'
            ]
        };

        // Write headers to each sheet
        for (const [sheetName, headerArray] of Object.entries(headers)) {
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `${sheetName}!A1:${String.fromCharCode(65 + headerArray.length - 1)}1`,
                valueInputOption: 'RAW',
                resource: { values: [headerArray] }
            });
        }

        console.log('Google Sheets setup completed successfully');
    } catch (error) {
        console.error('Error setting up Google Sheets:', error);
        throw error;
    }
}

setupSheets().catch(console.error);
