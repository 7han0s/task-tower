const { multiplayerManager } = require('../../scripts/core/multiplayer-manager');
const { multiplayerClient } = require('../../scripts/client/multiplayer-client');
const { io } = require('socket.io-client');

describe('Real-time Synchronization', () => {
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

    test('should synchronize task updates in real-time', async () => {
        // Connect both clients
        await Promise.all([
            new Promise(resolve => {
                client1.initialize();
                client1.socket.on('connect', resolve);
            }),
            new Promise(resolve => {
                client2.initialize();
                client2.socket.on('connect', resolve);
            })
        ]);

        // Add task on client 1
        const task = {
            description: 'Test Task',
            category: 'work',
            complexity: 'MEDIUM',
            priority: 'HIGH'
        };
        client1.sendTaskUpdate('task-1', task);

        // Verify task received by client 2
        await new Promise(resolve => {
            client2.socket.on('task-update', (taskId, data) => {
                expect(taskId).toBe('task-1');
                expect(data).toEqual(task);
                resolve();
            });
        });

        // Update task on client 1
        const updatedTask = {
            status: 'completed',
            progress: 100
        };
        client1.sendTaskUpdate('task-1', updatedTask);

        // Verify update received by client 2
        await new Promise(resolve => {
            client2.socket.on('task-update', (taskId, data) => {
                expect(taskId).toBe('task-1');
                expect(data.status).toBe('completed');
                expect(data.progress).toBe(100);
                resolve();
            });
        });
    });

    test('should synchronize score updates in real-time', async () => {
        // Connect both clients
        await Promise.all([
            new Promise(resolve => {
                client1.initialize();
                client1.socket.on('connect', resolve);
            }),
            new Promise(resolve => {
                client2.initialize();
                client2.socket.on('connect', resolve);
            })
        ]);

        // Update score on client 1
        const points = 10;
        client1.sendScoreUpdate(points);

        // Verify score update received by client 2
        await new Promise(resolve => {
            client2.socket.on('score-update', (playerId, score) => {
                expect(playerId).toBe(client1.socket.id);
                expect(score).toBe(points);
                resolve();
            });
        });

        // Update score again
        const morePoints = 5;
        client1.sendScoreUpdate(morePoints);

        // Verify cumulative score update
        await new Promise(resolve => {
            client2.socket.on('score-update', (playerId, score) => {
                expect(playerId).toBe(client1.socket.id);
                expect(score).toBe(points + morePoints);
                resolve();
            });
        });
    });

    test('should handle concurrent updates', async () => {
        // Connect both clients
        await Promise.all([
            new Promise(resolve => {
                client1.initialize();
                client1.socket.on('connect', resolve);
            }),
            new Promise(resolve => {
                client2.initialize();
                client2.socket.on('connect', resolve);
            })
        ]);

        // Perform concurrent updates
        const promises = [];
        for (let i = 0; i < 5; i++) {
            promises.push(new Promise(resolve => {
                // Client 1 sends task update
                client1.sendTaskUpdate(`task-${i}`, {
                    description: `Task ${i}`,
                    status: 'completed'
                });

                // Client 2 sends score update
                client2.sendScoreUpdate(i * 10);

                // Verify updates received by both clients
                client1.socket.on('task-update', resolve);
                client1.socket.on('score-update', resolve);
                client2.socket.on('task-update', resolve);
                client2.socket.on('score-update', resolve);
            }));
        }

        await Promise.all(promises);
    });

    test('should handle network latency', async () => {
        // Connect both clients
        await Promise.all([
            new Promise(resolve => {
                client1.initialize();
                client1.socket.on('connect', resolve);
            }),
            new Promise(resolve => {
                client2.initialize();
                client2.socket.on('connect', resolve);
            })
        ]);

        // Simulate network delay
        const delay = 500;
        
        // Client 1 sends task update
        client1.sendTaskUpdate('task-delay', {
            description: 'Delayed Task',
            status: 'in-progress'
        });

        // Verify update received after delay
        await new Promise(resolve => {
            setTimeout(() => {
                client2.socket.on('task-update', (taskId, data) => {
                    expect(taskId).toBe('task-delay');
                    expect(data.status).toBe('in-progress');
                    resolve();
                });
            }, delay);
        });

        // Update task again
        client1.sendTaskUpdate('task-delay', {
            status: 'completed',
            progress: 100
        });

        // Verify update received after delay
        await new Promise(resolve => {
            setTimeout(() => {
                client2.socket.on('task-update', (taskId, data) => {
                    expect(taskId).toBe('task-delay');
                    expect(data.status).toBe('completed');
                    expect(data.progress).toBe(100);
                    resolve();
                });
            }, delay);
        });
    });

    test('should maintain consistent state during disconnections', async () => {
        // Connect both clients
        await Promise.all([
            new Promise(resolve => {
                client1.initialize();
                client1.socket.on('connect', resolve);
            }),
            new Promise(resolve => {
                client2.initialize();
                client2.socket.on('connect', resolve);
            })
        ]);

        // Add task on client 1
        const task = {
            description: 'Test Task',
            category: 'work'
        };
        client1.sendTaskUpdate('task-test', task);

        // Disconnect client 2
        client2.socket.disconnect();

        // Update task on client 1
        client1.sendTaskUpdate('task-test', {
            status: 'completed',
            progress: 100
        });

        // Reconnect client 2
        await new Promise(resolve => {
            client2.initialize();
            client2.socket.on('connect', resolve);
        });

        // Verify task state is consistent
        await new Promise(resolve => {
            client2.socket.on('task-update', (taskId, data) => {
                expect(taskId).toBe('task-test');
                expect(data.status).toBe('completed');
                expect(data.progress).toBe(100);
                resolve();
            });
        });
    });
});
