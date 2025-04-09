/**
 * google-service.js
 * Handles Google Sheets API integration
 */

import { google } from 'googleapis';
import config from './google-config.js';

// Error types
const ERROR_TYPES = {
    AUTH: {
        INVALID_TOKEN: 'InvalidToken',
        AUTH_CALLBACK: 'AuthCallback',
        TOKEN_EXPIRED: 'TokenExpired',
        AUTH_FAILED: 'AuthFailed'
    },
    SHEETS: {
        GET_DATA: 'GetSheetData',
        UPDATE_DATA: 'UpdateSheetData',
        CLEAR_DATA: 'ClearSheetData',
        CREATE_SHEET: 'CreateSheet',
        SHEET_NOT_FOUND: 'SheetNotFound'
    },
    NETWORK: {
        TIMEOUT: 'NetworkTimeout',
        CONNECTION: 'NetworkConnection',
        RATE_LIMIT: 'RateLimit'
    },
    VALIDATION: {
        INVALID_DATA: 'InvalidData',
        MISSING_REQUIRED: 'MissingRequired',
        INVALID_FORMAT: 'InvalidFormat'
    },
    SYSTEM: {
        INITIALIZATION: 'Initialization',
        CONFIGURATION: 'Configuration',
        RESOURCE_LIMIT: 'ResourceLimit'
    },
    RECOVERY: {
        FAILED_RECOVERY: 'FailedRecovery',
        NO_BACKUP: 'NoBackupAvailable',
        CORRUPTED_DATA: 'CorruptedData'
    }
};

export class GoogleServiceError extends Error {
    constructor(message, type, context = {}) {
        super(message);
        this.name = 'GoogleServiceError';
        this.type = type;
        this.context = context;
        this.timestamp = new Date().toISOString();
    }
}

export class GoogleService {
    constructor() {
        this.auth = null;
        this.sheets = null;
        this.errorCount = 0;
        this.lastErrorTime = null;
    }

    async initialize() {
        try {
            this.auth = await this.getAuth();
            if (!this.auth) {
                throw new GoogleServiceError(
                    'Authentication failed',
                    ERROR_TYPES.AUTH.AUTH_FAILED
                );
            }
            this.sheets = google.sheets({ version: 'v4', auth: this.auth });
            console.log('Google API initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing Google API:', error);
            this.handleError(error);
            throw error;
        }
    }

    handleError(error) {
        // Log error
        console.error('Google Service Error:', {
            timestamp: error.timestamp || new Date().toISOString(),
            error: error.message,
            type: error.type,
            stack: error.stack,
            context: error.context
        });

        // Rate limiting
        const now = new Date();
        if (this.lastErrorTime && (now - this.lastErrorTime) < 1000) {
            this.errorCount++;
            if (this.errorCount > 5) {
                throw new GoogleServiceError(
                    'Too many errors in short time',
                    ERROR_TYPES.SYSTEM.RESOURCE_LIMIT
                );
            }
        } else {
            this.errorCount = 1;
        }
        this.lastErrorTime = now;

        // Retry mechanism
        if (error.retryCount < 3) {
            error.retryCount = (error.retryCount || 0) + 1;
            const retryDelay = 1000 * Math.pow(2, error.retryCount);
            setTimeout(() => {
                this.initialize();
            }, retryDelay);
        }

        // Notify monitoring system
        if (window.monitoring) {
            monitoring.notifyError('Google Service', {
                type: error.type,
                message: error.message,
                context: error.context
            });
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
                this.handleError({
                    ...error,
                    type: ERROR_TYPES.AUTH.INVALID_TOKEN
                });
            }
        }

        // If no valid token, redirect to auth URL
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: config.google.scopes
        });

        window.location.href = authUrl;
        return null;
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
            this.handleError({
                ...error,
                type: ERROR_TYPES.AUTH.AUTH_CALLBACK
            });
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
            this.handleError({
                ...error,
                type: ERROR_TYPES.SHEETS.GET_DATA,
                range: range
            });
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
            this.handleError({
                ...error,
                type: ERROR_TYPES.SHEETS.UPDATE_DATA,
                range: range,
                values: values
            });
            throw error;
        }
    }
}

// Export singleton instance
export const googleService = new GoogleService();
