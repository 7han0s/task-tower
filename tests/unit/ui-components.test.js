const { PlayerList } = require('../../scripts/ui/components/player-list');
const { TaskList } = require('../../scripts/ui/components/task-list');
const { ConnectionStatus } = require('../../scripts/ui/components/connection-status');
const { PlayerCount } = require('../../scripts/ui/components/player-count');

describe('UI Components', () => {
    let container;
    
    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
        container = null;
    });

    describe('Player List', () => {
        let playerList;

        beforeEach(() => {
            playerList = new PlayerList(container);
        });

        test('should render player list correctly', () => {
            const players = [
                { id: 'player-1', name: 'Player 1', score: 100 },
                { id: 'player-2', name: 'Player 2', score: 150 }
            ];

            playerList.updatePlayers(players);

            const playerItems = container.querySelectorAll('.player-item');
            expect(playerItems.length).toBe(2);

            const firstPlayer = playerItems[0];
            expect(firstPlayer.textContent).toContain('Player 1');
            expect(firstPlayer.textContent).toContain('100');

            const secondPlayer = playerItems[1];
            expect(secondPlayer.textContent).toContain('Player 2');
            expect(secondPlayer.textContent).toContain('150');
        });

        test('should update player scores correctly', () => {
            const players = [
                { id: 'player-1', name: 'Player 1', score: 100 }
            ];

            playerList.updatePlayers(players);
            
            // Update score
            playerList.updateScore('player-1', 150);

            const playerItem = container.querySelector('.player-item');
            expect(playerItem.textContent).toContain('150');
        });

        test('should handle player disconnection', () => {
            const players = [
                { id: 'player-1', name: 'Player 1', score: 100, isConnected: true }
            ];

            playerList.updatePlayers(players);
            
            // Disconnect player
            playerList.updatePlayer('player-1', { isConnected: false });

            const playerItem = container.querySelector('.player-item');
            expect(playerItem.classList.contains('disconnected')).toBe(true);
        });
    });

    describe('Task List', () => {
        let taskList;

        beforeEach(() => {
            taskList = new TaskList(container);
        });

        test('should render task list correctly', () => {
            const tasks = [
                { id: 'task-1', description: 'Task 1', progress: 50 },
                { id: 'task-2', description: 'Task 2', progress: 75 }
            ];

            taskList.updateTasks(tasks);

            const taskItems = container.querySelectorAll('.task-item');
            expect(taskItems.length).toBe(2);

            const firstTask = taskItems[0];
            expect(firstTask.textContent).toContain('Task 1');
            const progress = firstTask.querySelector('.progress-bar');
            expect(progress.style.width).toBe('50%');

            const secondTask = taskItems[1];
            expect(secondTask.textContent).toContain('Task 2');
            const progress2 = secondTask.querySelector('.progress-bar');
            expect(progress2.style.width).toBe('75%');
        });

        test('should update task progress correctly', () => {
            const tasks = [
                { id: 'task-1', description: 'Task 1', progress: 50 }
            ];

            taskList.updateTasks(tasks);
            
            // Update progress
            taskList.updateTask('task-1', { progress: 100 });

            const taskItem = container.querySelector('.task-item');
            const progress = taskItem.querySelector('.progress-bar');
            expect(progress.style.width).toBe('100%');
        });

        test('should handle task completion', () => {
            const tasks = [
                { id: 'task-1', description: 'Task 1', progress: 0 }
            ];

            taskList.updateTasks(tasks);
            
            // Complete task
            taskList.updateTask('task-1', { status: 'completed', progress: 100 });

            const taskItem = container.querySelector('.task-item');
            expect(taskItem.classList.contains('completed')).toBe(true);
        });
    });

    describe('Connection Status', () => {
        let connectionStatus;

        beforeEach(() => {
            connectionStatus = new ConnectionStatus(container);
        });

        test('should display connection status correctly', () => {
            connectionStatus.updateStatus(true);
            expect(container.querySelector('.status').textContent).toBe('Connected');

            connectionStatus.updateStatus(false);
            expect(container.querySelector('.status').textContent).toBe('Disconnected');
        });

        test('should show connection error', () => {
            connectionStatus.showError('Connection failed');
            const error = container.querySelector('.error');
            expect(error.textContent).toBe('Connection failed');
            expect(error.classList.contains('visible')).toBe(true);
        });
    });

    describe('Player Count', () => {
        let playerCount;

        beforeEach(() => {
            playerCount = new PlayerCount(container);
        });

        test('should display player count correctly', () => {
            playerCount.updateCount(3);
            expect(container.querySelector('.count').textContent).toBe('3');

            playerCount.updateCount(5);
            expect(container.querySelector('.count').textContent).toBe('5');
        });

        test('should show max player limit', () => {
            playerCount.updateCount(8, true);
            const limit = container.querySelector('.limit');
            expect(limit.textContent).toBe('Max Players: 8');
            expect(limit.classList.contains('visible')).toBe(true);
        });
    });
});
