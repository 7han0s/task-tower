/**
 * google-config.js
 * Configuration for Google API integration
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const config = {
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI,
        projectId: process.env.GOOGLE_PROJECT_ID,
        spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID,
        authUri: process.env.GOOGLE_AUTH_URI,
        tokenUri: process.env.GOOGLE_TOKEN_URI,
        certUrl: process.env.GOOGLE_CERT_URL,
        scopes: [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/userinfo.email'
        ]
    },
    server: {
        port: process.env.PORT || 3000,
        env: process.env.NODE_ENV || 'development'
    }
};

export default config;
