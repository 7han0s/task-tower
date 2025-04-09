const express = require('express');
const { google } = require('googleapis');
const dotenv = require('dotenv');
const { googleService } = require('./src/google-service');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(express.json());

// Basic health check
app.get('/', (req, res) => {
    const status = {
        status: 'ok',
        message: 'Task Tower Server is running',
        environment: process.env.NODE_ENV,
        port: port
    };
    
    // Add Google API status if credentials are configured
    if (process.env.GOOGLE_CREDENTIALS && process.env.GOOGLE_SPREADSHEET_ID) {
        try {
            const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
            status.googleApi = {
                status: 'configured',
                spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
                credentials: {
                    projectId: credentials.project_id,
                    clientId: credentials.client_id
                }
            };
        } catch (error) {
            status.googleApi = {
                status: 'error',
                message: 'Invalid Google credentials format',
                error: error.message
            };
        }
    } else {
        status.googleApi = {
            status: 'not configured',
            message: 'Please set GOOGLE_CREDENTIALS and GOOGLE_SPREADSHEET_ID in your environment variables'
        };
    }

    res.json(status);
});

// Routes
app.use('/api/game-state', require('./src/routes/game-state'));

// API Routes
app.get('/api/sheets', async (req, res) => {
    try {
        if (!process.env.GOOGLE_CREDENTIALS || !process.env.GOOGLE_SPREADSHEET_ID) {
            return res.status(400).json({
                error: 'Google credentials not configured',
                message: 'Please set GOOGLE_CREDENTIALS and SPREADSHEET_ID in your environment variables',
                requiredVariables: [
                    'GOOGLE_CREDENTIALS',
                    'GOOGLE_SPREADSHEET_ID'
                ]
            });
        }

        // Parse credentials
        const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
        
        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        const client = await auth.getClient();
        const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

        const sheets = google.sheets({ version: 'v4' });
        
        // First get the sheet names
        const metadata = await sheets.spreadsheets.get({
            auth: client,
            spreadsheetId
        });

        const sheetNames = metadata.data.sheets.map(sheet => sheet.properties.title);

        // Get the first sheet's data
        const firstSheetName = sheetNames[0];
        if (!firstSheetName) {
            return res.status(404).json({
                error: 'No sheets found in the spreadsheet',
                metadata: metadata.data
            });
        }

        const response = await sheets.spreadsheets.values.get({
            auth: client,
            spreadsheetId,
            range: `${firstSheetName}!A1:Z`
        });

        res.json({
            sheetNames,
            data: response.data.values || []
        });
    } catch (error) {
        console.error('Error accessing Google Sheets:', error);
        res.status(500).json({ 
            error: 'Failed to access Google Sheets',
            details: {
                message: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            }
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? {
            message: err.message,
            stack: err.stack
        } : undefined
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    if (!process.env.GOOGLE_CREDENTIALS || !process.env.GOOGLE_SPREADSHEET_ID) {
        console.warn('Warning: Google credentials not configured. Some features may not work.');
    }
});
