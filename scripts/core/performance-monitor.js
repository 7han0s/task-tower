/**
 * performance-monitor.js
 * Handles performance monitoring and optimization
 */

// Performance constants
const PerformanceConstants = {
    // Memory usage thresholds (in MB)
    MEMORY_WARNING_THRESHOLD: 100,
    MEMORY_CRITICAL_THRESHOLD: 200,

    // Frame rate targets
    TARGET_FPS: 60,
    MIN_ACCEPTABLE_FPS: 30,

    // Task processing limits
    MAX_TASKS_PER_UPDATE: 100,
    MAX_SUBTASKS_PER_TASK: 100,

    // State update frequency
    STATE_UPDATE_INTERVAL: 1000, // 1 second

    // Network latency thresholds (in ms)
    NETWORK_LATENCY_WARNING: 100,
    NETWORK_LATENCY_CRITICAL: 300
};

// Performance Monitor class
class PerformanceMonitor {
    constructor() {
        this.memoryUsageHistory = [];
        this.fpsHistory = [];
        this.latencyHistory = [];
        this.taskCountHistory = [];
        this.updateInterval = null;
        this.lastStateUpdate = 0;
        this.isMonitoring = false;
    }

    /**
     * Start performance monitoring
     */
    startMonitoring() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        this.updateInterval = setInterval(() => this.updateMetrics(), PerformanceConstants.STATE_UPDATE_INTERVAL);
        
        // Add event listeners for FPS tracking
        this.setupFPSTracking();
        
