/**
 * google-service.js
 * Handles Google Sheets API integration
 */

import { google } from 'googleapis';
import config from './google-config.js';

export class GoogleService {
    constructor() {
        this.auth = null;
        this.sheets = null;
    }

    async initialize() {
        try {
            this.auth = await this.getAuth();
            this.sheets = google.sheets({ version: 'v4', auth: this.auth });
            console.log('Google API initialized successfully');
        } catch (error) {
            console.error('Error initializing Google API:', error);
            throw error;
        }
    }

    async getAuth() {
        const oAuth2Client = new google.auth.OAuth2(
            config.google.clientId,
            config.google.clientSecret,
            config.google.redirectUri
        );

        // Check if we have a valid token
        const token = localStorage.getItem('google-token');
        if (token) {
            try {
                oAuth2Client.setCredentials(JSON.parse(token));
                const expiryDate = new Date(JSON.parse(token).expiry_date);
                if (expiryDate > new Date()) {
                    return oAuth2Client;
                }
            } catch (error) {
                console.log('Invalid token, will request new one');
            }
        }

        // If no valid token, redirect to auth URL
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: config.google.scopes
        });

        window.location.href = authUrl;
        return null; // Will be handled by callback
    }

    async handleCallback(code) {
        try {
            const oAuth2Client = new google.auth.OAuth2(
                config.google.clientId,
                config.google.clientSecret,
                config.google.redirectUri
            );

            const { tokens } = await oAuth2Client.getToken(code);
            oAuth2Client.setCredentials(tokens);
            localStorage.setItem('google-token', JSON.stringify(tokens));

            // Initialize sheets API
            this.sheets = google.sheets({ version: 'v4', auth: oAuth2Client });
            return true;
        } catch (error) {
            console.error('Error handling Google callback:', error);
            return false;
        }
    }

    async getSheetData(range) {
        try {
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: config.google.spreadsheetId,
                range: range
            });
            return response.data.values;
        } catch (error) {
            console.error('Error getting sheet data:', error);
            throw error;
        }
    }

    async updateSheetData(range, values) {
        try {
            await this.sheets.spreadsheets.values.update({
                spreadsheetId: config.google.spreadsheetId,
                range: range,
                valueInputOption: 'RAW',
                resource: { values: values }
            });
        } catch (error) {
            console.error('Error updating sheet data:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const googleService = new GoogleService();
