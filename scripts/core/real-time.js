/**
 * real-time.js
 * Handles real-time updates and synchronization between players with conflict resolution
 */

import { gameCore } from './game-core.js';
import { dataSync } from './data-sync.js';
import { monitoring } from './monitoring.js';

// Event types and their priorities
const EVENT_PRIORITIES = {
    'game-state': 100,
    'player-update': 90,
    'task-completion': 80,
    'error': 10,
    'heartbeat': 5
};

// Conflict resolution strategies
const CONFLICT_RESOLUTION = {
    'game-state': 'latest',
    'player-update': 'merge',
    'task-completion': 'latest',
    'error': 'merge'
};

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
        this.eventQueue = [];
        this.lastSyncedState = null;
        this.conflictLog = [];
    }

    async initialize() {
        try {
            await this.connect();
            this.setupEventListeners();
            this.startHeartbeat();
            console.log('Real-time updates initialized');
            
            // Initialize monitoring
            await monitoring.startMonitoring();
        } catch (error) {
            console.error('Error initializing real-time updates:', error);
            monitoring.logError('RealTime initialization failed', error);
            throw error;
        }
    }

    async connect() {
        try {
            const serverUrl = process.env.WS_SERVER_URL || 'ws://localhost:3000/ws';
            this.socket = new WebSocket(serverUrl);

            this.socket.onopen = () => {
                console.log('WebSocket connected');
                this.reconnectAttempts = 0;
                this.reconnectDelay = 1000;
                this.sendHeartbeat();
                
                // Send initial sync request
                this.broadcastEvent('sync-request', {
                    type: 'initial',
                    timestamp: new Date().getTime()
                });
            };

            this.socket.onclose = (event) => {
                console.log('WebSocket disconnected:', event.code, event.reason);
                this.handleDisconnect(event.code);
            };

            this.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                monitoring.logError('WebSocket connection error', error);
                this.handleDisconnect(1011); // Internal error
            };
        } catch (error) {
            console.error('Error connecting WebSocket:', error);
            monitoring.logError('WebSocket connection failed', error);
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
                monitoring.logError('Message processing error', error);
            }
        };
    }

    async handleMessage(message) {
        try {
            // Add to event queue with priority
            this.eventQueue.push({
                ...message,
                priority: EVENT_PRIORITIES[message.type] || 0,
                timestamp: new Date().getTime()
            });

            // Process events in order of priority
            this.eventQueue.sort((a, b) => b.priority - a.priority);

            // Process highest priority event
            const event = this.eventQueue.shift();
            
            switch (event.type) {
                case 'game-state':
                    await this.handleGameState(event.data);
                    break;
                case 'player-update':
                    await this.handlePlayerUpdate(event.data);
                    break;
                case 'task-completion':
                    await this.handleTaskCompletion(event.data);
                    break;
                case 'error':
                    await this.handleError(event.data);
                    break;
                case 'heartbeat':
                    await this.handleHeartbeat(event.data);
                    break;
                default:
                    console.warn('Unknown message type:', event.type);
                    monitoring.logWarning('Unknown message type', event);
            }
        } catch (error) {
            console.error('Error handling message:', error);
            monitoring.logError('Message handling error', error);
            throw error;
        }
    }

    async handleGameState(gameState) {
        try {
            // Check for conflicts
            const hasConflict = this.checkStateConflict(gameState);
            if (hasConflict) {
                gameState = this.resolveConflict('game-state', gameState);
            }

            // Update game state
            gameCore.currentRound = gameState.currentRound;
            gameCore.currentPhase = gameState.currentPhase;
            gameCore.phaseTimeRemaining = gameState.timer;
            gameCore.players = gameState.players;

            // Sync with Google Sheets
            await dataSync.addSyncEvent('game-state', gameState);

            // Update last synced state
            this.lastSyncedState = gameState;
        } catch (error) {
            console.error('Error handling game state:', error);
            monitoring.logError('Game state error', error);
            throw error;
        }
    }

    async handlePlayerUpdate(playerData) {
        try {
            // Check for conflicts
            const hasConflict = this.checkPlayerConflict(playerData);
            if (hasConflict) {
                playerData = this.resolveConflict('player-update', playerData);
            }

            // Update player data
            await gameCore.handlePlayerUpdate(playerData.id, playerData);

            // Sync with Google Sheets
            await dataSync.addSyncEvent('player-update', playerData);

            // Log update
            monitoring.logEvent('player-update', playerData);
        } catch (error) {
            console.error('Error handling player update:', error);
            monitoring.logError('Player update error', error);
            throw error;
        }
    }

    async handleTaskCompletion(taskData) {
        try {
            // Check for conflicts
            const hasConflict = this.checkTaskConflict(taskData);
            if (hasConflict) {
                taskData = this.resolveConflict('task-completion', taskData);
            }

            // Complete task
            await gameCore.handleTaskCompletion(taskData.playerId, taskData.taskId);

            // Sync with Google Sheets
            await dataSync.addSyncEvent('task-completion', taskData);

            // Log completion
            monitoring.logEvent('task-completion', taskData);
        } catch (error) {
            console.error('Error handling task completion:', error);
            monitoring.logError('Task completion error', error);
            throw error;
        }
    }

    async handleError(errorData) {
        try {
            // Log error
            console.error('Real-time error:', errorData);
            monitoring.logError('Real-time error', errorData);

            // Sync with Google Sheets
            await dataSync.addSyncEvent('error', errorData);

            // Handle specific errors
            switch (errorData.type) {
                case 'connection':
                    await this.handleConnectionError(errorData);
                    break;
                case 'data':
                    await this.handleDataError(errorData);
                    break;
                case 'sync':
                    await this.handleSyncError(errorData);
                    break;
            }
        } catch (error) {
            console.error('Error handling error:', error);
            monitoring.logError('Error handling error', error);
            throw error;
        }
    }

    checkStateConflict(newState) {
        if (!this.lastSyncedState) return false;
        
        const hasConflict = Object.keys(newState).some(key => {
            return newState[key] !== this.lastSyncedState[key];
        });

        if (hasConflict) {
            this.conflictLog.push({
                type: 'game-state',
                timestamp: new Date().getTime(),
                details: {
                    newState,
                    oldState: this.lastSyncedState
                }
            });
        }

        return hasConflict;
    }

    checkPlayerConflict(playerData) {
        const player = gameCore.players.find(p => p.id === playerData.id);
        if (!player) return false;

        const hasConflict = Object.keys(playerData).some(key => {
            return playerData[key] !== player[key];
        });

        if (hasConflict) {
            this.conflictLog.push({
                type: 'player-update',
                timestamp: new Date().getTime(),
                details: {
                    playerId: playerData.id,
                    newData: playerData,
                    oldData: player
                }
            });
        }

        return hasConflict;
    }

    checkTaskConflict(taskData) {
        const player = gameCore.players.find(p => p.id === taskData.playerId);
        if (!player) return false;

        const task = player.tasks.find(t => t.id === taskData.taskId);
        if (!task) return false;

        const hasConflict = task.subtasks.some(subtask => 
            subtask.completed !== taskData.subtasks.find(s => s.id === subtask.id)?.completed
        );

        if (hasConflict) {
            this.conflictLog.push({
                type: 'task-completion',
                timestamp: new Date().getTime(),
                details: {
                    playerId: taskData.playerId,
                    taskId: taskData.taskId,
                    newData: taskData,
                    oldData: task
                }
            });
        }

        return hasConflict;
    }

    resolveConflict(eventType, newData) {
        const strategy = CONFLICT_RESOLUTION[eventType];
        
        switch (strategy) {
            case 'latest':
                return newData;
            case 'merge':
                return this.mergeData(eventType, newData);
            case 'preserve':
                return this.lastSyncedState;
            default:
                return newData;
        }
    }

    mergeData(eventType, newData) {
        switch (eventType) {
            case 'player-update':
                const currentPlayer = gameCore.players.find(p => p.id === newData.id);
                return {
                    ...currentPlayer,
                    ...newData,
                    tasks: [...currentPlayer.tasks, ...newData.tasks]
                };
            case 'task-completion':
                const playerWithTask = gameCore.players.find(p => p.id === newData.playerId);
                const taskToUpdate = playerWithTask.tasks.find(t => t.id === newData.taskId);
                return {
                    ...taskToUpdate,
                    subtasks: [...taskToUpdate.subtasks, ...newData.subtasks]
                };
            default:
                return newData;
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
                timestamp: this.lastHeartbeat.getTime(),
                status: 'active'
            }));
        }
    }

    handleDisconnect(code) {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            this.reconnectDelay = Math.min(
                this.reconnectDelay * 2,
                this.maxReconnectDelay
            );

            this.reconnectTimeout = setTimeout(() => {
                this.connect();
            }, this.reconnectDelay);

            monitoring.logEvent('reconnect-attempt', {
                attempt: this.reconnectAttempts,
                delay: this.reconnectDelay,
                code: code
            });
        } else {
            console.error('Max reconnect attempts reached');
            monitoring.logError('Max reconnect attempts reached', {
                attempts: this.maxReconnectAttempts,
                code: code
            });
            // TODO: Implement fallback mechanism
        }
    }

    async broadcastEvent(type, data) {
        try {
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                this.socket.send(JSON.stringify({
                    type,
                    data,
                    timestamp: new Date().getTime(),
                    clientId: process.env.CLIENT_ID
                }));
            } else {
                console.warn('WebSocket not connected, queuing event');
                this.eventQueue.push({
                    type,
                    data,
                    priority: EVENT_PRIORITIES[type] || 0,
                    timestamp: new Date().getTime()
                });
            }
        } catch (error) {
            console.error('Error broadcasting event:', error);
            monitoring.logError('Event broadcast error', error);
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

        // Clear event queue
        this.eventQueue = [];
        monitoring.logEvent('disconnected', {});
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

            // Process any queued events
            while (this.eventQueue.length > 0) {
                const event = this.eventQueue.shift();
                await this.handleMessage(event);
            }

            monitoring.logEvent('recovery-success', {});
        } catch (recoveryError) {
            console.error('Error during recovery:', recoveryError);
            monitoring.logError('Recovery error', recoveryError);
            throw recoveryError;
        }
    }

    async handleConnectionError(errorData) {
        try {
            // Try to recover connection
            await this.recoverFromError(errorData);

            // Sync with Google Sheets
            await dataSync.addSyncEvent('connection-error', errorData);
        } catch (error) {
            console.error('Error handling connection error:', error);
            monitoring.logError('Connection error handling failed', error);
            throw error;
        }
    }

    async handleDataError(errorData) {
        try {
            // Log detailed error
            monitoring.logError('Data error', errorData);

            // Try to recover data
            const savedState = await dataSync.loadGameState();
            if (savedState) {
                await this.broadcastEvent('game-state', savedState);
            }
        } catch (error) {
            console.error('Error handling data error:', error);
            monitoring.logError('Data error handling failed', error);
            throw error;
        }
    }

    async handleSyncError(errorData) {
        try {
            // Log sync error
            monitoring.logError('Sync error', errorData);

            // Try to resync
            await this.broadcastEvent('sync-request', {
                type: 'resync',
                reason: errorData.reason,
                timestamp: new Date().getTime()
            });
        } catch (error) {
            console.error('Error handling sync error:', error);
            monitoring.logError('Sync error handling failed', error);
            throw error;
        }
    }
}

// Export singleton instance
export const realTime = new RealTime();
