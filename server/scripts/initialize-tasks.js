#!/usr/bin/env node

const { googleService } = require('../src/google-service');

async function initializeTasks() {
    try {
        const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
        
        if (!spreadsheetId) {
            console.error('Error: GOOGLE_SPREADSHEET_ID is not set in environment variables');
            process.exit(1);
        }

        await googleService.initializeTasksTab(spreadsheetId);
        console.log('Tasks tab initialized successfully');
    } catch (error) {
        console.error('Error initializing tasks:', error);
        process.exit(1);
    }
}

initializeTasks();
