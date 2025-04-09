/**
 * game-ui.js
 * Handles all UI interactions and rendering
 */

import { game } from '../core/game-core.js';
import { monitoring } from '../core/monitoring.js';

export class GameUI {
    constructor() {
        this.elements = {
            container: document.getElementById('game-container'),
            loading: document.getElementById('loading'),
            error: document.getElementById('error'),
            gameContent: document.getElementById('game-content')
        };

        this.state = {
            isLoading: true,
            hasError: false,
            isInitialized: false
        };
    }

    initialize() {
        try {
            this.setupEventListeners();
            this.renderLoading();
            this.state.isInitialized = true;
            return true;
        } catch (error) {
            console.error('Error initializing UI:', error);
            monitoring.handleError(error);
            this.showError(error.message);
            throw error;
        }
    }

    setupEventListeners() {
        // Add event listeners for UI interactions
        document.addEventListener('gameStateChange', this.handleGameStateChange.bind(this));
        document.addEventListener('error', this.handleError.bind(this));
    }

    handleGameStateChange(event) {
        try {
            const gameState = event.detail;
            this.updateUI(gameState);
        } catch (error) {
            console.error('Error handling game state change:', error);
            monitoring.handleError(error);
            this.showError(error.message);
        }
    }

    handleError(error) {
        try {
            this.showError(error.message);
        } catch (error) {
            console.error('Error handling UI error:', error);
            monitoring.handleError(error);
        }
    }

    renderLoading() {
        try {
            this.elements.loading.classList.remove('hidden');
            this.elements.gameContent.classList.add('hidden');
            this.elements.error.classList.add('hidden');
            this.state.isLoading = true;
        } catch (error) {
            console.error('Error rendering loading state:', error);
            monitoring.handleError(error);
            throw error;
        }
    }

    showError(message) {
        try {
            this.elements.error.classList.remove('hidden');
            this.elements.error.querySelector('#error-message').textContent = message;
            this.elements.loading.classList.add('hidden');
            this.elements.gameContent.classList.add('hidden');
            this.state.hasError = true;
        } catch (error) {
            console.error('Error showing error:', error);
            monitoring.handleError(error);
            throw error;
        }
    }

    updateUI(gameState) {
        try {
            if (!this.state.isInitialized) {
                throw new Error('UI not initialized');
            }

            // Update game content
            this.elements.gameContent.innerHTML = this.renderGameContent(gameState);
            this.elements.gameContent.classList.remove('hidden');
            this.elements.loading.classList.add('hidden');
            this.elements.error.classList.add('hidden');

            this.state.isLoading = false;
            this.state.hasError = false;
        } catch (error) {
            console.error('Error updating UI:', error);
            monitoring.handleError(error);
            this.showError(error.message);
        }
    }

    renderGameContent(gameState) {
        try {
            return `
                <div class="game-header">
                    <h2>Round ${gameState.currentRound} of ${gameState.totalRounds}</h2>
                    <div class="phase-indicator">
                        <span class="phase-name">${gameState.currentPhase}</span>
                        <span class="time-remaining">${this.formatTime(gameState.phaseTimeRemaining)}</span>
                    </div>
                </div>
                
                <div class="player-list">
                    ${gameState.players.map(player => this.renderPlayer(player)).join('')}
                </div>
            `;
        } catch (error) {
            console.error('Error rendering game content:', error);
            monitoring.handleError(error);
            throw error;
        }
    }

    renderPlayer(player) {
        try {
            return `
                <div class="player-card" data-player-id="${player.id}">
                    <div class="player-header">
                        <h3>${player.name}</h3>
                        <span class="player-score">Score: ${player.score}</span>
                    </div>
                    <div class="player-tasks">
                        ${player.tasks.map(task => this.renderTask(task)).join('')}
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error rendering player:', error);
            monitoring.handleError(error);
            throw error;
        }
    }

    renderTask(task) {
        try {
            const taskClass = task.completed ? 'task-completed' : '';
            return `
                <div class="task-card ${taskClass}" data-task-id="${task.id}">
                    <div class="task-header">
                        <span class="task-category">${task.category}</span>
                        <span class="task-points">${task.points} pts</span>
                    </div>
                    <div class="task-content">
                        ${task.description}
                    </div>
                    <div class="task-actions">
                        <button class="complete-task">Complete</button>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error rendering task:', error);
            monitoring.handleError(error);
            throw error;
        }
    }

    formatTime(seconds) {
        try {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
        } catch (error) {
            console.error('Error formatting time:', error);
            monitoring.handleError(error);
            throw error;
        }
    }
}
