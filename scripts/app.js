/**
 * app.js
 * Main initialization script for Task Tower
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Task Tower Plus initializing...');
    
    // Make sure all modules are loaded
    setTimeout(() => {
        // Initialize UI Controller
        if (window.UIController) {
            window.UIController.init();
            console.log('UI Controller initialized');
        } else {
            console.error('UI Controller module not found');
        }
    }, 100); // Small delay to ensure all scripts are processed
    
    // Initialize local storage if available
    if (window.StorageManager) {
        console.log('Local storage is available');
        
        // Load saved game if exists
        const savedGame = window.StorageManager.loadGame();
        if (savedGame) {
            console.log('Found saved game data');
            // Future: option to continue from saved game
        }
    }
    
    // Check for multiplayer capabilities
    if (typeof MultiplayerManager !== 'undefined') {
        console.log('Multiplayer module loaded. Online mode: ' + MultiplayerManager.isOnline());
    }
    
    console.log('Task Tower Plus initialization complete');
});

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Application error:', event.message);
    // Future: could add error reporting or recovery mechanisms
});
