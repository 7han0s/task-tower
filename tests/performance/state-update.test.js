import { gameCore } from '../../scripts/core/game-core.js';
import { TaskManager } from '../../scripts/core/task-manager.js';
import { TaskComplexity } from '../../scripts/core/task-complexity.js';
import { performance } from 'perf_hooks';

describe('State Update Performance', () => {
    let taskManager;
    let players;
    let tasks;

    beforeEach(() => {
        taskManager = new TaskManager();
        players = Array(10).fill().map((_, i) => ({
            id: i + 1,
            name: `Player ${i + 1}`,
            score: 0
        }));

        tasks = Array(50).fill().map((_, i) => ({
            id: i + 1,
            description: `Task ${i + 1}`,
            category: 'work',
            complexity: TaskComplexity.MODERATE,
            points: 3
        }));
    });

    test('should update state efficiently with multiple players and tasks', async () => {
        try {
            // Add all players and tasks
            const startTime = performance.now();
            
            // Add players
            players.forEach(player => {
                gameCore.addPlayer(player);
            });

            // Add tasks for each player
            players.forEach(player => {
                tasks.forEach(task => {
                    taskManager.addTask({
                        ...task,
                        playerId: player.id,
                        status: 'pending'
                    });
                });
            });

            const endTime = performance.now();
            const updateTime = endTime - startTime;

            // Log performance metrics
            console.log(`State update time: ${updateTime}ms`);
            console.log(`Players processed: ${players.length}`);
            console.log(`Tasks processed: ${tasks.length * players.length}`);

            // Verify state
            expect(gameCore.currentPlayerCount).toBe(players.length);
            expect(taskManager.getTasks().length).toBe(tasks.length * players.length);
        } catch (error) {
            console.error('Error updating state:', error);
            throw error;
        }
    });

    test('should handle state updates with complex tasks', async () => {
        try {
            // Add complex tasks
            const complexTasks = Array(20).fill().map((_, i) => ({
                id: i + 1,
                description: `Complex Task ${i + 1}`,
                category: 'work',
                complexity: TaskComplexity.VERY_COMPLEX,
                points: 5,
                subtasks: Array(5).fill().map((_, j) => ({
                    id: `${i + 1}-${j + 1}`,
                    description: `Subtask ${j + 1}`,
                    status: 'pending'
                }))
            }));

            const startTime = performance.now();
            
            // Add players and complex tasks
            players.forEach(player => {
                complexTasks.forEach(task => {
                    taskManager.addTask({
                        ...task,
                        playerId: player.id,
                        status: 'pending'
                    });
                });
            });

            const endTime = performance.now();
            const updateTime = endTime - startTime;

            // Log performance metrics
            console.log(`Complex state update time: ${updateTime}ms`);
            console.log(`Players processed: ${players.length}`);
            console.log(`Complex tasks processed: ${complexTasks.length * players.length}`);
            console.log(`Total subtasks: ${complexTasks.length * players.length * 5}`);

            // Verify state
            expect(gameCore.currentPlayerCount).toBe(players.length);
            expect(taskManager.getTasks().length).toBe(complexTasks.length * players.length);
        } catch (error) {
            console.error('Error updating state with complex tasks:', error);
            throw error;
        }
    });

    test('should update game state efficiently', async () => {
        try {
            const startTime = performance.now();

            // Perform multiple state updates
            for (let i = 0; i < 100; i++) {
                gameCore.update();
            }

            const endTime = performance.now();
            const updateTime = endTime - startTime;

            console.log(`State update time for 100 iterations: ${updateTime.toFixed(2)}ms`);
            expect(updateTime).toBeLessThan(100); // Should update state in less than 100ms
        } catch (error) {
            console.error('Error updating game state:', error);
            throw error;
        }
    });

    test('should handle concurrent state updates', async () => {
        try {
            const startTime = performance.now();

            // Perform concurrent updates
            const promises = [];
            for (let i = 0; i < 8; i++) {
                promises.push(new Promise(resolve => {
                    setTimeout(() => {
                        gameCore.update();
                        resolve();
                    }, 10);
                }));
            }

            await Promise.all(promises);

            const endTime = performance.now();
            const updateTime = endTime - startTime;

            console.log(`Concurrent state update time: ${updateTime.toFixed(2)}ms`);
            expect(updateTime).toBeLessThan(500); // Should handle concurrent updates in less than 500ms
        } catch (error) {
            console.error('Error handling concurrent state updates:', error);
            throw error;
        }
    });

    test('should maintain stable performance with increasing players', async () => {
        try {
            const startTime = performance.now();

            // Add more players
            for (let i = 8; i < 16; i++) {
                gameCore.addPlayer({
                    id: i + 1,
                    name: `Test Player ${i + 1}`,
                    score: 0
                });
            }

            // Update state
            gameCore.update();

            const endTime = performance.now();
            const updateTime = endTime - startTime;

            console.log(`State update time with 16 players: ${updateTime.toFixed(2)}ms`);
            expect(updateTime).toBeLessThan(200); // Should handle increased player count in less than 200ms
        } catch (error) {
            console.error('Error maintaining stable performance with increasing players:', error);
            throw error;
        }
    });

    test('should handle task updates efficiently', async () => {
        try {
            const startTime = performance.now();

            // Update all tasks
            for (let i = 0; i < 10; i++) {
                gameCore.updateTask(`task-${i}`, {
                    status: 'completed',
                    progress: 100
                });
            }

            const endTime = performance.now();
            const updateTime = endTime - startTime;

            console.log(`Task update time for 10 tasks: ${updateTime.toFixed(2)}ms`);
            expect(updateTime).toBeLessThan(50); // Should update tasks in less than 50ms
        } catch (error) {
            console.error('Error handling task updates:', error);
            throw error;
        }
    });

    test('should handle score updates efficiently', async () => {
        try {
            const startTime = performance.now();

            // Update scores for all players
            for (let i = 0; i < 8; i++) {
                gameCore.updateScore(`player-${i}`, 10);
            }

            const endTime = performance.now();
            const updateTime = endTime - startTime;

            console.log(`Score update time for 8 players: ${updateTime.toFixed(2)}ms`);
            expect(updateTime).toBeLessThan(30); // Should update scores in less than 30ms
        } catch (error) {
            console.error('Error handling score updates:', error);
            throw error;
        }
    });
});
