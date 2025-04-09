/**
 * setup-google-auth.js
 * Script to set up Google Sheets authentication
 */

import { google } from 'googleapis';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

// Load environment variables
dotenv.config();

// Token storage path
const TOKEN_PATH = path.join(__dirname, '../test/token.json');

// OAuth2 client configuration
const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// Scopes for Google Sheets API
const SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/userinfo.email'
];

async function setupAuthentication() {
    try {
        // Check if we already have a token
        let token;
        try {
            token = JSON.parse(await fs.readFile(TOKEN_PATH, 'utf8'));
            oAuth2Client.setCredentials(token);
            const expiryDate = new Date(token.expiry_date);
            if (expiryDate > new Date()) {
                console.log('✅ Existing token is valid');
                return;
            }
        } catch (error) {
            console.log('ℹ️ No valid token found, will request new one');
        }

        // Generate authorization URL
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
            prompt: 'consent'
        });

        console.log('\nPlease visit this URL to authorize the application:\n');
        console.log(authUrl);
        console.log('\nAfter authorization, you will be redirected to a callback URL.\n');

        // Wait for user to authorize and paste the code
        const code = await new Promise((resolve) => {
            const readline = require('readline').createInterface({
                input: process.stdin,
                output: process.stdout
            });

            readline.question('Please enter the authorization code: ', (code) => {
                readline.close();
                resolve(code);
            });
        });

        // Exchange authorization code for tokens
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);

        // Save tokens to file
        await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens));
        console.log('\n✅ Authentication successful! Token saved to:', TOKEN_PATH);

        // Test API access
        const sheets = google.sheets({ version: 'v4', auth: oAuth2Client });
        const response = await sheets.spreadsheets.get({
            spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID
        });

        console.log('\n✅ Successfully accessed Google Sheets API');
        console.log('Spreadsheet title:', response.data.properties.title);

    } catch (error) {
        console.error('\n❌ Error setting up authentication:', error.message);
        process.exit(1);
    }
}

// Run setup
setupAuthentication();
