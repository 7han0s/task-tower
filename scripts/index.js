/**
 * index.js
 * Main entry point for the game
 */

// Core game modules
import { GameCore } from './core/game-core.js';
import { Monitoring } from './core/monitoring.js';

// UI components
import { GameUI } from './ui/game-ui.js';

// Initialize core components
const game = new GameCore();
const monitoring = new Monitoring();
const ui = new GameUI();

// Start game
async function startGame() {
    try {
        // Initialize game
        await game.initialize();
        
        // Initialize UI
        await ui.initialize();
        
        // Start the game loop
        await game.startGame();
    } catch (error) {
        console.error('Error starting game:', error);
        monitoring.handleError(error);
        ui.showError(error.message);
    }
}

// Handle window load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Initialize monitoring
        await monitoring.initializeMetrics();
        
        // Start the game
        await startGame();
    } catch (error) {
        console.error('Error on window load:', error);
        monitoring.handleError(error);
        ui.showError('Failed to initialize game. Please refresh the page.');
    }
});
