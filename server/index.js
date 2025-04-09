require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const { googleService } = require('./src/google-service');

const app = express();

// Initialize Google Service
async function initializeServer() {
    try {
        await googleService.init();
        console.log('Google Service initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Google Service:', error);
        process.exit(1);
    }
}

// Start server initialization
initializeServer();

// Enable CORS for all routes
app.use(cors({
    origin: 'http://localhost:8081',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const gameStateRouter = require('./src/routes/game-state');
app.use('/api/game-state', gameStateRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Task Tower Server is running',
        environment: process.env.NODE_ENV || 'development',
        port: process.env.PORT || 3001,
        googleApi: {
            status: googleService.isConfigured ? 'configured' : 'not configured',
            spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
            credentials: {
                projectId: process.env.GOOGLE_CREDENTIALS ? JSON.parse(process.env.GOOGLE_CREDENTIALS).project_id : null,
                clientId: process.env.GOOGLE_CREDENTIALS ? JSON.parse(process.env.GOOGLE_CREDENTIALS).client_id : null
            }
        }
    });
});

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
        error: 'Internal Server Error',
        message: err.message
    });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
