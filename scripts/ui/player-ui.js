/**
 * player-ui.js
 * Handles UI rendering and interactions for players
 */

import { GameCore } from '../core/game-core.js';
import { MultiplayerManager } from '../multiplayer/multiplayer-manager.js';

const PlayerUI = {
    /**
     * Initialize player UI
     */
    init() {
        this.setupEventListeners();
        this.renderPlayerList();
    },

    /**
     * Set up event listeners for player interactions
     */
    setupEventListeners() {
        // Handle player name changes
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('player-name-input')) {
                this.handlePlayerNameChange(e.target);
            }
        });

        // Handle player color changes
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('player-color-input')) {
                this.handlePlayerColorChange(e.target);
            }
        });
    },

    /**
     * Handle player name change
     * @param {HTMLElement} input - The name input element
     */
    handlePlayerNameChange(input) {
        const playerId = input.closest('.player-card').dataset.playerId;
        const newName = input.value.trim();

        if (newName) {
            try {
                // Update player name
                GameCore.updatePlayerName(playerId, newName);
                
                // Send real-time update
                window.realTime.emit('playerNameChanged', {
                    playerId,
                    name: newName
                });
            } catch (error) {
                console.error('Error changing player name:', error);
                alert('Error changing player name: ' + error.message);
            }
        }
    },

    /**
     * Handle player color change
     * @param {HTMLElement} input - The color input element
     */
    handlePlayerColorChange(input) {
        const playerId = input.closest('.player-card').dataset.playerId;
        const newColor = input.value;

        try {
            // Update player color
            GameCore.updatePlayerColor(playerId, newColor);
            
            // Send real-time update
            window.realTime.emit('playerColorChanged', {
                playerId,
                color: newColor
            });

            // Update UI
            this.updatePlayerColor(playerId, newColor);
        } catch (error) {
            console.error('Error changing player color:', error);
            alert('Error changing player color: ' + error.message);
        }
    },

    /**
     * Render player list
     */
    renderPlayerList() {
        const playerList = document.getElementById('player-list');
        if (!playerList) return;

        // Clear existing players
        const playerGrid = playerList.querySelector('.player-grid');
        if (playerGrid) {
            playerGrid.innerHTML = '';
        }

        // Create player elements
        GameCore.players.forEach(player => {
            const playerElement = this.createPlayerElement(player);
            playerGrid.appendChild(playerElement);
        });

        // Show player list
        playerList.classList.remove('hidden');
    },

    /**
     * Create player element
     * @param {object} player - The player data
     * @returns {HTMLElement} - The player UI element
     */
    createPlayerElement(player) {
        const template = document.getElementById('player-template');
        const clone = template.content.cloneNode(true);

        // Set player data attributes
        const playerElement = clone.querySelector('.player-card');
        playerElement.dataset.playerId = player.id;

        // Set player name
        const nameElement = playerElement.querySelector('.player-name');
        nameElement.textContent = player.name;

        // Set player score
        const scoreElement = playerElement.querySelector('.player-score');
        scoreElement.textContent = player.score;

        // Set player color
        const colorInput = playerElement.querySelector('.player-color-input');
        if (colorInput) {
            colorInput.value = player.color || '#000000';
            this.updatePlayerColor(player.id, colorInput.value);
        }

        // Add name input
        const nameInput = document.createElement('input');
        nameInput.className = 'player-name-input w-full p-2 border rounded mb-2';
        nameInput.type = 'text';
        nameInput.value = player.name;
        nameElement.parentElement.insertBefore(nameInput, nameElement);
        nameElement.remove();

        // Add color picker
        const colorPicker = document.createElement('input');
        colorPicker.className = 'player-color-input w-full p-2 border rounded mb-2';
        colorPicker.type = 'color';
        colorPicker.value = player.color || '#000000';
        playerElement.querySelector('.player-header').appendChild(colorPicker);

        return playerElement;
    },

    /**
     * Update player color in UI
     * @param {number} playerId - The player's ID
     * @param {string} color - The new color
     */
    updatePlayerColor(playerId, color) {
        const playerElement = document.querySelector(`[data-player-id="${playerId}"]`);
        if (!playerElement) return;

        // Update player card background
        playerElement.style.borderColor = color;
        
        // Update player name color
        const nameInput = playerElement.querySelector('.player-name-input');
        if (nameInput) {
            nameInput.style.color = color;
        }

        // Update player score color
        const scoreElement = playerElement.querySelector('.player-score');
        if (scoreElement) {
            scoreElement.style.color = color;
        }
    },

    /**
     * Update player score in UI
     * @param {number} playerId - The player's ID
     * @param {number} score - The new score
     */
    updatePlayerScore(playerId, score) {
        const scoreElement = document.querySelector(`#player-${playerId} .player-score`);
        if (scoreElement) {
            scoreElement.textContent = score;
        }
    },

    /**
     * Update player name in UI
     * @param {number} playerId - The player's ID
     * @param {string} name - The new name
     */
    updatePlayerName(playerId, name) {
        const nameInput = document.querySelector(`[data-player-id="${playerId}"] .player-name-input`);
        if (nameInput) {
            nameInput.value = name;
        }
    },

    /**
     * Update player tasks in UI
     * @param {number} playerId - The player's ID
     */
    updatePlayerTasks(playerId) {
        const player = GameCore.players.find(p => p.id === playerId);
        if (!player) return;

        const taskContainer = document.querySelector(`[data-player-id="${playerId}"] .task-list`);
        if (!taskContainer) return;

        // Clear existing tasks
        taskContainer.innerHTML = '';

        // Add tasks
        player.tasks.forEach(task => {
            const taskElement = TaskUI.createTaskElement(task);
            taskContainer.appendChild(taskElement);
        });
    }
};

// Export the PlayerUI module
export default PlayerUI;
