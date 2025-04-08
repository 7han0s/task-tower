/**
 * mcp-server.js
 * Handles MCP server configuration and connection
 */

// MCP Server configuration
const MCPConfig = {
    // Server settings
    host: 'localhost',
    port: 3000,
    maxConnections: 100,
    pingInterval: 30000, // 30 seconds
    timeout: 60000, // 60 seconds

    // Game settings
    maxPlayers: 8,
    minPlayers: 2,
    lobbyTimeout: 300000, // 5 minutes

    // Security settings
    requireAuthentication: true,
    rateLimit: {
        messages: 100, // messages per minute
        connections: 10, // connections per minute
    },

    // Logging settings
    logLevel: 'info',
    logToFile: true,
    logFile: 'logs/mcp-server.log'
};

// MCP Server class
class MCPManager {
    constructor() {
        this.server = null;
        this.clients = new Map();
        this.lobbies = new Map();
        this.gameStates = new Map();
        this.logger = this.setupLogger();
    }

    /**
     * Setup logger
     * @returns {object} - Logger instance
     */
    setupLogger() {
        const { createLogger, format, transports } = require('winston');
        const { combine, timestamp, label, printf } = format;

        const logFormat = printf(({ level, message, label, timestamp }) => {
            return `${timestamp} [${label}] ${level}: ${message}`;
        });

        return createLogger({
            level: MCPConfig.logLevel,
            format: combine(
                label({ label: 'MCP Server' }),
                timestamp(),
                logFormat
            ),
            transports: [
                new transports.Console(),
                new transports.File({ filename: MCPConfig.logFile })
            ]
        });
    }