        // Add memory usage tracking
        this.setupMemoryTracking();
    }

    /**
     * Stop performance monitoring
     */
    stopMonitoring() {
        if (!this.isMonitoring) return;
        
        this.isMonitoring = false;
        clearInterval(this.updateInterval);
        
        // Remove event listeners
        this.cleanupFPSTracking();
        this.cleanupMemoryTracking();
    }

    /**
     * Update performance metrics
     */
    updateMetrics() {
        // Track memory usage
        const memoryUsage = this.getMemoryUsage();
        this.memoryUsageHistory.push(memoryUsage);
        
        // Track FPS
        const currentFPS = this.getCurrentFPS();
        this.fpsHistory.push(currentFPS);
        
        // Track network latency (if multiplayer)
        if (typeof window.SyncManager !== 'undefined') {
            const latency = window.SyncManager.getLatency();
            this.latencyHistory.push(latency);
        }
        
        // Track task count
        const totalTasks = this.getTotalTasks();
        this.taskCountHistory.push(totalTasks);
        
        // Check for performance warnings
        this.checkPerformanceWarnings();
    }

    /**
     * Get current memory usage
     * @returns {number} - Memory usage in MB
     */
    getMemoryUsage() {
        // Using performance.memory if available
        if (performance && performance.memory) {
            return performance.memory.usedJSHeapSize / (1024 * 1024);
        }
        return 0;
    }

    /**
     * Get current FPS
     * @returns {number} - Current frames per second
     */
    getCurrentFPS() {
        if (!this.fpsHistory.length) return 0;
        
        // Calculate average FPS over last 10 frames
        const last10 = this.fpsHistory.slice(-10);
        return last10.reduce((sum, fps) => sum + fps, 0) / last10.length;
    }

    /**
     * Get total number of tasks
     * @returns {number} - Total tasks across all players
     */
    getTotalTasks() {
        let total = 0;
        for (const player of GameCore.players) {
            total += player.pendingTasks.length;
        }
        return total;
    }

    /**
     * Check for performance warnings
     */
    checkPerformanceWarnings() {
        const memoryUsage = this.getMemoryUsage();
        const currentFPS = this.getCurrentFPS();
        const latency = this.latencyHistory.length ? this.latencyHistory[this.latencyHistory.length - 1] : 0;

        // Memory warnings
        if (memoryUsage > PerformanceConstants.MEMORY_WARNING_THRESHOLD) {
            console.warn(`Memory usage high: ${memoryUsage.toFixed(2)} MB`);
        }

        if (memoryUsage > PerformanceConstants.MEMORY_CRITICAL_THRESHOLD) {
            console.error(`Memory usage critical: ${memoryUsage.toFixed(2)} MB`);
            // Consider implementing memory cleanup
        }

        // FPS warnings
        if (currentFPS < PerformanceConstants.MIN_ACCEPTABLE_FPS) {
            console.warn(`Low FPS: ${currentFPS.toFixed(1)} FPS`);
        }

        // Network latency warnings
        if (latency > PerformanceConstants.NETWORK_LATENCY_WARNING) {
            console.warn(`High network latency: ${latency}ms`);
        }

        if (latency > PerformanceConstants.NETWORK_LATENCY_CRITICAL) {
            console.error(`Critical network latency: ${latency}ms`);
        }
    }

    /**
     * Setup FPS tracking
     */
    setupFPSTracking() {
        let frameCount = 0;
        let lastTime = performance.now();

        function updateFPS() {
            const now = performance.now();
            const delta = now - lastTime;
            
            if (delta >= 1000) { // 1 second
                const fps = frameCount / (delta / 1000);
                frameCount = 0;
                lastTime = now;
                this.fpsHistory.push(fps);
            }
            
            frameCount++;
            requestAnimationFrame(updateFPS);
        }

        updateFPS.call(this);
    }

    /**
     * Setup memory tracking
     */
    setupMemoryTracking() {
        // Memory tracking is handled by getMemoryUsage()
        // No additional setup needed
    }

    /**
     * Cleanup FPS tracking
     */
    cleanupFPSTracking() {
        // FPS tracking is handled by requestAnimationFrame
        // No cleanup needed
    }

    /**
     * Cleanup memory tracking
     */
    cleanupMemoryTracking() {
        // Memory tracking is handled by getMemoryUsage()
        // No cleanup needed
    }

    /**
     * Get performance statistics
     * @returns {object} - Performance statistics
     */
    getStatistics() {
        return {
            memory: {
                current: this.getMemoryUsage(),
                history: this.memoryUsageHistory
            },
            fps: {
                current: this.getCurrentFPS(),
                history: this.fpsHistory
            },
            latency: {
                current: this.latencyHistory[this.latencyHistory.length - 1] || 0,
                history: this.latencyHistory
            },
            tasks: {
                current: this.getTotalTasks(),
                history: this.taskCountHistory
            }
        };
    }

    /**
     * Optimize performance
     */
    optimize() {
        // Implement performance optimization strategies
        this.optimizeMemoryUsage();
        this.optimizeTaskProcessing();
        this.optimizeStateUpdates();
    }

    /**
     * Optimize memory usage
     */
    optimizeMemoryUsage() {
        // Force garbage collection
        if (typeof window !== 'undefined') {
            window.gc(); // Only works in some environments
        }

        // Clean up unused game state
        this.cleanupGameState();
    }

    /**
     * Optimize task processing
     */
    optimizeTaskProcessing() {
        // Limit number of tasks processed per update
        const tasksPerUpdate = Math.min(
            GameCore.players.reduce((sum, player) => sum + player.pendingTasks.length, 0),
            PerformanceConstants.MAX_TASKS_PER_UPDATE
        );

        // Limit subtasks per task
        GameCore.players.forEach(player => {
            player.pendingTasks.forEach(task => {
                if (task.subtasks.length > PerformanceConstants.MAX_SUBTASKS_PER_TASK) {
                    task.subtasks = task.subtasks.slice(0, PerformanceConstants.MAX_SUBTASKS_PER_TASK);
                }
            });
        });
    }

    /**
     * Optimize state updates
     */
    optimizeStateUpdates() {
        // Batch state updates
        const now = performance.now();
        if (now - this.lastStateUpdate < PerformanceConstants.STATE_UPDATE_INTERVAL) {
            return;
        }

        this.lastStateUpdate = now;
        
        // Only update state when necessary
        if (this.hasStateChanges()) {
            this.updateGameState();
        }
    }

    /**
     * Cleanup game state
     */
    cleanupGameState() {
        // Cleanup completed tasks
        GameCore.players.forEach(player => {
            player.pendingTasks = player.pendingTasks.filter(task => !task.completed);
        });

        // Cleanup old history
        GameCore.players.forEach(player => {
            if (player.history && player.history.length > 100) {
                player.history = player.history.slice(-100);
            }
        });
    }

    /**
     * Check for state changes
     * @returns {boolean} - Whether there are state changes
     */
    hasStateChanges() {
        // Check for changes in game state
        return GameCore.currentPhase !== 'ended' &&
               GameCore.players.some(player => 
                   player.pendingTasks.some(task => !task.completed)
               );
    }

    /**
     * Update game state
     */
    updateGameState() {
        // Update game state with optimized data
        const gameState = {
            players: GameCore.players.map(player => ({
                id: player.id,
                score: player.score,
                pendingTasks: player.pendingTasks.map(task => ({
                    id: task.id,
                    description: task.description,
                    category: task.category,
                    completed: task.completed,
                    progress: task.progress
                }))
            })),
            currentPhase: GameCore.currentPhase,
            currentRound: GameCore.currentRound,
            phaseTimeRemaining: GameCore.phaseTimeRemaining
        };

        // Sync state if multiplayer
        if (typeof window.SyncManager !== 'undefined') {
            window.SyncManager.syncGameState(gameState);
        }
    }
}

// Export the PerformanceMonitor and constants
window.PerformanceMonitor = PerformanceMonitor;
window.PerformanceConstants = PerformanceConstants;
