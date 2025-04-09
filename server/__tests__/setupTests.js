/**
 * setupTests.js
 * Test setup file for Google Sheets API integration
 */

// Mock Google APIs
jest.mock('googleapis', () => {
    const sheets = jest.fn(() => ({
        version: 'v4',
        spreadsheets: {
            values: {
                get: jest.fn(),
                update: jest.fn(),
                clear: jest.fn()
            }
        }
    }));

    return {
        sheets,
        auth: {
            GoogleAuth: jest.fn()
        }
    };
});

// Load environment variables
require('dotenv').config();

// Set up default test credentials
process.env.GOOGLE_CREDENTIALS = JSON.stringify({
    type: 'service_account',
    project_id: 'test-project',
    private_key_id: 'test-key-id',
    private_key: 'test-private-key',
    client_email: 'test@example.com',
    client_id: 'test-client-id',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/test%40example.com'
});
