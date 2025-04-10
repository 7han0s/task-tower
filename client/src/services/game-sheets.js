/**
 * game-sheets.js
 * Handles game state synchronization with server
 */

import axios from 'axios';

const API_URL = 'http://localhost:3001/api/game-state';

const gameSheets = {
    /**
     * Load game state from server
     * @param {string} lobbyCode - Lobby code to fetch game state for
     * @returns {Promise<Object>} Game state data
     */
    async fetchGameState(lobbyCode = null) {
        try {
            const params = lobbyCode ? { lobbyCode } : {};
            const response = await axios.get(API_URL, { params });
            return response.data;
        } catch (error) {
            console.error('Error fetching game state:', error);
            throw error;
        }
    },

    /**
     * Save game state to server
     * @param {Object} gameState - The game state to save
     * @param {string} mode - Mode to save game state in
     * @param {string} lobbyCode - Lobby code to save game state for
     * @returns {Promise<void>}
     */
    async saveGameState(gameState, mode, lobbyCode = null) {
        try {
            const response = await axios.post(API_URL, {
                gameState,
                mode,
                lobbyCode
            });
            return response.data;
        } catch (error) {
            console.error('Error saving game state:', error);
            throw error;
        }
    },

    /**
     * Create a new lobby
     * @returns {Promise<string>} Lobby code
     */
    async createLobby() {
        try {
            const response = await axios.post(`${API_URL}/create-lobby`);
            return response.data.lobbyCode;
        } catch (error) {
            console.error('Error creating lobby:', error);
            throw error;
        }
    },

    /**
     * Join a lobby
     * @param {string} lobbyCode - Lobby code to join
     * @returns {Promise<Object>} Lobby data
     */
    async joinLobby(lobbyCode) {
        try {
            const response = await axios.get(`${API_URL}/join-lobby`, {
                params: { lobbyCode }
            });
            return response.data;
        } catch (error) {
            console.error('Error joining lobby:', error);
            throw error;
        }
    },

    /**
     * Update a player in a lobby
     * @param {string} lobbyCode - Lobby code to update player in
     * @param {string} playerId - Player ID to update
     * @param {Object} updates - Updates to apply to player
     * @returns {Promise<Object>} Updated player data
     */
    async updatePlayer(lobbyCode, playerId, updates) {
        try {
            const response = await axios.put(`${API_URL}/update-player`, {
                lobbyCode,
                playerId,
                updates
            });
            return response.data;
        } catch (error) {
            console.error('Error updating player:', error);
            throw error;
        }
    },

    /**
     * Add a task to a player in a lobby
     * @param {string} lobbyCode - Lobby code to add task to
     * @param {string} playerId - Player ID to add task to
     * @param {Object} task - Task to add
     * @returns {Promise<Object>} Added task data
     */
    async addTask(lobbyCode, playerId, task) {
        try {
            const response = await axios.post(`${API_URL}/add-task`, {
                lobbyCode,
                playerId,
                task
            });
            return response.data;
        } catch (error) {
            console.error('Error adding task:', error);
            throw error;
        }
    },

    /**
     * Complete a task for a player in a lobby
     * @param {string} lobbyCode - Lobby code to complete task in
     * @param {string} playerId - Player ID to complete task for
     * @param {string} taskId - Task ID to complete
     * @returns {Promise<Object>} Completed task data
     */
    async completeTask(lobbyCode, playerId, taskId) {
        try {
            const response = await axios.put(`${API_URL}/complete-task`, {
                lobbyCode,
                playerId,
                taskId
            });
            return response.data;
        } catch (error) {
            console.error('Error completing task:', error);
            throw error;
        }
    },

    /**
     * Add a subtask to a task for a player in a lobby
     * @param {string} lobbyCode - Lobby code to add subtask to
     * @param {string} playerId - Player ID to add subtask to
     * @param {string} taskId - Task ID to add subtask to
     * @param {Object} subtask - Subtask to add
     * @returns {Promise<Object>} Added subtask data
     */
    async addSubtask(lobbyCode, playerId, taskId, subtask) {
        try {
            const response = await axios.post(`${API_URL}/add-subtask`, {
                lobbyCode,
                playerId,
                taskId,
                subtask
            });
            return response.data;
        } catch (error) {
            console.error('Error adding subtask:', error);
            throw error;
        }
    },

    /**
     * Complete a subtask for a task for a player in a lobby
     * @param {string} lobbyCode - Lobby code to complete subtask in
     * @param {string} playerId - Player ID to complete subtask for
     * @param {string} taskId - Task ID to complete subtask for
     * @param {string} subtaskId - Subtask ID to complete
     * @returns {Promise<Object>} Completed subtask data
     */
    async completeSubtask(lobbyCode, playerId, taskId, subtaskId) {
        try {
            const response = await axios.put(`${API_URL}/complete-subtask`, {
                lobbyCode,
                playerId,
                taskId,
                subtaskId
            });
            return response.data;
        } catch (error) {
            console.error('Error completing subtask:', error);
            throw error;
        }
    },

    /**
     * Update a task for a player in a lobby
     * @param {string} lobbyCode - Lobby code to update task in
     * @param {string} playerId - Player ID to update task for
     * @param {string} taskId - Task ID to update
     * @param {Object} updates - Updates to apply to task
     * @returns {Promise<Object>} Updated task data
     */
    async updateTask(lobbyCode, playerId, taskId, updates) {
        try {
            const response = await axios.put(`${API_URL}/update-task`, {
                lobbyCode,
                playerId,
                taskId,
                updates
            });
            return response.data;
        } catch (error) {
            console.error('Error updating task:', error);
            throw error;
        }
    },

    /**
     * Update a subtask for a task for a player in a lobby
     * @param {string} lobbyCode - Lobby code to update subtask in
     * @param {string} playerId - Player ID to update subtask for
     * @param {string} taskId - Task ID to update subtask for
     * @param {string} subtaskId - Subtask ID to update
     * @param {Object} updates - Updates to apply to subtask
     * @returns {Promise<Object>} Updated subtask data
     */
    async updateSubtask(lobbyCode, playerId, taskId, subtaskId, updates) {
        try {
            const response = await axios.put(`${API_URL}/update-subtask`, {
                lobbyCode,
                playerId,
                taskId,
                subtaskId,
                updates
            });
            return response.data;
        } catch (error) {
            console.error('Error updating subtask:', error);
            throw error;
        }
    },

    /**
     * Get the status of a lobby
     * @param {string} lobbyCode - Lobby code to get status for
     * @returns {Promise<Object>} Lobby status data
     */
    async getLobbyStatus(lobbyCode) {
        try {
            const response = await axios.get(`${API_URL}/status`, {
                params: { lobbyCode }
            });
            return response.data;
        } catch (error) {
            console.error('Error getting lobby status:', error);
            throw error;
        }
    },

    /**
     * Update the settings of a lobby
     * @param {string} lobbyCode - Lobby code to update settings for
     * @param {Object} settings - Settings to update
     * @returns {Promise<Object>} Updated lobby settings data
     */
    async updateLobbySettings(lobbyCode, settings) {
        try {
            const response = await axios.put(`${API_URL}/settings`, {
                lobbyCode,
                settings
            });
            return response.data;
        } catch (error) {
            console.error('Error updating lobby settings:', error);
            throw error;
        }
    },

    /**
     * Validate lobby code
     * @param {string} lobbyCode - Lobby code to validate
     * @returns {Promise<boolean>} Whether the lobby code is valid
     */
    async validateLobbyCode(lobbyCode) {
        try {
            const response = await axios.get(`${API_URL}/validate-lobby-code`, {
                params: { lobbyCode }
            });
            return response.data.isValid;
        } catch (error) {
            console.error('Error validating lobby code:', error);
            throw error;
        }
    },

    /**
     * Get the game state for a lobby
     * @param {string} lobbyCode - Lobby code to get game state for
     * @returns {Promise<Object>} Game state data
     */
    async getGameStateForLobby(lobbyCode) {
        try {
            const response = await axios.get(`${API_URL}/game-state-for-lobby`, {
                params: { lobbyCode }
            });
            return response.data;
        } catch (error) {
            console.error('Error getting game state for lobby:', error);
            throw error;
        }
    }
};

export default gameSheets;
