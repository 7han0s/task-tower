/**
 * multiplayer-manager.js
 * Handles multiplayer game state synchronization
 */

import { GameCore } from './game-core.js';
import { UIController } from '../ui/ui-controller.js';

export class MultiplayerManager {
    constructor() {
        this.io = null;
        this.players = new Map(); // playerId -> Player object
        this.gameState = null;
        this.syncInterval = null;
        this.isOnline = false;
    }

    // Initialize multiplayer system
    async initialize(io) {
        this.io = io;
        this.isOnline = true;
        this.setupEventListeners();
        this.setupSync();
    }

    // Setup event listeners
    setupEventListeners() {
        this.io.on('connection', (socket) => {
            console.log('Player connected:', socket.id);
            
            // Handle player connection
            socket.on('player-connect', async (playerData) => {
                try {
                    const playerId = socket.id;
                    const player = {
                        id: playerId,
                        name: playerData.name,
                        score: 0,
                        tasks: [],
                        isConnected: true,
                        lastPing: Date.now()
                    };
                    
                    this.players.set(playerId, player);
                    this.updatePlayerCount();
                    
                    // Send initial game state
                    if (this.gameState) {
                        socket.emit('game-state', this.gameState);
                    }
                } catch (error) {
                    console.error('Error handling player connection:', error);
                    socket.emit('error', { message: 'Failed to connect player' });
                }
            });

            // Handle player disconnection
            socket.on('disconnect', () => {
                console.log('Player disconnected:', socket.id);
                this.handlePlayerDisconnect(socket.id);
            });

            // Handle task updates
            socket.on('task-update', (taskId, data) => {
                this.handleTaskUpdate(socket.id, taskId, data);
            });

            // Handle score updates
            socket.on('score-update', (points) => {
                this.handleScoreUpdate(socket.id, points);
            });

            // Handle player join
            socket.on('join-game', (playerData) => {
                console.log('Player joining game:', playerData);
                this.handlePlayerJoin(socket, playerData);
            });
        });
    }

    // Setup state synchronization
    setupSync() {
        // Sync game state every 100ms
        this.syncInterval = setInterval(() => {
            if (this.gameState) {
                this.io.emit('game-state', this.gameState);
            }
        }, 100);

        // Cleanup on disconnect
        this.io.on('disconnect', () => {
            if (this.syncInterval) {
                clearInterval(this.syncInterval);
            }
        });
    }

    // Handle player disconnection
    handlePlayerDisconnect(playerId) {
        if (this.players.has(playerId)) {
            const player = this.players.get(playerId);
            player.isConnected = false;
            player.lastPing = Date.now();
            
            // Remove player if they're disconnected for too long
            if (Date.now() - player.lastPing > 30000) { // 30 seconds
                this.players.delete(playerId);
                this.updatePlayerCount();
            }
        }
    }

    // Handle task updates
    handleTaskUpdate(playerId, taskId, data) {
        const player = this.players.get(playerId);
        if (!player) return;

        // Find and update the task
        const taskIndex = player.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            player.tasks[taskIndex] = { ...player.tasks[taskIndex], ...data };
            this.updateGameState();
        }
    }

    // Handle score updates
    handleScoreUpdate(playerId, points) {
        const player = this.players.get(playerId);
        if (!player) return;

        player.score += points;
        this.updateGameState();
    }

    // Handle player join
    handlePlayerJoin(socket, playerData) {
        // Add player to game
        const newPlayer = GameCore.addPlayer(playerData.name);
        this.players.set(socket.id, newPlayer);

        // Send initial game state to the new player
        socket.emit('game-state', {
            players: Array.from(this.players.values()),
            round: GameCore.currentRound,
            phase: GameCore.currentPhase,
            timeRemaining: GameCore.phaseTimeRemaining
        });

        // Notify other players of new player
        socket.broadcast.emit('player-joined', newPlayer);
    }

    // Update game state
    updateGameState() {
        this.gameState = {
            players: Array.from(this.players.values()),
            timestamp: Date.now()
        };
    }

    // Update player count
    updatePlayerCount() {
        const activePlayers = Array.from(this.players.values())
            .filter(p => p.isConnected);
        
        this.io.emit('player-count', activePlayers.length);
    }

    // Cleanup
    cleanup() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        this.players.clear();
        this.gameState = null;
    }

    isOnline() {
        return this.isOnline;
    }
}

// Export singleton instance
export const multiplayerManager = new MultiplayerManager();
