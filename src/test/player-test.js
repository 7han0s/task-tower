const PlayerService = require('../services/player-service');
const Player = require('../models/player');
const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Existing spreadsheet ID
const EXISTING_SPREADSHEET_ID = '1s_uCHHouasBzmei2A4bScWwX-sSNd59xLUcnh1cuQ4k';

async function testPlayerSystem() {
    try {
        console.log('Starting player system test...');

        // Initialize player service
        const playerService = new PlayerService();
        await playerService.initialize();

        // Test data
        const testPlayer = {
            name: 'Test Player',
            email: 'test@example.com'
        };

        // 1. Create player
        console.log('\n1. Creating player...');
        const createdPlayer = await playerService.createPlayer(testPlayer);
        console.log('Player created:', createdPlayer);

        // 2. Get player
        console.log('\n2. Getting player...');
        const player = await playerService.getPlayer(createdPlayer.id);
        console.log('Player:', player);

        // 3. Update player status
        console.log('\n3. Updating player status...');
        const updatedPlayer = await playerService.updateStatus(createdPlayer.id, Player.STATUS.ONLINE);
        console.log('Player status updated:', updatedPlayer);

        // 4. Get online players
        console.log('\n4. Getting online players...');
        const onlinePlayers = await playerService.getOnlinePlayers();
        console.log('Online players:', onlinePlayers);

        // 5. Assign task to player
        console.log('\n5. Assigning task to player...');
        const testTask = {
            id: 'test-task-1',
            title: 'Test Task',
            description: 'This is a test task',
            category: 'WORK',
            complexity: 'MODERATE',
            points: 5,
            status: 'COMPLETED',
            createdAt: new Date(),
            completedAt: new Date()
        };
        const playerWithTask = await playerService.assignTask(createdPlayer.id, testTask);
        console.log('Player with task:', playerWithTask);

        // 6. Clear player task
        console.log('\n6. Clearing player task...');
        const playerWithoutTask = await playerService.clearTask(createdPlayer.id);
        console.log('Player without task:', playerWithoutTask);

        console.log('\nPlayer system test completed successfully');
    } catch (error) {
        console.error('Player system test failed:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
    }
}

// Run the test
testPlayerSystem();
