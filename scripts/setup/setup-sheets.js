import { googleService } from '../core/google-service.js';
import config from '../core/google-config.js';

async function createGameSheet() {
    try {
        // Initialize Google service
        await googleService.initialize();

        // Create new spreadsheet
        const spreadsheet = await googleService.sheets.spreadsheets.create({
            resource: {
                properties: {
                    title: 'Task Tower Game Data'
                }
            }
        });

        const spreadsheetId = spreadsheet.data.spreadsheetId;
        console.log('Created new spreadsheet:', spreadsheetId);

        // Update .env with new spreadsheet ID
        const envPath = process.env.NODE_ENV === 'development' 
            ? '../.env' 
            : '../.env.production';
        
        const fs = require('fs');
        const envContent = fs.readFileSync(envPath, 'utf8');
        const updatedEnv = envContent.replace(/GOOGLE_SPREADSHEET_ID=.*/g, 
            `GOOGLE_SPREADSHEET_ID=${spreadsheetId}`);
        fs.writeFileSync(envPath, updatedEnv);

        // Create Game State sheet
        await googleService.sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            resource: {
                requests: [
                    {
                        addSheet: {
                            properties: {
                                title: 'Game State',
                                index: 0
                            }
                        }
                    },
                    {
                        addSheet: {
                            properties: {
                                title: 'Player Data',
                                index: 1
                            }
                        }
                    }
                ]
            }
        });

        // Set up headers for Game State sheet
        await googleService.updateSheetData('Game State!A1:E1', [
            ['Lobby Code', 'Current Phase', 'Current Round', 'Timer', 'Player Count']
        ]);

        // Set up headers for Player Data sheet
        await googleService.updateSheetData('Player Data!A1:E1', [
            ['Player ID', 'Name', 'Score', 'Tasks', 'Tower Blocks']
        ]);

        console.log('Google Sheet templates created successfully');
        return spreadsheetId;
    } catch (error) {
        console.error('Error creating Google Sheet:', error);
        throw error;
    }
}

// Run the setup when this file is executed
if (require.main === module) {
    createGameSheet()
        .then(spreadsheetId => {
            console.log('Successfully created spreadsheet:', spreadsheetId);
        })
        .catch(error => {
            console.error('Failed to create spreadsheet:', error);
        });
}