    /**
     * Start the MCP server
     */
    async start() {
        try {
            const { createServer } = require('http');
            const { Server } = require('socket.io');

            this.server = createServer();
            this.io = new Server(this.server, {
                cors: {
                    origin: '*',
                    methods: ['GET', 'POST']
                }
            });

            // Setup event listeners
            this.setupEventListeners();

            // Start server
            this.server.listen(MCPConfig.port, MCPConfig.host, () => {
                this.logger.info(`MCP Server started on ${MCPConfig.host}:${MCPConfig.port}`);
            });

            return true;
        } catch (error) {
            this.logger.error('Failed to start MCP server:', error);
            throw error;
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        this.io.on('connection', (socket) => {
            this.logger.info(`Client connected: ${socket.id}`);

            // Rate limiting
            this.handleRateLimit(socket);

            // Authentication
            socket.on('authenticate', async (data) => {
                try {
                    if (await this.authenticate(socket, data)) {
                        this.logger.info(`Client authenticated: ${socket.id}`);
                        socket.emit('authenticated', { success: true });
                    }
                } catch (error) {
                    this.logger.error(`Authentication failed for ${socket.id}:`, error);
                    socket.emit('authenticated', { success: false, error: error.message });
                }
            });

            // Lobby events
            socket.on('joinLobby', (data) => this.handleJoinLobby(socket, data));
            socket.on('leaveLobby', () => this.handleLeaveLobby(socket));
            socket.on('startGame', (data) => this.handleStartGame(socket, data));

            // Game events
            socket.on('submitTask', (data) => this.handleSubmitTask(socket, data));
            socket.on('updateTask', (data) => this.handleUpdateTask(socket, data));
            socket.on('completeTask', (data) => this.handleCompleteTask(socket, data));

            // Error handling
            socket.on('error', (error) => {
                this.logger.error(`Socket error for ${socket.id}:`, error);
                this.handleSocketError(socket, error);
            });

            // Disconnection
            socket.on('disconnect', () => {
                this.logger.info(`Client disconnected: ${socket.id}`);
                this.handleDisconnect(socket);
            });
        });
    }

    /**
     * Handle rate limiting
     * @param {Socket} socket - The client socket
     */
    handleRateLimit(socket) {
        const rateLimiter = new (require('rate-limiter-flexible'))({
            points: MCPConfig.rateLimit.messages,
            duration: 60, // seconds
            blockDuration: 300 // seconds
        });

        socket.use(async (packet, next) => {
            try {
                await rateLimiter.consume(socket.id);
                next();
            } catch (error) {
                this.logger.warn(`Rate limit exceeded for ${socket.id}`);
                socket.emit('rateLimitExceeded', { message: 'Too many requests. Please try again later.' });
            }
        });
    }

    /**
     * Authenticate client
     * @param {Socket} socket - The client socket
     * @param {object} data - Authentication data
     * @returns {Promise<boolean>} - Whether authentication was successful
     */
    async authenticate(socket, data) {
        // TODO: Implement proper authentication
        // For now, just check if player ID exists
        const playerId = data.playerId;
        if (!playerId) {
            throw new Error('Player ID is required');
        }

        // Check if player is already connected
        const existingSocket = Array.from(this.clients.values()).find(s => s.playerId === playerId);
        if (existingSocket) {
            throw new Error('Player is already connected');
        }

        // Store client information
        this.clients.set(socket.id, {
            playerId,
            socket,
            lastActivity: Date.now(),
            messagesSent: 0
        });

        return true;
    }

    /**
     * Handle joining lobby
     * @param {Socket} socket - The client socket
     * @param {object} data - Lobby data
     */
    async handleJoinLobby(socket, data) {
        const clientId = socket.id;
        const client = this.clients.get(clientId);

        if (!client) {
            socket.emit('error', { message: 'Not authenticated' });
            return;
        }

        // Create or join lobby
        const lobbyId = data.lobbyId || this.generateLobbyId();
        let lobby = this.lobbies.get(lobbyId);

        if (!lobby) {
            // Create new lobby
            lobby = {
                id: lobbyId,
                players: new Set([client.playerId]),
                createdAt: Date.now(),
                lastActivity: Date.now()
            };
            this.lobbies.set(lobbyId, lobby);
        } else {
            // Join existing lobby
            if (lobby.players.size >= MCPConfig.maxPlayers) {
                socket.emit('error', { message: 'Lobby is full' });
                return;
            }
            lobby.players.add(client.playerId);
            lobby.lastActivity = Date.now();
        }

        // Send lobby state to all players
        this.broadcastLobbyState(lobbyId);

        // Send success response
        socket.emit('lobbyJoined', { 
            lobbyId,
            players: Array.from(lobby.players)
        });
    }

    /**
     * Handle leaving lobby
     * @param {Socket} socket - The client socket
     */
    handleLeaveLobby(socket) {
        const clientId = socket.id;
        const client = this.clients.get(clientId);

        if (!client) {
            socket.emit('error', { message: 'Not authenticated' });
            return;
        }

        // Find and remove from lobby
        for (const [lobbyId, lobby] of this.lobbies) {
            if (lobby.players.has(client.playerId)) {
                lobby.players.delete(client.playerId);
                lobby.lastActivity = Date.now();

                // If lobby is empty, clean it up
                if (lobby.players.size === 0) {
                    this.lobbies.delete(lobbyId);
                } else {
                    // Broadcast updated lobby state
                    this.broadcastLobbyState(lobbyId);
                }

                break;
            }
        }

        socket.emit('lobbyLeft', { success: true });
    }

    /**
     * Handle starting game
     * @param {Socket} socket - The client socket
     * @param {object} data - Game start data
     */
    async handleStartGame(socket, data) {
        const clientId = socket.id;
        const client = this.clients.get(clientId);
        const lobbyId = data.lobbyId;

        if (!client || !lobbyId) {
            socket.emit('error', { message: 'Invalid request' });
            return;
        }

        const lobby = this.lobbies.get(lobbyId);
        if (!lobby) {
            socket.emit('error', { message: 'Lobby not found' });
            return;
        }

        // Check if lobby has enough players
        if (lobby.players.size < MCPConfig.minPlayers) {
            socket.emit('error', { message: 'Not enough players to start game' });
            return;
        }

        // Create game state
        const gameState = {
            lobbyId,
            players: Array.from(lobby.players),
            round: 1,
            phase: 'setup',
            tasks: [],
            scores: new Map(),
            startedAt: Date.now(),
            lastUpdate: Date.now()
        };

        // Initialize player scores
        gameState.players.forEach(playerId => {
            gameState.scores.set(playerId, 0);
        });

        // Store game state
        this.gameStates.set(lobbyId, gameState);

        // Broadcast game start
        this.broadcastGameState(lobbyId);
    }

    /**
     * Handle task submission
     * @param {Socket} socket - The client socket
     * @param {object} data - Task data
     */
    async handleSubmitTask(socket, data) {
        const clientId = socket.id;
        const client = this.clients.get(clientId);
        const lobbyId = data.lobbyId;

        if (!client || !lobbyId) {
            socket.emit('error', { message: 'Invalid request' });
            return;
        }

        const gameState = this.gameStates.get(lobbyId);
        if (!gameState) {
            socket.emit('error', { message: 'Game not found' });
            return;
        }

        // Validate task
        const task = this.validateTask(data.task);
        if (!task) {
            socket.emit('error', { message: 'Invalid task' });
            return;
        }

        // Add task to game state
        gameState.tasks.push(task);
        gameState.lastUpdate = Date.now();

        // Update scores
        this.updateScores(gameState, client.playerId, task);

        // Broadcast updated game state
        this.broadcastGameState(lobbyId);
    }

    /**
     * Handle task update
     * @param {Socket} socket - The client socket
     * @param {object} data - Task update data
     */
    async handleUpdateTask(socket, data) {
        const clientId = socket.id;
        const client = this.clients.get(clientId);
        const lobbyId = data.lobbyId;
        const taskId = data.taskId;

        if (!client || !lobbyId || !taskId) {
            socket.emit('error', { message: 'Invalid request' });
            return;
        }

        const gameState = this.gameStates.get(lobbyId);
        if (!gameState) {
            socket.emit('error', { message: 'Game not found' });
            return;
        }

        // Find and update task
        const taskIndex = gameState.tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) {
            socket.emit('error', { message: 'Task not found' });
            return;
        }

        const task = gameState.tasks[taskIndex];
        task.progress = data.progress;
        task.completed = data.completed;
        task.actualDuration = data.actualDuration;
        
        // Update scores if task is completed
        if (task.completed) {
            this.updateScores(gameState, client.playerId, task);
        }

        gameState.lastUpdate = Date.now();
        this.broadcastGameState(lobbyId);
    }

