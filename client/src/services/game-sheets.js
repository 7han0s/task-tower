/**
 * game-sheets.js
 * Handles game state synchronization with server
 */

class GameSheets {
    constructor() {
        this.spreadsheetId = process.env.REACT_APP_GOOGLE_SPREADSHEET_ID;
    }

    /**
     * Load game state from server
     * @returns {Promise<Object>} Game state data
     */
    async loadGameState() {
        try {
            const response = await fetch('/api/game-state');
            if (!response.ok) {
                throw new Error('Failed to load game state');
            }
            return await response.json();
        } catch (error) {
            console.error('Error loading game state:', error);
            throw error;
        }
    }

    /**
     * Save game state to server
     * @param {Object} gameState - The game state to save
     * @returns {Promise<void>}
     */
    async saveGameState(gameState) {
        try {
            const response = await fetch('/api/game-state', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(gameState)
            });

            if (!response.ok) {
                throw new Error('Failed to save game state');
            }
        } catch (error) {
            console.error('Error saving game state:', error);
            throw error;
        }
    }

    /**
     * Load player data from server
     * @returns {Promise<Array<Object>>} Array of player data
     */
    async loadPlayerData() {
        try {
            const response = await fetch('/api/player-data');
            if (!response.ok) {
                throw new Error('Failed to load player data');
            }
            return await response.json();
        } catch (error) {
            console.error('Error loading player data:', error);
            throw error;
        }
    }

    /**
     * Save player data to server
     * @param {Array<Object>} playerData - Array of player data to save
     * @returns {Promise<void>}
     */
    async savePlayerData(playerData) {
        try {
            const response = await fetch('/api/player-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(playerData)
            });

            if (!response.ok) {
                throw new Error('Failed to save player data');
            }
        } catch (error) {
            console.error('Error saving player data:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const gameSheets = new GameSheets();
