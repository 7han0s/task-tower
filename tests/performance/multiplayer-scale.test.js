const { multiplayerManager } = require('../../scripts/core/multiplayer-manager');
const { multiplayerClient } = require('../../scripts/client/multiplayer-client');
const { io } = require('socket.io-client');
const { performance } = require('perf_hooks');

const MAX_PLAYERS = 8;
const TASKS_PER_PLAYER = 10;

describe('Multiplayer Performance', () => {
    let server;
    let clients = [];
    let mockIO;

    beforeAll(async () => {
        // Mock the server
        const { Server } = require('socket.io');
        const http = require('http');
        
        const server = http.createServer();
        mockIO = new Server(server);
        
        // Initialize multiplayer manager
        multiplayerManager.initialize(mockIO);
        
        // Start server
        await new Promise(resolve => server.listen(3000, resolve));
    });

    beforeEach(() => {
        // Create client instances
        for (let i = 0; i < MAX_PLAYERS; i++) {
            const client = new multiplayerClient();
            clients.push(client);
        }
    });

    afterEach(() => {
        // Clean up clients
        clients.forEach(client => {
            if (client && client.socket) {
                client.socket.disconnect();
            }
        });
        clients = [];
    });

    afterAll(async () => {
        // Clean up server
        if (mockIO) {
            mockIO.close();
        }
    });

    test('should handle maximum players connection', async () => {
        const startTime = performance.now();

        // Connect all clients
        await Promise.all(clients.map(client => new Promise(resolve => {
            client.initialize();
            client.socket.on('connect', resolve);
        })));

        const endTime = performance.now();
        const connectionTime = endTime - startTime;

        // Verify all clients are connected
        expect(clients.every(client => client.socket.connected)).toBe(true);

        // Verify connection performance
        console.log(`Connection time for ${MAX_PLAYERS} players: ${connectionTime.toFixed(2)}ms`);
        expect(connectionTime).toBeLessThan(1000); // Should connect all players in less than 1 second
    });

    test('should handle task updates with multiple players', async () => {
        // Connect all clients
        await Promise.all(clients.map(client => new Promise(resolve => {
            client.initialize();
            client.socket.on('connect', resolve);
        })));

        const startTime = performance.now();

        // Create tasks for each player
        for (let i = 0; i < MAX_PLAYERS; i++) {
            for (let j = 0; j < TASKS_PER_PLAYER; j++) {
                const taskId = `task-${i}-${j}`;
                const taskData = { status: 'completed' };
                clients[i].sendTaskUpdate(taskId, taskData);
            }
        }

        const endTime = performance.now();
        const updateTime = endTime - startTime;

        // Verify update performance
        console.log(`Task update time for ${MAX_PLAYERS * TASKS_PER_PLAYER} tasks: ${updateTime.toFixed(2)}ms`);
        expect(updateTime).toBeLessThan(500); // Should update all tasks in less than 500ms
    });

    test('should handle score updates with multiple players', async () => {
        // Connect all clients
        await Promise.all(clients.map(client => new Promise(resolve => {
            client.initialize();
            client.socket.on('connect', resolve);
        })));

        const startTime = performance.now();

        // Update scores for each player
        for (let i = 0; i < MAX_PLAYERS; i++) {
            const points = 10;
            clients[i].sendScoreUpdate(points);
        }

        const endTime = performance.now();
        const updateTime = endTime - startTime;

        // Verify update performance
        console.log(`Score update time for ${MAX_PLAYERS} players: ${updateTime.toFixed(2)}ms`);
        expect(updateTime).toBeLessThan(200); // Should update all scores in less than 200ms
    });

    test('should handle player disconnections', async () => {
        // Connect all clients
        await Promise.all(clients.map(client => new Promise(resolve => {
            client.initialize();
            client.socket.on('connect', resolve);
        })));

        const startTime = performance.now();

        // Disconnect all clients
        clients.forEach(client => client.socket.disconnect());

        const endTime = performance.now();
        const disconnectTime = endTime - startTime;

        // Verify disconnection performance
        console.log(`Disconnection time for ${MAX_PLAYERS} players: ${disconnectTime.toFixed(2)}ms`);
        expect(disconnectTime).toBeLessThan(500); // Should disconnect all players in less than 500ms
    });

    test('should maintain stable performance with concurrent updates', async () => {
        // Connect all clients
        await Promise.all(clients.map(client => new Promise(resolve => {
            client.initialize();
            client.socket.on('connect', resolve);
        })));

        const startTime = performance.now();

        // Perform concurrent updates
        await Promise.all([
            // Update tasks
            Promise.all(clients.map(client => {
                const taskId = `task-${Math.random()}`;
                const taskData = { status: 'completed' };
                return new Promise(resolve => {
                    client.sendTaskUpdate(taskId, taskData);
                    setTimeout(resolve, 100);
                });
            })),

            // Update scores
            Promise.all(clients.map(client => {
                const points = 10;
                return new Promise(resolve => {
                    client.sendScoreUpdate(points);
                    setTimeout(resolve, 100);
                });
            }))
        ]);

        const endTime = performance.now();
        const updateTime = endTime - startTime;

        // Verify concurrent update performance
        console.log(`Concurrent update time for ${MAX_PLAYERS * 2} operations: ${updateTime.toFixed(2)}ms`);
        expect(updateTime).toBeLessThan(1000); // Should handle concurrent updates in less than 1 second
    });
});
