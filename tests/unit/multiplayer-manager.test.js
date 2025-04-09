const { multiplayerManager } = require('../../scripts/core/multiplayer-manager');
const { io } = require('socket.io-client');

describe('Multiplayer Manager', () => {
    let mockSocket;
    let mockIO;

    beforeEach(() => {
        // Mock socket.io
        mockSocket = {
            on: jest.fn(),
            emit: jest.fn(),
            connect: jest.fn(),
            disconnect: jest.fn()
        };

        mockIO = {
            on: jest.fn(),
            connect: jest.fn(() => mockSocket)
        };

        // Mock the multiplayer manager
        multiplayerManager.initialize(mockIO);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should initialize with socket.io', () => {
        expect(mockIO.on).toHaveBeenCalledWith('connection', expect.any(Function));
    });

    test('should handle player connection', () => {
        const mockPlayerData = { name: 'Test Player' };
        
        mockSocket.emit('player-connect', mockPlayerData);
        
        expect(mockSocket.on).toHaveBeenCalledWith('player-connect', expect.any(Function));
    });

    test('should handle player disconnection', () => {
        const mockPlayerId = 'test-player-id';
        
        mockSocket.emit('disconnect');
        
        expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    });

    test('should handle task updates', () => {
        const mockTaskId = 'test-task-id';
        const mockTaskData = { status: 'completed' };
        
        mockSocket.emit('task-update', mockTaskId, mockTaskData);
        
        expect(mockSocket.on).toHaveBeenCalledWith('task-update', expect.any(Function));
    });

    test('should handle score updates', () => {
        const mockPoints = 10;
        
        mockSocket.emit('score-update', mockPoints);
        
        expect(mockSocket.on).toHaveBeenCalledWith('score-update', expect.any(Function));
    });
});