    /**
     * Handle task completion
     * @param {Socket} socket - The client socket
     * @param {object} data - Task completion data
     */
    async handleCompleteTask(socket, data) {
        const clientId = socket.id;
        const client = this.clients.get(clientId);
        const lobbyId = data.lobbyId;
        const taskId = data.taskId;

        if (!client || !lobbyId || !taskId) {
            socket.emit('error', { message: 'Invalid request' });
            return;
        }

        const gameState = this.gameStates.get(lobbyId);
        if (!gameState) {
            socket.emit('error', { message: 'Game not found' });
            return;
        }

        // Find and complete task
        const taskIndex = gameState.tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) {
            socket.emit('error', { message: 'Task not found' });
            return;
        }

        const task = gameState.tasks[taskIndex];
        task.completed = true;
        task.completedAt = Date.now();
        task.actualDuration = data.actualDuration;

        // Update scores
        this.updateScores(gameState, client.playerId, task);

        gameState.lastUpdate = Date.now();
        this.broadcastGameState(lobbyId);
    }

    /**
     * Handle socket error
     * @param {Socket} socket - The client socket
     * @param {Error} error - The error object
     */
    handleSocketError(socket, error) {
        this.logger.error(`Socket error for ${socket.id}:`, error);
        this.disconnectClient(socket);
    }

    /**
     * Handle client disconnection
     * @param {Socket} socket - The client socket
     */
    handleDisconnect(socket) {
        this.disconnectClient(socket);
    }

    /**
     * Disconnect client and clean up
     * @param {Socket} socket - The client socket
     */
    disconnectClient(socket) {
        const clientId = socket.id;
        const client = this.clients.get(clientId);

        if (client) {
            // Remove from clients
            this.clients.delete(clientId);

            // Remove from lobby
            for (const [lobbyId, lobby] of this.lobbies) {
                if (lobby.players.has(client.playerId)) {
                    lobby.players.delete(client.playerId);
                    lobby.lastActivity = Date.now();

                    // If lobby is empty, clean it up
                    if (lobby.players.size === 0) {
                        this.lobbies.delete(lobbyId);
                        this.gameStates.delete(lobbyId);
                    } else {
                        // Broadcast updated lobby state
                        this.broadcastLobbyState(lobbyId);
                    }

                    break;
                }
            }

            this.logger.info(`Client disconnected: ${clientId}`);
        }
    }

    /**
     * Generate unique lobby ID
     * @returns {string} - Unique lobby ID
     */
    generateLobbyId() {
        return `lobby-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Validate task data
     * @param {object} taskData - Task data to validate
     * @returns {object|null} - Validated task or null if invalid
     */
    validateTask(taskData) {
        const requiredFields = ['description', 'category', 'estimatedDuration'];
        for (const field of requiredFields) {
            if (!taskData[field]) {
                return null;
            }
        }

        return {
            id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            ...taskData,
            createdAt: Date.now(),
            progress: 0,
            completed: false
        };
    }

    /**
     * Update scores based on task completion
     * @param {object} gameState - Current game state
     * @param {string} playerId - Player who completed the task
     * @param {object} task - Completed task
     */
    updateScores(gameState, playerId, task) {
        const scoringManager = new window.ScoringManager();
        const score = scoringManager.calculateFinalScore(task, playerId);

        // Update player's score
        const currentScore = gameState.scores.get(playerId) || 0;
        gameState.scores.set(playerId, currentScore + score.finalScore);

        // Broadcast score update
        this.broadcastScoreUpdate(gameState, playerId, score);
    }

    /**
     * Broadcast lobby state to all players
     * @param {string} lobbyId - Lobby ID to broadcast
     */
    broadcastLobbyState(lobbyId) {
        const lobby = this.lobbies.get(lobbyId);
        if (!lobby) return;

        const players = Array.from(lobby.players);
        this.io.to(lobbyId).emit('lobbyState', { 
            lobbyId,
            players,
            playerCount: players.length
        });
    }

    /**
     * Broadcast game state to all players
     * @param {string} lobbyId - Lobby ID to broadcast
     */
    broadcastGameState(lobbyId) {
        const gameState = this.gameStates.get(lobbyId);
        if (!gameState) return;

        this.io.to(lobbyId).emit('gameState', {
            lobbyId,
            round: gameState.round,
            phase: gameState.phase,
            tasks: gameState.tasks,
            scores: Array.from(gameState.scores.entries())
        });
    }

    /**
     * Broadcast score update to all players
     * @param {object} gameState - Current game state
     * @param {string} playerId - Player who received the score
     * @param {object} score - Score details
     */
    broadcastScoreUpdate(gameState, playerId, score) {
        const lobbyId = gameState.lobbyId;
        this.io.to(lobbyId).emit('scoreUpdate', {
            playerId,
            score,
            totalScore: gameState.scores.get(playerId)
        });
    }

    /**
     * Stop the MCP server
     */
    async stop() {
        try {
            if (this.server) {
                await new Promise((resolve, reject) => {
                    this.server.close((error) => {
                        if (error) reject(error);
                        else resolve();
                    });
                });
            }

            // Clean up clients and lobbies
            this.clients.clear();
            this.lobbies.clear();
            this.gameStates.clear();

            this.logger.info('MCP Server stopped');
            return true;
        } catch (error) {
            this.logger.error('Failed to stop MCP server:', error);
            throw error;
        }
    }
}

// Export the MCPManager and configuration
window.MCPManager = MCPManager;
window.MCPConfig = MCPConfig;
