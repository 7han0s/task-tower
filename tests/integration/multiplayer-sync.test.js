const { multiplayerManager } = require('../../scripts/core/multiplayer-manager');
const { multiplayerClient } = require('../../scripts/client/multiplayer-client');
const { io } = require('socket.io-client');

describe('Multiplayer Synchronization', () => {
    let server;
    let client1;
    let client2;
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
        // Create two client instances
        client1 = new multiplayerClient();
        client2 = new multiplayerClient();
    });

    afterEach(() => {
        // Clean up clients
        if (client1 && client1.socket) {
            client1.socket.disconnect();
        }
        if (client2 && client2.socket) {
            client2.socket.disconnect();
        }
    });

    afterAll(async () => {
        // Clean up server
        if (mockIO) {
            mockIO.close();
        }
    });

    test('should synchronize player connections', async () => {
        // Connect first client
        await new Promise(resolve => {
            client1.initialize();
            client1.socket.on('connect', resolve);
        });

        // Connect second client
        await new Promise(resolve => {
            client2.initialize();
            client2.socket.on('connect', resolve);
        });

        // Verify both clients are connected
        expect(client1.socket.connected).toBe(true);
        expect(client2.socket.connected).toBe(true);

        // Verify player count is updated
        await new Promise(resolve => {
            client1.socket.on('player-count', (count) => {
                expect(count).toBe(2);
                resolve();
            });
        });
    });

    test('should synchronize task updates', async () => {
        // Connect first client
        await new Promise(resolve => {
            client1.initialize();
            client1.socket.on('connect', resolve);
        });

        // Connect second client
        await new Promise(resolve => {
            client2.initialize();
            client2.socket.on('connect', resolve);
        });

        // Update task on first client
        const taskId = 'test-task';
        const taskData = { status: 'completed' };
        client1.sendTaskUpdate(taskId, taskData);

        // Verify task update is received by second client
        await new Promise(resolve => {
            client2.socket.on('task-update', (taskId, data) => {
                expect(taskId).toBe('test-task');
                expect(data.status).toBe('completed');
                resolve();
            });
        });
    });

    test('should synchronize score updates', async () => {
        // Connect first client
        await new Promise(resolve => {
            client1.initialize();
            client1.socket.on('connect', resolve);
        });

        // Connect second client
        await new Promise(resolve => {
            client2.initialize();
            client2.socket.on('connect', resolve);
        });

        // Update score on first client
        const points = 10;
        client1.sendScoreUpdate(points);

        // Verify score update is received by second client
        await new Promise(resolve => {
            client2.socket.on('score-update', (playerId, score) => {
                expect(playerId).toBe(client1.socket.id);
                expect(score).toBe(10);
                resolve();
            });
        });
    });

    test('should handle player disconnection', async () => {
        // Connect first client
        await new Promise(resolve => {
            client1.initialize();
            client1.socket.on('connect', resolve);
        });

        // Connect second client
        await new Promise(resolve => {
            client2.initialize();
            client2.socket.on('connect', resolve);
        });

        // Disconnect first client
        client1.socket.disconnect();

        // Verify player count is updated
        await new Promise(resolve => {
            client2.socket.on('player-count', (count) => {
                expect(count).toBe(1);
                resolve();
            });
        });
    });
});
