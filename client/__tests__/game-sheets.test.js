import { gameSheets } from '../../src/services/game-sheets';

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

    describe('loadGameState', () => {
        it('should fetch game state from server', async () => {
            const result = await gameSheets.loadGameState();

            expect(window.fetch).toHaveBeenCalledWith('/api/game-state');
            expect(result).toEqual(mockGameState);
        });

        it('should handle fetch errors', async () => {
            const error = new Error('Network Error');
            window.fetch.mockImplementation(() => Promise.reject(error));

            await expect(gameSheets.loadGameState()).rejects.toThrow('Error loading game state: Network Error');
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

    describe('loadPlayerData', () => {
        it('should fetch player data from server', async () => {
            const result = await gameSheets.loadPlayerData();

            expect(window.fetch).toHaveBeenCalledWith('/api/player-data');
            expect(result).toEqual(mockGameState.players);
        });

        it('should handle fetch errors', async () => {
            const error = new Error('Network Error');
            window.fetch.mockImplementation(() => Promise.reject(error));

            await expect(gameSheets.loadPlayerData()).rejects.toThrow('Error loading player data: Network Error');
        });
    });

    describe('savePlayerData', () => {
        it('should save player data to server', async () => {
            await gameSheets.savePlayerData(mockGameState.players);

            expect(window.fetch).toHaveBeenCalledWith(
                '/api/player-data',
                expect.objectContaining({
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(mockGameState.players)
                })
            );
        });

        it('should handle save errors', async () => {
            const error = new Error('Network Error');
            window.fetch.mockImplementation(() => Promise.reject(error));

            await expect(gameSheets.savePlayerData(mockGameState.players)).rejects.toThrow('Error saving player data: Network Error');
        });
    });
});
