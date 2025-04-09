class MultiplayerClient {
    constructor() {
        this.socket = null;
        this.playerId = null;
        this.gameState = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectTimeout = null;
        this.reconnectDelay = 1000; // 1 second
    }

    // Initialize multiplayer client
    async initialize() {
        try {
            this.setupSocket();
            this.setupEventListeners();
            this.setupReconnection();
            
            // Try to connect immediately
            this.connect();
        } catch (error) {
            console.error('Failed to initialize multiplayer client:', error);
            this.handleError(error);
        }
    }

    // Setup WebSocket connection
    setupSocket() {
        const io = require('socket.io-client');
        this.socket = io('http://localhost:3000', {
            autoConnect: false,
            reconnection: false
        });
    }

    // Setup event listeners
    setupEventListeners() {
        this.socket.on('connect', () => {
            console.log('Connected to multiplayer server');
            this.reconnectAttempts = 0;
            this.reconnectTimeout = null;
        });

        this.socket.on('disconnect', (reason) => {
            console.log('Disconnected from server:', reason);
            this.handleDisconnect(reason);
        });

        this.socket.on('game-state', (state) => {
            this.handleGameState(state);
        });

        this.socket.on('player-count', (count) => {
            this.handlePlayerCount(count);
        });

        this.socket.on('error', (error) => {
            this.handleError(error);
        });
    }

    // Setup reconnection logic
    setupReconnection() {
        this.socket.on('disconnect', (reason) => {
            if (reason === 'io server disconnect') {
                return;
            }
            
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                
                if (this.reconnectTimeout) {
                    clearTimeout(this.reconnectTimeout);
                }
                
                this.reconnectTimeout = setTimeout(() => {
                    console.log(`Attempting to reconnect (attempt ${this.reconnectAttempts})`);
                    this.connect();
                }, this.reconnectDelay * this.reconnectAttempts);
            } else {
                console.error('Max reconnection attempts reached');
                this.handleError({ message: 'Failed to reconnect to server' });
            }
        });
    }

    // Connect to server
    connect() {
        try {
            this.socket.connect();
        } catch (error) {
            console.error('Failed to connect:', error);
            this.handleError(error);
        }
    }

    // Handle game state updates
    handleGameState(state) {
        this.gameState = state;
        this.updateUI();
    }

    // Handle player count updates
    handlePlayerCount(count) {
        console.log(`Active players: ${count}`);
        this.updatePlayerCountUI(count);
    }

    // Handle errors
    handleError(error) {
        console.error('Multiplayer error:', error);
        this.showError(error.message);
    }

    // Handle disconnection
    handleDisconnect(reason) {
        console.log('Disconnected:', reason);
        this.updateConnectionStatus(false);
    }

    // Update UI with game state
    updateUI() {
        if (!this.gameState) return;

        // Update player list
        const playerList = document.getElementById('player-list');
        if (playerList) {
            playerList.innerHTML = this.gameState.players
                .map(player => `
                    <div class="player-card">
                        <div class="player-name">${player.name}</div>
                        <div class="player-score">Score: ${player.score}</div>
                    </div>
                `)
                .join('');
        }

        // Update task lists for all players
        this.gameState.players.forEach(player => {
            const taskList = document.getElementById(`player-${player.id}-tasks`);
            if (taskList) {
                taskList.innerHTML = player.tasks
                    .map(task => `
                        <div class="task-item">
                            <span class="task-description">${task.description}</span>
                            <span class="task-status">${task.status}</span>
                        </div>
                    `)
                    .join('');
            }
        });
    }

    // Update player count UI
    updatePlayerCountUI(count) {
        const playerCountElement = document.getElementById('player-count');
        if (playerCountElement) {
            playerCountElement.textContent = `Players: ${count}`;
        }
    }

    // Update connection status UI
    updateConnectionStatus(connected) {
        const statusElement = document.getElementById('connection-status');
        if (statusElement) {
            statusElement.textContent = connected ? 'Connected' : 'Disconnected';
            statusElement.className = connected ? 'connected' : 'disconnected';
        }
    }

    // Show error message
    showError(message) {
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            
            // Hide error after 5 seconds
            setTimeout(() => {
                errorElement.style.display = 'none';
            }, 5000);
        }
    }

    // Send task update
    sendTaskUpdate(taskId, data) {
        if (this.socket && this.socket.connected) {
            this.socket.emit('task-update', taskId, data);
        }
    }

    // Send score update
    sendScoreUpdate(points) {
        if (this.socket && this.socket.connected) {
            this.socket.emit('score-update', points);
        }
    }

    // Cleanup
    cleanup() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.reconnectAttempts = 0;
        this.reconnectTimeout = null;
        this.gameState = null;
    }
}

// Export singleton instance
const multiplayerClient = new MultiplayerClient();
export default multiplayerClient;
