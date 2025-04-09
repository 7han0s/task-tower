const backupManager = require('./backup-manager');
const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Existing spreadsheet ID
const EXISTING_SPREADSHEET_ID = '1s_uCHHouasBzmei2A4bScWwX-sSNd59xLUcnh1cuQ4k';

async function testBackupSystem() {
    try {
        console.log('Starting backup system test...');

        // 1. Create a backup
        console.log('\n1. Creating backup...');
        const backupFileName = await backupManager.createBackup(EXISTING_SPREADSHEET_ID);
        console.log(`Backup created: ${backupFileName}`);

        // 2. List backups
        console.log('\n2. Listing backups...');
        const backups = await backupManager.listBackups();
        console.log('Available backups:', backups);

        // 3. Test restore
        console.log('\n3. Testing restore...');
        if (backups.length > 0) {
            const latestBackup = backups[0];
            console.log(`Restoring from backup: ${latestBackup}`);
            await backupManager.restoreBackup(EXISTING_SPREADSHEET_ID, latestBackup);
            console.log('Restore completed successfully');
        } else {
            console.log('No backups available to restore from');
        }

        console.log('\nBackup system test completed successfully');
    } catch (error) {
        console.error('Backup system test failed:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
    }
}

// Run the test
testBackupSystem();
