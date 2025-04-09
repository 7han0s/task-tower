const ScoringService = require('../services/scoring-service');
const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Existing spreadsheet ID
const EXISTING_SPREADSHEET_ID = '1s_uCHHouasBzmei2A4bScWwX-sSNd59xLUcnh1cuQ4k';

async function testScoringSystem() {
    try {
        console.log('Starting scoring system test...');

        // Initialize scoring service
        const scoringService = new ScoringService();
        await scoringService.initialize();

        // Test data
        const playerId = 'test-player-1';
        const testTask = {
            id: 'test-task-1',
            title: 'Test Task',
            description: 'This is a test task',
            category: 'WORK',
            complexity: 'MODERATE',
            points: 5,
            status: 'COMPLETED',
            createdAt: new Date(),
            completedAt: new Date(),
            assignedTo: playerId
        };

        // 1. Create score
        console.log('\n1. Creating score...');
        const createdScore = await scoringService.createScore(playerId);
        console.log('Score created:', createdScore);

        // 2. Get score
        console.log('\n2. Getting score...');
        const score = await scoringService.getScore(playerId);
        console.log('Score:', score);

        // 3. Add points
        console.log('\n3. Adding points...');
        const updatedScore = await scoringService.addPoints(playerId, 5, testTask);
        console.log('Score updated:', updatedScore);

        // 4. Get leaderboard
        console.log('\n4. Getting leaderboard...');
        const leaderboard = await scoringService.getLeaderboard();
        console.log('Leaderboard:', leaderboard);

        console.log('\nScoring system test completed successfully');
    } catch (error) {
        console.error('Scoring system test failed:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
    }
}

// Run the test
testScoringSystem();
