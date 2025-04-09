const { gameState } = require('../../scripts/core/game-core');
const { performance } = require('perf_hooks');

describe('State Update Performance', () => {
    let testGameState;
    const NUM_PLAYERS = 8;
    const NUM_TASKS = 10;

    beforeEach(() => {
        testGameState = new gameState();
        
        // Add test players
        for (let i = 0; i < NUM_PLAYERS; i++) {
            testGameState.addPlayer(`player-${i}`, `Test Player ${i}`);
        }

        // Add test tasks
        for (let i = 0; i < NUM_TASKS; i++) {
            const task = {
                description: `Task ${i}`,
                category: 'work',
                complexity: 'MEDIUM',
                priority: 'HIGH'
            };
            testGameState.addTask(`player-0`, task);
        }
    });

    test('should update game state efficiently', () => {
        const startTime = performance.now();

        // Perform multiple state updates
        for (let i = 0; i < 100; i++) {
            testGameState.update();
        }

        const endTime = performance.now();
        const updateTime = endTime - startTime;

        console.log(`State update time for 100 iterations: ${updateTime.toFixed(2)}ms`);
        expect(updateTime).toBeLessThan(100); // Should update state in less than 100ms
    });

    test('should handle concurrent state updates', () => {
        const startTime = performance.now();

        // Perform concurrent updates
        const promises = [];
        for (let i = 0; i < NUM_PLAYERS; i++) {
            promises.push(new Promise(resolve => {
                setTimeout(() => {
                    testGameState.update();
                    resolve();
                }, 10);
            }));
        }

        await Promise.all(promises);

        const endTime = performance.now();
        const updateTime = endTime - startTime;

        console.log(`Concurrent state update time: ${updateTime.toFixed(2)}ms`);
        expect(updateTime).toBeLessThan(500); // Should handle concurrent updates in less than 500ms
    });

    test('should maintain stable performance with increasing players', () => {
        const startTime = performance.now();

        // Add more players
        for (let i = NUM_PLAYERS; i < NUM_PLAYERS * 2; i++) {
            testGameState.addPlayer(`player-${i}`, `Test Player ${i}`);
        }

        // Update state
        testGameState.update();

        const endTime = performance.now();
        const updateTime = endTime - startTime;

        console.log(`State update time with ${NUM_PLAYERS * 2} players: ${updateTime.toFixed(2)}ms`);
        expect(updateTime).toBeLessThan(200); // Should handle increased player count in less than 200ms
    });

    test('should handle task updates efficiently', () => {
        const startTime = performance.now();

        // Update all tasks
        for (let i = 0; i < NUM_TASKS; i++) {
            testGameState.updateTask(`task-${i}`, {
                status: 'completed',
                progress: 100
            });
        }

        const endTime = performance.now();
        const updateTime = endTime - startTime;

        console.log(`Task update time for ${NUM_TASKS} tasks: ${updateTime.toFixed(2)}ms`);
        expect(updateTime).toBeLessThan(50); // Should update tasks in less than 50ms
    });

    test('should handle score updates efficiently', () => {
        const startTime = performance.now();

        // Update scores for all players
        for (let i = 0; i < NUM_PLAYERS; i++) {
            testGameState.updateScore(`player-${i}`, 10);
        }

        const endTime = performance.now();
        const updateTime = endTime - startTime;

        console.log(`Score update time for ${NUM_PLAYERS} players: ${updateTime.toFixed(2)}ms`);
        expect(updateTime).toBeLessThan(30); // Should update scores in less than 30ms
    });
});
