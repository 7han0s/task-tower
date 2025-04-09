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
    MAX_TASKS_PER_PLAYER: 50,
    MAX_SUBTASKS_PER_PLAYER: 200,

    // State update frequency
    STATE_UPDATE_INTERVAL: 1000, // 1 second
    MIN_UPDATE_INTERVAL: 100, // 100ms
    MAX_UPDATE_INTERVAL: 5000, // 5 seconds

    // Network latency thresholds (in ms)
    NETWORK_LATENCY_WARNING: 100,
    NETWORK_LATENCY_CRITICAL: 300,
    MAX_LATENCY: 500,

    // Optimization thresholds
    MEMORY_CLEANUP_THRESHOLD: 150,
    TASK_CLEANUP_THRESHOLD: 100,
    HISTORY_CLEANUP_THRESHOLD: 1000,

    // Caching
    MAX_CACHE_SIZE: 1000,
    CACHE_TTL: 300000, // 5 minutes

    // Batch processing
    BATCH_SIZE: 50,
    MAX_BATCHES: 5,

    // Rate limiting
    MAX_REQUESTS_PER_SECOND: 10,
    REQUEST_WINDOW: 1000 // 1 second
};

// Performance metrics
const PerformanceMetrics = {
    memory: {
        current: 0,
        history: [],
        warnings: 0,
        critical: 0
    },
    fps: {
        current: 0,
        history: [],
        drops: 0
    },
    latency: {
        current: 0,
        history: [],
        warnings: 0,
        critical: 0
    },
    tasks: {
        current: 0,
        history: [],
        warnings: 0
    },
    stateUpdates: {
        count: 0,
        interval: PerformanceConstants.STATE_UPDATE_INTERVAL,
        history: []
    },
    cache: {
        size: 0,
        hits: 0,
        misses: 0,
        evictions: 0
    },
    requests: {
        count: 0,
        rate: 0,
        warnings: 0
    }
};

// Cache implementation
const cache = {
    data: new Map(),
    hits: 0,
    misses: 0,
    evictions: 0,

    get(key) {
        const entry = this.data.get(key);
        if (entry && entry.timestamp > Date.now() - PerformanceConstants.CACHE_TTL) {
            this.hits++;
            return entry.value;
        }
        this.misses++;
        return null;
    },

    set(key, value) {
        if (this.data.size >= PerformanceConstants.MAX_CACHE_SIZE) {
            this.evict();
        }
        this.data.set(key, {
            value,
            timestamp: Date.now()
        });
    },

    evict() {
        const oldest = Array.from(this.data.entries())
            .sort((a, b) => a[1].timestamp - b[1].timestamp)
            .shift();
        if (oldest) {
            this.data.delete(oldest[0]);
            this.evictions++;
        }
    }
};

// Performance Monitor class
export class PerformanceMonitor {
    constructor() {
        this.memoryUsageHistory = [];
        this.fpsHistory = [];
        this.latencyHistory = [];
        this.taskCountHistory = [];
        this.stateUpdateHistory = [];
        this.requestHistory = [];
        this.updateInterval = null;
        this.lastStateUpdate = 0;
        this.isMonitoring = false;
        this.optimizationQueue = [];
        this.optimizationInterval = null;
        this.batchProcessor = null;
    }

    async initialize() {
        try {
            // Initialize monitoring
            await this.startMonitoring();
            
            // Initialize optimization
            this.startOptimization();
            
            // Initialize batch processing
            this.startBatchProcessing();
            
            // Initialize rate limiting
            this.startRateLimiting();
            
            console.log('Performance monitor initialized');
        } catch (error) {
            console.error('Error initializing performance monitor:', error);
            throw error;
        }
    }

    startMonitoring() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        this.updateInterval = setInterval(() => this.updateMetrics(), PerformanceConstants.STATE_UPDATE_INTERVAL);
        
        // Add event listeners for FPS tracking
        this.setupFPSTracking();
        
        // Add memory usage tracking
        this.setupMemoryTracking();
        
