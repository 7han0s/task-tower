// Jest setup file

// Mock console methods for testing
const originalConsole = {
  error: console.error,
  warn: console.warn,
  log: console.log
};

beforeAll(() => {
  // Mock console methods
  console.error = jest.fn();
  console.warn = jest.fn();
  console.log = jest.fn();
});

afterAll(() => {
  // Restore console methods
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.log = originalConsole.log;
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

global.localStorage = localStorageMock;

global.mockGameState = {
  lobbyCode: 'TOWER_TEST',
  currentPhase: 'work',
  currentRound: 1,
  timer: 1500,
  playerCount: 2,
  players: [
    {
      id: 1,
      name: 'Player 1',
      score: 10,
      tasks: [{ id: 1, description: 'Test task', category: 'work' }],
      towerBlocks: [{ id: 1, type: 'basic' }]
    },
    {
      id: 2,
      name: 'Player 2',
      score: 5,
      tasks: [],
      towerBlocks: []
    }
  ]
};
