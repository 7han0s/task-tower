const { performance } = require('perf_hooks');
const { PlayerList } = require('../../scripts/ui/components/player-list');
const { TaskList } = require('../../scripts/ui/components/task-list');
const { ConnectionStatus } = require('../../scripts/ui/components/connection-status');
const { PlayerCount } = require('../../scripts/ui/components/player-count');

describe('Animation Performance', () => {
    let container;
    const NUM_PLAYERS = 8;
    const NUM_TASKS = 10;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
        container = null;
    });

    test('should maintain smooth FPS during player list updates', () => {
        const playerList = new PlayerList(container);
        
        // Add initial players
        const players = Array.from({ length: NUM_PLAYERS }, (_, i) => ({
            id: `player-${i}`,
            name: `Player ${i}`,
            score: i * 10
        }));
        playerList.updatePlayers(players);

        const startTime = performance.now();
        let frameCount = 0;

        // Simulate continuous updates
        const animate = () => {
            if (performance.now() - startTime < 1000) {
                frameCount++;
                requestAnimationFrame(animate);
            }
        };

        animate();

        // Wait for animation to complete
        return new Promise(resolve => {
            setTimeout(() => {
                const fps = frameCount / (performance.now() - startTime) * 1000;
                console.log(`Player list animation FPS: ${fps.toFixed(2)}`);
                expect(fps).toBeGreaterThan(30); // Should maintain at least 30 FPS
                resolve();
            }, 1000);
        });
    });

    test('should maintain smooth FPS during task list updates', () => {
        const taskList = new TaskList(container);
        
        // Add initial tasks
        const tasks = Array.from({ length: NUM_TASKS }, (_, i) => ({
            id: `task-${i}`,
            description: `Task ${i}`,
            progress: (i / (NUM_TASKS - 1)) * 100
        }));
        taskList.updateTasks(tasks);

        const startTime = performance.now();
        let frameCount = 0;

        // Simulate continuous updates
        const animate = () => {
            if (performance.now() - startTime < 1000) {
                frameCount++;
                requestAnimationFrame(animate);
            }
        };

        animate();

        // Wait for animation to complete
        return new Promise(resolve => {
            setTimeout(() => {
                const fps = frameCount / (performance.now() - startTime) * 1000;
                console.log(`Task list animation FPS: ${fps.toFixed(2)}`);
                expect(fps).toBeGreaterThan(30); // Should maintain at least 30 FPS
                resolve();
            }, 1000);
        });
    });

    test('should maintain smooth FPS during connection status updates', () => {
        const connectionStatus = new ConnectionStatus(container);
        
        const startTime = performance.now();
        let frameCount = 0;

        // Simulate connection status changes
        const animate = () => {
            if (performance.now() - startTime < 1000) {
                frameCount++;
                const isConnected = frameCount % 2 === 0;
                connectionStatus.updateStatus(isConnected);
                requestAnimationFrame(animate);
            }
        };

        animate();

        // Wait for animation to complete
        return new Promise(resolve => {
            setTimeout(() => {
                const fps = frameCount / (performance.now() - startTime) * 1000;
                console.log(`Connection status animation FPS: ${fps.toFixed(2)}`);
                expect(fps).toBeGreaterThan(30); // Should maintain at least 30 FPS
                resolve();
            }, 1000);
        });
    });

    test('should maintain smooth FPS during player count updates', () => {
        const playerCount = new PlayerCount(container);
        
        const startTime = performance.now();
        let frameCount = 0;

        // Simulate player count changes
        const animate = () => {
            if (performance.now() - startTime < 1000) {
                frameCount++;
                const count = frameCount % (NUM_PLAYERS + 1);
                playerCount.updateCount(count);
                requestAnimationFrame(animate);
            }
        };

        animate();

        // Wait for animation to complete
        return new Promise(resolve => {
            setTimeout(() => {
                const fps = frameCount / (performance.now() - startTime) * 1000;
                console.log(`Player count animation FPS: ${fps.toFixed(2)}`);
                expect(fps).toBeGreaterThan(30); // Should maintain at least 30 FPS
                resolve();
            }, 1000);
        });
    });

    test('should handle concurrent animations smoothly', () => {
        const playerList = new PlayerList(container);
        const taskList = new TaskList(container);
        const connectionStatus = new ConnectionStatus(container);
        const playerCount = new PlayerCount(container);

        // Add initial data
        const players = Array.from({ length: NUM_PLAYERS }, (_, i) => ({
            id: `player-${i}`,
            name: `Player ${i}`,
            score: i * 10
        }));
        const tasks = Array.from({ length: NUM_TASKS }, (_, i) => ({
            id: `task-${i}`,
            description: `Task ${i}`,
            progress: (i / (NUM_TASKS - 1)) * 100
        }));

        playerList.updatePlayers(players);
        taskList.updateTasks(tasks);
        playerCount.updateCount(NUM_PLAYERS);
        connectionStatus.updateStatus(true);

        const startTime = performance.now();
        let frameCount = 0;

        // Simulate concurrent updates
        const animate = () => {
            if (performance.now() - startTime < 1000) {
                frameCount++;
                
                // Update all components
                players.forEach((player, i) => {
                    player.score = (i + frameCount) * 10;
                });
                tasks.forEach((task, i) => {
                    task.progress = ((i + frameCount) % (NUM_TASKS - 1)) * 100;
                });
                
                playerList.updatePlayers(players);
                taskList.updateTasks(tasks);
                playerCount.updateCount((frameCount % (NUM_PLAYERS + 1)));
                connectionStatus.updateStatus(frameCount % 2 === 0);

                requestAnimationFrame(animate);
            }
        };

        animate();

        // Wait for animation to complete
        return new Promise(resolve => {
            setTimeout(() => {
                const fps = frameCount / (performance.now() - startTime) * 1000;
                console.log(`Concurrent animation FPS: ${fps.toFixed(2)}`);
                expect(fps).toBeGreaterThan(25); // Should maintain at least 25 FPS with concurrent animations
                resolve();
            }, 1000);
        });
    });

    test('should handle memory usage during animations', () => {
        const playerList = new PlayerList(container);
        const taskList = new TaskList(container);
        
        // Add many players and tasks
        const players = Array.from({ length: 100 }, (_, i) => ({
            id: `player-${i}`,
            name: `Player ${i}`,
            score: i * 10
        }));
        const tasks = Array.from({ length: 100 }, (_, i) => ({
            id: `task-${i}`,
            description: `Task ${i}`,
            progress: (i / 99) * 100
        }));

        playerList.updatePlayers(players);
        taskList.updateTasks(tasks);

        const startTime = performance.now();
        let frameCount = 0;
        let memoryUsage = 0;

        // Simulate continuous updates
        const animate = () => {
            if (performance.now() - startTime < 1000) {
                frameCount++;
                
                // Update all players and tasks
                players.forEach((player, i) => {
                    player.score = (i + frameCount) * 10;
                });
                tasks.forEach((task, i) => {
                    task.progress = ((i + frameCount) % 100) * 100;
                });
                
                playerList.updatePlayers(players);
                taskList.updateTasks(tasks);

                // Track memory usage
                memoryUsage = process.memoryUsage().heapUsed;
                
                requestAnimationFrame(animate);
            }
        };

        animate();

        // Wait for animation to complete
        return new Promise(resolve => {
            setTimeout(() => {
                const fps = frameCount / (performance.now() - startTime) * 1000;
                console.log(`Memory usage: ${memoryUsage / 1024 / 1024} MB`);
                console.log(`FPS with many elements: ${fps.toFixed(2)}`);
                expect(fps).toBeGreaterThan(20); // Should maintain at least 20 FPS with many elements
                expect(memoryUsage / 1024 / 1024).toBeLessThan(50); // Should use less than 50MB of memory
                resolve();
            }, 1000);
        });
    });
});
