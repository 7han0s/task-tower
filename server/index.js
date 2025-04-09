const express = require('express');
const { google } = require('googleapis');
const dotenv = require('dotenv');
const { googleService } = require('./src/google-service');

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(express.json());

// Initialize Google Sheets API
const sheets = google.sheets({ version: 'v4' });

// Routes
app.use('/api/game-state', require('./src/routes/game-state'));

// API Routes
app.get('/api/sheets', async (req, res) => {
    try {
        const auth = new google.auth.GoogleAuth({
            credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        const client = await auth.getClient();
        const spreadsheetId = process.env.SPREADSHEET_ID;

        const response = await sheets.spreadsheets.values.get({
            auth: client,
            spreadsheetId,
            range: 'Sheet1!A1:Z'
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error accessing Google Sheets:', error);
        res.status(500).json({ error: 'Failed to access Google Sheets' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
