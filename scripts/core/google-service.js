/**
 * google-service.js
 * Handles Google Sheets API integration
 */

import { google } from 'googleapis';
import config from './google-config.js';
import fs from 'fs/promises';
import path from 'path';

// Token storage path
const TOKEN_PATH = path.join(__dirname, '../test/token.json');

// Custom error types
export class GoogleServiceError extends Error {
    constructor(message, type, context = {}) {
        super(message);
        this.name = 'GoogleServiceError';
        this.type = type;
        this.context = context;
        this.timestamp = new Date().toISOString();
    }
}

export class AuthError extends GoogleServiceError {
    constructor(message, context = {}) {
        super(message, 'AuthError', context);
    }
}

export class NetworkError extends GoogleServiceError {
    constructor(message, context = {}) {
        super(message, 'NetworkError', context);
    }
}

export class DataError extends GoogleServiceError {
    constructor(message, context = {}) {
        super(message, 'DataError', context);
    }
}

export class GoogleService {
    constructor() {
        this.auth = null;
        this.sheets = null;
    }

    async initialize() {
        try {
            this.auth = await this.getAuth();
            if (!this.auth) {
                throw new AuthError('Authentication failed', { authUrl: this.authUrl });
            }
            this.sheets = google.sheets({ version: 'v4', auth: this.auth });
            console.log('Google API initialized successfully');
        } catch (error) {
            console.error('Error initializing Google API:', {
                error: error.message,
                type: error.type,
                context: error.context
            });
            throw error;
        }
    }

    async getAuth() {
        try {
            const oAuth2Client = new google.auth.OAuth2(
                config.google.clientId,
                config.google.clientSecret,
                config.google.redirectUri
            );

            // Check if we have a valid token
            let token;
            try {
                token = JSON.parse(await fs.readFile(TOKEN_PATH, 'utf8'));
                oAuth2Client.setCredentials(token);
                const expiryDate = new Date(token.expiry_date);
                if (expiryDate > new Date()) {
                    return oAuth2Client;
                }
            } catch (error) {
                console.log('No valid token found, will request new one');
            }

            // If no valid token, redirect to auth URL
            const authUrl = oAuth2Client.generateAuthUrl({
                access_type: 'offline',
                scope: config.google.scopes,
                prompt: 'consent'
            });

            throw new AuthError('No valid authentication token found', { authUrl });

        } catch (error) {
            console.error('Error getting authentication:', {
                error: error.message,
                type: error.type,
                context: error.context
            });
            throw error;
        }
    }

    async handleCallback(code) {
        try {
            if (!code) {
                throw new AuthError('No authorization code provided');
            }

            const oAuth2Client = new google.auth.OAuth2(
                config.google.clientId,
                config.google.clientSecret,
                config.google.redirectUri
            );

            const { tokens } = await oAuth2Client.getToken(code);
            oAuth2Client.setCredentials(tokens);
            await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens));

            // Initialize sheets API
            this.sheets = google.sheets({ version: 'v4', auth: oAuth2Client });
            return true;
        } catch (error) {
            console.error('Error handling Google callback:', {
                error: error.message,
                type: error.type,
                context: error.context
            });
            throw new AuthError('Failed to handle callback', { code });
        }
    }

    async getSheetData(range) {
        try {
            if (!this.sheets) {
                throw new DataError('Sheets API not initialized');
            }

            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: config.google.spreadsheetId,
                range: range
            });

            if (!response.data.values) {
                throw new DataError('No data found in range', { range });
            }

            return response.data.values;
        } catch (error) {
            console.error('Error getting sheet data:', {
                error: error.message,
                type: error.type,
                context: error.context
            });
            throw new NetworkError('Failed to get sheet data', { range });
        }
    }

    async updateSheetData(range, values) {
        try {
            if (!this.sheets) {
                throw new DataError('Sheets API not initialized');
            }

            await this.sheets.spreadsheets.values.update({
                spreadsheetId: config.google.spreadsheetId,
                range: range,
                valueInputOption: 'RAW',
                resource: { values: values }
            });
        } catch (error) {
            console.error('Error updating sheet data:', {
                error: error.message,
                type: error.type,
                context: error.context
            });
            throw new NetworkError('Failed to update sheet data', { range });
        }
    }
}

// Export singleton instance
export const googleService = new GoogleService();
