const TaskService = require('../services/task-service');
const { google } = require('googleapis');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Existing spreadsheet ID
const EXISTING_SPREADSHEET_ID = '1s_uCHHouasBzmei2A4bScWwX-sSNd59xLUcnh1cuQ4k';

async function testTaskManagement() {
    try {
        console.log('Starting task management test...');

        // Initialize task service
        const taskService = new TaskService();
        await taskService.initialize();

        // Test data
        const playerId = 'test-player-1';
        const testTask = {
            title: 'Test Task',
            description: 'This is a test task',
            category: 'WORK',
            complexity: 'MODERATE'
        };

        // 1. Create task
        console.log('\n1. Creating task...');
        const createdTask = await taskService.createTask(testTask, playerId);
        console.log('Task created:', createdTask);

        // 2. Get tasks
        console.log('\n2. Getting tasks...');
        const tasks = await taskService.getTasks(playerId);
        console.log('Tasks:', tasks);

        // 3. Update task
        console.log('\n3. Updating task...');
        const updatedTask = await taskService.updateTask(createdTask.id, {
            status: 'IN_PROGRESS'
        });
        console.log('Task updated:', updatedTask);

        // 4. Get task categories
        console.log('\n4. Getting task categories...');
        const categories = await taskService.getTaskCategories();
        console.log('Categories:', categories);

        // 5. Get task complexities
        console.log('\n5. Getting task complexities...');
        const complexities = await taskService.getTaskComplexities();
        console.log('Complexities:', complexities);

        // 6. Get task statuses
        console.log('\n6. Getting task statuses...');
        const statuses = await taskService.getTaskStatuses();
        console.log('Statuses:', statuses);

        // 7. Delete task
        console.log('\n7. Deleting task...');
        await taskService.deleteTask(updatedTask.id);
        console.log('Task deleted successfully');

        console.log('\nTask management test completed successfully');
    } catch (error) {
        console.error('Task management test failed:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
    }
}

// Run the test
testTaskManagement();
