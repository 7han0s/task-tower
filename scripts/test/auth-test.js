const { google } = require('googleapis');
const config = require('../config');

// Initialize OAuth2 client
const oAuth2Client = new google.auth.OAuth2(
    config.google.clientId,
    config.google.clientSecret,
    config.google.redirectUri
);

// Generate auth URL
const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: config.google.scopes
});

console.log('Please visit this URL to authorize the application:', authUrl);

// Handle the callback
process.on('message', async (code) => {
    try {
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);
        
        // Test API access
        const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });
        const response = await sheets.spreadsheets.get({
            spreadsheetId: 'test-spreadsheet-id' // Replace with your test spreadsheet ID
        });
        
        console.log('Successfully authenticated and accessed API');
        console.log('User info:', response.data);
    } catch (error) {
        console.error('Authentication error:', error);
    }
});

// Listen for code from browser
const http = require('http');
const port = 3000;

const server = http.createServer((req, res) => {
    if (req.url.startsWith('/callback?')) {
        const url = new URL(`http://localhost:${port}${req.url}`);
        const code = url.searchParams.get('code');
        
        if (code) {
            process.send(code);
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end('<h1>Authentication successful!</h1>');
            server.close();
        }
    }
});

server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
