/**
 * app.js
 * Main initialization script for Task Tower
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Task Tower Plus initializing...');
    
    // Initialize UI Controller
    try {
        if (window.UIController) {
            window.UIController.init();
            console.log('UI Controller initialized');
        } else {
            console.error('UI Controller module not found');
            return;
        }
    } catch (error) {
        console.error('Error initializing UI Controller:', error);
        return;
    }

    // Initialize local storage if available
    try {
        if (window.StorageManager && window.StorageManager.isAvailable()) {
            console.log('Local storage is available');
            
            // Load saved game if exists
            const savedGame = window.StorageManager.loadGame();
            if (savedGame) {
                console.log('Found saved game data');
                // Future: option to continue from saved game
            }
        }
    } catch (error) {
        console.error('Error initializing storage:', error);
    }

    // Initialize game core
    try {
        if (window.GameCore) {
            console.log('Game Core initialized');
        } else {
            console.error('Game Core module not found');
        }
    } catch (error) {
        console.error('Error initializing Game Core:', error);
    }

    // Check for multiplayer capabilities
    if (typeof window.MultiplayerManager !== 'undefined') {
        console.log('Multiplayer module loaded. Online mode:', window.MultiplayerManager.isOnline());
    }

    console.log('Task Tower Plus initialization complete');
});

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Application error:', event.message);
    // Future: could add error reporting or recovery mechanisms
});
