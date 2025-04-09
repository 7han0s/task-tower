/**
 * index.js
 * Main entry point for the Task Tower game
 */

// Core game modules
import { GameCore } from './core/game-core.js';
import { Monitoring } from './core/monitoring.js';

// UI components
import { TaskUI } from './ui/task-ui.js';
import { PlayerUI } from './ui/player-ui.js';

// Multiplayer features
import { MultiplayerManager } from './multiplayer/multiplayer-manager.js';

// Initialize components
const initializeGame = () => {
    try {
        // Initialize core game
        GameCore.initializeGame();

        // Initialize UI components
        TaskUI.init();
        PlayerUI.init();

        // Initialize multiplayer features
        MultiplayerManager.init();

        // Start game
        GameCore.startGame();

        console.log('Task Tower initialized successfully');
    } catch (error) {
        console.error('Error initializing game:', error);
        alert('Error initializing game: ' + error.message);
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeGame);
