/**
 * monitoring.js
 * Handles monitoring and alerting for game state and system health
 */

import { gameCore } from './game-core.js';
import { gameSheets } from './game-sheets.js';
import { dataSync } from './data-sync.js';
import { backupSystem } from './backup-system.js';
import { realTime } from './real-time.js';

export class Monitoring {
    constructor() {
        this.metrics = {
            performance: {
                syncLatency: [],
                errorRate: 0,
                memoryUsage: 0,
                cpuUsage: 0
            },
            errors: {
                total: 0,
                byType: {},
                byTime: []
            },
            sync: {
                success: 0,
                failures: 0,
                retries: 0,
                lastSync: null
            },
            players: {
                active: 0,
                max: 0,
                byPhase: {
                    work: 0,
                    action: 0,
                    break: 0
                }
            },
            tasks: {
                total: 0,
                completed: 0,
                byCategory: {
                    personal: 0,
                    chores: 0,
                    work: 0
                }
            },
            system: {
                uptime: 0,
                lastRestart: null,
                resourceWarnings: 0
            }
        };

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Performance monitoring
        setInterval(() => {
            this.updatePerformanceMetrics();
        }, 1000);

        // Error monitoring
        window.addEventListener('error', (event) => {
            this.handleError(event);
        });

        // Sync monitoring
        setInterval(() => {
            this.checkSyncStatus();
        }, 5000);
    }

    updatePerformanceMetrics() {
        // Memory usage
        this.metrics.performance.memoryUsage = performance.memory?.usedJSHeapSize || 0;

        // CPU usage (approximation)
        this.metrics.performance.cpuUsage = performance.now() - (this.lastCpuCheck || 0);
        this.lastCpuCheck = performance.now();

        // Sync latency
        if (this.metrics.sync.lastSync) {
            const latency = performance.now() - this.metrics.sync.lastSync;
            this.metrics.performance.syncLatency.push(latency);
            if (this.metrics.performance.syncLatency.length > 100) {
                this.metrics.performance.syncLatency.shift();
            }
        }
    }

    handleError(error) {
        this.metrics.errors.total++;

        // Track error by type
        if (error.type) {
            this.metrics.errors.byType[error.type] = 
                (this.metrics.errors.byType[error.type] || 0) + 1;
        }

        // Track error by time
        this.metrics.errors.byTime.push({
            timestamp: new Date().toISOString(),
            type: error.type,
            message: error.message
        });

        // If error rate exceeds threshold, trigger alert
        const errorRate = this.calculateErrorRate();
        if (errorRate > 0.1) { // 10% error rate threshold
            this.triggerAlert('High error rate detected');
        }
    }

    calculateErrorRate() {
        const windowSize = 60; // 1 minute window
        const recentErrors = this.metrics.errors.byTime.filter(
            error => new Date(error.timestamp) > new Date() - windowSize * 1000
        );
        return recentErrors.length / windowSize;
    }

    checkSyncStatus() {
        if (!this.metrics.sync.lastSync) {
            this.metrics.sync.failures++;
            return;
        }

        const now = new Date();
        const lastSync = new Date(this.metrics.sync.lastSync);
        const diff = now - lastSync;

        if (diff > 10000) { // 10 seconds threshold
            this.metrics.sync.failures++;
            this.triggerAlert('Sync delay detected');
        }
    }

    triggerAlert(message) {
        console.warn('MONITORING ALERT:', {
            timestamp: new Date().toISOString(),
            message,
            metrics: this.metrics
        });

        // Send alert to monitoring service
        if (window.monitoringService) {
            monitoringService.sendAlert({
                type: 'system',
                severity: 'warning',
                message,
                metrics: this.metrics
            });
        }
    }

    recordSyncSuccess() {
        this.metrics.sync.success++;
        this.metrics.sync.lastSync = performance.now();
    }

    recordSyncFailure() {
        this.metrics.sync.failures++;
        this.metrics.sync.retries++;
    }

    recordPlayerActivity(playerCount, phase) {
        this.metrics.players.active = playerCount;
        this.metrics.players.byPhase[phase] = playerCount;
        if (playerCount > this.metrics.players.max) {
            this.metrics.players.max = playerCount;
        }
    }

    recordTaskCompletion(task) {
        this.metrics.tasks.total++;
        this.metrics.tasks.completed++;
        this.metrics.tasks.byCategory[task.category]++;
    }

    getMetrics() {
        return {
            ...this.metrics,
            performance: {
                ...this.metrics.performance,
                avgSyncLatency: this.calculateAvgSyncLatency(),
                memoryUsageMB: (this.metrics.performance.memoryUsage / 1024 / 1024).toFixed(2)
            },
            system: {
                ...this.metrics.system,
                uptimeHours: (this.metrics.system.uptime / 3600).toFixed(2)
            }
        };
    }

    calculateAvgSyncLatency() {
        if (this.metrics.performance.syncLatency.length === 0) return 0;
        return this.metrics.performance.syncLatency.reduce((a, b) => a + b) / 
            this.metrics.performance.syncLatency.length;
    }
}

// Export singleton instance
export const monitoring = new Monitoring();
