/**
 * multiplayer-manager.js
 * Handles multiplayer game features and real-time updates
 */

import { TaskManager } from '../core/task-manager.js';
import { ScoringManager } from '../core/scoring-manager.js';
import { GameCore } from '../core/game-core.js';

const MultiplayerManager = {
    /**
     * Initialize multiplayer features
     */
    init() {
        this.setupEventListeners();
        this.setupRealTimeSync();
    },

    /**
     * Set up event listeners for multiplayer interactions
     */
    setupEventListeners() {
        // Handle task sharing
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('share-task-btn')) {
                this.handleShareTask(e.target.closest('.task-item'));
            }
        });

        // Handle task help requests
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('request-help-btn')) {
                this.handleRequestHelp(e.target.closest('.task-item'));
            }
        });

        // Handle help responses
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('offer-help-btn')) {
                this.handleOfferHelp(e.target.closest('.help-request'));
            }
        });
    },

    /**
     * Set up real-time synchronization
     */
    setupRealTimeSync() {
        // Initialize real-time updates
        const realTime = window.realTime;
        
        // Listen for player updates
        realTime.on('playerUpdate', (playerId, updates) => {
            GameCore.handlePlayerUpdate(playerId, updates);
            this.updatePlayerUI(playerId);
        });

        // Listen for task updates
        realTime.on('taskUpdate', (taskId, updates) => {
            TaskManager.updateTask(taskId, updates);
            this.updateTaskUI(taskId);
        });

        // Listen for game state updates
        realTime.on('gameStateUpdate', (state) => {
            GameCore.loadGameState(state);
            this.updateGameStateUI();
        });
    },

    /**
     * Handle task sharing
     * @param {HTMLElement} taskElement - The task element to share
     */
    handleShareTask(taskElement) {
        const taskId = taskElement.dataset.taskId;
        const playerId = taskElement.dataset.playerId;

        // Create sharing modal
        const modal = this.createModal('Share Task');
        const form = modal.querySelector('form');

        // Add player selection
        const playerSelect = document.createElement('select');
        playerSelect.className = 'w-full p-2 border rounded';
        GameCore.players.forEach(player => {
            if (player.id !== playerId) {
                const option = document.createElement('option');
                option.value = player.id;
                option.textContent = player.name;
                playerSelect.appendChild(option);
            }
        });
        form.insertBefore(playerSelect, form.querySelector('div').firstChild);

        // Handle form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const selectedPlayerId = playerSelect.value;

            try {
                // Share task with selected player
                TaskManager.shareTask(taskId, playerId, selectedPlayerId);
                
                // Send real-time update
                window.realTime.emit('taskShared', {
                    taskId,
                    fromPlayer: playerId,
                    toPlayer: selectedPlayerId
                });

                modal.remove();
            } catch (error) {
                console.error('Error sharing task:', error);
                alert('Error sharing task: ' + error.message);
            }
        });
    },

    /**
     * Handle help request
     * @param {HTMLElement} taskElement - The task element requesting help
     */
    handleRequestHelp(taskElement) {
        const taskId = taskElement.dataset.taskId;
        const playerId = taskElement.dataset.playerId;

        // Create help request
        const helpRequest = {
            taskId,
            playerId,
            timestamp: new Date().getTime(),
            status: 'pending'
        };

        try {
            // Add help request to task
            TaskManager.addHelpRequest(taskId, helpRequest);
            
            // Send real-time update
            window.realTime.emit('helpRequested', helpRequest);
            
            // Update UI
            this.showHelpRequest(taskElement, helpRequest);
        } catch (error) {
            console.error('Error requesting help:', error);
            alert('Error requesting help: ' + error.message);
        }
    },

    /**
     * Handle help offer
     * @param {HTMLElement} helpRequestElement - The help request element
     */
    handleOfferHelp(helpRequestElement) {
        const taskId = helpRequestElement.dataset.taskId;
        const playerId = helpRequestElement.dataset.playerId;
        const helperId = helpRequestElement.dataset.helperId;

        try {
            // Accept help request
            TaskManager.acceptHelpRequest(taskId, playerId, helperId);
            
            // Send real-time update
            window.realTime.emit('helpAccepted', {
                taskId,
                playerId,
                helperId
            });

            // Update UI
            this.updateHelpRequestStatus(helpRequestElement, 'accepted');
        } catch (error) {
            console.error('Error offering help:', error);
            alert('Error offering help: ' + error.message);
        }
    },

    /**
     * Show help request UI
     * @param {HTMLElement} taskElement - The task element
     * @param {object} helpRequest - The help request data
     */
    showHelpRequest(taskElement, helpRequest) {
        const helpRequestsContainer = taskElement.querySelector('.help-requests-container');
        if (!helpRequestsContainer) return;

        const requestElement = document.createElement('div');
        requestElement.className = 'help-request flex items-center space-x-2 p-2 bg-gray-100 rounded';
        requestElement.innerHTML = `
            <span class="text-sm">Help requested by ${GameCore.players.find(p => p.id === helpRequest.playerId).name}</span>
            <button class="offer-help-btn px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">Offer Help</button>
        `;
        
        requestElement.dataset.taskId = helpRequest.taskId;
        requestElement.dataset.playerId = helpRequest.playerId;

        helpRequestsContainer.appendChild(requestElement);
    },

    /**
     * Update help request status
     * @param {HTMLElement} helpRequestElement - The help request element
     * @param {string} status - The new status (accepted/completed)
     */
    updateHelpRequestStatus(helpRequestElement, status) {
        const statusElement = helpRequestElement.querySelector('.status');
        if (!statusElement) {
            statusElement = document.createElement('span');
            statusElement.className = 'status ml-2';
            helpRequestElement.appendChild(statusElement);
        }

        statusElement.textContent = status.charAt(0).toUpperCase() + status.slice(1);
        statusElement.className = `status ml-2 bg-${status}-100 text-${status}-700 px-2 py-1 rounded`;

        // Hide offer help button if status is accepted
        const offerHelpBtn = helpRequestElement.querySelector('.offer-help-btn');
        if (offerHelpBtn) {
            offerHelpBtn.classList.add('hidden');
        }
    },

    /**
     * Create modal dialog
     * @param {string} title - The modal title
     * @returns {HTMLElement} - The modal element
     */
    createModal(title) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center';

        const modalContent = document.createElement('div');
        modalContent.className = 'bg-white p-6 rounded-lg shadow-lg';

        const form = document.createElement('form');
        form.innerHTML = `
            <h3 class="text-lg font-semibold mb-4">${title}</h3>
            <div class="mb-4">
                <label class="block text-sm font-medium mb-1">Description</label>
                <input type="text" class="w-full p-2 border rounded" required>
            </div>
            <div class="flex justify-end space-x-2">
                <button type="button" class="cancel-btn">Cancel</button>
                <button type="submit" class="submit-btn">Submit</button>
            </div>
        `;

        form.querySelector('.cancel-btn').addEventListener('click', () => {
            modal.remove();
        });

        modalContent.appendChild(form);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        return modal;
    },

    /**
     * Update player's UI
     * @param {number} playerId - The player's ID
     */
    updatePlayerUI(playerId) {
        const player = GameCore.players.find(p => p.id === playerId);
        if (!player) return;

        // Update player's score
        const scoreElement = document.querySelector(`#player-${playerId} .score`);
        if (scoreElement) {
            scoreElement.textContent = player.score;
        }

        // Update player's tasks
        this.renderPlayerTasks(playerId);
    },

    /**
     * Update task's UI
     * @param {number} taskId - The task's ID
     */
    updateTaskUI(taskId) {
        const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
        if (!taskElement) return;

        // Get task data
        const task = TaskManager.getTaskById(taskId);
        if (!task) return;

        // Update progress bar
        const progressBar = taskElement.querySelector('.progress-bar');
        progressBar.style.width = `${task.progress}%`;

        // Update status
        const statusElement = taskElement.querySelector('.status-text');
        statusElement.textContent = task.completed ? 'Completed' : 'In Progress';

        // Update points
        const pointsElement = taskElement.querySelector('.points-text');
        pointsElement.textContent = task.completed ? `+${task.points} points` : '';
    },

    /**
     * Update game state UI
     */
    updateGameStateUI() {
        // Update phase indicator
        document.getElementById('phase-indicator').textContent = GameCore.currentPhase;
        
        // Update time remaining
        document.getElementById('time-remaining').textContent = 
            GameCore.formatTime(GameCore.phaseTimeRemaining);
        
        // Update round counter
        document.getElementById('round-counter').textContent = 
            `${GameCore.currentRound}/${GameCore.totalRounds}`;
    },

    /**
     * Render player's tasks
     * @param {number} playerId - The player's ID
     */
    renderPlayerTasks(playerId) {
        const player = GameCore.players.find(p => p.id === playerId);
        if (!player) return;

        // Get player's task container
        const taskContainer = document.querySelector(`#player-${playerId} .task-list`);
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

// Export the MultiplayerManager module
export default MultiplayerManager;
