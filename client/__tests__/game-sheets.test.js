import gameSheets from '../../src/services/game-sheets';

describe('Game Sheets Service', () => {
    const mockGameState = {
        lobbyCode: 'TEST123',
        currentPhase: 'PLANNING',
        currentRound: 1,
        timer: 60,
        playerCount: 4,
        players: [
            {
                id: 'player1',
                name: 'Player 1',
                score: 100,
                tasks: [{ id: 1, description: 'Test task' }],
                towerBlocks: [{ id: 1, type: 'RED' }]
            }
        ]
    };

    const mockTask = {
        id: 2,
        description: 'New task',
        category: 'Personal',
        points: 1,
        completed: false,
        subtasks: []
    };

    const mockSubtask = {
        id: 3,
        text: 'Subtask',
        completed: false
    };

    beforeEach(() => {
        jest.spyOn(window, 'fetch').mockImplementation(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve(mockGameState)
            })
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('fetchGameState', () => {
        it('should fetch game state from server', async () => {
            const result = await gameSheets.fetchGameState();

            expect(window.fetch).toHaveBeenCalledWith('/api/game-state');
            expect(result).toEqual(mockGameState);
        });

        it('should handle fetch errors', async () => {
            const error = new Error('Network Error');
            window.fetch.mockImplementation(() => Promise.reject(error));

            await expect(gameSheets.fetchGameState()).rejects.toThrow('Error fetching game state: Network Error');
        });
    });

    describe('saveGameState', () => {
        it('should save game state to server', async () => {
            await gameSheets.saveGameState(mockGameState);

            expect(window.fetch).toHaveBeenCalledWith(
                '/api/game-state',
                expect.objectContaining({
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(mockGameState)
                })
            );
        });

        it('should handle save errors', async () => {
            const error = new Error('Network Error');
            window.fetch.mockImplementation(() => Promise.reject(error));

            await expect(gameSheets.saveGameState(mockGameState)).rejects.toThrow('Error saving game state: Network Error');
        });
    });

    describe('createLobby', () => {
        it('should create a new lobby', async () => {
            const result = await gameSheets.createLobby();

            expect(window.fetch).toHaveBeenCalledWith('/api/lobby',
                expect.objectContaining({
                    method: 'POST'
                })
            );
            expect(result).toBeTruthy();
        });

        it('should handle creation errors', async () => {
            const error = new Error('Network Error');
            window.fetch.mockImplementation(() => Promise.reject(error));

            await expect(gameSheets.createLobby()).rejects.toThrow('Error creating lobby: Network Error');
        });
    });

    describe('joinLobby', () => {
        it('should join an existing lobby', async () => {
            const result = await gameSheets.joinLobby('TEST123');

            expect(window.fetch).toHaveBeenCalledWith('/api/lobby/TEST123',
                expect.objectContaining({
                    method: 'GET'
                })
            );
            expect(result).toEqual(mockGameState);
        });

        it('should handle join errors', async () => {
            const error = new Error('Network Error');
            window.fetch.mockImplementation(() => Promise.reject(error));

            await expect(gameSheets.joinLobby('TEST123')).rejects.toThrow('Error joining lobby: Network Error');
        });
    });

    describe('addTask', () => {
        it('should add a new task', async () => {
            await gameSheets.addTask('TEST123', 'player1', mockTask);

            expect(window.fetch).toHaveBeenCalledWith(
                '/api/lobby/TEST123/player1/tasks',
                expect.objectContaining({
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(mockTask)
                })
            );
        });

        it('should handle add task errors', async () => {
            const error = new Error('Network Error');
            window.fetch.mockImplementation(() => Promise.reject(error));

            await expect(gameSheets.addTask('TEST123', 'player1', mockTask)).rejects.toThrow('Error adding task: Network Error');
        });
    });

    describe('completeTask', () => {
        it('should complete a task', async () => {
            await gameSheets.completeTask('TEST123', 'player1', 1);

            expect(window.fetch).toHaveBeenCalledWith(
                '/api/lobby/TEST123/player1/tasks/1/complete',
                expect.objectContaining({
                    method: 'POST'
                })
            );
        });

        it('should handle complete task errors', async () => {
            const error = new Error('Network Error');
            window.fetch.mockImplementation(() => Promise.reject(error));

            await expect(gameSheets.completeTask('TEST123', 'player1', 1)).rejects.toThrow('Error completing task: Network Error');
        });
    });

    describe('addSubtask', () => {
        it('should add a new subtask', async () => {
            await gameSheets.addSubtask('TEST123', 'player1', 1, mockSubtask);

            expect(window.fetch).toHaveBeenCalledWith(
                '/api/lobby/TEST123/player1/tasks/1/subtasks',
                expect.objectContaining({
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(mockSubtask)
                })
            );
        });

        it('should handle add subtask errors', async () => {
            const error = new Error('Network Error');
            window.fetch.mockImplementation(() => Promise.reject(error));

            await expect(gameSheets.addSubtask('TEST123', 'player1', 1, mockSubtask)).rejects.toThrow('Error adding subtask: Network Error');
        });
    });

    describe('completeSubtask', () => {
        it('should complete a subtask', async () => {
            await gameSheets.completeSubtask('TEST123', 'player1', 1, 1);

            expect(window.fetch).toHaveBeenCalledWith(
                '/api/lobby/TEST123/player1/tasks/1/subtasks/1/complete',
                expect.objectContaining({
                    method: 'POST'
                })
            );
        });

        it('should handle complete subtask errors', async () => {
            const error = new Error('Network Error');
            window.fetch.mockImplementation(() => Promise.reject(error));

            await expect(gameSheets.completeSubtask('TEST123', 'player1', 1, 1)).rejects.toThrow('Error completing subtask: Network Error');
        });
    });
});
