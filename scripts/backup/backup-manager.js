const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Load service account credentials
const SERVICE_ACCOUNT_PATH = path.join(__dirname, '../test/service-account.json');
const CONFIG_PATH = path.join(__dirname, '../test/sheets-config.json');

// Backup configuration
const BACKUP_DIR = path.join(__dirname, '../backups');
const MAX_BACKUPS = 10;

async function loadServiceAccount() {
    try {
        const content = await fs.readFile(SERVICE_ACCOUNT_PATH, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        console.error('Error loading service account:', error);
        throw error;
    }
}

async function loadConfig() {
    try {
        const content = await fs.readFile(CONFIG_PATH, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        console.error('Error loading config:', error);
        throw error;
    }
}

async function authenticate() {
    try {
        const serviceAccount = await loadServiceAccount();
        const auth = new google.auth.GoogleAuth({
            credentials: serviceAccount,
            scopes: [
                'https://www.googleapis.com/auth/spreadsheets',
                'https://www.googleapis.com/auth/drive.file',
                'https://www.googleapis.com/auth/drive'
            ]
        });

        return auth;
    } catch (error) {
        console.error('Authentication error:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        throw error;
    }
}

async function createBackupDirectory() {
    try {
        await fs.mkdir(BACKUP_DIR, { recursive: true });
    } catch (error) {
        console.error('Error creating backup directory:', error);
        throw error;
    }
}

async function generateBackupFileName() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `backup-${timestamp}.json`;
}

async function cleanupOldBackups() {
    try {
        const files = await fs.readdir(BACKUP_DIR);
        const backupFiles = files.filter(file => file.startsWith('backup-'));
        
        if (backupFiles.length <= MAX_BACKUPS) return;

        const sortedFiles = backupFiles.sort();
        const filesToDelete = sortedFiles.slice(0, backupFiles.length - MAX_BACKUPS);

        for (const file of filesToDelete) {
            await fs.unlink(path.join(BACKUP_DIR, file));
        }
    } catch (error) {
        console.error('Error cleaning up old backups:', error);
        throw error;
    }
}

async function createBackup(spreadsheetId) {
    try {
        // Authenticate
        const auth = await authenticate();
        const sheets = google.sheets({ version: 'v4', auth });
        const config = await loadConfig();

        // Get all sheet data
        const backupData = {};
        for (const [key, sheetConfig] of Object.entries(config.sheets)) {
            const response = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range: `${sheetConfig.name}!A1:Z100`
            });
            backupData[sheetConfig.name] = response.data.values;
        }

        // Create backup directory if it doesn't exist
        await createBackupDirectory();

        // Generate backup file name
        const backupFileName = await generateBackupFileName();
        const backupPath = path.join(BACKUP_DIR, backupFileName);

        // Save backup
        await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));

        // Clean up old backups
        await cleanupOldBackups();

        console.log(`Backup created successfully: ${backupFileName}`);
        return backupFileName;
    } catch (error) {
        console.error('Error creating backup:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        throw error;
    }
}

async function restoreBackup(spreadsheetId, backupFileName) {
    try {
        // Authenticate
        const auth = await authenticate();
        const sheets = google.sheets({ version: 'v4', auth });
        const config = await loadConfig();

        // Read backup file
        const backupPath = path.join(BACKUP_DIR, backupFileName);
        const backupData = JSON.parse(await fs.readFile(backupPath, 'utf8'));

        // Restore each sheet
        for (const [sheetName, data] of Object.entries(backupData)) {
            const sheetConfig = config.sheets[sheetName.toLowerCase()];
            if (sheetConfig) {
                await sheets.spreadsheets.values.update({
                    spreadsheetId,
                    range: `${sheetName}!A1:Z100`,
                    valueInputOption: 'RAW',
                    resource: {
                        values: data
                    }
                });
            }
        }

        console.log(`Backup restored successfully from: ${backupFileName}`);
    } catch (error) {
        console.error('Error restoring backup:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        throw error;
    }
}

async function listBackups() {
    try {
        const files = await fs.readdir(BACKUP_DIR);
        const backupFiles = files.filter(file => file.startsWith('backup-'));
        return backupFiles.sort().reverse();
    } catch (error) {
        console.error('Error listing backups:', error);
        throw error;
    }
}

module.exports = {
    createBackup,
    restoreBackup,
    listBackups
};
