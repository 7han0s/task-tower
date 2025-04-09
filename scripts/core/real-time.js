/**
 * real-time.js
 * Handles real-time updates and synchronization between players
 */

import { gameCore } from './game-core.js';
import { dataSync } from './data-sync.js';

export class RealTime {
    constructor() {
        this.socket = null;
        this.reconnectTimeout = null;
        this.lastHeartbeat = null;
        this.heartbeatInterval = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000; // 1 second
        this.maxReconnectDelay = 30000; // 30 seconds
    }

    async initialize() {
        try {
            await this.connect();
            this.setupEventListeners();
            this.startHeartbeat();
            console.log('Real-time updates initialized');
        } catch (error) {
            console.error('Error initializing real-time updates:', error);
            throw error;
        }
    }

    async connect() {
        try {
            this.socket = new WebSocket('ws://localhost:3000/ws');

            this.socket.onopen = () => {
                console.log('WebSocket connected');
                this.reconnectAttempts = 0;
                this.reconnectDelay = 1000;
                this.sendHeartbeat();
            };

            this.socket.onclose = () => {
                console.log('WebSocket disconnected');
                this.handleDisconnect();
            };

            this.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.handleDisconnect();
            };
        } catch (error) {
            console.error('Error connecting WebSocket:', error);
            throw error;
        }
    }

    setupEventListeners() {
        this.socket.onmessage = async (event) => {
            try {
                const message = JSON.parse(event.data);
                await this.handleMessage(message);
            } catch (error) {
                console.error('Error processing message:', error);
            }
        };
    }

    async handleMessage(message) {
        try {
            switch (message.type) {
                case 'game-state':
                    await this.handleGameState(message.data);
                    break;
                case 'player-update':
                    await this.handlePlayerUpdate(message.data);
                    break;
                case 'task-completion':
                    await this.handleTaskCompletion(message.data);
                    break;
                case 'error':
                    await this.handleError(message.data);
                    break;
                default:
                    console.warn('Unknown message type:', message.type);
            }
        } catch (error) {
            console.error('Error handling message:', error);
            throw error;
        }
    }

    async handleGameState(gameState) {
        try {
            // Update game state
            gameCore.currentRound = gameState.currentRound;
            gameCore.currentPhase = gameState.currentPhase;
            gameCore.phaseTimeRemaining = gameState.timer;
            gameCore.players = gameState.players;

            // Sync with Google Sheets
            await dataSync.addSyncEvent('game-state', gameState);
        } catch (error) {
            console.error('Error handling game state:', error);
            throw error;
        }
    }

    async handlePlayerUpdate(playerData) {
        try {
            // Update player data
            await gameCore.handlePlayerUpdate(playerData.id, playerData);

            // Sync with Google Sheets
            await dataSync.addSyncEvent('player-update', playerData);
        } catch (error) {
            console.error('Error handling player update:', error);
            throw error;
        }
    }

    async handleTaskCompletion(taskData) {
        try {
            // Complete task
            await gameCore.handleTaskCompletion(taskData.playerId, taskData.taskId);

            // Sync with Google Sheets
            await dataSync.addSyncEvent('task-completion', taskData);
        } catch (error) {
            console.error('Error handling task completion:', error);
            throw error;
        }
    }

    async handleError(errorData) {
        try {
            // Log error
            console.error('Real-time error:', errorData);

            // Sync with Google Sheets
            await dataSync.addSyncEvent('error', errorData);
        } catch (error) {
            console.error('Error handling error:', error);
            throw error;
        }
    }

    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            this.sendHeartbeat();
        }, 5000); // Send heartbeat every 5 seconds
    }

    sendHeartbeat() {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.lastHeartbeat = new Date();
            this.socket.send(JSON.stringify({
                type: 'heartbeat',
                timestamp: this.lastHeartbeat.getTime()
            }));
        }
    }

    handleDisconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            this.reconnectDelay = Math.min(
                this.reconnectDelay * 2,
                this.maxReconnectDelay
            );

            this.reconnectTimeout = setTimeout(() => {
                this.connect();
            }, this.reconnectDelay);
        } else {
            console.error('Max reconnect attempts reached');
            // TODO: Implement fallback mechanism
        }
    }

    async broadcastEvent(type, data) {
        try {
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                this.socket.send(JSON.stringify({
                    type,
                    data,
                    timestamp: new Date().getTime()
                }));
            } else {
                console.warn('WebSocket not connected, cannot broadcast event');
            }
        } catch (error) {
            console.error('Error broadcasting event:', error);
            throw error;
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }

        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
    }

    async recoverFromError(error) {
        try {
            // Try to reconnect
            await this.connect();

            // Load last known good state
            const savedState = await dataSync.loadGameState();
            if (savedState) {
                await this.broadcastEvent('game-state', savedState);
            }
        } catch (recoveryError) {
            console.error('Error during recovery:', recoveryError);
            throw recoveryError;
        }
    }
}

// Export singleton instance
export const realTime = new RealTime();
