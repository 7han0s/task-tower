const gameCore = require('../core/game-core.js');
const StorageManager = require('../core/storage-manager.js');

// Initialize game and storage
const game = new gameCore();
const storage = new StorageManager();

// Test data
const testPlayer = {
    id: 1,
    name: 'Test Player',
    score: 100
};

// Add player
console.log('Adding player...');
game.addPlayer(testPlayer);

// Save game state
console.log('Saving game state...');
storage.saveGame(game.getState());

// Load game state
console.log('Loading game state...');
const savedState = storage.loadGame();
console.log('Loaded state:', savedState);

// Create backup
console.log('Creating backup...');
const backupId = storage.backupGame(game.getState());
console.log('Backup created with ID:', backupId);

// Restore from backup
console.log('Restoring from backup...');
const backup = storage.restoreBackup(backupId);
console.log('Restored state:', backup);

// Clear storage
console.log('Clearing storage...');
storage.clearGame();

// Verify storage is empty
const isEmpty = storage.loadGame() === null;
console.log('Storage cleared:', isEmpty);