        // Add network latency tracking
        this.setupNetworkTracking();
    }

    stopMonitoring() {
        if (!this.isMonitoring) return;
        
        this.isMonitoring = false;
        clearInterval(this.updateInterval);
        
        // Remove event listeners
        this.cleanupFPSTracking();
        this.cleanupMemoryTracking();
        this.cleanupNetworkTracking();
    }

    async updateMetrics() {
        try {
            // Track memory usage
            const memoryUsage = this.getMemoryUsage();
            PerformanceMetrics.memory.current = memoryUsage;
            this.memoryUsageHistory.push(memoryUsage);
            
            // Track FPS
            const currentFPS = this.getCurrentFPS();
            PerformanceMetrics.fps.current = currentFPS;
            this.fpsHistory.push(currentFPS);
            
            // Track network latency
            const latency = await this.getNetworkLatency();
            PerformanceMetrics.latency.current = latency;
            this.latencyHistory.push(latency);
            
            // Track task count
            const totalTasks = this.getTotalTasks();
            PerformanceMetrics.tasks.current = totalTasks;
            this.taskCountHistory.push(totalTasks);
            
            // Track state updates
            const stateUpdateInterval = this.getStateUpdateInterval();
            PerformanceMetrics.stateUpdates.interval = stateUpdateInterval;
            this.stateUpdateHistory.push(stateUpdateInterval);
            
            // Check for performance warnings
            this.checkPerformanceWarnings();
            
            // Update optimization queue
            this.updateOptimizationQueue();
        } catch (error) {
            console.error('Error updating metrics:', error);
            throw error;
        }
    }

    getMemoryUsage() {
        try {
            // Using performance.memory if available
            if (performance && performance.memory) {
                return performance.memory.usedJSHeapSize / (1024 * 1024);
            }
            return 0;
        } catch (error) {
            console.error('Error getting memory usage:', error);
            return 0;
        }
    }

    getCurrentFPS() {
        try {
            if (!this.fpsHistory.length) return 0;
            
            // Calculate average FPS over last 10 frames
            const last10 = this.fpsHistory.slice(-10);
            return last10.reduce((sum, fps) => sum + fps, 0) / last10.length;
        } catch (error) {
            console.error('Error calculating FPS:', error);
            return 0;
        }
    }

    async getNetworkLatency() {
        try {
            if (typeof window.SyncManager === 'undefined') return 0;
            
            const startTime = Date.now();
            await window.SyncManager.ping();
            const latency = Date.now() - startTime;
            
            return latency;
        } catch (error) {
            console.error('Error measuring network latency:', error);
            return 0;
        }
    }

    getTotalTasks() {
        try {
            let total = 0;
            for (const player of gameCore.players) {
                total += player.tasks.length;
            }
            return total;
        } catch (error) {
            console.error('Error getting total tasks:', error);
            return 0;
        }
    }

    getStateUpdateInterval() {
        try {
            const now = Date.now();
            const interval = now - this.lastStateUpdate;
            this.lastStateUpdate = now;
            return interval;
        } catch (error) {
            console.error('Error getting state update interval:', error);
            return PerformanceConstants.STATE_UPDATE_INTERVAL;
        }
    }

    checkPerformanceWarnings() {
        try {
            const memoryUsage = PerformanceMetrics.memory.current;
            const currentFPS = PerformanceMetrics.fps.current;
            const latency = PerformanceMetrics.latency.current;
            const totalTasks = PerformanceMetrics.tasks.current;

            // Memory warnings
            if (memoryUsage > PerformanceConstants.MEMORY_WARNING_THRESHOLD) {
                PerformanceMetrics.memory.warnings++;
                console.warn(`Memory usage high: ${memoryUsage.toFixed(2)} MB`);
            }

            if (memoryUsage > PerformanceConstants.MEMORY_CRITICAL_THRESHOLD) {
                PerformanceMetrics.memory.critical++;
                console.error(`Memory usage critical: ${memoryUsage.toFixed(2)} MB`);
            }

            // FPS warnings
            if (currentFPS < PerformanceConstants.MIN_ACCEPTABLE_FPS) {
                PerformanceMetrics.fps.drops++;
                console.warn(`FPS drop: ${currentFPS.toFixed(1)} FPS`);
            }

            // Latency warnings
            if (latency > PerformanceConstants.NETWORK_LATENCY_WARNING) {
                PerformanceMetrics.latency.warnings++;
                console.warn(`Network latency high: ${latency}ms`);
            }

            if (latency > PerformanceConstants.NETWORK_LATENCY_CRITICAL) {
                PerformanceMetrics.latency.critical++;
                console.error(`Network latency critical: ${latency}ms`);
            }

            // Task warnings
            if (totalTasks > PerformanceConstants.TASK_CLEANUP_THRESHOLD) {
                PerformanceMetrics.tasks.warnings++;
                console.warn(`High task count: ${totalTasks} tasks`);
            }
        } catch (error) {
            console.error('Error checking performance warnings:', error);
            throw error;
        }
    }

    startOptimization() {
        this.optimizationInterval = setInterval(() => {
            try {
                this.optimize();
            } catch (error) {
                console.error('Error in optimization:', error);
            }
        }, PerformanceConstants.STATE_UPDATE_INTERVAL);
    }

    async optimize() {
        try {
            // Memory optimization
            if (PerformanceMetrics.memory.current > PerformanceConstants.MEMORY_CLEANUP_THRESHOLD) {
                await this.optimizeMemoryUsage();
            }

            // Task optimization
            if (PerformanceMetrics.tasks.current > PerformanceConstants.TASK_CLEANUP_THRESHOLD) {
                this.optimizeTaskProcessing();
            }

            // State optimization
            if (PerformanceMetrics.stateUpdates.interval < PerformanceConstants.MIN_UPDATE_INTERVAL) {
                this.optimizeStateUpdates();
            }

            // Cache optimization
            if (cache.data.size > PerformanceConstants.MAX_CACHE_SIZE) {
                this.optimizeCache();
            }

            // Request rate optimization
            if (PerformanceMetrics.requests.rate > PerformanceConstants.MAX_REQUESTS_PER_SECOND) {
                this.optimizeRequestRate();
            }
        } catch (error) {
            console.error('Error in optimization:', error);
            throw error;
        }
    }

    async optimizeMemoryUsage() {
        try {
            // Force garbage collection
            if (typeof window !== 'undefined') {
                window.gc(); // Only works in some environments
            }

            // Clean up game state
            await this.cleanupGameState();
            
            // Clean up cache
            cache.evict();
        } catch (error) {
            console.error('Error optimizing memory usage:', error);
            throw error;
        }
    }

    optimizeTaskProcessing() {
        try {
            // Limit tasks per player
            gameCore.players.forEach(player => {
                if (player.tasks.length > PerformanceConstants.MAX_TASKS_PER_PLAYER) {
                    player.tasks = player.tasks.slice(0, PerformanceConstants.MAX_TASKS_PER_PLAYER);
                }
            });

            // Limit subtasks per task
            gameCore.players.forEach(player => {
                player.tasks.forEach(task => {
                    if (task.subtasks && task.subtasks.length > PerformanceConstants.MAX_SUBTASKS_PER_TASK) {
                        task.subtasks = task.subtasks.slice(0, PerformanceConstants.MAX_SUBTASKS_PER_TASK);
                    }
                });
            });
        } catch (error) {
            console.error('Error optimizing task processing:', error);
            throw error;
        }
    }

    optimizeStateUpdates() {
        try {
            // Adjust update interval based on performance
            const currentInterval = PerformanceMetrics.stateUpdates.interval;
            if (currentInterval < PerformanceConstants.MIN_UPDATE_INTERVAL) {
                PerformanceMetrics.stateUpdates.interval = Math.min(
                    currentInterval * 1.5,
                    PerformanceConstants.MAX_UPDATE_INTERVAL
                );
            } else if (currentInterval > PerformanceConstants.MAX_UPDATE_INTERVAL) {
                PerformanceMetrics.stateUpdates.interval = Math.max(
                    currentInterval * 0.5,
                    PerformanceConstants.MIN_UPDATE_INTERVAL
                );
            }
        } catch (error) {
            console.error('Error optimizing state updates:', error);
            throw error;
        }
    }

    optimizeCache() {
        try {
            // Clean up expired cache entries
            cache.evict();
            
            // Log cache statistics
            PerformanceMetrics.cache.size = cache.data.size;
            PerformanceMetrics.cache.hits = cache.hits;
            PerformanceMetrics.cache.misses = cache.misses;
            PerformanceMetrics.cache.evictions = cache.evictions;
        } catch (error) {
            console.error('Error optimizing cache:', error);
            throw error;
        }
    }

    optimizeRequestRate() {
        try {
            // Implement rate limiting
            const currentRate = PerformanceMetrics.requests.rate;
            if (currentRate > PerformanceConstants.MAX_REQUESTS_PER_SECOND) {
                // Add delay between requests
                const delay = (currentRate - PerformanceConstants.MAX_REQUESTS_PER_SECOND) * 100;
                setTimeout(() => {
                    PerformanceMetrics.requests.rate = Math.max(
                        currentRate * 0.9,
                        PerformanceConstants.MAX_REQUESTS_PER_SECOND
                    );
                }, delay);
            }
        } catch (error) {
            console.error('Error optimizing request rate:', error);
            throw error;
        }
    }

    async cleanupGameState() {
        try {
            // Cleanup completed tasks
            gameCore.players.forEach(player => {
                player.tasks = player.tasks.filter(task => !task.completed);
            });

            // Cleanup old history
            gameCore.players.forEach(player => {
                if (player.history && player.history.length > PerformanceConstants.HISTORY_CLEANUP_THRESHOLD) {
                    player.history = player.history.slice(-PerformanceConstants.HISTORY_CLEANUP_THRESHOLD);
                }
            });
        } catch (error) {
            console.error('Error cleaning up game state:', error);
            throw error;
        }
    }

    startBatchProcessing() {
        this.batchProcessor = setInterval(() => {
            try {
                this.processBatches();
            } catch (error) {
                console.error('Error in batch processing:', error);
            }
        }, PerformanceConstants.STATE_UPDATE_INTERVAL);
    }

    async processBatches() {
        try {
            // Process tasks in batches
            const batchSize = PerformanceConstants.BATCH_SIZE;
            const maxBatches = PerformanceConstants.MAX_BATCHES;

            for (let i = 0; i < maxBatches; i++) {
                const batch = await this.getBatch(i * batchSize, batchSize);
                if (!batch.length) break;

                // Process batch
                await this.processBatch(batch);
            }
        } catch (error) {
            console.error('Error processing batches:', error);
            throw error;
        }
    }

    async getBatch(startIndex, batchSize) {
        try {
            const allTasks = gameCore.players.reduce((acc, player) => 
                [...acc, ...player.tasks], []
            );

            return allTasks.slice(startIndex, startIndex + batchSize);
        } catch (error) {
            console.error('Error getting batch:', error);
            return [];
        }
    }

    async processBatch(batch) {
        try {
            // Process each task in batch
            for (const task of batch) {
                await this.processTask(task);
            }
        } catch (error) {
            console.error('Error processing batch:', error);
            throw error;
        }
    }

    async processTask(task) {
        try {
            // Check cache first
            const cachedResult = cache.get(task.id);
            if (cachedResult) {
                return cachedResult;
            }

            // Process task
            const result = await this.updateTask(task);

            // Cache result
            cache.set(task.id, result);

            return result;
        } catch (error) {
            console.error('Error processing task:', error);
            throw error;
        }
    }

    async updateTask(task) {
        try {
            // Update task state
            task.progress = this.calculateProgress(task);
            task.score = this.calculateScore(task);

            // Update subtasks
            if (task.subtasks) {
                for (const subtask of task.subtasks) {
                    subtask.progress = this.calculateSubtaskProgress(subtask);
                }
            }

            return task;
        } catch (error) {
            console.error('Error updating task:', error);
            throw error;
        }
    }

    calculateProgress(task) {
        try {
            const now = Date.now();
            const elapsedTime = now - task.startTime;
            const progress = Math.min(
                elapsedTime / task.duration,
                1
            );
            return progress;
        } catch (error) {
            console.error('Error calculating progress:', error);
            return 0;
        }
    }

    calculateScore(task) {
        try {
            let score = 0;

            // Base score
            score += PerformanceConstants.TASK_BASE_SCORE;

            // Complexity multiplier
            score *= task.complexity || 1;

            // Category multiplier
            score *= PerformanceConstants.CATEGORY_MULTIPLIERS[task.category] || 1;

            // Time bonus
            if (task.completed) {
                const completionTime = Date.now() - task.startTime;
                const timeBonus = Math.max(
                    1 - (completionTime / task.duration),
                    0
                );
                score *= (1 + timeBonus);
            }

            return Math.round(score);
        } catch (error) {
            console.error('Error calculating score:', error);
            return 0;
        }
    }

    calculateSubtaskProgress(subtask) {
        try {
            const now = Date.now();
            const elapsedTime = now - subtask.startTime;
            const progress = Math.min(
                elapsedTime / subtask.duration,
                1
            );
            return progress;
        } catch (error) {
            console.error('Error calculating subtask progress:', error);
            return 0;
        }
    }

    startRateLimiting() {
        this.requestHistory = [];
        this.requestInterval = setInterval(() => {
            try {
                this.updateRequestRate();
            } catch (error) {
                console.error('Error in rate limiting:', error);
            }
        }, PerformanceConstants.REQUEST_WINDOW);
    }

    async updateRequestRate() {
        try {
            // Calculate request rate
            const now = Date.now();
            const windowStart = now - PerformanceConstants.REQUEST_WINDOW;
            
            // Filter requests within window
            const recentRequests = this.requestHistory.filter(
                request => request.timestamp >= windowStart
            );
            
            // Calculate rate
            const rate = recentRequests.length / (PerformanceConstants.REQUEST_WINDOW / 1000);
            PerformanceMetrics.requests.rate = rate;
            
            // Check for rate limit violations
            if (rate > PerformanceConstants.MAX_REQUESTS_PER_SECOND) {
                PerformanceMetrics.requests.warnings++;
                console.warn(`Request rate exceeded: ${rate} requests/second`);
            }
        } catch (error) {
            console.error('Error updating request rate:', error);
            throw error;
        }
    }

    async recordRequest() {
        try {
            const request = {
                timestamp: Date.now(),
                type: 'game-state'
            };
            
            this.requestHistory.push(request);
            
            // Clean up old requests
            const now = Date.now();
            const windowStart = now - PerformanceConstants.REQUEST_WINDOW;
            this.requestHistory = this.requestHistory.filter(
                req => req.timestamp >= windowStart
            );
        } catch (error) {
            console.error('Error recording request:', error);
            throw error;
        }
    }

    getStatistics() {
        return {
            memory: PerformanceMetrics.memory,
            fps: PerformanceMetrics.fps,
            latency: PerformanceMetrics.latency,
            tasks: PerformanceMetrics.tasks,
            stateUpdates: PerformanceMetrics.stateUpdates,
            cache: PerformanceMetrics.cache,
            requests: PerformanceMetrics.requests
        };
    }

    updateOptimizationQueue() {
        try {
            // Add optimization tasks based on metrics
            if (PerformanceMetrics.memory.current > PerformanceConstants.MEMORY_CLEANUP_THRESHOLD) {
                this.optimizationQueue.push('memory');
            }

            if (PerformanceMetrics.tasks.current > PerformanceConstants.TASK_CLEANUP_THRESHOLD) {
                this.optimizationQueue.push('tasks');
            }

            if (PerformanceMetrics.stateUpdates.interval < PerformanceConstants.MIN_UPDATE_INTERVAL) {
                this.optimizationQueue.push('state');
            }

            if (cache.data.size > PerformanceConstants.MAX_CACHE_SIZE) {
                this.optimizationQueue.push('cache');
            }

            if (PerformanceMetrics.requests.rate > PerformanceConstants.MAX_REQUESTS_PER_SECOND) {
                this.optimizationQueue.push('requests');
            }
        } catch (error) {
            console.error('Error updating optimization queue:', error);
            throw error;
        }
    }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();
