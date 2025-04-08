/**
 * storage.js
 * Handles local storage and persistence for Task Tower
 */

const StorageManager = (function() {
    const STORAGE_KEY = 'taskTowerGame';
    
    // Check if localStorage is available
    function isAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }
    
    // Public API
    return {
        isAvailable: isAvailable,
        
        saveGame: function(gameState) {
            if (!isAvailable()) return false;
            
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
                return true;
            } catch (e) {
                console.error('Failed to save game:', e);
                return false;
            }
        },
        
        loadGame: function() {
            if (!isAvailable()) return null;
            
            try {
                const savedState = localStorage.getItem(STORAGE_KEY);
                return savedState ? JSON.parse(savedState) : null;
            } catch (e) {
                console.error('Failed to load game:', e);
                return null;
            }
        },
        
        clearSaved: function() {
            if (!isAvailable()) return false;
            
            try {
                localStorage.removeItem(STORAGE_KEY);
                return true;
            } catch (e) {
                console.error('Failed to clear saved game:', e);
                return false;
            }
        }
    };
})();

// Export to window scope
window.StorageManager = StorageManager;
